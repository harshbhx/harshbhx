// Tech stack pair: "Build" (languages · frameworks · AI) and "Run & ship"
// (data · cloud & devops · tools & payments).
//
// Each card is a header band (same chrome as the practice / about pairs) over
// three group columns. A column is a mono group label on a drawn hairline,
// then a list of brand-logo tiles with their names beside them. Both cards
// share one column grid, one row rhythm and one label size, so they read as a
// single table when they sit side by side.
//
// Labels sit beside the logos (not under them): six-item groups at a legible
// size do not fit under-tile labels in a 415px card without collisions.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { contrast } from '../lib/icons.mjs'
import { STACK } from '../content.mjs'

const W = LAYOUT.half // 415
const PAD = 24
const R = LAYOUT.radius
const BAND = 44 // header band height
const BAND_BASE = 26 // kicker baseline inside the band

const TILE = 36 // logo tile
const TILE_R = 10
const LOGO = 20
const ROW = 48 // row pitch (12px between tiles)
const LABEL_GAP = 11 // tile → label
const MIN_GUTTER = 12 // longest label → next column
const LABEL_SIZES = [13, 12.5, 12] // largest that fits wins (12 is the floor)
const LABEL = { font: 'body-500' }
const GROUP = { font: 'mono-500', size: 11, tracking: 0.04 }

const GROUP_BASE = BAND + 30 // group label baseline
const RULE_Y = GROUP_BASE + 10 // hairline under the group label
const FIRST = RULE_Y + 16 // top of the first tile
const MAX_ROWS = Math.max(...[...STACK.build, ...STACK.run].map((g) => g.items.length))
const H = FIRST + (MAX_ROWS - 1) * ROW + TILE + 24 // 400 with six rows

const CARDS = [
  { key: 'build', name: 'stack-build', label: 'Build', icon: 'code-xml', groups: STACK.build, glow: 'glowViolet' },
  { key: 'run', name: 'stack-run', label: 'Run & ship', icon: 'rocket', groups: STACK.run, glow: 'glowCyan' },
]
const COLS = Math.max(...CARDS.map((c) => c.groups.length))

// Brand colours whose official mark is monochrome: always drawn in the text colour.
const MONO = new Set(['openai', 'nextdotjs'])
// Logos drawn as a solid plate with knocked-out letters (JS, TS, CSS, C#). A
// backing shape (24-unit grid) fills the cut-outs with the official letter
// colour, so they read like the real marks on both tile colours.
const PLATE = {
  javascript: { x: 1, y: 1, w: 22, h: 22, r: 0, ink: 'dark' },
  typescript: { x: 1, y: 1, w: 22, h: 22, r: 1, ink: 'light' },
  css: { x: 1, y: 1, w: 22, h: 22, r: 3, ink: 'light' },
  csharp: { x: 5, y: 7, w: 14, h: 10, r: 0, ink: 'light' },
}
// Optical size: wide wordmarks fill less of the box than square marks.
const OPTICAL = { mysql: 1.3, dotnet: 1.15 }
// Names for the alt text where the tile label alone would be ambiguous.
const LONG = { cloudflare: { 'AI Gateway': 'Cloudflare AI Gateway' }, githubactions: { Actions: 'GitHub Actions' } }
const longName = (slug, label) => LONG[slug]?.[label] || label

// ── grid, shared by both cards ───────────────────────────────────────────────

/**
 * Column pitch + label size. Columns are evenly pitched; the last one ends on
 * the right padding. Picks the largest label size that keeps MIN_GUTTER
 * between every column's longest label and the next column.
 */
function grid(d) {
  for (const size of LABEL_SIZES) {
    const colW = Array.from({ length: COLS }, (_, i) =>
      Math.max(
        ...CARDS.flatMap((c) => {
          const g = c.groups[i]
          if (!g) return [0]
          return [d.measure(g.group, GROUP), ...g.items.map(([, l]) => TILE + LABEL_GAP + d.measure(l, { ...LABEL, size }))]
        }),
      ),
    )
    const pitch = (W - 2 * PAD - colW[COLS - 1]) / (COLS - 1)
    if (colW.slice(0, -1).every((w) => pitch - w >= MIN_GUTTER) || size === LABEL_SIZES.at(-1)) {
      return { size, pitch, colW, x: (i) => PAD + i * pitch, ruleW: Math.min(pitch - MIN_GUTTER, W - PAD - (PAD + (COLS - 1) * pitch)) }
    }
  }
}

// ── colour helpers ───────────────────────────────────────────────────────────

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const mix = (a, b, k) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * k))

/**
 * Brand colour, nudged until it reads on the logo tile. Mid-contrast brand
 * colours are lightened (dark theme) or deepened (light theme) just enough;
 * near-invisible ones fall back to the text colour, like d.logo does.
 */
function logoColor(d, slug) {
  const t = d.t
  const b = d.brand(slug).hex
  if (MONO.has(slug)) return t.fg
  if (PLATE[slug]) return b // solid plate: the shape itself carries the contrast
  const target = t.name === 'dark' ? 4.2 : 2.6
  const c0 = contrast(b, t.logoTile)
  if (c0 >= target) return b
  if (c0 < 1.5) return t.fg
  const toward = t.name === 'dark' ? '#ffffff' : t.fg
  for (let k = 0.05; k < 1; k += 0.05) {
    const c = mix(b, toward, k)
    if (contrast(c, t.logoTile) >= target) return c
  }
  return t.fg
}

// ── chrome ───────────────────────────────────────────────────────────────────

/** Tinted header band clipped to the card's top corners, with a hairline divider. */
function band(d) {
  const t = d.t
  const x0 = 0.5
  const x1 = W - 0.5
  const fill = t.name === 'dark' ? t.surfaceRaised : t.inset
  const op = t.name === 'dark' ? 0.55 : 0.75
  return (
    `<path d="M ${x0} ${BAND} V ${R + 0.5} A ${R} ${R} 0 0 1 ${R + 0.5} 0.5 H ${x1 - R} A ${R} ${R} 0 0 1 ${x1} ${R + 0.5} V ${BAND} Z" fill="${fill}" opacity="${op}"/>` +
    `<path d="M ${x0} ${BAND + 0.5} H ${x1}" stroke="${t.border}" stroke-width="1"/>`
  )
}

/** Brand logo centred in a TILE-sized box at (x, y), with its plate backing if it has one. */
function logo(d, slug, x, y) {
  const t = d.t
  const size = LOGO * (OPTICAL[slug] || 1)
  const lx = x + (TILE - size) / 2
  const ly = y + (TILE - size) / 2
  const k = size / 24
  const p = PLATE[slug]
  const ink = p && (p.ink === 'light' ? (t.name === 'dark' ? t.fg : t.surfaceRaised) : t.name === 'dark' ? t.inset : t.fg)
  const back = p ? `<rect x="${r1(lx + p.x * k)}" y="${r1(ly + p.y * k)}" width="${r1(p.w * k)}" height="${r1(p.h * k)}"${p.r ? ` rx="${r1(p.r * k)}"` : ''} fill="${ink}"/>` : ''
  return back + d.logo(slug, { x: lx, y: ly, size, color: logoColor(d, slug) })
}

const stagger = (delay, inner, cls = 'fade-up') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${inner}</g>`

// ── render ───────────────────────────────────────────────────────────────────

function render(t, card) {
  const total = card.groups.reduce((a, g) => a + g.items.length, 0)
  const d = createDoc({ width: W, height: H, theme: t, title: `Tech stack — ${card.label}`, desc: alt(card) })
  const G = grid(d)
  const dark = t.name === 'dark'

  d.css('@keyframes rule-in{from{transform:scaleX(0)}to{transform:none}}.rule{transform-box:fill-box;transform-origin:0 50%;animation:rule-in .9s cubic-bezier(.2,.7,.2,1) both}')

  d.add(d.card({ glows: [{ cx: W - 40, cy: H + 30, r: 250, color: t[card.glow], cls: 'drift-b' }] }))
  d.add(band(d))
  d.add(
    d.icon(card.icon, { x: PAD, y: BAND / 2 - 7.5, size: 15, color: t.violet, stroke: 1.9 }),
    d.kicker(card.label, { x: PAD + 24, y: BAND_BASE - 0.5, fill: t.fg2 }),
    d.text(`${total} tools`, { x: W - PAD, y: BAND_BASE - 0.5, font: 'mono-500', size: 11, tracking: 0.08, fill: t.faint, anchor: 'end' }),
  )

  // shared paint servers
  const tileFill = d.linearGradient([t.surfaceRaised, t.logoTile], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const sheen = d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, 1], [1, t.highlight, 0]], { x1: TILE_R, y1: 0, x2: TILE - TILE_R, y2: 0, units: 'userSpaceOnUse' })
  const ruleFill = d.linearGradient([[0, t.violet, dark ? 0.75 : 0.6], [0.45, t.violet, dark ? 0.28 : 0.22], [1, t.violet, 0.06]], { x1: 0, y1: 0, x2: 1, y2: 0 })
  const labelCap = d.metrics(LABEL.font, G.size).capHeight

  // one logo tile, defined once and placed with <use>: soft drop, gradient body, hairline border, top sheen
  const tileId = d.uid('tile')
  d.def(
    `<g id="${tileId}">` +
      `<rect x=".5" y="1.5" width="${TILE - 1}" height="${TILE - 1}" rx="${TILE_R}" fill="${t.shadow}"/>` +
      `<rect x=".5" y=".5" width="${TILE - 1}" height="${TILE - 1}" rx="${TILE_R}" fill="url(#${tileFill})" stroke="${t.logoTileBorder}"/>` +
      `<path d="M ${TILE_R} 1.5 H ${TILE - TILE_R}" stroke="url(#${sheen})"/>` +
      `</g>`,
  )

  card.groups.forEach((g, ci) => {
    const x = G.x(ci)
    const c0 = 0.12 + ci * 0.09
    d.add(
      stagger(c0, d.text(g.group, { x, y: GROUP_BASE, ...GROUP, fill: t.muted }), 'fade-in'),
      `<g class="rule" style="animation-delay:${(c0 + 0.05).toFixed(2)}s"><rect x="${r1(x)}" y="${RULE_Y}" width="${r1(G.ruleW)}" height="1" fill="url(#${ruleFill})"/></g>`,
    )
    g.items.forEach(([slug, label], ri) => {
      const y = FIRST + ri * ROW
      const tile = `<use href="#${tileId}" x="${r1(x)}" y="${r1(y)}"/>` + logo(d, slug, x, y)
      const text = d.text(label, { x: x + TILE + LABEL_GAP, y: y + TILE / 2 + labelCap / 2, ...LABEL, size: G.size, fill: t.fg2 })
      d.add(stagger(c0 + 0.1 + ri * 0.06, tile + text))
    })
  })

  // a slow light that runs along the group rules now and then
  const cid = d.uid('rc')
  d.def(`<clipPath id="${cid}">${card.groups.map((_, i) => `<rect x="${r1(G.x(i))}" y="${RULE_Y}" width="${r1(G.ruleW)}" height="1"/>`).join('')}</clipPath>`)
  const spark = d.linearGradient([[0, t.cyan, 0], [0.5, t.cyan, 1], [1, t.cyan, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })
  const SPARK = 64
  const travel = W - 2 * PAD + SPARK
  // one pass takes ~3s, then the rules rest for ~5s
  d.css(`@keyframes rule-run{0%{transform:translateX(0);opacity:0}3%{opacity:1}36%{opacity:1}40%,100%{transform:translateX(${Math.round(travel)}px);opacity:0}}.rule-run{animation:rule-run 8s cubic-bezier(.45,0,.3,1) 1.6s infinite both}`)
  d.add(`<g clip-path="url(#${cid})"><g class="rule-run"><rect x="${PAD - SPARK}" y="${RULE_Y}" width="${SPARK}" height="1" fill="url(#${spark})"/></g></g>`)
  return d.end()
}

const alt = (card) =>
  `Tech stack — ${card.label} (${card.groups.reduce((a, g) => a + g.items.length, 0)} tools). ` +
  card.groups.map((g) => `${g.group}: ${g.items.map(([s, l]) => longName(s, l)).join(', ')}.`).join(' ')

export default CARDS.map((card) => ({
  name: card.name,
  width: W,
  height: H,
  alt: alt(card),
  render: (t) => render(t, card),
}))
