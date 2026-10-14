(function () {
  var host = document.getElementById("mechanism");
  if (!host) return;
  var target = document.querySelector(host.getAttribute("data-assemble-at"));
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }

  function spiral(cfg) {
    var steps = cfg.turns * 90;
    var d = "";
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var a = t * cfg.turns * Math.PI * 2;
      var r = cfg.inner + (cfg.outer - cfg.inner) * t;
      d += (i ? "L" : "M") + (cfg.center[0] + Math.cos(a) * r).toFixed(1) + " " + (cfg.center[1] + Math.sin(a) * r).toFixed(1);
    }
    return d;
  }

  function build(data) {
    var vb = data.viewBox;
    var svg = el("svg", { viewBox: vb.join(" "), "aria-hidden": "true", focusable: "false" });
    var defs = el("defs", {}, svg);
    var pattern = el("pattern", { id: "mech-grid", width: 40, height: 40, patternUnits: "userSpaceOnUse" }, defs);
    el("path", { d: "M40 0H0V40", "class": "grid-line" }, pattern);
    var grid = el("rect", { x: vb[0] * 2, y: vb[1] * 2, width: vb[2] * 2, height: vb[3] * 2, fill: "url(#mech-grid)", "class": "grid" }, svg);

    var marks = el("g", { "class": "marks" }, svg);
    [data.balance, data.fork, data.escape].forEach(function (p) {
      el("path", { d: "M" + (p[0] - 26) + " " + p[1] + "h52M" + p[0] + " " + (p[1] - 26) + "v52" }, marks);
    });
    el("path", { d: "M" + data.escape[0] + " " + data.escape[1] + "L" + data.balance[0] + " " + data.balance[1], "class": "dim" }, marks);

    var world = el("g", { "class": "world" }, svg);
    var rot = { balance: [], fork: [], escape: [] };
    var groupOf = { balance: "balance", axle: "balance", impulse: "balance", spring: "balance", fork: "fork", jewels: "fork", escapeWheel: "escape" };
    var layers = [];

    var all = data.parts.slice();
    all.push({ id: "spring", d: spiral(data.spring), depth: -0.79 });
    all.sort(function (a, b) { return a.depth - b.depth; });

    all.forEach(function (p) {
      var layer = el("g", { "class": "layer layer-" + p.id }, world);
      var holder = layer;
      var key = groupOf[p.id];
      if (key) { holder = el("g", {}, layer); rot[key].push(holder); }
      var path = el("path", { d: p.d }, holder);
      if (p.id === "jewels") path.setAttribute("class", "jewel");
      layers.push({ id: p.id, layer: layer, path: path, depth: p.depth });
    });

    host.appendChild(svg);

    var count = layers.length;
    layers.forEach(function (L, i) {
      var len = 0;
      try { len = L.path.getTotalLength(); } catch (e) { len = 0; }
      L.len = len;
      L.path.style.strokeDasharray = len.toFixed(0);
      var angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      L.dx = Math.cos(angle) * 260;
      L.dy = Math.sin(angle) * 260 - L.depth * 120;
      L.start = (i / count) * 0.5;
    });

    return { svg: svg, grid: grid, marks: marks, layers: layers, rot: rot };
  }

  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  function run(data) {
    var m = build(data);
    var progress = reduce ? 1 : 0;
    var running = false;
    var t0 = 0;

    function compose() {
      m.layers.forEach(function (L) {
        var t = ease(clamp((progress - L.start) / 0.45));
        var k = 1 - t;
        L.layer.setAttribute("transform", "translate(" + (L.dx * k).toFixed(1) + " " + (L.dy * k).toFixed(1) + ")");
        L.path.style.strokeDashoffset = (L.len * k).toFixed(0);
      });
      var depthShift = reduce ? 0 : Math.max(-60, -window.scrollY * 0.03);
      m.svg.style.transform = "translateY(" + depthShift.toFixed(1) + "px)";
      host.classList.toggle("done", progress >= 0.98);
    }

    function rotate(groups, center, deg) {
      var v = "rotate(" + deg.toFixed(2) + " " + center[0] + " " + center[1] + ")";
      groups.forEach(function (g) { g.setAttribute("transform", v); });
    }

    function tick(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var period = 1600;
      var t = (now - t0) / period;
      var phase = Math.sin(t * Math.PI * 2);
      rotate(m.rot.balance, data.balance, phase * 150);
      rotate(m.rot.fork, data.fork, Math.max(-1, Math.min(1, phase * 5)) * 7);
      var beats = Math.floor(t * 2 + 0.25);
      var within = (t * 2 + 0.25) - beats;
      var stepEase = within < 0.12 ? ease(within / 0.12) : 1;
      rotate(m.rot.escape, data.escape, -(beats - 1 + stepEase) * 12);
      requestAnimationFrame(tick);
    }

    function setRunning(on) {
      if (reduce) on = false;
      if (on === running) return;
      running = on;
      if (on) { t0 = 0; requestAnimationFrame(tick); }
    }

    var pending = false;
    function update() {
      pending = false;
      if (!reduce && target) {
        var end = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
        progress = clamp(end > 0 ? window.scrollY / end : 1);
      }
      compose();
      setRunning(progress >= 0.98 && !document.hidden);
    }
    function onScroll() { if (!pending) { pending = true; requestAnimationFrame(update); } }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", onScroll);
    update();
    host.classList.add("ready");
  }

  fetch(host.getAttribute("data-outline"))
    .then(function (r) { return r.json(); })
    .then(run)
    .catch(function () { host.remove(); });
})();
