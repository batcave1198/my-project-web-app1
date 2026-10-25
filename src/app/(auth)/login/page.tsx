import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeRedirectPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Ceylon Herbs and Spices account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect(
      safeRedirectPath(
        params.next,
        user.role === "CUSTOMER" ? "/account" : "/admin",
      ),
    );
  }

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        Welcome back
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        Sign in to track orders, save your details and keep a wishlist.
      </p>

      <LoginForm next={params.next} />
    </div>
  );
}
