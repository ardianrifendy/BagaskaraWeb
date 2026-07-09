import re
import sqlite3
import pandas as pd
import os

def clean_trailing_ram_slash(name):
    # Match trailing space, digits, and a slash (e.g. " 12/" or " 8/" or " 16/")
    return re.sub(r'\s+\d+/$', '', str(name)).strip()

def main():
    csv_file = "katalog_smartphone_db_varian_2026-07-09.csv"
    db_file = "database.db"

    # 1. Clean the CSV file
    if os.path.exists(csv_file):
        print(f"Cleaning trailing RAM/slash in CSV: {csv_file}")
        df = pd.read_csv(csv_file)
        
        # Clean 'name' column
        df['name'] = df['name'].apply(clean_trailing_ram_slash)
        
        # Re-generate productId slug from cleaned name
        def make_slug(name):
            text = str(name).lower().strip()
            text = re.sub(r'[^a-z0-9\s-]', '', text)
            text = re.sub(r'[\s-]+', '-', text)
            return text.strip('-')
        
        df['productId'] = df['name'].apply(make_slug)
        
        # Update variantId
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
