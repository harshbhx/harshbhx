// No. 4 — The toolbox, set as the back-of-the-book index of this issue.
//
//   stack-a   AI · Build        (pair, left)
//   stack-b   Data · Run        (pair, right)
//
// Not a logo wall: each group is an index heading (serif 26, the group's note
// in serif italic), a rule, then its entries A–Z in two newspaper columns,
// read top-to-bottom like a real index. An entry is a small brand mark, the
// tool's name and — where the tool appears in this issue — dot leaders to
// the figure numbers it appears in (Fig. 2 the Arena, Figs. 3–7 the feature
// cards), so every tool points at the work that proves it. stack-b carries
// the key to those numbers in the space its shorter lists leave free.
//
// Both cards share one grid, so side by side every row sits on the same line:
//
//     40  kicker row      THE TOOLBOX · INDEX, PART 1 ………………… A–Z
//     54  hairline
//     92  group heading   AI  models, gateways, SDKs           (serif 26 · 17i)
//    104  rule
//    110  rows            28 apart; a heading block is two rows tall
//   H-50  footer rule
//   H-26  footer          entries · serif-italic note
//
// Figure references are built from content.mjs: a reference is only printed
// when the named evidence (a stack entry or a phrase of the summary) is found
// in that project's copy, so the index can never claim more than the issue
// says.

import { createDoc, r1 } from '../lib/svg.mjs'
import { editorial, paper, hairline, runs, assertFits, inkPath } from '../lib/editorial.mjs'
import { contrast } from '../lib/icons.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { STACK, ARENA, WORK } from '../content.mjs'

const W = LAYOUT.half // 415
const P = 28
const R = W - P
const KICK_Y = 40
const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }

// grid
const ROW = 28
const HEAD_BASE = 92 // first group heading baseline
const HEAD_RULE = 12 // heading baseline → its rule
const CELLS = 6 // rule → first row cell
const HEAD_BLOCK = 2 * ROW // previous rows' end → next rows' start (keeps every row on one 28-unit grid)
const GUTTER = 28
const COL_W = (R - P - GUTTER) / 2
const COLS = [P, P + COL_W + GUTTER]

const HEAD = { font: 'serif-400', size: 26 }
const NOTE = { font: 'serif-400i', size: 17 }
const LABEL = { font: 'sans-500', size: 13 }
const REF = { font: 'serif-400i', size: 15 }
const LOGO = 16
const LABEL_X = 26 // logo → label

// ── figures in this issue (mirrors arena.mjs: Fig. 2, features.mjs: Figs. 3–7) ──
const PROJECTS = [
  { key: 'arena', fig: 2, short: 'Arena', name: ARENA.name, copy: [...ARENA.stack, ARENA.kind, ARENA.approach].join(' | ') },
  ...WORK.map((w) => ({
    key: w.key,
    fig: { pixelproof: 3, modvigil: 4, builder: 5, agent: 6, mealmind: 7 }[w.key],
    short: { builder: 'Builder', agent: 'Agent' }[w.key] || w.name,
    name: w.name,
    copy: [...w.stack, w.kind, w.summary].join(' | '),
  })),
]
for (const p of PROJECTS) if (!p.fig) throw new Error(`stack: no figure number for "${p.key}"`)
const BY_KEY = Object.fromEntries(PROJECTS.map((p) => [p.key, p]))

// Where each tool appears: project → the words in that project's copy that
// show it. C# is read from ".NET Web API" and Dart from "Flutter" (the
// languages those frameworks are written in).
const EVIDENCE = {
  'AI Gateway': { arena: 'Cloudflare AI Gateway' },
  Claude: { agent: 'Claude' },
  'Cursor SDK': { builder: 'Cursor SDK' },
  Gemini: { pixelproof: 'Gemini' },
  OpenAI: { agent: 'GPT-4o' },
  'C#': { arena: '.NET Web API' },
  Dart: { mealmind: 'Flutter' },
  Flutter: { mealmind: 'Flutter' },
  JavaScript: { arena: 'Vanilla JS', pixelproof: 'Vanilla JS' },
  '.NET': { arena: '.NET Web API' },
  'Next.js': { builder: 'Next.js' },
  'Node.js': { agent: 'Node.js' },
  React: { modvigil: 'React', builder: 'React components' },
  TypeScript: { modvigil: 'TypeScript', builder: 'TypeScript' },
  Firebase: { mealmind: 'Firestore' },
  PostgreSQL: { arena: 'PostgreSQL' },
  Redis: { modvigil: 'Redis' },
  Supabase: { arena: 'Supabase', agent: 'Supabase' },
  Azure: { arena: 'Azure' },
  'Chrome MV3': { pixelproof: 'Chrome MV3' },
  Cloudflare: { arena: 'Cloudflare CDN' },
  Devvit: { modvigil: 'Devvit' },
  'GitHub Actions': { arena: 'GitHub Actions' },
}

/** Projects (sorted by figure) a tool appears in; throws if the evidence is not in the copy. */
function usedIn(label) {
  const ev = EVIDENCE[label] || {}
  return Object.entries(ev)
    .map(([key, needle]) => {
      const p = BY_KEY[key]
      if (!p) throw new Error(`stack: unknown project "${key}" for ${label}`)
      if (!p.copy.includes(needle)) throw new Error(`stack: "${needle}" not found in ${p.name}'s copy (evidence for ${label})`)
      return p
    })
    .sort((a, b) => a.fig - b.fig)
}

// Full names for the alt text where the index label is a short form.
const LONG = { 'AI Gateway': 'Cloudflare AI Gateway', Workers: 'Cloudflare Workers', Devvit: 'Reddit Devvit', Gemini: 'Google Gemini' }

// A–Z, ignoring leading punctuation (".NET" files under N, as in a printed index)
const sortKey = (s) => s.replace(/^[^A-Za-z0-9]+/, '').toLowerCase()
const entries = (g) =>
  g.items
    .map(([slug, label]) => ({ slug, label, refs: usedIn(label) }))
    .sort((a, b) => sortKey(a.label).localeCompare(sortKey(b.label)))

const CARDS = [
  { name: 'stack-a', part: 1, groups: ['AI', 'Build'] },
  { name: 'stack-b', part: 2, groups: ['Data', 'Run'] },
].map((c) => ({ ...c, groups: c.groups.map((k) => STACK.find((g) => g.group === k)).map((g) => ({ ...g, entries: entries(g) })) }))

const rowsOf = (g) => Math.ceil(g.entries.length / 2)
const rowsEnd = (card) => card.groups.reduce((y, g, i) => y + (i ? HEAD_BLOCK : 0) + rowsOf(g) * ROW, HEAD_BASE + HEAD_RULE + CELLS)
const KEY_ROWS = 2 // the key to the figure numbers needs two rows
const CONTENT_END = Math.max(...CARDS.map(rowsEnd))
// the key goes in the card whose lists end early; there must be exactly one
const KEY_CARD = CARDS.filter((c) => CONTENT_END - rowsEnd(c) >= KEY_ROWS * ROW)
if (KEY_CARD.length !== 1) throw new Error(`stack: ${KEY_CARD.length} cards have room for the figure key (need exactly one)`)
const H = CONTENT_END + 14 + 50 // rows → footer rule 14, footer as on every card
const FOOT_RULE = H - 50
const FOOT_Y = H - 26
const TOTAL = CARDS.reduce((a, c) => a + c.groups.reduce((b, g) => b + g.entries.length, 0), 0)

// ── logo colour ─────────────────────────────────────────────────────────────

// Monochrome marks: always the ink colour.
const MONO = new Set(['openai', 'cursor', 'nextdotjs'])
// Solid plates with knocked-out letters (24-unit grid): a backing shape fills
// the cut-outs so the letters read in the official colour on both papers.
const PLATE = {
  javascript: { x: 1, y: 1, w: 22, h: 22, r: 0, ink: 'dark' },
  typescript: { x: 1, y: 1, w: 22, h: 22, r: 1, ink: 'light' },
  csharp: { x: 5, y: 7, w: 14, h: 10, r: 0, ink: 'light' },
}
// Wordmarks set the way the brand sets its own app icon: knocked out of a
// brand-coloured rounded square ([x, y, w, h] = the mark's box on the 24 grid).
const TILE = { dotnet: { box: [0, 7.53, 24, 8.81], fit: 0.74, r: 3.5 } }
// Optical size: wide marks and hairline marks look smaller than solid squares.
const OPTICAL = { cloudflare: 1.15, postgresql: 1.06 }

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const mix = (a, b, k) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k))

/** Brand colour, deepened (paper) or lifted (espresso) just enough to read; ink for marks that vanish. */
function logoColor(d, slug) {
  const t = d.t
  const b = d.brand(slug).hex
  if (MONO.has(slug)) return t.fg
  if (PLATE[slug]) return b
  const on = mix(t.surfaceTop, t.surfaceBottom, 0.5)
  const target = 3
  const c0 = contrast(b, on)
  if (c0 >= target) return b
  if (c0 < 1.6 && t.name === 'dark') return t.fg
  const toward = t.fg // cream on espresso (lifts), ink on paper (deepens)
  for (let k = 0.05; k < 1; k += 0.05) {
    const c = mix(b, toward, k)
    if (contrast(c, on) >= target) return c
  }
  return t.fg
}

/** Brand mark centred on (cx, cy), LOGO units (optically adjusted), with its plate backing. */
function mark(d, slug, cx, cy) {
  const t = d.t
  const size = LOGO * (OPTICAL[slug] || 1)
  const x = cx - size / 2
  const y = cy - size / 2
  const k = size / 24
  if (TILE[slug]) {
    const { box: [bx, by, bw, bh], fit, r } = TILE[slug]
    const s = (size * fit) / bw
    const tx = x + (size - bw * s) / 2 - bx * s
    const ty = y + (size - bh * s) / 2 - by * s
    return `<rect x="${r1(x)}" y="${r1(y)}" width="${size}" height="${size}" rx="${r}" fill="${d.brand(slug).hex}"/>` + `<path transform="translate(${r1(tx)} ${r1(ty)}) scale(${s.toFixed(4)})" fill="${t.name === 'dark' ? t.fg : t.surfaceTop}" d="${d.brand(slug).path}"/>`
  }
  const p = PLATE[slug]
  const ink = p && (p.ink === 'light' ? t.surfaceTop : t.name === 'dark' ? t.inset : t.fg)
  const inkFill = p && p.ink === 'light' && t.name === 'dark' ? t.fg : ink
  const back = p ? `<rect x="${r1(x + p.x * k)}" y="${r1(y + p.y * k)}" width="${r1(p.w * k)}" height="${r1(p.h * k)}"${p.r ? ` rx="${r1(p.r * k)}"` : ''} fill="${inkFill}"/>` : ''
  return back + d.logo(slug, { x, y, size, color: logoColor(d, slug) })
}

// ── drawing ─────────────────────────────────────────────────────────────────

const fade = (svg, delay, cls = 'ix') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`
const cap = (d, f) => d.metrics(f.font, f.size).capHeight

/** One entry: mark · name · dot leaders · figure numbers (right-aligned to the column). */
function entry(d, e, x, cellTop, label) {
  const t = d.t
  const cy = cellTop + ROW / 2
  const base = cy + cap(d, LABEL) / 2
  const out = [mark(d, e.slug, x + LOGO / 2, cy)]
  out.push(d.text(e.label, { x: x + LABEL_X, y: base, ...LABEL, fill: t.fg }))
  const lx = x + LABEL_X + d.measure(e.label, LABEL)
  const right = x + COL_W
  if (e.refs.length) {
    const refs = e.refs.map((p) => p.fig).join(', ')
    const rw = d.measure(refs, REF)
    out.push(d.text(refs, { x: right, y: base, ...REF, fill: t.terra, anchor: 'end' }))
    const a = Math.ceil(lx + 7)
    const b = Math.floor(right - rw - 6)
    assertFits(`${label}: leaders`, a + 8, b)
    out.push(`<path d="M${a} ${r1(base - 0.5)}H${b}" stroke="${t.faint}" stroke-width="1.15" stroke-linecap="round" stroke-dasharray="0 4"/>`)
  } else assertFits(label, lx, right)
  return out.join('')
}

function group(d, g, base, gi, card) {
  const t = d.t
  const head = runs(d, [{ text: g.group, ...HEAD, fill: t.fg, after: 12 }, { text: g.note, ...NOTE, fill: t.muted }], { x: P - 1, y: base, size: HEAD.size })
  // column header over the figure numbers, like the head of a table
  const FIG = { font: 'serif-400i', size: 15 }
  d.add(fade(d.text('fig.', { x: R, y: base, ...FIG, fill: t.muted, anchor: 'end' }), 0.1 + gi * 0.3))
  assertFits(`${card.name} ${g.group} heading`, head.x + 16, R - d.measure('fig.', FIG))
  const rule = base + HEAD_RULE
  const d0 = 0.1 + gi * 0.3
  d.add(fade(head.svg, d0, 'fade-up'))
  d.add(inkPath(d, `M${P} ${rule}H${R}`, { len: R - P, stroke: t.rule, width: 1, delay: d0 + 0.05, dur: 0.9, extra: ' stroke-opacity=".55"' }))
  const cells = rule + CELLS
  const n = rowsOf(g)
  // column rule between the two columns of this group
  const mx = P + COL_W + GUTTER / 2
  d.add(fade(`<path d="M${r1(mx)} ${cells + 6}V${cells + n * ROW - 6}" stroke="${t.ruleSoft}"/>`, d0 + 0.2))
  g.entries.forEach((e, i) => {
    const col = Math.floor(i / n)
    const row = i % n
    d.add(fade(entry(d, e, COLS[col], cells + row * ROW, `${card.name} ${e.label}`), d0 + 0.15 + (col * n + row) * 0.035))
  })
  return cells + n * ROW
}

/** Key to the figure numbers (stack-b, in the rows its shorter lists leave free). */
function key(d, top) {
  const t = d.t
  const used = PROJECTS.filter((p) => CARDS.some((c) => c.groups.some((g) => g.entries.some((e) => e.refs.includes(p)))))
  const b1 = top + 6 + ROW - 6
  const b2 = b1 + 21
  const NAME = { font: 'sans-500', size: 12.5 }
  const LAB = { font: 'serif-400i', size: 15 }
  const T0 = 0.85 // after the last index row has landed
  const out = [hairline(d, P, R, top + 6)]
  // label column: "Figures / in this issue"
  out.push(d.text('Figures', { x: P, y: b1, ...LAB, fill: t.fg }), d.text('in this issue', { x: P, y: b2, ...LAB, fill: t.muted }))
  // three columns (2/5, 3/6, 4/7): the middle one starts on the index's right
  // column, the last one ends on the figure numbers' edge, and the gap between
  // columns is the same twice over
  const per = Math.ceil(used.length / 2)
  if (per !== 3) throw new Error(`stack key: laid out for 3 columns, got ${per}`)
  const segs = (p) => [{ text: String(p.fig), ...REF, fill: t.terra, after: 6 }, { text: p.short, ...NAME, fill: t.fg2 }]
  const wOf = (p) => d.measure(String(p.fig), REF) + 6 + d.measure(p.short, NAME)
  const colW = [0, 1, 2].map((c) => Math.max(...used.filter((_, i) => i % per === c).map(wOf)))
  const x1 = COLS[1]
  const x2 = R - colW[2]
  const gap = x2 - (x1 + colW[1])
  const x0 = x1 - gap - colW[0]
  const xs = [x0, x1, x2]
  if (gap < 14) throw new Error(`stack key: columns too tight (${gap.toFixed(1)})`)
  assertFits('key label', P + d.measure('in this issue', LAB) + 16, x0)
  used.forEach((p, i) => {
    out.push(runs(d, segs(p), { x: xs[i % per], y: i < per ? b1 : b2, size: NAME.size }).svg)
  })
  d.add(fade(out.join(''), T0))
  return used
}

function render(theme, card) {
  const d = createDoc({ width: W, height: H, theme, title: `The toolbox — index, part ${card.part}: ${card.groups.map((g) => g.group).join(' and ')}`, desc: alt(card) })
  editorial(d)
  d.css('.ix{animation:fade-in .5s ease both}')
  const t = d.t
  d.add(paper(d))

  // kicker row
  const k = runs(d, [{ text: 'The toolbox', fill: t.terra, after: 8 }, { text: `· Index, part ${card.part}`, fill: t.muted }], { x: P, y: KICK_Y, ...KICK })
  d.add(k.svg)
  d.add(d.text('A–Z', { x: R, y: KICK_Y, ...KICK, fill: t.muted, anchor: 'end' }))
  assertFits('kicker', k.x + 16, R - d.measure('A–Z', KICK))
  d.add(hairline(d, P, R, 54))

  let y = HEAD_BASE
  let end = 0
  card.groups.forEach((g, gi) => {
    end = group(d, g, y, gi, card)
    y = end + HEAD_BLOCK - CELLS - HEAD_RULE
  })
  if (card === KEY_CARD[0]) key(d, end)

  // footer
  const n = card.groups.reduce((a, g) => a + g.entries.length, 0)
  d.add(hairline(d, P, R, FOOT_RULE))
  d.add(d.text(`${n} entries`, { x: P, y: FOOT_Y - 1, ...KICK, fill: t.muted }))
  const note = card.part === 1 ? [{ text: 'continued', font: 'serif-400i', size: 16, after: 6 }, { text: '→', font: 'sans-400', size: 14 }] : [{ text: `${TOTAL} tools in all`, font: 'serif-400i', size: 16 }]
  const nw = note.reduce((a, s) => a + d.measure(s.text, s) + (s.after || 0), 0)
  d.add(runs(d, note, { x: R - nw, y: FOOT_Y, size: 16, fill: t.muted }).svg)
  return d.end()
}

function alt(card) {
  const g = card.groups
    .map((g) => `${g.group} (${g.note}): ${g.entries.map((e) => `${LONG[e.label] || e.label}${e.refs.length ? ` — in ${e.refs.map((p) => `${p.name} (Fig. ${p.fig})`).join(' and ')}` : ''}`).join('; ')}.`)
    .join(' ')
  return `The toolbox — index, part ${card.part} of 2, A–Z: every tool I ship with, and the work in this issue it appears in. ${g}`
}

export default CARDS.map((card) => ({
  name: card.name,
  width: W,
  height: H,
  alt: alt(card),
  render: (t) => render(t, card),
}))
