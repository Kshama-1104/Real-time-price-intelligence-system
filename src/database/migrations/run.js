const fs = require('fs');
const path = require('path');
const db = require('../pool');
const logger = require('../../core/logger');

const run = async () => {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    logger.info(`Running migration ${file}`);
    await db.query(sql);
  }

  await db.close();
  logger.info('Database migrations completed');
};

run().catch(async (error) => {
  logger.error('Database migration failed', error);
  await db.close();
  process.exit(1);
});
