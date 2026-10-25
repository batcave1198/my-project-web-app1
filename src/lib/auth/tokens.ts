import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/** 256 bits of entropy, URL-safe. This is what the browser cookie holds. */
export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

/**
 * Session tokens are stored as an HMAC, never in plain text. A leaked database
 * dump therefore cannot be replayed as valid sessions.
 */
export function hashToken(token: string): string {
  return createHmac("sha256", getEnv().SESSION_SECRET)
    .update(token)
    .digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
