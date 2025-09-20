/**
 * Complete Firebase Cleanup Script
 * 
 * This script completely cleans up Firebase database
 * Run this to remove ALL existing data and start fresh
 */

// Browser console version (run this in the browser console on your site)
const completeCleanupScript = `
// Run this in the browser console on your SmashMoves site
(async function completeFirebaseCleanup() {
    console.log('Starting COMPLETE Firebase cleanup...');
    console.log('This will remove ALL data from Firebase!');
    
    try {
        // Remove all global rankings
        console.log('Removing all global rankings...');
        await firebase.database().ref('global_rankings').remove();
        
        // Remove all BTL stats
        console.log('Removing all BTL stats...');
        await firebase.database().ref('btl_stats').remove();
        
        // Remove all global stats
        console.log('Removing all global stats...');
        await firebase.database().ref('global_stats').remove();
        
        // Remove all user data (optional - uncomment if you want to remove user data too)
        // console.log('Removing all user data...');
        // await firebase.database().ref('users').remove();
        
        console.log('✅ Complete Firebase cleanup completed!');
        console.log('Firebase is now clean and ready for fresh data.');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
})();
`;

const selectiveCleanupScript = `
// Run this in the browser console on your SmashMoves site
// This removes only the problematic global rankings
(async function selectiveFirebaseCleanup() {
    console.log('Starting selective Firebase cleanup...');
    
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
                
                // Check if rankings have the problematic pattern (all moves with same win/total)
                const hasProblematicData = rankings.length > 0 && 
                    rankings.every(move => move.userTotal === 2 && move.userWins === 1);
                
                if (hasProblematicData) {
                    console.log(\`🗑️ Removing problematic rankings for \${moveType}\`);
                    await rankingsRef.remove();
                } else {
                    console.log(\`✅ Keeping rankings for \${moveType} (looks good)\`);
                }
            } else {
                console.log(\`ℹ️ No rankings found for \${moveType}\`);
            }
        } catch (error) {
            console.error(\`❌ Error cleaning up \${moveType}:\`, error);
        }
    }
    
    console.log('✅ Selective Firebase cleanup completed!');
})();
`;

console.log('Firebase Cleanup Scripts');
console.log('========================');
console.log('');
console.log('Choose one of the following cleanup options:');
console.log('');
console.log('1. COMPLETE CLEANUP (removes ALL data):');
console.log('   - Removes all global rankings');
console.log('   - Removes all BTL stats');
console.log('   - Removes all global stats');
console.log('   - Keeps user data');
console.log('');
console.log('2. SELECTIVE CLEANUP (removes only problematic data):');
console.log('   - Removes rankings with the "userTotal: 2, userWins: 1" pattern');
console.log('   - Keeps legitimate data');
console.log('');
console.log('To run cleanup:');
console.log('1. Open your SmashMoves site in a browser');
console.log('2. Open the browser console (F12)');
console.log('3. Copy and paste one of the scripts below');
console.log('');
console.log('COMPLETE CLEANUP SCRIPT:');
console.log('========================');
console.log(completeCleanupScript);
console.log('');
console.log('SELECTIVE CLEANUP SCRIPT:');
console.log('=========================');
console.log(selectiveCleanupScript);
