/**
 * Migration: Drop deprecated categories.is_home_featured column.
 *
 * Run: node scripts/dropIsHomeFeaturedColumn.js
 */
const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'razowild_db',
}

;(async () => {
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [[columnCheck]] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'categories'
         AND column_name = 'is_home_featured'`
    )

    if (Number(columnCheck.total) === 0) {
      console.log('Column is_home_featured does not exist. Nothing to do.')
      return
    }

    console.log('Dropping categories.is_home_featured...')
    await connection.execute('ALTER TABLE categories DROP COLUMN is_home_featured')
    console.log('Column dropped.')
  } finally {
    await connection.end()
  }
})().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
