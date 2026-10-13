// No. 5 — "Write to me." The closing airmail letter.
//
// A reply envelope, pre-addressed to Harsh: an airmail border (terracotta and
// navy diagonal stripes from one SVG pattern) around a sheet of the
// publication's paper. Left, the letter — the hiring hook as a mono kicker,
// "Write to me." in the display serif, the body, the sign-off — and the email
// address set large in mono with an arrow (the whole image is one mailto
// link, pre-filled for a role). Right, the address side: a perforated stamp
// with Harsh's portrait and "VADODARA", a postmark ring ("OPEN TO WORK ·
// WORLDWIDE") that lands with the .stamp animation, cancellation waves, and
// the address lines as plain, non-link typography (the real links are in
// the README's text row under the image).
//
// Grid (desktop, 850 × 352): airmail band 11; content box 48–802 (x) and
// 48–304 (y); letter column 48–486; dashed fold at 506; address column
// 534–802. The stamp's top edge sits on the kicker's cap height; the email's
// underline and the last address hairline share one y.
//
// Phone (.ph, drawn at ~0.41× on a 358 px column): kicker at 26 units,
// "Write to me." at 120, a one-line body at 30 and the email at 42 — all
// ≥ 10.5 px on the phone — with a plain portrait stamp in the top-right corner.

import { createDoc, PHONE_CSS, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { editorial, paper, hairline, portrait, inkPath, runs, assertFits } from '../lib/editorial.mjs'
import { PROFILE, LINKS, CTA } from '../content.mjs'

const W = LAYOUT.full // 850
const H = 352
const BAND = 11 // airmail border width
const P = 48 // content inset from the card edge
const R = W - P
const TOP = 48

const EMAIL = PROFILE.email

// ── shapes ──────────────────────────────────────────────────────────────────

/** Rounded rectangle as a path (clockwise). */
function roundRect(x, y, w, h, r) {
  return `M${r1(x + r)} ${r1(y)}H${r1(x + w - r)}A${r} ${r} 0 0 1 ${r1(x + w)} ${r1(y + r)}V${r1(y + h - r)}A${r} ${r} 0 0 1 ${r1(x + w - r)} ${r1(y + h)}H${r1(x + r)}A${r} ${r} 0 0 1 ${r1(x)} ${r1(y + h - r)}V${r1(y + r)}A${r} ${r} 0 0 1 ${r1(x + r)} ${r1(y)}Z`
}

/**
 * Stamp outline with perforations: a rectangle whose edges are bitten by
 * semicircles at an even pitch (corners left square), traced clockwise.
 */
function perforated(x, y, w, h, { pitch = 8, r = 2.4 } = {}) {
  const nx = Math.max(2, Math.round(w / pitch))
  const ny = Math.max(2, Math.round(h / pitch))
  const px = w / nx
  const py = h / ny
  const bite = (x2, y2) => `A${r} ${r} 0 0 0 ${r1(x2)} ${r1(y2)}`
  let p = `M${r1(x)} ${r1(y)}`
  for (let i = 1; i < nx; i++) p += `H${r1(x + i * px - r)}${bite(x + i * px + r, y)}`
  p += `H${r1(x + w)}`
  for (let i = 1; i < ny; i++) p += `V${r1(y + i * py - r)}${bite(x + w, y + i * py + r)}`
  p += `V${r1(y + h)}`
  for (let i = nx - 1; i > 0; i--) p += `H${r1(x + i * px + r)}${bite(x + i * px - r, y + h)}`
  p += `H${r1(x)}`
  for (let i = ny - 1; i > 0; i--) p += `V${r1(y + i * py + r)}${bite(x, y + i * py - r)}`
  return p + 'Z'
}

/** The airmail card: striped band, paper sheet inside, hairline edges. */
function envelope(d) {
  const t = d.t
  const dark = t.name === 'dark'
  const sw = 15 // stripe width (measured across the stripe)
  const pid = d.uid('am')
  // terracotta · paper · navy · paper, at 45°
  d.def(
    `<pattern id="${pid}" width="${sw * 4}" height="${sw * 4}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="${sw}" height="${sw * 4}" fill="${t.terraFill}"${dark ? ' fill-opacity=".9"' : ''}/>` +
      `<rect x="${sw * 2}" width="${sw}" height="${sw * 4}" fill="${t.ink}"${dark ? ' fill-opacity=".62"' : ''}/>` +
      `</pattern>`,
  )
  const bg = d.linearGradient([t.surfaceTop, t.surfaceBottom], { x1: 0, y1: 0, x2: 0.3, y2: 1 })
  const outer = roundRect(0.5, 0.5, W - 1, H - 1, 14)
  const inner = roundRect(BAND, BAND, W - 2 * BAND, H - 2 * BAND, 4)
  return [
    `<path d="${outer}" fill="url(#${bg})"/>`,
    `<path d="${outer}${inner}" fill="url(#${pid})" fill-rule="evenodd"/>`,
    paper(d, { x: BAND, y: BAND, w: W - 2 * BAND, h: H - 2 * BAND, r: 4 }),
    `<path d="${outer}" fill="none" stroke="${t.border}"/>`,
  ].join('')
}

/**
 * Perforated stamp: Harsh's portrait over a "VADODARA" caption. Returns
 * { svg, w, h }. On espresso the stamp is cream paper, on paper it is white.
 */
function stamp(d, place, x, y, w, { inset = 7, label = 10.5, pitch = 8, hole = 2.4, strokeW = 1 } = {}) {
  // label: caption size, or 0 for a plain stamp (a stamp's bottom margin is a little deeper)
  const t = d.t
  const dark = t.name === 'dark'
  const pw = w - 2 * inset
  const plate = place(x + inset, y + inset, pw, { r: 0, frame: false })
  const capBand = label ? Math.round(label * 2.35) : Math.round(inset * 1.6)
  const h = inset + plate.h + capBand
  const sheet = dark ? t.fg : t.surfaceRaised
  const ink = dark ? t.surfaceBottom : t.fg
  const out = [
    `<path d="${perforated(x, y, w, h, { pitch, r: hole })}" fill="${sheet}"${dark ? '' : ` stroke="${t.borderStrong}" stroke-width="${strokeW}"`}/>`,
    plate.svg,
    `<rect x="${r1(x + inset)}" y="${r1(y + inset)}" width="${r1(pw)}" height="${r1(plate.h)}" fill="none" stroke="${ink}" stroke-opacity=".22" stroke-width="${strokeW}"/>`,
    label && d.text(PROFILE.city, { x: x + w / 2, y: y + inset + plate.h + capBand / 2 + (label * 0.71) / 2 + 0.5, font: 'mono-500', size: label, tracking: 0.18, upper: true, fill: ink, anchor: 'middle' }),
  ]
  return { svg: out.filter(Boolean).join(''), w, h }
}

/**
 * Postmark: two rings with "OPEN TO WORK" round the top arc and "WORLDWIDE"
 * along the bottom arc (both reading left to right, as on a real cancel), dots
 * at 3 and 9 o'clock, the timezone in the centre; tilted like a hand-applied
 * stamp. Mono glyphs are placed one by one (equal advances, no kerning lost).
 * The outer <g> carries .stamp and no transform; the tilt sits on the inner <g>.
 */
function postmark(d, cx, cy, { r = 46, size = 10, tilt = -12, color = d.t.ink, opacity = 0.8, sw = 1.3, gap = 1.9 } = {}) {
  const [top, bottom] = PROFILE.openTo.headline.split(',').map((s) => s.trim().toUpperCase()) // OPEN TO WORK · WORLDWIDE
  const [, zone, offset] = PROFILE.timezone.match(/^(\S+) \((.+)\)$/) // IST · UTC+5:30
  const capH = size * 0.71
  const rIn = r - Math.max(13, capH * 2.1)
  const pad = (r - rIn - capH) / 2
  const rTop = rIn + pad // baseline of the top arc (caps point outwards)
  const rBot = r - pad // baseline of the bottom arc (caps point inwards)
  const adv = d.measure('M', { font: 'mono-500', size }) + gap
  const deg = (len, rad) => (len / rad) * (180 / Math.PI)
  const arc = (str, rad, flip) => {
    const chars = [...str]
    const step = deg(adv + (flip ? 0.5 : 0), flip ? rBot - capH / 2 : rTop + capH / 2)
    const span = step * (chars.length - 1)
    return chars
      .map((ch, i) => {
        if (ch === ' ') return ''
        const a = flip ? span / 2 - i * step : -span / 2 + i * step
        const y = flip ? cy + rad : cy - rad
        return `<g transform="rotate(${r1(a)} ${r1(cx)} ${r1(cy)})">${d.text(ch, { x: cx, y, font: 'mono-500', size, fill: color, anchor: 'middle' })}</g>`
      })
      .join('')
  }
  const rm = (rIn + r) / 2
  const dots = [-1, 1].map((s) => `<circle cx="${r1(cx + s * rm)}" cy="${r1(cy)}" r="${r1(size * 0.17)}" fill="${color}"/>`).join('')
  const mid = [
    d.text(zone, { x: cx, y: cy + 1.5, font: 'mono-500', size: size * 1.45, tracking: 0.06, fill: color, anchor: 'middle' }),
    `<path d="M${r1(cx - rIn * 0.6)} ${r1(cy + 6.5)}H${r1(cx + rIn * 0.6)}" stroke="${color}" stroke-width="${r1(sw * 0.7)}"/>`,
    d.text(offset, { x: cx, y: cy + 7 + size * 1.15, font: 'mono-500', size: size * 0.82, fill: color, anchor: 'middle' }),
  ].join('')
  return (
    `<g class="stamp"><g transform="rotate(${tilt} ${r1(cx)} ${r1(cy)})" opacity="${opacity}">` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(rIn)}" fill="none" stroke="${color}" stroke-width="${r1(sw * 0.8)}"/>` +
    arc(top, rTop, false) +
    arc(bottom, rBot, true) +
    dots +
    mid +
    `</g></g>`
  )
}

/** Machine-cancel waves running left from the postmark. */
function waves(d, x0, x1, yMid, { n = 4, gap = 11, amp = 3.2, period = 14, color = d.t.ink, opacity = 0.5, sw = 1.2 } = {}) {
  const half = period / 2
  const k = Math.floor((x1 - x0) / period)
  const paths = []
  for (let i = 0; i < n; i++) {
    const y = yMid - ((n - 1) * gap) / 2 + i * gap
    let p = `M${r1(x1 - k * period)} ${r1(y)}q${r1(half / 2)} ${-amp} ${half} 0`
    for (let j = 1; j < k * 2; j++) p += `t${half} 0`
    paths.push(`<path d="${p}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`)
  }
  return `<g class="fade-in" style="animation-delay:1.45s"><g opacity="${opacity}">${paths.join('')}</g></g>`
}

// ── render ──────────────────────────────────────────────────────────────────

function render(theme) {
  const d = createDoc({ width: W, height: H, theme, title: `${CTA.title} — ${PROFILE.openTo.headline}`, desc: ALT })
  editorial(d)
  d.css(PHONE_CSS)
  const t = d.t
  const place = portrait(d) // one embedded plate, placed in both layers
  d.add(envelope(d))

  // ───────────────────────── desktop ─────────────────────────
  const dt = []
  const LW = 438 // letter column width (48–486)
  const FOLD = 506
  const AX = FOLD + 28 // address column 534–802

  // the letter
  const KB = Math.round(TOP + 12 * 0.71) // kicker baseline: cap height on TOP
  const kw = d.measure(CTA.kicker, { font: 'mono-500', size: 12, tracking: 0.14, upper: true })
  dt.push(d.text(CTA.kicker, { x: P, y: KB, font: 'mono-500', size: 12, tracking: 0.14, upper: true, fill: t.terra, cls: 'fade-in' }))
  assertFits('kicker', P + kw, P + LW)

  const TB = KB + 68
  dt.push(d.text(CTA.title, { x: P - 3, y: TB, font: 'serif-400', size: 66, fill: t.fg, cls: 'fade-up', style: 'animation-delay:.08s' }))

  const B1 = TB + 38
  const BLH = 23.5
  const body = d.paragraph(bodySegments(t), { x: P, y: B1, width: LW, font: 'sans-400', size: 15.5, lineHeight: BLH, fill: t.fg2 })
  dt.push(body.svg)
  const BL = B1 + (body.lines - 1) * BLH

  const SB = BL + 41
  dt.push(d.text(CTA.signoff, { x: P, y: SB, font: 'serif-400i', size: 28, fill: t.terra }))

  // the address to write to — the one link in this image
  const EB = H - TOP - 6
  const UL = EB + 10 // email underline = the last address hairline
  const es = 24
  const ew = d.measure(EMAIL, { font: 'mono-500', size: es })
  dt.push(d.text(EMAIL, { x: P, y: EB, font: 'mono-500', size: es, fill: t.fg }))
  dt.push(d.text('→', { x: P + ew + 12, y: EB, font: 'mono-500', size: es, fill: t.terra }))
  dt.push(inkPath(d, `M${P} ${UL}H${r1(P + ew)}`, { len: ew, stroke: t.terra, width: 1.6, delay: 0.7, dur: 1 }))
  assertFits('email + arrow', P + ew + 12 + d.measure('→', { font: 'mono-500', size: es }), FOLD - 16)
  assertFits('sign-off above email', SB + 26, EB - es * 0.71)

  // the fold between letter and address side
  dt.push(`<path d="M${FOLD} ${TOP}V${H - TOP}" stroke="${t.ruleSoft}" stroke-dasharray="2 5"/>`)

  // stamp, top-right, its top on the kicker's cap height
  const SW = 94
  const st = stamp(d, place, R - SW, TOP, SW)
  dt.push(st.svg)
  // postmark over the stamp's lower-left corner, waves running left
  const PMR = 46
  const PMX = R - SW - PMR + 14 // overlaps the stamp's white margin, just touching the photo
  const PMY = TOP + 80
  dt.push(waves(d, AX, PMX - PMR - 8, PMY, { n: 4, gap: 11 }))
  dt.push(postmark(d, PMX, PMY, { r: PMR }))

  // address lines (plain typography: the real links are in the README row below)
  const A = { font: 'sans-400', size: 13.5, fill: t.fg2 }
  const lines = [
    [{ text: PROFILE.name, font: 'serif-400i', size: 23, fill: t.fg }],
    [{ text: PROFILE.location }],
    [{ text: `linkedin.com/${LINKS.linkedin.value}` }],
    [{ text: LINKS.website.value, after: 8 }, { text: '·', fill: t.faint, after: 8 }, { text: `Discord ${LINKS.discord.value}` }],
  ]
  const VX = AX + 28
  let ay = EB - 3 * 26
  assertFits('address below postmark', PMY + PMR + 20, ay - 23 * 0.72)
  dt.push(d.text('To', { x: AX, y: ay, font: 'mono-500', size: 11, tracking: 0.14, upper: true, fill: t.muted }))
  lines.forEach((segs, i) => {
    const ln = runs(d, segs, { x: VX, y: ay, ...A })
    dt.push(ln.svg)
    assertFits(`address line ${i}`, ln.x, R)
    dt.push(hairline(d, VX, R, ay + UL - EB))
    ay += 26
  })
  d.add(`<g class="dt">${dt.join('')}</g>`)

  // ───────────────────────── phone ─────────────────────────
  const ph = []
  const pk = 26
  const pKB = Math.round(TOP + pk * 0.71)
  const pkw = d.measure(CTA.kicker, { font: 'mono-500', size: pk, tracking: 0.04, upper: true })
  ph.push(d.text(CTA.kicker, { x: P, y: pKB, font: 'mono-500', size: pk, tracking: 0.04, upper: true, fill: t.terra }))
  const pSW = 112
  const pst = stamp(d, place, R - pSW, TOP, pSW, { inset: 8, label: 0, pitch: 9, hole: 3, strokeW: 1.6 })
  ph.push(pst.svg)
  assertFits('phone kicker vs stamp', P + pkw + 24, R - pSW)

  const pTB = pKB + 116
  ph.push(d.text(CTA.title, { x: P - 5, y: pTB, font: 'serif-400', size: 120, fill: t.fg }))

  const pBB = pTB + 54
  const short = runs(
    d,
    [
      { text: 'Open to work ', font: 'sans-600', fill: t.fg },
      { text: 'worldwide', font: 'sans-600', fill: t.fg, after: 14 },
      { text: '·', fill: t.faint, after: 14 },
      { text: PROFILE.openTo.note, fill: t.fg2 },
    ],
    { x: P, y: pBB, size: 30, font: 'sans-400' },
  )
  ph.push(short.svg)
  assertFits('phone body', short.x, R)

  const pes = 42
  const pEB = pBB + 60
  const pew = d.measure(EMAIL, { font: 'mono-500', size: pes })
  ph.push(d.text(EMAIL, { x: P, y: pEB, font: 'mono-500', size: pes, fill: t.fg }))
  ph.push(`<path d="M${P} ${pEB + 13}H${r1(P + pew)}" stroke="${t.terra}" stroke-width="3"/>`)
  ph.push(d.text('→', { x: R, y: pEB, font: 'mono-500', size: pes, fill: t.terra, anchor: 'end' }))
  assertFits('phone email + arrow', P + pew + 12 + d.measure('→', { font: 'mono-500', size: pes }), R)
  assertFits('phone bottom margin', pEB + 13 + 30, H - BAND)
  d.add(`<g class="ph">${ph.join('')}</g>`)

  return d.end()
}

/**
 * CTA.body set like a letter: one sentence per line group (the ask gets a
 * line of its own), the open-to-work clause in semibold ink, and the last two
 * words tied so no line ends on an orphan.
 */
function bodySegments(t) {
  const key = 'open to work worldwide'
  const text = CTA.body.replace(/\.\s+(?=\S)/g, '.\n').replace(/ (\S+)$/, ' $1')
  const i = text.indexOf(key)
  if (i < 0) return [text]
  return [text.slice(0, i), { text: key, font: 'sans-600', fill: t.fg }, text.slice(i + key.length)].filter(Boolean)
}

const ALT = [
  `${CTA.kicker} ${CTA.title}`,
  `“${CTA.body}” ${CTA.signoff}.`,
  `Email ${PROFILE.email} — opens a pre-filled email about a role.`,
  `An airmail envelope addressed to ${PROFILE.name}, ${PROFILE.location}; also linkedin.com/${LINKS.linkedin.value}, ${LINKS.website.value} and Discord ${LINKS.discord.value}.`,
  `The stamp is Harsh’s portrait over “${PROFILE.city}”; the postmark reads “${PROFILE.openTo.headline}”, ${PROFILE.timezone}.`,
].join(' ')

export default [
  {
    name: 'letter',
    width: W,
    height: H,
    alt: ALT,
    href: LINKS.hire.href,
    render,
  },
]
