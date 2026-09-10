/**
 * Door entrance transition — isolated, reusable component.
 *
 * Usage:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
 *   <link rel="stylesheet" href="assets/css/door-transition.css" />
 *   <script src="assets/js/door-transition.js"></script>
 *   <script>DoorTransition.init();</script>
 *
 * To use real photo cutouts instead of the illustrated fallback, pass asset
 * URLs (each image needs a transparent background, pre-cropped to that
 * layer's silhouette):
 *
 *   DoorTransition.init({
 *     assets: {
 *       frame: 'assets/images/door/frame.png',
 *       doorLeft: 'assets/images/door/door-left.png',
 *       doorRight: 'assets/images/door/door-right.png',
 *     }
 *   });
 *
 * Runs once per browser session (sessionStorage), respects
 * prefers-reduced-motion, locks page scroll while active, and degrades to
 * an instant reveal if GSAP failed to load.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'dk-door-transition-played';

  function buildReliefSVG() {
    return (
      '<svg class="door-transition__panel-relief" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g stroke="rgba(0,0,0,0.3)" stroke-width="1.4" fill="none">' +
      '<path d="M50 10 L50 24" /><path d="M50 10 C44 12 40 17 39 25" /><path d="M50 10 C56 12 60 17 61 25" />' +
      '<path d="M50 10 C38 10 30 16 28 27" /><path d="M50 10 C62 10 70 16 72 27" />' +
      '</g>' +
      '<path d="M30 48 C22 58 22 71 30 81" stroke="rgba(0,0,0,0.24)" stroke-width="1.3" fill="none" />' +
      '<path d="M70 48 C78 58 78 71 70 81" stroke="rgba(0,0,0,0.24)" stroke-width="1.3" fill="none" />' +
      '</svg>'
    );
  }

  function buildBracketSVG() {
    return (
      '<svg class="door-transition__bracket" viewBox="0 0 100 20" aria-hidden="true">' +
      '<path d="M8 4 C24 4 28 15 50 15 C72 15 76 4 92 4" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.6" />' +
      '<path d="M50 15 L50 19" stroke="rgba(0,0,0,0.3)" stroke-width="1.6" />' +
      '</svg>'
    );
  }

  function buildSprigSVG() {
    return (
      '<svg class="door-transition__sprig" viewBox="0 0 100 50" aria-hidden="true">' +
      '<path d="M50 48 C50 34 50 20 50 8" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.4" />' +
      '<path d="M50 30 C40 26 34 16 38 6" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.4" />' +
      '<path d="M50 30 C60 26 66 16 62 6" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.4" />' +
      '<path d="M50 40 C42 38 36 32 38 24" fill="none" stroke="rgba(0,0,0,0.24)" stroke-width="1.2" />' +
      '<path d="M50 40 C58 38 64 32 62 24" fill="none" stroke="rgba(0,0,0,0.24)" stroke-width="1.2" />' +
      '</svg>'
    );
  }

  function buildDoorInner(side) {
    return (
      '<div class="door-transition__panel-arch">' + buildReliefSVG() + '</div>' +
      buildBracketSVG() +
      '<div class="door-transition__panel-mid">' + buildSprigSVG() + '</div>' +
      '<div class="door-transition__panel-base"></div>' +
      (side === 'left' ? '<div class="door-transition__knocker"></div>' : '') +
      '<div class="door-transition__door-shadow"></div>'
    );
  }

  function buildCartoucheSVG() {
    return (
      '<svg class="door-transition__cartouche" viewBox="0 0 300 110" aria-hidden="true">' +
      '<circle cx="150" cy="38" r="21" fill="none" stroke="#5c4c34" stroke-width="2" opacity="0.85" />' +
      '<circle cx="150" cy="38" r="13" fill="none" stroke="#5c4c34" stroke-width="1.3" opacity="0.7" />' +
      '<path d="M139 31 Q150 24 161 31 M137 45 Q150 53 163 45" stroke="#5c4c34" stroke-width="1.3" fill="none" opacity="0.7" />' +
      '<g stroke="#5c4c34" stroke-width="1.5" opacity="0.55">' +
      '<path d="M150 13 L150 5" /><path d="M171 19 L177 13" /><path d="M129 19 L123 13" />' +
      '<path d="M179 38 L187 38" /><path d="M121 38 L113 38" />' +
      '<path d="M171 57 L177 63" /><path d="M129 57 L123 63" />' +
      '</g>' +
      '<path d="M150 55 C140 55 132 61 130 71 C128 83 138 93 150 101 C162 93 172 83 170 71 C168 61 160 55 150 55 Z" fill="none" stroke="#5c4c34" stroke-width="1.7" opacity="0.8" />' +
      '<g stroke="#5c4c34" stroke-width="1.7" fill="none" opacity="0.72">' +
      '<path d="M128 42 C100 28 66 30 44 46 C28 58 24 74 36 82 C44 88 56 86 58 78 C52 80 44 78 44 70 C44 60 56 54 66 58" />' +
      '<path d="M44 46 C32 40 16 42 10 54 C6 63 12 71 20 68" />' +
      '<path d="M58 78 C50 88 50 98 60 104 C66 96 64 86 58 78 Z" />' +
      '<path d="M36 82 C26 86 20 96 26 104" />' +
      '</g>' +
      '<g stroke="#5c4c34" stroke-width="1.7" fill="none" opacity="0.72" transform="translate(300,0) scale(-1,1)">' +
      '<path d="M128 42 C100 28 66 30 44 46 C28 58 24 74 36 82 C44 88 56 86 58 78 C52 80 44 78 44 70 C44 60 56 54 66 58" />' +
      '<path d="M44 46 C32 40 16 42 10 54 C6 63 12 71 20 68" />' +
      '<path d="M58 78 C50 88 50 98 60 104 C66 96 64 86 58 78 Z" />' +
      '<path d="M36 82 C26 86 20 96 26 104" />' +
      '</g>' +
      '</svg>'
    );
  }

  function buildFrameInner(imgUrl) {
    if (imgUrl) {
      return '<img src="' + imgUrl + '" alt="" />';
    }
    return (
      buildCartoucheSVG() +
      '<div class="door-transition__pilaster door-transition__pilaster--left"></div>' +
      '<div class="door-transition__pilaster door-transition__pilaster--right"></div>' +
      '<div class="door-transition__arch-trim"></div>' +
      '<div class="door-transition__keystone"></div>' +
      '<div class="door-transition__bollard door-transition__bollard--left"></div>' +
      '<div class="door-transition__bollard door-transition__bollard--right"></div>'
    );
  }

  function buildMarkup(assets) {
    var doorLeftContent = assets.doorLeft
      ? '<img src="' + assets.doorLeft + '" alt="" />'
      : buildDoorInner('left');
    var doorRightContent = assets.doorRight
      ? '<img src="' + assets.doorRight + '" alt="" />'
      : buildDoorInner('right');

    return (
      '<div class="door-transition__scene">' +
      '<div class="door-transition__stage">' +
      '<div class="door-transition__door door-transition__door--left">' + doorLeftContent + '</div>' +
      '<div class="door-transition__door door-transition__door--right">' + doorRightContent + '</div>' +
      '<div class="door-transition__frame">' + buildFrameInner(assets.frame) + '</div>' +
      '<p class="door-transition__prompt" data-dt-skip>Enter<span>Click to skip</span></p>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="door-transition__skip" data-dt-skip>Skip intro</button>'
    );
  }

  function init(options) {
    options = options || {};
    var assets = options.assets || {};
    var autoStartDelay = typeof options.autoStartDelay === 'number' ? options.autoStartDelay : 1500;
    var onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

    var alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      /* sessionStorage unavailable (e.g. privacy mode) — just play once per load */
    }
    if (alreadyPlayed) return;

    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var overlay = document.createElement('div');
    overlay.className = 'door-transition';
    overlay.setAttribute('data-stage', 'closed');
    overlay.innerHTML = buildMarkup(assets);
    document.body.appendChild(overlay);
    document.body.classList.add('door-transition-lock');

    var previousBodyOverflow = document.body.style.overflow;
    var previousHtmlOverflow = document.documentElement.style.overflow;

    var doneCalled = false;
    function finish() {
      if (doneCalled) return;
      doneCalled = true;
      overlay.setAttribute('data-stage', 'hidden');
      document.body.classList.remove('door-transition-lock');
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (e) {}
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 50);
      if (onComplete) onComplete();
    }

    // No GSAP, or reduced motion: skip straight to the real page.
    if (reduced || typeof window.gsap === 'undefined') {
      finish();
      return;
    }

    var gsap = window.gsap;
    var scene = overlay.querySelector('.door-transition__scene');
    var leftDoor = overlay.querySelector('.door-transition__door--left');
    var rightDoor = overlay.querySelector('.door-transition__door--right');
    var leftShadow = leftDoor.querySelector('.door-transition__door-shadow');
    var rightShadow = rightDoor.querySelector('.door-transition__door-shadow');

    var timeline = gsap.timeline({
      paused: true,
      onComplete: function () {
        overlay.setAttribute('data-stage', 'revealing');
        // matches the CSS transition on .door-transition__scene
        window.setTimeout(finish, 780);
      },
    });

    timeline
      .set(overlay, { attr: { 'data-stage': 'opening' } })
      .to(leftDoor, { rotateY: -108, duration: 1.3, ease: 'power3.inOut' }, 0)
      .to(rightDoor, { rotateY: 108, duration: 1.3, ease: 'power3.inOut' }, 0)
      .to([leftShadow, rightShadow], { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.05)
      .to([leftShadow, rightShadow], { opacity: 0, duration: 0.6, ease: 'power1.in' }, 0.85);

    var started = false;
    function start() {
      if (started) return;
      started = true;
      timeline.play();
    }

    function skip() {
      if (doneCalled) return;
      timeline.kill();
      overlay.setAttribute('data-stage', 'revealing');
      window.setTimeout(finish, 200);
    }

    overlay.querySelectorAll('[data-dt-skip]').forEach(function (el) {
      el.addEventListener('click', skip);
    });

    var autoStartTimer = window.setTimeout(start, autoStartDelay);
    overlay.addEventListener('click', function (evt) {
      if (evt.target.closest('[data-dt-skip]')) return;
      window.clearTimeout(autoStartTimer);
      start();
    });
  }

  window.DoorTransition = { init: init };
})();
