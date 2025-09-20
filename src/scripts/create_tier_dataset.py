#!/usr/bin/env python3
"""
Create Tier List Dataset for Neural Network Training

Converts tier list rankings into numerical data for machine learning
"""

import json
import os
from typing import Dict, List, Tuple

def parse_tier_list() -> Dict[str, Dict]:
    """Parse the tier list into structured data"""
    
    # Direct tier assignments
    tier_assignments = {
        # S+ Tier
        'Steve': 'S+', 'Sonic': 'S+', 'Snake': 'S+',
        
        # S Tier  
        'Mr. Game & Watch': 'S', 'R.O.B.': 'S', 'Pyra & Mythra': 'S', 'Kazuya': 'S',
        
        # S- Tier
        'Diddy Kong': 'S-', 'Min Min': 'S-', 'Fox': 'S-', 'Peach/Daisy': 'S-', 'Joker': 'S-', 'Yoshi': 'S-', 'Pikachu': 'S-',
        
        # A+ Tier
        'Roy': 'A+', 'Olimar': 'A+', 'Cloud': 'A+', 'Luigi': 'A+', 'Bayonetta': 'A+', 'Samus/Dark Samus': 'A+', 'Palutena': 'A+', 'Mario': 'A+',
        
        # A Tier
        'Corrin': 'A', 'Wario': 'A', 'Sora': 'A', 'Falco': 'A', 'Wolf': 'A', 'Hero': 'A',
        
        # A- Tier
        'Ryu': 'A-', 'Shulk': 'A-', 'Mii Brawler': 'A-', 'Terry': 'A-', 'Zero Suit Samus': 'A-', 'Greninja': 'A-', 'Pac-Man': 'A-', 'Pokemon Trainer': 'A-', 'Toon Link': 'A-', 'Lucina': 'A-',
        
        # B+ Tier
        'Young Link': 'B+', 'Pit/Dark Pit': 'B+', 'Captain Falcon': 'B+', 'Ken': 'B+', 'Rosalina & Luma': 'B+',
        
        # B- Tier
        'Ness': 'B-', 'Sheik': 'B-', 'Meta Knight': 'B-', 'Mega Man': 'B-', 'Inkling': 'B-', 'Sephiroth': 'B-', 'Byleth': 'B-', 'Ice Climbers': 'B-', 'Pichu': 'B-', 'Donkey Kong': 'B-',
        
        # C+ Tier
        'Lucario': 'C+', 'Banjo & Kazooie': 'C+', 'Wii Fit Trainer': 'C+', 'Chrom': 'C+', 'Lucas': 'C+', 'Mii Gunner': 'C+', 'Incineroar': 'C+',
        
        # C- Tier
        'Link': 'C-', 'Ridley': 'C-', 'Bowser': 'C-', 'Duck Hunt': 'C-', 'Kirby': 'C-', 'Isabelle': 'C-', 'Robin': 'C-', 'Bowser Jr.': 'C-', 'Mewtwo': 'C-', 'Jigglypuff': 'C-', 'Marth': 'C-',
        
        # D Tier
        'Mii Swordfighter': 'D', 'Zelda': 'D', 'Ike': 'D', 'Piranha Plant': 'D', 'Villager': 'D', 'King Dedede': 'D', 'King K. Rool': 'D', 'Simon/Richter': 'D', 'Dr. Mario': 'D',
        
        # E Tier
        'Little Mac': 'E', 'Ganondorf': 'E'
    }
    
    # Tier to numerical mapping (higher = better)
    tier_scores = {
        'S+': 10.0,
        'S': 9.0,
        'S-': 8.0,
        'A+': 7.0,
        'A': 6.0,
        'A-': 5.0,
        'B+': 4.0,
        'B-': 3.0,
        'C+': 2.0,
        'C-': 1.5,
        'D': 1.0,
        'E': 0.5
    }
    
    tier_data = {}
    
    # Convert tier assignments to structured data
    for character, tier in tier_assignments.items():
        tier_data[character] = {
            'tier': tier,
            'score': tier_scores[tier],
            'rank': len(tier_data) + 1
        }
    
    return tier_data

def normalize_character_names(tier_data: Dict[str, Dict]) -> Dict[str, Dict]:
    """Normalize character names to match our data format"""
    
    name_mapping = {
        'Mr. Game & Watch': 'mr_game_and_watch',
        'R.O.B.': 'rob',
        'Pyra & Mythra': 'pyra',  # Using Pyra as primary
        'Diddy Kong': 'diddy_kong',
        'Min Min': 'minmin',
        'Peach/Daisy': 'peach',  # Using Peach as primary
        'Samus/Dark Samus': 'samus',  # Using Samus as primary
        'Zero Suit Samus': 'zero_suit_samus',
        'Pokemon Trainer': 'pt_charizard',  # Using Charizard as primary
        'Pit/Dark Pit': 'pit',  # Using Pit as primary
        'Captain Falcon': 'captain_falcon',
        'Rosalina & Luma': 'rosalina_and_luma',
        'Meta Knight': 'meta_knight',
        'Mega Man': 'mega_man',
        'Ice Climbers': 'ice_climbers',
        'Banjo & Kazooie': 'banjo_and_kazooie',
        'Wii Fit Trainer': 'wii_fit_trainer',
        'Mii Gunner': 'mii_gunner',
        'Duck Hunt': 'duck_hunt',
        'Bowser Jr.': 'bowser_jr',
        'Mii Swordfighter': 'mii_swordfighter',
        'King Dedede': 'king_dedede',
        'King K. Rool': 'king_k_rool',
        'Simon/Richter': 'simon',  # Using Simon as primary
        'Dr. Mario': 'dr_mario',
        'Little Mac': 'little_mac'
    }
    
    normalized_data = {}
    
    for display_name, data in tier_data.items():
        if display_name in name_mapping:
            slug = name_mapping[display_name]
        else:
            slug = display_name.lower().replace(' ', '_').replace('.', '').replace('&', 'and')
            
        normalized_data[slug] = {
            'display_name': display_name,
            'tier': data['tier'],
            'score': data['score'],
            'rank': data['rank']
        }
    
    return normalized_data

def create_enhanced_dataset_with_tiers():
    """Create enhanced dataset with tier information"""
    
    print("Creating tier list dataset...")
    
    # Parse tier list
    tier_data = parse_tier_list()
    normalized_tiers = normalize_character_names(tier_data)
    
    print(f"Parsed {len(normalized_tiers)} characters from tier list")
    
    # Load enhanced character data
    enhanced_file = "enhanced-character-data-bundle.json"
    if not os.path.exists(enhanced_file):
        print(f"Enhanced data file {enhanced_file} not found.")
        print("Please run: python create_enhanced_bundle.py")
        return
    
    with open(enhanced_file, 'r', encoding='utf-8') as f:
        enhanced_data = json.load(f)
    
    # Combine data
    combined_data = {
        "metadata": {
            **enhanced_data["metadata"],
            "version": "3.0.0",
            "description": "Enhanced character data with tier list rankings for neural network training",
            "tier_list_source": "User-provided tier list",
            "total_tiered_characters": len(normalized_tiers)
        },
        "characters": {}
    }
    
    characters_with_tiers = 0
    characters_without_tiers = 0
    
    for char_slug, char_data in enhanced_data["characters"].items():
        # Add tier information if available
        if char_slug in normalized_tiers:
            tier_info = normalized_tiers[char_slug]
            char_data["tier_info"] = tier_info
            characters_with_tiers += 1
        else:
            char_data["tier_info"] = {
                "display_name": char_slug.replace('_', ' ').title(),
                "tier": "Unknown",
                "score": None,
                "rank": None
            }
            characters_without_tiers += 1
        
        combined_data["characters"][char_slug] = char_data
    
    # Save combined dataset
    output_file = "tier-enhanced-character-data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nCombined dataset created: {output_file}")
    print(f"Characters with tier data: {characters_with_tiers}")
    print(f"Characters without tier data: {characters_without_tiers}")
    
    # Create training-ready dataset
    create_training_dataset(combined_data)
    
    return combined_data

def create_training_dataset(combined_data: Dict):
    """Create a training-ready dataset for neural networks"""
    
    print("\nCreating training dataset...")
    
    training_data = []
    
    for char_slug, char_data in combined_data["characters"].items():
        if char_data["tier_info"]["score"] is None:
            continue  # Skip characters without tier data
        
        # Extract features for each character
        character_features = extract_character_features(char_data)
        
        training_data.append({
            "character": char_slug,
            "features": character_features,
            "tier": char_data["tier_info"]["tier"],
            "score": char_data["tier_info"]["score"],
            "rank": char_data["tier_info"]["rank"]
        })
    
    # Save training dataset
    training_file = "neural_network_training_data.json"
    with open(training_file, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"Training dataset saved: {training_file}")
    print(f"Total training examples: {len(training_data)}")
    
    # Print feature summary
    if training_data:
        sample_features = training_data[0]["features"]
        print(f"\nFeature categories: {len(sample_features)}")
        for category, value in sample_features.items():
            print(f"  {category}: {type(value).__name__}")

def extract_character_features(char_data: Dict) -> Dict:
    """Extract numerical features from character data"""
    
    moves = char_data.get("moves", [])
    stats = char_data.get("stats", {})
    
    features = {}
    
    # Move-based features
    if moves:
        # Frame data averages
        features["avg_startup"] = sum(m.get("startupFrames", 0) for m in moves) / len(moves)
        features["avg_endlag"] = sum(m.get("endLag", 0) for m in moves) / len(moves)
        features["avg_damage"] = sum(m.get("damage", 0) for m in moves) / len(moves)
        
        # Safety and combo features
        features["avg_safety_rating"] = sum(m.get("safety_rating", 0) for m in moves) / len(moves)
        features["avg_combo_potential"] = sum(m.get("combo_potential", 0) for m in moves) / len(moves)
        features["avg_kill_power"] = sum(m.get("kill_power_index", 0) for m in moves) / len(moves)
        features["avg_frame_efficiency"] = sum(m.get("frame_efficiency", 0) for m in moves) / len(moves)
        
        # Best move features
        features["best_safety"] = max((m.get("safety_rating", 0) for m in moves), default=0)
        features["best_combo_potential"] = max((m.get("combo_potential", 0) for m in moves), default=0)
        features["best_kill_power"] = max((m.get("kill_power_index", 0) for m in moves), default=0)
        
        # Move type distribution
        move_types = [m.get("type", "unknown") for m in moves]
        features["total_moves"] = len(moves)
        features["jab_moves"] = move_types.count("jab")
        features["aerial_moves"] = move_types.count("aerial")
        features["special_moves"] = move_types.count("special")
    
    # Character stats features
    if "weight" in stats and "weight" in stats["weight"]:
        features["weight"] = stats["weight"]["weight"]
    
    if "air_speed" in stats and "air speed" in stats["air_speed"]:
        features["air_speed"] = stats["air_speed"]["air speed"]
    
    if "walk_speed" in stats and "walk speed" in stats["walk_speed"]:
        features["walk_speed"] = stats["walk_speed"]["walk speed"]
    
    if "fall_speed" in stats:
        fall_data = stats["fall_speed"]
        features["fall_speed"] = fall_data.get("regular fall", 0)
        features["fast_fall_speed"] = fall_data.get("fast fall", 0)
    
    # Default values for missing features
    default_features = {
        "avg_startup": 0, "avg_endlag": 0, "avg_damage": 0,
        "avg_safety_rating": 0, "avg_combo_potential": 0, "avg_kill_power": 0,
        "avg_frame_efficiency": 0, "best_safety": 0, "best_combo_potential": 0,
        "best_kill_power": 0, "total_moves": 0, "jab_moves": 0, "aerial_moves": 0,
        "special_moves": 0, "weight": 0, "air_speed": 0, "walk_speed": 0,
        "fall_speed": 0, "fast_fall_speed": 0
    }
    
    for key, default_value in default_features.items():
        if key not in features:
            features[key] = default_value
    
    return features

def main():
    """Main function"""
    try:
        combined_data = create_enhanced_dataset_with_tiers()
        
        print("\nDataset creation complete!")
        print("\nFiles created:")
        print("- tier-enhanced-character-data.json (Full dataset with tiers)")
        print("- neural_network_training_data.json (Training-ready format)")
        
        # Print tier distribution
        tier_counts = {}
        for char_data in combined_data["characters"].values():
            tier = char_data["tier_info"]["tier"]
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
        
        print(f"\nTier distribution:")
        for tier, count in sorted(tier_counts.items()):
            print(f"  {tier}: {count} characters")
            
    except Exception as e:
        print(f"Error creating tier dataset: {e}")
        raise

if __name__ == "__main__":
    main()
