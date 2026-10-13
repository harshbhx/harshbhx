// A real status check of the sites this profile links to, printed in the
// colophon. live.mjs runs it from the GitHub Actions runner on every build:
// one GET per site, redirects followed, 15 s timeout, timed until the whole
// response has arrived (like curl's time_total). A failed check is tried once
// more after 3 s, so a single DNS hiccup or cold start does not print a site
// as down for a day.
//
// All four sites sit behind Cloudflare, which may challenge a datacenter
// runner that a visitor's browser would pass: a challenge (cf-mitigated
// header) or a rate limit (429) means the site answered, so it counts as up
// and the colophon prints its status code as is ("403 · 210 ms").
//
// A site that is down is reported, never thrown: a slow or broken site must
// not stop the daily images from being published.

import { LINKS, WORK } from '../content.mjs'

const pixelproof = WORK.find((w) => w.key === 'pixelproof')?.links.find((l) => /^https:\/\/pixelproof\./.test(l.href))

/**
 * The sites, in print order, from content.mjs (the only source of truth).
 * `short` is how the colophon's phone line lists them ("DualMind Labs,
 * Arena, Docs, PixelProof").
 */
export const SITES = [
  { label: 'DualMind Labs', short: 'DualMind Labs', url: LINKS.website.href },
  { label: 'DualMind Arena', short: 'Arena', url: LINKS.arena.href },
  { label: 'Docs', short: 'Docs', url: LINKS.docs.href },
  { label: 'PixelProof', short: 'PixelProof', url: pixelproof?.href },
].map((s) => {
  if (!s.url) throw new Error(`uptime: no URL for ${s.label} in content.mjs`)
  return { ...s, host: new URL(s.url).host }
})

export const TIMEOUT = 15_000

// Network failures, in the colophon's words (lower case, a word or two).
const REASONS = [
  [/timeout|abort|UND_ERR_(CONNECT|HEADERS|BODY)_TIMEOUT/i, 'timeout'],
  [/ENOTFOUND|EAI_AGAIN/i, 'dns error'],
  [/ECONNREFUSED/i, 'refused'],
  [/ECONNRESET|UND_ERR_SOCKET|EPIPE/i, 'reset'],
  [/CERT|SSL|TLS|SELF_SIGNED/i, 'tls error'],
  [/redirect/i, 'redirect loop'],
]
const reasonOf = (e) => {
  const text = [e?.name, e?.code, e?.message, e?.cause?.code, e?.cause?.name, e?.cause?.message].filter(Boolean).join(' ')
  return REASONS.find(([re]) => re.test(text))?.[1] ?? 'no response'
}

export const RETRY_AFTER = 3_000

/** The site answered but turned this runner away: a Cloudflare challenge or a rate limit. */
const turnedAway = (res) => res.status === 429 || res.headers.get('cf-mitigated') != null

/** One GET. Returns { ok, status, ms, error?, turnedAway? }. */
async function probe(site, { timeout, fetchImpl }) {
  const t0 = performance.now()
  try {
    const res = await fetchImpl(site.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout),
      headers: { 'user-agent': 'profile-assets status check (github.com/harshbhx/harshbhx)', accept: 'text/html,*/*' },
    })
    await res.arrayBuffer() // time the whole response, not just the headers
    const ms = Math.round(performance.now() - t0)
    if (res.status >= 200 && res.status < 400) return { ok: true, status: res.status, ms }
    if (turnedAway(res)) return { ok: true, status: res.status, ms, turnedAway: true }
    return { ok: false, status: res.status, ms }
  } catch (e) {
    const ms = Math.round(performance.now() - t0)
    return { ok: false, status: null, ms, error: reasonOf(e) }
  }
}

/**
 * Check one site. Returns { label, short, host, url, ok, status, ms, error?,
 * turnedAway?, retried? } — ok means a 2xx/3xx final response (or a
 * challenge / rate limit, see above) within the timeout, on the first try or
 * on one retry `retryAfter` ms later.
 */
export async function checkSite(site, { timeout = TIMEOUT, fetchImpl = fetch, retryAfter = RETRY_AFTER } = {}) {
  let r = await probe(site, { timeout, fetchImpl })
  if (!r.ok) {
    await new Promise((done) => setTimeout(done, retryAfter))
    r = { ...(await probe(site, { timeout, fetchImpl })), retried: true }
  }
  return { ...site, ...r }
}

/** Check every site one after another (so timings do not compete). Never throws. */
export async function checkSites({ log = () => {}, ...opts } = {}) {
  const out = []
  for (const site of SITES) {
    const r = await checkSite(site, opts)
    const note = [r.turnedAway && 'turned away (challenge / rate limit), counted as up', r.retried && 'after a retry'].filter(Boolean).join(', ')
    log(`  ${r.ok ? 'up  ' : 'DOWN'} ${r.host}  ${r.status ?? r.error}  ${r.ms} ms${note ? `  (${note})` : ''}`)
    out.push(r)
  }
  return { checkedAt: new Date().toISOString(), sites: out }
}
