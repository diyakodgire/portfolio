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
 *       // Optional wide-environment upgrade — all four required together,
 *       // and every pixel in them must come from the SAME source photo
 *       // (frameWide/doorLeftWide/doorRightWide are cut from facadeWide
 *       // itself), so there is nothing to cross-fade: the archway hole is
 *       // baked into frameWide's own alpha channel from the start.
 *       facadeWide: 'assets/images/door/facade-wide.png',
 *       frameWide: 'assets/images/door/frame-wide.png',
 *       doorLeftWide: 'assets/images/door/door-left-wide.png',
 *       doorRightWide: 'assets/images/door/door-right-wide.png',
 *     },
 *     // Optional — fires once the overlay is fully gone (real completion,
 *     // Skip, or a reduced-motion fade all funnel through this). Calling
 *     // init() again (e.g. from a page's own "Replay intro" control) starts
 *     // a fresh, independent run — nothing here is shared/global state
 *     // across calls, so repeated replays never leak listeners or overlays.
 *     onComplete: function () {},
 *   });
 *
 * Locks page scroll while active. The doorway never opens automatically —
 * it is a real, keyboard-reachable <button> the visitor must click/tap/
 * press Enter or Space on; under prefers-reduced-motion the door-swing/
 * camera-push animation is skipped in favor of a simple cross-fade, but
 * activation is still required. The door leaves themselves open via plain
 * native CSS transitions (door-transition.css), independent of GSAP
 * entirely, so they work even if the CDN script fails to load or is
 * blocked; only the final camera-push scale on .scene prefers GSAP when
 * present, falling back to the native Web Animations API when it's not.
 * Plays on every full load of the page it's initialized on — nothing here
 * gates a repeat run (a page wiring this up decides for itself whether/
 * how to offer a replay).
 */
(function () {
  'use strict';

  // Waits for the image to be fully DECODED (not just loaded) so it can be
  // painted with zero extra work the instant it's used — decode() covers
  // both the fetch and the decode, so a plain onload fallback is only
  // needed for browsers that lack it.
  function loadImage(url) {
    var img = new Image();
    img.src = url;
    if (img.decode) {
      return img.decode().then(function () { return true; }).catch(function () { return false; });
    }
    return new Promise(function (resolve) {
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
    });
  }

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
      (side === 'left' ? '<div class="door-transition__knocker"></div>' : '')
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
    // The wide-environment bundle is all-or-nothing: frameWide/doorLeftWide/
    // doorRightWide are cut from facadeWide itself (see door-transition.css
    // for the alignment notes), so mixing them with the original
    // frame/doorLeft/doorRight (a different source photo) is exactly the
    // color/architecture mismatch this bundle exists to avoid.
    var hasFacadeBundle = !!(assets.facadeWide && assets.frameWide && assets.doorLeftWide && assets.doorRightWide);

    var doorLeftSrc = hasFacadeBundle ? assets.doorLeftWide : assets.doorLeft;
    var doorRightSrc = hasFacadeBundle ? assets.doorRightWide : assets.doorRight;

    // Each leaf is split into an OUTER wrapper (.door-transition__door,
    // hover-only: scale/x/filter) and an INNER swing wrapper
    // (.door-transition__door-swing, rotateY — and ONLY rotateY — both for
    // the hover-preview's small inward tilt and the real door-open
    // animation). Both are plain native CSS transitions (see
    // door-transition.css), not GSAP, so the doors open even if the CDN
    // script fails to load. Shadow/depth live inside the swing wrapper so
    // they rotate together with the door, as originally designed.
    var doorLeftContent =
      '<div class="door-transition__door-swing">' +
      (doorLeftSrc ? '<img src="' + doorLeftSrc + '" alt="" />' : buildDoorInner('left')) +
      '<div class="door-transition__door-shadow"></div>' +
      '<div class="door-transition__door-depth"></div>' +
      '</div>';
    var doorRightContent =
      '<div class="door-transition__door-swing">' +
      (doorRightSrc ? '<img src="' + doorRightSrc + '" alt="" />' : buildDoorInner('right')) +
      '<div class="door-transition__door-shadow"></div>' +
      '<div class="door-transition__door-depth"></div>' +
      '</div>';

    // frameWide already IS the full wide facade photo with its own archway
    // opening cut transparent — it plays both roles (environment + frame)
    // at once, so .door-transition__frame (the separate close-up stone
    // layer) only exists in non-bundle mode.
    var facadeContent = hasFacadeBundle ? '<img src="' + assets.frameWide + '" alt="" />' : '';
    var frameLayer = hasFacadeBundle ? '' : '<div class="door-transition__frame">' + buildFrameInner(assets.frame) + '</div>';

    // An opaque backing directly behind the two door leaves, clipped to
    // the exact archway opening — only relevant in bundle mode, where
    // frameWide's own hole is a genuine transparent cutout revealing the
    // real page beneath the whole overlay. Without this, any gap between
    // the leaves (a sub-pixel registration gap at rest, or the deliberate
    // few-px hover seam-gap below) would let the real page show through
    // before the visitor has actually opened anything. In non-bundle mode
    // .backdrop already serves this exact role (see updateClipPaths()).
    var backingLayer = hasFacadeBundle ? '<div class="door-transition__doorway-backing"></div>' : '';

    // The doorway itself is the primary interactive element: a real,
    // transparent <button> exactly covering both leaves, reachable and
    // activatable by mouse, touch and keyboard alike (Enter/Space are
    // native <button> behavior, nothing extra needed).
    var enterLayer =
      '<button type="button" class="door-transition__enter" data-dt-enter ' +
      'aria-label="Enter the site — open the doorway"></button>';

    // The phrase is a SECOND, separate button, positioned against the
    // viewport (.scene's parent, not .scene itself — see the comment
    // below) rather than inside the doorway's own local coordinate space:
    // its exact screen position is computed in setup() (updatePhrasePosition)
    // directly from the doorway's known on-screen bottom edge, so it always
    // lands over the pavement below the doors, never overlapping them. It
    // shares the same hover-preview/activate wiring as the doorway button
    // in setup() below — hovering or clicking either one behaves identically.
    var phraseLayer =
      '<button type="button" class="door-transition__phrase" data-dt-phrase ' +
      'aria-label="Enter the site — open the doorway">' +
      '<span class="door-transition__phrase-text">Step into my world</span></button>';

    return (
      '<div class="door-transition__scene">' +
      '<div class="door-transition__backdrop"></div>' +
      '<div class="door-transition__facade">' + facadeContent + '</div>' +
      '<div class="door-transition__stage">' +
      backingLayer +
      '<div class="door-transition__door door-transition__door--left">' + doorLeftContent + '</div>' +
      '<div class="door-transition__door door-transition__door--right">' + doorRightContent + '</div>' +
      frameLayer +
      enterLayer +
      '</div>' +
      '</div>' +
      // Deliberately OUTSIDE .door-transition__scene: .scene itself carries
      // the camera-push scale transform (already at approachScale even at
      // rest), so anything positioned inside it is not in stable, true
      // viewport-space. .phrase needs to be, exactly like .skip below.
      phraseLayer +
      '<button type="button" class="door-transition__skip" data-dt-skip>Skip intro</button>'
    );
  }

  function init(options) {
    options = options || {};
    var assets = options.assets || {};
    var onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

    // A stale value from the old once-per-session gate (removed) would
    // otherwise sit in storage forever for returning visitors — nothing
    // reads this key anymore, but clear it so it's not lingering.
    try {
      sessionStorage.removeItem('dk-door-transition-played');
    } catch (e) {}

    // The doorway assets (frame/doorLeft/doorRight) are all-or-nothing — a
    // partial set falls back to the illustrated doorway entirely rather than
    // mixing photo and illustrated layers or showing broken images. The wide
    // facade bundle (facadeWide/frameWide/doorLeftWide/doorRightWide) is
    // best-effort on top of that and is ALSO all-or-nothing among
    // themselves: if any one fails, photo mode still runs, just centered
    // (the original frame/doorLeft/doorRight) instead of the wide
    // environment.
    var requiredUrls = [assets.frame, assets.doorLeft, assets.doorRight].filter(Boolean);
    if (requiredUrls.length === 3) {
      var loaders = [Promise.all(requiredUrls.map(loadImage)).then(function (results) {
        return results.every(Boolean);
      })];
      var bundleUrls = [assets.facadeWide, assets.frameWide, assets.doorLeftWide, assets.doorRightWide].filter(Boolean);
      loaders.push(bundleUrls.length === 4
        ? Promise.all(bundleUrls.map(loadImage)).then(function (results) { return results.every(Boolean); })
        : Promise.resolve(false));
      Promise.all(loaders).then(function (results) {
        var doorwayOk = results[0];
        var bundleOk = results[1];
        if (!doorwayOk) {
          startOverlay({});
          return;
        }
        var resolved = { frame: assets.frame, doorLeft: assets.doorLeft, doorRight: assets.doorRight };
        if (bundleOk) {
          resolved.facadeWide = assets.facadeWide;
          resolved.frameWide = assets.frameWide;
          resolved.doorLeftWide = assets.doorLeftWide;
          resolved.doorRightWide = assets.doorRightWide;
        }
        startOverlay(resolved);
      });
    } else {
      startOverlay(assets);
    }

    function startOverlay(resolvedAssets) {
    var overlay = document.createElement('div');
    overlay.className = 'door-transition';
    overlay.setAttribute('data-stage', 'closed');
    // Stay fully hidden until every layer is decoded and every initial
    // transform/clip-path is set — nothing partially-loaded is ever
    // painted, not even for a single frame.
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    overlay.innerHTML = buildMarkup(resolvedAssets);
    document.body.appendChild(overlay);
    document.body.classList.add('door-transition-lock');

    var previousBodyOverflow = document.body.style.overflow;
    var previousHtmlOverflow = document.documentElement.style.overflow;

    var doneCalled = false;
    var resizeHandler = null;
    function finish() {
      if (doneCalled) return;
      doneCalled = true;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      overlay.setAttribute('data-stage', 'hidden');
      document.body.classList.remove('door-transition-lock');
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 50);
      if (onComplete) onComplete();
    }

    var reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    // The door leaves open via native CSS transitions (see
    // door-transition.css), never via GSAP — that keeps the actual open/
    // close motion working even if the CDN script fails to load or is
    // blocked. GSAP, when present, is used only to drive the final
    // camera-push scale on .scene; when it's not, a native Web Animations
    // API tween does the same job (see startPush() below). Either way,
    // setup() always runs.

    // Decode every image actually inserted into the DOM (belt-and-suspenders
    // on top of the pre-flight loadImage() check in init() above, which
    // decoded separate Image() objects for the same URLs) before doing
    // anything else — no transform, no clip-path, no reveal, until every
    // layer can be painted in one already-composed frame.
    var domImages = Array.prototype.slice.call(overlay.querySelectorAll('img'));
    Promise.all(domImages.map(function (img) {
      if (img.decode) return img.decode().catch(function () {});
      return img.complete ? Promise.resolve() : new Promise(function (resolve) {
        img.onload = img.onerror = resolve;
      });
    })).then(setup);

    function setup() {
    // If anything below throws (a bad selector, a GSAP incompatibility,
    // whatever), fail open to the real page instead of leaving the visitor
    // stuck behind a static, non-interactive overlay forever.
    try {

    var hasGSAP = typeof window.gsap !== 'undefined';
    var gsap = hasGSAP ? window.gsap : null;
    var scene = overlay.querySelector('.door-transition__scene');
    var stage = overlay.querySelector('.door-transition__stage');
    var backdrop = overlay.querySelector('.door-transition__backdrop');
    var facade = overlay.querySelector('.door-transition__facade');
    var frame = overlay.querySelector('.door-transition__frame'); // null in facade-bundle mode
    var leftDoor = overlay.querySelector('.door-transition__door--left');
    var rightDoor = overlay.querySelector('.door-transition__door--right');
    // The INNER swing wrapper — a plain CSS transition on `transform`
    // (rotateY only) exclusively drives these, both for the hover-
    // preview's small inward tilt (data-hover, see door-transition.css)
    // and the real door-open transition (data-stage="opening") — never
    // leftDoor/rightDoor themselves. leftDoor/rightDoor (the OUTER
    // wrapper) only ever receive hover's seam-gap/scale/filter via their
    // own separate CSS rule. Shadow/depth/backing fades and the phrase's
    // fade are likewise pure CSS, keyed off the same two attributes —
    // nothing here needs to select or touch them directly.
    var leftSwing = leftDoor.querySelector('.door-transition__door-swing');
    var rightSwing = rightDoor.querySelector('.door-transition__door-swing');
    var doorwayBacking = overlay.querySelector('.door-transition__doorway-backing'); // null in non-bundle mode
    var enterBtn = overlay.querySelector('.door-transition__enter');
    var phraseBtn = overlay.querySelector('.door-transition__phrase');
    var hasFacadeBundle = !!resolvedAssets.frameWide;

    // .stage is a fixed 690x1200 box (frame.png's native size) — both doors
    // (and, in non-bundle mode, .frame) are laid out against this same box
    // with fixed percentages, so they scale and register together as one
    // rigid, undistorted image, never independently stretched.
    var STAGE_W = 690;
    var STAGE_H = 1200;

    var DOOR_LEFT_X = 0.1551 * STAGE_W;
    var DOOR_WIDTH = 0.3478 * STAGE_W;
    var DOOR_RIGHT_X = 0.5 * STAGE_W;
    var DOOR_TOP_Y = STAGE_H - (0.0433 + 0.7192) * STAGE_H;
    var DOOR_BOTTOM_Y = STAGE_H - 0.0433 * STAGE_H;
    var STAGE_CENTER_X = STAGE_W / 2;
    var STAGE_CENTER_Y = STAGE_H / 2;

    // facade-wide.png is 1672x941; the doorway sits within it at this fixed
    // position/scale, measured once against the source photo (matched via
    // the shared red-door pixel bounds) — static, independent of viewport
    // size or animation time. frame-wide.png / door-*-wide.png are cropped
    // from facade-wide.png using this exact same geometry, so all three
    // stay pixel-registered to it automatically.
    var FACADE_W = 1672;
    var FACADE_H = 941;
    var STAGE_IN_FACADE_X = 588.9;
    var STAGE_IN_FACADE_Y = 14.9;
    var STAGE_IN_FACADE_SCALE = 0.7153;

    if (hasFacadeBundle) {
      // frame-wide.png already covers the full viewport (object-fit: cover)
      // and already carries the archway hole in its own alpha channel —
      // .backdrop's plain color is never seen behind it and would only get
      // in the way if the hole ever needed to reveal the real page through
      // a gap frame-wide.png doesn't otherwise cover.
      backdrop.style.display = 'none';
      // .doorway-backing's clip is a static design shape in STAGE_W/STAGE_H
      // local space (same archPath() used for the non-bundle frame/backdrop
      // below), so — unlike backdrop's clip in non-bundle mode — it never
      // needs runtime remeasurement on resize.
      if (doorwayBacking) {
        doorwayBacking.style.clipPath = archOnlyPath(DOOR_LEFT_X, DOOR_RIGHT_X + DOOR_WIDTH, DOOR_TOP_Y, DOOR_BOTTOM_Y);
      }
    }

    // clip-path: path() coordinates are interpreted in the element's OWN
    // local (pre-ancestor-transform) box. .frame is inside the scaled
    // .stage, so its hole is computed straight from the design percentages
    // (STAGE_W/STAGE_H space), not from any runtime, screen-space rect.
    // .backdrop has no scaled ancestor of its own beyond .scene (which it
    // and the doors share equally), so screen-space measurement via
    // getBoundingClientRect() is valid for it. Only used in non-bundle
    // mode — the bundle's archway hole is already baked into frameWide's
    // own alpha channel, nothing to clip at runtime.
    function updateClipPaths() {
      if (hasFacadeBundle) return;
      var rx0 = DOOR_LEFT_X + 16;
      var rx1 = DOOR_RIGHT_X + DOOR_WIDTH - 16;
      var ry0 = DOOR_TOP_Y + 16;
      var ry1 = DOOR_BOTTOM_Y;
      frame.style.clipPath = archPath(STAGE_W, STAGE_H, rx0, rx1, ry0, ry1);

      var leftRect = leftDoor.getBoundingClientRect();
      var rightRect = rightDoor.getBoundingClientRect();
      var doorLeft = Math.min(leftRect.left, rightRect.left);
      var doorRight = Math.max(leftRect.right, rightRect.right);
      var doorTop = Math.min(leftRect.top, rightRect.top);
      var doorBottom = Math.max(leftRect.bottom, rightRect.bottom);
      var bdRect = backdrop.getBoundingClientRect();
      backdrop.style.clipPath = archPath(
        bdRect.width, bdRect.height,
        doorLeft - bdRect.left, doorRight - bdRect.left,
        doorTop - bdRect.top, doorBottom - bdRect.top
      );
    }

    function archSubpath(left, right, top, bottom) {
      var rx = (right - left) / 2;
      var ry = (bottom - top) * 0.34;
      var br = 4;
      return (
        'M' + left + ',' + (bottom - br) +
        ' A' + br + ',' + br + ' 0 0 1 ' + (left + br) + ',' + bottom +
        ' L' + (right - br) + ',' + bottom +
        ' A' + br + ',' + br + ' 0 0 1 ' + right + ',' + (bottom - br) +
        ' L' + right + ',' + (top + ry) +
        ' A' + rx + ',' + ry + ' 0 0 0 ' + left + ',' + (top + ry) +
        ' Z'
      );
    }

    // A HOLE: outer rectangle minus the arch (evenodd) — used for .frame
    // (show stone everywhere, cut the archway transparent) and .backdrop
    // (show fallback color everywhere, cut the archway so real content
    // shows through).
    function archPath(outerW, outerH, left, right, top, bottom) {
      var outer = 'M0,0 H' + outerW + ' V' + outerH + ' H0 Z';
      return 'path(evenodd, "' + outer + ' ' + archSubpath(left, right, top, bottom) + '")';
    }

    // The INVERSE: just the arch shape itself, nothing else — used for
    // .doorway-backing, which must be visible ONLY within the archway
    // (behind the doors), not "everywhere except" it.
    function archOnlyPath(left, right, top, bottom) {
      return 'path("' + archSubpath(left, right, top, bottom) + '")';
    }

    // Positions .stage either centered at a plain contain-fit scale (no
    // facade bundle), or aligned exactly over the doorway as it appears
    // inside the wide facade photo, using the same object-fit: cover math
    // the CSS applies to the facade <img> itself so the two never drift
    // apart. Also aims .scene's own transform-origin at the doorway's
    // on-screen center, so the camera push (a plain uniform `scale` on
    // .scene) zooms toward the doorway specifically, not the viewport
    // center — moving facade and stage/doors together as one rigid
    // composition with nothing warped.
    var approachScale = 1;
    var finalScale = 5;
    // On-screen Y of the doors' own bottom edge — computed here (analytic,
    // resize-safe) so updatePhrasePosition() below can place the phrase
    // directly beneath the doors without ever measuring/guessing.
    var doorBottomScreenY = 0;
    function updateStagePosition() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;

      if (!hasFacadeBundle) {
        var s = Math.min(vw / STAGE_W, vh / STAGE_H);
        stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
        scene.style.transformOrigin = '50% 50%';
        approachScale = 1;
        finalScale = 5;
        var stageTop = vh / 2 - (STAGE_H * s) / 2;
        doorBottomScreenY = stageTop + DOOR_BOTTOM_Y * s;
        return;
      }

      var coverScale = Math.max(vw / FACADE_W, vh / FACADE_H);
      var offsetX = (vw - FACADE_W * coverScale) / 2;
      var offsetY = (vh - FACADE_H * coverScale) / 2;

      var stageScreenX = offsetX + STAGE_IN_FACADE_X * coverScale;
      var stageScreenY = offsetY + STAGE_IN_FACADE_Y * coverScale;
      var stageScreenScale = STAGE_IN_FACADE_SCALE * coverScale;
      stage.style.transform = 'translate(' + stageScreenX + 'px, ' + stageScreenY + 'px) scale(' + stageScreenScale + ')';

      var doorwayCenterX = offsetX + (STAGE_IN_FACADE_X + STAGE_CENTER_X * STAGE_IN_FACADE_SCALE) * coverScale;
      var doorwayCenterY = offsetY + (STAGE_IN_FACADE_Y + STAGE_CENTER_Y * STAGE_IN_FACADE_SCALE) * coverScale;
      scene.style.transformOrigin = doorwayCenterX + 'px ' + doorwayCenterY + 'px';

      // How far .scene itself must additionally scale (on top of the
      // static alignment above) so the doorway ends the approach at the
      // same size the centered, no-bundle layout used — "fills most of
      // the viewport while retaining its original shape."
      var containScale = Math.min(vw / STAGE_W, vh / STAGE_H);
      approachScale = containScale / stageScreenScale;
      finalScale = approachScale * 5;

      // .scene itself is ALSO scaled (by approachScale, around
      // transform-origin doorwayCenterX/Y) from the very start — .stage's
      // own transform alone isn't the whole on-screen picture once .scene
      // is no longer at scale(1). Compose both: first find the point in
      // .scene's own untransformed space (.stage's transform only), then
      // apply .scene's scale-around-a-point.
      var doorBottomPreSceneScale = stageScreenY + DOOR_BOTTOM_Y * stageScreenScale;
      doorBottomScreenY = doorwayCenterY + approachScale * (doorBottomPreSceneScale - doorwayCenterY);
    }

    stage.style.left = '0';
    stage.style.top = '0';

    // Places the phrase button just below the doors' own on-screen bottom
    // edge — over the pavement, never overlapping the doors, carvings or
    // crest — clamped so it can never run past the viewport's bottom edge
    // either.
    function updatePhrasePosition() {
      var vh = window.innerHeight;
      var vw = window.innerWidth;
      var gap = 14;
      var safeBottom = 16;
      var minFontPx = 32;
      var phraseText = phraseBtn.querySelector('.door-transition__phrase-text');
      // Clear any previous override before measuring, so this always
      // starts from the phrase's natural, responsive CSS (clamp()) size —
      // otherwise a leftover override from a smaller previous viewport
      // would corrupt this measurement.
      phraseText.style.fontSize = '';
      phraseBtn.style.bottom = 'auto';
      phraseBtn.style.top = (doorBottomScreenY + gap) + 'px';
      var rect = phraseBtn.getBoundingClientRect();
      var currentPx = parseFloat(getComputedStyle(phraseText).fontSize);
      var scale = 1;

      // Vertical (hard limit, highest priority): the phrase must never
      // sit inside/over the doors or spill past the viewport's bottom
      // edge — this is the one constraint nothing below is allowed to
      // override, even the 32px floor, since an overlapping phrase is
      // worse than an occasionally-smaller one. clamp()'s own vw-based
      // scaling handles most of the responsiveness already; this is only
      // the fallback for the (short-viewport) cases where the clamp()'d
      // size is still taller than the pavement strip has room for.
      var availableH = vh - safeBottom - (doorBottomScreenY + gap);
      if (rect.height > availableH) {
        scale = Math.min(scale, Math.max(availableH, 0) / rect.height);
      }

      // Horizontal (desktop, single-line only, soft floor at 32px):
      // Allura's flowing letterforms are wide relative to their
      // cap-height, so the same font-size the vertical check above allows
      // can still span nearly the full archway — keep the phrase within
      // ~70% of the doorway's own on-screen width so it reads as
      // prominent without crowding the stone either side. The 32px floor
      // here only prevents the WIDTH check from shrinking it further than
      // necessary — it can never widen past what the vertical check above
      // already allows, since the two combine via the smaller (min) scale.
      if (vw > 600) {
        var doorwayLeft = leftDoor.getBoundingClientRect().left;
        var doorwayRight = rightDoor.getBoundingClientRect().right;
        var doorwayWidth = doorwayRight - doorwayLeft;
        var textWidth = phraseText.getBoundingClientRect().width * scale;
        var maxTextWidth = doorwayWidth * 0.7;
        if (textWidth > maxTextWidth) {
          var widthScale = (maxTextWidth / textWidth) * scale;
          scale = Math.min(scale, Math.max(widthScale, minFontPx / currentPx));
        }
      }

      if (scale < 1) {
        phraseText.style.fontSize = (currentPx * scale) + 'px';
        rect = phraseBtn.getBoundingClientRect();
      }

      if (rect.bottom > vh - safeBottom) {
        var overflow = rect.bottom - (vh - safeBottom);
        phraseBtn.style.top = (doorBottomScreenY + gap - overflow) + 'px';
      }
    }

    function updateAll() {
      updateStagePosition();
      updateClipPaths();
      updatePhrasePosition();
    }

    // All initial transforms and clip-paths are computed here, while the
    // overlay is still hidden.
    updateAll();
    resizeHandler = updateAll;
    window.addEventListener('resize', resizeHandler);

    // The phrase's position/size is computed above using whatever font is
    // rendering at that instant. Google Fonts loads async — if the real
    // face (or its fallback) settles afterward with different glyph
    // metrics, that first computation can go stale. Re-running it once
    // fonts have actually settled keeps the phrase from ever drifting
    // into the doors regardless of load timing.
    if (window.document.fonts && window.document.fonts.ready) {
      window.document.fonts.ready.then(updateAll);
    }

    // Initial state: doors closed, scene held at its resting composition.
    // None of this needs GSAP — it's a one-time inline style, not an
    // animation — so it applies identically whether or not the CDN script
    // loaded. Everything else (hover nudge, the real door swing, shadow/
    // depth/backing/phrase fades) is driven by native CSS transitions and
    // animations (see door-transition.css) keyed off the data-hover and
    // data-stage attributes set below — never by GSAP. GSAP, when present,
    // is used only for the final camera-push scale on .scene (see
    // startPush()); a native Web Animations API tween stands in when it's
    // not (see startPushNative()).
    scene.style.transform = 'scale(' + approachScale + ')';

    // ---------- Hover / focus preview (desktop) ----------
    // Toggling data-hover flips a set of native CSS transitions (see
    // door-transition.css) on the outer door wrapper (seam-gap/scale/
    // filter) and the inner swing wrapper (a small inward rotateY) —
    // entirely separate elements/properties from the real door-open
    // transition below, and always removed before that transition begins,
    // so the two can never fight over the same rendered value. Never runs
    // once the visitor has activated the doorway, and never runs at all
    // under reduced motion (a plain CSS focus outline still covers that
    // case).
    var activated = false;
    var hoverOn = false;

    function setHoverPreview(on) {
      if (activated || reduced || hoverOn === on) return;
      hoverOn = on;
      if (on) overlay.setAttribute('data-hover', 'on');
      else overlay.removeAttribute('data-hover');
    }
    function onEnterHover() { setHoverPreview(true); }
    function onLeaveHover() { setHoverPreview(false); }
    // Hovering or focusing EITHER the doorway or the phrase triggers the
    // same preview on the doors — two separate hit targets, one shared cue.
    [enterBtn, phraseBtn].forEach(function (el) {
      el.addEventListener('mouseenter', onEnterHover);
      el.addEventListener('mouseleave', onLeaveHover);
      el.addEventListener('focus', onEnterHover);
      el.addEventListener('blur', onLeaveHover);
    });

    // Mobile/touch (no real hover): a single, brief, one-time pulse once
    // the closed doorway has been visible for a moment, so it still reads
    // as interactive without a pointer to hover it.
    var pulseTimer1 = null;
    var pulseTimer2 = null;
    if (!reduced) {
      var hasHover = false;
      try {
        hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      } catch (e) {}
      if (!hasHover) {
        pulseTimer1 = window.setTimeout(function () {
          setHoverPreview(true);
          pulseTimer2 = window.setTimeout(function () { setHoverPreview(false); }, 650);
        }, 1100);
      }
    }

    // ---------- Timing (native door swing) ----------
    var DOOR_DURATION_MS = 1000; // matches door-transition.css's [data-stage="opening"] .door-transition__door-swing transition-duration
    var HOLD_MS = 300;
    var PUSH_DURATION_MS = 900;

    // Camera push: GSAP scale tween on .scene when available, else a
    // native WAAPI tween doing the exact same job — the doorway itself
    // never depends on this either way.
    function startPush() {
      if (hasGSAP) {
        gsap.to(scene, {
          scale: function () { return finalScale; },
          duration: PUSH_DURATION_MS / 1000,
          ease: 'power3.in',
          onComplete: finish,
        });
        return;
      }
      var anim = scene.animate(
        [
          { transform: 'scale(' + approachScale + ')' },
          { transform: 'scale(' + finalScale + ')' },
        ],
        { duration: PUSH_DURATION_MS, easing: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)', fill: 'forwards' }
      );
      anim.onfinish = finish;
    }

    // ---------- Activation (click / tap / Enter / Space) ----------
    // The doorway never opens on its own — this is the only path into
    // openDoors(). Guarded so a double-click/double-tap/repeat keypress
    // can never restart or re-enter the sequence, and the button is
    // disabled afterward so it stops receiving input entirely.
    function activate() {
      if (activated || doneCalled) return;
      activated = true;
      hoverOn = false;
      overlay.removeAttribute('data-hover');
      [enterBtn, phraseBtn].forEach(function (el) {
        el.disabled = true;
        el.removeEventListener('mouseenter', onEnterHover);
        el.removeEventListener('mouseleave', onLeaveHover);
        el.removeEventListener('focus', onEnterHover);
        el.removeEventListener('blur', onLeaveHover);
      });
      window.clearTimeout(pulseTimer1);
      window.clearTimeout(pulseTimer2);

      if (reduced) {
        // No door swing, no camera push — a calm cross-fade is the whole
        // "opening," triggered only by the visitor's own activation.
        if (hasGSAP) {
          gsap.to(overlay, { opacity: 0, duration: 0.6, ease: 'power1.inOut', onComplete: finish });
        } else {
          var fade = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
          fade.onfinish = finish;
        }
        return;
      }

      // Clicked mid-hover-preview: data-hover was just removed above, so
      // the swing wrapper's transform-origin CSS transition immediately
      // retargets from whatever angle it's currently mid-transition at
      // toward the NEW target set by data-stage="opening" below — the
      // browser continues the animation smoothly on its own; there is
      // nothing to snap back to closed first, and nothing for JS to
      // reconcile.
      openDoors();
    }
    enterBtn.addEventListener('click', activate);
    phraseBtn.addEventListener('click', activate);

    // The doors swing open via a plain CSS transition on .door-transition__
    // door-swing's transform (rotateY only — see door-transition.css),
    // triggered simply by setting data-stage="opening". Shadow/depth
    // fades, the backing's fade and the phrase's fade are ALL likewise
    // pure CSS, keyed off the same attribute — nothing here schedules
    // them individually. This whole mechanism works with or without GSAP.
    function openDoors() {
      overlay.setAttribute('data-stage', 'opening');

      var settled = false;
      function onSwingSettled() {
        if (settled) return;
        settled = true;
        leftSwing.removeEventListener('transitionend', onTransitionEnd);
        window.setTimeout(startPush, HOLD_MS);
      }
      function onTransitionEnd(e) {
        if (e.propertyName === 'transform') onSwingSettled();
      }
      leftSwing.addEventListener('transitionend', onTransitionEnd);
      // transitionend can fail to fire (element removed, tab backgrounded,
      // a browser quirk) — this guarantees the sequence always continues.
      window.setTimeout(onSwingSettled, DOOR_DURATION_MS + 200);
    }

    function skip() {
      if (doneCalled) return;
      activated = true;
      enterBtn.disabled = true;
      phraseBtn.disabled = true;
      window.clearTimeout(pulseTimer1);
      window.clearTimeout(pulseTimer2);
      if (hasGSAP) gsap.killTweensOf(scene);
      finish();
    }

    overlay.querySelectorAll('[data-dt-skip]').forEach(function (el) {
      el.addEventListener('click', skip);
    });

    // Everything is decoded, positioned, clipped and in its correct initial
    // state — reveal the complete closed-door composition in one frame,
    // only now. Nothing plays until the visitor activates the doorway
    // themselves.
    overlay.style.visibility = '';
    overlay.style.opacity = '';

    } catch (err) {
      if (window.console) console.error('DoorTransition failed, revealing page:', err);
      overlay.style.visibility = '';
      overlay.style.opacity = '';
      finish();
    }
    }
    }
  }

  window.DoorTransition = { init: init };
})();
