import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"))
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  next: z.string().optional(),
});

export const mfaCodeSchema = z
  .string()
  .trim()
  .min(6, "Enter the 6-digit code from your authenticator app")
  .max(32, "That code is too long")
  .regex(/^[A-Za-z0-9-]+$/, "Enter a valid authenticator or recovery code");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    marketingOptIn: z.boolean().default(false),
    acceptTerms: z.literal(true, {
      error: "You must accept the Terms and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(20, "This reset link is invalid").max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Only allow same-origin relative redirects after login. */
export function safeRedirectPath(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
