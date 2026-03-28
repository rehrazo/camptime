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
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS drop_shippers (
        drop_shipper_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(120),
        state VARCHAR(120),
        postal_code VARCHAR(40),
        country VARCHAR(120),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    const [dropShipperColumn] = await connection.execute(
      `SHOW COLUMNS FROM products LIKE 'drop_shipper_id'`
    );

    if (!dropShipperColumn.length) {
      await connection.execute(
        `ALTER TABLE products
         ADD COLUMN drop_shipper_id INT NULL`
      );
    }

    const [fkRows] = await connection.execute(
      `SELECT CONSTRAINT_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND COLUMN_NAME = 'drop_shipper_id'
         AND REFERENCED_TABLE_NAME = 'drop_shippers'`
    );

    if (!fkRows.length) {
      await connection.execute(
        `ALTER TABLE products
         ADD CONSTRAINT fk_products_drop_shipper
         FOREIGN KEY (drop_shipper_id)
         REFERENCES drop_shippers(drop_shipper_id)
         ON DELETE SET NULL`
      );
    }

    await connection.execute(
      `CREATE INDEX IF NOT EXISTS idx_products_drop_shipper_id ON products (drop_shipper_id)`
    );

    console.log('drop_shippers table and products.drop_shipper_id are ready.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Failed to add drop shippers table:', error.message || error);
  process.exit(1);
});
