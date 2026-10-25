import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "New Category" };

export default async function NewCategoryPage() {
  await requireStaff("/admin/categories");

  const parents = await db.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">Add category</h1>
        <p className="mt-1 text-sm text-muted">Create a category for the storefront.</p>
      </div>
      <CategoryForm parents={parents} />
    </div>
  );
}
