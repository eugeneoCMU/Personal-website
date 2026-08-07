import { profile, research, experience, education, skills, activities } from './content.js'
import * as R from './render.js'
import * as C from './charts.js'
import * as D from './data/lockin.js'
import { initInk } from './background.js'
import { initFluid } from './fluid.js'
import { initShowcase } from './showcase.js'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const mount = (id, html) => {
  const el = document.getElementById(id)
  if (el) el.innerHTML = html
}

mount('hero', R.renderHero(profile))
mount('about', R.renderAbout(profile))
mount('research', R.renderResearch(research))
mount('experience', R.renderExperience(experience))
mount('education', R.renderEducation(education))
mount('skills', R.renderSkills(skills))
mount('activities', R.renderActivities(activities))
mount('contact', R.renderContact(profile))

const figures = document.querySelector('[data-figures]')
if (figures) {
  figures.innerHTML = `
    <figure class="figure">${C.buildUnitChart(D.recovery, D.marginal, D.BENCHMARK_B)}
      <figcaption>The shortfall as a hundred squares. Most of it is mechanical;
      the solid block is everything the lock-in elasticity accounts for.</figcaption></figure>
    <figure class="figure">${C.buildRecoveryChart(D.recovery, D.BENCHMARK_B)}
      <figcaption>Share of the $${D.BENCHMARK_B}B shortfall recovered with and without a
      lock-in response, on a benchmark-consistent accounting basis at the headline
      off-window calibration. Under the additive floor form the null recovers
      ${D.ADDITIVE_FORM_NULL_PCT}% instead.</figcaption></figure>
    <figure class="figure">${C.buildMarginalChart(D.marginal)}
      <figcaption>What the lock-in elasticity itself adds over that null:
      +${D.marginal.pointPct} points, $${D.marginal.dollarsB}B. Against the Fed’s ex-ante
      projection rather than the cap, lock-in accounts for ${D.SURPRISE_SHARE_PCT.lo}–${D.SURPRISE_SHARE_PCT.hi}%
      of the $${D.UNANTICIPATED_B}B surprise, depending on the disclosed allocation choice.
      All figures from the published abstract, revised ${D.PAPER.revised}.</figcaption></figure>`
}

// Fluid first; the fBm shader is the fallback for GPUs without float render
// targets, and that in turn falls back to a CSS gradient.
export const background = (function startBackground() {
  const canvas = document.getElementById('ink')
  const fluid = initFluid(canvas, { reducedMotion })
  if (fluid.ok) return fluid
  console.info('fluid unavailable (%s) — using the fBm shader', fluid.reason)
  // A canvas is bound to the first context type it is given, so asking for
  // 'webgl' on an element that already tried 'webgl2' returns null. Swap in a
  // clean element so the fallback gets a fresh context.
  const fresh = canvas.cloneNode(false)
  canvas.replaceWith(fresh)
  return { ...initInk(fresh, { reducedMotion }), backend: 'fbm' }
})()

document.querySelectorAll('.rows').forEach((rows) => initShowcase(rows))

// Both effects start their target hidden — sections at opacity 0, chart bars at
// scaleX(0) — so a callback that never arrives means content a visitor can never
// read. Every path below therefore ends with the content shown.
const BANDS = [...document.querySelectorAll('main > .band')]
const FIGURES = [...document.querySelectorAll('.figure')]

function showEverything() {
  BANDS.forEach((el) => el.classList.add('in'))
  FIGURES.forEach((el) => el.classList.add('drawn'))
}

/**
 * Reveal a section immediately rather than waiting for the scroll observer.
 * Following a nav link used to land you on a section still at opacity 0, which
 * looked exactly like a broken link.
 */
function revealTarget(hash) {
  const target = hash && document.querySelector(hash)
  const band = target && target.closest('.band')
  if (!band) return
  band.classList.add('in')
  band.querySelectorAll('.figure').forEach((f) => f.classList.add('drawn'))
}

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', () => revealTarget(a.getAttribute('href')))
})
window.addEventListener('hashchange', () => revealTarget(location.hash))
if (location.hash) revealTarget(location.hash)

if (reducedMotion || !('IntersectionObserver' in window)) {
  // No observer, or motion suppressed: it is simply already there.
  showEverything()
} else {
  const reveal = (el, cls) => {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add(cls); obs.unobserve(en.target) }
      })
    }, { rootMargin: '0px 0px -12% 0px' })
    io.observe(el)
  }

  // Scoped to direct children of <main>: an unscoped '.band' also matches SVG
  // internals inside the charts, which would set the figures to opacity 0.
  BANDS.forEach((el) => { el.classList.add('reveal'); reveal(el, 'in') })
  FIGURES.forEach((el) => reveal(el, 'drawn'))

  // Line art draws itself once it is on screen.
  document.querySelectorAll('[data-art]').forEach((el) => reveal(el, 'drawn'))

  // Failsafe. Observers do not deliver callbacks while the page is in a
  // background tab, and a visitor who restores that tab must not find blank
  // sections and invisible charts. After this, the animation is forfeit but the
  // content is not.
  setTimeout(showEverything, 4000)
}

// The buggy rolls across as its section passes the viewport. Wheel rotation is
// derived from distance travelled rather than time, so it never looks like it is
// spinning while stationary.
const buggyFigure = document.querySelector('.buggy')
const buggyGroup = buggyFigure && buggyFigure.querySelector('[data-buggy]')
if (buggyGroup && !reducedMotion) {
  const TRAVEL = 92          // svg user units, left to right
  const WHEEL_R = 13
  let ticking = false

  function place() {
    ticking = false
    const r = buggyFigure.getBoundingClientRect()
    const span = window.innerHeight + r.height
    if (span <= 0) return
    // 0 as the figure enters from below, 1 as it leaves past the top.
    const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / span))
    const travel = (p - 0.5) * TRAVEL
    buggyGroup.style.setProperty('--travel', travel.toFixed(2))
    // Rolling without slipping: theta = distance / radius.
    const roll = (travel / WHEEL_R) * (180 / Math.PI)
    buggyGroup.querySelectorAll('[data-wheel]').forEach((w) => {
      w.style.setProperty('--roll', roll.toFixed(2))
    })
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(place) }
  }, { passive: true })
  window.addEventListener('resize', place, { passive: true })
  place()
}
