#!/usr/bin/env node

/**
 * auditVariantMapping.js
 * Audit variant-level mapping for products with price conflicts
 * 
 * For each of the 45 conflict groups from reportDolbaPriceConflicts,
 * examine product_variations and attempt to map supplier rows to variations.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mysql = require('mysql2/promise');

// Parse arguments
const args = process.argv.slice(2);
const csvFile = args[0];
const conflictReportFile = args.find(arg => arg.startsWith('--conflict-report='))?.split('=')[1];
const outDir = args.find(arg => arg.startsWith('--out='))?.split('=')[1] || 'backend/reports';

if (!csvFile || !conflictReportFile) {
  console.error('Usage: node auditVariantMapping.js <csv-file> --conflict-report=<json> [--out=<dir>]');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BATCH_SIZE = 50;

async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: String(process.env.DB_PASSWORD || '').replace(/^\"|\"$/g, ''),
    database: process.env.DB_NAME || 'razowild_db',
  });
}

async function loadConflictReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Conflict report not found: ${reportPath}`);
  }
  const content = fs.readFileSync(reportPath, 'utf8');
  return JSON.parse(content);
}

async function loadCsvFile(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }
  return fs.readFileSync(csvPath, 'utf8');
}

function parseCsv(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

function normalizeString(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function getProductVariationsForProduct(conn, productId) {
  const [variations] = await conn.query(
    `SELECT variation_id, product_id, theme_name, variation_value, variation_sku, variation_order
     FROM product_variations
     WHERE product_id = ?
     ORDER BY variation_order, variation_id`,
    [productId]
  );
  return variations;
}

function scoreVariationMatch(supplierRow, variation, productBaseSkuCode) {
  let score = 0;
  let matchReason = '';
  
  // Strategy 1: Try matching supplier Item No against variation_sku
  if (variation.variation_sku && supplierRow.item_no) {
    const supplierItemNo = normalizeString(supplierRow.item_no);
    const varSku = normalizeString(variation.variation_sku);
    if (supplierItemNo && varSku && (supplierItemNo === varSku || supplierItemNo.includes(varSku))) {
      score += 50;
      matchReason += 'direct variation_sku match; ';
    }
  }
  
  // Strategy 2: Check if variation_sku contains product's base SKU
  if (variation.variation_sku && productBaseSkuCode) {
    const varSku = normalizeString(variation.variation_sku);
    const baseSkuNorm = normalizeString(productBaseSkuCode);
    if (varSku.includes(baseSkuNorm)) {
      // Variation is derived from product base SKU
      // For these products, we can't directly match supplier rows without additional info
      // But we can note that the variation is part of this product
      score += 5;
      matchReason += 'variation from product base sku; ';
    }
  }
  
  // Strategy 3: Try matching against variation_value (color, size, etc.)
  if (variation.variation_value && supplierRow.item_no) {
    const supplierItemNo = normalizeString(supplierRow.item_no);
    const varValue = normalizeString(variation.variation_value);
    if (supplierItemNo && varValue && supplierItemNo.includes(varValue)) {
      score += 30;
      matchReason += 'variation_value match; ';
    }
  }
  
  return { score, reason: matchReason || 'no direct match' };
}

async function auditConflictGroupVariations(conn, productId, supplierRowsForProduct, conflictGroup) {
  const variations = await getProductVariationsForProduct(conn, productId);
  
  // Get product's base SKU code (used to create variations)
  const [productData] = await conn.query(
    `SELECT sku_code FROM products WHERE product_id = ?`,
    [productId]
  );
  const productBaseSkuCode = productData[0]?.sku_code || null;
  
  if (!variations.length) {
    return {
      productId,
      variationCount: 0,
      supplierRowCount: supplierRowsForProduct.length,
      productBaseSkuCode,
      variations: [],
      mappings: [],
      unmapped: supplierRowsForProduct.map(row => ({
        supplierItemNo: row.item_no,
        supplierPrice: parseFloat(row.dropshipping_price || 0),
        supplierStock: parseInt(row.qty || 0),
        reason: 'No variations in database for product'
      })),
      summary: 'Product has no variations'
    };
  }
  
  // Attempt to map each supplier row to the best variation
  const mappings = [];
  const unmapped = [];
  
  for (const supplierRow of supplierRowsForProduct) {
    let bestVariation = null;
    let bestScore = 0;
    let bestReason = '';
    
    for (const variation of variations) {
      const { score, reason } = scoreVariationMatch(supplierRow, variation, productBaseSkuCode);
      if (score > bestScore) {
        bestScore = score;
        bestVariation = variation;
        bestReason = reason;
      }
    }
    
    if (bestScore > 0) {
      mappings.push({
        supplierItemNo: supplierRow.item_no,
        supplierPrice: parseFloat(supplierRow.dropshipping_price || 0),
        supplierStock: parseInt(supplierRow.qty || 0),
        mappedVariationId: bestVariation.variation_id,
        mappedVariationValue: bestVariation.variation_value,
        mappedVariationSku: bestVariation.variation_sku,
        mappingScore: bestScore,
        matchReason: bestReason
      });
    } else {
      unmapped.push({
        supplierItemNo: supplierRow.item_no,
        supplierPrice: parseFloat(supplierRow.dropshipping_price || 0),
        supplierStock: parseInt(supplierRow.qty || 0),
        reason: 'No matching variation found'
      });
    }
  }
  
  return {
    productId,
    productBaseSkuCode,
    variationCount: variations.length,
    supplierRowCount: supplierRowsForProduct.length,
    variations: variations.map(v => ({
      variationId: v.variation_id,
      themeName: v.theme_name,
      value: v.variation_value,
      sku: v.variation_sku,
      order: v.variation_order
    })),
    mappings,
    unmapped,
    mappingRate: mappings.length > 0 ? (mappings.length / supplierRowsForProduct.length * 100).toFixed(1) : 0,
    summary: `${mappings.length}/${supplierRowsForProduct.length} supplier rows mapped (${(mappings.length / supplierRowsForProduct.length * 100).toFixed(1)}%)`
  };
}

async function main() {
  console.log('Starting variant mapping audit...\n');
  
  const conflictReport = await loadConflictReport(conflictReportFile);
  
  console.log(`Loaded conflict report with ${conflictReport.conflictingGroups.length} conflict groups\n`);
  
  const conn = await getDbConnection();
  
  try {
    const auditResults = [];
    const auditSummary = {
      totalConflictGroups: conflictReport.conflictingGroups.length,
      totalVariations: 0,
      totalMappable: 0,
      totalUnmappable: 0,
      perfectMappings: 0,
      partialMappings: 0,
      noMappings: 0,
      groups: []
    };
    
    // Process each conflict group
    for (const group of conflictReport.conflictingGroups) {
      const productId = group.product_id;
      
      // Supplier rows are already in the group.rows - no need to search CSV
      const supplierRowsForProduct = group.rows.map(row => ({
        item_no: row.itemNo,
        dropshipping_price: row.dropshippingPrice,
        qty: row.stockQuantity
      }));
      
      const auditResult = await auditConflictGroupVariations(
        conn,
        productId,
        supplierRowsForProduct,
        group
      );
      
      auditResults.push(auditResult);
      
      // Update summary
      auditSummary.totalVariations += auditResult.variationCount;
      auditSummary.totalMappable += auditResult.mappings.length;
      auditSummary.totalUnmappable += auditResult.unmapped.length;
      
      if (auditResult.unmapped.length === 0) {
        auditSummary.perfectMappings++;
      } else if (auditResult.mappings.length > 0) {
        auditSummary.partialMappings++;
      } else {
        auditSummary.noMappings++;
      }
      
      auditSummary.groups.push({
        productId,
        productName: group.product_name,
        variationCount: auditResult.variationCount,
        supplierRowCount: auditResult.supplierRowCount,
        mappingRate: auditResult.mappingRate,
        summary: auditResult.summary
      });
      
      // Log progress
      if ((auditSummary.groups.length) % 10 === 0) {
        console.log(`Processed ${auditSummary.groups.length}/${conflictReport.conflictingGroups.length} groups...`);
      }
    }
    
    // Generate output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const reportPath = path.join(outDir, `variant-mapping-audit-${timestamp}.json`);
    
    const fullReport = {
      timestamp: new Date().toISOString(),
      summary: auditSummary,
      details: auditResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('VARIANT MAPPING AUDIT SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total conflict groups analyzed: ${auditSummary.totalConflictGroups}`);
    console.log(`Total product variations: ${auditSummary.totalVariations}`);
    console.log(`Total supplier rows mappable: ${auditSummary.totalMappable}`);
    console.log(`Total supplier rows unmappable: ${auditSummary.totalUnmappable}`);
    console.log(`\nMapping Success Rates:`);
    console.log(`  Perfect mappings (100%): ${auditSummary.perfectMappings}`);
    console.log(`  Partial mappings: ${auditSummary.partialMappings}`);
    console.log(`  No mappings (0%): ${auditSummary.noMappings}`);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log('='.repeat(70));
    
    // Log top-level stats
    console.log('\nFull report written. Sample mapping details:\n');
    for (let i = 0; i < Math.min(3, auditResults.length); i++) {
      const result = auditResults[i];
      console.log(`Product ${result.productId} (${result.variationCount} variations):`);
      console.log(`  ${result.summary}`);
      if (result.mappings.length > 0) {
        console.log(`  Sample mapping: ${result.mappings[0].supplierItemNo} -> Variation ${result.mappings[0].mappedVariationId}`);
      }
      console.log();
    }
    
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
