#!/usr/bin/env node

/**
 * updateDolbaPriceInventoryV2.js
 * 
 * Enhanced Dolba sync with variant-aware pricing.
 * - Detects products with variations
 * - Maps supplier rows to product variations
 * - Updates variation-level dropshipping_price
 * - Recalculates product-level price from variations
 */

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

function cleanNumber(value) {
  const text = cleanText(value);
  if (text === null) {
    return null;
  }
  const normalized = text.replace(/[$,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeString(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
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

function mapUpdateRow(row) {
  const itemNo = cleanText(pick(row, ['item no', 'item_no', 'sku', 'sku code', 'sku_code']));
  const stockQuantity = cleanNumber(pick(row, ['inventory qty', 'inventory_quantity', 'inventory qty us']));
  const dropshippingPrice = cleanNumber(
    pick(row, ['dropshipping price us', 'dropshipping price', 'dropshipping_price'])
  );

  return {
    itemNo,
    stockQuantity,
    dropshippingPrice,
    computedStorePrice: dropshippingPrice === null ? null : Number((dropshippingPrice * 1.25).toFixed(2)),
  };
}

function normalizeIdentifier(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s\-_]+/g, '');
}

function buildOriginalCrosswalk(rows) {
  const byItemNo = new Map();

  for (const row of rows) {
    const itemNo = cleanText(pick(row, ['item no', 'item_no']));
    if (!itemNo) {
      continue;
    }

    const candidateIds = [
      cleanText(pick(row, ['sku code', 'sku_code', 'sku'])),
      itemNo,
      cleanText(pick(row, ['spu no', 'spu_no', 'spu'])),
    ].filter((value) => !!value);

    if (!candidateIds.length) {
      continue;
    }

    const exactKey = itemNo;
    const normalizedKey = normalizeIdentifier(itemNo);

    const existingExact = byItemNo.get(exactKey) || [];
    existingExact.push(candidateIds);
    byItemNo.set(exactKey, existingExact);

    if (normalizedKey) {
      const existingNormalized = byItemNo.get(normalizedKey) || [];
      existingNormalized.push(candidateIds);
      byItemNo.set(normalizedKey, existingNormalized);
    }
  }

  return byItemNo;
}

async function findProductByIdentifier(connection, identifier) {
  const [rows] = await connection.execute(
    `SELECT product_id, sku_code, item_no
     FROM products
     WHERE sku_code = ? OR item_no = ? OR spu_no = ?
     ORDER BY CASE
       WHEN sku_code = ? THEN 1
       WHEN item_no = ? THEN 2
       WHEN spu_no = ? THEN 3
       ELSE 4
     END
     LIMIT 1`,
    [identifier, identifier, identifier, identifier, identifier, identifier]
  );

  return rows;
}

async function findProductByNormalizedIdentifier(connection, identifier) {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  if (!normalizedIdentifier) {
    return [];
  }

  const [rows] = await connection.execute(
    `SELECT product_id, sku_code, item_no
     FROM products
     WHERE REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(sku_code, ''))), '-', ''), ' ', ''), '_', '') = ?
        OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(item_no, ''))), '-', ''), ' ', ''), '_', '') = ?
        OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(spu_no, ''))), '-', ''), ' ', ''), '_', '') = ?
     ORDER BY CASE
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(sku_code, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 1
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(item_no, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 2
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(spu_no, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 3
       ELSE 4
     END
     LIMIT 1`,
    [
      normalizedIdentifier,
      normalizedIdentifier,
      normalizedIdentifier,
      normalizedIdentifier,
      normalizedIdentifier,
      normalizedIdentifier,
    ]
  );

  return rows;
}

async function getProductVariations(connection, productId) {
  const [variations] = await connection.execute(
    `SELECT variation_id, product_id, variation_value, variation_sku, variation_order
     FROM product_variations
     WHERE product_id = ?
     ORDER BY variation_order, variation_id`,
    [productId]
  );

  return variations;
}

function scoreVariationMatch(supplierItemNo, variation, productBaseSkuCode) {
  let score = 0;

  // Strategy 1: Direct variation_sku match
  if (variation.variation_sku && supplierItemNo) {
    const supplierNorm = normalizeString(supplierItemNo);
    const varSkuNorm = normalizeString(variation.variation_sku);
    if (supplierNorm && varSkuNorm && (supplierNorm === varSkuNorm || supplierNorm.includes(varSkuNorm))) {
      score += 50;
    }
  }

  // Strategy 2: Check if variation_sku contains product base SKU
  if (variation.variation_sku && productBaseSkuCode) {
    const varSkuNorm = normalizeString(variation.variation_sku);
    const baseSkuNorm = normalizeString(productBaseSkuCode);
    if (varSkuNorm.includes(baseSkuNorm)) {
      // Variation is derived from product base SKU
      score += 5;
    }
  }

  return score;
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const variantAware = args.includes('--variant-aware') || true; // Default to variant-aware
  const csvFilePath = args.find((arg) => !arg.startsWith('--')) || 'backend/UpdateDolbaPriceInventory.csv';
  const originalCsvArg = args.find((arg) => arg.startsWith('--original-csv='));
  const originalCsvPath = originalCsvArg
    ? originalCsvArg.replace('--original-csv=', '')
    : 'C:/Users/rehra/Downloads/OriginalUplad.csv';
  return { dryRun, variantAware, csvFilePath, originalCsvPath };
}

async function runSync(csvFilePath, { dryRun = false, variantAware = true, originalCsvPath = null } = {}) {
  const resolvedCsv = path.resolve(process.cwd(), csvFilePath);
  if (!fs.existsSync(resolvedCsv)) {
    throw new Error(`CSV not found: ${resolvedCsv}`);
  }

  const records = parseCsvRecords(resolvedCsv);

  let resolvedOriginalCsv = null;
  let originalCrosswalk = null;
  if (originalCsvPath) {
    const candidateOriginalPath = path.isAbsolute(originalCsvPath)
      ? originalCsvPath
      : path.resolve(process.cwd(), originalCsvPath);

    if (fs.existsSync(candidateOriginalPath)) {
      resolvedOriginalCsv = candidateOriginalPath;
      const originalRows = parseCsvRecords(resolvedOriginalCsv);
      originalCrosswalk = buildOriginalCrosswalk(originalRows);
    }
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  let processed = 0;
  let matched = 0;
  let updated = 0;
  let missingItemNo = 0;
  let noMatch = 0;
  let matchedByNormalized = 0;
  let matchedByOriginalCrosswalk = 0;
  let variantUpdated = 0;
  let variantMapped = 0;
  let productLevelUpdated = 0;

  const unmatched = [];
  const productVariations = new Map(); // Cache for product variations

  try {
    if (!dryRun) {
      await connection.beginTransaction();
    }

    for (const row of records) {
      const mapped = mapUpdateRow(row);
      processed += 1;

      if (!mapped.itemNo) {
        missingItemNo += 1;
        continue;
      }

      let existingRows = await findProductByIdentifier(connection, mapped.itemNo);

      if (!existingRows.length) {
        existingRows = await findProductByNormalizedIdentifier(connection, mapped.itemNo);
        if (existingRows.length) {
          matchedByNormalized += 1;
        }
      }

      if (!existingRows.length && originalCrosswalk) {
        const candidateSets = [
          ...(originalCrosswalk.get(mapped.itemNo) || []),
          ...(originalCrosswalk.get(normalizeIdentifier(mapped.itemNo)) || []),
        ];

        for (const candidateIds of candidateSets) {
          for (const candidateId of candidateIds) {
            if (!candidateId) {
              continue;
            }

            existingRows = await findProductByIdentifier(connection, candidateId);
            if (!existingRows.length) {
              existingRows = await findProductByNormalizedIdentifier(connection, candidateId);
            }

            if (existingRows.length) {
              matchedByOriginalCrosswalk += 1;
              break;
            }
          }

          if (existingRows.length) {
            break;
          }
        }
      }

      if (!existingRows.length) {
        noMatch += 1;
        if (unmatched.length < 25) {
          unmatched.push(mapped.itemNo);
        }
        continue;
      }

      matched += 1;
      const productId = existingRows[0].product_id;
      const productBaseSkuCode = existingRows[0].sku_code;

      const nextStock = mapped.stockQuantity === null ? 0 : Math.max(0, Math.trunc(mapped.stockQuantity));
      const hasDropship = mapped.dropshippingPrice !== null;

      // VARIANT-AWARE LOGIC
      if (variantAware && hasDropship) {
        // Get or cache product variations
        if (!productVariations.has(productId)) {
          const variations = await getProductVariations(connection, productId);
          productVariations.set(productId, variations);
        }

        const variations = productVariations.get(productId);

        if (variations.length > 0) {
          // Try to map supplier row to a variation
          let bestVariation = null;
          let bestScore = 0;

          for (const variation of variations) {
            const score = scoreVariationMatch(mapped.itemNo, variation, productBaseSkuCode);
            if (score > bestScore) {
              bestScore = score;
              bestVariation = variation;
            }
          }

          // If we found a matching variation, update it instead of product level
          if (bestVariation && bestScore > 0) {
            variantMapped += 1;

            if (!dryRun) {
              const variantStorePrice = mapped.computedStorePrice;
              
              // Update the variation's dropshipping_price and actual_price
              const [varResult] = await connection.execute(
                `UPDATE product_variations 
                 SET dropshipping_price = ?, 
                     actual_price = ?
                 WHERE variation_id = ?`,
                [mapped.dropshippingPrice, variantStorePrice, bestVariation.variation_id]
              );
              variantUpdated += Number(varResult.affectedRows || 0);

              // Still update product-level stock
              const [stockResult] = await connection.execute(
                `UPDATE products
                 SET stock_quantity = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE product_id = ?
                   AND NOT (stock_quantity <=> ?)`,
                [nextStock, productId, nextStock]
              );
              updated += Number(stockResult.affectedRows || 0);
            }
            continue;
          }
        }
      }

      // FALL BACK TO PRODUCT-LEVEL UPDATE (for products without variations or unmatched variants)
      if (!dryRun) {
        if (hasDropship) {
          const nextPrice = mapped.computedStorePrice;
          const [result] = await connection.execute(
            `UPDATE products
             SET stock_quantity = ?,
                 dropshipping_price = ?,
                 price = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE product_id = ?
               AND NOT (
                 stock_quantity <=> ?
                 AND dropshipping_price <=> ?
                 AND price <=> ?
               )`,
            [
              nextStock,
              mapped.dropshippingPrice,
              nextPrice,
              productId,
              nextStock,
              mapped.dropshippingPrice,
              nextPrice,
            ]
          );
          updated += Number(result.affectedRows || 0);
          productLevelUpdated += 1;
        } else {
          const [result] = await connection.execute(
            `UPDATE products
             SET stock_quantity = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE product_id = ?
               AND NOT (stock_quantity <=> ?)`,
            [nextStock, productId, nextStock]
          );
          updated += Number(result.affectedRows || 0);
        }
      }
    }

    if (!dryRun) {
      await connection.commit();
    }

    const summary = {
      mode: dryRun ? 'dry-run' : 'sync',
      variant_aware: variantAware,
      csv: path.basename(resolvedCsv),
      processed,
      matched,
      updated,
      missingItemNo,
      noMatch,
      matchedByNormalized,
      matchedByOriginalCrosswalk,
      originalCsvUsed: resolvedOriginalCsv,
      unmatchedSample: unmatched,
      variant_stats: {
        variantMapped,
        variantUpdated,
        productLevelUpdated,
      },
    };

    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } catch (error) {
    if (!dryRun) {
      await connection.rollback();
    }
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  runSync,
  parseCliArgs,
};

if (require.main === module) {
  const cli = parseCliArgs(process.argv);
  runSync(cli.csvFilePath, { dryRun: cli.dryRun, variantAware: cli.variantAware, originalCsvPath: cli.originalCsvPath }).catch((error) => {
    console.error(`Dolba sync failed: ${error.message || error}`);
    process.exit(1);
  });
}
