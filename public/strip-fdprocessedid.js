// Autofill extensions stamp `fdprocessedid` on form controls before React
// hydrates, which causes a hydration mismatch. Strip it as it appears.
(function () {
  var A = 'fdprocessedid';
  function clean(node) {
    if (node.removeAttribute && node.hasAttribute && node.hasAttribute(A)) node.removeAttribute(A);
  }
  new MutationObserver(function (records) {
    records.forEach(function (r) { clean(r.target); });
  }).observe(document, { attributes: true, attributeFilter: [A], subtree: true });
  setTimeout(function () {
    document.querySelectorAll('[' + A + ']').forEach(clean);
  }, 0);
})();
