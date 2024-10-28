
// db_reset.js

import dotenv from 'dotenv'

dotenv.config()
import pg from 'pg'
// Define your database configuration
const configs = {
  user: process.env.PGUSER,     // Database username
  host: 'localhost',         // Database host
  password: process.env.PGPASSWORD, // Database password
  port: 5432,                // Database port
};

// Name of the database to drop and recreate
const databaseName = 'simplechat';

// Function to drop and recreate the database
async function resetDatabase() {
  const client = new pg.Client({ ...configs, database: 'postgres' }); // Connect to 'postgres' default DB

  try {
    await client.connect(); // Connect to the database

    // Drop the database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${databaseName};`);

    // Recreate the database
    await client.query(`CREATE DATABASE ${databaseName};`);

  } catch (err) {
    console.error('Error executing database reset:', err);
  } finally {
    await client.end(); // Close the connection
  }
}

// Execute the function to reset the database
resetDatabase();
