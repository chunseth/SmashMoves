#!/usr/bin/env python3
"""
Move Rating System for Smash Ultimate

Creates comprehensive move ratings based on neural network analysis results.
Incorporates speed, safety, combo potential, and kill power into overall move viability scores.
"""

import json
import math
from typing import Dict, List, Tuple
from datetime import datetime, timezone

class MoveRater:
    def __init__(self):
        """Initialize the move rating system with weights from neural network analysis"""
        
        # Weights derived from neural network feature importance analysis
        self.weights = {
            'speed': 0.164,           # Average startup frames (most important)
            'safety': 0.121,          # Average safety rating
            'combo_potential': 0.057, # Best combo potential
            'kill_power': 0.057,      # Best kill power
            'frame_efficiency': 0.046, # Frame efficiency
            'endlag': 0.065,          # Average endlag
            'damage': 0.032,          # Derived from kill power analysis
            'versatility': 0.020      # Move type and usage versatility
        }
        
        # Normalize weights to sum to 1.0
        total_weight = sum(self.weights.values())
        for key in self.weights:
            self.weights[key] /= total_weight
    
    def calculate_speed_rating(self, move: Dict) -> float:
        """Calculate speed rating based on startup frames (lower = better)"""
        startup = move.get('startupFrames', 0)
        if startup == 0:
            return 0.0
        
        # Exponential decay: faster moves get exponentially higher ratings
        # Frame 1 = 100, Frame 10 = 36, Frame 20 = 13, Frame 30 = 5
        speed_rating = 100 * math.exp(-startup / 8.0)
        return round(speed_rating, 2)
    
    def calculate_safety_rating(self, move: Dict) -> float:
        """Calculate safety rating based on shield advantage"""
        on_shield = move.get('onShieldLag', 0)
        startup = move.get('startupFrames', 0)
        end_lag = move.get('endLag', 0)
        
        # Positive onShield = advantage, negative = disadvantage
        # Factor in startup and endlag for overall safety
        if startup == 0:
            safety = on_shield
        else:
            safety = on_shield - (startup * 0.1) - (end_lag * 0.05)
        
        # Convert to 0-100 scale
        # -20 or worse = 0, 0 = 50, +20 or better = 100
        safety_rating = max(0, min(100, 50 + (safety * 2.5)))
        return round(safety_rating, 2)
    
    def calculate_combo_potential_rating(self, move: Dict) -> float:
        """Calculate combo potential based on frame data and damage"""
        startup = move.get('startupFrames', 0)
        damage = move.get('damage', 0)
        shield_stun = move.get('shieldStun', 0)
        end_lag = move.get('endLag', 0)
        
        if startup == 0:
            return 0.0
        
        # Fast moves with good damage and shield stun have higher combo potential
        combo_score = (damage * 5) + (shield_stun * 3) - (startup * 2) - (end_lag * 0.5)
        combo_score = max(0, combo_score)
        
        # Convert to 0-100 scale
        combo_rating = min(100, combo_score * 2)
        return round(combo_rating, 2)
    
    def calculate_kill_power_rating(self, move: Dict) -> float:
        """Calculate kill power based on damage and move type"""
        damage = move.get('damage', 0)
        move_type = move.get('type', '').lower()
        
        # Move type multipliers for kill power
        type_multipliers = {
            'smash': 1.5,      # Smash attacks are designed for killing
            'special': 1.3,    # Specials often have high knockback
            'aerial': 1.2,     # Aerials can be powerful
            'tilt': 1.0,       # Tilts are balanced
            'jab': 0.7,        # Jabs are weak but fast
            'throw': 1.4,      # Throws can kill
            'grab': 0.5        # Grabs don't kill directly
        }
        
        type_multiplier = type_multipliers.get(move_type, 1.0)
        kill_power = damage * type_multiplier
        
        # Convert to 0-100 scale (assuming max damage around 30)
        kill_rating = min(100, (kill_power / 30) * 100)
        return round(kill_rating, 2)
    
    def calculate_frame_efficiency_rating(self, move: Dict) -> float:
        """Calculate frame efficiency (damage per frame)"""
        damage = move.get('damage', 0)
        startup = move.get('startupFrames', 0)
        end_lag = move.get('endLag', 0)
        
        total_frames = startup + end_lag
        if total_frames == 0:
            return 0.0
        
        efficiency = damage / total_frames
        # Convert to 0-100 scale (assuming max efficiency around 2.0)
        efficiency_rating = min(100, (efficiency / 2.0) * 100)
        return round(efficiency_rating, 2)
    
    def calculate_endlag_rating(self, move: Dict) -> float:
        """Calculate endlag rating (lower endlag = better)"""
        end_lag = move.get('endLag', 0)
        if end_lag == 0:
            return 100.0
        
        # Exponential decay: lower endlag gets exponentially higher ratings
        endlag_rating = 100 * math.exp(-end_lag / 15.0)
        return round(endlag_rating, 2)
    
    def calculate_damage_rating(self, move: Dict) -> float:
        """Calculate damage rating"""
        damage = move.get('damage', 0)
        # Convert to 0-100 scale (assuming max damage around 30)
        damage_rating = min(100, (damage / 30) * 100)
        return round(damage_rating, 2)
    
    def calculate_versatility_rating(self, move: Dict) -> float:
        """Calculate versatility based on move type and properties"""
        move_type = move.get('type', '').lower()
        total_frames = move.get('totalFrames', 0)
        landing_lag = move.get('landingLag', 0)
        
        # Base versatility by move type
        type_versatility = {
            'jab': 70,      # Versatile for pressure and combos
            'tilt': 85,     # Very versatile for neutral and combos
            'smash': 60,    # Powerful but situational
            'aerial': 75,   # Good for combos and edgeguarding
            'special': 80,  # Often unique and versatile
            'throw': 90,    # Essential for grabs and combos
            'grab': 95,     # Essential for game mechanics
            'movement': 85  # Essential for positioning
        }
        
        base_versatility = type_versatility.get(move_type, 50)
        
        # Adjust for frame data
        if total_frames > 0 and total_frames < 30:
            base_versatility += 10  # Fast moves are more versatile
        elif total_frames > 60:
            base_versatility -= 15  # Very slow moves are less versatile
        
        # Landing lag penalty for aerials
        if move_type == 'aerial' and landing_lag > 20:
            base_versatility -= 10
        
        return round(max(0, min(100, base_versatility)), 2)
    
    def calculate_overall_rating(self, move: Dict) -> Dict:
        """Calculate overall move rating and individual component ratings"""
        
        # Calculate individual ratings
        ratings = {
            'speed': self.calculate_speed_rating(move),
            'safety': self.calculate_safety_rating(move),
            'combo_potential': self.calculate_combo_potential_rating(move),
            'kill_power': self.calculate_kill_power_rating(move),
            'frame_efficiency': self.calculate_frame_efficiency_rating(move),
            'endlag': self.calculate_endlag_rating(move),
            'damage': self.calculate_damage_rating(move),
            'versatility': self.calculate_versatility_rating(move)
        }
        
        # Calculate weighted overall rating
        overall_rating = 0
        for component, rating in ratings.items():
            overall_rating += rating * self.weights[component]
        
        overall_rating = round(overall_rating, 2)
        
        # Determine rating tier
        if overall_rating >= 80:
            tier = 'S'
        elif overall_rating >= 70:
            tier = 'A'
        elif overall_rating >= 60:
            tier = 'B'
        elif overall_rating >= 50:
            tier = 'C'
        else:
            tier = 'D'
        
        return {
            'overall_rating': overall_rating,
            'tier': tier,
            'component_ratings': ratings,
            'weights_used': self.weights
        }
    
    def rate_all_moves(self, character_moves: List[Dict]) -> List[Dict]:
        """Rate all moves for a character"""
        rated_moves = []
        
        for move in character_moves:
            move_rating = self.calculate_overall_rating(move)
            
            # Add rating data to move
            enhanced_move = move.copy()
            enhanced_move['rating'] = move_rating
            
            rated_moves.append(enhanced_move)
        
        return rated_moves
    
    def get_character_move_summary(self, rated_moves: List[Dict]) -> Dict:
        """Generate summary statistics for character's moves"""
        if not rated_moves:
            return {}
        
        overall_ratings = [move['rating']['overall_rating'] for move in rated_moves]
        tiers = [move['rating']['tier'] for move in rated_moves]
        
        # Count moves by tier
        tier_counts = {}
        for tier in ['S', 'A', 'B', 'C', 'D']:
            tier_counts[tier] = tiers.count(tier)
        
        # Find best and worst moves
        best_move = max(rated_moves, key=lambda m: m['rating']['overall_rating'])
        worst_move = min(rated_moves, key=lambda m: m['rating']['overall_rating'])
        
        return {
            'total_moves': len(rated_moves),
            'average_rating': round(sum(overall_ratings) / len(overall_ratings), 2),
            'best_rating': max(overall_ratings),
            'worst_rating': min(overall_ratings),
            'tier_distribution': tier_counts,
            'best_move': {
                'name': best_move['name'],
                'rating': best_move['rating']['overall_rating'],
                'tier': best_move['rating']['tier']
            },
            'worst_move': {
                'name': worst_move['name'],
                'rating': worst_move['rating']['overall_rating'],
                'tier': worst_move['rating']['tier']
            }
        }

def create_rated_character_bundle(input_file: str = "character-data-bundle.json", 
                                 output_file: str = "rated-character-data-bundle.json"):
    """Create enhanced character bundle with move ratings"""
    
    print("Creating move ratings for all characters...")
    
    # Load original data
    with open(input_file, 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    # Initialize move rater
    rater = MoveRater()
    
    # Create enhanced bundle
    enhanced_bundle = {
        "metadata": {
            **original_data["metadata"],
            "version": "3.0.0",
            "description": "Enhanced character data with comprehensive move ratings based on neural network analysis",
            "rating_system": {
                "weights": rater.weights,
                "description": "Move ratings based on neural network feature importance analysis",
                "components": {
                    "speed": "Based on startup frames (exponential decay)",
                    "safety": "Based on shield advantage and frame data",
                    "combo_potential": "Based on damage, shield stun, and frame data",
                    "kill_power": "Based on damage and move type multipliers",
                    "frame_efficiency": "Damage per frame ratio",
                    "endlag": "Based on endlag frames (exponential decay)",
                    "damage": "Raw damage value normalized",
                    "versatility": "Based on move type and usage versatility"
                },
                "tier_system": {
                    "S": "80-100 (Excellent moves)",
                    "A": "70-79 (Very good moves)",
                    "B": "60-69 (Good moves)",
                    "C": "50-59 (Average moves)",
                    "D": "0-49 (Below average moves)"
                },
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        "characters": {}
    }
    
    total_moves_rated = 0
    
    for char_name, char_moves in original_data["characters"].items():
        print(f"Rating moves for {char_name}...")
        
        # Rate all moves for this character
        rated_moves = rater.rate_all_moves(char_moves)
        
        # Generate character summary
        move_summary = rater.get_character_move_summary(rated_moves)
        
        # Create enhanced character data
        enhanced_character = {
            "moves": rated_moves,
            "move_summary": move_summary,
            "total_moves": len(rated_moves)
        }
        
        enhanced_bundle["characters"][char_name] = enhanced_character
        total_moves_rated += len(rated_moves)
        
        print(f"  Rated {len(rated_moves)} moves (avg: {move_summary.get('average_rating', 0):.1f})")
    
    # Update metadata
    enhanced_bundle["metadata"]["totalMoves"] = total_moves_rated
    enhanced_bundle["metadata"]["totalRatedMoves"] = total_moves_rated
    
    # Save enhanced bundle
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_bundle, f, indent=2, ensure_ascii=False)
    
    print(f"\nMove rating complete!")
    print(f"Total moves rated: {total_moves_rated}")
    print(f"Enhanced bundle saved: {output_file}")
    
    # Generate summary statistics
    generate_rating_summary(enhanced_bundle)
    
    return enhanced_bundle

def generate_rating_summary(bundle: Dict):
    """Generate summary statistics of move ratings"""
    
    print("\n" + "="*50)
    print("MOVE RATING SUMMARY")
    print("="*50)
    
    all_ratings = []
    tier_counts = {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}
    
    for char_name, char_data in bundle["characters"].items():
        for move in char_data["moves"]:
            rating = move["rating"]["overall_rating"]
            tier = move["rating"]["tier"]
            all_ratings.append(rating)
            tier_counts[tier] += 1
    
    print(f"Total moves analyzed: {len(all_ratings)}")
    print(f"Average move rating: {sum(all_ratings)/len(all_ratings):.2f}")
    print(f"Highest rated move: {max(all_ratings):.2f}")
    print(f"Lowest rated move: {min(all_ratings):.2f}")
    
    print(f"\nTier Distribution:")
    for tier, count in tier_counts.items():
        percentage = (count / len(all_ratings)) * 100
        print(f"  {tier} Tier: {count} moves ({percentage:.1f}%)")
    
    # Find top moves
    print(f"\nTop 10 Rated Moves:")
    top_moves = []
    for char_name, char_data in bundle["characters"].items():
        for move in char_data["moves"]:
            top_moves.append({
                'character': char_name,
                'move': move['name'],
                'rating': move['rating']['overall_rating'],
                'tier': move['rating']['tier']
            })
    
    top_moves.sort(key=lambda x: x['rating'], reverse=True)
    for i, move in enumerate(top_moves[:10], 1):
        print(f"  {i:2d}. {move['character']} - {move['move']}: {move['rating']:.1f} ({move['tier']})")

def main():
    """Main function"""
    try:
        # Create rated character bundle
        bundle = create_rated_character_bundle()
        
        print("\nMove rating system successfully implemented!")
        print("Each move now includes:")
        print("- Overall rating (0-100)")
        print("- Tier classification (S/A/B/C/D)")
        print("- Component ratings (speed, safety, combo, etc.)")
        print("- Character-level move summaries")
        
    except Exception as e:
        print(f"Error creating move ratings: {e}")
        raise

if __name__ == "__main__":
    main()
