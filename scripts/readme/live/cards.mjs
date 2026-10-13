// Live GitHub activity cards, rebuilt daily in CI by live.mjs:
//
//   activity-stats  all-time contributions + trend, last-12-months counts, streaks
//   activity-langs  top languages by code size: stacked bar + legend
//
// Both are half-width (415 × H, same H) and share one anatomy with the static
// components: window header band (like about-*), a display-size headline at
// the same baseline, then a ruled list on a 24px row grid.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { contrast } from '../lib/icons.mjs'

export const W = LAYOUT.half // 415
export const H = 288
const PAD = 24
const HEAD = 44 // header band height (same as about-*)
const HEAD_BASE = 26 // header text baseline
const NUM_BASE = 98 // headline number baseline (both cards)
const SUB_BASE = 121 // line under the headline
const KICK_BASE = 161 // section kicker baseline
const ROW0 = 189 // first list row baseline
const ROW = 24 // list row pitch
const GUT = 24 // gutter between the two legend columns (activity-langs)
const COL = (W - 2 * PAD - GUT) / 2 // 171.5
// activity-stats list columns: counts need the wider label, streaks the narrower
const SGUT = 20
const SCOL_L = 186
const SCOL_R = W - 2 * PAD - SGUT - SCOL_L // 161

// ── formatting ───────────────────────────────────────────────────────────────

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ymd = (day) => day.slice(0, 10).split('-').map(Number)
const int = (n) => Math.round(n).toLocaleString('en-US')
const plural = (n, one, many = `${one}s`) => `${int(n)} ${n === 1 ? one : many}`
const yearOf = (iso) => ymd(iso)[0]

export function fmtDay(day, withYear = true) {
  const [y, m, d] = ymd(day)
  return `${MON[m - 1]} ${d}${withYear ? `, ${y}` : ''}`
}
const monthYear = (day) => {
  const [y, m] = ymd(day)
  return `${MON[m - 1]} ${y}`
}

/** "Oct 11 – Oct 12" in the current year, otherwise with years (compact across years). */
export function fmtRange(a, b, refYear) {
  if (!a) return ''
  const [ya] = ymd(a)
  const [yb] = ymd(b)
  if (a === b) return fmtDay(a, ya !== refYear)
  if (ya === yb) return ya === refYear ? `${fmtDay(a, false)} – ${fmtDay(b, false)}` : `${fmtDay(a, false)} – ${fmtDay(b, false)}, ${yb}`
  const short = (d) => `${fmtDay(d, false)} ’${String(ymd(d)[0]).slice(2)}`
  return `${short(a)} – ${short(b)}`
}

export function fmtShare(share) {
  const p = share * 100
  if (p > 0 && p < 0.05) return '<0.1%'
  if (p >= 99.95) return '100%'
  return `${p.toFixed(1)}%`
}

// ── colour ───────────────────────────────────────────────────────────────────

const hexToHsl = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const dd = max - min
  const s = l > 0.5 ? dd / (2 - max - min) : dd / (max + min)
  const h = max === r ? (g - b) / dd + (g < b ? 6 : 0) : max === g ? (b - r) / dd + 2 : (r - g) / dd + 4
  return [h / 6, s, l]
}
const hslToHex = (h, s, l) => {
  const f = (n) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/**
 * A language's GitHub colour, nudged lighter (dark theme) or darker (light
 * theme) only as far as needed to stand off the card surface.
 */
export function langColor(hex, t) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return t.faint
  const dark = t.name === 'dark'
  const bg = t.surfaceTop
  const min = dark ? 2.6 : 1.9
  let [h, s, l] = hexToHsl(hex)
  let c = hex.toLowerCase()
  for (let i = 0; i < 50 && contrast(c, bg) < min; i++) {
    l = dark ? Math.min(0.95, l + 0.015) : Math.max(0.05, l - 0.015)
    c = hslToHex(h, s, l)
  }
  return c
}

// Simple Icons slugs for the headline language's logo tile.
const LANG_LOGOS = {
  TypeScript: 'typescript', JavaScript: 'javascript', HTML: 'html5', CSS: 'css', SCSS: 'sass', Dart: 'dart',
  'C#': 'csharp', C: 'c', 'C++': 'cplusplus', Python: 'python', Go: 'go', Rust: 'rust', Kotlin: 'kotlin',
  Swift: 'swift', PHP: 'php', Ruby: 'ruby', Shell: 'gnubash', Vue: 'vuedotjs',
  Svelte: 'svelte', Astro: 'astro', 'Jupyter Notebook': 'jupyter', Dockerfile: 'docker', Lua: 'lua',
  R: 'r', Scala: 'scala', Elixir: 'elixir', Haskell: 'haskell', Zig: 'zig', Nix: 'nixos', Solidity: 'solidity',
  MDX: 'mdx', Java: 'openjdk', Markdown: 'markdown',
}

// ── text safety ──────────────────────────────────────────────────────────────

/** Strip characters the subset fonts cannot draw (language names come from the API). */
function safe(d, str, font) {
  try {
    d.measure(str, { font, size: 10 })
    return str
  } catch {
    const ascii = str.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '')
    return ascii || '?'
  }
}

/** Truncate with an ellipsis to fit `max` px. */
function fit(d, str, { font, size, max }) {
  let s = safe(d, str, font)
  if (d.measure(s, { font, size }) <= max) return s
  while (s.length > 1 && d.measure(`${s}…`, { font, size }) > max) s = s.slice(0, -1).trimEnd()
  return `${s}…`
}

// ── shared chrome ────────────────────────────────────────────────────────────

/** Window header band: tinted fill clipped to the card's top corners + hairline divider (as about-*). */
function headerBand(d) {
  const t = d.t
  const r = LAYOUT.radius
  const x0 = 0.5
  const x1 = W - 0.5
  const fill = t.name === 'dark' ? t.surfaceRaised : t.inset
  const op = t.name === 'dark' ? 0.55 : 0.75
  return [
    `<path d="M ${x0} ${HEAD} V ${r + 0.5} A ${r} ${r} 0 0 1 ${r + 0.5} 0.5 H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${r + 0.5} V ${HEAD} Z" fill="${fill}" opacity="${op}"/>`,
    `<path d="M ${x0} ${HEAD + 0.5} H ${x1}" stroke="${t.border}" stroke-width="1"/>`,
  ].join('')
}

function header(d, { icon, label, right }) {
  const t = d.t
  d.add(
    headerBand(d),
    d.icon(icon, { x: PAD, y: HEAD / 2 - 7, size: 14, color: t.violet, stroke: 2 }),
    d.kicker(label, { x: PAD + 22, y: HEAD_BASE - 0.5, fill: t.fg2 }),
    right,
  )
}

/** "updated Oct 13, 2026" with a live dot, right-aligned in the header. */
function updated(d, iso) {
  const t = d.t
  const label = `updated ${fmtDay(iso)}`
  const w = d.measure(label, { font: 'mono-500', size: 11 })
  const cx = W - PAD - w - 11
  return (
    `<circle class="pulse" cx="${r1(cx)}" cy="${HEAD / 2}" r="3" fill="${t.green}"/><circle cx="${r1(cx)}" cy="${HEAD / 2}" r="3" fill="${t.green}"/>` +
    d.text(label, { x: W - PAD, y: HEAD_BASE - 0.5, font: 'mono-500', size: 11, fill: t.muted, anchor: 'end' })
  )
}

/** Mono kicker with a hairline running to the end of its column. */
function sectionKicker(d, label, { x, w, right }) {
  const t = d.t
  const kw = d.measure(label, { font: 'mono-500', size: 11, tracking: 0.14, upper: true })
  const rw = right ? d.measure(right, { font: 'mono-500', size: 11 }) + 10 : 0
  const x1 = x + kw + 10
  const x2 = x + w - rw
  const rule = d.linearGradient([[0, t.border, 1], [1, t.border, 0.35]])
  return (
    d.kicker(label, { x, y: KICK_BASE }) +
    (x2 - x1 > 8 ? `<rect x="${r1(x1)}" y="${KICK_BASE - 4}" width="${r1(x2 - x1)}" height="1" fill="url(#${rule})"/>` : '') +
    (right ? d.text(right, { x: x + w, y: KICK_BASE, font: 'mono-500', size: 11, fill: t.faint, anchor: 'end' }) : '')
  )
}

/** Hairline between list rows (sits halfway between baselines). */
const rowRule = (d, x, w, base) => `<rect x="${r1(x)}" y="${base + 8}" width="${r1(w)}" height="1" fill="${d.t.border}" opacity=".6"/>`

const stagger = (delay, inner) => `<g class="fade-up" style="animation-delay:${delay.toFixed(2)}s">${inner}</g>`

function headline(d, value, sub) {
  const t = d.t
  return stagger(
    0.05,
    d.gradientText(value, { x: PAD - 1, y: NUM_BASE, font: 'display-700', size: 40, stops: [[0, t.fg], [0.5, t.fg], [1, t.violetSoft]] }) +
      d.paragraph(sub, { x: PAD, y: SUB_BASE, font: 'body-400', size: 13, fill: t.muted }).svg,
  )
}

function surface(d, glows) {
  d.add(d.card({ glows }))
}

// ── sparkline ────────────────────────────────────────────────────────────────

/**
 * Weekly totals (7-day buckets ending on the last day), Gaussian-smoothed and
 * resampled to at most `points` values so the line reads as a trend, not noise.
 */
function trend(series, { sigma = 2.5, points = 44 } = {}) {
  const weeks = []
  for (let end = series.length; end > 0; end -= 7) {
    const chunk = series.slice(Math.max(0, end - 7), end)
    weeks.unshift((chunk.reduce((a, x) => a + x.count, 0) * 7) / chunk.length)
  }
  const r = Math.ceil(sigma * 3)
  const smooth = weeks.map((_, i) => {
    let sum = 0
    let wsum = 0
    for (let j = Math.max(0, i - r); j <= Math.min(weeks.length - 1, i + r); j++) {
      const w = Math.exp(-((j - i) ** 2) / (2 * sigma * sigma))
      sum += w * weeks[j]
      wsum += w
    }
    return sum / wsum
  })
  const n = Math.min(points, smooth.length)
  if (n < 2) return smooth
  return Array.from({ length: n }, (_, k) => {
    const pos = (k / (n - 1)) * (smooth.length - 1)
    const i = Math.floor(pos)
    const f = pos - i
    return smooth[i] * (1 - f) + (smooth[Math.min(i + 1, smooth.length - 1)] ?? 0) * f
  })
}

/** Monotone cubic (Fritsch–Carlson) path through points: no overshoot below zero. */
function monotonePath(pts) {
  const n = pts.length
  if (n < 2) return `M ${r1(pts[0][0])} ${r1(pts[0][1])}`
  const dx = []
  const m = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0])
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i])
  }
  const tan = [m[0]]
  for (let i = 1; i < n - 1; i++) tan.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]))
  tan.push(m[n - 2])
  let p = `M ${r1(pts[0][0])} ${r1(pts[0][1])}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    p += ` C ${r1(pts[i][0] + h)} ${r1(pts[i][1] + h * tan[i])} ${r1(pts[i + 1][0] - h)} ${r1(pts[i + 1][1] - h * tan[i + 1])} ${r1(pts[i + 1][0])} ${r1(pts[i + 1][1])}`
  }
  return p
}

function sparkline(d, series, { x, y, w, h }) {
  const t = d.t
  const dark = t.name === 'dark'
  const vals = trend(series)
  if (vals.length < 2) vals.unshift(vals[0] ?? 0)
  const max = Math.max(1, ...vals)
  const pts = vals.map((v, i) => [x + (i / (vals.length - 1)) * w, y + h - (v / max) * (h - 4)])
  const line = monotonePath(pts)
  const area = `${line} L ${r1(x + w)} ${r1(y + h)} L ${r1(x)} ${r1(y + h)} Z`
  const stroke = d.linearGradient([[0, t.violet, 0.55], [0.6, t.violet, 1], [1, t.cyan, 1]], { x1: x, y1: 0, x2: x + w, y2: 0, units: 'userSpaceOnUse' })
  const fill = d.linearGradient([[0, t.violet, dark ? 0.3 : 0.2], [1, t.violet, 0]], { x1: 0, y1: y, x2: 0, y2: y + h, units: 'userSpaceOnUse' })
  // fade the left end so the line emerges from the card rather than starting abruptly
  const fadeG = d.linearGradient([[0, '#fff', 0], [0.18, '#fff', 1], [1, '#fff', 1]], { x1: x, y1: 0, x2: x + w, y2: 0, units: 'userSpaceOnUse' })
  const fadeM = d.uid('sm')
  d.def(`<mask id="${fadeM}" maskUnits="userSpaceOnUse" x="${x - 4}" y="${y - 6}" width="${w + 12}" height="${h + 12}"><rect x="${x - 4}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="url(#${fadeG})"/></mask>`)
  d.css('@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.draw{stroke-dasharray:1;animation:draw 1.3s cubic-bezier(.35,0,.15,1) .15s both}')
  const [ex, ey] = pts[pts.length - 1]
  return [
    `<path d="M ${x} ${y + h + 0.5} H ${x + w}" stroke="${t.border}"/>`,
    `<g mask="url(#${fadeM})">`,
    `<path d="M ${x} ${r1(y + h / 2) + 0.5} H ${x + w}" stroke="${t.border}" stroke-dasharray="2 4"/>`,
    `<g style="animation:fade-in .8s ease .5s both"><path d="${area}" fill="url(#${fill})"/></g>`,
    `<path class="draw" pathLength="1" d="${line}" fill="none" stroke="url(#${stroke})" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>`,
    `</g>`,
    `<g style="animation:fade-in .45s ease 1.05s both">` +
      `<circle cx="${r1(ex)}" cy="${r1(ey)}" r="6.5" fill="${t.cyan}" opacity=".16"/>` +
      `<circle cx="${r1(ex)}" cy="${r1(ey)}" r="2.75" fill="${t.cyan}"/></g>`,
  ].join('')
}

// ── activity-stats ───────────────────────────────────────────────────────────

export function statsAlt(data) {
  const s = data.streak
  const ly = data.lastYear
  const range = (r) => (r.days ? ` (${fmtRange(r.start, r.end, -1)})` : '')
  return (
    `GitHub activity for @${data.login}, updated ${fmtDay(data.fetchedAt)}. ` +
    `${int(data.total)} contributions since ${fmtDay(data.since)}. ` +
    `Last 12 months: ${plural(ly.commits, 'commit')}, ${plural(ly.pullRequests, 'pull request')}, ${plural(ly.issues, 'issue')}, ` +
    `contributed to ${plural(ly.reposContributedTo, 'repository', 'repositories')}. ` +
    `Current streak: ${plural(s.current.days, 'day')}${range(s.current)}. ` +
    `Longest streak: ${plural(s.longest.days, 'day')}${range(s.longest)}.`
  )
}

export function renderStats(t, data) {
  const d = createDoc({ width: W, height: H, theme: t, title: `GitHub activity — @${data.login}`, desc: statsAlt(data) })
  const dark = t.name === 'dark'
  surface(d, [
    { cx: W - 70, cy: HEAD + 40, r: 230, color: [t.glowViolet[0], t.glowViolet[1] * (dark ? 0.7 : 0.8)] },
    { cx: 30, cy: H + 30, r: 200, color: [t.glowCyan[0], t.glowCyan[1] * 0.45] },
  ])
  header(d, { icon: 'activity', label: 'GitHub activity', right: updated(d, data.fetchedAt) })

  // headline: all-time contributions, with the trend since the account opened
  d.add(headline(d, int(data.total), [{ text: 'contributions', font: 'body-500', fill: t.fg2 }, ` since ${monthYear(data.since)}`]))
  const subW = d.measure(`contributions since ${monthYear(data.since)}`, { font: 'body-500', size: 13 })
  const sx = Math.max(PAD + subW + 28, W - PAD - 158)
  d.add(sparkline(d, data.series, { x: sx, y: HEAD + 22, w: W - PAD - sx, h: SUB_BASE - 4 - (HEAD + 22) }))

  // last 12 months (left) · streaks (right)
  const lx = PAD
  const rx = PAD + SCOL_L + SGUT
  const ly = data.lastYear
  d.add(stagger(0.25, sectionKicker(d, 'Last 12 months', { x: lx, w: SCOL_L }) + sectionKicker(d, 'Streaks', { x: rx, w: SCOL_R })))

  const rows = [
    ['git-commit-horizontal', 'Commits', int(ly.commits)],
    ['git-pull-request', 'Pull requests', int(ly.pullRequests)],
    ['circle-dot', 'Issues', int(ly.issues)],
    ['folder-git-2', ['Repos contributed to', 'Contributed to', 'Repos'], int(ly.reposContributedTo)],
  ]
  rows.forEach(([icon, labels, value], i) => {
    const base = ROW0 + i * ROW
    // longest label that still leaves a clear gap before the value
    const room = SCOL_L - 22 - d.measure(value, { font: 'body-600', size: 13 }) - 14
    const options = [labels].flat()
    const label = options.find((l) => d.measure(l, { font: 'body-500', size: 13 }) <= room) ?? fit(d, options.at(-1), { font: 'body-500', size: 13, max: room })
    d.add(
      stagger(
        0.32 + i * 0.07,
        d.icon(icon, { x: lx, y: base - 11, size: 14, color: t.violet, stroke: 1.9 }) +
          d.text(label, { x: lx + 22, y: base, font: 'body-500', size: 13, fill: t.fg2 }) +
          d.text(value, { x: lx + SCOL_L, y: base, font: 'body-600', size: 13, fill: t.fg, anchor: 'end' }) +
          (i < rows.length - 1 ? rowRule(d, lx, SCOL_L, base) : ''),
      ),
    )
  })

  const ref = yearOf(data.today)
  const streakRows = [
    ['flame', 'Current', data.streak.current, t.amber],
    ['trophy', 'Longest', data.streak.longest, t.amber],
  ]
  streakRows.forEach(([icon, label, s, accent], i) => {
    const base = ROW0 + i * ROW * 2
    const dates = s.days ? fmtRange(s.start, s.end, ref) : 'none yet'
    // dates sit under the label; long cross-year ranges drop the indent rather than shrink below 11px
    const [dx, ds] = [[22, 11.5], [22, 11], [0, 11.5], [0, 11]].find(([ix, sz]) => d.measure(dates, { font: 'mono-400', size: sz }) <= SCOL_R - ix) ?? [0, 11]
    d.add(
      stagger(
        0.32 + i * 0.14,
        d.icon(icon, { x: rx, y: base - 11, size: 14, color: accent, stroke: 1.9 }) +
          d.text(label, { x: rx + 22, y: base, font: 'body-500', size: 13, fill: t.fg2 }) +
          d.text(plural(s.days, 'day'), { x: rx + SCOL_R, y: base, font: 'body-600', size: 13, fill: t.fg, anchor: 'end' }) +
          d.text(fit(d, dates, { font: 'mono-400', size: ds, max: SCOL_R - dx }), { x: rx + dx, y: base + ROW, font: 'mono-400', size: ds, fill: t.muted }) +
          (i === 0 ? rowRule(d, rx, SCOL_R, base + ROW) : ''),
      ),
    )
  })
  return d.end()
}

// ── activity-langs ───────────────────────────────────────────────────────────

export function langsAlt(data) {
  const list = data.languages.map((l) => `${l.name} ${fmtShare(l.share)}`).join(', ')
  return `Most used languages across @${data.login}'s repositories by code size, updated ${fmtDay(data.fetchedAt)}: ${list || 'no language data'}.`
}

function stackedBar(d, langs, { x, y, w, h }) {
  const t = d.t
  const GAP = 2
  const MIN = 3
  const n = langs.length
  const usable = w - GAP * (n - 1)
  // every segment stays visible: reserve MIN px each, share the rest by size
  const extra = usable - MIN * n
  const total = langs.reduce((a, l) => a + l.share, 0) || 1
  let cx = x
  const segs = langs.map((l, i) => {
    const sw = i === n - 1 ? x + w - cx : MIN + (extra * l.share) / total
    const s = `<rect x="${r1(cx)}" y="${y}" width="${r1(Math.max(0, sw))}" height="${h}" fill="${l.fill}"/>`
    cx += sw + GAP
    return s
  })
  const cid = d.uid('bc')
  d.def(`<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath>`)
  const sheen = d.linearGradient([[0, '#fff', 0], [0.5, '#fff', t.name === 'dark' ? 0.35 : 0.55], [1, '#fff', 0]])
  d.css('@keyframes grow{from{transform:scaleX(0)}to{transform:none}}.grow{transform-box:fill-box;transform-origin:0 50%;animation:grow 1.1s cubic-bezier(.3,.7,.2,1) .15s both}')
  d.css(`@keyframes glint{0%,62%{transform:translateX(0);opacity:0}66%{opacity:1}96%{opacity:1}100%{transform:translateX(${w + 60}px);opacity:0}}.glint{animation:glint 7s ease-in-out 1.6s infinite}`)
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${t.inset}"/>` +
    `<g clip-path="url(#${cid})"><g class="grow">${segs.join('')}</g>` +
    `<g class="glint" opacity="0"><rect x="${x - 60}" y="${y}" width="60" height="${h}" fill="url(#${sheen})" opacity=".5"/></g>` +
    `<rect x="${x}" y="${y}" width="${w}" height="1" fill="#fff" opacity="${t.name === 'dark' ? 0.18 : 0.3}"/></g>`
  )
}

/** Logo tile for the headline language (brand logo, or a code glyph when there is none). */
function logoTile(d, lang, { x, y, size }) {
  const t = d.t
  const dark = t.name === 'dark'
  const slug = LANG_LOGOS[lang.name]
  let mark
  const s = Math.round(size * 0.5)
  try {
    if (!slug) throw new Error('no logo')
    d.brand(slug)
    mark = d.logo(slug, { x: x + (size - s) / 2, y: y + (size - s) / 2, size: s, on: t.logoTile })
  } catch {
    mark = d.icon('code-xml', { x: x + (size - s) / 2, y: y + (size - s) / 2, size: s, color: lang.fill, stroke: 2 })
  }
  const stroke = d.linearGradient([[0, lang.fill, dark ? 0.7 : 0.55], [1, t.border, 1]], { x1: 0, y1: 0, x2: 1, y2: 1 })
  return (
    d.glow({ cx: x + size / 2, cy: y + size / 2, r: size * 1.25, color: [lang.fill, dark ? 0.22 : 0.16] }) +
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${Math.round(size * 0.28)}" fill="${t.logoTile}" stroke="url(#${stroke})"/>` +
    mark
  )
}

export function renderLangs(t, data) {
  const d = createDoc({ width: W, height: H, theme: t, title: `Top languages — @${data.login}`, desc: langsAlt(data) })
  const dark = t.name === 'dark'
  const langs = data.languages.map((l) => ({ ...l, fill: l.other ? t.faint : langColor(l.color, t) }))
  surface(d, [
    { cx: W - 70, cy: HEAD + 40, r: 230, color: [t.glowViolet[0], t.glowViolet[1] * (dark ? 0.7 : 0.8)] },
    { cx: 30, cy: H + 30, r: 200, color: [t.glowCyan[0], t.glowCyan[1] * 0.45] },
  ])
  const right = data.repoCount ? `${plural(data.repoCount, 'repo')} · by size` : 'by code size'
  header(d, { icon: 'code-xml', label: 'Top languages', right: d.text(right, { x: W - PAD, y: HEAD_BASE - 0.5, font: 'mono-500', size: 11, fill: t.muted, anchor: 'end' }) })

  if (!langs.length) {
    d.add(d.text('No language data yet', { x: PAD, y: NUM_BASE, font: 'display-600', size: 20, fill: t.fg2 }))
    return d.end()
  }

  // headline: the top language's share
  const top = langs[0]
  d.add(headline(d, fmtShare(top.share), [{ text: safe(d, top.name, 'body-500'), font: 'body-500', fill: t.fg2 }, ' · most used']))
  const tile = 48
  d.add(`<g style="animation:fade-in .9s ease .2s both">${logoTile(d, top, { x: W - PAD - tile, y: (HEAD + SUB_BASE) / 2 - tile / 2 + 4, size: tile })}</g>`)

  // stacked bar on the kicker line
  const barH = 10
  d.add(stackedBar(d, langs, { x: PAD, y: KICK_BASE - 4 - barH / 2 + 0.5, w: W - 2 * PAD, h: barH }))

  // legend: one ruled column with share tracks for ≤ 4 entries, two columns otherwise
  const twoCol = langs.length > 4
  const perCol = twoCol ? Math.ceil(langs.length / 2) : langs.length
  const colW = twoCol ? COL : W - 2 * PAD
  langs.forEach((l, i) => {
    const col = Math.floor(i / perCol)
    const row = i % perCol
    const x = PAD + col * (COL + GUT)
    const base = ROW0 + row * ROW
    const pct = fmtShare(l.share)
    const pw = d.measure(pct, { font: 'mono-500', size: 12 })
    const nameMax = twoCol ? colW - 16 - pw - 10 : 112
    const name = fit(d, l.name, { font: 'body-500', size: 13, max: nameMax })
    const parts = [
      `<rect x="${x}" y="${base - 8.5}" width="8" height="8" rx="2.5" fill="${l.fill}"/>`,
      d.text(name, { x: x + 16, y: base, font: 'body-500', size: 13, fill: l.other ? t.muted : t.fg2 }),
      d.text(pct, { x: x + colW, y: base, font: 'mono-500', size: 12, fill: t.fg, anchor: 'end' }),
    ]
    if (!twoCol) {
      // share track between the name and the percentage
      const tx = x + 16 + 112 + 12
      const tw = x + colW - 48 - tx
      parts.push(
        `<rect x="${r1(tx)}" y="${base - 6}" width="${r1(tw)}" height="4" rx="2" fill="${t.border}" opacity="${dark ? 0.7 : 0.6}"/>`,
        `<g class="grow" style="animation-duration:.85s;animation-delay:${(0.35 + i * 0.07).toFixed(2)}s"><rect x="${r1(tx)}" y="${base - 6}" width="${r1(Math.max(4, tw * l.share))}" height="4" rx="2" fill="${l.fill}"/></g>`,
      )
    }
    if (row < perCol - 1 && (twoCol ? i + 1 < langs.length : true)) parts.push(rowRule(d, x, colW, base))
    d.add(stagger(0.32 + i * 0.07, parts.join('')))
  })
  return d.end()
}

export const CARDS = [
  { name: 'activity-stats', width: W, height: H, alt: statsAlt, render: renderStats },
  { name: 'activity-langs', width: W, height: H, alt: langsAlt, render: renderLangs },
]
