import { Redis } from "ioredis";

let redisClient: Redis | null = null;

// Initialize the Redis client only if it hasn't been initialized yet
if (!redisClient) {
  redisClient = new Redis({
    host: "127.0.0.1", // 0.0.0.0 is typically used for binding, not for connecting
    port: 6379,
    name: "simplechat",
    lazyConnect: true
  });

  // Set configurations after the client has connected
  redisClient.connect()
    .then(async () => {
      console.log("Redis client connected");

      await redisClient?.config('SET', 'maxmemory', '100mb');
      await redisClient?.config('SET', 'maxmemory-policy', 'allkeys-lru');
    })
    .catch((err) => {
      console.log("Error occurred during Redis connection: ", err?.message);
    });
}

// Export the Redis client instance directly
export default redisClient as Redis;
