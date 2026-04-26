#!/usr/bin/env node

/**
 * reportVariantSyncImpact.js
 * Audit variant-level changes from the sync
 */

const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });

  try {
    console.log('Generating variant sync impact report...\n');

    // Get all variations with dropshipping_price set
    const [variationsWithPrice] = await connection.execute(`
      SELECT 
        pv.variation_id,
        pv.product_id,
        pv.variation_value,
        pv.variation_sku,
        pv.dropshipping_price,
        pv.actual_price,
        p.name as product_name,
        p.sku_code,
        p.dropshipping_price as product_dropshipping_price,
        p.price as product_price
      FROM product_variations pv
      JOIN products p ON pv.product_id = p.product_id
      WHERE pv.dropshipping_price IS NOT NULL
      ORDER BY pv.product_id, pv.variation_order
      LIMIT 50
    `);

    console.log(`Total variations with supplier pricing: ${variationsWithPrice.length}\n`);

    // Sample of variant-level pricing
    console.log('SAMPLE VARIANT-LEVEL PRICING (First 10):');
    console.log('='.repeat(120));
    for (let i = 0; i < Math.min(10, variationsWithPrice.length); i++) {
      const v = variationsWithPrice[i];
      console.log(`
Product ${v.product_id}: ${v.product_name}
  Variation: ${v.variation_value} (${v.variation_sku})
  Supplier Price: $${v.dropshipping_price}
  Calculated Store Price: $${v.actual_price}
  Product-Level Price: $${v.product_dropshipping_price} / $${v.product_price}`);
    }

    // Count variations per product
    const [productVariationStats] = await connection.execute(`
      SELECT 
        p.product_id,
        p.name,
        COUNT(pv.variation_id) as total_variations,
        SUM(CASE WHEN pv.dropshipping_price IS NOT NULL THEN 1 ELSE 0 END) as priced_variations,
        MIN(pv.dropshipping_price) as min_supplier_price,
        MAX(pv.dropshipping_price) as max_supplier_price,
        GROUP_CONCAT(CONCAT(pv.variation_value, ':', pv.dropshipping_price) SEPARATOR ' | ') as pricing_details
      FROM products p
      LEFT JOIN product_variations pv ON p.product_id = pv.product_id
      WHERE p.product_id IN (SELECT DISTINCT product_id FROM product_variations WHERE dropshipping_price IS NOT NULL)
      GROUP BY p.product_id, p.name
      LIMIT 20
    `);

    console.log('\n' + '='.repeat(120));
    console.log('PRODUCTS WITH VARIANT PRICING (First 20):');
    console.log('='.repeat(120));
    
    for (const row of productVariationStats) {
      const spreadInfo = row.min_supplier_price !== null && row.max_supplier_price !== null
        ? ` (Spread: $${(row.max_supplier_price - row.min_supplier_price).toFixed(2)})`
        : '';
      
      console.log(`
Product ${row.product_id}: ${row.name}
  Variations: ${row.total_variations} total, ${row.priced_variations} with supplier pricing
  Price Range: $${row.min_supplier_price} - $${row.max_supplier_price}${spreadInfo}
  Details: ${row.pricing_details}`);
    }

    // Statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT pv.product_id) as products_with_variant_pricing,
        COUNT(pv.variation_id) as total_priced_variations,
        AVG(pv.dropshipping_price) as avg_supplier_price,
        MIN(pv.dropshipping_price) as min_supplier_price,
        MAX(pv.dropshipping_price) as max_supplier_price
      FROM product_variations pv
      WHERE pv.dropshipping_price IS NOT NULL
    `);

    const s = stats[0];
    console.log('\n' + '='.repeat(120));
    console.log('VARIANT PRICING SUMMARY');
    console.log('='.repeat(120));
    console.log(`
Products with variant pricing: ${s.products_with_variant_pricing}
Total variations with pricing: ${s.total_priced_variations}
Average supplier price: $${s.avg_supplier_price.toFixed(2)}
Price range: $${s.min_supplier_price.toFixed(2)} - $${s.max_supplier_price.toFixed(2)}
Range spread: $${(s.max_supplier_price - s.min_supplier_price).toFixed(2)}
    `);

    // Generate report file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        productsWithVariantPricing: s.products_with_variant_pricing,
        totalPricedVariations: s.total_priced_variations,
        averageSupplierPrice: parseFloat(s.avg_supplier_price.toFixed(2)),
        minSupplierPrice: s.min_supplier_price,
        maxSupplierPrice: s.max_supplier_price,
        priceRangeSpread: parseFloat((s.max_supplier_price - s.min_supplier_price).toFixed(2)),
      },
      productSamples: productVariationStats.slice(0, 10).map(row => ({
        productId: row.product_id,
        productName: row.name,
        totalVariations: row.total_variations,
        pricedVariations: row.priced_variations,
        minPrice: row.min_supplier_price,
        maxPrice: row.max_supplier_price,
        details: row.pricing_details
      })),
      variationSamples: variationsWithPrice.slice(0, 20).map(v => ({
        variationId: v.variation_id,
        productId: v.product_id,
        productName: v.product_name,
        variationValue: v.variation_value,
        supplierPrice: v.dropshipping_price,
        calculatedStorePrice: v.actual_price,
      }))
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const reportPath = path.join('backend/reports', `variant-sync-impact-${timestamp}.json`);
    
    if (!fs.existsSync('backend/reports')) {
      fs.mkdirSync('backend/reports', { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`Report saved to: ${reportPath}\n`);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
    await connection.end();
    process.exit(1);
  }
}

main();
