/**
 * Firebase Cleanup Script
 * 
 * This script cleans up empty global rankings from Firebase
 * Run this to remove any existing entries with default values
 */

// Import Firebase SDK (for Node.js)
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
// For now, this is a reference script - you can run it manually in the browser console

class FirebaseCleanup {
    constructor() {
        this.databaseUrl = 'https://smashmoves-default-rtdb.firebaseio.com/';
    }

    /**
     * Clean up empty global rankings
     */
    async cleanupEmptyRankings() {
        console.log('Starting Firebase cleanup...');
        
        const moveTypes = [
            'jab', 'forward tilt', 'up tilt', 'down tilt', 'dash attack',
            'forward smash', 'up smash', 'down smash', 'nair', 'fair',
            'bair', 'uair', 'dair', 'neutral b', 'side b', 'up b',
            'down b', 'grab', 'forward throw', 'back throw',
            'up throw', 'down throw'
        ];

        for (const moveType of moveTypes) {
            try {
                // Check if rankings exist
                const rankingsRef = firebase.database().ref(`global_rankings/${moveType}`);
                const snapshot = await rankingsRef.once('value');
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const rankings = data.rankings || [];
                    
                    // Check if rankings have meaningful data
                    const hasRealData = rankings.some(move => 
                        move.userTotal > 0 || move.userWins > 0 || (move.btlScore && move.btlScore > 0)
                    );
                    
                    if (!hasRealData) {
                        console.log(`Removing empty rankings for ${moveType}`);
                        await rankingsRef.remove();
                    } else {
                        console.log(`Keeping rankings for ${moveType} (has real data)`);
                    }
                } else {
                    console.log(`No rankings found for ${moveType}`);
                }
            } catch (error) {
                console.error(`Error cleaning up ${moveType}:`, error);
            }
        }
        
        console.log('Firebase cleanup completed!');
    }
}

// Browser console version (run this in the browser console on your site)
const browserCleanupScript = `
// Run this in the browser console on your SmashMoves site
(async function cleanupFirebase() {
    console.log('Starting Firebase cleanup...');
    
    const moveTypes = [
        'jab', 'forward tilt', 'up tilt', 'down tilt', 'dash attack',
        'forward smash', 'up smash', 'down smash', 'nair', 'fair',
        'bair', 'uair', 'dair', 'neutral b', 'side b', 'up b',
        'down b', 'grab', 'forward throw', 'back throw',
        'up throw', 'down throw'
    ];

    for (const moveType of moveTypes) {
        try {
            const rankingsRef = firebase.database().ref(\`global_rankings/\${moveType}\`);
            const snapshot = await rankingsRef.once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                const rankings = data.rankings || [];
                
                const hasRealData = rankings.some(move => 
                    move.userTotal > 0 || move.userWins > 0 || (move.btlScore && move.btlScore > 0)
                );
                
                if (!hasRealData) {
                    console.log(\`Removing empty rankings for \${moveType}\`);
                    await rankingsRef.remove();
                } else {
                    console.log(\`Keeping rankings for \${moveType} (has real data)\`);
                }
            } else {
                console.log(\`No rankings found for \${moveType}\`);
            }
        } catch (error) {
            console.error(\`Error cleaning up \${moveType}:\`, error);
        }
    }
    
    console.log('Firebase cleanup completed!');
})();
`;

console.log('Firebase Cleanup Script');
console.log('=====================');
console.log('');
console.log('To clean up existing empty global rankings:');
console.log('1. Open your SmashMoves site in a browser');
console.log('2. Open the browser console (F12)');
console.log('3. Copy and paste the following script:');
console.log('');
console.log(browserCleanupScript);
console.log('');
console.log('This will remove any global rankings that have no real user data.');

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseCleanup;
}
