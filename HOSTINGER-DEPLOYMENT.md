# Hostinger Deployment Guide

Ceylon Herbs and Spices — production deployment on a Hostinger VPS.

This guide assumes the latest `main` branch is on GitHub and that the VPS is a
fresh **Ubuntu 24.04 LTS** install.

---

## 1. Hostinger plan

**Do not use a normal Hostinger shared hosting plan for this app.**

This project needs:

- Node.js 22+ (Next.js server)
- PostgreSQL 17
- A persistent filesystem for uploaded images
- Nginx, SSL, PM2 and firewall access

Recommended Hostinger VPS:

- **KVM 2** — 2 vCPU, 8 GB RAM, 100 GB NVMe
- **Ubuntu 24.04 LTS**

A smaller KVM 1 may run the app, but `next build` can run out of memory. If you
must use KVM 1, add swap (see §3.7).

---

## 2. Before you start

### Hosting and domain

- [ ] Buy the Hostinger VPS (`KVM 2`, Ubuntu 24.04 LTS)
- [ ] Note the VPS IPv4 address
- [ ] Buy or choose the domain name
- [ ] Set DNS:
  - `A` record for `@` → VPS IP
  - `A` record for `www` → VPS IP
- [ ] Wait for DNS to propagate
- [ ] Set up SSH key access before disabling root password login

### Code and secrets

- [ ] Commit and push the latest code to GitHub
- [ ] If the repository is private, add a deploy key or GitHub access token to
      the server
- [ ] Choose a strong PostgreSQL password
- [ ] Generate a 48-byte `SESSION_SECRET`
- [ ] Choose a strong production admin password
- [ ] Keep database passwords, `SESSION_SECRET` and PayHere secrets out of Git

### Payments

- [ ] Create a PayHere merchant account
- [ ] Get the PayHere Merchant ID and Merchant Secret
- [ ] Add/approve the production domain in PayHere
- [ ] Test with `PAYHERE_MODE="sandbox"` first
- [ ] Switch to `PAYHERE_MODE="live"` only after a successful sandbox payment

### Email

Transactional email is implemented, but it needs SMTP credentials:

- [ ] Create a mailbox or SMTP user with Hostinger Email (or another provider)
- [ ] Collect `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- [ ] Decide the `MAIL_FROM` address (usually `no-reply@yourdomain.com`)

Hostinger’s usual settings are `smtp.hostinger.com` with port `465` (SSL/TLS)
or port `587` (STARTTLS). Confirm the exact values in hPanel.

### Business content

After deployment, add these through the admin panel:

- [ ] Store name, contact email, phone, and address
- [ ] WhatsApp and social links
- [ ] Categories
- [ ] Products: names, prices, weights, stock, descriptions and photos
- [ ] Delivery zones and delivery charges
- [ ] Free-delivery threshold, if any
- [ ] FAQ, shipping/returns/privacy/terms content
- [ ] Homepage content
- [ ] Gallery photos
- [ ] Blog posts and approved reviews, if needed

> `npm run db:seed` does **not** create products, blogs, or reviews. Those must
> be added in the admin panel.

### Existing data decision

Choose one:

- [ ] **Fresh production site** — start with the seeded database and add content
      through the admin panel
- [ ] **Copy current local data** — export the local PostgreSQL database and copy
      `public/uploads` (see §13)

Do not copy the local `.devdb` folder directly to the VPS. Use
`pg_dump` / `pg_restore` instead.

---

## 3. Server setup

Log in as root:

```bash
ssh root@YOUR_SERVER_IP
```

### 3.1 Create a non-root deployment user

```bash
adduser deploy
usermod -aG sudo deploy
```

Copy your SSH key to the new user (do this before disabling root login):

```bash
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Test a new session in a second terminal:

```bash
ssh deploy@YOUR_SERVER_IP
sudo whoami
```

### 3.2 Harden SSH

Only do this after key-based login for `deploy` is confirmed working.

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sudo nano /etc/ssh/sshd_config
```

Set or confirm:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Then reload and keep the current session open while you test another one:

```bash
sudo systemctl reload ssh
ssh deploy@YOUR_SERVER_IP
```

### 3.3 Install system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw certbot python3-certbot-nginx unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Optional but recommended for intrusion protection:

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

### 3.4 Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 3.5 Install PM2

```bash
sudo npm install -g pm2
pm2 install pm2-logrotate
```

### 3.6 Install PostgreSQL 17

Ubuntu 24.04’s default repository may not contain PostgreSQL 17. Add the
official PostgreSQL repository:

```bash
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(. /etc/os-release && echo $VERSION_CODENAME)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-17
```

Check:

```bash
psql --version
sudo systemctl status postgresql
```

### 3.7 Add swap (KVM 1 only)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3.8 Enable the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Do **not** expose PostgreSQL port `5432` publicly.

---

## 4. Create the production database

```bash
sudo -u postgres psql
```

Inside PostgreSQL:

```sql
CREATE ROLE ceylon LOGIN PASSWORD 'STRONG_DATABASE_PASSWORD';
CREATE DATABASE ceylon OWNER ceylon ENCODING 'UTF8' TEMPLATE template0;
\q
```

Production connection string:

```env
DATABASE_URL="postgresql://ceylon:STRONG_DATABASE_PASSWORD@127.0.0.1:5432/ceylon?schema=public"
```

If the password contains URL characters such as `@`, `:`, `/`, or `#`, URL-encode
them or choose an alphanumeric password.

Confirm PostgreSQL only listens locally:

```bash
sudo ss -ltnp | grep 5432
```

It should show `127.0.0.1:5432`, not `0.0.0.0:5432`.

---

## 5. Deploy the application

```bash
sudo mkdir -p /var/www/ceylon-herbs
sudo chown deploy:deploy /var/www/ceylon-herbs
git clone https://github.com/batcave1198/my-project-web-app1.git /var/www/ceylon-herbs
cd /var/www/ceylon-herbs
npm ci
```

### 5.1 Production environment file

```bash
nano .env
```

Use this template:

Do not put `NODE_ENV` in `.env`. `next start` sets it to `production`
automatically; overriding it disables secure cookies and production CSP rules.

```env
APP_URL="https://yourdomain.com"

DATABASE_URL="postgresql://ceylon:STRONG_DATABASE_PASSWORD@127.0.0.1:5432/ceylon?schema=public"

SESSION_SECRET="REPLACE_WITH_A_48_BYTE_RANDOM_SECRET"

# Nginx is in front of the app, so forwarded IP headers are trusted.
TRUST_PROXY="true"

SEED_ADMIN_EMAIL="admin@yourdomain.com"
SEED_ADMIN_PASSWORD="STRONG_ADMIN_PASSWORD"

PAYHERE_MODE="sandbox"
PAYHERE_MERCHANT_ID=""
PAYHERE_MERCHANT_SECRET=""
PAYHERE_NOTIFY_URL="https://yourdomain.com/api/payments/payhere/notify"

SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="no-reply@yourdomain.com"
SMTP_PASSWORD="YOUR_EMAIL_PASSWORD"
MAIL_FROM="Ceylon Herbs and Spices <no-reply@yourdomain.com>"

UPLOAD_RETENTION_HOURS="24"
```

Generate `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Notes:

- `TRUST_PROXY="true"` is required behind Nginx. Leave it `false` if the app is
  ever exposed directly without a trusted proxy.
- Use `SMTP_PORT="587"` if your provider expects STARTTLS instead of SSL.
- Do not add `NEXT_PUBLIC_` secrets.

Protect the file:

```bash
chmod 600 .env
```

### 5.2 Apply the schema and seed

```bash
npm run db:deploy
npm run db:seed
```

`db:seed` is intended for the first deployment only. After the first
administrator signs in successfully, remove both `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` from `.env` and restart PM2. The seed never overwrites an
existing password, but removing the values makes an accidental later seed run
abort before it can create or promote an account.

### 5.3 Build and test locally on the server

```bash
npm run build
npm start
```

In another SSH session:

```bash
curl -I http://127.0.0.1:3000/login
curl -sI http://127.0.0.1:3000/login | grep -i content-security-policy
```

The CSP header should contain a per-request `nonce-...` value. Stop the test
process with `Ctrl + C`.

### 5.4 File permissions

```bash
cd /var/www/ceylon-herbs
sudo chown -R deploy:deploy /var/www/ceylon-herbs
chmod 600 .env
mkdir -p public/uploads
chmod 755 public/uploads
```

The app must be able to write to `public/uploads`. Never make the whole project
world-writable.

---

## 6. Run the app with PM2

```bash
cd /var/www/ceylon-herbs
pm2 start npm --name ceylon-herbs -- start
pm2 save
pm2 startup
```

Run the `sudo` command printed by `pm2 startup`, then check:

```bash
pm2 status
pm2 logs ceylon-herbs
curl -I http://127.0.0.1:3000
```

Useful commands:

```bash
pm2 restart ceylon-herbs
pm2 stop ceylon-herbs
pm2 delete ceylon-herbs
pm2 logs ceylon-herbs --lines 200
```

---

## 7. Nginx reverse proxy

Create the proxy connection map once:

```bash
sudo nano /etc/nginx/conf.d/ceylon-upgrade.conf
```

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Create the site configuration:

```bash
sudo nano /etc/nginx/sites-available/ceylon-herbs
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # The app accepts images up to 5MB; multipart overhead needs a little more.
    client_max_body_size 6M;

    # Uploaded images are immutable, random filenames. Serve them directly.
    # Block anything that is not an allowed image type, even if a file is
    # accidentally written to this directory outside the upload pipeline.
    location ~* ^/uploads/.*\.(php|phtml|phar|html?|svg|xml|js|mjs|css|txt|json)$ {
        return 404;
    }

    location /uploads/ {
        alias /var/www/ceylon-herbs/public/uploads/;
        access_log off;
        add_header Cache-Control "public, max-age=2592000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        autoindex off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Overwrite, do not append: the app trusts the right-most address.
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable the site and disable the default site if present:

```bash
sudo ln -s /etc/nginx/sites-available/ceylon-herbs /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Check from your own computer:

```bash
curl -I http://YOUR_SERVER_IP
```

Login and upload rate limits are enforced in the application database. Nginx
body-size limits are an additional guard; do not remove them.

---

## 8. SSL certificate

DNS must point to the VPS before running Certbot.

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Choose the option to redirect HTTP to HTTPS.

Renewal check:

```bash
sudo certbot renew --dry-run
```

After HTTPS works, update `.env` if the domain changed:

```env
APP_URL="https://yourdomain.com"
PAYHERE_NOTIFY_URL="https://yourdomain.com/api/payments/payhere/notify"
```

Restart PM2 after changing `.env`:

```bash
pm2 restart ceylon-herbs
```

---

## 9. First administrator login and MFA

1. Open `https://yourdomain.com/login`.
2. Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
3. The app redirects staff/admin accounts to `/account/security?required=1`.
4. Scan the QR code with an authenticator app.
5. Enter the 6-digit code and turn on two-factor authentication.
6. **Save the recovery codes shown once.** They are the only way back in if the
   authenticator device is lost.
7. Click **Continue** to enter `/admin`.

Admin access stays blocked until MFA is enabled. Recovery codes are single-use;
staff who lose both their authenticator and recovery codes need a database
assisted reset.

Also test:

- [ ] Password reset from `/forgot-password`
- [ ] Email verification from `/account/security`
- [ ] A normal customer registration/login
- [ ] Uploading a product image
- [ ] Creating a draft product and publishing it

If email does not arrive, check `pm2 logs ceylon-herbs` and confirm the SMTP
settings and `MAIL_FROM` mailbox.

---

## 10. Upload cleanup cron

Uploads that are never attached to a product, blog, review or gallery item are
removed after 24 hours. Create a log file and add a daily cron job:

```bash
mkdir -p /home/deploy/logs
crontab -e
```

Add:

```cron
15 3 * * * cd /var/www/ceylon-herbs && /usr/bin/npm run uploads:cleanup >> /home/deploy/logs/uploads-cleanup.log 2>&1
```

Test it manually once:

```bash
cd /var/www/ceylon-herbs
npm run uploads:cleanup
tail -n 20 /home/deploy/logs/uploads-cleanup.log
```

The cleanup only deletes local files under `public/uploads` that are older than
`UPLOAD_RETENTION_HOURS` **and** not referenced by the database.

---

## 11. Backups

Create the backup directory once:

```bash
sudo mkdir -p /var/backups/ceylon
sudo chown deploy:deploy /var/backups/ceylon
```

Create a PostgreSQL password file for cron:

```bash
nano /home/deploy/.pgpass
```

Add one line (no spaces):

```text
127.0.0.1:5432:ceylon:ceylon:STRONG_DATABASE_PASSWORD
```

```bash
chmod 600 /home/deploy/.pgpass
```

Database backup:

```bash
pg_dump -h 127.0.0.1 -U ceylon -d ceylon -Fc \
  -f /var/backups/ceylon/ceylon-$(date +%F).dump
```

Uploads backup:

```bash
tar -czf /var/backups/ceylon/uploads-$(date +%F).tar.gz \
  -C /var/www/ceylon-herbs/public uploads
```

Add both to cron:

```cron
0 2 * * * pg_dump -h 127.0.0.1 -U ceylon -d ceylon -Fc -f /var/backups/ceylon/ceylon-$(date +\%F).dump
30 2 * * * tar -czf /var/backups/ceylon/uploads-$(date +\%F).tar.gz -C /var/www/ceylon-herbs/public uploads
```

Recommended:

- Keep daily PostgreSQL backups.
- Keep daily or weekly uploads backups.
- Copy backups off the VPS (Hostinger snapshot, object storage, or another
  machine).
- Take a VPS snapshot before major updates.
- Store the production `.env` in a password manager.
- Test restoring a backup, not just creating one.

Restore database example:

```bash
pm2 stop ceylon-herbs
pg_restore -h 127.0.0.1 -U ceylon -d ceylon --clean --if-exists \
  /var/backups/ceylon/ceylon-YYYY-MM-DD.dump
pm2 restart ceylon-herbs
```

Restore uploads example:

```bash
cd /var/www/ceylon-herbs
tar -xzf /var/backups/ceylon/uploads-YYYY-MM-DD.tar.gz -C public
chown -R deploy:deploy public/uploads
```

---

## 12. Go-live checklist

- [ ] `https://yourdomain.com` loads correctly
- [ ] `www` and non-`www` both work
- [ ] HTTPS certificate is valid
- [ ] Security headers include a nonce-based CSP
- [ ] Admin login works and MFA enrolment was completed
- [ ] Recovery codes are stored offline
- [ ] A non-MFA staff account is forced to `/account/security`
- [ ] Admin can create and publish a product with an image
- [ ] Customer registration/login works
- [ ] Verification and password-reset emails arrive
- [ ] Cart and checkout work
- [ ] PayHere sandbox payment completes
- [ ] PayHere notification reaches `/api/payments/payhere/notify`
- [ ] Paid order confirmation email arrives
- [ ] Order appears in the admin order list
- [ ] Product stock changes correctly
- [ ] Blog/review image uploads work
- [ ] Oversized/invalid files are rejected
- [ ] Upload cleanup cron runs
- [ ] Mobile layout works
- [ ] Test on a real phone
- [ ] A database and uploads backup has been taken and restored once

---

## 13. Moving current local data to production

Only do this if the current products, blogs, reviews and images must go live.

### 13.1 Dump the local database

Run this on the local Windows PC from the project folder:

```powershell
& "$env:LOCALAPPDATA\pg17\pgsql\bin\pg_dump.exe" `
  -h 127.0.0.1 `
  -p 5433 `
  -U postgres `
  -d ceylon_dev `
  -Fc `
  -f ceylon.dump
```

Upload it to the VPS:

```powershell
scp .\ceylon.dump deploy@YOUR_SERVER_IP:/tmp/ceylon.dump
```

### 13.2 Restore into the fresh production database

Run this on the VPS:

```bash
sudo -u postgres pg_restore \
  -d ceylon \
  --no-owner \
  --role=ceylon \
  /tmp/ceylon.dump
```

Verify:

```bash
cd /var/www/ceylon-herbs
npm run db:deploy
```

Do **not** run `npm run db:seed` after restoring a full database unless the admin
account is missing/deleted.

### 13.3 Copy uploaded images

Upload `public/uploads` from the local project to the same path on the VPS:

```powershell
scp -r .\public\uploads deploy@YOUR_SERVER_IP:/var/www/ceylon-herbs/public/
```

Set ownership:

```bash
sudo chown -R deploy:deploy /var/www/ceylon-herbs/public/uploads
```

If the database references Cloudinary URLs from older data, those images stay on
Cloudinary. New uploads are stored locally and re-encoded to WebP.

### 13.4 MFA and SESSION_SECRET when copying a database

MFA secrets and recovery-code hashes are derived from `SESSION_SECRET`. If the
local database has an MFA-enabled administrator and production uses a different
`SESSION_SECRET`, that account cannot complete the MFA challenge after restore.

Choose one:

- Disable MFA on the local admin before the dump, restore, then re-enroll it
  after the first production login.
- Or, after restore, clear MFA for that one account:

```bash
sudo -u postgres psql -d ceylon -c \
  "UPDATE \"User\" SET \"mfaEnabled\"=false, \"mfaSecret\"=NULL, \"mfaRecoveryCodes\"=ARRAY[]::text[] WHERE email='admin@yourdomain.com';"
```

Then sign in with the restored password and enroll MFA again. Do not reuse the
local development `SESSION_SECRET` in production unless you accept that it was
never treated as a secret.

---

## 14. Updating the live site

After pushing new code to GitHub:

```bash
cd /var/www/ceylon-herbs
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart ceylon-herbs
pm2 logs ceylon-herbs --lines 100
```

If the build fails, do not restart PM2; fix the error first. The previous build
may still be running.

Before a risky update:

```bash
pg_dump -h 127.0.0.1 -U ceylon -d ceylon -Fc -f /var/backups/ceylon/pre-update-$(date +%F).dump
tar -czf /var/backups/ceylon/pre-update-uploads-$(date +%F).tar.gz -C /var/www/ceylon-herbs/public uploads
```

---

## 15. Security and operations notes

### Sessions and MFA

- Customer sessions use a 60-day sliding lifetime.
- Staff/admin sessions use a 24-hour lifetime.
- Staff/admin accounts must have MFA enabled before `/admin` is available.
- MFA secrets are encrypted with `SESSION_SECRET`. Do not rotate
  `SESSION_SECRET` without planning for MFA re-enrollment, because existing TOTP
  secrets and recovery-code hashes depend on it.

### Image uploads

- Files are validated by decoding their actual bytes with `sharp`.
- Only JPEG, PNG, WebP, AVIF and GIF inputs are accepted.
- Inputs are limited to 5MB, 8000px, 40 megapixels and 120 animated frames.
- Every upload is re-encoded to WebP with metadata stripped.
- Per-user daily quotas and per-user/per-IP rate limits apply.
- `public/uploads` is git-ignored and must be backed up separately.
- Cloudinary variables are reserved for future use; new uploads are local.

### Transactional email

SMTP is wired for:

- Email verification
- Password reset
- Paid order confirmation

Registration and checkout must not fail if SMTP is down. Check PM2 logs for
`[email]` warnings. The app skips sending when `SMTP_HOST` is blank.

### PayHere

Checkout payment is disabled until valid PayHere credentials are configured.
Test in sandbox mode before switching to live. The notify URL must be public
HTTPS and reachable without a login.

### Dynamic rendering and CSP

Pages are rendered dynamically so each request receives a fresh CSP nonce.
Do not put a full-page CDN cache in front of HTML without accounting for this.
Static assets and `/uploads/` can be cached normally.

### Trusted proxy

Set `TRUST_PROXY="true"` only when Nginx (or another trusted proxy) is directly
in front of the app and overwrites `X-Real-IP` / `X-Forwarded-For`. If the app is
exposed directly, leave it `false`; otherwise clients can spoof IPs and evade
rate limits.

### Do not expose secrets

Never commit:

- `.env`
- database passwords
- `SESSION_SECRET`
- PayHere Merchant Secret
- SMTP password
- SSH private keys

### Logs

```bash
pm2 logs ceylon-herbs --lines 200
sudo journalctl -u nginx --lines 100
sudo tail -f /home/deploy/logs/uploads-cleanup.log
```

---

## 16. Optional operational improvements

These are not required for launch:

- Add automated deployment or rollback scripts.
- Add uptime monitoring and an alerting channel.
- Copy database/uploads backups to off-site storage automatically.
- Add a repeatable QA sample-data seed if you need a staging catalogue.
- Add multiple Nginx app instances and load balancing if traffic grows.
