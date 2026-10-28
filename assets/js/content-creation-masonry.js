/**
 * "From My Camera Roll" responsive masonry rebalancer — scratchpad only.
 *
 * The approved 1440px desktop layout (>=1100px) is a fixed, hand-placed
 * four-column sequence and is never recomputed. Below 1100px, the same 18
 * .gallery-item nodes (never cloned — moved) are redistributed into 3
 * (tablet, 601-1099px) or 2 (mobile, <=600px) columns using a greedy
 * shortest-column algorithm driven by each image's real intrinsic aspect
 * ratio (from its width/height attributes), so columns stay height-balanced
 * instead of one trailing off dramatically shorter than the rest.
 */
(function () {
  'use strict';

  var desktopRoot = document.querySelector('.cc-masonry-desktop');
  var responsiveRoot = document.querySelector('.cc-masonry-responsive');
  if (!desktopRoot || !responsiveRoot) return;

  // Snapshot the approved desktop column structure once, before anything
  // can move: array of 4 arrays of item elements, in their exact approved
  // order.
  var desktopColumns = Array.prototype.slice
    .call(desktopRoot.querySelectorAll('.cc-col'))
    .map(function (col) {
      return Array.prototype.slice.call(col.children);
    });

  var flatOrder = desktopColumns.reduce(function (acc, col) {
    return acc.concat(col);
  }, []);

  var GAP = { tablet: 16, mobile: 12 };

  function tierFor(width) {
    if (width <= 600) return 'mobile';
    if (width <= 1099) return 'tablet';
    return 'desktop';
  }

  function itemAspect(item) {
    var img = item.querySelector('img');
    var w = parseFloat(img.getAttribute('width'));
    var h = parseFloat(img.getAttribute('height'));
    return h / w;
  }

  function restoreDesktop() {
    desktopColumns.forEach(function (items, i) {
      var col = desktopRoot.querySelectorAll('.cc-col')[i];
      // append() moves existing nodes back into order; no-op if already there.
      col.append.apply(col, items);
    });
    desktopRoot.hidden = false;
    responsiveRoot.hidden = true;
    responsiveRoot.innerHTML = '';
  }

  function rebalance(n, gap) {
    desktopRoot.hidden = true;
    responsiveRoot.hidden = false;
    responsiveRoot.innerHTML = '';
    responsiveRoot.style.gap = gap + 'px';

    var cols = [];
    for (var i = 0; i < n; i++) {
      var col = document.createElement('div');
      col.className = 'cc-col';
      col.style.gap = gap + 'px';
      responsiveRoot.appendChild(col);
      cols.push(col);
    }

    // Measure column width now that empty flex columns are laid out.
    var colWidth = cols[0].clientWidth;
    var heights = cols.map(function () { return 0; });

    flatOrder.forEach(function (item) {
      var shortest = 0;
      for (var i = 1; i < n; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      cols[shortest].appendChild(item);
      heights[shortest] += colWidth * itemAspect(item) + gap;
    });
  }

  var currentTier = null;

  function apply() {
    var tier = tierFor(window.innerWidth);
    if (tier === currentTier) return;
    currentTier = tier;

    if (tier === 'desktop') {
      restoreDesktop();
    } else if (tier === 'tablet') {
      rebalance(3, GAP.tablet);
    } else {
      rebalance(2, GAP.mobile);
    }
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(apply, 150);
  });

  apply();
})();
