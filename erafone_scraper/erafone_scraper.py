"""
==========================================================================
 ERAFONE / ERASPACE CATALOG SCRAPER  v5  (dengan VARIAN, GAMBAR & DB MAPPING)
 Bagaskara Cell
--------------------------------------------------------------------------
 Alur:
   Tahap 1: Ambil daftar produk dari katalog (dapet url_key tiap produk),
            dan otomatis filter agar hanya menyisakan smartphone/tablet.
   Tahap 2: Buka detail tiap HP/tablet -> dapatkan detail varian & spesifikasi
            (specs, highlights, specSummary).
   Tahap 3: Pemetaan GAMBAR dari variant_colors & media_galleries.
   Tahap 4 (opsional): Ambil HARGA tiap varian via endpoint promo/price.
   Tahap 5 (opsional): Download otomatis gambar ke disk, dipisah by folder.
 Jalanin:
   pip install -r requirements.txt
   python erafone_scraper.py
==========================================================================
"""
import sys, time, random, datetime, re, os, urllib.request, json

sys.stdout.reconfigure(encoding='utf-8')

try:
    import requests, pandas as pd
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt
    from rich.progress import (Progress, BarColumn, TextColumn,
                               MofNCompleteColumn, TimeElapsedColumn, TimeRemainingColumn)
except ImportError:
    print("\n[!] Library belum lengkap. Jalanin: pip install -r requirements.txt\n"); sys.exit(1)

console = Console()

# =========================================================================
# [ CONFIG ]
# =========================================================================
CATALOG_URL = "https://jeanne.eraspace.com/products/api/v4.1/products/"
DETAIL_URL  = "https://jeanne.eraspace.com/products/api/v4.1/products/{url_key}"
PRICE_URL   = "https://jeanne.eraspace.com/erpi-v3/api/v3/promo/price/{sku}"
SEARCH_URL  = "https://jeanne.eraspace.com/products/api/v4.1/searchs/query"
STORE_CODE  = "erafone"
SIZE        = 30
SEARCH_LIMIT = 50
SEARCH_MAX_PAGES = 20
PRODUCT_URL_BASE = "https://eraspace.com/erafone/"

CATEGORIES = {
    "1": (7413, "Gadget & Devices"),
    "2": (7422, "Smartphone"),
    "3": (7423, "AI Phone"),
    "4": (7424, "Tablet"),
    "5": ("ALL", "Semua Kategori di atas (Deduplicated)"),
    "6": ("BRAND", "Scraping Berdasarkan Brand (Semua Kategori, Lengkap)"),
}

HEADERS = {
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                 "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept":"application/json","X-Platform":"web",
    "Referer":"https://eraspace.com/","Origin":"https://eraspace.com",
}
PRICE_HEADERS = {**HEADERS, "Authorization":"Basic c3RhZ2luZzpwYXNzc3RhZ2luZw=="}
PRICE_PARAMS  = {"sitecode":"AZ02","storecode":"erafone","membergroup":"00","qty":1,"channelid":50}

START_PAGE=1; MAX_PAGES=4; TIMEOUT=20; MAX_RETRY=3
DELAY_MIN=0.4; DELAY_MAX=0.9

BRANDS = {
    "Apple":["iphone","ipad","macbook","imac","airpods","apple watch","apple","mac "],
    "Samsung":["samsung","galaxy"],"Xiaomi":["xiaomi","redmi","poco","mi "],
    "OPPO":["oppo"],"vivo":["vivo"],"realme":["realme"],"Infinix":["infinix"],
    "Tecno":["tecno"],"iQOO":["iqoo"],"Honor":["honor"],"Huawei":["huawei"],
    "Sharp":["sharp","aquos"],"Nokia":["nokia"],"itel":["itel"],"Advan":["advan"],
    "Nothing":["nothing","cmf"],"Google":["google","pixel"],"Motorola":["motorola","moto "],
    "ZTE":["zte","nubia"],"TCL":["tcl"],"LG":["lg "],"ASUS":["asus","rog","zenfone"],
    "Lenovo":["lenovo","legion","thinkpad","ideapad"],"Acer":["acer","predator"],
    "Dell":["dell"],"MSI":["msi"],"HP":["hp "],"Sony":["sony"],"JBL":["jbl"],
}
GENERIC={"anti","tempered","premium","case","cover","charger","kabel","cable","for","new","ori"}

COLOR_HEX_MAP = {
    "black": "#1a1a2e",
    "dark": "#121212",
    "white": "#ffffff",
    "silver": "#e5e5ea",
    "gray": "#8e8e93",
    "grey": "#8e8e93",
    "titanium": "#8a8a8f",
    "gold": "#e5c158",
    "pink": "#ffc0cb",
    "rose": "#ffc0cb",
    "red": "#ff3b30",
    "blue": "#007aff",
    "green": "#34c759",
    "yellow": "#ffcc00",
    "purple": "#af52de",
    "violet": "#af52de",
    "orange": "#ff9500",
    "brown": "#a2845e",
    "bronze": "#a2845e",
    "cream": "#fffdd0",
    "navy": "#0a84ff",
    "teal": "#30b0c7",
    "lavender": "#e6e6fa",
}

def get_color_hex(color_name):
    c = str(color_name).lower().strip()
    for name, hex_val in COLOR_HEX_MAP.items():
        if name in c:
            return hex_val
    return "#8e8e93"

def detect_brand(nama):
    n=str(nama).lower().strip()
    for b,al in BRANDS.items():
        for a in al:
            if n.startswith(a): return b
    fw=re.split(r'[\s\-/]',str(nama).strip())[0]
    return "LAINNYA" if (not fw or fw.lower() in GENERIC) else fw

def is_phone_or_tablet(name, attribute_set_name):
    name_lower = str(name).lower()
    attr_lower = str(attribute_set_name).lower()
    
    # 1. Exclude accessories & other devices
    exclude_keywords = [
        "case", "cover", "charger", "cable", "kabel", "tempered glass", 
        "screen protector", "pelindung layar", "strap", "band", "watch", 
        "buds", "earphones", "headset", "headphones", "audio", "adapter",
        "powerbank", "power bank", "holder", "stand", "sleeve", "bag", "stylus", 
        "pen ", "pencil", "keyboard", "mouse", "ring", "fitbit", "garmin", 
        "laptop", "macbook", "imac", "notebook", "tv", "speaker", "router", "wifi",
        "pelindung", "anti gores", "anti-gores", "antigores", "screenguard", "converter"
    ]
    for kw in exclude_keywords:
        if re.search(r'\b' + re.escape(kw) + r'\b', name_lower):
            return False
            
    # 2. Include indicators in Tipe_Produk or Name
    include_indicators = [
        "smartphone", "tablet", "handphone", "ponsel", "phone", "ipad", "iphone", 
        "cellphone", "mobile", "telepon", "tab", "pad"
    ]
    for kw in include_indicators:
        if kw in name_lower or kw in attr_lower:
            return True
            
    # Check if first word is a known brand
    common_brands = [
        "samsung", "iphone", "ipad", "xiaomi", "redmi", "poco", "oppo", "vivo", 
        "realme", "infinix", "tecno", "iqoo", "honor", "huawei", "sharp", "nokia", "itel", "advan"
    ]
    first_word = name_lower.split(" ")[0]
    if first_word in common_brands:
        return True
        
    return False

def clean_product_name(name):
    n = str(name).strip()
    n = re.split(r'\s*-\s*[a-zA-Z\s]+$', n)[0]
    
    # 1. Remove dual memory formats first (e.g., 12GB/256GB, 12 GB / 256 GB, 12/256 GB, 12/256)
    n = re.sub(r'\b\d+\s*(?:GB)?\s*/\s*\d+\s*(?:GB)?\b', '', n, flags=re.IGNORECASE)
    
    # 2. Remove standalone GB formats (e.g., 8GB, 256GB, 12 GB)
    n = re.sub(r'\b\d+\s*GB\b', '', n, flags=re.IGNORECASE)
    
    # Clean up multiple spaces
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def generate_slug(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def parse_specs_and_highlights(filterable_attributes, short_desc_html=None):
    attrs = {item.get("name"): item for item in filterable_attributes if isinstance(item, dict)}
    
    os = attrs.get("smartphone_os_filter", {}).get("value", "")
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
        if match:
            battery_clean = f"{match.group()}mAh"
        else:
            battery_clean = str(battery)
            
    parsed_items = {}
    if short_desc_html:
        import html
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
                os = val
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
                    c_parts = re.split(r';|,|dan', val, flags=re.IGNORECASE)
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
            
    summary_parts = []
    if storage_str and storage_str != "-": summary_parts.append(storage_str)
    if proc: summary_parts.append(proc)
    if battery_clean: summary_parts.append(battery_clean)
    if rear_cam: summary_parts.append(f"Kamera {rear_cam}")
    
    spec_summary = " · ".join(summary_parts) if summary_parts else "-"
    
    groups = {
        "Layar": [],
        "Dapur Pacu": [],
        "Kamera": [],
        "Baterai": [],
        "Lainnya": []
    }
    
    if parsed_items:
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
        if screen: groups["Layar"].append({"label": "Ukuran Layar", "value": screen})
        if os: groups["Dapur Pacu"].append({"label": "Sistem Operasi", "value": os})
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
            
    specs_json = json.dumps(specs_list)
    
    highlights_list = []
    if proc:
        highlights_list.append({"icon": "cpu", "label": "Prosesor", "value": proc})
    if screen:
        highlights_list.append({"icon": "smartphone", "label": "Layar", "value": screen})
    if rear_cam:
        highlights_list.append({"icon": "camera", "label": "Kamera", "value": rear_cam})
    if battery_clean:
        highlights_list.append({"icon": "battery", "label": "Baterai", "value": battery_clean})
        
    highlights_json = json.dumps(highlights_list)
    
    return spec_summary, specs_json, highlights_json

# =========================================================================
# [ HTTP ]
# =========================================================================
def _get(session, url, headers, params=None):
    for attempt in range(1,MAX_RETRY+1):
        try:
            r=session.get(url,headers=headers,params=params,timeout=TIMEOUT)
            if r.status_code==200: return r.json()
            if r.status_code in (429,503): time.sleep(5*attempt); continue
            return None
        except requests.exceptions.RequestException:
            time.sleep(3*attempt)
    return None

def fetch_catalog(session,cid,page):
    return _get(session,CATALOG_URL,HEADERS,
                {"page":page,"size":SIZE,"category_id":cid,"store_code":STORE_CODE})

def fetch_search(session,query,page):
    return _get(session,SEARCH_URL,HEADERS,
                {"page":page,"limit":SEARCH_LIMIT,"q":query,"store_code":STORE_CODE})

def fetch_detail(session,url_key):
    d=_get(session,DETAIL_URL.format(url_key=url_key),HEADERS,{"store_code":STORE_CODE})
    return (d or {}).get("data")

def fetch_description(session,url_key):
    d=_get(session,f"https://jeanne.eraspace.com/products/api/v4.1/products/{url_key}/description",HEADERS,{"store_code":STORE_CODE})
    return (d or {}).get("data")

def fetch_price(session,sku):
    d=_get(session,PRICE_URL.format(sku=sku),PRICE_HEADERS,PRICE_PARAMS)
    data=(d or {}).get("data") or {}
    return data.get("srp_price"), data.get("promo_price")

# =========================================================================
# [ PARSING ]
# =========================================================================
def catalog_items(data):
    try: return data["data"]["items"] or []
    except (KeyError,TypeError): return []
def catalog_total(data):
    try: return int(data["data"]["total_count"])
    except (KeyError,TypeError,ValueError): return None

def parse_base(item):
    aset=item.get("attribute_set_name","") or ""
    tipe=aset.split("/")[-1].strip() if "/" in aset else aset
    img=item.get("thumbnail")
    if not img:
        mg=item.get("media_galleries") or []
        if mg: img=mg[0].get("file")
    return {
        "Nama":item.get("name"), "Brand":detect_brand(item.get("name")),
        "Tipe_Produk":tipe, "SKU_Induk":item.get("sku"),
        "url_key":item.get("url_key",""), "thumbnail":img,
        "min_price":item.get("min_price"), "max_price":item.get("max_price"),
    }

def attr_val(variant,label):
    for a in variant.get("attribute",[]):
        if a.get("attribute_label")==label:
            return a.get("option_label") or a.get("value")
    return ""

def attr_hex(variant,label):
    for a in variant.get("attribute",[]):
        if a.get("attribute_label")==label:
            val = a.get("value")
            if val and str(val).startswith("#"):
                return val
    return ""


# =========================================================================
# [ SCRAPE BERDASARKAN BRAND (pakai endpoint search asli Erafone) ]
# =========================================================================
def select_brand_query():
    brand_list = sorted(BRANDS.keys())
    while True:
        t = Table(show_header=False, box=None, padding=(0, 2))
        t.add_column(style="bold green"); t.add_column()
        for i, b in enumerate(brand_list, start=1):
            t.add_row(f"[{i}]", b)
        console.print(t)

        raw = Prompt.ask("Pilih brand yang mau di-scrape (nomor dipisah koma, misal 1,3,5)")
        raw = raw.strip()

        try:
            idxs = [int(x.strip()) for x in raw.split(",") if x.strip()]
        except ValueError:
            console.print("[red]Input tidak valid, coba lagi (contoh: 1,3,5).[/]")
            continue

        if not idxs:
            console.print("[red]Minimal pilih 1 nomor, coba lagi.[/]")
            continue
        if any(i < 1 or i > len(brand_list) for i in idxs):
            console.print(f"[red]Ada nomor di luar rentang 1-{len(brand_list)}, coba lagi.[/]")
            continue

        selected = [brand_list[i - 1] for i in dict.fromkeys(idxs)]
        console.print(f"[green]Brand dipilih:[/] {', '.join(selected)}")
        return selected

def scrape_by_search(session, query):
    # Query pakai endpoint search asli Erafone (sama seperti ketik di kolom pencarian
    # web-nya), bukan scrape semua kategori lalu filter lokal — jadi produk yang
    # kesasar di kategori lain (di luar 4 kategori utama) tetap ketemu.
    bases = []
    seen_skus = set()
    page = 1
    while page <= SEARCH_MAX_PAGES:
        d = fetch_search(session, query, page)
        items = catalog_items(d)
        if not items:
            break
        for i in items:
            # Search Erafone kadang fuzzy (mis. q=poco ikut nyelipin vivo/Infinix),
            # jadi disaring lagi: nama produk harus benar-benar mengandung query-nya.
            if query.lower() not in str(i.get("name", "")).lower():
                continue
            parsed = parse_base(i)
            if not is_phone_or_tablet(parsed["Nama"], parsed["Tipe_Produk"]):
                continue
            sku = parsed["SKU_Induk"]
            if sku in seen_skus:
                continue
            seen_skus.add(sku)
            bases.append(parsed)
        console.print(f"  [cyan]· '{query}'[/] halaman {page}: {len(bases)} HP/Tablet terkumpul.")
        if len(items) < SEARCH_LIMIT:
            break
        page += 1
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    console.print(f"[green]'{query}':[/] {len(bases)} HP/Tablet ditemukan.")
    return bases

# =========================================================================
# [ MENU ]
# =========================================================================
def show_menu():
    console.print(Panel.fit("[bold]BAGASKARA CELL[/] · Erafone Scraper v5 (DB Ready & Filtered)",border_style="cyan"))
    t=Table(show_header=False,box=None,padding=(0,2)); t.add_column(style="bold green"); t.add_column()
    for k,(_,nm) in CATEGORIES.items(): t.add_row(f"[{k}]",nm)
    console.print(t)
    ch=Prompt.ask("\n[bold]Pilih kategori[/]",choices=list(CATEGORIES.keys()),default="2")
    cid,name=CATEGORIES[ch]
    mode=Prompt.ask("Pecah per VARIAN (storage+warna)?",choices=["y","n"],default="y")
    harga="n"
    download="n"
    if mode=="y":
        harga=Prompt.ask("Ambil HARGA tiap varian juga? (lebih lama)",choices=["y","n"],default="y")
        console.print("\n[bold red]PERINGATAN:[/bold red] Mendownload semua gambar varian sangat memakan waktu dan resource!")
        console.print("Disarankan hanya download per kategori kecil, jangan kategori besar seperti (Semua Device).")
        download=Prompt.ask("Download GAMBAR fisik ke disk?",choices=["y","n"],default="n")
    return cid,name,(mode=="y"),(harga=="y"),(download=="y")

# =========================================================================
# [ TAHAP 1: katalog ]
# =========================================================================
def scrape_catalog(session,cid,name):
    bases=[]; first=fetch_catalog(session,cid,START_PAGE)
    items=catalog_items(first)
    if not items: console.print(f"[red]{name}: tidak ada data.[/]"); return bases
    total=catalog_total(first)
    cols=[TextColumn("  [cyan]Tahap 1 · daftar produk[/]"),
          BarColumn(bar_width=34,complete_style="green"),
          TextColumn("[green]{task.percentage:>3.0f}%[/]"),MofNCompleteColumn()]
    with Progress(*cols,console=console) as p:
        task=p.add_task("katalog",total=total)
        # Apply phone & tablet filtering directly at Phase 1
        for i in items:
            parsed = parse_base(i)
            if is_phone_or_tablet(parsed["Nama"], parsed["Tipe_Produk"]):
                bases.append(parsed)
        p.update(task,advance=len(items))
        
        page=START_PAGE+1
        while page<START_PAGE+MAX_PAGES:
            d=fetch_catalog(session,cid,page); items=catalog_items(d)
            if not items: break
            for i in items:
                parsed = parse_base(i)
                if is_phone_or_tablet(parsed["Nama"], parsed["Tipe_Produk"]):
                    bases.append(parsed)
            p.update(task,advance=len(items))
            if total and len(bases)>=total: break
            page+=1; time.sleep(random.uniform(DELAY_MIN,DELAY_MAX))
        if total is None: p.update(task,total=len(bases),completed=len(bases))
    
    console.print(f"[green]Menyaring aksesoris:[/] Dari {total if total else len(items)} produk, menyisakan {len(bases)} HP/Tablet.")
    return bases

# =========================================================================
# [ TAHAP 2+3: varian + harga + mapping gambar ]
# =========================================================================
def expand_variants(session,bases,ambil_harga):
    rows=[]
    cols=[TextColumn("  [cyan]Tahap 2 · ambil varian[/]"),
          BarColumn(bar_width=34,complete_style="green"),
          TextColumn("[green]{task.percentage:>3.0f}%[/]"),MofNCompleteColumn(),
          TimeElapsedColumn(),TimeRemainingColumn()]
    
    today_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    
    with Progress(*cols,console=console) as p:
        task=p.add_task("varian",total=len(bases))
        for b in bases:
            detail=fetch_detail(session,b["url_key"]) if b["url_key"] else None
            desc_data=fetch_description(session,b["url_key"]) if b["url_key"] else None
            short_desc=(desc_data or {}).get("short_description", "")
            full_desc=(desc_data or {}).get("description", "")
            variants=(detail or {}).get("variants") or []
            link=(PRODUCT_URL_BASE+b["url_key"]) if b["url_key"] else ""
            
            # Parse DB-ready specifications
            filt_attr = (detail or {}).get("filterable_attributes") or []
            spec_summary, specs_json, highlights_json = parse_specs_and_highlights(filt_attr, short_desc)
            
            cleaned_name = clean_product_name(b["Nama"])
            productId = generate_slug(cleaned_name)
            
            # --- Pemetaan Gambar ---
            color_images = {}
            media_galleries = (detail or {}).get("media_galleries") or []
            variant_colors = (detail or {}).get("variant_colors") or []
            
            main_images = [mg.get("file") for mg in media_galleries if mg.get("file")]
            
            for vc in variant_colors:
                c_name = vc.get("color_name")
                if not c_name: continue
                c_imgs = []
                thumbnails = vc.get("thumbnails") or []
                for t in thumbnails:
                    if isinstance(t, str):
                        c_imgs.append(t)
                    elif isinstance(t, dict) and t.get("file"):
                        c_imgs.append(t.get("file"))
                if c_name not in color_images:
                    color_images[c_name] = []
                color_images[c_name].extend(c_imgs)
                
            if variant_colors:
                first_color = variant_colors[0].get("color_name")
                if first_color and first_color in color_images:
                    for img in main_images:
                        if img not in color_images[first_color]:
                            color_images[first_color].append(img)
                            
            if not variants:
                imgs = main_images
                variantId = f"{productId}-default"
                rows.append({
                    # Product fields
                    "productId": productId,
                    "brand": b["Brand"],
                    "name": cleaned_name,
                    "condition": "baru",
                    "specSummary": spec_summary,
                    "specs": specs_json,
                    "highlights": highlights_json,
                    "description": full_desc,
                    "warranty": "Garansi Resmi",
                    "completeness": "Fullset",
                    "defects": "[]",
                    "createdAt": today_iso,
                    
                    # Variant fields
                    "variantId": variantId,
                    "color": "-",
                    "colorHex": "#8e8e93",
                    "storage": "-",
                    "price": b["min_price"] or 0,
                    "strikePrice": "",
                    "stock": "ready" if (detail or {}).get("quantity_and_stock_status")==1 else "habis",
                    
                    # Internal/Meta fields
                    "SKU_Induk": b["SKU_Induk"],
                    "Warna": "-", # for image download compat
                    "Image_Count": len(imgs), 
                    "Image_URLs": ", ".join(imgs),
                    "Link_Produk": link
                })
            else:
                harga_cache={} 
                for v in variants:
                    kap=attr_val(v,"Kapasitas") or "-"
                    warna=attr_val(v,"Warna") or "-"
                    imgs=color_images.get(warna, main_images)
                    
                    srp=promo=b["min_price"]
                    if ambil_harga:
                        key=kap if kap!="-" else v.get("sku")
                        if key not in harga_cache:
                            harga_cache[key]=fetch_price(session,v.get("sku"))
                            time.sleep(random.uniform(DELAY_MIN,DELAY_MAX))
                        s,pr=harga_cache[key]
                        srp=s if s is not None else b["min_price"]
                        promo=pr if pr is not None else srp
                    
                    strike_price = ""
                    if srp and promo and srp > promo:
                        strike_price = srp
                    
                    # Construct clean variantId
                    v_suffix = generate_slug(f"{kap}-{warna}")
                    variantId = f"{productId}-{v_suffix}" if v_suffix else v.get("sku")
                    
                    # Try to get direct Hex code from variant attributes
                    hex_color = attr_hex(v, "Warna")
                    if not hex_color:
                        hex_color = get_color_hex(warna)
                    
                    rows.append({
                        # Product fields
                        "productId": productId,
                        "brand": b["Brand"],
                        "name": cleaned_name,
                        "condition": "baru",
                        "specSummary": spec_summary,
                        "specs": specs_json,
                        "highlights": highlights_json,
                        "description": full_desc,
                        "warranty": "Garansi Resmi",
                        "completeness": "Fullset",
                        "defects": "[]",
                        "createdAt": today_iso,
                        
                        # Variant fields
                        "variantId": variantId,
                        "color": warna,
                        "colorHex": hex_color or "#8e8e93",
                        "storage": kap,
                        "price": promo or 0,
                        "strikePrice": strike_price,
                        "stock": "ready" if v.get("quantity_and_stock_status")==1 else "habis",
                        
                        # Internal/Meta fields
                        "SKU_Induk": b["SKU_Induk"],
                        "Warna": warna, # for image download compat
                        "Image_Count": len(imgs), 
                        "Image_URLs": ", ".join(imgs),
                        "Link_Produk": link
                    })
            p.update(task,advance=1)
            time.sleep(random.uniform(DELAY_MIN,DELAY_MAX))
    return rows

def simple_rows(bases):
    # Mapping for simple mode without details API (fast mode)
    out=[]
    today_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    for b in bases:
        link=(PRODUCT_URL_BASE+b["url_key"]) if b["url_key"] else ""
        cleaned_name = clean_product_name(b["Nama"])
        productId = generate_slug(cleaned_name)
        variantId = f"{productId}-default"
        
        # Empty spec JSON structure
        specs_json = "[]"
        highlights_json = "[]"
        
        out.append({
            # Product fields
            "productId": productId,
            "brand": b["Brand"],
            "name": cleaned_name,
            "condition": "baru",
            "specSummary": "-",
            "specs": specs_json,
            "highlights": highlights_json,
            "description": "",
            "warranty": "Garansi Resmi",
            "completeness": "Fullset",
            "defects": "[]",
            "createdAt": today_iso,
            
            # Variant fields
            "variantId": variantId,
            "color": "-",
            "colorHex": "#8e8e93",
            "storage": "-",
            "price": b["min_price"] or 0,
            "strikePrice": "",
            "stock": "ready",
            
            # Internal/Meta fields
            "SKU_Induk": b["SKU_Induk"],
            "Warna": "-",
            "Image_Count": 1 if b["thumbnail"] else 0, 
            "Image_URLs": b["thumbnail"] or "",
            "Link_Produk": link
        })
    return out

# =========================================================================
# [ TAHAP 4: Download Gambar ]
# =========================================================================
def safe_filename(name):
    return re.sub(r'[^a-zA-Z0-9_\-\. ]', '', str(name)).strip()

def download_images(rows):
    console.print("\n[yellow]Memulai proses download gambar fisik ke disk...[/]")
    downloaded_pairs = set()
    total_downloaded = 0
    total_failed = 0
    
    queue = []
    for r in rows:
        if not r.get("Image_URLs"): continue
        pair = (r.get("SKU_Induk"), r.get("Warna"))
        if pair in downloaded_pairs: continue
        downloaded_pairs.add(pair)
        
        urls = [u.strip() for u in str(r["Image_URLs"]).split(",") if u.strip()]
        if not urls: continue
        queue.append((r, urls))
        
    if not queue:
        console.print("[yellow]Tidak ada gambar untuk didownload.[/]")
        return
        
    cols=[TextColumn("  [cyan]Tahap 3 · download gambar[/]"),
          BarColumn(bar_width=34,complete_style="green"),
          TextColumn("[green]{task.percentage:>3.0f}%[/]"),MofNCompleteColumn()]
    
    req_headers = {"User-Agent": HEADERS["User-Agent"]}
    with Progress(*cols,console=console) as p:
        task=p.add_task("download",total=len(queue))
        for r, urls in queue:
            brand = safe_filename(r.get("brand", "Lainnya"))
            nama = safe_filename(r.get("name", "Produk"))
            warna = safe_filename(r.get("Warna", "Default"))
            
            folder_path = os.path.join("images", brand, nama, warna)
            os.makedirs(folder_path, exist_ok=True)
            
            for i, url in enumerate(urls):
                ext = url.split("?")[0].split(".")[-1]
                if len(ext) > 5 or ext not in ["jpg","jpeg","png","webp","gif"]: ext = "jpg"
                filename = f"{r.get('SKU_Induk')}_{warna.replace(' ', '_')}_{i+1}.{ext}"
                filepath = os.path.join(folder_path, filename)
                
                if not os.path.exists(filepath):
                    try:
                        req = urllib.request.Request(url, headers=req_headers)
                        with urllib.request.urlopen(req, timeout=10) as response, open(filepath, 'wb') as out_file:
                             out_file.write(response.read())
                        total_downloaded += 1
                    except Exception:
                        total_failed += 1
                        
            p.update(task,advance=1)
            time.sleep(0.1)
            
    console.print(f"[green]Download Selesai: {total_downloaded} file diunduh, {total_failed} gagal.[/]")

# =========================================================================
# [ MAIN ]
# =========================================================================
def main():
    cid,name,mode_varian,ambil_harga,download=show_menu()
    session=requests.Session(); today=datetime.date.today().isoformat()
    console.print()
    
    if cid == "BRAND":
        selected_brands = select_brand_query()
        all_bases = []
        seen_skus = set()
        for bname in selected_brands:
            console.print(f"\n[bold cyan]Mencari brand: {bname}...[/]")
            found = scrape_by_search(session, bname)
            for b in found:
                sku = b.get("SKU_Induk")
                if sku and sku not in seen_skus:
                    seen_skus.add(sku)
                    all_bases.append(b)
        bases = all_bases
        name = " & ".join(selected_brands)
        console.print(f"\n[bold green]Selesai. Ditemukan {len(bases)} produk unik dari brand terpilih.[/]")
    elif cid == "ALL":
        all_bases = []
        seen_skus = set()
        for k in ["1", "2", "3", "4"]:
            cat_id, cat_name = CATEGORIES[k]
            console.print(f"\n[bold cyan]Mulai Scraping Kategori: {cat_name}...[/]")
            cat_bases = scrape_catalog(session, cat_id, cat_name)
            for b in cat_bases:
                sku = b.get("SKU_Induk")
                if sku and sku not in seen_skus:
                    seen_skus.add(sku)
                    all_bases.append(b)
        bases = all_bases
        console.print(f"\n[bold green]Selesai menggabungkan. Ditemukan {len(bases)} produk unik (deduplicated).[/]")
    else:
        bases=scrape_catalog(session,cid,name)

    if not bases: return

    if mode_varian:
        est=len(bases)*(2 if ambil_harga else 1)
        console.print(f"\n[yellow]Akan buka detail {len(bases)} produk"
                      f"{' + harga varian' if ambil_harga else ''}. "
                      f"Estimasi ~{round(est*0.7/60)} menit.[/]")
        if Prompt.ask("Lanjut?",choices=["y","n"],default="y")=="n":
            console.print("[yellow]Dibatalkan.[/]"); return
        rows=expand_variants(session,bases,ambil_harga)
        suffix="db_varian"
    else:
        rows=simple_rows(bases); suffix="db_ringkas"

    df=pd.DataFrame(rows).drop_duplicates().reset_index(drop=True)
    slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    xlsx=f"katalog_{slug}_{suffix}_{today}.xlsx"; csv=f"katalog_{slug}_{suffix}_{today}.csv"
    df.to_excel(xlsx,index=False); df.to_csv(csv,index=False,encoding="utf-8-sig")

    if download and mode_varian:
        download_images(rows)

    # ringkasan
    s=Table(title="Selesai",title_style="bold green")
    s.add_column("Info",style="cyan"); s.add_column("Nilai",justify="right")
    s.add_row("Produk induk",str(len(bases)))
    s.add_row("Total baris (varian)" if mode_varian else "Total baris",str(len(df)))
    console.print(); console.print(s)
    console.print(f"\n[green]File tersimpan:[/]\n   • {xlsx}\n   • {csv}")
    if download and mode_varian:
        console.print("   • Gambar tersimpan di folder 'images/'")

if __name__=="__main__":
    try: main()
    except KeyboardInterrupt: console.print("\n[yellow]Dibatalkan.[/]")
