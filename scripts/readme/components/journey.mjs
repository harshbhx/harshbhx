// No. 3 — The route so far: two facing pages.
//
//   journey  "Line 1 · Vadodara → anywhere": JOURNEY drawn as a printed
//            route map. A thick ink line runs through the stations (rings for
//            the big ones), the three hackathon builds sit on a turmeric
//            loop that leaves and rejoins the line at 45°, "Now" is the terra
//            YOU ARE HERE marker, and the road ahead (Next → Anywhere) is
//            dashed, ending in a globe terminus. The line draws itself in.
//   now      "/now — what I'm doing now": NOW as three labelled notes with
//            small Lucide icons, then the "open to work" box (green dot, the
//            four work types, remote-friendly · Vadodara) and the hiring hook,
//            signed "— Harsh". The whole image links to the hiring email.
//
// Both pages share the publication grid — P = 28, kicker row at 40, headline
// baseline at 100, footer rule at H − 50 — like the Arena spread above them.

import { createDoc, r1 } from '../lib/svg.mjs'
import { editorial, paper, doubleRule, hairline, highlighter, liveDot, status, runs, assertFits, inkPath } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { JOURNEY, NOW, PROFILE, LINKS, CTA } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 680
const P = 28
const R = W - P
const HEAD_Y = 100
const FOOT_RULE = H - 50
const FOOT_Y = H - 26

const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }

/** Kicker row: terra label + muted continuation, hairline under it. */
function kicker(d, label, rest, { lead = 0 } = {}) {
  const t = d.t
  const a = runs(d, [{ text: label, fill: t.terra, after: 8 }, { text: rest, fill: t.muted }], { x: P + lead, y: 40, ...KICK })
  d.add(a.svg, hairline(d, P, R, 54))
  return a.x
}

/** Wrap that throws on a one-word last line. */
function lines(d, segs, { font, size, width, fill, label }) {
  const ls = d.wrap(segs, { font, size, width, fill })
  if (ls.length > 1) {
    const words = ls[ls.length - 1].runs.map((r) => r.text).join('').trim().split(/\s+/).length
    if (words < 2) throw new Error(`${label}: orphan on the last line`)
  }
  return ls
}

/** Draw wrapped lines (from d.wrap); `mark` gets the highlighter. */
function drawLines(d, ls, { x, y, size, lh, mark, label }) {
  const out = []
  const marks = []
  ls.forEach((ln, i) => {
    let cx = x
    const by = y + i * lh
    for (const r of ln.runs) {
      if (mark && r.text.includes(mark)) {
        const pre = r.text.slice(0, r.text.indexOf(mark))
        const mx = cx + d.measure(pre, { font: r.font, size })
        const mw = d.measure(mark, { font: r.font, size })
        marks.push(highlighter(d, mx - 1.5, by - size * 0.8, mw + 1, size * 1.05))
      }
      out.push(d.text(r.text, { x: cx, y: by, font: r.font, size, fill: r.fill }))
      cx += d.measure(r.text, { font: r.font, size })
    }
    assertFits(`${label} line ${i + 1}`, cx, R)
  })
  return marks.join('') + out.join('')
}

const cap = (d, font, size) => d.metrics(font, size).capHeight
const nb = (s) => s.replace(/ /g, '\u00a0') // keep a phrase on one line

/** Polyline with rounded corners (transit-map bends). */
function bends(pts, rad) {
  let s = `M${r1(pts[0][0])} ${r1(pts[0][1])}`
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [cx, cy] = pts[i]
    const [nx, ny] = pts[i + 1]
    const l1 = Math.hypot(cx - px, cy - py)
    const l2 = Math.hypot(nx - cx, ny - cy)
    const r = Math.min(rad, l1 / 2, l2 / 2)
    s += `L${r1(cx + ((px - cx) * r) / l1)} ${r1(cy + ((py - cy) * r) / l1)}Q${r1(cx)} ${r1(cy)} ${r1(cx + ((nx - cx) * r) / l2)} ${r1(cy + ((ny - cy) * r) / l2)}`
  }
  const last = pts[pts.length - 1]
  return { d: `${s}L${r1(last[0])} ${r1(last[1])}`, len }
}

// ── journey ─────────────────────────────────────────────────────────────────

const HACKS = JOURNEY.filter((j) => j.kind === 'hackathon')
const NOW_J = JOURNEY.find((j) => j.kind === 'now')
const NEXT_J = JOURNEY.find((j) => j.kind === 'next')
const END_J = JOURNEY.find((j) => j.kind === 'end')
const START_J = JOURNEY.find((j) => j.kind === 'start')
const MAJORS = JOURNEY.filter((j) => j.kind === 'major')
const strip = (s, pre) => s.replace(new RegExp(`^${pre}:\\s*`), '')

const JOURNEY_ALT = [
  'Line 1, Vadodara → anywhere: my route so far, drawn as a transit map.',
  `Stations: ${START_J.title} (${START_J.detail});`,
  ...MAJORS.map((j) => `${j.title} (${j.detail});`),
  `a hackathon loop — ${HACKS.map((j) => `${j.title} (${j.detail})`).join(', ')};`,
  `you are here — ${NOW_J.title} (${NOW_J.detail});`,
  `the road ahead — ${NEXT_J.title} (${NEXT_J.detail});`,
  `terminus: ${END_J.title} (${END_J.detail}).`,
].join(' ')

function renderJourney(theme) {
  const d = createDoc({ width: W, height: H, theme, title: 'Line 1 — Vadodara → anywhere', desc: JOURNEY_ALT })
  editorial(d)
  d.css('.st{animation:fade-in .45s ease both}')
  const t = d.t
  d.add(paper(d))

  kicker(d, 'Line 1', '· Route map')
  d.add(d.text(`${JOURNEY.length} stops`, { x: R, y: 40, ...KICK, fill: t.muted, anchor: 'end' }))

  // headline: a route bullet, then "Vadodara → anywhere" (the arrow in sans: the serif has none)
  // grid: the route bullet hangs over the main line; headline and station
  // labels share one text column
  const BR = 16
  const LX = P + BR // main line (44)
  const BX = LX + 26 // hackathon loop
  const TX = BX + 20 // labels (90)
  d.add(`<circle cx="${LX}" cy="${r1(HEAD_Y - 12)}" r="${BR}" fill="${t.fg}"/>`)
  d.add(d.text('1', { x: LX - 0.5, y: HEAD_Y - 12 + cap(d, 'sans-700', 19) / 2, font: 'sans-700', size: 19, fill: t.surfaceTop, anchor: 'middle' }))
  const head = runs(
    d,
    [
      { text: 'Vadodara', after: 9 },
      { text: '→', font: 'sans-400', size: 27, fill: t.terra, after: 9 },
      { text: 'anywhere' },
    ],
    { x: TX - 1, y: HEAD_Y, font: 'serif-400', size: 38, fill: t.fg },
  )
  d.add(`<g class="fade-up">${head.svg}</g>`)
  assertFits('journey headline', head.x, R)

  // ── geometry ──
  const TW = R - TX
  const LINE = 5
  const T_SIZE = 14.5
  const D_SIZE = 12
  const D_LH = 16.5
  const tCap = cap(d, 'sans-600', T_SIZE)

  // station centres (y); the gaps are tuned so every label block clears the next
  const ys = {}
  // pitches: 52 between the big stations, 44 inside the hackathon loop (a tight
  // group reads as one branch), extra room where the loop bends and above the
  // YOU ARE HERE sticker
  const PITCH = [['start', 0], ['labs', 54], ['arena', 54], ['h0', 62], ['h1', 44], ['h2', 44], ['now', 72], ['next', 54], ['end', 56]]
  let y = 138
  for (const [k, dy] of PITCH) ys[k] = y += dy

  // the hackathon loop: leaves below Arena, rejoins above Now, 45° bends
  const DX = BX - LX
  const s1 = ys.arena + 15
  const e1 = ys.now - 26
  const loop = bends([[LX, s1], [LX, s1 + 2], [BX, s1 + 2 + DX], [BX, e1 - 2 - DX], [LX, e1 - 2], [LX, e1]], 7)
  if (s1 + 2 + DX > ys.h0 - 12 || e1 - 2 - DX < ys.h2 + 12) throw new Error('hackathon stations must sit on the straight part of the loop')

  // timing: the main line draws top → Now; things appear as it reaches them
  const T0 = 0.15
  const DUR = 0.9
  const span = ys.now - ys.start
  const at = (yy) => T0 + DUR * (1 - Math.sqrt(Math.max(0, 1 - (yy - ys.start) / span))) // ≈ ease-out inverse
  const loopT0 = Math.round(at(s1) * 100) / 100
  const LOOP_DUR = 0.55
  const loopAt = (yy) => loopT0 + LOOP_DUR * ((yy - s1) / (e1 - s1))
  const FUTURE = 0.95

  const art = []
  art.push(inkPath(d, loop.d, { len: loop.len, stroke: t.turmericFill, width: LINE - 0.5, delay: loopT0, dur: LOOP_DUR, extra: ' stroke-linejoin="round"' }))
  art.push(inkPath(d, `M${LX} ${ys.start}V${ys.now}`, { len: span, stroke: t.fg, width: LINE, delay: T0, dur: DUR }))
  // the road ahead: dashed
  art.push(`<g class="st" style="animation-delay:${FUTURE}s"><path d="M${LX} ${ys.now}V${ys.end}" stroke="${t.fg}" stroke-width="${LINE - 1}" stroke-dasharray="6 5" opacity=".55"/></g>`)
  d.add(art.join(''))

  const fill = t.surfaceRaised
  const ring = (cx, cy, r, stroke, w = 3, extra = '') => `<circle cx="${cx}" cy="${r1(cy)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"${extra}/>`
  const group = (svg, delay) => `<g class="st" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`

  /** Label block: title runs on the station's centre line, detail lines below. */
  const label = (cy, title, detail, { tFont = 'sans-600', tSize = T_SIZE, tFill = t.fg, dFill = t.muted, dFont = 'sans-400', after = null, name }) => {
    const base = cy + cap(d, tFont, tSize) / 2
    const tr = runs(d, Array.isArray(title) ? title : [{ text: title }], { x: TX, y: base, font: tFont, size: tSize, fill: tFill })
    const out = [tr.svg]
    let right = tr.x
    if (after) {
      const a = after(tr.x + 10, cy)
      out.push(a.svg)
      right = tr.x + 10 + a.w
    }
    assertFits(`${name} title`, right, R)
    // detail: one line, or broken at " · " when it is too long
    const parts = Array.isArray(detail) ? [detail] : detail.split(' · ')
    const dl = []
    for (const p of parts) {
      const segs = Array.isArray(p) ? p : [{ text: p }]
      const prev = dl[dl.length - 1]
      const joined = prev ? [...prev, { text: ' · ' }, ...segs] : null
      const w = (ss) => ss.reduce((a, s) => a + d.measure(s.text, { font: s.font || dFont, size: s.size || D_SIZE }), 0)
      if (joined && w(joined) <= TW) dl[dl.length - 1] = joined
      else dl.push(segs)
    }
    let by = base + 18
    for (const segs of dl) {
      const r = runs(d, segs, { x: TX, y: by, font: dFont, size: D_SIZE, fill: dFill })
      out.push(r.svg)
      assertFits(`${name} detail`, r.x, R)
      by += D_LH
    }
    return { svg: out.join(''), top: base - cap(d, tFont, tSize), bottom: by - D_LH + 4 }
  }

  const blocks = []
  const check = []

  // origin: Parul University, set as a terminus name in the display serif
  {
    const cy = ys.start
    const svg = ring(LX, cy, 9, t.fg, 3) + `<circle cx="${LX}" cy="${cy}" r="3" fill="${t.fg}"/>`
    const l = label(cy, START_J.title, START_J.detail, { tFont: 'serif-400', tSize: 23, name: 'start' })
    blocks.push(group(svg + l.svg, at(cy)))
    check.push([l.top, l.bottom])
  }
  // DualMind Labs: the year in mono terra
  {
    const j = MAJORS[0]
    const cy = ys.labs
    const [year, rest] = j.detail.split(' · ')
    const detail = /^\d{4}$/.test(year) ? [{ text: year, font: 'mono-500', size: 11.5, fill: t.terra, after: 0 }, { text: ` · ${rest}` }] : j.detail
    const l = label(cy, j.title, detail, { name: 'labs' })
    blocks.push(group(ring(LX, cy, 7.5, t.fg) + l.svg, at(cy)))
    check.push([l.top, l.bottom])
  }
  // DualMind Arena goes live: interchange ring + the honest LIVE label
  {
    const j = MAJORS[1]
    const cy = ys.arena
    const l = label(cy, j.title, j.detail, {
      name: 'arena',
      after: (x, c) => {
        const s = status(d, 'live', { x, y: c - 11 })
        return { svg: s.svg, w: s.w }
      },
    })
    blocks.push(group(ring(LX, cy, 7.5, t.fg) + l.svg, at(cy)))
    check.push([l.top, l.bottom])
  }
  // the hackathon loop
  HACKS.forEach((j, i) => {
    const cy = ys[`h${i}`]
    const l = label(cy, j.title, j.detail, { tSize: 13.5, dFill: t.turmeric, dFont: 'sans-500', name: `hack ${i + 1}` })
    blocks.push(group(ring(BX, cy, 5.5, t.turmeric, 2.4) + l.svg, loopAt(cy)))
    check.push([l.top, l.bottom])
  })
  // Now — you are here
  {
    const cy = ys.now
    const mark =
      `<circle class="pulse" cx="${LX}" cy="${cy}" r="7" fill="${t.terraFill}" opacity=".55"/>` +
      `<circle cx="${LX}" cy="${cy}" r="11.5" fill="${fill}" stroke="${t.terra}" stroke-width="1.5"/>` +
      `<circle cx="${LX}" cy="${cy}" r="7" fill="${t.terra}"/>`
    const l = label(cy, [{ text: 'Now', font: 'serif-400i', size: 20, fill: t.terra, after: 7 }, { text: strip(NOW_J.title, 'Now') }], NOW_J.detail, { name: 'now' })
    // the sticker above the title
    const sy = cy + tCap / 2 - tCap - 27
    const tag = d.pill('You are here', { x: TX, y: sy, h: 18, font: 'mono-500', size: 10, tracking: 0.12, upper: true, padX: 7, r: 3, fg: t.surfaceTop, bg: t.terra, border: null })
    blocks.push(group(mark + l.svg, at(cy)))
    blocks.push(`<g class="stamp" style="animation-delay:${at(cy).toFixed(2)}s">${tag.svg}</g>`)
    check.push([sy, l.bottom]) // the sticker is this block's top
  }
  // Next — dashed ring
  {
    const cy = ys.next
    const svg = `<circle cx="${LX}" cy="${cy}" r="7" fill="${fill}" stroke="${t.fg}" stroke-width="2.2" stroke-dasharray="3.2 2.3"/>`
    const l = label(cy, [{ text: 'Next', font: 'serif-400i', size: 20, fill: t.muted, after: 7 }, { text: strip(NEXT_J.title, 'Next'), fill: t.fg2 }], NEXT_J.detail, { name: 'next' })
    blocks.push(group(svg + l.svg, FUTURE + 0.1))
    check.push([l.top, l.bottom])
  }
  // Anywhere — the terminus, with a globe
  {
    const cy = ys.end
    const svg = ring(LX, cy, 13, t.fg, 3) + d.icon('globe', { x: LX - 8, y: cy - 8, size: 16, color: t.fg, stroke: 1.8 })
    const l = label(cy, END_J.title, END_J.detail, { tFont: 'serif-400', tSize: 25, name: 'end' })
    blocks.push(group(svg + l.svg, FUTURE + 0.2))
    check.push([l.top, l.bottom])
  }
  d.add(blocks.join(''))

  // label blocks must not touch (≥ 12 units between one block and the next title)
  for (let i = 1; i < check.length; i++) {
    const top = check[i][0]
    if (top - check[i - 1][1] < 12) throw new Error(`journey: station ${i + 1} crowds station ${i} (${(top - check[i - 1][1]).toFixed(1)})`)
  }
  const lastBottom = check[check.length - 1][1]
  if (FOOT_RULE - lastBottom < 18) throw new Error(`journey: last station too close to the footer (${(FOOT_RULE - lastBottom).toFixed(1)})`)

  // legend, like the key of a printed map
  d.add(hairline(d, P, R, FOOT_RULE))
  const LEG = { font: 'sans-500', size: 12, fill: t.muted }
  const sw = (x, kind) => {
    const yy = FOOT_Y - 4
    if (kind === 'main') return `<path d="M${x} ${yy}h16" stroke="${t.fg}" stroke-width="${LINE}"/>`
    if (kind === 'loop') return `<path d="M${x} ${yy}h16" stroke="${t.turmericFill}" stroke-width="${LINE - 0.5}"/>`
    return `<path d="M${x} ${yy}h17" stroke="${t.fg}" stroke-width="${LINE - 1}" stroke-dasharray="6 5" opacity=".55"/>`
  }
  let lx = P
  for (const [kind, text] of [['main', 'travelled'], ['loop', 'hackathon builds'], ['ahead', 'ahead']]) {
    d.add(sw(lx, kind))
    lx += 23
    d.add(d.text(text, { x: lx, y: FOOT_Y, ...LEG }))
    lx += d.measure(text, LEG) + 16
  }
  const nts = 'not to scale'
  d.add(d.text(nts, { x: R, y: FOOT_Y, font: 'serif-400i', size: 15, fill: t.muted, anchor: 'end' }))
  assertFits('legend', lx - 16 + 16, R - d.measure(nts, { font: 'serif-400i', size: 15 }))
  return d.end()
}

// ── now ─────────────────────────────────────────────────────────────────────

const ROWS = [
  { icon: 'bot', ...NOW[0], mark: 'AI agents & automations' },
  { icon: 'scale', ...NOW[1], strong: 'AI agent evaluation' },
  { icon: 'graduation-cap', ...NOW[2], strong: 'Computer Science' },
]
// NOW[3] ("Open to") is set as the "open to work" box below the three notes.
const OPEN_NOTE = `${PROFILE.openTo.note} · ${PROFILE.city} (${PROFILE.timezone.replace(/ \(/, ', ').replace(/\)$/, '')})`

const NOW_ALT = [
  '/now — what I’m doing now.',
  ...NOW.slice(0, 3).map((n) => `${n.label}: ${n.text}.`),
  `${PROFILE.openTo.headline} — ${PROFILE.openTo.detail}: ${PROFILE.openTo.types.join(', ')}; ${OPEN_NOTE}.`,
  `${PROFILE.hiringHook} ${LINKS.hire.label}: ${PROFILE.email}. ${CTA.signoff}`,
].join(' ')

function renderNow(theme) {
  const d = createDoc({ width: W, height: H, theme, title: '/now — what I’m doing now', desc: NOW_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))

  // kicker, led by the journey's YOU ARE HERE marker so the facing pages connect
  d.add(`<circle cx="${P + 5}" cy="36" r="5" fill="none" stroke="${t.terra}" stroke-width="1.2"/><circle cx="${P + 5}" cy="36" r="2.6" fill="${t.terra}"/>`)
  kicker(d, '/now', '· from my desk', { lead: 17 })

  const HL = { font: 'serif-400', size: 40 }
  d.add(d.text('What I’m doing now', { x: P - 1, y: HEAD_Y, ...HL, fill: t.fg, cls: 'fade-up' }))
  assertFits('now headline', P + d.measure('What I’m doing now', HL), R)

  // ── measure every block, then solve one gap unit `g` so the blocks spread
  // evenly from the headline down to the footer rule ──
  const IX = P
  const TX = P + 32
  const TW = R - TX
  const SIZE = 14.5
  const LH = 22
  const TEXT_Y = 22 // label baseline → first text baseline
  const LABEL_CAP = cap(d, 'mono-500', 11)
  const rows = ROWS.map((r, i) => {
    const segs = []
    const key = r.mark || r.strong
    const at = r.text.indexOf(key)
    if (at > 0) segs.push(r.text.slice(0, at))
    segs.push({ text: r.mark ? nb(key) : key, font: 'sans-600', fill: t.fg })
    if (at + key.length < r.text.length) segs.push(r.text.slice(at + key.length))
    return { ...r, ls: lines(d, segs, { font: 'sans-400', size: SIZE, width: TW, fill: t.fg2, label: `now row ${i + 1}` }) }
  })

  const CHIP = { h: 30, font: 'sans-500', size: 13, padX: 12, r: 15, fg: t.fg, bg: t.surfaceRaised, border: t.borderStrong }
  const HOOK = { font: 'serif-400i', size: 28, lh: 32 }
  const hookCap = cap(d, HOOK.font, HOOK.size)
  const hookLines = lines(d, PROFILE.hiringHook.replace(/ or (\S+)$/, (m, w) => ` ${nb(`or ${w}`)}`), { font: HOOK.font, size: HOOK.size, width: R - P, fill: t.fg, label: 'hook' })
  const OPEN_LINE = { font: 'serif-400', size: 28 }

  // each block: gap units above it, its height (top → bottom), and how to draw it
  const blocks = []
  rows.forEach((r, i) => {
    const h = LABEL_CAP + TEXT_Y + (r.ls.length - 1) * LH + 5
    blocks.push({
      gap: i ? 2 : 1.25,
      rule: i > 0, // hairline centred in the gap above
      h,
      draw(top) {
        const ly = top + LABEL_CAP
        const out = [
          d.icon(r.icon, { x: IX - 1, y: ly - LABEL_CAP / 2 - 9, size: 18, color: t.terra, stroke: 1.7 }),
          d.text(r.label, { x: TX, y: ly, ...KICK, fill: t.terra }),
          drawLines(d, r.ls, { x: TX, y: ly + TEXT_Y, size: SIZE, lh: LH, mark: r.mark && nb(r.mark), label: `now row ${i + 1}` }),
        ]
        d.add(`<g class="fade-up" style="animation-delay:${(0.15 + i * 0.12).toFixed(2)}s">${out.join('')}</g>`)
      },
    })
  })
  // the "open to work" box (NOW[3], set as the four work types)
  const OK_Y = 22 // double rule → kicker baseline
  const LINE_Y = OK_Y + 39 // → serif line baseline
  const CHIP_Y = LINE_Y + 17 // → chips top
  const NOTE_Y = CHIP_Y + CHIP.h + 26 // → note baseline
  blocks.push({
    gap: 1.6,
    h: NOTE_Y + 4,
    draw(top) {
      d.add(doubleRule(d, P, R, top, { heavy: 1.2, gap: 2.5 }))
      const ky = top + OK_Y
      d.add(liveDot(d, P + 4, ky - LABEL_CAP / 2, 3.8))
      const ok = runs(d, [{ text: 'Open to work', fill: t.green, after: 8 }, { text: '· worldwide', fill: t.muted }], { x: P + 16, y: ky, ...KICK })
      d.add(ok.svg)
      const line = `${PROFILE.openTo.detail[0].toUpperCase()}${PROFILE.openTo.detail.slice(1)}.`
      d.add(d.text(line, { x: P - 1, y: top + LINE_Y, ...OPEN_LINE, fill: t.fg }))
      assertFits('open line', P + d.measure(line, OPEN_LINE), R)
      const chips = d.flow(PROFILE.openTo.types, { x: P, y: top + CHIP_Y, width: R - P, gap: 8, make: (label, p) => d.pill(label, { ...CHIP, ...p }) })
      if (chips.rows !== 1) throw new Error('open-to chips wrap')
      d.add(`<g class="fade-up" style="animation-delay:.55s">${chips.svg}</g>`)
      const ny = top + NOTE_Y
      d.add(d.icon('map-pin', { x: P - 1, y: ny - 13, size: 16, color: t.muted, stroke: 1.8 }))
      const note = runs(d, [{ text: PROFILE.openTo.note, font: 'sans-600', fill: t.fg2 }, { text: OPEN_NOTE.slice(PROFILE.openTo.note.length) }], { x: P + 22, y: ny, font: 'sans-400', size: 13, fill: t.muted })
      d.add(note.svg)
      assertFits('open note', note.x, R)
    },
  })
  // the hiring hook, set as a pull line that leads into the footer's link
  blocks.push({
    gap: 1.6,
    h: hookCap + (hookLines.length - 1) * HOOK.lh + 7,
    draw(top) {
      d.add(`<g class="fade-up" style="animation-delay:.7s">${drawLines(d, hookLines, { x: P - 1, y: top + hookCap, size: HOOK.size, lh: HOOK.lh, label: 'hook' })}</g>`)
    },
  })
  const END_GAP = 1.1
  const start = HEAD_Y + 9 // headline descenders
  const units = blocks.reduce((a, b) => a + b.gap, 0) + END_GAP
  const g = (FOOT_RULE - start - blocks.reduce((a, b) => a + b.h, 0)) / units
  if (g < 12) throw new Error(`now card too full (gap unit ${g.toFixed(1)})`)
  if (g > 22) throw new Error(`now card too empty (gap unit ${g.toFixed(1)})`)
  let y = start
  for (const b of blocks) {
    if (b.rule) d.add(hairline(d, P, R, y + (b.gap * g) / 2))
    y += b.gap * g
    b.draw(y)
    y += b.h
  }

  // footer: the card's one link + the signature
  d.add(hairline(d, P, R, FOOT_RULE))
  const cta = runs(d, [{ text: LINKS.hire.label, after: 7 }, { text: '→' }], { x: P, y: FOOT_Y, size: 14, font: 'sans-600', fill: t.terra })
  d.add(cta.svg)
  const sig = CTA.signoff
  d.add(d.text(sig, { x: R, y: FOOT_Y + 1, font: 'serif-400i', size: 24, fill: t.terra, anchor: 'end' }))
  assertFits('footer', cta.x + 16, R - d.measure(sig, { font: 'serif-400i', size: 24 }))
  return d.end()
}

export default [
  { name: 'journey', width: W, height: H, alt: JOURNEY_ALT, render: renderJourney },
  { name: 'now', width: W, height: H, alt: NOW_ALT, href: LINKS.hire.href, render: renderNow },
]
