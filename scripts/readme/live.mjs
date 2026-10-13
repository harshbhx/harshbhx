// Renders the daily, data-driven images of the profile ("live-pair" and
// "live-full" in readme.mjs PAGE) and writes <name>-{dark,light}.svg:
//
//   numbers    GitHub, this morning — box score (live/cards.mjs)        half
//   languages  languages by code size (live/cards.mjs)                  half
//   calendar   contribution calendar, last 12 months (live/calendar.mjs) full
//   colophon   colophon + status check of the linked sites (live/colophon.mjs) full
//
// Runs daily in .github/workflows/profile-assets.yml, which publishes the
// output to the `output` branch the README links to.
//
//   node live.mjs --out <dir> [--user harshbhx] [--exclude repo-a,repo-b]
//       queries the GitHub GraphQL API and checks the sites (live/uptime.mjs).
//       Token: STATS_TOKEN (sees private repos) if set, else GITHUB_TOKEN; a
//       rejected STATS_TOKEN falls back to GITHUB_TOKEN with a CI warning.
//       Exits non-zero when the GitHub API fails, so CI keeps the previously
//       published images. A site that is down is printed in the colophon and
//       never fails the run.
//
//   node live.mjs --out <dir> --mock
//       preview-only: renders from live/mock.mjs (sample data and a sample
//       status check), no network.
//
//   node live.mjs --validate-schema <schema.docs.graphql>
//       checks every query live.mjs sends against GitHub's public schema
//       (https://docs.github.com/public/fpt/schema.docs.graphql). Needs the
//       `graphql` dev dependency; nothing else here does.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { THEMES } from './lib/theme.mjs'
import { padForPair, padForFull } from './lib/svg.mjs'
import { pairSide, isFull, PAGE } from './readme.mjs'
import { CARDS } from './live/cards.mjs'
import { CALENDAR } from './live/calendar.mjs'
import { COLOPHON } from './live/colophon.mjs'
import { SITES, checkSites } from './live/uptime.mjs'
import { QUERIES, AuthError, fetchActivity, summarise } from './live/github.mjs'

const IMAGES = [...CARDS, CALENDAR, COLOPHON]

const { values: args } = parseArgs({
  options: {
    out: { type: 'string' },
    user: { type: 'string', default: process.env.GITHUB_REPOSITORY_OWNER || 'harshbhx' },
    exclude: { type: 'string', default: '' },
    mock: { type: 'boolean', default: false },
    'validate-schema': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

const usage = 'usage: node live.mjs --out <dir> [--user <login>] [--exclude a,b] [--mock]\n       node live.mjs --validate-schema <schema.graphql>'

const ci = Boolean(process.env.GITHUB_ACTIONS)
const annotate = (level, msg) => console.log(ci ? `::${level}::${msg}` : `! ${msg}`)

/** Live data, trying STATS_TOKEN first and falling back to GITHUB_TOKEN if it is rejected. */
async function liveData() {
  const tokens = [
    ['STATS_TOKEN', process.env.STATS_TOKEN],
    ['GITHUB_TOKEN', process.env.GITHUB_TOKEN],
  ].filter(([, v]) => v)
  if (!tokens.length) throw new Error('neither STATS_TOKEN nor GITHUB_TOKEN is set (or pass --mock for a preview)')
  if (tokens[0][0] !== 'STATS_TOKEN') annotate('notice', 'STATS_TOKEN is not set: the numbers and languages count public repositories and public contributions only.')
  const exclude = args.exclude.split(',').map((s) => s.trim()).filter(Boolean)
  for (const [i, [name, token]] of tokens.entries()) {
    try {
      console.log(`· using ${name}`)
      return summarise(await fetchActivity({ login: args.user, token, exclude }))
    } catch (e) {
      const next = tokens[i + 1]
      if (!(e instanceof AuthError) || !next) throw e
      annotate('warning', `${name} was rejected (${e.message.slice(0, 120)}). Falling back to ${next[0]}; renew the ${name} secret.`)
    }
  }
}

async function validateSchema(file) {
  let gql
  try {
    gql = await import('graphql')
  } catch {
    throw new Error('the "graphql" package is not installed (it is a dev dependency: run npm ci without --omit=dev)')
  }
  const schema = gql.buildSchema(readFileSync(file, 'utf8'))
  let bad = 0
  for (const [name, text] of Object.entries(QUERIES)) {
    const errors = gql.validate(schema, gql.parse(text))
    if (errors.length) {
      bad++
      console.error(`✗ ${name}\n${errors.map((e) => `    ${e.message}`).join('\n')}`)
    } else console.log(`✓ ${name} is valid against ${file}`)
  }
  if (bad) throw new Error(`${bad} invalid quer${bad === 1 ? 'y' : 'ies'}`)
}

/** Every live image must have a slot on the page, and every slot an image. */
function checkPage() {
  const names = new Set(IMAGES.map((c) => c.name))
  const slots = PAGE.filter(([kind]) => kind === 'live-pair' || kind === 'live-full').flatMap(([, ...n]) => n)
  const missing = slots.filter((n) => !names.has(n))
  const unused = [...names].filter((n) => !slots.includes(n))
  if (missing.length || unused.length) throw new Error(`live images and readme.mjs PAGE disagree (no renderer: ${missing.join(', ') || '—'}; not on the page: ${unused.join(', ') || '—'})`)
}

async function main() {
  if (args.help) return console.log(usage)
  if (args['validate-schema']) return validateSchema(args['validate-schema'])
  if (!args.out) throw new Error(`--out is required\n${usage}`)
  checkPage()

  let data
  if (args.mock) {
    console.log('! --mock: rendering PREVIEW-ONLY sample data (see live/mock.mjs), not live stats')
    const mock = await import('./live/mock.mjs')
    data = mock.mockData()
    data.uptime = mock.mockUptime(SITES)
  } else {
    data = await liveData()
    console.log('· status check of the linked sites')
    data.uptime = await checkSites({ log: console.log })
    const down = data.uptime.sites.filter((s) => !s.ok)
    if (down.length) annotate('warning', `site check: ${down.map((s) => `${s.host} (${s.status ? `HTTP ${s.status}` : s.error})`).join(', ')} down — shown in the colophon`)
    const away = data.uptime.sites.filter((s) => s.turnedAway)
    if (away.length) annotate('notice', `site check: ${away.map((s) => `${s.host} (HTTP ${s.status})`).join(', ')} answered with a challenge or rate limit — counted as up, status code printed in the colophon`)
  }
  console.log(
    `  ${data.total} contributions since ${data.since} · streak ${data.streak.current.days}d (longest ${data.streak.longest.days}d) · ` +
      `${data.languages.length} language entries · ${data.uptime.sites.filter((s) => s.ok).length}/${data.uptime.sites.length} sites up`,
  )

  // render everything before writing anything, so a failure never leaves a partial set
  const files = []
  for (const image of IMAGES) {
    for (const theme of Object.keys(THEMES)) {
      const svg = image.render(THEMES[theme], data)
      if (!svg.startsWith('<svg') || !svg.includes('<title')) throw new Error(`${image.name}: render() must return a full SVG document`)
      const m = svg.match(/^<svg[^>]*width="([\d.]+)" height="([\d.]+)"/)
      if (!m || Number(m[1]) !== image.width || Number(m[2]) !== image.height) throw new Error(`${image.name}: unexpected SVG size ${m && `${m[1]}×${m[2]}`}`)
      // transparent side margins exactly as build.mjs adds them (see readme.mjs)
      const side = pairSide(image.name)
      const out = side ? padForPair(svg, side) : isFull(image.name) ? padForFull(svg) : svg
      files.push([`${image.name}-${theme}.svg`, out])
    }
  }

  const out = resolve(args.out)
  mkdirSync(out, { recursive: true })
  for (const [name, svg] of files) {
    writeFileSync(join(out, name), svg)
    console.log(`✓ ${name}  ${(svg.length / 1024).toFixed(1)} KB`)
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`)
  if (process.env.RUNNER_DEBUG === '1') console.error(e.stack) // re-run the job with debug logging for the trace
  process.exit(1)
})
