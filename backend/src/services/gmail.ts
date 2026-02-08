import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import { getEnv } from "../config/env.js";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuth2Client(): OAuth2Client {
  const env = getEnv();
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state?: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: state ?? undefined,
  });
}

export async function getTokensFromCode(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing access_token or refresh_token");
  }
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: expiry,
    scope: tokens.scope ?? undefined,
  };
}

export function getGmailClient(oauth2Client: OAuth2Client) {
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getProfile(oauth2Client: OAuth2Client): Promise<{ emailAddress: string; messagesTotal?: number; threadsTotal?: number; historyId?: string }> {
  const gmail = getGmailClient(oauth2Client);
  const res = await gmail.users.getProfile({ userId: "me" });
  return {
    emailAddress: res.data.emailAddress!,
    messagesTotal: res.data.messagesTotal,
    threadsTotal: res.data.threadsTotal,
    historyId: res.data.historyId ?? undefined,
  };
}

export async function setWatch(oauth2Client: OAuth2Client): Promise<{ historyId: string; expiration: string }> {
  const env = getEnv();
  const topicName = `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/topics/${env.GOOGLE_PUBSUB_TOPIC ?? "gmail-notifications"}`;
  const gmail = getGmailClient(oauth2Client);
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: { topicName },
  });
  const expiration = res.data.expiration ? String(res.data.expiration) : "";
  const historyId = res.data.historyId ? String(res.data.historyId) : "";
  return { historyId, expiration };
}

export function createClientWithTokens(accessToken: string, refreshToken: string) {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return client;
}
