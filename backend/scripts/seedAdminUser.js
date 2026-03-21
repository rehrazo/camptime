const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false })
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: false })

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function parseArgs(argv) {
  const result = {
    email: '',
    password: '',
    name: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const key = String(argv[index] || '').trim()
    const nextValue = String(argv[index + 1] || '').trim()

    if (!nextValue || nextValue.startsWith('--')) {
      continue
    }

    if (key === '--email') {
      result.email = normalizeEmail(nextValue)
      index += 1
      continue
    }

    if (key === '--password') {
      result.password = nextValue
      index += 1
      continue
    }

    if (key === '--name') {
      result.name = nextValue
      index += 1
    }
  }

  return result
}

function printUsage() {
  console.log('Usage: node scripts/seedAdminUser.js --email admin@example.com --password "StrongPass123!" [--name "Admin User"]')
}

function isEmailInAdminAllowlist(email) {
  const allowlist = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean)

  return allowlist.includes(normalizeEmail(email))
}

async function seedAdminUser(options = {}) {
  const email = normalizeEmail(options.email)
  const password = String(options.password || '').trim()
  const name = String(options.name || 'Admin User').trim()

  if (!email || !password) {
    printUsage()
    throw new Error('Both --email and --password are required')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'razowild_db',
  })

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const [rows] = await connection.execute(
      `SELECT user_id
       FROM users
       WHERE LOWER(email) = ?
       LIMIT 1`,
      [email]
    )

    const existingUser = rows[0]

    if (existingUser) {
      await connection.execute(
        `UPDATE users
         SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [name, passwordHash, existingUser.user_id]
      )

      console.log(`Updated existing admin user for ${email} (user_id: ${existingUser.user_id}).`)
    } else {
      const [insertResult] = await connection.execute(
        `INSERT INTO users (username, email, password_hash)
         VALUES (?, ?, ?)`,
        [name, email, passwordHash]
      )

      console.log(`Created admin user for ${email} (user_id: ${insertResult.insertId}).`)
    }

    if (!isEmailInAdminAllowlist(email)) {
      console.warn(`Warning: ${email} is not in ADMIN_EMAILS. Add it to ADMIN_EMAILS in your .env to allow admin login.`)
    } else {
      console.log(`${email} is present in ADMIN_EMAILS.`)
    }
  } finally {
    await connection.end()
  }
}

if (require.main === module) {
  const options = parseArgs(process.argv.slice(2))

  seedAdminUser(options).catch((error) => {
    console.error(`Admin seed failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  seedAdminUser,
}
