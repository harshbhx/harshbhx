// Approximate GitHub's rendering of the profile README, using the local
// assets/ instead of raw.githubusercontent.com, and screenshot it.
//
//   node preview.mjs <out-dir> [--live <dir>]
//
// --live: folder holding locally rendered activity-*/snake SVGs (the files the
//         workflow publishes to the `output` branch). Missing ones show as a
//         dashed placeholder.
// Writes desktop-dark.png, desktop-light.png, phone-dark.png, phone-light.png
// plus <name>-<n>.png slices of each (≤1500px tall) for easy viewing.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { marked } from 'marked'
import { chromium } from 'playwright'
import { ASSET_BASE, OUTPUT_BASE } from './readme.mjs'

const require = createRequire(import.meta.url)
const args = process.argv.slice(2)
const outDir = resolve(args[0] || '.preview')
const liveIdx = args.indexOf('--live')
const liveDir = liveIdx > -1 ? resolve(args[liveIdx + 1]) : null
mkdirSync(outDir, { recursive: true })

const root = new URL('../../', import.meta.url).pathname
const assets = `${root}assets/`
let md = readFileSync(`${root}README.md`, 'utf8')

const placeholder = (name) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="415" height="180"><rect x="1" y="1" width="413" height="178" rx="16" fill="none" stroke="#888" stroke-dasharray="6 6"/><text x="207" y="95" text-anchor="middle" font-family="monospace" font-size="13" fill="#888">${name} (built in CI)</text></svg>`)

md = md.replaceAll(ASSET_BASE, `file://${assets}`)
md = md.replace(new RegExp(OUTPUT_BASE.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '([\\w-]+\\.svg)', 'g'), (_, file) => {
  const local = liveDir && `${liveDir}/${file}`
  return local && existsSync(local) ? `file://${local}` : placeholder(file)
})

const body = marked.parse(md, { gfm: true })
const css = (theme) => readFileSync(require.resolve(`github-markdown-css/github-markdown-${theme}.css`), 'utf8')

// The profile README box: 846px content on desktop, 358px on a 390px phone.
const page = (theme, phone) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css(theme)}
body{margin:0;background:${theme === 'dark' ? '#0d1117' : '#ffffff'}}
.box{box-sizing:border-box;margin:${phone ? '0' : '24px auto'};width:${phone ? '100%' : '896px'};border:${phone ? '0' : `1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}`};border-radius:6px;padding:${phone ? '16px' : '24px'}}
.markdown-body img{max-width:100%;box-sizing:content-box}
</style></head><body><div class="box"><article class="markdown-body">${body}</article></div></body></html>`

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' })
for (const [name, theme, width] of [
  ['desktop-dark', 'dark', 1280],
  ['desktop-light', 'light', 1280],
  ['phone-dark', 'dark', 390],
  ['phone-light', 'light', 390],
]) {
  const file = `${outDir}/${name}.html`
  writeFileSync(file, page(theme, width < 600))
  const p = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme, deviceScaleFactor: width < 600 ? 2 : 1 })
  const broken = []
  p.on('requestfailed', (r) => broken.push(r.url().slice(0, 120)))
  await p.goto(`file://${file}`, { waitUntil: 'load' })
  // Grow the viewport to the whole page: Chromium does not run animations in
  // off-screen SVG images, so they would be captured at their first frame.
  await p.waitForTimeout(500)
  const fullH = await p.evaluate(() => document.documentElement.scrollHeight)
  await p.setViewportSize({ width, height: fullH })
  await p.reload({ waitUntil: 'load' })
  await p.waitForTimeout(4500)
  const info = await p.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(0, 120)),
  }))
  await p.screenshot({ path: `${outDir}/${name}.png` })
  // slices
  const sliceH = width < 600 ? 1400 : 1500
  for (let i = 0, y = 0; y < info.height; i++, y += sliceH) {
    await p.screenshot({ path: `${outDir}/${name}-${i}.png`, clip: { x: 0, y, width, height: Math.min(sliceH, info.height - y) } })
  }
  console.log(name, JSON.stringify({ ...info, failed: broken }))
  await p.close()
}
await browser.close()
