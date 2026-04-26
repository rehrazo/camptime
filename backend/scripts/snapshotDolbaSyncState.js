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

function mapUpdateRow(row) {
  return {
    itemNo: cleanText(pick(row, ['item no', 'item_no', 'sku', 'sku code', 'sku_code'])),
  };
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
    `SELECT product_id, name, sku_code, item_no, spu_no, stock_quantity, dropshipping_price, price, is_active
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
    `SELECT product_id, name, sku_code, item_no, spu_no, stock_quantity, dropshipping_price, price, is_active
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
    : path.resolve(process.cwd(), `backend/reports/dolba-sync-snapshot-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);

  const records = parseCsvRecords(resolvedCsv);
  const originalRows = fs.existsSync(resolvedOriginalCsv) ? parseCsvRecords(resolvedOriginalCsv) : [];
  const originalCrosswalk = buildOriginalCrosswalk(originalRows);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  const snapshot = {
    createdAt: new Date().toISOString(),
    csvFile: resolvedCsv,
    originalCsvFile: fs.existsSync(resolvedOriginalCsv) ? resolvedOriginalCsv : null,
    matchedProducts: [],
    unmatchedItemNos: [],
  };

  try {
    for (const row of records) {
      const mapped = mapUpdateRow(row);
      if (!mapped.itemNo) {
        continue;
      }

      let existingRows = await findProductByIdentifier(connection, mapped.itemNo);
      let matchMethod = 'direct';

      if (!existingRows.length) {
        existingRows = await findProductByNormalizedIdentifier(connection, mapped.itemNo);
        if (existingRows.length) {
          matchMethod = 'normalized';
        }
      }

      if (!existingRows.length && originalCrosswalk.size) {
        const candidateSets = [
          ...(originalCrosswalk.get(mapped.itemNo) || []),
          ...(originalCrosswalk.get(normalizeIdentifier(mapped.itemNo)) || []),
        ];

        for (const candidateIds of candidateSets) {
          for (const candidateId of candidateIds) {
            existingRows = await findProductByIdentifier(connection, candidateId);
            if (!existingRows.length) {
              existingRows = await findProductByNormalizedIdentifier(connection, candidateId);
            }

            if (existingRows.length) {
              matchMethod = `original-crosswalk:${candidateId}`;
              break;
            }
          }

          if (existingRows.length) {
            break;
          }
        }
      }

      if (!existingRows.length) {
        snapshot.unmatchedItemNos.push(mapped.itemNo);
        continue;
      }

      const product = existingRows[0];
      if (!snapshot.matchedProducts.some((entry) => entry.product_id === product.product_id)) {
        snapshot.matchedProducts.push({
          product_id: product.product_id,
          name: product.name,
          sku_code: product.sku_code,
          item_no: product.item_no,
          spu_no: product.spu_no,
          stock_quantity: product.stock_quantity,
          dropshipping_price: product.dropshipping_price,
          price: product.price,
          is_active: product.is_active,
          matched_from_item_no: mapped.itemNo,
          match_method: matchMethod,
        });
      }
    }

    snapshot.summary = {
      matchedProductCount: snapshot.matchedProducts.length,
      unmatchedCount: snapshot.unmatchedItemNos.length,
    };

    fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
    console.log(JSON.stringify({ outputPath, summary: snapshot.summary }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Snapshot failed: ${error.message || error}`);
  process.exit(1);
});