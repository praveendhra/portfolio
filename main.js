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

  /* ---------- three.js hero scene ---------- */
  var canvas = document.getElementById("hero-canvas");
  var motionBtn = document.querySelector(".motion-toggle");
  var running = !reduceMotion;
  var renderOnce = null;

  function updateMotionBtn() {
    motionBtn.setAttribute("aria-pressed", String(!running));
    motionBtn.setAttribute("aria-label", running ? "Pause background animation" : "Play background animation");
    motionBtn.querySelector("i").className = running ? "fa-solid fa-pause" : "fa-solid fa-play";
    motionBtn.querySelector(".motion-label").textContent = running ? "Pause motion" : "Play motion";
  }

  function initScene() {
    if (!window.THREE || !canvas) { motionBtn.hidden = true; return; }
    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isSmall, alpha: true, powerPreference: "low-power" });
    } catch (err) {
      motionBtn.hidden = true;
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f1a, 0.045);
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 14);

    var group = new THREE.Group();
    scene.add(group);

    /* central wireframe "core" */
    var coreGeo = new THREE.IcosahedronGeometry(isSmall ? 2.6 : 3.4, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x38d6f5, wireframe: true, transparent: true, opacity: 0.35 });
    var core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    var innerGeo = new THREE.IcosahedronGeometry(isSmall ? 1.5 : 2, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.5 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    /* orbit ring */
    var ringGeo = new THREE.TorusGeometry(isSmall ? 4 : 5.2, 0.015, 8, 160);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x38d6f5, transparent: true, opacity: 0.35 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    /* node network (particles + connecting lines) */
    var count = isSmall ? 70 : 140;
    var positions = new Float32Array(count * 3);
    var pts = [];
    for (var i = 0; i < count; i++) {
      var r = 6 + Math.random() * 8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var x = r * Math.sin(phi) * Math.cos(theta);
      var y = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      var z = r * Math.cos(phi) - 4;
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      pts.push(new THREE.Vector3(x, y, z));
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var pMat = new THREE.PointsMaterial({ color: 0xcfe9ff, size: isSmall ? 0.09 : 0.07, transparent: true, opacity: 0.9 });
    var points = new THREE.Points(pGeo, pMat);
    group.add(points);

    var linePos = [];
    var maxDist = 3.2;
    for (var a = 0; a < count; a++) {
      for (var b = a + 1; b < count; b++) {
        if (pts[a].distanceTo(pts[b]) < maxDist) {
          linePos.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
        }
      }
    }
    var lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    var lMat = new THREE.LineBasicMaterial({ color: 0x6f8cff, transparent: true, opacity: 0.16 });
    group.add(new THREE.LineSegments(lGeo, lMat));

    /* layout: shift scene right on desktop so text stays readable */
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      group.position.x = w > 860 ? 3.5 : 0;
      group.position.y = w > 860 ? 0 : 1.5;
    }
    window.addEventListener("resize", resize);
    resize();

    var target = { x: 0, y: 0 };
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
        target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
      }, { passive: true });
    } else {
      /* touch: drag across the hero turns the scene; passive so page scroll is never blocked */
      var hero = canvas.parentElement;
      hero.addEventListener("touchmove", function (e) {
        var t = e.touches[0];
        if (!t) return;
        target.x = (t.clientX / window.innerWidth - 0.5) * 0.9;
        target.y = (t.clientY / window.innerHeight - 0.5) * 0.5;
      }, { passive: true });
      hero.addEventListener("touchend", function () { target.x = 0; target.y = 0; }, { passive: true });
    }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && running) loop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && running) loop();
    });

    var clock = new THREE.Clock();
    var rafId = null;
    function draw(t) {
      core.rotation.y = t * 0.12;
      core.rotation.x = t * 0.06;
      inner.rotation.y = -t * 0.2;
      inner.rotation.z = t * 0.1;
      ring.rotation.z = t * 0.08;
      points.rotation.y = t * 0.02;
      group.rotation.y += (target.x - group.rotation.y) * 0.04;
      group.rotation.x += (target.y - group.rotation.x) * 0.04;
      var scroll = Math.min(window.scrollY / window.innerHeight, 1);
      camera.position.z = 14 + scroll * 6;
      renderer.render(scene, camera);
    }
    function loop() {
      if (rafId) cancelAnimationFrame(rafId);
      if (!running || !visible || document.hidden) { rafId = null; return; }
      draw(clock.getElapsedTime());
      rafId = requestAnimationFrame(loop);
    }
    renderOnce = function () { draw(clock.getElapsedTime()); };

    if (running) loop(); else renderOnce();

    motionBtn.addEventListener("click", function () {
      running = !running;
      updateMotionBtn();
      if (running) { clock.start(); loop(); } else if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    });
    updateMotionBtn();
  }

  if (window.THREE) initScene();
  else window.addEventListener("load", initScene);
})();
