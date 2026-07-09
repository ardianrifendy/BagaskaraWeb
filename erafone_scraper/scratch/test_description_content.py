import requests

url = "https://jeanne.eraspace.com/products/api/v4.1/products/samsung-galaxy-s24-ultra/description"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

r = requests.get(url, headers=headers, params={"store_code": "erafone"})
if r.status_code == 200:
    data = r.json().get("data", {})
    print("Keys in data:")
    print(list(data.keys()))
    
    desc = data.get("description", "")
    print(f"\n--- description (length: {len(desc)}) ---")
    if desc:
        print(desc[:2000])
        
    ccm_long = data.get("ccm_long_desc", "")
    print(f"\n--- ccm_long_desc (length: {len(ccm_long)}) ---")
    if ccm_long:
        print(ccm_long[:2000])
else:
    print("Failed:", r.status_code)
