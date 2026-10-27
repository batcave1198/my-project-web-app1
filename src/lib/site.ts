/**
 * Static store configuration.
 *
 * Anything a shop owner would want to change without a deploy lives in the
 * SiteSetting table instead (contact details, delivery, policies...).
 * Public page copy and social links live in the editable `content/` folder.
 * This file only holds structure and safe defaults.
 */

export const siteConfig = {
  name: "Ceylon Herbs and Spices",
  shortName: "Ceylon Herbs",
  tagline: "Sri Lankan herbs, spices and natural products",
  description:
    "Ceylon Herbs and Spices brings Sri Lankan herbs, spices and natural products to your kitchen — sourced with care, packed for freshness, and delivered island-wide.",
  locale: "en_US",
  currency: "USD",
  country: "Sri Lanka",
  /** Replace through admin settings once the domain is live. */
  defaultUrl: "http://localhost:3000",
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "/deals" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Blogs", href: "/blogs" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  shop: [
    { label: "All Products", href: "/shop" },
    { label: "Categories", href: "/categories" },
    { label: "New Arrivals", href: "/shop?sort=newest" },
    { label: "Deals & Offers", href: "/deals" },
  ],
  customer: [
    { label: "My Account", href: "/account" },
    { label: "My Orders", href: "/account/orders" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Customer Reviews", href: "/reviews" },
    { label: "Cart", href: "/cart" },
  ],
  help: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Delivery", href: "/shipping" },
    { label: "Returns & Refunds", href: "/returns" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Gallery", href: "/gallery" },
    { label: "Blogs & Recipes", href: "/blogs" },
    { label: "Contact Us", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
} as const;

/**
 * Social links stay hidden until an administrator configures them — we never
 * link to accounts the business has not confirmed.
 */
export const defaultSocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
} as const;

export type SocialLinks = { [K in keyof typeof defaultSocialLinks]: string };

export const paymentMethods = ["Visa", "Mastercard", "Amex", "PayHere"];
