# MVR Tools

**1,034 working tools** for mvritservices.com — calculators, converters and web/developer utilities.
Static HTML, no backend, works offline, styled as part of the main site.

## What this actually is

A **build system**, not 1,015 hand-written pages. Two data files define everything:

| File | Defines | Produces |
|---|---|---|
| `engine/units.js` | 12 dimensions, 108 units | **1,004** converter pages |
| `engine/tools.js` | 11 calculator specs | **11** calculator pages |
| `engine/devtools.js` | 20 web/developer tool specs | **20** developer pages |
| `engine/qr.js` | QR encoder (from scratch, no deps) | powers the QR generator |

`build.js` reads both and emits static HTML with the MVR header, footer and
full SEO markup. Fix a rounding bug once, rebuild, all 1,015 pages are fixed.

## Commands

```bash
npm install       # jsdom, for the DOM tests only — the site ships zero deps
node test.js      # 399 assertions across 6 suites
node build.js     # generates ./dist
cd dist && python3 -m http.server 8000
```

## Deploying to mvritservices.com

`build.js`, top of file:

```js
const PARENT = 'https://www.mvritservices.com';
const SITE   = PARENT + '/tools';   // change if you mount elsewhere
```

`SITE` drives canonicals, sitemaps and JSON-LD. `PARENT` drives every
header/footer link back into the main site. Upload `dist/` to `/tools/`.
Serve over HTTPS or the service worker will not register.

Then add a link to `/tools/` in the main site's nav and footer, and submit
`https://www.mvritservices.com/tools/sitemap.xml` to Search Console.

## Brand alignment

Design tokens are lifted verbatim from your `assets/css/style.css` — same
`--bg-0: #06080f`, same gold ramp, same Sora/Inter pairing, same 78px
header, same four-column footer with the company registration block.
The header adds two controls: tool search and a theme switch.

Nav is Home · Services · Products · **Tools** · Get a Quote, with Tools
marked `active` and the gold CTA preserved.

## Navigation & icons

### Left sidebar

Every page carries a category rail with all 21 destinations and live counts:

- **≥1080px** — sticky sidebar, part of the page, scrolls independently
- **below** — off-canvas drawer behind an "All 1,034 tools" button, with a
  scrim, `Escape` to close, focus moved into the panel on open and returned
  to the trigger on close, and background scroll locked while open

The current category is marked `is-active` at build time, so it is correct
before any JavaScript runs and stays correct with JavaScript disabled.

### Icon set

`assets/icons.svg` — **56 hand-drawn symbols**, one per category, conversion
family, calculator, developer tool and UI control. One 24×24 grid, 1.75
stroke, round caps, `currentColor` throughout.

This replaced emoji, which were a genuine problem rather than a style
preference: they render differently on Windows, macOS, Android and iOS, cannot
take the brand gold, and several (⚖️ 🔄 ⚙️) are near-identical at 16px.

Delivery is one cached sprite referenced by `<use href="…icons.svg#i-name">`.
The alternative — inlining SVG per card — would have cost real weight, since
the length conversion index alone has 306 cards. One request, 3.4 KB, cached
by the service worker and reused across all 1,056 pages.

Card icons sit in a 52px tinted tile (64px on the home page), scaling to 44px
on phones. Adding a tool automatically gets an icon if a matching `#i-<id>`
symbol exists — the build has a coverage check, and the test suite fails if any
reference does not resolve.

## Light / dark / system

Three modes, set on `<html data-theme>`:

- `dark` — your brand palette, unchanged. **Default.**
- `light` — derived from the same hues, contrast-checked.
- `system` — follows `prefers-color-scheme`.

Choice persists in `localStorage` and is applied by an inline script
before first paint, so there is no white flash on load.

**Dark is the default deliberately**, because mvritservices.com is dark-only
and a click through from the main site should not flash white. To default to
`system` instead, change the fallback in the inline script in `build.js` and
in `current()` in `assets/app.js`.

### Why light mode is not just the gold on white

`#f7c948` measures **1.57:1** on white — far below the 4.5:1 needed for text.
Light mode keeps gold for fills, borders and the readout well, and uses a
deepened bronze from the same hue family for links and accent text:

| Token | Light value | Contrast |
|---|---|---|
| `--accent`, `--link` | `#7d5200` | 6.82:1 on white |
| `--text-1` | `#0d1220` | 18.7:1 |
| `--text-2` | `#4a5568` | 7.5:1 |
| `--text-3` | `#5c6a80` | 5.5:1 |

Dark mode: gold on `--bg-0` measures 12.8:1. All AA, most AAA.

The readout panel stays dark in both modes. It is an instrument display —
inverting it would make it read as an error state.

## Verified numbers (measured, not estimated)

```
Home page, first visit          19.6 KB gzipped
Converter page, first visit     22.9 KB gzipped
Calculator page, first visit    28.7 KB gzipped
JSON formatter                  29.9 KB gzipped
QR generator (incl. encoder)    34.3 KB gzipped
Icon sprite (cached once)        3.4 KB gzipped
Search index, on first use     + 8.8 KB (lazy, not on page load)
Repeat visits                    0 KB  (service worker, cache-first)
Render-blocking requests         1     (app.css; fonts and JS are async/deferred)
Pages generated                  1,056
Valid JSON-LD                    1,056/1,056
Rendered titles over 70 chars    0/1,056
Broken internal links            0 / 3,388 sampled
Icon references resolved         28,458 / 28,458
Pages containing emoji           0
```

The sidebar adds roughly 2 KB gzipped per page. That is a deliberate trade:
it also puts 22 internal links on every page, which flattens crawl depth
across the whole site — every category is one hop from anywhere.

Code is split so no page carries what it does not use: the calculator
renderer and the developer renderer are separate files, and each developer
tool ships only its own spec. Bundling all twenty together cost ~16 KB
gzipped per visit.

Tests, **399 assertions across six suites, all passing**:

| Suite | Covers |
|---|---|
| Unit conversions | 43 assertions + 5,020 round-trip property tests |
| Calculators | 56 compute assertions |
| QR encoder | 97, including **13/13 round-trip decodes** |
| Developer tools | 109 transform assertions |
| DOM (calculators) | 44, incl. branded shell and theme switch |
| DOM (developer tools) | 50, incl. live typing, errors and ZIP output |

The calculator DOM suite also covers the sidebar (link count, active state,
drawer open/close, focus and scroll-lock) and the icon sprite (symbol count,
every `<use>` resolving, no emoji remaining).

**Not measured:** Lighthouse score and real-world load time. Those need a real
browser against real hosting — run Lighthouse after deploying rather than
trusting a number nobody measured.

## Developer & web tools

Twenty tools under `/tools/developer/`, in four groups:

**Data** — JSON formatter/validator, XML formatter, CSV ⇄ JSON
**Encoding** — Base64, URL encoder, HTML entities, JWT decoder
**Generators** — meta tags & Open Graph, robots.txt, .htaccess, UUID, Lorem ipsum, URL slugs, text case, colour converter & WCAG contrast checker, CSS gradient
**Images** — QR code generator, favicon generator, image resizer & compressor

### The QR encoder

Written from scratch in `engine/qr.js` — no library, no API. Byte mode,
versions 1–10, all four error-correction levels, all eight mask patterns
scored by the spec's penalty rules. Supports URL, text, WiFi, vCard, email,
SMS, phone and geo payloads; exports SVG or PNG.

Correctness is established three ways rather than by eye:

1. Generator polynomials match the published ISO/IEC 18004 values for 7, 10
   and 13 EC codewords.
2. Reed-Solomon syndromes evaluate to zero on every generated codeword, and
   to non-zero on deliberately corrupted ones.
3. A reverse decoder in the test suite unmasks, un-places and de-interleaves
   the finished matrix and recovers the original string — 13/13 exact,
   across versions 1–7, including WiFi, vCard and emoji payloads.

### Image tools

Favicon and resize both run on `<canvas>`. Files are read with `FileReader`
and never transmitted. The favicon tool emits eight sizes (16 to 512,
including Apple touch and Android maskable with a 10% safe zone), the HTML
`<link>` block, and a ZIP — written by a small STORE-method ZIP encoder in
`render-dev.js`, since PNGs are already compressed and deflating twice buys
nothing.

**Browser-verified, not automatically tested:** canvas rendering quality and
actual download behaviour. jsdom has no canvas, so the tests cover mounting,
option handling and ZIP structure, not pixel output. Open the two image tools
in a real browser before launch.

## Adding tools

Append to `TOOLS` in `engine/tools.js`:

```js
'my-tool': {
  title: 'My Tool', category: 'finance', icon: '🧮',
  description: 'What it does, in one sentence.',
  formula: 'x = a + b',
  inputs:  [num('a','First value',{default:1}), num('b','Second value',{default:2})],
  compute: ({a,b}) => ({ result: a + b }),
  outputs: [{key:'result', label:'Result', format:'number', primary:true}],
  tips: ['Something non-obvious and actually useful.'],
  faq:  [{q:'A real question', a:'A real answer.'}]
}
```

Rebuild. You get the page, form, live calculation, copy buttons, JSON-LD,
breadcrumbs, sitemap entry, search indexing, offline caching and both themes.

Adding a **unit** is stronger: one entry in the `length` table now adds 36
pages (18 existing units × 2 directions).

## Deliberate omissions

- **No medication dosage calculator.** Dosing errors hurt people, and a free
  web tool is the wrong place to get that answer.
- **No live currency conversion.** It needs a rate feed, which means a backend.
  Exchange-rate maths without current rates is worse than useless.
- **BMI is framed as a screening measure, not a verdict** — the tips state what
  it cannot tell you, because the number alone routinely misleads.
- **The JWT tool decodes but never claims to verify.** Signature verification
  needs a secret or public key and must happen server-side; a browser tool
  implying otherwise would invite a real security mistake.
- **No password/hash "strength checker".** Anything reassuring enough to be
  worth showing tends to be wrong, and encourages pasting real credentials
  into a web page.

## Known limitations

- Fonts load from Google Fonts, matching the parent site. First offline visit
  before the service worker caches them falls back to Segoe UI / system-ui.
  Self-host the two families if you want zero third-party requests.
- `color-mix()` needs Chrome/Edge 111+, Safari 16.2+, Firefox 113+. Older
  browsers lose some hover tints; nothing becomes unreadable or unusable.
