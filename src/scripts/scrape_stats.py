#!/usr/bin/env python3
"""
Smash Ultimate Character Stats Scraper

Scrapes character stats (weight, speed, mobility) from ultimateframedata.com/stats.php
"""

import json
import re
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://ultimateframedata.com/stats.php"
HEADERS = {
    "User-Agent": "FrameDataScraper/1.0 (+for personal research; contact me if needed)"
}

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.strip())

def parse_float_or_zero(value: str) -> float:
    """Parse float value or return 0"""
    if not value:
        return 0.0
    # Extract first number from string
    match = re.search(r'[-+]?\d*\.?\d+', value.replace(',', '.'))
    return float(match.group(0)) if match else 0.0

def parse_int_or_zero(value: str) -> int:
    """Parse int value or return 0"""
    if not value:
        return 0
    match = re.search(r'[-+]?\d+', value)
    return int(match.group(0)) if match else 0

def scrape_character_stats() -> Dict[str, Dict]:
    """Scrape all character stats from the stats page"""
    print("Fetching character stats...")
    
    response = requests.get(BASE_URL, headers=HEADERS)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, 'html.parser')
    
    stats_data = {}
    
    # Find all stat table containers
    stat_containers = soup.find_all('div', class_='statstablecontainer')
    
    for container in stat_containers:
        stat_name = container.find('h2')
        if not stat_name:
            continue
            
        stat_type = clean_text(stat_name.get_text()).lower().replace(' ', '_')
        table = container.find('table', class_='statstable')
        
        if not table:
            continue
            
        print(f"Processing {stat_type}...")
        
        # Find header row to get column names
        header_row = table.find('thead').find('tr')
        headers = [clean_text(th.get_text()).lower() for th in header_row.find_all('th')]
        
        # Process data rows
        tbody = table.find('tbody')
        if not tbody:
            continue
            
        rows = tbody.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 2:  # Need at least rank and character name
                continue
                
            # Extract character name (usually second column)
            char_name = clean_text(cells[1].get_text())
            if not char_name or char_name.lower() in ['character', 'rank', '--', 'n/a']:
                continue
                
            # Skip entries that look like rankings or non-character data
            if any(skip_word in char_name.lower() for skip_word in ['tied', 'rank', 'place', 'position']):
                continue
                
            # Initialize character data if not exists
            if char_name not in stats_data:
                stats_data[char_name] = {}
                
            # Extract stat values (skip rank column)
            stat_values = {}
            for i, cell in enumerate(cells[1:], 1):  # Skip rank column
                if i < len(headers):
                    header = headers[i]
                    value = clean_text(cell.get_text())
                    
                    # Try to parse as number
                    if '.' in value:
                        stat_values[header] = parse_float_or_zero(value)
                    else:
                        stat_values[header] = parse_int_or_zero(value)
                        
            # Store the stat type data
            stats_data[char_name][stat_type] = stat_values
    
    return stats_data

def normalize_character_names(stats_data: Dict[str, Dict]) -> Dict[str, Dict]:
    """Normalize character names to match our existing data format"""
    # Character name mapping from display names to slugs
    name_mapping = {
        'Banjo & Kazooie': 'banjo_and_kazooie',
        'Bowser Jr.': 'bowser_jr',
        'Captain Falcon': 'captain_falcon',
        'Dark Pit': 'dark_pit',
        'Dark Samus': 'dark_samus',
        'Diddy Kong': 'diddy_kong',
        'Donkey Kong': 'donkey_kong',
        'Dr. Mario': 'dr_mario',
        'Duck Hunt': 'duck_hunt',
        'Ice Climbers': 'ice_climbers',
        'King Dedede': 'king_dedede',
        'King K. Rool': 'king_k_rool',
        'Little Mac': 'little_mac',
        'Meta Knight': 'meta_knight',
        'Mr. Game & Watch': 'mr_game_and_watch',
        'Piranha Plant': 'piranha_plant',
        'Pit': 'pit',
        'Pokemon Trainer': 'pt_charizard',  # Handle PT characters separately
        'Rosalina & Luma': 'rosalina_and_luma',
        'Toon Link': 'toon_link',
        'Wii Fit Trainer': 'wii_fit_trainer',
        'Young Link': 'young_link',
        'Zero Suit Samus': 'zero_suit_samus',
        # Add more mappings as needed
    }
    
    normalized_data = {}
    for display_name, data in stats_data.items():
        # Use mapping if exists, otherwise slugify
        if display_name in name_mapping:
            slug = name_mapping[display_name]
        else:
            slug = display_name.lower().replace(' ', '_').replace('.', '').replace('&', 'and')
            
        normalized_data[slug] = data
        
    return normalized_data

def main():
    """Main function to scrape and save character stats"""
    try:
        stats_data = scrape_character_stats()
        normalized_data = normalize_character_names(stats_data)
        
        # Add metadata
        output = {
            "metadata": {
                "created": now_iso(),
                "totalCharacters": len(normalized_data),
                "version": "1.0.0",
                "source": "https://ultimateframedata.com/stats.php"
            },
            "characters": normalized_data
        }
        
        # Save to file
        output_file = "character-stats.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
            
        print(f"\nStats scraped successfully!")
        print(f"Total characters: {len(normalized_data)}")
        print(f"Output saved to: {output_file}")
        
        # Print sample data
        if normalized_data:
            sample_char = list(normalized_data.keys())[0]
            print(f"\nSample data for {sample_char}:")
            print(json.dumps(normalized_data[sample_char], indent=2))
            
    except Exception as e:
        print(f"Error scraping stats: {e}")
        raise

if __name__ == "__main__":
    main()
