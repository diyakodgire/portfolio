document.getElementById('year').textContent = new Date().getFullYear();

// Exposes the navbar's real rendered height as a CSS custom property so
// full-screen sections (e.g. .hero--landing) can size themselves to
// "the rest of the viewport below the sticky navbar" via calc(), instead
// of a hardcoded guess or an extra empty spacer element.
const navbarEl = document.querySelector('.navbar');
function setNavHeight() {
  if (navbarEl) {
    document.documentElement.style.setProperty('--nav-h', navbarEl.offsetHeight + 'px');
  }
}
setNavHeight();
window.addEventListener('resize', setNavHeight);

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const currentPage = location.pathname.split('/').pop() || 'index.html';
navLinks.querySelectorAll('a').forEach((link) => {
  if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
  }
});

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Returning to the homepage via the Home link or the DK logo — from any
// page, index.html included — shouldn't force the visitor back through
// the doorway intro. This sets a one-time flag that index.html's own
// script reads and immediately clears on load, so it only ever skips
// the very next load it causes: a direct visit, a manual reload, and
// Replay Intro are all untouched, since none of them go through this
// click handler.
const navBrand = document.querySelector('.nav-brand');
const homeLink = navLinks.querySelector('a[href="index.html"]');
[navBrand, homeLink].forEach((link) => {
  if (!link) return;
  link.addEventListener('click', () => {
    try {
      sessionStorage.setItem('skipDoorIntroOnce', '1');
    } catch (e) {}
  });
});
