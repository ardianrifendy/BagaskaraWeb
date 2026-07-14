import test from "node:test";
import assert from "node:assert";
import { generateOrderCode, normalizeOrderCode } from "./order-code";
import { calculateItemPrice } from "./pricing";

test("Jastip Order Code — Generator Format", () => {
  const code = generateOrderCode();

  // Format should be JST-XXXX-XXXX
  assert.ok(code.startsWith("JST-"), "Should start with JST-");
  assert.strictEqual(code.length, 13, "Length should be exactly 13 characters");
  assert.strictEqual(code[8], "-", "Should have dash at index 8");

  // Check characters are uppercase and from allowed alphabet
  const clean = code.replace(/[^A-Z0-9]/g, "");
  assert.strictEqual(clean.length, 11, "Alpha-numeric length should be 11 (JST + 8 random)");

  // Crockford Base32 check: shouldn't contain 0, O, 1, I, L, U
  const forbidden = ["0", "O", "1", "I", "L", "U"];
  for (const char of forbidden) {
    assert.strictEqual(clean.includes(char), false, `Should not contain ambiguous character: ${char}`);
  }
});

test("Jastip Order Code — Uniqueness Collision Test", () => {
  const codes = new Set<string>();
  const total = 1000;

  for (let i = 0; i < total; i++) {
    codes.add(generateOrderCode());
  }

  assert.strictEqual(codes.size, total, "All 1000 generated codes must be unique");
});

test("Jastip Order Code — Normalization Edge Cases", () => {
  // Test lower case with dashes
  assert.strictEqual(normalizeOrderCode("jst-7kq2-m9xd"), "JST-7KQ2-M9XD");

  // Test missing JST prefix
  assert.strictEqual(normalizeOrderCode("7kq2-m9xd"), "JST-7KQ2-M9XD");

  // Test lowercase missing prefix and dashes
  assert.strictEqual(normalizeOrderCode("7kq2m9xd"), "JST-7KQ2-M9XD");

  // Test spacing and random special chars
  assert.strictEqual(normalizeOrderCode("jst.7kq2  m9xd!"), "JST-7KQ2-M9XD");

  // Test shorter input (should format as much as possible)
  assert.strictEqual(normalizeOrderCode("7kq2"), "JST-7KQ2");
  assert.strictEqual(normalizeOrderCode(""), "JST-");
});

test("Jastip Pricing — Flat Fee Calculations", () => {
  // Flat fee, qty = 1, exchange rate = 3500 (e.g. MYR to IDR)
  // price = 10 MYR, fee = 15000 flat, qty = 1
  // base = 10 * 3500 = 35000
  // fee = 15000 * 1 = 15000
  // total = 50000
  const result1 = calculateItemPrice({
    price: 10,
    exchangeRate: 3500,
    feeType: "flat",
    feeValue: 15000,
    qty: 1
  });

  assert.strictEqual(result1.basePriceIdr, 35000);
  assert.strictEqual(result1.feeIdr, 15000);
  assert.strictEqual(result1.finalPriceIdr, 50000);

  // Flat fee, qty = 3
  // base = 30 * 3500 = 105000
  // fee = 15000 * 3 = 45000
  // total = 150000
  const result2 = calculateItemPrice({
    price: 10,
    exchangeRate: 3500,
    feeType: "flat",
    feeValue: 15000,
    qty: 3
  });

  assert.strictEqual(result2.basePriceIdr, 105000);
  assert.strictEqual(result2.feeIdr, 45000);
  assert.strictEqual(result2.finalPriceIdr, 150000);
});

test("Jastip Pricing — Percentage Fee Calculations", () => {
  // Percentage fee, qty = 1, feeValue = 10%
  // price = 100 SGD, exchange = 11000, feeType = percent, feeValue = 10
  // base = 100 * 11000 * 1 = 1100000
  // fee = 1100000 * 10% = 110000
  // total = 1210000
  const result1 = calculateItemPrice({
    price: 100,
    exchangeRate: 11000,
    feeType: "percent",
    feeValue: 10,
    qty: 1
  });

  assert.strictEqual(result1.basePriceIdr, 1100000);
  assert.strictEqual(result1.feeIdr, 110000);
  assert.strictEqual(result1.finalPriceIdr, 1210000);

  // Percentage fee, qty = 2
  // base = 200 * 11000 = 2200000
  // fee = 2200000 * 10% = 220000
  // total = 2420000
  const result2 = calculateItemPrice({
    price: 100,
    exchangeRate: 11000,
    feeType: "percent",
    feeValue: 10,
    qty: 2
  });

  assert.strictEqual(result2.basePriceIdr, 2200000);
  assert.strictEqual(result2.feeIdr, 220000);
  assert.strictEqual(result2.finalPriceIdr, 2420000);
});

test("Jastip Pricing — Proportional Shipping Calculations", () => {
  // Item 1: weight = 200g, qty = 2 (total weight = 400g)
  // Total order weight = 1000g, Total order shipping = 150000 IDR
  // Proportional shipping for item 1 = (400 / 1000) * 150000 = 60000 IDR
  // price = 10 SGD, exchange = 11000, fee = flat 10000
  // base = 2 * 10 * 11000 = 220000
  // fee = 2 * 10000 = 20000
  // total = 220000 + 20000 + 60000 = 300000 IDR
  const result = calculateItemPrice({
    price: 10,
    exchangeRate: 11000,
    feeType: "flat",
    feeValue: 10000,
    qty: 2,
    weightGrams: 200,
    totalWeightGrams: 1000,
    totalShippingIdr: 150000
  });

  assert.strictEqual(result.basePriceIdr, 220000);
  assert.strictEqual(result.feeIdr, 20000);
  assert.strictEqual(result.shippingIdr, 60000);
  assert.strictEqual(result.finalPriceIdr, 300000);
});
