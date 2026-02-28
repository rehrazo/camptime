const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')
const { cleanDescriptionForStorage } = require('../utils/descriptionCleaner')
const { generateBriefDescription } = require('../utils/briefDescription')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

function parseCliArgs(argv) {
  const args = argv.slice(2)
  const limitToken = args.find((arg) => arg.startsWith('--limit='))
  const limit = Number.isInteger(Number(limitToken?.split('=')[1]))
    ? Number(limitToken.split('=')[1])
    : null

  return {
    dryRun: args.includes('--dry-run'),
    limit,
  }
}

async function ensureLongDescriptionColumn(connection) {
  const [columns] = await connection.execute(`SHOW COLUMNS FROM products LIKE 'long_description'`)
  if (!columns.length) {
    await connection.execute(`ALTER TABLE products ADD COLUMN long_description LONGTEXT NULL AFTER html_description`)
  }
}

async function backfillLongDescriptions(options = {}) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  })

  try {
    await ensureLongDescriptionColumn(connection)

    const limitClause = Number.isInteger(options.limit) && options.limit > 0 ? `LIMIT ${options.limit}` : ''

    const [rows] = await connection.execute(
      `SELECT product_id, name, description, html_description, long_description, brief_description
       FROM products
       ORDER BY product_id ASC
       ${limitClause}`
    )

    let scanned = 0
    let changed = 0
    const preview = []

    for (const row of rows) {
      scanned += 1

      const currentLong = String(row.long_description || '').trim()
      const computedLong = cleanDescriptionForStorage({
        description: currentLong || row.description,
        htmlDescription: row.html_description,
        name: row.name,
        maxChars: 4000,
      })

      if (!computedLong) {
        continue
      }

      const computedShort = cleanDescriptionForStorage({
        description: computedLong,
        htmlDescription: null,
        name: row.name,
        maxChars: 750,
      })

      const computedBrief = generateBriefDescription({
        description: computedShort,
        htmlDescription: null,
        name: row.name,
      })

      const currentShort = String(row.description || '').trim()
      const currentBrief = String(row.brief_description || '').trim()

      const shouldUpdate =
        currentLong !== computedLong ||
        currentShort !== String(computedShort || '').trim() ||
        currentBrief !== String(computedBrief || '').trim()

      if (!shouldUpdate) {
        continue
      }

      changed += 1

      if (preview.length < 20) {
        preview.push({
          product_id: row.product_id,
          name: row.name,
          long_before: currentLong.slice(0, 120),
          long_after: computedLong.slice(0, 120),
        })
      }

      if (!options.dryRun) {
        await connection.execute(
          `UPDATE products
           SET long_description = ?, description = ?, brief_description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [computedLong, computedShort, computedBrief, row.product_id]
        )
      }

      if (changed % 100 === 0) {
        console.log(`${options.dryRun ? 'Would update' : 'Updated'} ${changed} products...`)
      }
    }

    const result = {
      mode: options.dryRun ? 'dry-run' : 'write',
      scanned,
      changed,
      preview,
    }

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  const options = parseCliArgs(process.argv)
  backfillLongDescriptions(options).catch((error) => {
    console.error(`Long description backfill failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  backfillLongDescriptions,
}
