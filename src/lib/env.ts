import "server-only";
import { z } from "zod";

/**
 * Environment validation.
 *
 * Parsed lazily so that a missing variable produces one clear error at the
 * point of use instead of a stack trace during module evaluation.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),

  /** Set to true only when the app is behind a trusted reverse proxy (Nginx). */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  PAYHERE_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYHERE_MERCHANT_ID: z.string().optional(),
  PAYHERE_MERCHANT_SECRET: z.string().optional(),
  PAYHERE_NOTIFY_URL: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("ceylon-herbs-spices"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default("Ceylon Herbs and Spices <no-reply@localhost>"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the values.`,
    );
  }

  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return getEnv().NODE_ENV === "production";
}

export const env = new Proxy({} as Env, {
  get(_target, property: string) {
    return getEnv()[property as keyof Env];
  },
});
