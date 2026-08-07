// The three things the reference sites (igloo.inc, showcase.noomoagency.com)
// do that ordinary pages do not:
//
//   1. Inertial scroll — the page trails your wheel instead of tracking it.
//      This is the single biggest reason those sites feel costly.
//   2. Word-by-word reveals — prose assembles itself as it enters.
//      3. Velocity skew — content leans very slightly into fast scrolling.
//
// All three are off under prefers-reduced-motion, and all three degrade to
// "the page simply works" if anything here throws.

const lerp = (a, b, t) => a + (b - a) * t

/**
 * Inertial scrolling.
 *
 * Deliberately NOT a scroll-hijack that transforms a wrapper: that breaks
 * position:fixed, breaks the real scrollbar, and breaks find-in-page. This
 * keeps native scroll authoritative and only eases the value, so the scrollbar,
 * the fixed nav, anchors and keyboard paging all keep working.
 */
export function initSmoothScroll({ ease = 0.085 } = {}) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  // Touch devices already have excellent momentum; overriding it feels worse.
  if (!fine) return { ok: false, reason: 'coarse pointer' }

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

  let target = window.scrollY
  let current = window.scrollY
  let raf = 0
  let engaged = false
  let lastFrame = 0
  let disabled = false

  // Because this calls preventDefault, a stalled animation frame would leave the
  // page unscrollable — the worst failure this file could produce. If a wheel
  // event arrives and no frame has run recently while we were mid-glide, hand
  // scrolling back to the browser permanently.
  function watchdogTripped() {
    return engaged && lastFrame && performance.now() - lastFrame > 400
  }

  function surrender() {
    disabled = true
    engaged = false
    cancelAnimationFrame(raf)
    raf = 0
    window.removeEventListener('wheel', onWheel)
    console.warn('smooth scroll disabled: frames stalled, native scrolling restored')
  }

  function onWheel(ev) {
    if (disabled) return
    if (ev.ctrlKey) return               // pinch-zoom, leave alone
    if (watchdogTripped()) { surrender(); return }
    ev.preventDefault()
    target = Math.min(maxScroll(), Math.max(0, target + ev.deltaY))
    engage()
  }

  // Anything that moves the page by other means — keyboard, anchor, find — must
  // reset the target, or the easing would immediately drag the page back.
  function onScroll() {
    if (!engaged) { target = window.scrollY; current = window.scrollY }
  }

  function frame() {
    lastFrame = performance.now()
    current = lerp(current, target, ease)
    if (Math.abs(target - current) < 0.4) {
      current = target
      window.scrollTo(0, current)
      engaged = false
      raf = 0
      return
    }
    window.scrollTo(0, current)
    raf = requestAnimationFrame(frame)
  }

  function engage() {
    if (!engaged) { engaged = true; current = window.scrollY }
    if (!raf) raf = requestAnimationFrame(frame)
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => { target = window.scrollY }, { passive: true })

  return {
    ok: true,
    // Anchor jumps hand the target over rather than fighting the easing.
    jumpTo(y) { target = Math.min(maxScroll(), Math.max(0, y)); current = y },
    stop() {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
    },
  }
}

/**
 * Split an element's text into word spans, preserving existing inline elements
 * (the About paragraph contains a link, and destroying it would be a
 * regression). Only bare text nodes are split.
 */
export function splitWords(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const texts = []
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n)

  let index = 0
  for (const node of texts) {
    if (!node.nodeValue.trim()) continue
    const frag = document.createDocumentFragment()
    for (const piece of node.nodeValue.split(/(\s+)/)) {
      if (!piece) continue
      if (/^\s+$/.test(piece)) { frag.appendChild(document.createTextNode(piece)); continue }
      const span = document.createElement('span')
      span.className = 'w'
      span.style.setProperty('--w', String(index++))
      span.textContent = piece
      frag.appendChild(span)
    }
    node.parentNode.replaceChild(frag, node)
  }
  return index
}

export function initWordReveal(selector) {
  const targets = [...document.querySelectorAll(selector)]
  if (!targets.length) return { ok: false }

  for (const el of targets) {
    // A link inside the paragraph keeps its own element; only its text splits.
    splitWords(el)
    el.classList.add('words')
  }

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'))
    return { ok: true, observed: 0 }
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return
      en.target.classList.add('in')
      obs.unobserve(en.target)
    })
  }, { rootMargin: '0px 0px -14% 0px' })
  targets.forEach((el) => io.observe(el))

  // Same failsafe as everywhere else: never leave text permanently invisible.
  setTimeout(() => targets.forEach((el) => el.classList.add('in')), 4500)
  return { ok: true, observed: targets.length }
}

/**
 * Content leans microscopically into fast scrolling and settles when you stop.
 * Capped hard — past about two degrees this reads as a broken page rather than
 * a considered one.
 */
export function initVelocitySkew(selector, { max = 1.6, scale = 0.05 } = {}) {
  const els = [...document.querySelectorAll(selector)]
  if (!els.length) return { ok: false }

  let last = window.scrollY
  let skew = 0
  let raf = 0

  function frame() {
    const now = window.scrollY
    const velocity = now - last
    last = now
    const wanted = Math.max(-max, Math.min(max, velocity * scale))
    skew = lerp(skew, wanted, 0.12)
    if (Math.abs(skew) < 0.01 && Math.abs(velocity) < 0.5) {
      skew = 0
      els.forEach((el) => el.style.setProperty('--skew', '0'))
      raf = 0
      return
    }
    els.forEach((el) => el.style.setProperty('--skew', skew.toFixed(3)))
    raf = requestAnimationFrame(frame)
  }

  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }, { passive: true })

  return { ok: true, elements: els.length }
}
