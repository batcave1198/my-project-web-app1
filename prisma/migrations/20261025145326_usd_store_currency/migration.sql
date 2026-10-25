-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- One-time conversion of catalogue values from LKR to USD.
-- Rate: 300 LKR = 1 USD. Historical orders/payments keep their original
-- currency and are deliberately not rewritten.
UPDATE "Product"
SET
  "price" = ROUND("price" / 300, 2),
  "compareAtPrice" = CASE
    WHEN "compareAtPrice" IS NULL THEN NULL
    ELSE ROUND("compareAtPrice" / 300, 2)
  END,
  "discountValue" = CASE
    WHEN "discountType" = 'FIXED' THEN ROUND("discountValue" / 300, 2)
    ELSE "discountValue"
  END;

UPDATE "ProductVariant"
SET
  "price" = ROUND("price" / 300, 2),
  "compareAtPrice" = CASE
    WHEN "compareAtPrice" IS NULL THEN NULL
    ELSE ROUND("compareAtPrice" / 300, 2)
  END;

UPDATE "ShippingMethod"
SET
  "price" = ROUND("price" / 300, 2),
  "freeOverAmount" = CASE
    WHEN "freeOverAmount" IS NULL THEN NULL
    ELSE ROUND("freeOverAmount" / 300, 2)
  END;

UPDATE "GlobalDiscount"
SET "value" = ROUND("value" / 300, 2)
WHERE "type" = 'FIXED';

UPDATE "Coupon"
SET
  "value" = CASE
    WHEN "type" = 'FIXED' AND "value" IS NOT NULL THEN ROUND("value" / 300, 2)
    ELSE "value"
  END,
  "minSubtotal" = CASE
    WHEN "minSubtotal" IS NULL THEN NULL
    ELSE ROUND("minSubtotal" / 300, 2)
  END,
  "maxDiscount" = CASE
    WHEN "maxDiscount" IS NULL THEN NULL
    ELSE ROUND("maxDiscount" / 300, 2)
  END;

UPDATE "SiteSetting"
SET "value" = jsonb_set("value"::jsonb, '{currency}', '"USD"'::jsonb)
WHERE "key" = 'store';
