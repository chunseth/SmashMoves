# SmashMoves Unity Implementation Guide (Firebase Version)

## 🚀 Step-by-Step Implementation

### **Step 1: Set Up Unity Project**

1. **Create New Unity Project**
   - Open Unity Hub
   - Click "New Project"
   - Select "3D" template
   - Name it "SmashMoves"
   - Click "Create Project"

2. **Import Firebase SDK**
   - Download Firebase Unity SDK from [Firebase Downloads](https://firebase.google.com/download/unity)
   - Import `FirebaseDatabase.unitypackage`
   - Import `FirebaseAuth.unitypackage` (optional)

3. **Import Scripts**
   - Create folder: `Assets/Scripts/`
   - Copy all the C# scripts from `Unity/Scripts/` into `Assets/Scripts/`
   - Unity will automatically compile the scripts

### **Step 2: Create Basic Scene**

1. **Create Ground**
   - Right-click in Hierarchy → 3D Object → Plane
   - Name it "Ground"
   - Scale to (10, 1, 10)
   - Add Tag "Ground" to the Ground object

2. **Create Player Character**
   - Right-click in Hierarchy → 3D Object → Capsule
   - Name it "Player"
   - Position at (0, 1, 0)
   - Add Tag "Player"

### **Step 3: Set Up Player Components**

1. **Add Required Components to Player:**
   ```
   Player (Capsule)
   ├── PlayerController (Script)
   ├── HitboxController (Script)
   ├── Health (Script)
   ├── Shield (Script)
   ├── CharacterController (Script) - Custom
   ├── Rigidbody
   └── BoxCollider
   ```

2. **Configure Each Component:**

   **Rigidbody:**
   - Mass: 1
   - Drag: 5
   - Angular Drag: 5
   - Use Gravity: ✓
   - Freeze Rotation: X, Y, Z

   **BoxCollider:**
   - Size: (1, 2, 1)
   - Center: (0, 0, 0)

   **Health:**
   - Max Health: 100
   - Show Debug Info: ✓

   **Shield:**
   - Max Shield Health: 100
   - Shield Regen Rate: 10
   - Show Debug Info: ✓

   **CharacterController:**
   - Move Speed: 5
   - Jump Force: 10
   - Dash Speed: 15
   - Show Debug Info: ✓

   **HitboxController:**
   - Max Hitboxes: 10
   - Show Debug Info: ✓
   - Show Hitbox Gizmos: ✓

   **PlayerController:**
   - Show Debug Info: ✓

### **Step 4: Set Up Firebase System**

1. **Create Firebase Manager GameObject:**
   - Right-click in Hierarchy → Create Empty
   - Name it "FirebaseManager"
   - Add `FirebaseManager` script
   - Set Database URL to: `https://smashmoves-default-rtdb.firebaseio.com/`
   - Enable "Show Debug Info"

2. **Create Firebase Move Data Loader:**
   - Right-click in Hierarchy → Create Empty
   - Name it "FirebaseMoveDataLoader"
   - Add `FirebaseMoveDataLoader` script
   - Assign FirebaseManager reference
   - Enable "Use Local Fallback"

3. **Set Up Local Fallback:**
   - Copy `smashmoves-moveset.json` to `Assets/StreamingAssets/`
   - Create folder `Assets/StreamingAssets/` if it doesn't exist
   - In FirebaseMoveDataLoader, assign the JSON file to "Local Move Data File"

### **Step 5: Update Player Controller**

1. **Update PlayerController References:**
   - In PlayerController component, change "Move Data Loader" reference
   - Assign the "FirebaseMoveDataLoader" instead of the old MoveDataLoader
   - This enables Firebase integration with your existing player system

### **Step 6: Configure Input System**

1. **Set Up Input Keys:**
   - In PlayerController component, configure:
     - Light Attack Key: J
     - Heavy Attack Key: K
     - Special Attack Key: L
     - Block Key: Space

2. **Test Basic Movement:**
   - WASD or Arrow Keys for movement
   - Space for jumping
   - Left Shift for dashing

### **Step 7: Create Test Environment**

1. **Add Test Target:**
   - Right-click in Hierarchy → 3D Object → Cube
   - Name it "TestTarget"
   - Position at (3, 1, 0)
   - Add components:
     - `Health` script
     - `Rigidbody`
     - Tag: "Enemy"

2. **Configure TestTarget:**
   - Health: Max Health = 100, Show Debug Info = ✓
   - Rigidbody: Use Gravity = ✓

### **Step 8: Test the System**

1. **Play the Scene**
2. **Test Basic Functionality:**
   - Move with WASD
   - Jump with Space
   - Dash with Left Shift
   - Attack with J, K, L
   - Block with Space (hold)

3. **Check Console Output:**
   - Firebase initialization logs
   - Move loading from Firebase or local fallback
   - Move execution logs
   - Hit detection logs
   - Damage application logs

### **Step 9: Visual Debugging**

1. **Enable Hitbox Visualization:**
   - In Scene view, you should see red wireframes when moves are active
   - Hitboxes appear as semi-transparent red cubes

2. **Debug Information:**
   - Console shows Firebase connection status
   - Move loading from Firebase or local fallback
   - Detailed move execution
   - Frame-by-frame hitbox activation
   - Damage and knockback calculations

## 🔧 Troubleshooting

### **Common Issues:**

1. **Scripts Not Compiling:**
   - Check for syntax errors in console
   - Ensure all scripts are in `Assets/Scripts/` folder
   - Wait for Unity to finish compiling

2. **Moves Not Loading:**
   - Check Firebase connection in console
   - Verify JSON file is in `Assets/StreamingAssets/` (fallback)
   - Check FirebaseMoveDataLoader has FirebaseManager assigned
   - Look for validation errors in console

3. **Hitboxes Not Appearing:**
   - Ensure HitboxController has `Show Hitbox Gizmos` enabled
   - Check that moves have valid hitbox data
   - Verify hitbox frame data is within move duration

4. **Input Not Working:**
   - Check PlayerController has all required components
   - Verify input keys are not conflicting
   - Ensure character is not in hitstun

5. **Firebase Connection Issues:**
   - Check internet connection
   - Verify database URL is correct
   - Check Firebase console for database status
   - Ensure Firebase SDK is properly imported

### **Debug Steps:**

1. **Check Component Setup:**
   ```
   Player should have:
   ✓ PlayerController
   ✓ HitboxController  
   ✓ Health
   ✓ Shield
   ✓ CharacterController (custom)
   ✓ Rigidbody
   ✓ BoxCollider
   
   Scene should have:
   ✓ FirebaseManager
   ✓ FirebaseMoveDataLoader
   ```

2. **Verify Firebase Loading:**
   - Console should show "Firebase initialized successfully"
   - Console should show "Loaded X moves from Firebase" or "Loaded X moves from local file"
   - No validation errors should appear

3. **Test Move Execution:**
   - Press J to execute jab
   - Console should show "Starting move: Jab"
   - Red hitbox should appear in Scene view

## 🎮 Testing Checklist

- [ ] Player can move with WASD
- [ ] Player can jump with Space
- [ ] Player can dash with Left Shift
- [ ] J key executes jab move
- [ ] K key executes forward smash
- [ ] L key executes falcon punch
- [ ] Space key blocks (hold)
- [ ] Hitboxes appear as red wireframes
- [ ] Console shows move execution logs
- [ ] TestTarget takes damage when hit
- [ ] TestTarget gets knocked back
- [ ] Shield blocks reduce damage
- [ ] Firebase initializes successfully
- [ ] Moves load from Firebase or local fallback
- [ ] Console shows Firebase connection status

## 🚀 Next Steps

1. **Create Visual Effects:**
   - Add particle systems for hit effects
   - Create impact effects for different move types

2. **Add Sound Effects:**
   - Import audio files for moves
   - Add AudioSource components
   - Trigger sounds on hit

3. **Create UI:**
   - Health bars
   - Move cooldown indicators
   - Combo counters

4. **Add AI:**
   - Create enemy AI using same move system
   - Implement basic combat AI

5. **Firebase Features:**
   - Add move sharing between players
   - Implement real-time move updates
   - Create move collections and sharing
   - Add user authentication

6. **Polish:**
   - Add animations (optional)
   - Improve visual feedback
   - Add screen shake effects

## 📁 Final Project Structure

```
Assets/
├── Scripts/
│   ├── MoveData.cs
│   ├── HitboxController.cs
│   ├── Hitbox.cs
│   ├── FirebaseManager.cs
│   ├── FirebaseMoveDataLoader.cs
│   ├── FirebaseMoveBuilder.cs
│   ├── Health.cs
│   ├── Shield.cs
│   ├── CharacterController.cs
│   └── PlayerController.cs
├── StreamingAssets/
│   └── smashmoves-moveset.json (fallback)
├── Plugins/
│   └── Android/
│       └── google-services.json (Android)
└── Scenes/
    └── Main.unity
```

## 🎯 Success Criteria

Your implementation is working correctly when:
- ✅ Player can execute moves with frame-perfect timing
- ✅ Hitboxes appear and disappear on correct frames
- ✅ Damage is applied correctly with knockback
- ✅ Shield system blocks attacks
- ✅ Console shows detailed move execution
- ✅ Firebase initializes and connects successfully
- ✅ Moves load from Firebase or local fallback
- ✅ Visual debugging shows hitbox positions
- ✅ Database operations (save/load/update) work correctly

This Firebase-integrated implementation provides a solid foundation for your SmashMoves roguelike fighting game with cloud-based move management!
