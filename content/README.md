# Storefront copy and social links

This folder is the editable, file-based content layer for the public shop. You
do **not** need to use the admin dashboard or a database editor to change the
paragraphs or social links in this folder.

- `site-copy.yaml` — headings, paragraphs, buttons and empty-state text used
  across the public storefront.
- `social-links.yaml` — Facebook, Instagram, TikTok and optional YouTube links
  used in the footer and on the contact page.

Both files are read on the server when a public page is requested. Save a file
and refresh the page to see the change. A production server must have the
updated file deployed or edited in place; the site does not rebuild its copy
from these files at build time.

---

## Editing `site-copy.yaml`

The file is grouped by page or shared area. Edit only the text after the colon.
Keep the key names and indentation exactly as they are.

```yaml
about:
  hero:
    eyebrow: Our story
    title: Rooted in Ceylon
    body: >-
      This is a paragraph. Folded lines are joined with spaces when the page
      is displayed.
```

Rules:

1. **Keep the indentation.** YAML uses spaces, never tabs. A child key must be
   indented two spaces under its parent.
2. **Plain text is fine.** If a value contains `:` followed by a space, starts
   with a special character, or contains `#`, wrap it in double quotes:
   `title: "Ceylon: an island of spice"`.
3. **Long paragraphs** use `>-` as shown above. Put the text on the following
   lines, indented two extra spaces. You can also write a single long line.
4. **Arrays and lists** (for example `home.hero.stats` and the values on the
   about page) replace the whole list. Keep the `-` items and their indentation
   aligned if you edit them.
5. **Missing keys fall back to the built-in defaults.** If a key is removed
   accidentally, the page still loads using the default text. An unknown key is
   ignored.
6. **Order-status copy supports placeholders.** In `checkout.success` and
   `checkout.failed`, `{email}` is replaced with the customer email and `{order}`
   with the order number. Keep the braces exactly as shown.
7. **Keep product-specific facts in the product editor.** Origin, ingredients,
   weight, price and stock are managed in the admin dashboard, not here.

### Sections

| Key | Used on |
| --- | --- |
| `common` | Shared labels such as the contact button |
| `footer` | Footer description |
| `home` | Home page hero, category strip, featured products, story and highlights |
| `about` | About page hero, story, standards, range and closing section |
| `contact` | Contact page intro, form support text and social area |
| `gallery` | Gallery page heading and empty state |
| `reviews` | Reviews page heading, empty state and review form intro |
| `shop` | Shop page heading, search, filter labels and empty state |
| `categories` | Categories page heading and empty state |
| `deals` | Deals page heading and body |
| `wishlist` | Wishlist page heading, body and buttons |
| `cart` | Cart page heading, summary labels and empty state |
| `checkout` | Secure checkout heading, payment note and paid/failed/pending order states |
| `faq` | FAQ page heading, empty state and support footer |
| `blogs` | Blogs list and blog detail headings, empty states and sidebar copy |
| `product` | Product page delivery note, review headings, empty states and related products |
| `policies` | Shared pending-policy text plus privacy, terms, cookie, shipping and returns copy |
| `auth` | Sign in, register, forgot-password and reset-password intros |

### Suggested workflow

1. Open `site-copy.yaml` in any text editor.
2. Change the sentence or heading.
3. Save the file.
4. Refresh the public page. If the old text still appears, confirm the file was
   saved in the correct folder and that the server process can read it.
5. If the YAML is invalid, the server keeps the old or default copy and logs a
   warning. Check indentation and quotes first.

---

## Editing `social-links.yaml`

Use full `http://` or `https://` URLs:

```yaml
facebook: "https://www.facebook.com/your-page"
instagram: "https://www.instagram.com/your-account"
tiktok: "https://www.tiktok.com/@your-account"
youtube: ""
```

- Leave a value as `""` to hide that icon. Facebook, Instagram and TikTok are
  the required shop links; YouTube is optional.
- Only `http` and `https` links are used. Invalid or non-web URLs are ignored.
- These links drive both the footer and the contact page. The database social
  setting is no longer the source of truth.
- Save the file and refresh the page to see the icons change.

---

## Production notes

The app runs from the project root with `next start`. It reads these files from
`content/` at request time, so a change made directly on the server is picked
up on the next request without restarting PM2 or rebuilding Next.js.

When deploying from Git, include the `content/` folder. Do not delete it during
cleanup. Keep the files outside the `public/` folder so they are never served as
raw downloads.

The admin dashboard still manages products, categories, gallery media, blog
posts, reviews, delivery, orders and background music. This folder is only for
the public page copy and social URLs.
