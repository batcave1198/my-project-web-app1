import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getEnv } from "@/lib/env";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

function base32Encode(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(secret: string) {
  const normalized = secret.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) throw new Error("Invalid authenticator secret");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

function hotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const number =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(number % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function verifyTotp(secret: string, token: string, window = 1) {
  const code = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return false;

  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = hotp(secret, counter + offset);
    if (
      expected.length === code.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(code))
    ) {
      return true;
    }
  }
  return false;
}

export function buildTotpUri({
  secret,
  email,
  issuer = "Ceylon Herbs and Spices",
}: {
  secret: string;
  email: string;
  issuer?: string;
}) {
  const label = `${issuer}:${email}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

function encryptionKey() {
  return createHash("sha256")
    .update(getEnv().SESSION_SECRET)
    .update("ceylon-herbs:mfa-secret:v1")
    .digest();
}

/** AES-256-GCM at rest. A database dump alone cannot reveal the TOTP seed. */
export function encryptMfaSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptMfaSecret(payload: string) {
  const buffer = Buffer.from(payload, "base64url");
  if (buffer.length < 29) throw new Error("Invalid authenticator secret");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const raw = base32Encode(randomBytes(5));
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
}

export function normalizeRecoveryCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function hashRecoveryCode(code: string) {
  return createHmac("sha256", getEnv().SESSION_SECRET)
    .update(`mfa-recovery:${normalizeRecoveryCode(code)}`)
    .digest("hex");
}
