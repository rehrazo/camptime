const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    const [rows] = await connection.execute(
      `SHOW COLUMNS FROM products LIKE 'is_active'`
    );

    if (!rows.length) {
      await connection.execute(
        `ALTER TABLE products
         ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE`
      );

      console.log('Added products.is_active column.');
      return;
    }

    console.log('products.is_active already exists.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Failed to add products.is_active column:', error.message || error);
  process.exit(1);
});
