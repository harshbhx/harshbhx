// Closing block: the call-to-action card, six link buttons and the footer.
//
//  cta     850×H  two columns: kicker + two-line gradient title on the left,
//                 pitch + email "button" on the right, working-style strip
//                 along the bottom; a light beam travels around the border.
//  btn-*   135×44 pill buttons, brand logo + label (six fit one desktop row,
//                 two per row on phones). The pill is inset inside the canvas
//                 so neighbouring buttons get a real gap; a link-less entry
//                 (Discord) shows its handle instead of the platform name.
//  footer  850×H  centred sign-off between two gradient rules.
//
// Full-width images render at ~0.42× on phones, so the CTA and the footer carry
// a second, phone-sized layer: `.dt` content is shown by default, `.ph` content
// replaces it when the image itself is narrower than PHONE_MAX px (an SVG's own
// media queries see the size the image is drawn at).

import { createDoc, r1 } from '../lib/svg.mjs'
import { font as loadFont } from '../lib/fonts.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROFILE, LINKS, CTA, WORKING_STYLE } from '../content.mjs'

const W = LAYOUT.full
const R = LAYOUT.radius
const PHONE_MAX = 600
const PHONE_CSS = `.ph{display:none}@media (max-width:${PHONE_MAX}px){.dt{display:none}.ph{display:inline}}`

// rgba() from a #rrggbb theme token, for tints derived from tokens
const rgba = (hex, a) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${a})`
}

// Left side bearing (px) of a string's first glyph, for optical left alignment.
function lsb(fontKey, str, size) {
  const f = loadFont(fontKey)
  return (f.charToGlyph(str[0]).leftSideBearing * size) / f.unitsPerEm
}

// Rounded-rect outline as a path (clockwise, starting after the top-left corner),
// so things can travel along it.
function roundRectPath(x, y, w, h, r) {
  const f = r1
  return `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} A ${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} A ${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} A ${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V ${f(y + r)} A ${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`
}

// Split words into `n` lines with the most even widths (like text-wrap: balance).
function balance(d, str, n, o) {
  const words = str.split(' ')
  if (n === 1 || words.length < 2) return [str]
  let best = null
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const worst = Math.max(d.measure(a, o), d.measure(b, o))
    if (!best || worst < best.worst) best = { worst, lines: [a, b] }
  }
  return best.lines
}

// Rich-paragraph content with `phrases` (when present in `str`) set in `style`.
function emphasize(str, phrases, style) {
  const out = []
  let rest = str
  for (const p of phrases) {
    const i = rest.indexOf(p)
    if (i < 0) continue
    if (i) out.push(rest.slice(0, i))
    out.push({ text: p, ...style })
    rest = rest.slice(i + p.length)
  }
  if (rest) out.push(rest)
  return out
}

// Narrowest width that still wraps `content` into the same number of lines,
// so a paragraph has no short orphan line.
function balancedWidth(d, content, o) {
  const lines = d.paragraph(content, o).lines
  let lo = 40
  let hi = o.width
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    if (d.paragraph(content, { ...o, width: mid }).lines > lines) lo = mid
    else hi = mid
  }
  return Math.ceil(hi)
}

// Several lines of text painted with one gradient spanning the whole block.
function gradientLines(d, lines, { x, y, size, lh, font = 'display-700', tracking = 0, stops, cls, style }) {
  const m = d.metrics(font, size)
  const w = Math.max(...lines.map((s) => d.measure(s, { font, size, tracking })))
  const top = y - m.ascender - 2
  const hgt = (lines.length - 1) * lh + m.ascender + m.descender + 4
  const gid = d.linearGradient(stops, { x1: x, y1: top + hgt * 0.2, x2: x + w, y2: top + hgt * 0.8, units: 'userSpaceOnUse' })
  const mid = d.uid('m')
  d.def(
    `<mask id="${mid}" maskUnits="userSpaceOnUse" x="${r1(x - 6)}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}">` +
      lines.map((s, i) => d.text(s, { x, y: y + i * lh, font, size, tracking, fill: '#fff' })).join('') +
      `</mask>`,
  )
  const rect = `<rect x="${r1(x - 6)}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}" fill="url(#${gid})" mask="url(#${mid})"/>`
  return { svg: cls || style ? `<g class="${cls || ''}"${style ? ` style="${style}"` : ''}>${rect}</g>` : rect, w }
}

// A soft light that travels around a rounded rect, lighting up a gradient
// border as it passes. Two spots, half a lap apart. `glow` adds a blurred
// halo (clipped to the card, so only its inner half shows) that fades out
// inward instead of ending in a hard edge.
function borderBeam(d, { x, y, w, h, r, dur = 12, spot = 120, stroke = 1.5, stops, glow = 0, glowBlur = 4, glowOpacity = 0.22, clip }) {
  const t = d.t
  const pid = d.uid('bp')
  const path = roundRectPath(x, y, w, h, r)
  d.def(`<path id="${pid}" d="${path}"/>`)
  const rg = d.uid('br')
  d.def(`<radialGradient id="${rg}"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`)
  const mid = d.uid('bm')
  const spots = [0, -dur / 2]
    .map(
      (begin) =>
        `<circle r="${spot}" fill="url(#${rg})"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite"><mpath href="#${pid}"/></animateMotion></circle>`,
    )
    .join('')
  d.def(
    `<mask id="${mid}" maskUnits="userSpaceOnUse" x="${r1(x - spot)}" y="${r1(y - spot)}" width="${r1(w + spot * 2)}" height="${r1(h + spot * 2)}">` +
      `<g class="packet">${spots}</g></mask>`,
  )
  const grad = d.linearGradient(stops || t.gradBorder, { x1: x, y1: 0, x2: x + w, y2: 0, units: 'userSpaceOnUse' })
  const parts = [`<path d="${path}" fill="none" stroke="url(#${grad})" stroke-width="${stroke}"/>`]
  if (glow) {
    const blur = d.uid('bb')
    const m = glow + glowBlur * 3
    d.def(`<filter id="${blur}" filterUnits="userSpaceOnUse" x="${r1(x - m)}" y="${r1(y - m)}" width="${r1(w + m * 2)}" height="${r1(h + m * 2)}"><feGaussianBlur stdDeviation="${glowBlur}"/></filter>`)
    parts.unshift(`<g${clip ? ` clip-path="url(#${clip})"` : ''}><path d="${path}" fill="none" stroke="url(#${grad})" stroke-width="${glow}" opacity="${glowOpacity}" filter="url(#${blur})"/></g>`)
  }
  return `<g mask="url(#${mid})">${parts.join('')}</g>`
}

// ───────────────────────── CTA card ─────────────────────────

const CTA_ALT = `${CTA.title} ${CTA.body} Email me at ${PROFILE.email}. Open to work · ${PROFILE.timezone}. How I work: ${WORKING_STYLE.join(' · ')}.`

const CTA_H = 256

function renderCta(t) {
  const H = CTA_H
  const d = createDoc({ width: W, height: H, theme: t, title: `${CTA.title} — ${PROFILE.email}`, desc: CTA_ALT })
  d.css(PHONE_CSS)
  const dark = t.name === 'dark'
  const PX = 44 // horizontal padding
  const stripH = 48 // working-style strip along the bottom
  const mainH = H - stripH

  // ── email button geometry (fixes the right column) ──
  const btn = emailButtonSpec(d, { h: 54, disc: 38, pad: 8, gap: 14, size: 18, icon: 18, arrow: 18, padR: 20, ring: 1.3 })
  const RX = W - PX - btn.w // right column x
  const RW = btn.w

  // ── title: two balanced lines, sized to fill the left column ──
  const titleFont = 'display-700'
  const titleTrack = -0.025
  const leftW = RX - PX - 40
  const lines = balance(d, CTA.title, 2, { font: titleFont, size: 48, tracking: titleTrack })
  let titleSize = 52
  while (Math.max(...lines.map((s) => d.measure(s, { font: titleFont, size: titleSize, tracking: titleTrack }))) > leftW) titleSize -= 0.5
  const titleLH = Math.round(titleSize * 1.08)

  // ── body: balanced wrap in the right column, key phrases brighter ──
  const bodyO = { font: 'body-400', size: 18, lineHeight: 28, width: RW }
  const bodyContent = emphasize(CTA.body, ['ships end to end', 'owns the outcome'], { fill: t.fg, font: 'body-500' })
    .map((s) => (typeof s === 'string' ? s : { ...s, text: s.text.replace(/ /g, '\u00a0') })) // keep phrases unbroken
  const bodyW = balancedWidth(d, bodyContent, bodyO)
  const body = d.paragraph(bodyContent, { ...bodyO, width: bodyW })

  // ── vertical rhythm: both columns share a top and a bottom edge ──
  const bm = d.metrics('body-400', bodyO.size)
  const rightH = bm.capHeight + (body.lines - 1) * bodyO.lineHeight + 26 + btn.h
  const top = Math.round((mainH - rightH) / 2) + 2
  const bodyBase = top + bm.capHeight
  const btnY = Math.round(bodyBase + (body.lines - 1) * bodyO.lineHeight + 26)
  // left column: status pill top = body cap top; the last title baseline sits
  // on the email baseline so both columns end together
  const pillH = 28
  const pillY = top - 3
  const emailBase = btnY + btn.h / 2 + d.metrics(btn.font, btn.size).capHeight / 2
  const title2Base = Math.round(emailBase)
  const title1Base = title2Base - titleLH

  // ── phone layer: one-line title over a large email button, centred ──
  // (pitch, status and working-style strip would be ~5–8px on a phone; they
  // stay in the alt text, and the strip's promises are repeated in services)
  const pBtn = emailButtonSpec(d, { h: 80, disc: 56, pad: 12, gap: 20, size: 30, icon: 26, arrow: 26, padR: 30, ring: 2.2 })
  let pTitleSize = 62
  while (d.measure(CTA.title, { font: titleFont, size: pTitleSize, tracking: titleTrack }) > W - PX * 2 - 24) pTitleSize -= 0.5
  const pTitleW = d.measure(CTA.title, { font: titleFont, size: pTitleSize, tracking: titleTrack })
  const pCap = d.metrics(titleFont, pTitleSize).capHeight
  const pGap = 38 // title baseline → button top (clears the descenders)
  const pTop = Math.round((H - (pCap + pGap + pBtn.h)) / 2)
  const pTitleBase = pTop + pCap
  const pBtnY = Math.round(pTitleBase + pGap)
  const pBtnX = Math.round((W - pBtn.w) / 2)

  // ── surface ──
  const clip = d.uid('cc')
  d.def(`<clipPath id="${clip}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}"/></clipPath>`)
  const surf = d.linearGradient([t.surfaceTop, t.surfaceBottom], { x1: 0, y1: 0, x2: 0.35, y2: 1 })
  const sheen = d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, 1], [1, t.highlight, 0]])
  d.add(
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="url(#${surf})"/>`,
    `<g clip-path="url(#${clip})">`,
    `<g class="drift-a">${d.glow({ cx: 150, cy: 30, r: 300, color: t.glowViolet })}</g>`,
    `<g class="dt">`,
    `<g class="drift-b">${d.glow({ cx: RX + RW * 0.6, cy: btnY + btn.h, r: 260, color: t.glowCyan })}</g>`,
    d.pattern({ x: 0, y: 0, w: W, h: mainH, kind: 'dots', step: 18, fade: { cx: RX - 20, cy: mainH / 2, r: 240 } }),
    // working-style strip
    `<rect x="0" y="${mainH}" width="${W}" height="${stripH}" fill="${rgba(t.inset, dark ? 0.6 : 0.75)}"/>`,
    `<rect x="0" y="${mainH}" width="${W}" height="1" fill="${t.border}"/>`,
    `</g>`,
    `<g class="ph">`,
    `<g class="drift-b">${d.glow({ cx: W / 2 + pBtn.w * 0.3, cy: pBtnY + pBtn.h, r: 300, color: t.glowCyan })}</g>`,
    `</g>`,
    `</g>`,
    `<path d="M ${R} 1 H ${W - R}" stroke="url(#${sheen})" stroke-width="1"/>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="none" stroke="${t.border}"/>`,
  )
  // travelling light on the border
  d.add(`<g class="fade-in" style="animation-delay:.6s">${borderBeam(d, { x: 0.5, y: 0.5, w: W - 1, h: H - 1, r: R, dur: 14, spot: 140, stroke: dark ? 1.7 : 1.5, glow: 10, glowBlur: 4, glowOpacity: dark ? 0.5 : 0.3, clip })}</g>`)

  d.add(`<g class="dt">`)
  // ── left column ──
  {
    const pill = d.pill('Open to work', {
      x: PX, y: pillY, h: pillH, font: 'body-600', size: 12.5, padX: 12, gap: 8,
      dot: t.green, pulse: true, fg: t.green, bg: rgba(t.green, dark ? 0.1 : 0.07), border: rgba(t.green, dark ? 0.32 : 0.3),
    })
    const o = { font: 'mono-500', size: 11.5, tracking: 0.1, upper: true }
    const tzX = PX + pill.w + 14
    const tzBase = pillY + pillH / 2 + d.metrics(o.font, o.size).capHeight / 2
    d.add(
      `<g class="fade-up">`,
      pill.svg,
      d.icon('clock-3', { x: tzX, y: pillY + pillH / 2 - 7, size: 14, color: t.muted, stroke: 2 }),
      d.text(PROFILE.timezone, { ...o, x: tzX + 20, y: tzBase, fill: t.muted }),
      `</g>`,
    )
    // optical alignment: glyph stems on the same vertical as the pill edge
    const tx = PX - Math.min(...lines.map((l) => lsb(titleFont, l, titleSize)))
    const g = gradientLines(d, lines, { x: tx, y: title1Base, size: titleSize, lh: titleLH, font: titleFont, tracking: titleTrack, stops: t.gradText })
    d.add(`<g class="fade-up" style="animation-delay:.1s">${g.svg}</g>`)
  }

  // ── right column ──
  d.add(d.paragraph(bodyContent, { ...bodyO, width: bodyW, x: RX, y: bodyBase, cls: 'fade-up', style: 'animation-delay:.2s' }).svg)
  d.add(`<g class="fade-up" style="animation-delay:.32s">${emailButton(d, { x: RX, y: btnY, ...btn, dark })}</g>`)

  // ── working-style strip ──
  {
    const o = { font: 'body-500', size: 13 }
    let gap = 28
    const fit = () => WORKING_STYLE.reduce((a, s) => a + d.measure(s, o), 0) + gap * (WORKING_STYLE.length - 1)
    // shrink (gap first, then type) if the list ever outgrows the content width
    while (fit() > W - PX * 2 && (gap > 18 || o.size > 11)) gap > 18 ? (gap -= 2) : (o.size -= 0.5)
    const widths = WORKING_STYLE.map((s) => d.measure(s, o))
    const total = fit()
    let x = (W - total) / 2
    const m = d.metrics(o.font, o.size)
    const base = mainH + stripH / 2 + m.capHeight / 2
    const out = []
    WORKING_STYLE.forEach((s, i) => {
      if (i) out.push(`<circle cx="${r1(x - gap / 2)}" cy="${r1(base - m.xHeight / 2)}" r="1.6" fill="${t.violet}" opacity=".7"/>`)
      out.push(d.text(s, { ...o, x, y: base, fill: t.muted }))
      x += widths[i] + gap
    })
    d.add(`<g class="fade-in" style="animation-delay:.5s">${out.join('')}</g>`)
  }
  d.add(`</g>`)

  // ── phone layer ──
  {
    const tx = (W - pTitleW) / 2
    const g = gradientLines(d, [CTA.title], { x: tx, y: pTitleBase, size: pTitleSize, lh: 0, font: titleFont, tracking: titleTrack, stops: t.gradText })
    d.add(
      `<g class="ph">`,
      `<g class="fade-up" style="animation-delay:.1s">${g.svg}</g>`,
      `<g class="fade-up" style="animation-delay:.3s">${emailButton(d, { x: pBtnX, y: pBtnY, ...pBtn, dark })}</g>`,
      `</g>`,
    )
  }

  return d.end()
}

// Email "button" geometry from its parts; returns the spec with font, the
// measured address width and the total width filled in.
function emailButtonSpec(d, spec) {
  const o = { font: 'mono-500', tracking: -0.01, ...spec }
  o.emailW = d.measure(PROFILE.email, { font: o.font, size: o.size, tracking: o.tracking })
  o.w = Math.round(o.pad + o.disc + o.gap + o.emailW + o.gap + o.arrow + o.padR)
  return o
}

function emailButton(d, { x, y, w, h, disc, pad, gap, size, font, tracking, emailW, icon, arrow, ring: ringW, dark }) {
  const t = d.t
  const r = h / 2
  const k = h / 54 // effects scale with the button
  const fill = d.linearGradient([t.surfaceRaised, dark ? t.inset : t.surfaceBottom], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const ring = d.linearGradient(t.gradAccent, { x1: x, y1: y, x2: x + w, y2: y + h, units: 'userSpaceOnUse' })
  const discFill = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
  const cx = x + pad + disc / 2
  const cy = y + h / 2
  const tx = x + pad + disc + gap
  const base = cy + d.metrics(font, size).capHeight / 2
  const shadow = d.uid('sh')
  d.def(`<filter id="${shadow}" x="-20%" y="-60%" width="140%" height="220%"><feDropShadow dx="0" dy="${r1((dark ? 6 : 4) * k)}" stdDeviation="${r1((dark ? 9 : 7) * k)}" flood-color="${t.violetStrong}" flood-opacity="${dark ? 0.32 : 0.16}"/></filter>`)
  // every 7s a soft glint sweeps the button and the arrow nudges as it passes
  const glint = dark ? '#ffffff' : t.violet
  const sh = d.linearGradient([[0, glint, 0], [0.5, glint, dark ? 0.16 : 0.12], [1, glint, 0]])
  const bclip = d.uid('bc')
  d.def(`<clipPath id="${bclip}"><rect x="${r1(x)}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`)
  const shine = d.uid('shine')
  const nudge = d.uid('nudge')
  const n = r1(3 * k)
  d.css(`@keyframes ${shine}{0%{transform:translateX(0)}22%,100%{transform:translateX(${Math.round(w + 160 * k)}px)}}.${shine}{animation:${shine} 7s cubic-bezier(.45,0,.2,1) 1.6s infinite}`)
  d.css(`@keyframes ${nudge}{0%,15%,27%,100%{transform:translate(0,0)}20%{transform:translate(${n}px,-${n}px)}}.${nudge}{animation:${nudge} 7s ease-in-out 1.6s infinite}`)
  const arrowX = tx + emailW + gap
  return [
    `<rect x="${r1(x)}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${fill})" stroke="url(#${ring})" stroke-width="${ringW}" filter="url(#${shadow})"/>`,
    `<path d="M ${r1(x + r)} ${r1(y + 1.2 * k)} H ${r1(x + w - r)}" stroke="url(#${d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, dark ? 1.6 : 1], [1, t.highlight, 0]])})" stroke-width="${r1(k)}"/>`,
    // skewed about the button's centre line so it starts and ends fully outside
    `<g clip-path="url(#${bclip})"><g class="${shine}"><rect x="${r1(x - 120 * k)}" y="${y}" width="${r1(80 * k)}" height="${h}" fill="url(#${sh})" transform="matrix(1 0 -0.36 1 ${r1(0.36 * cy)} 0)"/></g></g>`,
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${disc / 2}" fill="url(#${discFill})"/>`,
    d.icon('mail', { x: cx - icon / 2, y: cy - icon / 2, size: icon, color: '#ffffff', stroke: 2 }),
    d.text(PROFILE.email, { x: tx, y: base, font, size, tracking, fill: t.fg }),
    `<g class="${nudge}">${d.icon('arrow-up-right', { x: arrowX, y: cy - arrow / 2, size: arrow, color: t.violet, stroke: 2.2 })}</g>`,
  ].join('')
}

// ───────────────────────── link buttons ─────────────────────────

const BTN_W = 135
const BTN_H = 44
const BUTTONS = ['email', 'linkedin', 'github', 'devto', 'website', 'discord']

// Inset of the visible pill inside the canvas. Inline images are separated by
// a single space (~4px) and a ~6px line gap, so the inset is what gives the
// row a real gutter: ~12px between pills on desktop and on phones.
const BTN_INSET_X = 4
const BTN_INSET_Y = 3

function renderButton(t, key, i) {
  const L = LINKS[key]
  const d = createDoc({ width: BTN_W, height: BTN_H, theme: t, title: `${L.label}: ${L.value}`, desc: L.href ? `${L.label}: ${L.value} (${L.href})` : `${L.label}: ${L.value}` })
  const dark = t.name === 'dark'
  const x = BTN_INSET_X + 0.5
  const y = BTN_INSET_Y + 0.5
  const w = BTN_W - BTN_INSET_X * 2 - 1
  const h = BTN_H - BTN_INSET_Y * 2 - 1
  const r = h / 2

  // raised surface (lighter top); every button is secondary, the CTA above is
  // the single primary email action
  const fill = d.linearGradient(dark ? [t.surfaceRaised, t.surfaceTop] : [t.surfaceRaised, t.surfaceBottom], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const stroke = d.linearGradient(dark ? [t.borderStrong, t.border] : [t.border, t.borderStrong], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const sheen = d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, dark ? 1.4 : 1], [1, t.highlight, 0]])

  // a link-less entry can't be clicked through, so it shows the handle itself
  const label = L.href ? L.label : L.value
  const logo = 18
  const gap = 9
  const font = 'body-600'
  const size = 13
  const lw = d.measure(label, { font, size })
  const gx = (BTN_W - (logo + gap + lw)) / 2
  const cy = BTN_H / 2
  const base = cy + d.metrics(font, size).capHeight / 2

  // the pill fades in place; only the logo + label rise, inside it
  const delay = (i * 0.06).toFixed(2)
  d.css(`@keyframes rise{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.rise{animation:rise .8s cubic-bezier(.2,.7,.2,1) both}`)
  d.add(
    `<g class="fade-in" style="animation-delay:${delay}s">`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${fill})"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#${stroke})" stroke-width="1"/>`,
    `<path d="M ${r1(x + r)} ${y + 1} H ${r1(x + w - r)}" stroke="url(#${sheen})" stroke-width="1"/>`,
    `</g>`,
    `<g class="rise" style="animation-delay:${(i * 0.06 + 0.12).toFixed(2)}s">`,
    d.logo(L.icon, { x: gx, y: cy - logo / 2, size: logo, on: t.surfaceRaised }),
    d.text(label, { x: gx + logo + gap, y: base, font, size, fill: t.fg }),
    `</g>`,
  )
  return d.end()
}

// ───────────────────────── footer ─────────────────────────

const FOOT_H = 64
const FOOT_LINE = `${PROFILE.handle} · ${PROFILE.location.toLowerCase()}`

function renderFooter(t) {
  const H = FOOT_H
  const d = createDoc({ width: W, height: H, theme: t, title: `${PROFILE.handle} — ${PROFILE.location}`, desc: `Footer: ${PROFILE.handle} · ${PROFILE.location}` })
  d.css(PHONE_CSS)
  // desktop, and a phone layer set ~2.3× larger so it reads at ~0.42× scale
  d.add(
    `<g class="dt">${footerLayer(d, { size: 13, gap: 22, dot: 2.5, rule: 1, len: 70, spark: 2 })}</g>`,
    `<g class="ph">${footerLayer(d, { size: 30, gap: 30, dot: 4.5, rule: 2, len: 60, spark: 3.5 })}</g>`,
  )
  return d.end()
}

// Sign-off centred between two gradient rules, with sparks running outward.
function footerLayer(d, { size, gap, dot, rule, len, spark }) {
  const t = d.t
  const cy = FOOT_H / 2
  const o = { font: 'mono-500', size, tracking: 0.04 }
  const tw = d.measure(FOOT_LINE, o)
  const xl = W / 2 - tw / 2 - gap // inner end of the left rule
  const xr = W / 2 + tw / 2 + gap // inner end of the right rule
  const ruleL = d.linearGradient([[0, t.violet, 0], [0.7, t.violet, 0.35], [1, t.violet, 0.75]], { x1: 0, y1: 0, x2: xl, y2: 0, units: 'userSpaceOnUse' })
  const ruleR = d.linearGradient([[0, t.cyan, 0.75], [0.3, t.cyan, 0.35], [1, t.cyan, 0]], { x1: xr, y1: 0, x2: W, y2: 0, units: 'userSpaceOnUse' })
  const sparkL = d.linearGradient([[0, t.violet, 0], [0.5, t.violet, 1], [1, t.violet, 0]])
  const sparkR = d.linearGradient([[0, t.cyan, 0], [0.5, t.cyan, 1], [1, t.cyan, 0]])
  const travel = Math.round(xl - len - 10)
  const L = d.uid('outl')
  const Rr = d.uid('outr')
  d.css(`@keyframes ${L}{0%{transform:translateX(0);opacity:0}15%,80%{opacity:1}100%{transform:translateX(-${travel}px);opacity:0}}@keyframes ${Rr}{0%{transform:translateX(0);opacity:0}15%,80%{opacity:1}100%{transform:translateX(${travel}px);opacity:0}}.${L}{animation:${L} 6s cubic-bezier(.45,0,.3,1) 1s infinite}.${Rr}{animation:${Rr} 6s cubic-bezier(.45,0,.3,1) 1s infinite}`)
  const m = d.metrics(o.font, o.size)
  const base = cy + m.capHeight / 2
  const text = (() => {
    const a = PROFILE.handle
    const sep = ' · '
    const b = PROFILE.location.toLowerCase()
    let x = W / 2 - tw / 2
    return [[a, t.fg2], [sep, t.faint], [b, t.muted]].map(([s, fill]) => {
      const svg = d.text(s, { ...o, x, y: base, fill })
      x += d.measure(s, o) + o.tracking * o.size
      return svg
    })
  })()
  return [
    `<g class="fade-in">`,
    `<rect x="0" y="${cy - rule / 2}" width="${r1(xl)}" height="${rule}" fill="url(#${ruleL})"/>`,
    `<rect x="${r1(xr)}" y="${cy - rule / 2}" width="${r1(W - xr)}" height="${rule}" fill="url(#${ruleR})"/>`,
    `<g class="${L}"><rect x="${r1(xl - len - 6)}" y="${cy - spark / 2}" width="${len}" height="${spark}" rx="${spark / 2}" fill="url(#${sparkL})"/></g>`,
    `<g class="${Rr}"><rect x="${r1(xr + 6)}" y="${cy - spark / 2}" width="${len}" height="${spark}" rx="${spark / 2}" fill="url(#${sparkR})"/></g>`,
    `<circle cx="${r1(xl)}" cy="${cy}" r="${dot}" fill="${t.violet}"/>`,
    `<circle cx="${r1(xr)}" cy="${cy}" r="${dot}" fill="${t.cyan}"/>`,
    `</g>`,
    `<g class="fade-up" style="animation-delay:.15s">${text.join('')}</g>`,
  ].join('')
}

// ───────────────────────── entries ─────────────────────────

export default [
  {
    name: 'cta',
    width: W,
    height: CTA_H,
    alt: CTA_ALT,
    href: LINKS.email.href,
    render: renderCta,
  },
  ...BUTTONS.map((key, i) => ({
    name: `btn-${key}`,
    width: BTN_W,
    height: BTN_H,
    alt: `${LINKS[key].label}: ${LINKS[key].value}`,
    href: LINKS[key].href || undefined,
    render: (t) => renderButton(t, key, i),
  })),
  {
    name: 'footer',
    width: W,
    height: FOOT_H,
    alt: `${PROFILE.handle} · ${PROFILE.location}`,
    render: renderFooter,
  },
]
