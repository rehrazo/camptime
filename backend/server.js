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

dotenv.config();

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'camptime',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.pool = pool;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Camptime Backend API', version: '1.0.0', health: '/api/health' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.post('/api/admin/import-products', upload.single('csvFile'), async (req, res) => {
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
// app.use('/api/auth', require('./routes/auth')); 
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
// app.use('/api/cart', require('./routes/cart')); 
app.use('/api/orders', ordersRouter);
// app.use('/api/payments', require('./routes/payments'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Camptime Backend Server running on port ${PORT}`);
});