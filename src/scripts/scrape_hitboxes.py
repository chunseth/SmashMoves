#!/usr/bin/env python3
"""
Ultimate Hitboxes Scraper using Browser Automation

This script uses Selenium to extract hitbox data from ultimate-hitboxes.com
Note: Requires selenium and a webdriver (Chrome/Firefox)
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import json
import time
from typing import Dict, List, Optional

def setup_driver():
    """Setup Chrome driver with options"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}")
        print("Please install ChromeDriver or use Firefox instead")
        return None

def scrape_character_hitboxes(driver, character_name: str) -> Dict:
    """Scrape hitbox data for a specific character"""
    url = f"https://ultimate-hitboxes.com/{character_name.lower()}"
    
    try:
        print(f"Loading {character_name}...")
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Wait a bit more for JavaScript to load
        time.sleep(3)
        
        # Try to find character data in the page
        # This would need to be customized based on the actual site structure
        character_data = {
            "character": character_name,
            "moves": [],
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Look for move elements (this is a placeholder - actual selectors would need to be determined)
        try:
            # Example selectors - these would need to be updated based on actual site structure
            move_elements = driver.find_elements(By.CSS_SELECTOR, ".move, .attack, [data-move]")
            
            for move_element in move_elements:
                move_data = {
                    "name": move_element.get_attribute("data-name") or move_element.text.strip(),
                    "hitboxes": []
                }
                
                # Look for hitbox data within each move
                hitbox_elements = move_element.find_elements(By.CSS_SELECTOR, ".hitbox, [data-hitbox]")
                
                for hitbox in hitbox_elements:
                    hitbox_data = {
                        "frame": hitbox.get_attribute("data-frame"),
                        "damage": hitbox.get_attribute("data-damage"),
                        "angle": hitbox.get_attribute("data-angle"),
                        "knockback": hitbox.get_attribute("data-knockback"),
                        "size": hitbox.get_attribute("data-size")
                    }
                    move_data["hitboxes"].append(hitbox_data)
                
                character_data["moves"].append(move_data)
                
        except Exception as e:
            print(f"Error extracting move data: {e}")
        
        return character_data
        
    except Exception as e:
        print(f"Error scraping {character_name}: {e}")
        return {"character": character_name, "error": str(e), "moves": []}

def main():
    """Main function to scrape hitbox data"""
    print("Ultimate Hitboxes Scraper")
    print("Note: This requires ChromeDriver to be installed")
    print()
    
    driver = setup_driver()
    if not driver:
        return
    
    try:
        # List of characters to scrape (you can modify this)
        characters = ["mario", "link", "pikachu", "joker", "pyra"]
        
        all_data = {
            "metadata": {
                "source": "https://ultimate-hitboxes.com/",
                "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_characters": len(characters)
            },
            "characters": {}
        }
        
        for char in characters:
            char_data = scrape_character_hitboxes(driver, char)
            all_data["characters"][char] = char_data
            time.sleep(2)  # Be respectful to the server
        
        # Save data
        output_file = "ultimate-hitboxes-data.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nData saved to {output_file}")
        print(f"Scraped {len(characters)} characters")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    print("This script requires Selenium and ChromeDriver.")
    print("Install with: pip install selenium")
    print("Download ChromeDriver from: https://chromedriver.chromium.org/")
    print()
    
    # Uncomment the line below to run the scraper
    # main()
