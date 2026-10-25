import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * OWASP-recommended Argon2id parameters (19 MiB, 2 iterations, 1 lane).
 * Encoded into the digest, so future parameter changes stay backward
 * compatible with existing hashes.
 *
 * `algorithm: 2` is Argon2id. The package ships it as an ambient const enum,
 * which cannot be referenced when `isolatedModules` is enabled.
 */
const HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
