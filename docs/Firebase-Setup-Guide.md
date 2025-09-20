# Firebase Setup Guide for SmashMoves

## 🔥 Firebase Project Setup

### **Step 1: Create Firebase Project**

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"

2. **Configure Project**
   - Project name: `SmashMoves`
   - Enable Google Analytics (optional)
   - Choose Analytics account (optional)
   - Click "Create project"

### **Step 2: Enable Realtime Database**

1. **Navigate to Realtime Database**
   - In Firebase Console, click "Realtime Database" in left sidebar
   - Click "Create Database"

2. **Configure Database**
   - Choose location: `us-central1` (or closest to your users)
   - Start in test mode (we'll secure it later)
   - Click "Done"

3. **Get Database URL**
   - Copy the database URL: `https://smashmoves-default-rtdb.firebaseio.com/`
   - This matches your existing database URL

### **Step 3: Unity Firebase SDK Setup**

1. **Download Firebase Unity SDK**
   - Go to [Firebase Unity SDK](https://firebase.google.com/download/unity)
   - Download the latest version
   - Extract the downloaded file

2. **Import Firebase SDK**
   - In Unity, go to `Assets → Import Package → Custom Package`
   - Navigate to extracted Firebase folder
   - Import `FirebaseDatabase.unitypackage`
   - Import `FirebaseAuth.unitypackage` (optional, for user authentication)

3. **Configure Firebase for Unity**
   - Go to Firebase Console → Project Settings
   - Scroll down to "Your apps" section
   - Click "Add app" → Unity icon
   - Register your Unity app:
     - App nickname: `SmashMoves Unity`
     - App ID: `com.yourcompany.smashmoves` (or your preferred bundle ID)
   - Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)

4. **Add Configuration Files**
   - **Android**: Place `google-services.json` in `Assets/Plugins/Android/`
   - **iOS**: Place `GoogleService-Info.plist` in `Assets/StreamingAssets/`

### **Step 4: Database Security Rules**

1. **Set Up Security Rules**
   - In Firebase Console → Realtime Database → Rules
   - Replace default rules with:

```json
{
  "rules": {
    "moves": {
      "$moveId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['moveId', 'moveName', 'moveType', 'rarity', 'startupFrames', 'activeFrames', 'endLag', 'onShieldLag', 'damage', 'shieldStun'])"
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

## 🚀 Unity Implementation

### **Step 1: Add Firebase Scripts**

1. **Copy Firebase Scripts**
   - Copy `FirebaseManager.cs` to `Assets/Scripts/`
   - Copy `FirebaseMoveDataLoader.cs` to `Assets/Scripts/`
   - Copy `FirebaseMoveBuilder.cs` to `Assets/Scripts/`

2. **Update Existing Scripts**
   - Replace `MoveDataLoader` with `FirebaseMoveDataLoader` in your scene
   - Update `PlayerController` to use `FirebaseMoveDataLoader`

### **Step 2: Set Up Firebase Manager**

1. **Create Firebase Manager GameObject**
   - Right-click in Hierarchy → Create Empty
   - Name it "FirebaseManager"
   - Add `FirebaseManager` script

2. **Configure Firebase Manager**
   - Database URL: `https://smashmoves-default-rtdb.firebaseio.com/`
   - Show Debug Info: ✓

### **Step 3: Update Move Data Loader**

1. **Replace MoveDataLoader**
   - Remove old `MoveDataLoader` component
   - Add `FirebaseMoveDataLoader` component
   - Assign `FirebaseManager` reference
   - Set local fallback file (your existing JSON)

2. **Configure Fallback**
   - Use Local Fallback: ✓
   - Local Move Data File: Assign your `smashmoves-moveset.json`

### **Step 4: Test Firebase Connection**

1. **Run the Scene**
   - Check console for "Firebase initialized successfully"
   - Verify moves load from Firebase or fallback to local

2. **Test Database Operations**
   - Create new moves using `FirebaseMoveBuilder`
   - Save moves to Firebase
   - Load moves from Firebase
   - Delete moves from Firebase

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
  },
  "collections": {
    "SmashMoves Complete Moveset": {
      "formatVersion": "1.0",
      "description": "Complete move collection",
      "metadata": {
        "name": "SmashMoves Complete Moveset",
        "author": "SmashMoves Team",
        "version": "1.0.0",
        "totalMoves": 25
      },
      "moves": [...]
    }
  }
}
```

## 🔧 Usage Examples

### **Save Move to Firebase**
```csharp
FirebaseManager firebaseManager = FindObjectOfType<FirebaseManager>();
MoveData newMove = new MoveData { /* move data */ };
bool success = await firebaseManager.SaveMove(newMove);
```

### **Load Move from Firebase**
```csharp
MoveData move = await firebaseManager.LoadMove("jab-basic");
```

### **Load All Moves**
```csharp
List<MoveData> moves = await firebaseManager.LoadAllMoves();
```

### **Load Moves by Rarity**
```csharp
List<MoveData> epicMoves = await firebaseManager.LoadMovesByRarity(Rarity.Epic);
```

## 🛡️ Security Considerations

### **Production Security Rules**
For production, update your Firebase rules to be more restrictive:

```json
{
  "rules": {
    "moves": {
      "$moveId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == 'admin-user-id'",
        ".validate": "newData.hasChildren(['moveId', 'moveName', 'moveType', 'rarity'])"
      }
    }
  }
}
```

### **Authentication (Optional)**
- Add Firebase Auth for user management
- Implement admin authentication for move creation
- Add user-specific move collections

## 🐛 Troubleshooting

### **Common Issues:**

1. **Firebase Not Initializing**
   - Check internet connection
   - Verify database URL is correct
   - Ensure Firebase SDK is properly imported

2. **Database Permission Denied**
   - Check Firebase security rules
   - Verify database is in test mode
   - Check console for specific error messages

3. **Moves Not Loading**
   - Check Firebase console for data
   - Verify JSON format matches expected structure
   - Check console for validation errors

4. **Unity Build Issues**
   - Ensure configuration files are in correct locations
   - Check platform-specific settings
   - Verify Firebase SDK compatibility

## 🚀 Next Steps

1. **Add User Authentication**
   - Implement Firebase Auth
   - Add user-specific move collections
   - Create admin panel for move management

2. **Add Real-time Updates**
   - Listen for database changes
   - Update UI in real-time
   - Sync moves across multiple clients

3. **Add Move Sharing**
   - Generate shareable move links
   - Import/export move collections
   - Community move sharing

4. **Add Analytics**
   - Track move usage
   - Monitor database performance
   - User behavior analytics

This setup provides a robust cloud-based move management system that integrates seamlessly with your existing Unity hitbox system!
