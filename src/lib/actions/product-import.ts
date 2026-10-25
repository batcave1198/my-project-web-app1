"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/dal";
import {
  runProductImport,
  type ProductImportResult,
} from "@/lib/products/import-runner";

export async function importProducts(
  formData: FormData,
): Promise<ProductImportResult> {
  const user = await requireStaff("/admin/products/import");

  const result = await runProductImport({
    formData,
    requestedByUserId: user.id,
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/import");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/cart");

  return result;
}
