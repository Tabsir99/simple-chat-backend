import pkg from "pg";
import config from "../config/env";

const { Pool } = pkg;

const pool = new Pool({
  user: config.pgUser,
  host: config.pgHost,
  database: config.pgDb,
  password: config.pgPass,
  port: config.pgPort,
});

pool
  .connect()
  .then(() => {
    console.log("database connected");
  })
  .catch(() => console.log("Error occured!"));

export default pool;
