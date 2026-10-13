// Icon sources:
//  - UI icons: Lucide (ISC), stroke icons on a 24×24 grid
//  - Brand logos: Simple Icons (CC0), filled paths on a 24×24 grid, plus a few
//    logos removed from newer Simple Icons releases (icons/extra, CC0)

import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import * as simpleIcons from 'simple-icons'

const require = createRequire(import.meta.url)
const lucideDir = require.resolve('lucide-static/package.json').replace(/package\.json$/, 'icons/')
const extraDir = new URL('../icons/extra/', import.meta.url)
const extraMeta = JSON.parse(readFileSync(new URL('meta.json', extraDir), 'utf8'))

const lucideCache = new Map()

/** Inner markup of a Lucide icon (paths/circles/etc. without the <svg> wrapper). */
export function lucide(name) {
  if (!lucideCache.has(name)) {
    const file = `${lucideDir}${name}.svg`
    if (!existsSync(file)) throw new Error(`Unknown Lucide icon "${name}" (see https://lucide.dev/icons)`)
    const src = readFileSync(file, 'utf8')
    const inner = src
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>[\s\S]*$/, '')
      .replace(/\s*\n\s*/g, '')
      .replace(/\s*\/>/g, '/>')
    lucideCache.set(name, inner)
  }
  return lucideCache.get(name)
}

/** { title, hex, path } for a brand logo, by Simple Icons slug (e.g. "nodedotjs"). */
export function brand(slug) {
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1)
  const icon = simpleIcons[key]
  if (icon) return { title: icon.title, hex: `#${icon.hex}`, path: icon.path }
  const meta = extraMeta[slug]
  if (meta) {
    const svg = readFileSync(new URL(`${slug}.svg`, extraDir), 'utf8')
    const path = svg.match(/<path d="([^"]+)"/)[1]
    return { title: meta.title, hex: `#${meta.hex}`, path }
  }
  throw new Error(`Unknown brand icon "${slug}"`)
}

// WCAG relative luminance / contrast, used to swap brand colors that would
// disappear on the current surface (e.g. Next.js black on a dark tile).
function lum(hex) {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
