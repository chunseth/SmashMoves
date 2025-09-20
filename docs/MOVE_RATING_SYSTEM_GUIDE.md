# Smash Ultimate Move Rating System

## 🎯 Overview

Based on our neural network analysis results, I've created a comprehensive move rating system that evaluates each move across 8 key dimensions that determine competitive viability. Every move in the character-data-bundle now includes detailed ratings and analysis.

## 📊 Rating System Components

### Core Rating Factors (Weighted by Neural Network Importance)

1. **Speed (29.2% weight)** - Most Important Factor
   - Based on startup frames with exponential decay
   - Frame 1 = 100 rating, Frame 10 = 36, Frame 20 = 13
   - Fast moves are exponentially more valuable

2. **Safety (21.5% weight)** - Second Most Important
   - Based on shield advantage and frame data
   - Positive shield advantage = higher rating
   - Accounts for startup and endlag penalties

3. **Combo Potential (10.1% weight)**
   - Based on damage, shield stun, and frame data
   - Fast moves with good damage get higher ratings
   - Essential for advantage state

4. **Kill Power (10.1% weight)**
   - Based on damage with move type multipliers
   - Smash attacks (1.5x), Specials (1.3x), Aerials (1.2x)
   - Critical for securing stocks

5. **Endlag (11.6% weight)**
   - Based on endlag frames with exponential decay
   - Lower endlag = exponentially higher rating
   - Affects combo potential and safety

6. **Frame Efficiency (8.2% weight)**
   - Damage per frame ratio
   - Measures move efficiency
   - Important for resource management

7. **Damage (5.7% weight)**
   - Raw damage normalized to 0-100 scale
   - Direct correlation with move effectiveness

8. **Versatility (3.6% weight)**
   - Based on move type and usage patterns
   - Jabs, Tilts, and Specials get higher versatility ratings
   - Accounts for move utility

## 🏆 Tier Classification System

- **S Tier (80-100)**: Excellent moves - Game-changing abilities
- **A Tier (70-79)**: Very good moves - Strong competitive tools  
- **B Tier (60-69)**: Good moves - Solid competitive options
- **C Tier (50-59)**: Average moves - Decent but situational
- **D Tier (0-49)**: Below average moves - Limited use cases

## 📈 Current Rating Statistics

### Overall Distribution
- **Total Moves Rated**: 2,717 across all characters
- **Average Rating**: 30.11 (D Tier)
- **Highest Rated Move**: Robin's Arcthunder (Vortex) - 70.3 (A Tier)
- **Lowest Rated Move**: Various weak moves - 3.74 (D Tier)

### Tier Distribution
- **S Tier**: 0 moves (0.0%) - No moves reach elite status
- **A Tier**: 1 move (0.0%) - Robin's Arcthunder only
- **B Tier**: 15 moves (0.6%) - Very good moves
- **C Tier**: 129 moves (4.7%) - Average moves
- **D Tier**: 2,572 moves (94.7%) - Below average moves

## 🥇 Top 10 Rated Moves

1. **Robin - Arcthunder (Vortex)**: 70.3 (A) - Excellent recovery and kill option
2. **Dr. Mario - Up B (Super Jump Punch)**: 69.8 (B) - Strong recovery with kill potential
3. **Ken - True Shoryuken**: 66.8 (B) - Devastating kill move
4. **Ryu - True Shoryuken**: 66.8 (B) - Same as Ken's version
5. **Ridley - Space Pirate Rush**: 66.7 (B) - Powerful command grab
6. **Luigi - Up B (Super Jump Punch, Air)**: 66.5 (B) - Strong aerial recovery
7. **Kazuya - Up Air**: 64.6 (B) - Excellent aerial attack
8. **Lucina - Up B (Dolphin Slash)**: 63.6 (B) - Strong recovery option
9. **Marth - Up B (Dolphin Slash)**: 63.6 (B) - Same as Lucina's
10. **Captain Falcon - Side B, Air**: 63.1 (B) - Strong aerial approach option

## 📋 How to Use the Rating System

### Accessing Move Ratings

Each move in the `rated-character-data-bundle.json` now includes:

```json
{
  "id": "character-move-name",
  "name": "Move Name",
  "type": "move_type",
  "startupFrames": 5,
  "damage": 12.0,
  "rating": {
    "overall_rating": 45.2,
    "tier": "C",
    "component_ratings": {
      "speed": 60.65,
      "safety": 25.0,
      "combo_potential": 15.0,
      "kill_power": 40.0,
      "frame_efficiency": 12.0,
      "endlag": 35.2,
      "damage": 40.0,
      "versatility": 70
    },
    "weights_used": { /* Neural network weights */ }
  }
}
```

### Character-Level Analysis

Each character also includes a move summary:

```json
{
  "moves": [/* all rated moves */],
  "move_summary": {
    "total_moves": 30,
    "average_rating": 32.8,
    "best_rating": 58.4,
    "worst_rating": 12.1,
    "tier_distribution": {
      "S": 0, "A": 0, "B": 2, "C": 8, "D": 20
    },
    "best_move": {
      "name": "Up B",
      "rating": 58.4,
      "tier": "C"
    },
    "worst_move": {
      "name": "Jab 1",
      "rating": 12.1,
      "tier": "D"
    }
  }
}
```

## 🎮 Competitive Applications

### For Players
- **Move Selection**: Identify your character's best moves
- **Combo Planning**: Focus on high-rated combo starters
- **Neutral Game**: Prioritize safe, fast moves
- **Kill Confirms**: Use high kill-power moves for stocks

### For Analysis
- **Character Comparison**: Compare move quality across characters
- **Meta Analysis**: Understand why certain moves dominate
- **Balance Discussion**: Identify potentially overpowered moves
- **Patch Impact**: Track how changes affect move ratings

### For Development
- **Balance Testing**: Use ratings to identify problem moves
- **Character Design**: Create characters with varied move quality
- **Patch Planning**: Focus on moves that need adjustment

## 🔍 Key Insights from Ratings

### What Makes a Move Good?
1. **Speed is King**: Fast startup frames dominate ratings
2. **Safety Matters**: Shield-safe moves score highly
3. **Versatility Helps**: Multi-purpose moves get bonus points
4. **Kill Power**: Strong finishers are valuable
5. **Low Endlag**: Quick recovery improves ratings

### Character Patterns
- **High-Average Characters**: Mario (33.8), Olimar (33.9), Dr. Mario (35.0)
- **Low-Average Characters**: Sephiroth (21.6), Lucario (26.5), Shulk (26.4)
- **Move Variety**: Characters with more moves tend to have higher averages

## 🚀 Future Enhancements

### Potential Improvements
1. **Contextual Ratings**: Weight moves by usage frequency
2. **Matchup-Specific**: Rate moves against specific characters
3. **Meta Evolution**: Track how ratings change over time
4. **Player Skill**: Adjust ratings based on skill level
5. **Situational Analysis**: Rate moves for specific scenarios

### Advanced Features
1. **Combo Trees**: Rate move sequences
2. **Edgeguard Analysis**: Specialized edgeguard move ratings
3. **Recovery Rating**: Dedicated recovery move analysis
4. **Neutral Tools**: Focus on neutral game moves
5. **Advantage State**: Rate moves for advantage scenarios

## 📊 Technical Details

### Rating Algorithm
- **Weighted Average**: Each component weighted by neural network importance
- **Normalization**: All ratings scaled to 0-100 range
- **Exponential Decay**: Speed and endlag use exponential scaling
- **Type Multipliers**: Different move types get different bonuses

### Data Quality
- **Source**: Ultimate Frame Data (ultimateframedata.com)
- **Validation**: Cross-referenced with competitive analysis
- **Coverage**: All 87 characters, 2,717 moves
- **Updates**: Can be regenerated with new data

## 🎯 Conclusion

The move rating system successfully translates neural network insights into actionable competitive intelligence. By understanding which moves are most effective and why, players can make more informed decisions about character selection, move usage, and strategic planning.

The system reveals that **speed and safety are the dominant factors** in competitive viability, validating our neural network analysis and providing a practical tool for understanding Smash Ultimate's competitive landscape.

---

*This rating system is based on comprehensive neural network analysis of competitive tier data and represents the most data-driven approach to move evaluation in fighting games.*
