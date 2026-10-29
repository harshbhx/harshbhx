// Everything the profile says, in one place. Components read from here;
// edit this file and run `npm run build` to regenerate assets/ and README.md.
// Only facts Harsh has confirmed or that are public on his repos / sites.

export const PROFILE = {
  name: 'Harsh Bhanushali',
  handle: 'harshbhx',
  publication: 'A working portfolio · 2026',
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
  diploma: 'Diploma from Darshan University', // completed before Parul
  company: 'DualMind Labs',
  companyRole: 'Co-founder',
  cofounder: 'Rishi A. Bangoriya',
  founded: '2025',
  focus: 'Generative AI — AI agents & automations',
  openTo: {
    headline: 'Open to work, worldwide',
    types: ['Freelance', 'Contract', 'Full-time', 'Internships'],
    note: 'remote · NDA-friendly',
    detail: 'freelance first, any time zone',
  },
  hiringHook: 'Freelance or NDA project in mind?',
  email: 'harshbhx@gmail.com',
  photoCaption: 'Harsh, Vadodara · IST (UTC+5:30)',
}

export const LINKS = {
  email: { label: 'Email', value: 'harshbhx@gmail.com', href: 'mailto:harshbhx@gmail.com?subject=Hello%20Harsh' },
  hire: {
    label: 'Email me about a project',
    href: 'mailto:harshbhx@gmail.com?subject=Project%20for%20Harsh&body=Hi%20Harsh%2C%0A%0AWhat%20we%E2%80%99re%20building%3A%20%0AType%20(freelance%20%2F%20contract%20%2F%20full-time%20%2F%20internship)%3A%20%0ANDA%20needed%3F%20%0ATimeline%3A%20%0A%0A',
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

// Section order and numbering. `key` names the assets (section-<key>, tab-<key>)
// and the in-page anchor the contents tabs link to (#user-content-<key>).
// `tab` is the short form of `title` printed on the contents tab, so the tabs
// and the department heads they jump to always agree.
export const SECTIONS = [
  { key: 'arena', no: 1, tab: 'Arena', title: 'The Arena story', note: 'what we run in production' },
  { key: 'work', no: 2, tab: 'Work', title: 'Selected work', note: 'what I built, and why' },
  { key: 'hire', no: 3, tab: 'Hire', title: 'Working together', note: 'freelance · remote · under NDA' },
  { key: 'stack', no: 4, tab: 'Toolbox', title: 'The toolbox', note: 'what I ship with, and how often' },
  { key: 'contact', no: 5, tab: 'Letters', title: 'Letters', note: 'by email, from any time zone' },
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
    // Every figure here is from the Ratchet README (github.com/harshbhx/ratchet),
    // measured 22–24 Oct 2026 on exams the adapters never saw.
    key: 'ratchet',
    name: 'Ratchet',
    status: 'built',
    event: 'Nebius x NVIDIA Global AI Hackathon 2026',
    eventPhrase: 'for the Nebius x NVIDIA Global AI Hackathon 2026',
    kind: 'OpenAI-compatible gateway · license-clean distillation',
    deck: 'License-clean distillation on open models, behind one OpenAI-compatible URL.',
    summary: 'A small Nemotron student answers first; when it is unsure the teacher answers, and every teacher answer is logged with its license to become training data.',
    pipeline: [
      { step: 'Answer', tool: 'Nemotron 3 Nano 4B, the student, answers first' },
      { step: 'Escalate', tool: 'when it is unsure, Nemotron 3 Ultra on Nebius Token Factory (the teacher) answers, logged with its license' },
      { step: 'Retrain', tool: 'Night School trains a new LoRA adapter; a golden gate (95% precision) decides if it ships' },
    ],
    results: {
      when: '22–24 Oct 2026',
      title: 'Measured',
      deck: 'Strict scoring, on exams the adapters never saw.',
      exams: [
        { task: 'Text-to-SQL', exam: 'exam 1 · 172 questions', before: 12.8, after: 39.0 },
        { task: 'Tool calling', exam: 'hard exam · 150 questions', before: 62.7, after: 90.7 },
      ],
      facts: [
        { approx: true, value: '$17', label: 'on record',detail: 'to teach the two text-to-SQL adapters' },
        { value: '95%', label: 'precision at the golden gate', detail: 'before a new adapter ships' },
        { value: 'LoRA', label: 'adapter you own', detail: 'with each teacher’s license logged' },
      ],
    },
    stack: ['Python', 'FastAPI', 'Nemotron', 'Nebius', 'Cloudflare Workers', 'LoRA · QLoRA'],
    links: [
      { label: 'Source', href: 'https://github.com/harshbhx/ratchet' },
      { label: 'ratchet.dualmindlab.tech', href: 'https://ratchet.dualmindlab.tech' },
    ],
  },
  {
    key: 'pixelproof',
    name: 'PixelProof',
    status: 'built',
    event: 'Next Byte Hacks V2',
    eventPhrase: 'for Next Byte Hacks V2', // reads after “built …” in running text
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
    eventPhrase: 'for the Reddit Mod Tools Hackathon 2026',
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
    eventPhrase: 'at a Cursor workshop in Rajkot',
    kind: 'Generative UI · Cursor SDK',
    deck: 'Describe a component in plain English; get working React back.',
    summary: 'A chat panel streams generated React components from the Cursor SDK into a live preview with syntax-highlighted code.',
    pipeline: [
      { step: 'Prompt', tool: 'chat panel' },
      { step: 'Generate', tool: 'Cursor SDK, streamed over SSE' },
      { step: 'Preview', tool: 'sandboxed iframe + code view' },
    ],
    stack: ['Next.js 14', 'TypeScript', 'Cursor SDK', 'SSE', 'Tailwind'],
    links: [{ label: 'Source', href: 'https://github.com/harshbhx/ai-component-builder' }],
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

// No. 3 — working together (freelance first, remote, NDA-friendly).
// Services, timelines and working style come from Harsh's own earlier README.
export const HIRE = {
  headline: 'Freelance, remote, under NDA',
  deck: 'I take on AI and product work for clients worldwide — scoped up front, shipped in weekly steps.',
  services: [
    { title: 'AI agents & automations', detail: 'RAG, agents and multi-model systems on OpenAI + Claude, behind Cloudflare AI Gateway', time: '1–4 weeks' },
    { title: 'Mobile apps', detail: 'Flutter for iOS & Android — auth, Firebase, Razorpay / Stripe, store release', time: '2–6 weeks' },
    { title: 'Backend APIs', detail: '.NET Web API or Node.js — auth, security alerting, fully documented', time: '1–3 weeks' },
    { title: 'Full-stack MVPs', detail: 'Mobile + backend + AI + security, deployed on Azure + Cloudflare', time: '3–8 weeks' },
  ],
  terms: [
    { title: 'NDA-friendly', detail: 'Happy to sign one — client work stays private.' },
    { title: 'Remote, worldwide', detail: 'IST (UTC+5:30), async-friendly, replies within 24 hours.' },
    { title: 'Your code, delivered', detail: 'Weekly deliverables and full source handoff, no scope surprises.' },
  ],
}

export const NOW = [
  { label: 'Building', text: 'AI agents & automations — my Gen AI focus' },
  { label: 'At DualMind Labs', text: 'Taking DualMind Arena from model evaluation into AI agent evaluation' },
  { label: 'Studying', text: 'Computer Science at Parul University, Vadodara — after a diploma from Darshan University' },
  { label: 'Open to', text: 'Freelance first · contract · full-time · internships — remote, worldwide, NDA-friendly' },
]

// No. 4 — the toolbox. [Simple Icons slug, label]
export const STACK = [
  { group: 'AI', note: 'models, gateways, SDKs', items: [['openai', 'OpenAI'], ['claude', 'Claude'], ['googlegemini', 'Gemini'], ['cloudflare', 'AI Gateway'], ['cursor', 'Cursor SDK'], ['nvidia', 'Nemotron']] },
  { group: 'Build', note: 'languages & frameworks', items: [['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['python', 'Python'], ['dart', 'Dart'], ['flutter', 'Flutter'], ['csharp', 'C#'], ['dotnet', '.NET'], ['nodedotjs', 'Node.js'], ['nextdotjs', 'Next.js'], ['react', 'React'], ['fastapi', 'FastAPI']] },
  { group: 'Data', note: 'where state lives', items: [['supabase', 'Supabase'], ['postgresql', 'PostgreSQL'], ['firebase', 'Firebase'], ['redis', 'Redis']] },
  { group: 'Run', note: 'cloud, edge, delivery', items: [['microsoftazure', 'Azure'], ['cloudflare', 'Cloudflare'], ['cloudflareworkers', 'Workers'], ['docker', 'Docker'], ['githubactions', 'GitHub Actions'], ['googlechrome', 'Chrome MV3'], ['reddit', 'Devvit']] },
]

export const CTA = {
  kicker: PROFILE.hiringHook,
  title: 'Write to me.',
  body: 'I’m open to remote work worldwide — freelance first, contract and full-time too — and happy to work under NDA. Tell me what you’re building.',
  signoff: '— Harsh',
}
