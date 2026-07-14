import { pgTable, serial, text, integer, numeric, timestamp, date, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  currency: text("currency").notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 12, scale: 2 }).notNull(),
  feeType: text("fee_type").notNull().default("flat"), // 'flat' | 'percent'
  feeValue: numeric("fee_value", { precision: 12, scale: 2 }).notNull(),
  orderDeadline: date("order_deadline"),
  eta: date("eta"),
  status: text("status").notNull().default("open"), // open|closed|shipping|done
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  batchId: integer("batch_id").notNull().references(() => batches.id),
  customerName: text("customer_name").notNull(),
  customerWa: text("customer_wa").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid|dp|paid
  notesPublic: text("notes_public"),
  notesInternal: text("notes_internal"),
  resi: text("resi"),
  courier: text("courier"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  variant: text("variant"),
  qty: integer("qty").notNull().default(1),
  estPrice: numeric("est_price", { precision: 12, scale: 2 }).notNull(),
  actualPrice: numeric("actual_price", { precision: 12, scale: 2 }),
  weightGrams: integer("weight_grams"),
  status: text("status").notNull().default("requested"), // requested|hunting|found|purchased|warehouse|shipped|out_of_stock|cancelled
  substitutionOk: boolean("substitution_ok").notNull().default(false),
  proofUrl: text("proof_url"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amountIdr: numeric("amount_idr", { precision: 14, scale: 0 }).notNull(),
  type: text("type").notNull(), // dp|pelunasan|refund
  paidAt: date("paid_at").notNull(),
  note: text("note"),
});

export const statusLogs = pgTable("status_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  itemId: integer("item_id"),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(),
});

// Relationships
export const batchesRelations = relations(batches, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  batch: one(batches, {
    fields: [orders.batchId],
    references: [batches.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  statusLogs: many(statusLogs),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const statusLogsRelations = relations(statusLogs, ({ one }) => ({
  order: one(orders, {
    fields: [statusLogs.orderId],
    references: [orders.id],
  }),
}));
