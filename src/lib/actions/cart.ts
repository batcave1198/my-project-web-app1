"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCart, getOrCreateCart } from "@/lib/cart/get-cart";
import {
  formatWeight,
  isValidWeightGrams,
  maxWeightGrams,
  MIN_WEIGHT_GRAMS,
  WEIGHT_STEP_GRAMS,
} from "@/lib/products/weight";

const quantitySchema = z.coerce.number().int().min(1).max(50);
const weightSchema = z.coerce.number().int().positive();

export type CartActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number,
  weightGrams?: number,
): Promise<CartActionState> {
  const parsedQty = quantitySchema.safeParse(quantity);
  if (!parsedQty.success) {
    return { status: "error", message: "Choose a quantity between 1 and 50." };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product || product.status !== "PUBLISHED") {
    return { status: "error", message: "This product is not available." };
  }

  const cart = await getOrCreateCart();

  if (product.saleMode === "WEIGHT") {
    const parsedWeight = weightSchema.safeParse(weightGrams);
    if (!parsedWeight.success) {
      return { status: "error", message: "Choose a valid weight." };
    }
    if (maxWeightGrams(product.stock) < MIN_WEIGHT_GRAMS) {
      return { status: "error", message: "This product is out of stock." };
    }
    if (!isValidWeightGrams(parsedWeight.data, product.stock)) {
      return {
        status: "error",
        message: `Choose a weight from ${MIN_WEIGHT_GRAMS}g to ${formatWeight(maxWeightGrams(product.stock))}, in ${WEIGHT_STEP_GRAMS}g steps.`,
      };
    }

    const lineKey = `${productId}:weight:${parsedWeight.data}`;
    const existing = cart.items.find((item) => item.lineKey === lineKey);
    if (existing) {
      return {
        status: "success",
        message: "That weight is already in your cart.",
      };
    }

    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: null,
        lineKey,
        quantity: 1,
        saleMode: "WEIGHT",
        weightGrams: parsedWeight.data,
      },
    });

    revalidatePath("/cart");
    revalidatePath("/");
    return { status: "success", message: "Added to cart." };
  }

  const variant = variantId
    ? product.variants.find((v) => v.id === variantId && v.isActive)
    : null;

  if (variantId && !variant) {
    return { status: "error", message: "Please choose a valid option." };
  }

  const availableStock = variant ? variant.stock : product.stock;
  if (availableStock <= 0) {
    return { status: "error", message: "This product is out of stock." };
  }

  const lineKey = `${productId}:${variant?.id ?? "base"}`;

  const existing = cart.items.find((item) => item.lineKey === lineKey);
  const nextQty = (existing?.quantity ?? 0) + parsedQty.data;

  if (nextQty > availableStock) {
    return {
      status: "error",
      message: `Only ${availableStock} available. Your cart already has ${existing?.quantity ?? 0}.`,
    };
  }

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty, saleMode: "UNIT", weightGrams: null },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variant?.id ?? null,
        lineKey,
        quantity: parsedQty.data,
        saleMode: "UNIT",
      },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/");
  return { status: "success", message: "Added to cart." };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartActionState> {
  const parsedQty = quantitySchema.safeParse(quantity);
  if (!parsedQty.success) {
    return { status: "error", message: "Invalid quantity." };
  }

  const cart = await getCart();
  if (!cart) return { status: "error", message: "Your cart has expired." };

  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return { status: "error", message: "Item not found." };
  if (item.saleMode === "WEIGHT") {
    return { status: "error", message: "Use the weight control to update this item." };
  }

  const available = item.variant ? item.variant.stock : item.product.stock;
  if (parsedQty.data > available) {
    return { status: "error", message: `Only ${available} available.` };
  }

  await db.cartItem.update({ where: { id: itemId }, data: { quantity: parsedQty.data } });
  revalidatePath("/cart");
  return { status: "success" };
}

export async function updateCartItemWeight(
  itemId: string,
  grams: number,
): Promise<CartActionState> {
  const parsedWeight = weightSchema.safeParse(grams);
  if (!parsedWeight.success) {
    return { status: "error", message: "Choose a valid weight." };
  }

  const cart = await getCart();
  if (!cart) return { status: "error", message: "Your cart has expired." };

  const item = cart.items.find((i) => i.id === itemId);
  if (!item || item.saleMode !== "WEIGHT") {
    return { status: "error", message: "Item not found." };
  }

  if (maxWeightGrams(item.product.stock) < MIN_WEIGHT_GRAMS) {
    return {
      status: "error",
      message: "This product is out of stock. Please remove it from your cart.",
    };
  }
  if (!isValidWeightGrams(parsedWeight.data, item.product.stock)) {
    return {
      status: "error",
      message: `Choose a weight from ${MIN_WEIGHT_GRAMS}g to ${formatWeight(maxWeightGrams(item.product.stock))}, in ${WEIGHT_STEP_GRAMS}g steps.`,
    };
  }

  const lineKey = `${item.productId}:weight:${parsedWeight.data}`;
  const conflict = cart.items.find(
    (candidate) => candidate.id !== itemId && candidate.lineKey === lineKey,
  );
  if (conflict) {
    return {
      status: "error",
      message: "That weight is already in your cart.",
    };
  }

  await db.cartItem.update({
    where: { id: itemId },
    data: { weightGrams: parsedWeight.data, lineKey, quantity: 1 },
  });
  revalidatePath("/cart");
  revalidatePath("/");
  return { status: "success" };
}

export async function removeCartItem(itemId: string): Promise<CartActionState> {
  const cart = await getCart();
  if (!cart) return { status: "error", message: "Your cart has expired." };

  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidatePath("/cart");
  revalidatePath("/");
  return { status: "success" };
}

export async function clearCart(): Promise<CartActionState> {
  const cart = await getCart();
  if (!cart) return { status: "success" };
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/cart");
  return { status: "success" };
}

export async function buyNow(
  productId: string,
  variantId: string | null,
  quantity: number,
  weightGrams?: number,
) {
  const result = await addToCart(productId, variantId, quantity, weightGrams);
  if (result.status === "error") return result;
  redirect("/checkout");
}
