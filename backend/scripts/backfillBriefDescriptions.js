const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')
const { generateBriefDescription } = require('../utils/briefDescription')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

async function ensureBriefDescriptionColumn(connection, databaseName) {
  const [columns] = await connection.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'brief_description'`,
    [databaseName]
  )

  if (columns.length) {
    return false
  }

  await connection.execute(
    `ALTER TABLE products
     ADD COLUMN brief_description VARCHAR(320) NULL
     AFTER html_description`
  )

  return true
}

async function backfillBriefDescriptions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  })

  try {
    const columnAdded = await ensureBriefDescriptionColumn(connection, process.env.DB_NAME || 'camptime')

    const [rows] = await connection.execute(
      `SELECT product_id, name, description, html_description, brief_description
       FROM products
       ORDER BY product_id ASC`
    )

    let updated = 0

    for (const row of rows) {
      const generated = generateBriefDescription({
        name: row.name,
        description: row.description,
        htmlDescription: row.html_description,
      })

      if (!generated) {
        continue
      }

      const current = String(row.brief_description || '').trim()
      if (current === generated) {
        continue
      }

      await connection.execute(
        `UPDATE products
         SET brief_description = ?, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = ?`,
        [generated, row.product_id]
      )

      updated += 1
      if (updated % 100 === 0) {
        console.log(`Updated ${updated}/${rows.length} brief descriptions...`)
      }
    }

    console.log(
      JSON.stringify(
        {
          columnAdded,
          scanned: rows.length,
          updated,
        },
        null,
        2
      )
    )
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  backfillBriefDescriptions().catch((error) => {
    console.error(`Brief description backfill failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  backfillBriefDescriptions,
}
