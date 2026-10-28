// Page-scoped: this header is a live HTML recreation of the approved
// Contact visual, not the shared .navbar component, so its ids (ctNavToggle
// / ctNavLinks) differ from main.js's (navToggle / navLinks). Kept separate
// rather than loading main.js here, which would throw against this page's
// markup.
document.getElementById('year').textContent = new Date().getFullYear();

var ctToggle = document.getElementById('ctNavToggle');
var ctLinks = document.getElementById('ctNavLinks');
if (ctToggle && ctLinks) {
  ctToggle.addEventListener('click', function () {
    var isOpen = ctLinks.classList.toggle('ct-nav-open');
    ctToggle.setAttribute('aria-expanded', String(isOpen));
  });
  ctLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      ctLinks.classList.remove('ct-nav-open');
      ctToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
