#!/usr/bin/env python3
"""
Create Enhanced Character Data Bundle

Combines enhanced move data with character stats to create a comprehensive dataset
for neural network analysis of character viability.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from typing import Dict, List, Optional

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def load_character_stats(stats_file: str = "character-stats.json") -> Dict:
    """Load character stats data"""
    if not os.path.exists(stats_file):
        print(f"Stats file {stats_file} not found. Running stats scraper...")
        subprocess.run([sys.executable, "scrape_stats.py"], check=True)
    
    with open(stats_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_character_moves(char_slug: str, moves_dir: str = "out") -> List[Dict]:
    """Load move data for a specific character"""
    moves_file = os.path.join(moves_dir, f"{char_slug}.json")
    if not os.path.exists(moves_file):
        return []
    
    with open(moves_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def enhance_move_data(moves: List[Dict]) -> List[Dict]:
    """Add derived properties to move data for analysis"""
    enhanced_moves = []
    
    for move in moves:
        enhanced_move = move.copy()
        
        # Calculate derived metrics
        enhanced_move["safety_rating"] = calculate_safety_rating(move)
        enhanced_move["combo_potential"] = calculate_combo_potential(move)
        enhanced_move["kill_power_index"] = calculate_kill_power_index(move)
        enhanced_move["frame_efficiency"] = calculate_frame_efficiency(move)
        
        enhanced_moves.append(enhanced_move)
    
    return enhanced_moves

def calculate_safety_rating(move: Dict) -> float:
    """Calculate how safe a move is on shield (higher = safer)"""
    on_shield = move.get("onShieldLag", 0)
    startup = move.get("startupFrames", 0)
    end_lag = move.get("endLag", 0)
    
    # Positive onShield means advantage, negative means disadvantage
    # Factor in startup and endlag for overall safety
    if startup == 0:
        return 0.0
        
    safety = on_shield - (startup * 0.1) - (end_lag * 0.05)
    return round(safety, 2)

def calculate_combo_potential(move: Dict) -> float:
    """Estimate combo potential based on frame data"""
    startup = move.get("startupFrames", 0)
    active_frames = move.get("activeFrames", 0)
    damage = move.get("damage", 0)
    shield_stun = move.get("shieldStun", 0)
    
    if startup == 0:
        return 0.0
    
    # Faster moves with good damage and shield stun have higher combo potential
    combo_score = (damage * 0.5) + (shield_stun * 0.3) - (startup * 0.2)
    return round(max(0, combo_score), 2)

def calculate_kill_power_index(move: Dict) -> float:
    """Estimate kill power based on damage and move type"""
    damage = move.get("damage", 0)
    move_type = move.get("type", "").lower()
    
    # Smash attacks and specials typically have higher kill power
    type_multiplier = 1.0
    if "smash" in move_type:
        type_multiplier = 1.5
    elif "special" in move_type:
        type_multiplier = 1.3
    elif "aerial" in move_type:
        type_multiplier = 1.2
    
    kill_power = damage * type_multiplier
    return round(kill_power, 2)

def calculate_frame_efficiency(move: Dict) -> float:
    """Calculate frame efficiency (damage per frame)"""
    damage = move.get("damage", 0)
    startup = move.get("startupFrames", 0)
    end_lag = move.get("endLag", 0)
    
    total_frames = startup + end_lag
    if total_frames == 0:
        return 0.0
    
    efficiency = damage / total_frames
    return round(efficiency, 3)

def get_character_list(moves_dir: str = "out") -> List[str]:
    """Get list of available characters from moves directory"""
    if not os.path.exists(moves_dir):
        return []
    
    characters = []
    for file in os.listdir(moves_dir):
        if file.endswith('.json'):
            char_slug = file[:-5]  # Remove .json extension
            characters.append(char_slug)
    
    return sorted(characters)

def create_enhanced_bundle(output_file: str = "enhanced-character-data-bundle.json"):
    """Create the enhanced character data bundle"""
    print("Creating enhanced character data bundle...")
    
    # Load character stats
    print("Loading character stats...")
    stats_data = load_character_stats()
    character_stats = stats_data.get("characters", {})
    
    # Get character list
    print("Getting character list...")
    characters = get_character_list()
    print(f"Found {len(characters)} characters with move data")
    
    # Build enhanced bundle
    enhanced_characters = {}
    total_moves = 0
    
    for char_slug in characters:
        print(f"Processing {char_slug}...")
        
        # Load move data
        moves = load_character_moves(char_slug)
        if not moves:
            print(f"  No moves found for {char_slug}")
            continue
        
        # Enhance move data
        enhanced_moves = enhance_move_data(moves)
        
        # Get character stats
        char_stats = character_stats.get(char_slug, {})
        
        # Create character entry
        enhanced_characters[char_slug] = {
            "moves": enhanced_moves,
            "stats": char_stats,
            "moveCount": len(enhanced_moves)
        }
        
        total_moves += len(enhanced_moves)
        print(f"  Added {len(enhanced_moves)} moves")
    
    # Create final bundle
    bundle = {
        "metadata": {
            "created": now_iso(),
            "totalCharacters": len(enhanced_characters),
            "totalMoves": total_moves,
            "version": "2.0.0",
            "description": "Enhanced character data with derived metrics for neural network analysis",
            "enhancements": [
                "Additional frame data fields (totalFrames, landingLag, etc.)",
                "Character stats (weight, speed, mobility)",
                "Derived metrics (safety rating, combo potential, kill power)",
                "Frame efficiency calculations"
            ]
        },
        "characters": enhanced_characters
    }
    
    # Save bundle
    print(f"\nSaving enhanced bundle to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)
    
    print(f"\nEnhanced bundle created successfully!")
    print(f"Characters: {len(enhanced_characters)}")
    print(f"Total moves: {total_moves}")
    print(f"Output file: {output_file}")
    
    # Print sample data
    if enhanced_characters:
        sample_char = list(enhanced_characters.keys())[0]
        sample_data = enhanced_characters[sample_char]
        print(f"\nSample data for {sample_char}:")
        print(f"  Moves: {sample_data['moveCount']}")
        print(f"  Stats available: {len(sample_data['stats'])} categories")
        
        if sample_data['moves']:
            sample_move = sample_data['moves'][0]
            print(f"  Sample move: {sample_move['name']}")
            print(f"    Safety rating: {sample_move.get('safety_rating', 'N/A')}")
            print(f"    Combo potential: {sample_move.get('combo_potential', 'N/A')}")
            print(f"    Kill power: {sample_move.get('kill_power_index', 'N/A')}")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Create enhanced character data bundle")
    parser.add_argument("--output", "-o", default="enhanced-character-data-bundle.json",
                       help="Output file name")
    parser.add_argument("--regenerate-moves", action="store_true",
                       help="Regenerate all move data before creating bundle")
    
    args = parser.parse_args()
    
    if args.regenerate_moves:
        print("Regenerating all move data...")
        subprocess.run([sys.executable, "scrape_ufd.py", "--all"], check=True)
    
    create_enhanced_bundle(args.output)

if __name__ == "__main__":
    main()
