// SVG document builder and shared drawing primitives.
//
// Every component renders through createDoc(), which:
//  - turns text into outlined glyphs (one <path> per distinct glyph in <defs>,
//    placed with <use>), so typography is identical in every browser
//  - collects gradients, patterns, masks and CSS animations into one file
//  - adds <title>/<desc> for screen readers and honours prefers-reduced-motion
//
// Coordinates are SVG user units, which equal CSS px at native size.

import { shape, measure as measureRaw, glyphPath, metrics as fontMetrics } from './fonts.mjs'
import { lucide, brand, contrast } from './icons.mjs'
import { LAYOUT } from './theme.mjs'

export const r1 = (n) => Math.round(n * 10) / 10
const r4 = (n) => Math.round(n * 10000) / 10000
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const attrs = (o = {}) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? Math.round(v * 100) / 100 : esc(v)}"`)
    .join('')

// Animations shared by all components. Components add their own with d.css().
// Any running animation makes the browser re-rasterise the whole SVG image
// every frame (glyphs, portrait, grain), so .pulse runs 4 times and then
// rests: after the last ring the circle is back at its base state, hidden
// under the solid dot drawn on top of it. .pulse-live loops forever; keep it
// to one small signal per page.
export const BASE_CSS = `
@keyframes fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes fade-in{from{opacity:0}to{opacity:1}}
@keyframes pulse-ring{0%{opacity:.75;transform:scale(1)}80%,100%{opacity:0;transform:scale(2.8)}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes dash-flow{to{stroke-dashoffset:-24}}
@keyframes drift-a{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,14px)}}
@keyframes drift-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-24px,-12px)}}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
.fade-up{animation:fade-up .9s cubic-bezier(.2,.7,.2,1) both}
.fade-in{animation:fade-in 1.2s ease both}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse-ring 2.4s cubic-bezier(.2,.6,.3,1) 4}
.pulse-live{transform-box:fill-box;transform-origin:center;animation:pulse-ring 2.4s cubic-bezier(.2,.6,.3,1) infinite}
.blink{animation:blink 1.1s step-end infinite}
.flow{stroke-dasharray:4 8;animation:dash-flow 1.6s linear infinite}
.drift-a{animation:drift-a 16s ease-in-out infinite}
.drift-b{animation:drift-b 20s ease-in-out infinite}
.breathe{animation:breathe 4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.packet{display:none}}
`

/**
 * Start a document.
 * @param {{width:number,height:number,theme:object,title:string,desc?:string}} o
 */
export function createDoc({ width, height, theme, title, desc = '' }) {
  if (!title) throw new Error('createDoc needs a title (used for accessibility)')
  const t = theme
  const defs = []
  const css = []
  const body = []
  const glyphIds = new Map()
  const glyphDefs = []
  let uidCounter = 0

  const d = {
    t,
    w: width,
    h: height,
    LAYOUT,

    /** Unique id inside this document. */
    uid(prefix = 'u') {
      return `${prefix}${(uidCounter++).toString(36)}`
    },
    def(markup) {
      defs.push(markup)
    },
    css(rule) {
      css.push(rule)
    },
    add(...markup) {
      body.push(...markup.flat(Infinity).filter(Boolean))
    },

    // ───────────────────────── text ─────────────────────────

    metrics: (font, size) => fontMetrics(font, size),

    /** Width in px of a single line. */
    measure(str, { font = 'body-400', size = 14, tracking = 0, upper = false } = {}) {
      return measureRaw(font, upper ? String(str).toUpperCase() : String(str), size, { tracking })
    },

    /**
     * One line of text. y is the baseline.
     * @param {object} o {x,y,font,size,fill,anchor:'start'|'middle'|'end',tracking (em),upper,opacity,cls,style}
     */
    text(str, o = {}) {
      const { x = 0, y = 0, font = 'body-400', size = 14, fill = t.fg, anchor = 'start', tracking = 0, upper = false, opacity, cls, style } = o
      const s = upper ? String(str).toUpperCase() : String(str)
      const shaped = shape(font, s, { tracking })
      const scale = size / shaped.upm
      const width = shaped.advance * scale
      let x0 = x
      if (anchor === 'middle') x0 -= width / 2
      else if (anchor === 'end') x0 -= width
      const uses = shaped.glyphs
        .map(({ glyph, x: gx }) => {
          const id = glyphId(font, glyph)
          return id ? `<use href="#${id}" x="${Math.round(gx)}"/>` : ''
        })
        .join('')
      const g = `<g transform="translate(${r1(x0)} ${r1(y)}) scale(${r4(scale)})" fill="${fill}"${attrs({ opacity })}>${uses}</g>`
      return cls || style ? `<g${attrs({ class: cls, style })}>${g}</g>` : g
    },

    /** Text filled with a horizontal gradient (defaults to the theme's text gradient). */
    gradientText(str, o = {}) {
      const { x = 0, y = 0, font = 'display-700', size = 32, anchor = 'start', stops = t.gradText, cls, style } = o
      const w = d.measure(str, o)
      let x0 = x
      if (anchor === 'middle') x0 -= w / 2
      else if (anchor === 'end') x0 -= w
      const m = fontMetrics(font, size)
      const gid = d.linearGradient(stops, { x1: x0, y1: 0, x2: x0 + w, y2: 0, units: 'userSpaceOnUse' })
      const mid = d.uid('m')
      const top = y - m.ascender - 2
      const hgt = m.ascender + m.descender + 4
      d.def(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="${r1(x0 - 4)}" y="${r1(top)}" width="${r1(w + 8)}" height="${r1(hgt)}">${d.text(str, { ...o, anchor: 'start', x: x0, fill: '#fff', cls: undefined, style: undefined })}</mask>`)
      const rect = `<rect x="${r1(x0 - 4)}" y="${r1(top)}" width="${r1(w + 8)}" height="${r1(hgt)}" fill="url(#${gid})" mask="url(#${mid})"/>`
      return cls || style ? `<g${attrs({ class: cls, style })}>${rect}</g>` : rect
    },

    /** Break rich content into lines that fit `width`. See paragraph() for the content format. */
    wrap(content, { font = 'body-400', size = 14, width = Infinity, fill = t.fg2, tracking = 0 } = {}) {
      const groups = tokenize(content, { font, fill })
      const lines = []
      let cur = []
      let curW = 0
      const spaceW = (f) => measureRaw(f, ' ', size, { tracking })
      for (const grp of groups) {
        if (grp.br) {
          lines.push(cur)
          cur = []
          curW = 0
          continue
        }
        const gw = grp.parts.reduce((a, p) => a + measureRaw(p.font, p.text, size, { tracking }), 0)
        const sw = cur.length ? spaceW(grp.parts[0].font) : 0
        if (cur.length && curW + sw + gw > width) {
          lines.push(cur)
          cur = [grp]
          curW = gw
        } else {
          cur.push(grp)
          curW += sw + gw
        }
      }
      if (cur.length) lines.push(cur)
      return lines.map((groupsInLine) => {
        // merge into runs of identical style, spaces included, so kerning applies inside runs
        const runs = []
        groupsInLine.forEach((grp, gi) => {
          grp.parts.forEach((p, pi) => {
            const text = (gi > 0 && pi === 0 ? ' ' : '') + p.text
            const last = runs[runs.length - 1]
            if (last && last.font === p.font && last.fill === p.fill) last.text += text
            else runs.push({ text, font: p.font, fill: p.fill })
          })
        })
        const width = runs.reduce((a, r) => a + measureRaw(r.font, r.text, size, { tracking }), 0)
        return { runs, width }
      })
    },

    /**
     * Multi-line text block. y is the first baseline.
     * content: string, or an array of strings / {text, font?, fill?} segments
     *          ("\n" forces a line break).
     * @returns {{svg:string,height:number,lines:number,width:number}}
     */
    paragraph(content, o = {}) {
      const { x = 0, y = 0, width = Infinity, font = 'body-400', size = 14, lineHeight = Math.round(size * 1.5), fill = t.fg2, anchor = 'start', maxLines = Infinity, tracking = 0, cls, style } = o
      let lines = d.wrap(content, { font, size, width, fill, tracking })
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines)
        const last = lines[maxLines - 1]
        const run = last.runs[last.runs.length - 1]
        while (run.text.length > 1 && last.width + measureRaw(run.font, '…', size) > width) {
          run.text = run.text.slice(0, -1)
          last.width = last.runs.reduce((a, r) => a + measureRaw(r.font, r.text, size, { tracking }), 0)
        }
        run.text = run.text.replace(/[\s,.;:–—-]+$/, '') + '…'
      }
      const out = lines.map((ln, i) => {
        let cx = x
        if (anchor === 'middle') cx -= ln.width / 2
        else if (anchor === 'end') cx -= ln.width
        return ln.runs
          .map((r) => {
            const s = d.text(r.text, { x: cx, y: y + i * lineHeight, font: r.font, size, fill: r.fill, tracking })
            cx += measureRaw(r.font, r.text, size, { tracking })
            return s
          })
          .join('')
      })
      const svg = cls || style ? `<g${attrs({ class: cls, style })}>${out.join('')}</g>` : out.join('')
      return { svg, height: lines.length * lineHeight, lines: lines.length, width: Math.max(0, ...lines.map((l) => l.width)) }
    },

    /** Small uppercase mono label, e.g. "01 · PROOF OF WORK". */
    kicker(label, o = {}) {
      return d.text(label, { font: 'mono-500', size: 11, tracking: 0.14, upper: true, fill: t.muted, ...o })
    },

    // ───────────────────────── paint servers ─────────────────────────

    /** Linear gradient; returns its id. Coordinates are fractions unless units = 'userSpaceOnUse'. */
    linearGradient(stops, { x1 = 0, y1 = 0, x2 = 1, y2 = 0, units } = {}) {
      const id = d.uid('lg')
      const s = stopsMarkup(stops)
      d.def(`<linearGradient id="${id}"${attrs({ x1, y1, x2, y2, gradientUnits: units })}>${s}</linearGradient>`)
      return id
    },

    /** Soft radial glow, painted as a circle. color: [hex, peakOpacity] or hex. */
    glow({ cx, cy, r, color = t.glowViolet, opacity, cls, style }) {
      const [hex, peak] = Array.isArray(color) ? color : [color, opacity ?? 0.3]
      const id = d.uid('rg')
      d.def(`<radialGradient id="${id}"><stop offset="0" stop-color="${hex}" stop-opacity="${opacity ?? peak}"/><stop offset=".55" stop-color="${hex}" stop-opacity="${r4((opacity ?? peak) * 0.35)}"/><stop offset="1" stop-color="${hex}" stop-opacity="0"/></radialGradient>`)
      return `<circle${attrs({ cx, cy, r, class: cls, style })} fill="url(#${id})"/>`
    },

    /** Dot or line grid filling a rect, optionally fading out from a centre point. */
    pattern({ x = 0, y = 0, w = d.w, h = d.h, kind = 'dots', step = 18, fade = null }) {
      const pid = d.uid('pt')
      const cell =
        kind === 'dots'
          ? `<circle cx="${step / 2}" cy="${step / 2}" r="1.1" fill="${t.grid}"/>`
          : `<path d="M ${step} 0 L 0 0 0 ${step}" stroke="${t.gridLine}" stroke-width="1" fill="none"/>`
      d.def(`<pattern id="${pid}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">${cell}</pattern>`)
      let mask = ''
      if (fade) {
        const mid = d.uid('pm')
        const gid = d.uid('pg')
        d.def(`<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${r1(fade.cx)}" cy="${r1(fade.cy)}" r="${r1(fade.r)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>`)
        d.def(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${gid})"/></mask>`)
        mask = ` mask="url(#${mid})"`
      }
      return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#${pid})"${mask}/>`
    },

    // ───────────────────────── surfaces ─────────────────────────

    /**
     * Card surface: gradient fill, clipped decorations, hairline border and top sheen.
     * Call it first, then draw content on top.
     * @param {object} o {x,y,w,h,r, glows:[{cx,cy,r,color}], pattern:{kind,step,fade}, borderGradient:bool}
     */
    card(o = {}) {
      const { x = 0.5, y = 0.5, w = d.w - 1, h = d.h - 1, r = LAYOUT.radius, glows = [], pattern = null, borderGradient = false, fill } = o
      const surf = fill || `url(#${d.linearGradient([t.surfaceTop, t.surfaceBottom], { x1: 0, y1: 0, x2: 0.35, y2: 1 })})`
      const cid = d.uid('cc')
      d.def(`<clipPath id="${cid}"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}"/></clipPath>`)
      const deco = [
        ...glows.map((g) => d.glow(g)),
        pattern ? d.pattern({ x, y, w, h, ...pattern }) : '',
      ].join('')
      const sheenId = d.linearGradient(
        [
          [0, t.highlight, 0],
          [0.5, t.highlight, 1],
          [1, t.highlight, 0],
        ],
        { x1: 0, y1: 0, x2: 1, y2: 0 },
      )
      const stroke = borderGradient
        ? `url(#${d.linearGradient(t.gradBorder.map((c, i, a) => [i / (a.length - 1), c, 0.55]), { x1: 0, y1: 0, x2: 1, y2: 1 })})`
        : t.border
      return [
        `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="${surf}"/>`,
        deco ? `<g clip-path="url(#${cid})">${deco}</g>` : '',
        `<path d="M ${r1(x + r)} ${r1(y + 0.5)} H ${r1(x + w - r)}" stroke="url(#${sheenId})" stroke-width="1"/>`,
        `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r}" fill="none" stroke="${stroke}" stroke-width="1"/>`,
      ].join('')
    },

    /**
     * Rounded label. Returns { svg, w, h }.
     * @param {object} o {x,y,h,font,size,fg,bg,border,dot,pulse,icon,iconColor,padX,gap,anchor,tracking,upper,r,cls,style}
     */
    pill(label, o = {}) {
      const {
        x = 0, y = 0, h = 26, font = 'body-600', size = 12, fg = t.chipFg, bg = t.chipBg, border = t.chipBorder,
        dot = null, pulse = false, icon = null, iconColor, iconSize = 14, padX = 11, gap = 7, anchor = 'start',
        tracking = 0, upper = false, r = h / 2, cls, style,
      } = o
      const tw = label ? d.measure(label, { font, size, tracking, upper }) : 0
      const lead = (dot ? 7 + gap : 0) + (icon ? iconSize + gap : 0)
      const w = padX * 2 + lead + tw - (label ? 0 : gap)
      let x0 = x
      if (anchor === 'middle') x0 -= w / 2
      else if (anchor === 'end') x0 -= w
      const cy = y + h / 2
      const m = fontMetrics(font, size)
      const parts = [`<rect x="${r1(x0)}" y="${r1(y)}" width="${r1(w)}" height="${h}" rx="${r1(r)}" fill="${bg}"${border ? ` stroke="${border}"` : ''}/>`]
      let cx = x0 + padX
      if (dot) {
        if (pulse) parts.push(`<circle class="pulse" cx="${r1(cx + 3.5)}" cy="${r1(cy)}" r="3.5" fill="${dot}"/>`)
        parts.push(`<circle cx="${r1(cx + 3.5)}" cy="${r1(cy)}" r="3.5" fill="${dot}"/>`)
        cx += 7 + gap
      }
      if (icon) {
        parts.push(d.icon(icon, { x: cx, y: cy - iconSize / 2, size: iconSize, color: iconColor || fg }))
        cx += iconSize + gap
      }
      if (label) parts.push(d.text(label, { x: cx, y: cy + m.capHeight / 2, font, size, fill: fg, tracking, upper }))
      const svg = parts.join('')
      return { svg: cls || style ? `<g${attrs({ class: cls, style })}>${svg}</g>` : svg, w, h }
    },

    /** Tech tag chip (mono, compact). Returns { svg, w, h }. */
    chip(label, o = {}) {
      return d.pill(label, { font: 'mono-500', size: 11, h: 24, padX: 9, r: 7, ...o })
    },

    /** Lay out pills/chips left-to-right with wrapping. Returns { svg, height, rows }. */
    flow(items, { x = 0, y = 0, width = Infinity, gap = 8, rowGap = 8, make = (label, p) => d.chip(label, p) } = {}) {
      let cx = x
      let cy = y
      let rowH = 0
      let rows = 1
      const out = []
      for (const it of items) {
        const probe = make(it, { x: 0, y: 0 })
        if (cx > x && cx + probe.w > x + width) {
          cx = x
          cy += rowH + rowGap
          rowH = 0
          rows++
        }
        const p = make(it, { x: cx, y: cy })
        out.push(p.svg)
        cx += p.w + gap
        rowH = Math.max(rowH, p.h)
      }
      return { svg: out.join(''), height: cy - y + rowH, rows }
    },

    // ───────────────────────── icons ─────────────────────────

    /**
     * Lucide stroke icon with its top-left at (x, y). With `cls`/`style` the
     * icon is wrapped in its own <g>, so a CSS animation's transform does not
     * replace the translate/scale that positions it.
     */
    icon(name, { x = 0, y = 0, size = 16, color = t.fg2, stroke = 2, opacity, cls, style } = {}) {
      const s = size / 24
      const g = `<g${attrs({ opacity })} transform="translate(${r1(x)} ${r1(y)}) scale(${r4(s)})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${lucide(name)}</g>`
      return cls || style ? `<g${attrs({ class: cls, style })}>${g}</g>` : g
    },

    /**
     * Brand logo with its top-left at (x, y). Uses the brand colour unless it
     * would not stand out from `on` (the colour behind it), then falls back to `fallback`.
     * A slug of the form `lucide:<name>` draws that generic Lucide icon instead
     * (in `color`, default violet), for links no brand mark fits, e.g. a website.
     */
    logo(slug, { x = 0, y = 0, size = 22, color, on = t.logoTile, fallback = t.fg, minContrast = 2.2, stroke = 2 } = {}) {
      if (slug.startsWith('lucide:')) return d.icon(slug.slice(7), { x, y, size, color: color || t.violet, stroke })
      const b = brand(slug)
      let fill = color || b.hex
      if (!color && on && contrast(b.hex, on) < minContrast) fill = fallback
      return `<path transform="translate(${r1(x)} ${r1(y)}) scale(${r4(size / 24)})" fill="${fill}" d="${b.path}"/>`
    },
    brand,

    // ───────────────────────── output ─────────────────────────

    end() {
      const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`
      const meta = `<title id="title">${esc(title)}</title><desc id="desc">${esc(desc || title)}</desc>`
      const style = `<style>${(BASE_CSS + css.join('\n')).replace(/\n+/g, '')}</style>`
      const allDefs = `<defs>${glyphDefs.join('')}${defs.join('')}</defs>`
      return slimGlyphs(`${head}${meta}${style}${allDefs}${body.join('')}</svg>\n`)
    },
  }

  function glyphId(font, glyph) {
    const key = `${font}:${glyph.index}`
    if (glyphIds.has(key)) return glyphIds.get(key)
    const p = glyphPath(font, glyph)
    if (!p) {
      glyphIds.set(key, null)
      return null
    }
    const id = `g${glyphIds.size.toString(36)}`
    glyphIds.set(key, id)
    glyphDefs.push(`<path id="${id}" d="${p}"/>`)
    return id
  }

  return d
}

// stops: ['#hex', ...] evenly spaced, or [[offset, color, opacity?], ...]
function stopsMarkup(stops) {
  return stops
    .map((s, i) => {
      const [o, c, a] = Array.isArray(s) ? s : [stops.length === 1 ? 0 : i / (stops.length - 1), s]
      return `<stop offset="${r4(o)}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`
    })
    .join('')
}

// Split rich content into unbreakable groups (words, possibly made of several
// styled parts) and explicit line breaks.
function tokenize(content, base) {
  const segs = Array.isArray(content) ? content : [content]
  const groups = []
  let cur = null
  for (const s of segs) {
    const seg = typeof s === 'string' ? { text: s } : s
    const font = seg.font || base.font
    const fill = seg.fill || base.fill
    for (const part of String(seg.text).split(/(\n|[ \t]+)/)) {
      if (!part) continue
      if (part === '\n') {
        if (cur) groups.push(cur)
        cur = null
        groups.push({ br: true })
      } else if (/^[ \t]+$/.test(part)) {
        if (cur) groups.push(cur)
        cur = null
      } else {
        if (!cur) cur = { parts: [] }
        cur.parts.push({ text: part, font, fill })
      }
    }
  }
  if (cur) groups.push(cur)
  return groups
}

/**
 * Widen a rendered SVG by a transparent margin of `gutter` user units on the
 * left and on the right (the content keeps its coordinates). Throws when the
 * root tag is not the one createDoc().end() writes, so a format change can
 * never silently drop the margin.
 */
export function padSides(svg, gutter) {
  let hit = false
  const out = svg.replace(/^<svg([^>]*?) width="([\d.]+)" height="([\d.]+)" viewBox="0 0 ([\d.]+) ([\d.]+)"/, (_, pre, w, h, vw, vh) => {
    hit = true
    return `<svg${pre} width="${Number(w) + 2 * gutter}" height="${h}" viewBox="${-gutter} 0 ${Number(vw) + 2 * gutter} ${vh}"`
  })
  if (!hit) throw new Error('padSides: unexpected <svg> header (expected createDoc().end() output)')
  return out
}

/**
 * Half-width image → 8 transparent units on each side (415 → 431). Two halves
 * side by side get a 2 × 8 gutter between their cards; stacked on a phone,
 * every half sits centred in the column with the same edges.
 * `side` is accepted for compatibility and no longer changes anything.
 */
export function padForPair(svg, side, gutter = PAIR_GUTTER) {
  return padSides(svg, gutter)
}
export const PAIR_GUTTER = 8

/**
 * Full-width image → 16 transparent units on each side (850 → 882): the same
 * share of the width as the halves' margin (16/882 ≈ 8/431), so on a phone,
 * where every image is drawn at the column width, all card edges line up.
 */
export function padForFull(svg, gutter = FULL_GUTTER) {
  return padSides(svg, gutter)
}
export const FULL_GUTTER = 16

/**
 * Opt-in phone layer for full-width components (they render at ~0.41× on a
 * phone). `d.css(PHONE_CSS)`, then put desktop-only content in
 * `<g class="dt">` and the phone-sized replacement in `<g class="ph">`. An
 * SVG's own media queries see the size the image is drawn at, so the phone
 * layer shows whenever the image is narrower than PHONE_MAX px.
 */
export const PHONE_MAX = 600
// The phone layer always carries a short load-time animation: Firefox lays an
// SVG image out at its small size first, and if the visible layer has no
// running animation it never advances the desktop layer's entrance animations.
export const PHONE_CSS = `.ph{display:none;animation:fade-in .6s ease both}@media (max-width:${PHONE_MAX}px){.dt{display:none}.ph{display:inline}}`

/**
 * Shrink the outlined-glyph definitions of a finished SVG without changing a
 * pixel: drop the zero-length "L" segments the font converter emits after
 * every curve and rewrite each path with relative integer coordinates.
 * Applied to every document by createDoc().end(); it is idempotent.
 */
export function slimGlyphs(svg) {
  return svg.replace(/(<path id="g[0-9a-z]+" d=")([^"]*)(")/g, (_, a, path, b) => a + slimPath(path) + b)
}

const ARITY = { M: 2, L: 2, H: 1, V: 1, Q: 4, T: 2, C: 6, S: 4, Z: 0 }
function slimPath(path) {
  const tok = path.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || []
  if (tok.some((x) => /[a-z]/.test(x) && x !== 'z')) return path // only absolute paths are rewritten
  let i = 0
  let cx = 0, cy = 0, sx = 0, sy = 0
  let out = ''
  let lastCmd = ''
  const emit = (cmd, nums) => {
    let s = cmd === lastCmd && cmd !== 'm' && cmd !== 'z' ? '' : cmd
    lastCmd = cmd === 'm' ? 'l' : cmd
    nums.forEach((n, k) => {
      const v = String(Math.round(n * 100) / 100)
      const sep = (k === 0 && s.length) || v.startsWith('-') ? '' : ' ' // a letter or a minus sign separates too
      s += sep + v
    })
    out += s
  }
  let cmd = ''
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++].toUpperCase()
    else if (cmd === 'M') cmd = 'L'
    const n = tok.slice(i, i + ARITY[cmd]).map(Number)
    i += ARITY[cmd]
    if (cmd === 'M') {
      emit('m', [n[0] - cx, n[1] - cy])
      cx = sx = n[0]
      cy = sy = n[1]
    } else if (cmd === 'L') {
      if (n[0] === cx && n[1] === cy) continue
      emit('l', [n[0] - cx, n[1] - cy])
      cx = n[0]
      cy = n[1]
    } else if (cmd === 'Q' || cmd === 'C') {
      emit(cmd.toLowerCase(), n.map((v, k) => v - (k % 2 ? cy : cx)))
      cx = n[n.length - 2]
      cy = n[n.length - 1]
    } else if (cmd === 'Z') {
      emit('z', [])
      cx = sx
      cy = sy
    } else return path // H/V/T/S never come out of the converter; leave such paths alone
  }
  return out
}

