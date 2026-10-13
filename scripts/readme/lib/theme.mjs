// Design tokens — "Terracotta & Ink".
//
// The palette is taken from Harsh's own portrait: navy suit (ink), the
// terracotta studio backdrop, warm paper, plus a turmeric highlighter.
// Light theme = the paper edition; dark theme = the espresso night edition.
// Each component is rendered once per theme; README.md switches between the
// two with <picture> + prefers-color-scheme, which GitHub maps to the
// viewer's theme setting.

export const LAYOUT = {
  full: 850, // README content width on github.com profile pages (~846px)
  half: 415, // two halves + gap = full; they stack on narrow screens
  gap: 20,
  radius: 14,
  pad: 28,
}

const light = {
  name: 'light',
  page: '#ffffff', // GitHub light page background (previews only)

  // paper
  surfaceTop: '#FCF9F3',
  surfaceBottom: '#F6F0E5',
  surfaceRaised: '#FFFDF9',
  inset: '#F2EADD',
  border: '#E5DACA',
  borderStrong: '#D3C4AC',
  highlight: 'rgba(255,255,255,0)', // paper is matte: no glossy sheen
  shadow: 'rgba(60,40,20,0.06)',

  // ink (all text tokens ≥ 4.5:1 on paper)
  fg: '#1B1E2B', // navy-black ink, 15.5:1
  fg2: '#3E4050', // 9.6:1
  muted: '#6A625B', // warm grey, 5.6:1
  faint: '#A79C8E', // decoration only

  // editorial accents
  terra: '#A9441F', // terracotta text, 5.6:1
  terraFill: '#C9643C', // fills only
  turmeric: '#8A5C00', // text, 5.4:1
  turmericFill: '#F2C55C', // highlighter
  ink: '#27346B', // navy: links, secondary data
  green: '#2C7A4B', // live / open / up only
  red: '#B42318', // down only
  rule: '#1B1E2B', // newspaper rules
  ruleSoft: 'rgba(27,30,43,0.14)',
  grain: 0.05, // paper grain opacity
  highlighterFill: '#F2C55C',
  highlighterOpacity: 0.62,
  plateBackdrop: ['#D7855E', '#B9623D'], // portrait backdrop (baked into the JPEG)

  // names the shared primitives in lib/svg.mjs read
  violet: '#A9441F',
  violetStrong: '#C9643C',
  violetSoft: '#B5552E',
  cyan: '#27346B',
  sky: '#27346B',
  pink: '#A9441F',
  amber: '#8A5C00',
  gradText: ['#1B1E2B', '#1B1E2B'],
  gradAccent: ['#C9643C', '#F2C55C'],
  gradBorder: ['#C9643C', '#F2C55C', '#27346B'],
  glowViolet: ['#F2C55C', 0],
  glowCyan: ['#C9643C', 0],
  glowPink: ['#C9643C', 0],
  grid: 'rgba(27,30,43,0.10)',
  gridLine: 'rgba(27,30,43,0.06)',
  chipBg: '#FFFDF9',
  chipBorder: '#D3C4AC',
  chipFg: '#1B1E2B',
  code: { prompt: '#2C7A4B', command: '#1B1E2B', keyword: '#A9441F', string: '#27346B', number: '#8A5C00', comment: '#A79C8E', punct: '#6A625B' },
  logoTile: '#FFFDF9',
  logoTileBorder: '#E5DACA',
}

const dark = {
  name: 'dark',
  page: '#0d1117', // GitHub dark page background (previews only)

  // espresso "night edition"
  surfaceTop: '#1C1714',
  surfaceBottom: '#15110E',
  surfaceRaised: '#231D18',
  inset: '#110E0B',
  border: '#33291F',
  borderStrong: '#4A3D31',
  highlight: 'rgba(255,255,255,0)',
  shadow: 'rgba(0,0,0,0.35)',

  // cream ink
  fg: '#F5EDE0', // 15.6:1
  fg2: '#D2C6B5', // 10.8:1
  muted: '#A49683', // 6.3:1
  faint: '#6E6257', // decoration only

  terra: '#F0875A', // 7.2:1
  terraFill: '#D4825C',
  turmeric: '#F2C25A', // 10.9:1
  turmericFill: '#E0A93A',
  ink: '#A3B0D0', // navy-suit tint, kept dusty so it never reads lavender; 8.2:1
  green: '#7CCB94', // 9.3:1
  red: '#FF8A7A',
  rule: '#F5EDE0',
  ruleSoft: 'rgba(245,237,224,0.14)',
  grain: 0.06,
  highlighterFill: '#D4825C',
  highlighterOpacity: 0.42,
  plateBackdrop: ['#C9764F', '#9C5232'],

  violet: '#F0875A',
  violetStrong: '#D4825C',
  violetSoft: '#F5A37E',
  cyan: '#A3B0D0',
  sky: '#A3B0D0',
  pink: '#F0875A',
  amber: '#F2C25A',
  gradText: ['#F5EDE0', '#F5EDE0'],
  gradAccent: ['#D4825C', '#F2C25A'],
  gradBorder: ['#D4825C', '#F2C25A', '#A3B0D0'],
  glowViolet: ['#D4825C', 0],
  glowCyan: ['#F2C25A', 0],
  glowPink: ['#D4825C', 0],
  grid: 'rgba(245,237,224,0.10)',
  gridLine: 'rgba(245,237,224,0.05)',
  chipBg: '#231D18',
  chipBorder: '#4A3D31',
  chipFg: '#F5EDE0',
  code: { prompt: '#7CCB94', command: '#F5EDE0', keyword: '#F0875A', string: '#A3B0D0', number: '#F2C25A', comment: '#6E6257', punct: '#A49683' },
  logoTile: '#231D18',
  logoTileBorder: '#33291F',
}

export const THEMES = { dark, light }
