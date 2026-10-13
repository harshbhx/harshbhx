// Shared pieces of the daily images (live/cards.mjs, calendar.mjs,
// colophon.mjs): the publication grid, the kicker row and footer every card
// in the issue uses, date/number formatting in IST, and text guards for
// strings that come from the API (language names) or vary day to day.
//
// Layout must never throw on plausible live data — CI would then keep
// yesterday's images. Anything that depends on the numbers degrades
// (smaller size, shorter wording) instead of asserting.

import { r1 } from '../lib/svg.mjs'
import { hairline, runs } from '../lib/editorial.mjs'

export const P = 28 // card padding (DESIGN.md)
export const KICK_Y = 40 // kicker baseline (same as stack-*, journey, now)
export const KICK_RULE = 54 // hairline under the kicker row
export const KICK = { font: 'mono-500', size: 11, tracking: 0.14, upper: true }

// ── numbers & dates ─────────────────────────────────────────────────────────

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = MON

export const int = (n) => Math.round(n).toLocaleString('en-US')
export const plural = (n, one, many = `${one}s`) => `${int(n)} ${n === 1 ? one : many}`
const ymd = (day) => day.slice(0, 10).split('-').map(Number)
export const yearOf = (day) => ymd(day)[0]

/** "Oct 11" / "Oct 11, 2025" for a yyyy-mm-dd day. */
export function fmtDay(day, withYear = true) {
  const [y, m, d] = ymd(day)
  return `${MON[m - 1]} ${d}${withYear ? `, ${y}` : ''}`
}
/** "Dec 2023" */
export const monthYear = (day) => {
  const [y, m] = ymd(day)
  return `${MON[m - 1]} ${y}`
}

/** "Oct 11 – Oct 12" inside `refYear`, otherwise compact with years ("Dec 28 ’24 – Jan 5 ’25"). */
export function fmtRange(a, b, refYear) {
  if (!a) return ''
  const [ya] = ymd(a)
  const [yb] = ymd(b)
  if (a === b) return fmtDay(a, ya !== refYear)
  if (ya === yb) {
    // same month: "Oct 11 – 12", as a newspaper sets it
    const tail = a.slice(5, 7) === b.slice(5, 7) ? String(ymd(b)[2]) : fmtDay(b, false)
    return ya === refYear ? `${fmtDay(a, false)} – ${tail}` : `${fmtDay(a, false)} – ${tail}, ${yb}`
  }
  const short = (d) => `${fmtDay(d, false)} ’${String(ymd(d)[0]).slice(2)}`
  return `${short(a)} – ${short(b)}`
}

export function fmtShare(share, digits = 1) {
  const p = share * 100
  if (p > 0 && p < 0.05) return '<0.1%'
  if (p >= 99.95) return '100%'
  return `${p.toFixed(digits)}%`
}

/** The moment of this run in India Standard Time (UTC+5:30), as parts. */
export function ist(iso) {
  const t = new Date(Date.parse(iso) + 330 * 60_000)
  return {
    weekday: WEEKDAY[t.getUTCDay()],
    day: t.getUTCDate(),
    mon: MON[t.getUTCMonth()],
    year: t.getUTCFullYear(),
    hh: String(t.getUTCHours()).padStart(2, '0'),
    mm: String(t.getUTCMinutes()).padStart(2, '0'),
    hour: t.getUTCHours(),
  }
}
/** "Tue 13 Oct 2026, 08:47 IST" */
export const istStamp = (iso) => {
  const t = ist(iso)
  return `${t.weekday} ${t.day} ${t.mon} ${t.year}, ${t.hh}:${t.mm} IST`
}
/** "this morning" / "this afternoon" / "this evening", by the IST hour of the run. */
export const partOfDay = (iso) => {
  const h = ist(iso).hour
  return h < 12 ? 'this morning' : h < 17 ? 'this afternoon' : 'this evening'
}

// ── text guards ─────────────────────────────────────────────────────────────

/** Strip characters the fonts cannot draw (names come from the API). */
export function safe(d, str, font) {
  try {
    d.measure(str, { font, size: 10 })
    return str
  } catch {
    const ascii = String(str).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '')
    return ascii || '?'
  }
}

/** Truncate with an ellipsis to fit `max`. */
export function fit(d, str, { font, size, max, tracking = 0 }) {
  let s = safe(d, str, font)
  if (d.measure(s, { font, size, tracking }) <= max) return s
  while (s.length > 1 && d.measure(`${s}…`, { font, size, tracking }) > max) s = s.slice(0, -1).trimEnd()
  return `${s}…`
}

/** Largest size ≤ `size` (down to `min`) at which `str` fits `max`. */
export function sizeToFit(d, str, { font, size, max, min = size * 0.6, tracking = 0 }) {
  let s = size
  while (s > min && d.measure(str, { font, size: s, tracking }) > max) s -= 1
  return s
}

// ── chrome ──────────────────────────────────────────────────────────────────

/**
 * Kicker row as on every card in the issue: terra label + muted continuation
 * on the left, muted meta on the right, hairline underneath.
 */
export function kickerRow(d, { label, rest = '', right = '', x0 = P, x1 = d.w - P }) {
  const t = d.t
  const a = runs(d, [{ text: label, fill: t.terra, after: rest ? 8 : 0 }, ...(rest ? [{ text: rest, fill: t.muted }] : [])], { x: x0, y: KICK_Y, ...KICK })
  let rw = 0
  let r = ''
  if (right) {
    const s = fit(d, right, { ...KICK, max: Math.max(40, x1 - a.x - 20) })
    rw = d.measure(s, KICK)
    r = d.text(s, { x: x1, y: KICK_Y, ...KICK, fill: t.muted, anchor: 'end' })
  }
  return { svg: a.svg + r + hairline(d, x0, x1, KICK_RULE), end: a.x, rightW: rw }
}

/** Footer: hairline at H − 50, mono caps left and a serif-italic note right at H − 26. */
export function footer(d, { left, note }) {
  const t = d.t
  const y = d.h - 26
  const nw = note ? d.measure(note, { font: 'serif-400i', size: 16 }) : 0
  const l = left ? fit(d, left, { ...KICK, max: d.w - 2 * P - nw - 20 }) : ''
  return (
    hairline(d, P, d.w - P, d.h - 50) +
    (l ? d.text(l, { x: P, y: y - 1, ...KICK, fill: t.muted }) : '') +
    (note ? d.text(note, { x: d.w - P, y, font: 'serif-400i', size: 16, fill: t.muted, anchor: 'end' }) : '')
  )
}

/** Dotted leader between two x positions on a baseline (as in the toolbox index). */
export function leaders(d, a, b, base) {
  const x1 = Math.ceil(a)
  const x2 = Math.floor(b)
  if (x2 - x1 < 10) return ''
  return `<path d="M${x1} ${r1(base - 0.5)}H${x2}" stroke="${d.t.faint}" stroke-width="1.15" stroke-linecap="round" stroke-dasharray="0 4"/>`
}

/** Wrap in a staggered entrance. */
export const fade = (svg, delay, cls = 'fade-up') => `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${svg}</g>`
