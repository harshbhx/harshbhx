// Design tokens for the dark and light renditions of every component.
// Each component is rendered once per theme; README.md switches between the
// two with <picture> + prefers-color-scheme, which GitHub maps to the
// viewer's theme setting.

export const LAYOUT = {
  full: 850, // README content width on github.com profile pages (~846px)
  half: 415, // two halves + gap = full; they stack on narrow screens
  gap: 20,
  radius: 18,
  pad: 24,
}

const dark = {
  name: 'dark',
  page: '#0d1117', // GitHub dark page background (used by previews only)

  // surfaces
  surfaceTop: '#171029',
  surfaceBottom: '#0b0815',
  surfaceRaised: '#1d1533',
  inset: '#0a0713',
  border: '#2c2247',
  borderStrong: '#41336d',
  highlight: 'rgba(255,255,255,0.07)', // 1px top-edge sheen on cards
  shadow: 'rgba(0,0,0,0.35)',

  // text
  fg: '#f4f1ff',
  fg2: '#cdc6ea',
  muted: '#9a93bd',
  faint: '#6d6790',

  // accents
  violet: '#a78bfa',
  violetStrong: '#8b5cf6',
  violetSoft: '#c4b5fd',
  cyan: '#67e8f9',
  sky: '#7dd3fc',
  pink: '#f0abfc',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#fb7185',

  // gradients (stops listed left → right)
  gradText: ['#e9e3ff', '#c4b5fd', '#a78bfa', '#67e8f9'],
  gradAccent: ['#8b5cf6', '#22d3ee'],
  gradBorder: ['#8b5cf6', '#22d3ee', '#f0abfc'],

  // glows: radial gradients painted behind content (color, peak opacity)
  glowViolet: ['#7c3aed', 0.35],
  glowCyan: ['#0891b2', 0.28],
  glowPink: ['#c026d3', 0.18],

  // patterns
  grid: 'rgba(167,139,250,0.13)',
  gridLine: 'rgba(167,139,250,0.07)',

  // chips / pills
  chipBg: 'rgba(167,139,250,0.10)',
  chipBorder: 'rgba(167,139,250,0.30)',
  chipFg: '#ddd6fe',

  // syntax colors for terminal / code styled components
  code: {
    prompt: '#34d399',
    command: '#f4f1ff',
    keyword: '#c4b5fd',
    string: '#7dd3fc',
    number: '#fbbf24',
    comment: '#6d6790',
    punct: '#9a93bd',
  },

  // tile behind brand logos, and the rule for dark logos on it
  logoTile: '#1a1430',
  logoTileBorder: '#2c2247',
}

const light = {
  name: 'light',
  page: '#ffffff',

  surfaceTop: '#ffffff',
  surfaceBottom: '#f6f3ff',
  surfaceRaised: '#ffffff',
  inset: '#f3f0fc',
  border: '#e4ddf7',
  borderStrong: '#cfc3f0',
  highlight: 'rgba(255,255,255,0.9)',
  shadow: 'rgba(76,29,149,0.08)',

  fg: '#16113a',
  fg2: '#3d3862',
  muted: '#5f5a80',
  faint: '#8a86a6',

  violet: '#6d28d9',
  violetStrong: '#7c3aed',
  violetSoft: '#8b5cf6',
  cyan: '#0e7490',
  sky: '#0369a1',
  pink: '#a21caf',
  green: '#047857',
  amber: '#b45309',
  red: '#be123c',

  gradText: ['#4c1d95', '#6d28d9', '#7c3aed', '#0e7490'],
  gradAccent: ['#7c3aed', '#0891b2'],
  gradBorder: ['#7c3aed', '#0891b2', '#c026d3'],

  glowViolet: ['#c4b5fd', 0.45],
  glowCyan: ['#a5f3fc', 0.4],
  glowPink: ['#f5d0fe', 0.35],

  grid: 'rgba(109,40,217,0.12)',
  gridLine: 'rgba(109,40,217,0.06)',

  chipBg: 'rgba(109,40,217,0.06)',
  chipBorder: 'rgba(109,40,217,0.22)',
  chipFg: '#4c1d95',

  code: {
    prompt: '#047857',
    command: '#16113a',
    keyword: '#6d28d9',
    string: '#0369a1',
    number: '#b45309',
    comment: '#8a86a6',
    punct: '#5f5a80',
  },

  logoTile: '#f6f3ff',
  logoTileBorder: '#e4ddf7',
}

export const THEMES = { dark, light }
