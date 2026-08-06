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
    venue: 'SSRN working paper',
    dates: 'Jan 2026 — present',
    summary:
      'Household balance sheets absorbed $764.7B less liquidity during quantitative ' +
      'tightening than the frictionless counterfactual implies. I built three independent ' +
      'estimators of that same benchmark — a 10,000-household agent-based model, a ' +
      'loan-level prepayment hazard, and a literature microsimulation — and they recover ' +
      'anywhere from 11.1% to 119.7% of it. The paper is largely about why they disagree, ' +
      'and what a 2×2 synthetic-versus-real companion design says about which ' +
      'disagreement is real.',
    link: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7152299',
    figure: true,
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
    detail: 'Carnegie Mellon Sweepstakes racing.',
  },
]
