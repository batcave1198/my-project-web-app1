import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { defaultSocialLinks, type SocialLinks } from "@/lib/site";

export type StoreSettings = {
  storeEmail: string;
  storePhone: string;
  whatsapp: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  businessHours: string;
  announcement: string;
  social: SocialLinks;
  /** Minor units. Null means free delivery is not configured. */
  freeShippingThreshold: number | null;
  currency: string;
};

const SETTINGS_KEY = "store";

const defaults: StoreSettings = {
  storeEmail: "",
  storePhone: "",
  whatsapp: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  postalCode: "",
  businessHours: "",
  announcement: "",
  social: { ...defaultSocialLinks },
  freeShippingThreshold: null,
  currency: "USD",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mergeSettings(raw: unknown): StoreSettings {
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Record<string, unknown>;
  const socialRaw =
    value.social && typeof value.social === "object"
      ? (value.social as Record<string, unknown>)
      : {};

  return {
    storeEmail: asString(value.storeEmail) || defaults.storeEmail,
    storePhone: asString(value.storePhone) || defaults.storePhone,
    whatsapp: asString(value.whatsapp) || defaults.whatsapp,
    addressLine1: asString(value.addressLine1),
    addressLine2: asString(value.addressLine2),
    city: asString(value.city),
    district: asString(value.district),
    postalCode: asString(value.postalCode),
    businessHours: asString(value.businessHours),
    announcement: asString(value.announcement),
    social: {
      facebook: asString(socialRaw.facebook),
      instagram: asString(socialRaw.instagram),
      tiktok: asString(socialRaw.tiktok),
      youtube: asString(socialRaw.youtube),
    },
    freeShippingThreshold:
      typeof value.freeShippingThreshold === "number"
        ? value.freeShippingThreshold
        : null,
    currency: asString(value.currency) || defaults.currency,
  };
}

/**
 * Admin-managed store details. Cached for the render pass, and deliberately
 * tolerant: an empty value renders nothing rather than a fake placeholder.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const row = await db.siteSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });
    return row ? mergeSettings(row.value) : defaults;
  } catch {
    // Database not reachable during a build or first boot — fall back safely.
    return defaults;
  }
});

export function hasSocialLinks(social: SocialLinks) {
  return Object.values(social).some((value) => value.length > 0);
}

export function formatAddress(settings: StoreSettings) {
  return [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.district,
    settings.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}
