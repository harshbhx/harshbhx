// GitHub GraphQL client and the numbers the daily images show.
//
// Everything here is plain data: fetchActivity() talks to the API and
// summarise() turns raw contribution days + repository languages into the
// shape live/cards.mjs and live/calendar.mjs render. The mock data
// (live/mock.mjs) goes through the same summarise() so previews exercise the
// real streak / language maths.

export const ENDPOINT = 'https://api.github.com/graphql'

// Every query live.mjs sends. `node live.mjs --validate-schema <schema.graphql>`
// checks each of these against GitHub's published schema.
export const QUERIES = {
  // Account age plus the last-12-months contribution collection. The
  // repositories contributed to are counted inside the same window and
  // include my own (user.repositoriesContributedTo would do neither): the
  // union of the repositories behind the commits, pull requests, issues and
  // reviews, never less than any of GitHub's per-kind totals.
  profile: /* GraphQL */ `
    query Profile($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        login
        createdAt
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          restrictedContributionsCount
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
          totalRepositoriesWithContributedCommits
          totalRepositoriesWithContributedPullRequests
          totalRepositoriesWithContributedIssues
          totalRepositoriesWithContributedPullRequestReviews
          commitContributionsByRepository { repository { nameWithOwner } }
          pullRequestContributionsByRepository { repository { nameWithOwner } }
          issueContributionsByRepository { repository { nameWithOwner } }
          pullRequestReviewContributionsByRepository { repository { nameWithOwner } }
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`,

  // One contribution calendar; GitHub caps a collection at one year, so the
  // all-time history is fetched one window at a time.
  calendar: /* GraphQL */ `
    query Calendar($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`,

  // Owned, non-fork repositories with their languages by size (paginated).
  languages: /* GraphQL */ `
    query Languages($login: String!, $cursor: String) {
      user(login: $login) {
        repositories(first: 100, after: $cursor, ownerAffiliations: [OWNER], isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            name
            isPrivate
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name color } }
            }
          }
        }
      }
    }`,
}

// ── transport ────────────────────────────────────────────────────────────────

class FatalError extends Error {}
/** The token was rejected (HTTP 401): live.mjs falls back to the next token. */
export class AuthError extends FatalError {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** One-line excerpt of a response body (keeps CI annotations on one line). */
const snippet = (body, n = 200) => body.replace(/\s+/g, ' ').trim().slice(0, n)

// GitHub answers some failures with HTTP 200 and a GraphQL `errors` array but
// no data: "Something went wrong while executing your query. This may be the
// result of a timeout…" (common for contributionsCollection) and RATE_LIMITED.
// Those are worth another attempt; anything else (bad query, unknown user) is not.
const TRANSIENT = /timeout|timed out|something went wrong|try again|temporarily|unavailable/i
const transientErrors = (errors) => errors.every((e) => e.type === 'RATE_LIMITED' || TRANSIENT.test(e.message ?? ''))

const MAX_WAIT = 5 * 60_000 // the job has 15 minutes; a longer rate-limit wait fails instead

/**
 * How long a rate-limited response asks us to wait (ms), or null when it is not
 * a rate limit. Follows GitHub's guidance: `retry-after`, else
 * `x-ratelimit-reset` when `x-ratelimit-remaining` is 0, else one minute for a
 * secondary rate limit.
 */
function rateLimitWait(res, body, now = Date.now()) {
  const after = Number(res.headers.get('retry-after'))
  if (after > 0) return after * 1000
  if (res.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(res.headers.get('x-ratelimit-reset'))
    if (reset > 0) return Math.max(1000, reset * 1000 - now + 1000)
  }
  if (/secondary rate limit|rate limit exceeded|RATE_LIMITED/i.test(body)) return 60_000
  return null
}

class Retry extends Error {
  constructor(message, wait = 0) {
    super(message)
    this.wait = wait
  }
}

/**
 * POST one GraphQL request. Network errors, timeouts, 5xx, rate limits and
 * transient GraphQL errors are retried (4 attempts, exponential backoff, or
 * the wait a rate limit asks for); a rejected token throws AuthError and any
 * other error throws at once.
 */
export async function graphql(query, variables, { token, tries = 4, log = () => {}, endpoint = ENDPOINT, backoff = 2000 } = {}) {
  if (!token) throw new FatalError('GITHUB_TOKEN is not set')
  let last
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: `bearer ${token}`,
          'content-type': 'application/json',
          'user-agent': 'profile-assets (scripts/readme/live.mjs)',
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(30_000),
      })
      const body = await res.text()
      if (res.status === 401) throw new AuthError(`HTTP 401 (token rejected): ${snippet(body, 200)}`)
      if (res.status === 403 || res.status === 429) {
        const wait = rateLimitWait(res, body)
        if (wait === null && res.status === 403) throw new FatalError(`HTTP 403: ${snippet(body, 300)}`)
        if (wait > MAX_WAIT) throw new FatalError(`rate limited for ${Math.round(wait / 60_000)} min: ${snippet(body, 200)}`)
        throw new Retry(`HTTP ${res.status} rate limited`, wait ?? 0)
      }
      if (res.status >= 500) throw new Retry(`HTTP ${res.status}: ${snippet(body, 200)}`)
      if (!res.ok) throw new FatalError(`HTTP ${res.status}: ${snippet(body, 300)}`)
      let json
      try {
        json = JSON.parse(body)
      } catch {
        throw new Retry(`invalid JSON response: ${snippet(body, 200)}`)
      }
      if (json.errors?.length) {
        const msg = `GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`
        if (!transientErrors(json.errors)) throw new FatalError(msg)
        const limited = json.errors.some((e) => e.type === 'RATE_LIMITED')
        const wait = limited ? (rateLimitWait(res, 'RATE_LIMITED') ?? 60_000) : 0
        if (wait > MAX_WAIT) throw new FatalError(`${msg} (rate limited for ${Math.round(wait / 60_000)} min)`)
        throw new Retry(msg, wait)
      }
      if (!json.data) throw new Retry('response has no data')
      return json.data
    } catch (e) {
      if (e instanceof FatalError) throw e
      last = e
      if (attempt < tries) {
        const wait = Math.max(backoff * 2 ** (attempt - 1), e.wait ?? 0)
        log(`  request failed (${e.message}); retrying in ${Math.round(wait / 1000)}s`)
        await sleep(wait)
      }
    }
  }
  throw new Error(`GitHub API failed after ${tries} attempts: ${last?.message}`)
}

// ── dates (all UTC, ISO yyyy-mm-dd strings for days) ─────────────────────────

const DAY = 86_400_000
export const isoDay = (date) => new Date(date).toISOString().slice(0, 10)
export const addDays = (day, n) => isoDay(Date.parse(`${day}T00:00:00Z`) + n * DAY)

/** Contiguous ≤ 1-year windows from `start` to `end` that never overlap. */
export function yearWindows(start, end) {
  const out = []
  let from = new Date(`${isoDay(start)}T00:00:00Z`)
  const stop = new Date(end)
  while (from < stop) {
    const next = new Date(from)
    next.setUTCFullYear(next.getUTCFullYear() + 1)
    const to = new Date(Math.min(next.getTime() - 1000, stop.getTime()))
    out.push({ from: from.toISOString(), to: to.toISOString() })
    from = next
  }
  return out
}

const calendarDays = (cal) => cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }))

// ── fetch ────────────────────────────────────────────────────────────────────

/**
 * Distinct repositories with a commit, pull request, issue or review in the
 * collection's window (my own included). Each by-repository list holds at
 * most 25 repositories (the schema default, kept so the query never trips a
 * limit), so the count never drops below GitHub's own per-kind totals.
 */
export function reposContributedTo(cc) {
  const lists = [cc.commitContributionsByRepository, cc.pullRequestContributionsByRepository, cc.issueContributionsByRepository, cc.pullRequestReviewContributionsByRepository]
  const names = new Set(lists.flatMap((l) => l ?? []).map((x) => x.repository?.nameWithOwner).filter(Boolean))
  const totals = [cc.totalRepositoriesWithContributedCommits, cc.totalRepositoriesWithContributedPullRequests, cc.totalRepositoriesWithContributedIssues, cc.totalRepositoriesWithContributedPullRequestReviews]
  return Math.max(names.size, ...totals.map((n) => n ?? 0))
}

/** Everything the cards need, straight from the API. */
export async function fetchActivity({ login, token, now = new Date(), exclude = [], log = console.log }) {
  const opts = { token, log }
  const to = new Date(now)
  const from = new Date(to)
  from.setUTCFullYear(from.getUTCFullYear() - 1)
  from.setUTCMinutes(from.getUTCMinutes() + 1) // stay strictly inside GitHub's one-year limit

  log(`· profile + last 12 months for ${login}`)
  const { user } = await graphql(QUERIES.profile, { login, from: from.toISOString(), to: to.toISOString() }, opts)
  if (!user) throw new Error(`GitHub user "${login}" not found`)
  const cc = user.contributionsCollection

  const windows = yearWindows(user.createdAt, to)
  log(`· ${windows.length} yearly calendar(s) since ${isoDay(user.createdAt)}`)
  const days = []
  for (const w of windows) {
    const r = await graphql(QUERIES.calendar, { login, ...w }, opts)
    days.push(...calendarDays(r.user.contributionsCollection.contributionCalendar))
  }

  log('· repositories and languages')
  const repos = []
  let cursor = null
  do {
    const r = await graphql(QUERIES.languages, { login, cursor }, opts)
    const page = r.user.repositories
    repos.push(...page.nodes)
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null
  } while (cursor)

  return {
    login: user.login,
    fetchedAt: to.toISOString(),
    createdAt: user.createdAt,
    lastYear: {
      contributions: cc.contributionCalendar.totalContributions,
      commits: cc.totalCommitContributions,
      pullRequests: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      restricted: cc.restrictedContributionsCount,
      reposContributedTo: reposContributedTo(cc),
    },
    days,
    repos: repos.filter((r) => !exclude.includes(r.name)),
  }
}

// ── summarise ────────────────────────────────────────────────────────────────

/**
 * Merge raw calendar days into one continuous series from `since` to the last
 * reported day. Overlapping windows may repeat a date; the larger count wins.
 */
export function mergeDays(days, since) {
  const byDate = new Map()
  for (const { date, count } of days) byDate.set(date, Math.max(byDate.get(date) ?? 0, count))
  const start = isoDay(since)
  const end = [...byDate.keys()].sort().pop() ?? start
  const out = []
  for (let day = start; day <= end; day = addDays(day, 1)) out.push({ date: day, count: byDate.get(day) ?? 0 })
  return out
}

/**
 * Current and longest streaks. The last day in `series` is "today": it extends
 * the current streak when it has contributions, but an empty today does not
 * break it (the streak may end yesterday). Ties for longest keep the most recent.
 */
export function streaks(series) {
  let longest = { days: 0, start: null, end: null }
  let run = 0
  let start = null
  for (const { date, count } of series) {
    if (count > 0) {
      if (run === 0) start = date
      run++
      if (run >= longest.days) longest = { days: run, start, end: date }
    } else run = 0
  }
  let i = series.length - 1
  if (i >= 0 && series[i].count === 0) i--
  let current = { days: 0, start: null, end: null }
  if (i >= 0 && series[i].count > 0) {
    const end = series[i].date
    let n = 0
    while (i >= 0 && series[i].count > 0) {
      n++
      i--
    }
    current = { days: n, start: series[i + 1].date, end }
  }
  return { current, longest }
}

/** Language shares by bytes across repositories: top `top`, the rest grouped as "Other". */
export function languageShares(repos, { top = 6 } = {}) {
  const totals = new Map()
  for (const repo of repos) {
    for (const { size, node } of repo.languages?.edges ?? []) {
      const cur = totals.get(node.name) ?? { name: node.name, color: node.color, bytes: 0 }
      cur.bytes += size
      totals.set(node.name, cur)
    }
  }
  const all = [...totals.values()].sort((a, b) => b.bytes - a.bytes)
  const sum = all.reduce((a, l) => a + l.bytes, 0)
  if (!sum) return []
  const head = all.slice(0, top).map((l) => ({ ...l, share: l.bytes / sum }))
  const rest = all.slice(top)
  if (rest.length) {
    const bytes = rest.reduce((a, l) => a + l.bytes, 0)
    head.push({ name: 'Other', color: null, bytes, share: bytes / sum, other: true, count: rest.length })
  }
  return head
}

/** The data model live/cards.mjs renders. */
export function summarise(raw) {
  const series = mergeDays(raw.days, raw.createdAt)
  const total = series.reduce((a, d) => a + d.count, 0)
  return {
    login: raw.login,
    fetchedAt: raw.fetchedAt,
    since: isoDay(raw.createdAt),
    today: series.length ? series[series.length - 1].date : isoDay(raw.fetchedAt),
    total,
    lastYear: raw.lastYear,
    streak: streaks(series),
    series,
    languages: raw.languages ?? languageShares(raw.repos ?? []),
    repoCount: raw.repos ? raw.repos.filter((r) => r.languages?.edges?.length).length : null,
    // true when no private repository was counted (e.g. CI without a STATS_TOKEN)
    publicOnly: raw.repos ? !raw.repos.some((r) => r.isPrivate) : null,
  }
}
