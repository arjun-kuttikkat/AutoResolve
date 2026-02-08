AutoResolve Project Analysis
Overview
This project is an AI-powered email automation agent designed to integrate with Gmail, analyze incoming messages, and automatically generate or send responses based on user-defined criteria. It uses a modern stack including Node.js/Express, PostgreSQL (Supabase), Redis/BullMQ, and OpenAI.

Key Features & Technical Implementation
1. Gmail Integration & Authentication
The system uses OAuth 2.0 to connect securely with user Gmail accounts.

Linking: Users authorize the app via Google's OAuth screens. Access (accessToken) and refresh tokens (refreshToken) are encrypted using a symmetric key (ENCRYPTION_KEY) before being stored in the database.
Watch Mechanism: Upon connection, the system attempts to set up a Google Cloud Pub/Sub watch. This allows Google to push real-time notifications to the backend whenever the mailbox changes, avoiding the need for constant polling.
2. Intelligent Email Synchronization
The synchronization engine is efficient and event-driven.

Webhooks: A public endpoint (/api/pubsub/gmail) receives push notifications from Google. It authenticates the payload and enqueues a background job.
Incremental Sync: The 
syncMailbox
 service uses Gmail's history.list API. It tracks a lastHistoryId for each user to fetch only what changed since the last sync.
Fallback: If the history ID is expired (older than ~30 days) or missing, it triggers a full fetch of the latest emails (messages.list) to self-heal.
3. AI Traffic Control & Processing
Not every email needs a reply. The system uses a two-stage filtering process:

Stage 1 - Technical Filters: Automatically ignores:
Emails sent by the user themselves (loop prevention).
Auto-replies, safe-sender lists, and bulk mail headers.
Stage 2 - AI Classifier: An OpenAI model (gpt-4o-mini) evaluates the email against the user's specific Trigger Description (e.g., "Customer complaining about shipping"). It outputs a strict YES/NO decision on whether to engage.
4. Context-Aware Reply Generation
When a reply is triggered, the system generates a draft using GPT-4o.

Context: The prompt includes the last 10 emails in the thread to ensure the AI understands the full conversation history.
Customization: Users can provide Reply Instructions (e.g., "Be polite and offer a 10% discount"), which are injected into the system prompt.
5. Safety Guardrails & Validation
Before creating a draft, the content passes through a rigorous safety check (
safetyGates.ts
).

Regex Heuristics: failed checks for threats ("lawsuit"), fraud keywords, sensitive PII (SSN, credit cards), and length sanity.
AI Validation: A secondary AI pass (gpt-4o-mini) reviews the draft to ensure compliance and scores confidence (0-100).
Threshold: Only replies with Confidence ≥ 70% and no flagged issues are eligible for auto-sending.
6. User Control Modes
The system supports two distinct operational modes per user:

Approval Mode (Default): AI generates a draft but does not send it. The reply is saved to the database with status draft. The user must manually review and click "Approve" in the dashboard.
Auto Mode: If the safety checks pass, the email is sent immediately via the Gmail API without human intervention. If safety checks fail, it falls back to draft status for review.
7. Background Job Architecture
Reliability is handled via BullMQ backed by Redis.

Queues: mailbox queue handles 
syncMailbox
 and 
processMessage
 jobs.
Concurrency: Workers process multiple jobs in parallel (default concurrency: 5).
Retries: Failed jobs use exponential backoff to handle transient API errors (e.g., Gmail rate limits).
Frontend Capabilities
The web interface (Next.js) provides the user control plane:

Dashboard: Shows connection status and sync health.
Inbox/Threads: View synced email threads and their status (Pending, Replied).
Draft Review: A dedicated view for Approval Mode users to edit, approve, or reject AI-generated drafts.
Configuration: UI to update Trigger Description and Reply Instructions.
Data Flow Summary
Inbound: Google Pub/Sub → Webhook → Queue 
syncMailbox
.
Sync: 
syncMailbox
 → Gmail API (History) → Queue 
processMessage
.
Process: 
processMessage
 → OpenAI (Classify) → OpenAI (Generate) → OpenAI (Safety).
Action:
Auto: Gmail API (Send).
Draft: DB Insert (Wait for User API call).

Comment
Ctrl+Alt+M
