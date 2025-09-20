# BTL Calculator Guide

## Overview

The BTL (Bradley-Terry-Luce) Calculator is a dedicated module that handles all BTL model calculations for move ranking based on user comparison data. This guide explains how to use and understand the BTL calculator system.

## What is the BTL Model?

The Bradley-Terry-Luce model is a statistical method for ranking items based on pairwise comparisons. In our context, it ranks Super Smash Bros. Ultimate moves based on user choices from the comparison interface.

### Key Concepts

- **Pairwise Comparisons**: Users compare two moves and choose which is better
- **Win/Loss Records**: Each move accumulates wins and losses from comparisons
- **BTL Scores**: Mathematical scores that represent move strength
- **Confidence**: How reliable a score is based on number of comparisons
- **Tier Assignment**: Moves grouped into S, A, B, C, D, F tiers based on percentiles

## File Structure

```
src/web/btl-calculator.js    # Main BTL calculator module
src/scripts/btl-demo.js      # Demo script showing BTL functionality
docs/BTL-CALCULATOR-GUIDE.md # This documentation
```

## Usage

### Basic Setup

```javascript
// Include the BTL calculator in your HTML
<script src="btl-calculator.js"></script>

// Initialize in your JavaScript
const btlCalculator = new BTLCalculator();
```

### Core Methods

#### 1. Calculate BTL Scores

```javascript
const movesWithScores = btlCalculator.calculateBTLScores(moves, userChoices, moveType);
```

**Parameters:**
- `moves`: Array of move objects
- `userChoices`: Array of user comparison choices
- `moveType`: String indicating the move type (e.g., 'jab', 'forward smash')

**Returns:** Array of moves with BTL scores, win rates, and confidence values

#### 2. Group Moves by Tier

```javascript
const tiers = btlCalculator.groupMovesByTier(movesWithScores);
```

**Returns:** Object with S, A, B, C, D, F tier arrays

#### 3. Calculate BTL Prediction

```javascript
const prediction = btlCalculator.calculateBTLPrediction(move1, move2, moveData);
```

**Returns:** Object with predicted winner and confidence

#### 4. Get BTL Statistics

```javascript
const stats = btlCalculator.getBTLStatistics(userChoices, moveType);
```

**Returns:** Object with comparison statistics

## BTL Algorithm Details

### 1. Data Collection

The system tracks:
- **Wins**: Number of times a move was chosen as better
- **Total**: Total number of comparisons involving the move
- **Opponents**: Set of moves this move has been compared against

### 2. Iterative BTL Algorithm

The BTL model uses an iterative algorithm to calculate scores:

1. **Initialize**: All moves start with equal scores (1/n)
2. **Iterate**: For each move, calculate expected vs actual performance
3. **Update**: Adjust scores based on performance
4. **Normalize**: Ensure scores sum to 1
5. **Converge**: Repeat until scores stabilize

### 3. Confidence Calculation

Confidence is calculated using a sigmoid function:

```
confidence = 1 / (1 + e^(-k * (comparisons - x0)))
```

Where:
- `k = 0.5` (steepness)
- `x0 = 10` (midpoint)
- More comparisons = higher confidence

### 4. Tier Assignment

Moves are grouped into tiers based on BTL score percentiles:

- **S Tier**: Top 10%
- **A Tier**: 10-25%
- **B Tier**: 25-50%
- **C Tier**: 50-75%
- **D Tier**: 75-90%
- **F Tier**: Bottom 10%

## Integration Examples

### Comparison Page Integration

```javascript
class ExclusiveComparison {
    constructor() {
        this.btlCalculator = new BTLCalculator();
    }

    calculateBTLPrediction() {
        const move1 = this.currentMove1.parts[this.currentMove1.currentPartIndex];
        const move2 = this.currentMove2.parts[this.currentMove2.currentPartIndex];
        
        const movesOfType = this.getMovesOfType(this.currentMoveType);
        const moveData = this.btlCalculator.createMoveDataMap(movesOfType, this.userChoices);
        
        return this.btlCalculator.calculateBTLPrediction(move1, move2, moveData);
    }
}
```

### Tier List Integration

```javascript
class TierListPage {
    constructor() {
        this.btlCalculator = new BTLCalculator();
    }

    groupMovesByTier(moves) {
        const movesWithScores = this.btlCalculator.calculateBTLScores(moves, this.userChoices, this.currentMoveType);
        return this.btlCalculator.groupMovesByTier(movesWithScores);
    }
}
```

## Data Format

### Move Object

```javascript
{
    id: "mario-jab-1",
    name: "Jab 1",
    character: "mario",
    type: "jab",
    startupFrames: 4,
    damage: 2.2,
    // ... other move properties
}
```

### User Choice Object

```javascript
{
    move1: { id: "mario-jab-1", name: "Jab 1", character: "mario" },
    move2: { id: "link-jab-1", name: "Jab 1", character: "link" },
    userChoice: 1, // 1 = move1 wins, 2 = move2 wins, 0 = tie
    moveType: "jab",
    timestamp: "2024-01-01T00:00:00.000Z",
    btlPrediction: { move1Score: 0.6, move2Score: 0.4, predictedWinner: 1 }
}
```

### BTL Score Object

```javascript
{
    id: "mario-jab-1",
    name: "Jab 1",
    character: "mario",
    btlScore: 0.75,        // BTL score (0-1)
    userWins: 3,           // Number of wins
    userTotal: 4,          // Total comparisons
    winRate: 0.75,         // Win rate (0-1)
    confidence: 0.8        // Confidence score (0-1)
}
```

## Configuration

### BTL Calculator Parameters

```javascript
const btlCalculator = new BTLCalculator();

// Adjustable parameters (set in constructor)
btlCalculator.iterations = 50;              // Max iterations
btlCalculator.convergenceThreshold = 1e-6;  // Convergence threshold
btlCalculator.minComparisons = 1;           // Minimum comparisons for score
```

### Tier Percentiles

You can customize tier assignment by modifying the `groupMovesByTier` method:

```javascript
// Custom tier assignment
if (percentile < 5) tiers['S'].push(move);      // Top 5%
else if (percentile < 15) tiers['A'].push(move); // 5-15%
// ... etc
```

## Testing

### Demo Script

Run the demo script to see BTL calculations in action:

```bash
cd src/scripts
node btl-demo.js
```

### Sample Output

```
🎮 BTL Calculator Demo
=====================

📊 Sample Moves:
  mario: Jab 1 (4f startup, 2.2% damage)
  link: Jab 1 (6f startup, 3% damage)
  fox: Jab 1 (3f startup, 2% damage)
  ganondorf: Jab 1 (8f startup, 4% damage)

🎯 Sample User Choices:
  1. fox vs mario → fox wins
  2. mario vs link → mario wins
  3. link vs ganondorf → ganondorf wins
  4. fox vs link → fox wins
  5. mario vs ganondorf → mario wins

📈 BTL Results:
  1. link: 50.0% (0/3 wins, 2.9% confidence)
  2. fox: 41.0% (2/2 wins, 1.8% confidence)
  3. mario: 36.4% (2/3 wins, 2.9% confidence)
  4. ganondorf: 22.7% (1/2 wins, 1.8% confidence)

🏆 Tier List:
  S Tier: link
  B Tier: fox
  C Tier: mario
  D Tier: ganondorf
```

## Best Practices

### 1. Data Quality

- **Minimum Comparisons**: Ensure moves have sufficient comparison data
- **Balanced Comparisons**: Encourage comparisons across different move types
- **Quality Control**: Monitor for suspicious patterns in user choices

### 2. Performance

- **Batch Processing**: Calculate BTL scores in batches for large datasets
- **Caching**: Cache BTL scores and recalculate only when new data arrives
- **Incremental Updates**: Update scores incrementally rather than recalculating everything

### 3. User Experience

- **Confidence Indicators**: Show confidence levels to users
- **Explanation**: Explain how BTL scores are calculated
- **Feedback**: Allow users to see how their choices affect rankings

## Troubleshooting

### Common Issues

1. **No User Data**: Falls back to neural network ratings
2. **Insufficient Comparisons**: Low confidence scores
3. **Convergence Issues**: Increase iterations or adjust threshold
4. **Memory Usage**: Large datasets may require optimization

### Debug Mode

Enable debug logging by modifying the BTL calculator:

```javascript
// Add to BTLCalculator constructor
this.debug = true;

// Add logging in methods
if (this.debug) {
    console.log('BTL iteration:', iter, 'max change:', maxChange);
}
```

## Future Enhancements

### Planned Features

1. **Weighted Comparisons**: Weight recent comparisons more heavily
2. **User Expertise**: Factor in user skill level
3. **Move Context**: Consider move usage context (neutral, advantage, etc.)
4. **Real-time Updates**: Live BTL score updates as users make comparisons
5. **Advanced Statistics**: More detailed analytics and insights

### API Extensions

1. **Export Functions**: Export BTL data for external analysis
2. **Import Functions**: Import BTL data from other sources
3. **Validation Functions**: Validate BTL data integrity
4. **Comparison Functions**: Compare BTL models

## Conclusion

The BTL Calculator provides a robust, mathematically sound foundation for ranking Super Smash Bros. Ultimate moves based on user preferences. By centralizing BTL logic in a dedicated module, the system is maintainable, testable, and extensible for future enhancements.

For questions or contributions, please refer to the main project documentation or create an issue in the project repository.
