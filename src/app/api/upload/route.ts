import "server-only";
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/dal";
import { saveLocalImage } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    await requireStaff("/admin");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const folder = (formData.get("folder") as string) || "products";
    const url = await saveLocalImage(file, folder);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("redirect")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[upload] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
