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

  /* ---- Context-aware contact: ?i=<topic> pre-fills form & WhatsApp ---- */
  var WA_NUMBER = "447446228152";
  var TOPICS = {
    custom:       { opt: "Custom software development",        msg: "Hi MVR team, I'd like to discuss a custom software project for my business." },
    xleshop:      { opt: "XLeShop e-commerce store",           msg: "Hi MVR team, I'd like to launch an online store with XLeShop. Please tell me how to get started." },
    school:       { opt: "School Management System",           msg: "Hi MVR team, I'd like a demo of the School Management System for our institution." },
    hospital:     { opt: "Hospital Management System",         msg: "Hi MVR team, I'd like a demo of the Hospital Management System for our clinic/hospital." },
    sthira:       { opt: "Sthira — Yoga & Wellness App",       msg: "Hi MVR team, I'd like to bring the Sthira yoga & wellness app to my studio." },
    events:       { opt: "Event registration & QR check-in",   msg: "Hi MVR team, I'm planning an event and would like to use your registration & QR check-in system." },
    telemarketing:{ opt: "Telemarketing Suite",                msg: "Hi MVR team, I'd like to boost my sales team with your Telemarketing Suite." },
    payments:     { opt: "Payment gateway integration",        msg: "Hi MVR team, I need a payment gateway integrated into my platform." },
    comms:        { opt: "WhatsApp / SMS / Email automation",  msg: "Hi MVR team, I'd like to automate WhatsApp/SMS/email messaging for my business." },
    web:          { opt: "Website design & development",       msg: "Hi MVR team, I'd like a new website for my business." },
    ai:           { opt: "AI & Agentic AI solutions",          msg: "Hi MVR team, I'm interested in AI / Agentic AI solutions for my organisation." },
    cloud:        { opt: "Cloud deployment & migration",       msg: "Hi MVR team, I'd like help with cloud deployment or migration." },
    seo:          { opt: "SEO & digital growth",               msg: "Hi MVR team, I'd like to improve my website's SEO and growth." },
    domains:      { opt: "Domains, DNS & hosting",             msg: "Hi MVR team, I need help with domains, DNS or hosting." },
    support:      { opt: "Support & maintenance",              msg: "Hi MVR team, I'm looking for ongoing support & maintenance for my systems." },
    demo:         { opt: "Something else",                     msg: "Hi MVR team, I'd like a walkthrough of your products." },
    advice:       { opt: "Something else",                     msg: "Hi MVR team, I'd like some free advice on the right solution for my need." }
  };
  function waUrl(msg) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  }

  var params = new URLSearchParams(location.search);
  var topic = TOPICS[params.get("i")] || null;

  /* Contact form pre-fill */
  var topicSelect = document.getElementById("topic");
  var messageBox = document.getElementById("message");
  if (topicSelect && topic) {
    for (var oi = 0; oi < topicSelect.options.length; oi++) {
      if (topicSelect.options[oi].text === topic.opt) { topicSelect.selectedIndex = oi; break; }
    }
    if (messageBox && !messageBox.value) messageBox.value = topic.msg + "\n\nA little about my business: ";
  }

  /* Contact page WhatsApp link carries the same context */
  var waLink = document.getElementById("wa-link");
  if (waLink) {
    waLink.href = waUrl(topic ? topic.msg : "Hi MVR team, I'd like to talk about a project.");
  }

  /* Floating WhatsApp button on every page (context-aware) */
  (function () {
    var pageMsg;
    if (topic) pageMsg = topic.msg;
    else if (location.pathname.indexOf("/products") === 0) pageMsg = "Hi MVR team, I'm looking at your products and would like to know more.";
    else if (location.pathname.indexOf("/services") === 0) pageMsg = "Hi MVR team, I'm looking at your services and would like to know more.";
    else pageMsg = "Hi MVR team, I found your website and would like to discuss a project.";
    var a = document.createElement("a");
    a.className = "wa-float";
    a.href = waUrl(pageMsg);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Chat with us on WhatsApp");
    a.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.3l-.4-.2-4.9 1 1-4.7-.3-.4c-1-1.6-1.6-3.4-1.6-5.2 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8zm5.4-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.5-.3z"/></svg>';
    document.body.appendChild(a);
  })();

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
