// Source: the PUBLISHED SSRN abstract, revised 5 August 2026.
// https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7152299
//
// Transcribed from the public abstract on purpose, NOT generated from the paper
// repository. The newest manuscript in that repo (paper/v18, 26 July 2026)
// predates this revision, and its interval figures differ from the published
// ones (+3.0–8.0 vs +2.3–9.1 sampling; +3.9–13.1 vs +3.5–13.1 hull). Anything
// shown here is checkable by a reader who clicks the link, which is the point.
//
// If the paper is revised again, update this file against the abstract — not
// against a local run.

export const PAPER = {
  title: 'Mortgage Lock-In and the Federal Reserve’s Quantitative Tightening Shortfall',
  url: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7152299',
  revised: '5 August 2026',
  window: 'June 2022 – November 2025',
  pages: 141,
}

/** Shortfall of agency MBS runoff against the phased redemption caps. */
export const BENCHMARK_B = 764.7

/** Shortfall measured against the Fed's own ex-ante projection instead. */
export const UNANTICIPATED_B = 87.8

/**
 * Share of the $764.7B benchmark each specification recovers, on a
 * benchmark-consistent accounting basis at the headline off-window calibration.
 */
export const recovery = [
  {
    key: 'nullNoElasticity',
    label: 'No lock-in response',
    sublabel: 'scheduled amortisation + baseline turnover floor',
    sharePct: 85.7,
  },
  {
    key: 'responseOn',
    label: 'Lock-in response switched on',
    sublabel: 'loan-level survival model, Freddie Mac data',
    sharePct: 91.3,
  },
]

/** The same null under the additive floor form rather than the production form. */
export const ADDITIVE_FORM_NULL_PCT = 35.6

/**
 * What the lock-in elasticity itself adds over the null. The paper quotes both
 * intervals rather than either alone; so does this site.
 */
export const marginal = {
  pointPct: 5.6,
  dollarsB: 42.6,
  intervals: [
    { key: 'sampling', label: 'Floor-read sampling error', detail: 'wild-cluster, 31 clusters', lo: 2.3, hi: 9.1 },
    { key: 'hull', label: 'Form-conditional hull', detail: 'varying floor form and level', lo: 3.5, hi: 13.1 },
  ],
}

/** Lock-in's share of the genuine surprise, across floors and disclosed allocations. */
export const SURPRISE_SHARE_PCT = { lo: 23, hi: 80 }
