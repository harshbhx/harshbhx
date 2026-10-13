// Section headers — "No. 2  Selected work ───────── what I built, and why"
//
// Set like a magazine department head: the number in terracotta serif
// italic, the title in the display serif, a hairline running to the note
// (serif italic, muted) and the publication's double rule underneath. No
// card: the header sits on the page itself and spans the full column, so its
// rules line up with the card edges below.
//
//  desktop (.dt): number 30 · title 48 · note 18, all on one baseline.
//  phone   (.ph): the image is drawn at ~0.41×, so the number and title are
//                 redrawn at ~1.6× (title ≈ 32 px on a 358 px column) and the
//                 note is dropped — it stays in the alt text.

import { createDoc, PHONE_CSS } from '../lib/svg.mjs'
import { editorial, inkPath, runs, assertFits } from '../lib/editorial.mjs'
import { SECTIONS } from '../content.mjs'

const W = 850
const H = 96
const X0 = 2 // optical inset: the serif's side bearings make x=0 look indented anyway
const X1 = W - 2

// Instrument Serif has no arrows: set any arrow in the note in Instrument Sans.
function serifSegs(str, { fill, size }) {
  return str
    .split(/([→↗])/)
    .filter(Boolean)
    .map((s) => (/[→↗]/.test(s) ? { text: s, font: 'sans-400', size: size * 0.86, fill } : { text: s, font: 'serif-400i', size, fill }))
}

/** Double rule whose two strokes draw themselves in, left to right. */
function inkRule(d, x1, x2, y, { heavy, gap, delay }) {
  const len = x2 - x1
  return (
    inkPath(d, `M${x1} ${y}H${x2}`, { len, stroke: d.t.rule, width: heavy, delay, dur: 1.1 }) +
    inkPath(d, `M${x1} ${+(y + heavy / 2 + gap + 0.4).toFixed(1)}H${x2}`, { len, stroke: d.t.rule, width: heavy / 2, delay: delay + 0.12, dur: 1.1, extra: ' opacity=".75"' })
  )
}

function render(theme, s) {
  const d = createDoc({ width: W, height: H, theme, title: `No. ${s.no} — ${s.title}`, desc: `Section ${s.no}: ${s.title} — ${s.note}` })
  editorial(d)
  d.css(PHONE_CSS)
  const t = d.t
  const no = `No. ${s.no}`

  // ── desktop ──
  const dt = []
  {
    const base = 62 // the 'y' of "story" clears the double rule by 7
    const noSize = 30
    const tSize = 48
    const nSize = 18
    const nw = d.measure(no, { font: 'serif-400i', size: noSize })
    const tx = X0 + nw + 14
    const tw = d.measure(s.title, { font: 'serif-400', size: tSize })
    dt.push(d.text(no, { x: X0, y: base, font: 'serif-400i', size: noSize, fill: t.terra }))
    dt.push(d.text(s.title, { x: tx, y: base, font: 'serif-400', size: tSize, fill: t.fg, cls: 'fade-in' }))
    // note, right-aligned on the same baseline
    const segs = serifSegs(s.note, { fill: t.muted, size: nSize })
    const noteW = segs.reduce((a, g) => a + d.measure(g.text, { font: g.font, size: g.size }), 0)
    const nx = X1 - noteW
    dt.push(runs(d, segs, { x: nx, y: base, size: nSize }).svg)
    // hairline from the title to the note, at the note's x-height middle
    const hx1 = Math.round(tx + tw + 24)
    const hx2 = Math.round(nx - 20)
    assertFits(`section-${s.key} title + note`, hx1 + 80, hx2)
    // (the header sits on GitHub's page, not on paper: a touch stronger than ruleSoft so it survives the dark page)
    dt.push(inkPath(d, `M${hx1} ${base - 6}H${hx2}`, { len: hx2 - hx1, stroke: t.faint, width: 1, delay: 0.35, dur: 1.2, extra: ' stroke-opacity=".7"' }))
    dt.push(inkRule(d, X0, X1, 80, { heavy: 1.6, gap: 3, delay: 0.05 }))
  }
  d.add(`<g class="dt">${dt.join('')}</g>`)

  // ── phone (drawn at ~0.41×) ──
  const ph = []
  {
    const base = 64
    const noSize = 48
    const tSize = 78
    const nw = d.measure(no, { font: 'serif-400i', size: noSize })
    const tx = X0 + nw + 20
    const tw = d.measure(s.title, { font: 'serif-400', size: tSize })
    assertFits(`section-${s.key} phone title`, tx + tw, X1)
    ph.push(d.text(no, { x: X0, y: base, font: 'serif-400i', size: noSize, fill: t.terra }))
    ph.push(d.text(s.title, { x: tx, y: base, font: 'serif-400', size: tSize, fill: t.fg }))
    const hx1 = Math.round(tx + tw + 28)
    if (X1 - hx1 > 60) ph.push(`<path d="M${hx1} ${base - 13}H${X1}" stroke="${t.faint}" stroke-opacity=".7" stroke-width="2"/>`)
    ph.push(inkRule(d, X0, X1, 87.5, { heavy: 2.6, gap: 3, delay: 0.05 }))
  }
  d.add(`<g class="ph">${ph.join('')}</g>`)
  return d.end()
}

export default SECTIONS.map((s) => ({
  name: `section-${s.key}`,
  width: W,
  height: H,
  alt: `No. ${s.no} — ${s.title}: ${s.note}`,
  render: (t) => render(t, s),
}))
