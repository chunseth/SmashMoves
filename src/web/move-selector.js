class MoveSelector {
    constructor() {
        this.data = null;
        this.selectedMoves = new Set();
        this.otherUsersSelections = new Map();
        this.onlineUsers = new Map();
        this.firebase = null;
        this.moveTypes = [
            'jab',
            'forward tilt',
            'up tilt', 
            'down tilt',
            'neutral b',
            'side b',
            'up b',
            'down b'
        ];
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.initializeFirebase();
            this.renderGrid();
            this.setupEventListeners();
            this.setupUserInterface();
        } catch (error) {
            console.error('Error initializing move selector:', error);
            this.showError('Failed to load move data');
        }
    }

    async loadData() {
        try {
            const response = await fetch('../../assets/data/relative-rated-character-data-bundle.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    initializeFirebase() {
        this.firebase = new MoveSelectorFirebase();
        
        // Start real-time collaboration
        this.firebase.startCollaboration(
            (otherUsersSelections) => this.handleOtherUsersSelections(otherUsersSelections),
            (userId, userName) => this.handleUserJoin(userId, userName),
            (userId) => this.handleUserLeave(userId)
        );
    }

    setupUserInterface() {
        const userColor = document.getElementById('userColor');
        const userNameInput = document.getElementById('userNameInput');
        const userName = document.getElementById('userName');
        const onlineUsersList = document.getElementById('onlineUsersList');

        // Set up user color
        const currentUser = this.firebase.getCurrentUser();
        userColor.style.backgroundColor = currentUser.color;
        userName.textContent = currentUser.name;
        userNameInput.value = currentUser.name;

        // Handle name changes
        userNameInput.addEventListener('blur', () => {
            const newName = userNameInput.value.trim();
            if (newName && newName !== currentUser.name) {
                this.firebase.updateUserName(newName);
                userName.textContent = newName;
            }
        });

        userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                userNameInput.blur();
            }
        });

        // Update online users list
        this.updateOnlineUsersList();
    }

    handleOtherUsersSelections(otherUsersSelections) {
        this.otherUsersSelections = otherUsersSelections;
        this.updateMoveCellVisuals();
    }

    handleUserJoin(userId, userName) {
        this.onlineUsers.set(userId, { name: userName, color: this.firebase.getUserColor(userId) });
        this.updateOnlineUsersList();
        this.updateMoveCellVisuals();
    }

    handleUserLeave(userId) {
        this.onlineUsers.delete(userId);
        this.updateOnlineUsersList();
        this.updateMoveCellVisuals();
    }

    updateOnlineUsersList() {
        const onlineUsersList = document.getElementById('onlineUsersList');
        onlineUsersList.innerHTML = '';

        // Add current user
        const currentUser = this.firebase.getCurrentUser();
        const currentUserAvatar = document.createElement('div');
        currentUserAvatar.className = 'user-avatar';
        currentUserAvatar.innerHTML = `
            <div class="user-avatar-color" style="background-color: ${currentUser.color}"></div>
            <span>${currentUser.name}</span>
        `;
        onlineUsersList.appendChild(currentUserAvatar);

        // Add other users
        this.onlineUsers.forEach((user, userId) => {
            const userAvatar = document.createElement('div');
            userAvatar.className = 'user-avatar';
            userAvatar.innerHTML = `
                <div class="user-avatar-color" style="background-color: ${user.color}"></div>
                <span>${user.name}</span>
            `;
            onlineUsersList.appendChild(userAvatar);
        });
    }

    updateMoveCellVisuals() {
        const moveCells = document.querySelectorAll('.move-cell[data-move-id]');
        
        moveCells.forEach(cell => {
            const moveId = cell.dataset.moveId;
            
            // Remove all selection classes
            cell.classList.remove('selected', 'other-user-selected', 'multiple-users');
            cell.style.setProperty('--other-user-color', '');
            
            // Check if current user selected this move
            const isCurrentUserSelected = this.selectedMoves.has(moveId);
            
            // Check other users' selections
            const otherUserSelections = [];
            this.otherUsersSelections.forEach((userSelections, userId) => {
                if (userSelections.has(moveId)) {
                    const user = this.onlineUsers.get(userId);
                    if (user) {
                        otherUserSelections.push(user);
                    }
                }
            });

            // Apply visual styles
            if (isCurrentUserSelected) {
                cell.classList.add('selected');
            }
            
            if (otherUserSelections.length > 0) {
                if (otherUserSelections.length === 1) {
                    cell.classList.add('other-user-selected');
                    cell.style.setProperty('--other-user-color', otherUserSelections[0].color);
                } else {
                    cell.classList.add('multiple-users');
                }
            }
        });
    }

    renderGrid() {
        const grid = document.getElementById('moveGrid');
        grid.innerHTML = '';

        // Create header row
        const headerRow = document.createElement('div');
        headerRow.className = 'grid-header';
        headerRow.textContent = 'Ch';
        grid.appendChild(headerRow);

        // Create move type headers
        this.moveTypes.forEach(moveType => {
            const header = document.createElement('div');
            header.className = 'move-header';
            header.textContent = this.formatMoveType(moveType);
            grid.appendChild(header);
        });

        // Official Super Smash Bros. Ultimate character order
        const officialCharacterOrder = [
            'mario', 'donkey_kong', 'link', 'samus', 'dark_samus', 'yoshi', 'kirby', 'fox', 'pikachu', 'luigi',
            'ness', 'captain_falcon', 'jigglypuff', 'peach', 'daisy', 'bowser', 'ice_climbers', 'sheik', 'zelda',
            'dr_mario', 'pichu', 'falco', 'marth', 'lucina', 'young_link', 'ganondorf', 'mewtwo', 'roy', 'chrom',
            'mr_game_and_watch', 'meta_knight', 'pit', 'dark_pit', 'zero_suit_samus', 'wario', 'snake', 'ike',
            'pokemon_trainer', 'pt_charizard', 'pt_ivysaur', 'pt_squirtle', 'diddy_kong', 'lucas', 'sonic',
            'king_dedede', 'olimar', 'lucario', 'rob', 'toon_link', 'wolf', 'villager', 'mega_man', 'wii_fit_trainer',
            'rosalina_and_luma', 'little_mac', 'greninja', 'mii_brawler', 'mii_swordfighter', 'mii_gunner',
            'palutena', 'pac_man', 'robin', 'shulk', 'bowser_jr', 'duck_hunt', 'ryu', 'ken', 'cloud', 'corrin',
            'bayonetta', 'inkling', 'ridley', 'simon', 'richter', 'king_k_rool', 'isabelle', 'incineroar',
            'piranha_plant', 'joker', 'dq_hero', 'banjo_and_kazooie', 'terry', 'byleth', 'minmin', 'steve',
            'sephiroth', 'pyra', 'mythra', 'kazuya', 'sora'
        ];

        // Create character rows in official order
        const sortedCharacters = officialCharacterOrder.filter(name => this.data.characters[name]);
        sortedCharacters.forEach(characterName => {
            const character = this.data.characters[characterName];
            const row = document.createElement('div');
            row.className = 'character-row';

            // Character image cell
            const nameCell = document.createElement('div');
            nameCell.className = 'character-name';
            
            const characterImage = document.createElement('img');
            characterImage.className = 'character-image';
            characterImage.src = `../../src/public/${characterName}.png`;
            characterImage.alt = this.formatCharacterName(characterName);
            characterImage.title = this.formatCharacterName(characterName);
            
            // Handle missing images
            characterImage.onerror = () => {
                characterImage.style.display = 'none';
                nameCell.textContent = this.formatCharacterName(characterName);
                nameCell.style.fontSize = '10px';
                nameCell.style.fontWeight = '600';
            };
            
            nameCell.appendChild(characterImage);
            row.appendChild(nameCell);

            // Move cells for each type
            this.moveTypes.forEach(moveType => {
                const moveCell = document.createElement('div');
                moveCell.className = 'move-cell';
                
                const move = this.findMoveByType(character.moves, moveType);
                if (move) {
                    moveCell.innerHTML = `
                        <div>
                            <div class="move-name">${move.name}</div>
                            <div class="move-stats">Tier: ${move.tier}</div>
                        </div>
                    `;
                    moveCell.dataset.moveId = move.id;
                    moveCell.dataset.characterName = characterName;
                    moveCell.dataset.moveData = JSON.stringify(move);
                } else {
                    moveCell.innerHTML = '<div class="move-name">-</div>';
                    moveCell.style.opacity = '0.5';
                }
                
                row.appendChild(moveCell);
            });

            grid.appendChild(row);
        });
    }

    findMoveByType(moves, moveType) {
        return moves.find(move => {
            const type = move.type.toLowerCase();
            return type === moveType.toLowerCase();
        });
    }

    formatMoveType(moveType) {
        const typeMap = {
            'jab': 'Jab',
            'forward tilt': 'F-Tilt',
            'up tilt': 'U-Tilt',
            'down tilt': 'D-Tilt',
            'neutral b': 'Neut B',
            'side b': 'Side B',
            'up b': 'Up B',
            'down b': 'Down B'
        };
        return typeMap[moveType] || moveType;
    }

    formatCharacterName(name) {
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    setupEventListeners() {
        const grid = document.getElementById('moveGrid');
        const exportBtn = document.getElementById('exportBtn');

        // Handle move cell clicks
        grid.addEventListener('click', (e) => {
            const moveCell = e.target.closest('.move-cell');
            if (!moveCell || !moveCell.dataset.moveId) return;

            const moveId = moveCell.dataset.moveId;
            const isSelected = this.selectedMoves.has(moveId);
            
            // Update Firebase
            this.firebase.updateMoveSelection(moveId, !isSelected);
            
            // Update local state
            if (isSelected) {
                this.selectedMoves.delete(moveId);
            } else {
                this.selectedMoves.add(moveId);
            }

            this.updateSelectedCount();
            this.updateMoveCellVisuals();
        });

        // Handle export button
        exportBtn.addEventListener('click', () => {
            this.exportToCSV();
        });
    }

    updateSelectedCount() {
        const count = this.selectedMoves.size;
        document.getElementById('selectedCount').textContent = count;
        document.getElementById('exportBtn').disabled = count === 0;
    }

    exportToCSV() {
        if (this.selectedMoves.size === 0) return;

        const csvData = [];
        
        // CSV headers
        const headers = [
            'Character',
            'Move Name',
            'Move Type',
            'Tier',
            'Relative Rating',
            'Percentile Rank',
            'Startup Frames',
            'Active Frames',
            'End Lag',
            'On Shield Lag',
            'Shield Lag',
            'Damage',
            'Shield Stun',
            'Weighted Score',
            'Speed Score',
            'Safety Score',
            'Combo Potential Score',
            'Kill Power Score',
            'Damage Score',
            'Frame Efficiency Score',
            'Endlag Score',
            'Versatility Score',
            'Range Score'
        ];
        csvData.push(headers);

        // Add selected moves data
        this.selectedMoves.forEach(moveId => {
            const moveCell = document.querySelector(`[data-move-id="${moveId}"]`);
            if (!moveCell) return;

            const move = JSON.parse(moveCell.dataset.moveData);
            const characterName = this.formatCharacterName(moveCell.dataset.characterName);
            
            const row = [
                characterName,
                move.name,
                move.type,
                move.tier,
                move.relative_rating,
                move.percentile_rank,
                move.startupFrames,
                move.activeFrames,
                move.endLag,
                move.onShieldLag,
                move.shieldLag,
                move.damage,
                move.shieldStun,
                move.weighted_score,
                move.component_scores?.speed || '',
                move.component_scores?.safety || '',
                move.component_scores?.combo_potential || '',
                move.component_scores?.kill_power || '',
                move.component_scores?.damage || '',
                move.component_scores?.frame_efficiency || '',
                move.component_scores?.endlag || '',
                move.component_scores?.versatility || '',
                move.component_scores?.range || ''
            ];
            csvData.push(row);
        });

        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Download CSV
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `selected_moves_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showError(message) {
        const grid = document.getElementById('moveGrid');
        grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #dc3545;">${message}</div>`;
    }
}

// Initialize the move selector when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MoveSelector();
});
