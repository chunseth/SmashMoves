#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to bundle all character data into a single JSON file
 * for easier loading in the web application
 */

const OUT_DIR = './out';
const OUTPUT_FILE = './character-data-bundle.json';

function loadCharacterData() {
    const characterData = {};
    
    // Read all JSON files in the out directory
    const files = fs.readdirSync(OUT_DIR).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} character files`);
    
    files.forEach(file => {
        const characterSlug = path.basename(file, '.json');
        const filePath = path.join(OUT_DIR, file);
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            characterData[characterSlug] = data;
            console.log(`✓ Loaded ${characterSlug}: ${data.length} moves`);
        } catch (error) {
            console.error(`✗ Failed to load ${characterSlug}:`, error.message);
        }
    });
    
    return characterData;
}

function createDataBundle() {
    console.log('Creating character data bundle...');
    
    const characterData = loadCharacterData();
    
    // Add metadata
    const bundle = {
        metadata: {
            created: new Date().toISOString(),
            totalCharacters: Object.keys(characterData).length,
            totalMoves: Object.values(characterData).reduce((sum, moves) => sum + moves.length, 0),
            version: '1.0.0'
        },
        characters: characterData
    };
    
    // Write bundle file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle, null, 2));
    
    console.log(`✓ Created bundle: ${OUTPUT_FILE}`);
    console.log(`✓ Total characters: ${bundle.metadata.totalCharacters}`);
    console.log(`✓ Total moves: ${bundle.metadata.totalMoves}`);
}

// Run the script
if (require.main === module) {
    createDataBundle();
}

module.exports = { createDataBundle, loadCharacterData };
