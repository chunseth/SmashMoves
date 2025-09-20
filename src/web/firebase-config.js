/**
 * Firebase Configuration for SmashMoves
 * 
 * This file contains the Firebase configuration and initialization
 * for the SmashMoves application.
 */

// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://smashmoves-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
let firebaseApp;
let firebaseDatabase;

try {
    if (typeof firebase !== 'undefined') {
        // Initialize Firebase app
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            firebaseApp = firebase.app();
        }
        
        // Get database reference
        firebaseDatabase = firebase.database();
        
        console.log('Firebase initialized successfully');
    } else {
        console.error('Firebase SDK not loaded');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Export Firebase instances
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseApp,
        firebaseDatabase,
        firebaseConfig
    };
} else {
    window.firebaseApp = firebaseApp;
    window.firebaseDatabase = firebaseDatabase;
    window.firebaseConfig = firebaseConfig;
}
