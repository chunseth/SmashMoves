#!/usr/bin/env python3
"""
BTL Model Demo for Move Comparison
Demonstrates the Bradley-Terry-Luce model implementation for ranking moves
"""

import json
from typing import List, Dict, Tuple

class BTLModel:
    """Bradley-Terry-Luce model for move ranking"""
    
    def __init__(self, iterations: int = 100, convergence_threshold: float = 1e-6):
        self.iterations = iterations
        self.convergence_threshold = convergence_threshold
    
    def calculate_btl_scores(self, moves: List[Dict]) -> List[Dict]:
        """
        Calculate BTL scores for a list of moves
        
        Args:
            moves: List of move dictionaries with attributes
            
        Returns:
            List of moves with BTL scores, sorted by score (highest first)
        """
        # Initialize scores
        scores = [1.0] * len(moves)
        
        # Generate pairwise comparisons
        comparisons = self._generate_comparisons(moves)
        
        # Run BTL algorithm
        for iteration in range(self.iterations):
            new_scores = [0.0] * len(moves)
            max_change = 0.0
            
            for i in range(len(moves)):
                numerator = 0.0
                denominator = 0.0
                
                for j in range(len(moves)):
                    if i != j:
                        comparison = comparisons[i][j]
                        if scores[i] + scores[j] > 0:
                            numerator += comparison['wins']
                            denominator += comparison['total'] / scores[j]
                
                if denominator > 0:
                    new_score = numerator / denominator
                    change = abs(new_score - scores[i])
                    max_change = max(max_change, change)
                    new_scores[i] = new_score
                else:
                    new_scores[i] = scores[i]
            
            # Update scores
            scores = new_scores
            
            # Check convergence
            if max_change < self.convergence_threshold:
                print(f"Converged after {iteration + 1} iterations")
                break
        
        # Normalize scores to sum to 1
        total_score = sum(scores)
        if total_score > 0:
            scores = [score / total_score for score in scores]
        
        # Create results with moves and scores
        results = []
        for i, move in enumerate(moves):
            results.append({
                'move': move,
                'score': scores[i],
                'rank': i + 1
            })
        
        # Sort by score (highest first)
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Update ranks
        for i, result in enumerate(results):
            result['rank'] = i + 1
        
        return results
    
    def _generate_comparisons(self, moves: List[Dict]) -> List[List[Dict]]:
        """Generate pairwise comparisons between moves"""
        comparisons = []
        
        for i in range(len(moves)):
            comparisons.append([])
            for j in range(len(moves)):
                if i == j:
                    comparisons[i].append({'wins': 0, 'total': 0})
                else:
                    comparison = self._compare_moves(moves[i], moves[j])
                    comparisons[i].append(comparison)
        
        return comparisons
    
    def _compare_moves(self, move1: Dict, move2: Dict) -> Dict:
        """
        Compare two moves based on multiple attributes
        
        Returns:
            Dictionary with 'wins' and 'total' for move1 vs move2
        """
        move1_wins = 0.0
        move2_wins = 0.0
        
        # Define comparison attributes with weights
        attributes = [
            {'name': 'speed', 'weight': 0.3, 'better': 'lower', 
             'value1': move1.get('startupFrames', 0), 'value2': move2.get('startupFrames', 0)},
            {'name': 'safety', 'weight': 0.25, 'better': 'higher', 
             'value1': move1.get('onShieldLag', 0), 'value2': move2.get('onShieldLag', 0)},
            {'name': 'damage', 'weight': 0.2, 'better': 'higher', 
             'value1': move1.get('damage', 0), 'value2': move2.get('damage', 0)},
            {'name': 'endlag', 'weight': 0.15, 'better': 'lower', 
             'value1': move1.get('endLag', 0), 'value2': move2.get('endLag', 0)},
            {'name': 'rating', 'weight': 0.1, 'better': 'higher', 
             'value1': move1.get('rating', {}).get('overall_rating', 0), 
             'value2': move2.get('rating', {}).get('overall_rating', 0)}
        ]
        
        for attr in attributes:
            winner = None
            
            if attr['better'] == 'lower':
                if attr['value1'] < attr['value2']:
                    winner = 1
                elif attr['value1'] > attr['value2']:
                    winner = 2
            else:  # higher is better
                if attr['value1'] > attr['value2']:
                    winner = 1
                elif attr['value1'] < attr['value2']:
                    winner = 2
            
            if winner == 1:
                move1_wins += attr['weight']
            elif winner == 2:
                move2_wins += attr['weight']
            else:
                # Tie - split the weight
                move1_wins += attr['weight'] / 2
                move2_wins += attr['weight'] / 2
        
        return {
            'wins': move1_wins,
            'total': move1_wins + move2_wins
        }

def load_sample_moves() -> List[Dict]:
    """Load sample moves for demonstration"""
    # Sample moves with different characteristics
    sample_moves = [
        {
            'id': 'mario-jab-1',
            'name': 'Mario Jab 1',
            'character': 'mario',
            'type': 'jab',
            'startupFrames': 3,
            'endLag': 15,
            'damage': 2.0,
            'onShieldLag': -2,
            'rating': {'overall_rating': 75.5, 'tier': 'A'}
        },
        {
            'id': 'mario-ftilt',
            'name': 'Mario Forward Tilt',
            'character': 'mario',
            'type': 'forward tilt',
            'startupFrames': 6,
            'endLag': 18,
            'damage': 9.0,
            'onShieldLag': -5,
            'rating': {'overall_rating': 68.2, 'tier': 'B'}
        },
        {
            'id': 'mario-fsmash',
            'name': 'Mario Forward Smash',
            'character': 'mario',
            'type': 'forward smash',
            'startupFrames': 15,
            'endLag': 35,
            'damage': 18.0,
            'onShieldLag': -20,
            'rating': {'overall_rating': 72.1, 'tier': 'A'}
        },
        {
            'id': 'mario-nair',
            'name': 'Mario Neutral Air',
            'character': 'mario',
            'type': 'nair',
            'startupFrames': 3,
            'endLag': 20,
            'damage': 8.0,
            'onShieldLag': -8,
            'rating': {'overall_rating': 82.3, 'tier': 'S'}
        },
        {
            'id': 'mario-fair',
            'name': 'Mario Forward Air',
            'character': 'mario',
            'type': 'fair',
            'startupFrames': 7,
            'endLag': 25,
            'damage': 12.0,
            'onShieldLag': -12,
            'rating': {'overall_rating': 71.8, 'tier': 'A'}
        }
    ]
    
    return sample_moves

def demonstrate_btl_model():
    """Demonstrate the BTL model with sample moves"""
    print("🎮 BTL Model Demo - Move Comparison")
    print("=" * 50)
    
    # Load sample moves
    moves = load_sample_moves()
    
    print(f"\n📊 Analyzing {len(moves)} moves:")
    for i, move in enumerate(moves, 1):
        print(f"{i}. {move['name']} ({move['type']})")
        print(f"   Startup: {move['startupFrames']}f, Damage: {move['damage']}%, Rating: {move['rating']['overall_rating']}")
    
    # Initialize BTL model
    btl_model = BTLModel()
    
    print(f"\n🧠 Running BTL Model Analysis...")
    print(f"   Iterations: {btl_model.iterations}")
    print(f"   Convergence Threshold: {btl_model.convergence_threshold}")
    
    # Calculate BTL scores
    results = btl_model.calculate_btl_scores(moves)
    
    print(f"\n🏆 BTL Ranking Results:")
    print("-" * 50)
    
    for result in results:
        move = result['move']
        score = result['score']
        rank = result['rank']
        
        print(f"#{rank} {move['name']}")
        print(f"   BTL Score: {score:.4f}")
        print(f"   Type: {move['type']}")
        print(f"   Startup: {move['startupFrames']}f | Damage: {move['damage']}% | Rating: {move['rating']['overall_rating']}")
        print(f"   Neural Network Tier: {move['rating']['tier']}")
        print()
    
    # Show comparison matrix
    print("📈 Pairwise Comparison Matrix:")
    print("-" * 50)
    
    comparisons = btl_model._generate_comparisons(moves)
    
    # Print header
    print("Move".ljust(20), end="")
    for move in moves:
        print(move['name'][:8].ljust(10), end="")
    print()
    
    # Print comparison results
    for i, move1 in enumerate(moves):
        print(move1['name'][:20].ljust(20), end="")
        for j, move2 in enumerate(moves):
            if i == j:
                print("--".ljust(10), end="")
            else:
                comparison = comparisons[i][j]
                win_rate = comparison['wins'] / comparison['total'] if comparison['total'] > 0 else 0.5
                print(f"{win_rate:.2f}".ljust(10), end="")
        print()
    
    print(f"\n✅ BTL Model Demo Complete!")
    print(f"   The model successfully ranked {len(moves)} moves based on multiple attributes.")
    print(f"   Higher BTL scores indicate better overall move quality.")

if __name__ == "__main__":
    demonstrate_btl_model()
