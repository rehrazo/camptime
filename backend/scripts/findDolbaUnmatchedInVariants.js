const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const { parse } = require('csv-parse/sync');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });

function normalizeHeader(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[\-\/]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

function normalizeIdentifier(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '');
}

function parseCsvRecords(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record) => {
    const normalized = {};
    Object.keys(record).forEach((header) => {
      const normalizedKey = normalizeHeader(header);
      if (!normalized[normalizedKey]) {
        normalized[normalizedKey] = record[header];
      }
    });
    return normalized;
  });
}

async function main() {
  const csvPath = path.resolve(process.cwd(), 'backend/UpdateDolbaPriceInventory.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const rows = parseCsvRecords(csvPath);
  const itemNos = Array.from(new Set(rows
    .map((row) => cleanText(pick(row, ['item no', 'item_no', 'sku', 'sku code', 'sku_code'])))
    .filter(Boolean)));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    const unmatched = [];

    for (const itemNo of itemNos) {
      const [exactMatchRows] = await conn.execute(
        `SELECT product_id
         FROM products
         WHERE sku_code = ? OR item_no = ? OR spu_no = ?
         LIMIT 1`,
        [itemNo, itemNo, itemNo]
      );

      if (exactMatchRows.length) {
        continue;
      }

      const normalized = normalizeIdentifier(itemNo);
      const [normalizedMatchRows] = await conn.execute(
        `SELECT product_id
         FROM products
         WHERE REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(sku_code, ''))), '-', ''), ' ', ''), '_', '') = ?
            OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(item_no, ''))), '-', ''), ' ', ''), '_', '') = ?
            OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(spu_no, ''))), '-', ''), ' ', ''), '_', '') = ?
         LIMIT 1`,
        [normalized, normalized, normalized]
      );

      if (!normalizedMatchRows.length) {
        unmatched.push(itemNo);
      }
    }

    const unmatchedSet = new Set(unmatched);
    const normalizedToOriginal = new Map();
    unmatched.forEach((value) => {
      normalizedToOriginal.set(normalizeIdentifier(value), value);
    });

    const [variantRows] = await conn.execute(
      `SELECT pv.variation_sku, pv.product_id, p.name, p.sku_code, p.item_no, p.spu_no
       FROM product_variations pv
       INNER JOIN products p ON p.product_id = pv.product_id
       WHERE pv.variation_sku IS NOT NULL AND TRIM(pv.variation_sku) <> ''`
    );

    const exactVariantMatches = [];
    const normalizedVariantMatches = [];

    for (const row of variantRows) {
      const variationSku = String(row.variation_sku || '').trim();
      if (!variationSku) {
        continue;
      }

      if (unmatchedSet.has(variationSku)) {
        exactVariantMatches.push({
          itemNo: variationSku,
          variationSku,
          productId: row.product_id,
          productName: row.name,
          parentSku: row.sku_code,
          parentItemNo: row.item_no,
          parentSpuNo: row.spu_no,
          matchType: 'exact',
        });
        continue;
      }

      const normalizedVariation = normalizeIdentifier(variationSku);
      if (normalizedToOriginal.has(normalizedVariation)) {
        normalizedVariantMatches.push({
          itemNo: normalizedToOriginal.get(normalizedVariation),
          variationSku,
          productId: row.product_id,
          productName: row.name,
          parentSku: row.sku_code,
          parentItemNo: row.item_no,
          parentSpuNo: row.spu_no,
          matchType: 'normalized',
        });
      }
    }

    const mergedMatches = [...exactVariantMatches, ...normalizedVariantMatches]
      .filter((match, index, arr) => {
        const key = `${match.itemNo}|${match.productId}|${match.variationSku}`;
        return arr.findIndex((candidate) => `${candidate.itemNo}|${candidate.productId}|${candidate.variationSku}` === key) === index;
      });

    console.log(JSON.stringify({
      unmatchedCount: unmatched.length,
      variantMatchCount: mergedMatches.length,
      exactVariantMatchCount: exactVariantMatches.length,
      normalizedVariantMatchCount: normalizedVariantMatches.length,
      first10VariantMatches: mergedMatches.slice(0, 10),
    }, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('Failed checking unmatched-in-variants:', error.message || error);
  process.exit(1);
});
