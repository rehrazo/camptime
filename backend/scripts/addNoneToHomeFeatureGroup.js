/**
 * Migration: Add 'none' option to home_feature_group ENUM and backfill rows where
 * is_home_featured = 0 to home_feature_group = 'none' (if that legacy column still exists).
 *
 * Run: node scripts/addNoneToHomeFeatureGroup.js
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
    // Widen the ENUM to include 'none' and change default to 'none'
    console.log("Modifying home_feature_group ENUM to ('featured', 'recommended', 'none') DEFAULT 'none'...")
    await connection.execute(`
      ALTER TABLE categories
      MODIFY COLUMN home_feature_group ENUM('featured', 'recommended', 'none') NOT NULL DEFAULT 'none'
    `)
    console.log('Column modified.')

    const [[columnCheck]] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'categories'
         AND column_name = 'is_home_featured'`
    )

    if (Number(columnCheck.total) > 0) {
      // Backfill legacy rows while the old bit flag still exists.
      const [result] = await connection.execute(`
        UPDATE categories
        SET home_feature_group = 'none'
        WHERE is_home_featured = 0 AND home_feature_group != 'none'
      `)
      console.log(`Backfilled ${result.affectedRows} row(s) with home_feature_group = 'none'.`)
    } else {
      console.log('Skipped backfill: is_home_featured column no longer exists.')
    }

    console.log('Migration complete.')
  } finally {
    await connection.end()
  }
})().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
