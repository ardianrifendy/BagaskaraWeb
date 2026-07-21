import test from 'node:test';
import assert from 'node:assert';
import { computeTokopediaFees } from '../lib/kalkulator-tokopedia/fees';
import { TokopediaInput, TokopediaProfile } from '../lib/kalkulator-tokopedia/types';

const defaultProfileBaru: TokopediaProfile = {
  storeType: 'marketplace',
  useTarifLama: false
};

const defaultProfileLama: TokopediaProfile = {
  storeType: 'marketplace',
  useTarifLama: true
};

test('Test Vector A: HP Rp 3.000.000, Telepon & Elektronik (dinamis 3%)', () => {
  const input: TokopediaInput = {
    categorySlug: 'telepon-elektronik',
    cost: 2500000,
    qty: 1,
    sellerDiscount: 0,
    orderHandlingFee: 0 // isolasi hanya tes komisi dinamis
  };

  // Skema Baru (2026-05-18)
  const resBaru = computeTokopediaFees(input, defaultProfileBaru, 3000000);
  const dinamisBaru = resBaru.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisBaru, 'komisi_dinamis harus ada');
  assert.strictEqual(dinamisBaru.amount, 90000, 'Komisi dinamis baru harus Rp 90.000 (3% dari 3jt, di bawah cap 650k)');
  assert.strictEqual(dinamisBaru.capped, false, 'Tidak boleh terkena cap');

  // Skema Lama (2025-06-10)
  const resLama = computeTokopediaFees(input, defaultProfileLama, 3000000);
  const dinamisLama = resLama.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisLama, 'komisi_dinamis lama harus ada');
  assert.strictEqual(dinamisLama.amount, 40000, 'Komisi dinamis lama 4% dari 3jt (120rb) harus kena cap Rp 40.000');
  assert.strictEqual(dinamisLama.capped, true, 'Harus terkena cap Rp 40.000');

  // Delta
  const delta = dinamisBaru.amount - dinamisLama.amount;
  assert.strictEqual(delta, 50000, 'Delta perubahan komisi harus +Rp 50.000 per unit');
});

test('Test Vector B: Laptop Rp 20.000.000, Komputer & Peralatan Kantor (dinamis 4%)', () => {
  const input: TokopediaInput = {
    categorySlug: 'komputer-peralatan-kantor',
    cost: 18000000,
    qty: 1,
    sellerDiscount: 0,
    orderHandlingFee: 0
  };

  // Skema Baru: 4% x 20jt = 800rb -> kena cap Rp 650.000
  const resBaru = computeTokopediaFees(input, defaultProfileBaru, 20000000);
  const dinamisBaru = resBaru.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisBaru);
  assert.strictEqual(dinamisBaru.amount, 650000, 'Komisi dinamis 800rb harus kena cap Rp 650.000');
  assert.strictEqual(dinamisBaru.capped, true, 'Harus flagged capped');

  // Skema Lama: cap 40.000
  const resLama = computeTokopediaFees(input, defaultProfileLama, 20000000);
  const dinamisLama = resLama.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisLama);
  assert.strictEqual(dinamisLama.amount, 40000, 'Komisi dinamis lama harus kena cap Rp 40.000');

  // Delta: 650.000 - 40.000 = 610.000 (+1525%)
  const delta = dinamisBaru.amount - dinamisLama.amount;
  assert.strictEqual(delta, 610000, 'Delta perubahan komisi laptop harus +Rp 610.000');
});

test('Test Vector C: Baju Wanita Rp 1.000.000, Pakaian Wanita (dinamis 8%)', () => {
  const input: TokopediaInput = {
    categorySlug: 'pakaian-wanita-pakaian-dalam',
    cost: 800000,
    qty: 1,
    sellerDiscount: 0,
    orderHandlingFee: 0
  };

  // Skema Baru: 8% x 1jt = 80.000 (di bawah cap 650k)
  const resBaru = computeTokopediaFees(input, defaultProfileBaru, 1000000);
  const dinamisBaru = resBaru.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisBaru);
  assert.strictEqual(dinamisBaru.amount, 80000, 'Komisi dinamis baru harus Rp 80.000 (dipotong penuh)');
  assert.strictEqual(dinamisBaru.capped, false);

  // Skema Lama: 5.5% x 1jt = 55.000 -> kena cap Rp 40.000
  const resLama = computeTokopediaFees(input, defaultProfileLama, 1000000);
  const dinamisLama = resLama.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamisLama);
  assert.strictEqual(dinamisLama.amount, 40000, 'Komisi dinamis lama 55rb harus kena cap Rp 40.000');
});

test('Test Vector D: Fashion Rp 50.000, Margin Rp 5.000 (cost 45.000), dinamis 8%', () => {
  const input: TokopediaInput = {
    categorySlug: 'pakaian-pria-pakaian-dalam',
    cost: 45000,
    qty: 1,
    sellerDiscount: 0,
    orderHandlingFee: 0
  };

  // 8% x 50.000 = 4.000 -> netReceived = 46.000 -> profit = 46.000 - 45.000 = 1.000
  const res = computeTokopediaFees(input, defaultProfileBaru, 50000);
  const dinamis = res.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamis);
  assert.strictEqual(dinamis.amount, 4000, 'Komisi dinamis 8% x 50rb harus Rp 4.000');
  assert.strictEqual(res.profit, 1000, 'Profit tersisa harus Rp 1.000');
  assert.ok(res.marginPct < 5, 'Margin Pct harus di bawah 5% (1.000 / 50.000 = 2%) untuk pemicu warning banner');
});

test('Test Vector E: QTY 5, HP Rp 3.000.000 (dinamis 3%) - Cap per-item per-unit', () => {
  const input: TokopediaInput = {
    categorySlug: 'telepon-elektronik',
    cost: 2500000,
    qty: 5,
    sellerDiscount: 0,
    orderHandlingFee: 0
  };

  // Hitung per unit: 3.000.000 x 3% = 90.000 (di bawah cap 650k)
  // Total 5 QTY = 5 x 90.000 = 450.000
  // BUKAN min(15.000.000 x 3% = 450k, 650k) jika 15jt x 5% melebihi cap
  const res = computeTokopediaFees(input, defaultProfileBaru, 3000000);
  const dinamis = res.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(dinamis);
  assert.strictEqual(dinamis.amount, 450000, 'Total komisi dinamis 5 item harus Rp 450.000 (5 x 90.000)');
  assert.strictEqual(dinamis.capped, false);

  // Uji QTY 5 dengan laptop 20jt (4% = 800rb per unit, kena cap 650rb per unit)
  // Total 5 QTY = 5 x 650.000 = 3.250.000 (BUKAN min(100jt x 4%, 650k) = 650k)
  const laptopInput: TokopediaInput = {
    categorySlug: 'komputer-peralatan-kantor',
    cost: 18000000,
    qty: 5,
    sellerDiscount: 0,
    orderHandlingFee: 0
  };
  const laptopRes = computeTokopediaFees(laptopInput, defaultProfileBaru, 20000000);
  const laptopDinamis = laptopRes.items.find((i) => i.key === 'komisi_dinamis');

  assert.ok(laptopDinamis);
  assert.strictEqual(laptopDinamis.amount, 3250000, 'Cap per item: 5 x 650.000 = Rp 3.250.000');
  assert.strictEqual(laptopDinamis.capped, true);
});
