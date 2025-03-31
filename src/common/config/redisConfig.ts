import { Redis } from "ioredis";
import config from "./env";

let redisClient: Redis | null = null;

if (!redisClient) {
  redisClient = new Redis(
    config.env === "development" ? `redis://127.0.0.1:6379` : config.redisUrl
  );
}

export default redisClient as Redis;
