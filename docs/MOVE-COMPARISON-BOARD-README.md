# 🎮 SmashMoves - Move Comparison Board

A comprehensive move comparison tool that uses BTL (Bradley-Terry-Luce) model ranking and neural network tier predictions to help users compare and analyze Super Smash Bros. Ultimate moves.

## ✨ Features

### 🔄 Move Comparison
- **Pairwise Comparison**: Compare two moves side-by-side with detailed analysis
- **BTL Model Ranking**: Uses Bradley-Terry-Luce model for statistical move ranking
- **Neural Network Integration**: Displays move tiers from the trained neural network
- **Same-Type Filtering**: Only compares moves of the same type (e.g., uptilt vs uptilt)

### 📊 Comprehensive Data Display
- **Frame Data**: Startup frames, endlag, active frames
- **Hitbox Data**: Shield advantage, shield stun, damage
- **Move Ratings**: Overall rating and component breakdowns
- **Neural Network Tiers**: S, A, B, C, D tier classifications

### 🏆 Tier Lists by Move Type
- **Organized by Type**: Separate tier lists for each move type (fsmash, uptilt, etc.)
- **Neural Network Rankings**: Based on trained model predictions
- **Top 20 Display**: Shows the best moves in each category

### 🔍 Advanced Search & Filtering
- **Move Type Filter**: Filter by specific move types
- **Search Functionality**: Search by move name, character, or type
- **Real-time Updates**: Instant filtering and search results

## 🧠 BTL Model Implementation

The Bradley-Terry-Luce model is used to rank moves based on pairwise comparisons. The model considers:

### Comparison Attributes
1. **Speed (30% weight)**: Startup frames (lower is better)
2. **Safety (25% weight)**: Shield advantage (higher is better)
3. **Damage (20% weight)**: Raw damage output (higher is better)
4. **Endlag (15% weight)**: Recovery frames (lower is better)
5. **Rating (10% weight)**: Overall neural network rating (higher is better)

### Algorithm Process
1. **Initialize**: All moves start with equal scores
2. **Compare**: Generate pairwise comparisons based on attributes
3. **Iterate**: Run BTL algorithm until convergence
4. **Normalize**: Scale scores to sum to 1
5. **Rank**: Sort moves by final BTL scores

## 🎯 Neural Network Integration

The comparison board integrates with the trained neural network that predicts move tiers based on:

- **Speed Analysis**: Frame data and startup times
- **Safety Metrics**: Shield advantage and frame efficiency
- **Combat Potential**: Combo potential and kill power
- **Move Characteristics**: Damage, endlag, and versatility

### Tier System
- **S Tier**: 80-100 (Excellent moves)
- **A Tier**: 70-79 (Very good moves)
- **B Tier**: 60-69 (Good moves)
- **C Tier**: 50-59 (Average moves)
- **D Tier**: 0-49 (Below average moves)

## 🚀 Usage Instructions

### Basic Comparison
1. **Select Move Type**: Choose a move type from the dropdown filter
2. **Browse Moves**: Scroll through the move database or use search
3. **Select First Move**: Click on a move to select it for comparison
4. **Select Second Move**: Click on another move of the same type
5. **View Results**: See detailed comparison with BTL ranking

### Advanced Features
- **Search Moves**: Use the search bar to find specific moves
- **View Tier Lists**: Select a move type to see the tier list
- **Compare Attributes**: See which move wins in each category
- **BTL Analysis**: View the statistical ranking results

## 📁 File Structure

```
move-comparison-board.html    # Main HTML interface
move-comparison-board.css     # Styling and responsive design
move-comparison-board.js      # JavaScript logic and BTL model
rated-character-data-bundle.json  # Move data with neural network ratings
```

## 🔧 Technical Details

### BTL Model Implementation
- **Convergence**: Iterates until score changes < 1e-6
- **Max Iterations**: 100 iterations maximum
- **Normalization**: Scores sum to 1 for probability interpretation
- **Weighted Attributes**: Multiple factors with different importance

### Data Processing
- **Real-time Filtering**: Instant move type and search filtering
- **Move Validation**: Ensures same-type comparisons only
- **Error Handling**: Graceful handling of missing data
- **Performance**: Optimized for large datasets (2700+ moves)

### Responsive Design
- **Mobile Friendly**: Works on all screen sizes
- **Touch Support**: Optimized for touch interactions
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## 🎮 Move Types Supported

- **Ground Attacks**: Jab, Forward Tilt, Up Tilt, Down Tilt, Dash Attack
- **Smash Attacks**: Forward Smash, Up Smash, Down Smash
- **Aerial Attacks**: Neutral Air, Forward Air, Back Air, Up Air, Down Air
- **Special Moves**: Neutral B, Side B, Up B, Down B
- **Grabs & Throws**: Grab, Pummel, Forward Throw, Back Throw, Up Throw, Down Throw

## 🔮 Future Features (TODO)

### Multi-Move Comparison
- **3-5 Move Comparison**: Compare multiple moves simultaneously
- **Tournament Style**: Choose the best move from a group
- **Advanced Filtering**: Filter by multiple criteria
- **Custom Weighting**: Adjust BTL model weights

### Enhanced Analysis
- **Matchup Analysis**: Compare moves against specific characters
- **Meta Analysis**: Track move usage in competitive play
- **Patch Impact**: Show how balance changes affect move rankings
- **Export Results**: Save comparison results and tier lists

## 🎯 Use Cases

### For Players
- **Character Selection**: Find the best moves for your character
- **Matchup Preparation**: Understand move advantages
- **Training Focus**: Identify moves to practice
- **Meta Understanding**: Learn which moves are strongest

### For Developers
- **Balance Analysis**: Identify overpowered or underpowered moves
- **Data Validation**: Verify neural network predictions
- **Feature Engineering**: Understand what makes moves good
- **Algorithm Testing**: Test BTL model effectiveness

## 📊 Data Sources

- **Ultimate Frame Data**: Comprehensive frame data for all characters
- **Neural Network Analysis**: Trained model predictions
- **Character Statistics**: Weight, speed, and mobility data
- **Competitive Analysis**: Tier rankings and meta data

## 🏆 Key Insights

The comparison board reveals several important patterns:

1. **Speed Dominance**: Fast startup frames are the strongest predictor of move quality
2. **Safety Matters**: Moves safe on shield rank significantly higher
3. **Damage vs Speed**: There's a trade-off between damage and speed
4. **Character Context**: Same moves perform differently across characters
5. **Meta Relevance**: Neural network tiers align with competitive usage

---

*This tool demonstrates the successful integration of machine learning, statistical modeling, and game data analysis to create a comprehensive move comparison system for Super Smash Bros. Ultimate.*
