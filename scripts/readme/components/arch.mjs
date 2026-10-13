// Architecture diagrams (415×460). Each sits to the right of its project card
// (projects.mjs) and shares one visual language:
//
//   node   rounded tile (surfaceRaised, hairline, r10) · logo/icon tile · label · mono sub-label
//   edge   1.25px orthogonal line with rounded corners and a small arrowhead;
//          request packets travel along it (SMIL, class "packet")
//   zone   dashed rounded region with a mono kicker (layers, branches, backends)
//
//   arch-dualmind   Request path    vertical stack of layers, blind model pair
//   arch-mealmind   Real-time sync  payment loop around a Firestore hub
//   arch-agent      Query pipeline  agent classifies, then branches
//
// Every looping animation runs on one shared cycle per card so packets, node
// highlights and hub pulses stay in step.

import { createDoc, r1 } from '../lib/svg.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { PROJECTS, LINKS } from '../content.mjs'

const W = LAYOUT.half // 415
const H = 460
const PAD = 24
const NODE_R = 10
const TILE = 26
const LABEL = { font: 'body-500', size: 12.5 }
const SUB = { font: 'mono-400', size: 11 }
const BEGIN = 1.1 // packets start once the entrance has settled

const P = Object.fromEntries(PROJECTS.map((p) => [p.key, p]))

// ── small utilities ─────────────────────────────────────────────────────────

/** '#rrggbb' + alpha → rgba(), so tints follow the theme tokens. */
const alpha = (hex, a) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgba(${r},${g},${b},${a})`
}
const n4 = (v) => +v.toFixed(4)
const times = (arr) => arr.map(n4).join(';')

/** Orthogonal polyline with rounded corners, as a path "d". */
function roundedPath(pts, r = 6) {
  let s = `M ${r1(pts[0][0])} ${r1(pts[0][1])}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const d1 = Math.hypot(x1 - x0, y1 - y0)
    const d2 = Math.hypot(x2 - x1, y2 - y1)
    // end segments may give their full length to the corner; shared ones only half
    const rr = Math.min(r, i === 1 ? d1 : d1 / 2, i === pts.length - 2 ? d2 : d2 / 2)
    const ax = x1 - ((x1 - x0) / d1) * rr
    const ay = y1 - ((y1 - y0) / d1) * rr
    const bx = x1 + ((x2 - x1) / d2) * rr
    const by = y1 + ((y2 - y1) / d2) * rr
    s += ` L ${r1(ax)} ${r1(ay)} Q ${r1(x1)} ${r1(y1)} ${r1(bx)} ${r1(by)}`
  }
  const [lx, ly] = pts[pts.length - 1]
  return s + ` L ${r1(lx)} ${r1(ly)}`
}

// ── shared drawing kit ──────────────────────────────────────────────────────

function kit(d) {
  const t = d.t
  const dark = t.name === 'dark'
  const halos = new Map()
  const halo = (color) => {
    if (!halos.has(color)) {
      const id = d.uid('ph')
      d.def(`<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".6"/><stop offset=".45" stop-color="${color}" stop-opacity=".18"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`)
      halos.set(color, id)
    }
    return halos.get(color)
  }
  const edgeColor = (c = t.violet) => alpha(c, dark ? 0.55 : 0.5)
  const logoIds = new Map()

  const K = {
    t,
    dark,
    edgeColor,
    // brand colours stay unless they vanish on the tile: dark purples/navies turn
    // white on dark tiles, bright greens are kept on light ones
    // (each logo outline is defined once and reused, which keeps files small)
    logo(slug, o) {
      const raw = d.logo(slug, { minContrast: dark ? 3 : 1.5, ...o })
      const m = raw.match(/^<path transform="([^"]+)" fill="([^"]+)" d="([^"]+)"\/>$/)
      if (!m) return raw
      if (!logoIds.has(slug)) {
        const id = d.uid('lo')
        d.def(`<path id="${id}" d="${m[3]}"/>`)
        logoIds.set(slug, id)
      }
      return `<use href="#${logoIds.get(slug)}" transform="${m[1]}" fill="${m[2]}"/>`
    },
    in: (svg, delay, cls = 'fade-up') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`,

    /** Card surface, grid and the one glow (placed behind the focal element). */
    frame({ glow, grid }) {
      d.add(
        d.card({
          glows: [{ ...glow, color: glow.color || t.glowViolet }],
          pattern: { kind: 'lines', step: 20, fade: grid },
        }),
      )
    },

    /** Kicker + title on the left, a mono pill on the right. */
    header({ title, pill }) {
      const parts = [
        d.icon('workflow', { x: PAD, y: 23.5, size: 13, color: t.violet, stroke: 2.1 }),
        d.kicker('Architecture', { x: PAD + 19, y: 34, fill: t.muted }),
        d.text(title, { x: PAD, y: 59, font: 'display-700', size: 20, fill: t.fg }),
      ]
      d.add(K.in(parts.join(''), 0.02))
      if (pill) d.add(K.in(pill, 0.08))
    },

    /** Header pill (mono, tinted with an accent). */
    pill(label, { accent = t.violet, icon, dot, pulse, trail } = {}) {
      const h = 24
      const font = 'mono-400' // shares glyphs with the sub-labels
      const size = 11
      const tw = d.measure(label, { font, size })
      const lead = (dot ? 7 + 7 : 0) + (icon ? 13 + 6 : 0)
      const tail = trail ? 6 + 12 : 0
      const w = 10 + lead + tw + tail + 10
      const x = W - PAD - w
      const y = 30
      const cy = y + h / 2
      const out = [`<rect x="${r1(x)}" y="${y}" width="${r1(w)}" height="${h}" rx="${h / 2}" fill="${alpha(accent, dark ? 0.1 : 0.06)}" stroke="${alpha(accent, dark ? 0.35 : 0.28)}"/>`]
      let cx = x + 10
      if (dot) {
        if (pulse) out.push(`<circle class="pulse" cx="${r1(cx + 3.5)}" cy="${cy}" r="3.5" fill="${dot}"/>`)
        out.push(`<circle cx="${r1(cx + 3.5)}" cy="${cy}" r="3.5" fill="${dot}"/>`)
        cx += 14
      }
      if (icon) {
        out.push(d.icon(icon, { x: cx, y: cy - 6.5, size: 13, color: accent, stroke: 2 }))
        cx += 19
      }
      out.push(d.text(label, { x: cx, y: cy + 4, font, size, fill: dark ? t.fg : accent }))
      cx += tw + 6
      if (trail) out.push(d.icon(trail, { x: cx, y: cy - 6, size: 12, color: accent, stroke: 2.2 }))
      return out.join('')
    },

    /** Width a node needs for its content. */
    nodeWidth({ label, sub, labelFont = LABEL.font, labelSize = LABEL.size, tile = TILE }) {
      const lw = d.measure(label, { font: labelFont, size: labelSize })
      const sw = sub ? d.measure(sub, SUB) : 0
      return 8 + tile + 10 + Math.max(lw, sw) + 12
    },

    /**
     * Service node. Returns svg. Geometry is {x, y, w, h}.
     * logo: Simple Icons slug · icon: Lucide name
     */
    node({ x, y, w, h = 40, logo, logoColor, icon, iconColor, label, sub, labelFont = LABEL.font, labelSize = LABEL.size, accent, tile = TILE, stroke }) {
      const out = []
      out.push(`<rect x="${r1(x)}" y="${r1(y + 2)}" width="${r1(w)}" height="${r1(h)}" rx="${NODE_R}" fill="${t.shadow}"/>`)
      out.push(`<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${r1(h - 1)}" rx="${NODE_R - 0.5}" fill="${t.surfaceRaised}" stroke="${stroke || (dark ? t.borderStrong : t.border)}"/>`)
      // 1px top sheen, like the card
      out.push(`<path d="M ${r1(x + NODE_R)} ${r1(y + 1)} H ${r1(x + w - NODE_R)}" stroke="${t.highlight}"/>`)
      const tx = x + 8
      const ty = y + (h - tile) / 2
      const tint = accent ? alpha(accent, dark ? 0.14 : 0.08) : t.logoTile
      const tileStroke = accent ? alpha(accent, dark ? 0.4 : 0.3) : t.logoTileBorder
      out.push(`<rect x="${r1(tx + 0.5)}" y="${r1(ty + 0.5)}" width="${tile - 1}" height="${tile - 1}" rx="7" fill="${tint}" stroke="${tileStroke}"/>`)
      const s = Math.round(tile * 0.6)
      if (logo) out.push(K.logo(logo, { x: tx + (tile - s) / 2, y: ty + (tile - s) / 2, size: s, on: tint, color: logoColor }))
      else if (icon) out.push(d.icon(icon, { x: tx + (tile - 15) / 2, y: ty + (tile - 15) / 2, size: 15, color: iconColor || accent || t.violet, stroke: 2 }))
      const lx = tx + tile + 10
      const cy = y + h / 2
      if (sub) {
        out.push(d.text(label, { x: lx, y: cy - 2.5, font: labelFont, size: labelSize, fill: t.fg }))
        out.push(d.text(sub, { x: lx, y: cy + 11.5, ...SUB, fill: t.muted }))
      } else {
        const m = d.metrics(labelFont, labelSize)
        out.push(d.text(label, { x: lx, y: cy + m.capHeight / 2, font: labelFont, size: labelSize, fill: t.fg }))
      }
      return out.join('')
    },

    /** Fully rounded "event" node (actor or action rather than a service). */
    event({ cx, y, h = 28, icon, label, accent = t.violet }) {
      const font = 'body-500'
      const size = 12.5
      const tw = d.measure(label, { font, size })
      const w = 12 + 15 + 8 + tw + 14
      const x = cx - w / 2
      const m = d.metrics(font, size)
      const svg =
        `<rect x="${r1(x)}" y="${r1(y + 2)}" width="${r1(w)}" height="${h}" rx="${h / 2}" fill="${t.shadow}"/>` +
        `<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${h - 1}" rx="${(h - 1) / 2}" fill="${t.surfaceRaised}" stroke="${alpha(accent, dark ? 0.5 : 0.35)}"/>` +
        d.icon(icon, { x: x + 12, y: y + (h - 15) / 2, size: 15, color: accent, stroke: 2 }) +
        d.text(label, { x: x + 12 + 15 + 8, y: y + h / 2 + m.capHeight / 2, font, size, fill: t.fg })
      return { svg, x, w, h }
    },

    /**
     * Edge through orthogonal points; the last point is where the arrow tip
     * touches the target. Returns { svg, path } (path = full route for packets).
     */
    edge(pts, { color = t.violet, arrow = true, dashed = false, flow = false, width = 1.25, r = 6 } = {}) {
      const AL = 6.5
      const n = pts.length
      const [px, py] = pts[n - 2]
      const [ex, ey] = pts[n - 1]
      const L = Math.hypot(ex - px, ey - py)
      const ux = (ex - px) / L
      const uy = (ey - py) / L
      const line = pts.map((p) => [...p])
      if (arrow) line[n - 1] = [ex - ux * (AL - 1.5), ey - uy * (AL - 1.5)]
      const stroke = edgeColor(color)
      const dash = flow ? ' class="flow"' : dashed ? ' stroke-dasharray="3 4"' : ''
      let svg = `<path d="${roundedPath(line, r)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`
      if (arrow) {
        const bx = ex - ux * AL
        const by = ey - uy * AL
        const nx = -uy * 3.6
        const ny = ux * 3.6
        svg += `<path d="M ${r1(ex)} ${r1(ey)} L ${r1(bx + nx)} ${r1(by + ny)} Q ${r1(ex - ux * AL * 0.62)} ${r1(ey - uy * AL * 0.62)} ${r1(bx - nx)} ${r1(by - ny)} Z" fill="${color}"/>`
      }
      return { svg, path: roundedPath(pts, r) }
    },

    /**
     * Region with a mono kicker (inside, top-left unless placed).
     * kind: 'dashed' (default) · 'strong' (accent dashed, focal) · 'band' (fill only, quiet layer)
     */
    zone({ x, y, w, h, label, accent = t.violet, kind = 'dashed', kickerX, kickerY, kickerFill, kickerAnchor = 'start', tracking = 0.14, r = 12 }) {
      const fillA = { dashed: dark ? 0.035 : 0.03, strong: dark ? 0.08 : 0.055, band: dark ? 0.05 : 0.04 }[kind]
      const strokeA = { dashed: dark ? 0.3 : 0.28, strong: dark ? 0.65 : 0.5, band: 0 }[kind]
      const stroke = strokeA ? ` stroke="${alpha(accent, strokeA)}" stroke-dasharray="3 4"` : ''
      const svg = [
        `<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${r1(h - 1)}" rx="${r}" fill="${alpha(accent, fillA)}"${stroke}/>`,
        label ? d.kicker(label, { x: kickerX ?? x + 12, y: kickerY ?? y + 18, anchor: kickerAnchor, tracking, fill: kickerFill || (kind === 'strong' ? accent : t.muted) }) : '',
      ]
      return svg.join('')
    },

    /** A glowing dot that travels `path` during [a, b] of a T-second cycle. */
    packet(path, { T, a, b, color = t.violet, r = 2.4, begin = BEGIN }) {
      const fi = Math.min(0.012, (b - a) / 5)
      const common = `begin="${begin}s" dur="${T}s" repeatCount="indefinite"`
      return (
        `<g class="packet" opacity="0">` +
        `<animateMotion path="${path}" ${common} calcMode="spline" keyPoints="0;0;1;1" keyTimes="${times([0, a, b, 1])}" keySplines="0 0 1 1;.45 0 .35 1;0 0 1 1"/>` +
        `<animate attributeName="opacity" ${common} values="0;0;1;1;0;0" keyTimes="${times([0, a, a + fi, b - fi, b, 1])}"/>` +
        `<circle r="${r * 3.4}" fill="url(#${halo(color)})"/><circle r="${r}" fill="${color}"/>` +
        `</g>`
      )
    },

    /** Highlight outline that lights up a node during [a, b] of the cycle. */
    flash({ x, y, w, h, r = NODE_R, color = t.violet, T, a, b, begin = BEGIN }) {
      const common = `begin="${begin}s" dur="${T}s" repeatCount="indefinite"`
      const rise = Math.min(0.02, (b - a) / 3)
      return (
        `<g class="packet"><rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${r1(h - 1)}" rx="${r - 0.5}" fill="${alpha(color, dark ? 0.1 : 0.06)}" stroke="${color}" stroke-width="1.25" opacity="0">` +
        `<animate attributeName="opacity" ${common} values="0;0;1;1;0;0" keyTimes="${times([0, a, a + rise, a + rise + 0.01, b, 1])}"/>` +
        `</rect></g>`
      )
    },

    /** Rounded-rect ripple that expands from a node during [a, b] of the cycle. */
    ripple({ x, y, w, h, r = 12, to, color = t.violet, peak = 0.6, T, a, b, begin = BEGIN }) {
      const common = `begin="${begin}s" dur="${T}s" repeatCount="indefinite"`
      const kt = times([0, a, b, 1])
      const anim = (attr, from, end) => `<animate attributeName="${attr}" ${common} values="${r1(from)};${r1(from)};${r1(end)};${r1(end)}" keyTimes="${kt}" calcMode="spline" keySplines="0 0 1 1;.15 .55 .3 1;0 0 1 1"/>`
      return (
        `<g class="packet"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${alpha(color, dark ? 0.06 : 0.05)}" stroke="${color}" stroke-width="1.25" opacity="0">` +
        anim('x', x, to.x) +
        anim('y', y, to.y) +
        anim('width', w, to.w) +
        anim('height', h, to.h) +
        anim('rx', r, to.r ?? r) +
        `<animate attributeName="opacity" ${common} values="0;0;${peak};0;0" keyTimes="${times([0, a, a + 0.01, b, 1])}"/>` +
        `</rect></g>`
      )
    },
  }
  return K
}

// ── DualMind: request path ──────────────────────────────────────────────────

function renderDualMind(t) {
  const p = P.dualmind
  const d = createDoc({ width: W, height: H, theme: t, title: `${p.name} — architecture: ${p.diagram.title}`, desc: ALT.dualmind })
  const K = kit(d)

  // layers are full-width bands; kickers on the left, nodes on a spine to the right
  const BX = PAD
  const BW = W - 2 * PAD
  const AREA_X = 112
  const AREA_R = W - PAD - 10
  const SX = (AREA_X + AREA_R) / 2 // spine
  const NW = 232
  const BAND_H = 46
  const NODE_H = 38
  const EV_H = 26
  const TOP = 80
  const BOTTOM = H - PAD
  const rowsH = [EV_H, BAND_H, BAND_H, BAND_H, BAND_H, EV_H, BAND_H]
  // the fan-out into the blind pair and the merge out of it get extra air
  const weights = [0.9, 0.9, 0.9, 2.1, 2.1, 0.9]
  const unit = (BOTTOM - TOP - rowsH.reduce((a, b) => a + b, 0)) / weights.reduce((a, b) => a + b, 0)
  const ys = []
  rowsH.reduce((y, h, i) => (ys.push(y), y + h + unit * (weights[i] ?? 0)), TOP)
  const [yPrompt, yEdge, yApi, yGw, yModels, yVote, yData] = ys
  const inset = (BAND_H - NODE_H) / 2

  const focusCy = yModels + BAND_H / 2
  K.frame({ glow: { cx: SX, cy: focusCy, r: 230, color: t.glowViolet }, grid: { cx: SX, cy: focusCy, r: 280 } })
  K.header({ title: p.diagram.title, pill: K.pill(LINKS.docs.value, { icon: 'book-open', trail: 'arrow-up-right' }) })

  const kick = d.metrics('mono-500', 11).capHeight / 2
  const layers = [
    // DECISIONS[0]: "Spikes land on Cloudflare, not the origin" (PROOF does not say which site took the 5,000+ spike)
    { y: yEdge, label: 'Edge', node: { logo: 'cloudflare', label: 'Cloudflare CDN', sub: 'absorbs traffic spikes' } },
    { y: yApi, label: 'API', node: { logo: 'dotnet', label: '.NET Web API', sub: 'stateless · scales out' } },
    { y: yGw, label: 'Gateway', node: { logo: 'cloudflare', label: 'Cloudflare AI Gateway', sub: 'rate limits · cache · logs' } },
    { y: yData, label: 'Data', node: { logo: 'supabase', label: 'Supabase · PostgreSQL', sub: 'leaderboard ranking' } },
  ]

  const zones = []
  const nodes = []
  const box = {}
  layers.forEach((l, i) => {
    zones.push(K.zone({ x: BX, y: l.y, w: BW, h: BAND_H, label: l.label, kind: 'band', kickerX: BX + 14, kickerY: l.y + BAND_H / 2 + kick }))
    box[l.label] = { x: SX - NW / 2, y: l.y + inset, w: NW, h: NODE_H }
    nodes.push([K.node({ ...box[l.label], ...l.node }), i < 3 ? i + 1 : 6])
  })

  // the blind pair: the one dashed, accented layer
  const cy = yModels + BAND_H / 2
  zones.push(
    K.zone({ x: BX, y: yModels, w: BW, h: BAND_H, kind: 'strong' }) +
      d.kicker('Models', { x: BX + 14, y: cy - 2.5, fill: t.violet }) +
      d.kicker('blind', { x: BX + 14, y: cy + 11.5, fill: t.muted }),
  )
  const MW = (AREA_R - AREA_X - 32) / 2
  const mA = { x: AREA_X, y: yModels + inset, w: MW, h: NODE_H }
  const mB = { x: AREA_R - MW, y: mA.y, w: MW, h: NODE_H }
  nodes.push([K.node({ ...mA, icon: 'eye-off', label: 'Model A', sub: 'hidden', accent: t.violet }), 4])
  nodes.push([K.node({ ...mB, icon: 'eye-off', label: 'Model B', sub: 'hidden', accent: t.violet }), 4])
  // head-to-head medallion between the pair
  {
    const vx = (mA.x + MW + mB.x) / 2
    const vy = yModels + BAND_H / 2
    const ring = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
    nodes.push([
      `<circle cx="${r1(vx)}" cy="${r1(vy)}" r="12.5" fill="${t.surfaceRaised}" stroke="url(#${ring})" stroke-width="1.25"/>` +
        d.text('VS', { x: vx + 0.5, y: vy + 4, font: 'mono-500', size: 11, anchor: 'middle', fill: t.violet, tracking: 0.04 }),
      4.5,
    ])
  }

  const prompt = K.event({ cx: SX, y: yPrompt, h: EV_H, icon: 'message-square-text', label: 'User prompt' })
  const vote = K.event({ cx: SX, y: yVote, h: EV_H, icon: 'vote', label: 'Community vote' })
  nodes.push([prompt.svg, 0], [vote.svg, 5])

  // spine
  const { Edge: E, API: A, Gateway: G, Data: D } = box
  const aX = mA.x + MW / 2
  const bX = mB.x + MW / 2
  const e1 = K.edge([[SX, yPrompt + EV_H], [SX, E.y]])
  const e2 = K.edge([[SX, E.y + E.h], [SX, A.y]])
  const e3 = K.edge([[SX, A.y + A.h], [SX, G.y]])
  const fanY = (yGw + BAND_H + yModels) / 2
  const e4a = K.edge([[SX, G.y + G.h], [SX, fanY], [aX, fanY], [aX, mA.y]])
  const e4b = K.edge([[SX, G.y + G.h], [SX, fanY], [bX, fanY], [bX, mB.y]])
  const mergeY = yModels + BAND_H + (yVote - yModels - BAND_H) * 0.5
  const e5a = K.edge([[aX, mA.y + NODE_H], [aX, mergeY], [SX, mergeY], [SX, yVote]], { arrow: false })
  const e5b = K.edge([[bX, mB.y + NODE_H], [bX, mergeY], [SX, mergeY], [SX, yVote]])
  const e6 = K.edge([[SX, yVote + EV_H], [SX, D.y]])
  const edges = [e1, e2, e3, e4a, e4b, e5a, e5b, e6]

  // one request per cycle: prompt → edge → API → gateway → both models → vote → leaderboard
  const T = 5.4
  const packets = [
    [e1, 0.02, 0.08],
    [e2, 0.11, 0.17],
    [e3, 0.2, 0.26],
    [e4a, 0.29, 0.38],
    [e4b, 0.29, 0.38],
    [e5a, 0.52, 0.6],
    [e5b, 0.52, 0.6],
    [e6, 0.63, 0.69],
  ].map(([e, a, b]) => K.packet(e.path, { T, a, b }))
  const flashes = [
    K.flash({ ...E, T, a: 0.08, b: 0.14 }),
    K.flash({ ...A, T, a: 0.17, b: 0.23 }),
    K.flash({ ...G, T, a: 0.26, b: 0.32 }),
    K.flash({ ...mA, T, a: 0.38, b: 0.54 }),
    K.flash({ ...mB, T, a: 0.38, b: 0.54 }),
    K.flash({ ...D, T, a: 0.69, b: 0.84, color: t.green }),
  ]

  d.add(
    zones.map((z, i) => K.in(z, 0.04 + i * 0.05, 'fade-in')),
    K.in(edges.map((e) => e.svg).join(''), 0.3, 'fade-in'),
    packets,
    nodes.map(([svg, i]) => K.in(svg, 0.1 + i * 0.07)),
    flashes,
  )
  return d.end()
}

// ── MealMind: real-time sync around one Firestore write ────────────────────

function renderMealMind(t) {
  const p = P.mealmind
  const d = createDoc({ width: W, height: H, theme: t, title: `${p.name} — architecture: ${p.diagram.title}`, desc: ALT.mealmind })
  const K = kit(d)
  const flutter = K.dark ? t.sky : undefined // Flutter's navy disappears on dark tiles

  const side = {
    cust: { logo: 'flutter', logoColor: flutter, label: 'Customer app', sub: 'orders' },
    pay: { logo: 'razorpay', label: 'Razorpay', sub: 'payments' },
    fn: { logo: 'firebase', label: 'Cloud Functions', sub: 'Firebase' },
    chef: { logo: 'flutter', logoColor: flutter, label: 'Chef app', sub: 'kitchen screen' },
    admin: { logo: 'flutter', logoColor: flutter, label: 'Admin app', sub: 'dashboard' },
  }
  const CW = Math.ceil(Math.max(...Object.values(side).map((n) => K.nodeWidth(n))))
  const NH = 42
  const lx = PAD
  const rx = W - PAD - CW
  const lc = lx + CW / 2
  const rc = rx + CW / 2

  const hubSpec = { logo: 'firebase', label: 'Firestore', sub: 'role-scoped rules', labelFont: 'body-600', labelSize: 14, tile: 28 }
  const hubW = Math.ceil(K.nodeWidth(hubSpec))
  const HUB_H = 50
  const ZPAD = 10
  const ZONE_H = 28 + HUB_H + 12

  // vertical rhythm: rows and zone are fixed, the three gaps share the rest
  const TOP = 80
  const BOTTOM = H - PAD
  const free = BOTTOM - TOP - 3 * NH - ZONE_H
  const ratio = [1, 0.8, 1.45]
  const unit = free / ratio.reduce((a, b) => a + b, 0)
  const [g1, g2, g3] = ratio.map((r) => unit * r)
  const y1 = TOP
  const y2 = y1 + NH + g1
  const zone = { x: W / 2 - hubW / 2 - ZPAD, y: y2 + NH + g2, w: hubW + 2 * ZPAD, h: ZONE_H }
  const hub = { x: W / 2 - hubW / 2, y: zone.y + 28, w: hubW, h: HUB_H }
  const hubCy = hub.y + HUB_H / 2
  const y4 = zone.y + ZONE_H + g3

  K.frame({ glow: { cx: W / 2, cy: hubCy, r: 210, color: t.glowViolet }, grid: { cx: W / 2, cy: hubCy, r: 270 } })
  K.header({ title: p.diagram.title, pill: K.pill('payment sync < 1 s', { dot: t.green, pulse: true, accent: t.green }) })

  const box = {
    cust: { x: lx, y: y1, w: CW, h: NH },
    pay: { x: rx, y: y1, w: CW, h: NH },
    fn: { x: rx, y: y2, w: CW, h: NH },
    chef: { x: lx, y: y4, w: CW, h: NH },
    admin: { x: rx, y: y4, w: CW, h: NH },
  }

  // payment path (violet) → one write → live sync (cyan)
  const busY = zone.y + ZONE_H + g3 * 0.5
  const e1 = K.edge([[lx + CW, y1 + NH / 2], [rx, y1 + NH / 2]])
  const e2 = K.edge([[rc, y1 + NH], [rc, y2]])
  const e3 = K.edge([[rc, y2 + NH], [rc, hubCy], [hub.x + hub.w, hubCy]])
  const e4 = K.edge([[hub.x, hubCy], [lc, hubCy], [lc, y1 + NH]], { color: t.cyan })
  const e5 = K.edge([[W / 2, hub.y + HUB_H], [W / 2, busY], [lc, busY], [lc, y4]], { color: t.cyan })
  const e6 = K.edge([[W / 2, hub.y + HUB_H], [W / 2, busY], [rc, busY], [rc, y4]], { color: t.cyan })

  const lab = (s, o) => d.text(s, { ...SUB, fill: t.muted, ...o })
  const mid = (a, b) => (a + b) / 2 + 4
  const labels = [
    lab('pays', { x: W / 2, y: y1 + NH / 2 - 7, anchor: 'middle' }),
    lab('webhook', { x: rc + 9, y: mid(y1 + NH, y2) }),
    lab('one write', { x: rc + 9, y: mid(y2 + NH, hubCy) }),
    lab('live', { x: lc + 9, y: mid(y1 + NH, zone.y), fill: t.cyan }),
    lab('live', { x: W / 2 + 9, y: mid(zone.y + ZONE_H, busY), fill: t.cyan }),
  ]

  const nodes = Object.entries(side).map(([k, n]) => K.node({ ...box[k], ...n }))
  const grad = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
  const hubSvg = K.node({ ...hub, ...hubSpec, stroke: `url(#${grad})` })
  const zoneSvg = K.zone({ ...zone, label: 'single source of truth', kickerFill: t.violet, kickerX: W / 2, kickerY: zone.y + 18, kickerAnchor: 'middle', tracking: 0.08 })

  const T = 5.6
  const packets = [
    K.packet(e1.path, { T, a: 0.02, b: 0.11 }),
    K.packet(e2.path, { T, a: 0.14, b: 0.21 }),
    K.packet(e3.path, { T, a: 0.25, b: 0.35 }),
    K.packet(e4.path, { T, a: 0.4, b: 0.53, color: t.cyan }),
    K.packet(e5.path, { T, a: 0.4, b: 0.51, color: t.cyan }),
    K.packet(e6.path, { T, a: 0.4, b: 0.51, color: t.cyan }),
  ]
  const fx = [
    K.flash({ ...box.pay, T, a: 0.11, b: 0.15 }),
    K.flash({ ...box.fn, T, a: 0.21, b: 0.26 }),
    K.flash({ ...box.cust, T, a: 0.53, b: 0.66, color: t.cyan }),
    K.flash({ ...box.chef, T, a: 0.51, b: 0.64, color: t.cyan }),
    K.flash({ ...box.admin, T, a: 0.51, b: 0.64, color: t.cyan }),
  ]
  // the write fills the source-of-truth zone, then fans out
  const ripples = [K.ripple({ ...hub, r: NODE_R, to: { ...zone, r: 12 }, T, a: 0.35, b: 0.5, color: t.violet })]

  d.add(
    K.in(zoneSvg, 0.25, 'fade-in'),
    K.in([e1, e2, e3, e4, e5, e6].map((e) => e.svg).join('') + labels.join(''), 0.3, 'fade-in'),
    packets,
    ripples,
    K.in(nodes[0], 0.1),
    K.in(nodes[1], 0.17),
    K.in(nodes[2], 0.24),
    K.in(hubSvg, 0.32),
    K.in(nodes[3] + nodes[4], 0.42),
    fx,
  )
  return d.end()
}

// ── AI support agent: query pipeline ────────────────────────────────────────

function renderAgent(t) {
  const p = P.agent
  const d = createDoc({ width: W, height: H, theme: t, title: `${p.name} — architecture: ${p.diagram.title}`, desc: ALT.agent })
  const K = kit(d)
  const dark = K.dark
  const CX = W / 2

  const q = { w: 196, h: 42, y: 80 }
  q.x = CX - q.w / 2
  const ag = { x: PAD + 16, y: 152, w: W - 2 * PAD - 32, h: 98 }
  const ZY = 300
  const ZW = (W - 2 * PAD - 12) / 2
  const zl = { x: PAD, y: ZY, w: ZW, h: H - PAD - ZY }
  const zr = { x: W - PAD - ZW, y: ZY, w: ZW, h: H - PAD - ZY }
  const lc = zl.x + ZW / 2
  const rc = zr.x + ZW / 2

  K.frame({ glow: { cx: CX, cy: ag.y + ag.h / 2, r: 220, color: t.glowViolet }, grid: { cx: CX, cy: ag.y + ag.h / 2, r: 280 } })
  K.header({ title: p.diagram.title, pill: K.pill('function calling', { icon: 'braces' }) })

  const T = 7
  const nodes = []

  // inbound
  nodes.push([K.node({ ...q, icon: 'inbox', label: 'Inbound query', sub: 'support question' }), 0])

  // agent (focal)
  const grad = d.linearGradient(t.gradAccent, { x1: 0, y1: 0, x2: 1, y2: 1 })
  {
    const { x, y, w, h } = ag
    const out = []
    out.push(`<rect x="${r1(x)}" y="${r1(y + 2)}" width="${w}" height="${h}" rx="12" fill="${t.shadow}"/>`)
    out.push(`<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${w - 1}" height="${h - 1}" rx="11.5" fill="${t.surfaceRaised}" stroke="url(#${grad})"/>`)
    // logos
    const tiles = [['claude'], ['openai']]
    tiles.forEach(([slug], i) => {
      const tx = x + 12 + i * 30
      const ty = y + 12
      out.push(`<rect x="${r1(tx + 0.5)}" y="${r1(ty + 0.5)}" width="25" height="25" rx="7" fill="${t.logoTile}" stroke="${t.logoTileBorder}"/>`)
      out.push(K.logo(slug, { x: tx + 5, y: ty + 5, size: 16, on: t.logoTile }))
    })
    const lx = x + 12 + 60 + 6
    out.push(d.text('AI agent', { x: lx, y: y + 23, font: 'body-600', size: 14, fill: t.fg }))
    out.push(d.text('Claude · GPT-4o', { x: lx, y: y + 37.5, ...SUB, fill: t.muted }))
    out.push(`<g class="breathe">${d.icon('sparkles', { x: x + w - 12 - 16, y: y + 17, size: 16, color: t.violet, stroke: 1.9 })}</g>`)
    // divider
    out.push(`<path d="M ${x + 12} ${y + 50.5} H ${x + w - 12}" stroke="${t.border}"/>`)
    // classify row
    const rowY = y + 60
    out.push(d.kicker('Classifies', { x: x + 12, y: rowY + 16, fill: t.muted }))
    const chips = [
      { icon: 'tag', label: 'intent' },
      { icon: 'gauge', label: 'urgency' },
    ]
    let cx = x + w - 12
    const chipBoxes = []
    for (const c of [...chips].reverse()) {
      const pl = d.pill(c.label, { x: cx, y: rowY, h: 24, anchor: 'end', font: 'mono-500', size: 11, icon: c.icon, iconSize: 13, padX: 9, gap: 6, r: 7, fg: t.chipFg, bg: t.chipBg, border: t.chipBorder, iconColor: t.violet })
      out.push(pl.svg)
      chipBoxes.unshift({ x: cx - pl.w, y: rowY, w: pl.w, h: 24 })
      cx -= pl.w + 8
    }
    ag.chips = chipBoxes
    nodes.push([out.join(''), 1])
  }

  // zones (branches)
  const pillGate = (label, cx, y, accent) => {
    const font = 'mono-500'
    const size = 11
    const tw = d.measure(label, { font, size, tracking: 0.08, upper: true })
    const w = tw + 20
    const h = 22
    return {
      svg:
        `<rect x="${r1(cx - w / 2)}" y="${r1(y - h / 2)}" width="${r1(w)}" height="${h}" rx="${h / 2}" fill="${t.surfaceRaised}"/>` +
        `<rect x="${r1(cx - w / 2 + 0.5)}" y="${r1(y - h / 2 + 0.5)}" width="${r1(w - 1)}" height="${h - 1}" rx="${(h - 1) / 2}" fill="${alpha(accent, dark ? 0.14 : 0.08)}" stroke="${alpha(accent, dark ? 0.5 : 0.4)}"/>` +
        d.text(label, { x: cx, y: y + 4, font, size, tracking: 0.08, upper: true, anchor: 'middle', fill: accent }),
      w,
      h,
    }
  }
  const gL = pillGate('routine', lc, ZY, t.cyan)
  const gR = pillGate('needs judgment', rc, ZY, t.amber)

  // leaves
  const ZP = 10
  const LW = ZW - 2 * ZP
  const reply = { x: zl.x + ZP, y: ZY + 26, w: LW, h: 40 }
  const crm = { x: zl.x + ZP, y: zl.y + zl.h - ZP - 40, w: LW, h: 40 }
  const human = { x: zr.x + ZP, y: ZY + 26, w: LW, h: 40 }
  nodes.push([K.node({ ...reply, icon: 'send', label: 'Auto-reply', accent: t.cyan }), 4])
  nodes.push([K.node({ ...crm, icon: 'database', label: 'CRM log', accent: t.cyan }), 5])
  nodes.push([K.node({ ...human, icon: 'user-check', label: 'Human review', accent: t.amber }), 4])

  // pre-drafted context panel
  const draft = { x: zr.x + ZP, y: human.y + human.h + 10, w: LW, h: crm.y + crm.h - (human.y + human.h + 10) }
  {
    const { x, y, w, h } = draft
    const out = [`<rect x="${r1(x + 0.5)}" y="${r1(y + 0.5)}" width="${r1(w - 1)}" height="${r1(h - 1)}" rx="9" fill="${t.inset}" stroke="${alpha(t.amber, dark ? 0.28 : 0.25)}"/>`]
    out.push(d.icon('file-pen-line', { x: x + 10, y: y + 9.5, size: 13, color: t.amber, stroke: 2 }))
    out.push(d.text('Context pre-drafted', { x: x + 29, y: y + 20, font: 'body-500', size: 12, fill: t.fg2 }))
    const lines = [0.86, 0.62]
    lines.forEach((f, i) => {
      out.push(`<rect x="${r1(x + 10)}" y="${r1(y + 29 + i * 8)}" width="${r1((w - 20) * f)}" height="3.5" rx="1.75" fill="${alpha(t.faint, dark ? 0.45 : 0.35)}"/>`)
    })
    nodes.push([out.join(''), 5])
  }

  // edges
  const e1 = K.edge([[CX, q.y + q.h], [CX, ag.y]])
  // shared stem stays neutral; the branches take their route's colour
  const busY = ag.y + ag.h + 18
  const stem = K.edge([[CX, ag.y + ag.h], [CX, busY - 6]], { arrow: false })
  const e2 = K.edge([[CX, busY - 6], [CX, busY], [lc, busY], [lc, reply.y]], { color: t.cyan })
  const e3 = K.edge([[CX, busY - 6], [CX, busY], [rc, busY], [rc, human.y]], { color: t.amber })
  const via = (e) => roundedPath([[CX, ag.y + ag.h], [CX, busY - 6]]) + e.path.replace(/^M [\d.]+ [\d.]+/, '')
  const e4 = K.edge([[lc, reply.y + reply.h], [lc, crm.y]], { color: t.cyan })

  const packets = [
    K.packet(e1.path, { T, a: 0.02, b: 0.09 }),
    K.packet(via(e2), { T, a: 0.2, b: 0.31, color: t.cyan }),
    K.packet(e4.path, { T, a: 0.34, b: 0.4, color: t.cyan }),
    K.packet(e1.path, { T, a: 0.52, b: 0.59 }),
    K.packet(via(e3), { T, a: 0.7, b: 0.81, color: t.amber }),
  ]
  const fx = [
    K.flash({ ...ag, r: 12, T, a: 0.09, b: 0.2 }),
    K.flash({ ...ag.chips[0], r: 7, T, a: 0.1, b: 0.19 }),
    K.flash({ ...ag.chips[1], r: 7, T, a: 0.13, b: 0.19 }),
    K.flash({ ...reply, T, a: 0.31, b: 0.36, color: t.cyan }),
    K.flash({ ...crm, T, a: 0.4, b: 0.48, color: t.cyan }),
    K.flash({ ...ag, r: 12, T, a: 0.59, b: 0.7 }),
    K.flash({ ...ag.chips[0], r: 7, T, a: 0.6, b: 0.69 }),
    K.flash({ ...ag.chips[1], r: 7, T, a: 0.63, b: 0.69 }),
    K.flash({ ...human, T, a: 0.81, b: 0.86, color: t.amber }),
    K.flash({ ...draft, r: 9, T, a: 0.86, b: 0.97, color: t.amber }),
  ]

  d.add(
    K.in(K.zone({ ...zl, accent: t.cyan }) + K.zone({ ...zr, accent: t.amber }), 0.05, 'fade-in'),
    K.in([e1, stem, e2, e3, e4].map((e) => e.svg).join(''), 0.3, 'fade-in'),
    packets,
    K.in(gL.svg + gR.svg, 0.5),
    nodes.map(([svg, i]) => K.in(svg, 0.12 + i * 0.08)),
    fx,
  )
  return d.end()
}

// ── alt text ───────────────────────────────────────────────────────────────

const ALT = {
  dualmind:
    `DualMind Arena architecture — ${P.dualmind.diagram.title}, top to bottom. ` +
    'A user prompt enters the Edge layer at Cloudflare CDN, which absorbs traffic spikes before they reach the origin; ' +
    'then the API layer, a stateless .NET Web API that scales out; ' +
    'then the Gateway layer, Cloudflare AI Gateway, which handles rate limits, caching and per-request logs. ' +
    'The gateway fans the prompt out to Model A and Model B, head to head, in a blind Models layer where both identities are hidden. ' +
    'Both answers go to a community vote, and the Data layer — Supabase (PostgreSQL) — stores the result and ranks the leaderboard. ' +
    `Links to the documentation at ${LINKS.docs.value}.`,
  mealmind:
    `MealMind architecture — ${P.mealmind.diagram.title}. ` +
    'The customer app (orders) pays through Razorpay (payments). Razorpay calls a webhook handled by Cloud Functions on Firebase, ' +
    'which makes one write to Firestore — the single source of truth, with security rules scoped per role. ' +
    'Firestore syncs that write live to the customer app, the chef app (kitchen screen) and the admin app (dashboard). ' +
    'All three are Flutter apps, and a confirmed payment reaches the chef screen and admin dashboard in under a second.',
  agent:
    `AI Support Agent architecture — ${P.agent.diagram.title}. ` +
    'Every inbound query (a support question) goes to an AI agent — Claude and GPT-4o with function calling — that classifies its intent and urgency. ' +
    'Routine queries get an auto-reply and are logged to the CRM. ' +
    'Queries that need judgment go to human review, with the context already pre-drafted.',
}

export default [
  { name: 'arch-dualmind', width: W, height: H, alt: ALT.dualmind, href: LINKS.docs.href, render: renderDualMind },
  { name: 'arch-mealmind', width: W, height: H, alt: ALT.mealmind, render: renderMealMind },
  { name: 'arch-agent', width: W, height: H, alt: ALT.agent, render: renderAgent },
]
