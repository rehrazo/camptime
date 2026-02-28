const express = require('express');
const {
  getCategoryById,
  ensureCategoryPath,
  getDescendantCategoryIds,
} = require('../utils/categories');
const { generateBriefDescription } = require('../utils/briefDescription');
const { cleanDescriptionForStorage } = require('../utils/descriptionCleaner');
const { buildDescriptionSections } = require('../utils/descriptionSections');

const router = express.Router();

function toNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function replaceChildRows(connection, tableName, productId, columns, rows = []) {
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

function mapProductPayload(payload = {}) {
  const rawDescription = payload.description || null;
  const htmlDescription = payload.html_description || null;
  const longDescription = cleanDescriptionForStorage({
    description: rawDescription,
    htmlDescription,
    name: payload.name,
    maxChars: 4000,
  }) || null;

  const description = cleanDescriptionForStorage({
    description: longDescription,
    htmlDescription: null,
    name: payload.name,
    maxChars: 750,
  }) || null;

  return {
    spu_no: payload.spu_no || null,
    item_no: payload.item_no || null,
    url: payload.url || null,
    category: payload.category || null,
    category_id: toNumber(payload.category_id),
    name: payload.name || 'Unnamed Product',
    supplier: payload.supplier || null,
    brand: payload.brand || null,
    sku_code: payload.sku_code || null,
    price: toNumber(payload.price, 0),
    msrp: toNumber(payload.msrp),
    map: toNumber(payload.map),
    dropshipping_price: toNumber(payload.dropshipping_price),
    stock_quantity: toNumber(payload.stock_quantity, 0),
    inventory_location: payload.inventory_location || null,
    shipping_method: payload.shipping_method || null,
    shipping_limitations: payload.shipping_limitations || null,
    processing_time: payload.processing_time || null,
    description,
    html_description: htmlDescription,
    long_description: longDescription,
    brief_description: payload.brief_description || generateBriefDescription({
      description,
      htmlDescription,
      name: payload.name,
    }),
    upc: payload.upc || null,
    asin: payload.asin || null,
    product_video: payload.product_video || null,
    additional_resources: payload.additional_resources || null,
    prohibited_marketplace: payload.prohibited_marketplace || null,
    return_refund_policy: payload.return_refund_policy || null,
    return_address: payload.return_address || null,
    product_length: toNumber(payload.product_length),
    product_width: toNumber(payload.product_width),
    product_height: toNumber(payload.product_height),
    product_size_unit: payload.product_size_unit || null,
    product_weight: toNumber(payload.product_weight),
    product_weight_unit: payload.product_weight_unit || null,
    number_of_packages: toNumber(payload.number_of_packages, 1),
    packaging_size_unit: payload.packaging_size_unit || null,
    packaging_weight_unit: payload.packaging_weight_unit || null
  };
}

async function fetchProductById(connection, productId) {
  const [[product]] = await connection.execute(
    `SELECT p.*, c.name AS category_name, c.path AS category_path, c.parent_id AS category_parent_id
     FROM products p
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE p.product_id = ?`,
    [productId]
  );

  if (!product) {
    return null;
  }

  const [images] = await connection.execute(
    'SELECT image_id, image_url, image_order, is_additional FROM product_images WHERE product_id = ? ORDER BY image_order ASC',
    [productId]
  );
  const [variations] = await connection.execute(
    'SELECT variation_id, theme_name, variation_value, variation_sku, variation_order FROM product_variations WHERE product_id = ? ORDER BY variation_order ASC',
    [productId]
  );
  const [packaging] = await connection.execute(
    'SELECT packaging_id, package_number, size, weight, content FROM product_packaging WHERE product_id = ? ORDER BY package_number ASC',
    [productId]
  );
  const [parameters] = await connection.execute(
    'SELECT parameter_id, parameter_name, parameter_value, parameter_order FROM product_parameters WHERE product_id = ? ORDER BY parameter_order ASC',
    [productId]
  );

  const description_sections = buildDescriptionSections({
    name: product.name,
    longDescription: product.long_description,
    description: product.description,
    variations,
    parameters,
    packaging,
    shippingMethod: product.shipping_method,
    shippingLimitations: product.shipping_limitations,
    processingTime: product.processing_time,
  });

  return {
    ...product,
    images,
    variations,
    packaging,
    parameters,
    description_sections,
  };
}

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toNumber(req.query.limit, 20)));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const category = req.query.category || null;
    const categoryId = toNumber(req.query.category_id);
    const brand = req.query.brand || null;

    const where = [];
    const params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.sku_code LIKE ? OR p.spu_no LIKE ?)');
      params.push(search, search, search);
    }
    if (categoryId) {
      const connection = await pool.getConnection();
      try {
        const descendantIds = await getDescendantCategoryIds(connection, categoryId);
        if (!descendantIds.length) {
          return res.json({
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          });
        }

        where.push(`p.category_id IN (${descendantIds.map(() => '?').join(', ')})`);
        params.push(...descendantIds);
      } finally {
        connection.release();
      }
    }
    if (category) {
      where.push('p.category = ?');
      params.push(category);
    }
    if (brand) {
      where.push('p.brand = ?');
      params.push(brand);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.execute(
      `SELECT p.*, c.name AS category_name, c.path AS category_path, c.parent_id AS category_parent_id,
              (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.product_id
                ORDER BY COALESCE(pi.image_order, 2147483647), pi.image_id ASC
                LIMIT 1
              ) AS primary_image_url
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       ${whereSql}
       ORDER BY p.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[countRow]] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM products p
       LEFT JOIN categories c ON c.category_id = p.category_id
       ${whereSql}`,
      params
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: countRow.total,
        pages: Math.ceil(countRow.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const productId = toNumber(req.params.id);
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const connection = await pool.getConnection();
    try {
      const product = await fetchProductById(connection, productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(product);
    } finally {
      connection.release();
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const payload = mapProductPayload(req.body);

  const images = Array.isArray(req.body.images) ? req.body.images : [];
  const variations = Array.isArray(req.body.variations) ? req.body.variations : [];
  const packaging = Array.isArray(req.body.packaging) ? req.body.packaging : [];
  const parameters = Array.isArray(req.body.parameters) ? req.body.parameters : [];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let resolvedCategoryId = payload.category_id || null;
    let resolvedCategoryPath = payload.category || null;

    if (payload.category) {
      const ensured = await ensureCategoryPath(connection, payload.category);
      resolvedCategoryId = ensured.categoryId;
      resolvedCategoryPath = ensured.categoryPath;
    } else if (payload.category_id) {
      const categoryRow = await getCategoryById(connection, payload.category_id);
      resolvedCategoryId = categoryRow?.category_id || null;
      resolvedCategoryPath = categoryRow?.path || null;
    }

    const [result] = await connection.execute(
      `INSERT INTO products (
        spu_no, item_no, url, category, category_id, name, supplier, brand, sku_code,
        price, msrp, map, dropshipping_price,
        stock_quantity, inventory_location, shipping_method, shipping_limitations, processing_time,
        description, html_description, long_description, brief_description, upc, asin,
        product_video, additional_resources, prohibited_marketplace,
        return_refund_policy, return_address,
        product_length, product_width, product_height, product_size_unit,
        product_weight, product_weight_unit,
        number_of_packages, packaging_size_unit, packaging_weight_unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        payload.spu_no, payload.item_no, payload.url, resolvedCategoryPath, resolvedCategoryId, payload.name, payload.supplier, payload.brand, payload.sku_code,
        payload.price, payload.msrp, payload.map, payload.dropshipping_price,
        payload.stock_quantity, payload.inventory_location, payload.shipping_method, payload.shipping_limitations, payload.processing_time,
        payload.description, payload.html_description, payload.long_description, payload.brief_description, payload.upc, payload.asin,
        payload.product_video, payload.additional_resources, payload.prohibited_marketplace,
        payload.return_refund_policy, payload.return_address,
        payload.product_length, payload.product_width, payload.product_height, payload.product_size_unit,
        payload.product_weight, payload.product_weight_unit,
        payload.number_of_packages, payload.packaging_size_unit, payload.packaging_weight_unit
      ]
    );

    const productId = result.insertId;

    await replaceChildRows(connection, 'product_images', productId, ['image_url', 'image_order', 'is_additional'], images);
    await replaceChildRows(connection, 'product_variations', productId, ['theme_name', 'variation_value', 'variation_sku', 'variation_order'], variations);
    await replaceChildRows(connection, 'product_packaging', productId, ['package_number', 'size', 'weight', 'content'], packaging);
    await replaceChildRows(connection, 'product_parameters', productId, ['parameter_name', 'parameter_value', 'parameter_order'], parameters);

    await connection.commit();

    const product = await fetchProductById(connection, productId);
    res.status(201).json(product);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const productId = toNumber(req.params.id);

  if (!productId) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  const payload = mapProductPayload(req.body);

  const images = Array.isArray(req.body.images) ? req.body.images : [];
  const variations = Array.isArray(req.body.variations) ? req.body.variations : [];
  const packaging = Array.isArray(req.body.packaging) ? req.body.packaging : [];
  const parameters = Array.isArray(req.body.parameters) ? req.body.parameters : [];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute('SELECT product_id FROM products WHERE product_id = ?', [productId]);
    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    let resolvedCategoryId = payload.category_id || null;
    let resolvedCategoryPath = payload.category || null;

    if (payload.category) {
      const ensured = await ensureCategoryPath(connection, payload.category);
      resolvedCategoryId = ensured.categoryId;
      resolvedCategoryPath = ensured.categoryPath;
    } else if (payload.category_id) {
      const categoryRow = await getCategoryById(connection, payload.category_id);
      resolvedCategoryId = categoryRow?.category_id || null;
      resolvedCategoryPath = categoryRow?.path || null;
    }

    await connection.execute(
      `UPDATE products SET
        spu_no = ?, item_no = ?, url = ?, category = ?, category_id = ?, name = ?, supplier = ?, brand = ?, sku_code = ?,
        price = ?, msrp = ?, map = ?, dropshipping_price = ?,
        stock_quantity = ?, inventory_location = ?, shipping_method = ?, shipping_limitations = ?, processing_time = ?,
        description = ?, html_description = ?, long_description = ?, brief_description = ?, upc = ?, asin = ?,
        product_video = ?, additional_resources = ?, prohibited_marketplace = ?,
        return_refund_policy = ?, return_address = ?,
        product_length = ?, product_width = ?, product_height = ?, product_size_unit = ?,
        product_weight = ?, product_weight_unit = ?,
        number_of_packages = ?, packaging_size_unit = ?, packaging_weight_unit = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = ?`,
      [
        payload.spu_no, payload.item_no, payload.url, resolvedCategoryPath, resolvedCategoryId, payload.name, payload.supplier, payload.brand, payload.sku_code,
        payload.price, payload.msrp, payload.map, payload.dropshipping_price,
        payload.stock_quantity, payload.inventory_location, payload.shipping_method, payload.shipping_limitations, payload.processing_time,
        payload.description, payload.html_description, payload.long_description, payload.brief_description, payload.upc, payload.asin,
        payload.product_video, payload.additional_resources, payload.prohibited_marketplace,
        payload.return_refund_policy, payload.return_address,
        payload.product_length, payload.product_width, payload.product_height, payload.product_size_unit,
        payload.product_weight, payload.product_weight_unit,
        payload.number_of_packages, payload.packaging_size_unit, payload.packaging_weight_unit,
        productId
      ]
    );

    await replaceChildRows(connection, 'product_images', productId, ['image_url', 'image_order', 'is_additional'], images);
    await replaceChildRows(connection, 'product_variations', productId, ['theme_name', 'variation_value', 'variation_sku', 'variation_order'], variations);
    await replaceChildRows(connection, 'product_packaging', productId, ['package_number', 'size', 'weight', 'content'], packaging);
    await replaceChildRows(connection, 'product_parameters', productId, ['parameter_name', 'parameter_value', 'parameter_order'], parameters);

    await connection.commit();

    const product = await fetchProductById(connection, productId);
    return res.json(product);
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const productId = toNumber(req.params.id);
    if (!productId) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const [result] = await pool.execute('DELETE FROM products WHERE product_id = ?', [productId]);
    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
