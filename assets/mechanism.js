(function () {
  var host = document.getElementById("mechanism");
  if (!host) return;
  var target = document.querySelector(host.getAttribute("data-assemble-at"));
  var NS = "http://www.w3.org/2000/svg";
  var cta = document.querySelector(host.getAttribute("data-dock-at"));
  var DOCK = window.innerWidth < 600 ? 90 : 150;
  var GAP = 14;
  var GROW = 0.9;
  var SHRINK = 0.4;
  var SPIN = 0.01;
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
    var rot = { balance: [], fork: [], escape: [], spring: [] };
    var groupOf = { balance: "balance", axle: "balance", impulse: "balance", spring: "spring", fork: "fork", jewels: "fork", escapeWheel: "escape" };
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
    var bb = world.getBBox();
    var focus = [bb.x + bb.width / 2, bb.y + bb.height / 2, Math.max(bb.width, bb.height), bb.width, bb.height];

    var count = layers.length;
    layers.forEach(function (L, i) {
      var len = 0;
      try { len = L.path.getTotalLength(); } catch (e) { len = 0; }
      L.len = len;
      var pb = L.path.getBBox();
      L.c = [pb.x + pb.width / 2, pb.y + pb.height / 2];
      L.path.style.strokeDasharray = len.toFixed(0);
      var angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      var reach = 1050 + (i % 3) * 180;
      L.dx = Math.cos(angle) * reach;
      L.dy = Math.sin(angle) * reach - L.depth * 200;
      L.start = (i / count) * 0.5;
    });

    return { focus: focus, svg: svg, grid: grid, marks: marks, layers: layers, rot: rot };
  }

  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  function run(data) {
    var m = build(data);
    var progress = reduce ? 1 : 0;
    var goal = progress;
    var smoothing = false;
    var running = false;
    var t0 = 0;
    var escAngle = 0;
    var escBase = 0;
    var spinning = false;
    var last = 0;

    function spin(now) {
      if (running || reduce || document.hidden) { spinning = false; last = 0; return; }
      if (last) escAngle -= (now - last) * SPIN;
      last = now;
      rotate(m.rot.escape, data.escape, escAngle);
      requestAnimationFrame(spin);
    }
    function startSpin() {
      if (spinning || running || reduce || document.hidden) return;
      spinning = true;
      requestAnimationFrame(spin);
    }

    function compose() {
      m.layers.forEach(function (L) {
        var t = ease(clamp((progress - L.start) / 0.33));
        var k = 1 - t;
        var s = (1 + GROW * k).toFixed(4);
        L.layer.setAttribute("transform", "translate(" + (L.dx * k).toFixed(1) + " " + (L.dy * k).toFixed(1) + ") translate(" + L.c[0] + " " + L.c[1] + ") scale(" + s + ") translate(" + (-L.c[0]) + " " + (-L.c[1]) + ")");
        L.path.style.strokeDashoffset = (L.len * k).toFixed(0);
      });
      var dock = reduce ? 1 : ease(clamp((progress - 0.86) / 0.12));
      var base = reduce ? 1 : 1 - SHRINK * ease(clamp(progress / 0.84));
      var tx = 0, ty = 0, sc = base;
      if (dock > 0 && cta) {
        var b = cta.getBoundingClientRect();
        var w = m.svg.getBoundingClientRect().width / (m.scale || 1);
        var unit = w / data.viewBox[2];
        var target = DOCK / (m.focus[2] * unit);
        sc = base + (target - base) * dock;
        var fx = (m.focus[0] - (data.viewBox[0] + data.viewBox[2] / 2)) * unit * sc;
        var fy = (m.focus[1] - (data.viewBox[1] + data.viewBox[3] / 2)) * unit * sc;
        var half = m.focus[3] * unit * target / 2;
        var cx = b.right - half;
        var cy = b.top - GAP - m.focus[4] * unit * target / 2;
        tx = (cx - window.innerWidth / 2 - fx) * dock;
        ty = (cy - window.innerHeight / 2 - fy) * dock;
      }
      m.scale = sc;
      m.svg.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
      host.classList.toggle("assembled", progress >= 0.84);
      host.classList.toggle("done", progress >= 0.98);
    }

    function rotate(groups, center, deg) {
      var v = "rotate(" + deg.toFixed(2) + " " + center[0] + " " + center[1] + ")";
      groups.forEach(function (g) { g.setAttribute("transform", v); });
    }

    function inout(x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

    function tick(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var t = (now - t0) / 2400;
      var phase = Math.sin(t * Math.PI * 2);
      rotate(m.rot.balance, data.balance, phase * 42);
      var k = (1 + phase * 0.035).toFixed(4);
      var c = data.balance;
      m.rot.spring.forEach(function (g) { g.setAttribute("transform", "translate(" + c[0] + " " + c[1] + ") scale(" + k + ") translate(" + (-c[0]) + " " + (-c[1]) + ")"); });
      var beatPos = t * 2;
      var beats = Math.floor(beatPos);
      var flick = inout((beatPos - beats) / 0.1);
      var side = beats % 2 ? 1 : -1;
      rotate(m.rot.fork, data.fork, (-side + 2 * side * flick) * 6);
      rotate(m.rot.escape, data.escape, escBase - (beats + flick) * 6);
      requestAnimationFrame(tick);
    }

    function setRunning(on) {
      if (reduce) on = false;
      if (on === running) return;
      running = on;
      if (on) { t0 = 0; escBase = escAngle; requestAnimationFrame(tick); }
      else { escAngle = escBase; startSpin(); }
    }

    function endPoint() {
      var top = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.6;
      var max = document.documentElement.scrollHeight - window.innerHeight - 4;
      return Math.min(top, max);
    }
    function smooth() {
      var diff = goal - progress;
      progress = Math.abs(diff) < 0.0008 ? goal : progress + diff * 0.05;
      compose();
      setRunning(progress >= 0.98 && !document.hidden);
      if (progress !== goal) requestAnimationFrame(smooth);
      else smoothing = false;
    }
    function update() {
      if (!reduce && target) {
        var end = endPoint();
        goal = clamp(end > 0 ? window.scrollY / end : 1);
      }
      if (!smoothing) { smoothing = true; requestAnimationFrame(smooth); }
    }
    function onScroll() { update(); startSpin(); }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", onScroll);
    if (target && !reduce) {
      var end0 = endPoint();
      progress = goal = clamp(end0 > 0 ? window.scrollY / end0 : 1);
    }
    compose();
    setRunning(progress >= 0.98 && !document.hidden);
    startSpin();
    host.classList.add("ready");
  }

  fetch(host.getAttribute("data-outline"))
    .then(function (r) { return r.json(); })
    .then(run)
    .catch(function () { host.remove(); });
})();
