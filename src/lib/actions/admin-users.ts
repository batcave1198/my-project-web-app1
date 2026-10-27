"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";
import { recordAuditLog } from "@/lib/admin/audit";

const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "STAFF"]),
});

export type TeamMemberActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function addTeamMember(
  _prev: TeamMemberActionState,
  formData: FormData,
): Promise<TeamMemberActionState> {
  const actor = await requireAdmin("/admin/audit-logs");

  const parsed = teamMemberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "STAFF",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const { name, email, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: "team.create",
      entityType: "User",
      entityId: user.id,
      metadata: { name: user.name, email: user.email, role: user.role },
    });

    revalidatePath("/admin/audit-logs");
    return {
      status: "success",
      message: `${role === "ADMIN" ? "Administrator" : "Staff member"} added.`,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        status: "error",
        fieldErrors: { email: "An account with this email already exists." },
        message: "Please check the highlighted fields.",
      };
    }
    console.error("[team] create failed", error);
    return { status: "error", message: "Could not add this account." };
  }
}
