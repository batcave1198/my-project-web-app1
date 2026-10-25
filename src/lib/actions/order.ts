"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ORDER_STATUSES } from "@/lib/admin/orders";

function fail(orderId: string, message: string): never {
  redirect(
    `/admin/orders/${encodeURIComponent(orderId)}?error=${encodeURIComponent(message)}`,
  );
}

function done(orderId: string, message: string): never {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/account/orders");
  redirect(
    `/admin/orders/${encodeURIComponent(orderId)}?ok=${encodeURIComponent(message)}`,
  );
}

const statusSchema = z.object({
  orderId: z.string().min(1, "Missing order"),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function updateOrderStatus(formData: FormData) {
  const user = await requireStaff("/admin/orders");

  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") || "",
  });

  if (!parsed.success) {
    const orderId = String(formData.get("orderId") ?? "");
    fail(orderId, parsed.error.issues[0]?.message ?? "Invalid status update");
  }

  const { orderId, status, note } = parsed.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) fail(orderId, "Order not found");

  const now = new Date();
  const data: Prisma.OrderUpdateInput = { status };
  if (status === "CONFIRMED" && order.status !== "CONFIRMED") {
    data.confirmedAt = now;
  }
  if (status === "SHIPPED") data.shippedAt = now;
  if (status === "DELIVERED") data.deliveredAt = now;
  if (status === "CANCELLED") data.cancelledAt = now;

  try {
    await db.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note:
            note ||
            `Status changed from ${order.status} to ${status} by staff.`,
          changedBy: user.id,
        },
      });
    });
  } catch (error) {
    console.error("[orders] status update failed", error);
    fail(orderId, "Could not update the order status. Please try again.");
  }

  done(orderId, "Order status updated.");
}

const trackingSchema = z.object({
  orderId: z.string().min(1, "Missing order"),
  courier: z.string().trim().max(80).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(120).optional().or(z.literal("")),
  trackingUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function updateOrderTracking(formData: FormData) {
  await requireStaff("/admin/orders");

  const parsed = trackingSchema.safeParse({
    orderId: formData.get("orderId"),
    courier: formData.get("courier") || "",
    trackingNumber: formData.get("trackingNumber") || "",
    trackingUrl: formData.get("trackingUrl") || "",
  });

  if (!parsed.success) {
    const orderId = String(formData.get("orderId") ?? "");
    fail(orderId, parsed.error.issues[0]?.message ?? "Invalid tracking details");
  }

  const { orderId, courier, trackingNumber, trackingUrl } = parsed.data;

  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
    fail(orderId, "Tracking URL must start with http:// or https://");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) fail(orderId, "Order not found");

  try {
    await db.order.update({
      where: { id: orderId },
      data: {
        courier: courier || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
      },
    });
  } catch (error) {
    console.error("[orders] tracking update failed", error);
    fail(orderId, "Could not save tracking details. Please try again.");
  }

  done(orderId, "Tracking details saved.");
}
