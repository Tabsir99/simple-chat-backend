import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv'
dotenv.config()
import pg from 'pg'

const client = new pg.Client({
  user: 'tabsir2',
  host: 'localhost',
  database: 'simplechat',
  password: 'localpostgres',
  port: 5432,
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../../common/migrations');

// // PostgreSQL client setup


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




// import { v4 as uuidv4 } from 'uuid';
// import {LoremIpsum} from "lorem-ipsum"

// // Initialize Lorem Ipsum generator
// const lorem = new LoremIpsum({
//   sentencesPerParagraph: { max: 1, min: 1 },
//   wordsPerSentence: { max: 25, min: 15 }
// });



// // Chat room ID and user IDs for the messages
// const chatRoomId = 'a6f1c152-6a64-4522-9acf-eb5496e0c37e';
// const userIds = [
//   '9ab3689f-6788-4209-94cc-e078d948ae2b',
//   '84257c89-a864-4f3c-862e-99c9b1c82429'
// ];

// // Function to insert a single message into the database
// async function insertMessage() {
//   const messageId = uuidv4();
//   const senderId = userIds[Math.floor(Math.random() * userIds.length)];
//   const content = lorem.generateSentences(1);

//   const query = `
//     INSERT INTO "Message" (
//       "messageId",
//       "chatRoomId",
//       "senderId",
//       "content",
//       "createdAt"
//     ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP(3))
//     RETURNING *;
//   `;
//   const values = [messageId, chatRoomId, senderId, content];

//   try {
//     const res = await client.query(query, values);
//     console.log('Message added:', res.rows[0]);
//   } catch (error) {
//     console.error('Error inserting message:', error);
//   }
// }

// // Function to add multiple messages
// async function addMessages(count) {
//   await client.connect();
//   for (let i = 0; i < count; i++) {
//     await new Promise(res => setTimeout(res,100))
//     await insertMessage();
//   }

//   await client.end();
//   console.log(`${count} messages added successfully.`);
// }

// // Run the script to add 5 messages
// addMessages(300).catch(console.error);
