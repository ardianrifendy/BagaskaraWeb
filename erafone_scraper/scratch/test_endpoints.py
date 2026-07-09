import requests

url_keys = ["samsung-galaxy-s24-ultra"]
paths = [
    "",
    "/specifications",
    "/description",
    "/attributes",
    "/additional_information",
    "/details"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "store_code": "erafone"
}

for k in url_keys:
    for p in paths:
        url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{k}{p}"
        r = requests.get(url, headers=headers, params={"store_code": "erafone"})
        print(f"URL: {url} -> Status Code: {r.status_code}")
        if r.status_code == 200:
            try:
                data = r.json()
                print("  Keys:", list(data.get("data", {}).keys()) if isinstance(data.get("data"), dict) else type(data.get("data")))
            except:
                print("  Failed to parse JSON")
