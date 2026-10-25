"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2, Lock, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { formatMoneyDecimal } from "@/lib/money";
import { formatWeight } from "@/lib/products/weight";
import { placeOrder, type CheckoutState } from "@/lib/actions/checkout";

export type CheckoutMethod = {
  id: string;
  zoneId: string;
  zoneName: string;
  name: string;
  description: string | null;
  price: string;
  priceValue: string;
  freeOver: string | null;
  freeOverValue: string | null;
  minDays: number;
  maxDays: number;
};

export type CheckoutZone = {
  id: string;
  name: string;
  districts: string[];
};

export type CheckoutLine = {
  id: string;
  name: string;
  slug: string;
  variantLabel: string | null;
  saleMode: "UNIT" | "WEIGHT";
  weightGrams: number | null;
  quantity: number;
  lineTotal: string;
  imageUrl: string | null;
};

type Props = {
  zones: CheckoutZone[];
  methods: CheckoutMethod[];
  items: CheckoutLine[];
  subtotal: string;
  subtotalValue: string;
  paymentsConfigured: boolean;
  defaults: {
    fullName: string;
    email: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    district: string;
    postalCode: string;
  };
};

const initialState: CheckoutState = { status: "idle" };

export function CheckoutForm({
  zones,
  methods,
  items,
  subtotal,
  subtotalValue,
  paymentsConfigured,
  defaults,
}: Props) {
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const [district, setDistrict] = useState(defaults.district);
  const [methodId, setMethodId] = useState(() => {
    const zone = zones.find((z) => z.districts.includes(defaults.district));
    return zone ? (methods.find((m) => m.zoneId === zone.id)?.id ?? "") : "";
  });
  const payhereFormRef = useRef<HTMLFormElement>(null);

  const activeZone = zones.find((zone) => zone.districts.includes(district));
  const availableMethods = activeZone
    ? methods.filter((method) => method.zoneId === activeZone.id)
    : [];
  const selectedMethod =
    availableMethods.find((method) => method.id === methodId) ?? availableMethods[0] ?? null;

  const shippingValue = selectedMethod
    ? selectedMethod.freeOverValue &&
      Number(subtotalValue) >= Number(selectedMethod.freeOverValue)
      ? "0"
      : selectedMethod.priceValue
    : "0";
  const shippingDisplay = selectedMethod
    ? Number(shippingValue) === 0
      ? "Free"
      : selectedMethod.price
    : "—";
  const total = Number(subtotalValue) + Number(shippingValue);

  useEffect(() => {
    if (state.status === "pay" && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [state]);

  const configuredMethodsCount = methods.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-start">
      <form action={formAction} className="space-y-6">
        {state.status === "error" && state.message && (
          <p role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}

        {!paymentsConfigured && (
          <div className="rounded-md border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-earth-600">
            <p className="font-semibold">Online payment is not configured yet</p>
            <p className="mt-1 leading-relaxed">
              PayHere sandbox credentials are missing from the server environment, so
              orders cannot be placed right now. Everything else on the storefront
              still works.
            </p>
          </div>
        )}

        {configuredMethodsCount === 0 && (
          <div className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            Delivery options have not been configured yet. Please check back soon.
          </div>
        )}

        <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest-900 text-xs font-semibold text-cream-50">1</span>
            <h2 className="text-lg font-semibold text-forest-900">Contact</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                defaultValue={defaults.fullName}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.fullName)}
              />
              <FieldError>{state.fieldErrors?.fullName}</FieldError>
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaults.email}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.email)}
              />
              <FieldError>{state.fieldErrors?.email}</FieldError>
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="07X XXX XXXX"
                defaultValue={defaults.phone}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.phone)}
              />
              <FieldError>{state.fieldErrors?.phone}</FieldError>
              <FieldHint>Used by the courier to reach you.</FieldHint>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest-900 text-xs font-semibold text-cream-50">2</span>
            <h2 className="text-lg font-semibold text-forest-900">Delivery address</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="line1">Address line 1</Label>
              <Input
                id="line1"
                name="line1"
                autoComplete="address-line1"
                defaultValue={defaults.line1}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.line1)}
              />
              <FieldError>{state.fieldErrors?.line1}</FieldError>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="line2">Address line 2 <span className="font-normal text-muted">(optional)</span></Label>
              <Input
                id="line2"
                name="line2"
                autoComplete="address-line2"
                defaultValue={defaults.line2}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="city">City / town</Label>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                defaultValue={defaults.city}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.city)}
              />
              <FieldError>{state.fieldErrors?.city}</FieldError>
            </div>
            <div>
              <Label htmlFor="district">District</Label>
              <Select
                id="district"
                name="district"
                value={district}
                onChange={(event) => {
                  const nextDistrict = event.target.value;
                  setDistrict(nextDistrict);
                  const zone = zones.find((item) => item.districts.includes(nextDistrict));
                  setMethodId(zone ? (methods.find((m) => m.zoneId === zone.id)?.id ?? "") : "");
                }}
                required
                className="mt-1.5"
                aria-invalid={Boolean(state.fieldErrors?.district)}
              >
                <option value="">Choose your district</option>
                {zones.map((zone) => (
                  <optgroup key={zone.id} label={zone.name}>
                    {zone.districts.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <FieldError>{state.fieldErrors?.district}</FieldError>
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code <span className="font-normal text-muted">(optional)</span></Label>
              <Input
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                defaultValue={defaults.postalCode}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="note">Order note <span className="font-normal text-muted">(optional)</span></Label>
              <Textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Delivery instructions, landmarks, or anything we should know."
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest-900 text-xs font-semibold text-cream-50">3</span>
            <h2 className="text-lg font-semibold text-forest-900">Delivery method</h2>
          </div>

          <input type="hidden" name="methodId" value={selectedMethod?.id ?? ""} />

          {!district ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Truck className="size-4 text-gold-600" />
              Choose your district to see delivery options.
            </p>
          ) : availableMethods.length === 0 ? (
            <p className="mt-4 text-sm text-danger">
              No delivery method covers {district} yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {availableMethods.map((method) => {
                const free =
                  method.freeOverValue && Number(subtotalValue) >= Number(method.freeOverValue);
                const checked = selectedMethod?.id === method.id;
                return (
                  <li key={method.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                        checked
                          ? "border-forest-700 bg-forest-900/[0.04]"
                          : "border-line-strong hover:border-earth-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryChoice"
                        value={method.id}
                        checked={checked}
                        onChange={() => setMethodId(method.id)}
                        className="mt-1 size-4 accent-forest-800"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold text-forest-900">{method.name}</span>
                          <span className="text-sm font-semibold text-forest-900">
                            {free ? "Free" : method.price}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {method.minDays === method.maxDays
                            ? `${method.minDays} day${method.minDays === 1 ? "" : "s"}`
                            : `${method.minDays}–${method.maxDays} days`}
                          {method.description ? ` · ${method.description}` : ""}
                        </span>
                        {method.freeOver && !free && (
                          <span className="mt-1 block text-xs text-muted">
                            Free over {method.freeOver}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <FieldError>{state.fieldErrors?.methodId}</FieldError>
        </section>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || !paymentsConfigured || configuredMethodsCount === 0 || !selectedMethod}
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Placing your order…
            </>
          ) : (
            <>
              <Lock />
              Pay {formatMoneyDecimal(total)}
            </>
          )}
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted">
          You will be redirected to PayHere to complete payment securely. Your order is
          only confirmed after the payment signature is verified on our server.
        </p>

        {state.status === "pay" && state.payhere && (
          <div className="rounded-md border border-line bg-cream-100 px-4 py-3 text-sm text-ink-soft">
            <p className="flex items-center gap-2 font-medium text-forest-900">
              <Loader2 className="size-4 animate-spin" />
              Redirecting to PayHere…
            </p>
            <p className="mt-1 text-xs text-muted">
              If nothing happens, use the button below.
            </p>
            <form ref={payhereFormRef} action={state.payhere.action} method="post" className="mt-3">
              {Object.entries(state.payhere.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <Button type="submit" variant="outline" size="sm">Continue to PayHere</Button>
            </form>
          </div>
        )}
      </form>

      <aside className="rounded-lg border border-line bg-white p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-forest-900">Order summary</h2>

        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-200">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-forest-900">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.variantLabel ? `${item.variantLabel} · ` : ""}
                  {item.saleMode === "WEIGHT" && item.weightGrams
                    ? formatWeight(item.weightGrams)
                    : `Qty ${item.quantity}`}
                </p>
              </div>
              <p className="text-sm text-forest-900">{item.lineTotal}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <dt>Subtotal</dt>
            <dd>{subtotal}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Delivery</dt>
            <dd>{shippingDisplay}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-forest-900">
            <dt>Total</dt>
            <dd>{formatMoneyDecimal(total)}</dd>
          </div>
        </dl>

        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-xs text-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
            Payments are verified server-side before an order is confirmed.
          </li>
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-gold-600" />
            Card details are entered on PayHere, never on this site.
          </li>
        </ul>

        <Link href="/cart" className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-forest-900 hover:underline">
          Edit cart
          <ArrowRight className="size-3" />
        </Link>
      </aside>
    </div>
  );
}
