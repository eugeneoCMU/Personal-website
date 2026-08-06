// Original line art. Nothing here is traced from or derived from a photograph —
// buggy images online belong to their photographers, and this site is published
// under Eugene's name.
//
// Proportions follow the real vehicle: a three-wheeled carbon-fibre monocoque,
// long and very low, widest about a third back where the driver's shoulders sit,
// tapering to a point behind the rear axle. Presentation attributes only — no
// <style> block, so nothing can collide with the page's CSS.

export function buggySvg() {
  return `
<svg viewBox="0 0 640 200" role="img"
     aria-label="Side view of a Carnegie Mellon buggy: a long, very low three-wheeled shell with a canopy blister over the driver and a push bar rising from the tail."
     xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#12110f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="16" y1="168" x2="624" y2="168" stroke-opacity=".22" stroke-width="1.2"/>

  <!-- Push bar: a straight pole off the tail, rising to hand height behind.
  Without it the shape does not read as a buggy at all. -->
  <path d="M 470,140 L 604,74" stroke-width="3"/>
  <path d="M 596,66 L 614,82" stroke-width="3"/>

  <!-- Shell. Far flatter than a car: barely deeper than its own wheels.
  Blunt rounded nose at the left, long taper to the tail. -->
  <path d="M 46,161
  C 42,144 60,128 106,121
  C 170,111 268,112 350,122
  C 424,131 470,140 496,150
  C 508,155 506,160 494,160
  C 400,161 140,161 60,161
  C 52,161 48,161 46,161 Z"/>

  <!-- Canopy bubble over the driver's head, set well forward. -->
  <path d="M 88,125 C 100,103 136,95 172,101 C 198,105 214,110 228,113"
  stroke-width="1.9"/>

  <!-- Waterline crease down the flank. -->
  <path d="M 60,148 C 180,140 330,141 470,151"
  stroke-width="1.1" stroke-opacity=".35"/>

  <!-- Small wheels, faired into the hull. -->
  <circle cx="112" cy="158" r="13"/>
  <circle cx="112" cy="158" r="3" stroke-width="1.2"/>
  <circle cx="430" cy="158" r="13"/>
  <circle cx="430" cy="158" r="3" stroke-width="1.2"/>
  </g>
</svg>`
}
