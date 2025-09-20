# Smash Ultimate Move Comparison Tool

An interactive web application for comparing frame data across Super Smash Bros. Ultimate characters and their moves.

## Features

### 🎮 Character Comparison
- **Side-by-side comparison** of two characters
- **Real-time stats** including total moves, average startup frames, average damage
- **Character selection** from all 87 Ultimate characters

### 🔍 Move Filtering & Sorting
- **Filter by move type**: Jab, Tilts, Smashes, Aerials, Specials, Throws
- **Sort by startup frames** or alphabetically
- **Visual indicators** for move properties

### 📊 Data Visualization
- **Interactive charts** comparing startup frames and damage
- **Bar charts** for startup frame comparison
- **Line charts** for damage comparison
- **Responsive design** that works on all devices

### 📱 Move Details
- **Click any move** to see detailed frame data
- **Modal popup** with comprehensive move information
- **Frame data breakdown**: Startup, Active, End Lag, Damage, Shield Advantage

## Usage

### Opening the Tool
1. Open `move-comparison.html` in a web browser
2. The tool will automatically load all character data

### Comparing Characters
1. **Select Character 1** from the dropdown
2. **Select Character 2** from the dropdown
3. **View side-by-side comparison** of their moves

### Filtering Moves
1. **Click filter buttons** to show only specific move types
2. **Use "All"** to show all moves
3. **Toggle sorting** between startup frames and alphabetical

### Viewing Charts
1. **Check "Show Visual Charts"** to enable charts
2. **Compare startup frames** with bar charts
3. **Compare damage** with line charts

### Move Details
1. **Click any move** to see detailed information
2. **View frame data** in organized grid
3. **Read notes** for additional move properties

## Data Source

- **Frame Data**: [Ultimate Frame Data](https://ultimateframedata.com)
- **Characters**: All 87 Ultimate characters
- **Total Moves**: 2,717 moves across all characters
- **Data Updated**: Automatically scraped from UFD

## Technical Details

### Files Structure
```
smashMoves/
├── move-comparison.html          # Main website
├── move-comparison.css           # Styling
├── move-comparison.js            # Functionality
├── character-data-bundle.json    # Combined character data
├── out/                          # Individual character files
│   ├── mario.json
│   ├── link.json
│   └── ... (87 characters)
└── scrape_ufd.py                 # Data scraping script
```

### Data Format
Each move contains:
```json
{
  "id": "character-move-name",
  "name": "Move Name",
  "type": "move-type",
  "rarity": "common",
  "startupFrames": 10,
  "activeFrames": "10-12",
  "endLag": 15,
  "onShieldLag": -5,
  "damage": 12.0,
  "shieldStun": 8,
  "notes": "Additional information",
  "links": ["source-url"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support  
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile**: ✅ Responsive design

## Performance

- **Fast loading**: Single bundled data file
- **Smooth interactions**: Optimized JavaScript
- **Responsive**: Works on all screen sizes
- **Offline capable**: All data loaded locally

## Customization

### Adding New Characters
1. Run the scraper: `python scrape_ufd.py --all --out ./out`
2. Rebuild bundle: `node create-data-bundle.js`
3. Refresh the website

### Modifying Styles
- Edit `move-comparison.css` for visual changes
- Colors, fonts, and layout can be customized

### Adding Features
- Extend `move-comparison.js` for new functionality
- Add new chart types or comparison modes

## Troubleshooting

### Data Not Loading
- Ensure `character-data-bundle.json` exists
- Check browser console for errors
- Verify file paths are correct

### Charts Not Showing
- Enable "Show Visual Charts" checkbox
- Ensure Chart.js library loads properly
- Check browser console for JavaScript errors

### Mobile Issues
- Use landscape mode for better viewing
- Some features may be limited on small screens

## Contributing

To add new features or fix issues:
1. Modify the relevant files
2. Test across different browsers
3. Update documentation as needed

## License

This tool is for educational and research purposes. Frame data is sourced from Ultimate Frame Data with appropriate attribution.
