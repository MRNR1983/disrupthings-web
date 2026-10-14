(function () {
  var host = document.getElementById("robot");
  if (!host || !window.rough) return;
  var NS = "http://www.w3.org/2000/svg";
  var W = 400;

  function mirrorRect(x, w) { return W - x - w; }

  function arm(side) {
    var m = side === "r";
    var X = function (x, w) { return m ? mirrorRect(x, w || 0) : x; };
    return [
      ["circle", X(128), 200, 40],
      ["rect", X(104, 26), 214, 26, 74],
      ["circle", X(117), 296, 22],
      ["rect", X(106, 24), 306, 24, 72],
      ["rect", X(103, 30), 380, 30, 24],
      ["path", m
        ? "M294 404v12M286 404v16M278 404v16M270 404v14"
        : "M106 404v12M114 404v16M122 404v16M130 404v14"]
    ];
  }
  function leg(side) {
    var m = side === "r";
    var X = function (x, w) { return m ? mirrorRect(x, w || 0) : x; };
    return [
      ["circle", X(182), 388, 24],
      ["rect", X(166, 32), 398, 32, 90],
      ["circle", X(182), 496, 26],
      ["rect", X(168, 28), 510, 28, 86],
      ["path", m ? "M240 596L196 596L190 616L248 616Z" : "M160 596L204 596L210 616L152 616Z"]
    ];
  }

  var parts = [
    { from: [0, 120, 0], win: [0.0, 0.32], shapes: [
      ["path", "M140 182L260 182L250 290L150 290Z"],
      ["rect", 168, 200, 64, 44, { fill: "currentColor", fillStyle: "hachure", hachureGap: 7, fillWeight: 0.8 }],
      ["circle", 200, 262, 24],
      ["rect", 158, 294, 84, 14],
      ["rect", 162, 310, 76, 14],
      ["rect", 166, 326, 68, 14],
      ["path", "M160 344L240 344L228 378L172 378Z"]
    ] },
    { from: [-60, 140, 8], win: [0.08, 0.45], shapes: leg("l") },
    { from: [60, 140, -8], win: [0.12, 0.5], shapes: leg("r") },
    { from: [-120, 30, -20], win: [0.24, 0.62], shapes: arm("l") },
    { from: [120, 30, 20], win: [0.3, 0.68], shapes: arm("r") },
    { from: [0, -60, 0], win: [0.45, 0.7], shapes: [
      ["rect", 186, 156, 28, 8],
      ["rect", 184, 166, 32, 8]
    ] },
    { from: [-70, -110, -12], win: [0.5, 0.86], shapes: [
      ["path", "M156 72Q200 52 244 72L250 140Q200 160 150 140Z"],
      ["rect", 163, 88, 74, 30, { fill: "currentColor", fillStyle: "hachure", hachureGap: 5, fillWeight: 0.7 }],
      ["circle", 146, 108, 20],
      ["circle", 254, 108, 20],
      ["path", "M184 136Q200 142 216 136"]
    ] },
    { from: [50, -130, 20], win: [0.72, 0.95], shapes: [
      ["path", "M200 62L200 38"],
      ["circle", 200, 31, 12]
    ] }
  ];

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 400 640");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  var rc = window.rough.svg(svg);
  var base = { stroke: "currentColor", strokeWidth: 1.5, roughness: 1.7, bowing: 1.3 };

  var built = parts.map(function (p, i) {
    var g = document.createElementNS(NS, "g");
    p.shapes.forEach(function (s, j) {
      var extra = s[s.length - 1];
      var opts = Object.assign({ seed: (i + 1) * 31 + j }, base, typeof extra === "object" ? extra : {});
      var node;
      if (s[0] === "rect") node = rc.rectangle(s[1], s[2], s[3], s[4], opts);
      else if (s[0] === "circle") node = rc.circle(s[1], s[2], s[3], opts);
      else node = rc.path(s[1], opts);
      g.appendChild(node);
    });
    svg.appendChild(g);
    return g;
  });

  var glow = document.createElementNS(NS, "rect");
  glow.setAttribute("x", "166"); glow.setAttribute("y", "91");
  glow.setAttribute("width", "68"); glow.setAttribute("height", "24");
  glow.setAttribute("rx", "6"); glow.setAttribute("class", "eye");
  built[6].appendChild(glow);

  host.appendChild(svg);

  var strokes = built.map(function (g) {
    return Array.prototype.map.call(g.querySelectorAll("path"), function (el) {
      var len = 0;
      try { len = el.getTotalLength(); } catch (e) { len = 0; }
      el.style.strokeDasharray = len.toFixed(1);
      return { el: el, len: len };
    });
  });

  var target = document.querySelector(host.getAttribute("data-assemble-at"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  function render(progress) {
    parts.forEach(function (p, i) {
      var t = ease(clamp((progress - p.win[0]) / (p.win[1] - p.win[0])));
      var k = 1 - t;
      built[i].setAttribute("transform",
        "translate(" + (p.from[0] * k).toFixed(1) + " " + (p.from[1] * k).toFixed(1) + ") rotate(" +
        (p.from[2] * k).toFixed(1) + " 200 320)");
      strokes[i].forEach(function (s) { s.el.style.strokeDashoffset = (s.len * k).toFixed(1); });
    });
    host.classList.toggle("done", progress >= 0.98);
  }

  if (reduce || !target) { render(1); return; }

  var ticking = false;
  function update() {
    ticking = false;
    var end = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35;
    var progress = end > 0 ? window.scrollY / end : 1;
    render(clamp(progress));
    svg.style.transform = "translateY(" + (-window.scrollY * 0.04).toFixed(1) + "px)";
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
