#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });
  
  // These are the product IDs from the 45 conflict groups
  const conflictProductIds = [353, 313, 345, 187, 207, 278, 356, 275, 339, 211, 337, 214, 318, 359, 377, 326, 285, 329, 202, 360, 266, 337, 349, 364, 312, 365, 374, 327, 251, 280, 241, 260, 255, 218, 370, 302, 255, 300, 372, 281, 341, 330, 216, 276, 219];
  
  // Get product-level identifiers
  const placeholders = conflictProductIds.slice(0, 30).map(() => '?').join(',');
  const [products] = await conn.query(`
    SELECT product_id, sku_code, item_no, spu_no
    FROM products 
    WHERE product_id IN (${placeholders})
    ORDER BY product_id
  `, conflictProductIds.slice(0, 30));
  
  console.log('SAMPLE PRODUCT-LEVEL IDENTIFIERS:');
  for (const p of products.slice(0, 5)) {
    console.log(`Product ${p.product_id}: sku_code="${p.sku_code}" item_no="${p.item_no}" spu_no="${p.spu_no}"`);
  }
  
  // Now get variations for one product to see the relationship
  const [productVars] = await conn.query(`
    SELECT * FROM product_variations WHERE product_id = 353 ORDER BY variation_order
  `);
  
  console.log('\nVARIATIONS FOR PRODUCT 353:');
  for (const v of productVars) {
    console.log(`  Variation ${v.variation_id}: value="${v.variation_value}" sku="${v.variation_sku}"`);
  }
  
  // Check if any variation SKUs contain product SKU
  const product353 = products.find(p => p.product_id === 353);
  console.log(`\nProduct 353 sku_code: "${product353.sku_code}"`);
  console.log('Variation SKUs contain product SKU?', productVars.map(v => v.variation_sku.includes(product353.sku_code)));
  
  await conn.end();
})().catch(e => console.error(e));
