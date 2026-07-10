"""
==========================================================================
 XIAOMI / REDMI / POCO CATALOG SCRAPER (mi.co.id)  v1  (VARIAN, GAMBAR & DB MAPPING)
 Bagaskara Cell
--------------------------------------------------------------------------
 Alur:
   Tahap 1: Ambil daftar produk per kategori dari go.buy.mi.co.id (list API),
            termasuk semua varian warna+storage & harga langsung dari respons.
   Tahap 2: Buka detail tiap produk (productdetail API) -> dapetin status
            stok per-varian yang akurat + galeri gambar per warna + KSP.
   Tahap 3 (opsional): Download otomatis gambar ke disk, dipisah by folder.

 Catatan penting:
   mi.co.id TIDAK punya API spesifikasi rapi seperti Erafone (filterable
   attributes). Spesifikasi lengkap (CPU/layar/kamera/baterai) cuma ada
   sebagai teks marketing yang tersebar di halaman /specs/ tiap produk,
   formatnya tidak konsisten antar produk. Makanya script ini pakai
   pendekatan CEPAT & RELIABLE: RAM/Storage diambil dari data varian resmi,
   dan highlight/spec singkat diambil dari "product_ksp" (key selling
   points) yang memang sudah dikurasi resmi oleh Xiaomi per produk.

 Jalanin:
   pip install -r requirements.txt
   python mi_scraper.py
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
LIST_URL   = "https://go.buy.mi.co.id/id/search/product-list"
DETAIL_URL = "https://go.buy.mi.co.id/id/v2/item/productdetail"
SITE_BASE  = "https://www.mi.co.id/id/"

CATEGORIES = {
    "1": ("xiaomi", "Xiaomi Series"),
    "2": ("redmi", "Redmi Series"),
    "3": ("poco", "POCO Series"),
    "4": ("tablets", "Tablets"),
    "5": ("ALL", "Semua Kategori di atas (Deduplicated)"),
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://www.mi.co.id/id/product-list/phone/xiaomi/",
}

PAGE_SIZE = 100
TIMEOUT = 20; MAX_RETRY = 3
DELAY_MIN = 0.3; DELAY_MAX = 0.7

BRAND_PREFIXES = {
    "poco": "POCO",
    "redmi": "Redmi",
    "xiaomi": "Xiaomi",
}

def detect_brand(name):
    n = str(name).strip().lower()
    if n.startswith("poco"):
        return "POCO"
    if n.startswith("redmi"):
        return "Redmi"
    return "Xiaomi"

def get_slug_from_link(link):
    # https://www.mi.co.id/id/product/xiaomi-17t-pro/ -> xiaomi-17t-pro
    m = re.search(r'/product/([^/]+)/?', str(link))
    return m.group(1) if m else ""

def generate_slug(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def normalize_url(url):
    url = str(url or "").strip()
    if url.startswith("//"):
        return "https:" + url
    return url

def split_ram_rom(storage):
    # "8GB+256GB" -> ("8GB", "256GB")
    m = re.match(r'^\s*(\d+\s*GB)\s*\+\s*(\d+\s*GB)\s*$', str(storage), re.IGNORECASE)
    if m:
        return m.group(1).replace(" ", ""), m.group(2).replace(" ", "")
    return storage, ""

def build_specs_and_highlights(storage, ksp_list):
    ram, rom = split_ram_rom(storage)
    groups = {"Dapur Pacu": [], "Lainnya": []}
    if ram:
        groups["Dapur Pacu"].append({"label": "RAM", "value": ram})
    if rom:
        groups["Dapur Pacu"].append({"label": "Penyimpanan", "value": rom})
    for item in ksp_list or []:
        item = str(item).strip()
        if item:
            groups["Lainnya"].append({"label": "Unggulan", "value": item})

    specs_list = [{"group": g, "items": items} for g, items in groups.items() if items]
    specs_json = json.dumps(specs_list, ensure_ascii=False)

    highlights_list = [{"icon": "star", "label": "Unggulan", "value": str(v).strip()}
                        for v in (ksp_list or []) if str(v).strip()]
    highlights_json = json.dumps(highlights_list, ensure_ascii=False)

    summary_parts = []
    if ram and rom:
        summary_parts.append(f"{ram}/{rom}")
    summary_parts.extend(str(v).strip() for v in (ksp_list or []) if str(v).strip())
    spec_summary = " · ".join(summary_parts) if summary_parts else "-"

    return spec_summary, specs_json, highlights_json

# =========================================================================
# [ HTTP ]
# =========================================================================
def _get(session, url, params=None):
    for attempt in range(1, MAX_RETRY + 1):
        try:
            r = session.get(url, headers=HEADERS, params=params, timeout=TIMEOUT)
            if r.status_code == 200:
                d = r.json()
                if d.get("errno") == 0:
                    return d.get("data")
                return None
            if r.status_code in (429, 503):
                time.sleep(5 * attempt); continue
            return None
        except requests.exceptions.RequestException:
            time.sleep(3 * attempt)
    return None

def fetch_list_page(session, category_tag, page_index):
    return _get(session, LIST_URL, {
        "version": "v4", "cacheable": 1, "page_size": PAGE_SIZE, "type": 2,
        "category_tag": category_tag, "page_index": page_index, "from": "laptop",
    })

def fetch_detail(session, slug):
    return _get(session, DETAIL_URL, {"tag": slug})

# =========================================================================
# [ TAHAP 1: daftar produk + varian dari list API ]
# =========================================================================
def scrape_catalog(session, category_tag, name):
    products = []
    first = fetch_list_page(session, category_tag, 0)
    if not first:
        console.print(f"[red]{name}: tidak ada data.[/]"); return products
    prov = first.get("data_provider", {})
    total = prov.get("product_total_count", 0)
    items = prov.get("data", {}).get("product_list", [])

    cols = [TextColumn("  [cyan]Tahap 1 · daftar produk[/]"),
            BarColumn(bar_width=34, complete_style="green"),
            TextColumn("[green]{task.percentage:>3.0f}%[/]"), MofNCompleteColumn()]
    with Progress(*cols, console=console) as p:
        task = p.add_task("katalog", total=total or len(items))
        products.extend(items)
        p.update(task, advance=len(items))

        page = 1
        while len(products) < total:
            d = fetch_list_page(session, category_tag, page)
            if not d:
                break
            batch = d.get("data_provider", {}).get("data", {}).get("product_list", [])
            if not batch:
                break
            products.extend(batch)
            p.update(task, advance=len(batch))
            page += 1
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

    console.print(f"[green]{name}:[/] ditemukan {len(products)} produk.")
    return products

# =========================================================================
# [ TAHAP 2: detail per produk (stok akurat + galeri gambar + ksp) ]
# =========================================================================
def expand_variants(session, products, category_tag):
    rows = []
    cols = [TextColumn("  [cyan]Tahap 2 · detail & varian[/]"),
            BarColumn(bar_width=34, complete_style="green"),
            TextColumn("[green]{task.percentage:>3.0f}%[/]"), MofNCompleteColumn(),
            TimeElapsedColumn(), TimeRemainingColumn()]

    today_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    with Progress(*cols, console=console) as p:
        task = p.add_task("varian", total=len(products))
        for entry in products:
            product = entry.get("product", {})
            commodities = entry.get("commodity", []) or []
            name = product.get("name", "")
            brand = detect_brand(name)
            link = product.get("item_link", "")
            slug = get_slug_from_link(link)
            productId = generate_slug(name)
            ksp = product.get("product_ksp") or []

            # Detail call: cari status stok akurat & galeri gambar per item_id
            detail = fetch_detail(session, slug) if slug else None
            item_meta = {}
            if detail:
                for spu in (detail.get("item_detail", {}) or {}).get("spu_list", []) or []:
                    for it in spu.get("item_list", []) or []:
                        imgs = [normalize_url(r.get("src")) for r in (it.get("resource_list") or [])
                                if r.get("type") == "image" and r.get("src")]
                        item_meta[it.get("item_id")] = {
                            "out_of_stock": bool(it.get("is_out_of_stock")),
                            "is_sale": bool(it.get("is_sale")),
                            "images": imgs,
                        }

            if not commodities:
                # Fallback: tidak ada varian, pakai data produk langsung
                variantId = f"{productId}-default"
                spec_summary, specs_json, highlights_json = build_specs_and_highlights("", ksp)
                rows.append({
                    "productId": productId, "brand": brand, "name": name,
                    "condition": "baru", "specSummary": spec_summary, "specs": specs_json,
                    "highlights": highlights_json, "description": "", "warranty": "Garansi Resmi",
                    "completeness": "Fullset", "defects": "[]", "createdAt": today_iso,
                    "variantId": variantId, "color": "-", "colorHex": "#8e8e93", "storage": "-",
                    "price": product.get("price_min_num") or 0, "strikePrice": "",
                    "stock": "ready" if product.get("is_sale") else "habis",
                    "SKU_Induk": product.get("id"), "Warna": "-",
                    "Image_Count": 1 if product.get("image") else 0,
                    "Image_URLs": normalize_url(product.get("image")) if product.get("image") else "",
                    "Link_Produk": link,
                })
            else:
                for c in commodities:
                    storage = (c.get("second_spec_origin_value") or c.get("second_spec_value") or "-").replace(" ", "")
                    color = c.get("name", "")
                    color = color.replace(name, "").replace(c.get("second_spec_value", ""), "").strip(" -")
                    if not color:
                        color = "-"
                    color_hex = c.get("first_spec_value") or "#8e8e93"
                    if not str(color_hex).startswith("#"):
                        color_hex = "#8e8e93"

                    item_id = c.get("item_id")
                    meta = item_meta.get(item_id, {})
                    imgs = meta.get("images") or ([normalize_url(c.get("image"))] if c.get("image") else [])

                    raw_market = c.get("raw_market_price") or 0
                    raw_sales = c.get("raw_sales_price") or 0
                    strike_price = raw_market if (raw_market and raw_sales and raw_market > raw_sales) else ""

                    if "out_of_stock" in meta:
                        stock = "habis" if meta["out_of_stock"] else "ready"
                    else:
                        stock = "ready" if c.get("has_store") else "habis"

                    v_suffix = generate_slug(f"{color}-{storage}")
                    variantId = f"{productId}-{v_suffix}" if v_suffix else str(item_id)

                    spec_summary, specs_json, highlights_json = build_specs_and_highlights(storage, ksp)

                    rows.append({
                        "productId": productId, "brand": brand, "name": name,
                        "condition": "baru", "specSummary": spec_summary, "specs": specs_json,
                        "highlights": highlights_json, "description": "", "warranty": "Garansi Resmi",
                        "completeness": "Fullset", "defects": "[]", "createdAt": today_iso,
                        "variantId": variantId, "color": color, "colorHex": color_hex, "storage": storage,
                        "price": raw_sales or 0, "strikePrice": strike_price, "stock": stock,
                        "SKU_Induk": product.get("id"), "Warna": color,
                        "Image_Count": len(imgs), "Image_URLs": ", ".join(imgs),
                        "Link_Produk": link,
                    })

            p.update(task, advance=1)
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
    return rows

# =========================================================================
# [ TAHAP 3: Download Gambar ]
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
        if not r.get("Image_URLs"):
            continue
        pair = (r.get("SKU_Induk"), r.get("Warna"))
        if pair in downloaded_pairs:
            continue
        downloaded_pairs.add(pair)

        urls = [u.strip() for u in str(r["Image_URLs"]).split(",") if u.strip()]
        if not urls:
            continue
        queue.append((r, urls))

    if not queue:
        console.print("[yellow]Tidak ada gambar untuk didownload.[/]")
        return

    cols = [TextColumn("  [cyan]Tahap 3 · download gambar[/]"),
            BarColumn(bar_width=34, complete_style="green"),
            TextColumn("[green]{task.percentage:>3.0f}%[/]"), MofNCompleteColumn()]

    req_headers = {"User-Agent": HEADERS["User-Agent"]}
    with Progress(*cols, console=console) as p:
        task = p.add_task("download", total=len(queue))
        for r, urls in queue:
            brand = safe_filename(r.get("brand", "Lainnya"))
            nama = safe_filename(r.get("name", "Produk"))
            warna = safe_filename(r.get("Warna", "Default"))

            folder_path = os.path.join("images_mi", brand, nama, warna)
            os.makedirs(folder_path, exist_ok=True)

            for i, url in enumerate(urls):
                ext = url.split("?")[0].split(".")[-1]
                if len(ext) > 5 or ext not in ["jpg", "jpeg", "png", "webp", "gif"]:
                    ext = "jpg"
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

            p.update(task, advance=1)
            time.sleep(0.1)

    console.print(f"[green]Download Selesai: {total_downloaded} file diunduh, {total_failed} gagal.[/]")

# =========================================================================
# [ MENU ]
# =========================================================================
def show_menu():
    console.print(Panel.fit("[bold]BAGASKARA CELL[/] · Xiaomi/Redmi/POCO Scraper v1 (mi.co.id)", border_style="cyan"))
    t = Table(show_header=False, box=None, padding=(0, 2)); t.add_column(style="bold green"); t.add_column()
    for k, (_, nm) in CATEGORIES.items():
        t.add_row(f"[{k}]", nm)
    console.print(t)
    ch = Prompt.ask("\n[bold]Pilih kategori[/]", choices=list(CATEGORIES.keys()), default="3")
    tag, name = CATEGORIES[ch]
    download = Prompt.ask("Download GAMBAR fisik ke disk?", choices=["y", "n"], default="n")
    return tag, name, (download == "y")

# =========================================================================
# [ MAIN ]
# =========================================================================
def main():
    tag, name, download = show_menu()
    session = requests.Session(); today = datetime.date.today().isoformat()
    console.print()

    if tag == "ALL":
        all_products = []
        seen_ids = set()
        for k in ["1", "2", "3", "4"]:
            cat_tag, cat_name = CATEGORIES[k]
            console.print(f"\n[bold cyan]Mulai Scraping Kategori: {cat_name}...[/]")
            cat_products = scrape_catalog(session, cat_tag, cat_name)
            for entry in cat_products:
                pid = entry.get("product", {}).get("id")
                if pid and pid not in seen_ids:
                    seen_ids.add(pid)
                    all_products.append(entry)
        products = all_products
        console.print(f"\n[bold green]Selesai menggabungkan. Ditemukan {len(products)} produk unik (deduplicated).[/]")
    else:
        products = scrape_catalog(session, tag, name)

    if not products:
        return

    console.print(f"\n[yellow]Akan buka detail {len(products)} produk untuk status stok & galeri gambar.[/]")
    if Prompt.ask("Lanjut?", choices=["y", "n"], default="y") == "n":
        console.print("[yellow]Dibatalkan.[/]"); return

    rows = expand_variants(session, products, tag)

    df = pd.DataFrame(rows).drop_duplicates().reset_index(drop=True)
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    xlsx = f"katalog_mi_{slug}_db_varian_{today}.xlsx"
    csv = f"katalog_mi_{slug}_db_varian_{today}.csv"
    df.to_excel(xlsx, index=False); df.to_csv(csv, index=False, encoding="utf-8-sig")

    if download:
        download_images(rows)

    s = Table(title="Selesai", title_style="bold green")
    s.add_column("Info", style="cyan"); s.add_column("Nilai", justify="right")
    s.add_row("Produk induk", str(len(products)))
    s.add_row("Total baris (varian)", str(len(df)))
    console.print(); console.print(s)
    console.print(f"\n[green]File tersimpan:[/]\n   • {xlsx}\n   • {csv}")
    if download:
        console.print("   • Gambar tersimpan di folder 'images_mi/'")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Dibatalkan.[/]")
