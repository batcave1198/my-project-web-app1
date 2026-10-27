import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { clearMfaChallenge } from "@/lib/auth/mfa";

export async function POST(request: Request) {
  await clearMfaChallenge();
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
