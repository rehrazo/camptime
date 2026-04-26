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
    const [columnRows] = await connection.execute("SHOW COLUMNS FROM products LIKE 'is_active'");
    if (!columnRows.length) {
      await connection.execute("ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE");
    }

    const [beforeRows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM products WHERE UPPER(TRIM(COALESCE(inventory_location, ''))) = 'CN'"
    );
    const totalCN = Number(beforeRows[0]?.total || 0);

    const [updateResult] = await connection.execute(
      "UPDATE products SET is_active = 0 WHERE UPPER(TRIM(COALESCE(inventory_location, ''))) = 'CN'"
    );

    const [afterRows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM products WHERE UPPER(TRIM(COALESCE(inventory_location, ''))) = 'CN' AND is_active = 0"
    );
    const inactiveCN = Number(afterRows[0]?.total || 0);

    console.log(JSON.stringify({ totalCN, updated: Number(updateResult.affectedRows || 0), inactiveCN }, null, 2));
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Failed to disable CN products:', error.message || error);
  process.exit(1);
});
