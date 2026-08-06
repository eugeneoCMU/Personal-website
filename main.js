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

  // Failsafe. Observers do not deliver callbacks while the page is in a
  // background tab, and a visitor who restores that tab must not find blank
  // sections and invisible charts. After this, the animation is forfeit but the
  // content is not.
  setTimeout(showEverything, 4000)
}
