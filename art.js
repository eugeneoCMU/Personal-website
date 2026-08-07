// Original line art. Nothing here is traced from or derived from a photograph —
// buggy images online belong to their photographers, and this site is published
// under Eugene's name. Proportions follow the real vehicle, drawn from
// reference: a three-wheeled carbon-fibre monocoque, long and very low, widest
// about a third back where the driver's shoulders sit, with a canopy blister
// forward and a push bar off the tail.
//
// Every stroke carries pathLength="100", so CSS can animate it drawing itself
// with one dash offset regardless of the path's true arc length. Interaction
// hooks are data-attributes, never classes, so nothing here can collide with
// the page stylesheet.

export function buggySvg() {
  return `
<svg viewBox="0 0 640 200" role="img"
     aria-label="Side view of a Carnegie Mellon buggy: a long, very low three-wheeled shell with a canopy blister over the driver and a push bar rising from the tail."
     xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#12110f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="16" y1="168" x2="624" y2="168" stroke-opacity=".22" stroke-width="1.2"/>
    <g data-buggy>
      <path pathLength="100" data-draw="4" stroke-width="3" d="M 470,140 L 604,74"/>
      <path pathLength="100" data-draw="4" stroke-width="3" d="M 596,66 L 614,82"/>
      <path pathLength="100" data-draw="1" d="M 46,161
             C 42,144 60,128 106,121
             C 170,111 268,112 350,122
             C 424,131 470,140 496,150
             C 508,155 506,160 494,160
             C 400,161 140,161 60,161
             C 52,161 48,161 46,161 Z"/>
      <path pathLength="100" data-draw="2" stroke-width="1.9"
            d="M 88,125 C 100,103 136,95 172,101 C 198,105 214,110 228,113"/>
      <path pathLength="100" data-draw="3" stroke-width="1.1" stroke-opacity=".35"
            d="M 60,148 C 180,140 330,141 470,151"/>
      <g data-wheel style="transform-origin:112px 158px">
        <circle pathLength="100" data-draw="3" cx="112" cy="158" r="13"/>
        <path pathLength="100" data-draw="4" stroke-width="1.2" stroke-opacity=".55"
              d="M 100,158 L 124,158 M 112,146 L 112,170"/>
      </g>
      <g data-wheel style="transform-origin:430px 158px">
        <circle pathLength="100" data-draw="3" cx="430" cy="158" r="13"/>
        <path pathLength="100" data-draw="4" stroke-width="1.2" stroke-opacity=".55"
              d="M 418,158 L 442,158 M 430,146 L 430,170"/>
      </g>
    </g>
  </g>
</svg>`
}

/**
 * Schematic of the race. The shape of the hill is stylised — this is not a
 * survey — but the phases are true: pushed to the crest, released, then the
 * driver alone on the descent.
 */
export function courseProfileSvg() {
  const ground = 'M 26,150 C 118,150 158,58 248,52 C 328,47 370,120 468,146 C 528,161 578,162 612,162'
  return `
<svg viewBox="0 0 640 200" role="img"
     aria-label="Schematic of the buggy course: five pushers drive the buggy up to the crest, release it, and the driver freewheels the descent at up to 35 miles per hour."
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="bgUphill"><rect x="0" y="0" width="248" height="200"/></clipPath>
    <clipPath id="bgDownhill"><rect x="248" y="0" width="392" height="200"/></clipPath>
  </defs>
  <g fill="none" stroke="#12110f" stroke-linecap="round" stroke-linejoin="round">
    <path pathLength="100" data-draw="1" d="${ground}" stroke-width="1.6" stroke-opacity=".18"/>
    <path pathLength="100" data-draw="2" d="${ground}" stroke-width="2.6"
          clip-path="url(#bgUphill)"/>
    <!-- Fades rather than draws: the draw animation commandeers stroke-dasharray,
         which would flatten this path's own dash pattern into a solid line and
         lose the distinction between the pushed half and the free half. -->
    <path data-fade="3" d="${ground}" stroke-width="1.7"
          stroke-dasharray="2 8" clip-path="url(#bgDownhill)"/>
    <path pathLength="100" data-draw="3" stroke-width="1" stroke-opacity=".4"
          d="M 248,54 L 248,172"/>
  </g>
  <g font-family="system-ui, sans-serif" fill="#57534c" font-size="10" letter-spacing="1.5">
    <text x="26" y="184">FIVE PUSHERS &#8212; UPHILL</text>
    <text x="258" y="184">RELEASED &#8212; DRIVER ALONE, TO 35 MPH</text>
    <text x="248" y="40" text-anchor="middle">CREST</text>
  </g>
</svg>`
}
