import {
  Prisma,
  type ImportMode,
  type ProductSaleMode,
  type ProductStatus,
} from "@prisma/client";
import ExcelJS from "exceljs";
import { parseCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 1000;
const MAX_IMAGES = 12;

const MODES: ImportMode[] = ["CREATE_ONLY", "UPDATE_ONLY", "UPSERT"];
const STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const SALE_MODES: ProductSaleMode[] = ["UNIT", "WEIGHT"];

const HEADER_ALIASES: Record<string, string> = {
  product_id: "product_id",
  productid: "product_id",
  sku: "product_id",
  product_sku: "product_id",
  name: "name",
  product_name: "name",
  price_usd: "price_usd",
  price: "price_usd",
  usd_price: "price_usd",
  category: "category",
  category_slug: "category",
  category_name: "category",
  compare_at_price: "compare_at_price",
  compare_at_price_usd: "compare_at_price",
  compare_price: "compare_at_price",
  stock: "stock",
  quantity: "stock",
  qty: "stock",
  inventory: "stock",
  low_stock_alert: "low_stock_alert",
  low_stock: "low_stock_alert",
  status: "status",
  sale_mode: "sale_mode",
  selling_mode: "sale_mode",
  price_mode: "sale_mode",
  slug: "slug",
  short_description: "short_description",
  short_desc: "short_description",
  description: "description",
  image_urls: "image_urls",
  image_url: "image_urls",
  images: "image_urls",
  image: "image_urls",
  tags: "tags",
  is_featured: "is_featured",
  featured: "is_featured",
};

const REQUIRED_HEADERS = ["product_id", "name", "price_usd", "category"];

async function readImportTable(file: File): Promise<{
  rows: string[][];
  label: "CSV" | "Excel";
}> {
  if (/\.csv$/i.test(file.name)) {
    return { rows: parseCsv(await file.text()), label: "CSV" };
  }

  if (/\.xlsx$/i.test(file.name)) {
    const workbook = new ExcelJS.Workbook();
    const workbookBuffer = Buffer.from(await file.arrayBuffer());
    await workbook.xlsx.load(
      workbookBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
    );
    const sheet =
      workbook.getWorksheet("Products") ?? workbook.worksheets[0] ?? null;
    if (!sheet) {
      return { rows: [], label: "Excel" };
    }

    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values: string[] = [];
      for (let column = 1; column <= sheet.columnCount; column += 1) {
        const cell = row.getCell(column);
        values.push(cell.text == null ? "" : String(cell.text).trim());
      }
      if (values.some((value) => value !== "")) rows.push(values);
    });

    return { rows, label: "Excel" };
  }

  return { rows: [], label: "CSV" };
}

type ImportRowResult = {
  rowNumber: number;
  productId?: string;
  productDbId?: string;
  sku?: string;
  status: "CREATED" | "UPDATED" | "FAILED";
  message: string;
  warnings: string[];
};

export type ProductImportResult = {
  status: "idle" | "success" | "error";
  message?: string;
  jobId?: string;
  summary?: {
    total: number;
    created: number;
    updated: number;
    failed: number;
  };
  rows?: ImportRowResult[];
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asDecimal(raw: string | undefined): {
  value: number | null;
  error?: string;
} {
  if (raw === undefined || raw.trim() === "") return { value: null };
  const cleaned = raw.replace(/[$\s]/g, "").replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return { value: null, error: `"${raw}" is not a valid amount` };
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    return { value: null, error: `"${raw}" is not a valid amount` };
  }
  return { value };
}

function asInteger(raw: string | undefined): {
  value: number | null;
  error?: string;
} {
  if (raw === undefined || raw.trim() === "") return { value: null };
  const cleaned = raw.trim().replace(/,/g, "");
  if (!/^\d+$/.test(cleaned)) {
    return { value: null, error: `"${raw}" is not a whole number` };
  }
  return { value: Number(cleaned) };
}

function asBoolean(raw: string | undefined) {
  if (raw === undefined) return false;
  return ["1", "true", "yes", "y", "on", "featured"].includes(
    raw.trim().toLowerCase(),
  );
}

async function uniqueSlug(base: string, excludeProductId?: string) {
  const root = base || "product";
  for (let index = 1; index <= 1000; index += 1) {
    const candidate = index === 1 ? root : `${root}-${index}`;
    const clash = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === excludeProductId) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

export async function runProductImport({
  formData,
  requestedByUserId,
}: {
  formData: FormData;
  requestedByUserId: string;
}): Promise<ProductImportResult> {
  const file = formData.get("file");
  const rawMode = String(formData.get("mode") ?? "UPSERT");
  const mode = MODES.includes(rawMode as ImportMode)
    ? (rawMode as ImportMode)
    : "UPSERT";

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV or Excel file to import." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      status: "error",
      message: "File is too large. The maximum file size is 5 MB.",
    };
  }
  if (!/\.(csv|xlsx)$/i.test(file.name)) {
    return { status: "error", message: "Upload a .csv or .xlsx file." };
  }

  let importedTable: Awaited<ReturnType<typeof readImportTable>>;
  try {
    importedTable = await readImportTable(file);
  } catch (error) {
    console.error("[product-import] could not read file", error);
    return {
      status: "error",
      message:
        "The file could not be read. Check that it is a valid CSV or Excel workbook.",
    };
  }

  const { rows: table, label: fileLabel } = importedTable;
  if (table.length < 2) {
    return {
      status: "error",
      message: `The ${fileLabel} file needs a header row and at least one product row.`,
    };
  }

  const headerRow = table[0];
  const columns = new Map<string, number>();
  for (let index = 0; index < headerRow.length; index += 1) {
    const normalized = normalizeHeader(headerRow[index]);
    const key = HEADER_ALIASES[normalized];
    if (key && !columns.has(key)) columns.set(key, index);
  }

  const missing = REQUIRED_HEADERS.filter((key) => !columns.has(key));
  if (missing.length > 0) {
    return {
      status: "error",
      message: `Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(
        ", ",
      )}. Download the template to see the expected format.`,
    };
  }

  const bodyRows = table
    .slice(1)
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => row.some((cell) => cell.trim() !== ""));

  if (bodyRows.length === 0) {
    return { status: "error", message: `The ${fileLabel} file contains no product rows.` };
  }
  if (bodyRows.length > MAX_ROWS) {
    return {
      status: "error",
      message: `This file has ${bodyRows.length} rows. Import at most ${MAX_ROWS} rows per file.`,
    };
  }

  const productIdColumn = columns.get("product_id");
  if (productIdColumn === undefined) {
    return { status: "error", message: "Missing required column: product_id." };
  }

  const productIdCounts = new Map<string, { count: number; value: string }>();
  for (const { row } of bodyRows) {
    const value = (row[productIdColumn] ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    const current = productIdCounts.get(key);
    productIdCounts.set(key, {
      count: (current?.count ?? 0) + 1,
      value: current?.value ?? value,
    });
  }
  const duplicateIds = [...productIdCounts.values()]
    .filter((entry) => entry.count > 1)
    .map((entry) => entry.value);
  if (duplicateIds.length > 0) {
    return {
      status: "error",
      message: `Duplicate product_id value${duplicateIds.length === 1 ? "" : "s"} found: ${duplicateIds
        .slice(0, 10)
        .join(", ")}. Each product ID must appear once per file.`,
    };
  }

  const categories = await db.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  const categoryByKey = new Map<string, { id: string; name: string }>();
  for (const category of categories) {
    categoryByKey.set(category.slug.toLowerCase(), {
      id: category.id,
      name: category.name,
    });
    categoryByKey.set(category.name.toLowerCase(), {
      id: category.id,
      name: category.name,
    });
  }

  const job = await db.importJob.create({
    data: {
      filename: file.name.slice(0, 200),
      mode,
      status: "PROCESSING",
      totalRows: bodyRows.length,
      requestedByUserId,
      startedAt: new Date(),
    },
  });

  const results: ImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  try {
    for (const { row, rowNumber } of bodyRows) {
      const value = (key: string) => {
        const index = columns.get(key);
        return index === undefined ? undefined : (row[index] ?? "").trim();
      };
      const has = (key: string) => columns.has(key);
      const errors: string[] = [];
      const warnings: string[] = [];

      const rawData: Record<string, string> = {};
      for (const [key, index] of columns.entries()) {
        rawData[key] = row[index] ?? "";
      }

      const productId = value("product_id") ?? "";
      if (!productId) errors.push("product_id is required");
      else if (!/^[A-Za-z0-9._-]{1,64}$/.test(productId)) {
        errors.push(
          "product_id can only contain letters, numbers, dots, underscores and hyphens (max 64)",
        );
      }

      const name = value("name") ?? "";
      if (name.length < 2) errors.push("name is required");
      else if (name.length > 200) errors.push("name must be 200 characters or fewer");

      const price = asDecimal(value("price_usd"));
      if (price.error) errors.push(`price_usd: ${price.error}`);
      else if (price.value === null) errors.push("price_usd is required");
      else if (price.value < 0) errors.push("price_usd cannot be negative");
      else if (price.value > 10_000_000) errors.push("price_usd is too large");

      const categoryName = value("category") ?? "";
      const category = categoryName
        ? categoryByKey.get(categoryName.toLowerCase())
        : undefined;
      if (!categoryName) errors.push("category is required");
      else if (!category) {
        errors.push(
          `category "${categoryName}" was not found. Use an existing category slug or name.`,
        );
      }

      const compareAt = has("compare_at_price")
        ? asDecimal(value("compare_at_price"))
        : { value: null as number | null };
      if (compareAt.error) {
        errors.push(`compare_at_price: ${compareAt.error}`);
      } else if (
        compareAt.value !== null &&
        price.value !== null &&
        compareAt.value <= price.value
      ) {
        warnings.push("compare_at_price is not higher than price_usd");
      }

      const stock = has("stock")
        ? asInteger(value("stock"))
        : { value: null as number | null };
      if (stock.error) errors.push(`stock: ${stock.error}`);
      if (stock.value !== null && stock.value > 10_000_000) {
        errors.push("stock is too large");
      }

      const lowStockAlert = has("low_stock_alert")
        ? asInteger(value("low_stock_alert"))
        : { value: null as number | null };
      if (lowStockAlert.error) {
        errors.push(`low_stock_alert: ${lowStockAlert.error}`);
      }

      const rawStatus = (value("status") ?? "").toUpperCase();
      if (rawStatus && !STATUSES.includes(rawStatus as ProductStatus)) {
        errors.push("status must be DRAFT, PUBLISHED or ARCHIVED");
      }

      const rawSaleMode = (value("sale_mode") ?? "").toUpperCase();
      if (rawSaleMode && !SALE_MODES.includes(rawSaleMode as ProductSaleMode)) {
        errors.push("sale_mode must be UNIT or WEIGHT");
      }

      const imageCell = value("image_urls") ?? "";
      const imageUrls: string[] = [];
      if (imageCell) {
        const parts = imageCell
          .split(/[|;\n]/)
          .map((part) => part.trim())
          .filter(Boolean);
        for (const part of parts) {
          const validLocal =
            part.startsWith("/") &&
            !part.startsWith("//") &&
            !part.includes("..") &&
            !part.includes("\\") &&
            /^\/(uploads|images)\//.test(part);
          if (validLocal) imageUrls.push(part);
          else warnings.push(`Skipped non-local image path: ${part}`);
        }
        if (imageUrls.length > MAX_IMAGES) {
          warnings.push(`Only the first ${MAX_IMAGES} images were imported`);
          imageUrls.length = MAX_IMAGES;
        }
      }

      if (errors.length > 0) {
        failed += 1;
        const message = errors.join("; ");
        results.push({
          rowNumber,
          sku: productId || undefined,
          status: "FAILED",
          message,
          warnings,
        });
        await db.importRow.create({
          data: {
            jobId: job.id,
            rowNumber,
            status: "FAILED",
            action: "failed",
            sku: productId || null,
            rawData,
            errors,
            warnings,
          },
        });
        continue;
      }

      try {
        const existing = await db.product.findUnique({
          where: { sku: productId },
          select: {
            id: true,
            slug: true,
            publishedAt: true,
            status: true,
            saleMode: true,
          },
        });

        if (mode === "CREATE_ONLY" && existing) {
          throw new Error(`Product ID ${productId} already exists`);
        }
        if (mode === "UPDATE_ONLY" && !existing) {
          throw new Error(`Product ID ${productId} does not exist`);
        }

        const suppliedSlug = value("slug") ?? "";
        let slug: string;
        if (suppliedSlug) {
          const base = slugify(suppliedSlug);
          if (!base) throw new Error("slug is not valid");
          slug = await uniqueSlug(base, existing?.id);
        } else if (existing) {
          slug = existing.slug;
        } else {
          const base = slugify(name);
          if (!base) throw new Error("name cannot be converted into a slug");
          slug = await uniqueSlug(base);
        }

        const status = rawStatus
          ? (rawStatus as ProductStatus)
          : existing?.status ?? "DRAFT";

        const publishedAt =
          status === "PUBLISHED"
            ? existing?.publishedAt ?? new Date()
            : null;

        const saleMode: ProductSaleMode = rawSaleMode
          ? (rawSaleMode as ProductSaleMode)
          : (existing?.saleMode ?? "UNIT");

        const baseData = {
          name,
          slug,
          sku: productId,
          categoryId: category!.id,
          price: new Prisma.Decimal((price.value as number).toFixed(2)),
          saleMode,
          status,
          publishedAt,
        };

        const stockData: { stock?: number; lowStockAlert?: number } = {};
        if (has("stock")) stockData.stock = stock.value ?? 0;
        else if (!existing) stockData.stock = 0;
        if (has("low_stock_alert")) {
          stockData.lowStockAlert = lowStockAlert.value ?? 5;
        } else if (!existing) {
          stockData.lowStockAlert = 5;
        }

        const optionalData: {
          compareAtPrice?: Prisma.Decimal | null;
          shortDescription?: string | null;
          description?: string | null;
          tags?: string[];
          isFeatured?: boolean;
        } = {};
        if (has("compare_at_price")) {
          optionalData.compareAtPrice =
            compareAt.value === null
              ? null
              : new Prisma.Decimal(compareAt.value.toFixed(2));
        }
        if (has("short_description")) {
          optionalData.shortDescription = value("short_description") || null;
        }
        if (has("description")) {
          optionalData.description = value("description") || null;
        }
        if (has("tags")) {
          optionalData.tags = (value("tags") ?? "")
            .split(/[,|]/)
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 30);
        }
        if (has("is_featured")) {
          optionalData.isFeatured = asBoolean(value("is_featured"));
        }

        const outcome = await db.$transaction(async (tx) => {
          let productIdValue: string;
          let action: "CREATED" | "UPDATED";

          if (existing) {
            const result = await tx.product.update({
              where: { id: existing.id },
              data: {
                ...baseData,
                ...stockData,
                ...optionalData,
              },
              select: { id: true },
            });
            productIdValue = result.id;
            action = "UPDATED";
          } else {
            const result = await tx.product.create({
              data: {
                ...baseData,
                ...stockData,
                ...optionalData,
              },
              select: { id: true },
            });
            productIdValue = result.id;
            action = "CREATED";
          }

          if (imageCell && imageUrls.length > 0) {
            await tx.productImage.deleteMany({
              where: { productId: productIdValue },
            });
            await tx.productImage.createMany({
              data: imageUrls.map((url, index) => ({
                productId: productIdValue,
                url,
                alt: null,
                sortOrder: index,
              })),
            });
          }

          await tx.importRow.create({
            data: {
              jobId: job.id,
              rowNumber,
              status: action === "CREATED" ? "CREATED" : "UPDATED",
              action: action.toLowerCase(),
              productId: productIdValue,
              sku: productId,
              rawData,
              warnings,
            },
          });

          return { productIdValue, action };
        });

        if (outcome.action === "CREATED") created += 1;
        else updated += 1;

        results.push({
          rowNumber,
          productId: outcome.productIdValue,
          productDbId: outcome.productIdValue,
          sku: productId,
          status: outcome.action,
          message:
            outcome.action === "CREATED"
              ? "Product created"
              : "Product updated",
          warnings,
        });
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message : "Unknown import error";
        results.push({
          rowNumber,
          sku: productId,
          status: "FAILED",
          message,
          warnings,
        });
        await db.importRow.create({
          data: {
            jobId: job.id,
            rowNumber,
            status: "FAILED",
            action: "failed",
            sku: productId,
            rawData,
            errors: [message],
            warnings,
          },
        });
      }
    }

    const errorSummary =
      failed > 0
        ? `${failed} row${failed === 1 ? "" : "s"} failed. See the row details.`
        : null;

    await db.importJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        processedRows: bodyRows.length,
        createdRows: created,
        updatedRows: updated,
        failedRows: failed,
        errorSummary,
        completedAt: new Date(),
      },
    });

    return {
      status: failed === bodyRows.length ? "error" : "success",
      message:
        failed === 0
          ? `Imported ${bodyRows.length} row${bodyRows.length === 1 ? "" : "s"}.`
          : `Imported ${created + updated} of ${bodyRows.length} rows; ${failed} failed.`,
      jobId: job.id,
      summary: {
        total: bodyRows.length,
        created,
        updated,
        failed,
      },
      rows: results,
    };
  } catch (error) {
    console.error("[product-import] import failed", error);
    await db.importJob
      .update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          processedRows: results.length,
          createdRows: created,
          updatedRows: updated,
          failedRows: failed,
          errorSummary:
            error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);

    return {
      status: "error",
      message:
        "The import stopped unexpectedly. Rows processed before the error were saved.",
      jobId: job.id,
      summary: {
        total: bodyRows.length,
        created,
        updated,
        failed,
      },
      rows: results,
    };
  }
}
