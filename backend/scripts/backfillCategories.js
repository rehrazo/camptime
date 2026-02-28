const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')
const { ensureCategoryPath } = require('../utils/categories')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

async function backfillCategories() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  })

  try {
    const [rows] = await connection.execute(
      `SELECT product_id, category
       FROM products
       WHERE category IS NOT NULL AND TRIM(category) <> ''
       ORDER BY product_id ASC`
    )

    let updated = 0

    for (const row of rows) {
      const ensured = await ensureCategoryPath(connection, row.category)
      if (!ensured.categoryId) {
        continue
      }

      await connection.execute(
        `UPDATE products
         SET category_id = ?, category = ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ?`,
        [ensured.categoryId, ensured.categoryPath, row.product_id]
      )

      updated += 1
      if (updated % 100 === 0) {
        console.log(`Updated ${updated}/${rows.length} products...`)
      }
    }

    console.log(`Category backfill complete. Updated ${updated} products.`)
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  backfillCategories().catch((error) => {
    console.error(`Category backfill failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  backfillCategories,
}
