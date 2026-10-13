// Contribution-graph card: the animated contribution snake from Platane/snk
// (rendered in CI by the Platane/snk/svg-only action) placed inside a
// full-width card with the same header band as the activity cards above it.
//
// snk draws a 53-week grid of 12px cells on a 16px pitch, lets the snake leave
// the grid by one cell on any side, and adds a progress bar of eaten cells
// below it. The card keeps the grid and the snake's path, drops the bar, scales
// the grid so its outer cells sit exactly on the card's 24px padding, and
// recolours it with the violet ramp below through snk's CSS variables.

import { createDoc, PHONE_CSS } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { HEAD, PAD, META, headerBand, headerText, meta } from './cards.mjs'

export const W = LAYOUT.full // 850

/**
 * GitHub's four activity levels (low → high) per theme; empty cells use the
 * theme's `border` token. Violet 900/600/400/200 on dark, 300/400/600/900 on
 * light: with the empty cell, every step is ≥ 26 ΔE apart (the old light
 * ramp's first step was 21) and empty cells stay visible on the card surface.
 * The workflow passes the same colours to snk, only as a fallback.
 */
export const RAMP = {
  dark: ['#4c1d95', '#7c3aed', '#a78bfa', '#ddd6fe'],
  light: ['#c4b5fd', '#a78bfa', '#7c3aed', '#4c1d95'],
}

const LABEL = 'Contribution graph'
const META_TEXT = 'last 12 months'

/**
 * Parse Platane/snk's SVG. Returns the inner markup (minus <desc> and the
 * eaten-cells bar) and the grid geometry in snk's own units. Throws on
 * anything unexpected, so CI fails before publishing instead of shipping a
 * broken card (the previously published one then stays in place).
 */
export function parseSnk(svg) {
  const open = /<svg\b[^>]*>/.exec(svg)
  if (!open || !/<\/svg>\s*$/.test(svg)) throw new Error('snake: input is not an SVG document')
  if (/aria-labelledby=/.test(open[0])) throw new Error('snake: input is already a rendered card; pass the raw Platane/snk output')
  let inner = svg.slice(open.index + open[0].length, svg.lastIndexOf('</svg>'))
  if (/<(script|foreignObject|image|a)\b|\bhref=|url\(\s*['"]?(https?:|\/\/)/i.test(inner)) throw new Error('snake: unexpected script, link or external reference in the snk output')
  inner = inner
    .replace(/<desc\b[\s\S]*?<\/desc>/g, '')
    .replace(/<title\b[\s\S]*?<\/title>/g, '')
    .replace(/<rect\b[^>]*\bclass="u\b[^"]*"[^>]*\/>/g, '') // eaten-cells progress bar

  const num = (tag, name) => Number(new RegExp(`\\b${name}="(-?[\\d.]+)"`).exec(tag)?.[1])
  const cells = [...inner.matchAll(/<rect\b[^>]*\bclass="c\b[^"]*"[^>]*>/g)].map(([tag]) => [num(tag, 'x'), num(tag, 'y')])
  if (cells.length < 7 || cells.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) throw new Error(`snake: found ${cells.length} grid cells in the snk output`)
  const size = Number(/\.c\{(?:[^}]*;)?\s*width:\s*([\d.]+)px/.exec(inner)?.[1] ?? 12) // not stroke-width
  const xs = [...new Set(cells.map(([x]) => x))].sort((a, b) => a - b)
  const ys = [...new Set(cells.map(([, y]) => y))].sort((a, b) => a - b)
  const steps = [...xs.slice(1).map((x, i) => x - xs[i]), ...ys.slice(1).map((y, i) => y - ys[i])]
  const pitch = steps.length ? Math.min(...steps) : size + 4
  if (!(size > 0 && pitch >= size)) throw new Error(`snake: unexpected grid geometry (cell ${size}, pitch ${pitch})`)
  return {
    inner,
    size,
    pitch,
    cols: xs.length,
    rows: ys.length,
    // outer edges of the drawn cells
    box: { x0: xs[0], y0: ys[0], x1: xs.at(-1) + size, y1: ys.at(-1) + size },
  }
}

/** Card height for a parsed grid (it follows the grid's aspect ratio). */
export function snakeHeight(snk) {
  const k = (W - 2 * PAD) / (snk.box.x1 - snk.box.x0)
  return Math.round(HEAD + 2 * PAD + (snk.box.y1 - snk.box.y0) * k)
}

export function snakeAlt(data) {
  return (
    `@${data.login}'s GitHub contribution graph for the last 12 months: one square per day, shaded by the number of contributions, ` +
    'with a snake that slithers across the grid and eats the active days.'
  )
}

export function renderSnake(t, data, snk) {
  const H = snakeHeight(snk)
  const d = createDoc({ width: W, height: H, theme: t, title: `Contribution graph — @${data.login}`, desc: snakeAlt(data) })
  const dark = t.name === 'dark'
  const { box, pitch, size } = snk

  d.add(d.card({ glows: [{ cx: W - 140, cy: -10, r: 340, color: [t.glowViolet[0], t.glowViolet[1] * (dark ? 0.55 : 0.6)] }] }))
  d.add(headerBand(d))

  // header text: the desktop size, and a phone layer at ~2.2× (the card is drawn at ~0.42× there)
  d.css(PHONE_CSS)
  const ps = 2.2
  const kick = { font: 'mono-500', size: 11 * ps, tracking: 0.14, upper: true }
  const pm = { ...META, size: 11 * ps }
  const cap = d.metrics(kick.font, kick.size).capHeight
  const base = HEAD / 2 + cap / 2
  const icon = 15 * 1.9
  d.add(
    `<g class="dt">${headerText(d, { icon: 'calendar-days', label: LABEL, right: meta(d, META_TEXT) })}</g>`,
    `<g class="ph">` +
      d.icon('calendar-days', { x: PAD, y: HEAD / 2 - icon / 2, size: icon, color: t.violet, stroke: 1.9 }) +
      d.text(LABEL, { ...kick, x: PAD + icon + 14, y: base, fill: t.fg2 }) +
      d.text(META_TEXT, { ...pm, x: W - PAD, y: base, fill: t.muted, anchor: 'end' }) +
      `</g>`,
  )

  // grid: outer cells on the 24px padding, centred in the space under the band
  const k = (W - 2 * PAD) / (box.x1 - box.x0)
  const gh = (box.y1 - box.y0) * k
  const top = HEAD + (H - HEAD - gh) / 2
  // keep the ring of cells around the grid that the snake travels through
  const ring = pitch + (pitch - size) / 2
  const vb = [box.x0 - ring, box.y0 - ring, box.x1 - box.x0 + 2 * ring, box.y1 - box.y0 + 2 * ring]
  const vars = [
    `--ce:${t.border}`,
    `--c0:${t.border}`,
    ...RAMP[t.name].map((c, i) => `--c${i + 1}:${c}`),
    `--cs:${t.sky}`,
    '--cb:transparent',
  ].join(';')
  const f2 = (n) => Math.round(n * 100) / 100
  d.add(
    `<svg x="${f2(PAD - ring * k)}" y="${f2(top - ring * k)}" width="${f2(vb[2] * k)}" height="${f2(vb[3] * k)}" viewBox="${vb.map(f2).join(' ')}" style="${vars}">${snk.inner}</svg>`,
  )
  return d.end()
}

/**
 * Transparent space below the card, in SVG units (≈ 21px on desktop). The
 * snake is the last block of the activity section and the CTA follows without
 * a section header, so this gives that break the same 43px the section headers
 * get (cards inside a section sit 22px apart).
 */
export const SECTION_END = 22

/** Extend an SVG written by createDoc().end() (and padSides) downwards by `extra` transparent units. */
export function padBottom(svg, extra = SECTION_END) {
  let hit = false
  const out = svg.replace(/^(<svg[^>]*? height=")([\d.]+)("[^>]*? viewBox="-?[\d.]+ -?[\d.]+ [\d.]+ )([\d.]+)"/, (_, a, h, b, vh) => {
    hit = true
    return `${a}${Number(h) + extra}${b}${Number(vh) + extra}"`
  })
  if (!hit) throw new Error('padBottom: unexpected <svg> header')
  return out
}

/** Stamp of the grid geometry for logs. */
export const describe = (snk) => `${snk.cols}×${snk.rows} cells, pitch ${snk.pitch}, card ${W}×${snakeHeight(snk)} (scale ${((W - 2 * PAD) / (snk.box.x1 - snk.box.x0)).toFixed(3)})`
