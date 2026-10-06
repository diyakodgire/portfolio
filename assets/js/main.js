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
