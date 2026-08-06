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

if (!reducedMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
    })
  }, { rootMargin: '0px 0px -12% 0px' })
  // Scoped to direct children of <main>: an unscoped '.band' also matches SVG
  // internals inside the charts, which would set the figures to opacity 0.
  document.querySelectorAll('main > .band').forEach((el) => {
    el.classList.add('reveal'); io.observe(el)
  })
}
