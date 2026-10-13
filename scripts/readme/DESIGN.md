# Profile README design system

The profile is a set of hand-built SVG components (dark + light rendition of
each) stitched together by `README.md`. Everything is generated from code:

```
scripts/readme/
  content.mjs        all copy and data — the only file to edit for content changes
  components/*.mjs   one file per component group; each exports asset entries
  lib/               shared design system (do not fork it inside components)
  live.mjs           renders the GitHub activity cards from live data (runs in CI)
  build.mjs          renders components → ../../assets/<name>-{dark,light}.svg + README.md
  snap.mjs           screenshots assets the way GitHub shows them (review tool)
  preview.mjs        screenshots the whole README (review tool)
```

`npm run build` regenerates everything. `node build.mjs hero` rebuilds one
component file. `node snap.mjs <out-dir> hero` screenshots it.

## Look and feel

Premium, calm, engineered — the polish of Linear, Vercel or Raycast marketing
pages, not a wall of badges. Deep violet-black surfaces, hairline borders, one
soft glow per card, crisp type, generous whitespace and a few purposeful
animations. Violet is the primary accent, cyan the secondary; green is
reserved for "live / online" signals.

Avoid: emoji (they cannot be outlined), rainbow gradients, neon overload,
heavy drop shadows, text over busy backgrounds, more than ~3 accent colours in
one component, anything that looks like a stock template.

## Canvas and grid

| Token | Value | Use |
|---|---|---|
| full width | 850 | hero, section headers, CTA, footer, snake |
| half width | 415 | everything else; two halves sit side by side on desktop and stack on phones |
| corner radius | 18 (cards), 10–12 (inner tiles), pills fully rounded |
| card padding | 24–28 |
| spacing | multiples of 4; prefer 8 / 12 / 16 / 24 / 32 |

Draw cards edge to edge on the 850 / 415 canvas. At build time every image
gets a transparent side margin of the same share of its width
(`padForPair`: 8 units each side → 431; `padForFull`: 16 each side → 882),
and `readme.mjs` sets the README widths (halves 413, full width 846) so that:

- **desktop** (846px column): all blocks render at ~0.96×, every card edge
  lines up (a pair's outer edges meet the full-width cards) and the two cards
  of a pair are ~20px apart;
- **phone** (358px column, everything stacks): halves render at ~0.83×,
  full-width blocks at ~0.41×, and every card again has the same edges.

Do not add your own outer margin to a component, and do not change the
gutters or README widths without re-measuring with `preview.mjs`.

**Legibility floor:** in half-width components no text below 12px (mono
kickers may be 11px) — that is ~10px on a phone. In full-width components
anything that must be readable on a phone needs ≥ 26px (≈ 10.5 CSS px there;
headings ≥ 48px to still read as headings); smaller text is decoration only,
unless the component adds a phone layer (`PHONE_CSS` below) that re-sets it
at those sizes.

Pairs on the same row **must have identical heights**.

## Typography (outlined glyphs — never use `<text>`)

| Role | Font key | Size |
|---|---|---|
| hero name | `display-700` | 56–64 |
| section / card title | `display-700` / `display-600` | 20–26 |
| big numbers | `display-700` | 32–44 |
| body | `body-400` (emphasis `body-600`) | 13–14, line height ≈ 1.5 |
| labels, meta | `body-500` | 12–13 |
| kickers, code, tags | `mono-500` / `mono-400` | 11–12.5 |

## Colour tokens (`d.t`)

Use tokens, never raw hex, so both themes stay correct:
`fg` headings · `fg2` body · `muted` meta · `faint` decoration ·
`violet`, `violetSoft`, `violetStrong`, `cyan`, `sky`, `pink`, `green`, `amber`, `red` ·
`surfaceTop/surfaceBottom/surfaceRaised/inset` · `border/borderStrong` ·
`chipBg/chipBorder/chipFg` · `glowViolet/glowCyan/glowPink` · `gradText/gradAccent/gradBorder` ·
`code.{prompt,command,keyword,string,number,comment,punct}` · `logoTile/logoTileBorder`.

## Primitives (`lib/svg.mjs`)

```js
const d = createDoc({ width, height, theme, title, desc })
d.add(d.card({ glows: [{ cx, cy, r, color: d.t.glowViolet }], pattern: { kind: 'dots', fade: { cx, cy, r } } }))
d.text(str, { x, y, font, size, fill, anchor, tracking, upper, cls, style })   // y = baseline
d.gradientText(str, { x, y, font, size, stops })
d.paragraph(content, { x, y, width, font, size, lineHeight, fill, maxLines })  // → { svg, height, lines, width }
   // content: 'text' or ['plain ', { text: 'bold bit', font: 'body-600', fill: d.t.fg }, ' more']
d.measure(str, { font, size, tracking, upper })      // px width
d.metrics(font, size)                                // { ascender, descender, capHeight, xHeight }
d.kicker('01 · label', { x, y, fill })
d.pill(label, { x, y, h, dot, pulse, icon, fg, bg, border, anchor })   // → { svg, w, h }
d.chip(label, { x, y })                              // → { svg, w, h }
d.flow(labels, { x, y, width, gap, rowGap, make })   // wraps chips/pills → { svg, height, rows }
d.icon(lucideName, { x, y, size, color, stroke, cls, style })   // https://lucide.dev/icons
d.logo(simpleIconsSlug, { x, y, size, on })          // brand colour, auto-fallback on low contrast
d.logo('lucide:globe', { x, y, size, color })        // generic icon where no brand mark fits (default violet)
d.glow({ cx, cy, r, color }) · d.pattern({...}) · d.linearGradient(stops, {x1,y1,x2,y2,units})
d.def(markup) · d.css(rule) · d.uid(prefix) · d.end()

// phone layer for full-width components: shown when the image is drawn < 600px wide
d.css(PHONE_CSS)   // import { PHONE_CSS } from '../lib/svg.mjs'; then <g class="dt">desktop-only</g> <g class="ph">phone-sized</g>
```

## Motion

Shared classes: `fade-up`, `fade-in`, `pulse` (status dots), `blink` (caret),
`flow` (dashed connectors), `drift-a` / `drift-b` (ambient glows), `breathe`.
Stagger entrances with `style="animation-delay:.2s"`, everything settled by
~1.5s. Looping motion must be slow and subtle. `prefers-reduced-motion`
disables it all automatically (`.packet` elements are hidden).

A CSS `transform` replaces an element's `transform` attribute, so animate a
wrapper `<g class="...">`, never the element that carries `transform=`
(`d.text`/`d.icon`/`d.pill` already wrap when given `cls`/`style`).
Moving dots along paths: SMIL `<animateMotion>` inside an element with class
`packet`.

## Rules

- Copy and numbers come from `content.mjs` only. Never invent metrics, dates,
  users, testimonials or features.
- No `<text>`, `<foreignObject>`, `<script>`, `<image>` with remote URLs, or
  external references — GitHub renders these images sandboxed.
- Every entry exports `{ name, width, height, alt, href?, render(theme) }`;
  `alt` must carry the full information of the image for screen readers.
- Check every component in **both themes and at phone width** with
  `snap.mjs` before calling it done: nothing clipped, overlapping or touching
  edges, consistent padding, balanced whitespace. Read the phone block too —
  it is drawn at the real 358px column, so it shows what full-width text and
  any `.ph` layer look like on a phone.
- After layout changes, run `preview.mjs` and check that card edges still
  line up down the whole page on desktop and on phone.
