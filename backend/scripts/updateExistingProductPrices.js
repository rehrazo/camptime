const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    const [[before]] = await connection.execute(
      `SELECT
         COUNT(*) AS total_products,
         SUM(CASE WHEN dropshipping_price IS NOT NULL THEN 1 ELSE 0 END) AS products_with_dropship,
         SUM(CASE WHEN dropshipping_price IS NULL AND msrp IS NOT NULL THEN 1 ELSE 0 END) AS products_using_msrp_fallback
       FROM products`
    );

    const [result] = await connection.execute(
      `UPDATE products
       SET price = CASE
         WHEN dropshipping_price IS NOT NULL THEN ROUND(dropshipping_price * 1.25, 2)
         ELSE COALESCE(msrp, 0)
       END
       WHERE NOT (price <=> CASE
         WHEN dropshipping_price IS NOT NULL THEN ROUND(dropshipping_price * 1.25, 2)
         ELSE COALESCE(msrp, 0)
       END)`
    );

    const [[after]] = await connection.execute(
      `SELECT
         COUNT(*) AS total_products,
         SUM(CASE WHEN dropshipping_price IS NOT NULL AND price = ROUND(dropshipping_price * 1.25, 2) THEN 1 ELSE 0 END) AS aligned_with_dropship_formula,
         SUM(CASE WHEN dropshipping_price IS NULL AND price = COALESCE(msrp, 0) THEN 1 ELSE 0 END) AS aligned_with_msrp_fallback
       FROM products`
    );

    console.log(
      JSON.stringify(
        {
          totalProducts: Number(before.total_products || 0),
          productsWithDropship: Number(before.products_with_dropship || 0),
          productsUsingMsrpFallback: Number(before.products_using_msrp_fallback || 0),
          updatedRows: Number(result.affectedRows || 0),
          alignedWithDropshipFormula: Number(after.aligned_with_dropship_formula || 0),
          alignedWithMsrpFallback: Number(after.aligned_with_msrp_fallback || 0),
        },
        null,
        2
      )
    );
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Failed to update product prices:', error.message || error);
  process.exit(1);
});
