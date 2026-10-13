// Contents tabs — five small paper pills under the masthead, each linking to
// its section anchor (README.md adds the links; see readme.mjs → PAGE).
//
// Every tab is exactly 159×44 so the five sit on one row on desktop
// (5 × 159 + 4 spaces ≈ 813 px: the row lines up with the card edges) and wrap 2-2-1 on a
// phone, where they are drawn at their own size (no phone layer needed).
// Content is left-aligned on a shared grid — number, label, then a quiet ↓ at
// the right edge — so the row reads like the contents column of a magazine.

import { createDoc } from '../lib/svg.mjs'
import { editorial, paper, assertFits } from '../lib/editorial.mjs'
import { SECTIONS } from '../content.mjs'

const W = 159
const H = 44

function render(theme, s) {
  const no = String(s.no).padStart(2, '0')
  const d = createDoc({ width: W, height: H, theme, title: `${no} ${s.tab}`, desc: `Contents: No. ${s.no}, ${s.title} — jump to the section` })
  editorial(d)
  const t = d.t
  d.add(paper(d, { r: H / 2 }))

  const base = 27.5 // shared baseline: sans cap height ≈ 10 → label centred on 22
  const x = 21
  const nw = d.measure(no, { font: 'serif-400i', size: 19 })
  d.add(d.text(no, { x, y: base, font: 'serif-400i', size: 19, fill: t.terra }))
  const lx = x + nw + 9
  d.add(d.text(s.tab, { x: lx, y: base, font: 'sans-600', size: 14, fill: t.fg }))
  const ax = W - 20
  d.add(d.text('↓', { x: ax, y: base - 0.5, font: 'sans-500', size: 13, fill: t.muted, anchor: 'end' }))
  assertFits(`tab-${s.key}`, lx + d.measure(s.tab, { font: 'sans-600', size: 14 }), ax - 20)
  return d.end()
}

export default SECTIONS.map((s) => ({
  name: `tab-${s.key}`,
  width: W,
  height: H,
  alt: `${String(s.no).padStart(2, '0')} ${s.tab} — jump to No. ${s.no}, ${s.title}`,
  render: (t) => render(t, s),
}))
