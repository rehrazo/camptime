const path = require('path')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

async function ensureColumn(connection, columnName, alterSql) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'categories'
       AND column_name = ?`,
    [columnName]
  )

  if (Number(rows?.[0]?.total || 0) > 0) {
    console.log(`${columnName} column already exists.`)
    return
  }

  await connection.execute(alterSql)
  console.log(`Added ${columnName} column.`)
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'razowild_db',
  })

  try {
    await ensureColumn(
      connection,
      'home_feature_image_url',
      `ALTER TABLE categories
       ADD COLUMN home_feature_image_url VARCHAR(500) NULL AFTER level`
    )

    await ensureColumn(
      connection,
      'home_feature_order',
      `ALTER TABLE categories
       ADD COLUMN home_feature_order INT NOT NULL DEFAULT 0 AFTER home_feature_image_url`
    )

    await ensureColumn(
      connection,
      'home_feature_group',
      `ALTER TABLE categories
       ADD COLUMN home_feature_group ENUM('featured', 'recommended', 'none') NOT NULL DEFAULT 'none' AFTER home_feature_order`
    )

    console.log('Category home UI fields migration complete.')
  } finally {
    await connection.end()
  }
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
