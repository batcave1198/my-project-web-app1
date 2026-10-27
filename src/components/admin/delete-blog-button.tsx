"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteBlogPost } from "@/lib/actions/blogs";

export function DeleteBlogButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteBlogPost(id);
      if (result.status === "error") {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline disabled:opacity-60"
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      ) : (
        <Trash2 aria-hidden="true" className="size-3.5" />
      )}
      Delete
    </button>
  );
}
