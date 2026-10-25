"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/dal";
import { sriLankaDistricts } from "@/lib/sri-lanka";

function fail(message: string): never {
  redirect(`/admin/shipping?error=${encodeURIComponent(message)}`);
}

function done(message: string): never {
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  redirect(`/admin/shipping?ok=${encodeURIComponent(message)}`);
}

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Zone name is required").max(80),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveShippingZone(formData: FormData) {
  await requireStaff("/admin/shipping");

  const parsed = zoneSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid zone");

  const districts = formData
    .getAll("districts")
    .map(String)
    .filter((district) => (sriLankaDistricts as readonly string[]).includes(district));

  if (districts.length === 0) fail("Choose at least one district for this zone.");

  const data = {
    name: parsed.data.name,
    districts,
    sortOrder: parsed.data.sortOrder,
    isActive: formData.get("isActive") === "on",
  };

  if (parsed.data.id) {
    await db.shippingZone.update({ where: { id: parsed.data.id }, data });
    done("Zone updated.");
  }

  await db.shippingZone.create({ data });
  done("Zone created.");
}

export async function deleteShippingZone(formData: FormData) {
  await requireStaff("/admin/shipping");
  const id = String(formData.get("id") ?? "");
  if (!id) fail("Missing zone.");

  await db.shippingZone.delete({ where: { id } });
  done("Zone deleted.");
}

const methodSchema = z.object({
  id: z.string().optional(),
  zoneId: z.string().min(1, "Zone is required"),
  name: z.string().trim().min(2, "Method name is required").max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative").max(1_000_000),
  freeOverAmount: z
    .union([z.coerce.number().min(0).max(10_000_000), z.literal("")])
    .optional(),
  minDays: z.coerce.number().int().min(0).max(60).default(2),
  maxDays: z.coerce.number().int().min(0).max(60).default(5),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveShippingMethod(formData: FormData) {
  await requireStaff("/admin/shipping");

  const parsed = methodSchema.safeParse({
    id: formData.get("id") || undefined,
    zoneId: formData.get("zoneId"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    price: formData.get("price"),
    freeOverAmount: formData.get("freeOverAmount") || "",
    minDays: formData.get("minDays") || 2,
    maxDays: formData.get("maxDays") || 5,
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) fail(parsed.error.issues[0]?.message ?? "Invalid delivery method");

  const { id, zoneId, ...rest } = parsed.data;
  if (rest.maxDays < rest.minDays) fail("Maximum days cannot be less than minimum days.");

  const data = {
    zoneId,
    name: rest.name,
    description: rest.description || null,
    price: new Prisma.Decimal(rest.price.toFixed(2)),
    freeOverAmount:
      rest.freeOverAmount === "" || rest.freeOverAmount === undefined
        ? null
        : new Prisma.Decimal(Number(rest.freeOverAmount).toFixed(2)),
    minDays: rest.minDays,
    maxDays: rest.maxDays,
    sortOrder: rest.sortOrder,
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    await db.shippingMethod.update({ where: { id }, data });
    done("Delivery method updated.");
  }

  await db.shippingMethod.create({ data });
  done("Delivery method added.");
}

export async function deleteShippingMethod(formData: FormData) {
  await requireStaff("/admin/shipping");
  const id = String(formData.get("id") ?? "");
  if (!id) fail("Missing method.");
  await db.shippingMethod.delete({ where: { id } });
  done("Delivery method deleted.");
}
