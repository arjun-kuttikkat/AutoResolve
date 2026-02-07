import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userModeEnum = ["auto", "approval"] as const;
export const threadStatusEnum = ["pending", "processing", "replied", "resolved"] as const;
export const replyStatusEnum = ["draft", "sent", "failed"] as const;

export const userGuardrails = pgTable("user_guardrails", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  triggerDescription: text("trigger_description"),
  replyInstructions: text("reply_instructions"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    lastHistoryId: varchar("last_history_id", { length: 64 }),
    watchEnabled: boolean("watch_enabled").default(false),
    watchExpiresAt: timestamp("watch_expires_at", { withTimezone: true }),
    mode: varchar("mode", { length: 32 }).default("approval").$type<"auto" | "approval">(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

export const oauthTokens = pgTable("oauth_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const emailThreads = pgTable(
  "email_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    threadId: varchar("thread_id", { length: 64 }).notNull(),
    subject: varchar("subject", { length: 1024 }),
    lastProcessedMessageId: varchar("last_processed_message_id", { length: 64 }),
    status: varchar("status", { length: 32 })
      .default("pending")
      .$type<"pending" | "processing" | "replied" | "resolved">(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("email_threads_user_thread_idx").on(table.userId, table.threadId)]
);

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => emailThreads.id, { onDelete: "cascade" }),
    messageId: varchar("message_id", { length: 64 }).notNull().unique(),
    rfcMessageId: varchar("rfc_message_id", { length: 512 }),
    fromEmail: varchar("from_email", { length: 512 }).notNull(),
    toEmail: varchar("to_email", { length: 512 }).notNull(),
    subject: varchar("subject", { length: 1024 }),
    body: text("body"),
    isFromUser: boolean("is_from_user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("emails_message_id_idx").on(table.messageId)]
);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 })
    .notNull()
    .$type<"autonomous_reply" | "reply_sent" | "support_detected" | "human_intervention">(),
  title: varchar("title", { length: 512 }).notNull(),
  message: text("message"),
  subject: varchar("subject", { length: 1024 }),
  threadId: varchar("thread_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const emailReplies = pgTable(
  "email_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => emailThreads.id, { onDelete: "cascade" }),
    inboundMessageId: varchar("inbound_message_id", { length: 64 }).notNull(),
    generatedContent: text("generated_content").notNull(),
    providerMessageId: varchar("provider_message_id", { length: 64 }),
    status: varchar("status", { length: 32 })
      .default("draft")
      .$type<"draft" | "sent" | "failed">(),
    error: text("error"),
    confidenceScore: integer("confidence_score"),
    safetyCheckPassed: boolean("safety_check_passed"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("email_replies_user_inbound_idx").on(table.userId, table.inboundMessageId),
  ]
);

export type UserGuardrails = typeof userGuardrails.$inferSelect;
export type NewUserGuardrails = typeof userGuardrails.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;
export type EmailThread = typeof emailThreads.$inferSelect;
export type NewEmailThread = typeof emailThreads.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type EmailReply = typeof emailReplies.$inferSelect;
export type NewEmailReply = typeof emailReplies.$inferInsert;
