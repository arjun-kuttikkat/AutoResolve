const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function wrapNetworkError(err: unknown, context: string): never {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Is the backend running? Start it with: npm run dev:backend (or cd backend && npm run dev).`
    );
  }
  throw err;
}

export async function getAuthStatus(userId: string): Promise<{ connected: boolean }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/status?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Auth status failed");
    return res.json();
  } catch (e) {
    wrapNetworkError(e, "auth status");
  }
}

export function getGmailAuthUrl(state?: string): string {
  const url = new URL(`${API_URL}/api/auth/gmail`);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

export async function disconnectGmail(userId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/gmail/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Disconnect failed");
  return res.json();
}

export async function syncEmails(userId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/emails/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const details = (body as { details?: string }).details ?? (body as { error?: string }).error ?? "Sync failed";
      throw new Error(details);
    }
    return body as { ok: boolean; message?: string };
  } catch (e) {
    wrapNetworkError(e, "sync");
  }
}

export async function getThreads(userId: string): Promise<{ threads: Array<{ id: string; threadId: string; subject: string | null; status: string | null; updatedAt: Date | null; caseId: string | null; metrics?: { sent: number; received: number; total: number } }> }> {
  const res = await fetch(`${API_URL}/api/emails/threads?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch threads");
  return res.json();
}

export async function getThread(userId: string, threadId: string): Promise<{
  thread: { id: string; threadId: string; subject: string | null; status: string | null };
  messages: Array<{ id: string; fromEmail: string; toEmail: string; subject: string | null; body: string | null; isFromUser: boolean; createdAt: Date | null }>;
}> {
  const res = await fetch(
    `${API_URL}/api/emails/threads/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userId)}`
  );
  if (!res.ok) throw new Error("Failed to fetch thread");
  return res.json();
}

export type GenerateReplyResult =
  | { sent: true; messageId?: string }
  | { sent: false; draft: string; replyId: string; subject: string | null; threadId: string };

export async function generateReplyForThread(
  userId: string,
  threadId: string,
  options?: {
    takeOver?: boolean;
    signal?: AbortSignal;
    tone?: string;
    userContext?: string;
    imageContext?: string[]; // Array of base64 strings
  }
): Promise<GenerateReplyResult> {
  const res = await fetch(
    `${API_URL}/api/emails/threads/${encodeURIComponent(threadId)}/generate-reply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        takeOver: options?.takeOver === true,
        tone: options?.tone,
        userContext: options?.userContext,
        imageContext: options?.imageContext,
      }),
      signal: options?.signal,
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { details?: string }).details ?? (body as { error?: string }).error ?? "Generate reply failed";
    throw new Error(msg);
  }
  return body as GenerateReplyResult;
}

export async function getReplies(userId: string): Promise<{
  replies: Array<{
    id: string;
    generatedContent: string;
    status: string;
    confidenceScore: number | null;
    safetyCheckPassed: boolean | null;
    createdAt: Date | null;
  }>;
}> {
  const res = await fetch(`${API_URL}/api/emails/replies?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch replies");
  return res.json();
}

export async function approveReply(
  userId: string,
  replyId: string,
  content?: string
): Promise<{ ok: boolean; messageId?: string }> {
  const res = await fetch(`${API_URL}/api/emails/replies/${replyId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...(content !== undefined ? { content } : {}) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Approve failed");
  }
  return res.json();
}

export async function rejectReply(userId: string, replyId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/emails/replies/${replyId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Reject failed");
  return res.json();
}

export async function getUserMode(userId: string): Promise<{ mode: "auto" | "approval" }> {
  const res = await fetch(`${API_URL}/api/users/me?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function setUserMode(
  userId: string,
  mode: "auto" | "approval"
): Promise<{ ok: boolean; mode: string }> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, mode }),
  });
  if (!res.ok) throw new Error("Failed to set mode");
  return res.json();
}

export async function getGuardrails(userId: string): Promise<{
  triggerDescription: string;
  replyInstructions: string;
}> {
  const res = await fetch(`${API_URL}/api/users/guardrails?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch guardrails");
  return res.json();
}

export async function setGuardrails(
  userId: string,
  data: { triggerDescription: string; replyInstructions: string }
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_URL}/api/users/guardrails`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to save guardrails");
  return res.json();
}
// --- Case Management ---

export async function createCase(
  userId: string,
  threadId: string,
  data: {
    merchantName?: string;
    issueDescription?: string;
    desiredOutcome?: string;
    mode?: "auto" | "manual";
  }
): Promise<{ case: any }> {
  const res = await fetch(`${API_URL}/api/cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, threadId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to create case");
  return res.json();
}

export async function resolveCase(userId: string, caseId: string): Promise<{ case: any }> {
  const res = await fetch(`${API_URL}/api/cases/${caseId}/resolve?userId=${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to resolve case");
  return res.json();
}

export async function getCaseByThreadId(userId: string, threadId: string): Promise<{ case: any | null }> {
  const res = await fetch(`${API_URL}/api/cases/thread/${encodeURIComponent(threadId)}?userId=${encodeURIComponent(userId)}`);
  if (res.status === 404) return { case: null };
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}
export interface Case {
  id: string;
  caseReferenceId: string;
  merchantName: string | null;
  issueDescription: string | null;
  desiredOutcome: string | null;
  status: "draft" | "sent" | "open" | "resolved";
  mode: "auto" | "manual";
  nextAction: string | null;
  lastAction: string | null;
  updatedAt: string;
  createdAt: string;
  userId: string;
}

export async function getCases(userId: string): Promise<{ cases: Case[] }> {
  const res = await fetch(`${API_URL}/api/cases?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

// --- Notifications ---

export type NotificationPayload = {
  id: string;
  type: "autonomous_reply" | "reply_sent" | "support_detected" | "human_intervention";
  title: string;
  message?: string;
  subject?: string;
  threadId?: string;
  timestamp: number;
};

export async function getNotifications(
  userId: string,
  limit = 10,
  offset = 0
): Promise<{ notifications: NotificationPayload[]; hasMore: boolean }> {
  try {
    const res = await fetch(
      `${API_URL}/api/users/notifications?userId=${encodeURIComponent(userId)}&limit=${limit}&offset=${offset}`
    );
    if (!res.ok) {
      if (res.status === 404) return { notifications: [], hasMore: false };
      throw new Error("Failed to fetch notifications");
    }
    return res.json();
  } catch (e) {
    console.error("Notification fetch failed", e);
    return { notifications: [], hasMore: false };
  }
}

export async function createNotification(
  userId: string,
  data: { type: NotificationPayload["type"]; title: string; message?: string; subject?: string; threadId?: string }
): Promise<NotificationPayload> {
  try {
    const res = await fetch(`${API_URL}/api/users/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Fallback for missing backend endpoint during dev
      if (res.status === 404) {
        return {
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          ...data
        } as NotificationPayload;
      }
      const msg = (body as { error?: string }).error ?? "Failed to create notification";
      throw new Error(msg);
    }
    return body as NotificationPayload;
  } catch (e) {
    console.error("Notification create failed", e);
    return {
      id: "temp-" + Date.now(),
      timestamp: Date.now(),
      ...data
    } as NotificationPayload;
  }
}
