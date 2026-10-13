// Hero: name, role, typed tagline and status pills on the left; a small live
// "system" (hub + six services on an orbit, data packets flowing) on the right.
//
// Full-width images render at ~0.41× on phones, so the hero carries a second,
// phone-sized layer (`.ph`, see PHONE_CSS): name, role, tagline and pills set
// large enough to read in the 358px column, without the kicker and the
// illustration (the kicker's handle, location and timezone stay in the alt text).

import { createDoc, r1, PHONE_CSS } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROFILE, LINKS } from '../content.mjs'

const W = LAYOUT.full
const H = 348
const R = 22 // card radius
const X0 = 48 // left text column

// rgba() from a #rrggbb theme token, for tinted fills derived from tokens
const rgba = (hex, a) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${a})`
}

const pills = {
  open: 'Open to work',
  company: `${PROFILE.companyRole} @ ${PROFILE.company}`,
}

const ALT = `${PROFILE.name} (@${PROFILE.handle}) — ${PROFILE.role}. ${PROFILE.companyRole} @ ${PROFILE.company}. “${PROFILE.tagline}” Open to work · ${PROFILE.location} · ${PROFILE.timezone}.`

const NAME_FONT = 'display-700'
const NAME_TRACK = -0.02

// Pill specs at the size they are drawn (desktop) or before a 2× scale (phone).
const PILLS_DT = { h: 32, size: 13, font: 'body-600', padX: 13, gap: 8, iconSize: 15, space: 10 }
const PILLS_PH = { h: 28, size: 13, font: 'body-600', padX: 11, gap: 7, iconSize: 14, space: 8, scale: 2 }

function render(t) {
  const d = createDoc({ width: W, height: H, theme: t, title: `${PROFILE.name} — ${PROFILE.role}`, desc: ALT })
  d.css(PHONE_CSS)
  // typed tagline: each character switches on at its moment (CSS only, so
  // prefers-reduced-motion shows the whole line at once)
  d.css('@keyframes type{from{opacity:0}to{opacity:1}}.k{animation:type 1ms linear both}')
  const dark = t.name === 'dark'

  // ───────────────────────── background ─────────────────────────
  const surf = d.linearGradient([t.surfaceTop, t.surfaceBottom], { x1: 0, y1: 0, x2: 0.35, y2: 1 })
  const clip = d.uid('cc')
  d.def(`<clipPath id="${clip}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}"/></clipPath>`)
  const sheen = d.linearGradient([[0, t.highlight, 0], [0.5, t.highlight, 1], [1, t.highlight, 0]])
  const leak = d.linearGradient([[0, t.violet, 0], [0.55, t.violet, dark ? 0.9 : 0.6], [1, t.cyan, 0]])

  // hub geometry (needed by background too)
  const orbit = 108
  const tileHalf = 22
  const cx = W - 46 - tileHalf - Math.round(orbit * Math.cos(Math.PI / 6))
  const cy = H / 2

  d.add(
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="url(#${surf})"/>`,
    `<g clip-path="url(#${clip})">`,
    `<g class="drift-a">${d.glow({ cx: 770, cy: -10, r: 300, color: t.glowViolet })}</g>`,
    `<g class="drift-b">${d.glow({ cx: 90, cy: H + 30, r: 280, color: t.glowCyan })}</g>`,
    // the dot grid sits behind the illustration; the phone layer has text there
    `<g class="dt">${d.pattern({ x: 0, y: 0, w: W, h: H, kind: 'dots', step: 18, fade: { cx, cy, r: 330 } })}</g>`,
    `</g>`,
    `<path d="M ${R} 1 H ${W - R}" stroke="url(#${sheen})" stroke-width="1"/>`,
    `<path d="M 420 1 H ${W - R - 6}" stroke="url(#${leak})" stroke-width="1.2"/>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="none" stroke="${t.border}"/>`,
  )

  // ───────────────────────── desktop layer ─────────────────────────
  d.add(`<g class="dt">`)
  {
    const nameSize = 60
    // vertical rhythm (gaps measured baseline → next cap top)
    const kickerBase = 77
    const nameBase = kickerBase + 22 + 42
    const roleBase = nameBase + 22 + 16
    const tagBase = roleBase + 28 + 13
    const pillTop = tagBase + 28

    // kicker
    const dash = d.linearGradient(t.gradAccent)
    const o = { font: 'mono-500', size: 12, tracking: 0.14, upper: true }
    const a = `@${PROFILE.handle}`
    const b = ` · ${PROFILE.location} · ${PROFILE.timezone}`
    const kx = X0 + 28
    d.add(
      `<g class="fade-up">`,
      `<rect x="${X0}" y="${kickerBase - 5}" width="18" height="2" rx="1" fill="url(#${dash})"/>`,
      d.text(a, { ...o, x: kx, y: kickerBase, fill: t.violet }),
      d.text(b, { ...o, x: kx + d.measure(a, o) + 0.14 * 12, y: kickerBase, fill: t.muted }),
      `</g>`,
    )

    d.add(
      nameBlock(d, { x: X0, base: nameBase, size: nameSize, key: 'd', dark }),
      roleLine(d, { x: X0, base: roleBase, size: 22 }),
      typedLine(d, { x: X0, base: tagBase, size: 18, key: 'd' }),
      statusPills(d, { x: X0, y: pillTop, spec: PILLS_DT, dark }).svg,
    )

    drawSystem(d, { cx, cy, orbit, dark })
  }
  d.add(`</g>`)

  // ───────────────────────── phone layer ─────────────────────────
  // Shown when the image is drawn < 600px wide (~0.41× on a phone): every line
  // is set ≥ 26 units (≈ 10.5 CSS px there); one left column, no illustration.
  {
    const size = { name: 88, role: 34, tag: 26 }
    const gap = { role: 26, tag: 30, pills: 32 } // baseline → next cap top
    const cap = (font, s) => d.metrics(font, s).capHeight
    const pillsW = statusPills(d, { x: 0, y: 0, spec: PILLS_PH, dark, measureOnly: true }).w
    const nameW = d.measure(PROFILE.name, { font: NAME_FONT, size: size.name, tracking: NAME_TRACK })
    const tagW = (PROFILE.tagline.length + 2) * d.measure('M', { font: 'mono-500', size: size.tag })
    // centre the widest line, so both side margins match it
    const x = Math.max(X0, Math.round((W - Math.max(pillsW, nameW, tagW)) / 2))
    const content =
      cap(NAME_FONT, size.name) + gap.role + cap('body-500', size.role) + gap.tag + cap('mono-500', size.tag) + gap.pills + PILLS_PH.h * PILLS_PH.scale
    const nameBase = Math.round((H - content) / 2 + cap(NAME_FONT, size.name))
    const roleBase = Math.round(nameBase + gap.role + cap('body-500', size.role))
    const tagBase = Math.round(roleBase + gap.tag + cap('mono-500', size.tag))
    const pillTop = Math.round(tagBase + gap.pills)
    d.add(
      `<g class="ph">`,
      nameBlock(d, { x, base: nameBase, size: size.name, key: 'p', dark }),
      roleLine(d, { x, base: roleBase, size: size.role }),
      typedLine(d, { x, base: tagBase, size: size.tag, key: 'p' }),
      statusPills(d, { x, y: pillTop, spec: PILLS_PH, dark }).svg,
      `</g>`,
    )
  }

  return d.end()
}

// Name: gradient text with a slow sheen passing over it. Returns markup.
function nameBlock(d, { x, base, size, key, dark }) {
  const t = d.t
  const k = size / 60 // sheen geometry was tuned at 60
  const w = d.measure(PROFILE.name, { font: NAME_FONT, size, tracking: NAME_TRACK })
  const m = d.metrics(NAME_FONT, size)
  const top = base - m.ascender - 2
  const hgt = m.ascender + m.descender + 4
  const grad = d.linearGradient(t.gradText, { x1: x, y1: 0, x2: x + w, y2: 0, units: 'userSpaceOnUse' })
  const mask = d.uid('m')
  d.def(`<mask id="${mask}" maskUnits="userSpaceOnUse" x="${r1(x - 6)}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}">${d.text(PROFILE.name, { x, y: base, font: NAME_FONT, size, tracking: NAME_TRACK, fill: '#fff' })}</mask>`)
  const shine = d.linearGradient([[0, '#fff', 0], [0.5, '#fff', dark ? 0.55 : 0.7], [1, '#fff', 0]])
  const travel = Math.round(w + 200 * k)
  d.css(`@keyframes shine-${key}{0%{transform:translateX(0)}16%,100%{transform:translateX(${travel}px)}}.shine-${key}{animation:shine-${key} 9s cubic-bezier(.45,0,.2,1) 2.4s infinite}`)
  return [
    `<g class="fade-up" style="animation-delay:.1s"><g mask="url(#${mask})">`,
    `<rect x="${r1(x - 6)}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}" fill="url(#${grad})"/>`,
    `<g class="shine-${key}"><rect x="${r1(x - 150 * k)}" y="${r1(top)}" width="${r1(90 * k)}" height="${r1(hgt)}" fill="url(#${shine})" transform="skewX(-18)"/></g>`,
    `</g></g>`,
  ].join('')
}

// Role line, "a · b" with a muted separator. Returns markup.
function roleLine(d, { x, base, size }) {
  const t = d.t
  const font = 'body-500'
  const [a, b] = PROFILE.role.split(' · ')
  const parts = [
    [a, t.fg],
    [' · ', t.muted],
    [b, t.fg],
  ]
  const out = parts.map(([s, fill]) => {
    const svg = d.text(s, { x, y: base, font, size, fill })
    x += d.measure(s, { font, size })
    return svg
  })
  return `<g class="fade-up" style="animation-delay:.22s">${out.join('')}</g>`
}

// Tagline typed out after a "›" prompt, short pauses after each full stop; a
// caret follows the typing and then blinks. Pure CSS: under reduced motion the
// full line and the caret (parked at its end) show at once. Returns markup.
function typedLine(d, { x, base, size, key }) {
  const t = d.t
  const font = 'mono-500'
  const k = size / 18 // caret geometry was tuned at 18
  const cw = d.measure('M', { font, size })
  const tx = x + cw * 2
  const str = PROFILE.tagline
  // colour runs: everything fg2, the final "Live." in green
  const liveAt = str.lastIndexOf('Live.') < 0 ? str.length : str.lastIndexOf('Live.')
  const at = [] // moment each character appears
  let tm = 0.55
  for (const ch of str) {
    at.push(tm)
    tm += ch === '.' ? 0.18 : 0.026
  }
  const end = at[at.length - 1]
  const full = str.length * cw
  const glyphs = [...str].map((ch, i) =>
    ch === ' ' ? '' : `<g class="k" style="animation-delay:${at[i].toFixed(3)}s">${d.text(ch, { x: tx + i * cw, y: base, font, size, fill: i >= liveAt ? t.green : t.fg2 })}</g>`,
  )
  // the caret is drawn at its final position and translated back while typing
  const pct = (s) => +((s / end) * 100).toFixed(3)
  const frames = [`0%{transform:translateX(${r1(-full)}px)}`, ...at.map((s, i) => `${pct(s)}%{transform:translateX(${r1((i + 1) * cw - full)}px)}`)]
  d.css(`@keyframes caret-${key}{${frames.join('')}}`)
  return [
    `<g class="fade-in" style="animation-delay:.45s">`,
    d.text('›', { x, y: base, font: 'mono-700', size, fill: t.violet }),
    glyphs.join(''),
    `<g class="blink" style="animation-delay:${end.toFixed(2)}s"><g style="animation:caret-${key} ${end.toFixed(2)}s step-end both">`,
    `<rect x="${r1(tx + full + 2 * k)}" y="${r1(base - 15 * k)}" width="${r1(2 * k)}" height="${r1(19 * k)}" rx="${r1(k)}" fill="${t.violet}"/>`,
    `</g></g>`,
    `</g>`,
  ].join('')
}

// "Open to work" and the company pill (which carries the outbound-link arrow,
// as every other link on the page does). `spec.scale` draws them enlarged as a
// whole (dot, icons and border grow with the text). Returns { svg, w }.
function statusPills(d, { x, y, spec, dark, measureOnly = false }) {
  const t = d.t
  const { h, size, font, padX, gap, iconSize, space, scale = 1 } = spec
  const common = { h, size, font, padX, gap }
  const items = [
    (p) => d.pill(pills.open, { ...p, ...common, dot: t.green, pulse: true, fg: t.green, bg: rgba(t.green, dark ? 0.1 : 0.07), border: rgba(t.green, dark ? 0.32 : 0.3) }),
    (p) => linkPill(d, pills.company, { ...p, ...common, icon: 'building-2', iconColor: t.violet, iconSize }),
  ]
  let lx = 0
  const out = []
  items.forEach((make, i) => {
    const p = make({ x: lx, y: 0 })
    const place = scale === 1 ? `translate(${r1(x)} ${r1(y)})` : `translate(${r1(x)} ${r1(y)}) scale(${scale})`
    out.push(`<g class="fade-up" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s"><g transform="${place}">${p.svg}</g></g>`)
    lx += p.w + space
  })
  const w = (lx - space) * scale
  return { svg: measureOnly ? '' : out.join(''), w }
}

// d.pill with a trailing arrow-up-right after the label. Returns { svg, w, h }.
function linkPill(d, label, o) {
  const t = d.t
  const arrow = 12
  const lead = 4 // label → arrow box (the glyph has ~3.5 units of air inside its box)
  const trim = 2 // ...and on its right, so the visual end padding matches the start
  const inner = d.pill(label, { ...o, bg: 'none', border: null })
  const w = r1(inner.w + lead + arrow - trim)
  const cy = o.y + o.h / 2
  const ax = o.x + inner.w - o.padX + lead
  return {
    svg: [
      `<rect x="${r1(o.x)}" y="${r1(o.y)}" width="${w}" height="${o.h}" rx="${r1(o.h / 2)}" fill="${t.chipBg}" stroke="${t.chipBorder}"/>`,
      inner.svg,
      d.icon('arrow-up-right', { x: ax, y: cy - arrow / 2, size: arrow, color: t.violet, stroke: 2.2 }),
    ].join(''),
    w,
    h: o.h,
  }
}

function drawSystem(d, { cx, cy, orbit, dark }) {
  const t = d.t
  const hub = 60
  const tile = 44

  // satellites, clockwise from the top (pointy-top hexagon). Clients (cyan)
  // send traffic in; the hub fans out to cloud, data, security and AI (violet).
  const sats = [
    { icon: 'sparkles', color: t.violet, out: true },
    { icon: 'cloud', color: t.violet, out: true, live: true },
    { icon: 'database', color: t.violet, out: true },
    { icon: 'shield-check', color: t.violet, out: true },
    { icon: 'globe', color: t.cyan, out: false },
    { icon: 'smartphone', color: t.cyan, out: false },
  ].map((s, i) => {
    const a = (-90 + i * 60) * (Math.PI / 180)
    return { ...s, a, x: cx + orbit * Math.cos(a), y: cy + orbit * Math.sin(a) }
  })

  const shadow = d.uid('sh')
  d.def(`<filter id="${shadow}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="${dark ? 4 : 3}" stdDeviation="${dark ? 5 : 4}" flood-color="${dark ? '#000' : '#4c1d95'}" flood-opacity="${dark ? 0.45 : 0.1}"/></filter>`)

  // hub glow + orbit ring
  d.add(`<g class="breathe">${d.glow({ cx, cy, r: 130, color: t.glowViolet })}</g>`)
  d.add(`<g class="fade-in" style="animation-delay:.2s"><circle cx="${r1(cx)}" cy="${cy}" r="${orbit}" fill="none" stroke="${t.borderStrong}" stroke-opacity="${dark ? 0.7 : 0.8}" stroke-width="1"/></g>`)

  // comet sweeping the orbit
  {
    const span = 70 * (Math.PI / 180)
    const a0 = -Math.PI / 2 - span
    const a1 = -Math.PI / 2
    const p0 = [cx + orbit * Math.cos(a0), cy + orbit * Math.sin(a0)]
    const p1 = [cx + orbit * Math.cos(a1), cy + orbit * Math.sin(a1)]
    const g = d.linearGradient([[0, t.violet, 0], [1, t.cyan, dark ? 0.95 : 0.85]], { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], units: 'userSpaceOnUse' })
    d.css(`@keyframes orbit{to{transform:rotate(360deg)}}.orbit{transform-box:view-box;transform-origin:${r1(cx)}px ${cy}px;animation:orbit 24s linear infinite}`)
    d.add(
      `<g class="fade-in" style="animation-delay:.6s"><g class="orbit">`,
      `<path d="M ${r1(p0[0])} ${r1(p0[1])} A ${orbit} ${orbit} 0 0 1 ${r1(p1[0])} ${r1(p1[1])}" fill="none" stroke="url(#${g})" stroke-width="1.6" stroke-linecap="round"/>`,
      `<circle cx="${r1(p1[0])}" cy="${r1(p1[1])}" r="2.4" fill="${t.cyan}"/>`,
      `</g></g>`,
    )
  }

  // spokes + packets
  const edgeDist = (half, a) => half / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)))
  d.css(`@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.draw{stroke-dasharray:1;animation:draw .7s cubic-bezier(.4,0,.2,1) both}`)
  const halo = d.uid('ph')
  d.def(`<radialGradient id="${halo}"><stop offset="0" stop-color="${t.cyan}" stop-opacity="${dark ? 0.75 : 0.5}"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/></radialGradient>`)
  sats.forEach((s, i) => {
    const r0 = edgeDist(hub / 2, s.a) + 5
    const r2 = orbit - edgeDist(tile / 2, s.a) - 5
    const A = [cx + r0 * Math.cos(s.a), cy + r0 * Math.sin(s.a)]
    const B = [cx + r2 * Math.cos(s.a), cy + r2 * Math.sin(s.a)]
    const [from, to] = s.out ? [A, B] : [B, A]
    const id = d.uid('sp')
    const g = d.linearGradient([[0, t.violet, dark ? 0.55 : 0.5], [1, s.color, dark ? 0.5 : 0.55]], { x1: A[0], y1: A[1], x2: B[0], y2: B[1], units: 'userSpaceOnUse' })
    const delay = (0.5 + i * 0.07).toFixed(2)
    d.add(
      `<path id="${id}" class="draw" style="animation-delay:${delay}s" pathLength="1" d="M ${r1(from[0])} ${r1(from[1])} L ${r1(to[0])} ${r1(to[1])}" fill="none" stroke="url(#${g})" stroke-width="1.3" stroke-linecap="round"/>`,
      `<g class="fade-in" style="animation-delay:${delay}s"><circle cx="${r1(A[0])}" cy="${r1(A[1])}" r="1.8" fill="${t.violet}"/><circle cx="${r1(B[0])}" cy="${r1(B[1])}" r="1.8" fill="${s.color}"/></g>`,
    )
    const dur = 2.6
    const begin = (1.3 + i * 0.43).toFixed(2)
    d.add(
      `<g class="packet" opacity="0">`,
      `<animate attributeName="opacity" begin="${begin}s" dur="${dur}s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;.06;.4;.48;1"/>`,
      `<g><animateMotion begin="${begin}s" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyPoints="0;1;1" keyTimes="0;.46;1" keySplines=".45 0 .3 1;0 0 1 1"><mpath href="#${id}"/></animateMotion>`,
      `<circle r="7" fill="url(#${halo})"/><circle r="2.1" fill="${dark ? t.fg : t.cyan}"/></g>`,
      `</g>`,
    )
  })

  // satellite tiles
  const tileFill = d.linearGradient([t.surfaceRaised, t.inset], { x1: 0, y1: 0, x2: 0, y2: 1 })
  const tileStroke = d.linearGradient([t.borderStrong, t.border], { x1: 0, y1: 0, x2: 0, y2: 1 })
  sats.forEach((s, i) => {
    const iconSize = 20
    const x = s.x - tile / 2
    const y = s.y - tile / 2
    d.add(
      `<g class="fade-up" style="animation-delay:${(0.3 + i * 0.07).toFixed(2)}s">`,
      `<rect x="${r1(x)}" y="${r1(y)}" width="${tile}" height="${tile}" rx="13" fill="url(#${tileFill})" stroke="url(#${tileStroke})" filter="url(#${shadow})"/>`,
      d.icon(s.icon, { x: s.x - iconSize / 2, y: s.y - iconSize / 2, size: iconSize, color: s.color, stroke: 1.8 }),
      s.live ? liveBadge(d, x + tile - 4, y + 4) : '',
      `</g>`,
    )
  })

  // hub
  {
    const x = cx - hub / 2
    const y = cy - hub / 2
    const ring = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
    const ig = d.linearGradient(t.gradAccent, { x1: 2, y1: 2, x2: 22, y2: 22, units: 'userSpaceOnUse' })
    const iconSize = 26
    d.add(
      `<g class="fade-up" style="animation-delay:.15s">`,
      `<rect x="${r1(x)}" y="${r1(y)}" width="${hub}" height="${hub}" rx="17" fill="url(#${tileFill})" stroke="url(#${ring})" stroke-width="1.4" filter="url(#${shadow})"/>`,
      d.icon('server', { x: cx - iconSize / 2, y: cy - iconSize / 2, size: iconSize, color: `url(#${ig})`, stroke: 1.8 }),
      `</g>`,
    )
  }
}

// green "online" badge sitting on a tile corner
function liveBadge(d, x, y) {
  const t = d.t
  return [
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="6.5" fill="${t.surfaceRaised}" stroke="${t.border}"/>`,
    `<circle class="pulse" cx="${r1(x)}" cy="${r1(y)}" r="3.6" fill="${t.green}"/>`,
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.6" fill="${t.green}"/>`,
  ].join('')
}

export default [
  {
    name: 'hero',
    width: W,
    height: H,
    alt: ALT,
    href: LINKS.website.href,
    render,
  },
]
