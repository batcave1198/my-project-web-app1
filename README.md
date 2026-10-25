# Ceylon Herbs and Spices

A storefront for Sri Lankan herbs, spices and natural products, with a
database-driven admin panel. Built with Next.js (App Router), React,
TypeScript, Tailwind CSS, PostgreSQL and Prisma.

Everything shown to customers — categories, products, pages, FAQ entries,
delivery zones, discounts — is meant to be managed in the admin panel. No
catalogue content is hardcoded. The seed deliberately creates **no products,
no delivery prices and no contact details**, because those are real business
decisions, not placeholders.

---

## Status

This repository is being delivered in phases. What exists today is a working
foundation; the catalogue, cart, checkout and admin CRUD modules are still to
come.

| Area | State |
| --- | --- |
| Design system, layout, header/footer, mobile navigation | Done |
| Homepage, categories, about, contact (working form), FAQ, help pages | Done |
| Auth: register, login, logout, DB-backed sessions, rate limiting | Done |
| Account area: overview, order history shell | Partial — addresses/profile next |
| Admin shell, sidebar, dashboard with live data | Done |
| Admin CRUD modules (products, orders, discounts, CMS, settings…) | Not yet |
| Product catalogue, search, filters, PDP, wishlist | Not yet |
| Cart, guest checkout, PayHere integration | Not yet |
| CSV import/export, media import, review moderation, audit log UI | Not yet |

Legal pages deliberately state that the final policy text is being prepared. Do
not launch without replacing them with approved copy.

---

## Requirements

- Node.js 22+
- PostgreSQL 17
- npm 11

## Local setup

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Fill in `SESSION_SECRET` and `SEED_ADMIN_PASSWORD`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Database

Production and CI use a normal PostgreSQL server. For local development this
repo can drive a portable PostgreSQL build so nothing is installed globally:

```bash
npm run db:setup     # first time: initdb + createdb + start
npm run db:start     # later
npm run db:status
npm run db:stop
```

The cluster lives in `.devdb/` (git-ignored) and listens on port **5433**, which
matches the default `DATABASE_URL`. Point `PG_BIN` at your own PostgreSQL `bin`
directory if you use a different one.

Then apply the schema and seed:

```bash
npm run db:migrate     # prisma migrate dev
npm run db:seed
```

The seed is idempotent. It never overwrites an existing admin password or
store settings.

### Run

```bash
npm run dev          # http://localhost:3000
npm run build
npm start
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:setup` | Create the local portable cluster and database |
| `npm run db:start` / `db:stop` / `db:status` | Local cluster lifecycle |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed admin, settings, shipping zone, categories, FAQ |
| `npm run db:studio` | Prisma Studio |

## Environment variables

See `.env.example` for the full annotated list.

- `DATABASE_URL`, `SESSION_SECRET`, `APP_URL` — required.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — only used by the seed.
- `PAYHERE_*` — sandbox credentials can be added now; the store shows payment
  badges only when a merchant ID is configured.
- `CLOUDINARY_*` — media storage for product images.
- `SMTP_*` — transactional email.

Secrets are read server-side only. No secret is exposed through a
`NEXT_PUBLIC_` variable.

## Project layout

```
prisma/
  schema.prisma        Data model (users, catalogue, orders, CMS, audit)
  seed.ts              Idempotent seed — no fake catalogue content
scripts/dev-db.mjs     Portable PostgreSQL lifecycle for local dev
src/app/(store)/       Public storefront routes
src/app/(auth)/        Login and register
src/app/account/       Customer account
src/app/admin/         Staff/admin dashboard (guarded)
src/app/api/           Route handlers (logout now, payments later)
src/components/        UI primitives and composed components
src/lib/               Env, db, auth, money, settings, server actions
src/proxy.ts           Route matching + optimistic auth guard
```

## Security notes

- Sessions are database-backed. The cookie stores a random token; only its
  HMAC-SHA256 hash is persisted. Passwords use Argon2id.
- `requireUser` / `requireStaff` / `requireAdmin` re-check the database on every
  protected render. The proxy guard is only a fast redirect.
- Login, registration and the contact form are rate-limited and use
  timing-safe paths for unknown accounts.
- Admin and account routes send `X-Robots-Tag: noindex`.
- Payment confirmation will be verified server-side against PayHere before any
  order is marked paid or stock is decremented, and callbacks will be
  idempotent.

## Deployment (Hostinger VPS)

Recommended baseline: KVM 2 (2 vCPU, 8 GB RAM, 100 GB NVMe), Ubuntu 24.04 LTS.

1. Create a non-root user, harden SSH, enable the firewall (22/80/443).
2. Install Node.js 22, PostgreSQL 17, Nginx and Certbot.
3. Create the database and a dedicated PostgreSQL role.
4. Clone the repo to `/var/www/ceylon-herbs`, install with `npm ci`, set
   production env vars, then `npm run db:deploy && npm run build`.
5. Run the app with PM2 (`next start`) and a second PM2 process for background
   jobs once the CSV import worker exists.
6. Put Nginx in front as a reverse proxy; issue certificates with Certbot.
7. Set the PayHere notify URL to the public HTTPS endpoint.

Do not run the development database helper on the server — use the system
PostgreSQL service.

## Content policy

The brand voice is premium, natural and calm, but the claims are deliberately
conservative:

- No organic, fair-trade or quality certifications unless genuinely held.
- No medical or health benefit claims.
- No invented supplier partnerships or origin stories.
- No reviews written on a customer's behalf.
- Contact details and social links stay hidden until configured in settings.

These rules are part of the product, not decoration — they apply to every new
page and module.
