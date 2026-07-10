import { dbOwner, dbErafone } from "./db";
import { Product, Variant } from "../types/product";

export interface FilterParams {
  budget?: string;
  brand?: string;      // Comma-separated (e.g., "xiaomi,samsung")
  condition?: string;  // Comma-separated (e.g., "baru,second")
  status?: string;     // "ready" | "habis"
  book?: string;       // "ready" | "po" | "erafone"
  q?: string;          // Search query
  sort?: string;       // "price-asc" | "price-desc" | "newest"
}

/**
 * Parses budget string into min and max numeric values.
 */
function parseBudget(budgetStr: string): { min?: number; max?: number } {
  const cleaned = budgetStr.toLowerCase().replace(/\s+/g, "");

  // Predefined chip categories
  if (cleaned === "<1jt" || cleaned === "under-1jt") return { max: 1000000 };
  if (cleaned === "1-2jt") return { min: 1000000, max: 2000000 };
  if (cleaned === "2-3jt") return { min: 2000000, max: 3000000 };
  if (cleaned === "3-5jt") return { min: 3000000, max: 5000000 };
  if (cleaned === "5jt+" || cleaned === "above-5jt") return { min: 5000000 };

  // Raw numeric maximum price (e.g., ?budget=2500000)
  if (/^\d+$/.test(cleaned)) {
    return { max: Number(cleaned) };
  }

  // Range syntax (e.g., "1.5jt-3jt" or "1500000-3000000")
  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    const minVal = parseFriendlyNumber(parts[0]);
    const maxVal = parseFriendlyNumber(parts[1]);
    return { min: minVal, max: maxVal };
  }

  if (cleaned.endsWith("+")) {
    return { min: parseFriendlyNumber(cleaned.slice(0, -1)) };
  }

  if (cleaned.startsWith("<")) {
    return { max: parseFriendlyNumber(cleaned.slice(1)) };
  }

  return {};
}

function parseFriendlyNumber(val: string): number {
  let multiplier = 1;
  let numStr = val;
  if (val.endsWith("jt")) {
    multiplier = 1000000;
    numStr = val.slice(0, -2);
  } else if (val.endsWith("m")) {
    multiplier = 1000000;
    numStr = val.slice(0, -1);
  }
  return Number(numStr.replace(/,/g, "")) * multiplier;
}

/**
 * Parses JSON columns safely.
 */
function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    return jsonStr ? JSON.parse(jsonStr) : fallback;
  } catch {
    return fallback;
  }
}

interface DBVariantRow {
  id: string;
  productId: string;
  skuInduk?: string;
  color: string;
  colorHex: string;
  storage: string;
  price: number | string;
  strikePrice: number | string | null;
  stock: string;
  images: string;
}

/**
 * Fetches filtered products from the SQLite database.
 */
export async function getFilteredProducts(params: FilterParams): Promise<Product[]> {
  const whereClauses: string[] = [];
  const args: (string | number)[] = [];

  // 0. Book catalog filter (Ready Stock vs PO reference)
  const bookParam = params.book || "ready";
  if (bookParam === "po" || bookParam === "erafone") {
    whereClauses.push("p.isScraped = 1");
  } else {
    whereClauses.push("p.isScraped = 0");
  }

  // 1. Search Query filter (matches product name or brand)
  if (params.q && params.q.trim()) {
    const searchPattern = `%${params.q.trim()}%`;
    whereClauses.push("(p.name LIKE ? OR p.brand LIKE ?)");
    args.push(searchPattern, searchPattern);
  }

  // 2. Brand filter (comma-separated, e.g., brand=xiaomi,samsung)
  if (params.brand && params.brand.trim()) {
    const brands = params.brand.split(",").map(b => b.trim().toLowerCase()).filter(Boolean);
    if (brands.length > 0) {
      const placeholders = brands.map(() => "?").join(",");
      whereClauses.push(`LOWER(p.brand) IN (${placeholders})`);
      args.push(...brands);
    }
  }

  // 3. Condition filter (comma-separated, e.g., condition=baru,second)
  if (params.condition && params.condition.trim()) {
    const conditions = params.condition.split(",").map(c => c.trim().toLowerCase()).filter(Boolean);
    if (conditions.length > 0) {
      const placeholders = conditions.map(() => "?").join(",");
      whereClauses.push(`LOWER(p.condition) IN (${placeholders})`);
      args.push(...conditions);
    }
  }

  // 3.5. Status filter (ready / habis)
  if (params.status && params.status.trim()) {
    const statusVal = params.status.trim().toLowerCase();
    if (statusVal === "ready") {
      whereClauses.push("p.id IN (SELECT DISTINCT productId FROM variants WHERE stock = 'ready')");
    } else if (statusVal === "habis") {
      whereClauses.push("p.id NOT IN (SELECT DISTINCT productId FROM variants WHERE stock = 'ready')");
    }
  }

  // 4. Budget filter (filters on the variants price level)
  if (params.budget && params.budget.trim()) {
    const { min, max } = parseBudget(params.budget);
    if (min !== undefined) {
      whereClauses.push("v.price >= ?");
      args.push(min);
    }
    if (max !== undefined) {
      whereClauses.push("v.price <= ?");
      args.push(max);
    }
  }

  // Build WHERE clause
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Determine ORDER BY clause
  let orderSql = "ORDER BY p.createdAt DESC"; // Default: terbaru
  if (params.sort === "price-asc") {
    orderSql = "ORDER BY minPrice ASC";
  } else if (params.sort === "price-desc") {
    orderSql = "ORDER BY minPrice DESC";
  } else if (params.sort === "newest") {
    orderSql = "ORDER BY p.createdAt DESC";
  }

  // Master Query: returns distinct products matching filters along with their minimum variant price
  const query = `
    SELECT p.*, MIN(v.price) as minPrice
    FROM products p
    JOIN variants v ON p.id = v.productId
    ${whereSql}
    GROUP BY p.id
    ${orderSql}
  `;

  const targetDb = (params.book === "po" || params.book === "erafone") ? dbErafone : dbOwner;

  try {
    const res = await targetDb.execute({ sql: query, args });
    const products: Product[] = [];

    for (const row of res.rows) {
      // Fetch all variants for this product
      const variantRes = await targetDb.execute({
        sql: "SELECT * FROM variants WHERE productId = ?",
        args: [row.id as string]
      });

      const variants: Variant[] = variantRes.rows.map((row) => {
        const vRow = row as unknown as DBVariantRow;
        return {
          id: vRow.id,
          productId: vRow.productId,
          skuInduk: vRow.skuInduk,
          color: vRow.color,
          colorHex: vRow.colorHex,
          storage: vRow.storage,
          price: Number(vRow.price),
          strikePrice: vRow.strikePrice ? Number(vRow.strikePrice) : undefined,
          stock: vRow.stock as "ready" | "habis",
          images: safeJsonParse<string[]>(vRow.images, [])
        };
      });

      products.push({
        id: row.id as string,
        brand: row.brand as string,
        name: row.name as string,
        condition: row.condition as "baru" | "second" | "like-new",
        specSummary: row.specSummary as string,
        specs: safeJsonParse(row.specs as string, []),
        highlights: safeJsonParse(row.highlights as string, []),
        warranty: row.warranty ? (row.warranty as string) : undefined,
        completeness: row.completeness ? (row.completeness as string) : undefined,
        defects: safeJsonParse<string[]>(row.defects as string, []),
        createdAt: row.createdAt as string,
        isScraped: row.isScraped !== undefined ? Number(row.isScraped) : undefined,
        description: row.description ? (row.description as string) : undefined,
        variants
      });
    }

    return products;
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    return [];
  }
}

/**
 * Fetches a single product by its slug (id).
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // 1. Try owner database first
    let targetDb = dbOwner;
    let res = await dbOwner.execute({
      sql: "SELECT * FROM products WHERE id = ? LIMIT 1",
      args: [slug]
    });

    // 2. Fallback to erafone database if not found in owner's db
    if (res.rows.length === 0) {
      targetDb = dbErafone;
      res = await dbErafone.execute({
        sql: "SELECT * FROM products WHERE id = ? LIMIT 1",
        args: [slug]
      });
    }

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    const variantRes = await targetDb.execute({
      sql: "SELECT * FROM variants WHERE productId = ?",
      args: [slug]
    });

    const variants: Variant[] = variantRes.rows.map((row) => {
      const vRow = row as unknown as DBVariantRow;
      return {
        id: vRow.id,
        productId: vRow.productId,
        skuInduk: vRow.skuInduk,
        color: vRow.color,
        colorHex: vRow.colorHex,
        storage: vRow.storage,
        price: Number(vRow.price),
        strikePrice: vRow.strikePrice ? Number(vRow.strikePrice) : undefined,
        stock: vRow.stock as "ready" | "habis",
        images: safeJsonParse<string[]>(vRow.images, [])
      };
    });

    return {
      id: row.id as string,
      brand: row.brand as string,
      name: row.name as string,
      condition: row.condition as "baru" | "second" | "like-new",
      specSummary: row.specSummary as string,
      specs: safeJsonParse(row.specs as string, []),
      highlights: safeJsonParse(row.highlights as string, []),
      warranty: row.warranty ? (row.warranty as string) : undefined,
      completeness: row.completeness ? (row.completeness as string) : undefined,
      defects: safeJsonParse<string[]>(row.defects as string, []),
      createdAt: row.createdAt as string,
      isScraped: row.isScraped !== undefined ? Number(row.isScraped) : undefined,
      description: row.description ? (row.description as string) : undefined,
      variants
    };
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

/**
 * Fetches products that have prices closest to the target budget
 * when the filter results are empty.
 */
export async function getFallbackProducts(budgetStr?: string, book?: string): Promise<Product[]> {
  let targetPrice = 2000000;
  if (budgetStr) {
    const { min, max } = parseBudget(budgetStr);
    if (max !== undefined) targetPrice = max;
    else if (min !== undefined) targetPrice = min;
  }

  const targetDb = (book === "po" || book === "erafone") ? dbErafone : dbOwner;

  const query = `
    SELECT p.*, MIN(v.price) as minPrice
    FROM products p
    JOIN variants v ON p.id = v.productId
    GROUP BY p.id
    ORDER BY ABS(minPrice - ?) ASC
    LIMIT 4
  `;

  try {
    const res = await targetDb.execute({ sql: query, args: [targetPrice] });
    const products: Product[] = [];

    for (const row of res.rows) {
      const variantRes = await targetDb.execute({
        sql: "SELECT * FROM variants WHERE productId = ?",
        args: [row.id as string]
      });

      const variants: Variant[] = variantRes.rows.map((row) => {
        const vRow = row as unknown as DBVariantRow;
        return {
          id: vRow.id,
          productId: vRow.productId,
          skuInduk: vRow.skuInduk,
          color: vRow.color,
          colorHex: vRow.colorHex,
          storage: vRow.storage,
          price: Number(vRow.price),
          strikePrice: vRow.strikePrice ? Number(vRow.strikePrice) : undefined,
          stock: vRow.stock as "ready" | "habis",
          images: safeJsonParse<string[]>(vRow.images, [])
        };
      });

      products.push({
        id: row.id as string,
        brand: row.brand as string,
        name: row.name as string,
        condition: row.condition as "baru" | "second" | "like-new",
        specSummary: row.specSummary as string,
        specs: safeJsonParse(row.specs as string, []),
        highlights: safeJsonParse(row.highlights as string, []),
        warranty: row.warranty ? (row.warranty as string) : undefined,
        completeness: row.completeness ? (row.completeness as string) : undefined,
        defects: safeJsonParse<string[]>(row.defects as string, []),
        createdAt: row.createdAt as string,
        isScraped: row.isScraped !== undefined ? Number(row.isScraped) : undefined,
        description: row.description ? (row.description as string) : undefined,
        variants
      });
    }

    return products;
  } catch (error) {
    console.error("Error fetching fallback products:", error);
    return [];
  }
}

export interface SearchSuggestionItem {
  id: string;
  brand: string;
  name: string;
  isScraped: number;
}

/**
 * Fetches lightweight product info for autocomplete search suggestions.
 */
export async function getSearchSuggestions(): Promise<SearchSuggestionItem[]> {
  try {
    const resOwner = await dbOwner.execute("SELECT id, brand, name, isScraped FROM products");
    const resErafone = await dbErafone.execute("SELECT id, brand, name, isScraped FROM products");
    
    const combined = [...resOwner.rows, ...resErafone.rows];
    combined.sort((a, b) => (a.name as string).localeCompare(b.name as string));

    return combined.map((row) => ({
      id: row.id as string,
      brand: row.brand as string,
      name: row.name as string,
      isScraped: Number(row.isScraped)
    }));
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return [];
  }
}

