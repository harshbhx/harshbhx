// Renders every component in components/ to assets/<name>-{dark,light}.svg
// and writes the profile README.md that stitches them together.
//
//   npm run build                 build everything
//   node build.mjs hero section   build only components/hero.mjs and components/section.mjs
//                                 (README.md is only rewritten on a full build)
//
// A full build fails when README.md references an asset no component
// produced, and deletes generated assets (<name>-{dark,light}.svg) that no
// component produces any more, so CI's "committed output is stale" check
// catches renamed or removed components. Nothing is deleted after a failure.

import { readdirSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { THEMES } from './lib/theme.mjs'
import { readme, pairSide, isFull } from './readme.mjs'
import { padForPair, padForFull } from './lib/svg.mjs'

const COMPONENTS = new URL('./components/', import.meta.url)
const ASSETS = new URL('../../assets/', import.meta.url)
const ROOT = new URL('../../', import.meta.url)

const only = process.argv.slice(2)
const files = readdirSync(COMPONENTS)
  .filter((f) => f.endsWith('.mjs'))
  .filter((f) => !only.length || only.includes(f.replace(/\.mjs$/, '')))
if (only.length && files.length < only.length) {
  const found = files.map((f) => f.replace(/\.mjs$/, ''))
  console.error(`✗ no component file matches: ${only.filter((n) => !found.includes(n)).join(', ')}`)
  process.exit(1)
}

mkdirSync(ASSETS, { recursive: true })
const registry = new Map()
const written = new Set()
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
        // transparent side margins so every card edge lines up in the README (see readme.mjs)
        const side = pairSide(entry.name)
        const out = side ? padForPair(svg, side) : isFull(entry.name) ? padForFull(svg) : svg
        writeFileSync(new URL(`${entry.name}-${theme}.svg`, ASSETS), out)
        written.add(`${entry.name}-${theme}.svg`)
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
  if (missing.length) {
    // readme() leaves such a block out, so the page would silently lose a section
    console.error(`✗ README.md references assets that no component produced: ${missing.join(', ')}`)
    failed++
  }
  writeFileSync(new URL('README.md', ROOT), markdown)
  console.log('✓ README.md')
  if (!failed) {
    for (const f of readdirSync(ASSETS).filter((f) => /-(dark|light)\.svg$/.test(f) && !written.has(f))) {
      unlinkSync(new URL(f, ASSETS))
      console.log(`✓ removed stale ${f}`)
    }
  }
}
if (failed) {
  console.error(`${failed} failure(s)`)
  process.exit(1)
}
