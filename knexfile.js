/**
 * Database configuration for Knex
 */
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'xii_os_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds'
    },
    pool: { min: 0, max: 7 }
  },

  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'xii_os_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds/test'
    },
    pool: { min: 0, max: 7 }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds/production'
    },
    pool: { min: 2, max: 10 },
    ssl: { rejectUnauthorized: false }
  }
}; 