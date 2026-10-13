// Renders every component in components/ to assets/<name>-{dark,light}.svg
// and writes the profile README.md that stitches them together.
//
//   npm run build                 build everything
//   node build.mjs hero section   build only components/hero.mjs and components/section.mjs
//                                 (README.md is only rewritten on a full build)

import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { THEMES } from './lib/theme.mjs'
import { readme } from './readme.mjs'

const COMPONENTS = new URL('./components/', import.meta.url)
const ASSETS = new URL('../../assets/', import.meta.url)
const ROOT = new URL('../../', import.meta.url)

const only = process.argv.slice(2)
const files = readdirSync(COMPONENTS)
  .filter((f) => f.endsWith('.mjs'))
  .filter((f) => !only.length || only.includes(f.replace(/\.mjs$/, '')))

mkdirSync(ASSETS, { recursive: true })
const registry = new Map()
let failed = 0
for (const file of files) {
  let entries
  try {
    entries = (await import(new URL(file, COMPONENTS))).default
  } catch (e) {
    console.error(`✗ ${file}: ${e.stack || e}`)
    failed++
    continue
  }
  for (const entry of entries) {
    for (const theme of Object.keys(THEMES)) {
      try {
        const svg = entry.render(THEMES[theme])
        if (!svg.startsWith('<svg') || !svg.includes('<title')) throw new Error('render() must return a full SVG document from createDoc().end()')
        const m = svg.match(/^<svg[^>]*width="([\d.]+)" height="([\d.]+)"/)
        if (!m || Number(m[1]) !== entry.width || Number(m[2]) !== entry.height) {
          throw new Error(`size mismatch: entry says ${entry.width}×${entry.height}, svg is ${m && `${m[1]}×${m[2]}`}`)
        }
        writeFileSync(new URL(`${entry.name}-${theme}.svg`, ASSETS), svg)
        console.log(`✓ ${entry.name}-${theme}.svg  ${(svg.length / 1024).toFixed(1)} KB`)
      } catch (e) {
        console.error(`✗ ${entry.name} (${theme}): ${e.stack || e}`)
        failed++
      }
    }
    registry.set(entry.name, entry)
  }
}

if (!only.length) {
  const { markdown, missing } = readme(registry)
  if (missing.length) console.warn(`! README references assets that no component produced: ${missing.join(', ')}`)
  writeFileSync(new URL('README.md', ROOT), markdown)
  console.log('✓ README.md')
}
if (failed) {
  console.error(`${failed} failure(s)`)
  process.exit(1)
}
