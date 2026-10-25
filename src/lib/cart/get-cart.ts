import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const CART_COOKIE = "chai_cart";
const CART_TTL_DAYS = 30;

export async function getOrCreateCart() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CART_COOKIE)?.value;

  if (existingToken) {
    const cart = await db.cart.findUnique({
      where: { token: existingToken },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
            },
            variant: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (cart && cart.expiresAt > new Date()) {
      return cart;
    }
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + CART_TTL_DAYS * 24 * 60 * 60 * 1000);

  const cart = await db.cart.create({
    data: { token, expiresAt },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
          },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  cookieStore.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return cart;
}

export async function getCart() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return null;

  const cart = await db.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
          },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart || cart.expiresAt < new Date()) return null;
  return cart;
}

export async function getCartCount() {
  const cart = await getCart();
  if (!cart) return 0;
  return cart.items.reduce(
    (sum, item) => sum + (item.saleMode === "WEIGHT" ? 1 : item.quantity),
    0,
  );
}
