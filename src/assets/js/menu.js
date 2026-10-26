// Mobile disclosure for the primary nav. Without this script the nav
// renders open (the toggle stays hidden), so nothing is ever unreachable.
(function () {
  var button = document.querySelector(".menu-toggle");
  var menu = document.getElementById("primary-menu");
  if (!button || !menu) return;
  document.documentElement.classList.add("has-menu-js");
  button.hidden = false;
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
})();
