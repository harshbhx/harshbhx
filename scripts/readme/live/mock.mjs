// ─────────────────────────────────────────────────────────────────────────────
//  PREVIEW-ONLY MOCK DATA — never published.
//
//  `node live.mjs --mock` renders the cards from this file so the design can
//  be reviewed without a token. CI always runs without --mock and renders
//  real data from the GitHub API.
//
//  The headline numbers below are a snapshot of the profile's previous stats
//  cards. The day-by-day calendar does not exist in that snapshot, so
//  mockCalendar() SYNTHESISES one (deterministic, seeded) that reproduces
//  those numbers exactly — it only exists to give the calendar a shape in
//  previews and to exercise the streak maths. Its pattern is not real data.
//
//  mockUptime() is one status check of the four sites made from a build
//  sandbox while designing the colophon (curl -L, 15 s timeout); CI measures
//  them fresh on every run.
// ─────────────────────────────────────────────────────────────────────────────

import { summarise, addDays } from './github.mjs'

export const MOCK = {
  login: 'harshbhx',
  fetchedAt: '2026-10-13T03:17:00Z',
  createdAt: '2023-12-28T00:00:00Z',
  totalContributions: 2734, // all time, since 2023-12-28
  lastYear: { commits: 357, pullRequests: 16, issues: 2, reposContributedTo: 8 },
  current: { days: 2, start: '2026-10-11', end: '2026-10-12' },
  longest: { days: 95, start: '2026-02-18', end: '2026-05-23' },
  languages: [
    { name: 'TypeScript', color: '#3178c6', share: 0.8203 },
    { name: 'HTML', color: '#e34c26', share: 0.1007 },
    { name: 'JavaScript', color: '#f1e05a', share: 0.0653 },
    { name: 'CSS', color: '#663399', share: 0.0136 },
  ],
}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/** SYNTHETIC daily calendar matching MOCK's total and streaks (preview only). */
function mockCalendar() {
  const M = MOCK
  const rand = rng(20231228)
  const start = M.createdAt.slice(0, 10)
  const today = M.fetchedAt.slice(0, 10)
  const inLongest = (d) => d >= M.longest.start && d <= M.longest.end
  const inCurrent = (d) => d >= M.current.start && d <= M.current.end
  const days = []
  let run = 0
  for (let d = start; d <= today; d = addDays(d, 1)) {
    // a slow build-up with a few busy seasons (purely illustrative)
    const t = (Date.parse(d) - Date.parse(start)) / (Date.parse(today) - Date.parse(start))
    const season = 0.35 + 0.35 * t + 0.25 * Math.sin(t * 9.5) ** 2
    let count = rand() < season ? 1 + Math.floor(rand() ** 2.2 * 9) : 0
    if (inLongest(d) || inCurrent(d)) count = Math.max(1, count)
    if (d === addDays(M.longest.start, -1) || d === addDays(M.longest.end, 1)) count = 0
    if (d === addDays(M.current.start, -1) || d === today) count = 0
    if (!inLongest(d) && run >= 40) count = 0 // keep every other run well short of the longest
    run = count ? run + 1 : 0
    days.push({ date: d, count })
  }
  // nudge counts on already-active days until the total matches exactly
  let diff = M.totalContributions - days.reduce((a, x) => a + x.count, 0)
  const active = days.filter((x) => x.count > 0)
  for (let guard = 0; diff !== 0 && guard < 1e6; guard++) {
    const x = active[Math.floor(rand() * active.length)]
    if (diff > 0) {
      x.count++
      diff--
    } else if (x.count > 1) {
      x.count--
      diff++
    }
  }
  return days
}

export function mockData() {
  const M = MOCK
  const data = summarise({
    login: M.login,
    fetchedAt: M.fetchedAt,
    createdAt: M.createdAt,
    lastYear: M.lastYear,
    days: mockCalendar(),
    languages: M.languages,
  })
  // self-check: the synthetic calendar must reproduce the snapshot exactly
  const s = data.streak
  const ok =
    data.total === M.totalContributions &&
    s.current.days === M.current.days && s.current.start === M.current.start && s.current.end === M.current.end &&
    s.longest.days === M.longest.days && s.longest.start === M.longest.start && s.longest.end === M.longest.end
  if (!ok) throw new Error(`mock calendar drifted from the snapshot: ${JSON.stringify({ total: data.total, streak: s })}`)
  // as in CI without a STATS_TOKEN: only public repositories were counted
  // (no repository count in the snapshot, so none is shown)
  data.publicOnly = true
  return data
}

/** SAMPLE status check (preview only): one real measurement from a build sandbox. */
export function mockUptime(sites) {
  const sample = {
    'dualmindlab.tech': [200, 293],
    'arena.dualmindlab.tech': [200, 744],
    'docs.dualmindlab.tech': [200, 629],
    'pixelproof.dualmindlab.tech': [200, 417],
  }
  return {
    checkedAt: MOCK.fetchedAt,
    sites: sites.map((s) => {
      const [status, ms] = sample[s.host] ?? [200, 400]
      return { ...s, ok: true, status, ms }
    }),
  }
}
