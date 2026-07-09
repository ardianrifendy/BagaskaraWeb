import re
import sqlite3
import pandas as pd
import os

def clean_name(name):
    n = str(name).strip()
    # Remove Erafone suffix like "- Erafone" or "- Retail" or similar
    n = re.split(r'\s*-\s*[a-zA-Z\s]+$', n)[0]
    
    # 1. Remove dual memory formats first (e.g., 12GB/256GB, 12 GB / 256 GB, 12/256 GB, 12/256)
    n = re.sub(r'\b\d+\s*(?:GB)?\s*/\s*\d+\s*(?:GB)?\b', '', n, flags=re.IGNORECASE)
    
    # 2. Remove standalone GB formats (e.g., 8GB, 256GB, 12 GB)
    n = re.sub(r'\b\d+\s*GB\b', '', n, flags=re.IGNORECASE)
    
    # Clean up multiple spaces
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def main():
    csv_file = "katalog_smartphone_db_varian_2026-07-09.csv"
    db_file = "database.db"

    # 1. Clean the CSV file
    if os.path.exists(csv_file):
        print(f"Cleaning CSV file: {csv_file}")
        df = pd.read_csv(csv_file)
        
        # Clean 'name' column
        df['name'] = df['name'].apply(clean_name)
        
        # Also clean 'productId' (re-generate slug from cleaned name)
        def make_slug(name):
            text = str(name).lower().strip()
            text = re.sub(r'[^a-z0-9\s-]', '', text)
            text = re.sub(r'[\s-]+', '-', text)
            return text.strip('-')
        
        df['productId'] = df['name'].apply(make_slug)
        
        # Update variantId (re-generate from cleaned productId + kap + warna)
        def make_variant_id(row):
            kap = str(row['storage']).strip() if pd.notna(row['storage']) else "-"
            warna = str(row['color']).strip() if pd.notna(row['color']) else "-"
            
            # Construct clean variantId suffix
            v_suffix = make_slug(f"{kap}-{warna}")
            return f"{row['productId']}-{v_suffix}" if v_suffix else row['variantId']
            
        df['variantId'] = df.apply(make_variant_id, axis=1)

        # Save back to CSV
        df.to_csv(csv_file, index=False, encoding="utf-8-sig")
        print("[+] CSV file cleaned and saved.")
    else:
        print("[-] CSV file not found.")

    # 2. Clean the SQLite database
    if os.path.exists(db_file):
        print(f"Cleaning database: {db_file}")
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        # Fetch all products
        cursor.execute("SELECT id, name FROM products")
        products = cursor.fetchall()
        
        # We need to map old product IDs to new product IDs (because renaming the name changes the slug/ID)
        # However, to avoid foreign key constraint issues, we can delete scraped products and let our import script re-insert them from the clean CSV!
        # Yes! That is the cleanest way! Since we just cleaned the CSV file, we can:
        # A. Delete all scraped products from the database (where isScraped = 1)
        # B. Run the TSX import script to re-populate the database from the clean CSV!
        # This is extremely clean and avoids any duplicate slug conflicts or key constraint issues!
        
        print("[+] Deleting old scraped products and variants from database...")
        cursor.execute("DELETE FROM variants WHERE productId IN (SELECT id FROM products WHERE isScraped = 1)")
        cursor.execute("DELETE FROM products WHERE isScraped = 1")
        conn.commit()
        conn.close()
        print("[+] SQLite cleaned. Ready to re-import.")
        
    else:
        print("[-] Database file not found.")

if __name__ == "__main__":
    main()
