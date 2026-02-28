const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')
const { ensureCategoryPath } = require('../utils/categories')
const { normalizeProductCategory } = require('../utils/categoryRules')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

function parseCliArgs(argv) {
  const args = argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    limit: Number.isInteger(Number(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1]))
      ? Number(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1])
      : null,
  }
}

async function reassignProductCategories(options = {}) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  })

  try {
    const limitClause = Number.isInteger(options.limit) && options.limit > 0 ? `LIMIT ${options.limit}` : ''

    const [rows] = await connection.execute(
      `SELECT product_id, name, category, description, html_description, brand, category_id
       FROM products
       ORDER BY product_id ASC
       ${limitClause}`
    )

    let scanned = 0
    let changed = 0
    const preview = []

    for (const row of rows) {
      scanned += 1

      const normalizedCategory = normalizeProductCategory({
        category: row.category,
        name: row.name,
        description: row.description,
        html_description: row.html_description,
        brand: row.brand,
      })

      const ensured = await ensureCategoryPath(connection, normalizedCategory)
      if (!ensured.categoryId) {
        continue
      }

      const needsUpdate =
        Number(row.category_id || 0) !== Number(ensured.categoryId || 0) ||
        String(row.category || '') !== String(ensured.categoryPath || '')

      if (!needsUpdate) {
        continue
      }

      changed += 1

      if (preview.length < 20) {
        preview.push({
          product_id: row.product_id,
          name: row.name,
          from: row.category,
          to: ensured.categoryPath,
        })
      }

      if (!options.dryRun) {
        await connection.execute(
          `UPDATE products
           SET category_id = ?, category = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [ensured.categoryId, ensured.categoryPath, row.product_id]
        )
      }

      if (changed % 100 === 0) {
        console.log(`${options.dryRun ? 'Would update' : 'Updated'} ${changed} products...`)
      }
    }

    const summary = {
      mode: options.dryRun ? 'dry-run' : 'write',
      scanned,
      changed,
      preview,
    }

    console.log(JSON.stringify(summary, null, 2))
    return summary
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  const options = parseCliArgs(process.argv)

  reassignProductCategories(options).catch((error) => {
    console.error(`Category reassign failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  reassignProductCategories,
}
