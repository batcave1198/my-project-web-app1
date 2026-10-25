import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Ceylon Herbs and Spices account.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "CUSTOMER" ? "/account" : "/admin");
  }

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl font-semibold text-forest-900 sm:text-4xl">
        Create your account
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-muted">
        Save delivery details, follow your orders and build a wishlist. You can
        still check out as a guest.
      </p>

      <RegisterForm />
    </div>
  );
}
