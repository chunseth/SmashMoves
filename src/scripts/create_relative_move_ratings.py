#!/usr/bin/env python3
"""
Relative Move Rating System for Smash Ultimate

Compares moves within their type categories across all characters.
Each move is rated relative to other moves of the same type.
"""

import json
import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, timezone

class RelativeMoveRater:
    def __init__(self):
        """Initialize the relative move rating system"""
        
        # Component weights for each move type (based on neural network insights)
        self.type_weights = {
            'jab': {
                'speed': 0.4,           # Jabs should be fast
                'safety': 0.3,          # Should be relatively safe
                'combo_potential': 0.2, # Should combo well
                'versatility': 0.1      # Should be versatile
            },
            'tilt': {
                'speed': 0.25,          # Tilts should be reasonably fast
                'safety': 0.25,         # Should be safe
                'combo_potential': 0.2, # Good combo potential
                'kill_power': 0.15,     # Some kill potential
                'versatility': 0.15     # Very versatile
            },
            'smash': {
                'kill_power': 0.4,      # Smashes should kill
                'damage': 0.25,         # High damage
                'speed': 0.15,          # Reasonable speed
                'safety': 0.1,          # Safety less important
                'frame_efficiency': 0.1 # Good efficiency
            },
            'aerial': {
                'speed': 0.3,           # Aerials should be fast
                'combo_potential': 0.25,# Good for combos
                'safety': 0.2,          # Should be safe on landing
                'kill_power': 0.15,     # Some kill potential
                'versatility': 0.1      # Versatile usage
            },
            'special': {
                'versatility': 0.3,     # Specials are unique
                'combo_potential': 0.2, # Often combo starters/enders
                'kill_power': 0.2,      # Often kill moves
                'speed': 0.15,          # Speed varies
                'safety': 0.15          # Safety varies
            },
            'throw': {
                'combo_potential': 0.4, # Throws should combo
                'kill_power': 0.3,      # Should kill at high %
                'damage': 0.2,          # Decent damage
                'versatility': 0.1      # Situational but important
            },
            'grab': {
                'speed': 0.4,           # Grabs should be fast
                'safety': 0.3,          # Should be relatively safe
                'versatility': 0.2,     # Essential for gameplay
                'range': 0.1            # Range matters
            },
            'movement': {
                'versatility': 0.4,     # Movement is essential
                'speed': 0.3,           # Should be fast
                'safety': 0.2,          # Should be safe
                'frame_efficiency': 0.1 # Should be efficient
            }
        }
    
    def calculate_component_scores(self, move: Dict) -> Dict[str, float]:
        """Calculate individual component scores for a move"""
        startup = move.get('startupFrames', 0)
        end_lag = move.get('endLag', 0)
        damage = move.get('damage', 0)
        on_shield = move.get('onShieldLag', 0)
        shield_stun = move.get('shieldStun', 0)
        total_frames = move.get('totalFrames', startup + end_lag)
        
        scores = {}
        
        # Speed score (lower startup = better)
        if startup == 0:
            scores['speed'] = 100.0
        else:
            # Exponential decay: faster = exponentially better
            scores['speed'] = 100 * np.exp(-startup / 10.0)
        
        # Safety score (positive shield advantage = better)
        if startup == 0:
            safety = on_shield
        else:
            safety = on_shield - (startup * 0.1) - (end_lag * 0.05)
        scores['safety'] = max(0, min(100, 50 + (safety * 2.5)))
        
        # Combo potential score
        if startup == 0:
            scores['combo_potential'] = 0
        else:
            combo_score = (damage * 5) + (shield_stun * 3) - (startup * 2) - (end_lag * 0.5)
            scores['combo_potential'] = max(0, min(100, combo_score * 2))
        
        # Kill power score (damage + move type bonus)
        move_type = move.get('type', '').lower()
        type_multipliers = {
            'smash': 1.5,
            'special': 1.3,
            'aerial': 1.2,
            'throw': 1.4,
            'tilt': 1.0,
            'jab': 0.7,
            'grab': 0.5,
            'movement': 0.3
        }
        type_multiplier = type_multipliers.get(move_type, 1.0)
        kill_power = damage * type_multiplier
        scores['kill_power'] = min(100, (kill_power / 30) * 100)
        
        # Damage score
        scores['damage'] = min(100, (damage / 30) * 100)
        
        # Frame efficiency score
        if total_frames == 0:
            scores['frame_efficiency'] = 0
        else:
            efficiency = damage / total_frames
            scores['frame_efficiency'] = min(100, (efficiency / 2.0) * 100)
        
        # Endlag score (lower endlag = better)
        if end_lag == 0:
            scores['endlag'] = 100.0
        else:
            scores['endlag'] = 100 * np.exp(-end_lag / 20.0)
        
        # Versatility score (based on move type and properties)
        type_versatility = {
            'jab': 70, 'tilt': 85, 'smash': 60, 'aerial': 75,
            'special': 80, 'throw': 90, 'grab': 95, 'movement': 85
        }
        base_versatility = type_versatility.get(move_type, 50)
        
        # Adjust for frame data
        if total_frames > 0 and total_frames < 30:
            base_versatility += 10
        elif total_frames > 60:
            base_versatility -= 15
        
        scores['versatility'] = max(0, min(100, base_versatility))
        
        # Range score (placeholder - would need hitbox data)
        scores['range'] = 50.0  # Default middle value
        
        return scores
    
    def rate_moves_by_type(self, all_moves: List[Dict]) -> Dict[str, List[Dict]]:
        """Group and rate moves by type across all characters"""
        
        # Group moves by type
        moves_by_type = {}
        for move in all_moves:
            move_type = move.get('type', 'unknown').lower()
            if move_type not in moves_by_type:
                moves_by_type[move_type] = []
            moves_by_type[move_type].append(move)
        
        rated_moves_by_type = {}
        
        for move_type, moves in moves_by_type.items():
            print(f"Rating {len(moves)} {move_type} moves...")
            
            # Calculate component scores for all moves of this type
            for move in moves:
                move['component_scores'] = self.calculate_component_scores(move)
            
            # Get weights for this move type
            weights = self.type_weights.get(move_type, {
                'speed': 0.25, 'safety': 0.25, 'combo_potential': 0.2,
                'kill_power': 0.15, 'damage': 0.1, 'versatility': 0.05
            })
            
            # Calculate weighted scores
            for move in moves:
                weighted_score = 0
                for component, weight in weights.items():
                    if component in move['component_scores']:
                        weighted_score += move['component_scores'][component] * weight
                
                move['weighted_score'] = round(weighted_score, 2)
            
            # Sort by weighted score to get rankings
            moves.sort(key=lambda x: x['weighted_score'], reverse=True)
            
            # Calculate relative ratings (percentile-based)
            scores = [move['weighted_score'] for move in moves]
            mean_score = np.mean(scores)
            std_score = np.std(scores)
            
            for i, move in enumerate(moves):
                # Calculate percentile ranking
                percentile = (len(moves) - i) / len(moves) * 100
                
                # Calculate relative rating (mean-centered)
                if std_score > 0:
                    z_score = (move['weighted_score'] - mean_score) / std_score
                    relative_rating = 50 + (z_score * 15)  # Scale to 0-100
                else:
                    relative_rating = 50
                
                relative_rating = max(0, min(100, relative_rating))
                
                # Determine tier based on percentile
                if percentile >= 90:
                    tier = 'S'
                elif percentile >= 75:
                    tier = 'A'
                elif percentile >= 50:
                    tier = 'B'
                elif percentile >= 25:
                    tier = 'C'
                else:
                    tier = 'D'
                
                move['relative_rating'] = round(relative_rating, 2)
                move['tier'] = tier
                move['percentile_rank'] = round(percentile, 1)
                move['rank_in_type'] = i + 1
                move['total_of_type'] = len(moves)
                move['type_weights_used'] = weights
            
            rated_moves_by_type[move_type] = moves
            
            # Print top moves of this type
            print(f"  Top 5 {move_type} moves:")
            for i, move in enumerate(moves[:5]):
                print(f"    {i+1}. {move.get('name', 'Unknown')} ({move.get('character', 'Unknown')}): {move['relative_rating']:.1f} ({move['tier']})")
        
        return rated_moves_by_type
    
    def create_character_summaries(self, rated_moves_by_type: Dict[str, List[Dict]]) -> Dict[str, Dict]:
        """Create character-level summaries of move ratings"""
        
        # Group moves by character
        character_moves = {}
        for move_type, moves in rated_moves_by_type.items():
            for move in moves:
                char_name = move.get('character', 'unknown')
                if char_name not in character_moves:
                    character_moves[char_name] = []
                character_moves[char_name].append(move)
        
        character_summaries = {}
        
        for char_name, moves in character_moves.items():
            if not moves:
                continue
                
            # Calculate statistics
            ratings = [move['relative_rating'] for move in moves]
            tiers = [move['tier'] for move in moves]
            
            # Count by tier
            tier_counts = {}
            for tier in ['S', 'A', 'B', 'C', 'D']:
                tier_counts[tier] = tiers.count(tier)
            
            # Count by type
            type_counts = {}
            for move in moves:
                move_type = move.get('type', 'unknown')
                type_counts[move_type] = type_counts.get(move_type, 0) + 1
            
            # Find best and worst moves
            best_move = max(moves, key=lambda m: m['relative_rating'])
            worst_move = min(moves, key=lambda m: m['relative_rating'])
            
            # Find best move of each type
            best_by_type = {}
            for move in moves:
                move_type = move.get('type', 'unknown')
                if move_type not in best_by_type or move['relative_rating'] > best_by_type[move_type]['relative_rating']:
                    best_by_type[move_type] = move
            
            character_summaries[char_name] = {
                'total_moves': len(moves),
                'average_rating': round(sum(ratings) / len(ratings), 2),
                'best_rating': max(ratings),
                'worst_rating': min(ratings),
                'tier_distribution': tier_counts,
                'type_distribution': type_counts,
                'best_move': {
                    'name': best_move.get('name', 'Unknown'),
                    'type': best_move.get('type', 'unknown'),
                    'rating': best_move['relative_rating'],
                    'tier': best_move['tier']
                },
                'worst_move': {
                    'name': worst_move.get('name', 'Unknown'),
                    'type': worst_move.get('type', 'unknown'),
                    'rating': worst_move['relative_rating'],
                    'tier': worst_move['tier']
                },
                'best_by_type': {
                    move_type: {
                        'name': move.get('name', 'Unknown'),
                        'rating': move['relative_rating'],
                        'tier': move['tier']
                    }
                    for move_type, move in best_by_type.items()
                }
            }
        
        return character_summaries

def create_relative_rated_bundle(input_file: str = "character-data-bundle.json",
                               output_file: str = "relative-rated-character-data-bundle.json"):
    """Create enhanced character bundle with relative move ratings"""
    
    print("Creating relative move ratings for all characters...")
    
    # Load original data
    with open(input_file, 'r', encoding='utf-8') as f:
        original_data = json.load(f)
    
    # Flatten all moves and add character info
    all_moves = []
    for char_name, char_moves in original_data["characters"].items():
        for move in char_moves:
            move['character'] = char_name
            all_moves.append(move)
    
    print(f"Total moves to analyze: {len(all_moves)}")
    
    # Initialize rater
    rater = RelativeMoveRater()
    
    # Rate moves by type
    rated_moves_by_type = rater.rate_moves_by_type(all_moves)
    
    # Create character summaries
    character_summaries = rater.create_character_summaries(rated_moves_by_type)
    
    # Reconstruct character data with rated moves
    enhanced_characters = {}
    for char_name in original_data["characters"].keys():
        char_moves = []
        for move_type, moves in rated_moves_by_type.items():
            for move in moves:
                if move.get('character') == char_name:
                    # Remove character field to keep original structure
                    move_copy = move.copy()
                    del move_copy['character']
                    char_moves.append(move_copy)
        
        enhanced_characters[char_name] = {
            "moves": char_moves,
            "move_summary": character_summaries.get(char_name, {}),
            "total_moves": len(char_moves)
        }
    
    # Create enhanced bundle
    enhanced_bundle = {
        "metadata": {
            **original_data["metadata"],
            "version": "4.0.0",
            "description": "Character data with relative move ratings - moves rated within their type categories",
            "rating_system": {
                "type": "relative",
                "description": "Moves are rated relative to other moves of the same type across all characters",
                "methodology": "Each move type has specific weight criteria. Moves are ranked within their type and given percentile-based ratings.",
                "tier_system": {
                    "S": "Top 10% of moves in type",
                    "A": "Top 25% of moves in type", 
                    "B": "Top 50% of moves in type",
                    "C": "Top 75% of moves in type",
                    "D": "Bottom 25% of moves in type"
                },
                "type_weights": rater.type_weights,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        "characters": enhanced_characters
    }
    
    # Save enhanced bundle
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_bundle, f, indent=2, ensure_ascii=False)
    
    print(f"\nRelative move rating complete!")
    print(f"Enhanced bundle saved: {output_file}")
    
    # Generate summary
    generate_relative_rating_summary(rated_moves_by_type, character_summaries)
    
    return enhanced_bundle

def generate_relative_rating_summary(rated_moves_by_type: Dict[str, List[Dict]], 
                                   character_summaries: Dict[str, Dict]):
    """Generate summary of relative move ratings"""
    
    print("\n" + "="*60)
    print("RELATIVE MOVE RATING SUMMARY")
    print("="*60)
    
    # Overall statistics
    total_moves = sum(len(moves) for moves in rated_moves_by_type.values())
    print(f"Total moves analyzed: {total_moves}")
    
    # Type distribution
    print(f"\nMoves by type:")
    for move_type, moves in rated_moves_by_type.items():
        s_count = sum(1 for m in moves if m['tier'] == 'S')
        a_count = sum(1 for m in moves if m['tier'] == 'A')
        b_count = sum(1 for m in moves if m['tier'] == 'B')
        c_count = sum(1 for m in moves if m['tier'] == 'C')
        d_count = sum(1 for m in moves if m['tier'] == 'D')
        
        print(f"  {move_type}: {len(moves)} moves (S:{s_count} A:{a_count} B:{b_count} C:{c_count} D:{d_count})")
    
    # Top moves by type
    print(f"\nTop moves by type:")
    for move_type, moves in rated_moves_by_type.items():
        if moves:
            top_move = moves[0]
            print(f"  {move_type}: {top_move.get('name', 'Unknown')} ({top_move.get('character', 'Unknown')}) - {top_move['relative_rating']:.1f} ({top_move['tier']})")
    
    # Character rankings
    print(f"\nTop 10 characters by average move rating:")
    char_avg_ratings = []
    for char_name, summary in character_summaries.items():
        if summary['total_moves'] > 0:
            char_avg_ratings.append((char_name, summary['average_rating']))
    
    char_avg_ratings.sort(key=lambda x: x[1], reverse=True)
    for i, (char_name, avg_rating) in enumerate(char_avg_ratings[:10], 1):
        print(f"  {i:2d}. {char_name}: {avg_rating:.2f}")

def main():
    """Main function"""
    try:
        bundle = create_relative_rated_bundle()
        print("\nRelative move rating system successfully implemented!")
        print("Each move is now rated relative to other moves of the same type.")
        print("This provides fair comparisons: jabs vs jabs, smashes vs smashes, etc.")
        
    except Exception as e:
        print(f"Error creating relative move ratings: {e}")
        raise

if __name__ == "__main__":
    main()
