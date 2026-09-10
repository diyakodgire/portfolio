# Door transition assets

The entrance animation (`assets/js/door-transition.js` + `assets/css/door-transition.css`)
ships with an illustrated fallback (inline SVG/CSS) for all three layers, so it works with
no images at all. To swap in real photo cutouts instead:

1. Add three **transparent-background** PNGs here:
   - `frame.png` — the stationary stone doorway/arch only (no doors)
   - `door-left.png` — the left door leaf only
   - `door-right.png` — the right door leaf only

   Each should be cropped tightly to that piece's own silhouette (alpha
   transparency everywhere else), same tall arched proportions as the
   reference. The left/right doors should each cover exactly half the
   archway opening.

2. Pass their paths into the init call in `index.html`:

   ```html
   <script>
     DoorTransition.init({
       assets: {
         frame: 'assets/images/door/frame.png',
         doorLeft: 'assets/images/door/door-left.png',
         doorRight: 'assets/images/door/door-right.png',
       },
     });
   </script>
   ```

No other code changes needed — each layer renders an `<img>` in place of the
illustrated markup and sizing/animation stay the same.
