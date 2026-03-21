const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const {
  sanitizeCategoryName,
  getCategoryById,
  getDescendantCategoryIds,
  getAllCategories,
  getCategoryTree,
  rebuildCategoryMetadata,
} = require('../utils/categories')

const router = express.Router()
const HOME_FEATURE_GROUPS = Object.freeze(['featured', 'recommended', 'none'])
const categoryUploadsDir = path.join(__dirname, '..', 'uploads', 'category-images')

if (!fs.existsSync(categoryUploadsDir)) {
  fs.mkdirSync(categoryUploadsDir, { recursive: true })
}

const categoryImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, categoryUploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(String(file.originalname || '')).toLowerCase() || '.jpg'
      const safeExt = /^[.][a-z0-9]+$/.test(ext) ? ext : '.jpg'
      cb(null, `category-${Date.now()}${safeExt}`)
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const mimeType = String(file.mimetype || '').toLowerCase()
    if (!mimeType.startsWith('image/')) {
      cb(new Error('Only image files are allowed'))
      return
    }

    cb(null, true)
  },
})

function parseFeatureImageUrl(value, fallback = null) {
  if (typeof value === 'undefined') {
    return fallback
  }

  const text = String(value || '').trim()
  if (!text) {
    return null
  }

  if (text.length > 500) {
    throw new Error('home_feature_image_url must be 500 characters or less')
  }

  return text
}

function parseFeatureOrder(value, fallback = 0) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return fallback
  }

  const numeric = Number(value)
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error('home_feature_order must be a non-negative integer')
  }

  return numeric
}

function parseFeatureGroup(value, fallback = 'none') {
  if (typeof value === 'undefined') {
    return fallback
  }

  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) {
    return fallback
  }

  if (!HOME_FEATURE_GROUPS.includes(normalized)) {
    throw new Error(`home_feature_group must be one of: ${HOME_FEATURE_GROUPS.join(', ')}`)
  }

  return normalized
}

async function reorderSiblingCategory(connection, categoryId, direction) {
  const existing = await getCategoryById(connection, categoryId)
  if (!existing) {
    return { status: 404, body: { error: 'Category not found' } }
  }

  const [siblingRows] = await connection.execute(
    `SELECT category_id
     FROM categories
     WHERE parent_id <=> ?
     ORDER BY sort_order ASC, name ASC, category_id ASC`,
    [existing.parent_id]
  )

  const siblingIds = siblingRows
    .map((row) => Number(row.category_id))
    .filter((id) => Number.isInteger(id) && id > 0)

  const currentIndex = siblingIds.indexOf(categoryId)
  if (currentIndex === -1) {
    return { status: 404, body: { error: 'Category not found' } }
  }

  const targetIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1
  const edgeMessage = direction === 'down'
    ? 'Category is already at the bottom of its group.'
    : 'Category is already at the top of its group.'

  if (targetIndex < 0 || targetIndex >= siblingIds.length) {
    return { status: 200, body: { message: edgeMessage, changed: false } }
  }

  const reorderedIds = [...siblingIds]
  ;[reorderedIds[currentIndex], reorderedIds[targetIndex]] = [reorderedIds[targetIndex], reorderedIds[currentIndex]]

  for (let index = 0; index < reorderedIds.length; index += 1) {
    await connection.execute(
      `UPDATE categories
       SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
       WHERE category_id = ?`,
      [index + 1, reorderedIds[index]]
    )
  }

  return {
    status: 200,
    body: {
      message: direction === 'down' ? 'Category moved down.' : 'Category moved up.',
      changed: true,
    },
  }
}

router.get('/tree', async (req, res) => {
  const pool = req.app.locals.pool

  try {
    const connection = await pool.getConnection()
    try {
      const tree = await getCategoryTree(connection)
      return res.json({ data: tree })
    } finally {
      connection.release()
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool

  try {
    const connection = await pool.getConnection()
    try {
      const rows = await getAllCategories(connection)
      return res.json({ data: rows })
    } finally {
      connection.release()
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

router.post('/upload-image', categoryImageUpload.single('image'), async (req, res) => {
  const uploadedFile = req.file

  if (!uploadedFile) {
    return res.status(400).json({ error: 'Image file is required (field name: image)' })
  }

  const imageUrl = `/api/uploads/category-images/${uploadedFile.filename}`
  return res.status(201).json({
    message: 'Category image uploaded',
    data: {
      image_url: imageUrl,
      filename: uploadedFile.filename,
    },
  })
})

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool
  const name = sanitizeCategoryName(req.body?.name)
  const parentId = req.body?.parent_id ? Number(req.body.parent_id) : null
  let homeFeatureImageUrl = null
  let homeFeatureOrder = 0
  let homeFeatureGroup = 'none'

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' })
  }

  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return res.status(400).json({ error: 'parent_id must be a positive integer or null' })
  }

  try {
    homeFeatureImageUrl = parseFeatureImageUrl(req.body?.home_feature_image_url, null)
    homeFeatureOrder = parseFeatureOrder(req.body?.home_feature_order, 0)
    homeFeatureGroup = parseFeatureGroup(req.body?.home_feature_group, 'none')
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    if (parentId) {
      const parent = await getCategoryById(connection, parentId)
      if (!parent) {
        await connection.rollback()
        return res.status(404).json({ error: 'Parent category not found' })
      }
    }

    const [[nextSortOrderRow]] = await connection.execute(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
       FROM categories
       WHERE parent_id <=> ?`,
      [parentId]
    )
    const nextSortOrder = Number(nextSortOrderRow?.next_sort_order || 1)

    await connection.execute(
      `INSERT INTO categories (
         parent_id, name, slug, path, level, sort_order,
         home_feature_image_url, home_feature_order, home_feature_group
       )
       VALUES (?, ?, '', '', 0, ?, ?, ?, ?)`,
      [parentId, name, nextSortOrder, homeFeatureImageUrl, homeFeatureOrder, homeFeatureGroup]
    )

    await rebuildCategoryMetadata(connection)
    await connection.commit()

    const tree = await getCategoryTree(connection)
    return res.status(201).json({ message: 'Category created', data: tree })
  } catch (error) {
    await connection.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool
  const categoryId = Number(req.params.id)
  const name = sanitizeCategoryName(req.body?.name)
  const hasParent = Object.prototype.hasOwnProperty.call(req.body || {}, 'parent_id')
  const hasHomeFeatureImageUrl = Object.prototype.hasOwnProperty.call(req.body || {}, 'home_feature_image_url')
  const hasHomeFeatureOrder = Object.prototype.hasOwnProperty.call(req.body || {}, 'home_feature_order')
  const hasHomeFeatureGroup = Object.prototype.hasOwnProperty.call(req.body || {}, 'home_feature_group')
  const parentId = hasParent && req.body.parent_id !== null && req.body.parent_id !== ''
    ? Number(req.body.parent_id)
    : null

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' })
  }

  if (hasParent && parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return res.status(400).json({ error: 'parent_id must be a positive integer or null' })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const existing = await getCategoryById(connection, categoryId)
    if (!existing) {
      await connection.rollback()
      return res.status(404).json({ error: 'Category not found' })
    }

    let nextParentId = hasParent ? parentId : existing.parent_id
    if (nextParentId === categoryId) {
      await connection.rollback()
      return res.status(400).json({ error: 'A category cannot be its own parent' })
    }

    if (nextParentId) {
      const parent = await getCategoryById(connection, nextParentId)
      if (!parent) {
        await connection.rollback()
        return res.status(404).json({ error: 'Parent category not found' })
      }

      const descendants = await getDescendantCategoryIds(connection, categoryId)
      if (descendants.includes(nextParentId)) {
        await connection.rollback()
        return res.status(400).json({ error: 'Cannot move category under one of its descendants' })
      }
    }

    const nextName = name || existing.name
    const parentChanged = hasParent && nextParentId !== existing.parent_id
    let nextHomeFeatureImageUrl = existing.home_feature_image_url || null
    let nextHomeFeatureOrder = Number(existing.home_feature_order || 0)
    let nextHomeFeatureGroup = existing.home_feature_group || 'none'
    let nextSortOrder = Number(existing.sort_order || 0)

    try {
      if (hasHomeFeatureImageUrl) {
        nextHomeFeatureImageUrl = parseFeatureImageUrl(req.body?.home_feature_image_url, nextHomeFeatureImageUrl)
      }

      if (hasHomeFeatureOrder) {
        nextHomeFeatureOrder = parseFeatureOrder(req.body?.home_feature_order, nextHomeFeatureOrder)
      }

      if (hasHomeFeatureGroup) {
        nextHomeFeatureGroup = parseFeatureGroup(req.body?.home_feature_group, nextHomeFeatureGroup)
      }
    } catch (error) {
      await connection.rollback()
      return res.status(400).json({ error: error.message })
    }

    if (parentChanged) {
      const [[nextSortOrderRow]] = await connection.execute(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
         FROM categories
         WHERE parent_id <=> ?
           AND category_id <> ?`,
        [nextParentId, categoryId]
      )
      nextSortOrder = Number(nextSortOrderRow?.next_sort_order || 1)
    }

    await connection.execute(
      `UPDATE categories
       SET name = ?,
           parent_id = ?,
           sort_order = ?,
           home_feature_image_url = ?,
           home_feature_order = ?,
           home_feature_group = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE category_id = ?`,
      [
        nextName,
        nextParentId,
        nextSortOrder,
        nextHomeFeatureImageUrl,
        nextHomeFeatureOrder,
        nextHomeFeatureGroup,
        categoryId,
      ]
    )

    await rebuildCategoryMetadata(connection)
    await connection.commit()

    const tree = await getCategoryTree(connection)
    return res.json({ message: 'Category updated', data: tree })
  } catch (error) {
    await connection.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/:id/move-up', async (req, res) => {
  const pool = req.app.locals.pool
  const categoryId = Number(req.params.id)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const result = await reorderSiblingCategory(connection, categoryId, 'up')
    if (result.status !== 200) {
      await connection.rollback()
      return res.status(result.status).json(result.body)
    }

    await connection.commit()

    const tree = await getCategoryTree(connection)
    return res.json({ ...result.body, data: tree })
  } catch (error) {
    await connection.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

router.post('/:id/move-down', async (req, res) => {
  const pool = req.app.locals.pool
  const categoryId = Number(req.params.id)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const result = await reorderSiblingCategory(connection, categoryId, 'down')
    if (result.status !== 200) {
      await connection.rollback()
      return res.status(result.status).json(result.body)
    }

    await connection.commit()

    const tree = await getCategoryTree(connection)
    return res.json({ ...result.body, data: tree })
  } catch (error) {
    await connection.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool
  const categoryId = Number(req.params.id)

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({ error: 'Invalid category id' })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const existing = await getCategoryById(connection, categoryId)
    if (!existing) {
      await connection.rollback()
      return res.status(404).json({ error: 'Category not found' })
    }

    const [[childCount]] = await connection.execute(
      'SELECT COUNT(*) AS total FROM categories WHERE parent_id = ?',
      [categoryId]
    )

    if (Number(childCount.total) > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Cannot delete category with child categories' })
    }

    const [[productCount]] = await connection.execute(
      'SELECT COUNT(*) AS total FROM products WHERE category_id = ?',
      [categoryId]
    )

    if (Number(productCount.total) > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'Cannot delete category assigned to products' })
    }

    await connection.execute('DELETE FROM categories WHERE category_id = ?', [categoryId])
    await rebuildCategoryMetadata(connection)
    await connection.commit()

    const tree = await getCategoryTree(connection)
    return res.json({ message: 'Category deleted', data: tree })
  } catch (error) {
    await connection.rollback()
    return res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

module.exports = router
