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
  const maxCharsToken = args.find((arg) => arg.startsWith('--max-chars='))
  const limit = Number.isInteger(Number(limitToken?.split('=')[1]))
    ? Number(limitToken.split('=')[1])
    : null
  const maxChars = Number.isInteger(Number(maxCharsToken?.split('=')[1]))
    ? Number(maxCharsToken.split('=')[1])
    : 900

  return {
    dryRun: args.includes('--dry-run'),
    limit,
    maxChars,
  }
}

async function cleanProductDescriptions(options = {}) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'camptime',
  })

  try {
    const limitClause = Number.isInteger(options.limit) && options.limit > 0 ? `LIMIT ${options.limit}` : ''

    const [rows] = await connection.execute(
      `SELECT product_id, name, description, html_description, brief_description
       FROM products
       ORDER BY product_id ASC
       ${limitClause}`
    )

    let scanned = 0
    let changed = 0
    const preview = []

    for (const row of rows) {
      scanned += 1

      const cleanedDescription = cleanDescriptionForStorage({
        description: row.description,
        htmlDescription: row.html_description,
        name: row.name,
        maxChars: options.maxChars,
      })

      const cleanedBrief = generateBriefDescription({
        description: cleanedDescription,
        htmlDescription: null,
        name: row.name,
      })

      const currentDescription = String(row.description || '').trim()
      const currentBrief = String(row.brief_description || '').trim()

      const shouldUpdate =
        cleanedDescription &&
        (currentDescription !== cleanedDescription || currentBrief !== String(cleanedBrief || '').trim())

      if (!shouldUpdate) {
        continue
      }

      changed += 1

      if (preview.length < 20) {
        preview.push({
          product_id: row.product_id,
          name: row.name,
          before: currentDescription.slice(0, 120),
          after: cleanedDescription.slice(0, 120),
        })
      }

      if (!options.dryRun) {
        await connection.execute(
          `UPDATE products
           SET description = ?, brief_description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [cleanedDescription, cleanedBrief, row.product_id]
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
  cleanProductDescriptions(options).catch((error) => {
    console.error(`Description cleanup failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  cleanProductDescriptions,
}
