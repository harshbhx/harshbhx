// No. 3 — Working together: two facing pages.
//
//   hire  "Freelance, remote, under NDA": HIRE as a short ledger — the
//         services with their typical timelines, then how I work (NDA,
//         remote, handoff) with small Lucide icons, and the email address.
//   now   "/now — what I'm doing now": NOW as three labelled notes with
//         small Lucide icons, then the "open to work" box (green dot, the
//         four work types, remote · NDA-friendly · Vadodara). The hiring hook
//         and the signature live in the letter (No. 5), not here.
//
// Both images link to the project email. Both pages share the publication
// grid — P = 28, kicker row at 40, headline baseline at 100 (both
// headlines 38), footer rule at H − 50 — like the Arena spread above them.

import { createDoc } from '../lib/svg.mjs'
import { editorial, paper, doubleRule, hairline, highlighter, liveDot, runs, assertFits } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { HIRE, NOW, PROFILE, LINKS } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 680
const P = 28
const R = W - P
const HEAD_Y = 100
const FOOT_RULE = H - 50
const FOOT_Y = H - 26

const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }

/** Kicker row: terra label + muted continuation, hairline under it. */
function kicker(d, label, rest, { lead = 0 } = {}) {
  const t = d.t
  const a = runs(d, [{ text: label, fill: t.terra, after: 8 }, { text: rest, fill: t.muted }], { x: P + lead, y: 40, ...KICK })
  d.add(a.svg, hairline(d, P, R, 54))
  return a.x
}

/** Wrap that throws on a one-word last line. */
function lines(d, segs, { font, size, width, fill, label }) {
  const ls = d.wrap(segs, { font, size, width, fill })
  if (ls.length > 1) {
    const words = ls[ls.length - 1].runs.map((r) => r.text).join('').trim().split(/\s+/).length
    if (words < 2) throw new Error(`${label}: orphan on the last line`)
  }
  return ls
}

/** Draw wrapped lines (from d.wrap); `mark` gets the highlighter. */
function drawLines(d, ls, { x, y, size, lh, mark, label }) {
  const out = []
  const marks = []
  ls.forEach((ln, i) => {
    let cx = x
    const by = y + i * lh
    for (const r of ln.runs) {
      if (mark && r.text.includes(mark)) {
        const pre = r.text.slice(0, r.text.indexOf(mark))
        const mx = cx + d.measure(pre, { font: r.font, size })
        const mw = d.measure(mark, { font: r.font, size })
        marks.push(highlighter(d, mx - 1.5, by - size * 0.8, mw + 1, size * 1.05))
      }
      out.push(d.text(r.text, { x: cx, y: by, font: r.font, size, fill: r.fill }))
      cx += d.measure(r.text, { font: r.font, size })
    }
    assertFits(`${label} line ${i + 1}`, cx, R)
  })
  return marks.join('') + out.join('')
}

const cap = (d, font, size) => d.metrics(font, size).capHeight
const nb = (s) => s.replace(/ /g, '\u00a0') // keep a phrase on one line
const tie = (s) => s.replace(/ (\S+)$/, '\u00a0$1') // no one-word last line

// ── hire ────────────────────────────────────────────────────────────────────

const HIRE_ALT = [
  `${HIRE.headline}. ${HIRE.deck}`,
  'Services and typical timelines:',
  ...HIRE.services.map((s) => `${s.title} (${s.time}) — ${s.detail};`),
  'how I work:',
  ...HIRE.terms.map((x) => `${x.title} — ${x.detail}`),
  `${LINKS.hire.label}: ${PROFILE.email}.`,
].join(' ')

const TERM_ICONS = ['file-lock', 'globe', 'package-check'] // NDA, remote, handoff

function renderHire(theme) {
  const d = createDoc({ width: W, height: H, theme, title: 'Working together — freelance, remote, under NDA', desc: HIRE_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))

  kicker(d, 'Freelance', '· working together')
  d.add(d.text(`${HIRE.services.length} services`, { x: R, y: 40, ...KICK, fill: t.muted, anchor: 'end' }))

  // headline over two lines: "Freelance, remote," / "under NDA" (italic terra)
  const HL = { font: 'serif-400', size: 38 }
  const cut = HIRE.headline.lastIndexOf(', ')
  const [h1, h2] = [HIRE.headline.slice(0, cut + 1), HIRE.headline.slice(cut + 2)]
  d.add(d.text(h1, { x: P - 1, y: HEAD_Y, ...HL, fill: t.fg, cls: 'fade-up' }))
  d.add(d.text(h2, { x: P - 1, y: HEAD_Y + 40, font: 'serif-400i', size: 38, fill: t.terra, cls: 'fade-up' }))
  assertFits('hire headline', P + Math.max(d.measure(h1, HL), d.measure(h2, { ...HL, font: 'serif-400i' })), R)

  // ── measure every block, then solve one gap unit `g` (as on the /now page);
  // the deck (HIRE.deck) is left to the alt text and the plain-text version ──
  const TW = R - P
  const LABEL_CAP = cap(d, 'mono-500', 11)
  const S_TITLE = 14.5
  const S_SIZE = 13
  const S_LH = 18.5
  const TIME = { font: 'mono-500', size: 11.5, tracking: 0.1, upper: true }
  const blocks = []

  // services ledger: title + timeline on one line, detail below
  blocks.push({
    gap: 1.2,
    h: LABEL_CAP,
    draw(top) {
      const y = top + LABEL_CAP
      d.add(d.text('Services', { x: P, y, ...KICK, fill: t.terra }))
      d.add(d.text('Typical timeline', { x: R, y, ...KICK, fill: t.muted, anchor: 'end' }))
    },
  })
  HIRE.services.forEach((s, i) => {
    const tw = d.measure(s.time, TIME)
    assertFits(`service ${i + 1} title`, P + d.measure(s.title, { font: 'sans-600', size: S_TITLE }) + 16, R - tw)
    const ls = lines(d, [tie(s.detail)], { font: 'sans-400', size: S_SIZE, width: TW, fill: t.muted, label: `service ${i + 1}` })
    const tCap = cap(d, 'sans-600', S_TITLE)
    blocks.push({
      gap: i ? 1 : 0.7,
      rule: i > 0,
      h: tCap + 20 + (ls.length - 1) * S_LH + 4,
      draw(top) {
        const by = top + tCap
        const out = [
          d.text(s.title, { x: P, y: by, font: 'sans-600', size: S_TITLE, fill: t.fg }),
          d.text(s.time, { x: R, y: by, ...TIME, fill: t.terra, anchor: 'end' }),
          ...ls.map((ln, j) => runsLine(d, ln, P, by + 20 + j * S_LH, S_SIZE, `service ${i + 1} line ${j + 1}`)),
        ]
        d.add(`<g class="fade-up" style="animation-delay:${(0.2 + i * 0.08).toFixed(2)}s">${out.join('')}</g>`)
      },
    })
  })

  // how I work: three terms with Lucide icons, under a double rule
  const IX = P
  const TX = P + 30
  const terms = HIRE.terms.map((x, i) =>
    lines(d, [{ text: `${x.title}.`, font: 'sans-600', fill: t.fg }, ` ${tie(x.detail)}`], { font: 'sans-400', size: S_SIZE, width: R - TX, fill: t.fg2, label: `term ${i + 1}` }),
  )
  const T_LH = 19
  const T_GAP = 12
  const tCap = cap(d, 'sans-400', S_SIZE)
  const termsH = terms.reduce((a, ls) => a + tCap + (ls.length - 1) * T_LH + 4, 0) + T_GAP * (terms.length - 1)
  blocks.push({
    gap: 1.4,
    h: 20 + termsH,
    draw(top) {
      d.add(doubleRule(d, P, R, top, { heavy: 1.2, gap: 2.5 }))
      let y = top + 20
      const out = []
      terms.forEach((ls, i) => {
        const by = y + tCap
        out.push(d.icon(TERM_ICONS[i], { x: IX - 1, y: by - tCap / 2 - 9, size: 18, color: t.terra, stroke: 1.7 }))
        ls.forEach((ln, j) => out.push(runsLine(d, ln, TX, by + j * T_LH, S_SIZE, `term ${i + 1} line ${j + 1}`)))
        y += tCap + (ls.length - 1) * T_LH + 4 + T_GAP
      })
      d.add(`<g class="fade-up" style="animation-delay:.55s">${out.join('')}</g>`)
    },
  })

  const END_GAP = 1.1
  const start = HEAD_Y + 40 + 9
  const units = blocks.reduce((a, b) => a + b.gap, 0) + END_GAP
  const g = (FOOT_RULE - start - blocks.reduce((a, b) => a + b.h, 0)) / units
  if (g < 10) throw new Error(`hire card too full (gap unit ${g.toFixed(1)})`)
  if (g > 30) throw new Error(`hire card too empty (gap unit ${g.toFixed(1)})`)
  let y = start
  for (const b of blocks) {
    if (b.rule) d.add(hairline(d, P, R, y + (b.gap * g) / 2))
    y += b.gap * g
    b.draw(y)
    y += b.h
  }

  // footer: the card's one link, with the address written out
  d.add(hairline(d, P, R, FOOT_RULE))
  d.add(d.icon('mail', { x: P - 1, y: FOOT_Y - 13, size: 16, color: t.terra, stroke: 1.8 }))
  const cta = runs(d, [{ text: PROFILE.email, after: 7 }, { text: '→' }], { x: P + 22, y: FOOT_Y, size: 14, font: 'sans-600', fill: t.terra })
  d.add(cta.svg)
  const tz = 'NDA on request'
  d.add(d.text(tz, { x: R, y: FOOT_Y, ...KICK, fill: t.muted, anchor: 'end' }))
  assertFits('hire footer', cta.x + 16, R - d.measure(tz, KICK))
  return d.end()
}

/** One wrapped line (from d.wrap) drawn at x, baseline y. */
function runsLine(d, ln, x, y, size, label) {
  let cx = x
  const out = []
  for (const r of ln.runs) {
    out.push(d.text(r.text, { x: cx, y, font: r.font, size, fill: r.fill }))
    cx += d.measure(r.text, { font: r.font, size })
  }
  assertFits(label, cx, R)
  return out.join('')
}

// ── now ─────────────────────────────────────────────────────────────────────

const ROWS = [
  { icon: 'bot', ...NOW[0], mark: 'AI agents & automations' },
  { icon: 'scale', ...NOW[1], strong: 'AI agent evaluation' },
  { icon: 'graduation-cap', ...NOW[2], strong: 'Computer Science' },
]
// NOW[3] ("Open to") is set as the "open to work" box below the three notes.
// The pin note names the place; the time zone sits in the footer by the email link.
const OPEN_NOTE = `${PROFILE.openTo.note} · ${PROFILE.city}, ${PROFILE.location.split(', ').at(-1)}` // … · Vadodara, India

const NOW_ALT = [
  '/now — what I’m doing now.',
  ...NOW.slice(0, 3).map((n) => `${n.label}: ${n.text}.`),
  `${PROFILE.openTo.headline} — ${PROFILE.openTo.detail}: ${PROFILE.openTo.types.join(', ')}; ${OPEN_NOTE}.`,
  `${LINKS.hire.label}: ${PROFILE.email} · ${PROFILE.timezone}.`,
].join(' ')

function renderNow(theme) {
  const d = createDoc({ width: W, height: H, theme, title: '/now — what I’m doing now', desc: NOW_ALT })
  editorial(d)
  const t = d.t
  d.add(paper(d))

  kicker(d, '/now', '· from my desk')

  const HL = { font: 'serif-400', size: 38 } // = the hire headline across the spread
  d.add(d.text('What I’m doing now', { x: P - 1, y: HEAD_Y, ...HL, fill: t.fg, cls: 'fade-up' }))
  assertFits('now headline', P + d.measure('What I’m doing now', HL), R)

  // ── measure every block, then solve one gap unit `g` so the blocks spread
  // evenly from the headline down to the footer rule ──
  const IX = P
  const TX = P + 32
  const TW = R - TX
  const SIZE = 14.5
  const LH = 22
  const TEXT_Y = 24 // label baseline → first text baseline
  const LABEL_CAP = cap(d, 'mono-500', 11)
  const rows = ROWS.map((r, i) => {
    const segs = []
    const key = r.mark || r.strong
    const at = r.text.indexOf(key)
    if (at > 0) segs.push(r.text.slice(0, at))
    segs.push({ text: r.mark ? nb(key) : key, font: 'sans-600', fill: t.fg })
    if (at + key.length < r.text.length) segs.push(r.text.slice(at + key.length))
    return { ...r, ls: lines(d, segs, { font: 'sans-400', size: SIZE, width: TW, fill: t.fg2, label: `now row ${i + 1}` }) }
  })

  const CHIP = { h: 30, font: 'sans-500', size: 13, padX: 12, r: 15, fg: t.fg, bg: t.surfaceRaised, border: t.borderStrong }
  const OPEN_LINE = { font: 'serif-400', size: 30 } // the card's closing line, well under the 38 headline

  // each block: gap units above it, its height (top → bottom), and how to draw it
  const blocks = []
  rows.forEach((r, i) => {
    const h = LABEL_CAP + TEXT_Y + (r.ls.length - 1) * LH + 5
    blocks.push({
      gap: i ? 2 : 1.25,
      rule: i > 0, // hairline centred in the gap above
      h,
      draw(top) {
        const ly = top + LABEL_CAP
        const out = [
          d.icon(r.icon, { x: IX - 1, y: ly - LABEL_CAP / 2 - 9, size: 18, color: t.terra, stroke: 1.7 }),
          d.text(r.label, { x: TX, y: ly, ...KICK, fill: t.terra }),
          drawLines(d, r.ls, { x: TX, y: ly + TEXT_Y, size: SIZE, lh: LH, mark: r.mark && nb(r.mark), label: `now row ${i + 1}` }),
        ]
        d.add(`<g class="fade-up" style="animation-delay:${(0.15 + i * 0.12).toFixed(2)}s">${out.join('')}</g>`)
      },
    })
  })
  // the "open to work" box (NOW[3], set as the four work types)
  const OK_Y = 22 // double rule → kicker baseline
  const LINE_Y = OK_Y + 41 // → serif line baseline
  const CHIP_Y = LINE_Y + 18 // → chips top
  const NOTE_Y = CHIP_Y + CHIP.h + 26 // → note baseline
  blocks.push({
    gap: 1.6,
    h: NOTE_Y + 4,
    draw(top) {
      d.add(doubleRule(d, P, R, top, { heavy: 1.2, gap: 2.5 }))
      const ky = top + OK_Y
      d.add(liveDot(d, P + 4, ky - LABEL_CAP / 2, 3.8))
      const ok = runs(d, [{ text: 'Open to work', fill: t.green, after: 8 }, { text: '· worldwide', fill: t.muted }], { x: P + 16, y: ky, ...KICK })
      d.add(ok.svg)
      const line = `${PROFILE.openTo.detail[0].toUpperCase()}${PROFILE.openTo.detail.slice(1)}.`
      d.add(d.text(line, { x: P - 1, y: top + LINE_Y, ...OPEN_LINE, fill: t.fg }))
      assertFits('open line', P + d.measure(line, OPEN_LINE), R)
      const chips = d.flow(PROFILE.openTo.types, { x: P, y: top + CHIP_Y, width: R - P, gap: 8, make: (label, p) => d.pill(label, { ...CHIP, ...p }) })
      if (chips.rows !== 1) throw new Error('open-to chips wrap')
      d.add(`<g class="fade-up" style="animation-delay:.55s">${chips.svg}</g>`)
      const ny = top + NOTE_Y
      d.add(d.icon('map-pin', { x: P - 1, y: ny - 13, size: 16, color: t.muted, stroke: 1.8 }))
      const note = runs(d, [{ text: PROFILE.openTo.note, font: 'sans-600', fill: t.fg2 }, { text: OPEN_NOTE.slice(PROFILE.openTo.note.length) }], { x: P + 22, y: ny, font: 'sans-400', size: 13, fill: t.muted })
      d.add(note.svg)
      assertFits('open note', note.x, R)
    },
  })
  const END_GAP = 1.1
  const start = HEAD_Y + 9 // headline descenders
  const units = blocks.reduce((a, b) => a + b.gap, 0) + END_GAP
  const g = (FOOT_RULE - start - blocks.reduce((a, b) => a + b.h, 0)) / units
  if (g < 12) throw new Error(`now card too full (gap unit ${g.toFixed(1)})`)
  // no pull line any more (the hiring hook lives in the letter), so the notes
  // breathe wider than the other cards
  if (g > 33) throw new Error(`now card too empty (gap unit ${g.toFixed(1)})`)
  let y = start
  for (const b of blocks) {
    if (b.rule) d.add(hairline(d, P, R, y + (b.gap * g) / 2))
    y += b.gap * g
    b.draw(y)
    y += b.h
  }

  // footer: the card's one link + the time zone a reply comes from (the
  // hiring hook and the "— Harsh" signature belong to the letter, No. 5)
  d.add(hairline(d, P, R, FOOT_RULE))
  const cta = runs(d, [{ text: LINKS.hire.label, after: 7 }, { text: '→' }], { x: P, y: FOOT_Y, size: 14, font: 'sans-600', fill: t.terra })
  d.add(cta.svg)
  const tz = PROFILE.timezone
  d.add(d.text(tz, { x: R, y: FOOT_Y, ...KICK, fill: t.muted, anchor: 'end' }))
  assertFits('footer', cta.x + 16, R - d.measure(tz, KICK))
  return d.end()
}

export default [
  { name: 'hire', width: W, height: H, alt: HIRE_ALT, href: LINKS.hire.href, render: renderHire },
  { name: 'now', width: W, height: H, alt: NOW_ALT, href: LINKS.hire.href, render: renderNow },
]
