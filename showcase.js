// Row reveal + cursor-trailing preview. The pure helpers are exported so they
// can be tested in Node; the wiring needs a DOM.

export const lerp = (a, b, t) => a + (b - a) * t

// Deterministic generative thumbnail per row — no image assets, no randomness.
export function previewFor(index) {
  const seed = (index * 2654435761) % 997
  const bars = Array.from({ length: 26 }, (_, i) => {
    const v = ((seed + i * 37) % 61) / 60
    const h = 16 + v * 140
    const shade = 30 + ((seed + i * 11) % 55)
    return `<rect x="${i * 11.5 + 4}" y="${(180 - h).toFixed(1)}" width="9" height="${h.toFixed(1)}" fill="rgb(${shade},${shade},${shade})"/>`
  }).join('')
  return `<svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">` +
         `<rect width="300" height="190" fill="#f4f1ea"/>${bars}</svg>`
}

export function initShowcase(container, previewEl) {
  const rows = [...container.querySelectorAll('.row')]
  if (!rows.length) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  let target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, raf = 0, active = -1

  function open(i) {
    if (active === i) return
    active = i
    rows.forEach((r, j) => r.classList.toggle('open', j === i))
    container.classList.toggle('dimmed', i >= 0)
    if (previewEl && fine && !reduced) {
      if (i >= 0) { previewEl.innerHTML = previewFor(i); previewEl.classList.add('on') }
      else previewEl.classList.remove('on')
    }
  }

  function tick() {
    pos.x = lerp(pos.x, target.x, 0.12)
    pos.y = lerp(pos.y, target.y, 0.12)
    if (previewEl) previewEl.style.translate = `${pos.x}px ${pos.y}px`
    raf = requestAnimationFrame(tick)
  }

  rows.forEach((row, i) => {
    // Focus must produce the same reveal as hover, or keyboard users never see it.
    row.addEventListener('mouseenter', () => open(i))
    row.addEventListener('focus', () => open(i))
    row.addEventListener('click', () => open(active === i ? -1 : i))
    row.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(active === i ? -1 : i) }
    })
  })

  container.addEventListener('mouseleave', () => open(-1))
  container.addEventListener('focusout', (ev) => {
    if (!container.contains(ev.relatedTarget)) open(-1)
  })

  if (fine && !reduced) {
    window.addEventListener('pointermove', (ev) => { target.x = ev.clientX; target.y = ev.clientY })
    raf = requestAnimationFrame(tick)
  }
  return () => cancelAnimationFrame(raf)
}
