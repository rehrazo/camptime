#!/usr/bin/env node
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });
  
  const [vars] = await conn.query(`
    SELECT variation_id, product_id, theme_name, variation_value, variation_sku 
    FROM product_variations 
    WHERE product_id IN (353, 313, 345, 187) 
    ORDER BY product_id, variation_order
  `);
  
  console.log(JSON.stringify(vars, null, 2));
  await conn.end();
})().catch(e => console.error(e));
