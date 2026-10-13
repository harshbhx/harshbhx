// Hero: name, role, typed tagline and status pills on the left; a small live
// "system" (hub + six services on an orbit, data packets flowing) on the right.

import { createDoc, r1 } from '../lib/svg.mjs'
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
  company: `${PROFILE.companyRole} @ ${PROFILE.company} ↗`,
}

const ALT = `${PROFILE.name} (@${PROFILE.handle}) — ${PROFILE.role}. ${PROFILE.companyRole} @ ${PROFILE.company}. “${PROFILE.tagline}” Open to work · ${PROFILE.location} · ${PROFILE.timezone}.`

function render(t) {
  const d = createDoc({ width: W, height: H, theme: t, title: `${PROFILE.name} — ${PROFILE.role}`, desc: ALT })
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
    d.pattern({ x: 0, y: 0, w: W, h: H, kind: 'dots', step: 18, fade: { cx, cy, r: 330 } }),
    `</g>`,
    `<path d="M ${R} 1 H ${W - R}" stroke="url(#${sheen})" stroke-width="1"/>`,
    `<path d="M 420 1 H ${W - R - 6}" stroke="url(#${leak})" stroke-width="1.2"/>`,
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="none" stroke="${t.border}"/>`,
  )

  // ───────────────────────── left column ─────────────────────────
  const nameSize = 60
  const nameTrack = -0.02
  // vertical rhythm (gaps measured baseline → next cap top)
  const kickerBase = 77
  const nameBase = kickerBase + 22 + 42
  const roleBase = nameBase + 22 + 16
  const tagBase = roleBase + 28 + 13
  const pillTop = tagBase + 28

  // kicker
  const dash = d.linearGradient(t.gradAccent)
  d.add(
    `<g class="fade-up">`,
    `<rect x="${X0}" y="${kickerBase - 5}" width="18" height="2" rx="1" fill="url(#${dash})"/>`,
    (() => {
      const o = { font: 'mono-500', size: 12, tracking: 0.14, upper: true }
      const a = `@${PROFILE.handle}`
      const b = ` · ${PROFILE.location} · ${PROFILE.timezone}`
      const x = X0 + 28
      return d.text(a, { ...o, x, y: kickerBase, fill: t.violet }) + d.text(b, { ...o, x: x + d.measure(a, o) + 0.14 * 12, y: kickerBase, fill: t.muted })
    })(),
    `</g>`,
  )

  // name: gradient text with a slow sheen passing over it
  {
    const font = 'display-700'
    const w = d.measure(PROFILE.name, { font, size: nameSize, tracking: nameTrack })
    const m = d.metrics(font, nameSize)
    const top = nameBase - m.ascender - 2
    const hgt = m.ascender + m.descender + 4
    const grad = d.linearGradient(t.gradText, { x1: X0, y1: 0, x2: X0 + w, y2: 0, units: 'userSpaceOnUse' })
    const mask = d.uid('m')
    d.def(`<mask id="${mask}" maskUnits="userSpaceOnUse" x="${X0 - 6}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}">${d.text(PROFILE.name, { x: X0, y: nameBase, font, size: nameSize, tracking: nameTrack, fill: '#fff' })}</mask>`)
    const shine = d.linearGradient([[0, '#fff', 0], [0.5, '#fff', dark ? 0.55 : 0.7], [1, '#fff', 0]])
    const travel = Math.round(w + 200)
    d.css(`@keyframes shine{0%{transform:translateX(0)}16%,100%{transform:translateX(${travel}px)}}.shine{animation:shine 9s cubic-bezier(.45,0,.2,1) 2.4s infinite}`)
    d.add(
      `<g class="fade-up" style="animation-delay:.1s"><g mask="url(#${mask})">`,
      `<rect x="${X0 - 6}" y="${r1(top)}" width="${r1(w + 12)}" height="${r1(hgt)}" fill="url(#${grad})"/>`,
      `<g class="shine"><rect x="${X0 - 150}" y="${r1(top)}" width="90" height="${r1(hgt)}" fill="url(#${shine})" transform="skewX(-18)"/></g>`,
      `</g></g>`,
    )
  }

  // role line
  {
    const size = 22
    const font = 'body-500'
    const [a, b] = PROFILE.role.split(' · ')
    let x = X0
    const parts = [
      [a, t.fg],
      [' · ', t.muted],
      [b, t.fg],
    ]
    const out = parts.map(([s, fill]) => {
      const svg = d.text(s, { x, y: roleBase, font, size, fill })
      x += d.measure(s, { font, size })
      return svg
    })
    d.add(`<g class="fade-up" style="animation-delay:.22s">${out.join('')}</g>`)
  }

  // tagline, typed out
  {
    const size = 18
    const font = 'mono-500'
    const cw = d.measure('M', { font, size })
    const tx = X0 + cw * 2
    const str = PROFILE.tagline
    // colour runs: everything fg2, the final "Live." in green
    const liveAt = str.lastIndexOf('Live.')
    const runs = [
      [str.slice(0, liveAt), t.fg2],
      [str.slice(liveAt), t.green],
    ]
    let x = tx
    const glyphs = runs.map(([s, fill]) => {
      const svg = d.text(s, { x, y: tagBase, font, size, fill })
      x += d.measure(s, { font, size })
      return svg
    })
    const full = x - tx

    // per-character timeline with short pauses after each full stop
    const start = 0.55
    const step = 0.026
    const times = [0]
    const widths = [0]
    let tm = start
    for (let i = 1; i <= str.length; i++) {
      times.push(tm)
      widths.push(i * cw)
      tm += str[i - 1] === '.' ? 0.18 : step
    }
    const end = times[times.length - 1]
    const kt = times.map((v) => (v / end).toFixed(4)).join(';')
    const clipId = d.uid('ty')
    d.def(
      `<clipPath id="${clipId}"><rect x="${r1(tx - 1)}" y="${tagBase - 20}" width="${r1(full + 2)}" height="28">` +
        `<animate attributeName="width" dur="${end.toFixed(2)}s" fill="freeze" calcMode="discrete" keyTimes="${kt}" values="${widths.map((w) => r1(w + (w ? 1 : 0))).join(';')}"/>` +
        `</rect></clipPath>`,
    )
    const caretX = (w) => r1(tx + w + 2)
    d.add(
      `<g class="fade-in" style="animation-delay:.45s">`,
      d.text('›', { x: X0, y: tagBase, font: 'mono-700', size, fill: t.violet }),
      `<g clip-path="url(#${clipId})">${glyphs.join('')}</g>`,
      `<g class="blink" style="animation-delay:${end.toFixed(2)}s"><rect x="${caretX(full)}" y="${tagBase - 15}" width="2" height="19" rx="1" fill="${t.violet}">`,
      `<animate attributeName="x" dur="${end.toFixed(2)}s" fill="freeze" calcMode="discrete" keyTimes="${kt}" values="${widths.map(caretX).join(';')}"/>`,
      `</rect></g>`,
      `</g>`,
    )
  }

  // pills
  {
    const h = 32
    const common = { h, size: 13, font: 'body-600', padX: 13, gap: 8 }
    const items = [
      (p) => d.pill(pills.open, { ...p, ...common, dot: t.green, pulse: true, fg: t.green, bg: rgba(t.green, dark ? 0.1 : 0.07), border: rgba(t.green, dark ? 0.32 : 0.3) }),
      (p) => d.pill(pills.company, { ...p, ...common, icon: 'building-2', iconColor: t.violet, iconSize: 15 }),
    ]
    let x = X0
    items.forEach((make, i) => {
      const p = make({ x, y: pillTop })
      d.add(`<g class="fade-up" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s">${p.svg}</g>`)
      x += p.w + 10
    })
  }

  // ───────────────────────── system illustration ─────────────────────────
  drawSystem(d, { cx, cy, orbit, dark })

  return d.end()
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
