import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "../config/env.js";

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    const env = getEnv();
    connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
    connection.on("error", (err: Error) => {
      console.error("Redis connection error:", err.message);
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

export async function enqueueSyncMailbox(userId: string): Promise<void> {
  const queue = getMailboxQueue();
  const jobId = safeJobId(["syncMailbox", userId]);
  await queue.add("syncMailbox", { userId }, { jobId });
}

export async function enqueueProcessMessage(userId: string, messageId: string): Promise<void> {
  const queue = getMailboxQueue();
  const jobId = safeJobId(["processMessage", userId, messageId]);
  await queue.add("processMessage", { userId, messageId }, { jobId });
}

export function createMailboxWorker(
  processor: (job: Job<SyncMailboxJobData | ProcessMessageJobData>) => Promise<void>
): Worker<SyncMailboxJobData | ProcessMessageJobData> {
  return new Worker<SyncMailboxJobData | ProcessMessageJobData>(
    QUEUE_NAME,
    processor,
    {
      connection: getConnection(),
      concurrency: 5,
    }
  );
}
