"use server";

import { dbOwner } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const getStokPin = () => process.env.STOK_PIN || "bagaskara";

async function verifyAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("stok_auth_token")?.value;
  const expectedToken = btoa(getStokPin());
  return token === expectedToken;
}

export async function checkAuth() {
  return await verifyAuth();
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("stok_auth_token");
}

export async function checkPin(pin: string) {
  const targetPin = getStokPin();
  if (pin === targetPin) {
    const cookieStore = await cookies();
    cookieStore.set("stok_auth_token", btoa(targetPin), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });
    return true;
  }
  return false;
}

export async function getOwnerProducts(searchQuery: string = "") {
  if (!(await verifyAuth())) {
    return [];
  }
  try {
    let sql = `
      SELECT p.*, COUNT(v.id) as variantCount
      FROM products p
      LEFT JOIN variants v ON p.id = v.productId
    `;
    let args: string[] = [];
    if (searchQuery) {
      sql += " WHERE p.name LIKE ? OR p.brand LIKE ?";
      args = [`%${searchQuery}%`, `%${searchQuery}%`];
    }
    sql += " GROUP BY p.id ORDER BY p.createdAt DESC";

    const res = await dbOwner.execute({ sql, args });
    return res.rows.map((row) => ({
      id: row.id as string,
      brand: row.brand as string,
      name: row.name as string,
      condition: row.condition as string,
      specSummary: row.specSummary as string,
      specs: row.specs as string,
      highlights: row.highlights as string,
      warranty: row.warranty as string,
      completeness: row.completeness as string,
      defects: row.defects as string,
      createdAt: row.createdAt as string,
      variantCount: Number(row.variantCount)
    }));
  } catch (err) {
    console.error("Error getOwnerProducts:", err);
    return [];
  }
}

export async function getVariantsForProduct(productId: string) {
  if (!(await verifyAuth())) {
    return [];
  }
  try {
    const res = await dbOwner.execute({
      sql: "SELECT * FROM variants WHERE productId = ?",
      args: [productId]
    });
    return res.rows.map((row) => ({
      id: row.id as string,
      productId: row.productId as string,
      color: row.color as string,
      colorHex: row.colorHex as string,
      storage: row.storage as string,
      price: Number(row.price),
      strikePrice: row.strikePrice ? Number(row.strikePrice) : null,
      stock: row.stock as "ready" | "habis",
      images: row.images as string
    }));
  } catch (err) {
    console.error("Error getVariantsForProduct:", err);
    return [];
  }
}

export async function saveProduct(data: {
  id?: string;
  brand: string;
  name: string;
  condition: string;
  completeness: string;
  warranty: string;
  defects: string[];
}) {
  if (!(await verifyAuth())) {
    return { success: false, error: "Unauthorized: Sesi Anda telah berakhir, silakan login kembali." };
  }
  try {
    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const defectsJson = JSON.stringify(data.defects || []);

    if (data.id) {
      await dbOwner.execute({
        sql: `
          UPDATE products
          SET brand = ?, name = ?, condition = ?, completeness = ?, warranty = ?, defects = ?
          WHERE id = ?
        `,
        args: [data.brand, data.name, data.condition, data.completeness, data.warranty, defectsJson, data.id]
      });
    } else {
      await dbOwner.execute({
        sql: `
          INSERT INTO products (id, brand, name, condition, specSummary, specs, highlights, warranty, completeness, defects, createdAt, isScraped)
          VALUES (?, ?, ?, ?, ?, '[]', '[]', ?, ?, ?, ?, 0)
        `,
        args: [
          id,
          data.brand,
          data.name,
          data.condition,
          "-",
          data.warranty || "Garansi Resmi",
          data.completeness || "Fullset",
          defectsJson,
          new Date().toISOString()
        ]
      });
    }
    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true, productId: id };
  } catch (err) {
    console.error("Error saveProduct:", err);
    const message = err instanceof Error ? err.message : "Gagal menyimpan produk";
    return { success: false, error: message };
  }
}

export async function deleteProduct(id: string) {
  if (!(await verifyAuth())) {
    return { success: false, error: "Unauthorized: Sesi Anda telah berakhir, silakan login kembali." };
  }
  try {
    await dbOwner.execute({ sql: "DELETE FROM variants WHERE productId = ?", args: [id] });
    await dbOwner.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true };
  } catch (err) {
    console.error("Error deleteProduct:", err);
    const message = err instanceof Error ? err.message : "Gagal menghapus produk";
    return { success: false, error: message };
  }
}

export async function saveVariant(data: {
  id?: string;
  productId: string;
  color: string;
  colorHex: string;
  storage: string;
  price: number;
  stock: "ready" | "habis";
  images: string[];
}) {
  if (!(await verifyAuth())) {
    return { success: false, error: "Unauthorized: Sesi Anda telah berakhir, silakan login kembali." };
  }
  try {
    const id = data.id || `${data.productId}-${data.color.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${data.storage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const imagesJson = JSON.stringify(data.images || []);

    if (data.id) {
      await dbOwner.execute({
        sql: `
          UPDATE variants
          SET color = ?, colorHex = ?, storage = ?, price = ?, stock = ?, images = ?
          WHERE id = ?
        `,
        args: [data.color, data.colorHex, data.storage, data.price, data.stock, imagesJson, data.id]
      });
    } else {
      await dbOwner.execute({
        sql: `
          INSERT INTO variants (id, productId, color, colorHex, storage, price, strikePrice, stock, images)
          VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
        `,
        args: [id, data.productId, data.color, data.colorHex || "#8e8e93", data.storage, data.price, data.stock, imagesJson]
      });
    }

    const variantsRes = await dbOwner.execute({
      sql: "SELECT storage FROM variants WHERE productId = ?",
      args: [data.productId]
    });
    const storages = Array.from(new Set(variantsRes.rows.map(r => r.storage as string))).join(" / ");
    await dbOwner.execute({
      sql: "UPDATE products SET specSummary = ? WHERE id = ?",
      args: [storages, data.productId]
    });

    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true };
  } catch (err) {
    console.error("Error saveVariant:", err);
    const message = err instanceof Error ? err.message : "Gagal menyimpan varian";
    return { success: false, error: message };
  }
}

export async function deleteVariant(id: string, productId: string) {
  if (!(await verifyAuth())) {
    return { success: false, error: "Unauthorized: Sesi Anda telah berakhir, silakan login kembali." };
  }
  try {
    await dbOwner.execute({ sql: "DELETE FROM variants WHERE id = ?", args: [id] });

    const variantsRes = await dbOwner.execute({
      sql: "SELECT storage FROM variants WHERE productId = ?",
      args: [productId]
    });
    const storages = Array.from(new Set(variantsRes.rows.map(r => r.storage as string))).join(" / ") || "-";
    await dbOwner.execute({
      sql: "UPDATE products SET specSummary = ? WHERE id = ?",
      args: [storages, productId]
    });

    revalidatePath("/");
    revalidatePath("/stok");
    return { success: true };
  } catch (err) {
    console.error("Error deleteVariant:", err);
    const message = err instanceof Error ? err.message : "Gagal menghapus varian";
    return { success: false, error: message };
  }
}
