function sanitizeCategoryName(value) {
  const text = String(value || '').trim().replace(/\s+/g, ' ')
  return text || null
}

function splitCategoryPath(rawPath) {
  const text = String(rawPath || '').trim()
  if (!text) {
    return []
  }

  return text
    .split(/\s*(?:>|\/|\\|\|)\s*/)
    .map((part) => sanitizeCategoryName(part))
    .filter(Boolean)
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function getCategoryById(connection, categoryId) {
  if (!categoryId) {
    return null
  }

  const [[row]] = await connection.execute(
    'SELECT category_id, parent_id, name, slug, path, level FROM categories WHERE category_id = ? LIMIT 1',
    [categoryId]
  )

  return row || null
}

async function ensureCategoryPath(connection, rawPath) {
  const parts = splitCategoryPath(rawPath)
  if (!parts.length) {
    return { categoryId: null, categoryPath: null }
  }

  let parentId = null
  let lastRow = null
  const pathParts = []

  for (let index = 0; index < parts.length; index += 1) {
    const name = parts[index]
    pathParts.push(name)

    const [existingRows] = await connection.execute(
      'SELECT category_id, parent_id, name, slug, path, level FROM categories WHERE parent_id <=> ? AND name = ? LIMIT 1',
      [parentId, name]
    )

    if (existingRows.length) {
      lastRow = existingRows[0]
      parentId = lastRow.category_id
      continue
    }

    const slug = slugify(name)
    const normalizedPath = pathParts.join(' > ')
    const level = index

    const [insertResult] = await connection.execute(
      `INSERT INTO categories (parent_id, name, slug, path, level)
       VALUES (?, ?, ?, ?, ?)`,
      [parentId, name, slug, normalizedPath, level]
    )

    lastRow = {
      category_id: insertResult.insertId,
      parent_id: parentId,
      name,
      slug,
      path: normalizedPath,
      level,
    }
    parentId = insertResult.insertId
  }

  return {
    categoryId: lastRow?.category_id || null,
    categoryPath: lastRow?.path || parts.join(' > '),
  }
}

async function getDescendantCategoryIds(connection, categoryId) {
  if (!categoryId) {
    return []
  }

  const [rows] = await connection.execute(
    `WITH RECURSIVE category_tree AS (
      SELECT category_id
      FROM categories
      WHERE category_id = ?
      UNION ALL
      SELECT c.category_id
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.category_id
    )
    SELECT category_id FROM category_tree`,
    [categoryId]
  )

  return rows.map((row) => row.category_id)
}

async function getCategoryTree(connection) {
  const [rows] = await connection.execute(
    `SELECT category_id, parent_id, name, slug, path, level
     FROM categories
     ORDER BY level ASC, name ASC`
  )

  const byId = new Map()
  const roots = []

  rows.forEach((row) => {
    byId.set(row.category_id, { ...row, children: [] })
  })

  rows.forEach((row) => {
    const node = byId.get(row.category_id)
    if (!row.parent_id) {
      roots.push(node)
      return
    }

    const parent = byId.get(row.parent_id)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

async function getAllCategories(connection) {
  const [rows] = await connection.execute(
    `SELECT category_id, parent_id, name, slug, path, level
     FROM categories
     ORDER BY level ASC, name ASC`
  )

  return rows
}

async function rebuildCategoryMetadata(connection) {
  const rows = await getAllCategories(connection)
  const byId = new Map()
  const roots = []

  rows.forEach((row) => {
    byId.set(row.category_id, { ...row, children: [] })
  })

  rows.forEach((row) => {
    const node = byId.get(row.category_id)
    const parent = row.parent_id ? byId.get(row.parent_id) : null

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const visited = new Set()
  const updates = []

  const visit = (node, parentPath = '', level = 0) => {
    if (!node || visited.has(node.category_id)) {
      return
    }

    visited.add(node.category_id)
    const path = parentPath ? `${parentPath} > ${node.name}` : node.name
    updates.push({
      category_id: node.category_id,
      path,
      level,
      slug: slugify(node.name),
    })

    node.children.forEach((child) => visit(child, path, level + 1))
  }

  roots.forEach((root) => visit(root, '', 0))

  rows.forEach((row) => {
    if (!visited.has(row.category_id)) {
      updates.push({
        category_id: row.category_id,
        path: row.name,
        level: 0,
        slug: slugify(row.name),
      })
    }
  })

  for (const update of updates) {
    await connection.execute(
      `UPDATE categories
       SET path = ?, level = ?, slug = ?, updated_at = CURRENT_TIMESTAMP
       WHERE category_id = ?`,
      [update.path, update.level, update.slug, update.category_id]
    )
  }
}

module.exports = {
  sanitizeCategoryName,
  slugify,
  splitCategoryPath,
  getCategoryById,
  ensureCategoryPath,
  getDescendantCategoryIds,
  getAllCategories,
  getCategoryTree,
  rebuildCategoryMetadata,
}
