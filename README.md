# MVR IT Services LTD — Marketing Website

Static marketing website + PWA, live at **https://mvritservices.com** (GitHub Pages, `main` branch, root). No build step, no frameworks — pure HTML/CSS/JS.

## Structure (clean URLs)

| URL | File |
|---|---|
| `/` | `index.html` |
| `/services/` | `services/index.html` |
| `/products/` | `products/index.html` |
| `/about/` | `about/index.html` |
| `/contact/` | `contact/index.html` |
| `/privacy/` `/terms/` `/cookies/` | UK-GDPR legal pages |
| `/thanks/` | contact-form success page |
| any bad URL | `404.html` (self-contained) |

Every page uses root-absolute links (`/services/`, `/assets/...`), which works on the custom domain. Shared assets in `assets/` (CSS design system, JS behaviour, SVG logo, PNG PWA icons).

## PWA

- `manifest.webmanifest` — installable app manifest (icons 192/512 + maskable, generated from the logo).
- `sw.js` — service worker: network-first for pages, cache-first for assets, offline fallback. Registered from `assets/js/main.js` (HTTPS only).
- **When deploying changes, bump `VERSION` in `sw.js`** (e.g. `mvr-v1` → `mvr-v2`) so returning visitors' caches refresh.

## Contact form

FormSubmit.co (free, no account) → sales@mvritservices.com (activated). Honeypot spam filter, table email template, redirect to `/thanks/`.

## Design system

- Theme: dark futuristic, golden glow gradients — all colours are CSS variables in `assets/css/style.css` `:root`.
- Fonts: Sora (headings) + Inter (body) via Google Fonts.
- Effects: sparkle canvas in heroes, animated gradient text, card shine sweep, button glint, tech-stack marquee, scroll reveal, animated counters. All respect `prefers-reduced-motion`.
- Behaviour (`assets/js/main.js`): mobile nav, sticky header, cookie-consent banner (localStorage, analytics-ready), service-worker registration.

## Company facts on site

Company No. 10251131 (England & Wales) · Registered office: Reading, United Kingdom · sales@mvritservices.com · 07446 228152.

## Deploying

Push to `main` — GitHub Pages publishes automatically. Domain: CNAME file (`mvritservices.com`) + GoDaddy DNS A records to GitHub Pages IPs + `www` CNAME to `vmanthani.github.io`; HTTPS enforced.

Legal pages are solid UK-oriented templates — have a solicitor review before relying on them.
