// A real status check of the sites this profile links to, printed in the
// colophon. live.mjs runs it from the GitHub Actions runner on every build:
// one GET per site, redirects followed, 15 s timeout, timed until the whole
// response has arrived (like curl's time_total).
//
// A site that is down is reported, never thrown: a slow or broken site must
// not stop the daily images from being published.

import { LINKS, WORK } from '../content.mjs'

const pixelproof = WORK.find((w) => w.key === 'pixelproof')?.links.find((l) => /^https:\/\/pixelproof\./.test(l.href))

/** The sites, in print order, from content.mjs (the only source of truth). */
export const SITES = [
  { label: 'DualMind Labs', url: LINKS.website.href },
  { label: 'DualMind Arena', url: LINKS.arena.href },
  { label: 'Docs', url: LINKS.docs.href },
  { label: 'PixelProof', url: pixelproof?.href },
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

/**
 * Check one site. Returns { label, host, url, ok, status, ms, error? } —
 * ok means a 2xx/3xx final response within the timeout.
 */
export async function checkSite(site, { timeout = TIMEOUT, fetchImpl = fetch } = {}) {
  const t0 = performance.now()
  try {
    const res = await fetchImpl(site.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeout),
      headers: { 'user-agent': 'profile-assets status check (github.com/harshbhx/harshbhx)', accept: 'text/html,*/*' },
    })
    await res.arrayBuffer() // time the whole response, not just the headers
    const ms = Math.round(performance.now() - t0)
    return { ...site, ok: res.status >= 200 && res.status < 400, status: res.status, ms }
  } catch (e) {
    const ms = Math.round(performance.now() - t0)
    return { ...site, ok: false, status: null, ms, error: reasonOf(e) }
  }
}

/** Check every site one after another (so timings do not compete). Never throws. */
export async function checkSites({ log = () => {}, ...opts } = {}) {
  const out = []
  for (const site of SITES) {
    const r = await checkSite(site, opts)
    log(`  ${r.ok ? 'up  ' : 'DOWN'} ${r.host}  ${r.status ?? r.error}  ${r.ms} ms`)
    out.push(r)
  }
  return { checkedAt: new Date().toISOString(), sites: out }
}
