// The contribution calendar, printed: the last 12 months as one square a day
// in the terracotta ramp (paper → terracotta on the paper edition, espresso →
// terracotta on the night edition), set like a calendar page in the issue —
// mono month heads, thin stepped rules between the months, the longest
// streak bracketed underneath with its dates, and today ringed.
//
// Full width (850 × H). Desktop: 53 weeks on a 14.5-unit pitch under a
// kicker row and a serif headline (the 12-month total). Phone (.ph, drawn at
// ~0.41×): the last ~30 weeks on a ~26.6-unit pitch (≈ 9 px squares) under
// a large-type header, so the squares stay legible on a 358 px column.

import { createDoc, PHONE_CSS, r1 } from '../lib/svg.mjs'
import { editorial, paper, runs } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { addDays } from './github.mjs'
import { P, MONTHS, int, plural, yearOf, fmtRange, kickerRow } from './kit.mjs'

export const W = LAYOUT.full // 850
export const H = 312
const R = W - P

const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay()
const monthOf = (day) => Number(day.slice(5, 7)) - 1

/**
 * The calendar window: `weeks` whole columns (Sunday first, as on GitHub)
 * ending with the week that holds `today`. Returns cells with their column,
 * row, count and level (GitHub-style quartiles of the active days).
 */
export function grid(data, weeks = 53) {
  const today = data.today
  const first = addDays(today, -dow(today) - (weeks - 1) * 7)
  const byDate = new Map(data.series.map((x) => [x.date, x.count]))
  const cells = []
  for (let day = first, i = 0; day <= today; day = addDays(day, 1), i++) cells.push({ date: day, col: Math.floor(i / 7), row: i % 7, count: byDate.get(day) ?? 0 })
  const counts = cells.map((c) => c.count).filter(Boolean).sort((a, b) => a - b)
  const q = [0.25, 0.5, 0.75].map((p) => counts[Math.floor(p * (counts.length - 1))] ?? 1)
  for (const c of cells) c.level = c.count === 0 ? 0 : c.count <= q[0] ? 1 : c.count <= q[1] ? 2 : c.count <= q[2] ? 3 : 4
  return { first, today, weeks, cells, total: cells.reduce((a, c) => a + c.count, 0) }
}

/**
 * Fill for an activity level: the card's empty-cell tone, then terracotta
 * tints, then full terracotta. The tints are spaced so neighbouring levels
 * step evenly in lightness (ΔE ≈ 16–18 on paper, 12–21 at night); on paper
 * the lightest tint has to be stronger, or one contribution reads as an
 * empty day.
 */
const TINTS = { light: [0.42, 0.66, 0.9], dark: [0.3, 0.56, 0.84] }
function levelFill(t, level) {
  if (level === 0) return [t.border, 1]
  if (level === 4) return [t.terra, 1]
  return [t.terraFill, (TINTS[t.name] ?? TINTS.dark)[level - 1]]
}
const rect = (t, x, y, s, rx, level, extra = '') => {
  const [fill, op] = levelFill(t, level)
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(s)}" height="${r1(s)}" rx="${rx}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}${extra}/>`
}

/**
 * One <rect> per activity level in <defs>, placed with <use>: a year of
 * squares in two layers is ~600 cells, and this halves their markup.
 * Returns place(x, y, level).
 */
function cellKit(d, size, rx) {
  const ids = [0, 1, 2, 3, 4].map((level) => {
    const id = d.uid('c')
    d.def(rect(d.t, 0, 0, size, rx, level).replace('<rect ', `<rect id="${id}" `).replace(/ x="0" y="0"/, ''))
    return id
  })
  return (x, y, level) => `<use href="#${ids[level]}" x="${r1(x)}" y="${r1(y)}"/>`
}

/** "less ■■■■■ more" with its right edge at x1; returns { svg, w }. */
function legend(d, x1, base, { size = 12, cell = 10, gap = 3, rx = 2 } = {}) {
  const t = d.t
  const F = { font: 'sans-400', size, fill: t.muted }
  const lw = d.measure('less', F)
  const mw = d.measure('more', F)
  const w = lw + 8 + 5 * cell + 4 * gap + 8 + mw
  const x0 = x1 - w
  const cy = base - d.metrics('sans-400', size).xHeight / 2
  const out = [d.text('less', { x: x0, y: base, ...F })]
  for (let l = 0; l <= 4; l++) out.push(rect(t, x0 + lw + 8 + l * (cell + gap), cy - cell / 2, cell, rx, l))
  out.push(d.text('more', { x: x1, y: base, ...F, anchor: 'end' }))
  return { svg: out.join(''), w }
}

/**
 * Month heads (only where a month starts in a column's Sunday, and not
 * closer than 3 columns to the previous head) and the stepped rules
 * between months, d3-calendar style.
 */
function months(g, { x0, y0, pitch, cell }) {
  const heads = []
  let last = -9
  for (let c = 0; c < g.weeks; c++) {
    const sun = g.cells[c * 7]?.date
    if (!sun) continue
    const prev = c ? g.cells[(c - 1) * 7].date : null
    const starts = c === 0 ? Number(sun.slice(8, 10)) <= 7 : monthOf(sun) !== monthOf(prev)
    if (starts && c - last >= 3) {
      heads.push({ col: c, label: MONTHS[monthOf(sun)] })
      last = c
    }
  }
  const half = (pitch - cell) / 2
  const xs = (c) => x0 + c * pitch - half
  const rules = []
  for (const c of g.cells) {
    if (c.date === g.first || c.date.slice(8, 10) !== '01') continue
    const top = y0 - half
    const bottom = y0 + 7 * pitch - half
    const yr = y0 + c.row * pitch - half
    // up the left edge of this column from the bottom to the 1st, across, then up the next column's left edge
    rules.push(c.row === 0 ? `M${r1(xs(c.col))} ${r1(top)}V${r1(bottom)}` : `M${r1(xs(c.col + 1))} ${r1(top)}V${r1(yr)}H${r1(xs(c.col))}V${r1(bottom)}`)
  }
  return { heads, rules }
}

/** Longest streak inside the window, clipped to it (or null). */
function streakSpan(data, g) {
  const s = data.streak.longest
  if (!s.days || s.end < g.first) return null
  const start = s.start < g.first ? g.first : s.start
  const a = g.cells.find((c) => c.date === start)
  const b = g.cells.find((c) => c.date === s.end)
  if (!a || !b) return null
  return { a, b, s }
}

export function calendarAlt(data) {
  const g = grid(data)
  const total = data.lastYear?.contributions ?? g.total
  const busiest = g.cells.reduce((m, c) => (c.count > m.count ? c : m), { count: 0 })
  const s = data.streak.longest
  return (
    `@${data.login}'s GitHub contribution calendar for the last 12 months, one square per day shaded by the number of contributions: ` +
    `${plural(total, 'contribution')} in all` +
    (busiest.count ? `, busiest on ${fmtRange(busiest.date, busiest.date, -1)} with ${int(busiest.count)}` : '') +
    (s.days ? `; longest streak ${plural(s.days, 'day')} (${fmtRange(s.start, s.end, -1)})` : '') +
    '.'
  )
}

export function renderCalendar(theme, data) {
  const d = createDoc({ width: W, height: H, theme, title: `Contribution calendar — @${data.login}`, desc: calendarAlt(data) })
  editorial(d)
  d.css(PHONE_CSS)
  // everything settles by ~1.6 s: columns print left to right, then the notes
  d.css('.wk{animation:fade-in .45s ease both}.fade-in{animation-duration:.6s}')
  const t = d.t
  d.add(paper(d))

  const g = grid(data, 53)
  const total = data.lastYear?.contributions ?? g.total
  const ref = yearOf(g.today)

  // ───────────────────────── desktop ─────────────────────────
  const dt = []
  {
    const firstM = g.cells[0].date
    const range = `${MONTHS[monthOf(firstM)]} ${yearOf(firstM)} – ${MONTHS[monthOf(g.today)]} ${yearOf(g.today)}`
    dt.push(kickerRow(d, { label: 'Contributions', rest: '· one square a day', right: range }).svg)

    // headline: the 12-month total
    const HB = 100
    const head = runs(
      d,
      [
        { text: int(total), font: 'serif-400', size: 40, fill: t.fg, after: 10 },
        { text: total === 1 ? 'contribution' : 'contributions', font: 'serif-400', size: 40, fill: t.fg, after: 10 },
        { text: 'in the last twelve months', font: 'serif-400i', size: 22, fill: t.muted },
      ],
      { x: P - 1, y: HB, size: 40 },
    )
    dt.push(`<g class="fade-up">${head.svg}</g>`)
    const lg = legend(d, R, HB - 2)
    dt.push(`<g class="fade-in" style="animation-delay:.5s">${lg.svg}</g>`)

    // grid
    const LABELS = 30 // weekday column
    const x0 = P + LABELS
    const GAP = 3
    const pitch = (R - x0 + GAP) / g.weeks
    const cell = pitch - GAP
    const y0 = 152
    const MH = { font: 'mono-500', size: 10.5, tracking: 0.1, upper: true }
    const m = months(g, { x0, y0, pitch, cell })
    for (const h of m.heads) dt.push(d.text(h.label, { x: x0 + h.col * pitch, y: y0 - 11, ...MH, fill: t.muted }))
    const WD = { font: 'mono-400', size: 10.5, fill: t.muted }
    const cap = d.metrics('mono-400', 10.5).capHeight
    ;[[1, 'Mon'], [3, 'Wed'], [5, 'Fri']].forEach(([r, s]) => dt.push(d.text(s, { x: P, y: y0 + r * pitch + cell / 2 + cap / 2, ...WD })))
    // the month rules and the today ring land once the last column has printed
    // (~0.77 s), so they never stand on an empty page ahead of the squares
    dt.push(`<g class="fade-in" style="animation-delay:.75s"><path d="${m.rules.join('')}" fill="none" stroke="${t.faint}" stroke-opacity=".75" stroke-width="1"/></g>`)
    const place = cellKit(d, cell, 2)
    for (let c = 0; c < g.weeks; c++) {
      const col = g.cells.filter((x) => x.col === c)
      dt.push(`<g class="wk" style="animation-delay:${(0.15 + c * 0.012).toFixed(3)}s">${col.map((x) => place(x0 + c * pitch, y0 + x.row * pitch, x.level)).join('')}</g>`)
    }
    // today, ringed
    const tc = g.cells[g.cells.length - 1]
    const tx = x0 + tc.col * pitch
    const ty = y0 + tc.row * pitch
    dt.push(`<g class="stamp" style="animation-delay:.85s"><rect x="${r1(tx - 2.5)}" y="${r1(ty - 2.5)}" width="${r1(cell + 5)}" height="${r1(cell + 5)}" rx="3.5" fill="none" stroke="${t.fg}" stroke-width="1.3"/></g>`)

    // annotations under the grid: the longest streak, bracketed, and "today"
    const gb = y0 + 7 * pitch - GAP // grid bottom
    const AY = gb + 8
    const AB = AY + 19
    const NOTE = { font: 'serif-400i', size: 15 }
    const todayW = d.measure('today', NOTE)
    const used = [] // [x1, x2] spans taken on the annotation line
    const span = streakSpan(data, g)
    if (span) {
      const a = x0 + span.a.col * pitch
      const b = x0 + span.b.col * pitch + cell
      const label = [
        { text: `${int(span.s.days)}-day streak`, fill: t.terra, after: 6 },
        { text: fmtRange(span.s.start, span.s.end, ref), fill: t.muted },
      ]
      const lw = d.measure(label[0].text, NOTE) + 6 + d.measure(label[1].text, NOTE)
      const lx = Math.max(x0, Math.min(R - lw, (a + b) / 2 - lw / 2))
      dt.push(
        `<g class="fade-in" style="animation-delay:.9s"><path d="M${r1(a)} ${r1(AY - 4)}V${r1(AY)}H${r1(b)}V${r1(AY - 4)}" fill="none" stroke="${t.terra}" stroke-width="1.2"/>` +
          runs(d, label, { x: lx, y: AB + 1, ...NOTE }).svg +
          '</g>',
      )
      used.push([lx - 12, lx + lw + 12])
    }
    // "today" under its column, joined to the ring by a hairline through the
    // (always empty) future days below it
    const tlx = Math.min(R - todayW, tx + cell / 2 - todayW / 2)
    if (!used.some(([u1, u2]) => tlx + todayW > u1 && tlx < u2)) {
      const lx = r1(tx + cell / 2)
      const leader = AB - 14 - (ty + cell + 2.5) > 4 ? `<path d="M${lx} ${r1(ty + cell + 2.5)}V${r1(AB - 14)}" stroke="${t.fg}" stroke-opacity=".55"/>` : ''
      dt.push(`<g class="fade-in" style="animation-delay:1s">${leader}${d.text('today', { x: tlx, y: AB + 1, ...NOTE, fill: t.muted })}</g>`)
    }
  }
  d.add(`<g class="dt">${dt.join('')}</g>`)

  // ───────────────────────── phone ─────────────────────────
  const ph = []
  {
    // as many whole weeks as fit at a ~26-unit pitch, then the pitch stretched
    // so the grid spans the card's text column exactly (P to R): the first
    // column lines up with the header and today sits on the right edge
    const GAP = 4
    const y0 = 102
    const weeks = Math.floor((R - P + GAP) / 26)
    const pitch = (R - P + GAP) / weeks
    const cell = pitch - GAP
    const pg = grid(data, weeks)
    const x0 = P
    const KB = 46
    const HS = 27
    const head = runs(
      d,
      [
        { text: `${int(pg.total)}`, font: 'sans-600', fill: t.fg, after: 8 },
        { text: pg.total === 1 ? 'contribution' : 'contributions', font: 'sans-600', fill: t.fg, after: 12 },
        { text: '·', fill: t.faint, after: 12 },
        { text: `last ${weeks} weeks`, fill: t.muted },
      ],
      { x: P, y: KB, size: HS, font: 'sans-400' },
    )
    const lg = legend(d, R, KB, { size: 26, cell: 20, gap: 5, rx: 3.5 })
    // a very large count would crowd the legend: then drop "· last N weeks"
    ph.push(head.x + 24 > R - lg.w ? runs(d, [{ text: `${int(pg.total)} contributions`, font: 'sans-600', fill: t.fg }], { x: P, y: KB, size: HS }).svg : head.svg)
    ph.push(lg.svg)
    const m = months(pg, { x0, y0, pitch, cell })
    const MH = { font: 'mono-500', size: 27, tracking: 0.04, upper: true }
    // (the last head may sit a few units left of its column so it stays inside the text column)
    for (const h of m.heads) ph.push(d.text(h.label, { x: Math.min(x0 + h.col * pitch, R - d.measure(h.label, MH)), y: y0 - 14, ...MH, fill: t.muted }))
    ph.push(`<path d="${m.rules.join('')}" fill="none" stroke="${t.faint}" stroke-opacity=".75" stroke-width="2"/>`)
    const place = cellKit(d, cell, 3.5)
    ph.push(pg.cells.map((x) => place(x0 + x.col * pitch, y0 + x.row * pitch, x.level)).join(''))
    const tc = pg.cells[pg.cells.length - 1]
    ph.push(`<rect x="${r1(x0 + tc.col * pitch - 3.5)}" y="${r1(y0 + tc.row * pitch - 3.5)}" width="${r1(cell + 7)}" height="${r1(cell + 7)}" rx="5" fill="none" stroke="${t.fg}" stroke-width="2.4"/>`)
  }
  // The phone layer must carry a load-time animation of its own: Firefox
  // otherwise treats the image as static and freezes every desktop
  // animation on its first frame (the squares never appear).
  d.add(`<g class="ph"><g class="fade-in">${ph.join('')}</g></g>`)
  return d.end()
}

export const CALENDAR = { name: 'calendar', width: W, height: H, alt: calendarAlt, render: renderCalendar }
