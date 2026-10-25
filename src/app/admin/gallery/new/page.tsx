import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GalleryForm } from "@/components/admin/gallery-form";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Add Gallery Media" };

export default async function NewGalleryItemPage() {
  await requireStaff("/admin/gallery/new");

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
          Add gallery media
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add one photo or video. Gallery items appear in sort order and do not
          link to products.
        </p>
      </div>
      <GalleryForm />
    </div>
  );
}
