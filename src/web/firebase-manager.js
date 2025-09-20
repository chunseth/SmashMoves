/**
 * Firebase Manager for SmashMoves
 * 
 * Handles saving and loading user choices and BTL data to/from Firebase Realtime Database
 * Database URL: https://smashmoves-default-rtdb.firebaseio.com/
 */

class FirebaseManager {
    constructor() {
        this.databaseUrl = 'https://smashmoves-default-rtdb.firebaseio.com/';
        this.isInitialized = false;
        this.userId = this.getOrCreateUserId();
        this.database = null;
        
        // Initialize Firebase
        this.initializeFirebase();
    }

    /**
     * Initialize Firebase configuration
     */
    initializeFirebase() {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded. Firebase features will be disabled.');
            return;
        }

        try {
            // Firebase configuration
            const firebaseConfig = {
                databaseURL: this.databaseUrl
            };

            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.isInitialized = true;
            console.log('Firebase initialized successfully with database:', this.databaseUrl);
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Get or create a unique user ID
     * @returns {string} User ID
     */
    getOrCreateUserId() {
        let userId = localStorage.getItem('smashmoves_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('smashmoves_user_id', userId);
        }
        return userId;
    }

    /**
     * Save user choice to Firebase
     * @param {Object} choiceData - User choice data
     * @returns {Promise<boolean>} Success status
     */
    async saveUserChoice(choiceData) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const choiceRef = this.database.ref(`users/${this.userId}/choices`).push();
            const choiceWithTimestamp = {
                ...choiceData,
                firebaseId: choiceRef.key,
                savedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await choiceRef.set(choiceWithTimestamp);
            console.log('User choice saved to Firebase:', choiceRef.key);
            return true;
        } catch (error) {
            console.error('Error saving user choice to Firebase:', error);
            return false;
        }
    }

    /**
     * Load user choices from Firebase
     * @returns {Promise<Array>} Array of user choices
     */
    async loadUserChoices() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return [];
        }

        try {
            const snapshot = await this.database.ref(`users/${this.userId}/choices`).once('value');
            const choices = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const choice = childSnapshot.val();
                    choices.push(choice);
                });
            }
            
            console.log(`Loaded ${choices.length} user choices from Firebase`);
            return choices;
        } catch (error) {
            console.error('Error loading user choices from Firebase:', error);
            return [];
        }
    }

    /**
     * Save BTL statistics to Firebase
     * @param {string} moveType - Move type
     * @param {Object} btlStats - BTL statistics
     * @returns {Promise<boolean>} Success status
     */
    async saveBTLStats(moveType, btlStats) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const statsRef = this.database.ref(`btl_stats/${moveType}`);
            const statsWithTimestamp = {
                ...btlStats,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await statsRef.set(statsWithTimestamp);
            console.log(`BTL stats saved for ${moveType}`);
            return true;
        } catch (error) {
            console.error('Error saving BTL stats to Firebase:', error);
            return false;
        }
    }

    /**
     * Load BTL statistics from Firebase
     * @param {string} moveType - Move type
     * @returns {Promise<Object|null>} BTL statistics or null
     */
    async loadBTLStats(moveType) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return null;
        }

        try {
            const snapshot = await this.database.ref(`btl_stats/${moveType}`).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error loading BTL stats from Firebase:', error);
            return null;
        }
    }

    /**
     * Save global BTL rankings to Firebase
     * @param {string} moveType - Move type
     * @param {Array} rankings - BTL rankings
     * @returns {Promise<boolean>} Success status
     */
    async saveGlobalRankings(moveType, rankings) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const rankingsRef = this.database.ref(`global_rankings/${moveType}`);
            const rankingsWithTimestamp = {
                rankings: rankings,
                totalComparisons: rankings.reduce((sum, move) => sum + (move.userTotal || 0), 0),
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await rankingsRef.set(rankingsWithTimestamp);
            console.log(`Global rankings saved for ${moveType}`);
            return true;
        } catch (error) {
            console.error('Error saving global rankings to Firebase:', error);
            return false;
        }
    }

    /**
     * Load global BTL rankings from Firebase
     * @param {string} moveType - Move type
     * @returns {Promise<Array>} Global rankings
     */
    async loadGlobalRankings(moveType) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return [];
        }

        try {
            const snapshot = await this.database.ref(`global_rankings/${moveType}`).once('value');
            return snapshot.exists() ? snapshot.val().rankings || [] : [];
        } catch (error) {
            console.error('Error loading global rankings from Firebase:', error);
            return [];
        }
    }

    /**
     * Save user session data to Firebase
     * @param {Object} sessionData - Session data
     * @returns {Promise<boolean>} Success status
     */
    async saveSessionData(sessionData) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const sessionRef = this.database.ref(`users/${this.userId}/sessions`).push();
            const sessionWithTimestamp = {
                ...sessionData,
                sessionId: sessionRef.key,
                savedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await sessionRef.set(sessionWithTimestamp);
            console.log('Session data saved to Firebase:', sessionRef.key);
            return true;
        } catch (error) {
            console.error('Error saving session data to Firebase:', error);
            return false;
        }
    }

    /**
     * Load user session data from Firebase
     * @returns {Promise<Array>} Array of session data
     */
    async loadSessionData() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return [];
        }

        try {
            const snapshot = await this.database.ref(`users/${this.userId}/sessions`).once('value');
            const sessions = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const session = childSnapshot.val();
                    sessions.push(session);
                });
            }
            
            console.log(`Loaded ${sessions.length} sessions from Firebase`);
            return sessions;
        } catch (error) {
            console.error('Error loading session data from Firebase:', error);
            return [];
        }
    }

    /**
     * Get global statistics from Firebase
     * @returns {Promise<Object>} Global statistics
     */
    async getGlobalStats() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return {};
        }

        try {
            const snapshot = await this.database.ref('global_stats').once('value');
            return snapshot.exists() ? snapshot.val() : {};
        } catch (error) {
            console.error('Error loading global stats from Firebase:', error);
            return {};
        }
    }

    /**
     * Update global statistics in Firebase
     * @param {Object} stats - Statistics to update
     * @returns {Promise<boolean>} Success status
     */
    async updateGlobalStats(stats) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const statsRef = this.database.ref('global_stats');
            const statsWithTimestamp = {
                ...stats,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            await statsRef.update(statsWithTimestamp);
            console.log('Global stats updated in Firebase');
            return true;
        } catch (error) {
            console.error('Error updating global stats in Firebase:', error);
            return false;
        }
    }

    /**
     * Sync local data with Firebase
     * @param {Array} localChoices - Local user choices
     * @returns {Promise<boolean>} Success status
     */
    async syncWithFirebase(localChoices) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            // Load existing Firebase choices
            const firebaseChoices = await this.loadUserChoices();
            const firebaseIds = new Set(firebaseChoices.map(choice => choice.firebaseId));
            
            // Find new choices to upload
            const newChoices = localChoices.filter(choice => !choice.firebaseId);
            
            // Upload new choices
            for (const choice of newChoices) {
                await this.saveUserChoice(choice);
            }
            
            console.log(`Synced ${newChoices.length} new choices to Firebase`);
            return true;
        } catch (error) {
            console.error('Error syncing with Firebase:', error);
            return false;
        }
    }

    /**
     * Check Firebase connection status
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.isInitialized && this.database !== null;
    }

    /**
     * Get user statistics
     * @returns {Promise<Object>} User statistics
     */
    async getUserStats() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return {};
        }

        try {
            const snapshot = await this.database.ref(`users/${this.userId}`).once('value');
            return snapshot.exists() ? snapshot.val() : {};
        } catch (error) {
            console.error('Error loading user stats from Firebase:', error);
            return {};
        }
    }

    /**
     * Clear empty global rankings (with no actual user data)
     * @param {string} moveType - Move type to clear
     * @returns {Promise<boolean>} Success status
     */
    async clearEmptyGlobalRankings(moveType) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }

        try {
            const rankingsRef = this.database.ref(`global_rankings/${moveType}`);
            await rankingsRef.remove();
            console.log(`Cleared empty global rankings for ${moveType}`);
            return true;
        } catch (error) {
            console.error('Error clearing global rankings:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseManager;
} else {
    window.FirebaseManager = FirebaseManager;
}
