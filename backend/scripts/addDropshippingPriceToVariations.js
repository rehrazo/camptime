#!/usr/bin/env node

/**
 * addDropshippingPriceToVariations.js
 * Adds dropshipping_price and store_price columns to product_variations table
 */

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    console.log('Adding dropshipping_price and actual_price to product_variations...');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'product_variations' 
        AND COLUMN_NAME = 'dropshipping_price'
    `);

    if (columns.length === 0) {
      await connection.execute(`
        ALTER TABLE product_variations 
        ADD COLUMN dropshipping_price DECIMAL(10, 2) NULL DEFAULT NULL
      `);
      console.log('✓ Added dropshipping_price column');
    } else {
      console.log('✓ dropshipping_price column already exists');
    }

    // Add actual_price column for calculated store price
    const [priceColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'product_variations' 
        AND COLUMN_NAME = 'actual_price'
    `);

    if (priceColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE product_variations 
        ADD COLUMN actual_price DECIMAL(10, 2) NULL DEFAULT NULL
      `);
      console.log('✓ Added actual_price column');
    } else {
      console.log('✓ actual_price column already exists');
    }

    console.log('\nMigration complete!');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    await connection.end();
    process.exit(1);
  }
}

main();
