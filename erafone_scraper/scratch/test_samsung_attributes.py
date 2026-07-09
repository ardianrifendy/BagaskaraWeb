import requests
import json

url = "https://jeanne.eraspace.com/products/api/v4.1/products/samsung-galaxy-s24-ultra"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

r = requests.get(url, headers=headers, params={"store_code": "erafone"})
if r.status_code == 200:
    data = r.json().get("data", {})
    filt_attrs = data.get("filterable_attributes", [])
    print("Filterable attributes for Samsung Galaxy S24 Ultra:")
    for a in filt_attrs:
        print(f"  {a.get('label')}: {a.get('value')}")
else:
    print("Failed to fetch detail:", r.status_code)
