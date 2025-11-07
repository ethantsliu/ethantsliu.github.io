export const ME = {
  name: 'Ethan T. S. Liu',
  tagline: 'AI/ML • Systems • Evaluation',
  blurb:
    'I build grounded AI evaluation frameworks, security benchmarks, and delightful tools. Previously: AMD, AfterQuery (YC). UC Berkeley EECS.',
  links: [
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/' },
    { label: 'Email', href: 'mailto:hello@example.com' },
  ],
} as const

export type Project = {
  title: string
  blurb: string
  tags: string[]
  href: string
  media: { type: 'image' | 'video'; src?: string; poster?: string }
}

export const PROJECTS: Project[] = [
  {
    title: 'VADER: Security Benchmark',
    blurb:
      'Human-evaluated vulnerability assessment benchmark across 15+ languages; severity-weighted scoring and multi-file repos.',
    tags: ['Benchmark', 'Security', 'LLM eval'],
    href: '#',
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop',
    },
  },
  {
    title: 'CLI Arena',
    blurb:
      'A ChatbotArena-style leaderboard for CLI agents with reproducible tasks and traces.',
    tags: ['Agents', 'Leaderboard', 'CLI'],
    href: '#',
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop',
    },
  },
  {
    title: 'DocQA Retrieval Eval',
    blurb:
      'Professional-services retrieval evaluation with domain-grounded scoring and adversarial cases.',
    tags: ['RAG', 'Evaluation'],
    href: '#',
    media: {
      type: 'image',
      src: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    },
  },
]
