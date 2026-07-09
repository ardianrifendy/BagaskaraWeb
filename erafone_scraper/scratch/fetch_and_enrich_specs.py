import re
import sqlite3
import pandas as pd
import requests
import json
import html
import time
import os

def parse_specs_and_highlights(filterable_attributes, short_desc_html=None):
    attrs = {}
    if filterable_attributes:
        attrs = {item.get("name"): item for item in filterable_attributes if isinstance(item, dict)}
    
    os_val = attrs.get("smartphone_os_filter", {}).get("value", "")
    proc = attrs.get("smartphone_processor_filter", {}).get("value", "")
    ram = attrs.get("smartphone_ram", {}).get("value", "")
    rom = attrs.get("smartphone_rom", {}).get("value", "")
    screen = attrs.get("smartphone_screen_filter", {}).get("value", "")
    rear_cam = attrs.get("smartphone_camerarear_filter", {}).get("value", "")
    front_cam = attrs.get("smartphone_camerafront_filter", {}).get("value", "")
    battery = attrs.get("smartphone_battery_filter", {}).get("value", "")
    
    ram_clean = str(ram).replace(" ", "")
    rom_clean = str(rom).replace(" ", "")
    storage_str = f"{ram_clean}/{rom_clean}" if ram_clean and rom_clean else (ram_clean or rom_clean or "-")
    
    battery_clean = ""
    if battery:
        match = re.search(r'\d+', str(battery))
        battery_clean = f"{match.group()}mAh" if match else str(battery)

    # Parse short description for rich specs
    parsed_items = {}
    if short_desc_html:
        # Extract li
        lis = re.findall(r'<li>(.*?)</li>', short_desc_html, re.DOTALL | re.IGNORECASE)
        lines = []
        if lis:
            lines = [re.sub(r'<[^>]*>', '', li).strip() for li in lis]
        else:
            text = re.sub(r'<[^>]*>', '\n', short_desc_html)
            lines = [t.strip() for t in text.split('\n') if t.strip()]
            
        for line in lines:
            line = html.unescape(line).strip()
            if ":" in line:
                parts = line.split(":", 1)
                lbl = parts[0].strip()
                val = parts[1].strip()
                parsed_items[lbl.lower()] = (lbl, val)

        # Overwrite values with detailed specs from short description
        for k, (lbl, val) in parsed_items.items():
            if "os" in k or "operasi" in k:
                os_val = val
            elif "cpu" in k or "prosesor" in k or "processor" in k:
                proc = val
            elif "ram" in k or "memori" in k:
                if "rom" in val.lower():
                    m_ram = re.search(r'ram\s*(\d+\s*gb)', val, re.IGNORECASE)
                    m_rom = re.search(r'rom\s*(\d+\s*gb)', val, re.IGNORECASE)
                    if m_ram: ram_clean = m_ram.group(1).replace(" ", "")
                    if m_rom: rom_clean = m_rom.group(1).replace(" ", "")
                    storage_str = f"{ram_clean}/{rom_clean}"
                else:
                    ram_clean = val.replace(" ", "")
                    storage_str = ram_clean
            elif "rom" in k or "penyimpanan" in k or "storage" in k:
                rom_clean = val.replace(" ", "")
                storage_str = f"{ram_clean}/{rom_clean}" if ram_clean else rom_clean
            elif "layar" in k or "screen" in k or "display" in k:
                screen = val
            elif "kamera" in k or "camera" in k:
                if "depan" in val.lower():
                    c_parts = re.split(r';|,|dan', val, re.IGNORECASE)
                    rear_cam = c_parts[0].strip()
                    for p_cam in c_parts[1:]:
                        if "depan" in p_cam.lower():
                            front_cam = re.sub(r'depan\s*', '', p_cam, flags=re.IGNORECASE).strip()
                else:
                    rear_cam = val
            elif "baterai" in k or "battery" in k:
                battery = val
                m_bat = re.search(r'\d+', val)
                battery_clean = f"{m_bat.group()}mAh" if m_bat else val

    # Build specSummary
    summary_parts = []
    if storage_str and storage_str != "-": summary_parts.append(storage_str)
    if proc: summary_parts.append(proc)
    if battery_clean: summary_parts.append(battery_clean)
    if rear_cam: summary_parts.append(f"Kamera {rear_cam}")
    spec_summary = " · ".join(summary_parts) if summary_parts else "-"

    # Build specs accordion
    groups = {
        "Layar": [],
        "Dapur Pacu": [],
        "Kamera": [],
        "Baterai": [],
        "Lainnya": []
    }
    
    if parsed_items:
        # Use parsed items from short description
        for k, (lbl, val) in parsed_items.items():
            if "layar" in k or "screen" in k or "display" in k:
                groups["Layar"].append({"label": lbl, "value": val})
            elif "memori" in k or "ram" in k or "rom" in k or "cpu" in k or "gpu" in k or "prosesor" in k or "processor" in k or "sistem operasi" in k or "os" in k:
                groups["Dapur Pacu"].append({"label": lbl, "value": val})
            elif "kamera" in k or "camera" in k:
                groups["Kamera"].append({"label": lbl, "value": val})
            elif "baterai" in k or "battery" in k or "daya" in k:
                groups["Baterai"].append({"label": lbl, "value": val})
            else:
                groups["Lainnya"].append({"label": lbl, "value": val})
    else:
        # Fallback to filterable attributes
        if screen: groups["Layar"].append({"label": "Ukuran Layar", "value": screen})
        if os_val: groups["Dapur Pacu"].append({"label": "Sistem Operasi", "value": os_val})
        if proc: groups["Dapur Pacu"].append({"label": "Prosesor", "value": proc})
        if ram_clean: groups["Dapur Pacu"].append({"label": "RAM", "value": ram_clean})
        if rom_clean: groups["Dapur Pacu"].append({"label": "Penyimpanan", "value": rom_clean})
        if rear_cam: groups["Kamera"].append({"label": "Kamera Belakang", "value": rear_cam})
        if front_cam: groups["Kamera"].append({"label": "Kamera Depan", "value": front_cam})
        if battery: groups["Baterai"].append({"label": "Kapasitas", "value": battery})

    specs_list = []
    for gname, items in groups.items():
        if items:
            specs_list.append({"group": gname, "items": items})

    # Build highlights
    highlights_list = []
    if proc:
        highlights_list.append({"icon": "cpu", "label": "Prosesor", "value": proc})
    if screen:
        highlights_list.append({"icon": "smartphone", "label": "Layar", "value": screen})
    if rear_cam:
        highlights_list.append({"icon": "camera", "label": "Kamera", "value": rear_cam})
    if battery_clean:
        highlights_list.append({"icon": "battery", "label": "Baterai", "value": battery_clean})

    return spec_summary, json.dumps(specs_list), json.dumps(highlights_list)

def main():
    csv_file = "katalog_smartphone_db_varian_2026-07-09.csv"
    db_file = "database.db"

    if not os.path.exists(csv_file) or not os.path.exists(db_file):
        print("[-] CSV or DB file missing.")
        return

    df = pd.read_csv(csv_file)
    # Get mapping of productId to url_key
    df['url_key'] = df['Link_Produk'].apply(lambda x: str(x).split('/')[-1] if pd.notna(x) else "")
    mapping = df[['productId', 'url_key']].drop_duplicates().to_dict('records')
    
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "store_code": "erafone"
    }
    
    print(f"[+] Enriching {len(mapping)} products in database...")
    
    success_count = 0
    for idx, item in enumerate(mapping):
        pid = item['productId']
        ukey = item['url_key']
        if not pid or not ukey:
            continue
            
        # Fetch current specs & highlights in DB to preserve them if description endpoint fails
        cursor.execute("SELECT specs, highlights, specSummary FROM products WHERE id = ?", (pid,))
        db_row = cursor.fetchone()
        if not db_row:
            continue
            
        db_specs, db_highlights, db_summary = db_row
        
        # 1. Fetch description
        desc_url = f"https://jeanne.eraspace.com/products/api/v4.1/products/{ukey}/description"
        try:
            r = requests.get(desc_url, headers=headers, params={"store_code": "erafone"}, timeout=15)
            if r.status_code == 200:
                desc_data = r.json().get("data", {})
                short_desc = desc_data.get("short_description", "")
                
                # 2. Parse current DB filterable attributes
                try:
                    filt_attrs = json.loads(db_highlights) # parse from highlights as fallback
                    # Wait, we can construct filterable attributes mock
                    filt_attrs_mock = []
                    for h in filt_attrs:
                        if h.get('icon') == 'cpu':
                            filt_attrs_mock.append({"name": "smartphone_processor_filter", "value": h.get('value')})
                        elif h.get('icon') == 'smartphone':
                            filt_attrs_mock.append({"name": "smartphone_screen_filter", "value": h.get('value')})
                        elif h.get('icon') == 'camera':
                            filt_attrs_mock.append({"name": "smartphone_camerarear_filter", "value": h.get('value')})
                        elif h.get('icon') == 'battery':
                            filt_attrs_mock.append({"name": "smartphone_battery_filter", "value": h.get('value')})
                except:
                    filt_attrs_mock = []
                
                # 3. Parse and generate rich specs
                spec_summary, specs_json, highlights_json = parse_specs_and_highlights(filt_attrs_mock, short_desc)
                
                # 4. Update SQLite database
                cursor.execute("""
                    UPDATE products
                    SET specSummary = ?, specs = ?, highlights = ?
                    WHERE id = ?
                """, (spec_summary, specs_json, highlights_json, pid))
                
                # Also update CSV DataFrame for consistency
                df.loc[df['productId'] == pid, 'specSummary'] = spec_summary
                df.loc[df['productId'] == pid, 'specs'] = specs_json
                df.loc[df['productId'] == pid, 'highlights'] = highlights_json
                
                success_count += 1
                print(f"[{idx+1}/{len(mapping)}] Enriched: {pid}")
            else:
                print(f"[{idx+1}/{len(mapping)}] Failed fetch: {pid} (status: {r.status_code})")
        except Exception as e:
            print(f"[{idx+1}/{len(mapping)}] Error: {pid} ({str(e)})")
            
        time.sleep(0.35)
        
    conn.commit()
    conn.close()
    
    # Save enriched CSV back to disk
    df.to_csv(csv_file, index=False, encoding="utf-8-sig")
    
    print(f"\n[+] Specifications enrichment complete. Successfully updated {success_count} products.")

if __name__ == "__main__":
    main()
