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
const { DEV_TOOLS } = require('./engine/devtools.js');

/* ---------- deployment config ----------
   Change these two lines when the deploy path changes.
   SITE feeds canonicals, sitemaps and JSON-LD; PARENT feeds the
   header/footer links back into the main mvritservices.com site. */
const PARENT = 'https://www.mvritservices.com';
const SITE   = PARENT + '/tools';          // e.g. .../tools/finance/loan-payment.html
const BRAND  = 'MVR IT Services';
const SUITE  = 'Tools';
const OUT = path.join(__dirname, 'dist');

// Total is derivable from the data before any page is written.
const TOTAL = Object.keys(TOOLS).length + Object.keys(DEV_TOOLS).length +
  Object.keys(UNITS).reduce((n, d) => n + enumeratePairs(d).length, 0);
const TOTAL_LABEL = TOTAL.toLocaleString('en-GB');



/* Google truncates SERP titles near 70 rendered characters.
   Measure the unescaped string — "&" renders as one char, not five. */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function fitTitle(variants) {
  for (const v of variants) if (v.length <= 70) return v;
  return variants[variants.length - 1].slice(0, 70);
}

/* Icons come from one cached sprite, so a page with 300 cards costs
   one request rather than 300 inline copies. currentColor means each
   icon picks up the theme accent automatically. */
function icon(name, up, cls) {
  return `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false">` +
         `<use href="${up}assets/icons.svg#i-${name}"></use></svg>`;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATEGORIES = {
  conversions: { name: 'Conversions' },
  finance: { name: 'Finance & Accounting' },
  mathematics: { name: 'Mathematics' },
  engineering: { name: 'Engineering & Electronics' },
  health: { name: 'Health' },
  design: { name: 'Design & Media' },
  utilities: { name: 'Utilities' },
  developer: { name: 'Developer & Web Tools' },
  time: { name: 'Time & Dates' }
};

/* Sidebar data must exist before the first page is written, so it is
   derived from the specs rather than from the accumulated page index. */
const NAV_CATS = (() => {
  const counts = {};
  for (const s2 of Object.values(TOOLS)) counts[s2.category] = (counts[s2.category] || 0) + 1;
  for (const s2 of Object.values(DEV_TOOLS)) counts[s2.category] = (counts[s2.category] || 0) + 1;
  counts.conversions = Object.keys(UNITS).reduce((n, d) => n + enumeratePairs(d).length, 0);
  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map(id => ({ id, name: (CATEGORIES[id] || { name: id }).name, count: counts[id] }));
})();

const NAV_DIMS = Object.keys(UNITS).map(d => ({
  id: d, label: UNITS[d].label, count: enumeratePairs(d).length
}));

/* ---------- shared page shell ---------- */

function shell({ title, description, canonical, body, jsonld, depth, extraHead = '', activeCat = '', activeDim = '' }) {
  const up = '../'.repeat(depth) || './';
  return `<!DOCTYPE html>
<html lang="en-GB" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#06080f" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND} LTD">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${PARENT}/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="${PARENT}/assets/img/logo.svg" type="image/svg+xml">
<link rel="manifest" href="${up}manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${up}assets/app.css">
${extraHead}
<script>/* set theme before first paint so there is no flash */
(function(){try{var t=localStorage.getItem('mvr-theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='system'?t:'dark');}catch(e){}})();</script>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>

<header class="site-header">
  <div class="container nav-wrap">
    <a class="brand" href="${PARENT}/">
      <img src="${PARENT}/assets/img/logo.svg" alt="MVR IT Services logo" width="42" height="42">
      <span>MVR IT Services<small>Technology · Delivered</small></span>
    </a>

    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="navlinks">
      <span></span><span></span><span></span>
    </button>

    <div class="header-tools">
      <div class="search-wrap">
        <input id="q" type="search" placeholder="Search ${TOTAL_LABEL} tools…" autocomplete="off" aria-label="Search tools">
        <div id="results" class="search-results" hidden></div>
      </div>
      <div class="theme-switch" role="group" aria-label="Colour theme">
        <button type="button" data-theme-set="light" aria-pressed="false" title="Light" aria-label="Light theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
        </button>
        <button type="button" data-theme-set="dark" aria-pressed="false" title="Dark" aria-label="Dark theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.8 6.8 0 0 0 9.9 9.9z"/></svg>
        </button>
        <button type="button" data-theme-set="system" aria-pressed="false" title="Match system" aria-label="Match system theme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8.5 20.5h7"/></svg>
        </button>
      </div>
    </div>

    <ul class="nav-links" id="navlinks">
      <li><a href="${PARENT}/">Home</a></li>
      <li><a href="${PARENT}/services/">Services</a></li>
      <li><a href="${PARENT}/products/">Products</a></li>
      <li><a href="${up}index.html" class="active">Tools</a></li>
      <li><a href="${PARENT}/contact/" class="nav-cta">Get a Quote</a></li>
    </ul>
  </div>
</header>

<div class="layout container">
  <button class="sidebar-open" id="sidebarOpen" aria-expanded="false" aria-controls="sidebar">
    ${icon('grid', up)}<span>All ${TOTAL_LABEL} tools</span>
  </button>

  <aside class="sidebar" id="sidebar" aria-label="Tool categories">
    <div class="sidebar-head">
      <span class="sidebar-title">Browse tools</span>
      <button class="sidebar-close" id="sidebarClose" aria-label="Close categories">${icon('close', up)}</button>
    </div>

    <nav class="side-nav">
      <a class="side-link${activeCat === 'home' ? ' is-active' : ''}" href="${up}index.html">
        ${icon('home', up)}<span class="side-name">All tools</span><span class="side-count">${TOTAL_LABEL}</span>
      </a>

      <p class="side-group">Categories</p>
      ${NAV_CATS.map(c => `<a class="side-link${activeCat === c.id ? ' is-active' : ''}" href="${up}${c.id}/index.html">
        ${icon(c.id, up)}<span class="side-name">${esc(c.name)}</span><span class="side-count">${c.count.toLocaleString('en-GB')}</span>
      </a>`).join('\n      ')}

      <p class="side-group">Conversion families</p>
      ${NAV_DIMS.map(d => `<a class="side-link side-sub${activeDim === d.id ? ' is-active' : ''}" href="${up}conversions/${d.id}/index.html">
        ${icon(d.id, up)}<span class="side-name">${esc(d.label)}</span><span class="side-count">${d.count}</span>
      </a>`).join('\n      ')}
    </nav>
  </aside>

  <main id="main" class="content">
${body}
  </main>
</div>
<div class="scrim" id="scrim" hidden></div>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-about">
        <a class="brand" href="${PARENT}/">
          <img src="${PARENT}/assets/img/logo.svg" alt="MVR IT Services logo" width="42" height="42">
          <span>MVR IT Services<small>Technology · Delivered</small></span>
        </a>
        <p>Corporate software, integrations and complete technology support for schools, hospitals, retailers, event organisers and growing businesses.</p>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="${PARENT}/about/">About Us</a></li>
          <li><a href="${PARENT}/services/">Services</a></li>
          <li><a href="${PARENT}/products/">Products</a></li>
          <li><a href="${PARENT}/contact/">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Products</h4>
        <ul>
          <li><a href="${PARENT}/products/#xleshop">XLeShop E-commerce</a></li>
          <li><a href="${PARENT}/products/#school">School Management</a></li>
          <li><a href="${PARENT}/products/#hospital">Hospital Management</a></li>
          <li><a href="${PARENT}/products/#events">Event QR Check-in</a></li>
        </ul>
      </div>
      <div>
        <h4>Legal</h4>
        <ul>
          <li><a href="${PARENT}/privacy/">Privacy Policy</a></li>
          <li><a href="${PARENT}/terms/">Terms of Service</a></li>
          <li><a href="${PARENT}/cookies/">Cookie Policy</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-note">
      <strong>About these tools.</strong> Every calculation runs inside your browser — no figures are sent to a server, and nothing you type is stored or logged. Results are for general information. For financial, medical, legal or safety-critical decisions, please consult a qualified professional.
    </div>

    <div class="footer-legal">
      <div class="company-reg">
        © <span data-year>2026</span> MVR IT Services LTD. All rights reserved.<br>
        MVR IT Services LTD is a company registered in England and Wales.
        Company No. <strong>10251131</strong>.
        Registered office: <strong>Reading, United Kingdom</strong>.
      </div>
      <div>Made with dedication by MVR IT Services.</div>
    </div>
  </div>
</footer>

<script>window.__BASE__="${up}";</script>
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
  const title = fitTitle([
    `${spec.title} — Free Online | ${BRAND}`,
    `${spec.title} | ${BRAND}`,
    `${spec.title} — Free Online`,
    spec.title
  ]);

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
  <h1>${icon(id, '../', 'ico-title')}${esc(spec.title)}</h1>
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
    activeCat: spec.category,
    extraHead: `<script src="../engine/render-core.js" defer></script>` }));

  return { id, title: spec.title, description: spec.description, category: spec.category,
           iconId: id, keywords: spec.keywords || [], url };
}

/* Converter pages — one per ordered unit pair */
function buildConverterPage(dim, dimData, from, to) {
  const uf = dimData.units[from], ut = dimData.units[to];
  const slug = `${slugify(uf.name)}-to-${slugify(ut.name)}`;
  const url = `conversions/${dim}/${slug}.html`;
  const canonical = `${SITE}/${url}`;
  const pageTitle = `Convert ${uf.name} to ${ut.name}`;
  // Google truncates around 70 chars; drop the symbol pair, then the brand, as needed.
  const title = fitTitle([
    `${pageTitle} (${uf.symbol} → ${ut.symbol}) | ${BRAND}`,
    `${pageTitle} (${uf.symbol} → ${ut.symbol})`,
    `${pageTitle} | ${BRAND}`,
    pageTitle
  ]);
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
  <h1>${icon(dim, '../../', 'ico-title')}${esc(pageTitle)}</h1>
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
    activeCat: 'conversions', activeDim: dim,
    extraHead: `<script src="../../engine/render-core.js" defer></script>` }));

  return { id: slug, title: pageTitle, description, category: 'conversions',
           iconId: dim, keywords: [uf.name, ut.name, uf.symbol, ut.symbol, dimData.label], url };
}



function buildDevToolPage(id, spec) {
  const url = `developer/${id}.html`;
  const canonical = `${SITE}/${url}`;
  const title = fitTitle([
    `${spec.title} — Free Online | ${BRAND}`,
    `${spec.title} | ${BRAND}`,
    `${spec.title} — Free Online`,
    spec.title
  ]);

  const related = Object.entries(DEV_TOOLS)
    .filter(([k]) => k !== id).slice(0, 8)
    .map(([k, s2]) => ({ title: s2.title, url: `${k}.html` }));

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'SoftwareApplication', name: spec.title, description: spec.description,
        url: canonical, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Developer & Web Tools', item: `${SITE}/developer/index.html` },
        { '@type': 'ListItem', position: 3, name: spec.title, item: canonical }
      ]},
      ...(spec.faq?.length ? [{ '@type': 'FAQPage', mainEntity: spec.faq.map(f => ({
        '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : [])
    ]
  };

  const kind = spec.kind;
  const mount =
    kind === 'code'    ? `MVRTool.mountCode(spec, root);`
  : kind === 'qr'      ? `MVRTool.mountQR(spec, root, encodeQR, qrToSVG);`
  : (kind === 'favicon' || kind === 'image') ? `MVRTool.mountFile(spec, root);`
  :                      `MVRTool.mountGenerate(spec, root);`;

  const engines = [`<script src="../engine/render-dev.js" defer></script>`,
                   `<script src="../engine/dev-${id}.js" defer></script>`];
  if (kind === 'qr') engines.push('<script src="../engine/qr.bundle.js" defer></script>');

  const body = `
<nav class="crumbs"><a href="../index.html">Home</a> › <a href="index.html">Developer &amp; Web Tools</a> › <span>${esc(spec.title)}</span></nav>
<article class="tool" data-tool="${id}">
  <p class="eyebrow">Developer &amp; Web Tools</p>
  <h1>${icon(id, '../', 'ico-title')}${esc(spec.title)}</h1>
  <p class="lede">${esc(spec.description)}</p>
  <div class="tool-io"></div>
  <section class="panel"><h2>Privacy</h2><p class="privacy-line">Everything on this page runs inside your browser. Nothing you paste, type or upload is transmitted, logged or stored.</p></section>
  ${contentBlocks(spec)}
  ${relatedList(related, '')}
</article>
<script>
document.addEventListener('DOMContentLoaded',function(){
  var spec = window.DEV_TOOLS['${id}'];
  spec.id = '${id}';
  var root = document.querySelector('.tool');
  try { ${mount} }
  catch (e) {
    root.querySelector('.tool-io').innerHTML =
      '<div class="io-msg is-error">This tool needs JavaScript features your browser does not support. Try a current version of Chrome, Firefox, Edge or Safari.</div>';
  }
});
</script>`;

  write(url, shell({ title, description: spec.description, canonical, body, jsonld, depth: 1,
    activeCat: 'developer',
    extraHead: engines.join('\n') }));

  return { id, title: spec.title, description: spec.description, category: 'developer',
           iconId: id, keywords: spec.keywords || [], url };
}

function slugify(s){return s.toLowerCase().replace(/[()]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}

/* ---------- run ---------- */

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const index = [];

// computed tools
for (const [id, spec] of Object.entries(TOOLS)) index.push(buildToolPage(id, spec));

// developer & web tools
for (const [id, spec] of Object.entries(DEV_TOOLS)) index.push(buildDevToolPage(id, spec));

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
  const meta = CATEGORIES[cat] || { name: cat };
  const body = `
<nav class="crumbs"><a href="../index.html">Home</a> › <span>${esc(meta.name)}</span></nav>
<p class="eyebrow">${esc(meta.name)}</p>\n<h1>${icon(cat, '../', 'ico-title')}${esc(meta.name)} tools</h1>
<p class="lede">${plural(items.length,'free tool','free tools')}. No sign-up, no server, works offline.</p>
<div class="grid">${items.map(t =>
  `<a class="card" href="../${t.url}"><span class="card-icon">${icon(t.iconId, '../')}</span><strong>${esc(t.title)}</strong><span class="card-desc">${esc(t.description)}</span></a>`
).join('')}</div>`;
  write(`${cat}/index.html`, shell({
    title: fitTitle([
      `${meta.name} Tools — ${plural(items.length,'Free Calculator','Free Calculators')} | ${BRAND}`,
      `${meta.name} Tools — ${plural(items.length,'Free Calculator','Free Calculators')}`,
      `${meta.name} Tools | ${BRAND}`,
      `${meta.name} Tools`
    ]),
    description: `${plural(items.length,'free','free')} ${meta.name.toLowerCase()} ${items.length===1?'tool that runs':'tools that run'} entirely in your browser. No sign-up, works offline.`,
    canonical: `${SITE}/${cat}/index.html`, body, depth: 1, activeCat: cat,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: meta.name, url: `${SITE}/${cat}/index.html` }
  }));
}

/* per-dimension conversion index pages */
for (const dim of Object.keys(UNITS)) {
  const d = UNITS[dim];
  const items = index.filter(t => t.url.startsWith(`conversions/${dim}/`));
  const body = `
<nav class="crumbs"><a href="../../index.html">Home</a> › <a href="../index.html">Conversions</a> › <span>${esc(d.label)}</span></nav>
<p class="eyebrow">Conversions</p>\n<h1>${icon(dim, '../../', 'ico-title')}${esc(d.label)} converters</h1>
<p class="lede">${items.length} converters across ${Object.keys(d.units).length} units. Every pair works in both directions.</p>
<div class="grid grid-tight">${items.map(t =>
  `<a class="card" href="${t.url.split('/').pop()}"><span class="card-icon">${icon(dim, '../../')}</span><strong>${esc(t.title)}</strong></a>`
).join('')}</div>`;
  write(`conversions/${dim}/index.html`, shell({
    title: fitTitle([
      `${d.label} Converters — ${plural(items.length,'Free Tool','Free Tools')} | ${BRAND}`,
      `${d.label} Converters — ${plural(items.length,'Free Tool','Free Tools')}`,
      `${d.label} Converters | ${BRAND}`,
      `${d.label} Converters`
    ]),
    description: `Free ${d.label.toLowerCase()} conversion tools. ${items.length} unit pairs, instant and offline.`,
    canonical: `${SITE}/conversions/${dim}/index.html`, body, depth: 2, activeCat: 'conversions', activeDim: dim,
    jsonld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: d.label + ' Converters' }
  }));
}

/* home page */
const homeBody = `
<section class="hero">
  <p class="eyebrow">Free Tools</p>
  <h1><span class="grad">${TOTAL_LABEL} tools</span> that run entirely in your browser</h1>
  <p class="lede">Calculators and converters for finance, mathematics, engineering, science and everyday work. No account, no server, no tracking — and they keep working when the network does not.</p>
  <div class="hero-stats">
    <div><div class="stat-num">${TOTAL_LABEL}</div><div class="stat-lbl">Tools</div></div>
    <div><div class="stat-num">${Object.keys(UNITS).length + Object.keys(byCat).length - 1}</div><div class="stat-lbl">Categories</div></div>
    <div><div class="stat-num">0</div><div class="stat-lbl">Data sent to servers</div></div>
    <div><div class="stat-num">100%</div><div class="stat-lbl">Works offline</div></div>
  </div>
</section>

<h2 class="section-title">Browse by category</h2>
<div class="grid grid-feature">${NAV_CATS.map(c =>
  `<a class="card card-lg" href="${c.id}/index.html"><span class="card-icon">${icon(c.id, './')}</span><strong>${esc(c.name)}</strong><span class="card-desc">${plural(c.count,'tool','tools')}</span></a>`
).join('')}</div>

<h2 class="section-title">Conversion families</h2>
<div class="grid grid-feature">${NAV_DIMS.map(d =>
  `<a class="card card-lg" href="conversions/${d.id}/index.html"><span class="card-icon">${icon(d.id, './')}</span><strong>${esc(d.label)}</strong><span class="card-desc">${plural(d.count,'converter','converters')}</span></a>`
).join('')}</div>`;

write('index.html', shell({
  title: `${TOTAL_LABEL} Free Online Calculators & Converters | ${BRAND}`,
  description: `${index.length.toLocaleString()} free online tools: converters, calculators for finance, maths, engineering and science. Runs entirely in your browser and works offline.`,
  canonical: SITE + '/', body: homeBody, depth: 0, activeCat: 'home',
  jsonld: {
    '@context': 'https://schema.org',
    '@type': 'WebSite', name: BRAND, url: SITE,
    potentialAction: { '@type': 'SearchAction', target: `${SITE}/?q={q}`, 'query-input': 'required name=q' }
  }
}));

/* search index — trimmed to keep the payload small */
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'assets/search-index.js'),
  'window.SEARCH_INDEX=' + JSON.stringify(index.map(t => [t.title, t.url, t.iconId])) + ';');

/* engine bundles consumed by the pages */
fs.mkdirSync(path.join(OUT, 'engine'), { recursive: true });
const unitsSrc = fs.readFileSync(path.join(__dirname, 'engine/units.js'), 'utf8')
  .replace(/if \(typeof module[\s\S]*$/, '');
fs.writeFileSync(path.join(OUT, 'engine/units.bundle.js'),
  unitsSrc + '\nwindow.UNITS=UNITS;window.convert=convert;window.convertAll=convertAll;');

const toolsSrc = fs.readFileSync(path.join(__dirname, 'engine/tools.js'), 'utf8')
  .replace(/if \(typeof module[\s\S]*$/, '') + '\nwindow.TOOLS=TOOLS;';
fs.writeFileSync(path.join(OUT, 'engine/tools.bundle.js'), toolsSrc);

fs.copyFileSync(path.join(__dirname, 'engine/render-core.js'), path.join(OUT, 'engine/render-core.js'));
fs.copyFileSync(path.join(__dirname, 'engine/render-dev.js'), path.join(OUT, 'engine/render-dev.js'));

/* Per-tool dev bundles. Shipping all twenty specs to a page that uses
   one of them wasted ~16 KB gzipped per visit, so each tool gets a
   bundle containing only its own spec plus the shared helpers. */
const devRaw = fs.readFileSync(path.join(__dirname, 'engine/devtools.js'), 'utf8');
const HELPERS = devRaw.slice(
  devRaw.indexOf('/* ===================== shared helpers'),
  devRaw.indexOf('if (typeof module')
);

function serialiseSpec(id, spec) {
  const parts = [];
  for (const [k, v] of Object.entries(spec)) {
    if (typeof v === 'function') parts.push(`${JSON.stringify(k)}: ${v.toString()}`);
    else parts.push(`${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  }
  return `window.DEV_TOOLS = window.DEV_TOOLS || {};\nwindow.DEV_TOOLS[${JSON.stringify(id)}] = {\n${parts.join(',\n')}\n};\n`;
}

for (const [id, spec] of Object.entries(DEV_TOOLS)) {
  fs.writeFileSync(path.join(OUT, `engine/dev-${id}.js`),
    '(function(){\n' + HELPERS + '\n' + serialiseSpec(id, spec) + '})();');
}

const qrSrc = fs.readFileSync(path.join(__dirname, 'engine/qr.js'), 'utf8')
  .replace(/if \(typeof module[\s\S]*$/, '') + '\nwindow.encodeQR=encodeQR;window.qrToSVG=qrToSVG;';
fs.writeFileSync(path.join(OUT, 'engine/qr.bundle.js'), qrSrc);


/* static assets */
for (const f of ['app.css', 'app.js', 'icons.svg']) {
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
  name: 'MVR IT Services — Tools', short_name: 'MVR Tools',
  description: `${TOTAL_LABEL} free calculators and converters from MVR IT Services. Works offline.`,
  start_url: '/', scope: '/', display: 'standalone',
  theme_color: '#06080f', background_color: '#06080f',
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
