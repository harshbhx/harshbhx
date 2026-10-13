// Featured project cards (415×460). Each sits to the left of its architecture
// diagram card (arch-*.mjs); all three share one render function so they read
// as a set.
//
//   [tile] Title                                  (● LIVE)
//          kind
//   ┃ PROBLEM → APPROACH                            (grey bar)
//   ┃ problem, muted
//   ┃ approach, bright                              (violet → cyan bar)
//   ✓ highlight            ─┐
//   ✓ highlight             │ text column at TX, markers in the gutter
//   ≡ [chip] [chip] [chip] ─┘
//   ⊕ arena.dualmindlab.tech ↗                    (live projects only)

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROJECTS } from '../content.mjs'

const W = LAYOUT.half
const H = 460
const PAD = 24
const TILE = 44
const TX = PAD + 22 // text column; markers sit in the 22px gutter
const TW = W - PAD - TX
const GX = PAD + 6 // gutter centre line
const BODY = 13
const LH = 19
const HL_LH = 18.5
const CHIP_H = 22
const CHIP_GAP = 6

const ICONS = { dualmind: 'swords', mealmind: 'chef-hat', agent: 'bot' }

// ── local helpers ────────────────────────────────────────────────────────────

/** '#rrggbb' + alpha → rgba(), so tints follow the theme tokens. */
const alpha = (hex, a) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Line breaking that reads well: same number of lines as a greedy wrap, but
 * breaks prefer clause boundaries (". — : ; ,"), avoid splitting "a → b"
 * chains and avoid orphans. Returns the text with explicit "\n" breaks.
 */
function semanticBreaks(d, text, { font = 'body-400', size = BODY, width = TW } = {}) {
  const words = text.split(/\s+/).filter(Boolean)
  const n = d.wrap(text, { font, size, width }).length
  if (n < 2) return text
  const max = width - 1
  const lineW = (i, j) => d.measure(words.slice(i, j).join(' '), { font, size })
  const bonus = (w) => (/[.!?:]$/.test(w) || w === '—' ? 40 : /;$/.test(w) ? 32 : /,$/.test(w) ? 14 : 0)
  // solve(i, k) = cheapest way to set words[i..] in exactly k lines
  const memo = new Map()
  const solve = (i, k) => {
    const key = `${i}:${k}`
    if (memo.has(key)) return memo.get(key)
    let res = { cost: Infinity, cut: -1 }
    if (k === 1) {
      const w = lineW(i, words.length)
      if (w <= max) res = { cost: w < width * 0.3 ? 60 : 0, cut: words.length }
    } else {
      for (let j = i + 1; j <= words.length - (k - 1); j++) {
        const w = lineW(i, j)
        if (w > max) break
        const slackRatio = (width - w) / width
        let cost = slackRatio * slackRatio * 100 - bonus(words[j - 1])
        if (words[j - 1] === '→' || words[j] === '→') cost += 30
        const rest = solve(j, k - 1)
        if (cost + rest.cost < res.cost) res = { cost: cost + rest.cost, cut: j }
      }
    }
    memo.set(key, res)
    return res
  }
  const lines = []
  let i = 0
  for (let k = n; k >= 1; k--) {
    const { cut } = solve(i, k)
    if (cut < 0) return text // no valid layout: fall back to the greedy wrap
    lines.push(words.slice(i, cut).join(' '))
    i = cut
  }
  return lines.join('\n')
}

/** Split chips into rows that fit `width`, preferring the most balanced split. */
function chipRows(widths, width, gap) {
  const total = (a) => a.reduce((s, w) => s + w, 0) + gap * Math.max(0, a.length - 1)
  if (total(widths) <= width) return [widths.length]
  let best = null
  for (let i = 1; i < widths.length; i++) {
    const a = widths.slice(0, i)
    const b = widths.slice(i)
    if (total(a) > width || total(b) > width) continue
    const score = Math.abs(total(a) - total(b)) + (a.length < b.length ? 0.5 : 0) // prefer the longer row on top
    if (!best || score < best.score) best = { score, split: [i, widths.length - i] }
  }
  if (best) return best.split
  const rows = []
  let n = 0
  let acc = 0
  for (const w of widths) {
    if (n && acc + gap + w > width) {
      rows.push(n)
      n = 0
      acc = 0
    }
    acc += (n ? gap : 0) + w
    n++
  }
  rows.push(n)
  return rows
}

// ── card ─────────────────────────────────────────────────────────────────────

function render(t, p) {
  const d = createDoc({ width: W, height: H, theme: t, title: `${p.name} — ${p.kind}`, desc: altFor(p) })
  const live = p.status === 'live'
  const dark = t.name === 'dark'

  d.add(
    d.card({
      glows: [{ cx: W - 40, cy: -20, r: 230, color: t.glowViolet, cls: 'drift-b' }],
      pattern: { kind: 'dots', step: 16, fade: { cx: W - 30, cy: 0, r: 180 } },
    }),
  )

  d.css('@keyframes pj-grow{from{transform:scaleY(0)}to{transform:none}}.pj-grow{transform-box:fill-box;transform-origin:50% 0;animation:pj-grow .7s cubic-bezier(.3,.7,.2,1) both}')

  let delay = 0
  const at = (s) => (delay += s).toFixed(2)
  const group = (svg, when) => `<g class="fade-up" style="animation-delay:${when}s">${svg}</g>`

  // ── measure everything first, then distribute the vertical space ──
  const wrapOpts = { font: 'body-400', size: BODY }
  const why = [
    { text: p.problem, fill: t.muted },
    { text: p.approach, fill: t.fg },
  ].map((b) => {
    const text = semanticBreaks(d, b.text)
    return { ...b, text, lines: d.wrap(text, { ...wrapOpts, width: TW }).length }
  })
  const PA_GAP = 6
  const KICK_TO_TEXT = 19
  const whyH = 8 + KICK_TO_TEXT + why.reduce((s, b) => s + (b.lines - 1) * LH, 0) + LH + PA_GAP + 4 // kicker cap → last descender

  const hls = p.highlights.map((h) => {
    const text = semanticBreaks(d, h)
    return { text, lines: d.wrap(text, { ...wrapOpts, width: TW }).length }
  })
  const hlTextH = hls.reduce((s, h) => s + 9.5 + (h.lines - 1) * HL_LH + 4, 0)
  let hlGap = 6

  const makeChip = (label, o) => d.chip(label, { h: CHIP_H, size: 11, padX: 9, ...o })
  const widths = p.stack.map((s) => makeChip(s, { x: 0, y: 0 }).w)
  const split = chipRows(widths, TW, CHIP_GAP)
  const chipsH = split.length * CHIP_H + (split.length - 1) * CHIP_GAP

  const LINK_BASE = H - 22
  const bottomLimit = live ? LINK_BASE - 9 - 15 : H - PAD
  const headBottom = PAD + TILE
  const gaps = [20, 18, 18]
  const used = headBottom + gaps[0] + whyH + gaps[1] + hlTextH + hlGap * (hls.length - 1) + gaps[2] + chipsH
  let slack = bottomLimit - used
  if (slack < 0) {
    const mins = [15, 14, 14]
    for (let i = 0; i < 3 && slack < 0; i++) {
      const take = Math.min(gaps[i] - mins[i], -slack)
      gaps[i] -= take
      slack += take
    }
    if (slack < 0) console.warn(`! project-${p.key}: content is ${r1(-slack)}px too tall for the card`)
  } else {
    // share spare room between the section gaps and the list; whatever is left
    // opens up above the bottom-anchored chips
    const e = Math.min(slack / 4, 14)
    gaps[0] += e
    gaps[1] += e
    hlGap += e / Math.max(1, hls.length - 1)
    slack -= e * 3
  }

  // ── header: gradient icon tile · title · kind · status ──
  {
    const x = PAD
    const y = PAD
    const grad = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
    const sheen = d.linearGradient([[0, '#ffffff', 0.3], [0.55, '#ffffff', 0.04], [1, '#ffffff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
    // soft coloured lift under the tile (an icon-tile shadow, not a second card glow)
    const liftId = d.uid('lift')
    d.def(`<radialGradient id="${liftId}"><stop offset="0" stop-color="${t.violetStrong}" stop-opacity="${dark ? 0.55 : 0.35}"/><stop offset="1" stop-color="${t.violetStrong}" stop-opacity="0"/></radialGradient>`)
    const lift = `<ellipse cx="${x + TILE / 2}" cy="${y + TILE + 1}" rx="${TILE * 0.62}" ry="9" fill="url(#${liftId})"/>`
    const tile =
      lift +
      `<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="12" fill="url(#${grad})"/>` +
      `<rect x="${x + 0.5}" y="${y + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="11.5" fill="url(#${sheen})" stroke="rgba(255,255,255,0.22)"/>` +
      d.icon(ICONS[p.key] || 'box', { x: x + (TILE - 22) / 2, y: y + (TILE - 22) / 2, size: 22, color: '#ffffff', stroke: 1.9 })

    const hx = x + TILE + 14
    const title = d.text(p.name, { x: hx, y: y + 20, font: 'display-700', size: 24, fill: t.fg })
    const kind = d.text(p.kind, { x: hx, y: y + 40, font: 'body-400', size: 13, fill: t.muted })

    const accent = live ? t.green : t.violet
    const pill = d.pill(live ? 'Live' : 'Built', {
      x: W - PAD,
      y: y + 1,
      h: 24,
      anchor: 'end',
      font: 'mono-500',
      size: 11,
      tracking: 0.1,
      upper: true,
      padX: 10,
      gap: 7,
      fg: accent,
      bg: alpha(accent, dark ? 0.1 : 0.07),
      border: alpha(accent, dark ? 0.35 : 0.3),
      dot: accent,
      pulse: live,
    })
    d.add(group(tile, at(0.05)), group(title + kind, at(0.08)), group(pill.svg, at(0.05)))
  }

  // ── why: problem → approach (muted problem, bright approach, colour-coded gutter bars) ──
  let y = headBottom + gaps[0]
  {
    const kBase = y + 8
    const kw = (str) => d.measure(str, { font: 'mono-500', size: 11, tracking: 0.14, upper: true })
    const kick =
      d.kicker('Problem', { x: TX, y: kBase }) +
      d.kicker('→', { x: TX + kw('Problem') + 7, y: kBase, fill: t.faint }) +
      d.kicker('Approach', { x: TX + kw('Problem') + 7 + kw('→') + 7, y: kBase, fill: t.violet })
    const parts = [kick]
    let base = kBase + KICK_TO_TEXT
    why.forEach((b, i) => {
      const para = d.paragraph(b.text, { x: TX, y: base, width: TW, font: 'body-400', size: BODY, lineHeight: LH, fill: b.fill })
      const top = i === 0 ? y : base - 13
      const bottom = base + (b.lines - 1) * LH + 4
      const fill =
        i === 0
          ? alpha(t.faint, dark ? 0.55 : 0.45)
          : `url(#${d.linearGradient([t.violet, t.cyan], { x1: 0, y1: 0, x2: 0, y2: 1 })})`
      const barDelay = (delay + 0.12 + i * 0.18).toFixed(2)
      parts.push(`<rect class="pj-grow" style="animation-delay:${barDelay}s" x="${GX - 1}" y="${r1(top)}" width="2" height="${r1(bottom - top)}" rx="1" fill="${fill}"/>`, para.svg)
      base = bottom - 4 + LH + PA_GAP
    })
    d.add(group(parts.join(''), at(0.1)))
    y += whyH + gaps[1]
  }

  // ── highlights ──
  {
    const items = []
    for (const h of hls) {
      const base = y + 9.5
      const para = d.paragraph(h.text, { x: TX, y: base, width: TW, font: 'body-400', size: BODY, lineHeight: HL_LH, fill: t.fg2 })
      const check = d.icon('check', { x: GX - 7, y: base - 11, size: 14, color: t.violet, stroke: 2.4 })
      items.push(group(check + para.svg, at(0.07)))
      y = base + (h.lines - 1) * HL_LH + 4 + hlGap
    }
    d.add(items)
  }

  // ── stack chips (bottom-anchored) ──
  {
    const top = bottomLimit - chipsH
    const parts = [d.icon('layers', { x: GX - 7, y: top + (CHIP_H - 14) / 2, size: 14, color: t.faint, stroke: 1.9 })]
    let i = 0
    let cy = top
    for (const n of split) {
      let cx = TX
      for (let k = 0; k < n; k++, i++) {
        const c = makeChip(p.stack[i], { x: cx, y: cy })
        parts.push(c.svg)
        cx += c.w + CHIP_GAP
      }
      cy += CHIP_H + CHIP_GAP
    }
    d.add(group(parts.join(''), at(0.07)))
  }

  // ── live link ──
  if (live) {
    const urlW = d.measure(p.url, { font: 'mono-500', size: 12 })
    d.add(
      group(
        d.icon('globe', { x: GX - 7, y: LINK_BASE - 11.5, size: 14, color: t.green, stroke: 1.9 }) +
          d.text(p.url, { x: TX, y: LINK_BASE, font: 'mono-500', size: 12, fill: t.fg }) +
          d.icon('arrow-up-right', { x: TX + urlW + 4, y: LINK_BASE - 11.5, size: 14, color: t.violet, stroke: 2.2 }),
        at(0.07),
      ),
    )
  }

  return d.end()
}

function altFor(p) {
  const status = p.status === 'live' ? `Live at ${p.url}` : 'Built'
  return (
    `${p.name} — ${p.kind}. Status: ${status}. ` +
    `Problem: ${p.problem} Approach: ${p.approach} ` +
    `Highlights: ${p.highlights.join('; ')}. ` +
    `Stack: ${p.stack.join(', ')}.`
  )
}

export default PROJECTS.map((p) => ({
  name: `project-${p.key}`,
  width: W,
  height: H,
  alt: altFor(p),
  ...(p.href ? { href: p.href } : {}),
  render: (t) => render(t, p),
}))
