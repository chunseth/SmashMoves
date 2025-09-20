// Move Comparison Board with BTL Model
class MoveComparisonBoard {
    constructor() {
        this.moveData = null;
        this.filteredMoves = [];
        this.selectedMove1 = null;
        this.selectedMove2 = null;
        this.btlModel = new BTLModel();
        this.currentMoveType = 'all';
        
        this.initializeEventListeners();
        this.loadMoveData();
    }

    async loadMoveData() {
        try {
            const response = await fetch('../../assets/data/rated-character-data-bundle.json');
            this.moveData = await response.json();
            this.processMoveData();
            this.populateMoveGrid();
        } catch (error) {
            console.error('Error loading move data:', error);
            this.showError('Failed to load move data. Please refresh the page.');
        }
    }

    processMoveData() {
        this.filteredMoves = [];
        
        for (const [characterName, characterData] of Object.entries(this.moveData.characters)) {
            if (characterData.moves) {
                characterData.moves.forEach(move => {
                    const processedMove = {
                        ...move,
                        character: characterName,
                        characterDisplayName: this.formatCharacterName(characterName)
                    };
                    this.filteredMoves.push(processedMove);
                });
            }
        }
        
        // Sort by overall rating (highest first)
        this.filteredMoves.sort((a, b) => (b.rating?.overall_rating || 0) - (a.rating?.overall_rating || 0));
    }

    formatCharacterName(name) {
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    initializeEventListeners() {
        // Move type filter
        document.getElementById('moveTypeFilter').addEventListener('change', (e) => {
            this.currentMoveType = e.target.value;
            this.filterMoves();
            this.populateMoveGrid();
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchMoves();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchMoves();
            }
        });

        // Comparison mode
        document.querySelectorAll('input[name="comparisonMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'multi') {
                    this.showComingSoon();
                }
            });
        });
    }

    filterMoves() {
        if (this.currentMoveType === 'all') {
            this.filteredMoves = this.getAllMoves();
        } else {
            this.filteredMoves = this.getAllMoves().filter(move => 
                move.type === this.currentMoveType
            );
        }
        
        // Sort by overall rating
        this.filteredMoves.sort((a, b) => (b.rating?.overall_rating || 0) - (a.rating?.overall_rating || 0));
    }

    getAllMoves() {
        const allMoves = [];
        for (const [characterName, characterData] of Object.entries(this.moveData.characters)) {
            if (characterData.moves) {
                characterData.moves.forEach(move => {
                    allMoves.push({
                        ...move,
                        character: characterName,
                        characterDisplayName: this.formatCharacterName(characterName)
                    });
                });
            }
        }
        return allMoves;
    }

    searchMoves() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        if (searchTerm === '') {
            this.filterMoves();
        } else {
            this.filteredMoves = this.getAllMoves().filter(move => 
                move.name.toLowerCase().includes(searchTerm) ||
                move.characterDisplayName.toLowerCase().includes(searchTerm) ||
                move.type.toLowerCase().includes(searchTerm)
            );
        }
        
        this.populateMoveGrid();
    }

    populateMoveGrid() {
        const grid = document.getElementById('moveGrid');
        grid.innerHTML = '';

        this.filteredMoves.slice(0, 50).forEach(move => {
            const moveElement = this.createMoveElement(move);
            grid.appendChild(moveElement);
        });

        if (this.filteredMoves.length > 50) {
            const moreElement = document.createElement('div');
            moreElement.className = 'move-item';
            moreElement.innerHTML = `
                <h4>And ${this.filteredMoves.length - 50} more moves...</h4>
                <p>Use search to find specific moves</p>
            `;
            grid.appendChild(moreElement);
        }
    }

    createMoveElement(move) {
        const element = document.createElement('div');
        element.className = 'move-item';
        element.dataset.moveId = move.id;
        
        const tier = move.rating?.tier || 'D';
        const rating = move.rating?.overall_rating || 0;
        
        element.innerHTML = `
            <h4>${move.name}</h4>
            <div class="character">${move.characterDisplayName}</div>
            <span class="move-type">${move.type}</span>
            <span class="tier ${tier.toLowerCase()}">${tier}</span>
            <div class="frame-data">
                Startup: ${move.startupFrames}f | 
                Endlag: ${move.endLag}f | 
                Damage: ${move.damage}%
            </div>
            <div class="rating">Rating: ${rating.toFixed(1)}</div>
        `;

        element.addEventListener('click', () => {
            this.selectMove(move);
        });

        return element;
    }

    selectMove(move) {
        // Remove previous selections
        document.querySelectorAll('.move-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to clicked element
        event.currentTarget.classList.add('selected');

        // Determine which move slot to fill
        if (!this.selectedMove1) {
            this.selectedMove1 = move;
            this.updateMoveCard('move1Card', move);
        } else if (!this.selectedMove2) {
            this.selectedMove2 = move;
            this.updateMoveCard('move2Card', move);
            this.performComparison();
        } else {
            // Replace move 1 and clear move 2
            this.selectedMove1 = move;
            this.selectedMove2 = null;
            this.updateMoveCard('move1Card', move);
            this.clearMoveCard('move2Card');
            this.hideComparisonResults();
        }
    }

    updateMoveCard(cardId, move) {
        const card = document.getElementById(cardId);
        const tier = move.rating?.tier || 'D';
        const rating = move.rating?.overall_rating || 0;
        
        card.innerHTML = `
            <h3>${move.name}</h3>
            <div class="move-info">
                <div class="character">${move.characterDisplayName}</div>
                <div class="move-type">${move.type}</div>
                <div class="tier ${tier.toLowerCase()}">${tier}</div>
                <div class="frame-data">
                    <div><strong>Startup:</strong> ${move.startupFrames}f</div>
                    <div><strong>Endlag:</strong> ${move.endLag}f</div>
                    <div><strong>Damage:</strong> ${move.damage}%</div>
                    <div><strong>On Shield:</strong> ${move.onShieldLag}f</div>
                </div>
                <div class="rating">Overall Rating: ${rating.toFixed(1)}</div>
            </div>
        `;
        card.classList.add('selected');
    }

    clearMoveCard(cardId) {
        const card = document.getElementById(cardId);
        card.innerHTML = `
            <h3>Move 2</h3>
            <div class="move-info">
                <p>Select a move to compare</p>
            </div>
        `;
        card.classList.remove('selected');
    }

    hideComparisonResults() {
        document.getElementById('comparisonResults').style.display = 'none';
    }

    async performComparison() {
        if (!this.selectedMove1 || !this.selectedMove2) return;

        // Show loading
        const resultsDiv = document.getElementById('comparisonResults');
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <h3>Comparison Results</h3>
            <div class="loading">Analyzing moves...</div>
        `;

        // Simulate BTL model calculation (in real implementation, this would be more complex)
        setTimeout(() => {
            this.displayComparisonResults();
        }, 1000);
    }

    displayComparisonResults() {
        const move1 = this.selectedMove1;
        const move2 = this.selectedMove2;

        // Calculate BTL scores
        const btlScores = this.btlModel.calculateBTLScores([move1, move2]);
        
        // Determine winner
        const winner = btlScores[0].score > btlScores[1].score ? move1 : move2;
        const winnerScore = Math.max(btlScores[0].score, btlScores[1].score);
        const loserScore = Math.min(btlScores[0].score, btlScores[1].score);

        const resultsDiv = document.getElementById('comparisonResults');
        resultsDiv.innerHTML = `
            <h3>Comparison Results</h3>
            <div class="result-summary">
                <h4>🏆 Winner: ${winner.name} (${winner.characterDisplayName})</h4>
                <p>BTL Score: ${winnerScore.toFixed(3)} vs ${loserScore.toFixed(3)}</p>
                <p>Neural Network Tier: ${winner.rating?.tier || 'D'} vs ${(winner === move1 ? move2 : move1).rating?.tier || 'D'}</p>
            </div>
            <div class="detailed-comparison">
                <div class="comparison-metric">
                    <h4>Speed (Startup)</h4>
                    <div class="value ${move1.startupFrames < move2.startupFrames ? 'winner' : ''}">${move1.startupFrames}f</div>
                    <div class="value ${move2.startupFrames < move1.startupFrames ? 'winner' : ''}">${move2.startupFrames}f</div>
                </div>
                <div class="comparison-metric">
                    <h4>Safety (On Shield)</h4>
                    <div class="value ${move1.onShieldLag > move2.onShieldLag ? 'winner' : ''}">${move1.onShieldLag}f</div>
                    <div class="value ${move2.onShieldLag > move1.onShieldLag ? 'winner' : ''}">${move2.onShieldLag}f</div>
                </div>
                <div class="comparison-metric">
                    <h4>Damage</h4>
                    <div class="value ${move1.damage > move2.damage ? 'winner' : ''}">${move1.damage}%</div>
                    <div class="value ${move2.damage > move1.damage ? 'winner' : ''}">${move2.damage}%</div>
                </div>
                <div class="comparison-metric">
                    <h4>Endlag</h4>
                    <div class="value ${move1.endLag < move2.endLag ? 'winner' : ''}">${move1.endLag}f</div>
                    <div class="value ${move2.endLag < move1.endLag ? 'winner' : ''}">${move2.endLag}f</div>
                </div>
                <div class="comparison-metric">
                    <h4>Overall Rating</h4>
                    <div class="value ${(move1.rating?.overall_rating || 0) > (move2.rating?.overall_rating || 0) ? 'winner' : ''}">${(move1.rating?.overall_rating || 0).toFixed(1)}</div>
                    <div class="value ${(move2.rating?.overall_rating || 0) > (move1.rating?.overall_rating || 0) ? 'winner' : ''}">${(move2.rating?.overall_rating || 0).toFixed(1)}</div>
                </div>
                <div class="comparison-metric">
                    <h4>Neural Network Tier</h4>
                    <div class="value">${move1.rating?.tier || 'D'}</div>
                    <div class="value">${move2.rating?.tier || 'D'}</div>
                </div>
            </div>
            <div class="btl-results">
                <h4>BTL Model Analysis</h4>
                <div class="btl-ranking">
                    ${btlScores.map((item, index) => `
                        <div class="btl-item">
                            <span class="rank">#${index + 1}</span>
                            <span class="move-name">${item.move.name} (${item.move.characterDisplayName})</span>
                            <span class="btl-score">${item.score.toFixed(3)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Update tier list for the move type
        this.updateTierList(move1.type);
    }

    updateTierList(moveType) {
        const movesOfType = this.getAllMoves().filter(move => move.type === moveType);
        movesOfType.sort((a, b) => (b.rating?.overall_rating || 0) - (a.rating?.overall_rating || 0));

        const container = document.getElementById('tierListContainer');
        container.innerHTML = `
            <h3>${moveType.charAt(0).toUpperCase() + moveType.slice(1)} Tier List</h3>
            <div class="tier-list">
                ${movesOfType.slice(0, 20).map((move, index) => {
                    const tier = move.rating?.tier || 'D';
                    const rating = move.rating?.overall_rating || 0;
                    return `
                        <div class="tier-row ${tier.toLowerCase()}-tier">
                            <span class="tier-label">${index + 1}</span>
                            <span class="move-name">${move.name}</span>
                            <span class="character">(${move.characterDisplayName})</span>
                            <span class="tier ${tier.toLowerCase()}">${tier}</span>
                            <span class="rating">${rating.toFixed(1)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    showComingSoon() {
        alert('Multi-move comparison (3-5 moves) is coming soon! This feature will allow you to compare multiple moves simultaneously and choose the best one from the group.');
    }

    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        `;
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// BTL (Bradley-Terry-Luce) Model Implementation
class BTLModel {
    constructor() {
        this.iterations = 100;
        this.convergenceThreshold = 1e-6;
    }

    calculateBTLScores(moves) {
        // Initialize scores
        const scores = moves.map(move => ({
            move: move,
            score: 1.0 // Initial score
        }));

        // Calculate pairwise comparisons based on move attributes
        const comparisons = this.generateComparisons(moves);
        
        // Run BTL algorithm
        for (let iter = 0; iter < this.iterations; iter++) {
            const newScores = [...scores];
            let maxChange = 0;

            for (let i = 0; i < moves.length; i++) {
                let numerator = 0;
                let denominator = 0;

                for (let j = 0; j < moves.length; j++) {
                    if (i !== j) {
                        const comparison = comparisons[i][j];
                        const totalScore = scores[i].score + scores[j].score;
                        
                        if (totalScore > 0) {
                            numerator += comparison.wins;
                            denominator += comparison.total / scores[j].score;
                        }
                    }
                }

                if (denominator > 0) {
                    const newScore = numerator / denominator;
                    const change = Math.abs(newScore - scores[i].score);
                    maxChange = Math.max(maxChange, change);
                    newScores[i].score = newScore;
                }
            }

            // Update scores
            scores.forEach((score, i) => {
                score.score = newScores[i].score;
            });

            // Check convergence
            if (maxChange < this.convergenceThreshold) {
                break;
            }
        }

        // Normalize scores to sum to 1
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        scores.forEach(score => {
            score.score = score.score / totalScore;
        });

        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);

        return scores;
    }

    generateComparisons(moves) {
        const comparisons = [];
        
        for (let i = 0; i < moves.length; i++) {
            comparisons[i] = [];
            for (let j = 0; j < moves.length; j++) {
                if (i === j) {
                    comparisons[i][j] = { wins: 0, total: 0 };
                } else {
                    const comparison = this.compareMoves(moves[i], moves[j]);
                    comparisons[i][j] = comparison;
                }
            }
        }

        return comparisons;
    }

    compareMoves(move1, move2) {
        let move1Wins = 0;
        let move2Wins = 0;

        // Compare based on multiple attributes
        const attributes = [
            { name: 'speed', weight: 0.3, better: 'lower', value1: move1.startupFrames, value2: move2.startupFrames },
            { name: 'safety', weight: 0.25, better: 'higher', value1: move1.onShieldLag, value2: move2.onShieldLag },
            { name: 'damage', weight: 0.2, better: 'higher', value1: move1.damage, value2: move2.damage },
            { name: 'endlag', weight: 0.15, better: 'lower', value1: move1.endLag, value2: move2.endLag },
            { name: 'rating', weight: 0.1, better: 'higher', value1: move1.rating?.overall_rating || 0, value2: move2.rating?.overall_rating || 0 }
        ];

        for (const attr of attributes) {
            let winner = null;
            
            if (attr.better === 'lower') {
                winner = attr.value1 < attr.value2 ? 1 : (attr.value1 > attr.value2 ? 2 : null);
            } else {
                winner = attr.value1 > attr.value2 ? 1 : (attr.value1 < attr.value2 ? 2 : null);
            }

            if (winner === 1) {
                move1Wins += attr.weight;
            } else if (winner === 2) {
                move2Wins += attr.weight;
            } else {
                // Tie - split the weight
                move1Wins += attr.weight / 2;
                move2Wins += attr.weight / 2;
            }
        }

        return {
            wins: move1Wins,
            total: move1Wins + move2Wins
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MoveComparisonBoard();
});
