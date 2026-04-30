const { Pool } = require('pg');
const env = require('../config/env');
const logger = require('../core/logger');

let pool;
let lastStatus = {
  connected: false,
  checkedAt: null,
  error: null
};

const getPool = () => {
  if (pool) {
    return pool;
  }

  const config = env.database.url
    ? {
        connectionString: env.database.url,
        ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
        max: env.database.poolSize
      }
    : {
        host: env.database.host,
        port: env.database.port,
        database: env.database.name,
        user: env.database.user,
        password: env.database.password,
        ssl: env.database.ssl ? { rejectUnauthorized: false } : false,
        max: env.database.poolSize
      };

  pool = new Pool(config);

  pool.on('error', (error) => {
    lastStatus = {
      connected: false,
      checkedAt: new Date().toISOString(),
      error: error.message
    };
    logger.error('Unexpected PostgreSQL pool error', error);
  });

  return pool;
};

const query = async (text, params = []) => {
  const activePool = getPool();
  const result = await activePool.query(text, params);
  lastStatus = {
    connected: true,
    checkedAt: new Date().toISOString(),
    error: null
  };
  return result;
};

const ping = async () => {
  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    lastStatus = {
      connected: false,
      checkedAt: new Date().toISOString(),
      error: error.message
    };
    logger.warn(`PostgreSQL unavailable, using in-memory demo data: ${error.message}`);
    return false;
  }
};

const status = () => lastStatus;

const close = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = {
  query,
  ping,
  status,
  close
};
