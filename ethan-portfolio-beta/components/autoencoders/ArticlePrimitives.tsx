import { ReactNode } from 'react'

export function ArticleShell({ children, toc }: { children: ReactNode; toc: { id: string; label: string }[] }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.10),transparent_30%),linear-gradient(to_bottom,rgba(15,23,42,1),rgba(2,6,23,1))]" />
      <div className="relative mx-auto max-w-[1400px] px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">{children}</article>
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Contents</p>
              <nav className="space-y-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export function HeroHeader() {
  return (
    <header className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-12">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100/80">
        Interactive Essay
      </div>
      <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
        Autoencoders: The Geometry of Compression
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
        From bottlenecks and sparse features to VAEs, diffusion models, and latent representations.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Next.js + React</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Tailwind CSS</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Framer Motion</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Interactive synthetic demos</span>
      </div>
    </header>
  )
}

export function Section({
  id,
  title,
  children,
  wide = false,
}: {
  id: string
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <section id={id} className={`scroll-mt-10 ${wide ? '' : 'max-w-4xl'} mb-12`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent" />
        <a href={`#${id}`} className="text-xs uppercase tracking-[0.24em] text-cyan-200/70 hover:text-cyan-100">
          Jump Link
        </a>
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <div className="mt-6 space-y-5 text-[1.04rem] leading-8 text-slate-300 [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-slate-100 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_p]:max-w-4xl [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  )
}

export function Equation({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-4 text-center text-lg text-cyan-50 shadow-inner shadow-cyan-950/20">
      {children}
    </div>
  )
}

export function Callout({
  title,
  tone = 'cyan',
  children,
}: {
  title: string
  tone?: 'cyan' | 'amber' | 'rose' | 'emerald'
  children: ReactNode
}) {
  const tones = {
    cyan: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50',
    amber: 'border-amber-300/20 bg-amber-300/10 text-amber-50',
    rose: 'border-rose-300/20 bg-rose-300/10 text-rose-50',
    emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-50',
  }

  return (
    <div className={`rounded-2xl border p-5 backdrop-blur ${tones[tone]}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]">{title}</p>
      <div className="text-sm leading-7 text-inherit/90">{children}</div>
    </div>
  )
}

export function DemoCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-slate-950/40">
      <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Interactive Demo</p>
        <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}

export function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-slate-200">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-300">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95">
      <div className="border-b border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
        {language}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-7 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}

