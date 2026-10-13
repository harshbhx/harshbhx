// Section headers: "01  Proof of work ─────────── REAL NUMBERS FROM SHIPPED SYSTEMS"
//
// Two layers in the same 850×64 box:
//  - desktop (.dt): index tile, 26px title, travelling rule, mono note. The
//    content sits low in the box (tile 23–61) so the header is visibly closer
//    to the section it introduces than to the one above it.
//  - phone (.ph, image drawn < 600px wide, ~0.41×): the note would be ~4.5px
//    and the title smaller than the card titles below it, so the note is
//    dropped (it stays in the alt text) and the tile and title are redrawn at
//    ~2× (title ≈ 22 CSS px on a phone, just above the card titles).

import { createDoc, PHONE_CSS } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { SECTIONS } from '../content.mjs'

const W = LAYOUT.full
const H = 64

const DESKTOP = { cy: 42, tile: 38, rx: 11, stroke: 1, digits: 13, title: 26, gap: 16, ruleGap: 20, rule: 1, dot: 2.5, note: true }
// title baseline = cy + cap/2 = 52 → 'j'/'y' descenders end at ~62.8 (< 64)
const PHONE = { cy: 33, tile: 56, rx: 16, stroke: 2, digits: 24, title: 54, gap: 18, ruleGap: 24, rule: 2, dot: 4.5, note: false }

function layer(d, t, s, o, ids) {
  const { cy, tile } = o
  const out = []

  // index tile with a gradient hairline border
  const inset = o.stroke / 2
  const digitCap = d.metrics('mono-700', o.digits).capHeight
  out.push(
    `<rect x="${inset}" y="${cy - tile / 2}" width="${tile}" height="${tile}" rx="${o.rx}" fill="${t.surfaceRaised}" stroke="url(#${ids.border})" stroke-width="${o.stroke}"/>`,
    d.text(s.index, { x: inset + tile / 2, y: cy + digitCap / 2, font: 'mono-700', size: o.digits, anchor: 'middle', fill: t.violet }),
  )

  // title, optically centred on the tile (cap height)
  const titleX = tile + o.gap
  const titleW = d.measure(s.title, { font: 'display-700', size: o.title })
  const titleCap = d.metrics('display-700', o.title).capHeight
  out.push(d.text(s.title, { x: titleX, y: Math.round(cy + titleCap / 2), font: 'display-700', size: o.title, fill: t.fg, cls: 'fade-up' }))

  // right-aligned note (desktop only)
  let noteW = 0
  if (o.note) {
    noteW = d.measure(s.note, { font: 'mono-500', size: 11, tracking: 0.12, upper: true })
    out.push(d.kicker(s.note, { x: W - 1, y: cy + 4, anchor: 'end', tracking: 0.12 }))
  }

  // connecting rule; on desktop a highlight travels along it
  const x1 = titleX + titleW + o.ruleGap
  const x2 = o.note ? W - noteW - 20 : W - 1
  if (x2 - x1 > 40) {
    out.push(`<rect x="${x1}" y="${cy - o.rule / 2}" width="${x2 - x1}" height="${o.rule}" fill="url(#${o.note ? ids.rule : ids.ruleFade})"/>`)
    if (o.note) {
      const travel = x2 - x1 - 60
      d.css(`@keyframes sweep{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(${Math.round(travel)}px);opacity:0}}.sweep{animation:sweep 4.5s cubic-bezier(.45,0,.25,1) infinite}`)
      out.push(`<g class="sweep"><rect x="${x1}" y="${cy - 1}" width="60" height="2" rx="1" fill="url(#${ids.spark})"/></g>`)
    }
    out.push(`<circle cx="${x1}" cy="${cy}" r="${o.dot}" fill="${t.violet}"/>`)
  }
  return out.join('')
}

function render(t, s) {
  const d = createDoc({ width: W, height: H, theme: t, title: `${s.index} — ${s.title}`, desc: s.note })
  d.css(PHONE_CSS)
  const ids = {
    border: d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 }),
    rule: d.linearGradient([[0, t.violet, 0.65], [0.6, t.violet, 0.18], [1, t.violet, 0.05]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    ruleFade: d.linearGradient([[0, t.violet, 0.65], [0.55, t.violet, 0.22], [1, t.violet, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    spark: d.linearGradient([[0, t.cyan, 0], [0.5, t.cyan, 1], [1, t.cyan, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  }
  d.add(`<g class="dt">${layer(d, t, s, DESKTOP, ids)}</g>`, `<g class="ph">${layer(d, t, s, PHONE, ids)}</g>`)
  return d.end()
}

export default Object.entries(SECTIONS).map(([key, s]) => ({
  name: `section-${key}`,
  width: W,
  height: H,
  alt: `${s.index} · ${s.title} — ${s.note}`,
  render: (t) => render(t, s),
}))
