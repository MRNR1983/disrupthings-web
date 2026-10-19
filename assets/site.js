(function () {
  var cv = document.getElementById("tesseract");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var verts = [];
  for (var i = 0; i < 16; i++) verts.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  var edges = [];
  for (var a = 0; a < 16; a++) for (var b = a + 1; b < 16; b++) { var d = a ^ b; if (d && !(d & (d - 1))) edges.push([a, b, Math.round(Math.log(d) / Math.LN2)]); }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var track = document.getElementById("track");
  var panels = track ? track.querySelectorAll(".panel").length : 0;
  var dpr = 1, level = reduce ? 4 : 0, tx = 0, ty = 0, sx = 0, sy = 0;
  var t0 = performance.now();
  function color(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#141A18"; }
  function size() {
    dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(window.innerWidth * dpr));
    cv.height = Math.max(1, Math.round(window.innerHeight * dpr));
  }
  size();
  window.addEventListener("resize", size);
  window.addEventListener("pointermove", function (e) {
    tx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
    ty = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", function () { tx = 0; ty = 0; });
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function progress() {
    if (!panels) return 4;
    var p;
    if (getComputedStyle(track).display === "flex") p = track.scrollLeft / Math.max(1, track.clientWidth);
    else {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      p = max > 0 ? (window.scrollY / max) * (panels - 1) : 0;
    }
    return Math.min(4, p * 4 / Math.max(1, panels - 2));
  }
  function target(now) {
    var waited = (now - t0) / 1000;
    var idle = Math.min(2, Math.max(0, (waited - 1.5) / 2.5) * 2);
    return Math.max(progress(), idle);
  }
  function rot(p, i, j, t) { var c = Math.cos(t), s = Math.sin(t); var x = p[i], y = p[j]; p[i] = x * c - y * s; p[j] = x * s + y * c; }
  function draw(t) {
    var w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    var f = [ease(level), ease(level - 1), ease(level - 2), ease(level - 3)];
    var tilt = ease(level - 3);
    var pts = verts.map(function (v) {
      var q = [v[0] * f[0], v[1] * f[1], v[2] * f[2], v[3] * f[3]];
      rot(q, 0, 3, t * 0.6 + sx * 0.8 * tilt);
      rot(q, 1, 3, sy * 0.8 * tilt);
      rot(q, 1, 2, t * 0.35);
      rot(q, 0, 2, t * 0.2);
      var k4 = 2.6 / (2.6 - q[3]);
      var x = q[0] * k4, y = q[1] * k4, z = q[2] * k4;
      var k3 = 4.5 / (4.5 - z);
      var m = Math.min(w, h) * 0.17;
      return [w * 0.62 + x * k3 * m, h / 2 + y * k3 * m, q[3]];
    });
    var ink = color("--ink");
    ctx.lineWidth = 1.4 * dpr;
    ctx.strokeStyle = ink;
    edges.forEach(function (e) {
      var k = e[2];
      if (f[k] <= 0.001) return;
      for (var j = 0; j < 4; j++) if (j !== k && f[j] <= 0.001 && (e[0] >> j) & 1) return;
      var A = pts[e[0]], B = pts[e[1]];
      ctx.globalAlpha = (0.25 + 0.55 * ((A[2] + B[2] + 2) / 4)) * Math.min(1, f[k] * 3);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = color("--dot");
    var c = pts[15];
    ctx.beginPath(); ctx.arc(c[0], c[1], (3.2 + 1.8 * (1 - Math.min(1, level))) * dpr, 0, Math.PI * 2); ctx.fill();
  }
  (function loop(now) {
    var goal = target(now);
    level += (goal - level) * (reduce ? 1 : 0.04);
    sx += (tx - sx) * 0.05; sy += (ty - sy) * 0.05;
    draw(reduce ? 0.6 : 0.6 + ((now - t0) / 60000) * Math.PI * 2);
    requestAnimationFrame(loop);
  })(t0);
})();

(function () {
  var track = document.getElementById("track");
  if (!track) return;
  var panels = Array.prototype.slice.call(track.querySelectorAll(".panel"));
  var dots = document.getElementById("pdots");
  var lbl = document.getElementById("pagerLbl");
  var prev = document.getElementById("pPrev");
  var next = document.getElementById("pNext");
  function horizontal() { return getComputedStyle(track).display === "flex"; }
  panels.forEach(function (p, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", p.getAttribute("data-name"));
    b.addEventListener("click", function () { go(i); });
    dots.appendChild(b);
  });
  function current() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
  function go(i) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    if (horizontal()) track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    else panels[i].scrollIntoView({ behavior: "smooth" });
  }
  function update() {
    var i = current();
    Array.prototype.forEach.call(dots.children, function (b, k) { b.classList.toggle("on", k === i); });
    lbl.textContent = String(i + 1).padStart(2, "0") + " · " + panels[i].getAttribute("data-name");
    prev.disabled = i === 0;
    next.disabled = i === panels.length - 1;
  }
  prev.addEventListener("click", function () { go(current() - 1); });
  next.addEventListener("click", function () { go(current() + 1); });
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  var lock = false;
  track.addEventListener("wheel", function (e) {
    if (!horizontal()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var panel = e.target.closest ? e.target.closest(".panel") : null;
    if (panel && panel.scrollHeight > panel.clientHeight + 2) {
      var down = e.deltaY > 0;
      var atEnd = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
      var atStart = panel.scrollTop <= 0;
      if ((down && !atEnd) || (!down && !atStart)) return;
    }
    e.preventDefault();
    if (lock || Math.abs(e.deltaY) < 4) return;
    lock = true;
    go(current() + (e.deltaY > 0 ? 1 : -1));
    setTimeout(function () { lock = false; }, 650);
  }, { passive: false });
  document.addEventListener("keydown", function (e) {
    if (!horizontal()) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(current() + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current() - 1); }
    if (e.key === "Home") { e.preventDefault(); go(0); }
    if (e.key === "End") { e.preventDefault(); go(panels.length - 1); }
  });
  document.querySelectorAll("a[href^='#']").forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var i = panels.findIndex(function (p) { return p.id === id; });
    if (i < 0) return;
    a.addEventListener("click", function (e) { e.preventDefault(); go(i); });
  });
  if (location.hash) {
    var start = panels.findIndex(function (p) { return "#" + p.id === location.hash; });
    if (start > 0) setTimeout(function () { go(start); }, 50);
  }
  update();
})();

(function () {
  var seg = document.getElementById("tarea");
  if (!seg) return;
  var en = document.documentElement.lang.indexOf("en") === 0;
  var T = en ? {
    names: { revision: "the check on your own equipment", rapido: "the quick answer, on your own equipment", razonar: "the in-depth analysis, on your own equipment", espera: "waiting until the internet is back", nube: "specialized support" },
    cloudPrivate: "Private data is removed before anything leaves; the answer comes back to your equipment and is completed there with your data.",
    cloudPlain: "Only when the task needs it.",
    outPrivate: "Only a version without private data leaves.",
    outPlain: "The question leaves, without your files.",
    outNone: "Nothing leaves your equipment.",
    solved: "Solved in "
  } : {
    names: { revision: "la revisión en tu equipo", rapido: "la respuesta rápida, en tu equipo", razonar: "el análisis a fondo, en tu equipo", espera: "espera, hasta que vuelva el internet", nube: "el apoyo especializado" },
    cloudPrivate: "Lo privado se quita antes de salir; la respuesta vuelve a tu equipo y ahí se completa con tus datos.",
    cloudPlain: "Solo cuando la tarea lo pide.",
    outPrivate: "Sale solo una versión sin datos privados.",
    outPlain: "Sale la pregunta, sin tus archivos.",
    outNone: "Nada sale de tu equipo.",
    solved: "Se resuelve en "
  };
  var privado = document.getElementById("privado");
  var red = document.getElementById("red");
  var route = document.getElementById("route");
  var result = document.getElementById("result");
  var nubeTxt = document.getElementById("nubeTxt");
  var tarea = "rapida";
  function ruta() {
    if (tarea === "rapida") return ["revision", "rapido"];
    if (tarea === "razonar") return ["revision", "rapido", "razonar"];
    return red.checked ? ["revision", "rapido", "razonar", "nube"] : ["revision", "rapido", "razonar", "espera"];
  }
  function pintar() {
    var r = ruta();
    var fin = r[r.length - 1];
    route.querySelectorAll("li").forEach(function (li) {
      var s = li.getAttribute("data-s");
      var on = r.indexOf(s) !== -1;
      li.classList.toggle("on", on);
      li.classList.toggle("off", !on);
      li.classList.toggle("end", s === fin);
    });
    nubeTxt.textContent = privado.checked ? T.cloudPrivate : T.cloudPlain;
    var sale = fin === "nube" ? (privado.checked ? T.outPrivate : T.outPlain) : T.outNone;
    result.textContent = T.solved + T.names[fin] + ". " + sale;
  }
  seg.querySelectorAll("button").forEach(function (b) {
    b.addEventListener("click", function () {
      tarea = b.getAttribute("data-v");
      seg.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
      pintar();
    });
  });
  privado.addEventListener("change", pintar);
  red.addEventListener("change", pintar);
  pintar();
})();

(function () {
  var btn = document.getElementById("copy");
  if (!btn) return;
  var label = document.getElementById("copy-label");
  var mail = document.getElementById("mail");
  var idle = btn.getAttribute("data-idle");
  var copied = btn.getAttribute("data-copied");
  var manual = btn.getAttribute("data-manual");
  btn.addEventListener("click", function () {
    var text = mail.textContent.trim();
    var done = function () { label.textContent = copied; setTimeout(function () { label.textContent = idle; }, 1800); };
    var fallback = function () {
      var range = document.createRange();
      range.selectNodeContents(mail);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      label.textContent = manual;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  });
})();
