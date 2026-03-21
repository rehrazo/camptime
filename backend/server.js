const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { importProducts } = require('./importProducts');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const { requireAdminAuthIfConfigured } = require('./middleware/adminAuth');

dotenv.config();

const app = express();

function enforceStartupSecurityConfig() {
  const nodeEnv = String(process.env.NODE_ENV || 'development').toLowerCase();
  const adminToken = String(process.env.ADMIN_API_TOKEN || '').trim();
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();

  console.log(`[security] CORS allowed origins: ${corsAllowedOrigins.join(', ') || '(none configured)'}`);

  if (adminToken || jwtSecret) {
    console.log('[security] Admin write protection is enabled via ADMIN_API_TOKEN and/or JWT_SECRET.');
    return;
  }

  const message = '[security] ADMIN_API_TOKEN and JWT_SECRET are not set. Admin write routes will return 500 until configured.';

  if (nodeEnv === 'production') {
    console.error(`${message} Refusing to start in production.`);
    process.exit(1);
    return;
  }

  console.warn(message);
}

const corsAllowedOrigins = String(process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nodeEnv = String(process.env.NODE_ENV || 'development').toLowerCase();

function isLocalDevelopmentOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch (_error) {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (nodeEnv !== 'production' && isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed for this origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
};

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getPublicBaseUrl(req) {
  const fromEnv = String(process.env.PUBLIC_SITE_URL || '').trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host');

  return `${protocol}://${host}`.replace(/\/+$/, '');
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/api/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, safeName);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype.includes('csv') || file.originalname.toLowerCase().endsWith('.csv');
    cb(isCsv ? null : new Error('Only CSV files are allowed'), isCsv);
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'razowild_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.pool = pool;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Razo Wild Backend API', version: '1.0.0', health: '/api/health' });
});

app.get('/api/health', async (req, res) => {
  const adminApiTokenConfigured = Boolean(String(process.env.ADMIN_API_TOKEN || '').trim());
  const jwtSecretConfigured = Boolean(String(process.env.JWT_SECRET || '').trim());
  const adminEmailsConfigured = Boolean(String(process.env.ADMIN_EMAILS || '').trim());
  const adminAuthConfigured = adminApiTokenConfigured || jwtSecretConfigured;
  const stripeConfigured = Boolean(String(process.env.STRIPE_SECRET_KEY || '').trim());

  let databaseConnected = false;
  let productsRouteReady = false;
  let categoriesRouteReady = false;
  let dbError = null;

  try {
    await pool.query('SELECT 1');
    databaseConnected = true;

    const [[productsCountRow]] = await pool.execute('SELECT COUNT(*) AS total FROM products');
    productsRouteReady = Number.isFinite(Number(productsCountRow?.total));

    const [[categoriesCountRow]] = await pool.execute('SELECT COUNT(*) AS total FROM categories');
    categoriesRouteReady = Number.isFinite(Number(categoriesCountRow?.total));
  } catch (error) {
    dbError = error.message || 'Database check failed';
  }

  const checks = {
    adminAuthConfigured,
    adminApiTokenConfigured,
    jwtSecretConfigured,
    adminEmailsConfigured,
    corsAllowedOrigins,
    databaseConnected,
    stripeConfigured,
    productsRouteReady,
    categoriesRouteReady,
  };

  const allHealthy = Object.entries(checks)
    .filter(([key]) => key !== 'corsAllowedOrigins')
    .every(([, value]) => value === true);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    checks,
    error: dbError,
  });
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api',
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ];

  res.type('text/plain').send(lines.join('\n'));
});

app.get('/sitemap.xml', async (req, res) => {
  const baseUrl = getPublicBaseUrl(req);
  const staticPaths = [
    '/',
    '/products',
    '/shipping-returns',
    '/privacy-policy',
    '/terms-conditions',
  ];

  try {
    const [productRows] = await pool.execute(
      `SELECT product_id, updated_at
       FROM products
       ORDER BY product_id ASC`
    );

    const urls = [];

    staticPaths.forEach((pathValue) => {
      urls.push({
        loc: `${baseUrl}${pathValue}`,
        changefreq: pathValue === '/' ? 'daily' : 'weekly',
        priority: pathValue === '/' ? '1.0' : '0.7',
        lastmod: null,
      });
    });

    productRows.forEach((row) => {
      urls.push({
        loc: `${baseUrl}/products/${row.product_id}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      });
    });

    const urlXml = urls
      .map((url) => {
        const lastmod = url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : '';
        return `<url><loc>${escapeXml(url.loc)}</loc>${lastmod}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlXml}</urlset>`;

    res.type('application/xml').send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to generate sitemap' });
  }
});

app.post('/api/admin/import-products', requireAdminAuthIfConfigured, upload.single('csvFile'), async (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({ error: 'CSV file is required (field name: csvFile)' });
  }

  const dryRun = String(req.body.dryRun || 'false').toLowerCase() === 'true';
  const parsedLimit = Number(req.body.limit);
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;

  try {
    const result = await importProducts(uploadedFile.path, { dryRun, limit });
    return res.json({
      message: dryRun ? 'Dry run completed' : 'Import completed',
      result
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Import failed' });
  } finally {
    if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) {
      fs.unlinkSync(uploadedFile.path);
    }
  }
});

// Import routes (to be created)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', requireAdminAuthIfConfigured, productsRouter);
app.use('/api/categories', requireAdminAuthIfConfigured, categoriesRouter);
// app.use('/api/cart', require('./routes/cart')); 
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  const isJsonParseError = err instanceof SyntaxError && err.status === 400 && 'body' in err;
  if (isJsonParseError) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }

  if (err.status && err.message) {
    return res.status(err.status).json({ error: err.message });
  }

  return res.status(500).json({ error: err.message || 'Unexpected server error' });
});

const PORT = process.env.PORT || 5000;

enforceStartupSecurityConfig();

app.listen(PORT, () => {
  console.log(`Razo Wild Backend Server running on port ${PORT}`);
});