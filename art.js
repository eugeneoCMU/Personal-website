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
<svg viewBox="0 0 640 190" role="img"
     aria-label="Side view of a Carnegie Mellon buggy: a long, low, three-wheeled shell with a hatch over the driver."
     xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#12110f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="16" y1="160" x2="624" y2="160" stroke-opacity=".22" stroke-width="1.2"/>
    <path d="M 62,150
             C 58,124 84,100 148,92
             C 216,84 268,90 330,106
             C 408,126 496,144 574,152
             C 582,153 582,155 574,155
             C 470,153 300,152 150,152
             C 96,152 66,152 62,150 Z"/>
    <ellipse cx="196" cy="106" rx="46" ry="9" stroke-width="1.3" stroke-opacity=".5"/>
    <path d="M 78,136 C 180,124 320,126 470,142 C 512,147 548,151 572,153"
          stroke-width="1.2" stroke-opacity=".38"/>
    <circle cx="128" cy="150" r="15"/>
    <circle cx="128" cy="150" r="3.4" stroke-width="1.3"/>
    <circle cx="452" cy="150" r="15"/>
    <circle cx="452" cy="150" r="3.4" stroke-width="1.3"/>
  </g>
</svg>`
}
