'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { Project } from '@/lib/data'

export default function ProjectCard({ project }: { project: Project }) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href={project.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition-transform hover:-translate-y-1 hover:bg-white/[0.07]"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {project.media.type === 'image' && (
          <img src={project.media.src} alt="preview" className="h-full w-full object-cover" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent" />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{project.title}</h3>
          <ExternalLink size={16} className="text-white/50 group-hover:text-white/80" />
        </div>
        <p className="mt-1 text-sm text-white/70">{project.blurb}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}
