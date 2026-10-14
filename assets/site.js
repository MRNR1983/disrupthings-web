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
    var done = function () {
      label.textContent = copied;
      setTimeout(function () { label.textContent = idle; }, 1800);
    };
    var fallback = function () {
      var range = document.createRange();
      range.selectNodeContents(mail);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      label.textContent = manual;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });
})();
