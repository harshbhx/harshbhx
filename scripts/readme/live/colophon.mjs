// The colophon: the last line of the issue, as at the back of a printed
// magazine — what it is set in, that it is reprinted daily by GitHub
// Actions, the date and time of this printing (IST), and a real status check
// of the sites the issue links to, made from the Actions runner while it
// printed (live/uptime.mjs): HTTP status and response time per site.
//
//  desktop: COLOPHON · Set in … — reprinted daily by GitHub Actions …… TUE 13 OCT · 08:47 IST
//           ───────────────────────────────────────────────────────────────
//           ● 4/4 up                │ dualmindlab.tech │ arena.… │ docs.… │ pixelproof.…
//           checked from GitHub Actions  200 · 293 ms …
//  phone (.ph, drawn at ~0.41×): two lines of ~27-unit type — "Reprinted daily
//           by GitHub Actions  13 OCT · 08:47 IST" / "● 4/4 sites up · <the sites>".
//
// The date is set exactly as in the card footers (kit.mjs dateline, KICK caps).
//
// A site that is down shows calmly in red; it never fails the build.

import { createDoc, PHONE_CSS, r1 } from '../lib/svg.mjs'
import { editorial, paper, hairline, liveDot, runs } from '../lib/editorial.mjs'
import { LAYOUT } from '../lib/theme.mjs'
import { P, KICK, ist, istStamp, dateline, fit, fade } from './kit.mjs'

export const W = LAYOUT.full // 850
export const H = 116
const R = W - P

const SET_IN = 'Set in Instrument Serif & Sans · Geist Mono — reprinted daily by GitHub Actions'

/**
 * Printer's registration mark (the target printed outside the trim to line
 * up the plates), centred on (cx, cy).
 */
function registration(d, cx, cy, r, { color = d.t.terra, width = 1 } = {}) {
  const a = r * 1.55
  return (
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="none" stroke="${color}" stroke-width="${width}"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.42)}" fill="${color}"/>` +
    `<path d="M${r1(cx - a)} ${r1(cy)}H${r1(cx + a)}M${r1(cx)} ${r1(cy - a)}V${r1(cy + a)}" stroke="${color}" stroke-width="${width}"/>`
  )
}

/** SET_IN as runs: serif italic, with the "·" set in sans and given room. */
function setInRuns(t, size) {
  const [a, rest] = SET_IN.split(' · ')
  return [
    { text: a, font: 'serif-400i', size, fill: t.fg2, after: 7 },
    { text: '·', font: 'sans-500', size: size * 0.8, fill: t.muted, after: 7 },
    { text: rest, font: 'serif-400i', size, fill: t.fg2 },
  ]
}

const fmtMs = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 2)} s` : `${ms} ms`)
/** "200 · 293 ms", "HTTP 503 · 412 ms", "timeout · 15 s". */
const detail = (s) => (s.ok ? `${s.status} · ${fmtMs(s.ms)}` : s.status ? `HTTP ${s.status} · ${fmtMs(s.ms)}` : `${s.error} · ${fmtMs(s.ms)}`)

export function colophonAlt(data) {
  const u = data.uptime
  const sites = u?.sites ?? []
  const up = sites.filter((s) => s.ok).length
  const status = sites.length
    ? ` Status checked from GitHub Actions: ${up} of ${sites.length} sites up — ${sites.map((s) => `${s.host} ${s.ok ? `up (${detail(s)})` : `down (${detail(s)})`}`).join('; ')}.`
    : ''
  return `Colophon: ${SET_IN}. This edition: ${istStamp(data.fetchedAt)}.${status}`
}

export function renderColophon(theme, data) {
  const d = createDoc({ width: W, height: H, theme, title: 'Colophon — reprinted daily by GitHub Actions', desc: colophonAlt(data) })
  editorial(d)
  d.css(PHONE_CSS)
  d.css('.fade-in{animation-duration:.6s}')
  const t = d.t
  d.add(paper(d))
  const sites = data.uptime?.sites ?? []
  const up = sites.filter((s) => s.ok).length
  const allUp = sites.length > 0 && up === sites.length

  // ───────────────────────── desktop ─────────────────────────
  const dt = []
  {
    const B1 = 38
    const mark = registration(d, P + 7, B1 - 4, 5)
    dt.push(`<g class="stamp" style="animation-delay:.2s">${mark}</g>`)
    const lead = runs(
      d,
      [{ text: 'Colophon', ...KICK, fill: t.terra, after: 14 }, ...setInRuns(t, 17).map((r) => ({ ...r, tracking: 0, upper: false }))],
      { x: P + 22, y: B1, size: 17 },
    )
    dt.push(lead.svg)
    // same dateline and type as the card footers (monospaced, so a fixed width)
    const stamp = dateline(data.fetchedAt)
    const sw = d.measure(stamp, KICK)
    if (lead.x + 24 > R - sw) throw new Error('colophon: first line overflows')
    dt.push(d.text(stamp, { x: R, y: B1, ...KICK, fill: t.muted, anchor: 'end' }))
    dt.push(hairline(d, P, R, 54))

    const B2 = 80
    const B3 = 98
    if (!sites.length) {
      dt.push(d.text('no status check in this printing', { x: P, y: B2 + 8, font: 'serif-400i', size: 15, fill: t.muted }))
    } else {
      // left: the summary
      const SUM = { font: 'sans-600', size: 14 }
      const sumText = `${up}/${sites.length} up`
      const dot = allUp ? liveDot(d, P + 4, B2 - 5, 3.6) : `<circle cx="${P + 4}" cy="${B2 - 5}" r="3.6" fill="${t.red}"/>`
      const NOTE = { font: 'serif-400i', size: 14 }
      const note = 'checked from GitHub Actions'
      const left = Math.max(14 + d.measure(sumText, SUM), d.measure(note, NOTE))
      dt.push(fade(dot + d.text(sumText, { x: P + 14, y: B2, ...SUM, fill: allUp ? t.green : t.fg }) + d.text(note, { x: P, y: B3, ...NOTE, fill: t.muted }), 0.2, 'fade-in'))

      // right: one column per site, gaps shared out evenly with a rule in each
      const HOST = { font: 'sans-500', size: 12.5 }
      const DET = { font: 'mono-400', size: 11 }
      const widths = sites.map((s) => Math.max(d.measure(s.host, HOST), d.measure(detail(s), DET)))
      const room = R - P - left
      const gap = (room - widths.reduce((a, w) => a + w, 0)) / sites.length
      const fitHost = gap < 20
      let x = P + left
      sites.forEach((s, i) => {
        const g = Math.max(20, gap)
        const colW = fitHost ? (room - sites.length * 20) / sites.length : widths[i]
        x += g
        const rx = x - g / 2
        const host = fitHost ? fit(d, s.host, { ...HOST, max: colW }) : s.host
        dt.push(
          fade(
            `<path d="M${r1(rx)} ${B2 - 13}V${B3 + 4}" stroke="${t.ruleSoft}"/>` +
              d.text(host, { x, y: B2, ...HOST, fill: t.fg }) +
              d.text(detail(s), { x, y: B3, ...DET, fill: s.ok ? t.muted : t.red }),
            0.3 + i * 0.08,
            'fade-in',
          ),
        )
        x += colW
      })
    }
  }
  d.add(`<g class="dt">${dt.join('')}</g>`)

  // ───────────────────────── phone ─────────────────────────
  const ph = []
  {
    const B1 = 48
    const B2 = 90
    const L1 = { font: 'serif-400i', size: 31 }
    const when = (() => {
      const s = ist(data.fetchedAt)
      return `${s.day} ${s.mon} · ${s.hh}:${s.mm} IST`
    })()
    // the desktop dateline's caps, at the phone floor (≥ 26 units)
    const WHEN = { font: 'mono-500', size: 27, tracking: 0.04, upper: true }
    const ww = d.measure(when, WHEN)
    const TX = P + 34 // text column, after the registration mark / status dot
    ph.push(registration(d, P + 10, B1 - 10, 8, { width: 1.8 }))
    ph.push(d.text(fit(d, 'Reprinted daily by GitHub Actions', { ...L1, max: R - TX - ww - 24 }), { x: TX - 1, y: B1, ...L1, fill: t.fg2 }))
    ph.push(d.text(when, { x: R, y: B1, ...WHEN, fill: t.muted, anchor: 'end' }))
    if (sites.length) {
      const down = sites.filter((s) => !s.ok)
      const dot = allUp ? liveDot(d, P + 10, B2 - 9, 7) : `<circle cx="${P + 10}" cy="${B2 - 9}" r="7" fill="${t.red}"/>`
      // line 1 already says GitHub Actions: here, name what was checked
      // (or what is down), in the sites' short names
      const segs = [
        { text: `${up}/${sites.length} sites up`, font: 'sans-600', fill: allUp ? t.green : t.fg, after: 14 },
        { text: '·', fill: t.faint, after: 14 },
        down.length ? { text: `${down.map((s) => s.short ?? s.label).join(', ')} down`, fill: t.red } : { text: sites.map((s) => s.short ?? s.label).join(', '), fill: t.muted },
      ]
      const line = runs(d, segs, { x: TX, y: B2, size: 27, font: 'sans-400' })
      if (line.x > R) {
        // too long (several sites down): keep the summary only
        ph.push(dot, runs(d, segs.slice(0, 1), { x: TX, y: B2, size: 27, font: 'sans-400' }).svg)
      } else ph.push(dot, line.svg)
    }
  }
  // The phone layer must carry a load-time animation of its own whatever the
  // status (the live dot only pulses when every site is up): Firefox otherwise
  // treats the image as static and freezes the desktop layer's entrance on
  // its first frame, hiding the status row.
  d.add(`<g class="ph"><g class="fade-in">${ph.join('')}</g></g>`)
  return d.end()
}

export const COLOPHON = { name: 'colophon', width: W, height: H, alt: colophonAlt, render: renderColophon }
