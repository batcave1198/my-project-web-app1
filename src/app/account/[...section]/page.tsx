import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";

const sections: Record<string, { title: string; description: string }> = {
  addresses: {
    title: "Addresses",
    description:
      "Saved delivery addresses will be manageable here once checkout is enabled.",
  },
  profile: {
    title: "Profile",
    description:
      "Name, phone number and password changes will be manageable here once account settings are enabled.",
  },
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountSectionPlaceholder({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const user = await requireUser("/account");
  const { section } = await params;
  const detail = sections[section.join("/")];

  if (!detail) notFound();

  return (
    <div className="container-page py-12 sm:py-16">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-forest-900"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        My Account
      </Link>

      <div className="mt-6 max-w-2xl rounded-lg border border-line bg-white px-6 py-10">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-cream-200">
          <Construction aria-hidden="true" className="size-5 text-earth-600" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-forest-900">
          {detail.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {detail.description}
        </p>
        <p className="mt-5 text-sm text-muted">
          Signed in as{" "}
          <span className="font-medium text-ink-soft">{user.email}</span>
        </p>
      </div>
    </div>
  );
}
