#!/usr/bin/env python3
"""
Smash Ultimate Frame Data → JSON (per character)

Usage:
  python scrape_ufd.py --all
  python scrape_ufd.py --chars mario link pikachu
  python scrape_ufd.py --out ./out

Outputs:
  ./out/<character>.json  (array of move objects)
"""

import argparse
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup

BASE = "https://ultimateframedata.com"
ROSTER_URL = f"{BASE}/smash"  # roster with character links
# Many chars also resolve at /<slug>.php or /<slug>. Adjust below if needed.

HEADERS = {
    "User-Agent": "FrameDataScraper/1.0 (+for personal research; contact me if needed)"
}

# --- Utilities ----------------------------------------------------------------

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s

def clean_text(x: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (x or "").strip())

def parse_float_or_zero(x: str) -> float:
    x = x.strip()
    if not x:
        return 0.0
    # pick first number in string, allowing decimals
    m = re.search(r"[-+]?\d*\.?\d+", x.replace(",", "."))
    return float(m.group(0)) if m else 0.0

def parse_int_or_zero(x: str) -> int:
    x = x.strip()
    if not x:
        return 0
    m = re.search(r"[-+]?\d+", x)
    return int(m.group(0)) if m else 0

def normalize_frames(val: str) -> Tuple[Optional[int], Optional[str]]:
    """
    Try to derive startup as int and return active as a normalized string.
    We keep active windows as text (e.g., '5–7 (late: 10–12)' or '4/6/8').
    """
    t = clean_text(val)
    if not t:
        return None, None

    # Common patterns: "Startup 5", "5", "5-7", "5—7", "5 (chargeable)"
    # We'll take first integer as startup
    startup = None
    m = re.search(r"\d+", t)
    if m:
        startup = int(m.group(0))

    # Normalize ranges to ndash and preserve the full active frame string
    active = t
    # Convert em dashes and regular dashes to ndash for consistency
    active = active.replace("—", "–").replace("--", "–").replace("-", "–")
    # Clean up spacing around dashes
    active = re.sub(r"\s*–\s*", "–", active)
    return startup, active

def should_filter_move(move_name: str, section_label: str) -> bool:
    """
    Return True if this move should be filtered out (not a real attack move).
    """
    name = move_name.lower().strip()
    section = section_label.lower()
    
    # Filter out dodges and rolls
    if any(word in name for word in ["dodge", "roll", "spot dodge", "air dodge"]):
        return True
    
    # Filter out stats and misc info
    if name in ["stats", "ledge hang", "getup attacks"]:
        return True
    
    # Filter out sections that aren't actual attacks
    if any(word in section for word in ["dodges", "misc"]):
        return True
    
    return False

def rarity_rule(move_name: str, move_type: str) -> str:
    # All moves are now common rarity
    return "common"

def guess_move_type(section_label: str, move_name: str) -> str:
    """
    Return specific move type for each move based on the move name.
    Examples: "fair", "up tilt", "jab", "forward smash", etc.
    """
    name = move_name.lower().strip()
    
    # Aerials
    if "nair" in name or "neutral air" in name:
        return "nair"
    elif "fair" in name or "forward air" in name:
        return "fair"
    elif "bair" in name or "back air" in name:
        return "bair"
    elif "uair" in name or "up air" in name:
        return "uair"
    elif "dair" in name or "down air" in name:
        return "dair"
    
    # Specials
    elif "neutral b" in name or "neutral special" in name:
        return "neutral b"
    elif "side b" in name or "side special" in name:
        return "side b"
    elif "up b" in name or "up special" in name:
        return "up b"
    elif "down b" in name or "down special" in name:
        return "down b"
    elif "final smash" in name:
        return "final smash"
    
    # Grabs and throws - FIXED: Better throw detection
    elif "grab" in name and "throw" not in name:
        return "grab"
    elif "pummel" in name:
        return "pummel"
    elif "forward throw" in name or "fthrow" in name:
        return "forward throw"
    elif "backward throw" in name or "back throw" in name or "bthrow" in name:
        return "back throw"
    elif "up throw" in name or "uthrow" in name:
        return "up throw"
    elif "down throw" in name or "dthrow" in name:
        return "down throw"
    
    # Ground attacks
    elif "jab" in name:
        return "jab"
    elif "forward tilt" in name or "ftilt" in name:
        return "forward tilt"
    elif "up tilt" in name or "utilt" in name:
        return "up tilt"
    elif "down tilt" in name or "dtilt" in name:
        return "down tilt"
    elif "forward smash" in name or "fsmash" in name:
        return "forward smash"
    elif "up smash" in name or "usmash" in name:
        return "up smash"
    elif "down smash" in name or "dsmash" in name:
        return "down smash"
    elif "dash attack" in name:
        return "dash attack"
    
    # Default fallback - try to extract from section label or return generic type
    sec = section_label.lower()
    if any(k in sec for k in ("aerial", "air")):
        return "aerial"
    elif any(k in sec for k in ("special")):
        return "special"
    elif any(k in sec for k in ("grab", "throw")):
        return "grab"
    else:
        return "ground attack"

def parse_on_shield(val: str) -> int:
    """
    UFD usually lists 'On Shield' as advantage (e.g., -13). Keep int; missing → 0.
    """
    val = clean_text(val)
    if not val:
        return 0
    m = re.search(r"[-+]?\d+", val)
    return int(m.group(0)) if m else 0

def calculate_active_duration(active_frames: str) -> Optional[int]:
    """
    Calculate the duration of active frames from a range string.
    Examples: "5–7" -> 3, "9–12" -> 4, "5–6/14" -> 2 (first range only)
    """
    if not active_frames:
        return None
    
    # Handle multiple ranges (take first one)
    active_frames = active_frames.split('/')[0]
    
    # Look for range pattern (start–end)
    range_match = re.search(r"(\d+)–(\d+)", active_frames)
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2))
        return end - start + 1  # +1 because both start and end are inclusive
    
    # Look for single frame
    single_match = re.search(r"(\d+)", active_frames)
    if single_match:
        return 1
    
    return None

# --- Fetchers -----------------------------------------------------------------

def fetch(url: str) -> BeautifulSoup:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")

def get_roster_slugs() -> List[str]:
    """
    Discover character slugs from the roster page.
    UFD now uses /smash page with character links.
    """
    soup = fetch(ROSTER_URL)
    slugs = []
    
    # Look for character links in the roster
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        name = clean_text(a.get_text())
        
        # Check if this looks like a character link
        if (href.startswith("/") and 
            not href.startswith("/smash") and 
            not href.startswith("/stats") and
            not href.startswith("/search") and
            name and len(name) <= 30 and
            # Filter out obvious non-character links
            not any(x in href.lower() for x in ["/about", "/info", "/donate", "/stats", "/search"])):
            
            # Extract slug from href
            raw = href.lstrip("/")
            if raw and not raw.startswith("http"):
                slugs.append(raw.lower())
    
    # If no links found, try to extract character names from text content
    if not slugs:
        # Look for character names in the main content
        main_content = soup.find("main") or soup.find("body")
        if main_content:
            text_content = main_content.get_text()
            # Split by lines and look for character names
            lines = [line.strip() for line in text_content.split('\n')]
            for line in lines:
                if (line and len(line) <= 30 and 
                    not any(x in line.lower() for x in ["ultimate frame data", "search", "stats", "about", "info", "donate"]) and
                    # Skip lines that look like descriptions
                    not line.startswith("Created by") and
                    not line.startswith("Frame Data Notes") and
                    not line.startswith("Hitbox Image Notes")):
                    # Convert to slug format
                    slug = slugify(line)
                    if slug and len(slug) > 2:
                        slugs.append(slug)
    
    # Deduplicate while preserving order
    seen = set()
    out = []
    for s in slugs:
        if s not in seen and s:
            out.append(s)
            seen.add(s)
    
    return out

# --- Parsers per character page ----------------------------------------------

def candidate_character_urls(slug: str) -> List[str]:
    # Try a few common patterns; the first that 200s will be used
    return [
        f"{BASE}/{slug}.php",
        f"{BASE}/{slug}",
        f"{BASE}/character.php?name={slug}",
    ]

def find_character_url(slug: str) -> Optional[str]:
    for url in candidate_character_urls(slug):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code == 200 and len(r.text) > 1000:
                return url
        except Exception:
            pass
    return None

def extract_moves_from_page(soup: BeautifulSoup, char_slug: str, char_url: str) -> List[Dict]:
    """
    Parse moves from UFD's new div-based structure.

    EXPECTED MARKUP (current UFD):
      - Sections with h2.movecategory (e.g., 'Ground Attacks', 'Aerial Attacks', 'Special Attacks', 'Grabs / Throws')
      - div.moves containers with div.movecontainer for each move
      - div.movename for move names
      - Various divs with classes like startup, active, endlag, etc.
    """
    created_at = now_iso()
    all_moves = []

    # Find all move sections
    sections = []
    for header in soup.select("h2.movecategory"):
        label = clean_text(header.get_text())
        # Find the moves container after this header
        moves_container = header.find_next_sibling("div", class_="moves")
        if moves_container:
            sections.append((label, moves_container))

    # Parse each section
    for section_label, moves_container in sections:
        # Find all move containers within this section
        for move_container in moves_container.select("div.movecontainer"):
            # Extract move name
            name_elem = move_container.find("div", class_="movename")
            if not name_elem:
                continue
            
            name = clean_text(name_elem.get_text())
            if not name:
                continue
            
            # Filter out non-attack moves (dodges, rolls, stats, etc.)
            if should_filter_move(name, section_label):
                continue

            # Extract frame data from various div classes
            def extract_value(class_name: str) -> str:
                elem = move_container.find("div", class_=class_name)
                return clean_text(elem.get_text()) if elem else ""

            startup_raw = extract_value("startup")
            active_raw = extract_value("activeframes")  # Fixed: UFD uses 'activeframes' not 'active'
            endlag_raw = extract_value("endlag")
            onshield_raw = extract_value("advantage")  # Fixed: UFD uses 'advantage' not 'onshield'
            shieldlag_raw = extract_value("shieldlag")  # Added: UFD uses 'shieldlag'
            damage_raw = extract_value("basedamage")  # Fixed: UFD uses 'basedamage' not 'damage'
            shieldstun_raw = extract_value("shieldstun")
            notes_raw = extract_value("notes")
            
            # Extract additional fields
            total_frames_raw = extract_value("totalframes")
            landing_lag_raw = extract_value("landinglag")
            which_hitbox_raw = extract_value("whichhitbox")
            hitbox_raw = extract_value("hitbox")
            hops_actionable_raw = extract_value("hopsactionable")
            hops_autocancel_raw = extract_value("hopsautocancel")
            oos1_raw = extract_value("oos1")
            oos2_raw = extract_value("oos2")
            oos3_raw = extract_value("oos3")

            # Parse frame data - handle startup and active frames separately
            startup, _ = normalize_frames(startup_raw) if startup_raw else (None, None)
            _, active_norm = normalize_frames(active_raw) if active_raw else (None, None)
            end_lag = parse_int_or_zero(endlag_raw)
            on_shield = parse_on_shield(onshield_raw)
            shield_lag = parse_int_or_zero(shieldlag_raw)
            damage = parse_float_or_zero(damage_raw)
            shield_stun = parse_int_or_zero(shieldstun_raw)
            
            # Parse additional fields
            total_frames = parse_int_or_zero(total_frames_raw)
            landing_lag = parse_int_or_zero(landing_lag_raw)
            which_hitbox = which_hitbox_raw if which_hitbox_raw else None
            hitbox_info = hitbox_raw if hitbox_raw else None
            hops_actionable = parse_int_or_zero(hops_actionable_raw)
            hops_autocancel = parse_int_or_zero(hops_autocancel_raw)
            oos1 = parse_int_or_zero(oos1_raw)
            oos2 = parse_int_or_zero(oos2_raw)
            oos3 = parse_int_or_zero(oos3_raw)

            # Calculate active frame duration as a number
            active_duration = calculate_active_duration(active_norm) if active_norm else 0

            move_type = guess_move_type(section_label, name)
            rarity = rarity_rule(name, move_type)

            move_id = f"{char_slug}-{slugify(name)}"
            link = char_url.split("#")[0]

            move_obj = {
                "id": move_id,
                "name": name,
                "type": move_type,
                "rarity": rarity,
                "startupFrames": startup if startup is not None else 0,
                "activeFrames": active_duration,  # Now a number representing duration
                "endLag": end_lag,
                "onShieldLag": on_shield,  # On Shield advantage (negative = disadvantage)
                "shieldLag": shield_lag,   # Shield lag frames
                "damage": damage,
                "shieldStun": shield_stun,
                "notes": notes_raw,
                "links": [link],
                "createdAt": created_at,
                # Additional fields
                "totalFrames": total_frames,
                "landingLag": landing_lag,
                "whichHitbox": which_hitbox,
                "hitboxInfo": hitbox_info,
                "hopsActionable": hops_actionable,
                "hopsAutocancel": hops_autocancel,
                "oos1": oos1,
                "oos2": oos2,
                "oos3": oos3
            }
            all_moves.append(move_obj)

    # De-dup by id
    unique: Dict[str, Dict] = {}
    for m in all_moves:
        unique[m["id"]] = m
    return list(unique.values())

# --- Main orchestration -------------------------------------------------------

def scrape_character(slug: str, outdir: str) -> Tuple[str, int]:
    url = find_character_url(slug)
    if not url:
        raise RuntimeError(f"Could not locate character page for slug '{slug}'")

    soup = fetch(url)
    moves = extract_moves_from_page(soup, slug, url)

    os.makedirs(outdir, exist_ok=True)
    outpath = os.path.join(outdir, f"{slug}.json")
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump(moves, f, ensure_ascii=False, indent=2)
    return outpath, len(moves)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="Scrape all characters from roster")
    ap.add_argument("--chars", nargs="*", help="Specific character slugs (e.g., mario link pikachu)")
    ap.add_argument("--out", default="./out", help="Output directory for JSON files")
    ap.add_argument("--delay", type=float, default=1.25, help="Delay between requests (seconds)")
    args = ap.parse_args()

    if not args.all and not args.chars:
        ap.error("Provide --all or --chars <slug ...>")

    if args.all:
        print("Discovering roster…")
        slugs = get_roster_slugs()
        if not slugs:
            print("Could not auto-discover roster; try --chars with explicit slugs.")
            return
    else:
        slugs = [s.lower() for s in args.chars]

    print(f"Scraping {len(slugs)} character(s) → {args.out}")
    total_moves = 0
    for i, slug in enumerate(slugs, 1):
        try:
            print(f"[{i}/{len(slugs)}] {slug} …", end="", flush=True)
            outpath, count = scrape_character(slug, args.out)
            total_moves += count
            print(f" OK ({count} moves) → {outpath}")
        except Exception as e:
            print(f" FAILED: {e}")
        time.sleep(args.delay)

    print(f"Done. Characters: {len(slugs)}, Total moves scraped: {total_moves}")

if __name__ == "__main__":
    main()
