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
//  those numbers exactly — it only exists to give the sparkline a shape in
//  previews and to exercise the streak maths. Its curve is not real data.
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
  return data
}

/**
 * SYNTHETIC stand-in for Platane/snk's output (preview only), in snk's format:
 * the last 12 months of the mock calendar as a 7-row grid of 12px cells on a
 * 16px pitch, levels by quartile like GitHub, and a 4-segment snake that loops
 * around the ring outside the grid so previews show the area the card keeps.
 * The real file comes from the Platane/snk action in CI.
 */
export function mockSnake(series, theme = 'dark') {
  const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay()
  const today = series.at(-1).date
  let first = addDays(today, -365)
  first = addDays(first, -dow(first)) // GitHub's calendar starts on a Sunday
  const days = series.filter((x) => x.date >= first)
  const counts = days.map((x) => x.count).filter(Boolean).sort((a, b) => a - b)
  const q = [0.25, 0.5, 0.75].map((p) => counts[Math.floor(p * (counts.length - 1))] ?? 1)
  const level = (n) => (n === 0 ? 0 : n <= q[0] ? 1 : n <= q[1] ? 2 : n <= q[2] ? 3 : 4)
  const cols = Math.ceil(days.length / 7)
  const cells = days.map((x, i) => `<rect class="c l${level(x.count)}" x="${2 + 16 * Math.floor(i / 7)}" y="${2 + 16 * dow(x.date)}" rx="2" ry="2"/>`)
  const gw = cols * 16
  // ring path: top edge → right → bottom → left, one cell outside the grid
  const path = [[0, -16], [gw, -16], [gw, 112], [-16, 112], [-16, -16], [0, -16]]
  const len = path.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0)
  let acc = 0
  const frames = path.map((p, i) => {
    if (i) acc += Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1])
    return `${((acc / len) * 100).toFixed(2)}%{transform:translate(${p[0]}px,${p[1]}px)}`
  })
  const segs = [14.4, 12.3, 10.8, 9.9]
  const colors = theme === 'dark' ? '#161b22,#0e4429,#006d32,#26a641,#39d353' : '#ebedf0,#9be9a8,#40c463,#30a14e,#216e39'
  const [ce, c1, c2, c3, c4] = colors.split(',')
  const style =
    `:root{--cb:#1b1f230a;--cs:purple;--ce:${ce};--c0:${ce};--c1:${c1};--c2:${c2};--c3:${c3};--c4:${c4}}` +
    '.c{shape-rendering:geometricPrecision;fill:var(--ce);stroke-width:1px;stroke:var(--cb);width:12px;height:12px}' +
    [1, 2, 3, 4].map((l) => `.c.l${l}{fill:var(--c${l})}`).join('') +
    `@keyframes snake{${frames.join('')}}` +
    '.s{shape-rendering:geometricPrecision;fill:var(--cs);animation:snake 24s linear infinite}' +
    segs.map((_, i) => `.s.s${i}{animation-delay:-${((segs.length - 1 - i) * 0.18).toFixed(2)}s}`).join('') // head first +
    '.u{fill:var(--c2)}'
  const snake = segs.map((w, i) => `<rect class="s s${i}" x="${(16 - w) / 2}" y="${(16 - w) / 2}" width="${w}" height="${w}" rx="${(w * 0.31).toFixed(1)}" ry="${(w * 0.31).toFixed(1)}"/>`)
  return (
    `<svg viewBox="-16 -32 ${gw + 32} 192" width="${gw + 32}" height="192" xmlns="http://www.w3.org/2000/svg">` +
    `<desc>PREVIEW-ONLY mock in Platane/snk's format</desc><style>${style}</style>${cells.join('')}` +
    `<rect class="u u0" height="12" width="${(gw * 0.4).toFixed(1)}" x="0.0" y="144"/>${snake.join('')}</svg>`
  )
}
