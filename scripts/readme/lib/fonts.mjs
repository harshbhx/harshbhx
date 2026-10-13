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
  'display-500': 'SpaceGrotesk-500.ttf',
  'display-600': 'SpaceGrotesk-600.ttf',
  'display-700': 'SpaceGrotesk-700.ttf',
  'body-400': 'Inter-400.ttf',
  'body-500': 'Inter-500.ttf',
  'body-600': 'Inter-600.ttf',
  'body-700': 'Inter-700.ttf',
  'mono-400': 'JetBrainsMono-400.ttf',
  'mono-500': 'JetBrainsMono-500.ttf',
  'mono-700': 'JetBrainsMono-700.ttf',
}

export const FONT_KEYS = Object.keys(FILES)

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
