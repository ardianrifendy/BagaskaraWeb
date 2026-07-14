import { dbJastip } from "../lib/db-jastip";
import * as schema from "../database/schema-jastip";

async function main() {
  console.log("Memulai Seeding Database Jastip...");

  try {
    // Pastikan DATABASE_URL dikonfigurasi
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL tidak diset di environment variables!");
    }

    console.log("Menghapus data lama (jika ada)...");
    // Hapus data dependencies terlebih dahulu
    await dbJastip.delete(schema.statusLogs);
    await dbJastip.delete(schema.payments);
    await dbJastip.delete(schema.orderItems);
    await dbJastip.delete(schema.orders);
    await dbJastip.delete(schema.batches);

    console.log("Membuat Batch Malaysia...");
    const [batch] = await dbJastip.insert(schema.batches).values({
      slug: "my-sep-2026",
      name: "Batch Malaysia September 2026",
      countryCode: "MY",
      currency: "MYR",
      exchangeRate: "3500.00",
      feeType: "flat",
      feeValue: "15000.00",
      orderDeadline: "2026-09-01",
      eta: "2026-09-15",
      status: "open",
    }).returning();

    console.log(`Batch dibuat dengan ID: ${batch.id}`);

    console.log("Membuat Order 1 (DP)...");
    const [order1] = await dbJastip.insert(schema.orders).values({
      code: "JST-7KQ2-M9XD",
      batchId: batch.id,
      customerName: "Rifendy S.",
      customerWa: "6289513679939",
      paymentStatus: "dp",
      notesPublic: "Mohon barang dipacking aman dengan bubble wrap tambahan.",
      notesInternal: "Owner beli langsung di Sunway Pyramid. Hubungi WA jika barang habis.",
    }).returning();

    console.log("Membuat Order 2 (Lunas)...");
    const [order2] = await dbJastip.insert(schema.orders).values({
      code: "JST-9A8B-7C6D",
      batchId: batch.id,
      customerName: "Budi Susanto",
      customerWa: "6281234567890",
      paymentStatus: "paid",
      notesPublic: "Titipan sepatu specs warna merah ukuran 42.",
      notesInternal: "Supplier lokal Malaysia. Sudah lunas.",
      resi: "SPX123456789",
      courier: "shopee",
    }).returning();

    console.log("Membuat Item untuk Order 1...");
    await dbJastip.insert(schema.orderItems).values([
      {
        orderId: order1.id,
        name: "iPhone 15 Pro Max Clear Case",
        variant: "Clear / 6.7 inch",
        qty: 1,
        estPrice: "199.00",
        actualPrice: "199.00",
        weightGrams: 50,
        status: "purchased",
        substitutionOk: false,
        note: "Beli merek Spigen jika ada, jika tidak warna clear biasa saja.",
      },
      {
        orderId: order1.id,
        name: "Malaysia Starbucks Tumbler",
        variant: "Green Kuala Lumpur Edition",
        qty: 2,
        estPrice: "85.00",
        actualPrice: "80.00",
        weightGrams: 300,
        status: "warehouse",
        substitutionOk: true,
      }
    ]);

    console.log("Membuat Item untuk Order 2...");
    await dbJastip.insert(schema.orderItems).values([
      {
        orderId: order2.id,
        name: "Sambal Belacan Pack",
        variant: "Spicy / 250g",
        qty: 5,
        estPrice: "12.50",
        actualPrice: "12.50",
        weightGrams: 250,
        status: "shipped",
        substitutionOk: false,
      }
    ]);

    console.log("Membuat Riwayat Pembayaran...");
    await dbJastip.insert(schema.payments).values([
      {
        orderId: order1.id,
        amountIdr: "400000",
        type: "dp",
        paidAt: "2026-07-10",
        note: "Pembayaran DP awal via Transfer BCA",
      },
      {
        orderId: order2.id,
        amountIdr: "300000",
        type: "dp",
        paidAt: "2026-07-11",
        note: "Pembayaran DP awal",
      },
      {
        orderId: order2.id,
        amountIdr: "100000",
        type: "pelunasan",
        paidAt: "2026-07-13",
        note: "Pelunasan sisa tagihan",
      }
    ]);

    console.log("Membuat Status Logs...");
    await dbJastip.insert(schema.statusLogs).values([
      {
        orderId: order1.id,
        field: "payment_status",
        oldValue: "unpaid",
        newValue: "dp",
      },
      {
        orderId: order2.id,
        field: "payment_status",
        oldValue: "unpaid",
        newValue: "dp",
      },
      {
        orderId: order2.id,
        field: "payment_status",
        oldValue: "dp",
        newValue: "paid",
      }
    ]);

    console.log("Database Jastip berhasil di-seed!");
  } catch (error) {
    console.error("Gagal melakukan seed database:", error);
    process.exit(1);
  }
}

main();
