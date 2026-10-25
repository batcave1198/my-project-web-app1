"use server";

import { randomBytes, randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCart, getOrCreateCart } from "@/lib/cart/get-cart";
import { getCurrentUser } from "@/lib/auth/dal";
import { getEnv } from "@/lib/env";
import { buildPayHereCheckout, isPayHereConfigured } from "@/lib/payhere";
import {
  formatWeight,
  isValidWeightGrams,
  maxWeightGrams,
  MIN_WEIGHT_GRAMS,
  WEIGHT_STEP_GRAMS,
  weightLineAmount,
} from "@/lib/products/weight";
import { siteConfig } from "@/lib/site";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.email("Enter a valid email").max(254).transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(7, "Phone number is required").max(30),
  line1: z.string().trim().min(3, "Address is required").max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(100),
  district: z.string().trim().min(2, "District is required").max(100),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  methodId: z.string().min(1, "Choose a delivery method"),
});

export type CheckoutState = {
  status: "idle" | "error" | "pay";
  message?: string;
  fieldErrors?: Record<string, string>;
  payhere?: {
    action: string;
    fields: Record<string, string>;
    orderNumber: string;
    accessToken: string;
  };
};

function makeOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `CHS-${stamp}-${randomInt(1000, 9999)}`;
}

function money(value: Prisma.Decimal | number | string) {
  return new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || "",
    city: formData.get("city"),
    district: formData.get("district"),
    postalCode: formData.get("postalCode") || "",
    note: formData.get("note") || "",
    methodId: formData.get("methodId"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const data = parsed.data;

  if (!isPayHereConfigured()) {
    return {
      status: "error",
      message:
        "Online payment is not configured yet, so orders cannot be placed. Add PayHere sandbox credentials to the server environment first.",
    };
  }

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return { status: "error", message: "Your cart is empty." };
  }

  const method = await db.shippingMethod.findUnique({
    where: { id: data.methodId },
    include: { zone: true },
  });

  if (!method || !method.isActive || !method.zone.isActive) {
    return { status: "error", message: "That delivery method is not available." };
  }

  if (!method.zone.districts.includes(data.district)) {
    return { status: "error", message: "That delivery method does not cover your district." };
  }

  // Re-price everything from the database. Never trust values posted by the browser.
  let subtotal = new Prisma.Decimal(0);
  const lines = cart.items.map((item) => {
    const isWeight = item.saleMode === "WEIGHT";
    const unitPrice = money(item.variant ? item.variant.price : item.product.price);
    const lineTotal = isWeight
      ? money(weightLineAmount(unitPrice.toString(), item.weightGrams ?? 0))
      : money(unitPrice.mul(item.quantity));
    subtotal = money(subtotal.add(lineTotal));
    return {
      item,
      unitPrice,
      lineTotal,
      isWeight,
      available: item.variant ? item.variant.stock : item.product.stock,
    };
  });

  const changedProduct = lines.find(
    (line) =>
      line.item.product.status !== "PUBLISHED" ||
      (line.isWeight && line.item.product.saleMode !== "WEIGHT") ||
      (!line.isWeight && line.item.product.saleMode === "WEIGHT"),
  );
  if (changedProduct) {
    return {
      status: "error",
      message: `"${changedProduct.item.product.name}" is no longer available in that selling format. Please update your cart.`,
    };
  }

  const outOfStockWeight = lines.find(
    (line) =>
      line.isWeight && maxWeightGrams(line.available) < MIN_WEIGHT_GRAMS,
  );
  if (outOfStockWeight) {
    return {
      status: "error",
      message: `"${outOfStockWeight.item.product.name}" is currently out of stock. Please remove it from your cart.`,
    };
  }

  const invalidWeight = lines.find(
    (line) =>
      line.isWeight &&
      (!line.item.weightGrams ||
        !isValidWeightGrams(line.item.weightGrams, line.available)),
  );
  if (invalidWeight) {
    return {
      status: "error",
      message: `Choose ${MIN_WEIGHT_GRAMS}g to ${formatWeight(maxWeightGrams(invalidWeight.available))} for "${invalidWeight.item.product.name}" in ${WEIGHT_STEP_GRAMS}g steps. Please update your cart.`,
    };
  }

  const unavailable = lines.find(
    (line) => !line.isWeight && line.item.quantity > line.available,
  );
  if (unavailable) {
    return {
      status: "error",
      message: `"${unavailable.item.product.name}" only has ${unavailable.available} available. Please update your cart.`,
    };
  }

  const shippingTotal =
    method.freeOverAmount && subtotal.gte(method.freeOverAmount)
      ? new Prisma.Decimal(0)
      : money(method.price);

  const grandTotal = money(subtotal.add(shippingTotal));
  const amount = grandTotal.toFixed(2);
  const currency = siteConfig.currency;

  const user = await getCurrentUser();
  const [firstName, ...rest] = data.fullName.split(" ");
  const lastName = rest.join(" ") || ".";

  let orderNumber = makeOrderNumber();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await db.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!exists) break;
    orderNumber = makeOrderNumber();
  }

  const accessToken = randomBytes(24).toString("base64url");

  try {
    await db.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          orderNumber,
          accessToken,
          userId: user?.id ?? null,
          email: data.email,
          phone: data.phone,
          customerName: data.fullName,
          shippingFullName: data.fullName,
          shippingPhone: data.phone,
          shippingLine1: data.line1,
          shippingLine2: data.line2 || null,
          shippingCity: data.city,
          shippingDistrict: data.district,
          shippingPostalCode: data.postalCode || null,
          customerNote: data.note || null,
          subtotal,
          discountTotal: new Prisma.Decimal(0),
          shippingTotal,
          taxTotal: new Prisma.Decimal(0),
          grandTotal,
          currency,
          status: "PENDING",
          paymentStatus: "UNPAID",
          shippingMethodName: method.name,
          items: {
            create: lines.map((line) => ({
              productId: line.item.productId,
              variantId: line.item.variantId,
              productName: line.item.product.name,
              productSlug: line.item.product.slug,
              sku: line.item.variant?.sku ?? line.item.product.sku,
              variantLabel: line.item.variant?.label ?? null,
              imageUrl: line.item.product.images[0]?.url ?? null,
              saleMode: line.item.saleMode,
              weightGrams: line.isWeight ? line.item.weightGrams : null,
              unitPrice: line.unitPrice,
              compareAtPrice: line.item.variant
                ? line.item.variant.compareAtPrice
                : line.item.product.compareAtPrice,
              quantity: line.isWeight ? 1 : line.item.quantity,
              lineDiscount: new Prisma.Decimal(0),
              lineTotal: line.lineTotal,
            })),
          },
          payments: {
            create: {
              provider: "PAYHERE",
              amount: grandTotal,
              currency,
              status: "INITIATED",
            },
          },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed, awaiting payment." },
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
  } catch (error) {
    console.error("[checkout] order creation failed", error);
    return { status: "error", message: "We could not create your order. Please try again." };
  }

  const appUrl = getEnv().APP_URL.replace(/\/$/, "");
  const returnUrl = `${appUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(accessToken)}`;
  const cancelUrl = `${appUrl}/checkout/failed?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(accessToken)}`;

  const payhere = buildPayHereCheckout({
    orderNumber,
    amount,
    currency,
    firstName,
    lastName,
    email: data.email,
    phone: data.phone,
    address: `${data.line1}${data.line2 ? `, ${data.line2}` : ""}, ${data.city}`,
    city: data.city,
    returnUrl,
    cancelUrl,
  });

  revalidatePath("/cart");
  revalidatePath("/");

  return {
    status: "pay",
    payhere: { ...payhere, orderNumber, accessToken },
  };
}

/**
 * Puts the items from a failed or cancelled order back into the shopper's cart.
 * Quantities are capped to whatever is in stock today.
 */
export async function restoreOrderToCart(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("token") ?? "");

  if (!orderNumber || !token) return;

  const order = await db.order.findFirst({
    where: { orderNumber, accessToken: token },
    include: { items: true },
  });

  if (!order) return;

  const cart = await getOrCreateCart();

  for (const item of order.items) {
    if (!item.productId) continue;

    const product = await db.product.findFirst({
      where: { id: item.productId, status: "PUBLISHED" },
      include: { variants: true },
    });
    if (!product) continue;

    if (item.saleMode === "WEIGHT") {
      const grams = item.weightGrams ?? 0;
      if (
        product.saleMode !== "WEIGHT" ||
        !isValidWeightGrams(grams, product.stock)
      ) {
        continue;
      }

      const lineKey = `${product.id}:weight:${grams}`;
      const existing = await db.cartItem.findUnique({
        where: { cartId_lineKey: { cartId: cart.id, lineKey } },
      });
      if (existing) continue;

      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: null,
          lineKey,
          quantity: 1,
          saleMode: "WEIGHT",
          weightGrams: grams,
        },
      });
      continue;
    }

    if (product.saleMode !== "UNIT") continue;

    const variant = item.variantId
      ? product.variants.find((candidate) => candidate.id === item.variantId && candidate.isActive)
      : null;
    if (item.variantId && !variant) continue;

    const available = variant ? variant.stock : product.stock;
    if (available <= 0) continue;

    const lineKey = `${product.id}:${variant?.id ?? "base"}`;
    const existing = await db.cartItem.findUnique({
      where: { cartId_lineKey: { cartId: cart.id, lineKey } },
    });

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min(existing.quantity + item.quantity, available),
          saleMode: "UNIT",
          weightGrams: null,
        },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant?.id ?? null,
          lineKey,
          quantity: Math.min(item.quantity, available),
          saleMode: "UNIT",
        },
      });
    }
  }

  revalidatePath("/cart");
  redirect("/cart");
}
