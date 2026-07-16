/* MVR IT Services LTD — site behaviour */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Service worker (PWA) */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () { /* offline support unavailable */ });
    });
  }

  /* Sticky header */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile navigation */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Active nav link (clean URLs: "/", "/services/", ...) */
  var path = location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === "/" ? path === "/" : path.indexOf(href) === 0) a.classList.add("active");
  });

  /* Scroll-reveal */
  if ("IntersectionObserver" in window && !reducedMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
  }

  /* Animated counters */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reducedMotion) { el.textContent = target + suffix; return; }
    var dur = 1600, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });
  }

  /* Golden sparkles in hero sections */
  function sparkle(fx) {
    var canvas = document.createElement("canvas");
    canvas.className = "sparkle-canvas";
    fx.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var stars = [];
    var running = true;

    function size() {
      canvas.width = fx.clientWidth;
      canvas.height = fx.clientHeight;
    }
    size();
    window.addEventListener("resize", size);

    var COUNT = Math.min(70, Math.floor(canvas.width / 18));
    for (var i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: 0.6 + Math.random() * 1.6,
        tw: Math.random() * Math.PI * 2,
        ts: 0.008 + Math.random() * 0.02,
        vy: 0.00006 + Math.random() * 0.00018,
        gold: Math.random() > 0.25
      });
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tw += s.ts;
        s.y -= s.vy;
        if (s.y < -0.02) { s.y = 1.02; s.x = Math.random(); }
        var a = 0.25 + Math.abs(Math.sin(s.tw)) * 0.65;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? "rgba(247, 201, 72," + a + ")"
          : "rgba(255, 255, 255," + a * 0.7 + ")";
        ctx.shadowColor = "rgba(247, 201, 72, 0.8)";
        ctx.shadowBlur = s.r * 4;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    /* pause when tab hidden */
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }
  if (!reducedMotion && window.requestAnimationFrame) {
    document.querySelectorAll(".hero .fx, .page-hero .fx").forEach(sparkle);
  }

  /* Current year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* Cookie consent banner */
  var banner = document.getElementById("cookie-banner");
  if (banner) {
    var KEY = "mvr-cookie-consent";
    var choice = null;
    try { choice = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
    if (!choice) banner.classList.add("show");

    function setConsent(value) {
      try { localStorage.setItem(KEY, value); } catch (e) { /* ignore */ }
      banner.classList.remove("show");
      /* Hook: when analytics is added, only load it if value === "accepted". */
    }
    var acceptBtn = document.getElementById("cookie-accept");
    var declineBtn = document.getElementById("cookie-decline");
    if (acceptBtn) acceptBtn.addEventListener("click", function () { setConsent("accepted"); });
    if (declineBtn) declineBtn.addEventListener("click", function () { setConsent("declined"); });
  }
})();
