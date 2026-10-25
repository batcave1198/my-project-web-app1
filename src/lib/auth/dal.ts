import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { validateSession, type ValidatedSession } from "@/lib/auth/session";

export type SessionUser = ValidatedSession["user"];

/**
 * Memoised for the duration of a single render pass. Server Actions are not
 * part of a render pass, so authorisation is re-checked on every mutation.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await validateSession();
  return session?.user ?? null;
});

export async function requireUser(returnTo = "/account"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

export function isStaff(user: SessionUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "STAFF";
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}

/** Admin area guard. Non-staff accounts are bounced out, not shown a 404. */
export async function requireStaff(
  returnTo = "/admin",
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!isStaff(user)) {
    redirect("/");
  }
  return user;
}

export async function requireAdmin(
  returnTo = "/admin",
): Promise<SessionUser> {
  const user = await requireStaff(returnTo);
  if (user.role !== "ADMIN") {
    redirect("/admin");
  }
  return user;
}

/**
 * Guard for Route Handlers and Server Actions. Returns a ready-made response
 * shape instead of redirecting so callers can choose JSON vs HTML.
 */
export async function assertStaff(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: 401 | 403 }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401 };
  if (!isStaff(user)) return { ok: false, status: 403 };
  return { ok: true, user };
}
