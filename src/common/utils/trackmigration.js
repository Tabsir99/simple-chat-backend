import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../../common/migrations');

// PostgreSQL client setup

const client = new pg.Client({
  user: 'tabsir2',
  host: 'localhost',
  database: 'simplechat',
  password: 'localpostgres',
  port: 5432,
});

async function trackCustomMigration(filePath) {
  const fileName = path.basename(filePath);
  const fileContent = await fs.readFile(filePath, 'utf8');
  const checksum = crypto.createHash('md5').update(fileContent).digest('hex');
  
  const migrationId = `custom_${fileName}`;

  try {
    // Check if the migration has already been applied
    const result = await client.query(`
      SELECT id FROM _prisma_migrations WHERE id = $1
    `, [migrationId]);

    if (result.rows.length > 0) {
      console.log(`Migration ${fileName} has already been applied. Skipping.`);
      return;
    }

    // Execute the SQL file
    await client.query(fileContent);

    // Record the migration
    await client.query(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      migrationId,
      checksum,
      new Date(),
      fileName,
      null,
      null,
      new Date(),
      1
    ]);

    console.log(`Successfully applied and tracked migration: ${fileName}`);
  } catch (error) {
    console.error(`Error applying migration ${fileName}:`, error);
  }
}

async function runCustomMigrations() {
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter(file => file.endsWith('.sql'));

  for (const file of sqlFiles) {
    await trackCustomMigration(path.join(migrationsDir, file));
  }
}

(async () => {
  try {
    // Connect to the database
    await client.connect();
    
    // Run migrations
    await runCustomMigrations();
  } catch (error) {
    console.error('Error running custom migrations:', error);
    process.exit(1);
  } finally {
    // Disconnect from the database
    await client.end();
  }
})();
