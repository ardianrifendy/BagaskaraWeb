import requests
import pandas as pd
import re
import time

df = pd.read_csv("katalog_smartphone_db_varian_2026-07-09.csv")
# Get 20 unique url_keys from Link_Produk
url_keys = []
for link in df['Link_Produk'].dropna().unique():
    k = link.split('/')[-1]
    if k and k not in url_keys:
        url_keys.append(k)
    if len(url_keys) >= 20:
        break

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

print("Scanning products for rich specs in description / additional_information...")

for k in url_keys:
    # 1. Check main product detail endpoint
    url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{k}"
    r = requests.get(url, headers=headers, params={"store_code": "erafone"})
    add_info = ""
    if r.status_code == 200:
        data = r.json().get("data", {})
        add_info = data.get("additional_information", "")
        if add_info:
            print(f"\n[+] {k} - Found additional_information (length: {len(add_info)}):")
            print(add_info[:600])
            
    # 2. Check product description endpoint
    desc_url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{k}/description"
    r2 = requests.get(desc_url, headers=headers, params={"store_code": "erafone"})
    if r2.status_code == 200:
        desc_data = r2.json().get("data", {})
        short_desc = desc_data.get("short_description", "")
        desc = desc_data.get("description", "")
        
        if short_desc:
            print(f"\n[+] {k} - Found short_description (length: {len(short_desc)}):")
            print(short_desc[:600])
            
        # Check if description has bullet points with specs (look for keywords like CPU, GPU, Ukuran layar)
        if desc and ("ukuran layar" in desc.lower() or "cpu" in desc.lower() or "baterai" in desc.lower()):
            print(f"\n[+] {k} - Found specs keywords in description (length: {len(desc)}):")
            print(desc[:1000])
            
    time.sleep(0.3)
print("\nScan complete.")
