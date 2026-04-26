const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const snapshotPath = args.find((arg) => !arg.startsWith('--'));
  if (!snapshotPath) {
    throw new Error('Snapshot path is required');
  }

  return {
    snapshotPath: path.isAbsolute(snapshotPath) ? snapshotPath : path.resolve(process.cwd(), snapshotPath),
  };
}

async function main() {
  const cli = parseCliArgs(process.argv);
  const snapshot = JSON.parse(fs.readFileSync(cli.snapshotPath, 'utf8'));

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    const productIds = snapshot.matchedProducts.map((product) => product.product_id);
    if (!productIds.length) {
      console.log(JSON.stringify({ snapshot: cli.snapshotPath, changedRows: 0 }, null, 2));
      return;
    }

    const placeholders = productIds.map(() => '?').join(',');
    const [rows] = await connection.execute(
      `SELECT product_id, name, sku_code, item_no, spu_no, stock_quantity, dropshipping_price, price, is_active
       FROM products
       WHERE product_id IN (${placeholders})`,
      productIds
    );

    const currentById = new Map(rows.map((row) => [row.product_id, row]));
    const deltas = [];

    for (const before of snapshot.matchedProducts) {
      const after = currentById.get(before.product_id);
      if (!after) {
        deltas.push({
          product_id: before.product_id,
          name: before.name,
          missingAfterUpdate: true,
        });
        continue;
      }

      const changed =
        Number(before.stock_quantity) !== Number(after.stock_quantity) ||
        Number(before.dropshipping_price) !== Number(after.dropshipping_price) ||
        Number(before.price) !== Number(after.price) ||
        Number(before.is_active) !== Number(after.is_active);

      if (!changed) {
        continue;
      }

      deltas.push({
        product_id: before.product_id,
        name: after.name,
        sku_code: after.sku_code,
        item_no: after.item_no,
        spu_no: after.spu_no,
        match_method: before.match_method,
        before: {
          stock_quantity: before.stock_quantity,
          dropshipping_price: before.dropshipping_price,
          price: before.price,
          is_active: before.is_active,
        },
        after: {
          stock_quantity: after.stock_quantity,
          dropshipping_price: after.dropshipping_price,
          price: after.price,
          is_active: after.is_active,
        },
        price_delta: Number(after.price) - Number(before.price),
        dropshipping_price_delta: Number(after.dropshipping_price) - Number(before.dropshipping_price),
        stock_delta: Number(after.stock_quantity) - Number(before.stock_quantity),
      });
    }

    const sortedByPriceDelta = [...deltas]
      .filter((row) => Number.isFinite(row.price_delta))
      .sort((left, right) => Math.abs(right.price_delta) - Math.abs(left.price_delta))
      .slice(0, 50);

    const stockToZero = deltas
      .filter((row) => Number(row.before.stock_quantity) !== 0 && Number(row.after.stock_quantity) === 0)
      .slice(0, 50);

    const crosswalkChanges = deltas
      .filter((row) => String(row.match_method || '').startsWith('original-crosswalk:'))
      .slice(0, 50);

    const report = {
      snapshot: cli.snapshotPath,
      comparedProducts: snapshot.matchedProducts.length,
      unmatchedBeforeUpdate: snapshot.unmatchedItemNos.length,
      changedRows: deltas.length,
      topPriceDeltas: sortedByPriceDelta,
      stockChangedToZero: stockToZero,
      crosswalkMatchedChanges: crosswalkChanges,
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Report failed: ${error.message || error}`);
  process.exit(1);
});