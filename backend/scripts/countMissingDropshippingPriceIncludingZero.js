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
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS total FROM products WHERE dropshipping_price IS NULL OR dropshipping_price = 0'
    );
    console.log(JSON.stringify(rows[0], null, 2));
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Failed to count missing dropshipping_price including zero:', error.message || error);
  process.exit(1);
});
