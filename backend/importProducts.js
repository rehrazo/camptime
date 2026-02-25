const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { parse } = require('csv-parse/sync');

dotenv.config({ path: path.resolve(__dirname, '.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });

function normalizeHeader(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\+/g, ' plus ')
    .replace(/[\-\/]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text.length ? text : null;
}

function cleanNumber(value) {
  const text = cleanText(value);
  if (text === null) {
    return null;
  }

  const normalized = text.replace(/[$,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return null;
}

function parseCsvRecords(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    bom: true,
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((record) => {
    const normalized = {};
    Object.keys(record).forEach((header) => {
      const normalizedKey = normalizeHeader(header);
      if (!normalized[normalizedKey]) {
        normalized[normalizedKey] = record[header];
      }
    });
    return normalized;
  });
}

async function getOrCreateProduct(connection, mapped) {
  const [existingRows] = await connection.execute(
    `SELECT product_id FROM products WHERE sku_code <=> ? OR spu_no <=> ? LIMIT 1`,
    [mapped.sku_code, mapped.spu_no]
  );

  if (existingRows.length) {
    const productId = existingRows[0].product_id;
    await connection.execute(
      `UPDATE products SET
        spu_no = ?, item_no = ?, url = ?, category = ?, name = ?, supplier = ?, brand = ?, sku_code = ?,
        price = ?, msrp = ?, map = ?, dropshipping_price = ?,
        stock_quantity = ?, inventory_location = ?, shipping_method = ?, shipping_limitations = ?, processing_time = ?,
        description = ?, html_description = ?, upc = ?, asin = ?,
        product_video = ?, additional_resources = ?, prohibited_marketplace = ?,
        return_refund_policy = ?, return_address = ?,
        product_length = ?, product_width = ?, product_height = ?, product_size_unit = ?,
        product_weight = ?, product_weight_unit = ?,
        number_of_packages = ?, packaging_size_unit = ?, packaging_weight_unit = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?`,
      [
        mapped.spu_no, mapped.item_no, mapped.url, mapped.category, mapped.name, mapped.supplier, mapped.brand, mapped.sku_code,
        mapped.price, mapped.msrp, mapped.map, mapped.dropshipping_price,
        mapped.stock_quantity, mapped.inventory_location, mapped.shipping_method, mapped.shipping_limitations, mapped.processing_time,
        mapped.description, mapped.html_description, mapped.upc, mapped.asin,
        mapped.product_video, mapped.additional_resources, mapped.prohibited_marketplace,
        mapped.return_refund_policy, mapped.return_address,
        mapped.product_length, mapped.product_width, mapped.product_height, mapped.product_size_unit,
        mapped.product_weight, mapped.product_weight_unit,
        mapped.number_of_packages, mapped.packaging_size_unit, mapped.packaging_weight_unit,
        productId
      ]
    );
    return productId;
  }

  const [result] = await connection.execute(
    `INSERT INTO products (
      spu_no, item_no, url, category, name, supplier, brand, sku_code,
      price, msrp, map, dropshipping_price,
      stock_quantity, inventory_location, shipping_method, shipping_limitations, processing_time,
      description, html_description, upc, asin,
      product_video, additional_resources, prohibited_marketplace,
      return_refund_policy, return_address,
      product_length, product_width, product_height, product_size_unit,
      product_weight, product_weight_unit,
      number_of_packages, packaging_size_unit, packaging_weight_unit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      mapped.spu_no, mapped.item_no, mapped.url, mapped.category, mapped.name, mapped.supplier, mapped.brand, mapped.sku_code,
      mapped.price, mapped.msrp, mapped.map, mapped.dropshipping_price,
      mapped.stock_quantity, mapped.inventory_location, mapped.shipping_method, mapped.shipping_limitations, mapped.processing_time,
      mapped.description, mapped.html_description, mapped.upc, mapped.asin,
      mapped.product_video, mapped.additional_resources, mapped.prohibited_marketplace,
      mapped.return_refund_policy, mapped.return_address,
      mapped.product_length, mapped.product_width, mapped.product_height, mapped.product_size_unit,
      mapped.product_weight, mapped.product_weight_unit,
      mapped.number_of_packages, mapped.packaging_size_unit, mapped.packaging_weight_unit
    ]
  );

  return result.insertId;
}

function mapProductRow(row) {
  const dropship = cleanNumber(pick(row, ['dropshipping price', 'dropshipping_price']));
  const mapped = {
    spu_no: cleanText(pick(row, ['spu no', 'spu_no'])),
    item_no: cleanText(pick(row, ['item plus no', 'item no', 'item_no'])),
    url: cleanText(pick(row, ['url'])),
    category: cleanText(pick(row, ['category'])),
    name: cleanText(pick(row, ['product name', 'name'])) || 'Unnamed Product',
    supplier: cleanText(pick(row, ['supplier'])),
    brand: cleanText(pick(row, ['brand'])),
    sku_code: cleanText(pick(row, ['sku code', 'sku_code'])),
    price: dropship ?? 0,
    msrp: cleanNumber(pick(row, ['msrp'])),
    map: cleanNumber(pick(row, ['map'])),
    dropshipping_price: dropship,
    stock_quantity: cleanNumber(pick(row, ['inventory qty', 'inventory_quantity'])) ?? 0,
    inventory_location: cleanText(pick(row, ['inventory location'])),
    shipping_method: cleanText(pick(row, ['shipping method'])),
    shipping_limitations: cleanText(pick(row, ['shipping limitations'])),
    processing_time: cleanText(pick(row, ['processing time'])),
    description: cleanText(pick(row, ['description'])),
    html_description: cleanText(pick(row, ['html description'])),
    upc: cleanText(pick(row, ['upc'])),
    asin: cleanText(pick(row, ['asin'])),
    product_video: cleanText(pick(row, ['product video'])),
    additional_resources: cleanText(pick(row, ['additional resources'])),
    prohibited_marketplace: cleanText(pick(row, ['prohibited marketplace'])),
    return_refund_policy: cleanText(pick(row, ['return and refund policy', 'return refund policy'])),
    return_address: cleanText(pick(row, ['return address'])),
    product_length: cleanNumber(pick(row, ['product size length', 'product_length'])),
    product_width: cleanNumber(pick(row, ['product size width', 'product_width'])),
    product_height: cleanNumber(pick(row, ['product size height', 'product_height'])),
    product_size_unit: cleanText(pick(row, ['product size unit'])),
    product_weight: cleanNumber(pick(row, ['product weight'])),
    product_weight_unit: cleanText(pick(row, ['product weight unit'])),
    number_of_packages: cleanNumber(pick(row, ['number of packages'])) ?? 1,
    packaging_size_unit: cleanText(pick(row, ['packaging size unit'])),
    packaging_weight_unit: cleanText(pick(row, ['packaging weight unit']))
  };

  return mapped;
}

function mapImages(row) {
  const images = [];
  for (let index = 1; index <= 6; index += 1) {
    const keyA = `product images ${index}`;
    const keyB = `product_images_${index}`;
    const image = cleanText(pick(row, [keyA, keyB]));
    if (image) {
      images.push({ image_url: image, image_order: index, is_additional: false });
    }
  }

  const additional = cleanText(pick(row, ['additional product images']));
  if (additional) {
    additional
      .split(/[|;,]/)
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((imageUrl, i) => {
        images.push({ image_url: imageUrl, image_order: images.length + 1 + i, is_additional: true });
      });
  }
  return images;
}

function mapVariations(row) {
  const variations = [];
  for (let index = 1; index <= 2; index += 1) {
    const theme = cleanText(pick(row, [`variation theme ${index}`, `theme ${index}`]));
    const value = cleanText(pick(row, [`variation value ${index}`, `value ${index}`]));
    if (theme || value) {
      variations.push({ theme_name: theme, variation_value: value, variation_order: index });
    }
  }
  return variations;
}

function mapPackaging(row) {
  const packaging = [];
  for (let index = 1; index <= 10; index += 1) {
    const size = cleanText(pick(row, [`packaging size${index}`, `packaging_size${index}`]));
    const weight = cleanNumber(pick(row, [`packaging weight ${index}`, `packaging_weight_${index}`]));
    const content = cleanText(pick(row, [`packaging content ${index}`, `packaging_content_${index}`]));
    if (size || weight !== null || content) {
      packaging.push({ package_number: index, size, weight, content });
    }
  }
  return packaging;
}

function mapParameters(row) {
  const parameters = [];
  for (let index = 1; index <= 40; index += 1) {
    const name = cleanText(pick(row, [`parameters name ${index}`, `parameter name ${index}`]));
    const value = cleanText(pick(row, [`parameters value ${index}`, `parameter value ${index}`]));
    if (name || value) {
      parameters.push({ parameter_name: name, parameter_value: value, parameter_order: index });
    }
  }
  return parameters;
}

async function replaceChildRows(connection, tableName, productId, columns, rows) {
  await connection.execute(`DELETE FROM ${tableName} WHERE product_id = ?`, [productId]);
  if (!rows.length) {
    return;
  }

  const placeholders = rows.map(() => `(${['?'].concat(columns.map(() => '?')).join(', ')})`).join(', ');
  const values = [];

  rows.forEach((row) => {
    values.push(productId);
    columns.forEach((column) => values.push(row[column] ?? null));
  });

  await connection.execute(
    `INSERT INTO ${tableName} (product_id, ${columns.join(', ')}) VALUES ${placeholders}`,
    values
  );
}

async function importProducts(csvFilePath, options = {}) {
  let connection;
  try {
    const allRecords = parseCsvRecords(csvFilePath);
    const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : null;
    const records = limit ? allRecords.slice(0, limit) : allRecords;
    console.log(`Parsed ${allRecords.length} rows from ${path.basename(csvFilePath)}`);
    if (limit) {
      console.log(`Applying limit: processing first ${records.length} row(s)`);
    }

    if (options.dryRun) {
      let totalImages = 0;
      let totalVariations = 0;
      let totalPackaging = 0;
      let totalParameters = 0;

      const preview = records.slice(0, 5).map((row) => {
        const mapped = mapProductRow(row);
        const images = mapImages(row);
        const variations = mapVariations(row);
        const packaging = mapPackaging(row);
        const parameters = mapParameters(row);

        totalImages += images.length;
        totalVariations += variations.length;
        totalPackaging += packaging.length;
        totalParameters += parameters.length;

        return {
          sku: mapped.sku_code,
          spu: mapped.spu_no,
          name: mapped.name,
          images: images.length,
          variations: variations.length,
          packaging: packaging.length,
          parameters: parameters.length
        };
      });

      for (let index = 5; index < records.length; index += 1) {
        const row = records[index];
        totalImages += mapImages(row).length;
        totalVariations += mapVariations(row).length;
        totalPackaging += mapPackaging(row).length;
        totalParameters += mapParameters(row).length;
      }

      console.log('--- Dry run summary (no writes performed) ---');
      console.log(`Rows parsed: ${records.length}`);
      console.log(`Total image rows: ${totalImages}`);
      console.log(`Total variation rows: ${totalVariations}`);
      console.log(`Total packaging rows: ${totalPackaging}`);
      console.log(`Total parameter rows: ${totalParameters}`);
      console.log('Sample mapped products (first 5 rows):');
      preview.forEach((item, idx) => {
        console.log(
          `${idx + 1}. sku=${item.sku || '-'} | spu=${item.spu || '-'} | name=${item.name || '-'} | images=${item.images} | variations=${item.variations} | packaging=${item.packaging} | parameters=${item.parameters}`
        );
      });
      return {
        mode: 'dry-run',
        rowsParsed: records.length,
        totalImages,
        totalVariations,
        totalPackaging,
        totalParameters,
        preview
      };
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'camptime'
    });

    let imported = 0;
    let failed = 0;

    for (const row of records) {
      const mapped = mapProductRow(row);
      const label = mapped.sku_code || mapped.spu_no || mapped.name;

      try {
        await connection.beginTransaction();

        const productId = await getOrCreateProduct(connection, mapped);

        await replaceChildRows(connection, 'product_images', productId, ['image_url', 'image_order', 'is_additional'], mapImages(row));
        await replaceChildRows(connection, 'product_variations', productId, ['theme_name', 'variation_value', 'variation_order'], mapVariations(row));
        await replaceChildRows(connection, 'product_packaging', productId, ['package_number', 'size', 'weight', 'content'], mapPackaging(row));
        await replaceChildRows(connection, 'product_parameters', productId, ['parameter_name', 'parameter_value', 'parameter_order'], mapParameters(row));

        await connection.commit();
        imported += 1;

        if (imported % 25 === 0) {
          console.log(`Imported ${imported}/${records.length}`);
        }
      } catch (error) {
        await connection.rollback();
        failed += 1;
        console.error(`Failed row (${label}): ${error.message}`);
      }
    }

    console.log('--- Import complete ---');
    console.log(`Imported: ${imported}`);
    console.log(`Failed: ${failed}`);
    return {
      mode: 'import',
      rowsParsed: records.length,
      imported,
      failed
    };
  } catch (error) {
    console.error(`Import failed: ${error.message}`);
    throw error;
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvFilePath = args.find((arg) => !arg.startsWith('--'));
  const limitArg = args.find((arg) => arg.startsWith('--limit='));
  const limitArgIndex = args.indexOf('--limit');

  let limitValue = null;
  if (limitArg) {
    limitValue = Number(limitArg.split('=')[1]);
  } else if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
    limitValue = Number(args[limitArgIndex + 1]);
  }

  const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : null;
  return { dryRun, csvFilePath, limit };
}

module.exports = {
  importProducts,
  parseCliArgs
};

if (require.main === module) {
  const cli = parseCliArgs(process.argv);
  if (!cli.csvFilePath) {
    console.error('Usage: npm run import:products -- <path-to-csv> [--dry-run] [--limit=<rows>]');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), cli.csvFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`CSV not found: ${resolvedPath}`);
    process.exit(1);
  }

  importProducts(resolvedPath, { dryRun: cli.dryRun, limit: cli.limit }).catch(() => {
    process.exit(1);
  });
}
