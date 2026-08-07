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
 * Largest-remainder apportionment. Rounding each share independently would
 * leave the grid at 99 or 101 squares, which in a unit chart is a visible lie.
 */
export function apportion(shares, total) {
  const raw = shares.map((s) => (s / 100) * total)
  const floors = raw.map(Math.floor)
  let left = total - floors.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  const out = floors.slice()
  for (let k = 0; k < order.length && left > 0; k++, left--) out[order[k].i]++
  return out
}

/**
 * The benchmark as a hundred squares, one per percentage point. A reader can
 * see how little of the shortfall the lock-in elasticity actually accounts for,
 * rather than being told.
 */
export function buildUnitChart(recovery, marginal, benchmarkB) {
  const nullPct = recovery[0].sharePct          // recovered with no lock-in response
  const elasticityPct = marginal.pointPct       // what the elasticity adds on top
  const unrecoveredPct = Math.max(0, 100 - nullPct - elasticityPct)

  const bands = [
    { key: 'null', label: 'Mechanical baseline', sub: 'amortisation + turnover floor',
      pct: nullPct, fill: 'rgba(18,17,15,.34)', stroke: 'none' },
    { key: 'lockin', label: 'Lock-in elasticity', sub: `the finding — $${marginal.dollarsB}B`,
      pct: elasticityPct, fill: '#12110f', stroke: 'none' },
    { key: 'rest', label: 'Not recovered', sub: 'residual at this calibration',
      pct: unrecoveredPct, fill: 'none', stroke: 'rgba(18,17,15,.3)' },
  ]

  const counts = apportion(bands.map((b) => b.pct), 100)
  const COLS = 10, CELL = 26, GAP = 7, X0 = 46, Y0 = 54
  const perCell = benchmarkB / 100

  let placed = 0
  const squares = bands.map((band, bi) => {
    const n = counts[bi]
    const cells = []
    for (let k = 0; k < n; k++, placed++) {
      const col = placed % COLS
      const row = Math.floor(placed / COLS)
      const x = X0 + col * (CELL + GAP)
      const y = Y0 + row * (CELL + GAP)
      cells.push(
        `<rect class="c-unit" data-band="${band.key}" style="--i:${placed}" ` +
        `x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="1.5" ` +
        `fill="${band.fill}" stroke="${band.stroke}" stroke-width="1"/>`)
    }
    return cells.join('')
  }).join('')

  const legendX = X0 + COLS * (CELL + GAP) + 46
  const legend = bands.map((band, i) => {
    const y = Y0 + 8 + i * 62
    const swatch = band.fill === 'none'
      ? `<rect x="${legendX}" y="${y - 11}" width="15" height="15" rx="1.5" fill="none" stroke="${band.stroke}" stroke-width="1"/>`
      : `<rect x="${legendX}" y="${y - 11}" width="15" height="15" rx="1.5" fill="${band.fill}"/>`
    return `
    <g>
      ${swatch}
      <text class="c-name" x="${legendX + 25}" y="${y}">${esc(band.label)}</text>
      <text class="c-sub"  x="${legendX + 25}" y="${y + 17}">${esc(band.sub)}</text>
      <text class="c-val"  x="${legendX + 25}" y="${y + 36}">${band.pct.toFixed(1)}%</text>
    </g>`
  }).join('')

  const H = Y0 + 10 * (CELL + GAP) + 46
  return `
<svg viewBox="0 0 900 ${H}" role="img" aria-label="One hundred squares representing the 764.7 billion dollar shortfall. ${nullPct.toFixed(1)} percent is recovered with no lock-in response at all, the lock-in elasticity adds ${elasticityPct} percent, and ${unrecoveredPct.toFixed(1)} percent is not recovered." xmlns="http://www.w3.org/2000/svg">
  <style>${SHARED_STYLE}</style>
  <text class="c-sub" x="${X0}" y="30">EACH SQUARE = 1% OF $${benchmarkB}B &#8212; ABOUT $${perCell.toFixed(1)}B</text>
  ${squares}
  ${legend}
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
