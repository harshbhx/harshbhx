// The front page — "harshbhx · A working portfolio".
//
// A magazine cover set on matte paper: masthead bar and double rule, then a
// two-column front page — kicker, the name in the display serif, the deck
// with a highlighter swash behind the focus, the intro, and an "open to work"
// line — beside the portrait plate with printer's crop marks and a "Fig. 1"
// caption. A contents strip ("In this issue") closes the page; it is set as
// plain type because the whole image carries one link (dualmindlab.tech).
//
// Grid (desktop, 850 wide): 28 side margins — the card padding, so the text
// and the right edge line up with the cards below; text column 28–542;
// portrait column 596–822. The portrait's top edge sits on the kicker's cap
// height, and its two-line caption shares its baselines with the "open to
// work" line and the work-types line beside it.
//
// Phone (.ph, the image is drawn at ~0.41× on a 358 px column; 36 side
// margins, ≈ 15 px there, since 28 would leave only ≈ 12 px): portrait on
// the left, the name stacked at 100 units, the deck at 40, the open-to-work
// line at 30 and a role line at 28 — all ≥ 11 px on the phone.

import { createDoc, PHONE_CSS } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { editorial, paper, cropMarks, highlighter, portrait, liveDot, hairline, inkPath, runs, assertFits } from '../lib/editorial.mjs'
import { PROFILE, SECTIONS, LINKS, ARENA } from '../content.mjs'

const W = LAYOUT.full // 850
const H = 516
const P = 28 // desktop side margin = card padding (DESIGN.md)
const R = W - P
const PP = 36 // phone side margin (the layer is drawn at ~0.41×)
const PR = W - PP


/** Double rule whose two strokes draw themselves in, left to right. */
function inkRule(d, x1, x2, y, { heavy = 1.6, gap = 3, delay = 0 } = {}) {
  const len = x2 - x1
  return (
    inkPath(d, `M${x1} ${y}H${x2}`, { len, stroke: d.t.rule, width: heavy, delay, dur: 1.1 }) +
    inkPath(d, `M${x1} ${+(y + heavy / 2 + gap + 0.4).toFixed(1)}H${x2}`, { len, stroke: d.t.rule, width: heavy / 2, delay: delay + 0.12, dur: 1.1, extra: ' opacity=".75"' })
  )
}

/**
 * PROFILE.intro as rich text: the university and the company in semibold ink,
 * product names kept on one line, and the last two words tied together so
 * the paragraph never ends on an orphan.
 */
function introSegments(t) {
  const tie = (s) => s.replace(/ /g, '\u00a0')
  let text = PROFILE.intro.replace(ARENA.name, tie(ARENA.name)).replace(/ (\S+)$/, '\u00a0$1')
  const bold = [PROFILE.university, PROFILE.company]
  const segs = []
  for (const b of bold) {
    const i = text.indexOf(b)
    if (i < 0) continue
    segs.push(text.slice(0, i), { text: b, font: 'sans-600', fill: t.fg })
    text = text.slice(i + b.length)
  }
  segs.push(text)
  return segs.filter((x) => x !== '')
}

/** Deck line with the highlighter swash behind `hl` (which must sit on this line). */
function deckLine(d, { lead, hl, tail = '', x, y, size, style }) {
  const t = d.t
  const f = { font: 'serif-400i', size }
  const lw = d.measure(lead, f)
  const hw = d.measure(hl, f)
  return {
    svg:
      highlighter(d, x + lw - 3, y - size * 0.56, hw + 6, size * 0.74, { style }) +
      d.text(lead + hl + tail, { x, y, ...f, fill: t.fg }),
    w: d.measure(lead + hl + tail, f),
  }
}

function render(theme) {
  const d = createDoc({
    width: W,
    height: H,
    theme,
    title: `${PROFILE.name} — ${PROFILE.companyRole}, ${PROFILE.company}`,
    desc: ALT,
  })
  editorial(d)
  d.css(PHONE_CSS)
  const t = d.t
  const place = portrait(d) // one embedded plate, placed in both layers
  if (!PROFILE.deck.includes(PROFILE.deckHighlight)) throw new Error('masthead: PROFILE.deckHighlight is not part of PROFILE.deck')
  const [hlLead, hlTail] = PROFILE.deck.split(PROFILE.deckHighlight) // "I build " · " — and the products around them."
  d.add(paper(d))

  // ───────────────────────── desktop ─────────────────────────
  const dt = []

  // masthead bar
  const mbBase = 46
  dt.push(d.text(PROFILE.handle, { x: P - 1, y: mbBase, font: 'serif-400i', size: 30, fill: t.fg }))
  const hw = d.measure(PROFILE.handle, { font: 'serif-400i', size: 30 })
  dt.push(d.text(PROFILE.publication, { x: P + hw + 16, y: mbBase - 1, font: 'mono-500', size: 11, tracking: 0.14, upper: true, fill: t.muted }))
  const dateline = `${PROFILE.city}, India  ·  ${PROFILE.timezone}` // no date: the live colophon carries it
  dt.push(d.text(dateline, { x: R, y: mbBase - 1, font: 'mono-500', size: 11, tracking: 0.12, upper: true, fill: t.muted, anchor: 'end' }))
  dt.push(inkRule(d, P, R, 60, { delay: 0 }))

  // left column
  const KB = 101 // kicker baseline; its cap height (≈ 8.5) is the column top
  const nameSize = 84
  const NB = KB + 86
  const deckSize = 27
  const D1 = NB + 46
  const D2 = D1 + 34
  const I1 = D2 + 43
  const introLH = 23.5
  const colW = 514

  const kicker = `${PROFILE.companyRole} · ${PROFILE.company}`
  const kw = d.measure(kicker, { font: 'mono-500', size: 12, tracking: 0.14, upper: true })
  dt.push(d.text(kicker, { x: P, y: KB, font: 'mono-500', size: 12, tracking: 0.14, upper: true, fill: t.terra, cls: 'fade-in' }))
  dt.push(d.text('↗', { x: P + kw + 6, y: KB, font: 'mono-500', size: 12, fill: t.terra, cls: 'fade-in' }))

  dt.push(d.text(PROFILE.name, { x: P - 3, y: NB, font: 'serif-400', size: nameSize, fill: t.fg, cls: 'fade-up', style: 'animation-delay:.08s' }))
  const nameRight = P - 3 + d.measure(PROFILE.name, { font: 'serif-400', size: nameSize })

  const dl = deckLine(d, { lead: hlLead, hl: PROFILE.deckHighlight, tail: ' —', x: P, y: D1, size: deckSize })
  dt.push(dl.svg)
  const deck2 = hlTail.replace(/^\s*—\s*/, '')
  dt.push(d.text(deck2, { x: P, y: D2, font: 'serif-400i', size: deckSize, fill: t.fg }))
  assertFits('deck', P + dl.w, P + colW)

  const intro = d.paragraph(introSegments(t), { x: P, y: I1, width: colW - 24, font: 'sans-400', size: 15, lineHeight: introLH, fill: t.fg2 })
  dt.push(intro.svg)
  const I3 = I1 + (intro.lines - 1) * introLH

  // right column: the portrait plate. Its top edge sits on the kicker's cap
  // height; the two-line caption shares its baselines with the open-to-work
  // line and the work-types line of the text column.
  const PW = 226
  const PX = R - PW
  const PY = KB - 8.5
  const plate = place(PX, PY, PW)
  assertFits('name vs portrait', nameRight + 24, PX - 14)
  dt.push(cropMarks(d, PX, PY, PW, plate.h, { len: 9, gap: 5 }))
  dt.push(plate.svg)
  const capY = Math.round(PY + plate.h + 28) // crop marks end 14 below the plate
  const capSize = 12.5
  const figW = d.measure('Fig. 1', { font: 'serif-400i', size: 16 })
  const capX = PX + figW + 8
  const [cap1, cap2] = PROFILE.photoCaption.split(' · ') // "Harsh, Vadodara" / "IST (UTC+5:30)"
  dt.push(d.text('Fig. 1', { x: PX, y: capY, font: 'serif-400i', size: 16, fill: t.terra }))
  dt.push(d.text(cap1, { x: capX, y: capY, font: 'sans-400', size: capSize, fill: t.muted }))
  if (cap2) dt.push(d.text(cap2, { x: capX, y: capY + 24, font: 'sans-400', size: capSize, fill: t.muted }))

  // open to work
  const OB = capY // shares the caption's baseline
  assertFits('intro → open to work spacing', I3 + 38, OB)
  const TB = OB + 24
  dt.push(liveDot(d, P + 5, OB - 5.2, 3.8))
  const ow = runs(
    d,
    [
      { text: PROFILE.openTo.headline, font: 'sans-600', fill: t.fg, after: 9 },
      { text: '·', fill: t.faint, after: 9 },
      { text: PROFILE.openTo.note, font: 'sans-400', fill: t.fg2 },
    ],
    { x: P + 18, y: OB, size: 15.5 },
  )
  dt.push(ow.svg)
  const types = PROFILE.openTo.types
  const typeSegs = types.flatMap((s, i) => [...(i ? [{ text: '/', fill: t.faint, after: 10, tracking: 0 }] : []), { text: s, after: 10 }])
  const tl = runs(d, typeSegs, { x: P + 18, y: TB, size: 11, font: 'mono-500', tracking: 0.12, upper: true, fill: t.fg2 })
  dt.push(tl.svg)
  assertFits('work types', tl.x - 10, P + colW)

  // contents strip
  const ruleY = Math.max(TB, capY) + 34
  const SB = ruleY + 31
  dt.push(hairline(d, P, R, ruleY))
  const ck = 'In this issue'
  const ckw = d.measure(ck, { font: 'mono-500', size: 11, tracking: 0.14, upper: true })
  dt.push(d.text(ck, { x: P, y: SB, font: 'mono-500', size: 11, tracking: 0.14, upper: true, fill: t.muted }))
  const entries = SECTIONS.map((s) => {
    const nw = d.measure(String(s.no), { font: 'serif-400i', size: 17 })
    const tw = d.measure(s.title, { font: 'sans-400', size: 14 })
    return { s, nw, tw, w: nw + 6 + tw }
  })
  const x0 = P + ckw + 30
  const free = R - x0 - entries.reduce((a, e) => a + e.w, 0)
  const gap = free / (entries.length - 1)
  assertFits('contents strip', 32 * 4, free)
  let cx = x0
  entries.forEach((e, i) => {
    if (i) dt.push(`<path d="M${(cx - gap / 2).toFixed(1)} ${SB - 12}v15" stroke="${t.ruleSoft}"/>`)
    dt.push(d.text(String(e.s.no), { x: cx, y: SB, font: 'serif-400i', size: 17, fill: t.terra }))
    dt.push(d.text(e.s.title, { x: cx + e.nw + 6, y: SB, font: 'sans-400', size: 14, fill: t.fg2 }))
    cx += e.w + gap
  })
  assertFits('desktop height', SB + 24, H)
  d.add(`<g class="dt">${dt.join('')}</g>`)

  // ───────────────────────── phone ─────────────────────────
  const ph = []
  const pmb = 50
  ph.push(d.text(PROFILE.handle, { x: PP - 1, y: pmb, font: 'serif-400i', size: 48, fill: t.fg }))
  ph.push(d.text(`${PROFILE.city}, India · ${PROFILE.timezone.split(' ')[0]}`, { x: PR, y: pmb - 2, font: 'mono-500', size: 28, tracking: 0.06, upper: true, fill: t.muted, anchor: 'end' }))
  ph.push(inkRule(d, PP, PR, 70, { heavy: 3, gap: 5 }))

  const ppx = PP + 8
  const ppy = 106
  const ppw = 254
  const pplate = place(ppx, ppy, ppw, { r: 4 })
  ph.push(cropMarks(d, ppx, ppy, ppw, pplate.h, { len: 13, gap: 7, color: t.faint }).replace('stroke-width=".9"', 'stroke-width="1.8"'))
  ph.push(pplate.svg)
  const pBottom = ppy + pplate.h

  const RX = ppx + ppw + 40
  const pName = 100
  const n1 = ppy + 73
  const n2 = n1 + 86
  const [first, last] = PROFILE.name.split(' ')
  ph.push(d.text(first, { x: RX - 4, y: n1, font: 'serif-400', size: pName, fill: t.fg }))
  ph.push(d.text(last, { x: RX - 4, y: n2, font: 'serif-400', size: pName, fill: t.fg }))
  assertFits('phone name', RX - 4 + d.measure(last, { font: 'serif-400', size: pName }), PR)
  const pd = 40
  const pd1 = n2 + 54
  const pd2 = pd1 + 44
  ph.push(d.text(hlLead.trim(), { x: RX, y: pd1, font: 'serif-400i', size: pd, fill: t.fg }))
  const pdl = deckLine(d, { lead: '', hl: PROFILE.deckHighlight, x: RX, y: pd2, size: pd, style: 'animation-delay:.35s' })
  ph.push(pdl.svg)
  assertFits('phone deck', RX + pdl.w, PR)

  const pob = Math.round(pBottom)
  ph.push(liveDot(d, RX + 8, pob - 10.5, 7.5))
  const pow = d.measure(PROFILE.openTo.headline, { font: 'sans-600', size: 30 })
  ph.push(d.text(PROFILE.openTo.headline, { x: RX + 28, y: pob, font: 'sans-600', size: 30, fill: t.fg }))
  assertFits('phone open to work', RX + 28 + pow, PR)

  const prule = Math.round(pBottom + 28)
  ph.push(hairline(d, PP, PR, prule).replace('stroke-width="1"', 'stroke-width="2"'))
  const pl = runs(
    d,
    [
      { text: `${PROFILE.companyRole}, `, fill: t.fg2 },
      { text: PROFILE.company, font: 'sans-600', fill: t.fg, after: 12 },
      { text: '↗', font: 'sans-400', fill: t.terra, after: 16 },
      { text: '·', fill: t.faint, after: 16 },
      { text: `CS, ${PROFILE.university}`, fill: t.fg2 },
    ],
    { x: PP, y: prule + 40, size: 28, font: 'sans-400' },
  )
  ph.push(pl.svg)
  assertFits('phone role line', pl.x, PR)
  assertFits('phone height', prule + 40 + 14, H)
  d.add(`<g class="ph">${ph.join('')}</g>`)

  return d.end()
}

const ALT = [
  `${PROFILE.name} — ${PROFILE.companyRole.toLowerCase()} of ${PROFILE.company}.`,
  `“${PROFILE.deck}”`,
  PROFILE.intro,
  `${PROFILE.openTo.headline}: ${PROFILE.openTo.types.join(', ').toLowerCase()} · ${PROFILE.openTo.note}.`,
  `${PROFILE.location} · ${PROFILE.timezone}.`,
  `In this issue: ${SECTIONS.map((s) => `No. ${s.no} ${s.title}`).join(' · ')}.`,
  `Links to ${LINKS.website.value}.`,
].join(' ')

export default [
  {
    name: 'masthead',
    width: W,
    height: H,
    alt: ALT,
    href: LINKS.website.href,
    render,
  },
]
