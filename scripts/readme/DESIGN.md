# Profile README design system — "Terracotta & Ink"

The profile reads like Harsh's own small printed magazine — *The Vadodara
Edition* — reprinted daily by GitHub Actions. It must feel **personal and
genuine** (his real photo, first-person voice, only true facts), **current**
(2026 editorial design, not a badge wall or a SaaS dashboard) and **unique**.

Everything is generated from code:

```
scripts/readme/
  content.mjs        all copy and data — the only file to edit for content changes
  components/*.mjs   static components (committed to assets/)
  live.mjs, live/    components rendered daily in CI from live data (output branch)
  lib/svg.mjs        createDoc + primitives (text as outlined glyphs, pills, icons, logos…)
  lib/editorial.mjs  paper, rules, crop marks, highlighter, portrait, status labels
  lib/theme.mjs      tokens for the paper (light) and espresso (dark) editions
  photos/            portrait plates (terracotta backdrop) + the source photo
  build.mjs · readme.mjs · snap.mjs · preview.mjs
```

`node build.mjs <component-file>` rebuilds one file; `node snap.mjs <out> <prefix>`
screenshots assets (dark + light, desktop + phone); `node preview.mjs <out>`
screenshots the whole README.

## Voice

First person, plain, confident, never salesy. Real nouns over adjectives.
Honest status everywhere: **LIVE** only for DualMind Arena (and links to
live sites); **BUILT** for hackathon / client projects. Never invent numbers,
dates, users, testimonials, awards or features — `content.mjs` is the only
source of truth (you may shorten wording, never add claims).

## Look

A matte paper publication. Palette taken from the portrait: navy suit = ink,
terracotta backdrop, warm paper, turmeric highlighter. **No violet/cyan, no
glows, no neon gradients, no glassmorphism.** Depth comes from typography,
rules and whitespace — like a well-set magazine.

| Element | Treatment |
|---|---|
| Cards | `paper()` — matte gradient + grain + hairline border, radius 14 |
| Rules | `doubleRule()` under mastheads/section titles, `hairline()` between items |
| Emphasis | `highlighter()` swash behind one phrase per card at most (night edition: a marker underline below the baseline at body sizes) |
| Figures | crop marks, "Fig." captions in serif italic, thin ink lines |
| Status | `status(d, 'live' | 'built' | text)` mono caps chip |
| Accents | `terra` (primary accent, numbers, kickers), `turmeric` (highlighter, hackathon tags), `ink` navy (links, data), `green` only for live/open/up, `red` only for down |

## Typography (outlined — never `<text>`)

| Role | Font key | Size |
|---|---|---|
| Name / masthead | `serif-400` | 72–92 |
| Section titles | `serif-400` (number in `serif-400i` terra: "No. 2") | 44–52 |
| Card titles | `serif-400` | 34–44 |
| Decks / standfirsts | `serif-400i` | 19–24 |
| Body | `sans-400` (emphasis `sans-600`) | 13–14.5, line height ≈ 1.5 |
| Labels | `sans-500` | 12–13 |
| Kickers, data, tags | `mono-400` / `mono-500` caps, tracking 0.10–0.14 | 10.5–12 |

Glyph gaps: Instrument Serif has **no arrows** (use `sans-*` or `mono-*` for → ↗);
no font has ✓ ● ★ ◆ — draw shapes or use Lucide icons (`d.icon`) instead.

## Canvas, grid, phones

| Token | Value |
|---|---|
| full width | 850 (masthead, section headers, letter, calendar, colophon) |
| half width | 415 — pairs sit side by side on desktop (~413px) and stack on phones (~0.83×) |
| padding | 28 inside cards; spacing in multiples of 4 |

Pairs on a row **must have identical heights**. Half-width text floor: 12px
(mono kickers 10.5–11). Full-width components are drawn at ~0.41× on phones,
so every full-width component needs a **phone layer**: wrap the desktop art in
`<g class="dt">` and a re-flowed large-type version in `<g class="ph">`, and
add `d.css(PHONE_CSS)` (from lib/svg.mjs) — the media query inside the SVG
switches at a 600px drawn width. Phone-layer text should render ≥ 11px
on a 358px column (i.e. ≥ 26 units in an 850-wide SVG).

## Motion

Quiet and print-like: the portrait develops (fade), the highlighter swipes
in, ink lines draw themselves (`inkPath`), stamps land, live dots pulse.
Everything settles within ~1.6s. Live dots (`.pulse`) pulse four times and
then rest: any running animation makes the browser re-rasterise the whole
image every frame, so a page full of endless loops never goes idle on a phone.
`.pulse-live` / `liveDot(…, { loop: true })` loops forever — at most one small
signal per page. The
fully drawn state is the base state (animations only run *towards* it), no
`var()` inside `@keyframes`, never animate an element that has `transform=`,
and `prefers-reduced-motion` disables everything (handled in BASE_CSS).

## Rules

- Contents tabs print `SECTIONS[].tab`, a short form of the section `title`
  they jump to ("Work" → "Selected work"), never a different name.

- Only `d.text` / `d.paragraph` / `runs()` for text; no `<text>`, `<foreignObject>`,
  `<script>`, remote images or external URLs inside SVGs. The portrait is
  embedded as a data URI via `portrait(d)`.
- Use theme tokens (`d.t.*`), never raw hex, so both editions stay correct.
- Each entry: `{ name, width, height, alt, href?, render(theme) }`; `alt` carries
  all of the image's information.
- One link per image: never draw two different "↗ link" labels inside one SVG;
  secondary links go in the README's real-text rows.
- Check every component in both themes at desktop and phone width with
  `snap.mjs` before calling it done.
