import requests
import json

url = "https://jeanne.eraspace.com/products/api/v4.1/products/vivo-y31d"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

r = requests.get(url, headers=headers, params={"store_code": "erafone"})
if r.status_code == 200:
    data = r.json().get("data", {})
    print("Keys in data:")
    print(list(data.keys()))
    
    print("\n--- media_description ---")
    m_desc = data.get("media_description", "")
    print(type(m_desc))
    if m_desc:
        print(str(m_desc)[:1000])

    print("\n--- all_attributes ---")
    all_attrs = data.get("all_attributes", {})
    print(type(all_attrs))
    if isinstance(all_attrs, dict):
        print("Keys in all_attributes:", list(all_attrs.keys())[:10])
        # Print a few sample keys and values
        for k in list(all_attrs.keys())[:20]:
            print(f"  {k}: {all_attrs[k]}")
    elif isinstance(all_attrs, list):
        print("Size of all_attributes list:", len(all_attrs))
        if all_attrs:
            print("Sample item:", all_attrs[0])

    print("\n--- additional_information ---")
    add_info = data.get("additional_information", "")
    print(type(add_info))
    if add_info:
        print(str(add_info)[:1000])
else:
    print("Failed to fetch detail:", r.status_code)
