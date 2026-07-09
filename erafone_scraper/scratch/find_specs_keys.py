import requests
import json
import pandas as pd
import os

df = pd.read_csv("katalog_smartphone_db_varian_2026-07-09.csv")
# Get 3 unique url_keys from Link_Produk
url_keys = []
for link in df['Link_Produk'].dropna().unique():
    k = link.split('/')[-1]
    if k and k not in url_keys:
        url_keys.append(k)
    if len(url_keys) >= 3:
        break

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

for k in url_keys:
    print(f"\n==================== {k} ====================")
    url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{k}"
    r = requests.get(url, headers=headers, params={"store_code": "erafone"})
    if r.status_code == 200:
        data = r.json().get("data", {})
        non_empty = []
        for key, val in data.items():
            if val:
                if isinstance(val, (str, list, dict)):
                    if len(val) > 0:
                        non_empty.append((key, type(val), len(val)))
        print("Non-empty keys:")
        for name, t, size in non_empty:
            print(f"  {name} ({t.__name__}) - size/len: {size}")
            # If it's a small dict or list, print it
            if name in ["additional_information", "media_description", "all_attributes", "categories"]:
                print(f"    Value: {str(val)[:300]}")
    else:
        print("Failed to fetch:", r.status_code)
