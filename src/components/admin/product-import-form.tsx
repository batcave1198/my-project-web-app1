"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { importProducts } from "@/lib/actions/product-import";
import type { ProductImportResult } from "@/lib/products/import-runner";
import { cn } from "@/lib/utils";

const initialState: ProductImportResult = { status: "idle" };

const statusStyles: Record<string, string> = {
  CREATED: "bg-success-soft text-success",
  UPDATED: "bg-forest-100 text-forest-800",
  FAILED: "bg-danger-soft text-danger",
};

export function ProductImportForm() {
  const router = useRouter();
  const [result, setResult] = useState<ProductImportResult>(initialState);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await importProducts(formData);
      setResult(res);
      if (res.status === "success") router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-line bg-white p-5 sm:p-6"
      >
        <div className="grid gap-5 sm:grid-cols-[1fr_13rem] sm:items-end">
          <div>
            <Label htmlFor="file">CSV or Excel file</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              className="mt-1.5 block w-full cursor-pointer rounded-md border border-line-strong bg-white text-sm text-ink-soft file:mr-4 file:border-0 file:bg-forest-900 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-cream-50 hover:file:bg-forest-800"
            />
            <p className="mt-1.5 text-xs text-muted">
              Up to 1,000 rows / 5 MB. Excel workbooks use the first sheet named
              <span className="font-mono"> Products</span>, or the first sheet.
            </p>
          </div>
          <div>
            <Label htmlFor="mode">Import mode</Label>
            <Select id="mode" name="mode" defaultValue="UPSERT" className="mt-1.5">
              <option value="UPSERT">Create or update (upsert)</option>
              <option value="CREATE_ONLY">Create new only</option>
              <option value="UPDATE_ONLY">Update existing only</option>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {pending ? "Importing..." : "Import products"}
          </Button>
          <a
            href="/api/admin/products/import-template"
            className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-forest-900 hover:underline"
          >
            <Download className="size-4" />
            Download Excel template
          </a>
          <a
            href="/templates/product-import-template.csv"
            download
            className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-forest-900 hover:underline"
          >
            <Download className="size-4" />
            Download CSV template
          </a>
        </div>

        <div className="mt-5 rounded-md border border-line bg-cream-100/60 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <p className="font-semibold text-forest-900">Required columns</p>
          <p className="mt-1">
            <code className="font-mono">product_id</code> (the product ID / SKU),{" "}
            <code className="font-mono">name</code>,{" "}
            <code className="font-mono">price_usd</code> and{" "}
            <code className="font-mono">category</code> (existing category slug
            or name).
          </p>
          <p className="mt-2">
            Optional: <code className="font-mono">sale_mode</code> (<code className="font-mono">UNIT</code>{" "}
            or <code className="font-mono">WEIGHT</code>),{" "}
            <code className="font-mono">stock</code> (units, or grams for weight
            products), <code className="font-mono">status</code>,{" "}
            <code className="font-mono">slug</code>,{" "}
            <code className="font-mono">compare_at_price</code>,{" "}
            <code className="font-mono">short_description</code>,{" "}
            <code className="font-mono">description</code>,{" "}
            <code className="font-mono">image_urls</code> (local paths separated
            by <code className="font-mono">|</code>),{" "}
            <code className="font-mono">tags</code> and{" "}
            <code className="font-mono">is_featured</code>.
          </p>
          <p className="mt-2">
            For <code className="font-mono">WEIGHT</code> rows,{" "}
            <code className="font-mono">price_usd</code> is the price per 100g
            and <code className="font-mono">stock</code> is the available weight
            in grams.
          </p>
        </div>
      </form>

      {result.status === "error" && result.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {result.message}
        </p>
      )}

      {result.status === "success" && result.message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {result.message}
        </p>
      )}

      {result.summary && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Rows", result.summary.total],
            ["Created", result.summary.created],
            ["Updated", result.summary.updated],
            ["Failed", result.summary.failed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-line bg-white px-4 py-3"
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-forest-900">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {result.rows && result.rows.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <FileUp className="size-4 text-gold-600" />
              Row results
            </h2>
            <p className="text-xs text-muted">
              {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="sticky top-0 bg-cream-50">
                <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
                  <th className="px-5 py-2.5 font-semibold">Row</th>
                  <th className="px-4 py-2.5 font-semibold">Product ID</th>
                  <th className="px-4 py-2.5 font-semibold">Result</th>
                  <th className="px-4 py-2.5 font-semibold">Details</th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className="border-b border-line/70 last:border-0 align-top"
                  >
                    <td className="px-5 py-3 text-muted">{row.rowNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                      {row.sku || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                          statusStyles[row.status],
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-soft">{row.message}</p>
                      {row.warnings.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-warning">
                          {row.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.productDbId ? (
                        <Link
                          href={`/admin/products/${row.productDbId}/edit`}
                          className="text-sm font-medium text-forest-900 hover:underline"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
