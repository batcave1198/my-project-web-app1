import "server-only";
import ExcelJS from "exceljs";
import { assertStaff } from "@/lib/auth/dal";

export const runtime = "nodejs";

export async function GET() {
  const auth = await assertStaff();
  if (!auth.ok) {
    return new Response(auth.status === 401 ? "Unauthorized" : "Forbidden", {
      status: auth.status,
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ceylon Herbs and Spices";
  workbook.created = new Date();

  const products = workbook.addWorksheet("Products", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  products.columns = [
    { header: "product_id", key: "product_id", width: 22 },
    { header: "name", key: "name", width: 32 },
    { header: "price_usd", key: "price_usd", width: 14 },
    { header: "category", key: "category", width: 22 },
    { header: "sale_mode", key: "sale_mode", width: 14 },
    { header: "stock", key: "stock", width: 14 },
    { header: "status", key: "status", width: 14 },
    { header: "slug", key: "slug", width: 26 },
    { header: "compare_at_price", key: "compare_at_price", width: 18 },
    { header: "short_description", key: "short_description", width: 36 },
    { header: "description", key: "description", width: 50 },
    { header: "image_urls", key: "image_urls", width: 36 },
    { header: "tags", key: "tags", width: 24 },
    { header: "is_featured", key: "is_featured", width: 14 },
  ];

  products.addRow({
    product_id: "CHS-SAMPLE-001",
    name: "Sample product",
    price_usd: 4.99,
    category: "ground-spices",
    sale_mode: "UNIT",
    stock: 25,
    status: "DRAFT",
    slug: "sample-product",
    compare_at_price: 6.5,
    short_description: "Short description",
    description: "Longer description with the product details.",
    image_urls: "/images/products/example.jpg",
    tags: "sample|spice",
    is_featured: "false",
  });

  const header = products.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF173D2B" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 24;

  products.getColumn("price_usd").numFmt = "0.00";
  products.getColumn("compare_at_price").numFmt = "0.00";
  products.getColumn("stock").numFmt = "0";
  products.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: rowNumber > 1 };
  });

  const notes = workbook.addWorksheet("Instructions");
  notes.columns = [{ width: 30 }, { width: 100 }];
  notes.addRows([
    ["Column", "Notes"],
    [
      "product_id",
      "Required. Unique product ID / SKU. Each ID may appear only once in the file.",
    ],
    [
      "name",
      "Required. Product display name (2–200 characters).",
    ],
    [
      "price_usd",
      "Required. USD price. For WEIGHT products this is the price per 100g.",
    ],
    [
      "category",
      "Required. Existing category slug or exact category name.",
    ],
    [
      "sale_mode",
      "Optional. UNIT (packets/items) or WEIGHT (grams). Defaults to UNIT for new products and keeps the existing mode for updates.",
    ],
    [
      "stock",
      "Optional. Units available for UNIT products, or total grams available for WEIGHT products.",
    ],
    ["status", "Optional. DRAFT, PUBLISHED or ARCHIVED."],
    ["slug", "Optional. Generated from the name when omitted."],
    [
      "compare_at_price",
      "Optional. USD compare-at price per unit or per 100g for WEIGHT products.",
    ],
    ["short_description", "Optional. Short storefront summary."],
    ["description", "Optional. Full product description."],
    [
      "image_urls",
      "Optional. Local paths under /uploads/ or /images/, separated by |.",
    ],
    ["tags", "Optional. Comma- or pipe-separated tags."],
    ["is_featured", "Optional. true/false, yes/no or 1/0."],
  ]);
  const notesHeader = notes.getRow(1);
  notesHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  notesHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF173D2B" },
  };
  notes.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: rowNumber > 1 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="product-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
