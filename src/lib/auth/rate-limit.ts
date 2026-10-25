import "server-only";
import { db } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type ConsumeOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
  blockSeconds?: number;
};

/**
 * Fixed-window rate limiter backed by PostgreSQL so it keeps working across
 * PM2 workers and serverless-ish runtimes. The increment is atomic.
 */
export async function consumeRateLimit({
  key,
  limit,
  windowSeconds,
  blockSeconds = windowSeconds,
}: ConsumeOptions): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<
    Array<{ count: number; windowStart: Date; blockedUntil: Date | null }>
  >`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "blockedUntil", "updatedAt")
    VALUES (${key}, 1, now(), NULL, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds})
          THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds})
          THEN now()
        ELSE "RateLimit"."windowStart"
      END,
      "updatedAt" = now()
    RETURNING "count", "windowStart", "blockedUntil"
  `;

  const row = rows[0];
  if (!row) {
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  const now = Date.now();

  if (row.blockedUntil && row.blockedUntil.getTime() > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((row.blockedUntil.getTime() - now) / 1000),
    };
  }

  if (row.count > limit) {
    const blockedUntil = new Date(now + blockSeconds * 1000);
    await db.rateLimit.update({
      where: { key },
      data: { blockedUntil },
    });
    return { allowed: false, remaining: 0, retryAfterSeconds: blockSeconds };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: 0,
  };
}

/** Clears a limiter after a successful action (e.g. correct password). */
export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } }).catch(() => undefined);
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}
