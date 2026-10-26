// Mobile disclosure for the primary nav. Loaded in <head> (not deferred)
// so the has-menu-js class is set before first paint: the collapsed nav
// never renders open first, which would shift the page (CLS). Without
// this script the nav simply stays open and the toggle stays hidden.
(function () {
  document.documentElement.classList.add("has-menu-js");
  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".menu-toggle");
    if (!button) return;
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        button.setAttribute("aria-expanded", "false");
        button.focus();
      }
    });
  });
})();
