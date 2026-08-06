// Pure SVG generation. No DOM — testable in Node, injected as innerHTML by main.js.
//
// SVG is XML: only numeric character references, never named HTML entities.
// Chart class names are prefixed so they cannot collide with page-level CSS —
// an unprefixed `.band` here was once swept into the page's scroll-reveal
// system and set to opacity 0.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function scale([d0, d1], [r0, r1]) {
  const span = d1 - d0
  if (span === 0) return () => (r0 + r1) / 2
  return (v) => r0 + ((v - d0) / span) * (r1 - r0)
}

const SHARED_STYLE = `
  .c-name  { font: 500 13px system-ui, sans-serif; fill: #12110f; }
  .c-sub   { font: 11px system-ui, sans-serif; fill: #57534c; }
  .c-val   { font: 500 13px system-ui, sans-serif; fill: #12110f; }
  .c-tick  { font: 11px system-ui, sans-serif; fill: #57534c; }
  /* .52 alpha reads 3.6:1 against the paper, clearing WCAG 1.4.11 for graphical
     objects. At .14 the null bar — 85.7% of the shortfall, the chart's whole
     point — was effectively invisible. */
  .c-bar   { fill: rgba(18,17,15,.52); }
  .c-bar-strong { fill: #12110f; }
  .c-ref   { stroke: #12110f; stroke-width: 1; stroke-dasharray: 4 4; }
  .c-rule  { stroke: rgba(18,17,15,.14); stroke-width: 1; }
  .c-gap   { fill: rgba(18,17,15,.09); }
  .c-dot   { fill: #12110f; }
  .c-range { stroke: #12110f; stroke-width: 1.5; }
  .c-cap   { stroke: #12110f; stroke-width: 1.5; }
`

/**
 * Recovery of the $764.7B benchmark: the null with no lock-in response against
 * the model with it switched on, read against full recovery. The shaded strip
 * between the two bars is the elasticity's entire contribution.
 */
export function buildRecoveryChart(recovery, benchmarkB) {
  const W = 900, rowH = 92, H = recovery.length * rowH + 96
  const x = scale([0, 110], [300, W - 70])
  const barH = 26

  // All value labels share one x, past the longest bar. Placed individually they
  // collided with each other and with the gap strip, because the two bars differ
  // by only 5.6 points.
  // Past the 100% rule as well as the longest bar, so a label never sits on the
  // dashed reference line.
  const labelX = Math.max(x(Math.max(...recovery.map((r) => r.sharePct))), x(100)) + 14

  const rows = recovery.map((r, i) => {
    const y = 56 + i * rowH
    const strong = i === recovery.length - 1
    return `
    <g>
      <text class="c-name" x="280" y="${y + 12}" text-anchor="end">${esc(r.label)}</text>
      <text class="c-sub"  x="280" y="${y + 30}" text-anchor="end">${esc(r.sublabel)}</text>
      <rect class="${strong ? 'c-bar-strong' : 'c-bar'}" x="${x(0).toFixed(1)}" y="${y}"
            width="${(x(r.sharePct) - x(0)).toFixed(1)}" height="${barH}"/>
      <text class="c-val" x="${labelX.toFixed(1)}" y="${y + 18}">${r.sharePct.toFixed(1)}%</text>
    </g>`
  }).join('')

  // The strip between the two bar ends — what switching the elasticity on buys.
  const gap = recovery.length === 2 ? `
    <rect class="c-gap" x="${x(recovery[0].sharePct).toFixed(1)}" y="${56}"
          width="${(x(recovery[1].sharePct) - x(recovery[0].sharePct)).toFixed(1)}"
          height="${rowH + barH}"/>` : ''

  return `
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of the 764.7 billion dollar shortfall recovered with and without a lock-in response, against full recovery." xmlns="http://www.w3.org/2000/svg">
  <style>${SHARED_STYLE}</style>
  ${gap}
  <line class="c-ref" x1="${x(100).toFixed(1)}" x2="${x(100).toFixed(1)}" y1="34" y2="${H - 44}"/>
  <text class="c-tick" x="${(x(100) + 6).toFixed(1)}" y="28">100% &#8212; all $${benchmarkB}B</text>
  ${rows}
  <text class="c-sub" x="300" y="${H - 18}">Most of the shortfall is mechanical: the null already recovers ${recovery[0].sharePct.toFixed(1)}%.</text>
</svg>`
}

/**
 * What the lock-in elasticity itself adds, in percentage points, with both
 * intervals the paper quotes. Neither dominates the other, so both are drawn.
 */
export function buildMarginalChart(marginal) {
  const W = 900, H = 300
  const hi = Math.max(...marginal.intervals.map((i) => i.hi))
  const x = scale([0, Math.ceil(hi + 1)], [250, W - 60])

  const ticks = [0, 3, 6, 9, 12, 15].filter((t) => t <= Math.ceil(hi + 1)).map((t) =>
    `<line class="c-rule" x1="${x(t).toFixed(1)}" x2="${x(t).toFixed(1)}" y1="52" y2="${H - 70}"/>
     <text class="c-tick" x="${x(t).toFixed(1)}" y="${H - 52}" text-anchor="middle">+${t}</text>`
  ).join('')

  const bands = marginal.intervals.map((iv, i) => {
    const y = 92 + i * 62
    return `
    <g>
      <text class="c-name" x="230" y="${y + 4}" text-anchor="end">${esc(iv.label)}</text>
      <text class="c-sub"  x="230" y="${y + 21}" text-anchor="end">${esc(iv.detail)}</text>
      <line class="c-range" x1="${x(iv.lo).toFixed(1)}" x2="${x(iv.hi).toFixed(1)}" y1="${y}" y2="${y}"/>
      <line class="c-cap" x1="${x(iv.lo).toFixed(1)}" x2="${x(iv.lo).toFixed(1)}" y1="${y - 7}" y2="${y + 7}"/>
      <line class="c-cap" x1="${x(iv.hi).toFixed(1)}" x2="${x(iv.hi).toFixed(1)}" y1="${y - 7}" y2="${y + 7}"/>
      <text class="c-sub" x="${(x(iv.hi) + 10).toFixed(1)}" y="${y + 4}">+${iv.lo} to +${iv.hi}</text>
    </g>`
  }).join('')

  return `
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution of the lock-in elasticity in percentage points: point estimate 5.6 points, or 42.6 billion dollars, with a sampling interval of 2.3 to 9.1 and a form-conditional hull of 3.5 to 13.1." xmlns="http://www.w3.org/2000/svg">
  <style>${SHARED_STYLE}</style>
  ${ticks}
  <line class="c-ref" x1="${x(marginal.pointPct).toFixed(1)}" x2="${x(marginal.pointPct).toFixed(1)}" y1="52" y2="${H - 70}"/>
  <text class="c-val" x="${(x(marginal.pointPct)).toFixed(1)}" y="42" text-anchor="middle">+${marginal.pointPct} pts &#8212; $${marginal.dollarsB}B</text>
  ${bands}
  <text class="c-sub" x="250" y="${H - 20}">Percentage points added over the no-response null. Both intervals are quoted; neither dominates.</text>
</svg>`
}
