#!/usr/bin/env node
/**
 * Static Site Generator
 * ---------------------
 * Reads the specs and emits one real, standalone, pre-rendered HTML page per
 * tool. Single source of truth in /engine, thousands of static pages out.
 *
 *   node build.js
 */

const fs = require('fs');
const path = require('path');
const { UNITS, enumeratePairs } = require('./engine/units.js');
const { TOOLS } = require('./engine/tools.js');

const SITE = 'https://tools.mvrservices.com';
const BRAND = 'MVR Tools';
const OUT = path.join(__dirname, 'dist');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATEGORIES = {
  conversions: { name: 'Conversions', icon: '🔄' },
  finance:     { name: 'Finance & Accounting', icon: '💰' },
  mathematics: { name: 'Mathematics', icon: '📐' },
  engineering: { name: 'Engineering & Electronics', icon: '⚙️' },
  health:      { name: 'Health', icon: '⚕️' },
  design:      { name: 'Design & Media', icon: '🎨' },
  utilities:   { name: 'Utilities', icon: '🔧' },
  time:        { name: 'Time & Dates', icon: '📅' }
};

/* ---------- shared page shell ---------- */

function shell({ title, description, canonical, body, jsonld, depth, extraHead = '' }) {
  const up = '../'.repeat(depth) || './';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0f172a">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="${up}manifest.webmanifest">
<link rel="stylesheet" href="${up}assets/app.css">
${extraHead}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="${up}index.html"><span class="brand-mark">▚</span> ${BRAND}</a>
  <form class="search-wrap" role="search" onsubmit="return false">
    <input id="q" type="search" placeholder="Search tools…" autocomplete="off" aria-label="Search tools">
  </form>
  <button id="theme" class="icon-btn" aria-label="Toggle theme">◐</button>
</header>
<div id="results" class="search-results" hidden></div>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <p>${BRAND} — every calculation runs in your browser. Nothing is sent to a server.</p>
  <p class="muted">Results are provided for general information. For financial, medical, legal, or safety-critical decisions, consult a qualified professional.</p>
</footer>
<script>window.__BASE__="${up}";</script>
<script src="${up}assets/search-index.js" defer></script>
<script src="${up}assets/app.js" defer></script>
</body>
</html>`;
}

function contentBlocks(spec) {
  let h = '';
  if (spec.formula) {
    h += `<section class="panel"><h2>Formula</h2><pre class="formula">${esc(spec.formula)}</pre></section>`;
  }
  if (spec.tips?.length) {
    h += `<section class="panel"><h2>Tips</h2><ul class="tips">` +
         spec.tips.map(t => `<li>${esc(t)}</li>`).join('') + `</ul></section>`;
  }
  if (spec.faq?.length) {
    h += `<section class="panel"><h2>Frequently asked questions</h2>` +
         spec.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') +
         `</section>`;
  }
  return h;
}

function relatedList(items, up) {
  if (!items.length) return '';
  return `<section class="panel"><h2>Related tools</h2><ul class="related">` +
    items.map(i => `<li><a href="${up}${i.url}">${esc(i.title)}</a></li>`).join('') +
    `</ul></section>`;
}

/* ---------- page writers ---------- */

const pages = [];
function write(rel, html) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  pages.push(rel);
}

/* Computed tool pages */
function buildToolPage(id, spec) {
  const url = `${spec.category}/${id}.html`;
  const canonical = `${SITE}/${url}`;
  let title = `${spec.title} — Free Online | ${BRAND}`;
  if (title.length > 70) title = `${spec.title} | ${BRAND}`;
  if (title.length > 70) title = spec.title;

  const related = Object.entries(TOOLS)
    .filter(([k, s]) => k !== id && s.category === spec.category)
    .slice(0, 6)
    .map(([k, s]) => ({ title: s.title, url: `${s.category}/${k}.html` }));

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: spec.title,
        description: spec.description,
        url: canonical,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: CATEGORIES[spec.category]?.name || spec.category, item: `${SITE}/${spec.category}/index.html` },
          { '@type': 'ListItem', position: 3, name: spec.title, item: canonical }
        ]
      },
      ...(spec.faq?.length ? [{
        '@type': 'FAQPage',
        mainEntity: spec.faq.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      }] : [])
    ]
  };

  const body = `
<nav class="crumbs"><a href="../index.html">Home</a> › <a href="index.html">${esc(CATEGORIES[spec.category]?.name || spec.category)}</a> › <span>${esc(spec.title)}</span></nav>
<article class="tool" data-tool="${id}">
  <h1>${esc(spec.icon)} ${esc(spec.title)}</h1>
  <p class="lede">${esc(spec.description)}</p>
  <div class="calc">
    <form class="tool-form" autocomplete="off" onsubmit="return false"></form>
    <div class="tool-results" aria-live="polite"></div>
  </div>
  ${contentBlocks(spec)}
  ${relatedList(related, '../')}
</article>
<script src="../engine/tools.bundle.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  MVRTool.mount(window.TOOLS['${id}'], document.querySelector('.tool'));
});
</script>`;

  write(url, shell({ title, description: spec.description, canonical, body, jsonld, depth: 1,
    extraHead: `<script src="../engine/render.js" defer></script>` }));

  return { id, title: spec.title, description: spec.description, category: spec.category,
           icon: spec.icon, keywords: spec.keywords || [], url };
}

/* Converter pages — one per ordered unit pair */
function buildConverterPage(dim, dimData, from, to) {
  const uf = dimData.units[from], ut = dimData.units[to];
  const slug = `${slugify(uf.name)}-to-${slugify(ut.name)}`;
  const url = `conversions/${dim}/${slug}.html`;
  const canonical = `${SITE}/${url}`;
  const pageTitle = `Convert ${uf.name} to ${ut.name}`;
  // Google truncates around 70 chars; drop the symbol pair, then the brand, as needed.
  let title = `${pageTitle} (${uf.symbol} → ${ut.symbol}) | ${BRAND}`;
  if (title.length > 70) title = `${pageTitle} (${uf.symbol} → ${ut.symbol})`;
  if (title.length > 70) title = `${pageTitle} | ${BRAND}`;
  if (title.length > 70) title = pageTitle;
  const description = `Convert ${uf.name} (${uf.symbol}) to ${ut.name} (${ut.symbol}) instantly. Works in both directions, with a full ${dimData.label.toLowerCase()} table.`;

  const related = enumeratePairs(dim)
    .filter(([a, b]) => a === from && b !== to)
    .slice(0, 8)
    .map(([a, b]) => ({
      title: `${dimData.units[a].name} to ${dimData.units[b].name}`,
      url: `${slugify(dimData.units[a].name)}-to-${slugify(dimData.units[b].name)}.html`
    }));

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'SoftwareApplication', name: pageTitle, description, url: canonical,
        applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Conversions', item: `${SITE}/conversions/index.html` },
        { '@type': 'ListItem', position: 3, name: dimData.label, item: `${SITE}/conversions/${dim}/index.html` },
        { '@type': 'ListItem', position: 4, name: pageTitle, item: canonical }
      ]}
    ]
  };

  const body = `
<nav class="crumbs"><a href="../../index.html">Home</a> › <a href="../index.html">Conversions</a> › <a href="index.html">${esc(dimData.label)}</a> › <span>${esc(pageTitle)}</span></nav>
<article class="tool">
  <h1>🔄 ${esc(pageTitle)}</h1>
  <p class="lede">${esc(description)}</p>
  <div class="calc">
    <form class="tool-form" autocomplete="off" onsubmit="return false"></form>
    <div class="tool-results" aria-live="polite"></div>
  </div>
  <section class="panel"><h2>Tips</h2><ul class="tips">
    <li>Use the swap button to reverse the direction — every converter here works both ways.</li>
    <li>The full table below the result shows the same value in every ${esc(dimData.label.toLowerCase())} unit at once.</li>
    <li>All arithmetic happens in your browser, so results are instant and work offline.</li>
  </ul></section>
  ${relatedList(related, '')}
</article>
<script src="../../engine/units.bundle.js" defer></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  MVRTool.mountConverter('${dim}', UNITS['${dim}'], convert,
    document.querySelector('.tool'), {from:'${from}', to:'${to}'});
});
</script>`;

  write(url, shell({ title, description, canonical, body, jsonld, depth: 2,
    extraHead: `<script src="../../engine/render.js" defer></script>` }));

  return { id: slug, title: pageTitle, description, category: 'conversions',
           icon: '🔄', keywords: [uf.name, ut.name, uf.symbol, ut.symbol, dimData.label], url };
}



function slugify(s){return s.toLowerCase().replace(/[()]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

/* ---------- run ---------- */

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const index = [];

// computed tools
for (const [id, spec] of Object.entries(TOOLS)) index.push(buildToolPage(id, spec));

// converters
for (const dim of Object.keys(UNITS)) {
  const dimData = UNITS[dim];
  for (const [from, to] of enumeratePairs(dim)) {
    index.push(buildConverterPage(dim, dimData, from, to));
  }
}

/* category index pages */
const byCat = {};
index.forEach(t => (byCat[t.category] ||= []).push(t));

for (const [cat, items] of Object.entries(byCat)) {
  const meta = CATEGORIES[cat] || { name: cat, icon: '🔧' };
  const body = `
<nav class="crumbs"><a href="../index.html">Home</a> › <span>${esc(meta.name)}</span></nav>
<h1>${meta.icon} ${esc(meta.name)}</h1>
<p class="lede">${items.length} free tools. No sign-up, no server, works offline.</p>
<div class="grid">${items.map(t =>
  `<a class="card" href="../${t.url}"><span class="card-icon">${t.icon}</span><strong>${esc(t.title)}</strong><span class="card-desc">${esc(t.description)}</span></a>`
).join('')}</div>`;
  write(`${cat}/index.html`, shell({
    title: `${meta.name} Tools — ${items.length} Free Calculators | ${BRAND}`,
    description: `${items.length} free ${meta.name.toLowerCase()} tools that run entirely in your browser.`,
    canonical: `${SITE}/${cat}/index.html`, body, depth: 1,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: meta.name, url: `${SITE}/${cat}/index.html` }
  }));
}

/* per-dimension conversion index pages */
for (const dim of Object.keys(UNITS)) {
  const d = UNITS[dim];
  const items = index.filter(t => t.url.startsWith(`conversions/${dim}/`));
  const body = `
<nav class="crumbs"><a href="../../index.html">Home</a> › <a href="../index.html">Conversions</a> › <span>${esc(d.label)}</span></nav>
<h1>🔄 ${esc(d.label)} Converters</h1>
<p class="lede">${items.length} converters across ${Object.keys(d.units).length} units. Every pair works in both directions.</p>
<div class="grid">${items.map(t =>
  `<a class="card" href="${t.url.split('/').pop()}"><span class="card-icon">🔄</span><strong>${esc(t.title)}</strong></a>`
).join('')}</div>`;
  write(`conversions/${dim}/index.html`, shell({
    title: `${d.label} Converters — ${items.length} Free Tools | ${BRAND}`,
    description: `Free ${d.label.toLowerCase()} conversion tools. ${items.length} unit pairs, instant and offline.`,
    canonical: `${SITE}/conversions/${dim}/index.html`, body, depth: 2,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: d.label + ' Converters' }
  }));
}

/* home page */
const homeBody = `
<section class="hero">
  <h1>${index.length.toLocaleString()} tools that run in your browser</h1>
  <p class="lede">Calculators and converters for finance, maths, engineering, science and everyday life. No accounts, no servers, no tracking — and they keep working with the network off.</p>
</section>
<h2>Browse by category</h2>
<div class="grid">${Object.entries(byCat).map(([cat, items]) => {
  const m = CATEGORIES[cat] || { name: cat, icon: '🔧' };
  return `<a class="card" href="${cat}/index.html"><span class="card-icon">${m.icon}</span><strong>${esc(m.name)}</strong><span class="card-desc">${items.length} tools</span></a>`;
}).join('')}</div>
<h2>Conversion families</h2>
<div class="grid">${Object.keys(UNITS).map(d => {
  const n = enumeratePairs(d).length;
  return `<a class="card" href="conversions/${d}/index.html"><span class="card-icon">🔄</span><strong>${esc(UNITS[d].label)}</strong><span class="card-desc">${n} converters</span></a>`;
}).join('')}</div>`;

write('index.html', shell({
  title: `${BRAND} — ${index.length.toLocaleString()} Free Online Calculators & Converters`,
  description: `${index.length.toLocaleString()} free online tools: converters, calculators for finance, maths, engineering and science. Runs entirely in your browser and works offline.`,
  canonical: SITE + '/', body: homeBody, depth: 0,
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'WebSite', name: BRAND, url: SITE,
    potentialAction: { '@type': 'SearchAction', target: `${SITE}/?q={q}`, 'query-input': 'required name=q' }
  }
}));

/* search index — trimmed to keep the payload small */
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets/search-index.js'),
  'window.SEARCH_INDEX=' + JSON.stringify(index.map(t => [t.title, t.url, t.icon])) + ';');

/* engine bundles consumed by the pages */
fs.mkdirSync(path.join(OUT, 'engine'), { recursive: true });
const unitsSrc = fs.readFileSync(path.join(__dirname, 'engine/units.js'), 'utf8')
  .replace(/if \(typeof module[\s\S]*$/, '');
fs.writeFileSync(path.join(OUT, 'engine/units.bundle.js'),
  unitsSrc + '\nwindow.UNITS=UNITS;window.convert=convert;window.convertAll=convertAll;');

const toolsSrc = fs.readFileSync(path.join(__dirname, 'engine/tools.js'), 'utf8')
  .replace(/if \(typeof module[\s\S]*$/, '') + '\nwindow.TOOLS=TOOLS;';
fs.writeFileSync(path.join(OUT, 'engine/tools.bundle.js'), toolsSrc);

fs.copyFileSync(path.join(__dirname, 'engine/render.js'), path.join(OUT, 'engine/render.js'));


/* static assets */
for (const f of ['app.css', 'app.js']) {
  fs.copyFileSync(path.join(__dirname, 'assets', f), path.join(OUT, 'assets', f));
}
fs.copyFileSync(path.join(__dirname, 'assets/sw.js'), path.join(OUT, 'sw.js'));

/* sitemaps — split at 45k URLs to stay inside the 50k limit */
const CHUNK = 45000;
const urls = ['', ...index.map(t => t.url), ...Object.keys(byCat).map(c => `${c}/index.html`)];
const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));

chunks.forEach((chunk, i) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.map(u => `<url><loc>${SITE}/${u}</loc><changefreq>monthly</changefreq><priority>${u === '' ? '1.0' : '0.7'}</priority></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(OUT, `sitemap-${i + 1}.xml`), xml);
});

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((_, i) => `<sitemap><loc>${SITE}/sitemap-${i + 1}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>`);

fs.writeFileSync(path.join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: BRAND, short_name: 'MVR Tools',
  description: `${index.length} free calculators and converters that work offline.`,
  start_url: '/', scope: '/', display: 'standalone',
  theme_color: '#0f172a', background_color: '#0f172a',
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));

console.log(`\n✅ Build complete`);
console.log(`   Tool pages:      ${index.length.toLocaleString()}`);
console.log(`   Total HTML files:${String(pages.length).padStart(7)}`);
console.log(`   Sitemaps:        ${chunks.length}`);
console.log(`   Output:          ${OUT}`);
