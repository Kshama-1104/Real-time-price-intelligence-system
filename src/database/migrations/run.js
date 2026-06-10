const fs = require('fs');
const path = require('path');
const db = require('../pool');
const logger = require('../../core/logger');

const run = async () => {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const applied = await db.query(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [file]
    );

    if (applied.rowCount > 0) {
      logger.info(`Skipping migration ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    logger.info(`Running migration ${file}`);
    await db.query(sql);
    await db.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [file]
    );
  }

  await db.close();
  logger.info('Database migrations completed');
};

run().catch(async (error) => {
  logger.error('Database migration failed', error);
  await db.close();
  process.exit(1);
});
