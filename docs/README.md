# 🥊 SmashMoves Move Builder

A comprehensive move builder tool for the SmashMoves roguelike fighting game. Design, manage, and link fighting moves with detailed frame data and combo systems.

## ✨ Features

- **Move Creation**: Build moves with complete frame data (startup, active, end lag, shield data)
- **Move Linker**: Create combo connections between moves
- **Rarity System**: Common, Uncommon, Rare, Epic, and Legendary move tiers
- **Search & Filter**: Find moves by name, type, or rarity
- **Local Storage**: All moves saved automatically in your browser
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   This will:
   - Start a live-reload server on port 3000
   - Automatically open your browser
   - Watch for file changes and reload automatically

### Alternative Commands

- **`npm start`**: Start with http-server (no live reload)
- **`npm run serve`**: Start on port 8080
- **`npm run build`**: No build step needed (static site)

## 🎮 How to Use

### Creating Moves
1. Fill out the **Move Creation Form** with:
   - Move name and type
   - Rarity level
   - Frame data (startup, active, end lag)
   - Shield properties
   - Damage and shield stun values
   - Special notes

2. **Link Moves**: Use the Move Linker to connect moves for combos
   - Type to search existing moves
   - Click to add combo connections
   - Remove links with the × button

3. **Save**: Click "Create Move" to add to your library

### Managing Your Library
- **Search**: Use the search bar to find moves by name or notes
- **Filter**: Filter by move type or rarity
- **View Details**: Click any move card to see full details
- **Combo Visualization**: See linked moves as chips on each card

## 📊 Move Stats Explained

- **Startup Frames**: Frames before the move becomes active
- **Active Frames**: Frames when the move can hit opponents
- **End Lag**: Recovery frames after the move completes
- **On Shield Lag**: Frame advantage/disadvantage when hitting shields
- **Damage**: Percentage damage dealt
- **Shield Stun**: Frames of shield stun inflicted

## 🎯 Rarity System

- **Common**: Basic moves (jab, light attacks) - filler moves
- **Uncommon**: Enhanced moves with small buffs
- **Rare**: Strong attacks (smash attacks, heavy aerials)
- **Epic**: Iconic power moves (Falcon Punch) - long windup, big payoff
- **Legendary**: Signature finishers and combo bridges

## 🔗 Move Linker System

The Move Linker creates combo connections:
- **Common → Uncommon**: Rough links
- **Epic → Legendary**: Smooth guaranteed strings
- **Style Synergies**: Multiple moves from same "style tree" unlock bonuses

## 💾 Data Storage

All moves are automatically saved to your browser's local storage. No server required - everything works offline!

## 🛠️ Development

This is a static website built with vanilla HTML, CSS, and JavaScript. No build process required.

### File Structure
```
smashMoves/
├── index.html          # Main application
├── styles.css          # All styling
├── script.js           # Application logic
├── package.json        # npm configuration
└── README.md          # This file
```

### Adding Features
- Edit `script.js` for functionality
- Modify `styles.css` for styling
- Update `index.html` for structure

## 📝 License

MIT License - feel free to use and modify for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on GitHub!

---

**Happy move building! 🥊**
