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
