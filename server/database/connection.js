const knex = require('knex');
const config = require('../config/config');
const logger = require('../utils/logger');

const knexConfig = {
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl
  },
  pool: config.database.pool,
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  },
  debug: config.nodeEnv === 'development'
};

const db = knex(knexConfig);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((err) => {
    logger.error('Database connection failed:', err);
    process.exit(1);
  });

// Handle connection errors
db.on('query-error', (error, obj) => {
  logger.error('Database query error:', { error: error.message, query: obj.sql });
});

module.exports = db;