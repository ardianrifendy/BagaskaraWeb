import { NextResponse } from 'next/server';
import { dbOwner } from '@/lib/db';
import { detectCategory } from '@/lib/kalkulator/detect/detect';

export async function GET() {
  try {
    // Query products and their minimum variant price from owner.db (active catalog)
    const res = await dbOwner.execute(`
      SELECT p.id, p.name, p.brand, MIN(v.price) as minPrice
      FROM products p
      JOIN variants v ON p.id = v.productId
      GROUP BY p.id
      ORDER BY p.name ASC
    `);

    const products = res.rows.map(row => {
      const name = row.name as string;
      const detected = detectCategory(name);
      return {
        id: row.id as string,
        name: name,
        brand: row.brand as string,
        price: Number(row.minPrice),
        categoryKey: detected.length > 0 ? detected[0].key : 'elektronik.handphone'
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching calculator products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
