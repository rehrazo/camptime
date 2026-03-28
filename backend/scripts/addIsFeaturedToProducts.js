const path = require('path')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'razowild_db',
  })

  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'products'
         AND column_name = 'is_featured'`
    )

    if (Number(rows?.[0]?.total || 0) > 0) {
      console.log('products.is_featured already exists. Nothing to do.')
      return
    }

    await connection.execute(
      `ALTER TABLE products
       ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE
       AFTER category_id`
    )

    console.log('Added products.is_featured column.')
  } finally {
    await connection.end()
  }
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
