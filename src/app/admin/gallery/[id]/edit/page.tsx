import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { GalleryForm } from "@/components/admin/gallery-form";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit Gallery Media" };

export default async function EditGalleryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("/admin/gallery");
  const { id } = await params;

  const item = await db.galleryItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/gallery"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest-900"
        >
          <ArrowLeft className="size-4" />
          Gallery
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-forest-900">
          Edit gallery media
        </h1>
        <p className="mt-1 text-sm text-muted">
          {item.title || "Untitled gallery item"}
        </p>
      </div>
      <GalleryForm item={item} />
    </div>
  );
}
