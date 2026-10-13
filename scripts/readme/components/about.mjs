// About pair: a terminal window ("whoami" + about.txt + focus.txt) and a
// "Right now" status card. Both share the same window header band so they read
// as one matched pair. The terminal carries the bio (PROFILE.summary) so it does
// not repeat the hero or the status card next to it.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROFILE, LINKS, WORKING_STYLE } from '../content.mjs'

const W = LAYOUT.half
const H = 336
const PAD = 24
const HEAD = 44 // header band height (both cards)
const HEAD_BASE = 26 // header text baseline (both cards)

// ── facts, derived from content.mjs ──────────────────────────────────────────
const lower = (s) => s.toLowerCase()
const [buildName, buildWhatRaw] = PROFILE.now.building.split(/\s+—\s+/)
const buildWhat = buildWhatRaw ? buildWhatRaw.charAt(0).toUpperCase() + buildWhatRaw.slice(1) : ''
const replies = WORKING_STYLE.find((w) => /24 hours/i.test(w)) || WORKING_STYLE[0]
const host = lower(PROFILE.company.split(' ')[0])
const user = lower(PROFILE.name.split(' ')[0])

// ── shared chrome ────────────────────────────────────────────────────────────

/** Window header band: tinted fill clipped to the card's top corners + hairline divider. */
function headerBand(d) {
  const t = d.t
  const r = LAYOUT.radius
  const x0 = 0.5
  const x1 = W - 0.5
  const fill = t.name === 'dark' ? t.surfaceRaised : t.inset
  const op = t.name === 'dark' ? 0.55 : 0.75
  return [
    `<path d="M ${x0} ${HEAD} V ${r + 0.5} A ${r} ${r} 0 0 1 ${r + 0.5} 0.5 H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${r + 0.5} V ${HEAD} Z" fill="${fill}" opacity="${op}"/>`,
    `<path d="M ${x0} ${HEAD + 0.5} H ${x1}" stroke="${t.border}" stroke-width="1"/>`,
  ].join('')
}

// ── about-terminal ───────────────────────────────────────────────────────────

function renderTerminal(t) {
  const d = createDoc({ width: W, height: H, theme: t, title: 'whoami — Harsh Bhanushali', desc: terminalAlt })
  const c = t.code
  const SIZE = 12.5
  const ADV = d.measure('a', { font: 'mono-400', size: SIZE }) // monospaced advance
  const LH = 20
  const GAP = 12
  const IND = PAD + ADV * 2 // command / output column (prompt hangs in the gutter)

  d.add(d.card({ glows: [{ cx: W - 60, cy: H + 40, r: 260, color: t.glowViolet }] }))
  d.add(headerBand(d))

  // traffic lights
  ;[t.red, t.amber, t.green].forEach((col, i) => {
    const cx = PAD + 5 + i * 17
    d.add(`<circle cx="${cx}" cy="${HEAD / 2}" r="5" fill="${col}" opacity="${t.name === 'dark' ? 0.7 : 0.55}"/>`)
  })
  // centred title with a small terminal glyph
  const title = `${user}@${host}: ~`
  const tw = d.measure(title, { font: 'mono-500', size: 11.5 })
  const iconW = 13
  const tx = W / 2 - (tw + iconW + 7) / 2
  d.add(
    d.icon('square-terminal', { x: tx, y: HEAD / 2 - iconW / 2, size: iconW, color: t.faint, stroke: 2 }),
    d.text(title, { x: tx + iconW + 7, y: HEAD_BASE, font: 'mono-500', size: 11.5, fill: t.muted }),
  )

  // ── script: commands type out char by char, outputs fade up ──
  const PER = 0.018 // seconds per typed character
  let clock = 0.15
  let y = HEAD + 31 // first baseline
  const caretH = 15
  const caretY = (base) => base - 11.5

  // typed command line
  const command = (parts) => {
    const base = y
    d.add(`<g class="pr" style="animation-delay:${(clock - 0.08).toFixed(2)}s">${d.text('›', { x: PAD - 0.5, y: base + 0.5, font: 'mono-700', size: 14, fill: c.prompt })}</g>`)
    let x = IND
    let n = 0
    for (const [str, fill, font = 'mono-500'] of parts) {
      for (const ch of str) {
        if (ch !== ' ') {
          const delay = (clock + n * PER).toFixed(3)
          d.add(`<g class="k" style="animation-delay:${delay}s">${d.text(ch, { x: x + n * ADV, y: base, font, size: SIZE, fill })}</g>`)
        }
        n++
      }
    }
    // caret that follows the typing, then hides when the output arrives
    const dur = n * PER
    d.css(`@keyframes cm${Math.round(base)}{from{transform:translateX(0)}to{transform:translateX(${r1(n * ADV)}px)}}`)
    const outAt = clock + dur + 0.06
    d.add(
      `<g opacity="0" style="animation:cv ${(outAt - clock + 0.08).toFixed(2)}s linear ${(clock - 0.08).toFixed(2)}s"><g style="animation:cm${Math.round(base)} ${dur.toFixed(3)}s steps(${n},start) ${clock.toFixed(3)}s both">` +
        `<rect x="${r1(IND)}" y="${r1(caretY(base))}" width="${r1(ADV - 0.5)}" height="${caretH}" rx="1" fill="${t.violet}" opacity=".85"/></g></g>`,
    )
    clock = outAt
    y += LH
  }

  // output line (rich runs); returns nothing, advances y
  const output = (runs) => {
    const base = y
    let x = IND
    const parts = []
    for (const [str, fill, font = 'mono-400'] of runs) {
      parts.push(d.text(str, { x, y: base, font, size: SIZE, fill }))
      x += d.measure(str, { font, size: SIZE })
    }
    d.add(`<g class="out" style="animation-delay:${clock.toFixed(2)}s">${parts.join('')}</g>`)
    clock += 0.05
    y += LH
  }
  const gap = () => {
    y += GAP
    clock += 0.04
  }

  d.css('@keyframes cv{from,to{opacity:1}}')
  d.css('@keyframes type{from{opacity:0}to{opacity:1}}.k{animation:type 1ms linear both}')
  d.css('@keyframes out{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.out{animation:out .4s cubic-bezier(.2,.7,.2,1) both}.pr{animation:fade-in .25s ease both}')

  // 1 · whoami — just the name; role and company are in the hero right above
  command([['whoami', c.command]])
  output([[lower(PROFILE.name), t.fg, 'mono-500']])
  gap()

  // 2 · the bio (PROFILE.summary): first sentence on its own line, company highlighted
  command([['cat', c.command], [' about.txt', c.string]])
  const aboutText = PROFILE.summary.replace(/^(.*?\.)\s+/, '$1\n')
  const aboutRuns = aboutText.split(PROFILE.company).flatMap((s, i) => (i ? [{ text: PROFILE.company, font: 'mono-500', fill: c.keyword }, s] : [s]))
  for (const ln of d.wrap(aboutRuns, { font: 'mono-400', size: SIZE, width: W - PAD - IND, fill: t.fg2 })) {
    output(ln.runs.map((r) => [r.text, r.fill, r.font]))
  }
  gap()

  // 3 · focus
  command([['cat', c.command], [' focus.txt', c.string]])
  const [f0, ...fRest] = PROFILE.focus.map(lower)
  output([[f0, t.fg2]])
  output(fRest.flatMap((f, i) => (i ? [[' · ', c.comment], [f, t.fg2]] : [[f, t.fg2]])))
  gap()

  // 4 · idle prompt with a blinking caret
  const base = y
  if (caretY(base) + caretH > H - 18) throw new Error(`about-terminal: script overflows the card (caret ends at ${r1(caretY(base) + caretH)} of ${H}); shorten PROFILE.summary`)
  d.add(
    `<g class="pr" style="animation-delay:${clock.toFixed(2)}s">${d.text('›', { x: PAD - 0.5, y: base + 0.5, font: 'mono-700', size: 14, fill: c.prompt })}` +
      `<rect class="blink" x="${r1(IND)}" y="${r1(caretY(base))}" width="${r1(ADV - 0.5)}" height="${caretH}" rx="1" fill="${t.violet}" opacity=".85"/></g>`,
  )
  return d.end()
}

const terminalAlt = `Terminal window. whoami: ${PROFILE.name}. about.txt: ${PROFILE.summary} focus.txt: ${PROFILE.focus.join(', ')}.`

// ── about-now ────────────────────────────────────────────────────────────────

/** Split chips into rows that fit `width`, choosing the most balanced arrangement. */
function balancedRows(widths, width, gap) {
  const total = (a) => a.reduce((s, w) => s + w, 0) + gap * Math.max(0, a.length - 1)
  if (total(widths) <= width) return [widths.length]
  let best = null
  for (let i = 1; i < widths.length; i++) {
    const a = widths.slice(0, i)
    const b = widths.slice(i)
    if (total(a) > width || total(b) > width) continue
    const score = Math.abs(total(a) - total(b))
    if (!best || score < best.score) best = { score, split: [i, widths.length - i] }
  }
  return best ? best.split : [widths.length]
}

function renderNow(t) {
  const d = createDoc({ width: W, height: H, theme: t, title: 'Right now — Harsh Bhanushali', desc: nowAlt })
  d.add(d.card({ glows: [{ cx: W - 60, cy: H + 40, r: 260, color: t.glowCyan }] }))
  d.add(headerBand(d))

  // header: live kicker left, email right
  d.add(
    `<circle class="pulse" cx="${PAD + 3.5}" cy="${HEAD / 2}" r="3.5" fill="${t.green}"/><circle cx="${PAD + 3.5}" cy="${HEAD / 2}" r="3.5" fill="${t.green}"/>`,
    d.kicker('Right now', { x: PAD + 15, y: HEAD_BASE - 0.5, fill: t.fg2 }),
  )
  const ew = d.measure(PROFILE.email, { font: 'mono-500', size: 11 })
  d.add(
    d.icon('mail', { x: W - PAD - ew - 20, y: HEAD / 2 - 7, size: 14, color: t.faint, stroke: 1.75 }),
    d.text(PROFILE.email, { x: W - PAD, y: HEAD_BASE - 0.5, font: 'mono-500', size: 11, fill: t.muted, anchor: 'end' }),
  )

  const TILE = 30
  const TX = PAD + TILE + 14 // text column
  const TW = W - PAD - TX
  const ROW_GAP = 18
  let y = HEAD + 20
  let delay = 0.15

  const tile = (icon, top, accent = false) => {
    const stroke = accent ? `url(#${d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })})` : t.chipBorder
    return (
      `<rect x="${PAD + 0.5}" y="${r1(top + 0.5)}" width="${TILE - 1}" height="${TILE - 1}" rx="9" fill="${t.chipBg}" stroke="${stroke}"/>` +
      d.icon(icon, { x: PAD + (TILE - 15) / 2, y: top + (TILE - 15) / 2, size: 15, color: t.violet, stroke: 1.9 })
    )
  }
  const label = (str, top) => d.text(str, { x: TX, y: top + 11, font: 'body-500', size: 12, fill: t.muted })
  const row = (h, svg) => {
    d.add(`<g class="fade-up" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`)
    delay += 0.12
    y += h
  }
  const divider = () => {
    d.add(`<path d="M ${TX} ${Math.round(y + ROW_GAP / 2 - 1) + 0.5} H ${W - PAD}" stroke="${t.border}" stroke-width="1" opacity=".7"/>`)
    y += ROW_GAP
  }

  // Building
  {
    const top = y
    row(
      54,
      tile('hammer', top, true) +
        label('Building', top) +
        d.gradientText(buildName, { x: TX, y: top + 31, font: 'display-600', size: 16.5 }) +
        d.text(buildWhat, { x: TX, y: top + 50, font: 'body-400', size: 13, fill: t.fg2 }),
    )
  }
  divider()
  // Next
  {
    const top = y
    const m = PROFILE.now.next.match(/^(.*?)(AI agent evaluation)$/i)
    const runs = m ? [m[1], { text: m[2], font: 'body-600', fill: t.fg }] : [PROFILE.now.next]
    const p = d.paragraph(runs, { x: TX, y: top + 31, width: TW, font: 'body-400', size: 13.5, fill: t.fg2 })
    row(35, tile('sparkles', top) + label('Next', top) + p.svg)
  }
  divider()
  // Open to
  {
    const top = y
    const make = (s, p) => d.chip(s, { ...p, h: 24, size: 11.5, font: 'mono-500' })
    const widths = PROFILE.openTo.map((s) => make(s, { x: 0, y: 0 }).w)
    const split = balancedRows(widths, TW, 6)
    let i = 0
    let cy = top + 20
    const parts = []
    for (const n of split) {
      let cx = TX
      for (let k = 0; k < n; k++, i++) {
        const ch = make(PROFILE.openTo[i], { x: cx, y: cy })
        parts.push(ch.svg)
        cx += ch.w + 6
      }
      cy += 24 + 6
    }
    row(cy - 6 - top, tile('briefcase', top) + label('Open to', top) + parts.join(''))
  }
  divider()
  // Replies — goes with the email in the header (location + timezone already sit in the hero kicker)
  {
    const top = y
    const m = replies.match(/^Replies\s+within\s+(.+)$/i)
    const runs = m ? ['Within ', { text: m[1], font: 'body-600', fill: t.fg }] : [replies]
    const p = d.paragraph(runs, { x: TX, y: top + 31, width: TW, font: 'body-400', size: 13.5, fill: t.fg2 })
    row(35, tile('message-square-reply', top) + label(m ? 'Replies' : 'How I work', top) + p.svg)
  }
  return d.end()
}

const nowAlt =
  `Right now. Building: ${PROFILE.now.building}. Next: ${PROFILE.now.next}. ` +
  `Open to: ${PROFILE.openTo.join(', ')}. ${replies}. Email: ${PROFILE.email}.`

export default [
  { name: 'about-terminal', width: W, height: H, alt: terminalAlt, href: LINKS.github.href, render: renderTerminal },
  { name: 'about-now', width: W, height: H, alt: nowAlt, href: LINKS.email.href, render: renderNow },
]
