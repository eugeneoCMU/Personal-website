// Pure: data in, HTML string out. No DOM, no side effects — that is what makes
// this file testable in Node.

import { buggySvg } from './art.js'

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const e = escapeHtml
const pad = (n) => String(n + 1).padStart(2, '0')

function extLink(href, text) {
  return `<a href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(text)}</a>`
}

/**
 * Splits a string into per-character spans carrying a stagger index.
 * Spaces become a non-animating spacer so word breaks survive.
 */
export function staggerLetters(text) {
  let i = 0
  return [...String(text)].map((ch) => {
    if (ch === ' ') return '<span class="sp"> </span>'
    return `<span style="--i:${i++}">${e(ch)}</span>`
  }).join('')
}

export function renderHero(profile) {
  // The spans are decoration. Screen readers get the name once, from aria-label,
  // rather than being read eleven separate letters.
  return `
    <h1 class="wordmark" aria-label="${e(profile.name)}">
      <span class="wordmark-inner" aria-hidden="true">${staggerLetters(profile.name)}</span>
    </h1>
    <p class="tagline">${e(profile.tagline)}</p>`
}

export function renderAbout(profile) {
  return `<p class="prose">${e(profile.about)}</p>`
}

// `extra` is progressive disclosure — hidden until hover or focus.
// `after` is always visible, for content that must not be gated behind an
// interaction (the research figures carry the argument; they never hide).
function row({ index, title, meta, body, href, extra = '', after = '' }) {
  return `
    <article class="row" tabindex="0" data-index="${index}">
      <span class="row-num">${pad(index)}</span>
      <div class="row-main">
        <h3 class="row-title">${href ? extLink(href, title) : e(title)}</h3>
        <div class="row-reveal">
          <p class="row-body">${e(body)}</p>
          ${extra}
        </div>
        ${after}
      </div>
      <div class="row-meta">${meta}</div>
    </article>`
}

export function renderResearch(items) {
  return items.map((r, i) => row({
    index: i,
    title: r.title,
    href: r.link,
    body: r.summary,
    meta: `<span>${e(r.dates)}</span><span>${e(r.venue)}</span>`,
    after: r.figure ? '<div class="figures" data-figures></div>' : '',
  })).join('')
}

export function renderExperience(items) {
  return items.map((x, i) => row({
    index: i,
    title: x.role,
    body: x.bullets.join(' '),
    meta: `<span>${e(x.dates)}</span><span>${e(x.org)}</span><span>${e(x.location)}</span>`,
    extra: `<ul class="bullets">${x.bullets.map(b => `<li>${e(b)}</li>`).join('')}</ul>`,
  })).join('')
}

export function renderEducation(items) {
  return items.map(ed => `
    <div class="entry">
      <h3>${e(ed.school)}</h3>
      <p class="entry-meta">${e(ed.degree)} &middot; ${e(ed.dates)}</p>
      <p class="entry-detail">${e(ed.detail)}</p>
    </div>`).join('')
}

export function renderSkills(skills) {
  // Labelled rows rather than two anonymous lists: previously the only thing
  // distinguishing languages from technical skills was that they were greyer.
  const group = (label, arr) => `
    <div class="skill-group">
      <h3 class="skill-label">${e(label)}</h3>
      <ul class="tags">${arr.map(s => `<li>${e(s)}</li>`).join('')}</ul>
    </div>`
  return group('Technical', skills.technical) + group('Languages', skills.languages)
}

export function renderActivities(items) {
  return items.map((a) => `
    <div class="activity-block">
      <p class="activity-role">${e(a.role)}, ${e(a.org)}</p>
      <figure class="buggy">${buggySvg()}</figure>
      <p class="activity">${e(a.body)}</p>
      <dl class="facts">
        ${(a.facts || []).map(([k, v]) =>
          `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}
      </dl>
    </div>`).join('')
}

export function renderContact(profile) {
  return `
    <ul class="contact">
      <li><a href="mailto:${e(profile.email)}">${e(profile.email)}</a></li>
      <li>${extLink(profile.linkedin, 'LinkedIn')}</li>
      <li>${extLink(profile.github, 'GitHub')}</li>
      <li><a href="${e(profile.resumeUrl)}">Resume (PDF)</a></li>
    </ul>`
}
