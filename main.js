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
    <figure class="figure">${C.buildSeriesChart(D)}
      <figcaption>Prepayment speed across the 42-month QT window: observed,
      modelled, and the frictionless counterfactual. The shaded band is the gap the
      $${D.BENCHMARK_B}B benchmark measures. Dashed verticals mark four months the
      source reports as zero with catch-up the following month.</figcaption></figure>
    <figure class="figure">${C.buildRecoveryChart(D.estimators, D.BENCHMARK_B)}
      <figcaption>Share of the benchmark recovered by each estimator, against full
      recovery. The spread — not any single figure — is the finding.</figcaption></figure>`
}

initInk(document.getElementById('ink'), { reducedMotion })

const preview = document.querySelector('[data-preview]')
document.querySelectorAll('.rows').forEach((rows) => initShowcase(rows, preview))

if (!reducedMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
    })
  }, { rootMargin: '0px 0px -12% 0px' })
  document.querySelectorAll('.band').forEach((el) => { el.classList.add('reveal'); io.observe(el) })
}
