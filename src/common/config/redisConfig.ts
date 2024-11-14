import { Redis } from "ioredis";

let redisClient: Redis | null = null;

if (!redisClient) {
  redisClient = new Redis({
    host: "127.0.0.1",
    port: 6379,
    name: "simplechat",
    lazyConnect: true
  });

  redisClient.connect()
    .then(async () => {
      console.info("Redis client connected");

      await redisClient?.config('SET', 'maxmemory', '100mb');
      await redisClient?.config('SET', 'maxmemory-policy', 'noeviction');
    })
    .catch((err) => {
      console.error("Error occurred during Redis connection: ", err?.message);
    });
}

export default redisClient as Redis;
