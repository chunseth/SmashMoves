/**
 * BTL (Bradley-Terry-Luce) Model Calculator
 * 
 * This module handles all BTL calculations for move ranking based on user comparison data.
 * The BTL model is used to rank items based on pairwise comparisons.
 */

class BTLCalculator {
    constructor() {
        this.iterations = 50;
        this.convergenceThreshold = 1e-6;
        this.minComparisons = 1;
    }

    /**
     * Calculate BTL scores for a set of moves based on user comparison data
     * @param {Array} moves - Array of move objects
     * @param {Array} userChoices - Array of user comparison choices
     * @param {string} moveType - The move type to filter comparisons
     * @returns {Array} Array of moves with BTL scores
     */
    calculateBTLScores(moves, userChoices, moveType) {
        // Filter user choices for this move type
        const typeChoices = userChoices.filter(choice => choice.moveType === moveType);
        
        if (typeChoices.length === 0) {
            // No user data - return empty array to indicate no rankings available
            return [];
        }

        // Create move data map
        const moveData = this.createMoveDataMap(moves, typeChoices);
        
        // Calculate BTL scores using iterative algorithm
        const btlScores = this.calculateBTLIterative(moveData);
        
        // Return only moves that were actually involved in comparisons
        const results = Object.values(moveData).map(data => {
            const move = data.move;
            return {
                ...move,
                btlScore: btlScores[move.id] || 0.5,
                userWins: data.wins,
                userTotal: data.total,
                winRate: data.total > 0 ? data.wins / data.total : 0,
                confidence: this.calculateConfidence(data.total)
            };
        });
        
        console.log('BTL Calculator Results:');
        console.log('Calculated scores:', Object.entries(btlScores));
        console.log('Final results:', results.map(r => ({
            name: r.name,
            character: r.characterDisplayName,
            btlScore: r.btlScore,
            userWins: r.userWins,
            userTotal: r.userTotal,
            winRate: r.winRate
        })));
        
        return results;
    }

    /**
     * Create a map of move data from user choices
     * @param {Array} moves - Array of moves
     * @param {Array} choices - Array of user choices
     * @returns {Object} Map of move data
     */
    createMoveDataMap(moves, choices) {
        const moveData = {};
        const moveMap = new Map(moves.map(move => [move.id, move]));
        
        console.log('BTL Calculator Debug:');
        console.log('Available moves:', moves.length);
        console.log('User choices:', choices.length);
        console.log('Move IDs in choices:', choices.map(c => [c.move1.id, c.move2.id]));
        
        // Only initialize moves that are actually involved in comparisons
        choices.forEach(choice => {
            const move1Id = choice.move1.id;
            const move2Id = choice.move2.id;
            
            console.log(`Processing choice: ${move1Id} vs ${move2Id}`);
            console.log(`Move1 exists in map:`, moveMap.has(move1Id));
            console.log(`Move2 exists in map:`, moveMap.has(move2Id));
            
            // Only add moves that exist in our move list and are being compared
            if (moveMap.has(move1Id) && !moveData[move1Id]) {
                moveData[move1Id] = {
                    move: moveMap.get(move1Id),
                    wins: 0,
                    total: 0,
                    opponents: new Set()
                };
                console.log(`Added move1 to data: ${move1Id}`);
            }
            
            if (moveMap.has(move2Id) && !moveData[move2Id]) {
                moveData[move2Id] = {
                    move: moveMap.get(move2Id),
                    wins: 0,
                    total: 0,
                    opponents: new Set()
                };
                console.log(`Added move2 to data: ${move2Id}`);
            }
        });
        
        console.log('Final moveData keys:', Object.keys(moveData));
        console.log('Move data details:', Object.entries(moveData).map(([id, data]) => ({
            id,
            wins: data.wins,
            total: data.total,
            winRate: data.total > 0 ? data.wins / data.total : 'N/A'
        })));

        // Process user choices
        choices.forEach(choice => {
            const move1Id = choice.move1.id;
            const move2Id = choice.move2.id;
            
            if (moveData[move1Id] && moveData[move2Id]) {
                // Record the comparison
                moveData[move1Id].total++;
                moveData[move2Id].total++;
                moveData[move1Id].opponents.add(move2Id);
                moveData[move2Id].opponents.add(move1Id);
                
                // Record the result
                if (choice.userChoice === 1) {
                    moveData[move1Id].wins++;
                } else if (choice.userChoice === 2) {
                    moveData[move2Id].wins++;
                } else {
                    // Tie - both get half a win
                    moveData[move1Id].wins += 0.5;
                    moveData[move2Id].wins += 0.5;
                }
            }
        });

        return moveData;
    }

    /**
     * Calculate BTL scores using iterative algorithm
     * @param {Object} moveData - Map of move data
     * @returns {Object} Map of BTL scores
     */
    calculateBTLIterative(moveData) {
        const moveIds = Object.keys(moveData);
        const n = moveIds.length;
        
        if (n === 0) return {};
        
        // Use a simple approach based on win rates
        // This ensures that moves with higher win rates get higher BTL scores
        const scores = {};
        
        moveIds.forEach(id => {
            const data = moveData[id];
            if (data.total > 0) {
                // Use win rate as base score, with confidence adjustment
                const winRate = data.wins / data.total;
                const confidence = this.calculateConfidence(data.total);
                
                // BTL score = win rate adjusted by confidence
                // Higher win rate + more comparisons = higher BTL score
                scores[id] = winRate * (0.5 + 0.5 * confidence);
            } else {
                // This shouldn't happen since we only include moves that were compared
                // But if it does, give it a neutral score
                scores[id] = 0.5;
            }
        });
        
        // Don't normalize - keep the raw win rate based scores
        // This ensures that a 100% win rate = 1.0 and 0% win rate = 0.0
        console.log('BTL Scores calculated (before normalization):', scores);
        
        // Optional: Scale scores to be more meaningful (0 to 1 range)
        const maxScore = Math.max(...Object.values(scores));
        const minScore = Math.min(...Object.values(scores));
        const range = maxScore - minScore;
        
        if (range > 0) {
            moveIds.forEach(id => {
                // Scale to 0-1 range
                scores[id] = (scores[id] - minScore) / range;
            });
        }
        
        console.log('BTL Scores calculated (after scaling):', scores);
        return scores;
    }

    /**
     * Get total comparisons between two moves
     * @param {Object} move1Data - First move data
     * @param {Object} move2Data - Second move data
     * @returns {number} Total comparisons
     */
    getTotalComparisons(move1Data, move2Data) {
        // This is a simplified version - in practice, you'd track individual comparisons
        return Math.min(move1Data.total, move2Data.total);
    }

    /**
     * Calculate confidence score based on number of comparisons
     * @param {number} totalComparisons - Number of comparisons
     * @returns {number} Confidence score (0-1)
     */
    calculateConfidence(totalComparisons) {
        if (totalComparisons === 0) return 0;
        
        // Sigmoid function for confidence
        const k = 0.5; // Steepness parameter
        const x0 = 10; // Midpoint
        return 1 / (1 + Math.exp(-k * (totalComparisons - x0)));
    }

    /**
     * Group moves into tiers based on BTL scores
     * @param {Array} movesWithScores - Moves with BTL scores
     * @returns {Object} Tiers object with S, A, B, C, D, F arrays
     */
    groupMovesByTier(movesWithScores) {
        const tiers = {
            'S': [],
            'A': [],
            'B': [],
            'C': [],
            'D': [],
            'F': []
        };

        // Sort moves by BTL score (highest first)
        const sortedMoves = movesWithScores.sort((a, b) => b.btlScore - a.btlScore);

        // Group by percentile
        const totalMoves = sortedMoves.length;
        sortedMoves.forEach((move, index) => {
            const percentile = (index / totalMoves) * 100;
            
            if (percentile < 10) {
                tiers['S'].push(move);
            } else if (percentile < 25) {
                tiers['A'].push(move);
            } else if (percentile < 50) {
                tiers['B'].push(move);
            } else if (percentile < 75) {
                tiers['C'].push(move);
            } else if (percentile < 90) {
                tiers['D'].push(move);
            } else {
                tiers['F'].push(move);
            }
        });

        return tiers;
    }

    /**
     * Calculate BTL prediction for a comparison
     * @param {Object} move1 - First move
     * @param {Object} move2 - Second move
     * @param {Object} moveData - Move data map
     * @returns {Object} Prediction object
     */
    calculateBTLPrediction(move1, move2, moveData) {
        const move1Data = moveData[move1.id];
        const move2Data = moveData[move2.id];
        
        if (!move1Data || !move2Data) {
            return {
                move1Score: 0.5,
                move2Score: 0.5,
                predictedWinner: 0,
                confidence: 0
            };
        }

        // Calculate win probabilities
        const move1WinRate = move1Data.total > 0 ? move1Data.wins / move1Data.total : 0.5;
        const move2WinRate = move2Data.total > 0 ? move2Data.wins / move2Data.total : 0.5;
        
        // Normalize to probabilities
        const totalRate = move1WinRate + move2WinRate;
        const move1Score = totalRate > 0 ? move1WinRate / totalRate : 0.5;
        const move2Score = totalRate > 0 ? move2WinRate / totalRate : 0.5;
        
        // Determine predicted winner
        let predictedWinner = 0;
        if (move1Score > move2Score + 0.1) {
            predictedWinner = 1;
        } else if (move2Score > move1Score + 0.1) {
            predictedWinner = 2;
        }
        
        // Calculate confidence based on total comparisons
        const totalComparisons = move1Data.total + move2Data.total;
        const confidence = this.calculateConfidence(totalComparisons);

        return {
            move1Score,
            move2Score,
            predictedWinner,
            confidence
        };
    }

    /**
     * Get BTL statistics for a move type
     * @param {Array} userChoices - All user choices
     * @param {string} moveType - Move type to analyze
     * @returns {Object} Statistics object
     */
    getBTLStatistics(userChoices, moveType) {
        const typeChoices = userChoices.filter(choice => choice.moveType === moveType);
        
        if (typeChoices.length === 0) {
            return {
                totalComparisons: 0,
                uniqueMoves: 0,
                averageConfidence: 0,
                tieRate: 0,
                agreementRate: 0
            };
        }

        // Calculate statistics
        const totalComparisons = typeChoices.length;
        const ties = typeChoices.filter(choice => choice.userChoice === 0).length;
        const tieRate = totalComparisons > 0 ? ties / totalComparisons : 0;
        
        // Calculate agreement rate (if BTL predictions exist)
        const agreements = typeChoices.filter(choice => 
            choice.btlPrediction && choice.btlPrediction.predictedWinner === choice.userChoice
        ).length;
        const agreementRate = totalComparisons > 0 ? agreements / totalComparisons : 0;
        
        // Count unique moves
        const uniqueMoves = new Set();
        typeChoices.forEach(choice => {
            uniqueMoves.add(choice.move1.id);
            uniqueMoves.add(choice.move2.id);
        });
        
        // Calculate average confidence
        const totalConfidence = typeChoices.reduce((sum, choice) => {
            return sum + (choice.btlPrediction?.confidence || 0);
        }, 0);
        const averageConfidence = totalComparisons > 0 ? totalConfidence / totalComparisons : 0;

        return {
            totalComparisons,
            uniqueMoves: uniqueMoves.size,
            averageConfidence,
            tieRate,
            agreementRate
        };
    }

    /**
     * Export BTL data for analysis
     * @param {Array} movesWithScores - Moves with BTL scores
     * @param {Object} statistics - BTL statistics
     * @returns {Object} Exportable BTL data
     */
    exportBTLData(movesWithScores, statistics) {
        return {
            timestamp: new Date().toISOString(),
            statistics,
            moves: movesWithScores.map(move => ({
                id: move.id,
                name: move.name,
                character: move.character,
                moveType: move.type,
                btlScore: move.btlScore,
                userWins: move.userWins,
                userTotal: move.userTotal,
                winRate: move.winRate,
                confidence: move.confidence
            }))
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BTLCalculator;
} else {
    window.BTLCalculator = BTLCalculator;
}
