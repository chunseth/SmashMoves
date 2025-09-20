# Firebase Conversion Guide for SmashMoves

## 🔄 Converting Your Existing Project to Firebase

This guide will help you convert your existing SmashMoves Unity project to use Firebase for cloud-based move management.

## 📋 Pre-Conversion Checklist

Before starting the conversion, ensure you have:
- [ ] Existing Unity project with SmashMoves scripts
- [ ] Firebase project created at [console.firebase.google.com](https://console.firebase.google.com/)
- [ ] Database URL: `https://smashmoves-default-rtdb.firebaseio.com/`
- [ ] Your existing `smashmoves-moveset.json` file

## 🚀 Step-by-Step Conversion

### **Step 1: Import Firebase SDK**

1. **Download Firebase Unity SDK**
   - Go to [Firebase Unity SDK Downloads](https://firebase.google.com/download/unity)
   - Download the latest version
   - Extract the downloaded file

2. **Import Required Packages**
   - In Unity: `Assets → Import Package → Custom Package`
   - Import `FirebaseDatabase.unitypackage`
   - Import `FirebaseAuth.unitypackage` (optional, for future user features)

### **Step 2: Add Firebase Scripts**

1. **Copy New Scripts**
   - Copy `FirebaseManager.cs` to `Assets/Scripts/`
   - Copy `FirebaseMoveDataLoader.cs` to `Assets/Scripts/`
   - Copy `FirebaseMoveBuilder.cs` to `Assets/Scripts/`

2. **Keep Existing Scripts**
   - Keep all your existing scripts (MoveData.cs, HitboxController.cs, etc.)
   - The Firebase scripts work alongside your existing system

### **Step 3: Set Up Firebase Configuration**

1. **Create Firebase Manager**
   - Right-click in Hierarchy → Create Empty
   - Name it "FirebaseManager"
   - Add `FirebaseManager` script
   - Set Database URL: `https://smashmoves-default-rtdb.firebaseio.com/`
   - Enable "Show Debug Info"

2. **Create Firebase Move Data Loader**
   - Right-click in Hierarchy → Create Empty
   - Name it "FirebaseMoveDataLoader"
   - Add `FirebaseMoveDataLoader` script
   - Assign FirebaseManager reference
   - Enable "Use Local Fallback"

### **Step 4: Update Existing Components**

1. **Update PlayerController**
   - Find your existing PlayerController component
   - Change "Move Data Loader" reference from old `MoveDataLoader` to `FirebaseMoveDataLoader`
   - This is the only change needed in your existing player system

2. **Set Up Local Fallback**
   - Copy your existing `smashmoves-moveset.json` to `Assets/StreamingAssets/`
   - In FirebaseMoveDataLoader, assign this file to "Local Move Data File"
   - This ensures moves load even if Firebase is unavailable

### **Step 5: Configure Firebase Database**

1. **Set Up Database Rules**
   - Go to Firebase Console → Realtime Database → Rules
   - Replace with these rules for development:

```json
{
  "rules": {
    "moves": {
      "$moveId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['moveId', 'moveName', 'moveType', 'rarity'])"
      }
    },
    "collections": {
      "$collectionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

2. **Publish Rules**
   - Click "Publish" to apply the rules

### **Step 6: Test the Conversion**

1. **Run Your Scene**
   - Play the scene
   - Check console for "Firebase initialized successfully"
   - Verify moves load (either from Firebase or local fallback)

2. **Test Existing Functionality**
   - All your existing controls should work exactly the same
   - J/K/L for attacks, Space for block, WASD for movement
   - Hitboxes should appear and work as before

## 🔧 Migration Strategies

### **Option 1: Gradual Migration (Recommended)**

1. **Keep Local Fallback**
   - Your existing JSON file serves as fallback
   - Firebase loads first, falls back to local if needed
   - No risk of losing existing functionality

2. **Test Firebase Features**
   - Use FirebaseMoveBuilder to create new moves
   - Save moves to Firebase
   - Test loading moves from Firebase

3. **Migrate Existing Moves**
   - Use the Firebase system to save your existing moves
   - Gradually move from local JSON to Firebase storage

### **Option 2: Complete Migration**

1. **Upload Existing Moves**
   - Use Firebase console to upload your existing JSON data
   - Or use FirebaseMoveBuilder to save moves programmatically

2. **Remove Local Fallback**
   - Once Firebase is working, disable local fallback
   - All moves will come from Firebase

## 📊 Database Structure

Your Firebase database will have this structure:

```json
{
  "moves": {
    "jab-basic": {
      "moveId": "jab-basic",
      "moveName": "Jab",
      "moveType": "Normal",
      "rarity": "Common",
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
      ],
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

## 🎮 New Firebase Features

### **Move Management**
- **Save moves** to Firebase from Unity
- **Load moves** from Firebase
- **Update moves** with new data
- **Delete moves** from Firebase
- **Share moves** between players

### **Real-time Updates**
- **Live move updates** across all clients
- **Collaborative move creation**
- **Community move sharing**

### **Advanced Queries**
- **Load moves by rarity** for roguelike drafting
- **Load moves by type** for specific categories
- **Get combo options** for move linking
- **Random move selection** for variety

## 🐛 Troubleshooting Conversion

### **Common Issues:**

1. **Firebase Not Initializing**
   - Check internet connection
   - Verify database URL is correct
   - Check Firebase console for database status

2. **Moves Not Loading**
   - Check console for Firebase connection status
   - Verify local fallback file is in correct location
   - Check FirebaseMoveDataLoader has FirebaseManager assigned

3. **Existing Functionality Broken**
   - Ensure PlayerController references FirebaseMoveDataLoader
   - Check all existing components are still present
   - Verify input system is unchanged

4. **Script Compilation Errors**
   - Ensure Firebase SDK is properly imported
   - Check for missing using statements
   - Verify all Firebase scripts are in correct location

### **Rollback Plan**

If you need to rollback to the original system:
1. Remove FirebaseManager and FirebaseMoveDataLoader GameObjects
2. Change PlayerController back to reference original MoveDataLoader
3. Your original system will work exactly as before

## ✅ Post-Conversion Checklist

After conversion, verify:
- [ ] Firebase initializes successfully
- [ ] Moves load from Firebase or local fallback
- [ ] All existing controls work (J/K/L attacks, movement, blocking)
- [ ] Hitboxes appear and function correctly
- [ ] Console shows Firebase connection status
- [ ] No errors in console
- [ ] Existing move data is preserved

## 🚀 Next Steps

1. **Test Firebase Features**
   - Create new moves using FirebaseMoveBuilder
   - Save moves to Firebase
   - Test move sharing

2. **Integrate with Web Move Builder**
   - Connect your web move builder to Firebase
   - Enable real-time sync between web and Unity

3. **Add Advanced Features**
   - User authentication
   - Move collections
   - Community sharing
   - Real-time collaboration

## 📞 Support

If you encounter issues during conversion:
1. Check the console for specific error messages
2. Verify Firebase console shows your database
3. Test with local fallback enabled
4. Ensure all scripts are properly imported

The conversion maintains full backward compatibility while adding powerful cloud-based features to your SmashMoves project!
