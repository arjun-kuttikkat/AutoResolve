import type { Job } from "bullmq";
import { createMailboxWorker, type SyncMailboxJobData, type ProcessMessageJobData } from "../lib/queue.js";
import { syncMailbox } from "../services/syncMailbox.js";
import { processMessage } from "../services/processMessage.js";

const worker = createMailboxWorker(
  async (job: Job<SyncMailboxJobData | ProcessMessageJobData>) => {
    const name = job.name;
    const data = job.data;
    if (name === "syncMailbox" && "userId" in data) {
      await syncMailbox(data.userId);
      return;
    }
    if (name === "processMessage" && "userId" in data && "messageId" in data) {
      await processMessage(data.userId, data.messageId);
      return;
    }
    throw new Error(`Unknown job name: ${name}`);
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed:`, err);
});

console.log("Mailbox worker started");
