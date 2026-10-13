// "How I build" and "Work with me" pairs.
//
//   decisions   architecture decisions as an ADR-style log on a timeline rail
//   principles  engineering principles with large mono numerals 01–06
//   services-a  Mobile apps · Backend APIs
//   services-b  AI products · Full-stack MVPs
//
// decisions/principles share one header band, one column grid and one row
// rhythm so they read as a matched pair; services-a/b mirror each other and
// close with a footer band that echoes the header band.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { DECISIONS, PRINCIPLES, SERVICES, PROFILE, WORKING_STYLE, LINKS } from '../content.mjs'

const W = LAYOUT.half // 415
const PAD = 24
const R = LAYOUT.radius
const BAND = 44 // header / footer band height
const BAND_BASE = 26 // kicker baseline inside the band

// ── shared helpers ───────────────────────────────────────────────────────────

/** Narrowest width that keeps the same number of lines (avoids ragged orphans). */
function balancedWidth(d, content, o) {
  const n = d.wrap(content, o).length
  if (n < 2) return o.width
  let lo = 0
  let hi = o.width
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2
    if (d.wrap(content, { ...o, width: mid }).length <= n) hi = mid
    else lo = mid
  }
  return Math.min(o.width, Math.ceil(hi) + 1)
}

/** Tinted band clipped to the card's top (or bottom) corners, with a hairline divider. */
function band(d, { top = true, H }) {
  const t = d.t
  const x0 = 0.5
  const x1 = W - 0.5
  const fill = t.name === 'dark' ? t.surfaceRaised : t.inset
  const op = t.name === 'dark' ? 0.55 : 0.75
  if (top) {
    return (
      `<path d="M ${x0} ${BAND} V ${R + 0.5} A ${R} ${R} 0 0 1 ${R + 0.5} 0.5 H ${x1 - R} A ${R} ${R} 0 0 1 ${x1} ${R + 0.5} V ${BAND} Z" fill="${fill}" opacity="${op}"/>` +
      `<path d="M ${x0} ${BAND + 0.5} H ${x1}" stroke="${t.border}" stroke-width="1"/>`
    )
  }
  const y = H - BAND
  const yb = H - 0.5
  return (
    `<path d="M ${x0} ${y} V ${yb - R} A ${R} ${R} 0 0 0 ${R + 0.5} ${yb} H ${x1 - R} A ${R} ${R} 0 0 0 ${x1} ${yb - R} V ${y} Z" fill="${fill}" opacity="${op}"/>` +
    `<path d="M ${x0} ${y - 0.5} H ${x1}" stroke="${t.border}" stroke-width="1"/>`
  )
}

/** Header band content: icon + kicker on the left, a mono count on the right. */
function header(d, { icon, label, count }) {
  const t = d.t
  return [
    d.icon(icon, { x: PAD, y: BAND / 2 - 7.5, size: 15, color: t.violet, stroke: 1.9 }),
    d.kicker(label, { x: PAD + 24, y: BAND_BASE - 0.5, fill: t.fg2 }),
    d.text(count, { x: W - PAD, y: BAND_BASE - 0.5, font: 'mono-500', size: 11, tracking: 0.08, fill: t.muted, anchor: 'end' }),
  ].join('')
}

/** Rounded icon tile, top-left at (x, y). */
function iconTile(d, name, { x, y, size, color, accent = false, iconSize, rx }) {
  const t = d.t
  const dark = t.name === 'dark'
  const s = iconSize || Math.round(size * 0.5)
  const stroke = accent
    ? `url(#${d.linearGradient(t.gradAccent.map((c, i) => [i, c, dark ? 0.9 : 0.75]), { x1: 0, y1: 0, x2: 1, y2: 1 })})`
    : color
  return (
    `<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${size - 1}" height="${size - 1}" rx="${rx ?? Math.round(size * 0.29)}" fill="${color}" fill-opacity="${dark ? 0.12 : 0.07}" stroke="${stroke}"${accent ? '' : ` stroke-opacity="${dark ? 0.36 : 0.28}"`}/>` +
    d.icon(name, { x: x + (size - s) / 2, y: y + (size - s) / 2, size: s, color, stroke: 1.9 })
  )
}

/** '#rrggbb' + alpha → 'rgba(…)' so accent-tinted fills follow the theme tokens. */
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const alpha = (hex, a) => `rgba(${rgb(hex).join(',')},${a})`

/** Opaque '#rrggbb' of `hex` laid over `base` at alpha `a` (independent of what is drawn beneath). */
const mix = (hex, base, a) => {
  const [c, b] = [rgb(hex), rgb(base)]
  return `#${c.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, '0')).join('')}`
}

const stagger = (delay, inner, cls = 'fade-up') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${inner}</g>`

// ── decisions / principles (matched pair) ────────────────────────────────────

const PH = 440 // pair height
const MARK = 28 // marker column (icon tile / numeral)
const TX = PAD + MARK + 16 // text column
const TW = W - PAD - TX // text width
const TITLE = { font: 'body-600', size: 14 }
const WHY = { font: 'body-400', size: 13, lineHeight: 19 }
const CAP = 10.2 // body-600 14px cap height
const WHY_GAP = 20 // title baseline → first why baseline
const TOP0 = 75 // cap top of the first row
const BOTTOM = PH - 26 // last baseline

/** Lays out rows (title + wrapped why) so the last baseline lands on BOTTOM. */
function layoutRows(d, items) {
  const rows = items.map((it) => {
    const width = balancedWidth(d, it.why, { ...WHY, width: TW })
    const lines = d.wrap(it.why, { ...WHY, width }).length
    return { it, width, lines, h: CAP + WHY_GAP + WHY.lineHeight * (lines - 1) }
  })
  const used = rows.reduce((a, r) => a + r.h, 0)
  const gap = (BOTTOM - TOP0 - used) / (rows.length - 1)
  let y = TOP0
  for (const r of rows) {
    r.top = y
    r.base = y + CAP
    r.end = r.base + WHY_GAP + WHY.lineHeight * (r.lines - 1)
    y = r.end + gap
  }
  return { rows, gap }
}

function rowText(d, r) {
  const t = d.t
  return (
    d.text(r.it.title, { x: TX, y: r.base, ...TITLE, fill: t.fg }) +
    d.paragraph(r.it.why, { x: TX, y: r.base + WHY_GAP, width: r.width, ...WHY, fill: t.muted }).svg
  )
}

const decisionIcons = ['globe', 'database', 'waypoints', 'activity', 'shield-check']

function renderDecisions(t) {
  const d = createDoc({ width: W, height: PH, theme: t, title: 'Architecture decisions', desc: decisionsAlt })
  d.add(d.card({ glows: [{ cx: W - 40, cy: PH + 30, r: 250, color: t.glowViolet }] }))
  d.add(band(d, { top: true }))
  d.add(header(d, { icon: 'scale', label: 'Architecture decisions', count: String(DECISIONS.length).padStart(2, '0') }))

  const { rows } = layoutRows(d, DECISIONS)
  const cx = PAD + MARK / 2
  const tileY = (r) => r.top + CAP / 2 - MARK / 2

  // rail: hairline segments between the tiles, drawn in, with a slow travelling light
  const segs = []
  for (let i = 0; i < rows.length - 1; i++) {
    const a = tileY(rows[i]) + MARK + 5
    const b = tileY(rows[i + 1]) - 5
    segs.push([a, b])
  }
  const railTop = segs[0][0]
  const railBot = segs[segs.length - 1][1]
  const railG = d.linearGradient([[0, t.violet, t.name === 'dark' ? 0.55 : 0.45], [1, t.violet, t.name === 'dark' ? 0.18 : 0.16]], { x1: 0, y1: railTop, x2: 0, y2: railBot, units: 'userSpaceOnUse' })
  const cid = d.uid('rc')
  d.def(`<clipPath id="${cid}">${segs.map(([a, b]) => `<rect x="${cx - 2}" y="${r1(a)}" width="4" height="${r1(b - a)}"/>`).join('')}</clipPath>`)
  const spark = d.linearGradient([[0, t.cyan, 0], [0.5, t.cyan, 1], [1, t.cyan, 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const travel = railBot - railTop
  d.css(`@keyframes rail-draw{from{stroke-dashoffset:${Math.ceil(travel)}}to{stroke-dashoffset:0}}.rail{stroke-dasharray:${Math.ceil(travel)};animation:rail-draw 1.3s cubic-bezier(.4,0,.2,1) .2s both}`)
  d.css(`@keyframes rail-run{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(${Math.round(travel)}px);opacity:0}}.rail-run{animation:rail-run 5.5s cubic-bezier(.45,0,.3,1) 1.6s infinite both}`)
  d.add(
    `<path class="rail" d="M ${cx} ${r1(railTop)} V ${r1(railBot)}" stroke="url(#${railG})" stroke-width="1" clip-path="url(#${cid})" fill="none"/>`,
    `<g clip-path="url(#${cid})"><g class="rail-run"><rect x="${cx - 1}" y="${r1(railTop - 30)}" width="2" height="30" fill="url(#${spark})"/></g></g>`,
  )

  rows.forEach((r, i) => {
    const delay = 0.1 + i * 0.11
    d.add(
      stagger(delay, iconTile(d, decisionIcons[i] || 'circle', { x: PAD, y: tileY(r), size: MARK, color: t.violet, iconSize: 14, rx: 8 }), 'fade-in'),
      stagger(delay + 0.04, rowText(d, r)),
    )
  })
  return d.end()
}

const decisionsAlt = `Architecture decisions. ${DECISIONS.map((x, i) => `${i + 1}. ${x.title}: ${x.why}`).join(' ')}`

function renderPrinciples(t) {
  const d = createDoc({ width: W, height: PH, theme: t, title: 'Engineering principles', desc: principlesAlt })
  d.add(d.card({ glows: [{ cx: W - 40, cy: PH + 30, r: 250, color: t.glowCyan }] }))
  d.add(band(d, { top: true }))
  d.add(header(d, { icon: 'compass', label: 'Engineering principles', count: String(PRINCIPLES.length).padStart(2, '0') }))

  const { rows, gap } = layoutRows(d, PRINCIPLES)
  const NUM = { font: 'mono-500', size: 22 }
  const numCap = d.metrics(NUM.font, NUM.size).capHeight

  rows.forEach((r, i) => {
    const delay = 0.1 + i * 0.09
    const n = String(i + 1).padStart(2, '0')
    // numeral centred on the title line, like the decision tiles
    const nb = r.top + CAP / 2 + numCap / 2
    d.add(
      stagger(delay, d.text(n, { x: PAD, y: nb, ...NUM, fill: t.violet }), 'fade-in'),
      stagger(delay + 0.04, rowText(d, r)),
    )
    if (i < rows.length - 1) {
      const y = Math.round(r.end + 4 + (gap - 4) / 2) + 0.5
      d.add(stagger(delay + 0.2, `<path d="M ${TX} ${y} H ${W - PAD}" stroke="${t.border}" stroke-width="1"/>`, 'fade-in'))
    }
  })
  return d.end()
}

const principlesAlt = `Engineering principles. ${PRINCIPLES.map((x, i) => `${String(i + 1).padStart(2, '0')} ${x.title}: ${x.why}`).join(' ')}`

// ── services ─────────────────────────────────────────────────────────────────

const SH = 404 // services height
const TILE = 40
const STX = PAD + TILE + 14 // title / list column
const ITEM = { font: 'body-400', size: 13 }
const ITEM_LH = 24

// Timelines on one shared week scale so the four services compare at a glance.
const weeks = (s) => s.match(/(\d+)\D+(\d+)/).slice(1, 3).map(Number) // "2–6 weeks" → [2, 6]
const MAX_WEEKS = Math.max(...SERVICES.map((s) => weeks(s.time)[1]))

/** Week strip: a track of MAX_WEEKS cells; solid up to the minimum, tinted up to the maximum. */
function weekStrip(d, time, { xr, y, w, accent, delay }) {
  const t = d.t
  const [lo, hi] = weeks(time)
  const gap = 3
  const h = 5
  const cw = (w - gap * (MAX_WEEKS - 1)) / MAX_WEEKS
  const x0 = xr - w
  const cell = (i, fill) => `<rect x="${r1(x0 + i * (cw + gap))}" y="${r1(y)}" width="${r1(cw)}" height="${h}" rx="1.5" fill="${fill}"/>`
  const track = Array.from({ length: MAX_WEEKS }, (_, i) => cell(i, t.border)).join('')
  // Range cells are an opaque tint, so they do not pick up the track beneath them.
  // In light the tint is laid over the white surface: over the lavender track,
  // the dark light-theme cyan turns a dull steel grey instead of a light teal.
  const range = t.name === 'dark' ? mix(accent, t.border, 0.42) : mix(accent, t.surfaceTop, 0.4)
  const fills = []
  for (let i = 0; i < hi; i++) {
    fills.push(stagger(delay + 0.1 + i * 0.05, cell(i, i < lo ? accent : range), 'cell'))
  }
  return stagger(delay, track, 'fade-in') + fills.join('')
}

function serviceBlock(d, s, { top, accent, delay }) {
  const t = d.t
  const out = []
  // icon tile + title + timeline pill
  const tcx = top + TILE / 2
  out.push(stagger(delay, iconTile(d, s.icon, { x: PAD, y: top, size: TILE, color: accent, accent: true, iconSize: 19, rx: 12 }), 'fade-in'))
  const titleCap = d.metrics('display-600', 18).capHeight
  out.push(stagger(delay + 0.04, d.text(s.title, { x: STX, y: tcx + titleCap / 2, font: 'display-600', size: 18, fill: t.fg })))
  const pill = d.pill(s.time, { x: W - PAD, y: tcx - 12, h: 24, anchor: 'end', font: 'mono-500', size: 11.5, icon: 'clock', iconSize: 12, gap: 6, padX: 10, fg: t.fg2, iconColor: accent,
    bg: alpha(accent, t.name === 'dark' ? 0.08 : 0.06), border: alpha(accent, t.name === 'dark' ? 0.3 : 0.26) })
  out.push(stagger(delay + 0.1, pill.svg, 'fade-in'))
  out.push(weekStrip(d, s.time, { xr: W - PAD, y: tcx + 12 + 8, w: pill.w, accent, delay: delay + 0.1 }))

  // items
  const first = top + TILE + 24
  s.items.forEach((it, i) => {
    const base = first + i * ITEM_LH
    const xh = d.metrics(ITEM.font, ITEM.size).xHeight
    const iy = base - xh / 2 - 6.5 // check icon centred on the x-height
    out.push(
      stagger(
        delay + 0.1 + i * 0.05,
        d.icon('check', { x: STX, y: iy, size: 13, color: accent, stroke: 2.4 }) + d.text(it, { x: STX + 21, y: base, ...ITEM, fill: t.fg2 }),
      ),
    )
  })
  const lastBase = first + (s.items.length - 1) * ITEM_LH
  return { svg: out.join(''), bottom: lastBase }
}

function renderServices(t, pair, footNote) {
  const d = createDoc({ width: W, height: SH, theme: t, title: `Services — ${pair.map((s) => s.title).join(' and ')}`, desc: servicesAlt(pair, footNote) })
  d.add(d.card({ glows: [{ cx: W - 30, cy: -30, r: 240, color: t.glowViolet }] }))
  d.add(band(d, { top: false, H: SH }))
  d.css('.cell{animation:fade-in .45s ease both}') // week-strip cells: quicker than .fade-in

  const accents = [t.violet, t.cyan]
  let top = PAD
  pair.forEach((s, i) => {
    const b = serviceBlock(d, s, { top, accent: accents[i], delay: 0.1 + i * 0.28 })
    d.add(b.svg)
    if (i < pair.length - 1) {
      const y = Math.round(b.bottom + 22) + 0.5
      d.add(stagger(0.3, `<path d="M ${PAD} ${y} H ${W - PAD}" stroke="${t.border}" stroke-width="1"/>`, 'fade-in'))
      top = y + 22
    }
  })

  // footer band: availability on the left, call to action on the right
  const fy = SH - BAND / 2
  const base = fy + 4
  d.add(
    `<circle class="pulse" cx="${PAD + 3.5}" cy="${fy}" r="3.5" fill="${t.green}"/><circle cx="${PAD + 3.5}" cy="${fy}" r="3.5" fill="${t.green}"/>`,
    d.text(footNote, { x: PAD + 16, y: base, font: 'body-500', size: 12, fill: t.muted }),
  )
  const cta = 'Start a project'
  const aw = 14
  d.add(
    d.text(cta, { x: W - PAD - aw - 6, y: base, font: 'body-600', size: 13, fill: t.violet, anchor: 'end' }),
    `<g class="nudge">${d.icon('arrow-right', { x: W - PAD - aw, y: fy - aw / 2, size: aw, color: t.violet, stroke: 2.2 })}</g>`,
  )
  d.css('@keyframes nudge{0%,70%,100%{transform:translateX(0)}80%{transform:translateX(3px)}90%{transform:translateX(0)}}.nudge{animation:nudge 4s ease-in-out 1.6s infinite}')
  return d.end()
}

const servicesAlt = (pair, note) =>
  `Services. ${pair.map((s) => `${s.title} (${s.time}): ${s.items.join(', ')}.`).join(' ')} ${note}. Start a project: ${PROFILE.email}.`

const notes = [`Open to ${(PROFILE.openTo.find((o) => /freelance/i.test(o)) || PROFILE.openTo[0]).toLowerCase()}`, WORKING_STYLE.find((w) => /24 hours/.test(w)) || WORKING_STYLE[0]]

export default [
  { name: 'decisions', width: W, height: PH, alt: decisionsAlt, render: renderDecisions },
  { name: 'principles', width: W, height: PH, alt: principlesAlt, render: renderPrinciples },
  {
    name: 'services-a',
    width: W,
    height: SH,
    alt: servicesAlt(SERVICES.slice(0, 2), notes[0]),
    href: LINKS.email.href,
    render: (t) => renderServices(t, SERVICES.slice(0, 2), notes[0]),
  },
  {
    name: 'services-b',
    width: W,
    height: SH,
    alt: servicesAlt(SERVICES.slice(2, 4), notes[1]),
    href: LINKS.email.href,
    render: (t) => renderServices(t, SERVICES.slice(2, 4), notes[1]),
  },
]
