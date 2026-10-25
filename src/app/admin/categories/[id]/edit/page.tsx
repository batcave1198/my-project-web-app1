import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Edit Category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("/admin/categories");
  const { id } = await params;

  const [category, parents] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.category.findMany({
      where: { parentId: null, NOT: { id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">Edit category</h1>
        <p className="mt-1 text-sm text-muted">{category.name}</p>
      </div>
      <CategoryForm category={category} parents={parents} />
    </div>
  );
}
