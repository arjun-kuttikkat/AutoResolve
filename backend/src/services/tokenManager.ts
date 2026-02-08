import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getEnv } from "../config/env.js";

const ALG = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const VERSION = "v1";
const SCRYPT_SALT = "autoresolve-token-encryption-v1";

function getKey(): Buffer {
  const env = getEnv();
  const raw = env.ENCRYPTION_KEY.trim();
  if (!raw) throw new Error("ENCRYPTION_KEY is required");

  // If it's valid base64 and decodes to 32 bytes, use it
  try {
    const key = Buffer.from(raw, "base64");
    if (key.length === KEY_LEN) return key;
  } catch {
    // Not valid base64, treat as passphrase
  }

  // Otherwise derive 32 bytes from passphrase (so a simple password works)
  return scryptSync(raw, SCRYPT_SALT, KEY_LEN);
}

/**
 * Encrypt plaintext with AES-256-GCM. Format: v1:<iv>:<ciphertext>:<tag> (versioned for key rotation).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), encrypted.toString("base64"), tag.toString("base64")].join(
    ":"
  );
}

/**
 * Decrypt ciphertext in format v1:<iv>:<ciphertext>:<tag>.
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid encrypted format or version");
  }
  const [, ivB64, cipherB64, tagB64] = parts;
  const key = getKey();
  const iv = Buffer.from(ivB64!, "base64");
  const ciphertext = Buffer.from(cipherB64!, "base64");
  const tag = Buffer.from(tagB64!, "base64");
  const decipher = createDecipheriv(ALG, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Refresh tokens if expiring within marginMs. Returns new tokens and whether they were refreshed.
 */
export async function refreshIfNeeded(
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
  marginMs: number = 15 * 60 * 1000
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date; refreshed: boolean }> {
  const now = Date.now();
  if (expiresAt.getTime() - marginMs > now) {
    return {
      accessToken,
      refreshToken,
      expiresAt,
      refreshed: false,
    };
  }
  const { OAuth2Client } = await import("google-auth-library");
  const env = getEnv();
  const client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  const newExpiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(now + 3600 * 1000);
  return {
    accessToken: credentials.access_token!,
    refreshToken: credentials.refresh_token ?? refreshToken,
    expiresAt: newExpiry,
    refreshed: true,
  };
}
