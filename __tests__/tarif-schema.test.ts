import test from 'node:test';
import assert from 'node:assert';
import tarifBaru from '../data/tarif/tokopedia-2026-05-18.json';
import tarifLama from '../data/tarif/tokopedia-2025-06-10.json';

export function validateTarifSchema(data: any) {
  assert.ok(data.schemaVersion, 'schemaVersion harus ada');
  assert.ok(data.berlakuMulai, 'berlakuMulai harus ada');
  assert.strictEqual(typeof data.capKomisiPerItem, 'number', 'capKomisiPerItem harus angka');
  assert.ok(data.capKomisiPerItem > 0, 'capKomisiPerItem harus > 0');
  assert.ok(Array.isArray(data.kategori), 'kategori harus array');
  assert.strictEqual(data.kategori.length, 30, 'kategori harus berjumlah 30');

  const slugs = new Set<string>();

  for (const item of data.kategori) {
    assert.ok(item.slug, `slug harus ada di kategori ${item.nama}`);
    assert.ok(!slugs.has(item.slug), `slug '${item.slug}' harus unik`);
    slugs.add(item.slug);

    assert.ok(item.nama, 'nama kategori tidak boleh kosong');
    assert.strictEqual(typeof item.rateDinamis, 'number', `rateDinamis di ${item.slug} harus number`);
    assert.ok(
      item.rateDinamis > 0 && item.rateDinamis <= 15,
      `rateDinamis '${item.rateDinamis}' di ${item.slug} harus 0 < rate <= 15`
    );
  }
}

test('Validasi Data Tarif Tokopedia 2026-05-18 (Baru)', () => {
  validateTarifSchema(tarifBaru);
});

test('Validasi Data Tarif Tokopedia 2025-06-10 (Lama)', () => {
  validateTarifSchema(tarifLama);
});
