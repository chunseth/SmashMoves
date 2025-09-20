# Firebase Integration Guide

## Overview

The SmashMoves application now includes comprehensive Firebase integration for saving and loading user choices, BTL data, and global statistics. This guide explains how to set up and use the Firebase features.

## Firebase Database

**Database URL**: [https://smashmoves-default-rtdb.firebaseio.com/](https://smashmoves-default-rtdb.firebaseio.com/)

The Firebase Realtime Database stores:
- User comparison choices
- BTL statistics and rankings
- Global move rankings
- User session data
- Application statistics

## File Structure

```
src/web/
├── firebase-manager.js     # Main Firebase integration class
├── firebase-config.js      # Firebase configuration
├── btl-calculator.js       # BTL calculations (Firebase integrated)
├── comparison.js           # Comparison page (Firebase integrated)
└── tier-list.js           # Tier list page (Firebase integrated)
```

## Setup Instructions

### 1. Firebase SDK Integration

The Firebase SDK is automatically loaded in the HTML files:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-database-compat.js"></script>

<!-- Application Scripts -->
<script src="btl-calculator.js"></script>
<script src="firebase-manager.js"></script>
<script src="comparison.js"></script>
```

### 2. Database Structure

The Firebase database is organized as follows:

```
smashmoves-default-rtdb/
├── users/
│   └── {userId}/
│       ├── choices/           # User comparison choices
│       │   └── {choiceId}/
│       │       ├── move1: {...}
│       │       ├── move2: {...}
│       │       ├── userChoice: 1|2|0
│       │       ├── moveType: "jab"
│       │       ├── timestamp: "2024-01-01T00:00:00.000Z"
│       │       ├── btlPrediction: {...}
│       │       ├── firebaseId: "auto-generated-id"
│       │       └── savedAt: "server-timestamp"
│       └── sessions/          # User session data
│           └── {sessionId}/
│               ├── comparisons: 0
│               ├── startTime: "timestamp"
│               ├── endTime: "timestamp"
│               └── savedAt: "server-timestamp"
├── btl_stats/                 # BTL statistics by move type
│   └── {moveType}/
│       ├── totalComparisons: 0
│       ├── uniqueMoves: 0
│       ├── averageConfidence: 0
│       ├── tieRate: 0
│       ├── agreementRate: 0
│       └── updatedAt: "server-timestamp"
├── global_rankings/           # Global BTL rankings
│   └── {moveType}/
│       ├── rankings: [...]
│       ├── totalComparisons: 0
│       └── updatedAt: "server-timestamp"
└── global_stats/              # Global application statistics
    ├── totalUsers: 0
    ├── totalComparisons: 0
    ├── totalMoveTypes: 0
    └── updatedAt: "server-timestamp"
```

## Usage Examples

### 1. Basic Firebase Manager Usage

```javascript
// Initialize Firebase manager
const firebaseManager = new FirebaseManager();

// Check if Firebase is connected
if (firebaseManager.isConnected()) {
    console.log('Firebase is connected');
} else {
    console.log('Firebase is not available, using localStorage only');
}
```

### 2. Saving User Choices

```javascript
// Save a user choice to Firebase
const choiceData = {
    move1: { id: 'mario-jab-1', name: 'Jab 1', character: 'mario' },
    move2: { id: 'link-jab-1', name: 'Jab 1', character: 'link' },
    userChoice: 1, // 1 = move1 wins, 2 = move2 wins, 0 = tie
    moveType: 'jab',
    timestamp: new Date().toISOString(),
    btlPrediction: { move1Score: 0.6, move2Score: 0.4, predictedWinner: 1 }
};

const success = await firebaseManager.saveUserChoice(choiceData);
if (success) {
    console.log('Choice saved to Firebase');
}
```

### 3. Loading User Choices

```javascript
// Load user choices from Firebase
const userChoices = await firebaseManager.loadUserChoices();
console.log(`Loaded ${userChoices.length} choices from Firebase`);
```

### 4. Saving BTL Statistics

```javascript
// Save BTL statistics for a move type
const btlStats = {
    totalComparisons: 150,
    uniqueMoves: 25,
    averageConfidence: 0.75,
    tieRate: 0.1,
    agreementRate: 0.85
};

const success = await firebaseManager.saveBTLStats('jab', btlStats);
```

### 5. Loading Global Rankings

```javascript
// Load global BTL rankings for a move type
const globalRankings = await firebaseManager.loadGlobalRankings('jab');
console.log(`Loaded ${globalRankings.length} global rankings`);
```

## Integration with Existing Code

### Comparison Page Integration

The comparison page automatically:
1. **Loads user choices** from both localStorage and Firebase on startup
2. **Merges data** from both sources to ensure no data loss
3. **Saves new choices** to both localStorage (immediate) and Firebase (async)
4. **Syncs data** between local and remote storage

```javascript
class ExclusiveComparison {
    constructor() {
        this.firebaseManager = new FirebaseManager();
        // ... other initialization
    }

    async loadUserChoices() {
        // Load from localStorage first (immediate)
        const localChoices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        
        // Load from Firebase (sync)
        if (this.firebaseManager.isConnected()) {
            const firebaseChoices = await this.firebaseManager.loadUserChoices();
            const mergedChoices = this.mergeChoices(localChoices, firebaseChoices);
            this.userChoices = mergedChoices;
        }
    }

    async saveUserChoice(choiceData) {
        // Save to localStorage (immediate)
        const savedChoices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        savedChoices.push(choiceData);
        localStorage.setItem('userChoices', JSON.stringify(savedChoices));
        
        // Save to Firebase (async)
        if (this.firebaseManager.isConnected()) {
            await this.firebaseManager.saveUserChoice(choiceData);
        }
    }
}
```

### Tier List Integration

The tier list page:
1. **Loads user choices** from Firebase for BTL calculations
2. **Calculates BTL scores** using the integrated data
3. **Displays tier lists** based on Firebase data
4. **Updates in real-time** as new data is added

```javascript
class TierListPage {
    constructor() {
        this.firebaseManager = new FirebaseManager();
        // ... other initialization
    }

    async loadUserChoices() {
        // Load and merge choices from localStorage and Firebase
        const localChoices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        
        if (this.firebaseManager.isConnected()) {
            const firebaseChoices = await this.firebaseManager.loadUserChoices();
            const mergedChoices = this.mergeChoices(localChoices, firebaseChoices);
            this.userChoices = mergedChoices;
        }
    }
}
```

## Data Synchronization

### Hybrid Storage Strategy

The application uses a hybrid approach:

1. **localStorage**: Immediate access, works offline
2. **Firebase**: Cloud sync, cross-device access, backup

### Data Merging Logic

```javascript
mergeChoices(localChoices, firebaseChoices) {
    const merged = [...localChoices];
    const localIds = new Set(localChoices.map(choice => choice.timestamp));
    
    // Add Firebase choices that aren't in local
    firebaseChoices.forEach(firebaseChoice => {
        if (!localIds.has(firebaseChoice.timestamp)) {
            merged.push(firebaseChoice);
        }
    });
    
    // Sort by timestamp
    return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
```

### Conflict Resolution

- **Timestamp-based**: Uses timestamps to identify unique choices
- **Last-write-wins**: Firebase data takes precedence for conflicts
- **Automatic sync**: Data is merged on every page load

## Error Handling

### Graceful Degradation

The application gracefully handles Firebase connection issues:

```javascript
// Check Firebase connection before operations
if (this.firebaseManager.isConnected()) {
    await this.firebaseManager.saveUserChoice(choiceData);
} else {
    console.log('Firebase not available, using localStorage only');
}
```

### Error Recovery

- **Network issues**: Falls back to localStorage
- **Firebase errors**: Logs errors but continues operation
- **Data corruption**: Validates data before saving/loading

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**: Group multiple saves into single operations
2. **Lazy Loading**: Load data only when needed
3. **Caching**: Cache frequently accessed data
4. **Pagination**: Load large datasets in chunks

### Monitoring

```javascript
// Monitor Firebase operations
const startTime = Date.now();
await firebaseManager.saveUserChoice(choiceData);
const duration = Date.now() - startTime;
console.log(`Firebase save took ${duration}ms`);
```

## Security Considerations

### Data Privacy

- **User IDs**: Generated locally, not tied to personal information
- **No Authentication**: Public read/write access (for demo purposes)
- **Data Validation**: Input validation before saving

### Production Recommendations

For production use, consider:
1. **Firebase Authentication**: Implement user authentication
2. **Security Rules**: Set up Firebase security rules
3. **Data Encryption**: Encrypt sensitive data
4. **Rate Limiting**: Implement rate limiting for API calls

## Testing

### Local Testing

```javascript
// Test Firebase connection
const firebaseManager = new FirebaseManager();
console.log('Firebase connected:', firebaseManager.isConnected());

// Test data operations
const testChoice = {
    move1: { id: 'test-1', name: 'Test Move 1' },
    move2: { id: 'test-2', name: 'Test Move 2' },
    userChoice: 1,
    moveType: 'test',
    timestamp: new Date().toISOString()
};

const success = await firebaseManager.saveUserChoice(testChoice);
console.log('Test save successful:', success);
```

### Debug Mode

Enable debug logging:

```javascript
// Add to FirebaseManager constructor
this.debug = true;

// Add logging in methods
if (this.debug) {
    console.log('Firebase operation:', operation, 'data:', data);
}
```

## Troubleshooting

### Common Issues

1. **Firebase SDK not loaded**: Check script tags in HTML
2. **Database connection failed**: Verify database URL
3. **Permission denied**: Check Firebase security rules
4. **Data not syncing**: Check network connection

### Debug Steps

1. **Check console**: Look for Firebase error messages
2. **Verify connection**: Use `firebaseManager.isConnected()`
3. **Test operations**: Try simple save/load operations
4. **Check network**: Verify internet connection

## Future Enhancements

### Planned Features

1. **Real-time Updates**: Live data synchronization
2. **Offline Support**: Enhanced offline functionality
3. **Data Analytics**: Advanced Firebase Analytics integration
4. **User Authentication**: Firebase Auth integration
5. **Cloud Functions**: Server-side BTL calculations

### API Extensions

1. **Batch Operations**: Bulk data operations
2. **Data Export**: Export user data
3. **Data Import**: Import from other sources
4. **Backup/Restore**: Data backup functionality

## Conclusion

The Firebase integration provides a robust, scalable foundation for the SmashMoves application. By combining localStorage and Firebase, the system ensures both immediate responsiveness and cloud synchronization, creating a seamless user experience across devices and sessions.

For questions or contributions, please refer to the main project documentation or create an issue in the project repository.
