import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { getEnv } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import emailsRoutes from "./routes/emails.js";
import pubsubRoutes from "./routes/pubsub.js";
import usersRoutes from "./routes/users.js";
import { createMailboxWorker } from "./lib/queue.js";
import { syncMailbox } from "./services/syncMailbox.js";
import { processMessage } from "./services/processMessage.js";
import type { SyncMailboxJobData, ProcessMessageJobData } from "./lib/queue.js";
import type { Job } from "bullmq";

const app = express();
const env = getEnv();

// Start mailbox worker in-process so sync/processMessage jobs run without separate "npm run worker"
const mailboxWorker = createMailboxWorker(
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
mailboxWorker.on("failed", (job, err) => {
  console.error("Mailbox job failed:", job?.id, job?.name, err);
});
console.log("Mailbox worker started (in-process)");

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/pubsub", pubsubRoutes);
app.use("/api/users", usersRoutes);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
