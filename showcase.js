// Row reveal. Hover, focus, click and Enter/Space all resolve to the same
// question — which row is active — so that logic is pure and tested.
//
// There is deliberately no cursor-following preview panel. The pattern this
// borrows from shows a screenshot of the hovered project; research papers and
// analyst roles have no screenshot, and the generated stand-in read as a chart,
// which is indefensible on a page whose real charts carry the argument.

/**
 * @param {number} active  currently open row index, or -1 for none
 * @param {number} i       row being acted on; negative means "close everything"
 * @param {boolean} toggle true for click/keyboard (re-acting closes it),
 *                         false for hover/focus (always opens)
 * @returns {number} the row index that should be open, or -1
 */
export function nextActive(active, i, { toggle = false } = {}) {
  if (i < 0) return -1
  if (toggle) return active === i ? -1 : i
  return i
}

export function initShowcase(container) {
  const rows = [...container.querySelectorAll('.row')]
  if (!rows.length) return

  let active = -1

  function apply(i) {
    if (active === i) return
    active = i
    rows.forEach((r, j) => r.classList.toggle('open', j === i))
    container.classList.toggle('dimmed', i >= 0)
  }

  rows.forEach((row, i) => {
    // Focus must produce the same reveal as hover, or keyboard users never see it.
    row.addEventListener('mouseenter', () => apply(nextActive(active, i)))
    row.addEventListener('focus', () => apply(nextActive(active, i)))
    row.addEventListener('click', () => apply(nextActive(active, i, { toggle: true })))
    row.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        apply(nextActive(active, i, { toggle: true }))
      }
    })
  })

  container.addEventListener('mouseleave', () => apply(nextActive(active, -1)))
  container.addEventListener('focusout', (ev) => {
    if (!container.contains(ev.relatedTarget)) apply(nextActive(active, -1))
  })
}
