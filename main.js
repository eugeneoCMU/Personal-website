import { profile, research, experience, education, skills, activities } from './content.js'
import * as R from './render.js'
import * as C from './charts.js'
import * as D from './data/lockin.js'
import { initInk } from './background.js'
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

initInk(document.getElementById('ink'), { reducedMotion })

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
