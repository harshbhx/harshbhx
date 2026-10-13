// Renders the live GitHub activity cards (activity-stats, activity-langs) from
// real data. Runs daily in .github/workflows/profile-assets.yml, which
// publishes the output to the `output` branch the README links to.
//
//   node live.mjs --out <dir> [--user harshbhx] [--exclude repo-a,repo-b]
//       reads GITHUB_TOKEN from the environment, queries the GitHub GraphQL API
//       and writes activity-{stats,langs}-{dark,light}.svg into <dir>.
//       Exits non-zero on any failure so CI keeps the previously published images.
//
//   node live.mjs --out <dir> --mock
//       preview-only: renders the cards from live/mock.mjs, no network.
//
//   node live.mjs --validate-schema <schema.docs.graphql>
//       checks every query live.mjs sends against GitHub's public schema
//       (https://docs.github.com/public/fpt/schema.docs.graphql). Needs the
//       `graphql` dev dependency; nothing else here does.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { THEMES } from './lib/theme.mjs'
import { padForPair } from './lib/svg.mjs'
import { pairSide } from './readme.mjs'
import { CARDS } from './live/cards.mjs'
import { QUERIES, fetchActivity, summarise } from './live/github.mjs'

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
  if (args.mock) {
    console.log('! --mock: rendering PREVIEW-ONLY sample data (see live/mock.mjs), not live stats')
    data = (await import('./live/mock.mjs')).mockData()
  } else {
    const token = process.env.GITHUB_TOKEN
    if (!token) throw new Error('GITHUB_TOKEN is not set (or pass --mock for a preview)')
    const exclude = args.exclude.split(',').map((s) => s.trim()).filter(Boolean)
    data = summarise(await fetchActivity({ login: args.user, token, exclude }))
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
