// Everything the profile says, in one place. Components read from here;
// edit this file and run `npm run build` to regenerate assets/ and README.md.
// Only facts Harsh has confirmed or that are public on his repos / sites.

export const PROFILE = {
  name: 'Harsh Bhanushali',
  handle: 'harshbhx',
  publication: 'A working portfolio',
  deck: 'I build AI agents & automations — and the products around them.',
  deckHighlight: 'AI agents & automations', // phrase marked with the highlighter
  intro:
    'CS student at Parul University in Vadodara, India. In 2025 I co-founded DualMind Labs with Rishi A. Bangoriya, and our first product — DualMind Arena, blind head-to-head AI model evaluation — is live.',
  city: 'Vadodara',
  location: 'Vadodara, Gujarat, India',
  timezone: 'IST (UTC+5:30)',
  coords: [73.1812, 22.3072], // [lon, lat] — Vadodara, for the GeoJSON map
  university: 'Parul University',
  study: 'Computer Science',
  company: 'DualMind Labs',
  companyRole: 'Co-founder',
  cofounder: 'Rishi A. Bangoriya',
  founded: '2025',
  focus: 'Generative AI — AI agents & automations',
  openTo: {
    headline: 'Open to work, worldwide',
    types: ['Full-time', 'Internships', 'Freelance', 'Contract'],
    note: 'remote-friendly',
    detail: 'any kind of work, anywhere',
  },
  hiringHook: 'Hiring for AI agents or automations?',
  email: 'bhanushaliharsh434@gmail.com',
  photoCaption: 'Harsh, Vadodara · IST (UTC+5:30)',
}

export const LINKS = {
  email: { label: 'Email', value: 'bhanushaliharsh434@gmail.com', href: 'mailto:bhanushaliharsh434@gmail.com?subject=Hello%20Harsh' },
  hire: {
    label: 'Email me about a role',
    href: 'mailto:bhanushaliharsh434@gmail.com?subject=Opportunity%20for%20Harsh&body=Hi%20Harsh%2C%0A%0ARole%3A%20%0AType%20(full-time%20%2F%20internship%20%2F%20freelance%20%2F%20contract)%3A%20%0ARemote%20%2F%20location%3A%20%0ATimeline%3A%20%0A%0A',
  },
  linkedin: { label: 'LinkedIn', value: 'in/harshu-dev', href: 'https://linkedin.com/in/harshu-dev' },
  github: { label: 'GitHub', value: '@harshbhx', href: 'https://github.com/harshbhx' },
  devto: { label: 'Dev.to', value: 'harshudev', href: 'https://dev.to/harshudev' },
  website: { label: 'DualMind Labs', value: 'dualmindlab.tech', href: 'https://dualmindlab.tech' },
  discord: { label: 'Discord', value: 'harshu911', href: null },
  arena: { label: 'DualMind Arena', value: 'arena.dualmindlab.tech', href: 'https://arena.dualmindlab.tech' },
  docs: { label: 'Docs', value: 'docs.dualmindlab.tech', href: 'https://docs.dualmindlab.tech' },
  actions: { label: 'GitHub Actions', value: 'actions', href: 'https://github.com/harshbhx/harshbhx/actions' },
}

// Section order and numbering. `anchor` is the in-page link target used by the
// contents tabs (README links to #user-content-<anchor>).
export const SECTIONS = [
  { key: 'work', no: 1, tab: 'Work', title: 'The Arena story', note: 'what we run in production' },
  { key: 'projects', no: 2, tab: 'Projects', title: 'Selected work', note: 'what I built, and why' },
  { key: 'journey', no: 3, tab: 'Journey', title: 'The route so far', note: 'Vadodara → anywhere' },
  { key: 'stack', no: 4, tab: 'Stack', title: 'The toolbox', note: 'what I ship with' },
  { key: 'contact', no: 5, tab: 'Contact', title: 'Write to me', note: 'open to work, worldwide' },
]

// No. 1 — DualMind Arena (live product)
export const ARENA = {
  name: 'DualMind Arena',
  status: 'live',
  kind: 'Blind, head-to-head AI model evaluation',
  href: 'https://arena.dualmindlab.tech',
  url: 'arena.dualmindlab.tech',
  docs: 'docs.dualmindlab.tech',
  problem: 'Public AI benchmarks are easy to game: cherry-picked prompts, brand bias, results nobody can audit.',
  approach: 'Two models answer the same real prompt with their names hidden; the community votes before the identities are revealed, and the votes feed a live leaderboard.',
  proof: [
    { value: '5,000+', label: 'requests absorbed in one traffic spike', detail: 'Bots + real users; Cloudflare CDN took the load before it reached the origin.' },
    { value: '#1', label: 'on Google for “DualMind Labs”', detail: 'dualmindlab.tech' },
    { value: 'Real-time', label: 'login anomaly detection', detail: 'IP capture, risk scoring and an email alert to the account owner on every suspicious event.' },
    { value: 'Docs', label: 'full user documentation, published', detail: 'docs.dualmindlab.tech' },
  ],
  decisions: [
    { title: 'CDN first, stateless API', why: 'Spikes land on Cloudflare, not the origin; scaling the .NET API out is a config change.' },
    { title: 'AI Gateway over direct calls', why: 'One place for rate limits, caching and per-request logs across every model provider.' },
    { title: 'Supabase on purpose', why: 'Leaderboard ranking needs relational queries.' },
  ],
  stack: ['Azure', '.NET Web API', 'Vanilla JS', 'Supabase · PostgreSQL', 'Cloudflare CDN', 'Cloudflare AI Gateway', 'GitHub Actions'],
  diagram: ['User prompt', 'Cloudflare CDN', '.NET Web API (stateless)', 'Cloudflare AI Gateway (rate limits · cache · logs)', 'Model A / Model B (identities hidden)', 'Community vote', 'Supabase · PostgreSQL (leaderboard)'],
  next: 'Expanding from model evaluation into AI agent evaluation.',
}

// No. 2 — Selected work (cards appear in this order, two per row)
export const WORK = [
  {
    key: 'pixelproof',
    name: 'PixelProof',
    status: 'built',
    event: 'Next Byte Hacks V2',
    kind: 'Chrome extension · AI image detection',
    deck: 'Is this image real? A Chrome extension that answers while you browse.',
    summary: 'Flags AI-generated and manipulated images on any page, explains the verdict in plain English and cross-checks the claim against live fact-check data.',
    pipeline: [
      { step: 'Detect', tool: 'Reality Defender API' },
      { step: 'Explain', tool: 'Google Gemini, in plain English' },
      { step: 'Cross-check', tool: 'Google Fact Check API' },
    ],
    highlights: ['Scan one image or the whole page in one click', 'Confidence badges drawn over each image', 'Cached results, keys stored locally, graceful fallback mode'],
    stack: ['Chrome MV3', 'Vanilla JS', 'Gemini', 'Reality Defender', 'Fact Check API'],
    links: [
      { label: 'pixelproof.dualmindlab.tech', href: 'https://pixelproof.dualmindlab.tech' },
      { label: 'Devpost', href: 'https://devpost.com/software/pixelproof-l5ofpx' },
      { label: 'Source', href: 'https://github.com/harshbhx/pixelproof' },
    ],
  },
  {
    key: 'modvigil',
    name: 'ModVigil',
    status: 'built',
    event: 'Reddit Mod Tools Hackathon 2026',
    kind: 'Reddit moderation automation · Devvit',
    deck: 'A second pair of eyes for Reddit moderators.',
    summary: 'Turns a subreddit’s raw mod log into a live dashboard and runs the routine safety work automatically — humans still make every final call.',
    rules: [
      { rule: 'Spike alerts', detail: 'modmail when removals hit 3× the hourly baseline (checked every 15 min)' },
      { rule: 'Progressive warnings', detail: 'educational note → final warning → flagged for human review' },
      { rule: 'Ghost-mod detection', detail: 'surfaces moderators inactive for 30+ days' },
      { rule: 'Weekly digest', detail: 'week-over-week report every Monday' },
    ],
    stack: ['Reddit Devvit', 'TypeScript', 'React', 'Redis'],
    links: [{ label: 'Source', href: 'https://github.com/harshbhx/modvigil' }],
  },
  {
    key: 'builder',
    name: 'AI Component Builder',
    status: 'built',
    event: 'Cursor workshop, Rajkot',
    kind: 'Generative UI · Cursor SDK',
    deck: 'Describe a component in plain English; get working React back.',
    summary: 'A chat panel streams generated React components from the Cursor SDK into a live preview with syntax-highlighted code.',
    pipeline: [
      { step: 'Prompt', tool: 'chat panel' },
      { step: 'Generate', tool: 'Cursor SDK, streamed over SSE' },
      { step: 'Preview', tool: 'sandboxed iframe + code view' },
    ],
    stack: ['Next.js 14', 'TypeScript', 'Cursor SDK', 'SSE', 'Tailwind'],
    links: [{ label: 'Source', href: 'https://github.com/harshbhx/cursor-rajkot-workshop' }],
  },
  {
    key: 'agent',
    name: 'AI Support Agent',
    status: 'built',
    event: null,
    kind: 'Support automation · function calling',
    deck: 'Answers the routine questions; hands people the rest with context.',
    summary: 'Claude / GPT-4o with function calling classifies every inbound query by intent and urgency, resolves the routine ones and escalates the rest with the context already drafted.',
    pipeline: [
      { step: 'Classify', tool: 'intent + urgency' },
      { step: 'Resolve', tool: 'auto-reply, logged to the CRM' },
      { step: 'Escalate', tool: 'human review, context pre-drafted' },
    ],
    stack: ['Node.js', 'Claude', 'GPT-4o', 'Supabase', 'Webhooks'],
    links: [],
  },
  {
    key: 'mealmind',
    name: 'MealMind',
    status: 'built',
    event: null,
    kind: 'Restaurant ecosystem · 3 Flutter apps',
    deck: 'One payment, three apps, under a second.',
    summary: 'Customer, chef and admin apps on one Firebase backend: a confirmed Razorpay payment reaches the kitchen screen and the admin dashboard in under a second.',
    pipeline: [
      { step: 'Pay', tool: 'Razorpay, in the customer app' },
      { step: 'Confirm', tool: 'webhook → Cloud Function' },
      { step: 'Sync', tool: 'one Firestore write, every app' },
    ],
    stack: ['Flutter ×3', 'Firestore', 'Firebase Auth', 'Cloud Functions', 'Razorpay'],
    links: [],
  },
]

// Short rules of thumb, printed as "House rules" next to MealMind.
export const PRINCIPLES = [
  { title: 'Ship early', why: 'Real users surface problems planning never will.' },
  { title: 'Observability is architecture', why: 'If you can’t see it in production, it isn’t done.' },
  { title: 'Pick the right tool', why: 'The trade-off matters more than familiarity.' },
  { title: 'Own the outcome', why: 'The deliverable is the running, monitored system — not the commit.' },
  { title: 'Communicate clearly', why: 'Async first, unprompted updates, no surprises.' },
]

// No. 3 — the route so far. Years only where they are known.
export const JOURNEY = [
  { title: 'Parul University', detail: 'Computer Science · Vadodara', kind: 'start' },
  { title: 'Co-founded DualMind Labs', detail: '2025 · with Rishi A. Bangoriya', kind: 'major' },
  { title: 'DualMind Arena goes live', detail: 'Blind AI model evaluation · 5,000+ request spike handled', kind: 'major' },
  { title: 'ModVigil', detail: 'Reddit Mod Tools Hackathon 2026', kind: 'hackathon' },
  { title: 'PixelProof', detail: 'Next Byte Hacks V2', kind: 'hackathon' },
  { title: 'AI Component Builder', detail: 'Cursor workshop, Rajkot', kind: 'hackathon' },
  { title: 'Now: AI agents & automations', detail: 'my Gen AI focus', kind: 'now' },
  { title: 'Next: AI agent evaluation', detail: 'DualMind Arena’s next chapter', kind: 'next' },
  { title: 'Anywhere', detail: 'open to work worldwide · remote-friendly', kind: 'end' },
]

export const NOW = [
  { label: 'Building', text: 'AI agents & automations — my Gen AI focus' },
  { label: 'At DualMind Labs', text: 'Taking DualMind Arena from model evaluation into AI agent evaluation' },
  { label: 'Studying', text: 'Computer Science at Parul University, Vadodara' },
  { label: 'Open to', text: 'Full-time · internships · freelance · contract — worldwide, remote-friendly' },
]

// No. 4 — the toolbox. [Simple Icons slug, label]
export const STACK = [
  { group: 'AI', note: 'models, gateways, SDKs', items: [['openai', 'OpenAI'], ['claude', 'Claude'], ['googlegemini', 'Gemini'], ['cloudflare', 'AI Gateway'], ['cursor', 'Cursor SDK']] },
  { group: 'Build', note: 'languages & frameworks', items: [['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['dart', 'Dart'], ['flutter', 'Flutter'], ['csharp', 'C#'], ['dotnet', '.NET'], ['nodedotjs', 'Node.js'], ['nextdotjs', 'Next.js'], ['react', 'React']] },
  { group: 'Data', note: 'where state lives', items: [['supabase', 'Supabase'], ['postgresql', 'PostgreSQL'], ['firebase', 'Firebase'], ['redis', 'Redis']] },
  { group: 'Run', note: 'cloud, edge, delivery', items: [['microsoftazure', 'Azure'], ['cloudflare', 'Cloudflare'], ['cloudflareworkers', 'Workers'], ['docker', 'Docker'], ['githubactions', 'GitHub Actions'], ['googlechrome', 'Chrome MV3'], ['reddit', 'Devvit']] },
]

export const CTA = {
  kicker: 'Hiring for AI agents or automations?',
  title: 'Write to me.',
  body: 'I’m open to work worldwide — full-time, internships, freelance or contract, remote-friendly. Tell me what you’re building.',
  signoff: '— Harsh',
}

// The plain-text summary under the hero (real, selectable Markdown text).
export const REAL_TEXT = {
  line: 'Open to work, worldwide — full-time, internships, freelance or contract · remote-friendly',
}
