import "server-only";
import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { parse } from "yaml";

/**
 * Storefront paragraph copy.
 *
 * The values below are the fallback used when content/site-copy.yaml is
 * missing or a key is not present. The YAML file is read at request time, so
 * copy can be corrected on the server and picked up after a page refresh
 * without rebuilding the Next.js app.
 */
export const defaultSiteCopy = {
  common: {
    brandDescription:
      "Ceylon Herbs and Spices brings Sri Lankan herbs, spices and natural products to your kitchen — sourced with care, packed for freshness, and delivered island-wide.",
    contactCta: "Contact us",
  },
  footer: {
    description:
      "Ceylon Herbs and Spices brings Sri Lankan herbs, spices and natural products to your kitchen — sourced with care, packed for freshness, and delivered island-wide.",
  },
  home: {
    hero: {
      eyebrow: "Pure Ceylon herbs & spices",
      titleTop: "The island’s finest pantry,",
      titleAccent: "brought to yours.",
      body:
        "Ceylon Herbs and Spices is a home for Ceylon cinnamon, whole spices, dried herbs and herbal teas — each product described honestly, with its origin, ingredients and packing details in plain sight.",
      bodySecondary:
        "Sourced from Sri Lanka and packed with care, our collection brings the true aroma and character of Ceylon spices straight to your kitchen.",
      primaryCta: "Shop the collection",
      secondaryCta: "Our story",
      stats: [
        {
          title: "Secure checkout",
          copy: "Payments verified server-side",
        },
        {
          title: "Order tracking",
          copy: "Follow every stage",
        },
        {
          title: "Clear details",
          copy: "Ingredients & origin listed",
        },
      ],
    },
    categories: {
      eyebrow: "Browse the pantry",
      title: "Every shelf of a Sri Lankan kitchen",
      description:
        "Categories are managed from the admin dashboard, so this list always reflects what the store actually carries.",
      action: "All categories",
      emptyTitle: "The first collection is being prepared",
      emptyCopy:
        "Categories added in the admin dashboard will appear here automatically. Nothing is hardcoded into the storefront.",
    },
    featured: {
      eyebrow: "Hand-picked for the pantry",
      title: "Featured products",
      description:
        "A curated selection of our most-loved Ceylon herbs and spices.",
      action: "View all",
    },
    newArrivals: {
      eyebrow: "Fresh from the pantry",
      title: "New arrivals",
      description:
        "Recently added products, pulled straight from the catalogue.",
      action: "Shop newest",
    },
    story: {
      eyebrow: "Why Ceylon",
      title: "Spices with a place name, not just a label.",
      body:
        "Ceylon cinnamon is named after the island it comes from. The same is true of the pepper, cardamom, cloves, turmeric and ginger that fill Sri Lankan kitchens — each with a character shaped by where it grows.",
      bodySecondary:
        "Our aim is simple: describe every product accurately, publish the details a buyer actually needs, and let the spice speak for itself. Where a detail is not verified, we leave it out rather than dress it up.",
      cta: "Read our story",
    },
    highlights: {
      eyebrow: "Icons of Ceylon",
      title: "Spice highlights",
      description:
        "Time-honoured Sri Lankan staples — cinnamon, pepper, cloves and cardamom. Browse them directly from the shop.",
      action: "Browse all spices",
      items: [
        {
          name: "Ceylon Cinnamon",
          slug: "ceylon-cinnamon",
          description: "Sweet, warm and delicately fragrant.",
        },
        {
          name: "Black Pepper",
          slug: "black-pepper",
          description: "Bold, earthy heat for everyday cooking.",
        },
        {
          name: "Cloves",
          slug: "cloves",
          description: "Rich, aromatic and deeply warm.",
        },
        {
          name: "Cardamom",
          slug: "cardamom",
          description: "Floral, sweet and distinctly Ceylon.",
        },
      ],
    },
    values: {
      eyebrow: "How we sell",
      title: "A straightforward shopping experience",
      items: [
        {
          title: "Server-verified payments",
          copy:
            "Orders are only marked paid after the payment gateway confirms the transaction server-side.",
        },
        {
          title: "Order tracking that works",
          copy:
            "Guest and account orders both get a tracked timeline from confirmation through delivery.",
        },
        {
          title: "Details before you buy",
          copy:
            "Ingredients, origin, packing, storage and usage notes are shown on every product where provided.",
        },
      ],
    },
    newsletter: {
      title: "New arrivals and seasonal offers",
      body:
        "Occasional emails about new spices, gift packs and discounts. No daily noise, and you can unsubscribe at any time.",
    },
  },
  about: {
    hero: {
      eyebrow: "Our story",
      title: "Built around one island’s pantry.",
      body:
        "Ceylon Herbs and Spices is an online store for Sri Lankan herbs, spices and natural products. Our job is simple: make it easy to see exactly what you are buying, where it comes from and what is inside the packet.",
      bodySecondary:
        "From the finest Ceylon cinnamon to hand-selected whole spices and dried herbs, every product we list is chosen with care and described with honesty. We believe good cooking starts with knowing your ingredients — so clarity comes before anything else.",
    },
    why: {
      eyebrow: "Why Ceylon",
      title: "A place name that means something",
      body:
        "Ceylon cinnamon is named after the island it comes from, and it is not the only spice with a Sri Lankan identity. Pepper, cardamom, cloves, nutmeg, turmeric and ginger all grow here, each shaped by the soil and climate of the region it comes from.",
      bodySecondary:
        "The island’s food culture is built on these ingredients — tempered in coconut oil, ground fresh, added at the right moment. We want the same pantry to be available to anyone who wants to cook with it, wherever they live.",
      bodyTertiary:
        "That is the whole idea. No mythology, no miracle claims. Just good ingredients, clearly described.",
    },
    range: {
      title: "What you will find here",
      items: [
        "Ceylon cinnamon and cinnamon products",
        "Whole and ground spices",
        "Dried herbs and herbal teas",
        "Natural products and gift packs",
        "Bulk quantities for kitchens and resellers",
        "Seasonal and limited offers",
      ],
    },
    standards: {
      eyebrow: "How we work",
      title: "The standards we hold ourselves to",
      intro:
        "A store is only as good as the claims it is willing to leave out.",
      items: [
        {
          title: "Accurate product details",
          copy:
            "Ingredients, origin, packing, storage and usage notes are published on the product page wherever the information is available.",
        },
        {
          title: "No invented credentials",
          copy:
            "We do not display organic, fair-trade or quality certifications unless they have actually been granted and can be shown.",
        },
        {
          title: "No medical claims",
          copy:
            "Herbs and spices are sold as food, not medicine. Nothing on this site is presented as treating or preventing illness.",
        },
        {
          title: "Reviews that are moderated",
          copy:
            "Customer reviews are checked before publication. We do not write reviews on a customer’s behalf.",
        },
      ],
    },
    exclusions: {
      title: "What you will not find on a product page",
      body:
        "Certification logos we have not earned, health claims, invented supplier stories, or reviews written by us. If a detail is unverified, it does not go on the page.",
    },
    cta: {
      title: "Questions before you order?",
      body: "Ask about a product, a bulk quantity or delivery.",
      primary: "Contact us",
      secondary: "Browse categories",
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Talk to us",
      body:
        "Questions about a product, a bulk order or an existing purchase? Send a message and it goes straight to the store’s inbox.",
      bodySecondary:
        "Whether you need help choosing the right spice for your recipe or want to enquire about larger quantities, we are happy to help.",
    },
    details: {
      title: "Store details",
      empty:
        "Direct phone and email details have not been published yet. The form reaches the same inbox, so please use it in the meantime.",
      quickTitle: "Looking for a quick answer?",
      quickBody:
        "The FAQ covers delivery, returns and account questions.",
    },
    form: {
      title: "Send a message",
      body: "All fields marked required must be completed.",
    },
  },
  gallery: {
    hero: {
      eyebrow: "Gallery",
      title: "A closer look at Ceylon Herbs and Spices",
      body:
        "Visit our kitchen, our packing table and the landscapes behind the spices. Browse photos and videos from the world of Ceylon Herbs and Spices.",
    },
    empty: {
      title: "The gallery is being prepared",
      body:
        "Photos and videos will appear here soon. In the meantime, explore our herbs and spices in the shop.",
      action: "Shop all products",
    },
  },
  reviews: {
    hero: {
      eyebrow: "Customer stories",
      title: "Reviews from our kitchen",
      body:
        "Real ratings, honest words and customer photos. Reviews are checked by our team before they are published.",
      action: "Share your review",
    },
    empty: {
      title: "No reviews published yet",
      body:
        "Be the first to share what you made with a Ceylon Herbs product. Approved reviews appear here with your photos.",
    },
    form: {
      eyebrow: "Add your experience",
      title: "Tell other cooks what you think",
      body:
        "Choose the product you bought, give it one to five stars and add up to four photos. Your review is sent to our team for approval before it appears on the storefront.",
      note:
        "By submitting a review you confirm it reflects your own experience. Reviews that contain personal information, unrelated links or abusive language are not published.",
      browse: "Browse products",
      gallery: "View photo gallery",
    },
  },
  shop: {
    eyebrow: "Shop",
    title: "All products",
    searchPlaceholder: "Search products...",
    filters: "Categories",
    all: "All",
    emptyTitle: "No products found",
    emptyBody: "Try adjusting your filters or search.",
    clear: "Clear filters",
  },
  categories: {
    hero: {
      eyebrow: "Catalogue",
      title: "Shop by category",
      body:
        "Explore Sri Lankan herbs, spices, teas and natural products by category. Each collection lists only products that are published and ready to order.",
    },
    empty: {
      title: "No categories published yet",
      body:
        "As soon as a category is added in the admin dashboard it appears here — no deploy required.",
      action: "Get in touch",
    },
  },
  deals: {
    eyebrow: "Offers",
    title: "Offers appear here when they are live",
    body:
      "Store-wide discounts and coupon codes are created in the admin dashboard with start and end dates. Nothing is advertised unless it is genuinely active.",
    action: "Browse categories",
  },
  wishlist: {
    eyebrow: "Saved items",
    signedInTitle: "Your wishlist is empty",
    signedOutTitle: "Sign in to save products",
    body:
      "Wishlists are tied to your account so they follow you between devices. The feature is enabled together with the product catalogue.",
    browse: "Browse products",
    signIn: "Sign in",
    register: "Create an account",
  },
  cart: {
    eyebrow: "Cart",
    title: "Your cart",
    continueShopping: "Continue shopping",
    summary: "Order summary",
    subtotal: "Subtotal",
    delivery: "Calculated at checkout",
    total: "Total",
    checkout: "Checkout",
    securityNote:
      "Card payments are handled by PayHere. We never see your card details.",
    deliveryNote:
      "Delivery options and rates are confirmed before payment.",
    emptyTitle: "Your cart is empty",
    emptyBody: "Add a product from the shop to get started.",
    emptyAction: "Browse products",
  },
  checkout: {
    eyebrow: "Secure checkout",
    title: "Complete your order",
    paymentNote: "Encrypted payment via PayHere",
    back: "Back to cart",
    success: {
      paidTitle: "Thank you — payment received",
      paidBody:
        "Your order is confirmed. We have emailed a copy of this receipt to {email} and will let you know as it moves through packing and delivery.",
      failedTitle: "Payment did not complete",
      cancelledBody: "This order was cancelled before payment was confirmed.",
      failedBody:
        "PayHere reported that the payment failed. No money has been taken for this order.",
      backToShop: "Back to the shop",
      orderDetails: "Order details",
      pendingTitle: "Confirming your payment",
      pendingBody:
        "PayHere has returned you to our store. We are waiting for the server-side payment notification before confirming the order. This page refreshes automatically — it usually takes a few seconds.",
      pendingNote:
        "Keep this page open. If it stays on this message, contact us with order number {order}.",
      continueShopping: "Continue shopping",
      help: "Need help with this order?",
    },
    failed: {
      alreadyPaidTitle: "This order is already paid",
      alreadyPaidBody:
        "Payment for {order} has been confirmed. You can view the receipt on the confirmation page.",
      viewReceipt: "View receipt",
      title: "Your payment was not completed",
      body:
        "The order below has not been paid, so it has not been confirmed. Nothing has been charged. You can put the same items back into your cart and try again, or choose a different payment attempt from checkout.",
      restore: "Return items to cart",
      continueShopping: "Continue shopping",
      contact: "Contact us",
    },
  },
  faq: {
    hero: {
      eyebrow: "Help centre",
      title: "Frequently asked questions",
      body:
        "Everything below is managed in the admin dashboard, so the answers stay current with how the store actually operates.",
    },
    empty: {
      title: "No questions published yet",
      body:
        "FAQ entries added in the admin dashboard appear here. In the meantime, send us a question and we will answer it directly.",
      action: "Ask a question",
    },
    footer: {
      title: "Still stuck?",
      body: "Send us a message and we will reply by email.",
      action: "Contact support",
    },
  },
  auth: {
    login: {
      eyebrow: "Account",
      title: "Welcome back",
      body: "Sign in to track orders, save your details and keep a wishlist.",
      mfaTitle: "Two-step verification",
      mfaBodyPrefix: "Enter the code from the authenticator app for",
      mfaBodySuffix: ".",
    },
    register: {
      eyebrow: "Account",
      title: "Create your account",
      body:
        "Save delivery details, follow your orders and build a wishlist. You can still check out as a guest.",
    },
    forgot: {
      eyebrow: "Account",
      title: "Forgot your password?",
      body:
        "Enter the email address on your account and we will send a one-time reset link.",
    },
    reset: {
      eyebrow: "Account",
      title: "Choose a new password",
      body:
        "This link can only be used once. After updating, you will be signed out of every device.",
      invalidTitle: "Invalid reset link",
      invalidBody:
        "This link is missing its token. Request a new password reset email.",
      newLink: "Request a new link",
    },
  },
  product: {
    beFirstReview: "Be the first to review this product",
    recipeStory: "Recipe & story",
    deliveryTitle: "Delivery",
    deliveryBody:
      "Delivery rates are calculated at checkout based on your district.",
    descriptionTitle: "Description",
    detailsTitle: "Product details",
    reviewsEyebrow: "Customer feedback",
    reviewsTitle: "Reviews",
    reviewsBasedOn: "Based on",
    reviewsEmpty:
      "No approved reviews yet. Share your experience with other customers.",
    allReviews: "All customer reviews",
    writeReview: "Write a review",
    noReviewsTitle: "No reviews to show yet",
    noReviewsBody: "Approved reviews and customer photos will appear here.",
    relatedTitle: "Related products",
  },
  blogs: {
    hero: {
      eyebrow: "From our kitchen",
      title: "Blogs & Recipes",
      body:
        "Recipes, serving ideas and stories built around Sri Lankan herbs and spices. Each post can be linked to the products used in the recipe.",
      action: "Customer reviews",
    },
    empty: {
      title: "No stories published yet",
      body:
        "Recipes and stories will appear here as soon as they are published.",
      action: "Browse the shop",
    },
    detail: {
      back: "Back to blogs & recipes",
      eyebrow: "Recipe & story",
      published: "Published",
      cookTitle: "Cook with these",
      noProducts:
        "This story is not linked to a product yet. Browse our range to find the ingredients for your next meal.",
      exploreShop: "Explore the shop",
      madeTitle: "Made this recipe?",
      madeBody:
        "Leave a review with a photo on the product page. Approved photos appear in our customer gallery.",
      readReviews: "Read customer reviews",
    },
  },
  policies: {
    pendingTitle: "This policy is being finalised",
    pendingBody:
      "The full text is reviewed and approved by the business before it is published. Nothing on this page is a substitute for that review, and no legal terms are invented here.",
    pendingContact:
      "If you need an answer now, contact us and we will help directly.",
    contactCta: "Contact us",
    privacy: {
      title: "Privacy Policy",
      description:
        "How we collect, use and protect personal information is being documented and reviewed before publication.",
      contact:
        "For a privacy question about your account or an order, contact us and we will respond directly.",
    },
    terms: {
      title: "Terms & Conditions",
      description:
        "The terms that govern accounts, orders, payments and delivery are being prepared with the business and will be published here in full.",
      contact:
        "If you need clarity on any term before placing an order, contact us and we will answer directly.",
    },
    cookie: {
      title: "Cookie Policy",
      description:
        "The store uses a small number of essential cookies for sign-in and cart session handling. A full cookie policy is being prepared.",
      contact:
        "If you have a question about cookies or tracking, contact us and we will explain exactly what is used.",
    },
    shipping: {
      eyebrow: "Help",
      title: "Shipping & Delivery",
      description:
        "Delivery zones, charges and estimated timeframes are set in the admin dashboard and shown at checkout before an order is placed.",
      contact:
        "If you need a delivery estimate for a specific district before ordering, contact us with your location.",
    },
    returns: {
      eyebrow: "Help",
      title: "Returns & Refunds",
      description:
        "The returns window, eligibility conditions and refund process are being reviewed and will be published here in full.",
      contact:
        "If something is wrong with an order you have received, contact us with the order number so we can help.",
    },
  },
} as const satisfies Record<string, unknown>;

type DeepWritable<T> = {
  -readonly [K in keyof T]: T[K] extends readonly (infer U)[]
    ? DeepWritable<U>[]
    : T[K] extends object
      ? DeepWritable<T[K]>
      : T[K];
};

export type SiteCopy = DeepWritable<typeof defaultSiteCopy>;

/** Replace `{name}` placeholders in editable copy with runtime values. */
export function fillCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeCopy<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override)) return base;

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    if (Array.isArray(value)) {
      // Lists replace the default list, but only if the shape matches.
      if (Array.isArray(current)) result[key] = value;
    } else if (isRecord(current) && isRecord(value)) {
      result[key] = mergeCopy(current, value);
    } else if (
      current !== undefined &&
      !isRecord(current) &&
      !Array.isArray(current) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
    ) {
      // Unknown keys and type mismatches are ignored instead of corrupting
      // the page data from a hand-edited YAML file.
      result[key] = value;
    }
  }
  return result as T;
}

async function readYamlFile(filename: string) {
  const file = path.join(process.cwd(), "content", filename);
  const source = await readFile(file, "utf8");
  return parse(source) as unknown;
}

/**
 * Copy is read per request. `connection()` makes sure Next.js does not bake the
 * YAML values into a static page at build time.
 */
export const getSiteCopy = cache(async (): Promise<SiteCopy> => {
  await connection();
  try {
    return mergeCopy(
      defaultSiteCopy as unknown as SiteCopy,
      await readYamlFile("site-copy.yaml"),
    );
  } catch (error) {
    console.warn("[content] could not read content/site-copy.yaml", error);
    return defaultSiteCopy as unknown as SiteCopy;
  }
});

const emptySocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
};

export type SocialLinksContent = typeof emptySocialLinks;

function validSocialUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

/**
 * Social links are intentionally file-based so they can be corrected without
 * touching the database or rebuilding the storefront.
 */
export const getSocialLinks = cache(async (): Promise<SocialLinksContent> => {
  await connection();
  try {
    const parsed = await readYamlFile("social-links.yaml");
    const values = isRecord(parsed) ? parsed : {};
    return {
      facebook: validSocialUrl(values.facebook),
      instagram: validSocialUrl(values.instagram),
      tiktok: validSocialUrl(values.tiktok),
      youtube: validSocialUrl(values.youtube),
    };
  } catch (error) {
    console.warn("[content] could not read content/social-links.yaml", error);
    return { ...emptySocialLinks };
  }
});
