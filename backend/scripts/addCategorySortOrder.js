require('dotenv').config()

const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'razowild',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

async function ensureSortOrderColumn(connection) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'categories'
       AND COLUMN_NAME = 'sort_order'`
  )

  if (Number(rows[0]?.count || 0) === 0) {
    await connection.execute(
      `ALTER TABLE categories
       ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER level`
    )
  }
}

async function backfillSortOrder(connection) {
  const [rows] = await connection.execute(
    `SELECT category_id, parent_id, name
     FROM categories
     ORDER BY parent_id ASC, name ASC, category_id ASC`
  )

  let currentParentKey = null
  let sortOrder = 0

  for (const row of rows) {
    const parentKey = row.parent_id === null ? 'root' : String(row.parent_id)
    if (parentKey !== currentParentKey) {
      currentParentKey = parentKey
      sortOrder = 1
    } else {
      sortOrder += 1
    }

    await connection.execute(
      `UPDATE categories
       SET sort_order = ?
       WHERE category_id = ?`,
      [sortOrder, row.category_id]
    )
  }
}

async function main() {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    await ensureSortOrderColumn(connection)
    await backfillSortOrder(connection)
    await connection.commit()
    console.log('Category sort order ready.')
  } catch (error) {
    await connection.rollback()
    console.error('Failed to prepare category sort order:', error)
    process.exitCode = 1
  } finally {
    connection.release()
    await pool.end()
  }
}

main()