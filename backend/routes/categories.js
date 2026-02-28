const express = require('express')
const {
  sanitizeCategoryName,
  getCategoryById,
  getDescendantCategoryIds,
  getAllCategories,
  getCategoryTree,
  rebuildCategoryMetadata,
} = require('../utils/categories')

const router = express.Router()

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

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool
  const name = sanitizeCategoryName(req.body?.name)
  const parentId = req.body?.parent_id ? Number(req.body.parent_id) : null

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' })
  }

  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return res.status(400).json({ error: 'parent_id must be a positive integer or null' })
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

    await connection.execute(
      `INSERT INTO categories (parent_id, name, slug, path, level)
       VALUES (?, ?, '', '', 0)`,
      [parentId, name]
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

    await connection.execute(
      `UPDATE categories
       SET name = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE category_id = ?`,
      [nextName, nextParentId, categoryId]
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
