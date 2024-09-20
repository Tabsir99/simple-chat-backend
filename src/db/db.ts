import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || "5432", 10),
});

pool
  .connect()
  .then(() => {
    console.log("database connected");
  })
  .catch(() => console.log("Error occured!"));

export default pool;
