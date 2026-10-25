import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, MapPin, Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label } from "@/components/ui/field";
import {
  deleteShippingMethod,
  deleteShippingZone,
  saveShippingMethod,
  saveShippingZone,
} from "@/lib/actions/shipping";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatMoneyDecimal } from "@/lib/money";
import { sriLankaProvinces } from "@/lib/sri-lanka";

export const metadata: Metadata = { title: "Shipping" };

function ZoneFields({
  zone,
}: {
  zone?: { name: string; districts: string[]; sortOrder: number; isActive: boolean };
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <div>
          <Label htmlFor={`zone-name-${zone ? "edit" : "new"}`}>Zone name</Label>
          <Input
            id={`zone-name-${zone ? "edit" : "new"}`}
            name="name"
            defaultValue={zone?.name}
            placeholder="e.g. Western Province"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor={`zone-sort-${zone ? "edit" : "new"}`}>Sort order</Label>
          <Input
            id={`zone-sort-${zone ? "edit" : "new"}`}
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={zone?.sortOrder ?? 0}
            className="mt-1.5"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink-soft">Districts covered</legend>
        <div className="mt-2 grid gap-3 rounded-md border border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
          {sriLankaProvinces.map((province) => (
            <div key={province.name}>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{province.name}</p>
              <div className="mt-1.5 space-y-1.5">
                {province.districts.map((district) => (
                  <Checkbox
                    key={district}
                    name="districts"
                    value={district}
                    label={district}
                    defaultChecked={zone?.districts.includes(district)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <Checkbox name="isActive" label="Zone is active" defaultChecked={zone?.isActive ?? true} />
    </div>
  );
}

function MethodFields({ zoneId, method }: { zoneId: string; method?: {
  name: string;
  description: string | null;
  price: string;
  freeOverAmount: string | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
} }) {
  return (
    <div className="space-y-4">
      <input type="hidden" name="zoneId" value={zoneId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Method name</Label>
          <Input name="name" defaultValue={method?.name} placeholder="e.g. Standard delivery" required className="mt-1.5" />
        </div>
        <div>
          <Label>Price (USD)</Label>
          <Input name="price" type="number" min={0} step="0.01" defaultValue={method?.price} required className="mt-1.5" />
        </div>
        <div>
          <Label>Free over amount (optional)</Label>
          <Input
            name="freeOverAmount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={method?.freeOverAmount ?? ""}
            placeholder="e.g. 10000"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Description (optional)</Label>
          <Input name="description" defaultValue={method?.description ?? ""} className="mt-1.5" />
        </div>
        <div>
          <Label>Minimum days</Label>
          <Input name="minDays" type="number" min={0} max={60} defaultValue={method?.minDays ?? 2} className="mt-1.5" />
        </div>
        <div>
          <Label>Maximum days</Label>
          <Input name="maxDays" type="number" min={0} max={60} defaultValue={method?.maxDays ?? 5} className="mt-1.5" />
        </div>
      </div>
      <Checkbox name="isActive" label="Method is active" defaultChecked={method?.isActive ?? true} />
    </div>
  );
}

export default async function AdminShippingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireStaff("/admin/shipping");
  const { error, ok } = await searchParams;

  const zones = await db.shippingZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      methods: { orderBy: [{ sortOrder: "asc" }, { price: "asc" }] },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="eyebrow">Sales</p>
        <h1 className="mt-1 text-2xl font-semibold text-forest-900">Shipping &amp; delivery</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Delivery rates are never hardcoded. Add a zone, choose the districts it covers, then add
          one or more delivery methods. Checkout only offers methods whose zone covers the
          customer&apos;s district.
        </p>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      {ok && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-success/25 bg-success-soft px-4 py-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {ok}
        </p>
      )}

      <details className="rounded-lg border border-line bg-white p-5">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-forest-900">
          <Plus className="size-4" />
          Add a delivery zone
        </summary>
        <form action={saveShippingZone} className="mt-5">
          <ZoneFields />
          <Button type="submit" className="mt-4">Create zone</Button>
        </form>
      </details>

      {zones.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-white/60 px-6 py-14 text-center">
          <MapPin className="mx-auto size-8 text-gold-600" />
          <p className="mt-3 text-sm font-medium text-forest-900">No delivery zones yet</p>
          <p className="mt-1 text-xs text-muted">
            Add a zone above and at least one method before customers can check out.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <section key={zone.id} className="rounded-lg border border-line bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-forest-900">
                    {zone.name}
                    {!zone.isActive && (
                      <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold text-muted">Hidden</span>
                    )}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {zone.districts.length === 0
                      ? "No districts selected — checkout cannot use this zone."
                      : zone.districts.join(", ")}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {zone.methods.length} method{zone.methods.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-3 px-5 py-4">
                {zone.methods.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line-strong px-4 py-4 text-sm text-muted">
                    No delivery methods yet. Add one below so this zone can be used at checkout.
                  </p>
                ) : (
                  <ul className="divide-y divide-line rounded-md border border-line">
                    {zone.methods.map((method) => (
                      <li key={method.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-forest-900">
                              {method.name}
                              {!method.isActive && (
                                <span className="ml-2 rounded-full bg-cream-200 px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted">Hidden</span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {formatMoneyDecimal(method.price.toString())} · {method.minDays}–{method.maxDays} days
                              {method.freeOverAmount
                                ? ` · free over ${formatMoneyDecimal(method.freeOverAmount.toString())}`
                                : ""}
                              {method.description ? ` · ${method.description}` : ""}
                            </p>
                          </div>
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium text-forest-900">Edit</summary>
                            <div className="mt-3 w-full max-w-2xl rounded-md border border-line bg-cream-50/60 p-4">
                              <form action={saveShippingMethod}>
                                <input type="hidden" name="id" value={method.id} />
                                <MethodFields
                                  zoneId={zone.id}
                                  method={{
                                    name: method.name,
                                    description: method.description,
                                    price: method.price.toString(),
                                    freeOverAmount: method.freeOverAmount ? method.freeOverAmount.toString() : null,
                                    minDays: method.minDays,
                                    maxDays: method.maxDays,
                                    isActive: method.isActive,
                                  }}
                                />
                                <Button type="submit" size="sm" className="mt-4">Save method</Button>
                              </form>
                              <form action={deleteShippingMethod} className="mt-2">
                                <input type="hidden" name="id" value={method.id} />
                                <Button type="submit" variant="ghost" size="sm" className="text-danger">
                                  <Trash2 className="size-3.5" />
                                  Delete method
                                </Button>
                              </form>
                            </div>
                          </details>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <details>
                  <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-forest-900">
                    <Plus className="size-3.5" />
                    Add a method to {zone.name}
                  </summary>
                  <form action={saveShippingMethod} className="mt-3 rounded-md border border-line bg-cream-50/60 p-4">
                    <MethodFields zoneId={zone.id} />
                    <Button type="submit" size="sm" className="mt-4">Add method</Button>
                  </form>
                </details>
              </div>

              <details className="border-t border-line px-5 py-3">
                <summary className="cursor-pointer text-sm font-medium text-forest-900">Edit zone</summary>
                <form action={saveShippingZone} className="mt-4">
                  <input type="hidden" name="id" value={zone.id} />
                  <ZoneFields zone={{
                    name: zone.name,
                    districts: zone.districts,
                    sortOrder: zone.sortOrder,
                    isActive: zone.isActive,
                  }} />
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button type="submit" size="sm">Save zone</Button>
                  </div>
                </form>
                <form action={deleteShippingZone} className="mt-2">
                  <input type="hidden" name="id" value={zone.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-danger">
                    <Trash2 className="size-3.5" />
                    Delete zone and its methods
                  </Button>
                </form>
              </details>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-line bg-cream-100/50 p-5 text-sm text-muted">
        <p className="flex items-center gap-2 font-medium text-forest-900">
          <Truck className="size-4 text-gold-600" />
          How checkout uses these rates
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Only active zones with at least one active method are offered.</li>
          <li>The customer picks their district; methods from the matching zone are shown.</li>
          <li>If the cart subtotal reaches the free-over amount, delivery is charged at zero.</li>
          <li>Rates are re-checked on the server when the order is placed — never trusted from the browser.</li>
        </ul>
      </div>
    </div>
  );
}
