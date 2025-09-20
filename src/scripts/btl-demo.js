#!/usr/bin/env node

/**
 * BTL Calculator Demo Script
 * 
 * This script demonstrates the BTL calculator functionality
 * with sample data to show how the ranking system works.
 */

// Sample move data for demonstration
const sampleMoves = [
    { id: 'mario-jab-1', name: 'Jab 1', character: 'mario', type: 'jab', startupFrames: 4, damage: 2.2 },
    { id: 'link-jab-1', name: 'Jab 1', character: 'link', type: 'jab', startupFrames: 6, damage: 3.0 },
    { id: 'fox-jab-1', name: 'Jab 1', character: 'fox', type: 'jab', startupFrames: 3, damage: 2.0 },
    { id: 'ganon-jab-1', name: 'Jab 1', character: 'ganondorf', type: 'jab', startupFrames: 8, damage: 4.0 }
];

// Sample user choices for demonstration
const sampleChoices = [
    { move1: { id: 'fox-jab-1' }, move2: { id: 'mario-jab-1' }, userChoice: 1, moveType: 'jab' },
    { move1: { id: 'mario-jab-1' }, move2: { id: 'link-jab-1' }, userChoice: 1, moveType: 'jab' },
    { move1: { id: 'link-jab-1' }, move2: { id: 'ganon-jab-1' }, userChoice: 2, moveType: 'jab' },
    { move1: { id: 'fox-jab-1' }, move2: { id: 'link-jab-1' }, userChoice: 1, moveType: 'jab' },
    { move1: { id: 'mario-jab-1' }, move2: { id: 'ganon-jab-1' }, userChoice: 1, moveType: 'jab' }
];

// Mock BTL Calculator class for Node.js environment
class BTLCalculator {
    constructor() {
        this.iterations = 50;
        this.convergenceThreshold = 1e-6;
    }

    calculateBTLScores(moves, userChoices, moveType) {
        const typeChoices = userChoices.filter(choice => choice.moveType === moveType);
        
        if (typeChoices.length === 0) {
            return moves.map(move => ({
                ...move,
                btlScore: 0.5,
                userWins: 0,
                userTotal: 0,
                winRate: 0,
                confidence: 0
            }));
        }

        const moveData = this.createMoveDataMap(moves, typeChoices);
        const btlScores = this.calculateBTLIterative(moveData);
        
        return moves.map(move => {
            const data = moveData[move.id] || { wins: 0, total: 0, btlScore: 0.5 };
            return {
                ...move,
                btlScore: btlScores[move.id] || 0.5,
                userWins: data.wins,
                userTotal: data.total,
                winRate: data.total > 0 ? data.wins / data.total : 0,
                confidence: this.calculateConfidence(data.total)
            };
        });
    }

    createMoveDataMap(moves, choices) {
        const moveData = {};
        
        moves.forEach(move => {
            moveData[move.id] = {
                move: move,
                wins: 0,
                total: 0,
                opponents: new Set()
            };
        });

        choices.forEach(choice => {
            const move1Id = choice.move1.id;
            const move2Id = choice.move2.id;
            
            if (moveData[move1Id] && moveData[move2Id]) {
                moveData[move1Id].total++;
                moveData[move2Id].total++;
                moveData[move1Id].opponents.add(move2Id);
                moveData[move2Id].opponents.add(move1Id);
                
                if (choice.userChoice === 1) {
                    moveData[move1Id].wins++;
                } else if (choice.userChoice === 2) {
                    moveData[move2Id].wins++;
                } else {
                    moveData[move1Id].wins += 0.5;
                    moveData[move2Id].wins += 0.5;
                }
            }
        });

        return moveData;
    }

    calculateBTLIterative(moveData) {
        const moveIds = Object.keys(moveData);
        const n = moveIds.length;
        
        if (n === 0) return {};
        
        let scores = {};
        moveIds.forEach(id => {
            scores[id] = 1.0 / n;
        });

        for (let iter = 0; iter < this.iterations; iter++) {
            const newScores = {};
            let maxChange = 0;

            moveIds.forEach(id => {
                const data = moveData[id];
                let numerator = 0;
                let denominator = 0;

                data.opponents.forEach(opponentId => {
                    const opponentData = moveData[opponentId];
                    const totalComparisons = Math.min(data.total, opponentData.total);
                    
                    if (totalComparisons > 0) {
                        const expectedWin = scores[id] / (scores[id] + scores[opponentId]);
                        numerator += data.wins;
                        denominator += totalComparisons * expectedWin;
                    }
                });

                if (denominator > 0) {
                    newScores[id] = numerator / denominator;
                } else {
                    newScores[id] = scores[id];
                }

                const change = Math.abs(newScores[id] - scores[id]);
                maxChange = Math.max(maxChange, change);
            });

            const totalScore = Object.values(newScores).reduce((sum, score) => sum + score, 0);
            moveIds.forEach(id => {
                newScores[id] = newScores[id] / totalScore;
            });

            scores = newScores;

            if (maxChange < this.convergenceThreshold) {
                break;
            }
        }

        return scores;
    }

    calculateConfidence(totalComparisons) {
        if (totalComparisons === 0) return 0;
        const k = 0.5;
        const x0 = 10;
        return 1 / (1 + Math.exp(-k * (totalComparisons - x0)));
    }

    groupMovesByTier(movesWithScores) {
        const tiers = { 'S': [], 'A': [], 'B': [], 'C': [], 'D': [], 'F': [] };
        const sortedMoves = movesWithScores.sort((a, b) => b.btlScore - a.btlScore);
        const totalMoves = sortedMoves.length;
        
        sortedMoves.forEach((move, index) => {
            const percentile = (index / totalMoves) * 100;
            
            if (percentile < 10) tiers['S'].push(move);
            else if (percentile < 25) tiers['A'].push(move);
            else if (percentile < 50) tiers['B'].push(move);
            else if (percentile < 75) tiers['C'].push(move);
            else if (percentile < 90) tiers['D'].push(move);
            else tiers['F'].push(move);
        });

        return tiers;
    }
}

// Demo function
function runBTLDemo() {
    console.log('🎮 BTL Calculator Demo');
    console.log('=====================\n');

    const btlCalculator = new BTLCalculator();

    console.log('📊 Sample Moves:');
    sampleMoves.forEach(move => {
        console.log(`  ${move.character}: ${move.name} (${move.startupFrames}f startup, ${move.damage}% damage)`);
    });

    console.log('\n🎯 Sample User Choices:');
    sampleChoices.forEach((choice, index) => {
        const move1 = sampleMoves.find(m => m.id === choice.move1.id);
        const move2 = sampleMoves.find(m => m.id === choice.move2.id);
        const winner = choice.userChoice === 1 ? move1.character : move2.character;
        console.log(`  ${index + 1}. ${move1.character} vs ${move2.character} → ${winner} wins`);
    });

    console.log('\n🧮 Calculating BTL Scores...');
    const movesWithScores = btlCalculator.calculateBTLScores(sampleMoves, sampleChoices, 'jab');

    console.log('\n📈 BTL Results:');
    movesWithScores
        .sort((a, b) => b.btlScore - a.btlScore)
        .forEach((move, index) => {
            console.log(`  ${index + 1}. ${move.character}: ${(move.btlScore * 100).toFixed(1)}% (${move.userWins}/${move.userTotal} wins, ${(move.confidence * 100).toFixed(1)}% confidence)`);
        });

    console.log('\n🏆 Tier List:');
    const tiers = btlCalculator.groupMovesByTier(movesWithScores);
    Object.entries(tiers).forEach(([tier, moves]) => {
        if (moves.length > 0) {
            const characterNames = moves.map(m => m.character).join(', ');
            console.log(`  ${tier} Tier: ${characterNames}`);
        }
    });

    console.log('\n✅ Demo completed successfully!');
}

// Run the demo
runBTLDemo();
