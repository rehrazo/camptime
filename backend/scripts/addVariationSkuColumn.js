const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  });

  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'product_variations'
         AND column_name = 'variation_sku'`
    );

    if (Number(rows?.[0]?.total || 0) > 0) {
      console.log('variation_sku column already exists.');
      return;
    }

    await connection.execute(
      `ALTER TABLE product_variations
       ADD COLUMN variation_sku VARCHAR(255) NULL AFTER variation_value`
    );

    console.log('Added variation_sku column to product_variations.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
