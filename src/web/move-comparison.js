// Global variables
let charactersData = {};
let currentFilter = 'all';
let currentCharacter1 = null;
let currentCharacter2 = null;

// Character list for dropdown population
const characterList = [
    'banjo_and_kazooie', 'bayonetta', 'bowser', 'bowser_jr', 'byleth',
    'captain_falcon', 'chrom', 'cloud', 'corrin', 'daisy', 'dark_pit',
    'dark_samus', 'diddy_kong', 'donkey_kong', 'dr_mario', 'duck_hunt',
    'falco', 'fox', 'ganondorf', 'greninja', 'hero', 'ice_climbers',
    'ike', 'inkling', 'isabelle', 'jigglypuff', 'joker', 'kazuya',
    'ken', 'king_dedede', 'king_k_rool', 'kirby', 'link', 'little_mac',
    'lucario', 'lucas', 'lucina', 'luigi', 'mario', 'marth',
    'mega_man', 'meta_knight', 'mewtwo', 'mii_brawler', 'mii_gunner',
    'mii_swordfighter', 'minmin', 'mr_game_and_watch', 'mythra',
    'ness', 'olimar', 'pac_man', 'palutena', 'peach', 'pichu',
    'pikachu', 'piranha_plant', 'pit', 'pt_charizard', 'pt_ivysaur',
    'pt_squirtle', 'pyra', 'richter', 'ridley', 'rob', 'robin',
    'rosalina_and_luma', 'roy', 'ryu', 'samus', 'sephiroth',
    'sheik', 'shulk', 'simon', 'snake', 'sonic', 'steve',
    'terry', 'toon_link', 'villager', 'wario', 'wii_fit_trainer',
    'wolf', 'yoshi', 'young_link', 'zelda', 'zero_suit_samus'
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    populateCharacterDropdowns();
    setupEventListeners();
    await loadCharactersData();
}

function populateCharacterDropdowns() {
    const select1 = document.getElementById('character1');
    const select2 = document.getElementById('character2');
    
    characterList.forEach(char => {
        const displayName = formatCharacterName(char);
        
        const option1 = new Option(displayName, char);
        const option2 = new Option(displayName, char);
        
        select1.add(option1);
        select2.add(option2);
    });
}

function formatCharacterName(slug) {
    return slug.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function setupEventListeners() {
    // Character selection
    document.getElementById('character1').addEventListener('change', (e) => {
        currentCharacter1 = e.target.value;
        updateComparison();
    });
    
    document.getElementById('character2').addEventListener('change', (e) => {
        currentCharacter2 = e.target.value;
        updateComparison();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveFilter(e.target.dataset.type);
            updateComparison();
        });
    });
    
    // Checkboxes
    const sortByStartupCheckbox = document.getElementById('sortByStartup');
    if (sortByStartupCheckbox) {
        sortByStartupCheckbox.addEventListener('change', (e) => {
            updateComparison();
        });
    }
}

async function loadCharactersData() {
    try {
        console.log('Attempting to load character-data-bundle.json...');
        // Add cache-busting timestamp to force reload
        const timestamp = new Date().getTime();
        const response = await fetch(`../../assets/data/character-data-bundle.json?t=${timestamp}`);
        if (response.ok) {
            const bundle = await response.json();
            charactersData = bundle.characters;
            console.log('✅ Loaded character data bundle:', bundle.metadata.totalCharacters, 'characters with', bundle.metadata.totalMoves, 'total moves');
            console.log('Bundle created at:', bundle.metadata.created);
            console.log('Available characters:', Object.keys(charactersData).slice(0, 5), '...');
        } else {
            console.log('❌ Bundle not found (status:', response.status, '), loading individual files...');
            await loadCharactersDataIndividual();
        }
    } catch (error) {
        console.error('❌ Failed to load data bundle:', error);
        // Fallback to individual files
        await loadCharactersDataIndividual();
    }
}

async function loadCharactersDataIndividual() {
    const loadingPromises = characterList.map(async (char) => {
        try {
            const response = await fetch(`../../assets/data/out/${char}.json`);
            if (response.ok) {
                const data = await response.json();
                charactersData[char] = data;
            }
        } catch (error) {
            console.error(`Failed to load ${char}:`, error);
        }
    });
    
    await Promise.all(loadingPromises);
    console.log('Loaded character data:', Object.keys(charactersData).length, 'characters');
}

function setActiveFilter(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    currentFilter = type;
}

function updateComparison() {
    console.log('updateComparison called:', {
        currentCharacter1,
        currentCharacter2,
        hasChar1Data: !!charactersData[currentCharacter1],
        hasChar2Data: !!charactersData[currentCharacter2],
        totalCharactersLoaded: Object.keys(charactersData).length
    });
    
    if (!currentCharacter1 || !currentCharacter2 || !charactersData[currentCharacter1] || !charactersData[currentCharacter2]) {
        console.log('Showing selection placeholder - missing data');
        showSelectionPlaceholder();
        return;
    }
    
    console.log('Showing comparison table');
    showComparisonTable();
    generateComparisonTable();
}

function showSelectionPlaceholder() {
    document.getElementById('comparisonTable').style.display = 'none';
    document.getElementById('selectionPlaceholder').style.display = 'block';
}

function showComparisonTable() {
    document.getElementById('comparisonTable').style.display = 'block';
    document.getElementById('selectionPlaceholder').style.display = 'none';
}

function generateComparisonTable() {
    const char1Moves = charactersData[currentCharacter1];
    const char2Moves = charactersData[currentCharacter2];
    
    // Filter moves if needed
    let filteredMoves1 = char1Moves;
    let filteredMoves2 = char2Moves;
    
    if (currentFilter !== 'all') {
        filteredMoves1 = char1Moves.filter(move => move.type === currentFilter);
        filteredMoves2 = char2Moves.filter(move => move.type === currentFilter);
    }
    
    // Create a map of moves by name for easier comparison
    const moves1Map = new Map();
    const moves2Map = new Map();
    
    filteredMoves1.forEach(move => {
        const key = move.name.toLowerCase();
        if (!moves1Map.has(key) || (move.startupFrames || 0) < (moves1Map.get(key).startupFrames || 999)) {
            moves1Map.set(key, move);
        }
    });
    
    filteredMoves2.forEach(move => {
        const key = move.name.toLowerCase();
        if (!moves2Map.has(key) || (move.startupFrames || 0) < (moves2Map.get(key).startupFrames || 999)) {
            moves2Map.set(key, move);
        }
    });
    
    // Get all unique move names
    const allMoveNames = new Set([...moves1Map.keys(), ...moves2Map.keys()]);
    const sortedMoveNames = Array.from(allMoveNames).sort();
    
    // Update table headers
    document.getElementById('char1Header').textContent = formatCharacterName(currentCharacter1);
    document.getElementById('char2Header').textContent = formatCharacterName(currentCharacter2);
    document.getElementById('comparisonTitle').textContent = `${formatCharacterName(currentCharacter1)} vs ${formatCharacterName(currentCharacter2)}`;
    
    // Generate table body
    const tableBody = document.getElementById('comparisonTableBody');
    tableBody.innerHTML = '';
    
    sortedMoveNames.forEach(moveName => {
        const move1 = moves1Map.get(moveName);
        const move2 = moves2Map.get(moveName);
        
        const row = document.createElement('tr');
        
        // Move name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'move-name-cell';
        nameCell.innerHTML = `
            ${move1 ? move1.name : move2.name}
            <span class="move-type-badge">${move1 ? move1.type : move2.type}</span>
        `;
        row.appendChild(nameCell);
        
        // Character 1 data
        const char1Cell = document.createElement('td');
        char1Cell.className = 'move-data-cell';
        if (move1) {
            char1Cell.innerHTML = createMoveDataHTML(move1, move2, 1);
        } else {
            char1Cell.innerHTML = '<span style="color: #ccc;">-</span>';
        }
        row.appendChild(char1Cell);
        
        // Character 2 data
        const char2Cell = document.createElement('td');
        char2Cell.className = 'move-data-cell';
        if (move2) {
            char2Cell.innerHTML = createMoveDataHTML(move2, move1, 2);
        } else {
            char2Cell.innerHTML = '<span style="color: #ccc;">-</span>';
        }
        row.appendChild(char2Cell);
        
        tableBody.appendChild(row);
    });
}

function createMoveDataHTML(move, otherMove, characterNum) {
    const stats = [
        { label: 'Startup', value: move.startupFrames || 0, key: 'startupFrames', lowerIsBetter: true },
        { label: 'Active', value: move.activeFrames || 0, key: 'activeFrames', lowerIsBetter: false },
        { label: 'End Lag', value: move.endLag || 0, key: 'endLag', lowerIsBetter: true },
        { label: 'Damage', value: move.damage || 0, key: 'damage', lowerIsBetter: false },
        { label: 'On Shield', value: move.onShieldLag || 0, key: 'onShieldLag', lowerIsBetter: false },
        { label: 'Shield Lag', value: move.shieldLag || 0, key: 'shieldLag', lowerIsBetter: true },
        { label: 'Shield Stun', value: move.shieldStun || 0, key: 'shieldStun', lowerIsBetter: false }
    ];
    
    let html = '';
    
    stats.forEach(stat => {
        const comparisonClass = getComparisonClass(stat, otherMove, characterNum);
        const displayValue = typeof stat.value === 'number' ? stat.value : stat.value;
        
        html += `
            <div class="stat-row">
                <span class="stat-label">${stat.label}:</span>
                <span class="stat-value ${comparisonClass}">${displayValue}${stat.key === 'damage' ? '%' : stat.key === 'startupFrames' || stat.key === 'activeFrames' || stat.key === 'endLag' || stat.key === 'shieldLag' || stat.key === 'shieldStun' ? 'f' : ''}</span>
            </div>
        `;
    });
    
    return html;
}

function getComparisonClass(stat, otherMove, characterNum) {
    if (!otherMove) {
        return 'equal';
    }
    
    const myValue = stat.value;
    const otherValue = otherMove[stat.key] || 0;
    
    if (typeof myValue !== 'number' || typeof otherValue !== 'number') {
        return 'equal';
    }
    
    if (stat.lowerIsBetter) {
        // For startup, end lag, on shield - lower is better
        if (myValue < otherValue) {
            return 'better';
        } else if (myValue > otherValue) {
            return 'worse';
        } else {
            return 'equal';
        }
    } else {
        // For damage, active frames, shield stun - higher is better
        if (myValue > otherValue) {
            return 'better';
        } else if (myValue < otherValue) {
            return 'worse';
        } else {
            return 'equal';
        }
    }
}

function toggleCharts(show) {
    const chartsSection = document.getElementById('chartsSection');
    chartsSection.style.display = show ? 'block' : 'none';
    
    if (show) {
        updateCharts();
    }
}

function updateCharts() {
    // Charts functionality can be added here if needed
    // For now, focusing on the table comparison
}