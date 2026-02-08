import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "../config/env.js";

let connection: IORedis | null = null;
let inMemoryProcessor: ((job: Job<SyncMailboxJobData | ProcessMessageJobData>) => Promise<void>) | null = null;

function getConnection(): IORedis {
  if (!connection) {
    const env = getEnv();
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      // Fail fast if we can't connect, so we can fallback
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 50, 2000);
      },
    });
    // Prevent unhandled error crashes
    connection.on("error", (err) => {
      console.warn("Redis connection error (processing will fallback to in-memory):", err.message);
    });
  }
  return connection;
}

const QUEUE_NAME = "mailbox";

export type SyncMailboxJobData = { userId: string };
export type ProcessMessageJobData = { userId: string; messageId: string };

export function getMailboxQueue(): Queue<SyncMailboxJobData | ProcessMessageJobData> {
  return new Queue<SyncMailboxJobData | ProcessMessageJobData>(QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  });
}

/** BullMQ job IDs cannot contain colons; use hyphen. */
function safeJobId(parts: string[]): string {
  return parts.map((p) => p.replace(/:/g, "-")).join("-");
}

async function fallbackToInMemory(name: string, data: any, id: string) {
  if (!inMemoryProcessor) {
    console.error("Redis failed and no in-memory processor registered. Job lost:", name, id);
    return;
  }
  console.log(`[Fallback] Processing job ${name}:${id} in-memory due to Redis unreachable.`);

  // Mock a minimal BullMQ Job
  const mockJob = {
    id,
    name,
    data,
    updateProgress: async () => { },
    log: async () => { },
    // Add other properties as needed by the processor, but our processor mainly uses name/data
  } as unknown as Job<SyncMailboxJobData | ProcessMessageJobData>;

  // Run in background (next tick) to simulate async queue
  setImmediate(async () => {
    try {
      await inMemoryProcessor!(mockJob);
    } catch (err) {
      console.error(`[Fallback] In-memory job ${name} failed:`, err);
    }
  });
}

export async function enqueueSyncMailbox(userId: string): Promise<void> {
  const jobId = safeJobId(["syncMailbox", userId]);
  try {
    const queue = getMailboxQueue();
    await queue.add("syncMailbox", { userId }, { jobId });
  } catch (err) {
    await fallbackToInMemory("syncMailbox", { userId }, jobId);
  }
}

export async function enqueueProcessMessage(userId: string, messageId: string): Promise<void> {
  const jobId = safeJobId(["processMessage", userId, messageId]);
  try {
    const queue = getMailboxQueue();
    await queue.add("processMessage", { userId, messageId }, { jobId });
  } catch (err) {
    await fallbackToInMemory("processMessage", { userId, messageId }, jobId);
  }
}

export function createMailboxWorker(
  processor: (job: Job<SyncMailboxJobData | ProcessMessageJobData>) => Promise<void>
): Worker<SyncMailboxJobData | ProcessMessageJobData> {
  // Capture processor for fallback
  inMemoryProcessor = processor;

  return new Worker<SyncMailboxJobData | ProcessMessageJobData>(
    QUEUE_NAME,
    processor,
    {
      connection: getConnection(),
      concurrency: 5,
    }
  );
}
