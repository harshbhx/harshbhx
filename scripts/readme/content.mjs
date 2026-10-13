// Everything the profile says, in one place. Components read from here;
// edit this file and run `npm run build` to regenerate assets/ and README.md.

export const PROFILE = {
  name: 'Harsh Bhanushali',
  handle: 'harshbhx',
  role: 'Full-stack engineer · AI systems',
  company: 'DualMind Labs',
  companyRole: 'Co-founder',
  tagline: 'I build systems. Real ones. Deployed. Live.',
  summary:
    'CS student and co-founder of DualMind Labs. I take products from idea to production — app, API, database, infrastructure, security and docs — and keep them running after launch.',
  location: 'Rajkot, India',
  timezone: 'IST (UTC+5:30)',
  openTo: ['Internships', 'Freelance', 'AI product builds', 'Early-stage startups'],
  email: 'bhanushaliharsh434@gmail.com',
  focus: ['Backend & AI systems', 'Flutter', '.NET', 'Cloudflare'],
  now: {
    building: 'DualMind Arena — blind, head-to-head AI model evaluation',
    next: 'Expanding DualMind into AI agent evaluation',
  },
}

export const LINKS = {
  github: { label: 'GitHub', value: 'harshbhx', href: 'https://github.com/harshbhx', icon: 'github' },
  linkedin: { label: 'LinkedIn', value: 'harshu-dev', href: 'https://linkedin.com/in/harshu-dev', icon: 'linkedin' },
  devto: { label: 'Dev.to', value: 'harshudev', href: 'https://dev.to/harshudev', icon: 'devdotto' },
  email: { label: 'Email', value: 'bhanushaliharsh434@gmail.com', href: 'mailto:bhanushaliharsh434@gmail.com', icon: 'gmail' },
  website: { label: 'Website', value: 'dualmindlab.tech', href: 'https://dualmindlab.tech', icon: 'googlechrome' },
  discord: { label: 'Discord', value: 'harshu911', href: null, icon: 'discord' },
  arena: { label: 'DualMind Arena', value: 'arena.dualmindlab.tech', href: 'https://arena.dualmindlab.tech' },
  docs: { label: 'Docs', value: 'docs.dualmindlab.tech', href: 'https://docs.dualmindlab.tech' },
}

export const SECTIONS = {
  proof: { index: '01', title: 'Proof of work', note: 'real numbers from shipped systems' },
  projects: { index: '02', title: 'Featured projects', note: 'live products & the systems behind them' },
  build: { index: '03', title: 'How I build', note: 'decisions and the reasons behind them' },
  stack: { index: '04', title: 'Tech stack', note: 'what I ship with' },
  services: { index: '05', title: 'Work with me', note: 'what you can hire me for today' },
  activity: { index: '06', title: 'GitHub activity', note: 'refreshed daily by GitHub Actions' },
}

// Only claims that are already public on the profile / dualmindlab.tech.
export const PROOF = [
  { key: 'traffic', icon: 'zap', value: '5,000+', label: 'requests absorbed in one traffic spike', detail: 'Bots + real users. Cloudflare CDN took the load before it reached the origin.' },
  { key: 'payments', icon: 'credit-card', value: '3 apps', label: 'Razorpay payments synced in real time', detail: 'Webhook → Cloud Function → one Firestore write every app listens to.' },
  { key: 'seo', icon: 'trending-up', value: '#1', label: 'on Google for “DualMind Labs”', detail: 'dualmindlab.tech' },
  { key: 'security', icon: 'shield-check', value: 'Real-time', label: 'login anomaly detection', detail: 'IP capture, risk scoring and an email alert to the account owner on every suspicious event.' },
  { key: 'docs', icon: 'book-open', value: 'Docs', label: 'full user documentation, published', detail: 'docs.dualmindlab.tech' },
  { key: 'ownership', icon: 'workflow', value: 'E2E', label: 'design → code → infra → deploy → docs', detail: 'From first commit to a monitored production system.' },
]

export const PROJECTS = [
  {
    key: 'dualmind',
    name: 'DualMind Arena',
    kind: 'AI model evaluation platform',
    status: 'live', // live | built
    href: 'https://arena.dualmindlab.tech',
    url: 'arena.dualmindlab.tech',
    problem: 'Public AI benchmarks are easy to game: cherry-picked prompts, brand bias, results nobody can audit.',
    approach: 'Blind head-to-head battles on real community prompts. Model identities stay hidden until the vote is locked.',
    highlights: [
      'Cloudflare AI Gateway routes every LLM call — rate limits, caching, per-request logs',
      'Stateless .NET Web API behind Cloudflare CDN; scaling out is a config change',
      'Supabase (PostgreSQL) on purpose: leaderboard ranking needs relational SQL',
      'Real-time login anomaly detection with IP capture, risk scoring and owner alerts',
    ],
    stack: ['Azure', '.NET Web API', 'Vanilla JS', 'Supabase', 'Cloudflare CDN', 'AI Gateway', 'GitHub Actions'],
    diagram: {
      title: 'Request path',
      nodes: ['User prompt', 'Cloudflare CDN', '.NET Web API (stateless)', 'Cloudflare AI Gateway', 'Model A (hidden)', 'Model B (hidden)', 'Community vote', 'Supabase · PostgreSQL leaderboard'],
    },
  },
  {
    key: 'mealmind',
    name: 'MealMind',
    kind: 'Restaurant management ecosystem',
    status: 'built',
    href: null,
    url: null,
    problem: 'Customers, kitchen and owners each need a different live view of the same orders and payments.',
    approach: 'Three coordinated Flutter apps on one Firebase backend. A confirmed payment reaches the chef screen and admin dashboard in under a second.',
    highlights: [
      'Full Razorpay payment lifecycle: webhook → Cloud Function → every app',
      'One Firestore write drives the customer, chef and admin views',
      'Firebase security rules scoped per role — built in, not bolted on',
      'CI/CD with GitHub Actions for all three apps',
    ],
    stack: ['Flutter ×3', 'Firestore', 'Firebase Auth', 'Cloud Functions', 'Razorpay', 'GitHub Actions'],
    diagram: {
      title: 'Real-time sync',
      nodes: ['Customer app', 'Razorpay', 'Cloud Functions (webhook)', 'Firestore (single source of truth)', 'Chef app', 'Admin app'],
    },
  },
  {
    key: 'agent',
    name: 'AI Support Agent',
    kind: 'Automated query pipeline',
    status: 'built',
    href: null,
    url: null,
    problem: 'Support teams spend most of their time on routine questions, and escalations arrive without context.',
    approach: 'Claude / GPT-4o with function calling resolves routine queries and escalates the rest with the context already drafted.',
    highlights: [
      'Classifies intent and urgency for every inbound query',
      'Routine queries: auto-reply + logged to the CRM',
      'Needs judgment: human review with context pre-drafted',
      'Multi-model with function calling and webhooks',
    ],
    stack: ['Node.js', 'Claude', 'GPT-4o', 'Supabase', 'Function calling', 'Webhooks'],
    diagram: {
      title: 'Query pipeline',
      nodes: ['Inbound query', 'AI agent (intent + urgency)', 'Auto-reply + CRM log', 'Human review (context pre-drafted)'],
    },
  },
]

export const DECISIONS = [
  { title: 'CDN first, stateless API', why: 'Spikes land on Cloudflare, not the origin. Scaling the .NET API out is a config change.' },
  { title: 'Supabase here, Firebase there', why: 'Leaderboards need real SQL. Real-time sync across three apps is exactly Firestore’s job.' },
  { title: 'AI Gateway over direct calls', why: 'One place for rate limits, caching and per-request logs across every model provider.' },
  { title: 'Observability from day one', why: 'Login alerts, gateway logs, webhook and function traces ship with the product.' },
  { title: 'Security by design', why: 'Anomaly detection and owner alerts were part of the launch, not a patch after a breach.' },
]

export const PRINCIPLES = [
  { title: 'Ship early', why: 'Real users surface problems planning never will.' },
  { title: 'Design for scale on day one', why: 'Stateless APIs, CDN first, SQL where queries get complex.' },
  { title: 'Observability is architecture', why: 'Logs, alerts and dashboards ship with the product.' },
  { title: 'Pick the right tool', why: 'The trade-off matters more than familiarity.' },
  { title: 'Own the outcome', why: 'The deliverable is the running, monitored system — not the commit.' },
  { title: 'Communicate clearly', why: 'Async first, unprompted updates, no surprises.' },
]

// slug = Simple Icons slug (or icons/extra)
export const STACK = {
  build: [
    { group: 'Languages', items: [['dart', 'Dart'], ['csharp', 'C#'], ['typescript', 'TypeScript'], ['javascript', 'JavaScript'], ['c', 'C']] },
    { group: 'Frameworks', items: [['flutter', 'Flutter'], ['dotnet', '.NET'], ['nodedotjs', 'Node.js'], ['nextdotjs', 'Next.js'], ['html5', 'HTML'], ['css', 'CSS']] },
    { group: 'AI', items: [['openai', 'OpenAI'], ['claude', 'Claude'], ['googlegemini', 'Gemini'], ['cloudflare', 'AI Gateway']] },
  ],
  run: [
    { group: 'Data', items: [['supabase', 'Supabase'], ['postgresql', 'PostgreSQL'], ['firebase', 'Firebase'], ['mysql', 'MySQL']] },
    { group: 'Cloud & DevOps', items: [['microsoftazure', 'Azure'], ['cloudflare', 'Cloudflare'], ['docker', 'Docker'], ['githubactions', 'Actions'], ['linux', 'Linux'], ['git', 'Git']] },
    { group: 'Tools & payments', items: [['razorpay', 'Razorpay'], ['figma', 'Figma'], ['postman', 'Postman'], ['visualstudiocode', 'VS Code']] },
  ],
}

export const SERVICES = [
  { icon: 'smartphone', title: 'Mobile apps', time: '2–6 weeks', items: ['Flutter for iOS & Android', 'Multi-role auth · Firebase', 'Razorpay / Stripe payments', 'CI/CD · App Store + Play release'] },
  { icon: 'server', title: 'Backend APIs', time: '1–3 weeks', items: ['.NET Web API or Node.js', 'Auth · security alerting', 'Supabase or Firebase', 'Fully documented'] },
  { icon: 'sparkles', title: 'AI products', time: '1–4 weeks', items: ['RAG · AI agents', 'Multi-model: OpenAI + Claude', 'Behind Cloudflare AI Gateway', 'Cost-optimised'] },
  { icon: 'rocket', title: 'Full-stack MVPs', time: '3–8 weeks', items: ['Mobile + backend + AI + security', 'Deployed on Azure + Cloudflare', 'Monitoring from day one', 'Full source handoff'] },
]

export const WORKING_STYLE = ['Upfront scoping', 'Weekly deliverables', 'Full source on completion', 'Replies within 24 hours', 'No scope surprises']

export const CTA = {
  title: 'Let’s build something real.',
  body: 'If your team needs an engineer who ships end to end and owns the outcome, I’d love to hear about it.',
}
