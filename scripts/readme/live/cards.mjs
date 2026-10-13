// The daily pair under the toolbox, rebuilt every morning by live.mjs:
//
//   numbers    "GitHub, this morning" — a newspaper box score: all-time
//              contributions set large in the display serif, then the last
//              12 months (commits, pull requests, issues, repositories) and
//              the streaks with their dates, as dot-leader rows.
//   languages  "Languages · by code size" — the top language's share set
//              large, a stacked rule of every language in the publication's
//              spot inks (terracotta, navy, turmeric and their tints), and the
//              table of shares.
//
// Both are 415 × H with the same H and one grid, so side by side every row
// sits on the same line:
//
//     40  kicker row        GITHUB, THIS MORNING ……………… @HARSHBHX
//     54  hairline
//    118  figure baseline   2,734  contributions, / since Dec 2023   (serif 64 · 20i)
//    152  sub-heads / the stacked rule
//    184  rows, 24 apart    Commits …… 357 │ Current …… 2 days
//   H-50  footer rule
//   H-26  footer            TUE 13 OCT · 08:47 IST          counted by GitHub

import { createDoc, r1 } from '../lib/svg.mjs'
import { editorial, paper, inkPath } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { P, int, plural, yearOf, fmtDay, monthYear, fmtRange, fmtShare, dateline, partOfDay, safe, fit, sizeToFit, kickerRow, footer, leaders, fade } from './kit.mjs'

export const W = LAYOUT.half // 415
export const H = 326
const R = W - P
const FIG_Y = 118 // big figure baseline
const FIG = { font: 'serif-400', size: 64 }
const CAP = { font: 'serif-400i', size: 20 } // caption beside the figure
const SUB_Y = 156 // sub-head baseline
const ROW0 = 184
const ROW = 24
const LABEL = { font: 'sans-500', size: 13 }
const VALUE = { font: 'serif-400', size: 20 }
const DATES = { font: 'serif-400i', size: 15 }
const SUB = { font: 'mono-500', size: 10.5, tracking: 0.14, upper: true }

// two columns (numbers card, and languages with > 4 entries)
const GUT = 28
const COL_L = 190
const COL_R = R - P - GUT - COL_L // 141

/** Big figure + a two-line serif-italic caption beside it, bottoms aligned. */
function figure(d, value, [line1, line2], { delay = 0.05 } = {}) {
  const t = d.t
  // the caption needs ~150 units; shrink the figure (never the caption) if a big number crowds it
  const capW = Math.max(d.measure(line1, CAP), d.measure(line2, CAP))
  const size = sizeToFit(d, value, { ...FIG, max: R - P - capW - 16, min: 40 })
  const fw = d.measure(value, { ...FIG, size })
  const cx = P - 2 + fw + 16
  const l1 = fit(d, line1, { ...CAP, max: R - cx })
  const l2 = fit(d, line2, { ...CAP, max: R - cx })
  return (
    fade(d.text(value, { x: P - 2, y: FIG_Y, ...FIG, size, fill: t.fg }), delay) +
    fade(d.text(l1, { x: cx, y: FIG_Y - 24, ...CAP, fill: t.fg2 }) + d.text(l2, { x: cx, y: FIG_Y, ...CAP, fill: t.muted }), delay + 0.1, 'fade-in')
  )
}

/** Mono sub-head with a hairline drawing itself to the end of its column. */
function subhead(d, label, x, w, delay) {
  const t = d.t
  const kw = d.measure(label, SUB)
  const x1 = Math.round(x + kw + 10)
  const x2 = Math.round(x + w)
  return (
    fade(d.text(label, { x, y: SUB_Y, ...SUB, fill: t.muted }), delay, 'fade-in') +
    (x2 - x1 > 12 ? inkPath(d, `M${x1} ${SUB_Y - 4}H${x2}`, { len: x2 - x1, stroke: t.ruleSoft, width: 1, delay: delay + 0.05, dur: 0.7 }) : '')
  )
}

/** One dot-leader row: label …… value (right-aligned at x + w). */
function row(d, { x, w, base, label, value, labelFill = d.t.fg2, valueFill = d.t.fg, swatch }) {
  const lx = x + (swatch ? 18 : 0)
  const vw = d.measure(value, VALUE)
  const max = w - (lx - x) - vw - 18
  const l = fit(d, label, { ...LABEL, max })
  const lw = d.measure(l, LABEL)
  return (
    (swatch || '') +
    d.text(l, { x: lx, y: base, ...LABEL, fill: labelFill }) +
    leaders(d, lx + lw + 7, x + w - vw - 7, base) +
    d.text(value, { x: x + w, y: base, ...VALUE, fill: valueFill, anchor: 'end' })
  )
}

// ── numbers ─────────────────────────────────────────────────────────────────

/** Most recent day with contributions, or null. */
const lastActive = (data) => data.series.findLast((x) => x.count > 0)?.date ?? null

/** Second line of a streak: its dates, or what an empty streak means. */
function streakDates(data, s, which, refYear) {
  if (s.days) return fmtRange(s.start, s.end, refYear)
  if (which === 'current') {
    const last = lastActive(data)
    if (last) return `last active ${fmtDay(last, yearOf(last) !== refYear)}`
  }
  return 'none yet'
}

export function numbersAlt(data) {
  const s = data.streak
  const ly = data.lastYear
  const range = (r, which) => (r.days || which === 'current' ? ` (${streakDates(data, r, which, -1)})` : '')
  return (
    `GitHub, ${partOfDay(data.fetchedAt)} (${dateline(data.fetchedAt)}): @${data.login} has ${int(data.total)} contributions since ${fmtDay(data.since)}. ` +
    `Last 12 months: ${plural(ly.commits, 'commit')}, ${plural(ly.pullRequests, 'pull request')}, ${plural(ly.issues, 'issue')}, ` +
    `contributed to ${plural(ly.reposContributedTo, 'repository', 'repositories')}. ` +
    `Current streak: ${plural(s.current.days, 'day')}${range(s.current, 'current')}. ` +
    `Longest streak: ${plural(s.longest.days, 'day')}${range(s.longest, 'longest')}.`
  )
}

export function renderNumbers(theme, data) {
  const d = createDoc({ width: W, height: H, theme, title: `GitHub, ${partOfDay(data.fetchedAt)} — @${data.login}`, desc: numbersAlt(data) })
  editorial(d)
  d.css('.fade-in{animation-duration:.6s}')
  const t = d.t
  d.add(paper(d))
  d.add(kickerRow(d, { label: 'GitHub,', rest: partOfDay(data.fetchedAt), right: `@${data.login}` }).svg)

  d.add(figure(d, int(data.total), ['contributions,', `since ${monthYear(data.since)}`]))

  // last 12 months (left) │ streaks (right)
  const lx = P
  const rx = P + COL_L + GUT
  d.add(subhead(d, 'Last 12 months', lx, COL_L, 0.25), subhead(d, 'Streaks', rx, COL_R, 0.3))
  const ly = data.lastYear
  const rows = [
    ['Commits', ly.commits],
    ['Pull requests', ly.pullRequests],
    ['Issues', ly.issues],
    ['Repos contributed to', ly.reposContributedTo],
  ]
  rows.forEach(([label, n], i) => {
    d.add(fade(row(d, { x: lx, w: COL_L, base: ROW0 + i * ROW, label, value: int(n) }), 0.35 + i * 0.07, 'fade-in'))
  })
  // column rule
  d.add(fade(`<path d="M${r1(P + COL_L + GUT / 2)} ${ROW0 - 16}V${ROW0 + 3 * ROW + 6}" stroke="${t.ruleSoft}"/>`, 0.4, 'fade-in'))

  const ref = yearOf(data.today)
  ;[['Current', 'current'], ['Longest', 'longest']].forEach(([label, which], i) => {
    const s = data.streak[which]
    const base = ROW0 + i * 2 * ROW
    const dates = streakDates(data, s, which, ref)
    const size = sizeToFit(d, dates, { ...DATES, max: COL_R, min: 14 })
    d.add(
      fade(
        row(d, { x: rx, w: COL_R, base, label, value: plural(s.days, 'day'), valueFill: s.days ? t.fg : t.muted }) +
          d.text(fit(d, dates, { ...DATES, size, max: COL_R }), { x: rx, y: base + ROW, ...DATES, size, fill: t.muted }),
        0.4 + i * 0.14,
        'fade-in',
      ),
    )
  })

  d.add(footer(d, { left: dateline(data.fetchedAt), note: 'counted by GitHub' }))
  return d.end()
}

// ── languages ───────────────────────────────────────────────────────────────

/**
 * The publication prints in three spot inks; languages take them by rank,
 * then their tints, and everything else is the faint "Other" grey. (Rank,
 * not GitHub's per-language colour, so neighbours in the stacked rule always
 * differ and nothing violet or cyan lands on the page.)
 */
function inks(t) {
  // the night edition's navy is a pale periwinkle: knocked back a little so
  // the lead language (terracotta) stays the loudest segment
  if (t.name === 'dark') {
    return [
      [t.terraFill, 1],
      [t.ink, 0.78],
      [t.turmericFill, 1],
      [t.terraFill, 0.45],
      [t.ink, 0.45],
      [t.turmericFill, 0.5],
    ]
  }
  // on paper, light tints all but vanish (turmeric at 50% is 1.2:1): the tints
  // are stronger (≥ 2:1 against the paper) and the sixth ink is the turmeric
  // text ochre, since the highlighter yellow has no lighter tint to give
  return [
    [t.terraFill, 1],
    [t.ink, 1],
    [t.turmericFill, 1],
    [t.terraFill, 0.65],
    [t.ink, 0.6],
    [t.turmeric, 0.5],
  ]
}

export function languagesAlt(data) {
  const list = data.languages.map((l) => `${l.name} ${fmtShare(l.share)}`).join(', ')
  const repos = data.publicOnly ? 'public repositories' : 'repositories'
  return `Languages across @${data.login}'s ${repos} by code size, ${dateline(data.fetchedAt)}: ${list || 'no language data yet'}.`
}

/** Stacked rule: one segment per language, paper gaps between, drawn left to right. */
function stackedRule(d, langs, { x, y, w, h }) {
  const t = d.t
  const GAP = 2
  const MIN = 3
  const n = langs.length
  const usable = w - GAP * (n - 1)
  const extra = usable - MIN * n
  const total = langs.reduce((a, l) => a + l.share, 0) || 1
  let cx = x
  const segs = langs.map((l, i) => {
    const sw = i === n - 1 ? x + w - cx : MIN + (extra * l.share) / total
    const s = `<rect x="${r1(cx)}" y="${y}" width="${r1(Math.max(0, sw))}" height="${h}" fill="${l.fill}"${l.op < 1 ? ` fill-opacity="${l.op}"` : ''}/>`
    cx += sw + GAP
    return s
  })
  return `<g class="swipe" style="animation-delay:.2s;animation-duration:1s">${segs.join('')}</g>`
}

export function renderLanguages(theme, data) {
  const d = createDoc({ width: W, height: H, theme, title: `Languages by code size — @${data.login}`, desc: languagesAlt(data) })
  editorial(d)
  d.css('.fade-in{animation-duration:.6s}')
  const t = d.t
  d.add(paper(d))

  // say "public" when no private repository was counted (CI without a
  // STATS_TOKEN), so the card does not read as the whole of my work
  const repos = data.repoCount ? plural(data.repoCount, data.publicOnly ? 'public repo' : 'repo') : data.publicOnly ? 'public repos' : ''
  d.add(kickerRow(d, { label: 'Languages', rest: '· by code size', right: repos }).svg)

  const palette = inks(t)
  const langs = data.languages.map((l, i) => {
    const [fill, op] = l.other ? [t.faint, 1] : palette[Math.min(i, palette.length - 1)]
    return { ...l, name: safe(d, l.name, LABEL.font), fill, op }
  })
  if (!langs.length) {
    d.add(d.text('No language data yet', { x: P - 1, y: FIG_Y - 10, font: 'serif-400', size: 32, fill: t.fg2 }))
    d.add(footer(d, { left: plural(0, 'language'), note: 'measured by GitHub Linguist' }))
    return d.end()
  }

  const top = langs[0]
  d.add(figure(d, fmtShare(top.share, 0), [top.other ? 'other languages' : top.name, 'of the code, by size']))
  d.add(stackedRule(d, langs, { x: P, y: SUB_Y - 9, w: R - P, h: 10 }))

  // table: one column of dot-leader rows for ≤ 4 entries, two columns otherwise
  const two = langs.length > 4
  const per = two ? Math.ceil(langs.length / 2) : langs.length
  langs.forEach((l, i) => {
    const col = Math.floor(i / per)
    const x = two ? (col ? P + COL_L + GUT : P) : P
    const w = two ? (col ? COL_R : COL_L) : R - P
    const base = ROW0 + (i % per) * ROW
    const sw = `<rect x="${x}" y="${base - 9.5}" width="10" height="10" fill="${l.fill}"${l.op < 1 ? ` fill-opacity="${l.op}"` : ''}/>`
    const label = l.other ? `Other (${l.count})` : l.name
    d.add(fade(row(d, { x, w, base, label, value: fmtShare(l.share), labelFill: l.other ? t.muted : t.fg2, swatch: sw }), 0.4 + i * 0.07, 'fade-in'))
  })
  if (two) d.add(fade(`<path d="M${r1(P + COL_L + GUT / 2)} ${ROW0 - 16}V${ROW0 + (per - 1) * ROW + 6}" stroke="${t.ruleSoft}"/>`, 0.45, 'fade-in'))

  const n = langs.reduce((a, l) => a + (l.other ? l.count : 1), 0)
  d.add(footer(d, { left: plural(n, 'language'), note: 'measured by GitHub Linguist' }))
  return d.end()
}

export const CARDS = [
  { name: 'numbers', width: W, height: H, alt: numbersAlt, render: renderNumbers },
  { name: 'languages', width: W, height: H, alt: languagesAlt, render: renderLanguages },
]
