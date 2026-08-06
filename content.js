// The only file you edit to update the resume.
// Adding a job means appending an object here. No markup changes.

export const profile = {
  name: 'Eugene Ong',
  tagline: 'Quantitative research — monetary policy and mortgage markets.',
  about:
    'I study how monetary policy actually moves through household balance sheets. ' +
    'At Carnegie Mellon I am reading for a B.S. in Business Administration and an ' +
    'intended B.S. in Mathematics, and I spend most of my time on independent ' +
    'quantitative research, prediction-market strategy, and early-stage diligence.',
  email: 'eugeneo@andrew.cmu.edu',
  linkedin: 'https://linkedin.com/in/eugene-ong-582929190',
  github: 'https://github.com/eugeneoCMU',
  resumeUrl: 'assets/resume.pdf',
}

export const research = [
  {
    title: 'Mortgage Lock-In and the Federal Reserve’s Quantitative Tightening Shortfall',
    venue: 'SSRN working paper · 141 pages · revised 5 Aug 2026',
    dates: 'Jan 2026 — present',
    summary:
      'Agency MBS runoff fell $764.7B short of the Federal Reserve’s phased redemption ' +
      'caps between June 2022 and November 2025. The interesting part is how little of ' +
      'that was behavioural. Scheduled amortisation and a baseline involuntary-turnover ' +
      'floor recover 85.7% of the gap with no lock-in response at all; switching the ' +
      'response on reaches 91.3%. Lock-in’s own contribution is +5.6 points — $42.6B — ' +
      'and the paper quotes two intervals around it rather than either alone, because ' +
      'sampling error and the floor’s functional form bound it differently. Measured ' +
      'against the Fed’s own ex-ante projection instead of the never-binding cap, the ' +
      'genuine surprise is $87.8B.',
    link: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7152299',
    figure: true,
    // The site shows `summary` as prose; the resume PDF needs bullets. Both are
    // generated from this one file, so they cannot drift apart.
    resumeBullets: [
      'Authored independent quantitative research on the Federal Reserve’s quantitative ' +
      'tightening shortfall, measuring agency MBS runoff $764.7B below the phased ' +
      'redemption caps over June 2022–November 2025',
      'Built a loan-level survival model on Freddie Mac data recovering 91.3% of that ' +
      'shortfall, against a no-lock-in null already recovering 85.7%; the lock-in ' +
      'elasticity’s own contribution is +5.6 points ($42.6B)',
      'Quantified two intervals around that contribution rather than reporting one: ' +
      '+2.3 to +9.1 points from floor-read sampling error, +3.5 to +13.1 from the ' +
      'floor’s functional form',
      'Built the empirical pipeline in Python (Pandas, NumPy) using loan-level survival ' +
      'analysis and agent-based modeling of MBS prepayment across coupon vintages',
    ],
  },
]

export const experience = [
  {
    role: 'Analyst',
    org: 'Traders at CMU',
    location: 'Pittsburgh, PA',
    dates: 'Sept 2025 — present',
    bullets: [
      'Built Kalshi weather prediction-market strategies on a five-person team, modelling ' +
      'peak-temperature distributions with a PyTorch BiGRU over FFT-denoised data and ' +
      'sizing trades by fractional Kelly.',
      'Backtested the Austin daily-high strategy from Dec 2024 to Mar 2026 under real fees ' +
      'and a 15% fill-rate assumption: +29% return, 2.53 Sharpe, 3.6% max drawdown, and a ' +
      '56.9% win rate over 511 trades, with 93% of 3,528 parameter sets profitable.',
      'Showed by statistical testing that order-flow technicals and public NWS forecasts ' +
      'carry no standalone edge once priced in — the edge required a proprietary ' +
      'distribution plus microstructure execution rules.',
    ],
  },
  {
    role: 'Investment Analyst Intern',
    org: 'Sunstone Investment Group',
    location: 'Irvine, CA',
    dates: 'Jun 2026 — present',
    bullets: [
      'Ran early-stage diligence across consumer health, hardware data infrastructure, and ' +
      'logistics software, covering market sizing, competitive dynamics, and deal terms.',
      'Wrote research briefs on prospective investments setting out competitive positioning ' +
      'and the diligence questions worth asking.',
      'Contributed to the valuation framework used to mark the firm’s ' +
      'direct-to-consumer portfolio against updated comparables.',
    ],
  },
  {
    role: 'Associate, Talent Team',
    org: 'Foundry at CMU',
    location: 'Pittsburgh, PA',
    dates: 'May 2026 — present',
    bullets: [
      'Sourced and screened technical and business founders across Carnegie Mellon, ' +
      'building a pipeline of roughly fifty founders.',
      'Ran Foundry’s weekly founder programming, setting session format and topics for ' +
      'about twenty founders and engineers each week.',
    ],
  },
]

export const education = [
  {
    school: 'Carnegie Mellon University',
    degree: 'B.S. Business Administration; intended B.S. Mathematics',
    dates: 'Expected May 2029',
    detail: 'Coursework: Real Analysis, Discrete Mathematics, Probability, Finance.',
  },
  {
    school: 'Irvine High School',
    degree: 'Irvine, CA',
    dates: 'May 2025',
    detail: 'National Economics Challenge National Finalist; National Merit Commended Student.',
  },
]

export const skills = {
  technical: [
    'Python (Pandas, NumPy, PyTorch)', 'Regression', 'Monte Carlo simulation',
    'Survival analysis', 'Agent-based modelling', 'Bloomberg Terminal',
    'Excel', 'DCF modelling',
  ],
  languages: ['English', 'Chinese'],
}

export const activities = [
  {
    role: 'Treasurer and Buggy Chair',
    org: 'Fringe',
    body:
      'Carnegie Mellon has raced Buggy every spring since 1920. Five pushers ' +
      'drive a three-wheeled carbon-fibre shell up through Schenley Park, and at ' +
      'the crest they let go — the driver, lying prone inside a hull moulded ' +
      'around their own body, takes the descent alone.',
    // Sources: cmubuggy.org and cmu.edu/news. Kept as data so the figures stay
    // checkable rather than buried in prose.
    facts: [
      ['First raced', '1920'],
      ['Course', '0.84 miles, Schenley Park'],
      ['Crew', 'Five pushers, one driver'],
      ['Descent', 'Up to 35 mph, unpowered'],
      ['Shell', 'Carbon fibre, under 20 lb'],
    ],
  },
]
