// No. 1 — The Arena story: a two-page spread on DualMind Arena.
//
//   arena-story   the cover feature: kicker + LIVE, headline, deck, a drop-cap
//                 problem → approach, a newspaper box score of ARENA.proof and
//                 the "next" line. Links to the live product.
//   arena-figure  Fig. 2, "How a battle works": an exploded ink drawing of the
//                 request path (prompt → CDN → API → AI Gateway → two hidden
//                 models → vote → leaderboard) with numbered callouts, then
//                 ARENA.decisions as "why" notes keyed to those callouts.
//                 Links to the docs.
//
// Both halves share one grid — P = 28, kicker row at 40, headline baseline,
// closing serif-italic line, footer rule — so they read as facing pages.

import { createDoc, r1 } from '../lib/svg.mjs'
import { editorial, paper, doubleRule, hairline, highlighter, status, runs, assertFits, inkPath } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { ARENA, LINKS } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 680
const P = 28
const R = W - P
const HEAD_Y = 100 // headline baseline, both pages
const CLOSE_Y = 606 // last baseline of the closing italic line, both pages
const FOOT_RULE = H - 50
const FOOT_Y = H - 26

// ── shared page furniture ──────────────────────────────────────────────────

// One mono cut (500) for every kicker and data label keeps the glyph set small.
const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }

/** Kicker row: terra label + muted continuation, hairline under it. */
function kicker(d, label, rest) {
  const t = d.t
  const a = runs(d, [{ text: label, fill: t.terra, after: 8 }, { text: rest, fill: t.muted }], { x: P, y: 40, ...KICK })
  d.add(a.svg, hairline(d, P, R, 54))
  return a.x
}

/** Footer: hairline, the card's one link label, a serif-italic note on the right. */
function footer(d, link, note) {
  const t = d.t
  d.add(hairline(d, P, R, FOOT_RULE))
  const l = runs(d, [{ text: link, after: 6 }, { text: '↗' }], { x: P, y: FOOT_Y, size: 13, font: 'sans-600', fill: t.terra })
  d.add(l.svg)
  d.add(d.text(note, { x: R, y: FOOT_Y, font: 'serif-400i', size: 15, fill: t.muted, anchor: 'end' }))
  assertFits('footer', l.x + 16 + d.measure(note, { font: 'serif-400i', size: 15 }), R)
}

/**
 * Body copy with print furniture: the first `indent.lines` lines are set
 * `indent.w` narrower (drop cap / first-line indent), and the phrase `mark`
 * (kept on one line with non-breaking spaces) gets the highlighter.
 * Throws on a one-word last line (orphan). Returns { svg, height, lines }.
 */
function setText(d, segs, { x, y, width, font = 'sans-400', size = 13.5, lh = 21, fill = d.t.fg2, indent, mark, label = 'text' }) {
  let lines
  if (indent) {
    const narrow = d.wrap(segs, { font, size, width: width - indent.w, fill })
    const head = narrow.slice(0, indent.lines).map((ln) => ({ ...ln, dx: indent.w }))
    const restSegs = narrow.slice(indent.lines).flatMap((ln, i) => ln.runs.map((r, j) => ({ text: (i > 0 && j === 0 ? ' ' : '') + r.text, font: r.font, fill: r.fill })))
    lines = [...head, ...(restSegs.length ? d.wrap(restSegs, { font, size, width, fill }) : [])]
  } else lines = d.wrap(segs, { font, size, width, fill })
  const marks = []
  const text = []
  lines.forEach((ln, i) => {
    let cx = x + (ln.dx || 0)
    const by = y + i * lh
    for (const r of ln.runs) {
      if (mark && r.text.includes(mark)) {
        const pre = r.text.slice(0, r.text.indexOf(mark))
        const mx = cx + d.measure(pre, { font: r.font, size })
        const mw = d.measure(mark, { font: r.font, size })
        marks.push(highlighter(d, mx - 1.5, by - size * 0.8, mw + 1, size * 1.05))
      }
      text.push(d.text(r.text, { x: cx, y: by, font: r.font, size, fill: r.fill }))
      cx += d.measure(r.text, { font: r.font, size })
    }
    assertFits(`${label} line ${i + 1}`, cx, x + width)
  })
  if (lines.length > 1) {
    const words = lines[lines.length - 1].runs.map((r) => r.text).join('').trim().split(/\s+/).length
    if (words < 2) throw new Error(`${label}: orphan on the last line`)
  }
  return { svg: marks.join('') + text.join(''), height: lines.length * lh, lines: lines.length }
}

const nb = (s) => s.replace(/ /g, ' ')
const fadeUp = (svg, delay) => `<g class="fade-up" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`

// ── arena-story ─────────────────────────────────────────────────────────────

// Shortened wording only (content.mjs stays the source of truth).
const PROOF = ARENA.proof.map((p) => ({
  ...p,
  detail: p.detail.replace('to the account owner', 'to the owner'),
}))

const STORY_ALT = [
  `Cover story, DualMind Labs: ${ARENA.name}, live. ${ARENA.kind}.`,
  ARENA.problem,
  ARENA.approach,
  `Box score: ${ARENA.proof.map((p) => `${p.value} ${p.label} (${p.detail})`).join('; ')}.`,
  `Next: ${ARENA.next}`,
  `Visit ${ARENA.url}.`,
].join(' ')

function renderStory(theme) {
  const d = createDoc({ width: W, height: H, theme, title: `${ARENA.name} — cover story`, desc: STORY_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))

  const kx = kicker(d, 'Cover story', '· DualMind Labs')
  const live = status(d, 'live', { x: R, y: 25, anchor: 'end' })
  d.add(live.svg)
  assertFits('kicker', kx + 12, R - live.w)

  // headline + deck
  d.add(d.text(ARENA.name, { x: P - 2, y: HEAD_Y, font: 'serif-400', size: 46, fill: t.fg, cls: 'fade-up' }))
  let y = HEAD_Y + 31
  d.add(d.text(ARENA.kind, { x: P, y, font: 'serif-400i', size: 21, fill: t.fg, cls: 'fade-up', style: 'animation-delay:.08s' }))
  assertFits('deck', P + d.measure(ARENA.kind, { font: 'serif-400i', size: 21 }), R)

  // problem (two-line drop cap) → approach (first-line indent), magazine style
  y += 34
  const size = 13.5
  const lh = 21
  const cap = ARENA.problem[0]
  const capSize = (lh + d.metrics('sans-400', size).capHeight) / 0.72 // cap spans two lines
  const capW = d.measure(cap, { font: 'serif-400', size: capSize }) + 7
  d.add(d.text(cap, { x: P - 1, y: y + lh, font: 'serif-400', size: capSize, fill: t.terra }))
  const p1 = setText(d, ARENA.problem.slice(1), { x: P, y, width: R - P, size, lh, indent: { w: capW, lines: 2 }, label: 'problem' })
  d.add(p1.svg)
  y += p1.height + 4
  const mark = nb('names hidden')
  const p2 = setText(d, ARENA.approach.replace('names hidden', mark), { x: P, y, width: R - P, size, lh, indent: { w: 18, lines: 1 }, mark, label: 'approach' })
  d.add(p2.svg)
  y += p2.height - lh // last baseline

  // box score: value column sized to the widest figure
  const VAL = { font: 'serif-400', size: 31 }
  // display-size hyphens carry wide sidebearings: pull them in optically
  const value = (s, o) => runs(d, s.split(/(-)/).filter(Boolean).map((x, i, a) => ({ text: x, after: i < a.length - 1 && (x === '-' || a[i + 1] === '-') ? -2 : 0 })), { ...VAL, ...o })
  const valW = Math.max(...PROOF.map((p) => value(p.value, { x: 0, y: 0 }).x))
  const TX = P + Math.ceil(valW) + 14
  const TW = R - TX
  const isUrl = (s) => /^[\w.-]+\.[a-z]+$/.test(s)
  const labelCap = d.metrics('sans-600', 13).capHeight
  const DLH = 16.5

  // rows are laid out twice: once to measure, once with padding that lands
  // the closing line on CLOSE_Y (the figure page's caption baseline)
  const layout = (pad, draw) => {
    let yy = y + 22
    const ops = []
    ops.push(doubleRule(d, P, R, yy, { heavy: 1.2, gap: 2.5 }))
    yy += 21
    ops.push(d.text('Box score', { x: P, y: yy, ...KICK, fill: t.terra }))
    yy += 4
    PROOF.forEach((p, i) => {
      if (i) ops.push(hairline(d, P, R, yy))
      const ly = yy + pad + labelCap
      const vy = ly - labelCap + VAL.size * 0.72 // caps of value and label share a top line
      const row = [value(p.value, { x: P, y: vy, fill: t.terra }).svg, d.text(p.label, { x: TX, y: ly, font: 'sans-600', size: 13, fill: t.fg })]
      let last = ly + 17
      if (isUrl(p.detail)) row.push(d.text(p.detail, { x: TX, y: last, font: 'mono-500', size: 11.5, fill: t.muted }))
      else {
        const det = draw ? setText(d, p.detail, { x: TX, y: last, width: TW, size: 12, lh: DLH, fill: t.muted, label: `detail ${i + 1}` }) : null
        const n = draw ? det.lines : d.wrap(p.detail, { font: 'sans-400', size: 12, width: TW }).length
        if (det) row.push(det.svg)
        last += (n - 1) * DLH
      }
      if (draw) assertFits(`label ${i + 1}`, TX + d.measure(p.label, { font: 'sans-600', size: 13 }), R)
      ops.push(fadeUp(row.join(''), 0.35 + i * 0.12))
      yy = Math.max(last + 4, vy) + pad
    })
    ops.push(doubleRule(d, P, R, yy, { heavy: 1.2, gap: 2.5 }))
    return { ops, end: yy }
  }
  const nextLines = d.wrap(ARENA.next, { font: 'serif-400i', size: 16.5, width: TW }).length
  const NEXT_GAP = 30 // closing rule → first "next" baseline
  const base = layout(0, false).end
  const pad = (CLOSE_Y - (nextLines - 1) * 21 - NEXT_GAP - base) / 8
  if (pad > 20) throw new Error(`arena-story has too much air: row padding would be ${pad.toFixed(1)}`)
  if (pad < 10) throw new Error(`arena-story is too tall: row padding would be ${pad.toFixed(1)}`)
  const box = layout(pad, true)
  d.add(...box.ops)

  // what's next — set as the box score's closing row, in italics
  y = box.end + NEXT_GAP
  d.add(d.text('Next', { x: P, y: y + 1, font: 'serif-400i', size: 24, fill: t.terra }))
  d.add(setText(d, ARENA.next, { x: TX, y, width: TW, font: 'serif-400i', size: 16.5, lh: 21, fill: t.fg, label: 'next' }).svg)

  footer(d, ARENA.url, 'try a blind battle')
  return d.end()
}

// ── arena-figure ────────────────────────────────────────────────────────────

const CALLOUTS = [
  { label: 'User prompt', sub: 'one real prompt, two models' },
  { label: 'Cloudflare CDN', sub: 'absorbs traffic spikes' },
  { label: '.NET Web API', sub: 'stateless · scales out' },
  { label: 'Cloudflare AI Gateway', sub: 'rate limits · cache · logs' },
  { label: 'Model A / Model B', sub: 'identities hidden' },
  { label: 'Community vote', sub: 'on the two answers' },
  { label: 'Supabase · PostgreSQL', sub: 'the live leaderboard' },
]
// which callouts each decision explains
const WHY_REFS = [[2, 3], [4], [7]]
const WHY = ARENA.decisions.map((x) => ({ ...x, why: x.why.replace('scaling the .NET API out', 'scaling the API out').replace('logs across every', 'logs for every') }))
const CAPTION = 'Names are revealed only after the vote.'

const FIG_ALT = [
  'Fig. 2 — How a battle works, drawn as a request path:',
  CALLOUTS.map((c, i) => `${i + 1}. ${c.label} (${c.sub})`).join(' → ') + '.',
  `Why it is built this way: ${ARENA.decisions.map((x) => `${x.title} — ${x.why}`).join(' ')}`,
  CAPTION,
  `Docs: ${ARENA.docs}.`,
].join(' ')

function renderFigure(theme) {
  const d = createDoc({ width: W, height: H, theme, title: 'Fig. 2 — How a battle works', desc: FIG_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))
  kicker(d, 'Architecture', '· DualMind Arena')
  d.css('.cin{animation:fade-in .5s ease both}') // callouts: a quick fade so the figure settles by ~1.6s

  // title, set like the section heads: italic terra figure number + roman title
  const fig = runs(d, [{ text: 'Fig. 2', font: 'serif-400i', fill: t.terra, after: 11 }, { text: 'How a battle works', fill: t.fg }], { x: P - 1, y: HEAD_Y, size: 34, font: 'serif-400' })
  d.add(`<g class="fade-up">${fig.svg}</g>`)
  assertFits('fig title', fig.x, R)

  // ── the drawing: an exploded axonometric of one request ──
  const cx = 102 // spine
  const CX = 208 // callout circle centre
  const ink = t.fg
  const art = []
  const lines = []
  const anchors = []
  let delay = 0.2
  const spine = (y1, y2) => {
    lines.push(inkPath(d, `M${cx} ${r1(y1)}V${r1(y2)}`, { len: y2 - y1 + 2, stroke: ink, width: 1.15, delay, dur: 0.3 }))
    delay += 0.1
  }
  const st = `stroke="${ink}" stroke-width="1" stroke-linejoin="round"`

  /** Axonometric slab (top-face rhombus + thickness). */
  const slab = (x, y, a, b, th = 5, { top = t.surfaceRaised } = {}) => {
    art.push(
      `<path d="M${r1(x - a)} ${r1(y)}V${r1(y + th)}L${r1(x)} ${r1(y + b + th)}L${r1(x + a)} ${r1(y + th)}V${r1(y)}" fill="${t.inset}" ${st}/>`,
      `<path d="M${r1(x)} ${r1(y + b)}V${r1(y + b + th)}L${r1(x + a)} ${r1(y + th)}V${r1(y)}Z" fill="${ink}" opacity=".1"/>`,
      `<path d="M${r1(x)} ${r1(y + b)}V${r1(y + b + th)}" ${st}/>`,
      `<path d="M${r1(x - a)} ${r1(y)}L${r1(x)} ${r1(y - b)}L${r1(x + a)} ${r1(y)}L${r1(x)} ${r1(y + b)}Z" fill="${top}" ${st}/>`,
    )
    return { bottom: y + b + th, right: x + a, cy: y }
  }

  // 1 · the prompt: a speech bubble with a typed line and a caret
  const y1 = 129
  const bw = 68
  const bh = 22
  const bl = cx - bw / 2
  const br = cx + bw / 2
  const bt = y1 - bh / 2
  const bb = y1 + bh / 2
  art.push(
    `<path d="M${bl + 6} ${bt}H${br - 6}Q${br} ${bt} ${br} ${bt + 6}V${bb - 6}Q${br} ${bb} ${br - 6} ${bb}H${cx + 4}L${cx} ${bb + 6}L${cx - 4} ${bb}H${bl + 6}Q${bl} ${bb} ${bl} ${bb - 6}V${bt + 6}Q${bl} ${bt} ${bl + 6} ${bt}Z" fill="${t.surfaceRaised}" ${st}/>`,
    `<path d="M${cx - 23} ${y1}h13M${cx - 6} ${y1}h9M${cx + 7} ${y1}h12" stroke="${t.muted}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M${cx + 24} ${y1 - 5.5}v11" stroke="${t.terra}" stroke-width="1.5"/>`,
  )
  anchors.push([br, y1])
  let prev = bb + 6

  // 2 · CDN: the widest slab — spikes land here
  const s2 = slab(cx, 167, 62, 13)
  spine(prev, s2.cy)
  anchors.push([s2.right, s2.cy])
  prev = s2.bottom

  // 3 · API: a stateless slab with a dashed twin behind it (it scales out)
  const y3 = 208
  {
    // the twin: same slab, one step to the left and back, drawn in dashes
    const [gx, gy, a, b, th] = [cx - 22, y3 - 7, 42, 10.5, 5]
    const ds = `fill="none" stroke="${t.muted}" stroke-width="1" stroke-dasharray="2.5 2.5" stroke-linejoin="round"`
    art.push(
      `<path d="M${gx - a} ${gy}L${gx} ${gy - b}L${gx + a} ${gy}L${gx} ${gy + b}Z" fill="${t.inset}" opacity=".6"/>`,
      `<path d="M${gx - a} ${gy}L${gx} ${gy - b}L${gx + a} ${gy}L${gx} ${gy + b}ZM${gx - a} ${gy}v${th}L${gx} ${gy + b + th}v${-th}" ${ds}/>`,
    )
  }
  const s3 = slab(cx, y3, 42, 10.5)
  spine(prev, s3.cy)
  anchors.push([s3.right, s3.cy])
  prev = s3.bottom

  // 4 · AI Gateway: a slab with a meshed top (one checkpoint for every call)
  const mesh = d.uid('mh')
  d.def(`<pattern id="${mesh}" width="4.5" height="4.5" patternUnits="userSpaceOnUse"><circle cx="2.25" cy="2.25" r=".7" fill="${ink}" opacity=".45"/></pattern>`)
  const y4 = 248
  const s4 = slab(cx, y4, 54, 12)
  art.push(`<path d="M${cx - 54} ${y4}L${cx} ${y4 - 12}L${cx + 54} ${y4}L${cx} ${y4 + 12}Z" fill="url(#${mesh})"/>`)
  spine(prev, s4.cy)
  anchors.push([s4.right, s4.cy])
  prev = s4.bottom

  // 5 · two models, identities hidden: hatched cards masked with "?"
  const cw = 36
  const ch = 32
  const off = 27
  const cardTop = prev + 19
  const hatch = d.uid('hx')
  d.def(`<pattern id="${hatch}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="${ink}" stroke-width="1" opacity=".2"/></pattern>`)
  const forkY = prev + 5
  for (const [k, side] of [['A', -1], ['B', 1]]) {
    const mx = cx + side * off
    const x0 = mx - cw / 2
    art.push(
      `<rect x="${x0}" y="${r1(cardTop)}" width="${cw}" height="${ch}" rx="4" fill="${t.surfaceRaised}"/>`,
      `<rect x="${x0}" y="${r1(cardTop)}" width="${cw}" height="${ch}" rx="4" fill="url(#${hatch})" ${st}/>`,
      `<circle cx="${mx}" cy="${r1(cardTop + ch / 2)}" r="9.5" fill="${t.surfaceRaised}"/>`,
      d.text('?', { x: mx, y: cardTop + ch / 2 + 7, font: 'serif-400i', size: 21, fill: t.terra, anchor: 'middle' }),
      d.text(k, { x: side < 0 ? x0 - 5 : x0 + cw + 5, y: cardTop + 9, font: 'mono-500', size: 10.5, fill: t.muted, anchor: side < 0 ? 'end' : 'start' }),
    )
    lines.push(inkPath(d, `M${cx} ${r1(prev)}V${r1(forkY)}C${cx} ${r1(forkY + 8)} ${mx} ${r1(cardTop - 10)} ${mx} ${r1(cardTop)}`, { len: 60, stroke: ink, width: 1.15, delay, dur: 0.35 }))
  }
  art.push(d.text('vs', { x: cx, y: cardTop + ch / 2 + 4, font: 'serif-400i', size: 13, fill: t.muted, anchor: 'middle' }))
  delay += 0.3
  anchors.push([cx + off + cw / 2, cardTop + ch / 2])
  prev = cardTop + ch

  // 6 · the vote: a ballot box with a slip going in
  const by = prev + 27 // centre of the box's top face
  const slipTop = by - 14.4
  for (const side of [-1, 1]) lines.push(inkPath(d, `M${cx + side * off} ${r1(prev)}C${cx + side * off} ${r1(prev + 9)} ${cx} ${r1(slipTop - 9)} ${cx} ${r1(slipTop)}`, { len: 44, stroke: ink, width: 1.15, delay, dur: 0.35 }))
  delay += 0.3
  const s6 = slab(cx, by, 21, 7.5, 17)
  art.push(
    `<path d="M${cx - 8} ${r1(by + 2.9)}L${cx + 8} ${r1(by - 2.9)}" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M${cx - 6} ${r1(by + 2.2)}V${r1(by - 10)}L${cx + 6} ${r1(by - 14.4)}V${r1(by - 2.2)}Z" fill="${t.surfaceRaised}" ${st}/>`,
    `<path d="M${cx - 3} ${r1(by - 6.4)}l2 2l3.5 -4.5" fill="none" stroke="${t.terra}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  )
  anchors.push([s6.right, by + 9])
  prev = s6.bottom

  // 7 · the leaderboard: a database drum
  const dy = prev + 15
  const rx = 26
  const ry = 6.5
  const dh = 18
  art.push(
    `<path d="M${cx - rx} ${r1(dy)}V${r1(dy + dh)}A${rx} ${ry} 0 0 0 ${cx + rx} ${r1(dy + dh)}V${r1(dy)}" fill="${t.inset}" ${st}/>`,
    `<path d="M${cx - rx} ${r1(dy + dh / 2)}A${rx} ${ry} 0 0 0 ${cx + rx} ${r1(dy + dh / 2)}" fill="none" stroke="${ink}" stroke-width=".8" opacity=".55"/>`,
    `<ellipse cx="${cx}" cy="${r1(dy)}" rx="${rx}" ry="${ry}" fill="${t.surfaceRaised}" ${st}/>`,
  )
  spine(prev, dy)
  anchors.push([cx + rx, dy + dh / 2])
  const drawBottom = dy + dh + ry

  // where the request touches each element
  const landings = [s2.cy, s3.cy, s4.cy, dy].map((yy) => `<circle cx="${cx}" cy="${r1(yy)}" r="2.4" fill="${ink}"/>`).join('')

  // callouts: leader → numbered circle → label / sub (ink only, no brand marks:
  // the bold labels name the vendors; logos live in the Toolbox)
  const notes = []
  anchors.forEach(([ax, ay], i) => {
    const c = CALLOUTS[i]
    if (i && ay - anchors[i - 1][1] < 38) throw new Error(`callouts ${i} and ${i + 1} are too close`)
    lines.push(inkPath(d, `M${r1(ax + 5)} ${r1(ay)}H${CX - 10}`, { len: CX - 10 - ax, stroke: t.muted, width: 0.9, delay: 0.35 + i * 0.11, dur: 0.3 }))
    const g = [
      `<circle cx="${r1(ax + 5)}" cy="${r1(ay)}" r="1.8" fill="${t.muted}"/>`,
      `<circle cx="${CX}" cy="${r1(ay)}" r="9.5" fill="${t.surfaceRaised}" stroke="${t.terra}" stroke-width="1"/>`,
      d.text(String(i + 1), { x: CX - 0.5, y: ay + 5, font: 'serif-400i', size: 15, fill: t.terra, anchor: 'middle' }),
      d.text(c.label, { x: CX + 17, y: ay - 1.5, font: 'sans-600', size: 13, fill: t.fg }),
      d.text(c.sub, { x: CX + 17, y: ay + 14.5, font: 'sans-400', size: 12, fill: t.muted }),
    ]
    assertFits(`callout ${i + 1} label`, CX + 17 + d.measure(c.label, { font: 'sans-600', size: 13 }), R)
    assertFits(`callout ${i + 1} sub`, CX + 17 + d.measure(c.sub, { font: 'sans-400', size: 12 }), R)
    notes.push(`<g class="cin" style="animation-delay:${(0.4 + i * 0.11).toFixed(2)}s">${g.join('')}</g>`)
  })
  d.add(art.join(''), lines.join(''), landings, notes.join(''))

  // ── why notes, keyed to the callouts ──
  const NX = P + 42
  const NLH = 18
  const noteGap = 9
  const blocks = WHY.map((x) => d.wrap([{ text: x.title + '.', font: 'sans-600' }, ' ' + x.why], { font: 'sans-400', size: 12.5, width: R - NX }).length)
  const notesH = blocks.reduce((a, n) => a + (n - 1) * NLH, 0) + (blocks.length - 1) * (NLH + noteGap)
  // bottom-up from the caption so the closing lines of both pages align
  let y = CLOSE_Y - 30 - notesH // first note baseline
  const ruleY = y - 46
  if (ruleY < drawBottom + 14) throw new Error(`arena-figure is too tall: notes rule at ${ruleY.toFixed(1)}, drawing ends ${drawBottom.toFixed(1)}`)
  d.add(doubleRule(d, P, R, ruleY, { heavy: 1.2, gap: 2.5 }))
  d.add(d.text('Why it’s built this way', { x: P, y: ruleY + 21, ...KICK, fill: t.terra }))
  WHY.forEach((x, i) => {
    WHY_REFS[i].forEach((n, j) => {
      const ccx = P + 8 + j * 20
      d.add(`<circle cx="${ccx}" cy="${r1(y - 4.3)}" r="8" fill="none" stroke="${t.terra}" stroke-width="1"/>`, d.text(String(n), { x: ccx - 0.4, y: y + 0.4, font: 'serif-400i', size: 13, fill: t.terra, anchor: 'middle' }))
    })
    const p = setText(d, [{ text: x.title + '.', font: 'sans-600', fill: t.fg }, ' ' + x.why], { x: NX, y, width: R - NX, size: 12.5, lh: NLH, fill: t.fg2, label: `why ${i + 1}` })
    d.add(p.svg)
    y += p.height + noteGap
  })

  // caption, on the same baseline as the story's closing line
  d.add(d.text(CAPTION, { x: P, y: CLOSE_Y, font: 'serif-400i', size: 16.5, fill: t.fg }))
  footer(d, ARENA.docs, 'read the user docs')
  return d.end()
}

export default [
  { name: 'arena-story', width: W, height: H, alt: STORY_ALT, href: LINKS.arena.href, render: renderStory },
  { name: 'arena-figure', width: W, height: H, alt: FIG_ALT, href: LINKS.docs.href, render: renderFigure },
]
