import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/auth/verification";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const identifier = token
    ? await consumeVerificationToken(token, "EMAIL_VERIFICATION")
    : null;

  if (!identifier) {
    return NextResponse.redirect(
      new URL("/account/security?verify=failed", request.url),
      { status: 303 },
    );
  }

  await db.user.updateMany({
    where: { email: identifier, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });

  return NextResponse.redirect(
    new URL("/account?verified=1", request.url),
    { status: 303 },
  );
}
