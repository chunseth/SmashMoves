// Exclusive Comparison Page - Streamlined Move Comparison
class ExclusiveComparison {
    constructor() {
        this.moveData = null;
        this.currentMove1 = null;
        this.currentMove2 = null;
        this.currentMoveType = null;
        this.sessionStats = {
            comparisons: 0
        };
        this.userChoices = [];
        this.btlCalculator = new BTLCalculator();
        this.firebaseManager = new FirebaseManager();
        this.moveTypes = [
            'jab', 'forward tilt', 'up tilt', 'down tilt', 'dash attack',
            'forward smash', 'up smash', 'down smash', 'nair', 'fair',
            'bair', 'uair', 'dair', 'neutral b', 'side b', 'up b',
            'down b', 'grab', 'forward throw', 'back throw',
            'up throw', 'down throw'
        ];
        
        this.initializeEventListeners();
        this.loadMoveData();
        this.loadUserChoices();
    }

    async loadMoveData() {
        try {
            const response = await fetch('../../assets/data/rated-character-data-bundle.json');
            this.moveData = await response.json();
            console.log('Move data loaded successfully');
            this.generateRandomComparison();
        } catch (error) {
            console.error('Error loading move data:', error);
            this.showError('Failed to load move data. Please refresh the page.');
        }
    }

    async loadUserChoices() {
        try {
            // Load from localStorage first (for immediate access)
            const localChoices = JSON.parse(localStorage.getItem('userChoices') || '[]');
            this.userChoices = localChoices;
            
            // Load from Firebase (for sync)
            if (this.firebaseManager.isConnected()) {
                const firebaseChoices = await this.firebaseManager.loadUserChoices();
                
                // Merge Firebase choices with local choices
                const mergedChoices = this.mergeChoices(localChoices, firebaseChoices);
                this.userChoices = mergedChoices;
                
                // Update localStorage with merged data
                localStorage.setItem('userChoices', JSON.stringify(mergedChoices));
                
                console.log(`Loaded ${mergedChoices.length} user choices (${localChoices.length} local, ${firebaseChoices.length} Firebase)`);
            } else {
                console.log(`Loaded ${localChoices.length} user choices from localStorage`);
            }
        } catch (error) {
            console.error('Error loading user choices:', error);
        }
    }

    mergeChoices(localChoices, firebaseChoices) {
        const merged = [...localChoices];
        const localIds = new Set(localChoices.map(choice => choice.timestamp));
        
        // Add Firebase choices that aren't in local
        firebaseChoices.forEach(firebaseChoice => {
            if (!localIds.has(firebaseChoice.timestamp)) {
                merged.push(firebaseChoice);
            }
        });
        
        // Sort by timestamp
        return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    initializeEventListeners() {
        // Tie button
        document.getElementById('tieChoice').addEventListener('click', () => {
            this.recordChoice(0);
        });
    }

    selectRandomMoveType() {
        this.currentMoveType = this.moveTypes[Math.floor(Math.random() * this.moveTypes.length)];
    }

    generateRandomComparison() {
        if (!this.moveData) {
            this.showError('Move data not loaded yet. Please wait...');
            return;
        }

        // Select a random move type for this comparison
        this.selectRandomMoveType();

        const movesOfType = this.getMovesOfType(this.currentMoveType);
        
        if (movesOfType.length < 2) {
            this.showError(`Not enough moves of type "${this.currentMoveType}" found.`);
            return;
        }

        const randomIndices = this.getRandomIndices(movesOfType.length, 2);
        this.currentMove1 = movesOfType[randomIndices[0]];
        this.currentMove2 = movesOfType[randomIndices[1]];

        this.displayComparison();
        this.updateSessionStats();
    }

    getMovesOfType(moveType) {
        const moveGroups = new Map();
        
        for (const [characterName, characterData] of Object.entries(this.moveData.characters)) {
            if (characterData.moves) {
                characterData.moves.forEach(move => {
                    // Include moves that match the selected type OR are part of a special sequence
                    const shouldInclude = move.type === moveType || 
                                        (move.name.includes('Double-Edge Dance') && moveType === 'side b') ||
                                        (move.name.includes('Cross Slash') && moveType === 'side b');
                    
                    if (shouldInclude) {
                        const groupKey = this.getMoveGroupKey(move, characterName);
                        
                        if (!moveGroups.has(groupKey)) {
                            moveGroups.set(groupKey, {
                                character: characterName,
                                characterDisplayName: this.formatCharacterName(characterName),
                                moveType: moveType,
                                parts: [],
                                currentPartIndex: 0
                            });
                        }
                        
                        moveGroups.get(groupKey).parts.push({
                            ...move,
                            character: characterName,
                            characterDisplayName: this.formatCharacterName(characterName)
                        });
                    }
                });
            }
        }
        
        // Sort parts within each group and convert to array
        const groupedMoves = [];
        for (const [groupKey, group] of moveGroups) {
            // Sort parts with custom logic for jab sequences
            group.parts.sort((a, b) => this.sortMoveParts(a, b));
            groupedMoves.push(group);
            
            // Debug: Log groups with multiple parts
            if (group.parts.length > 1) {
                console.log(`Multi-part group found: ${groupKey} (${group.parts.length} parts)`);
                group.parts.forEach((part, index) => {
                    console.log(`  ${index + 1}. ${part.name}`);
                });
            }
        }
        
        return groupedMoves;
    }

    getMoveGroupKey(move, characterName) {
        // Simple grouping: group moves with the same name
        let baseName = move.name;
        let moveType = move.type;
        
        // Handle complex cases like "Side B, Hit 1 (Double-Edge Dance, Hit 1)"
        // First, extract the main move name before any comma
        const commaIndex = baseName.indexOf(',');
        if (commaIndex !== -1) {
            baseName = baseName.substring(0, commaIndex).trim();
        }
        
        // Remove parenthetical variants like (Air), (Ground), (Start), (End), etc.
        // This ensures "Side B" and "Side B (Air)" both become "Side B"
        baseName = baseName.replace(/\s*\([^)]+\)$/, '');
        
        // Special case: If the move contains "Double-Edge Dance" in parentheses,
        // group it with other Double-Edge Dance moves regardless of type
        if (move.name.includes('Double-Edge Dance')) {
            baseName = 'double-edge dance';
            moveType = 'special'; // Normalize to special type for grouping
        }
        // Special case: If the move contains "Cross Slash" in parentheses,
        // group it with other Cross Slash moves regardless of type
        else if (move.name.includes('Cross Slash')) {
            baseName = 'cross slash';
            moveType = 'side b'; // Normalize to side b type for grouping
        }
        
        // Remove numbered suffixes like " 1", " 2", " 3" - this handles Hit 1, Hit 2, etc.
        baseName = baseName.replace(/\s+\d+$/, '');
        
        // Remove rapid/finish suffixes
        baseName = baseName.replace(/\s+(rapid|finish)$/i, '');
        
        return `${characterName}-${moveType}-${baseName.toLowerCase()}`;
    }

    sortMoveParts(a, b) {
        // Simple sorting: prioritize numbered sequences, then alphabetical
        const aOrder = this.getMovePartOrder(a.name);
        const bOrder = this.getMovePartOrder(b.name);
        
        // If both have defined orders, use them
        if (aOrder !== 999 && bOrder !== 999) {
            return aOrder - bOrder;
        }
        
        // Default alphabetical sorting for moves without specific ordering
        return a.name.localeCompare(b.name);
    }

    getMovePartOrder(moveName) {
        const name = moveName.toLowerCase();
        
        // Special handling for Double-Edge Dance sequence
        if (name.includes('double-edge dance')) {
            // Extract hit number and direction
            const hitMatch = name.match(/hit\s+(\d+)/);
            if (hitMatch) {
                const hitNumber = parseInt(hitMatch[1]);
                // Order by hit number first, then by direction
                let directionOrder = 0;
                if (name.includes('neutral')) directionOrder = 1;
                else if (name.includes('up')) directionOrder = 2;
                else if (name.includes('down')) directionOrder = 3;
                
                return hitNumber * 10 + directionOrder;
            }
        }
        // Special handling for Cross Slash sequence
        else if (name.includes('cross slash')) {
            // Extract hit number from parentheses
            const hitMatch = name.match(/hit\s+(\d+)/);
            if (hitMatch) {
                return parseInt(hitMatch[1]);
            }
        }
        
        // Handle complex cases like "Side B, Hit 1 (Cross Slash, Hit 1)"
        // Extract the part after the comma for ordering
        const commaIndex = name.indexOf(',');
        if (commaIndex !== -1) {
            const afterComma = name.substring(commaIndex + 1).trim();
            
            // Handle hit sequences after comma
            const hitMatch = afterComma.match(/hit\s+(\d+)/i);
            if (hitMatch) {
                return parseInt(hitMatch[1]);
            }
            
            // Handle numbered sequences after comma
            const numberMatch = afterComma.match(/(\d+)/);
            if (numberMatch) {
                return parseInt(numberMatch[1]);
            }
            
            // Handle variants after comma
            if (afterComma.includes('ground')) return 1;
            if (afterComma.includes('air')) return 2;
            if (afterComma.includes('start')) return 1;
            if (afterComma.includes('end')) return 2;
            if (afterComma.includes('uncharged')) return 1;
            if (afterComma.includes('charged')) return 2;
            if (afterComma.includes('left')) return 1;
            if (afterComma.includes('right')) return 2;
        }
        
        // Handle numbered sequences (1, 2, 3, etc.) in the main name
        const numberMatch = name.match(/\s+(\d+)$/);
        if (numberMatch) {
            return parseInt(numberMatch[1]);
        }
        
        // Handle rapid/finish variants
        if (name.includes('rapid') && !name.includes('finish')) return 4;
        if (name.includes('finish')) return 5;
        
        // Default order for moves without specific patterns (base moves come first)
        return 0;
    }

    getRandomIndices(max, count) {
        const indices = [];
        while (indices.length < count) {
            const randomIndex = Math.floor(Math.random() * max);
            if (!indices.includes(randomIndex)) {
                indices.push(randomIndex);
            }
        }
        return indices;
    }

    formatCharacterName(name) {
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    displayComparison() {
        document.getElementById('comparisonArea').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';

        // Reset any previous selection colors
        this.resetSelectionColors();

        // Create initial card structure
        this.createMoveCardStructure('move1Card', this.currentMove1);
        this.createMoveCardStructure('move2Card', this.currentMove2);
        
        // Update the card content
        this.updateMoveCard('move1Card', this.currentMove1);
        this.updateMoveCard('move2Card', this.currentMove2);
        
        this.enableCardSelection();
    }

    createMoveCardStructure(cardId, moveGroup) {
        const card = document.getElementById(cardId);
        const hasMultipleParts = moveGroup.parts.length > 1;
        
        card.innerHTML = `
            <div class="move-header">
                <h3></h3>
                ${hasMultipleParts ? `
                    <div class="move-navigation">
                        <button class="nav-arrow left" data-card="${cardId}" data-direction="prev">‹</button>
                        <button class="nav-arrow right" data-card="${cardId}" data-direction="next">›</button>
                    </div>
                ` : ''}
            </div>
            <div class="move-info">
                <h4></h4>
                <div class="frame-data"></div>
            </div>
        `;
    }

    resetSelectionColors() {
        const move1Card = document.getElementById('move1Card');
        const move2Card = document.getElementById('move2Card');
        
        // Remove all selection color classes
        move1Card.classList.remove('selected-green', 'selected-red');
        move2Card.classList.remove('selected-green', 'selected-red');
    }

    updateMoveCard(cardId, moveGroup) {
        const card = document.getElementById(cardId);
        const currentMove = moveGroup.parts[moveGroup.currentPartIndex];
        
        // Compare with other move to determine better/worse values
        const otherMoveGroup = cardId === 'move1Card' ? this.currentMove2 : this.currentMove1;
        const otherCurrentMove = otherMoveGroup.parts[otherMoveGroup.currentPartIndex];
        
        const hasMultipleParts = moveGroup.parts.length > 1;
        const partIndicator = hasMultipleParts ? ` (${moveGroup.currentPartIndex + 1}/${moveGroup.parts.length})` : '';
        
        // Update the move name and part indicator
        const titleElement = card.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = `${currentMove.name}${partIndicator}`;
        }
        
        // Update the character name
        const characterElement = card.querySelector('h4');
        if (characterElement) {
            characterElement.textContent = currentMove.characterDisplayName;
        }
        
        // Update frame data values
        const frameDataDiv = card.querySelector('.frame-data');
        if (frameDataDiv) {
            frameDataDiv.innerHTML = `
                <div><span>Startup:</span><span class="value ${this.getBetterWorse(currentMove.startupFrames, otherCurrentMove.startupFrames, 'lower')}">${currentMove.startupFrames}f</span></div>
                <div><span>Active:</span><span class="value ${this.getBetterWorse(currentMove.activeFrames, otherCurrentMove.activeFrames, 'higher')}">${currentMove.activeFrames}f</span></div>
                <div><span>Endlag:</span><span class="value ${this.getBetterWorse(currentMove.endLag, otherCurrentMove.endLag, 'lower')}">${currentMove.endLag}f</span></div>
                <div><span>Damage:</span><span class="value ${this.getBetterWorse(currentMove.damage, otherCurrentMove.damage, 'higher')}">${currentMove.damage}%</span></div>
                <div><span>On Shield:</span><span class="value ${this.getBetterWorse(currentMove.onShieldLag, otherCurrentMove.onShieldLag, 'higher')}">${currentMove.onShieldLag}f</span></div>
                <div><span>Shield Lag:</span><span class="value ${this.getBetterWorse(currentMove.shieldLag, otherCurrentMove.shieldLag, 'lower')}">${currentMove.shieldLag}f</span></div>
                <div><span>Shield Stun:</span><span class="value ${this.getBetterWorse(currentMove.shieldStun, otherCurrentMove.shieldStun, 'higher')}">${currentMove.shieldStun}f</span></div>
                ${currentMove.notes ? `<div><span>Notes:</span><span class="value">${currentMove.notes}</span></div>` : ''}
            `;
        }
    }

    navigateMovePart(cardId, direction) {
        const moveGroup = cardId === 'move1Card' ? this.currentMove1 : this.currentMove2;
        
        if (direction === 'prev') {
            moveGroup.currentPartIndex = (moveGroup.currentPartIndex - 1 + moveGroup.parts.length) % moveGroup.parts.length;
        } else {
            moveGroup.currentPartIndex = (moveGroup.currentPartIndex + 1) % moveGroup.parts.length;
        }
        
        // Update both cards to refresh the comparison
        this.updateMoveCard('move1Card', this.currentMove1);
        this.updateMoveCard('move2Card', this.currentMove2);
    }

    getBetterWorse(value1, value2, better) {
        if (better === 'lower') {
            return value1 < value2 ? 'better' : (value1 > value2 ? 'worse' : '');
        } else {
            return value1 > value2 ? 'better' : (value1 < value2 ? 'worse' : '');
        }
    }

    enableCardSelection() {
        const move1Card = document.getElementById('move1Card');
        const move2Card = document.getElementById('move2Card');
        
        // Remove existing event listeners
        const newMove1Card = move1Card.cloneNode(true);
        const newMove2Card = move2Card.cloneNode(true);
        move1Card.parentNode.replaceChild(newMove1Card, move1Card);
        move2Card.parentNode.replaceChild(newMove2Card, move2Card);
        
        // Ensure colors are reset after cloning
        newMove1Card.classList.remove('selected-green', 'selected-red');
        newMove2Card.classList.remove('selected-green', 'selected-red');
        
        // Add card click listeners that check if the click was on navigation arrows
        newMove1Card.addEventListener('click', (e) => {
            // Don't select if clicking on navigation arrows
            if (e.target.classList.contains('nav-arrow') || e.target.closest('.nav-arrow')) {
                return;
            }
            this.selectMove(1);
        });
        
        newMove2Card.addEventListener('click', (e) => {
            // Don't select if clicking on navigation arrows
            if (e.target.classList.contains('nav-arrow') || e.target.closest('.nav-arrow')) {
                return;
            }
            this.selectMove(2);
        });
        
        // Re-add navigation event listeners after cloning
        this.addNavigationListeners('move1Card');
        this.addNavigationListeners('move2Card');
        
        // Enable tie button
        const tieBtn = document.getElementById('tieChoice');
        tieBtn.disabled = false;
        tieBtn.style.opacity = '1';
    }

    addNavigationListeners(cardId) {
        const card = document.getElementById(cardId);
        const leftArrow = card.querySelector('.nav-arrow.left');
        const rightArrow = card.querySelector('.nav-arrow.right');
        
        if (leftArrow) {
            leftArrow.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.navigateMovePart(cardId, 'prev');
            });
        }
        
        if (rightArrow) {
            rightArrow.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.navigateMovePart(cardId, 'next');
            });
        }
    }

    selectMove(moveNumber) {
        const move1Card = document.getElementById('move1Card');
        const move2Card = document.getElementById('move2Card');
        const tieBtn = document.getElementById('tieChoice');
        
        // Disable all interactions
        tieBtn.disabled = true;
        tieBtn.style.opacity = '0.5';
        
        // Show selection feedback
        if (moveNumber === 1) {
            move1Card.classList.add('selected-green');
            move2Card.classList.add('selected-red');
        } else {
            move2Card.classList.add('selected-green');
            move1Card.classList.add('selected-red');
        }
        
        // Record choice and generate next comparison after 0.3s
        setTimeout(() => {
            this.recordChoice(moveNumber);
        }, 300);
    }

    async recordChoice(choice) {
        if (!this.currentMove1 || !this.currentMove2) return;

        // Extract the actual move objects (not the move groups)
        const move1 = this.currentMove1.parts[this.currentMove1.currentPartIndex];
        const move2 = this.currentMove2.parts[this.currentMove2.currentPartIndex];

        const choiceData = {
            move1: {
                id: move1.id,
                name: move1.name,
                character: move1.character,
                characterDisplayName: move1.characterDisplayName
            },
            move2: {
                id: move2.id,
                name: move2.name,
                character: move2.character,
                characterDisplayName: move2.characterDisplayName
            },
            userChoice: choice,
            moveType: this.currentMoveType,
            timestamp: new Date().toISOString(),
            btlPrediction: this.calculateBTLPrediction()
        };

        this.userChoices.push(choiceData);
        this.sessionStats.comparisons++;

        this.updateSessionStats();
        await this.saveUserChoice(choiceData);
        
        // Update global rankings
        await this.updateGlobalRankings(choiceData);
        
        // Generate next comparison immediately
        this.generateRandomComparison();
    }

    calculateBTLPrediction() {
        // Use BTL calculator for prediction
        const move1 = this.currentMove1.parts[this.currentMove1.currentPartIndex];
        const move2 = this.currentMove2.parts[this.currentMove2.currentPartIndex];
        
        // Get moves of this type for BTL calculation
        const movesOfType = this.getMovesOfType(this.currentMoveType);
        const moveData = this.btlCalculator.createMoveDataMap(movesOfType, this.userChoices.filter(choice => choice.moveType === this.currentMoveType));
        
        return this.btlCalculator.calculateBTLPrediction(move1, move2, moveData);
    }


    async saveUserChoice(choiceData) {
        try {
            // Save to localStorage (immediate)
            const savedChoices = JSON.parse(localStorage.getItem('userChoices') || '[]');
            savedChoices.push(choiceData);
            localStorage.setItem('userChoices', JSON.stringify(savedChoices));
            window.userChoices = savedChoices;
            
            // Save to Firebase (async)
            if (this.firebaseManager.isConnected()) {
                await this.firebaseManager.saveUserChoice(choiceData);
            }
        } catch (error) {
            console.error('Error saving user choice:', error);
        }
    }

    async updateGlobalRankings(choiceData) {
        try {
            if (!this.firebaseManager.isConnected()) {
                return;
            }

            // Get all user choices for this move type
            const allUserChoices = await this.firebaseManager.loadUserChoices();
            const typeChoices = allUserChoices.filter(choice => choice.moveType === this.currentMoveType);
            
            // Only update global rankings if there are actual user choices
            if (typeChoices.length === 0) {
                console.log(`No user choices for ${this.currentMoveType}, skipping global rankings update`);
                return;
            }
            
            // Calculate new BTL scores for all moves of this type
            const moveGroups = this.getMovesOfType(this.currentMoveType);
            
            // Flatten move groups to individual moves for BTL calculation
            const movesOfType = [];
            moveGroups.forEach(group => {
                group.parts.forEach(move => {
                    movesOfType.push(move);
                });
            });
            
            console.log(`Calculating BTL scores for ${this.currentMoveType}:`);
            console.log('Move groups:', moveGroups.length);
            console.log('Individual moves:', movesOfType.length);
            console.log('Type choices:', typeChoices.length);
            console.log('Choice details:', typeChoices.map(c => ({
                move1: c.move1.id,
                move2: c.move2.id,
                choice: c.userChoice
            })));
            console.log('Available move IDs:', movesOfType.map(m => m.id).slice(0, 10)); // Show first 10
            
            const newRankings = this.btlCalculator.calculateBTLScores(movesOfType, typeChoices, this.currentMoveType);
            console.log('New rankings calculated:', newRankings.length);
            
            // Only save if we have actual rankings (not empty array)
            if (newRankings.length > 0) {
                // Save updated global rankings
                await this.firebaseManager.saveGlobalRankings(this.currentMoveType, newRankings);
                console.log(`Updated global rankings for ${this.currentMoveType} with ${newRankings.length} moves`);
            } else {
                console.log(`No rankings calculated for ${this.currentMoveType}, skipping global rankings save`);
            }
        } catch (error) {
            console.error('Error updating global rankings:', error);
        }
    }

    updateSessionStats() {
        document.getElementById('comparisonsCount').textContent = this.sessionStats.comparisons;
    }

    showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #dc3545;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        `;
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ExclusiveComparison();
});