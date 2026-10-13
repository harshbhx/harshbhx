// Editorial primitives for the "Terracotta & Ink" profile: paper cards with
// grain, newspaper rules, crop marks, a marker highlighter, the portrait
// plate, status labels and small type helpers. Every component uses these so
// the page reads as one printed publication.
//
// Animation rules (see DESIGN.md): the resting, fully-drawn state is the base
// CSS state; keyframes only animate *towards* it, so static renderers and
// prefers-reduced-motion always show the finished page. No var() inside
// @keyframes (Safari), and never animate an element that has transform=.

import { readFileSync } from 'node:fs'
import { r1 } from './svg.mjs'

const PHOTOS = new URL('../photos/', import.meta.url)

export const EDITORIAL_CSS = `
@keyframes swipe{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.swipe{transform-box:fill-box;transform-origin:left center;animation:swipe .8s .55s cubic-bezier(.3,.7,.2,1) both}
@keyframes develop{from{opacity:0}to{opacity:1}}
.develop{animation:develop 1.4s .1s ease-out both}
@keyframes stamp{0%{opacity:0;transform:scale(1.3)}60%{opacity:1;transform:scale(.97)}100%{opacity:1;transform:scale(1)}}
.stamp{transform-box:fill-box;transform-origin:center;animation:stamp .6s 1.1s cubic-bezier(.2,.7,.2,1) both}
`

/** Call once per document that uses these helpers. */
export function editorial(d) {
  d.css(EDITORIAL_CSS)
}

const rgb01 = (h) => [0, 2, 4].map((i) => +(parseInt(h.replace('#', '').slice(i, i + 2), 16) / 255).toFixed(3))

/** Paper card: matte gradient, optional grain, hairline border. Draw it first. */
export function paper(d, { x = 0.5, y = 0.5, w = d.w - 1, h = d.h - 1, r = 14, grain = true, fill } = {}) {
  const t = d.t
  const gid = fill ? null : d.linearGradient([t.surfaceTop, t.surfaceBottom], { x1: 0, y1: 0, x2: 0.3, y2: 1 })
  const out = [`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${fill || `url(#${gid})`}"/>`]
  if (grain && t.grain) {
    const fid = d.uid('gr')
    const cid = d.uid('gc')
    const [R, G, B] = rgb01(t.fg)
    // ink-coloured speckle where the noise is high → paper tooth
    d.def(`<filter id="${fid}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 ${R} 0 0 0 0 ${G} 0 0 0 0 ${B} 2.2 0 0 0 -1.15"/></filter>`)
    d.def(`<clipPath id="${cid}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}"/></clipPath>`)
    out.push(`<g clip-path="url(#${cid})"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" filter="url(#${fid})" opacity="${+(t.grain * 2.4).toFixed(3)}"/></g>`)
  }
  out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="none" stroke="${t.border}"/>`)
  return out.join('')
}

/** Newspaper double rule: heavy line + hairline below it. */
export function doubleRule(d, x1, x2, y, { heavy = 1.6, gap = 3, color = d.t.rule } = {}) {
  return `<path d="M${r1(x1)} ${r1(y)}H${r1(x2)}" stroke="${color}" stroke-width="${heavy}"/><path d="M${r1(x1)} ${r1(y + heavy / 2 + gap + 0.4)}H${r1(x2)}" stroke="${color}" stroke-width=".8" opacity=".75"/>`
}

/** Single hairline rule. */
export function hairline(d, x1, x2, y, color = d.t.ruleSoft) {
  return `<path d="M${r1(x1)} ${r1(y)}H${r1(x2)}" stroke="${color}" stroke-width="1"/>`
}

/** Printer's crop marks around a rect. */
export function cropMarks(d, x, y, w, h, { len = 10, gap = 5, color = d.t.faint } = {}) {
  const p = []
  for (const [cx, sx] of [[x, -1], [x + w, 1]])
    for (const [cy, sy] of [[y, -1], [y + h, 1]]) p.push(`M${r1(cx + sx * gap)} ${r1(cy)}h${sx * len}`, `M${r1(cx)} ${r1(cy + sy * gap)}v${sy * len}`)
  return `<path d="${p.join('')}" stroke="${color}" stroke-width=".9" fill="none"/>`
}

/**
 * Marker-highlighter swash behind a phrase (slightly irregular, like a real pen).
 * (x, y, w, h) is the phrase's box; callers start it ~1.5 left of the phrase.
 */
export function highlighter(d, x, y, w, h, { color = d.t.highlighterFill, opacity = d.t.highlighterOpacity, style } = {}) {
  let path
  if (d.t.name === 'dark' && h < 18) {
    // Night edition, body text: a marker underline entirely below the
    // baseline (a band across the letters reads as struck through at 1×),
    // flush with the phrase's left edge so a mark that starts a line does
    // not poke out of the text column.
    const top = y + h * 0.8
    const hh = h * 0.24
    const k = hh * 0.18
    const x0 = x + 1.5
    path = `M${r1(x0)} ${r1(top + k)}Q${r1(x + w * 0.5)} ${r1(top - k * 0.4)} ${r1(x + w - 0.5)} ${r1(top + k * 0.3)}L${r1(x + w + 1)} ${r1(top + hh - k * 0.6)}Q${r1(x + w * 0.45)} ${r1(top + hh + k * 0.5)} ${r1(x0)} ${r1(top + hh - k * 0.2)}Z`
    opacity = 0.78
  } else {
    // On espresso a full-height swash turns muddy; at display sizes the night
    // edition uses a brighter marker stroke across the lower part instead.
    if (d.t.name === 'dark') {
      y += h * 0.58
      h *= 0.42
      opacity = 0.78
    }
    const k = h * 0.18
    path = `M${r1(x + 2)} ${r1(y + k)}Q${r1(x + w * 0.5)} ${r1(y - k * 0.4)} ${r1(x + w - 1)} ${r1(y + k * 0.3)}L${r1(x + w + 3)} ${r1(y + h - k * 0.6)}Q${r1(x + w * 0.45)} ${r1(y + h + k * 0.5)} ${r1(x - 2)} ${r1(y + h - k * 0.2)}Z`
  }
  return `<g class="swipe"${style ? ` style="${style}"` : ''}><path d="${path}" fill="${color}" opacity="${opacity}"/></g>`
}

/**
 * Harsh's portrait (4:5, terracotta backdrop) embedded as a data URI, defined
 * once per document. Returns place(x, y, w, opts) → { svg, h }.
 */
export function portrait(d) {
  const id = d.uid('pp')
  const b64 = readFileSync(new URL(`portrait-${d.t.name}.jpg`, PHOTOS)).toString('base64')
  d.def(`<image id="${id}" width="368" height="460" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${b64}"/>`)
  return (x, y, w, { r = 3, cls = 'develop', style, frame = true } = {}) => {
    const h = (w * 460) / 368
    const cid = d.uid('pc')
    d.def(`<clipPath id="${cid}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}"/></clipPath>`)
    const s = (w / 368).toFixed(4)
    const svg =
      `<g clip-path="url(#${cid})"><g class="${cls}"${style ? ` style="${style}"` : ''}><use href="#${id}" transform="translate(${r1(x)} ${r1(y)}) scale(${s})"/></g></g>` +
      (frame ? `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="none" stroke="${d.t.rule}" stroke-opacity=".18"/>` : '')
    return { svg, h }
  }
}

/**
 * Pulsing status dot (green = live / open / up). It pulses a few times, then
 * rests as a solid dot; `loop: true` keeps it pulsing (class pulse-live) for
 * the one signal that should never stop — use sparingly, see BASE_CSS.
 */
export function liveDot(d, cx, cy, r = 3.6, color = d.t.green, { loop = false } = {}) {
  return `<circle class="${loop ? 'pulse-live' : 'pulse'}" cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${color}"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${color}"/>`
}

/**
 * Honest status label in mono caps: 'live' (green dot), 'built' (ink), or any
 * other short text (terra). Returns { svg, w, h }.
 */
export function status(d, kind, { x = 0, y = 0, anchor = 'start', label } = {}) {
  const t = d.t
  const text = (label || kind).toUpperCase()
  const color = kind === 'live' ? t.green : kind === 'built' ? t.ink : t.terra
  return d.pill(text, {
    x, y, anchor, h: 22, font: 'mono-500', size: 11, tracking: 0.12, padX: 9, gap: 6, r: 4, // 11 = the kicker it sits beside
    fg: color, bg: 'none', border: color, dot: kind === 'live' ? t.green : null, pulse: kind === 'live',
  })
}

/** Text segments left to right on one baseline; returns { svg, x } (x = end). */
export function runs(d, segs, { x, y, size, font = 'sans-400', fill = d.t.fg2, tracking = 0, upper = false }) {
  let cx = x
  const out = []
  for (const s of segs) {
    const seg = typeof s === 'string' ? { text: s } : s
    const f = seg.font || font
    const sz = seg.size || size
    const tr = seg.tracking ?? tracking
    const up = seg.upper ?? upper
    out.push(d.text(seg.text, { x: cx, y, font: f, size: sz, fill: seg.fill || fill, tracking: tr, upper: up }))
    cx += d.measure(seg.text, { font: f, size: sz, tracking: tr, upper: up }) + (seg.after || 0)
  }
  return { svg: out.join(''), x: cx }
}

/** Throw during the build if something would overflow its box. */
export function assertFits(label, right, limit) {
  if (right > limit + 0.5) throw new Error(`${label} overflows: ${right.toFixed(1)} > ${limit}`)
}

/**
 * Line that draws itself in (stroke-dashoffset), with literal keyframes per
 * length so no var() is needed inside @keyframes. Returns markup for a <g>
 * wrapping the given path attributes.
 */
export function inkPath(d, pathD, { len, stroke = d.t.rule, width = 1.2, delay = 0.4, dur = 1.4, extra = '' } = {}) {
  const L = Math.ceil(len)
  const name = `ink${L}`
  d.css(`@keyframes ${name}{from{stroke-dashoffset:${L}}to{stroke-dashoffset:0}}`)
  return `<path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-dasharray="${L}" style="animation:${name} ${dur}s ${delay}s ease-out both"${extra}/>`
}
