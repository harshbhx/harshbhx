// Renders the live GitHub activity cards (activity-stats, activity-langs) from
// real data, and the contribution-graph card around Platane/snk's snake. Runs
// daily in .github/workflows/profile-assets.yml, which publishes the output to
// the `output` branch the README links to.
//
//   node live.mjs --out <dir> [--snake <snk-dir>] [--user harshbhx] [--exclude repo-a,repo-b]
//       queries the GitHub GraphQL API and writes activity-{stats,langs}-{dark,light}.svg
//       into <dir>; with --snake, also wraps <snk-dir>/snake-{dark,light}.svg (raw
//       Platane/snk output) into the card and writes <dir>/snake-{dark,light}.svg.
//       Token: STATS_TOKEN (sees private repos) if set, else GITHUB_TOKEN; a
//       rejected STATS_TOKEN falls back to GITHUB_TOKEN with a CI warning.
//       Exits non-zero on any failure so CI keeps the previously published images.
//
//   node live.mjs --out <dir> --mock [--snake <snk-dir>]
//       preview-only: renders the cards from live/mock.mjs, no network. Without
//       --snake the snake card uses a synthetic grid in snk's format.
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
import { pairSide } from './readme.mjs'
import { CARDS } from './live/cards.mjs'
import { W as SNAKE_W, parseSnk, renderSnake, snakeHeight, padBottom, describe } from './live/snake.mjs'
import { QUERIES, AuthError, fetchActivity, summarise } from './live/github.mjs'

const { values: args } = parseArgs({
  options: {
    out: { type: 'string' },
    user: { type: 'string', default: process.env.GITHUB_REPOSITORY_OWNER || 'harshbhx' },
    exclude: { type: 'string', default: '' },
    snake: { type: 'string' },
    mock: { type: 'boolean', default: false },
    'validate-schema': { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

const usage =
  'usage: node live.mjs --out <dir> [--snake <snk-dir>] [--user <login>] [--exclude a,b] [--mock]\n       node live.mjs --validate-schema <schema.graphql>'

const ci = Boolean(process.env.GITHUB_ACTIONS)
const annotate = (level, msg) => console.log(ci ? `::${level}::${msg}` : `! ${msg}`)

/** Live data, trying STATS_TOKEN first and falling back to GITHUB_TOKEN if it is rejected. */
async function liveData() {
  const tokens = [
    ['STATS_TOKEN', process.env.STATS_TOKEN],
    ['GITHUB_TOKEN', process.env.GITHUB_TOKEN],
  ].filter(([, v]) => v)
  if (!tokens.length) throw new Error('neither STATS_TOKEN nor GITHUB_TOKEN is set (or pass --mock for a preview)')
  if (tokens[0][0] !== 'STATS_TOKEN') annotate('notice', 'STATS_TOKEN is not set: the activity cards count public repositories and public contributions only.')
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

async function main() {
  if (args.help) return console.log(usage)
  if (args['validate-schema']) return validateSchema(args['validate-schema'])
  if (!args.out) throw new Error(`--out is required\n${usage}`)

  let data
  let mock
  if (args.mock) {
    console.log('! --mock: rendering PREVIEW-ONLY sample data (see live/mock.mjs), not live stats')
    mock = await import('./live/mock.mjs')
    data = mock.mockData()
  } else {
    data = await liveData()
  }
  console.log(
    `  ${data.total} contributions since ${data.since} · streak ${data.streak.current.days}d (longest ${data.streak.longest.days}d) · ` +
      `${data.languages.length} language entries`,
  )

  // render everything before writing anything, so a failure never leaves a partial set
  const files = []
  for (const card of CARDS) {
    for (const theme of Object.keys(THEMES)) {
      const svg = card.render(THEMES[theme], data)
      const m = svg.match(/^<svg[^>]*width="([\d.]+)" height="([\d.]+)"/)
      if (!m || Number(m[1]) !== card.width || Number(m[2]) !== card.height) throw new Error(`${card.name}: unexpected SVG size`)
      const side = pairSide(card.name)
      files.push([`${card.name}-${theme}.svg`, side ? padForPair(svg, side) : svg])
    }
  }

  // contribution snake: raw Platane/snk output (CI) or the preview mock, wrapped in its card
  const snkSource = args.snake
    ? (theme) => readFileSync(join(resolve(args.snake), `snake-${theme}.svg`), 'utf8')
    : mock
      ? (theme) => mock.mockSnake(data.series, theme)
      : null
  if (snkSource) {
    for (const theme of Object.keys(THEMES)) {
      const snk = parseSnk(snkSource(theme))
      const svg = renderSnake(THEMES[theme], data, snk)
      const m = svg.match(/^<svg[^>]*width="([\d.]+)" height="([\d.]+)"/)
      if (!m || Number(m[1]) !== SNAKE_W || Number(m[2]) !== snakeHeight(snk)) throw new Error('snake: unexpected SVG size')
      console.log(`  snake-${theme}: ${describe(snk)}`)
      // side margins like every full-width block, plus the section's closing space
      files.push([`snake-${theme}.svg`, padBottom(padForFull(svg))])
    }
  } else console.log('! no --snake folder: skipping the contribution-graph card')
  const out = resolve(args.out)
  mkdirSync(out, { recursive: true })
  for (const [name, svg] of files) {
    writeFileSync(join(out, name), svg)
    console.log(`✓ ${name}  ${(svg.length / 1024).toFixed(1)} KB`)
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`)
  process.exit(1)
})
