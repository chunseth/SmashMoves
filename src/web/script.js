// Move Builder Application
class MoveBuilder {
    constructor() {
        this.moves = this.loadMoves();
        this.selectedLinks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.renderMoveGrid();
        this.populateDefaultMoves();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('moveForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createMove();
        });

        // Clear form
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearForm();
        });

        // Move linker functionality
        const linkerInput = document.getElementById('linkerInput');
        linkerInput.addEventListener('input', (e) => {
            this.handleLinkerSearch(e.target.value);
        });

        // Search and filter
        document.getElementById('searchMoves').addEventListener('input', (e) => {
            this.filterMoves();
        });

        document.getElementById('filterType').addEventListener('change', () => {
            this.filterMoves();
        });

        document.getElementById('filterRarity').addEventListener('change', () => {
            this.filterMoves();
        });

        // Modal functionality
        const modal = document.getElementById('moveModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Hide linker suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.linker-container')) {
                document.getElementById('linkerSuggestions').style.display = 'none';
            }
        });

        // Import/Export functionality
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportMoves();
        });
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page content
        const pages = {
            'builder': {
                title: 'Move Builder',
                description: 'Design and create new fighting moves',
                pageId: 'builderPage'
            },
            'library': {
                title: 'Move Library',
                description: 'Browse and manage your move collection',
                pageId: 'libraryPage'
            }
        };

        const pageInfo = pages[page];
        if (pageInfo) {
            document.getElementById('pageTitle').textContent = pageInfo.title;
            document.getElementById('pageDescription').textContent = pageInfo.description;
            
            // Show/hide pages
            document.querySelectorAll('.page-section, #builderPage, #libraryPage').forEach(section => {
                section.style.display = 'none';
            });
            document.getElementById(pageInfo.pageId).style.display = 'block';
            
            // Refresh move grid if navigating to library
            if (page === 'library') {
                this.renderMoveGrid();
            }
        }
    }

    createMove() {
        const formData = new FormData(document.getElementById('moveForm'));
        const moveData = {
            name: formData.get('moveName'),
            type: formData.get('moveType'),
            rarity: formData.get('rarity'),
            startupFrames: parseInt(formData.get('startupFrames')),
            activeFrames: parseInt(formData.get('activeFrames')),
            endLag: parseInt(formData.get('endLag')),
            onShieldLag: parseInt(formData.get('onShieldLag')),
            damage: parseFloat(formData.get('damage')),
            shieldStun: parseInt(formData.get('shieldStun')),
            notes: formData.get('notes'),
            links: [...this.selectedLinks]
        };

        if (this.editingMoveId) {
            // Update existing move
            const moveIndex = this.moves.findIndex(m => m.id === this.editingMoveId);
            if (moveIndex !== -1) {
                this.moves[moveIndex] = {
                    ...this.moves[moveIndex],
                    ...moveData,
                    updatedAt: new Date().toISOString()
                };
                this.showNotification('Move updated successfully!', 'success');
            }
            this.editingMoveId = null;
        } else {
            // Create new move
            const move = {
                id: Date.now().toString(),
                ...moveData,
                createdAt: new Date().toISOString()
            };
            this.moves.push(move);
            this.showNotification('Move created successfully!', 'success');
        }

        this.saveMoves();
        this.renderMoveGrid();
        this.clearForm();
        
        // Auto-navigate to library to show the move
        setTimeout(() => {
            this.navigateToPage('library');
        }, 1000);
    }

    clearForm() {
        document.getElementById('moveForm').reset();
        this.selectedLinks = [];
        this.updateSelectedLinksDisplay();
        document.getElementById('linkerInput').value = '';
        document.getElementById('linkerSuggestions').style.display = 'none';
        
        // Reset form title and button
        document.querySelector('#builderPage h2').textContent = 'Create New Move';
        document.querySelector('#moveForm button[type="submit"]').textContent = 'Create Move';
        
        // Clear editing state
        this.editingMoveId = null;
    }

    handleLinkerSearch(query) {
        const suggestions = document.getElementById('linkerSuggestions');
        
        if (query.length < 2) {
            suggestions.style.display = 'none';
            return;
        }

        const filteredMoves = this.moves.filter(move => 
            move.name.toLowerCase().includes(query.toLowerCase()) &&
            !this.selectedLinks.includes(move.id)
        );

        if (filteredMoves.length === 0) {
            suggestions.style.display = 'none';
            return;
        }

        suggestions.innerHTML = filteredMoves.map(move => 
            `<div class="linker-suggestion" data-move-id="${move.id}">
                <strong>${move.name}</strong> (${move.type} - ${move.rarity})
            </div>`
        ).join('');

        // Add click listeners to suggestions
        suggestions.querySelectorAll('.linker-suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const moveId = suggestion.dataset.moveId;
                this.addLink(moveId);
                document.getElementById('linkerInput').value = '';
                suggestions.style.display = 'none';
            });
        });

        suggestions.style.display = 'block';
    }

    addLink(moveId) {
        if (!this.selectedLinks.includes(moveId)) {
            this.selectedLinks.push(moveId);
            this.updateSelectedLinksDisplay();
        }
    }

    removeLink(moveId) {
        this.selectedLinks = this.selectedLinks.filter(id => id !== moveId);
        this.updateSelectedLinksDisplay();
    }

    updateSelectedLinksDisplay() {
        const container = document.getElementById('selectedLinks');
        container.innerHTML = this.selectedLinks.map(moveId => {
            const move = this.moves.find(m => m.id === moveId);
            return move ? `
                <div class="link-tag">
                    ${move.name}
                    <span class="remove-link" onclick="moveBuilder.removeLink('${moveId}')">×</span>
                </div>
            ` : '';
        }).join('');
    }

    renderMoveGrid() {
        const grid = document.getElementById('moveGrid');
        const filteredMoves = this.getFilteredMoves();
        
        if (filteredMoves.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280;">No moves found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = filteredMoves.map(move => this.createMoveCard(move)).join('');
        
        // Add click listeners to move cards
        grid.querySelectorAll('.move-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking buttons
                if (!e.target.closest('.delete-move-btn') && !e.target.closest('.edit-move-btn')) {
                    this.showMoveDetails(card.dataset.moveId);
                }
            });
        });

        // Add click listeners to edit buttons
        grid.querySelectorAll('.edit-move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                this.editMove(btn.dataset.moveId);
            });
        });

        // Add click listeners to delete buttons
        grid.querySelectorAll('.delete-move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                this.deleteMove(btn.dataset.moveId);
            });
        });
    }

    createMoveCard(move) {
        const links = move.links.map(linkId => {
            const linkedMove = this.moves.find(m => m.id === linkId);
            return linkedMove ? linkedMove.name : 'Unknown Move';
        });

        return `
            <div class="move-card ${move.rarity}" data-move-id="${move.id}">
                <div class="move-header">
                    <div class="move-name">${move.name}</div>
                    <div class="move-header-right">
                        <div class="move-type">${move.type}</div>
                        <button class="edit-move-btn" data-move-id="${move.id}" title="Edit move">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="delete-move-btn" data-move-id="${move.id}" title="Delete move">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="move-stats">
                    <div class="stat-item">
                        <span class="stat-label">Startup:</span>
                        <span class="stat-value">${move.startupFrames}f</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active:</span>
                        <span class="stat-value">${move.activeFrames}f</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">End Lag:</span>
                        <span class="stat-value">${move.endLag}f</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Shield Lag:</span>
                        <span class="stat-value">${move.onShieldLag}f</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Damage:</span>
                        <span class="stat-value">${move.damage}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Shield Stun:</span>
                        <span class="stat-value">${move.shieldStun}f</span>
                    </div>
                </div>
                ${move.notes ? `<div class="move-notes">${move.notes}</div>` : ''}
                ${links.length > 0 ? `
                    <div class="move-links">
                        ${links.map(link => `<span class="link-chip">${link}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    showMoveDetails(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) return;

        const links = move.links.map(linkId => {
            const linkedMove = this.moves.find(m => m.id === linkId);
            return linkedMove ? linkedMove.name : 'Unknown Move';
        });

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2>${move.name}</h2>
            <div class="move-details">
                <div class="detail-section">
                    <h3>Basic Info</h3>
                    <p><strong>Type:</strong> ${move.type}</p>
                    <p><strong>Rarity:</strong> <span class="rarity-${move.rarity}">${move.rarity}</span></p>
                </div>
                
                <div class="detail-section">
                    <h3>Frame Data</h3>
                    <div class="frame-grid">
                        <div class="frame-item">
                            <span class="frame-label">Startup Frames:</span>
                            <span class="frame-value">${move.startupFrames}</span>
                        </div>
                        <div class="frame-item">
                            <span class="frame-label">Active Frames:</span>
                            <span class="frame-value">${move.activeFrames}</span>
                        </div>
                        <div class="frame-item">
                            <span class="frame-label">End Lag:</span>
                            <span class="frame-value">${move.endLag}</span>
                        </div>
                        <div class="frame-item">
                            <span class="frame-label">On Shield Lag:</span>
                            <span class="frame-value">${move.onShieldLag}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Damage & Effects</h3>
                    <div class="damage-grid">
                        <div class="damage-item">
                            <span class="damage-label">Damage:</span>
                            <span class="damage-value">${move.damage}%</span>
                        </div>
                        <div class="damage-item">
                            <span class="damage-label">Shield Stun:</span>
                            <span class="damage-value">${move.shieldStun} frames</span>
                        </div>
                    </div>
                </div>

                ${move.notes ? `
                    <div class="detail-section">
                        <h3>Notes</h3>
                        <p>${move.notes}</p>
                    </div>
                ` : ''}

                ${links.length > 0 ? `
                    <div class="detail-section">
                        <h3>Combo Links</h3>
                        <div class="links-list">
                            ${links.map(link => `<span class="link-item">${link}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        document.getElementById('moveModal').style.display = 'block';
    }

    getFilteredMoves() {
        const searchTerm = document.getElementById('searchMoves').value.toLowerCase();
        const typeFilter = document.getElementById('filterType').value;
        const rarityFilter = document.getElementById('filterRarity').value;

        return this.moves.filter(move => {
            const matchesSearch = move.name.toLowerCase().includes(searchTerm) ||
                                move.notes.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || move.type === typeFilter;
            const matchesRarity = !rarityFilter || move.rarity === rarityFilter;

            return matchesSearch && matchesType && matchesRarity;
        });
    }

    filterMoves() {
        this.renderMoveGrid();
    }

    populateDefaultMoves() {
        if (this.moves.length > 0) return; // Don't populate if moves already exist

        const defaultMoves = [
            {
                id: '1',
                name: 'Jab',
                type: 'normal',
                rarity: 'common',
                startupFrames: 3,
                activeFrames: 2,
                endLag: 15,
                onShieldLag: -2,
                damage: 2.0,
                shieldStun: 2,
                notes: 'Basic jab attack. Quick and safe.',
                links: [],
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Forward Tilt',
                type: 'normal',
                rarity: 'common',
                startupFrames: 8,
                activeFrames: 3,
                endLag: 20,
                onShieldLag: -5,
                damage: 8.0,
                shieldStun: 4,
                notes: 'Standard forward tilt. Good range.',
                links: ['1'],
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Up Smash',
                type: 'normal',
                rarity: 'rare',
                startupFrames: 12,
                activeFrames: 8,
                endLag: 35,
                onShieldLag: -15,
                damage: 18.0,
                shieldStun: 8,
                notes: 'Powerful upward attack. High knockback.',
                links: ['1', '2'],
                createdAt: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Falcon Punch',
                type: 'special',
                rarity: 'epic',
                startupFrames: 45,
                activeFrames: 5,
                endLag: 50,
                onShieldLag: -25,
                damage: 25.0,
                shieldStun: 12,
                notes: 'Iconic power move. Long windup, massive damage.',
                links: [],
                createdAt: new Date().toISOString()
            },
            {
                id: '5',
                name: 'Dash Attack',
                type: 'movement',
                rarity: 'uncommon',
                startupFrames: 6,
                activeFrames: 4,
                endLag: 25,
                onShieldLag: -8,
                damage: 10.0,
                shieldStun: 5,
                notes: 'Forward dash with attack. Good for approach.',
                links: ['1'],
                createdAt: new Date().toISOString()
            },
            {
                id: '6',
                name: 'Shield',
                type: 'utility',
                rarity: 'common',
                startupFrames: 1,
                activeFrames: 999,
                endLag: 7,
                onShieldLag: 0,
                damage: 0.0,
                shieldStun: 0,
                notes: 'Defensive option. Can be held indefinitely.',
                links: [],
                createdAt: new Date().toISOString()
            }
        ];

        this.moves = defaultMoves;
        this.saveMoves();
        this.renderMoveGrid();
    }

    saveMoves() {
        localStorage.setItem('smashMoves', JSON.stringify(this.moves));
    }

    loadMoves() {
        const saved = localStorage.getItem('smashMoves');
        return saved ? JSON.parse(saved) : [];
    }

    editMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) return;

        // Store the move ID for editing
        this.editingMoveId = moveId;
        
        // Populate the form with existing move data
        document.getElementById('moveName').value = move.name;
        document.getElementById('moveType').value = move.type;
        document.getElementById('rarity').value = move.rarity;
        document.getElementById('startupFrames').value = move.startupFrames;
        document.getElementById('activeFrames').value = move.activeFrames;
        document.getElementById('endLag').value = move.endLag;
        document.getElementById('onShieldLag').value = move.onShieldLag;
        document.getElementById('damage').value = move.damage;
        document.getElementById('shieldStun').value = move.shieldStun;
        document.getElementById('notes').value = move.notes || '';
        
        // Set up the links
        this.selectedLinks = [...move.links];
        this.updateSelectedLinksDisplay();
        
        // Change form title and button
        document.querySelector('#builderPage h2').textContent = 'Edit Move';
        document.querySelector('#moveForm button[type="submit"]').textContent = 'Update Move';
        
        // Navigate to builder page
        this.navigateToPage('builder');
        
        // Scroll to top of form
        document.getElementById('moveForm').scrollIntoView({ behavior: 'smooth' });
    }

    deleteMove(moveId) {
        const move = this.moves.find(m => m.id === moveId);
        if (!move) return;

        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete "${move.name}"?\n\nThis action cannot be undone.`);
        
        if (confirmed) {
            // Remove the move
            this.moves = this.moves.filter(m => m.id !== moveId);
            
            // Remove any links to this move from other moves
            this.moves.forEach(m => {
                m.links = m.links.filter(linkId => linkId !== moveId);
            });
            
            // Save changes and refresh display
            this.saveMoves();
            this.renderMoveGrid();
            this.showNotification(`"${move.name}" has been deleted`, 'success');
        }
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                this.importMoves(jsonData);
            } catch (error) {
                this.showNotification('Invalid JSON file format', 'error');
                console.error('JSON parsing error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    importMoves(jsonData) {
        // Validate JSON structure
        if (!this.validateImportFormat(jsonData)) {
            this.showNotification('Invalid move file format', 'error');
            return;
        }

        const importedMoves = jsonData.moves || [];
        let importedCount = 0;
        let skippedCount = 0;

        importedMoves.forEach(moveData => {
            // Check if move already exists (by name)
            const existingMove = this.moves.find(m => m.name === moveData.name);
            
            if (existingMove) {
                skippedCount++;
                return;
            }

            // Validate move data
            if (this.validateMoveData(moveData)) {
                // Generate new ID to avoid conflicts
                const newMove = {
                    ...moveData,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString()
                };

                this.moves.push(newMove);
                importedCount++;
            } else {
                skippedCount++;
            }
        });

        if (importedCount > 0) {
            this.saveMoves();
            this.renderMoveGrid();
            this.showNotification(
                `Imported ${importedCount} moves${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`,
                'success'
            );
        } else {
            this.showNotification('No new moves imported (all were duplicates)', 'info');
        }
    }

    validateImportFormat(jsonData) {
        return jsonData && 
               typeof jsonData === 'object' && 
               Array.isArray(jsonData.moves) &&
               jsonData.formatVersion;
    }

    validateMoveData(moveData) {
        const requiredFields = ['name', 'type', 'rarity', 'startupFrames', 'activeFrames', 'endLag', 'onShieldLag', 'damage', 'shieldStun'];
        
        for (const field of requiredFields) {
            if (moveData[field] === undefined || moveData[field] === null) {
                return false;
            }
        }

        // Validate field types and values
        return typeof moveData.name === 'string' &&
               ['normal', 'special', 'movement', 'finisher', 'utility'].includes(moveData.type) &&
               ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(moveData.rarity) &&
               typeof moveData.startupFrames === 'number' &&
               typeof moveData.activeFrames === 'number' &&
               typeof moveData.endLag === 'number' &&
               typeof moveData.onShieldLag === 'number' &&
               typeof moveData.damage === 'number' &&
               typeof moveData.shieldStun === 'number';
    }

    exportMoves() {
        const exportData = {
            formatVersion: "1.0",
            description: "SmashMoves Move Collection Export",
            metadata: {
                name: "My Move Collection",
                author: "SmashMoves User",
                version: "1.0.0",
                description: "Exported move collection from SmashMoves Move Builder",
                createdAt: new Date().toISOString(),
                totalMoves: this.moves.length
            },
            moves: this.moves.map(move => ({
                id: move.id,
                name: move.name,
                type: move.type,
                rarity: move.rarity,
                startupFrames: move.startupFrames,
                activeFrames: move.activeFrames,
                endLag: move.endLag,
                onShieldLag: move.onShieldLag,
                damage: move.damage,
                shieldStun: move.shieldStun,
                notes: move.notes || '',
                links: move.links || [],
                createdAt: move.createdAt
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smashmoves-collection-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(`Exported ${this.moves.length} moves`, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Additional CSS for modal details
const additionalStyles = `
<style>
.move-details {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.detail-section h3 {
    color: #4a5568;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
}

.frame-grid, .damage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
}

.frame-item, .damage-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #667eea;
}

.frame-label, .damage-label {
    font-weight: 500;
    color: #4a5568;
}

.frame-value, .damage-value {
    font-weight: 600;
    color: #1f2937;
}

.links-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.link-item {
    background: #667eea;
    color: white;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.85rem;
    font-weight: 500;
}

.notification {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
`;

// Add additional styles to head
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Initialize the application
let moveBuilder;
document.addEventListener('DOMContentLoaded', () => {
    moveBuilder = new MoveBuilder();
});
