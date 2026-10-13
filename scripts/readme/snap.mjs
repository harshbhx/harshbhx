// Screenshot rendered SVGs the way GitHub shows them, for visual review.
//
//   node snap.mjs <out-dir> <asset-name-prefix>...      e.g. node snap.mjs /tmp/out hero section-
//
// For each matching asset it writes <name>.png: the dark and light renditions
// on GitHub's page colours, at native size and at phone width.
// <name>.png is taken once entrance animations have settled (~3.5s);
// <name>.mid.png is an early frame (0.4s) to check how things animate in.

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const ASSETS = new URL('../../assets/', import.meta.url).pathname
const [outDir, ...prefixes] = process.argv.slice(2)
if (!outDir) {
  console.error('usage: node snap.mjs <out-dir> [asset-name-prefix...]')
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

const names = [...new Set(readdirSync(ASSETS).filter((f) => f.endsWith('-dark.svg')).map((f) => f.replace(/-dark\.svg$/, '')))]
  .filter((n) => !prefixes.length || prefixes.some((p) => n.startsWith(p)))
  .sort()
if (!names.length) {
  console.error('no matching assets in', ASSETS)
  process.exit(1)
}

const PHONE = 358 // README content width on a 390px-wide phone

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' })
// Tall viewport: Chromium does not run animations in off-screen SVG images.
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1000, height: 4000 } })
for (const name of names) {
  const files = { dark: join(ASSETS, `${name}-dark.svg`), light: join(ASSETS, `${name}-light.svg`) }
  const w = Number(readFileSync(files.dark, 'utf8').match(/width="([\d.]+)"/)[1])
  const block = (theme, bg, fg) => `
    <div style="background:${bg};padding:20px 24px;color:${fg};font:12px ui-monospace,monospace">
      <div style="opacity:.6;margin-bottom:8px">${name} · ${theme} · native ${w}px</div>
      <img src="file://${files[theme]}" style="display:block;max-width:100%">
      <div style="opacity:.6;margin:14px 0 8px">phone (${PHONE}px column)</div>
      <div style="width:${PHONE}px"><img src="file://${files[theme]}" style="display:block;max-width:100%"></div>
    </div>`
  const html = `<!doctype html><body style="margin:0;width:${Math.max(w + 48, 420)}px">${block('dark', '#0d1117', '#e6edf3')}${block('light', '#ffffff', '#1f2328')}</body>`
  for (const [suffix, settle] of [['.mid', 400], ['', 3500]]) {
    const file = resolve(outDir, `${name}.html`)
    writeFileSync(file, html)
    await page.goto(`file://${file}`, { waitUntil: 'load' })
    await page.waitForTimeout(settle)
    const el = await page.$('body')
    await el.screenshot({ path: resolve(outDir, `${name}${suffix}.png`) })
  }
  console.log('snap', name)
}
await browser.close()
