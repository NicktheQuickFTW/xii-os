const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');
connectDB();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to XII OS - Big 12 Conference Operating System' });
});

// Module Routes
// app.use('/api/athletic-competition', require('./modules/athletic-competition/routes'));
// app.use('/api/weather-intelligence', require('./modules/weather-intelligence/routes'));
// app.use('/api/partnerships-optimization', require('./modules/partnerships-optimization/routes'));
// app.use('/api/performance-analytics', require('./modules/performance-analytics/routes'));

// Transfer Portal Module Routes
const transferPortal = require('./modules/transfer-portal');
app.use('/api/transfer-portal/players', transferPortal.routes.players);
app.use('/api/transfer-portal/nil-valuations', transferPortal.routes.nilValuations);

// app.use('/api/content-management', require('./modules/content-management/routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`XII OS server running on port ${PORT}`);
});

module.exports = app; 