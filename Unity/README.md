# SmashMoves Unity Implementation

This directory contains the complete Unity implementation for the SmashMoves roguelike fighting game hitbox system.

## 📁 File Structure

```
Unity/
├── Scripts/
│   ├── MoveData.cs              # Data structures for moves and hitboxes
│   ├── HitboxController.cs      # Main hitbox management system
│   ├── Hitbox.cs               # Individual hitbox component
│   ├── MoveDataLoader.cs       # JSON data loading and management
│   ├── Health.cs               # Health and damage system
│   ├── Shield.cs               # Shield and blocking system
│   ├── CharacterController.cs  # Character movement and state
│   └── PlayerController.cs     # Player input and move execution
└── README.md                   # This file
```

## 🚀 Quick Setup

### 1. Create a Character GameObject
1. Create an empty GameObject named "Player"
2. Add the following components:
   - `PlayerController`
   - `HitboxController`
   - `Health`
   - `Shield`
   - `CharacterController` (custom)
   - `Rigidbody`
   - `BoxCollider`

### 2. Set up Move Data
1. Create a `MoveDataLoader` GameObject
2. Assign the `smashmoves-moveset.json` file to the `moveDataFile` field
3. The system will automatically load all moves on Start

### 3. Configure HitboxController
1. Set `maxHitboxes` to 10 (or desired number)
2. Enable `showDebugInfo` for testing
3. Enable `showHitboxGizmos` to see hitboxes in Scene view

### 4. Input Setup
The default controls are:
- **J** - Light Attack (Jab)
- **K** - Heavy Attack (Forward Smash)
- **L** - Special Attack (Falcon Punch)
- **Space** - Block/Shield
- **WASD/Arrow Keys** - Movement
- **Shift** - Dash

## 🎯 Core Features

### **Frame-Perfect Hitboxes**
- Hitboxes activate on exact frames based on your move data
- No animations required - purely data-driven
- Visual debugging with semi-transparent hitbox cubes

### **Complete Fighting Game Systems**
- **Health System** - Damage, healing, death
- **Shield System** - Blocking, shield stun, regeneration
- **Hitstun System** - Frame-perfect hitstun application
- **Knockback System** - Damage-based knockback scaling

### **JSON Integration**
- Loads moves directly from your move builder JSON files
- Supports multiple JSON files
- Automatic validation and error handling

### **Roguelike Ready**
- Get moves by rarity for draft systems
- Combo system with move linking
- Random move selection
- Draft pool generation

## 🔧 Usage Examples

### **Execute a Move**
```csharp
PlayerController player = GetComponent<PlayerController>();
player.ExecuteMove("jab-basic");
```

### **Get Random Move by Rarity**
```csharp
MoveDataLoader loader = FindObjectOfType<MoveDataLoader>();
var epicMoves = loader.GetMovesByRarity(Rarity.Epic);
MoveData randomEpic = epicMoves[Random.Range(0, epicMoves.Count)];
```

### **Get Combo Options**
```csharp
var comboOptions = loader.GetMovesThatLinkFrom("jab-basic");
// Returns all moves that can combo from jab
```

### **Create Draft Pool**
```csharp
var draftPool = loader.GetDraftPool(5, new Rarity[] { Rarity.Common, Rarity.Uncommon });
// Returns 5 random moves of Common or Uncommon rarity
```

## 📊 JSON Format

The system uses your existing JSON format with added hitbox data:

```json
{
  "id": "jab-basic",
  "name": "Jab",
  "type": "normal",
  "rarity": "common",
  "startupFrames": 3,
  "activeFrames": 2,
  "endLag": 15,
  "onShieldLag": -2,
  "damage": 2.0,
  "shieldStun": 2,
  "notes": "Basic jab attack",
  "links": [],
  "hitboxes": [
    {
      "frame": 0,
      "offset": {"x": 1.0, "y": 0, "z": 0},
      "size": {"x": 1.5, "y": 1.0, "z": 0.5},
      "angle": 0,
      "baseKnockback": 5.0,
      "knockbackGrowth": 0.8,
      "hitstun": 8,
      "canHitMultipleTimes": false,
      "hitEffect": "jab_hit"
    }
  ]
}
```

## 🎮 Testing

### **Visual Debugging**
1. Enable `showHitboxGizmos` on HitboxController
2. Enable `showDebugInfo` on PlayerController
3. Run the game and execute moves
4. Hitboxes will appear as red wireframes in Scene view

### **Console Output**
- Move execution logs
- Hit detection logs
- Damage application logs
- Combo system logs

## 🔗 Integration with Move Builder

1. **Export moves** from your move builder website
2. **Import JSON** into Unity project
3. **Assign to MoveDataLoader**
4. **Test moves** in Unity
5. **Iterate and balance** using the move builder

## 🛠️ Customization

### **Adding New Move Types**
1. Add enum values to `MoveType` in `MoveData.cs`
2. Update validation in `MoveDataLoader.cs`
3. Add handling in `PlayerController.cs`

### **Custom Hit Effects**
1. Create effect prefabs in `Resources/Effects/`
2. Reference by name in hitbox data
3. System will automatically instantiate effects

### **Advanced Hitbox Types**
- **Projectiles** - Set `isProjectile: true` in hitbox data
- **Multi-hit** - Set `canHitMultipleTimes: true`
- **Custom angles** - Set specific knockback angles

## 🐛 Troubleshooting

### **Moves Not Loading**
- Check JSON file is assigned to MoveDataLoader
- Verify JSON format is valid
- Check console for validation errors

### **Hitboxes Not Appearing**
- Ensure HitboxController has maxHitboxes > 0
- Check showHitboxGizmos is enabled
- Verify hitbox frame data is within move duration

### **Input Not Working**
- Check PlayerController has all required components
- Verify input keys are not conflicting
- Ensure character is not in hitstun

## 🚀 Next Steps

1. **Create visual effects** for hit impacts
2. **Add sound effects** for moves and hits
3. **Implement AI** using the same move system
4. **Create UI** for move selection and combo display
5. **Add particle systems** for special effects

This implementation provides a solid foundation for your SmashMoves roguelike fighting game with frame-perfect hitboxes and complete fighting game mechanics!
