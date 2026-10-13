// No. 2 — Selected work: five feature cards and the "House rules" card.
//
//   feature-pixelproof · feature-modvigil      (pair)
//   feature-builder    · feature-agent         (pair)
//   feature-mealmind   · house-rules           (pair)
//
// All six share one template and one height, so every pair is identical in
// size and the section reads as one run of magazine pages:
//
//     40  kicker row     FEATURE · 1 OF 5 ………………………………… [BUILT]
//     54  hairline
//     84  figure head    Fig. 3  How a scan works          (serif italic)
//  102–272 the drawing   a real explanation of the product, in ink lines
//    308  rubric         the event in turmeric (or what it is, muted)
//    346  title          serif 40
//         deck           serif italic 20, one phrase under the highlighter
//         summary        sans 13.5 / 21
//         stack          mono chips, last row 20 above the footer rule in every
//                        card, so the rows line up across each pair; spare
//                        height falls between the summary and the chips
//   H-50  footer rule
//   H-26  footer         the card's one link ↗ · serif-italic note
//
// Figures continue the issue's numbering after the masthead (Fig. 1) and
// the Arena (Fig. 2). Wording comes from content.mjs, shortened where a
// label has to fit a drawing — never with new claims.

import { createDoc, r1 } from '../lib/svg.mjs'
import { editorial, paper, doubleRule, hairline, highlighter, status, runs, assertFits, inkPath } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { WORK, PRINCIPLES, PROFILE } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 614
const P = 28
const R = W - P
const KICK_Y = 40
const FIG_Y = 84
const DRAW_TOP = 102
const DRAW_BOT = 272
const RUBRIC_Y = 308
const TITLE_Y = 346
const FOOT_RULE = H - 50
const FOOT_Y = H - 26

const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }
// data-bearing mono (stack chips, cadence tags): 11.5 → ≈9.5px at the phone's 0.83×
const DATA = 11.5
const TAG = { font: 'mono-500', size: DATA, tracking: 0.1, upper: true }
const nb = (s) => s.replace(/ /g, ' ')
const fade = (svg, delay, cls = 'fade-in') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`
const BY = Object.fromEntries(WORK.map((w) => [w.key, w]))

// ── shared page furniture ──────────────────────────────────────────────────

/** Kicker row: terra label + muted continuation, hairline under it (as on the Arena pages). */
function kicker(d, label, rest) {
  const t = d.t
  const a = runs(d, [{ text: label, fill: t.terra, after: 8 }, { text: rest, fill: t.muted }], { x: P, y: KICK_Y, ...KICK })
  d.add(a.svg, hairline(d, P, R, 54))
  return a.x
}

/** Footer: hairline, the card's one link label (optional), a serif-italic note on the right. */
function footer(d, { link, note }) {
  const t = d.t
  d.add(hairline(d, P, R, FOOT_RULE))
  let x = P
  if (link) {
    const l = runs(d, [{ text: link, after: 6 }, { text: '↗' }], { x: P, y: FOOT_Y, size: 13, font: 'sans-600', fill: t.terra })
    d.add(l.svg)
    x = l.x + 16
  }
  if (note) {
    d.add(d.text(note, { x: R, y: FOOT_Y, font: 'serif-400i', size: 15, fill: t.muted, anchor: 'end' }))
    assertFits('footer', x + d.measure(note, { font: 'serif-400i', size: 15 }), R)
  }
}

/** Tie the last two words together so a paragraph never ends on a lone word. */
const tieLast = (s) => s.replace(/ (\S+)$/, ' $1')

/**
 * Body copy: wraps, optionally lays the highlighter behind the phrase `mark`
 * (kept on one line with non-breaking spaces) and throws on a lone last word.
 */
function setText(d, str, { x, y, width, font = 'sans-400', size = 13.5, lh = 21, fill = d.t.fg2, mark, label = 'text' }) {
  const lines = d.wrap(tieLast(mark ? str.replace(mark.replace(/ /g, ' '), mark) : str), { font, size, width, fill })
  const marks = []
  const text = []
  lines.forEach((ln, i) => {
    let cx = x
    const by = y + i * lh
    for (const r of ln.runs) {
      if (mark && r.text.includes(mark)) {
        const pre = r.text.slice(0, r.text.indexOf(mark))
        const mx = cx + d.measure(pre, { font: r.font, size })
        const mw = d.measure(mark, { font: r.font, size })
        marks.push(highlighter(d, mx - 1.5, by - size * 0.78, mw + 2, size * 1.02))
      }
      text.push(d.text(r.text, { x: cx, y: by, font: r.font, size, fill: r.fill }))
      cx += d.measure(r.text, { font: r.font, size })
    }
    assertFits(`${label} line ${i + 1}`, cx, x + width)
  })
  if (mark && !marks.length) throw new Error(`${label}: highlight "${mark}" not found on one line`)
  return { svg: marks.join('') + text.join(''), lines: lines.length, last: y + (lines.length - 1) * lh }
}

/** "Fig. 3  How a scan works" — the figure's own header line. */
function figHeader(d, no, caption) {
  const t = d.t
  const f = runs(d, [{ text: `Fig. ${no}`, fill: t.terra, after: 9 }, { text: caption, fill: t.fg }], { x: P, y: FIG_Y, font: 'serif-400i', size: 18 })
  d.add(f.svg)
  assertFits('fig header', f.x, R)
}

/** Numbered callout circle (terra outline, serif-italic numeral), as in Fig. 2. */
function num(d, cx, cy, n) {
  const t = d.t
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="9.5" fill="${t.surfaceRaised}" stroke="${t.terra}" stroke-width="1"/>` + d.text(String(n), { x: cx - 0.4, y: cy + 5, font: 'serif-400i', size: 15, fill: t.terra, anchor: 'middle' })
}

/** Step label: numbered circle, label (sans 600) and an optional muted sub-line under it. */
function stepLabel(d, x, y, n, label, sub) {
  const t = d.t
  const out = [num(d, x + 9.5, y, n), d.text(label, { x: x + 25, y: y + 4.6, font: 'sans-600', size: 13, fill: t.fg })]
  if (sub) out.push(d.text(sub, { x, y: y + 24, font: 'sans-400', size: 12, fill: t.muted }))
  return out.join('')
}

/**
 * Three numbered steps under a drawing, each with a leader rising to the
 * part of the drawing it explains. cols: left x of each step.
 */
function stepRow(d, steps, { cols, y, anchors, delay = 1 }) {
  const t = d.t
  const out = []
  steps.forEach((s, i) => {
    const x = cols[i]
    const cx = x + 9.5
    const ay = anchors[i]
    const limit = i < 2 ? cols[i + 1] : R
    out.push(inkPath(d, `M${r1(cx)} ${r1(y - 9.5)}V${r1(ay)}`, { len: y - 9.5 - ay, stroke: t.muted, width: 0.9, delay: delay + i * 0.12, dur: 0.3 }))
    const g = [`<circle cx="${r1(cx)}" cy="${r1(ay)}" r="1.9" fill="${t.fg}"/>`, stepLabel(d, x, y, i + 1, s.step, s.tool)]
    assertFits(`step ${i + 1} label`, x + 25 + d.measure(s.step, { font: 'sans-600', size: 13 }), limit - (i < 2 ? 26 : 0))
    assertFits(`step ${i + 1} sub`, x + d.measure(s.tool, { font: 'sans-400', size: 12 }), limit - (i < 2 ? 10 : 0))
    if (i < 2) g.push(d.text('→', { x: cols[i + 1] - 10, y: y + 4.6, font: 'sans-400', size: 13, fill: t.muted, anchor: 'end' }))
    out.push(fade(g.join(''), delay + 0.1 + i * 0.12))
  })
  return out.join('')
}

const INK = (t, w = 1) => `stroke="${t.fg}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
const bar = (t, x, y, w, { h = 4, op = 0.2, fill = t.fg } = {}) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${h}" rx="${h / 2}" fill="${fill}" opacity="${op}"/>`
const arrowHead = (x, y, dir = 1) => `M${x - dir * 4.5} ${y - 3.5}L${x} ${y}L${x - dir * 4.5} ${y + 3.5}`

// ── Fig. 3 · PixelProof ────────────────────────────────────────────────────
// A page in the browser: the image under PixelProof's viewfinder with its
// verdict badge, the plain-English "why" and the fact-check panel, keyed to
// the three steps of the pipeline.

const PP_TOOLS = ['Reality Defender', 'Google Gemini', 'Fact Check API']

function figPixelProof(d, w) {
  const t = d.t
  const out = []
  const cols = [P, 166, 282]
  const bx = P
  const by = DRAW_TOP
  const bw = R - P
  const bh = 114
  // browser chrome, with PixelProof's toolbar button
  out.push(
    `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${t.surfaceRaised}" ${INK(t)}/>`,
    `<path d="M${bx} ${by + 18}H${bx + bw}" stroke="${t.fg}" stroke-opacity=".22"/>`,
    ...[0, 1, 2].map((i) => `<circle cx="${bx + 10 + i * 8}" cy="${by + 9}" r="2.4" fill="${t.faint}"/>`),
    `<rect x="${bx + 40}" y="${by + 4.5}" width="230" height="9" rx="4.5" fill="${t.inset}"/>`,
    `<rect x="${bx + bw - 22}" y="${by + 2.5}" width="14" height="13" rx="3" fill="${t.terraFill}"/>`,
    d.icon('scan-eye', { x: bx + bw - 20, y: by + 4.5, size: 10, color: t.surfaceRaised, stroke: 2.4 }),
  )
  // the image under the viewfinder; the viewfinder's corners sit on the step-1 leader
  const g = 4
  const ix = cols[0] + 9.5 + g
  const iy = by + 30
  const iw = cols[1] - 14 - ix
  const ih = 72
  const cid = d.uid('im')
  d.def(`<clipPath id="${cid}"><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="2"/></clipPath>`)
  const scanY = iy + 24
  d.css('@keyframes ppscan{from{transform:translateY(42px)}to{transform:none}}')
  out.push(
    `<g clip-path="url(#${cid})">`,
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="${t.inset}"/>`,
    `<circle cx="${ix + iw - 28}" cy="${iy + 21}" r="10" fill="${t.turmericFill}"/>`,
    `<path d="M${ix} ${iy + 50}Q${ix + 30} ${iy + 28} ${ix + 62} ${iy + 46}T${ix + iw} ${iy + 40}V${iy + ih}H${ix}Z" fill="${t.terraFill}" opacity=".85"/>`,
    `<path d="M${ix} ${iy + 63}Q${ix + 52} ${iy + 49} ${ix + 84} ${iy + 61}T${ix + iw} ${iy + 57}V${iy + ih}H${ix}Z" fill="${t.ink}" opacity="${t.name === 'dark' ? 0.55 : 0.9}"/>`,
    // a few too-smooth "pixels": the artefacts a detector looks for
    ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => `<rect x="${ix + 8 + i * 7}" y="${iy + 7 + j * 7}" width="6" height="6" fill="${t.fg}" opacity="${0.05 + ((i + j) % 3) * 0.05}"/>`)),
    `<g style="animation:ppscan 1.3s .35s cubic-bezier(.3,.6,.3,1) both"><rect x="${ix}" y="${scanY - 16}" width="${iw}" height="16" fill="${t.terra}" opacity=".13"/><rect x="${ix}" y="${scanY - 0.8}" width="${iw}" height="1.6" fill="${t.terra}"/></g>`,
    '</g>',
    `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="2" fill="none" stroke="${t.fg}" stroke-opacity=".25"/>`,
  )
  const L = 9
  const vf = []
  for (const [cx, sx] of [[ix - g, 1], [ix + iw + g, -1]])
    for (const [cy, sy] of [[iy - g, 1], [iy + ih + g, -1]]) vf.push(`M${cx} ${cy + sy * L}V${cy}H${cx + sx * L}`)
  out.push(`<path d="${vf.join('')}" fill="none" stroke="${t.terra}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`)
  // the product's own verdict wording ("AI GENERATED"), no confidence figure
  const badge = d.pill('AI generated', { x: ix + 6, y: iy + ih - 25, h: 19, font: 'mono-500', size: 10.5, tracking: 0.06, upper: true, padX: 6, r: 3, fg: t.terra, bg: t.surfaceRaised, border: t.terra })
  assertFits('verdict badge', ix + 6 + badge.w, ix + iw - 5)
  out.push(`<g class="stamp">${badge.svg}</g>`)

  // PixelProof's panels: the "why" (Gemini) and the fact check
  const px = cols[1]
  const pw = cols[2] - 12 - px
  out.push(
    `<rect x="${px}" y="${iy}" width="${pw}" height="${ih}" rx="4" fill="${t.surfaceTop}" stroke="${t.fg}" stroke-opacity=".3"/>`,
    d.icon('sparkles', { x: px + 9, y: iy + 8, size: 12, color: t.terra, stroke: 2 }),
    d.text('Why', { x: px + 26, y: iy + 18.5, font: 'sans-600', size: 12, fill: t.fg }),
    bar(t, px + 9, iy + 31, pw - 24),
    bar(t, px + 9, iy + 40, pw - 18),
    bar(t, px + 9, iy + 49, pw - 32),
    bar(t, px + 9, iy + 58, pw - 50),
  )
  const fx = cols[2]
  const fw = R - 10 - fx
  out.push(
    `<rect x="${fx}" y="${iy}" width="${fw}" height="${ih}" rx="4" fill="${t.surfaceTop}" stroke="${t.fg}" stroke-opacity=".3"/>`,
    d.icon('shield-check', { x: fx + 9, y: iy + 7.5, size: 13, color: t.ink, stroke: 2 }),
    bar(t, fx + 28, iy + 12, fw - 42, { op: 0.35, fill: t.ink }),
    ...[0, 1, 2].map((k) => `<circle cx="${fx + 12}" cy="${iy + 33 + k * 12}" r="2" fill="${t.ink}" opacity=".7"/>` + bar(t, fx + 19, iy + 31 + k * 12, fw - 30 - k * 9)),
  )
  // the verdict feeds the explanation: a dotted thread from the badge
  out.push(`<path d="M${ix + iw + g + 2} ${iy + ih - 15}C${ix + iw + 12} ${iy + ih - 15} ${px - 10} ${iy + 14} ${px} ${iy + 14}" fill="none" stroke="${t.terra}" stroke-width="1" stroke-dasharray="1.5 3" stroke-linecap="round"/>`)
  d.add(out.join(''))
  d.add(stepRow(d, w.pipeline.map((s, i) => ({ step: s.step, tool: PP_TOOLS[i] })), { cols, y: 244, anchors: [iy + ih + g, iy + ih, iy + ih] }))
}

// ── Fig. 4 · ModVigil ──────────────────────────────────────────────────────
// "What it automates": its four automations as a ledger, each marked with a
// plain icon for what it watches (no on/off switches: content.mjs describes
// the automations, not a deployment or a settings screen).

const MV_RULES = [
  { icon: 'activity', tag: 'every 15 min', detail: 'modmail when removals hit 3× the hourly baseline' },
  { icon: 'message-square-warning', tag: '3 steps', detail: 'educational note → final warning → human review' },
  { icon: 'ghost', tag: '30+ days', detail: 'surfaces moderators who have gone inactive' },
  { icon: 'newspaper', tag: 'Mondays', detail: 'a week-over-week report' },
]
// (detail lines are content.mjs wording, shortened; the tag column carries the numbers)

function figModVigil(d, w) {
  const t = d.t
  const out = []
  const top = DRAW_TOP + 2
  const rh = (DRAW_BOT - top) / 4
  const TX = P + 32
  out.push(doubleRule(d, P, R, DRAW_TOP - 1, { heavy: 1.2, gap: 2.5 }))
  w.rules.forEach((rule, i) => {
    const y = top + i * rh
    const m = MV_RULES[i]
    const nameY = y + rh / 2 - 2.5
    const cy = nameY - 4.6 // centred on the rule name, as the numbered callouts are
    const row = [
      `<circle cx="${P + 10.5}" cy="${r1(cy)}" r="10.5" fill="${t.surfaceRaised}" stroke="${t.terra}" stroke-width="1"/>`,
      d.icon(m.icon, { x: P + 4, y: cy - 6.5, size: 13, color: t.terra, stroke: 2 }),
      d.text(rule.rule, { x: TX, y: nameY, font: 'sans-600', size: 13, fill: t.fg }),
      d.text(m.tag, { x: R, y: nameY, ...TAG, fill: t.muted, anchor: 'end' }),
      d.text(m.detail, { x: TX, y: nameY + 16.5, font: 'sans-400', size: 12, fill: t.fg2 }),
    ]
    assertFits(`rule ${i + 1} detail`, TX + d.measure(m.detail, { font: 'sans-400', size: 12 }), R)
    assertFits(`rule ${i + 1} name + tag`, TX + d.measure(rule.rule, { font: 'sans-600', size: 13 }) + 16 + d.measure(m.tag, TAG), R)
    out.push(fade(row.join(''), 0.25 + i * 0.12, 'fade-up'))
    out.push(hairline(d, P, R, r1(y + rh)))
  })
  d.add(out.join(''))
}

// ── Fig. 5 · AI Component Builder ──────────────────────────────────────────
// Prompt in the chat panel → code streamed over SSE → the component, rendered.

const BUILDER_TOOLS = ['chat panel', 'Cursor SDK · SSE', 'sandboxed iframe']

function figBuilder(d, w) {
  const t = d.t
  const out = []
  const cols = [P, 146, 270]
  const y0 = DRAW_TOP
  const ph = 110
  const mid = y0 + ph / 2
  const panel = (x, x2, fill = t.surfaceRaised) => `<rect x="${x}" y="${y0}" width="${x2 - x}" height="${ph}" rx="5" fill="${fill}" ${INK(t)}/>`
  // 1 · the chat panel: a prompt bubble, and the input it was sent from
  const ax = cols[0]
  const ax2 = cols[1] - 14
  out.push(
    panel(ax, ax2),
    `<path d="M${ax2 - 9} ${y0 + 14}H${ax + 25}Q${ax + 19} ${y0 + 14} ${ax + 19} ${y0 + 20}V${y0 + 46}Q${ax + 19} ${y0 + 52} ${ax + 25} ${y0 + 52}H${ax2 - 15}L${ax2 - 9} ${y0 + 58}Z" fill="${t.inset}" stroke="${t.fg}" stroke-opacity=".35" stroke-linejoin="round"/>`,
    bar(t, ax + 27, y0 + 23, ax2 - ax - 46, { op: 0.32 }),
    bar(t, ax + 27, y0 + 32, ax2 - ax - 56, { op: 0.32 }),
    bar(t, ax + 27, y0 + 41, ax2 - ax - 72, { op: 0.32 }),
    `<rect x="${ax + 9}" y="${y0 + ph - 28}" width="${ax2 - ax - 18}" height="19" rx="9.5" fill="none" stroke="${t.fg}" stroke-opacity=".3"/>`,
    `<circle cx="${ax2 - 18.5}" cy="${y0 + ph - 18.5}" r="6.5" fill="${t.terraFill}"/>`,
    d.icon('arrow-up', { x: ax2 - 23, y: y0 + ph - 23, size: 9, color: t.surfaceRaised, stroke: 3 }),
  )
  // 2 · the generated code, arriving line by line
  const bx = cols[1]
  const bx2 = cols[2] - 14
  out.push(panel(bx, bx2, t.inset))
  const C = t.code
  const code = [
    [[0, 14, C.keyword], [17, 30, C.command]],
    [[8, 14, C.keyword], [25, 26, C.command], [54, 18, C.string]],
    [[8, 20, C.punct], [31, 34, C.string]],
    [[16, 26, C.keyword], [45, 22, C.command]],
    [[16, 40, C.string]],
    [[24, 18, C.number], [45, 20, C.string]],
    [[8, 12, C.punct]],
    [[0, 8, C.punct]],
  ]
  code.forEach((ln, i) => {
    const y = y0 + 12 + i * 11
    const segs = ln.map(([dx, len, c]) => bar(t, bx + 22 + dx, y, len, { op: 0.85, fill: c })).join('')
    out.push(fade(`<rect x="${bx + 9}" y="${y}" width="5" height="4" rx="1" fill="${t.faint}" opacity=".7"/>${segs}`, 0.4 + i * 0.1))
  })
  out.push(fade(`<rect x="${bx + 22 + 12}" y="${y0 + 12 + 8 * 11 - 3}" width="1.6" height="10" fill="${t.terra}"/>`, 1.2))
  // 3 · the rendered component, in a sandboxed frame
  const cx = cols[2]
  out.push(panel(cx, R), `<path d="M${cx} ${y0 + 15}H${R}" stroke="${t.fg}" stroke-opacity=".22"/>`, ...[0, 1, 2].map((i) => `<circle cx="${cx + 9 + i * 7}" cy="${y0 + 7.5}" r="2" fill="${t.faint}"/>`))
  const kx = cx + 12
  const kw = R - cx - 24
  const ky = y0 + 27
  const card = [
    `<rect x="${kx}" y="${ky}" width="${kw}" height="70" rx="5" fill="${t.surfaceTop}" stroke="${t.fg}" stroke-opacity=".3"/>`,
    `<circle cx="${kx + 15}" cy="${ky + 15}" r="7" fill="${t.terraFill}"/>`,
    bar(t, kx + 28, ky + 10, kw - 50, { op: 0.6, h: 4.5 }),
    bar(t, kx + 28, ky + 19, kw - 64, { op: 0.25 }),
    bar(t, kx + 9, ky + 34, kw - 18, { op: 0.18 }),
    bar(t, kx + 9, ky + 42, kw - 34, { op: 0.18 }),
    `<rect x="${kx + 9}" y="${ky + 53}" width="40" height="10" rx="5" fill="${t.ink}"/>`,
    bar(t, kx + 54, ky + 56, 22, { op: 0.25 }),
  ]
  out.push(fade(card.join(''), 1.25))
  for (const [x1, x2] of [[ax2, bx], [bx2, cx]]) out.push(`<path d="M${x1 + 2} ${mid}H${x2 - 3}${arrowHead(x2 - 3, mid)}" fill="none" stroke="${t.terra}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`)
  d.add(out.join(''))
  d.add(stepRow(d, w.pipeline.map((s, i) => ({ step: s.step, tool: BUILDER_TOOLS[i] })), { cols, y: 244, anchors: [y0 + ph, y0 + ph, y0 + ph] }))
}

// ── Fig. 6 · AI Support Agent ──────────────────────────────────────────────
// One inbound query → the agent classifies it → resolved, or escalated with context.

function figAgent(d, w) {
  const t = d.t
  const lines = []
  const out = []
  const cy = DRAW_TOP + 62 // the routing line
  // the inbound message
  const mx = P
  const mw = 80
  const mh = 54
  const my = cy - mh / 2
  out.push(
    fade(
      [
        `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="5" fill="${t.surfaceRaised}" ${INK(t)}/>`,
        `<path d="M${mx + 1} ${my + 3}L${mx + mw / 2} ${my + 27}L${mx + mw - 1} ${my + 3}" fill="none" stroke="${t.fg}" stroke-opacity=".35" stroke-linejoin="round"/>`,
        bar(t, mx + 10, my + 36, mw - 32),
        bar(t, mx + 10, my + 44, mw - 44),
        d.text('Inbound query', { x: mx, y: my - 9, font: 'sans-600', size: 13, fill: t.fg }),
      ].join(''),
      0.1,
    ),
  )
  // the agent
  const ax = 178
  const ar = 25
  lines.push(inkPath(d, `M${mx + mw} ${cy}H${ax - ar}${arrowHead(ax - ar, cy)}`, { len: ax - ar - mx - mw + 12, stroke: t.fg, width: 1.15, delay: 0.3, dur: 0.3 }))
  out.push(
    `<circle cx="${ax}" cy="${cy}" r="${ar}" fill="${t.surfaceRaised}" ${INK(t)}/>`,
    `<circle cx="${ax}" cy="${cy}" r="${ar - 5}" fill="none" stroke="${t.fg}" stroke-opacity=".22" stroke-dasharray="2 3"/>`,
    d.icon('bot', { x: ax - 11, y: cy - 11.5, size: 22, color: t.fg, stroke: 1.6 }),
  )
  const tagStyle = { h: 21, font: 'mono-500', size: DATA, padX: 6, r: 3, fg: t.ink, bg: 'none', border: t.ink }
  const cw = ['intent', 'urgency'].map((s) => d.pill(s, tagStyle).w)
  const chipsX = ax - (cw[0] + 5 + cw[1]) / 2
  const chips = [d.pill('intent', { ...tagStyle, x: chipsX, y: cy + ar + 42 }), d.pill('urgency', { ...tagStyle, x: chipsX + cw[0] + 5, y: cy + ar + 42 })]
  const sx = ax - (25 + d.measure(w.pipeline[0].step, { font: 'sans-600', size: 13 })) / 2
  out.push(fade(stepLabel(d, sx, cy + ar + 22, 1, w.pipeline[0].step) + chips.map((c) => c.svg).join(''), 0.55))
  // two branches
  const jx = ax + ar
  const ex = 258
  const ends = [
    { y: DRAW_TOP + 12, n: 2, sub: ['auto-reply,', 'logged to the CRM'] },
    { y: DRAW_TOP + 112, n: 3, sub: ['human review,', 'context pre-drafted'] },
  ]
  ends.forEach((e, i) => {
    lines.push(inkPath(d, `M${jx} ${cy}C${jx + 26} ${cy} ${ex - 36} ${e.y} ${ex - 10} ${e.y}`, { len: 120, stroke: t.fg, width: 1.15, delay: 0.75 + i * 0.15, dur: 0.45 }))
    const g = [stepLabel(d, ex - 9.5, e.y, e.n, w.pipeline[e.n - 1].step)]
    e.sub.forEach((s, k) => {
      g.push(d.text(s, { x: ex + 15.5, y: e.y + 22 + k * 16, font: 'sans-400', size: 12, fill: t.muted }))
      assertFits('agent sub', ex + 15.5 + d.measure(s, { font: 'sans-400', size: 12 }), R)
    })
    out.push(fade(g.join(''), 1.05 + i * 0.15))
  })
  out.push(`<circle cx="${jx}" cy="${cy}" r="2.4" fill="${t.fg}"/>`)
  d.add(lines.join(''), out.join(''))
}

// ── Fig. 7 · MealMind ──────────────────────────────────────────────────────
// Pay → confirm → one Firestore write, fanning out to the three apps, with
// the whole trip measured like a dimension line: under a second.

const MM_SUBS = ['Razorpay', 'webhook → Cloud Function', 'one Firestore write']

function figMealMind(d, w) {
  const t = d.t
  const out = []
  const lines = []
  const nx = P + 12.5
  const top = DRAW_TOP + 14
  const gap = 46
  const nodes = w.pipeline.map((s, i) => ({ y: top + i * gap, icon: ['indian-rupee', 'webhook', 'database'][i], step: s.step, sub: MM_SUBS[i] }))
  nodes.forEach((n, i) => {
    if (i) lines.push(inkPath(d, `M${nx} ${nodes[i - 1].y + 12.5}V${n.y - 12.5}`, { len: gap - 25, stroke: t.fg, width: 1.15, delay: 0.25 + i * 0.2, dur: 0.25 }))
    out.push(
      fade(
        [
          `<circle cx="${nx}" cy="${n.y}" r="12.5" fill="${t.surfaceRaised}" ${INK(t)}/>`,
          d.icon(n.icon, { x: nx - 7, y: n.y - 7, size: 14, color: i === 0 ? t.terra : t.fg, stroke: 1.8 }),
          d.text(n.step, { x: nx + 21, y: n.y - 1.5, font: 'sans-600', size: 13, fill: t.fg }),
          d.text(n.sub, { x: nx + 21, y: n.y + 14.5, font: 'sans-400', size: 12, fill: t.muted }),
        ].join(''),
        0.1 + i * 0.2,
      ),
    )
  })
  // three phones on one bus from the single write
  const pw = 42
  const pg = 14
  const phH = 92
  const px0 = R - 3 * pw - 2 * pg
  for (const n of nodes) assertFits('mealmind chain label', nx + 21 + d.measure(n.sub, { font: 'sans-400', size: 12 }), px0 - 12)
  const py = DRAW_TOP + 16
  const busY = nodes[2].y + 30
  const apps = ['Customer', 'Chef', 'Admin']
  lines.push(inkPath(d, `M${nx} ${nodes[2].y + 12.5}V${busY - 6}Q${nx} ${busY} ${nx + 6} ${busY}H${R - pw / 2}`, { len: 380, stroke: t.fg, width: 1.15, delay: 0.85, dur: 0.6 }))
  apps.forEach((label, i) => {
    const x = px0 + i * (pw + pg)
    const mid = x + pw / 2
    lines.push(inkPath(d, `M${mid} ${busY}V${py + phH}`, { len: busY - py - phH, stroke: t.fg, width: 1.15, delay: 1.3 + i * 0.08, dur: 0.2 }))
    const s = [
      `<rect x="${x}" y="${py}" width="${pw}" height="${phH}" rx="7" fill="${t.surfaceRaised}" ${INK(t)}/>`,
      `<rect x="${mid - 6}" y="${py + 4}" width="12" height="3" rx="1.5" fill="${t.fg}" opacity=".35"/>`,
      d.text(label, { x: mid, y: py - 7, font: 'sans-600', size: 12, fill: t.fg, anchor: 'middle' }),
    ]
    const ux = x + 7
    const uw = pw - 14
    if (i === 0) {
      // the customer: payment confirmed
      s.push(d.icon('circle-check', { x: mid - 9, y: py + 18, size: 18, color: t.ink, stroke: 1.8 }), bar(t, ux, py + 47, uw), bar(t, ux + 4, py + 55, uw - 8), `<rect x="${ux}" y="${py + 70}" width="${uw}" height="10" rx="5" fill="${t.terraFill}"/>`)
    } else if (i === 1) {
      // the chef: the order lands on the kitchen screen
      s.push(d.icon('chef-hat', { x: mid - 8, y: py + 14, size: 16, color: t.fg, stroke: 1.7 }))
      for (let k = 0; k < 3; k++) s.push(`<rect x="${ux}" y="${py + 40 + k * 15}" width="${uw}" height="11" rx="2" fill="${k ? t.inset : 'none'}"${k ? '' : ` stroke="${t.terra}"`}/>`, bar(t, ux + 4, py + 43.5 + k * 15, uw - 12 - k * 3, { op: k ? 0.2 : 0.5, fill: k ? t.fg : t.terra }))
    } else {
      // the admin: the dashboard ticks up
      ;[12, 20, 15, 26].forEach((h, k) => s.push(`<rect x="${ux + k * 8}" y="${py + 46 - h}" width="5" height="${h}" rx="1" fill="${t.ink}" opacity="${k === 3 ? 1 : 0.45}"/>`))
      s.push(`<path d="M${ux - 1} ${py + 47.5}H${ux + uw}" stroke="${t.fg}" stroke-opacity=".3"/>`, bar(t, ux, py + 57, uw), bar(t, ux, py + 65, uw - 8), bar(t, ux, py + 73, uw - 4))
    }
    out.push(fade(s.join(''), 0.2 + i * 0.12))
    out.push(`<circle cx="${mid}" cy="${busY}" r="2.4" fill="${t.fg}"/>`)
  })
  // the dimension line: payment → every screen, under a second
  const dy = DRAW_BOT - 7
  const x1 = nx
  const x2 = R - pw / 2
  // Instrument Serif's "<" is too light at this size: the sign is set in Instrument Sans
  const segs = [{ text: '<', font: 'sans-400', size: 17, after: 4 }, { text: '1 s', font: 'serif-400i', size: 22 }]
  const lw = segs.reduce((a, g) => a + d.measure(g.text, { font: g.font, size: g.size }) + (g.after || 0), 0)
  const lx = (x1 + x2) / 2 - lw / 2
  out.push(
    `<path d="M${x1} ${dy - 5}v10M${x2} ${dy - 5}v10M${x1} ${dy}H${r1(lx - 9)}M${r1(lx + lw + 9)} ${dy}H${x2}${arrowHead(x1, dy, -1)}${arrowHead(x2, dy)}" fill="none" stroke="${t.terra}" stroke-width="1" stroke-linejoin="round"/>`,
    `<g class="stamp">${runs(d, segs, { x: lx, y: dy + 6.5, size: 22, fill: t.terra }).svg}</g>`,
  )
  d.add(lines.join(''), out.join(''))
}

// ── the feature card ───────────────────────────────────────────────────────

// Footer notes say something the card does not already say (PixelProof's
// comes from content.mjs `highlights`); a card without a link prints the
// second half of its `kind` (the rubric carries the first half).
const FEATURES = [
  { key: 'pixelproof', fig: 3, caption: 'How a scan works', draw: figPixelProof, mark: 'Is this image real?', note: 'the whole page in one click' },
  { key: 'modvigil', fig: 4, caption: 'What it automates', draw: figModVigil, mark: 'second pair of eyes', note: 'read the source' },
  { key: 'builder', fig: 5, caption: 'From prompt to preview', draw: figBuilder, mark: 'plain English', note: 'read the source' },
  { key: 'agent', fig: 6, caption: 'How a query is routed', draw: figAgent, mark: 'with context', rubric: 'Support automation', note: 'function calling' },
  { key: 'mealmind', fig: 7, caption: 'One payment, every screen', draw: figMealMind, figAlt: ' — reaching the customer, chef and admin apps in under a second', mark: 'under a second', rubric: 'Restaurant ecosystem', note: '3 Flutter apps, one Firebase backend' },
]

const linkLabel = (href) => href.replace(/^https?:\/\//, '').replace(/\/$/, '')
// printed label: a GitHub repo reads as its path ("harshbhx/modvigil"), the note says "read the source"
const footLabel = (href) => linkLabel(href).replace(/^github\.com\//, '')
// "No." is reserved for the issue's sections (No. 1–5); features count within No. 2
const ordinal = (no) => `${no} of ${FEATURES.length}`

function featureAlt(f, w, no) {
  const parts = [`Feature ${ordinal(no)}: ${w.name} — ${w.kind}. Status: built${w.event ? ` ${w.eventPhrase || `for ${w.event}`}` : ''}.`, w.deck, w.summary]
  if (w.pipeline) parts.push(`Fig. ${f.fig}, ${f.caption.toLowerCase()}: ${w.pipeline.map((s, i) => `${i + 1}. ${s.step} — ${s.tool}`).join('; ')}${f.figAlt || ''}.`)
  if (w.rules) parts.push(`Fig. ${f.fig}, ${f.caption.toLowerCase()}: ${w.rules.map((r) => `${r.rule} — ${r.detail}`).join('; ')}.`)
  parts.push(`Stack: ${w.stack.join(', ')}.`)
  if (w.links[0]) parts.push(`Link: ${linkLabel(w.links[0].href)}.`)
  return parts.join(' ')
}

function renderFeature(theme, f, no) {
  const w = BY[f.key]
  const href = w.links[0]?.href
  const d = createDoc({ width: W, height: H, theme, title: `${w.name} — ${w.kind}`, desc: featureAlt(f, w, no) })
  editorial(d)
  const t = d.t
  d.add(paper(d))

  const kx = kicker(d, 'Feature', `· ${ordinal(no)}`)
  const st = status(d, w.status, { x: R, y: 25, anchor: 'end' })
  d.add(st.svg)
  assertFits('kicker', kx + 12, R - st.w)

  figHeader(d, f.fig, f.caption)
  f.draw(d, w)

  // rubric: the event in turmeric, or what kind of thing it is
  const rub = w.event || f.rubric || w.kind
  d.add(d.text(rub, { x: P, y: RUBRIC_Y, ...KICK, fill: w.event ? t.turmeric : t.muted }))
  assertFits('rubric', P + d.measure(rub, KICK), R)

  d.add(d.text(w.name, { x: P - 1.5, y: TITLE_Y, font: 'serif-400', size: 40, fill: t.fg, cls: 'fade-up' }))
  assertFits('title', P + d.measure(w.name, { font: 'serif-400', size: 40 }), R)

  const deck = setText(d, w.deck, { x: P, y: TITLE_Y + 29, width: R - P, font: 'serif-400i', size: 20, lh: 25, fill: t.fg, mark: nb(f.mark), label: `${w.key} deck` })
  d.add(`<g class="fade-up" style="animation-delay:.08s">${deck.svg}</g>`)
  const sum = setText(d, w.summary, { x: P, y: deck.last + 28, width: R - P, size: 13.5, lh: 21, label: `${w.key} summary` })
  d.add(sum.svg)

  // stack chips, set on the footer: the last row sits 20 above the footer rule
  // in every card, so the rows line up across each pair; 24 under the summary at the least
  const make = (label, p) => d.chip(label, { ...p, h: 22, size: DATA, padX: 8, r: 4 })
  const probe = d.flow(w.stack, { x: P, y: 0, width: R - P, gap: 6, rowGap: 6, make })
  const minTop = sum.last + 24
  const cy = FOOT_RULE - 20 - probe.height
  if (cy < minTop) throw new Error(`${w.key}: card too short by ${(minTop - cy).toFixed(1)}`)
  d.add(d.flow(w.stack, { x: P, y: cy, width: R - P, gap: 6, rowGap: 6, make }).svg)

  footer(d, { link: href && footLabel(href), note: f.note })
  return d.end()
}

// ── House rules ────────────────────────────────────────────────────────────

const SIGNER = PROFILE.name.split(' ')[0]
const RULES_DECK = 'Five rules I build by.'
const RULES_ALT = ['House rules — how I build.', PRINCIPLES.map((p, i) => `${i + 1}. ${p.title}: ${p.why}`).join(' '), `— ${SIGNER}, ${PROFILE.city}, India.`].join(' ')
const RULES_MARK = 'running, monitored system'

function renderRules(theme) {
  const d = createDoc({ width: W, height: H, theme, title: 'House rules — how I build', desc: RULES_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))
  kicker(d, 'Editorial', '· How I build')

  d.add(d.text('House rules', { x: P - 1.5, y: 102, font: 'serif-400', size: 44, fill: t.fg, cls: 'fade-up' }))
  d.add(d.text(RULES_DECK, { x: P, y: 132, font: 'serif-400i', size: 20, fill: t.fg, cls: 'fade-up', style: 'animation-delay:.08s' }))

  const top = 160
  const bottom = FOOT_RULE - 20
  const NX = P + 40
  const WHY = { font: 'sans-400', size: 13.5 }
  const n = PRINCIPLES.map((p) => d.wrap(tieLast(p.why), { ...WHY, width: R - NX }).length)
  // each item: pad · title cap (10.5) · title→why 20 · extra lines · descender 5 · pad
  const content = n.reduce((a, k) => a + 35.5 + (k - 1) * 20, 0)
  const pad = (bottom - top - 3 - content) / (n.length * 2)
  if (pad < 9) throw new Error(`house rules: too tight (${pad.toFixed(1)})`)
  d.add(doubleRule(d, P, R, top, { heavy: 1.2, gap: 2.5 }))
  let y = top + 3
  PRINCIPLES.forEach((p, i) => {
    const ty = y + pad + 10.5
    const g = [d.text(String(i + 1), { x: P + 1, y: ty + 9, font: 'serif-400i', size: 34, fill: t.terra }), d.text(p.title, { x: NX, y: ty, font: 'sans-600', size: 14.5, fill: t.fg })]
    const why = setText(d, p.why, { x: NX, y: ty + 20, width: R - NX, ...WHY, lh: 20, label: `rule ${i + 1}`, mark: p.why.includes(RULES_MARK) ? nb(RULES_MARK) : undefined })
    g.push(why.svg)
    d.add(fade(g.join(''), 0.2 + i * 0.1, 'fade-up'))
    y = why.last + 5 + pad
    if (i < PRINCIPLES.length - 1) d.add(hairline(d, P, R, r1(y)))
  })
  assertFits('rules height', y, bottom + 1)

  d.add(hairline(d, P, R, FOOT_RULE))
  d.add(d.text(`${PROFILE.city}, India`, { x: P, y: FOOT_Y - 1, ...KICK, fill: t.muted }))
  d.add(d.text(`— ${SIGNER}`, { x: R, y: FOOT_Y + 1, font: 'serif-400i', size: 24, fill: t.fg, anchor: 'end' }))
  return d.end()
}

export default [
  ...FEATURES.map((f, i) => ({
    name: `feature-${f.key}`,
    width: W,
    height: H,
    alt: featureAlt(f, BY[f.key], i + 1),
    ...(BY[f.key].links[0] ? { href: BY[f.key].links[0].href } : {}),
    render: (theme) => renderFeature(theme, f, i + 1),
  })),
  { name: 'house-rules', width: W, height: H, alt: RULES_ALT, render: renderRules },
]
