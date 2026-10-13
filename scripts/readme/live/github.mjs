// GitHub GraphQL client and the numbers the activity cards show.
//
// Everything here is plain data: fetchActivity() talks to the API and
// summarise() turns raw contribution days + repository languages into the
// shape live/cards.mjs renders. The mock data (live/mock.mjs) goes through the
// same summarise() so previews exercise the real streak / language maths.

export const ENDPOINT = 'https://api.github.com/graphql'

// Every query live.mjs sends. `node live.mjs --validate-schema <schema.graphql>`
// checks each of these against GitHub's published schema.
export const QUERIES = {
  // Account age plus the last-12-months contribution collection.
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
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
        repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) {
          totalCount
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * POST one GraphQL request. Network errors, timeouts, 5xx and 429 are retried
 * (3 attempts, exponential backoff); auth errors and GraphQL `errors` throw at once.
 */
export async function graphql(query, variables, { token, tries = 3, log = () => {} } = {}) {
  if (!token) throw new FatalError('GITHUB_TOKEN is not set')
  let last
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
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
      if (res.status >= 500 || res.status === 429) throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      if (!res.ok) throw new FatalError(`HTTP ${res.status}: ${body.slice(0, 300)}`)
      let json
      try {
        json = JSON.parse(body)
      } catch {
        throw new Error(`invalid JSON response: ${body.slice(0, 200)}`)
      }
      if (json.errors?.length) throw new FatalError(`GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`)
      if (!json.data) throw new Error('response has no data')
      return json.data
    } catch (e) {
      if (e instanceof FatalError) throw e
      last = e
      if (attempt < tries) {
        const wait = 1500 * 2 ** (attempt - 1)
        log(`  request failed (${e.message}); retrying in ${wait / 1000}s`)
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
      reposContributedTo: user.repositoriesContributedTo.totalCount,
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
  }
}
