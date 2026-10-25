import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { deleteCategory } from "@/lib/actions/category";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireStaff("/admin/categories");

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-1 text-2xl font-semibold text-forest-900">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            Organise products into categories. Changes appear on the storefront immediately.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            Add category
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-line bg-white">
        {categories.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Tags className="mx-auto size-8 text-gold-600" />
            <p className="mt-3 text-sm font-medium text-forest-900">No categories yet</p>
            <p className="mt-1 text-xs text-muted">Create your first category to organise products.</p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admin/categories/new">Create category</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-2.5 font-semibold">Name</th>
                  <th className="px-4 py-2.5 font-semibold">Parent</th>
                  <th className="px-4 py-2.5 font-semibold">Products</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-6 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-line/70 last:border-0">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt="" className="size-10 rounded-md object-cover" />
                        ) : (
                          <div className="size-10 rounded-md bg-cream-200" />
                        )}
                        <div>
                          <p className="font-medium text-forest-900">{cat.name}</p>
                          <p className="text-xs text-muted">/{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{cat.parent?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{cat._count.products}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cat.isActive ? "bg-success-soft text-success" : "bg-cream-200 text-muted"}`}>
                        {cat.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{cat.sortOrder}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/categories/${cat.id}/edit`} className="text-sm font-medium text-forest-900 hover:underline">
                          Edit
                        </Link>
                        <form action={async () => { "use server"; await deleteCategory(cat.id); }}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
