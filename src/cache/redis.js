const Redis = require('ioredis');
const env = require('../config/env');
const logger = require('../core/logger');

let client;
let connected = false;
let lastError = null;

const getClient = () => {
  if (client) {
    return client;
  }

  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false
  };

  client = env.redis.url
    ? new Redis(env.redis.url, options)
    : new Redis({
        ...options,
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined
      });

  client.on('connect', () => {
    connected = true;
    lastError = null;
    logger.info('Redis cache connected');
  });

  client.on('error', (error) => {
    connected = false;
    lastError = error.message;
    logger.warn(`Redis unavailable, continuing without cache: ${error.message}`);
  });

  return client;
};

const connect = async () => {
  try {
    const redis = getClient();
    if (redis.status === 'wait') {
      await redis.connect();
    }
    connected = true;
    return true;
  } catch (error) {
    connected = false;
    lastError = error.message;
    return false;
  }
};

const getJson = async (key) => {
  try {
    await connect();
    if (!connected) {
      return null;
    }
    const payload = await getClient().get(key);
    return payload ? JSON.parse(payload) : null;
  } catch (error) {
    lastError = error.message;
    return null;
  }
};

const setJson = async (key, value, ttlSeconds = env.redis.ttlSeconds) => {
  try {
    await connect();
    if (!connected) {
      return false;
    }
    await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (error) {
    lastError = error.message;
    return false;
  }
};

const deleteByPattern = async (pattern) => {
  try {
    await connect();
    if (!connected) {
      return 0;
    }

    const redis = getClient();
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return redis.del(keys);
  } catch (error) {
    lastError = error.message;
    return 0;
  }
};

const ping = async () => {
  try {
    await connect();
    if (!connected) {
      return false;
    }
    const response = await getClient().ping();
    return response === 'PONG';
  } catch (error) {
    connected = false;
    lastError = error.message;
    return false;
  }
};

const status = () => ({
  connected,
  error: lastError,
  checkedAt: new Date().toISOString()
});

const close = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

module.exports = {
  getJson,
  setJson,
  deleteByPattern,
  ping,
  status,
  close
};
