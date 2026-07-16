# MVR IT Services LTD — Marketing Website

Static marketing website, built for GitHub Pages. No build step, no frameworks — pure HTML/CSS/JS.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Services | `services.html` |
| Products (XLeShop, School, Hospital, Sthira, Events/QR, Telemarketing) | `products.html` |
| About | `about.html` |
| Contact | `contact.html` |
| Privacy Policy (UK GDPR) | `privacy.html` |
| Terms of Service | `terms.html` |
| Cookie Policy | `cookies.html` |
| Not found | `404.html` |

Shared assets live in `assets/` (CSS design system, JS behaviour, SVG logo + favicon).

## ✅ Before going live — replace these placeholders

Search the whole project for each token:

| Placeholder | Where | Replace with |
|---|---|---|
| `[COMPANY-NUMBER]` | every footer + legal pages | Companies House registration number (legally required on the site for a UK LTD) |
| `YOUR_FORM_ID` | `contact.html` form action | Formspree form ID (free at formspree.io) — needed because GitHub Pages has no backend |

Already filled in: contact email (sales@mvritservices.com), phone (07446 228152), registered office (Reading, United Kingdom), domain (mvritservices.com in CNAME/sitemap/robots).

Also have a solicitor review `privacy.html` and `terms.html` — they are solid UK-oriented starting templates, not legal advice.

## Deploying to GitHub Pages

1. Create a repository on GitHub (e.g. `mvr-website`).
2. Push this folder:
   ```
   git init
   git add .
   git commit -m "MVR IT Services website"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<repo>.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. The site goes live at `https://<your-user>.github.io/<repo>/`.

### When your custom domain is ready

1. **Settings → Pages → Custom domain** — enter the domain; GitHub creates a `CNAME` file.
2. At your DNS provider: a `CNAME` record from `www` to `<your-user>.github.io`, and `A`/`ALIAS` records for the apex to GitHub Pages IPs (185.199.108.153 / .109 / .110 / .111).
3. Tick **Enforce HTTPS** once the certificate is issued.
4. Update `sitemap.xml` and `robots.txt` with the domain.

### Note on 404.html

`404.html` is fully self-contained (inline styles, home link computed at runtime), so it works unchanged on project pages (`user.github.io/repo/`), user pages and custom domains. All other pages use relative paths and work everywhere.

## Design system

- Theme: dark futuristic, golden glow gradients (`assets/css/style.css` — all colours are CSS variables in `:root`)
- Fonts: Sora (headings) + Inter (body) via Google Fonts
- Behaviour (`assets/js/main.js`): mobile nav, sticky header, scroll-reveal, animated counters, cookie-consent banner (localStorage, analytics-ready)
