import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requestMeta } from "@/lib/auth/session";

type AuditInput = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Audit writes must never make the underlying admin action fail. If the log
 * table is unavailable we surface the error in server logs and let the
 * business mutation succeed.
 */
export async function recordAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: AuditInput) {
  try {
    const meta = await requestMeta();
    await db.auditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata,
        ipAddress: meta.ipAddress?.slice(0, 100) ?? null,
        userAgent: meta.userAgent?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] could not write audit log", error);
  }
}
