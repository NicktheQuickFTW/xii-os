/**
 * Database Configuration
 */

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'xii_os_development',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
      port: process.env.DB_PORT || 5432,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000
    },
    pool: {
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      propagateCreateError: false
    },
    migrations: {
      directory: '../db/migrations'
    },
    seeds: {
      directory: '../db/seeds'
    }
  },
  
  // Additional environments (staging, production, etc.)
} 