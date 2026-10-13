// README.md template. Images are referenced by absolute raw.githubusercontent
// URLs because GitHub does not rewrite relative paths inside <picture srcset>.

import { PROFILE, LINKS, SECTIONS, PROOF, PROJECTS, DECISIONS, PRINCIPLES, STACK, SERVICES, WORKING_STYLE, CTA } from './content.mjs'
import { LAYOUT } from './lib/theme.mjs'
import { PAIR_GUTTER, FULL_GUTTER } from './lib/svg.mjs'

const REPO = 'harshbhx/harshbhx'
export const ASSET_BASE = `https://raw.githubusercontent.com/${REPO}/main/assets/`
export const OUTPUT_BASE = `https://raw.githubusercontent.com/${REPO}/output/`

// Order of blocks on the page. 'pair' = two half-width images that sit side
// by side on desktop and stack on phones. 'live' = images rebuilt daily by
// .github/workflows/profile-assets.yml on the `output` branch.
export const PAGE = [
  ['full', 'hero'],
  ['pair', 'about-terminal', 'about-now'],
  ['full', 'section-proof'],
  ['pair', 'proof-a', 'proof-b'],
  ['full', 'section-projects'],
  ['pair', 'project-dualmind', 'arch-dualmind'],
  ['pair', 'project-mealmind', 'arch-mealmind'],
  ['pair', 'project-agent', 'arch-agent'],
  ['full', 'section-build'],
  ['pair', 'decisions', 'principles'],
  ['full', 'section-stack'],
  ['pair', 'stack-build', 'stack-run'],
  ['full', 'section-services'],
  ['pair', 'services-a', 'services-b'],
  ['full', 'section-activity'],
  ['live'],
  ['full', 'cta'],
  ['row', 'btn-email', 'btn-linkedin', 'btn-github', 'btn-devto', 'btn-website', 'btn-discord'],
  ['full', 'footer'],
]

// Which side of a pair each asset sits on (build.mjs / live.mjs pad every half).
export function pairSide(name) {
  for (const [kind, a, b] of PAGE) if (kind === 'pair') {
    if (name === a) return 'left'
    if (name === b) return 'right'
  }
  if (name === 'activity-stats') return 'left'
  if (name === 'activity-langs') return 'right'
  return null
}

/** True for the full-width blocks (build.mjs pads them like the halves). */
export const isFull = (name) => PAGE.some(([kind, n]) => kind === 'full' && n === name)

export const LIVE = [
  { name: 'activity-stats', alt: 'GitHub stats: contributions, commits, pull requests, issues and streaks' },
  { name: 'activity-langs', alt: 'Most used languages across my repositories' },
  { name: 'snake', alt: 'Contribution graph being eaten by a snake', full: true },
]

// ── Geometry ────────────────────────────────────────────────────────────────
// github.com draws the profile README in an 846px column on desktop (358px on
// a 390px phone); two images on one line are separated by one ~4.4px space.
// Every image carries a transparent side margin (lib/svg.mjs): halves 8 of
// 431 units, full-width blocks 16 of 882 — the same share of their width.
//  - phone: every image is drawn at the column width, so all card edges meet;
//  - desktop: full-width blocks fill the column, and the halves get the README
//    width that puts a pair's outer card edges on the full-width card edges
//    (the gap between the two cards is then 2 × 8 units + the space ≈ 20px).
// The contribution snake (Platane/snk, 880 wide with ~16-unit margins) gets
// the full width too, so its grid lines up with the cards as well.
const COLUMN = 846
const SPACE = 4.4
const HALF_SRC = LAYOUT.half + 2 * PAIR_GUTTER // 431
const FULL_SRC = LAYOUT.full + 2 * FULL_GUTTER // 882
export const FULL_W = COLUMN
const fullInset = (FULL_GUTTER * FULL_W) / FULL_SRC // card edge, px from the column edge
export const HALF_W = Math.round(((COLUMN - SPACE) / 2 - fullInset) / (1 - PAIR_GUTTER / HALF_SRC)) // 413
if (2 * HALF_W + SPACE > COLUMN) throw new Error(`a pair (${2 * HALF_W}px + space) no longer fits the ${COLUMN}px column`)

/** Width attribute the README gives an asset on desktop (null: its own width). */
export function displayWidth(name) {
  if (pairSide(name)) return HALF_W
  if (isFull(name) || name === 'snake') return FULL_W
  return null
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function picture(base, name, alt, width) {
  return [
    '<picture>',
    `<source media="(prefers-color-scheme: dark)" srcset="${base}${name}-dark.svg">`,
    `<source media="(prefers-color-scheme: light)" srcset="${base}${name}-light.svg">`,
    `<img src="${base}${name}-dark.svg" alt="${esc(alt)}" width="${width}">`,
    '</picture>',
  ].join('')
}

function linked(html, href) {
  return href ? `<a href="${esc(href)}">${html}</a>` : html
}

export function readme(registry) {
  const missing = []
  const img = (name) => {
    const e = registry.get(name)
    if (!e) {
      missing.push(name)
      return null
    }
    return linked(picture(ASSET_BASE, e.name, e.alt, displayWidth(e.name) ?? e.width), e.href)
  }
  const blocks = []
  for (const [kind, ...names] of PAGE) {
    if (kind === 'live') {
      const [stats, langs, snake] = LIVE.map((l) => picture(OUTPUT_BASE, l.name, l.alt, displayWidth(l.name)))
      blocks.push(`<p align="center">\n${stats}\n${langs}\n</p>`, `<p align="center">\n${snake}\n</p>`)
      continue
    }
    const parts = names.map(img).filter(Boolean)
    if (parts.length) blocks.push(`<p align="center">\n${parts.join('\n')}\n</p>`)
  }

  const markdown = [
    '<!-- Generated by scripts/readme (npm run build). Edit scripts/readme/content.mjs, not this file. -->',
    '',
    blocks.join('\n\n'),
    '',
    plainText(registry),
    '',
  ].join('\n')
  return { markdown, missing }
}

// A text version of everything in the images, for screen readers, search
// engines and anyone with images turned off.
function plainText(registry) {
  const L = LINKS
  // a detail that is one of the links (e.g. "docs.dualmindlab.tech") becomes that link
  const link = (text) => {
    const l = Object.values(L).find((x) => x.value === text && x.href)
    return l ? `[${text}](${l.href})` : text
  }
  const status = (p) => (p.status === 'live' ? `live at [${p.url}](${p.href})` : 'built')
  // the architecture diagram's alt text, minus its "<name> architecture — <title>." lead-in
  const arch = (p) => registry.get(`arch-${p.key}`)?.alt?.replace(/^.*? architecture — [^.]*\.\s*/, '')
  const contact = ['email', 'linkedin', 'github', 'devto', 'website', 'discord'].map((k) => L[k])
  const lines = [
    '<details>',
    '<summary>Plain-text version</summary>',
    '',
    `**${PROFILE.name}** — ${PROFILE.role} · ${PROFILE.companyRole} @ [${PROFILE.company}](${L.website.href})`,
    '',
    `> ${PROFILE.tagline}`,
    '',
    PROFILE.summary,
    '',
    `- **Focus:** ${PROFILE.focus.join(' · ')}`,
    `- **Building:** ${PROFILE.now.building} — [${L.arena.value}](${L.arena.href})`,
    `- **Next:** ${PROFILE.now.next}`,
    `- **Open to:** ${PROFILE.openTo.join(' · ')}`,
    `- **Based in:** ${PROFILE.location} · ${PROFILE.timezone}`,
    '',
    `**${SECTIONS.proof.title}**`,
    '',
    ...PROOF.map((p) => `- **${p.value}** ${p.label} — ${link(p.detail)}`),
    '',
    `**${SECTIONS.projects.title}**`,
    '',
    ...PROJECTS.flatMap((p) => [
      `- **${p.name}** — ${p.kind} (${status(p)})`,
      `  - **Problem:** ${p.problem}`,
      `  - **Approach:** ${p.approach}`,
      ...p.highlights.map((h) => `  - ${h}`),
      `  - **Stack:** ${p.stack.join(', ')}`,
      ...(arch(p) ? [`  - **Architecture (${p.diagram.title.toLowerCase()}):** ${arch(p)}`] : []),
    ]),
    '',
    `**${SECTIONS.build.title}**`,
    '',
    '_Architecture decisions_',
    '',
    ...DECISIONS.map((x) => `- **${x.title}** — ${x.why}`),
    '',
    '_Engineering principles_',
    '',
    ...PRINCIPLES.map((x, i) => `${i + 1}. **${x.title}.** ${x.why}`),
    '',
    `**${SECTIONS.stack.title}**`,
    '',
    // items are [slug, label, full name when the label is shortened]
    ...[...STACK.build, ...STACK.run].map((g) => `- **${g.group}:** ${g.items.map(([, label, full]) => full || label).join(', ')}`),
    '',
    `**${SECTIONS.services.title}**`,
    '',
    ...SERVICES.map((s) => `- **${s.title}** (${s.time}) — ${s.items.join(' · ')}`),
    '',
    `${WORKING_STYLE.join(' · ')}.`,
    '',
    `**${CTA.title}** ${CTA.body}`,
    '',
    contact.map((l) => `${l.label}: ${l.href ? `[${l.value}](${l.href})` : l.value}`).join(' · '),
    '',
    '</details>',
  ]
  return lines.join('\n')
}
