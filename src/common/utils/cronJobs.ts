import { Worker, Queue } from "bullmq";

const cleanUpQueue = new Queue("cleanUpQueue");
cleanUpQueue.add(
  "cleanup-tokens",
  { data: "testing" },
  {
    repeat: {
      pattern: "0 3 * * *",
    },
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 24 * 3600 },
  }
);

const cleanUpWorker = new Worker(
  "cleanUpQueue",
  async (job) => {
    try {
      console.log("Processing job:", job.name);
      console.log("Job data:", job.data);

      return { success: true };
    } catch (error) {
      console.error("Job failed:", error);
      throw error;
    }
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

cleanUpWorker.on("completed", (ev) => {
  console.log(ev.data);
});
