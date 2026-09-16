/**
 * Case-study gallery lightbox — reusable across any case-study page that
 * marks up its gallery the same way (see projects/zeher.html for the
 * pattern): a <button class="gallery-item"> per image, each carrying
 * data-lightbox-src/-caption/-alt, grouped simply by DOM order within
 * .gallery-primary/.gallery-secondary. Nothing here is Zeher-specific.
 */
(function () {
  'use strict';

  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var lightboxImg = lightbox.querySelector('.lightbox-figure img');
  var lightboxCaption = lightbox.querySelector('.lightbox-caption');
  var closeBtn = lightbox.querySelector('.lightbox-close');
  var prevBtn = lightbox.querySelector('.lightbox-prev');
  var nextBtn = lightbox.querySelector('.lightbox-next');

  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var currentIndex = -1;
  var triggerEl = null;

  function openAt(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    var el = items[index];
    lightboxImg.src = el.getAttribute('data-lightbox-src') || el.querySelector('img').src;
    lightboxImg.alt = el.getAttribute('data-lightbox-alt') || el.querySelector('img').alt || '';
    lightboxCaption.textContent = el.getAttribute('data-lightbox-caption') || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (triggerEl) triggerEl.focus();
  }

  items.forEach(function (el, index) {
    el.addEventListener('click', function () {
      triggerEl = el;
      openAt(index);
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', function () { openAt((currentIndex - 1 + items.length) % items.length); });
  nextBtn.addEventListener('click', function () { openAt((currentIndex + 1) % items.length); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') openAt((currentIndex - 1 + items.length) % items.length);
    else if (e.key === 'ArrowRight') openAt((currentIndex + 1) % items.length);
    else if (e.key === 'Tab') {
      // Simple focus trap: only three focusable elements while open.
      var focusables = [prevBtn, nextBtn, closeBtn];
      var active = document.activeElement;
      var idx = focusables.indexOf(active);
      e.preventDefault();
      if (e.shiftKey) {
        focusables[(idx <= 0 ? focusables.length : idx) - 1].focus();
      } else {
        focusables[(idx + 1) % focusables.length].focus();
      }
    }
  });
})();

/**
 * Scroll reveal — fades/rises any .reveal-on-scroll element into view once
 * it crosses into the viewport. Generic and content-agnostic: a theme file
 * decides which elements carry the class and their stagger timing via CSS
 * transition-delay (see case-study-zeher.css). No-ops entirely under
 * prefers-reduced-motion or without IntersectionObserver support, in which
 * case the elements are simply left visible via the CSS fallback.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll('.reveal-on-scroll');
  if (!targets.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(function (el) { observer.observe(el); });
})();
