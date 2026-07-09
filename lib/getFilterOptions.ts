import { dbOwner, dbErafone } from "./db";

export interface FilterOptions {
  brands: string[];
  conditions: string[];
}

/**
 * Dynamically retrieves all available brands and conditions from SQLite
 * to populate the filter UI dynamically.
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    const brandResOwner = await dbOwner.execute("SELECT DISTINCT brand FROM products");
    const brandResErafone = await dbErafone.execute("SELECT DISTINCT brand FROM products");
    const conditionResOwner = await dbOwner.execute("SELECT DISTINCT condition FROM products");
    const conditionResErafone = await dbErafone.execute("SELECT DISTINCT condition FROM products");

    const rawBrands = [
      ...brandResOwner.rows.map((row) => (row as unknown as { brand: string }).brand),
      ...brandResErafone.rows.map((row) => (row as unknown as { brand: string }).brand)
    ].filter(Boolean);

    const conditions = Array.from(new Set([
      ...conditionResOwner.rows.map((row) => (row as unknown as { condition: string }).condition),
      ...conditionResErafone.rows.map((row) => (row as unknown as { condition: string }).condition)
    ].filter(Boolean)));

    // Deduplicate brands case-insensitively and normalize casing
    const uniqueBrandsMap = new Map<string, string>();
    for (const b of rawBrands) {
      const trimmed = b.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      
      let displayBrand = trimmed;
      if (key === "oppo") displayBrand = "OPPO";
      else if (key === "realme") displayBrand = "Realme";
      else if (key === "vivo") displayBrand = "Vivo";
      else if (key === "tecno") displayBrand = "Tecno";
      else {
        displayBrand = displayBrand.charAt(0).toUpperCase() + displayBrand.slice(1);
      }
      
      if (!uniqueBrandsMap.has(key)) {
        uniqueBrandsMap.set(key, displayBrand);
      }
    }

    const brands = Array.from(uniqueBrandsMap.values()).sort((a, b) => a.localeCompare(b));

    return {
      brands,
      conditions
    };
  } catch (error) {
    console.error("Error fetching dynamic filter options:", error);
    return {
      brands: [],
      conditions: []
    };
  }
}
