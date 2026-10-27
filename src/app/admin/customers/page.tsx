import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search, UserRound, Users } from "lucide-react";
import { CustomerForm } from "@/components/admin/customer-form";
import { DeleteCustomerButton } from "@/components/admin/delete-customer-button";
import { Button } from "@/components/ui/button";
import { isAdmin, requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { daysAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Customers" };

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(value);
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireStaff("/admin/customers");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const canManage = isAdmin(actor);

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const thirtyDaysAgo = daysAgo(30);
  const [customers, totalCustomers, newCustomers, marketingCount] =
    await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          marketingOptIn: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
      }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({
        where: { role: "CUSTOMER", createdAt: { gte: thirtyDaysAgo } },
      }),
      db.user.count({ where: { role: "CUSTOMER", marketingOptIn: true } }),
    ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="eyebrow">People</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">
          Customers
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          View customer accounts, add a customer manually or remove an account.
          Order records are retained when an account is deleted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-5">
          <Users className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {totalCustomers}
          </p>
          <p className="text-xs text-muted">Customer accounts</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <UserRound className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {newCustomers}
          </p>
          <p className="text-xs text-muted">Joined in the last 30 days</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <UserRound className="size-5 text-gold-600" />
          <p className="mt-3 text-2xl font-semibold text-forest-900">
            {marketingCount}
          </p>
          <p className="text-xs text-muted">Opted in to marketing</p>
        </div>
      </div>

      {canManage ? (
        <CustomerForm />
      ) : (
        <p className="rounded-lg border border-line bg-cream-100/60 px-5 py-4 text-sm text-muted">
          Only administrators can add or delete customer accounts. You can still
          view the customer list.
        </p>
      )}

      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-4">
          <form className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:max-w-sm">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search name, email or phone..."
                className="h-10 w-full rounded-md border border-line-strong pl-9 pr-3 text-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
            {q && (
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/customers">Clear</Link>
              </Button>
            )}
          </form>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto size-8 text-gold-600" />
            <p className="mt-3 text-sm font-medium text-forest-900">
              {q ? "No matching customers" : "No customers yet"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {q
                ? "Try a different name, email address or phone number."
                : "Customer accounts appear here after registration or manual creation."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Phone</th>
                  <th className="px-4 py-2.5 font-semibold">Orders</th>
                  <th className="px-4 py-2.5 font-semibold">Reviews</th>
                  <th className="px-4 py-2.5 font-semibold">Joined</th>
                  <th className="px-4 py-2.5 font-semibold">Last sign-in</th>
                  <th className="px-5 py-2.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-line/70 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-900/8 text-xs font-bold text-forest-900">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-forest-900">
                            {customer.name}
                            {!customer.isActive && (
                              <span className="ml-2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[0.6rem] font-semibold text-danger">
                                Inactive
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {customer._count.orders}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {customer._count.reviews}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDate(customer.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canManage ? (
                        <DeleteCustomerButton
                          id={customer.id}
                          name={customer.name}
                        />
                      ) : (
                        <span className="text-xs text-muted">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
