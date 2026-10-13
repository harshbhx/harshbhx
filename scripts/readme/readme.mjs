// README.md template. Images are referenced by absolute raw.githubusercontent
// URLs because GitHub does not rewrite relative paths inside <picture srcset>.

import { PROFILE, LINKS, SECTIONS, ARENA, WORK, PRINCIPLES, JOURNEY, NOW, STACK, CTA, REAL_TEXT } from './content.mjs'
import { LAYOUT } from './lib/theme.mjs'
import { PAIR_GUTTER, FULL_GUTTER } from './lib/svg.mjs'

const REPO = 'harshbhx/harshbhx'
export const ASSET_BASE = `https://raw.githubusercontent.com/${REPO}/main/assets/`
export const OUTPUT_BASE = `https://raw.githubusercontent.com/${REPO}/output/`

// Order of blocks on the page.
//  full       one full-width image
//  pair       two half-width images: side by side on desktop, stacked on phones
//  tabs       the contents bar: small images linking to in-page anchors
//  section    <a name> anchor + that section's header image
//  live-pair  / live-full: images rebuilt daily by GitHub Actions (output branch)
//  text       real Markdown/HTML text (selectable, translatable, searchable)
export const PAGE = [
  ['full', 'masthead'],
  ['tabs', ...SECTIONS.map((s) => `tab-${s.key}`)],
  ['text', 'open-to-work'],
  ['section', 'work'],
  ['pair', 'arena-story', 'arena-figure'],
  ['section', 'projects'],
  ['pair', 'feature-pixelproof', 'feature-modvigil'],
  ['pair', 'feature-builder', 'feature-agent'],
  ['pair', 'feature-mealmind', 'house-rules'],
  ['section', 'journey'],
  ['pair', 'journey', 'now'],
  ['section', 'stack'],
  ['pair', 'stack-a', 'stack-b'],
  ['live-pair', 'numbers', 'languages'],
  ['live-full', 'calendar'],
  ['section', 'contact'],
  ['full', 'letter'],
  ['text', 'contact-links'],
  ['text', 'map'],
  ['live-full', 'colophon'],
]

// Alt text for the images built in CI (static text: the numbers change daily).
export const LIVE_ALT = {
  numbers: 'GitHub, this morning: contributions, commits, pull requests, issues and streaks, refreshed daily',
  languages: 'Languages across my public repositories by code size, refreshed daily',
  calendar: 'My GitHub contribution calendar for the last 12 months, refreshed daily',
  colophon: 'Colophon: reprinted daily by GitHub Actions, with a live status check of dualmindlab.tech, the Arena, the docs and PixelProof',
}

/** Which side of a pair an asset sits on (build.mjs / live.mjs pad every half). */
export function pairSide(name) {
  for (const [kind, a, b] of PAGE) if (kind === 'pair' || kind === 'live-pair') {
    if (name === a) return 'left'
    if (name === b) return 'right'
  }
  return null
}

/** True for full-width blocks (padded like the halves so card edges line up). */
export const isFull = (name) => PAGE.some(([kind, n]) => (kind === 'full' || kind === 'live-full') && n === name) || name.startsWith('section-')

// ── Geometry ────────────────────────────────────────────────────────────────
// github.com draws the profile README in an 846px column on desktop (358px on
// a 390px phone); two images on one line are separated by one ~4.4px space.
// Halves carry an 8-unit transparent margin each side (431 units), full-width
// blocks 16 units (882), so every card edge lines up on desktop and phone.
const COLUMN = 846
const SPACE = 4.4
const HALF_SRC = LAYOUT.half + 2 * PAIR_GUTTER // 431
const FULL_SRC = LAYOUT.full + 2 * FULL_GUTTER // 882
export const FULL_W = COLUMN
const fullInset = (FULL_GUTTER * FULL_W) / FULL_SRC
export const HALF_W = Math.round(((COLUMN - SPACE) / 2 - fullInset) / (1 - PAIR_GUTTER / HALF_SRC)) // 413
if (2 * HALF_W + SPACE > COLUMN) throw new Error(`a pair (${2 * HALF_W}px + space) no longer fits the ${COLUMN}px column`)

/** Width attribute the README gives an asset on desktop (null: its own width). */
export function displayWidth(name) {
  if (pairSide(name)) return HALF_W
  if (isFull(name)) return FULL_W
  return null
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const nb = (s) => s.replace(/-/g, '‑') // non-breaking hyphens for real text

function picture(base, name, alt, width) {
  return [
    '<picture>',
    `<source media="(prefers-color-scheme: dark)" srcset="${base}${name}-dark.svg">`,
    `<source media="(prefers-color-scheme: light)" srcset="${base}${name}-light.svg">`,
    `<img src="${base}${name}-dark.svg" alt="${esc(alt)}"${width ? ` width="${width}"` : ''}>`,
    '</picture>',
  ].join('')
}

const linked = (html, href) => (href ? `<a href="${esc(href)}">${html}</a>` : html)
const a = (label, href) => `<a href="${esc(href)}">${label}</a>`

// Real-text blocks
const TEXT = {
  'open-to-work': () =>
    `<p align="center">\n<b>${REAL_TEXT.line.split(' — ')[0]}</b> — ${nb(REAL_TEXT.line.split(' — ')[1])}<br>\n<sub>${PROFILE.location} · ${PROFILE.timezone} · ${a('Email', LINKS.hire.href)} · ${a('LinkedIn', LINKS.linkedin.href)} · ${a(LINKS.website.value, LINKS.website.href)}</sub>\n</p>`,
  'contact-links': () =>
    `<p align="center">\n${a(`<b>${PROFILE.email}</b>`, LINKS.hire.href)}<br>\n${[a('LinkedIn', LINKS.linkedin.href), a('GitHub', LINKS.github.href), a('Dev.to', LINKS.devto.href), a(LINKS.website.value, LINKS.website.href), `Discord: ${LINKS.discord.value}`].join(' · ')}\n</p>`,
  map: () =>
    [
      '<details>',
      `<summary>Where I am — ${PROFILE.city} on GitHub’s interactive map</summary>`,
      '',
      '```geojson',
      JSON.stringify(
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: PROFILE.coords },
              properties: { title: PROFILE.name, description: `${PROFILE.location} · ${PROFILE.openTo.headline.toLowerCase()}`, 'marker-color': '#C9643C', 'marker-symbol': 'star' },
            },
          ],
        },
        null,
        2,
      ),
      '```',
      '',
      '</details>',
    ].join('\n'),
}

export function readme(registry) {
  const missing = []
  const img = (name, opts = {}) => {
    const e = registry.get(name)
    if (!e) {
      missing.push(name)
      return null
    }
    return linked(picture(ASSET_BASE, e.name, e.alt, opts.width ?? displayWidth(e.name) ?? e.width), opts.href ?? e.href)
  }
  const live = (name) => picture(OUTPUT_BASE, name, LIVE_ALT[name], displayWidth(name))
  const p = (parts) => (parts.filter(Boolean).length ? `<p align="center">\n${parts.filter(Boolean).join('\n')}\n</p>` : null)

  const blocks = []
  for (const [kind, ...names] of PAGE) {
    if (kind === 'full' || kind === 'pair') blocks.push(p(names.map((n) => img(n))))
    else if (kind === 'tabs') blocks.push(p(names.map((n) => img(n, { href: `#user-content-${n.replace(/^tab-/, '')}` }))))
    else if (kind === 'section') blocks.push(`<a name="${names[0]}"></a>\n\n${p([img(`section-${names[0]}`)]) || ''}`)
    else if (kind === 'live-pair' || kind === 'live-full') blocks.push(p(names.map(live)))
    else if (kind === 'text') blocks.push(TEXT[names[0]]())
  }

  const markdown = [
    '<!-- Generated by scripts/readme (npm run build). Edit scripts/readme/content.mjs, not this file. -->',
    '',
    blocks.filter(Boolean).join('\n\n'),
    '',
    plainText(),
    '',
  ].join('\n')
  return { markdown, missing }
}

// A text version of everything in the images, for screen readers, search
// engines, translation and anyone with images turned off.
function plainText() {
  const L = LINKS
  const S = Object.fromEntries(SECTIONS.map((s) => [s.key, s]))
  const links = (w) => (w.links.length ? ` — ${w.links.map((l) => `[${l.label}](${l.href})`).join(' · ')}` : '')
  const lines = [
    '<details>',
    '<summary>Plain-text version</summary>',
    '',
    `**${PROFILE.name}** — ${PROFILE.companyRole}, [${PROFILE.company}](${L.website.href}) · ${PROFILE.location}`,
    '',
    `> ${PROFILE.deck}`,
    '',
    PROFILE.intro,
    '',
    `- **Focus:** ${PROFILE.focus}`,
    `- **${PROFILE.openTo.headline}:** ${PROFILE.openTo.types.join(', ')} · ${PROFILE.openTo.note}`,
    `- **Based in:** ${PROFILE.location} · ${PROFILE.timezone}`,
    '',
    `**No. ${S.work.no} — ${S.work.title}: ${ARENA.name}** (live at [${ARENA.url}](${ARENA.href}))`,
    '',
    `${ARENA.problem} ${ARENA.approach}`,
    '',
    ...ARENA.proof.map((x) => `- **${x.value}** ${x.label} — ${x.detail}`),
    ...ARENA.decisions.map((x) => `- **${x.title}:** ${x.why}`),
    `- **Stack:** ${ARENA.stack.join(', ')}`,
    `- **Request path:** ${ARENA.diagram.join(' → ')}`,
    `- **Next:** ${ARENA.next}`,
    '',
    `**No. ${S.projects.no} — ${S.projects.title}**`,
    '',
    ...WORK.flatMap((w) => [
      `- **${w.name}** — ${w.kind}${w.event ? ` · built for ${w.event}` : ''}${links(w)}`,
      `  - ${w.summary}`,
      ...(w.pipeline ? [`  - ${w.pipeline.map((s) => `${s.step} (${s.tool})`).join(' → ')}`] : []),
      ...(w.rules ? w.rules.map((r) => `  - **${r.rule}:** ${r.detail}`) : []),
      `  - **Stack:** ${w.stack.join(', ')}`,
    ]),
    '',
    '_House rules_',
    '',
    ...PRINCIPLES.map((x, i) => `${i + 1}. **${x.title}.** ${x.why}`),
    '',
    `**No. ${S.journey.no} — ${S.journey.title}** (${S.journey.note})`,
    '',
    ...JOURNEY.map((j) => `- ${j.title} — ${j.detail}`),
    '',
    '_Now_',
    '',
    ...NOW.map((n) => `- **${n.label}:** ${n.text}`),
    '',
    `**No. ${S.stack.no} — ${S.stack.title}**`,
    '',
    ...STACK.map((g) => `- **${g.group}:** ${g.items.map(([, label]) => label).join(', ')}`),
    '',
    `**No. ${S.contact.no} — ${S.contact.title}** ${CTA.kicker} ${CTA.body}`,
    '',
    [`Email: [${L.email.value}](${L.hire.href})`, `[LinkedIn](${L.linkedin.href})`, `[GitHub](${L.github.href})`, `[Dev.to](${L.devto.href})`, `[${L.website.value}](${L.website.href})`, `Discord: ${L.discord.value}`].join(' · '),
    '',
    '</details>',
  ]
  return lines.join('\n')
}
