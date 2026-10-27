# Ceylon Herbs and Spices

A production-oriented storefront for Sri Lankan herbs, spices and natural
products, with a database-driven admin panel. Built with Next.js (App Router),
React, TypeScript, Tailwind CSS, PostgreSQL and Prisma.

Catalogue content, delivery charges, blog posts, reviews, gallery media,
background music and site settings are managed in the admin panel. Public page
paragraphs and social links live in the editable `content/` folder. The seed
deliberately creates **no products, no delivery prices and no contact details**,
because those are real business decisions, not placeholders.

---

## Status

| Area | State |
| --- | --- |
| Design system, layout, header/footer, mobile navigation | Done |
| Homepage, categories, about, contact, FAQ, policy pages | Done |
| Auth: register, login, logout, database sessions, rate limiting | Done |
| Email verification, password reset, admin MFA/TOTP | Done |
| Account area: overview, orders, addresses, profile, security | Done |
| Admin shell, dashboard, settings, audit log | Done |
| Admin CRUD: products, categories, brands, gallery, blogs, reviews, orders | Done |
| Product catalogue, search, filters, product pages, wishlist | Done |
| Cart, guest/customer checkout, PayHere integration | Done |
| CSV/Excel product import, order CSV export | Done |
| Customer review photos, likes, moderation | Done |
| Gallery photos and videos, including a featured home-page video | Done |
| Storefront background music with admin upload and an active track | Done |
| File-based page copy (`content/site-copy.yaml`) and social links | Done |
| Local image, video and audio uploads with validation, quotas and cleanup | Done |
| Transactional email: verification, reset, paid order receipt | Done |

Live payments and transactional email require production credentials. See
`.env.example` and the deployment guide before launch.

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

SMTP is optional locally. Leave `SMTP_HOST` blank and verification/reset emails
are skipped with a warning in the server log.

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

The seed is idempotent. It never overwrites an existing admin password or store
settings.

### Run

```bash
npm run dev          # http://localhost:3000
npm run build
npm start
```

The first staff/admin sign-in is redirected to `/account/security` until the
account enrolls an authenticator app. Save the recovery codes shown once.

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
| `npm run uploads:cleanup` | Delete unreferenced uploads older than 24 hours |

## Environment variables

See `.env.example` for the full annotated list.

- `DATABASE_URL`, `SESSION_SECRET`, `APP_URL` — required.
- `TRUST_PROXY` — set `true` only behind Nginx/another trusted proxy.
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — only used by the seed.
- `PAYHERE_*` — sandbox credentials can be added now; checkout stays disabled
  until a merchant ID is configured.
- `SMTP_*`, `MAIL_FROM` — transactional email. Blank SMTP host disables email.
- `UPLOAD_RETENTION_HOURS` — grace period used by `npm run uploads:cleanup`.
- `CLOUDINARY_*` — reserved for future use; current uploads are local.

Secrets are read server-side only. No secret is exposed through a
`NEXT_PUBLIC_` variable.

## Project layout

```text
prisma/
  schema.prisma        Data model (users, catalogue, orders, CMS, audit)
  migrations/          Applied SQL migrations
  seed.ts              Idempotent seed — no fake catalogue content
scripts/
  dev-db.mjs           Portable PostgreSQL lifecycle for local dev
  cleanup-uploads.mjs  Daily orphaned-upload cleanup
content/
  site-copy.yaml       Editable public page headings and paragraphs
  social-links.yaml    Editable Facebook/Instagram/TikTok/YouTube links
  README.md            Editing and deployment instructions for this folder
src/app/(store)/       Public storefront routes
src/app/(auth)/        Login, register, forgot/reset password
src/app/account/       Customer account and security settings
src/app/admin/         Staff/admin dashboard (guarded)
src/app/api/           Auth, payment, export and upload route handlers
src/components/        UI primitives and composed components
src/lib/               Env, db, auth, MFA, email, uploads, money, actions
src/proxy.ts           Route guard + nonce-based CSP
```

## Security notes

- Sessions are database-backed. The cookie stores a random token; only its
  HMAC-SHA256 hash is persisted. Passwords use Argon2id.
- Staff and administrator sessions last 24 hours. Customer sessions use a
  60-day sliding lifetime.
- Staff/admin accounts must enable TOTP two-factor authentication before the
  admin area is available. Secrets are encrypted at rest with AES-256-GCM and
  recovery codes are stored as HMAC hashes.
- `requireUser` / `requireStaff` / `requireAdmin` re-check the database on every
  protected render. The proxy guard is only a fast redirect.
- Login, registration, password reset and uploads are rate-limited. Forwarded
  IP headers are trusted only when `TRUST_PROXY=true`.
- Image uploads are decoded with `sharp`, checked against a format/dimension/
  pixel allowlist, stripped of metadata, re-encoded to WebP and stored under a
  randomised filename. Video (MP4/WebM, 50 MB) and audio (MP3/M4A/OGG/WAV/WebM,
  20 MB) uploads are magic-byte checked, stored under randomised filenames and
  covered by daily per-user quotas and cleanup.
- Pages use a nonce-based Content-Security-Policy. Private routes also send
  `X-Robots-Tag: noindex`.
- JSON-LD is escaped before rendering, and CSV exports neutralise spreadsheet
  formula injection.
- PayHere notifications are signature-verified, idempotent and confirmed
  server-side before an order is marked paid or stock is decremented.

## Deployment (Hostinger VPS)

Recommended baseline: KVM 2 (2 vCPU, 8 GB RAM, 100 GB NVMe), Ubuntu 24.04 LTS.

1. Create a non-root user, harden SSH, enable the firewall (22/80/443).
2. Install Node.js 22, PostgreSQL 17, Nginx, Certbot and PM2.
3. Create the database and a dedicated PostgreSQL role.
4. Clone the repo to `/var/www/ceylon-herbs`, install with `npm ci`, set
   production env vars (including `TRUST_PROXY=true` and SMTP), then run
   `npm run db:deploy && npm run build`. Include the `content/` folder so the
   file-based copy and social links deploy with the app.
5. Run the app with PM2 (`next start`), with Nginx in front and Certbot SSL.
6. Sign in as the administrator, enroll MFA, and store the recovery codes.
7. Set the PayHere notify URL to the public HTTPS endpoint.
8. Add a daily cron for `npm run uploads:cleanup` and database/uploads backups.

Do not run the development database helper on the server — use the system
PostgreSQL service.

For the full step-by-step Hostinger deployment guide, firewall/SSH setup, Nginx
configuration, SSL, MFA enrolment, cron jobs, backups and go-live checks, see
[HOSTINGER-DEPLOYMENT.md](./HOSTINGER-DEPLOYMENT.md).

## Content policy

The brand voice is premium, natural and calm, but the claims are deliberately
conservative:

- No organic, fair-trade or quality certifications unless genuinely held.
- No medical or health benefit claims.
- No invented supplier partnerships or origin stories.
- No reviews written on a customer's behalf.
- Contact details stay hidden until configured in settings. Social links stay
  hidden until real URLs are added to `content/social-links.yaml`.

These rules are part of the product, not decoration — they apply to every new
page and module.
