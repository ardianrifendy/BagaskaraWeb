import sys
import os
import requests
import pandas as pd
import datetime
import re

# Add the erafone_scraper directory to sys.path so we can import it
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "erafone_scraper"))
import erafone_scraper

def run_non_interactive():
    # Set default scraper settings: category = 7422 (Smartphone), get variants and prices, no image download
    cid = 7422 
    name = "Smartphone"
    mode_varian = True
    ambil_harga = True
    
    session = requests.Session()
    today = datetime.date.today().isoformat()
    
    print("Scraping Erafone catalog (non-interactive mode)...")
    bases = erafone_scraper.scrape_catalog(session, cid, name)
    if not bases:
        print("No catalog items found.")
        return
        
    print(f"Expanding details and prices for {len(bases)} products...")
    rows = erafone_scraper.expand_variants(session, bases, ambil_harga)
    
    df = pd.DataFrame(rows).drop_duplicates().reset_index(drop=True)
    slug = "smartphone"
    suffix = "db_varian"
    xlsx = f"katalog_{slug}_{suffix}_{today}.xlsx"
    csv = f"katalog_{slug}_{suffix}_{today}.csv"
    
    # Save files in the root directory just like the original script
    df.to_excel(xlsx, index=False)
    df.to_csv(csv, index=False, encoding="utf-8-sig")
    
    print(f"Scrape completed successfully. Saved output files:")
    print(f"  - {xlsx}")
    print(f"  - {csv}")

if __name__ == "__main__":
    run_non_interactive()
