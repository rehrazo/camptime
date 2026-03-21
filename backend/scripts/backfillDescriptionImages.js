const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const path = require('path')
const {
  extractImageUrlsFromHtml,
  stripImageTagsFromHtml,
  normalizeImagesForStorage,
} = require('../utils/descriptionImages')

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

function sameImageSequence(a = [], b = []) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i]?.image_url || '').trim() !== String(b[i]?.image_url || '').trim()) {
      return false
    }
  }

  return true
}

async function writeProductImages(connection, productId, images = []) {
  await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId])

  if (!images.length) {
    return
  }

  const placeholders = images.map(() => '(?, ?, ?, ?)').join(', ')
  const values = []

  images.forEach((row) => {
    values.push(productId, row.image_url, row.image_order, row.is_additional ? 1 : 0)
  })

  await connection.execute(
    `INSERT INTO product_images (product_id, image_url, image_order, is_additional) VALUES ${placeholders}`,
    values
  )
}

async function backfillDescriptionImages(options = {}) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'razowild_db',
  })

  try {
    const limitClause = Number.isInteger(options.limit) && options.limit > 0 ? `LIMIT ${options.limit}` : ''
    const [products] = await connection.execute(
      `SELECT product_id, name, html_description
       FROM products
       WHERE html_description IS NOT NULL AND html_description LIKE '%<img%'
       ORDER BY product_id ASC
       ${limitClause}`
    )

    let scanned = 0
    let changed = 0
    let movedImages = 0
    const preview = []

    for (const product of products) {
      scanned += 1

      const html = String(product.html_description || '')
      const extracted = extractImageUrlsFromHtml(html)
      if (!extracted.length) {
        continue
      }

      const cleanedHtml = stripImageTagsFromHtml(html)
      const [existingImages] = await connection.execute(
        `SELECT image_url, image_order, is_additional
         FROM product_images
         WHERE product_id = ?
         ORDER BY COALESCE(image_order, 2147483647), image_id ASC`,
        [product.product_id]
      )

      const normalizedImages = normalizeImagesForStorage(existingImages, extracted)

      const htmlChanged = (cleanedHtml || null) !== (product.html_description || null)
      const imagesChanged = !sameImageSequence(existingImages, normalizedImages)

      if (!htmlChanged && !imagesChanged) {
        continue
      }

      changed += 1
      movedImages += extracted.length

      if (preview.length < 25) {
        preview.push({
          product_id: product.product_id,
          name: product.name,
          extracted_images: extracted.length,
          existing_images: existingImages.length,
          final_images: normalizedImages.length,
        })
      }

      if (!options.dryRun) {
        await connection.beginTransaction()
        try {
          await connection.execute(
            `UPDATE products
             SET html_description = ?, updated_at = CURRENT_TIMESTAMP
             WHERE product_id = ?`,
            [cleanedHtml, product.product_id]
          )

          await writeProductImages(connection, product.product_id, normalizedImages)
          await connection.commit()
        } catch (error) {
          await connection.rollback()
          throw error
        }
      }

      if (changed % 100 === 0) {
        console.log(`${options.dryRun ? 'Would update' : 'Updated'} ${changed} products...`)
      }
    }

    const result = {
      mode: options.dryRun ? 'dry-run' : 'write',
      scanned,
      changed,
      movedImages,
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
  backfillDescriptionImages(options).catch((error) => {
    console.error(`Description image backfill failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  backfillDescriptionImages,
}
