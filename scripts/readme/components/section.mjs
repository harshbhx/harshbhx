// Section headers: "01  Proof of work ─────────── REAL NUMBERS FROM SHIPPED SYSTEMS"

import { createDoc } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { SECTIONS } from '../content.mjs'

const W = LAYOUT.full
const H = 64

function render(t, s) {
  const d = createDoc({ width: W, height: H, theme: t, title: `${s.index} — ${s.title}`, desc: s.note })
  const cy = 34

  // index tile with a gradient hairline border
  const tile = 38
  const border = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
  d.add(
    `<rect x="0.5" y="${cy - tile / 2}" width="${tile}" height="${tile}" rx="11" fill="${t.surfaceRaised}" stroke="url(#${border})"/>`,
    d.text(s.index, { x: 0.5 + tile / 2, y: cy + 4.5, font: 'mono-700', size: 13, anchor: 'middle', fill: t.violet }),
  )

  // title
  const titleX = tile + 16
  const titleW = d.measure(s.title, { font: 'display-700', size: 26 })
  d.add(d.text(s.title, { x: titleX, y: cy + 9, font: 'display-700', size: 26, fill: t.fg, cls: 'fade-up' }))

  // right-aligned note
  const noteW = d.measure(s.note, { font: 'mono-500', size: 11, tracking: 0.12, upper: true })
  d.add(d.kicker(s.note, { x: W - 1, y: cy + 4, anchor: 'end', tracking: 0.12 }))

  // connecting rule with a travelling highlight
  const x1 = titleX + titleW + 20
  const x2 = W - noteW - 20
  if (x2 - x1 > 40) {
    const rule = d.linearGradient([[0, t.violet, 0.65], [0.6, t.violet, 0.18], [1, t.violet, 0.05]], { x1: 0, y1: 0, x2: 1, y2: 0 })
    const spark = d.linearGradient([[0, t.cyan, 0], [0.5, t.cyan, 1], [1, t.cyan, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })
    const travel = x2 - x1 - 60
    d.css(`@keyframes sweep{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(${Math.round(travel)}px);opacity:0}}.sweep{animation:sweep 4.5s cubic-bezier(.45,0,.25,1) infinite}`)
    d.add(
      `<rect x="${x1}" y="${cy - 0.5}" width="${x2 - x1}" height="1" fill="url(#${rule})"/>`,
      `<g class="sweep"><rect x="${x1}" y="${cy - 1}" width="60" height="2" rx="1" fill="url(#${spark})"/></g>`,
      `<circle cx="${x1}" cy="${cy}" r="2.5" fill="${t.violet}"/>`,
    )
  }
  return d.end()
}

export default Object.entries(SECTIONS).map(([key, s]) => ({
  name: `section-${key}`,
  width: W,
  height: H,
  alt: `${s.index} · ${s.title} — ${s.note}`,
  render: (t) => render(t, s),
}))
