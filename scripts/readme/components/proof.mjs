// Proof of work: two matched bento cards (proof-a, proof-b), each one feature
// tile with an abstract illustration on top and two compact tiles below.
//
//   proof-a  traffic (feature) · payments · seo
//   proof-b  security (feature) · docs · ownership
//
// Every tile follows the same anatomy: accent icon tile + value, label,
// detail. Illustrations are abstract (no fake data or numbers).
// Accents alternate violet / cyan only; green stays reserved for the live dot.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROOF, LINKS } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 420
const P = 12 // card padding around the bento
const G = 12 // gutter between tiles
const TW = W - 2 * P // tile row width (391)
const FH = 186 // feature tile height
const SH = H - 2 * P - G - FH // small tile height (198)
const SW = (TW - G) / 2 // small tile width (189.5)
const R = 12 // tile radius

const item = Object.fromEntries(PROOF.map((p) => [p.key, p]))

// one accent per tile (DESIGN.md: violet primary, cyan secondary)
const ACCENTS = {
  violet: (t) => ({ c: t.violet, hi: t.violetSoft, glow: t.glowViolet }),
  cyan: (t) => ({ c: t.cyan, hi: t.sky, glow: t.glowCyan }),
}

// deterministic pseudo-random numbers for the illustrations
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

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

const NB = ' '
/** Splits "a → b → c" into rich runs with accent-coloured arrows; each arrow sticks to the word before it. */
const arrows = (str, fill) =>
  str
    .split(/\s*→\s*/)
    .flatMap((s, i) => (i ? [{ text: `${NB}→ `, fill }, s] : [s]))
/** Keeps a quoted phrase on one line. */
const keepQuoted = (str) => str.replace(/“([^”]+)”/g, (m) => m.replace(/ /g, NB))

// ── shared tile chrome ───────────────────────────────────────────────────────

/** Tile surface in local coords (0,0 → w,h). Returns markup; decorations go through `clip`. */
function surface(d, { w, h, acc, glow }) {
  const t = d.t
  const dark = t.name === 'dark'
  const cid = d.uid('tc')
  d.def(`<clipPath id="${cid}"><rect width="${r1(w)}" height="${h}" rx="${R}"/></clipPath>`)
  const fill = d.linearGradient(
    dark
      ? [[0, t.surfaceRaised, 0.78], [1, t.surfaceRaised, 0.42]]
      : [[0, t.surfaceRaised, 1], [1, t.surfaceRaised, 0.86]],
    { x1: 0, y1: 0, x2: 0.2, y2: 1 },
  )
  const stroke = d.linearGradient(
    [[0, acc.c, dark ? 0.55 : 0.4], [0.32, t.border, 1], [1, t.border, 1]],
    { x1: 0, y1: 0, x2: 0.55, y2: 1 },
  )
  const sheen = d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, 1], [1, t.highlight, 0]])
  const out = []
  if (!dark) {
    if (!d._shadow) {
      d._shadow = d.uid('sh')
      d.def(`<filter id="${d._shadow}" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>`)
    }
    out.push(`<rect x="4" y="6" width="${r1(w - 8)}" height="${h - 6}" rx="${R}" fill="${t.violetStrong}" opacity=".07" filter="url(#${d._shadow})"/>`)
  }
  out.push(`<rect width="${r1(w)}" height="${h}" rx="${R}" fill="url(#${fill})"/>`)
  if (glow) out.push(`<g clip-path="url(#${cid})">${d.glow(glow)}</g>`)
  out.push(`<path d="M ${R} 0.5 H ${r1(w - R)}" stroke="url(#${sheen})"/>`)
  out.push(`<rect x=".5" y=".5" width="${r1(w - 1)}" height="${h - 1}" rx="${R - 0.5}" fill="none" stroke="url(#${stroke})"/>`)
  return { svg: out.join(''), clip: cid }
}

/** Accent icon tile, top-left at (x, y). */
function iconTile(d, name, { x, y, size, acc }) {
  const t = d.t
  const dark = t.name === 'dark'
  const s = Math.round(size * 0.5)
  return (
    `<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${size - 1}" height="${size - 1}" rx="${Math.round(size * 0.3)}" fill="${acc.c}" fill-opacity="${dark ? 0.12 : 0.08}" stroke="${acc.c}" stroke-opacity="${dark ? 0.38 : 0.3}"/>` +
    d.icon(name, { x: x + (size - s) / 2, y: y + (size - s) / 2, size: s, color: acc.c, stroke: 2 })
  )
}

/** Wraps local markup into a positioned tile with a staggered entrance. */
function place(x, y, delay, inner) {
  return `<g class="fade-up" style="animation-delay:${delay}s"><g transform="translate(${r1(x)} ${r1(y)})">${inner}</g></g>`
}

/** Moving dot along an SVG path (SMIL), fading in and out at the ends. */
function packet(path, { r = 1.8, fill, dur, begin }) {
  return (
    `<circle class="packet" r="${r}" fill="${fill}" opacity="0">` +
    `<animateMotion dur="${+dur.toFixed(2)}s" begin="${+begin.toFixed(2)}s" repeatCount="indefinite" path="${path}"/>` +
    `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="${+dur.toFixed(2)}s" begin="${+begin.toFixed(2)}s" repeatCount="indefinite"/></circle>`
  )
}

// ── feature tile: illustration band on top, lockup + detail below ───────────

const FP = 18 // feature tile padding
const BAND = 40 // vertical centre of the illustration band

function featureText(d, it, acc) {
  const t = d.t
  const LH = 18
  const width = TW - FP * 2
  const lines = d.wrap(it.detail, { font: 'body-400', size: 12.5, width }).length
  const last = FH - FP - 3
  const first = last - (lines - 1) * LH
  const vb = first - 31 // value baseline
  const icon = 32
  const vx = FP + icon + 12
  const vSize = 40
  const vw = d.measure(it.value, { font: 'display-700', size: vSize })
  const lx = vx + vw + 16
  const lw = TW - FP - lx
  const lLines = d.wrap(it.label, { font: 'body-500', size: 13, width: lw }).length
  const lb = balancedWidth(d, it.label, { font: 'body-500', size: 13, width: lw })
  const label = d.paragraph(it.label, { x: lx, y: lLines > 1 ? vb - 17 : vb - 9, width: lb, font: 'body-500', size: 13, lineHeight: 17, fill: t.fg })
  const detail = d.paragraph(it.detail, { x: FP, y: first, width: balancedWidth(d, it.detail, { font: 'body-400', size: 12.5, width }), font: 'body-400', size: 12.5, lineHeight: LH, fill: t.muted })
  return [
    iconTile(d, it.icon, { x: FP, y: vb - 14 - icon / 2, size: icon, acc }),
    d.gradientText(it.value, { x: vx, y: vb, font: 'display-700', size: vSize, stops: [[0, t.fg], [0.45, t.fg], [1, acc.hi]] }),
    label.svg,
    detail.svg,
  ].join('')
}

/** Small uppercase mono label used inside illustrations (11px: the mono floor for half-width cards). */
const TAG = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }
const tag = (d, s, o) => d.text(s, { ...TAG, fill: d.t.muted, ...o })

// traffic: request dots stream in from the left, the edge absorbs them, one thin line reaches origin
function trafficArt(d, acc) {
  const t = d.t
  const dark = t.name === 'dark'
  const cy = BAND - 2
  const barW = 4
  const barH = 42
  const rand = rng(7)
  const out = []

  // origin: a quiet node at the far right
  const pill = { h: 26, padX: 9, icon: 13, gap: 6 }
  const ptw = d.measure('origin', TAG)
  const pw = pill.padX * 2 + pill.icon + pill.gap + ptw
  const px = TW - FP - pw
  const barX = px - 74 // the edge sits a short hop before the origin

  // lanes: faint tracks that brighten toward the edge
  const track = d.linearGradient([[0, acc.c, 0], [0.75, acc.c, dark ? 0.14 : 0.12], [1, acc.c, dark ? 0.34 : 0.28]])
  const lanes = [-20, -15, -10, -5, 0, 5, 10, 15, 20].map((o) => cy + o)
  for (const y of lanes) out.push(`<rect x="0" y="${y - 0.5}" width="${barX - 3}" height="1" fill="url(#${track})"/>`)

  // request dots with short motion tails, faded in from the tile edge by a mask
  const tail = d.linearGradient([[0, acc.hi, 0], [1, acc.hi, 0.85]])
  const fadeG = d.linearGradient([[0, '#fff', 0], [1, '#fff', 1]], { x1: 8, y1: 0, x2: 70, y2: 0, units: 'userSpaceOnUse' })
  const fadeM = d.uid('fm')
  d.def(`<mask id="${fadeM}" maskUnits="userSpaceOnUse" x="0" y="0" width="${barX}" height="${FH}"><rect width="${barX}" height="${FH}" fill="url(#${fadeG})"/></mask>`)
  const dots = []
  const start = -10
  const end = barX - 2
  const travel = end - start // the same for every dot, so one literal keyframe serves all of them
  for (const y of lanes) {
    const n = 2 + (rand() > 0.45 ? 1 : 0)
    for (let i = 0; i < n; i++) {
      const speed = 90 + rand() * 75 // px/s
      const dur = (end - start) / speed
      const delay = -rand() * dur
      const r = 1.3 + rand() * 0.9
      const len = 8 + rand() * 12
      const x0 = 40 + rand() * (end - 60) // resting spot (no-motion fallback)
      // drawn at the lane start; the inline transform parks it mid-lane, the running animation overrides it
      dots.push(
        `<g class="rq" style="transform:translateX(${r1(x0 - start)}px);animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s" opacity=".7">` +
          `<rect x="${r1(start - len)}" y="${r1(y - r * 0.7)}" width="${r1(len)}" height="${r1(r * 1.4)}" rx="${r1(r * 0.7)}" fill="url(#${tail})"/>` +
          `<circle cx="${start}" cy="${y}" r="${r1(r)}" fill="${acc.hi}"/></g>`,
      )
    }
  }
  d.css(`@keyframes rq{0%{transform:translateX(0)}90%{opacity:.95}100%{transform:translateX(${r1(travel)}px);opacity:0}}.rq{animation:rq 2s linear infinite}`)
  out.push(`<g mask="url(#${fadeM})">${dots.join('')}</g>`)

  // the edge: a glowing bar that absorbs everything
  const bx = barX + barW / 2
  const core = d.linearGradient([[0, acc.hi, 0.15], [0.5, acc.hi, 1], [1, acc.hi, 0.15]], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const halo = d.linearGradient([[0, acc.c, 0], [0.5, acc.c, dark ? 0.32 : 0.2], [1, acc.c, 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
  out.push(
    `<g class="breathe">${d.glow({ cx: bx, cy, r: 56, color: acc.glow })}</g>`,
    `<rect x="${bx - 7}" y="${cy - barH / 2 - 6}" width="14" height="${barH + 12}" rx="7" fill="url(#${halo})"/>`,
    `<rect x="${barX}" y="${cy - barH / 2}" width="${barW}" height="${barH}" rx="${barW / 2}" fill="url(#${core})"/>`,
    tag(d, 'edge', { x: bx, y: cy + barH / 2 + 16, anchor: 'middle' }),
  )

  // one thin line through to the origin
  const lx1 = barX + barW + 7
  const lx2 = px
  out.push(`<path d="M ${lx1} ${cy} H ${lx2}" stroke="${acc.c}" stroke-opacity=".55"/>`)
  out.push(packet(`M ${lx1} ${cy} H ${lx2 - 3}`, { r: 2, fill: acc.hi, dur: 2.4, begin: 0.6 }))
  out.push(
    `<rect x="${r1(px + 0.5)}" y="${cy - pill.h / 2 + 0.5}" width="${r1(pw - 1)}" height="${pill.h - 1}" rx="8" fill="${t.inset}" stroke="${t.borderStrong}"/>`,
    d.icon('server', { x: px + pill.padX, y: cy - pill.icon / 2, size: pill.icon, color: t.fg2, stroke: 1.8 }),
    tag(d, 'origin', { x: px + pill.padX + pill.icon + pill.gap, y: r1(cy + d.metrics(TAG.font, TAG.size).capHeight / 2), fill: t.fg2 }),
  )
  return out.join('')
}

// security: three abstract event rows feed a radar with a shield at its centre
// (no labels: the detail sentence under the lockup already names the steps)
function securityArt(d, acc) {
  const t = d.t
  const dark = t.name === 'dark'
  const cy = BAND + 1
  const rad = 27
  const cx = TW - FP - rad
  const out = []

  // connectors + event rows (drawn first, the radar sits on top of their ends)
  const rows = [58, 70, 100] // skeleton line lengths
  const gap = 19
  const wire = d.linearGradient([[0, acc.c, 0.06], [1, acc.c, dark ? 0.6 : 0.5]], { x1: 120, y1: 0, x2: cx - rad, y2: 0, units: 'userSpaceOnUse' })
  const PER = 2.7
  d.css(`@keyframes lit{0%,100%{opacity:.35}8%,40%{opacity:1}}`)
  rows.forEach((lw, i) => {
    const y = cy + (i - 1) * gap
    const sx = FP + 14 + lw + 10
    const th = Math.PI - (i - 1) * 0.26
    const ex = cx + rad * Math.cos(th)
    const ey = cy + rad * Math.sin(th)
    const path = `M ${r1(sx)} ${y} C ${r1(sx + (ex - sx) * 0.6)} ${y}, ${r1(ex + 16 * Math.cos(th))} ${r1(ey + 16 * Math.sin(th))}, ${r1(ex)} ${r1(ey)}`
    const begin = i * 0.5
    out.push(
      `<path d="${path}" fill="none" stroke="url(#${wire})"/>`,
      packet(path, { fill: acc.hi, dur: PER, begin: begin - PER }),
      `<circle cx="${FP + 3.5}" cy="${y}" r="3.2" fill="${acc.c}" style="animation:lit ${PER}s ease-in-out ${(begin - PER).toFixed(2)}s infinite"/>`,
      `<rect x="${FP + 14}" y="${y - 2}" width="${lw}" height="4" rx="2" fill="${t.fg2}" opacity="${dark ? 0.3 : 0.24}"/>`,
    )
  })

  // radar
  out.push(`<g class="breathe">${d.glow({ cx, cy, r: 66, color: acc.glow })}</g>`)
  out.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${t.inset}" fill-opacity="${dark ? 0.7 : 0.9}" stroke="${acc.c}" stroke-opacity=".5"/>`)
  for (const [r, o] of [[18.5, 0.26], [10, 0.2]]) out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${acc.c}" stroke-opacity="${o}"/>`)
  out.push(`<path d="M ${cx - rad} ${cy} H ${cx + rad} M ${cx} ${cy - rad} V ${cy + rad}" stroke="${acc.c}" stroke-opacity=".12"/>`)
  // sweep: wedge trailing the leading edge (pointing right at t=0), rotating clockwise
  const sweepDeg = 75
  const a = (-sweepDeg * Math.PI) / 180
  const sg = d.linearGradient([[0, acc.c, 0], [1, acc.c, dark ? 0.45 : 0.32]], { x1: 0, y1: 0, x2: 0.45, y2: 1 })
  const T = 4.8
  out.push(
    `<g style="transform-box:fill-box;transform-origin:center;animation:spin ${T}s linear infinite">` +
      `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none"/>` +
      `<path d="M ${cx} ${cy} L ${r1(cx + rad * Math.cos(a))} ${r1(cy + rad * Math.sin(a))} A ${rad} ${rad} 0 0 1 ${cx + rad} ${cy} Z" fill="url(#${sg})"/>` +
      `<path d="M ${cx} ${cy} H ${cx + rad - 1}" stroke="${acc.hi}" stroke-opacity=".9" stroke-width="1.2" stroke-linecap="round"/></g>`,
  )
  d.css('@keyframes spin{to{transform:rotate(360deg)}}')
  // blips flash as the sweep passes them
  d.css('@keyframes blip{0%{opacity:1}45%,100%{opacity:.15}}')
  for (const [ang, r] of [[52, 21], [148, 14.5], [236, 22.5], [318, 14]]) {
    const th = (ang * Math.PI) / 180
    const delay = (ang / 360) * T - T
    out.push(`<circle cx="${r1(cx + r * Math.cos(th))}" cy="${r1(cy + r * Math.sin(th))}" r="1.8" fill="${acc.hi}" style="animation:blip ${T}s linear ${delay.toFixed(2)}s infinite"/>`)
  }
  // shield core
  out.push(
    `<circle cx="${cx}" cy="${cy}" r="11.5" fill="${t.inset}" stroke="${acc.c}" stroke-opacity=".7"/>`,
    d.icon('shield-check', { x: cx - 7, y: cy - 7, size: 14, color: acc.c, stroke: 2 }),
  )
  return out.join('')
}

function feature(d, key, accName, art) {
  const t = d.t
  const it = item[key]
  const acc = ACCENTS[accName](t)
  const s = surface(d, { w: TW, h: FH, acc })
  // faint dot texture behind the illustration only, fading out before the text
  const tex = d.pattern({ x: 0, y: 0, w: TW, h: 84, kind: 'dots', step: 14, fade: { cx: TW - 90, cy: 12, r: 120 } })
  return s.svg + `<g clip-path="url(#${s.clip})">${tex}<g class="fade-in" style="animation-delay:.25s">${art(d, acc)}</g></g>` + featureText(d, it, acc)
}

// ── small tiles ──────────────────────────────────────────────────────────────

const SP = 16 // small tile padding
const SIW = SW - SP * 2 // small tile content width
const MOTIF_Y = 111 // centre line for mid-tile motifs

function smallHead(d, it, acc, { label = it.label } = {}) {
  const t = d.t
  const icon = 28
  const lw = balancedWidth(d, label, { font: 'body-500', size: 13, width: SIW })
  const p = d.paragraph(label, { x: SP, y: 64, width: lw, font: 'body-500', size: 13, lineHeight: 18, fill: t.fg })
  return {
    svg:
      iconTile(d, it.icon, { x: SP, y: SP, size: icon, acc }) +
      d.text(it.value, { x: SP + icon + 10, y: 40, font: 'display-700', size: 28, fill: t.fg }) +
      p.svg,
    bottom: 64 + (p.lines - 1) * 18 + 4,
  }
}

/** Detail text anchored to the bottom of a small tile. */
function smallDetail(d, content, { balance = true } = {}) {
  const LH = 17
  const lines = d.wrap(content, { font: 'body-400', size: 12, width: SIW }).length
  const last = SH - SP - 3
  const w = balance ? balancedWidth(d, content, { font: 'body-400', size: 12, width: SIW }) : SIW
  return d.paragraph(content, { x: SP, y: last - (lines - 1) * LH, width: w, font: 'body-400', size: 12, lineHeight: LH, fill: d.t.muted })
}

function small(d, key, accName, body) {
  const t = d.t
  const acc = ACCENTS[accName](t)
  const s = surface(d, { w: SW, h: SH, acc, glow: { cx: 14, cy: 14, r: 110, color: [acc.glow[0], acc.glow[1] * 0.55] } })
  return s.svg + body(d, item[key], acc)
}

// payments: Razorpay webhook → Cloud Function → Firestore → every app
function payments(d, it, acc) {
  const t = d.t
  const head = smallHead(d, it, acc)
  const y = MOTIF_Y
  const S = 24
  const xs = [SP, SP + 42, SP + 84]
  const node = (x, inner) => `<rect x="${x + 0.5}" y="${y - S / 2 + 0.5}" width="${S - 1}" height="${S - 1}" rx="7" fill="${t.inset}" stroke="${t.borderStrong}"/>` + inner
  const out = [
    `<path d="M ${xs[0] + S} ${y} H ${xs[2]}" stroke="${acc.c}" stroke-opacity=".45"/>`,
    packet(`M ${xs[0] + S} ${y} H ${xs[2]}`, { r: 2, fill: acc.hi, dur: 2.2, begin: 0.4 }),
    node(xs[0], d.logo('razorpay', { x: xs[0] + 5, y: y - 7, size: 14, color: t.fg2 })),
    node(xs[1], d.icon('cloud-cog', { x: xs[1] + 5, y: y - 7, size: 14, color: t.fg2, stroke: 1.8 })),
    node(xs[2], d.logo('firebase', { x: xs[2] + 5, y: y - 7, size: 14, color: t.fg2 })),
  ]
  // one write fans out to three apps
  const fx = xs[2] + S
  const ax = SP + SIW - 5
  ;[-10, 0, 10].forEach((o) => {
    const path = `M ${fx} ${y} C ${fx + 14} ${y}, ${ax - 16} ${y + o}, ${ax - 4} ${y + o}`
    out.push(
      `<path d="${path}" fill="none" stroke="${acc.c}" stroke-opacity=".45"/>`,
      packet(path, { r: 1.6, fill: acc.hi, dur: 2.2, begin: 1.5 }),
      `<circle cx="${ax}" cy="${y + o}" r="3.5" fill="${acc.c}" fill-opacity=".2" stroke="${acc.c}"/>`,
    )
  })
  // keep each hop of the flow readable: "Webhook → Cloud Function / → one Firestore write / every app listens to."
  const [hook, fn, rest] = it.detail.split(/\s*→\s*/)
  const restWords = rest.split(' ')
  const content = [
    hook,
    { text: `${NB}→ `, fill: acc.c },
    fn.replace(/ /g, NB) + '\n',
    { text: '→ ', fill: acc.c },
    restWords.slice(0, 3).join(' ') + '\n' + restWords.slice(3).join(' '),
  ]
  const detail = smallDetail(d, content, { balance: false })
  return head.svg + out.join('') + detail.svg
}

// seo: the site as the first result for the query (proof-a links to it). Rows sit on the same
// lines as the payments tile next to it (motif centre, then detail baselines).
function seo(d, it, acc) {
  const t = d.t
  const dark = t.name === 'dark'
  const head = smallHead(d, it, acc, { label: keepQuoted(it.label) })
  const out = []
  const rowH = 26
  const y1 = MOTIF_Y - rowH / 2
  // #1 result: the site itself
  out.push(
    `<rect x="${SP + 0.5}" y="${y1 + 0.5}" width="${SIW - 1}" height="${rowH - 1}" rx="8" fill="${acc.c}" fill-opacity="${dark ? 0.1 : 0.06}" stroke="${acc.c}" stroke-opacity="${dark ? 0.45 : 0.35}"/>`,
    d.icon('globe', { x: SP + 9, y: MOTIF_Y - 6.5, size: 13, color: acc.c, stroke: 1.9 }),
    d.text(it.detail, { x: SP + 28, y: MOTIF_Y + 4.3, font: 'body-500', size: 12, fill: t.fg }),
    d.icon('arrow-up-right', { x: SP + SIW - 9 - 12, y: MOTIF_Y - 6, size: 12, color: acc.c, stroke: 2 }),
  )
  // the rest of the results page: abstract, receding, on the detail baselines
  const last = SH - SP - 3
  ;[[0.72, 0.6], [0.56, 0.4], [0.64, 0.22]].forEach(([wf, o], i) => {
    const cy = last - (2 - i) * 17 - 4
    out.push(
      `<g opacity="${o}"><circle cx="${SP + 15.5}" cy="${cy}" r="3" fill="none" stroke="${t.faint}"/>` +
        `<rect x="${SP + 28}" y="${cy - 2}" width="${r1((SIW - 40) * wf)}" height="4" rx="2" fill="${t.faint}" opacity=".7"/></g>`,
    )
  })
  return head.svg + out.join('')
}

// docs: published documentation site
function docs(d, it, acc) {
  const t = d.t
  const dark = t.name === 'dark'
  const head = smallHead(d, it, acc)
  const out = []
  // footer link with a live dot
  const fy = SH - SP - 3
  const lw = d.measure(it.detail, { font: 'body-500', size: 12 })
  out.push(
    `<circle class="pulse" cx="${SP + 3.5}" cy="${fy - 4.3}" r="3.5" fill="${t.green}"/><circle cx="${SP + 3.5}" cy="${fy - 4.3}" r="3.5" fill="${t.green}"/>`,
    d.text(it.detail, { x: SP + 14, y: fy, font: 'body-500', size: 12, fill: t.fg2 }),
    d.icon('arrow-up-right', { x: SP + 14 + lw + 4, y: fy - 10.5, size: 12, color: acc.c, stroke: 2 }),
  )
  // abstract docs page in a browser frame
  const top = head.bottom + 12
  const h = fy - 9 - 12 - top
  const x = SP
  const w = SIW
  const bar = (bx, by, bw, fill, op, bh = 4) => `<rect x="${r1(bx)}" y="${r1(by)}" width="${r1(bw)}" height="${bh}" rx="${bh / 2}" fill="${fill}" opacity="${op}"/>`
  out.push(
    `<rect x="${x + 0.5}" y="${top + 0.5}" width="${w - 1}" height="${h - 1}" rx="8" fill="${t.inset}" fill-opacity="${dark ? 0.8 : 1}" stroke="${t.border}"/>`,
    `<path d="M ${x + 1} ${top + 15.5} H ${x + w - 1}" stroke="${t.border}"/>`,
  )
  ;[0, 1, 2].forEach((i) => out.push(`<circle cx="${x + 9 + i * 7}" cy="${top + 8}" r="2" fill="${t.faint}" opacity=".55"/>`))
  out.push(`<rect x="${x + 36}" y="${top + 4}" width="${r1(w - 44)}" height="8" rx="4" fill="${t.border}" opacity=".8"/>`)
  out.push(`<circle cx="${x + 41}" cy="${top + 8}" r="1.8" fill="${acc.c}"/>`)
  const body = top + 16
  const sideW = 30
  out.push(`<path d="M ${x + 9 + sideW + 0.5} ${body + 7} V ${top + h - 7}" stroke="${t.border}"/>`)
  ;[0, 1, 2, 3].forEach((i) => out.push(bar(x + 9, body + 8 + i * 8, sideW - 6 - (i % 2) * 7, i === 0 ? acc.c : t.faint, i === 0 ? 0.85 : 0.4, 3)))
  const cx = x + 9 + sideW + 9
  const cw = x + w - 9 - cx
  out.push(bar(cx, body + 7, cw * 0.55, t.fg2, dark ? 0.55 : 0.45, 5))
  ;[0.95, 0.82, 0.9].forEach((f, i) => out.push(bar(cx, body + 18 + i * 8, cw * f, t.faint, 0.38, 3)))
  return head.svg + out.join('')
}

// ownership: design → code → infra → deploy → docs as a connected rail
function ownership(d, it, acc) {
  const t = d.t
  const head = smallHead(d, it, acc, { label: arrows(it.label, acc.c) })
  const y = MOTIF_Y
  const S = 24
  const icons = ['pen-tool', 'code-xml', 'server', 'rocket', 'book-open']
  const step = (SIW - S) / (icons.length - 1)
  const xs = icons.map((_, i) => SP + S / 2 + i * step)
  const line = d.linearGradient([[0, acc.c, 0.25], [1, acc.c, 0.7]])
  const out = [`<rect x="${xs[0]}" y="${y - 0.5}" width="${r1(xs[4] - xs[0])}" height="1" fill="url(#${line})"/>`]
  out.push(packet(`M ${xs[0] + S / 2} ${y} H ${r1(xs[4] - S / 2)}`, { r: 2, fill: acc.hi, dur: 3.6, begin: 0.8 }))
  icons.forEach((name, i) => {
    const last = i === icons.length - 1
    out.push(
      `<circle cx="${r1(xs[i])}" cy="${y}" r="${S / 2 - 0.5}" fill="${t.inset}" stroke="${last ? acc.c : t.borderStrong}" stroke-opacity="${last ? 0.7 : 1}"/>`,
      last ? `<circle cx="${r1(xs[i])}" cy="${y}" r="${S / 2 - 0.5}" fill="${acc.c}" fill-opacity=".14"/>` : '',
      d.icon(name, { x: xs[i] - 6.5, y: y - 6.5, size: 13, color: last ? acc.c : t.fg2, stroke: 1.9 }),
    )
  })
  const detail = smallDetail(d, it.detail)
  return head.svg + out.join('') + detail.svg
}

// ── cards ────────────────────────────────────────────────────────────────────

/** Screen readers announce "→" as "right arrow" and "·" as "dot": say them as words. */
const spoken = (s) => s.replace(/\s*→\s*/g, ' to ').replace(/\s+·\s+/g, ', ')
const altOf = (k) => {
  const it = item[k]
  return spoken(`${it.value} — ${it.label}. ${it.detail.replace(/\.?$/, '.')}`)
}

function card(t, { title, desc, feat, left, right }) {
  const d = createDoc({ width: W, height: H, theme: t, title, desc })
  d.add(d.card({ glows: [{ cx: W / 2, cy: -30, r: 260, color: [t.glowViolet[0], t.glowViolet[1] * 0.45] }] }))
  d.add(
    place(P, P, 0.05, feature(d, ...feat)),
    place(P, P + FH + G, 0.2, small(d, ...left)),
    place(P + SW + G, P + FH + G, 0.32, small(d, ...right)),
  )
  return d.end()
}

const altA = `Proof of work, part 1. ${altOf('traffic')} ${altOf('payments')} ${altOf('seo')}`
const altB = `Proof of work, part 2. ${altOf('security')} ${altOf('docs')} ${altOf('ownership')}`

export default [
  {
    name: 'proof-a',
    width: W,
    height: H,
    alt: altA,
    href: LINKS.website.href, // the only address drawn on this card (the #1 result)
    render: (t) =>
      card(t, {
        title: 'Proof of work — traffic, payments, search',
        desc: altA,
        feat: ['traffic', 'violet', trafficArt],
        left: ['payments', 'cyan', payments],
        right: ['seo', 'violet', seo],
      }),
  },
  {
    name: 'proof-b',
    width: W,
    height: H,
    alt: altB,
    href: LINKS.docs.href,
    render: (t) =>
      card(t, {
        title: 'Proof of work — security, docs, ownership',
        desc: altB,
        feat: ['security', 'cyan', securityArt],
        left: ['docs', 'violet', docs],
        right: ['ownership', 'cyan', ownership],
      }),
  },
]
