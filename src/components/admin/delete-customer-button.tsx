"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customers";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Delete ${name}? Their account, addresses, sessions and likes will be removed. Order records will be kept for accounting.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteCustomer(id);
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
      className="inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline disabled:opacity-60"
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
