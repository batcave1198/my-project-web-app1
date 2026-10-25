/**
 * Idempotent seed for Ceylon Herbs and Spices.
 *
 * Run with: npm run db:seed
 *
 * It creates:
 *  - the initial administrator (password never overwritten once set)
 *  - default store settings (never overwritten once set)
 *  - one island-wide shipping zone with all 25 districts (no rates invented)
 *  - a starter category tree (editable in the admin dashboard)
 *  - a small set of factual FAQ entries
 *
 * It deliberately creates NO products. The catalogue starts empty so nothing
 * fake can be shipped to a customer.
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

const categories = [
  {
    name: "Ceylon Cinnamon",
    slug: "ceylon-cinnamon",
    description:
      "Cinnamon grown in Sri Lanka — quills, sticks and ground powder.",
  },
  {
    name: "Whole Spices",
    slug: "whole-spices",
    description:
      "Peppercorns, cloves, cardamom, nutmeg and other whole spices.",
  },
  {
    name: "Ground Spices",
    slug: "ground-spices",
    description: "Freshly ground spices for everyday cooking and baking.",
  },
  {
    name: "Dried Herbs",
    slug: "dried-herbs",
    description: "Dried leaves and herbs for curries, teas and infusions.",
  },
  {
    name: "Herbal Teas",
    slug: "herbal-teas",
    description: "Caffeine-free herbal infusions and tea blends.",
  },
  {
    name: "Natural Products",
    slug: "natural-products",
    description: "Coconut, clay, oil and other everyday natural goods.",
  },
  {
    name: "Gift Packs",
    slug: "gift-packs",
    description: "Curated sets packed for gifting.",
  },
  {
    name: "Curry Powders",
    slug: "curry-powders",
    description: "Sri Lankan curry powder blends, roasted and unroasted.",
  },
  {
    name: "Bulk & Wholesale",
    slug: "bulk-wholesale",
    description: "Larger packs for kitchens, cafés and resellers.",
  },
];

const faqItems = [
  {
    question: "Can I order without creating an account?",
    answer:
      "Yes. Guest checkout is available. Creating an account lets you keep addresses, view order history and maintain a wishlist.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Every order has a tracking page. Once the order is shipped, the courier and tracking number are added and shown on that page.",
  },
  {
    question: "Which payment methods are accepted?",
    answer:
      "Card payments are processed through PayHere, a Sri Lankan payment gateway. Card details are entered on the payment gateway, not on this store.",
  },
  {
    question: "How is delivery charged?",
    answer:
      "Delivery rates depend on the destination district and are shown at checkout before you confirm an order. The available rates are configured by the store.",
  },
  {
    question: "How do I ask about a product or a bulk order?",
    answer:
      "Use the contact form and include the product name and quantity. We reply to the email address you provide.",
  },
];

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (!email) {
    throw new Error(
      "SEED_ADMIN_EMAIL is missing. Set it in .env before running the seed.",
    );
  }

  if (password.length < 10) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be at least 10 characters. Set it in .env.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", isActive: true },
    });
    console.log(`✓ Admin already exists (${email}) — password left unchanged`);
    return;
  }

  const passwordHash = await hash(password, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    algorithm: 2, // Argon2id — see src/lib/auth/password.ts
  });

  await prisma.user.create({
    data: {
      email,
      name: "Store Administrator",
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✓ Admin created (${email})`);
}

async function seedSettings() {
  await prisma.siteSetting.upsert({
    where: { key: "store" },
    update: {},
    create: {
      key: "store",
      value: {
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
        social: { facebook: "", instagram: "", tiktok: "", youtube: "" },
        freeShippingThreshold: null,
        currency: "USD",
      },
    },
  });

  console.log("✓ Store settings ready");
}

async function seedShipping() {
  const existing = await prisma.shippingZone.count();

  if (existing > 0) {
    console.log("✓ Shipping zones already configured — left untouched");
    return;
  }

  await prisma.shippingZone.create({
    data: {
      name: "Sri Lanka",
      districts: SRI_LANKA_DISTRICTS,
      isActive: true,
      sortOrder: 0,
      // No delivery methods are seeded on purpose: charges and timeframes are
      // commercial decisions that must be set by the store owner.
    },
  });

  console.log("✓ Island-wide shipping zone created (no rates set)");
}

async function seedCategories() {
  let created = 0;

  for (const [index, category] of categories.entries()) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: true,
        sortOrder: index,
      },
    });
    created += 1;
  }

  console.log(
    created > 0
      ? `✓ ${created} categories created`
      : "✓ Categories already present — left untouched",
  );
}

async function seedFaq() {
  const existing = await prisma.faqCategory.count();
  if (existing > 0) {
    console.log("✓ FAQ already configured — left untouched");
    return;
  }

  const category = await prisma.faqCategory.create({
    data: {
      name: "Ordering & Delivery",
      slug: "ordering-delivery",
      sortOrder: 0,
      isActive: true,
    },
  });

  await prisma.faqItem.createMany({
    data: faqItems.map((item, index) => ({
      categoryId: category.id,
      question: item.question,
      answer: item.answer,
      sortOrder: index,
      isActive: true,
    })),
  });

  console.log(`✓ ${faqItems.length} FAQ entries created`);
}

async function main() {
  console.log("\nSeeding Ceylon Herbs and Spices…\n");

  await seedAdmin();
  await seedSettings();
  await seedShipping();
  await seedCategories();
  await seedFaq();

  console.log("\nDone.\n");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
