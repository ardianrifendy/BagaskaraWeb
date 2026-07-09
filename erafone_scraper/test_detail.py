import requests
import json

url = "https://jeanne.eraspace.com/products/api/v4.1/products/samsung-galaxy-a55-5g?store_code=erafone"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
    "X-Platform": "web",
    "Referer": "https://eraspace.com/",
    "Origin": "https://eraspace.com"
}

res = requests.get(url, headers=headers)
print("Status Code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    with open("detail_response.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("Saved response to detail_response.json")
    
    # Print keys
    product_data = data.get("data", {})
    print("Product Keys:", list(product_data.keys()))
    
    # Check for specs or attributes
    for key in ["custom_attributes", "additional_information", "specifications", "description", "specification"]:
        if key in product_data:
            print(f"Found key: {key}")
            # print a snippet of it
            print(str(product_data[key])[:300])
        elif key in product_data.get("extension_attributes", {}):
            print(f"Found in extension_attributes: {key}")
            print(str(product_data["extension_attributes"][key])[:300])
else:
    print("Failed to fetch detail:", res.text[:200])
