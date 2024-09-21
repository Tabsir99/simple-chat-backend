import pkg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'

dotenv.config()

const Client = pkg.Client;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  await client.connect();

  const migrationFiles = fs.readdirSync(path.join(__dirname, '../src/db/migrations')).sort();

  try {
    // Start a transaction
    await client.query('BEGIN');

    for (const migrationFile of migrationFiles) {
      const sql = fs.readFileSync(path.join(__dirname, '../src/db/migrations', migrationFile), 'utf8');
      
      const res = await client.query('SELECT * FROM migrations WHERE migration_file = $1', [migrationFile]);
      if (res.rows.length === 0) {
        await client.query(sql);
        await client.query('INSERT INTO migrations (migration_file) VALUES ($1)', [migrationFile]);
        console.log(`Migration ${migrationFile} ran successfully.`);
      } else {
        console.log(`Migration ${migrationFile} already applied.`);
      }
    }

    // Commit the transaction
    await client.query('COMMIT');
  } catch (err) {
    // Rollback the transaction on error
    console.error(`Error running migrations:`, err);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
};


// Rollback function
const rollbackMigration = async (migrationFile) => {
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  });

  await client.connect();

  try {
    const sql = fs.readFileSync(path.join(__dirname, '../src/db/migrations', migrationFile), 'utf8');
    await client.query(sql);
    await client.query('DELETE FROM migrations WHERE migration_file = $1', [migrationFile]);
    console.log(`Rolled back migration ${migrationFile} successfully.`);
  } catch (err) {
    console.error(`Error rolling back migration ${migrationFile}:`, err);
  } finally {
    await client.end();
  }
};

// Example usage
runMigrations();
// rollbackMigration('20230920_create_users_table.sql'); // Call this function to rollback
