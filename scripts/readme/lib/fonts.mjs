// Font loading and text shaping.
//
// Text is not drawn with <text> + @font-face: GitHub serves README images
// from sandboxed origins, and font loading inside SVG-as-image differs by
// browser. Instead every glyph is converted to an outline once per document
// (see svg.mjs) and positioned here with real advance widths and kerning,
// so the result looks identical everywhere.

import { readFileSync } from 'node:fs'
import opentype from 'opentype.js'

const FILES = {
  // Instrument Serif: display headlines (regular + italic only)
  'serif-400': 'InstrumentSerif-Regular.ttf',
  'serif-400i': 'InstrumentSerif-Italic.ttf',
  // Instrument Sans: body and UI
  'sans-400': 'InstrumentSans-400.ttf',
  'sans-400i': 'InstrumentSans-400i.ttf',
  'sans-500': 'InstrumentSans-500.ttf',
  'sans-600': 'InstrumentSans-600.ttf',
  'sans-700': 'InstrumentSans-700.ttf',
  // Geist Mono: kickers, labels, data
  'mono-400': 'GeistMono-400.ttf',
  'mono-500': 'GeistMono-500.ttf',
}

// Older key names still used as defaults inside lib/svg.mjs.
const ALIASES = {
  'body-400': 'sans-400',
  'body-500': 'sans-500',
  'body-600': 'sans-600',
  'body-700': 'sans-700',
  'display-500': 'serif-400',
  'display-600': 'serif-400',
  'display-700': 'serif-400',
  'mono-700': 'mono-500',
}
for (const [alias, key] of Object.entries(ALIASES)) FILES[alias] = FILES[key]

export const FONT_KEYS = Object.keys(FILES).filter((k) => !(k in ALIASES))

const fonts = new Map()
const pathCache = new Map()

export function font(key) {
  if (!FILES[key]) throw new Error(`Unknown font "${key}". Use one of: ${FONT_KEYS.join(', ')}`)
  if (!fonts.has(key)) {
    const buf = readFileSync(new URL(`../fonts/${FILES[key]}`, import.meta.url))
    fonts.set(key, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
  }
  return fonts.get(key)
}

/**
 * Lay out a single line of text.
 * @returns {{ glyphs: {glyph: object, x: number}[], advance: number, upm: number }}
 *   x / advance are in font units; multiply by size / upm for pixels.
 */
export function shape(key, str, { tracking = 0 } = {}) {
  const f = font(key)
  const upm = f.unitsPerEm
  const glyphs = f.stringToGlyphs(str, { features: { liga: false, rlig: false } })
  const chars = Array.from(str)
  const track = tracking * upm
  const out = []
  let x = 0
  glyphs.forEach((g, i) => {
    if (g.index === 0 && chars[i] && !/\s/.test(chars[i])) {
      throw new Error(`Font ${key} has no glyph for "${chars[i]}" (U+${chars[i].codePointAt(0).toString(16).toUpperCase()}) in "${str}"`)
    }
    out.push({ glyph: g, x })
    x += g.advanceWidth + track
    if (i < glyphs.length - 1) x += f.getKerningValue(g, glyphs[i + 1])
  })
  if (glyphs.length) x -= track
  return { glyphs: out, advance: x, upm }
}

/** Width in px of `str` set in `key` at `size` px. */
export function measure(key, str, size, opts) {
  const s = shape(key, str, opts)
  return (s.advance * size) / s.upm
}

/** Outline of one glyph in font units, y pointing down. Empty string for blank glyphs. */
export function glyphPath(key, glyph) {
  const id = `${key}:${glyph.index}`
  if (!pathCache.has(id)) {
    const p = glyph.getPath(0, 0, font(key).unitsPerEm)
    pathCache.set(id, p.commands.length ? p.toPathData(0) : '')
  }
  return pathCache.get(id)
}

/** Vertical metrics in px for a font at a size (ascender above baseline, descender below). */
export function metrics(key, size) {
  const f = font(key)
  const s = size / f.unitsPerEm
  const os2 = f.tables.os2
  return {
    ascender: f.ascender * s,
    descender: -f.descender * s,
    capHeight: (os2?.sCapHeight || f.ascender * 0.7) * s,
    xHeight: (os2?.sxHeight || f.ascender * 0.5) * s,
  }
}
