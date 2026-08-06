// Pure SVG generation. No DOM — testable in Node, injected as innerHTML by main.js.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function scale([d0, d1], [r0, r1]) {
  const span = d1 - d0
  if (span === 0) return () => (r0 + r1) / 2
  return (v) => r0 + ((v - d0) / span) * (r1 - r0)
}

export function linePath(values, x, y) {
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(' ')
}

const W = 900, H = 420, PAD = { t: 24, r: 24, b: 44, l: 48 }

export function buildSeriesChart(D) {
  const { months, empirical, us, danish, EMPIRICAL_GAPS } = D
  const max = Math.ceil(Math.max(...empirical, ...us, ...danish) / 5) * 5
  const x = scale([0, months.length - 1], [PAD.l, W - PAD.r])
  const y = scale([0, max], [H - PAD.b, PAD.t])

  const gridY = [0, max / 4, max / 2, (3 * max) / 4, max].map((v) =>
    `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>
     <text class="tick" x="${PAD.l - 10}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${v}%</text>`
  ).join('')

  const tickIdx = months.map((m, i) => (m.endsWith('-01') || i === 0 ? i : -1)).filter(i => i >= 0)
  const gridX = tickIdx.map((i) =>
    `<text class="tick" x="${x(i).toFixed(1)}" y="${H - PAD.b + 20}" text-anchor="middle">${esc(months[i].slice(0, 4))}</text>`
  ).join('')

  // The band between the observed path and the frictionless counterfactual is
  // what the $764.7B benchmark measures.
  const band =
    `<path class="band" d="${linePath(empirical, x, y)} ` +
    `${danish.map((v, i) => `L${x(danish.length - 1 - i).toFixed(2)},${y(danish[danish.length - 1 - i]).toFixed(2)}`).join(' ')} Z"/>`

  const gaps = EMPIRICAL_GAPS.map((i) =>
    `<line class="gap-mark" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${PAD.t}" y2="${H - PAD.b}"/>`
  ).join('')

  const legend = [
    ['Empirical', 'empirical'], ['Modelled', 'modelled'], ['Counterfactual', 'counter'],
  ].map(([label, cls], i) =>
    `<g transform="translate(${PAD.l + i * 170},${PAD.t - 6})">
       <line class="key ${cls}" x1="0" x2="22" y1="0" y2="0"/>
       <text class="legend" x="30" y="4">${esc(label)}</text>
     </g>`
  ).join('')

  return `
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Prepayment speed over the 42-month quantitative tightening window: observed, modelled, and frictionless counterfactual." xmlns="http://www.w3.org/2000/svg">
  <style>
    .grid { stroke: rgba(18,17,15,.10); }
    .tick, .legend { font: 11px system-ui, sans-serif; fill: #57534c; }
    .band { fill: rgba(18,17,15,.07); stroke: none; }
    .gap-mark { stroke: rgba(18,17,15,.22); stroke-dasharray: 2 4; }
    path.series { fill: none; stroke-width: 1.6; }
    .empirical, path.empirical { stroke: #12110f; }
    .modelled,  path.modelled  { stroke: #57534c; stroke-dasharray: 5 4; }
    .counter,   path.counter   { stroke: #9a938a; }
    .key { stroke-width: 2; }
  </style>
  ${gridY}${gridX}${band}${gaps}
  <path class="series counter"   d="${linePath(danish, x, y)}"/>
  <path class="series modelled"  d="${linePath(us, x, y)}"/>
  <path class="series empirical" d="${linePath(empirical, x, y)}"/>
  ${legend}
</svg>`
}

export function buildRecoveryChart(estimators, benchmarkB) {
  const w = 900, rowH = 52, h = estimators.length * rowH + 70
  const maxPct = Math.max(130, ...estimators.map((e) => e.sharePct))
  const x = scale([0, maxPct], [230, w - 90])

  const rows = estimators.map((e, i) => {
    const cy = 46 + i * rowH
    return `
    <g>
      <text class="name" x="210" y="${cy + 4}" text-anchor="end">${esc(e.label)}</text>
      <line class="lead" x1="${x(0).toFixed(1)}" x2="${x(e.sharePct).toFixed(1)}" y1="${cy}" y2="${cy}"/>
      <circle class="dot" cx="${x(e.sharePct).toFixed(1)}" cy="${cy}" r="5"/>
      <text class="val" x="${(x(e.sharePct) + 14).toFixed(1)}" y="${cy + 4}">${e.sharePct.toFixed(1)}%</text>
    </g>`
  }).join('')

  return `
<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Share of the 764.7 billion dollar benchmark recovered by each estimator, against a 100 percent reference line." xmlns="http://www.w3.org/2000/svg">
  <style>
    .name { font: 500 13px system-ui, sans-serif; fill: #12110f; }
    .val  { font: 12px system-ui, sans-serif; fill: #57534c; }
    .ref-label { font: 11px system-ui, sans-serif; fill: #57534c; }
    .lead { stroke: rgba(18,17,15,.18); stroke-width: 1; }
    .dot  { fill: #12110f; }
    .ref  { stroke: #12110f; stroke-width: 1; stroke-dasharray: 4 4; }
  </style>
  <line class="ref" x1="${x(100).toFixed(1)}" x2="${x(100).toFixed(1)}" y1="20" y2="${h - 34}"/>
  <text class="ref-label" x="${(x(100) + 6).toFixed(1)}" y="16">100% &mdash; full recovery of $${benchmarkB}B</text>
  ${rows}
</svg>`
}
