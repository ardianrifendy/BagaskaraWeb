import requests
import json

# Let's try to fetch a few different products
keys = ["iphone-15-pro-max", "samsung-galaxy-s24-ultra", "xiaomi-14t-pro", "oppo-reno11-pro-5g"]
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

for k in keys:
    url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{k}"
    r = requests.get(url, headers=headers, params={"store_code": "erafone"})
    if r.status_code == 200:
        data = r.json().get("data", {})
        print(f"\n==================== {k} ====================")
        
        # Let's print the brand & name
        print("Brand:", data.get("brand"), "| Name:", data.get("name"))
        
        # Let's inspect media_description
        m_desc = data.get("media_description", "")
        if m_desc:
            print("Media Description Length:", len(m_desc))
            print("Media Description Sample:")
            print(str(m_desc)[:500])
        else:
            print("Media Description is EMPTY")
            
        # Let's inspect additional_information
        add_info = data.get("additional_information", "")
        if add_info:
            print("Additional Information Length:", len(add_info))
            print("Additional Information Sample:")
            print(str(add_info)[:500])
        else:
            print("Additional Information is EMPTY")
            
        # Let's print filterable_attributes keys
        filt_attrs = data.get("filterable_attributes", [])
        print("Filterable attributes count:", len(filt_attrs))
        if filt_attrs:
            print("Sample filterable attribute:", filt_attrs[:2])
            
        # Let's search inside data for any nested dicts or arrays that might have spec details
        # Check all_attributes
        all_attrs = data.get("all_attributes", [])
        if all_attrs:
            print("All attributes list:")
            print(all_attrs)
    else:
        print(f"Failed to fetch {k}: {r.status_code}")
