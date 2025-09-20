/**
 * Firebase Manager for Move Selector Real-time Collaboration
 * 
 * Handles real-time synchronization of move selections across multiple users
 */

class MoveSelectorFirebase {
    constructor() {
        this.databaseUrl = 'https://smashmoves-default-rtdb.firebaseio.com/';
        this.isInitialized = false;
        this.userId = this.getOrCreateUserId();
        this.userName = this.getOrCreateUserName();
        this.database = null;
        this.listeners = new Map();
        this.selectedMoves = new Set();
        this.otherUsersSelections = new Map(); // userId -> Set of moveIds
        
        // Initialize Firebase
        this.initializeFirebase();
    }

    /**
     * Initialize Firebase configuration
     */
    initializeFirebase() {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded. Real-time collaboration will be disabled.');
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
            console.log('Move Selector Firebase initialized successfully');
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
        let userId = localStorage.getItem('move_selector_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('move_selector_user_id', userId);
        }
        return userId;
    }

    /**
     * Get or create a user name
     * @returns {string} User name
     */
    getOrCreateUserName() {
        let userName = localStorage.getItem('move_selector_user_name');
        if (!userName) {
            // Generate a random name
            const adjectives = ['Swift', 'Powerful', 'Agile', 'Strong', 'Clever', 'Bold', 'Quick', 'Mighty'];
            const nouns = ['Fighter', 'Warrior', 'Champion', 'Hero', 'Master', 'Legend', 'Ace', 'Star'];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            userName = `${adj} ${noun}`;
            localStorage.setItem('move_selector_user_name', userName);
        }
        return userName;
    }

    /**
     * Update user name
     * @param {string} newName - New user name
     */
    updateUserName(newName) {
        this.userName = newName;
        localStorage.setItem('move_selector_user_name', newName);
        this.updateUserPresence();
    }

    /**
     * Start real-time collaboration
     * @param {Function} onSelectionChange - Callback for selection changes
     * @param {Function} onUserJoin - Callback for user joining
     * @param {Function} onUserLeave - Callback for user leaving
     */
    async startCollaboration(onSelectionChange, onUserJoin, onUserLeave) {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return;
        }

        try {
            // Set up user presence
            await this.setupUserPresence();

            // Listen to all user selections
            const selectionsRef = this.database.ref('move_selector/selections');
            const selectionsListener = selectionsRef.on('value', (snapshot) => {
                this.handleSelectionsUpdate(snapshot, onSelectionChange);
            });
            this.listeners.set('selections', selectionsListener);

            // Listen to user presence
            const presenceRef = this.database.ref('move_selector/presence');
            const presenceListener = presenceRef.on('value', (snapshot) => {
                this.handlePresenceUpdate(snapshot, onUserJoin, onUserLeave);
            });
            this.listeners.set('presence', presenceListener);

            console.log('Real-time collaboration started');
        } catch (error) {
            console.error('Error starting collaboration:', error);
        }
    }

    /**
     * Stop real-time collaboration
     */
    stopCollaboration() {
        // Remove all listeners
        this.listeners.forEach((listener, key) => {
            const ref = this.database.ref(`move_selector/${key}`);
            ref.off('value', listener);
        });
        this.listeners.clear();

        // Remove user presence
        this.removeUserPresence();
        
        console.log('Real-time collaboration stopped');
    }

    /**
     * Set up user presence
     */
    async setupUserPresence() {
        if (!this.isInitialized) return;

        try {
            const userPresenceRef = this.database.ref(`move_selector/presence/${this.userId}`);
            
            // Set user as online
            await userPresenceRef.set({
                name: this.userName,
                online: true,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });

            // Set up disconnect handling
            userPresenceRef.onDisconnect().set({
                name: this.userName,
                online: false,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('User presence set up');
        } catch (error) {
            console.error('Error setting up user presence:', error);
        }
    }

    /**
     * Update user presence
     */
    async updateUserPresence() {
        if (!this.isInitialized) return;

        try {
            const userPresenceRef = this.database.ref(`move_selector/presence/${this.userId}`);
            await userPresenceRef.update({
                name: this.userName,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error updating user presence:', error);
        }
    }

    /**
     * Remove user presence
     */
    async removeUserPresence() {
        if (!this.isInitialized) return;

        try {
            const userPresenceRef = this.database.ref(`move_selector/presence/${this.userId}`);
            await userPresenceRef.remove();
        } catch (error) {
            console.error('Error removing user presence:', error);
        }
    }

    /**
     * Handle selections update from Firebase
     * @param {Object} snapshot - Firebase snapshot
     * @param {Function} onSelectionChange - Callback function
     */
    handleSelectionsUpdate(snapshot, onSelectionChange) {
        const allSelections = snapshot.val() || {};
        this.otherUsersSelections.clear();

        // Process each user's selections
        Object.keys(allSelections).forEach(userId => {
            if (userId !== this.userId) {
                const userSelections = allSelections[userId] || {};
                const moveIds = new Set(Object.keys(userSelections).filter(moveId => userSelections[moveId]));
                this.otherUsersSelections.set(userId, moveIds);
            }
        });

        // Notify callback
        if (onSelectionChange) {
            onSelectionChange(this.otherUsersSelections);
        }
    }

    /**
     * Handle presence update from Firebase
     * @param {Object} snapshot - Firebase snapshot
     * @param {Function} onUserJoin - Callback for user joining
     * @param {Function} onUserLeave - Callback for user leaving
     */
    handlePresenceUpdate(snapshot, onUserJoin, onUserLeave) {
        const presence = snapshot.val() || {};
        const currentUsers = new Set(Object.keys(presence).filter(userId => 
            presence[userId] && presence[userId].online
        ));

        // Check for new users
        currentUsers.forEach(userId => {
            if (userId !== this.userId && !this.otherUsersSelections.has(userId)) {
                if (onUserJoin) {
                    onUserJoin(userId, presence[userId].name);
                }
            }
        });

        // Check for users who left
        this.otherUsersSelections.forEach((_, userId) => {
            if (!currentUsers.has(userId)) {
                if (onUserLeave) {
                    onUserLeave(userId);
                }
                this.otherUsersSelections.delete(userId);
            }
        });
    }

    /**
     * Update move selection
     * @param {string} moveId - Move ID
     * @param {boolean} selected - Whether move is selected
     */
    async updateMoveSelection(moveId, selected) {
        if (!this.isInitialized) return;

        try {
            const selectionRef = this.database.ref(`move_selector/selections/${this.userId}/${moveId}`);
            await selectionRef.set(selected);
            
            // Update local selection
            if (selected) {
                this.selectedMoves.add(moveId);
            } else {
                this.selectedMoves.delete(moveId);
            }
        } catch (error) {
            console.error('Error updating move selection:', error);
        }
    }

    /**
     * Clear all selections
     */
    async clearAllSelections() {
        if (!this.isInitialized) return;

        try {
            const userSelectionsRef = this.database.ref(`move_selector/selections/${this.userId}`);
            await userSelectionsRef.remove();
            this.selectedMoves.clear();
        } catch (error) {
            console.error('Error clearing selections:', error);
        }
    }

    /**
     * Get user color for display
     * @param {string} userId - User ID
     * @returns {string} Color hex code
     */
    getUserColor(userId) {
        // Generate consistent colors based on user ID
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
            '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
        ];
        
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Get user name by ID
     * @param {string} userId - User ID
     * @returns {string} User name
     */
    async getUserName(userId) {
        if (!this.isInitialized) return 'Unknown User';

        try {
            const snapshot = await this.database.ref(`move_selector/presence/${userId}/name`).once('value');
            return snapshot.val() || 'Unknown User';
        } catch (error) {
            console.error('Error getting user name:', error);
            return 'Unknown User';
        }
    }

    /**
     * Get all online users
     * @returns {Promise<Array>} Array of online users
     */
    async getOnlineUsers() {
        if (!this.isInitialized) return [];

        try {
            const snapshot = await this.database.ref('move_selector/presence').once('value');
            const presence = snapshot.val() || {};
            
            return Object.keys(presence)
                .filter(userId => presence[userId] && presence[userId].online)
                .map(userId => ({
                    id: userId,
                    name: presence[userId].name,
                    color: this.getUserColor(userId)
                }));
        } catch (error) {
            console.error('Error getting online users:', error);
            return [];
        }
    }

    /**
     * Check if Firebase is connected
     * @returns {boolean} Connection status
     */
    isConnected() {
        return this.isInitialized && this.database !== null;
    }

    /**
     * Get current user info
     * @returns {Object} User info
     */
    getCurrentUser() {
        return {
            id: this.userId,
            name: this.userName,
            color: this.getUserColor(this.userId)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoveSelectorFirebase;
} else {
    window.MoveSelectorFirebase = MoveSelectorFirebase;
}
