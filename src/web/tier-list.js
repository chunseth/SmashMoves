// Tier List Page - Character Sprites by Tiers (BTL User Ratings)
class TierListPage {
    constructor() {
        this.moveData = null;
        this.globalRankings = [];
        this.currentMoveType = 'jab';
        this.btlCalculator = new BTLCalculator();
        this.firebaseManager = new FirebaseManager();
        
        this.initializePage();
    }

    async initializePage() {
        await this.loadData();
        this.initializeEventListeners();
        this.generateTierList();
    }

    async loadData() {
        try {
            const response = await fetch('../../assets/data/rated-character-data-bundle.json');
            this.moveData = await response.json();
            
            // Load global rankings from Firebase
            await this.loadGlobalRankings();
            
            console.log(`Move data loaded successfully. Found global rankings for ${this.currentMoveType}.`);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    async loadGlobalRankings() {
        try {
            if (this.firebaseManager.isConnected()) {
                const globalRankings = await this.firebaseManager.loadGlobalRankings(this.currentMoveType);
                this.globalRankings = globalRankings;
                console.log(`Loaded ${globalRankings.length} global rankings for ${this.currentMoveType}`);
            } else {
                console.log('Firebase not connected, using empty global rankings');
                this.globalRankings = [];
            }
        } catch (error) {
            console.error('Error loading global rankings:', error);
            this.globalRankings = [];
        }
    }

    initializeEventListeners() {
        document.getElementById('moveTypeSelect').addEventListener('change', async (e) => {
            this.currentMoveType = e.target.value;
            await this.loadGlobalRankings();
            this.generateTierList();
        });

        // Add click listener for character sprites
        document.addEventListener('click', (e) => {
            const characterSprite = e.target.closest('.character-sprite');
            if (characterSprite) {
                this.showCharacterStats(characterSprite);
            }
        });
    }

    generateTierList() {
        if (!this.moveData) {
            this.showError('Move data not loaded yet. Please wait...');
            return;
        }

        // Update title
        this.updateTierListTitle();

        // Use global rankings if available, otherwise show message
        if (this.globalRankings.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Group global rankings into tiers
        const movesByTier = this.groupGlobalRankingsByTier(this.globalRankings);

        // Display the tier list
        this.displayTierList(movesByTier);
    }

    getMovesOfType(moveType) {
        const moves = [];
        
        for (const [characterName, characterData] of Object.entries(this.moveData.characters)) {
            if (characterData.moves) {
                characterData.moves.forEach(move => {
                    if (move.type === moveType) {
                        moves.push({
                            ...move,
                            character: characterName,
                            characterDisplayName: this.formatCharacterName(characterName)
                        });
                    }
                });
            }
        }
        
        return moves;
    }

    formatCharacterName(name) {
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    groupMovesByTier(moves) {
        // Calculate BTL scores for each move based on user choices
        const movesWithBTLScore = this.btlCalculator.calculateBTLScores(moves, this.userChoices, this.currentMoveType);

        // Group moves into tiers using BTL calculator
        return this.btlCalculator.groupMovesByTier(movesWithBTLScore);
    }


    updateTierListTitle() {
        const title = document.getElementById('tierListTitle');
        const moveTypeName = this.currentMoveType.charAt(0).toUpperCase() + this.currentMoveType.slice(1);
        
        if (this.globalRankings.length > 0) {
            title.textContent = `${moveTypeName} Tier List (Global Rankings)`;
        } else {
            title.textContent = `${moveTypeName} Tier List (No Data Available)`;
        }
    }

    showNoDataMessage() {
        const tierListContainer = document.getElementById('tierList');
        tierListContainer.innerHTML = `
            <div class="no-data-message">
                <h3>No Global Rankings Available</h3>
                <p>There are no global rankings for ${this.currentMoveType} moves yet.</p>
                <p>Make some comparisons to help build the global tier list!</p>
                <a href="comparison.html" class="nav-link">Start Making Comparisons</a>
            </div>
        `;
    }

    groupGlobalRankingsByTier(globalRankings) {
        // Sort global rankings by BTL score (highest first), then by character name for consistency
        const sortedRankings = [...globalRankings].sort((a, b) => {
            const scoreDiff = (b.btlScore || 0) - (a.btlScore || 0);
            if (scoreDiff !== 0) return scoreDiff;
            // If BTL scores are equal, sort by character name for consistent ordering
            return a.characterDisplayName.localeCompare(b.characterDisplayName);
        });
        
        console.log('Tier List Debug:');
        console.log('Total rankings:', sortedRankings.length);
        console.log('All BTL scores:', sortedRankings.map(m => ({
            name: m.name,
            character: m.characterDisplayName,
            btlScore: m.btlScore,
            userWins: m.userWins,
            userTotal: m.userTotal,
            winRate: m.winRate
        })));
        
        // Group moves by BTL score first
        const scoreGroups = {};
        sortedRankings.forEach(move => {
            const score = move.btlScore || 0;
            if (!scoreGroups[score]) {
                scoreGroups[score] = [];
            }
            scoreGroups[score].push(move);
        });
        
        console.log('Score groups:', Object.entries(scoreGroups).map(([score, moves]) => ({
            score: parseFloat(score),
            count: moves.length,
            moves: moves.map(m => m.characterDisplayName)
        })));
        
        // Distribute moves across tiers, keeping same-score moves together
        const tieredMoves = { 'S': [], 'A': [], 'B': [], 'C': [], 'D': [], 'F': [] };
        
        // Get unique BTL scores in descending order
        const uniqueScores = [...new Set(sortedRankings.map(m => m.btlScore))].sort((a, b) => b - a);
        console.log('Unique BTL scores:', uniqueScores);
        
        // Assign tiers based on score groups
        let currentTierIndex = 0;
        const tierNames = ['S', 'A', 'B', 'C', 'D', 'F'];
        
        for (const score of uniqueScores) {
            const movesWithScore = scoreGroups[score];
            console.log(`Score ${score}: ${movesWithScore.length} moves`);
            
            // Put all moves with the same score in the same tier
            if (currentTierIndex < tierNames.length) {
                const currentTier = tierNames[currentTierIndex];
                tieredMoves[currentTier] = tieredMoves[currentTier].concat(movesWithScore);
                console.log(`Assigned ${movesWithScore.length} moves to ${currentTier} tier`);
                currentTierIndex++;
            } else {
                // If we run out of tiers, put remaining moves in F tier
                tieredMoves['F'] = tieredMoves['F'].concat(movesWithScore);
                console.log(`Assigned ${movesWithScore.length} moves to F tier (overflow)`);
            }
        }
        
        // Log final tier assignments
        for (const [tier, moves] of Object.entries(tieredMoves)) {
            if (moves.length > 0) {
                console.log(`${tier} Tier (${moves.length} moves):`, moves.map(m => ({
                    name: m.name,
                    character: m.characterDisplayName,
                    btlScore: m.btlScore,
                    winRate: m.winRate
                })));
            }
        }

        return tieredMoves;
    }

    displayTierList(movesByTier) {
        const tierList = document.getElementById('tierList');
        
        const tierOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
        
        tierList.innerHTML = tierOrder.map(tier => {
            const moves = movesByTier[tier];
            
            if (moves.length === 0) {
                return '';
            }

            // Get unique characters for this tier (avoid duplicates)
            const uniqueCharacters = this.getUniqueCharactersForTierFromGlobal(moves);

            return `
                <div class="tier-row ${tier.toLowerCase()}-tier">
                    <div class="tier-label">${tier} Tier</div>
                    <div class="tier-characters">
                        ${uniqueCharacters.map(character => `
                            <div class="character-sprite ${tier.toLowerCase()}-tier" 
                                 title="${character.name} - ${character.bestMove.name}"
                                 data-character="${character.name}"
                                 data-move="${character.bestMove.name}"
                                 data-btl-score="${character.bestMove.btlScore}"
                                 data-wins="${character.bestMove.userWins}"
                                 data-total="${character.bestMove.userTotal}"
                                 data-win-rate="${character.bestMove.winRate}"
                                 style="cursor: pointer;">
                                <div class="character-image">${this.getCharacterInitial(character.name)}</div>
                                <div class="character-name">${character.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).filter(html => html !== '').join('');
    }

    getUniqueCharactersForTier(moves) {
        const characterMap = new Map();
        
        moves.forEach(move => {
            const characterName = move.characterDisplayName;
            
            if (!characterMap.has(characterName)) {
                characterMap.set(characterName, {
                    name: characterName,
                    bestMove: move,
                    btlScore: move.btlScore || 0
                });
            } else {
                // Keep the move with the highest BTL score for this character
                const existing = characterMap.get(characterName);
                if (move.btlScore > existing.btlScore) {
                    characterMap.set(characterName, {
                        name: characterName,
                        bestMove: move,
                        btlScore: move.btlScore || 0
                    });
                }
            }
        });
        
        // Sort characters by their best move BTL score
        return Array.from(characterMap.values()).sort((a, b) => b.btlScore - a.btlScore);
    }

    getUniqueCharactersForTierFromGlobal(globalRankings) {
        const characterMap = new Map();
        
        globalRankings.forEach(ranking => {
            const characterName = ranking.characterDisplayName || ranking.character;
            
            if (!characterMap.has(characterName)) {
                characterMap.set(characterName, {
                    name: characterName,
                    bestMove: ranking,
                    btlScore: ranking.btlScore || 0
                });
            } else {
                // Keep the move with the highest BTL score
                const existing = characterMap.get(characterName);
                if ((ranking.btlScore || 0) > (existing.btlScore || 0)) {
                    characterMap.set(characterName, {
                        name: characterName,
                        bestMove: ranking,
                        btlScore: ranking.btlScore || 0
                    });
                }
            }
        });
        
        return Array.from(characterMap.values()).sort((a, b) => (b.btlScore || 0) - (a.btlScore || 0));
    }

    getCharacterInitial(characterName) {
        // Get the first letter of each word in the character name
        return characterName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2);
    }

    showCharacterStats(characterSprite) {
        const character = characterSprite.dataset.character;
        const move = characterSprite.dataset.move;
        const btlScore = parseFloat(characterSprite.dataset.btlScore);
        const wins = parseInt(characterSprite.dataset.wins);
        const total = parseInt(characterSprite.dataset.total);
        const winRate = parseFloat(characterSprite.dataset.winRate);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'character-stats-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${character} - ${move}</h3>
                    <button class="modal-close" onclick="this.closest('.character-stats-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">Win Rate</div>
                            <div class="stat-value">${(winRate * 100).toFixed(1)}%</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Total Matches</div>
                            <div class="stat-value">${total}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Wins</div>
                            <div class="stat-value">${wins}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Losses</div>
                            <div class="stat-value">${total - wins}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn" onclick="this.closest('.character-stats-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showError(message) {
        const tierList = document.getElementById('tierList');
        tierList.innerHTML = `
            <div class="error-message" style="
                background: #dc3545;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            ">
                ${message}
            </div>
        `;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    new TierListPage();
});