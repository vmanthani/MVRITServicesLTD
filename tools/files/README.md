# MVR Tools

891 working calculators and converters. Static HTML, no backend, works offline.

## What this actually is

A **build system**, not 891 hand-written pages. Two data files define everything:

| File | Defines | Produces |
|---|---|---|
| `engine/units.js` | 12 dimensions, 104 units | **880** converter pages |
| `engine/tools.js` | 11 tool specs | **11** calculator pages |

`build.js` reads both and emits static HTML with full SEO markup. Fix a rounding
bug once, rebuild, and all 891 pages are fixed.

## Commands

```bash
npm install       # jsdom, for the DOM tests only — the site itself has zero deps
node test.js      # 121 tests: unit accuracy, compute correctness, DOM behaviour
node build.js     # generates ./dist
cd dist && python3 -m http.server 8000
```

## Verified numbers (measured, not estimated)

```
Converter page, first visit    19.3 KB gzipped
Calculator page, first visit   25.2 KB gzipped
Repeat visits                  0 KB  (service worker cache-first)
Render-blocking requests       1     (app.css; all JS deferred)
Pages generated                912
Valid JSON-LD                  912/912
Broken internal links          0/677 sampled
Titles within 70 chars         912/912
```

Tests: 43 unit-conversion assertions, 4,400 round-trip property tests,
56 compute assertions, 22 end-to-end DOM tests. All passing.

**Not measured:** Lighthouse score, real-world load time. Those need a real
browser against real hosting. Run Lighthouse after deploying — don't trust
a number nobody measured.

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

Rebuild. You get the page, the form, live calculation, copy buttons, JSON-LD,
breadcrumbs, sitemap entry, search indexing, and offline caching for free.

Adding a unit to `engine/units.js` is stronger still: one entry in the `length`
table adds 28 new converter pages (14 existing units × 2 directions).

## To reach 1000+

Currently 891. Options, cheapest first:

1. **Add 4 length units** (furlong, fathom, chain, angstrom) → +116 pages → 1,007. One data edit.
2. Add a `frequency` dimension (Hz/kHz/MHz/GHz/RPM) → +20.
3. Add more calculators — each is one spec object.

Option 1 alone crosses 1000. But page count is a vanity metric: 891 tools people
find and trust beats 1000 that exist to hit a number.

## Deploy

Everything in `dist/` is static. Netlify, Cloudflare Pages, S3, or any web server.

```bash
npx netlify-cli deploy --prod --dir=dist
```

Before going live, set `SITE` in `build.js` to your real domain — canonical
tags, sitemaps, and JSON-LD all derive from it. Serve over HTTPS or the
service worker won't register.

## Deliberate omissions

- **No medication dosage calculator.** Dosing errors hurt people, and a free
  web tool is the wrong place to get that answer.
- **No live currency conversion.** It needs a rate feed, which means a backend.
  Exchange-rate maths without current rates is worse than useless.
- **BMI is framed as a screening measure, not a verdict** — the tips say what it
  cannot tell you, because the number alone routinely misleads people.
