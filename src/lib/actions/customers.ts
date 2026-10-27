"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { emailSchema, passwordSchema } from "@/lib/validation/auth";
import { recordAuditLog } from "@/lib/admin/audit";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: emailSchema,
  phone: z.string().trim().max(30, "Phone is too long").optional().or(z.literal("")),
  password: passwordSchema,
  marketingOptIn: z.coerce.boolean().default(false),
});

export type CustomerActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function addCustomer(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const actor = await requireAdmin("/admin/customers");

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    password: formData.get("password"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
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

  const { name, email, phone, password, marketingOptIn } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "CUSTOMER",
        marketingOptIn,
      },
      select: { id: true, name: true, email: true },
    });

    await recordAuditLog({
      actorUserId: actor.id,
      action: "customer.create",
      entityType: "User",
      entityId: user.id,
      metadata: { name: user.name, email: user.email },
    });

    revalidatePath("/admin/customers");
    return {
      status: "success",
      message: `${user.name} was added. Share the temporary password securely.`,
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
    console.error("[customers] create failed", error);
    return { status: "error", message: "Could not add this customer." };
  }
}

export type DeleteCustomerResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function deleteCustomer(id: string): Promise<DeleteCustomerResult> {
  const actor = await requireAdmin("/admin/customers");

  const target = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!target) return { status: "error", message: "Customer not found." };
  if (target.role !== "CUSTOMER") {
    return { status: "error", message: "Only customer accounts can be deleted here." };
  }
  if (target.id === actor.id) {
    return { status: "error", message: "You cannot delete your own account." };
  }

  try {
    await db.user.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: actor.id,
      action: "customer.delete",
      entityType: "User",
      entityId: target.id,
      metadata: { name: target.name, email: target.email },
    });
    revalidatePath("/admin/customers");
    return { status: "success" };
  } catch (error) {
    console.error("[customers] delete failed", error);
    return { status: "error", message: "Could not delete this customer." };
  }
}
