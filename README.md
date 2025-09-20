# SmashMoves - Super Smash Bros. Ultimate Move Comparison & Tier Lists

A comprehensive web application for comparing Super Smash Bros. Ultimate moves and generating BTL (Bradley-Terry-Luce) based tier lists.

## 📁 Project Structure

```
smashMoves/
├── index.html                    # Main entry point
├── package.json                  # Node.js dependencies
├── package-lock.json            # Dependency lock file
├── src/                         # Source code
│   ├── web/                     # Web application files
│   │   ├── comparison.html      # Move comparison interface
│   │   ├── comparison.css       # Comparison page styles
│   │   ├── comparison.js        # Comparison logic
│   │   ├── tier-list.html       # Tier list display
│   │   ├── tier-list.css        # Tier list styles
│   │   ├── tier-list.js         # Tier list logic
│   │   ├── move-comparison-board.html  # Advanced comparison board
│   │   ├── move-comparison-board.css   # Board styles
│   │   ├── move-comparison-board.js    # Board logic
│   │   ├── move-comparison.html        # Legacy comparison page
│   │   ├── move-comparison.css         # Legacy styles
│   │   ├── move-comparison.js          # Legacy logic
│   │   ├── index.html                  # Dashboard
│   │   ├── index.css                   # Dashboard styles
│   │   ├── index.js                    # Dashboard logic
│   │   ├── create-data-bundle.js       # Data bundling script
│   │   ├── script.js                   # Utility scripts
│   │   └── styles.css                  # Global styles
│   ├── scripts/                 # Python & analysis scripts
│   │   ├── btl-model-demo.py           # BTL model demonstration
│   │   ├── create_enhanced_bundle.py   # Enhanced data creation
│   │   ├── create_move_ratings.py      # Move rating generation
│   │   ├── create_relative_move_ratings.py  # Relative ratings
│   │   ├── create_tier_dataset.py      # Tier dataset creation
│   │   ├── scrape_hitboxes.py          # Hitbox data scraping
│   │   ├── scrape_stats.py             # Statistics scraping
│   │   ├── scrape_ufd.py               # Ultimate Frame Data scraping
│   │   └── tier_prediction_neural_network.py  # Neural network training
│   ├── analysis/                # Analysis tools (empty)
│   └── data/                    # Data processing (empty)
├── assets/                      # Static assets
│   ├── data/                    # Data files
│   │   ├── character-data-bundle.json      # Main character data
│   │   ├── rated-character-data-bundle.json # Rated character data
│   │   ├── relative-rated-character-data-bundle.json # Relative ratings
│   │   ├── enhanced-character-data-bundle.json # Enhanced data
│   │   ├── tier-enhanced-character-data.json # Tier-enhanced data
│   │   ├── character-stats.json           # Character statistics
│   │   ├── moves-format.json             # Move format specification
│   │   ├── neural_network_training_data.json # Training data
│   │   ├── smashmoves-moveset.json       # Unity moveset
│   │   └── out/                          # Individual character files
│   │       ├── mario.json
│   │       ├── link.json
│   │       └── ... (87 characters)
│   └── images/                  # Images and graphics
│       └── tier_prediction_results.png   # Neural network results
├── docs/                        # Documentation
│   ├── README.md                        # Main documentation
│   ├── EXCLUSIVE-COMPARISON-README.md   # Comparison system docs
│   ├── Firebase-Conversion-Guide.md     # Firebase setup
│   ├── Firebase-Setup-Guide.md          # Firebase configuration
│   ├── MOVE_RATING_SYSTEM_GUIDE.md     # Rating system docs
│   ├── MOVE-COMPARISON-BOARD-README.md # Board documentation
│   ├── MOVE-COMPARISON-IMPLEMENTATION-SUMMARY.md # Implementation
│   ├── MOVE-COMPARISON-README.md       # Comparison docs
│   ├── NEURAL_NETWORK_ANALYSIS_SUMMARY.md # Neural network docs
│   ├── RELATIVE_MOVE_RATING_SYSTEM.md  # Relative rating docs
│   ├── Unity-Hitbox-Implementation.md  # Unity implementation
│   └── Unity-Implementation-Guide.md   # Unity setup guide
├── Unity/                       # Unity game implementation
│   ├── README.md                        # Unity documentation
│   └── Scripts/                         # Unity C# scripts
│       ├── CharacterController.cs       # Character control
│       ├── FirebaseManager.cs           # Firebase integration
│       ├── FirebaseMoveBuilder.cs       # Move data builder
│       ├── FirebaseMoveDataLoader.cs    # Data loader
│       ├── Health.cs                    # Health system
│       ├── Hitbox.cs                    # Hitbox component
│       ├── HitboxController.cs          # Hitbox management
│       ├── MoveData.cs                  # Move data structure
│       ├── MoveDataLoader.cs            # Move data loading
│       ├── PlayerController.cs          # Player input
│       └── Shield.cs                    # Shield system
└── node_modules/                # Node.js dependencies
```

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   python3 -m http.server 8000
   ```

2. **Open your browser:**
   ```
   http://localhost:8000
   ```

3. **Navigate the application:**
   - **Main Dashboard**: Overview and navigation
   - **Move Comparison**: Compare moves and build BTL rankings
   - **Tier Lists**: View BTL-based tier lists by move type
   - **Advanced Board**: Detailed comparison interface

## 🎯 Key Features

### Move Comparison System
- **Random move comparisons** with instant feedback
- **BTL model integration** for ranking moves
- **Multi-part move support** with navigation arrows
- **Real-time tier list updates** based on user choices

### Tier List Generation
- **BTL-based rankings** from user comparison data
- **Character sprite display** organized by tiers (S, A, B, C, D, F)
- **Move type filtering** for focused comparisons
- **Dynamic updates** as more comparisons are made

### Data Management
- **87 characters** with 2,717+ moves
- **Comprehensive frame data** from Ultimate Frame Data
- **Neural network ratings** as fallback when no user data exists
- **Local storage** for user choices and preferences

## 🔧 Development

### Data Processing
- **Python scripts** in `src/scripts/` for data scraping and processing
- **JSON data files** in `assets/data/` for web application
- **Unity integration** for game implementation

### Web Application
- **Vanilla JavaScript** for frontend logic
- **CSS Grid/Flexbox** for responsive design
- **Local Storage API** for data persistence
- **Fetch API** for data loading

## 📊 BTL Model

The Bradley-Terry-Luce model is used to rank moves based on user comparison choices:

1. **User makes comparisons** between moves
2. **Win/loss records** are tracked for each move
3. **BTL scores** are calculated based on win rates and confidence
4. **Tier lists** are generated using percentile-based grouping
5. **Real-time updates** reflect new comparison data

## 🎮 Unity Integration

The project includes a complete Unity implementation for:
- **Hitbox visualization** and management
- **Move data integration** from web application
- **Firebase connectivity** for data synchronization
- **Complete fighting game systems** (health, shield, etc.)

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:
- **Setup guides** for web and Unity applications
- **API documentation** for data structures
- **Implementation guides** for extending functionality
- **Analysis summaries** for understanding the rating systems

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📄 License

This project is open source and available under the MIT License.
