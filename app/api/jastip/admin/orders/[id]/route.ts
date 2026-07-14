import { NextRequest, NextResponse } from "next/server";
import { dbJastip } from "@/lib/db-jastip";
import { orders, statusLogs } from "@/database/schema-jastip";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateOrderSchema = z.object({
  batchId: z.coerce.number().positive("Batch ID wajib diisi"),
  customerName: z.string().min(1, "Nama pelanggan wajib diisi"),
  customerWa: z.string().min(6, "Nomor WhatsApp tidak valid"),
  paymentStatus: z.enum(["unpaid", "dp", "paid"]),
  notesPublic: z.string().optional().nullable(),
  notesInternal: z.string().optional().nullable(),
  resi: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const orderData = await dbJastip.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        batch: true,
        items: true,
        payments: true,
        statusLogs: {
          orderBy: (logs, { desc }) => [desc(logs.changedAt)],
        },
      },
    });

    if (!orderData) {
      return NextResponse.json({ ok: false, error: "Order tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order: orderData });
  } catch (error) {
    console.error("Gagal mengambil detail order:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = updateOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    // Fetch existing order to log changes
    const oldOrder = await dbJastip.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!oldOrder) {
      return NextResponse.json({ ok: false, error: "Order tidak ditemukan." }, { status: 404 });
    }

    // Begin updates
    const [updatedOrder] = await dbJastip
      .update(orders)
      .set({
        batchId: data.batchId,
        customerName: data.customerName,
        customerWa: data.customerWa,
        paymentStatus: data.paymentStatus,
        notesPublic: data.notesPublic || null,
        notesInternal: data.notesInternal || null,
        resi: data.resi || null,
        courier: data.courier || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Log payment status change if any
    if (oldOrder.paymentStatus !== data.paymentStatus) {
      await dbJastip.insert(statusLogs).values({
        orderId,
        field: "payment_status",
        oldValue: oldOrder.paymentStatus,
        newValue: data.paymentStatus,
      });
    }

    return NextResponse.json({ ok: true, order: updatedOrder });
  } catch (error) {
    console.error("Gagal memperbarui order:", error);
    return NextResponse.json({ ok: false, error: "Gagal memproses data." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ ok: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const deleted = await dbJastip.delete(orders).where(eq(orders.id, orderId)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "Order tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Order berhasil dihapus." });
  } catch (error) {
    console.error("Gagal menghapus order:", error);
    return NextResponse.json({ ok: false, error: "Gagal menghapus data." }, { status: 500 });
  }
}
