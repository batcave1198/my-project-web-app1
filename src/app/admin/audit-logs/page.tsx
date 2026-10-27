import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { Activity, ShieldCheck, UsersRound } from "lucide-react";
import { TeamMemberForm } from "@/components/admin/team-member-form";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { hoursAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Audit Logs" };

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatMetadata(value: Prisma.JsonValue | null) {
  if (!value) return "—";
  if (typeof value !== "object" || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join(" · ");
}

const actionTone: Record<string, string> = {
  create: "bg-success-soft text-success",
  update: "bg-cream-200 text-forest-800",
  delete: "bg-danger-soft text-danger",
  approve: "bg-success-soft text-success",
  reject: "bg-danger-soft text-danger",
};

export default async function AdminAuditLogsPage() {
  await requireAdmin("/admin/audit-logs");

  const [logs, team, totalActions, todayActions] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: { select: { name: true, email: true, role: true } },
      },
    }),
    db.user.findMany({
      where: { role: { in: ["ADMIN", "STAFF"] } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    db.auditLog.count(),
    db.auditLog.count({
      where: { createdAt: { gte: hoursAgo(24) } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">System</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">
          Audit logs
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Track administrative changes, review moderation and customer account
          activity. New team accounts can be created below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-5">
          <Activity className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {totalActions}
          </p>
          <p className="text-xs text-muted">Recorded actions</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <ShieldCheck className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {todayActions}
          </p>
          <p className="text-xs text-muted">Actions in the last 24 hours</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <UsersRound className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {team.length}
          </p>
          <p className="text-xs text-muted">Administrators & staff</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <TeamMemberForm />

        <section className="rounded-lg border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-forest-900">
              Team accounts
            </h2>
            <p className="mt-1 text-xs text-muted">
              Only these accounts can access the admin area.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Person</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Last sign-in
                  </th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-line/70 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-forest-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted">{member.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold text-forest-800">
                        {member.role === "ADMIN" ? "Administrator" : "Staff"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted">
                      {member.lastLoginAt
                        ? formatDateTime(member.lastLoginAt)
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-forest-900">
              Recent activity
            </h2>
            <p className="mt-1 text-xs text-muted">
              The newest {logs.length} entries, most recent first.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Activity className="mx-auto size-8 text-gold-600" />
            <p className="mt-3 text-sm font-medium text-forest-900">
              No activity recorded yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Product, gallery, review and team changes will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">When</th>
                  <th className="px-4 py-2.5 font-semibold">Actor</th>
                  <th className="px-4 py-2.5 font-semibold">Action</th>
                  <th className="px-4 py-2.5 font-semibold">Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Details</th>
                  <th className="px-5 py-2.5 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionVerb = log.action.split(".").pop() ?? log.action;
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-line/70 align-top last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {log.actor ? (
                          <>
                            <p className="font-medium text-forest-900">
                              {log.actor.name}
                            </p>
                            <p className="text-xs text-muted">
                              {log.actor.role === "ADMIN"
                                ? "Administrator"
                                : "Staff"}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-muted">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[0.68rem] font-semibold ${
                            actionTone[actionVerb] ?? "bg-cream-200 text-forest-800"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-soft">
                        <p className="font-medium">{log.entityType}</p>
                        {log.entityId && (
                          <p className="mt-0.5 max-w-[12rem] truncate font-mono text-[0.65rem] text-muted">
                            {log.entityId}
                          </p>
                        )}
                      </td>
                      <td className="max-w-[18rem] px-4 py-3 text-xs leading-relaxed text-ink-soft">
                        <span className="line-clamp-2">
                          {formatMetadata(log.metadata)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[0.65rem] text-muted">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
