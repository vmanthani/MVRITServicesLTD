/* Site shell: search, theme, offline registration. */
(function () {
  'use strict';
  var base = window.__BASE__ || './';

  /* ---- theme ---- */
  var saved = null;
  try { saved = localStorage.getItem('mvr-theme'); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  else if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  var themeBtn = document.getElementById('theme');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mvr-theme', next); } catch (e) {}
  });

  /* ---- search ----
     Scores title matches: exact prefix > word prefix > substring.
     Runs over ~900 entries in well under a frame, so no debounce needed. */
  var q = document.getElementById('q');
  var box = document.getElementById('results');
  if (!q || !box) return;

  function score(title, term) {
    var t = title.toLowerCase();
    if (t === term) return 1000;
    if (t.indexOf(term) === 0) return 500;
    var words = t.split(/[\s(),]+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].indexOf(term) === 0) return 300 - i;
    }
    return t.indexOf(term) > -1 ? 100 : 0;
  }

  function search(term) {
    var idx = window.SEARCH_INDEX || [];
    var hits = [];
    for (var i = 0; i < idx.length; i++) {
      var s = score(idx[i][0], term);
      if (s > 0) hits.push([s, idx[i]]);
    }
    hits.sort(function (a, b) { return b[0] - a[0]; });
    return hits.slice(0, 20).map(function (h) { return h[1]; });
  }

  function render(term) {
    if (!term) { box.hidden = true; box.innerHTML = ''; return; }
    var hits = search(term);
    if (!hits.length) {
      box.innerHTML = '<p class="search-empty">No tool matches “' +
        term.replace(/[<>&]/g, '') + '”. Try a unit name, or the quantity you want to work out.</p>';
      box.hidden = false;
      return;
    }
    box.innerHTML = hits.map(function (h) {
      return '<a href="' + base + h[1] + '"><span>' + h[2] + '</span><span>' + h[0] + '</span></a>';
    }).join('');
    box.hidden = false;
  }

  q.addEventListener('input', function () { render(q.value.trim().toLowerCase()); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { q.value = ''; render(''); q.blur(); }
    if (e.key === 'Enter') { var a = box.querySelector('a'); if (a) location.href = a.href; }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap') && !e.target.closest('.search-results')) render('');
  });
  // "/" focuses search, the way developer tools and docs sites do
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q &&
        !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); q.focus();
    }
  });

  /* ---- offline ---- */
  if ('serviceWorker' in navigator) {
    addEventListener('load', function () {
      navigator.serviceWorker.register(base + 'sw.js').catch(function () {});
    });
  }
})();
