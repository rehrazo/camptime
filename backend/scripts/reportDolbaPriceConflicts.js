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
    ].filter(Boolean);

    if (!candidateIds.length) {
      continue;
    }

    for (const key of [itemNo, normalizeIdentifier(itemNo)]) {
      if (!key) {
        continue;
      }

      const existing = byItemNo.get(key) || [];
      existing.push(candidateIds);
      byItemNo.set(key, existing);
    }
  }

  return byItemNo;
}

async function findProductByIdentifier(connection, identifier) {
  const [rows] = await connection.execute(
    `SELECT p.product_id, p.name, p.sku_code, p.item_no, p.spu_no, p.price, p.dropshipping_price, p.stock_quantity,
            (SELECT COUNT(*) FROM product_variations pv WHERE pv.product_id = p.product_id) AS variation_count
     FROM products p
     WHERE p.sku_code = ? OR p.item_no = ? OR p.spu_no = ?
     ORDER BY CASE
       WHEN p.sku_code = ? THEN 1
       WHEN p.item_no = ? THEN 2
       WHEN p.spu_no = ? THEN 3
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
    `SELECT p.product_id, p.name, p.sku_code, p.item_no, p.spu_no, p.price, p.dropshipping_price, p.stock_quantity,
            (SELECT COUNT(*) FROM product_variations pv WHERE pv.product_id = p.product_id) AS variation_count
     FROM products p
     WHERE REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.sku_code, ''))), '-', ''), ' ', ''), '_', '') = ?
        OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.item_no, ''))), '-', ''), ' ', ''), '_', '') = ?
        OR REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.spu_no, ''))), '-', ''), ' ', ''), '_', '') = ?
     ORDER BY CASE
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.sku_code, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 1
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.item_no, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 2
       WHEN REPLACE(REPLACE(REPLACE(UPPER(TRIM(COALESCE(p.spu_no, ''))), '-', ''), ' ', ''), '_', '') = ? THEN 3
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

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const csvFilePath = args.find((arg) => !arg.startsWith('--')) || 'backend/UpdateDolbaPriceInventory.csv';
  const originalCsvArg = args.find((arg) => arg.startsWith('--original-csv='));
  const outArg = args.find((arg) => arg.startsWith('--out='));

  return {
    csvFilePath,
    originalCsvPath: originalCsvArg
      ? originalCsvArg.replace('--original-csv=', '')
      : 'C:/Users/rehra/Downloads/OriginalUplad.csv',
    outputPath: outArg ? outArg.replace('--out=', '') : null,
  };
}

async function main() {
  const cli = parseCliArgs(process.argv);
  const resolvedCsv = path.resolve(process.cwd(), cli.csvFilePath);
  const resolvedOriginalCsv = path.isAbsolute(cli.originalCsvPath)
    ? cli.originalCsvPath
    : path.resolve(process.cwd(), cli.originalCsvPath);
  const outputPath = cli.outputPath
    ? (path.isAbsolute(cli.outputPath) ? cli.outputPath : path.resolve(process.cwd(), cli.outputPath))
    : path.resolve(process.cwd(), `backend/reports/dolba-price-conflicts-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);

  const dolbaRows = parseCsvRecords(resolvedCsv);
  const originalRows = fs.existsSync(resolvedOriginalCsv) ? parseCsvRecords(resolvedOriginalCsv) : [];
  const crosswalk = buildOriginalCrosswalk(originalRows);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    const perProduct = new Map();

    for (const row of dolbaRows) {
      const itemNo = cleanText(pick(row, ['item no', 'item_no', 'sku', 'sku code', 'sku_code']));
      const dropshippingPrice = cleanNumber(
        pick(row, ['dropshipping price us', 'dropshipping price', 'dropshipping_price'])
      );
      const stockQuantity = cleanNumber(pick(row, ['inventory qty', 'inventory_quantity', 'inventory qty us']));

      if (!itemNo) {
        continue;
      }

      let existingRows = await findProductByIdentifier(connection, itemNo);
      let matchMethod = existingRows.length ? 'direct' : null;

      if (!existingRows.length) {
        existingRows = await findProductByNormalizedIdentifier(connection, itemNo);
        if (existingRows.length) {
          matchMethod = 'normalized';
        }
      }

      if (!existingRows.length) {
        const candidateSets = [
          ...(crosswalk.get(itemNo) || []),
          ...(crosswalk.get(normalizeIdentifier(itemNo)) || []),
        ];

        outer:
        for (const candidateIds of candidateSets) {
          for (const candidateId of candidateIds) {
            existingRows = await findProductByIdentifier(connection, candidateId);
            if (!existingRows.length) {
              existingRows = await findProductByNormalizedIdentifier(connection, candidateId);
            }

            if (existingRows.length) {
              matchMethod = `crosswalk:${candidateId}`;
              break outer;
            }
          }
        }
      }

      if (!existingRows.length) {
        continue;
      }

      const product = existingRows[0];
      const bucket = perProduct.get(product.product_id) || {
        product_id: product.product_id,
        name: product.name,
        sku_code: product.sku_code,
        item_no: product.item_no,
        spu_no: product.spu_no,
        current_price: product.price,
        current_dropshipping_price: product.dropshipping_price,
        current_stock_quantity: product.stock_quantity,
        variation_count: Number(product.variation_count || 0),
        rows: [],
      };

      bucket.rows.push({
        itemNo,
        dropshippingPrice,
        stockQuantity,
        matchMethod,
      });
      perProduct.set(product.product_id, bucket);
    }

    const duplicateGroups = [...perProduct.values()].filter((entry) => entry.rows.length > 1);
    const conflictingGroups = duplicateGroups
      .map((entry) => {
        const distinctDropshippingPrices = [...new Set(entry.rows.map((row) => row.dropshippingPrice))]
          .filter((value) => value !== null)
          .sort((left, right) => left - right);
        const distinctStocks = [...new Set(entry.rows.map((row) => row.stockQuantity))]
          .filter((value) => value !== null)
          .sort((left, right) => left - right);

        return {
          ...entry,
          rowCount: entry.rows.length,
          distinctDropshippingPrices,
          distinctStocks,
          minDropshippingPrice: distinctDropshippingPrices.length ? distinctDropshippingPrices[0] : null,
          maxDropshippingPrice: distinctDropshippingPrices.length
            ? distinctDropshippingPrices[distinctDropshippingPrices.length - 1]
            : null,
          priceSpread: distinctDropshippingPrices.length
            ? Number((distinctDropshippingPrices[distinctDropshippingPrices.length - 1] - distinctDropshippingPrices[0]).toFixed(2))
            : 0,
        };
      })
      .filter((entry) => entry.distinctDropshippingPrices.length > 1)
      .sort((left, right) => {
        if (right.priceSpread !== left.priceSpread) {
          return right.priceSpread - left.priceSpread;
        }
        return right.rowCount - left.rowCount;
      });

    const report = {
      createdAt: new Date().toISOString(),
      csvFile: resolvedCsv,
      originalCsvFile: fs.existsSync(resolvedOriginalCsv) ? resolvedOriginalCsv : null,
      summary: {
        duplicateGroups: duplicateGroups.length,
        conflictingGroups: conflictingGroups.length,
        groupsWithExistingVariants: conflictingGroups.filter((entry) => entry.variation_count > 0).length,
        groupsWithoutExistingVariants: conflictingGroups.filter((entry) => entry.variation_count === 0).length,
      },
      conflictingGroups,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ outputPath, summary: report.summary }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Price conflict report failed: ${error.message || error}`);
  process.exit(1);
});