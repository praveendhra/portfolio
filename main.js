/* Portfolio interactions: 3D hero scene, tilt cards, reveal, nav. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isSmall = window.matchMedia("(max-width: 860px)").matches;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }
  toggle.addEventListener("click", function () {
    setMenu(!links.classList.contains("open"));
  });
  links.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* active section highlight */
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navAnchors.forEach(function (a) {
          if (a.getAttribute("href") === id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { secObs.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- 3D tilt (mouse only, motion allowed) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      var max = parseFloat(card.getAttribute("data-tilt-max")) || 8;
      var frame = null;
      card.style.transition = "transform 160ms cubic-bezier(0.22,1,0.36,1)";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          card.style.transform =
            "rotateX(" + ((0.5 - py) * max).toFixed(2) + "deg) rotateY(" +
            ((px - 0.5) * max).toFixed(2) + "deg) translateZ(0)";
          card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        });
      });
      card.addEventListener("pointerleave", function () {
        if (frame) cancelAnimationFrame(frame);
        card.style.transform = "";
      });
    });
  }

  /* ---------- cyberpunk portrait glitch ---------- */
  var photoCard = document.querySelector(".photo-card");
  if (photoCard && !reduceMotion) {
    var glitch = function () {
      photoCard.classList.remove("glitching");
      void photoCard.offsetWidth;
      photoCard.classList.add("glitching");
    };
    photoCard.addEventListener("animationend", function (e) {
      if (e.animationName === "cp-scan") photoCard.classList.remove("glitching");
    });
    if (finePointer) photoCard.addEventListener("mouseenter", glitch);
    else photoCard.addEventListener("click", glitch);
    setTimeout(glitch, 900); /* one boot-up glitch on load */
  }

  /* ---------- hero background: knowledge graph woven on a temporal loom ---------- */
  var canvas = document.getElementById("hero-canvas");
  var motionBtn = document.querySelector(".motion-toggle");
  var running = !reduceMotion;

  function updateMotionBtn() {
    motionBtn.setAttribute("aria-pressed", String(!running));
    motionBtn.setAttribute("aria-label", running ? "Pause background animation" : "Play background animation");
    motionBtn.querySelector("i").className = running ? "fa-solid fa-pause" : "fa-solid fa-play";
    motionBtn.querySelector(".motion-label").textContent = running ? "Pause motion" : "Play motion";
  }

  function initGraph() {
    var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    if (!ctx) { motionBtn.hidden = true; return; }

    var COLORS = { ai: "56,214,245", apps: "255,43,214", cloud: "167,139,250", data: "74,222,128", core: "238,241,247" };
    var notes = [
      ["Praveendhra", "core", 9],
      ["AI tooling", "ai", 6], ["MCP servers", "ai", 4], ["Copilot agents", "ai", 4], ["LLM fine-tuning", "ai", 3], ["Prompting", "ai", 2.5],
      ["Apps", "apps", 6], ["Momentum", "apps", 4], ["Task Tracker", "apps", 4], ["Cadence", "apps", 3.5], ["Flutter", "apps", 3], ["Supabase", "apps", 3],
      ["Cloud", "cloud", 6], ["Azure", "cloud", 4], ["AWS", "cloud", 3], ["Kubernetes", "cloud", 3.5], ["Terraform", "cloud", 3], ["GitHub Actions", "cloud", 3.5],
      ["Data", "data", 5], ["PostgreSQL", "data", 3], ["SQL Server", "data", 3], ["Kafka", "data", 2.5],
      ["TypeScript", "ai", 3], ["Python", "data", 3.5], ["Java", "cloud", 3]
    ];
    var links = [[0,1],[0,6],[0,12],[0,18],[1,2],[1,3],[1,4],[1,5],[2,22],[3,17],[4,13],[6,7],[6,8],[6,9],[6,10],[6,11],
                 [7,11],[8,10],[9,10],[12,13],[12,14],[12,15],[12,16],[12,17],[18,19],[18,20],[18,21],[11,19],[2,13],[23,1],[23,18],[24,12],[22,6],[20,13]];
    var filler = isSmall ? 22 : 80;
    var nodes = notes.map(function (n) { return { label: n[0], group: n[1], r: n[2], x: 0, y: 0, vx: 0, vy: 0 }; });
    var groups = ["ai", "apps", "cloud", "data"];
    for (var f = 0; f < filler; f++) {
      var gname = groups[f % 4];
      nodes.push({ label: "", group: gname, r: 1.2 + Math.random() * 1.3, x: 0, y: 0, vx: 0, vy: 0 });
      var hubIdx = { ai: 1, apps: 6, cloud: 12, data: 18 }[gname];
      links.push([nodes.length - 1, Math.random() < 0.55 ? hubIdx : 1 + Math.floor(Math.random() * (notes.length - 1))]);
      if (Math.random() < 0.25 && f > 2) links.push([nodes.length - 1, nodes.length - 2]);
    }
    var nbr = nodes.map(function () { return []; });
    links.forEach(function (l) { nbr[l[0]].push(l[1]); nbr[l[1]].push(l[0]); });

    var W = 0, H = 0, cx = 0, cy = 0, scale = 1, dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W > 860 ? W * 0.56 : W * 0.5;
      cy = W > 860 ? H * 0.52 : H * 0.45;
      scale = W > 860 ? Math.min(W / 1100, H / 700) * 1.25 : Math.min(W, H) / 560;
    }
    window.addEventListener("resize", resize);
    resize();
    nodes.forEach(function (n, i) {
      var a = (i / nodes.length) * Math.PI * 2 * 3.1;
      var rr = 60 + (i % 9) * 26;
      n.x = cx + Math.cos(a) * rr; n.y = cy + Math.sin(a) * rr;
    });

    var mouse = { x: -9999, y: -9999 };
    var hover = -1;
    window.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });

    function step() {
      var i, j, a, b, dx, dy, d2, d, f;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy + 0.01;
          if (d2 > 160000) continue;
          f = (2600 * scale) / d2; d = Math.sqrt(d2);
          a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
        }
      }
      links.forEach(function (l) {
        a = nodes[l[0]]; b = nodes[l[1]]; dx = b.x - a.x; dy = b.y - a.y; d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        var rest = (a.r + b.r) * 9 * scale + 34 * scale;
        f = (d - rest) * 0.004;
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.vx += (cx - a.x) * 0.00045; a.vy += (cy - a.y) * 0.0009;
        dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < 14000) { d = Math.sqrt(d2) + 0.01; a.vx += dx / d * 0.35; a.vy += dy / d * 0.35; }
        a.vx *= 0.86; a.vy *= 0.86;
        a.x += a.vx; a.y += a.vy;
      }
    }
    for (var warm = 0; warm < 260; warm++) step();

    var pulses = [];
    function spawnPulse() {
      var l = links[Math.floor(Math.random() * links.length)];
      pulses.push({ l: l, t: 0, dir: Math.random() < 0.5 ? 1 : -1, sp: 0.006 + Math.random() * 0.01 });
    }

    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      /* loom: warp threads drifting through time */
      var threads = isSmall ? 9 : 16;
      ctx.lineWidth = 1;
      for (var k = 0; k < threads; k++) {
        var y0 = (k + 0.5) / threads * H;
        var amp = 10 + (k % 4) * 6;
        ctx.beginPath();
        for (var x = 0; x <= W; x += 24) {
          var y = y0 + Math.sin(x * 0.006 + time * 0.00035 + k * 0.7) * amp + Math.sin(x * 0.017 - time * 0.0006 + k) * 4;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(" + (k % 2 ? COLORS.cloud : COLORS.ai) + "," + (0.05 + (k % 3) * 0.015) + ")";
        ctx.stroke();
      }
      /* time cursor sweeping across the loom */
      var tx = ((time * 0.04) % (W + 200)) - 100;
      var grad = ctx.createLinearGradient(tx - 80, 0, tx + 80, 0);
      grad.addColorStop(0, "rgba(56,214,245,0)"); grad.addColorStop(0.5, "rgba(56,214,245,0.07)"); grad.addColorStop(1, "rgba(56,214,245,0)");
      ctx.fillStyle = grad; ctx.fillRect(tx - 80, 0, 160, H);

      /* hover detection */
      hover = -1;
      if (finePointer) {
        var best = 22 * 22;
        nodes.forEach(function (n, i) { var dx = n.x - mouse.x, dy = n.y - mouse.y, d2 = dx * dx + dy * dy; if (d2 < best && n.label) { best = d2; hover = i; } });
      }
      var lit = hover >= 0 ? nbr[hover].concat([hover]) : null;

      /* edges, gently curved like weft threads */
      links.forEach(function (l) {
        var a = nodes[l[0]], b = nodes[l[1]];
        var on = lit && (l[0] === hover || l[1] === hover);
        var mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08, my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y);
        var edgeA = (W > 860 && (a.x + b.x) / 2 < W * 0.5) ? 0.06 : 0.14;
        ctx.strokeStyle = on ? "rgba(" + COLORS[nodes[hover].group] + ",0.7)" : (lit ? "rgba(160,170,200,0.05)" : "rgba(160,170,200," + edgeA + ")");
        ctx.lineWidth = on ? 1.4 : 1;
        ctx.stroke();
      });

      /* pulses travelling along links */
      if (running && Math.random() < (isSmall ? 0.04 : 0.08) && pulses.length < 18) spawnPulse();
      pulses = pulses.filter(function (p) {
        p.t += p.sp;
        if (p.t >= 1) return false;
        var a = nodes[p.l[0]], b = nodes[p.l[1]];
        var t = p.dir > 0 ? p.t : 1 - p.t;
        var mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.08, my = (a.y + b.y) / 2 - (b.x - a.x) * 0.08;
        var x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x;
        var y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y;
        var c = COLORS[nodes[p.l[0]].group];
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + c + ",0.95)"; ctx.shadowColor = "rgba(" + c + ",1)"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
        return true;
      });

      /* nodes */
      var textEdge = W > 860 ? W * 0.5 : 0;
      nodes.forEach(function (n, i) {
        var behindText = textEdge && n.x < textEdge && i !== hover;
        var dim = (lit && lit.indexOf(i) < 0) || behindText;
        var c = COLORS[n.group];
        var r = n.r * (isSmall ? 1.25 : 1.6) * Math.max(scale, 0.7);
        if (n.r >= 5) {
          ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + c + "," + (dim ? 0.03 : 0.08) + ")"; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + (n.label ? c : "150,160,185") + "," + (dim ? 0.15 : (n.label ? 0.9 : 0.5)) + ")";
        ctx.fill();
        var showLabel = n.label && !behindText && (i === hover || (lit && lit.indexOf(i) >= 0) || (!isSmall && n.r >= 4));
        if (showLabel) {
          ctx.font = (i === hover ? "600 13px " : "500 12px ") + "Inter, system-ui, sans-serif";
          ctx.fillStyle = "rgba(238,241,247," + (dim ? 0.2 : (i === hover ? 1 : 0.55)) + ")";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + r + 15);
        }
      });
    }

    var visible = true, rafId = null;
    function loop(t) {
      rafId = null;
      if (!running || !visible || document.hidden) return;
      step(); draw(t || performance.now());
      rafId = requestAnimationFrame(loop);
    }
    function start() { if (!rafId) rafId = requestAnimationFrame(loop); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && running) start(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden && running) start(); });
    window.addEventListener("resize", function () { if (!running) draw(performance.now()); });

    draw(performance.now());
    canvas.classList.add("ready");
    if (running) start();
    motionBtn.addEventListener("click", function () {
      running = !running;
      updateMotionBtn();
      if (running) start();
    });
    updateMotionBtn();
  }

  if ("requestIdleCallback" in window) requestIdleCallback(initGraph, { timeout: 600 });
  else setTimeout(initGraph, 50);
})();

