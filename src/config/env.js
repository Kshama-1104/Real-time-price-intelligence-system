require('dotenv').config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  corsOrigins: toList(process.env.CORS_ORIGIN, [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001'
  ]),
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: toNumber(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME || 'price_intelligence',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    poolSize: toNumber(process.env.DB_POOL_SIZE, 10)
  },
  redis: {
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || '',
    ttlSeconds: toNumber(process.env.REDIS_TTL_SECONDS, 45)
  },
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 1000)
  }
};
