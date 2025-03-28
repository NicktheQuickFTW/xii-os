/**
 * Server wrapper with error handling
 * This prevents the server from crashing due to unhandled exceptions
 */

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('\n[UNCAUGHT EXCEPTION] Server kept alive:');
  console.error(err);
  console.error('\n');
  // Keep running despite error
  
  // If this is a port in use error, modify the app.js port
  if (err.code === 'EADDRINUSE') {
    console.log('Port 3000 is in use, let\'s use a different port');
    process.env.PORT = '3001';
    console.log(`Using port ${process.env.PORT} instead`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[UNHANDLED REJECTION] Server kept alive:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('\n');
  // Keep running despite error
});

// Load environment variables
require('dotenv').config();

// Add memory usage monitoring
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
}, 60000); // Log every minute

// Import and run the app
console.log('Starting application with error handling...');
require('./app.js'); 