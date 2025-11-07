'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { ME } from '@/lib/data'

function useMouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
    }
    el.addEventListener('mousemove', move)
    return () => el.removeEventListener('mousemove', move)
  }, [])
  return ref
}

export default function Hero() {
  const ref = useMouseSpotlight()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <section
      ref={ref}
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    >
      <motion.div style={{ y }} className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full blur-3xl opacity-20" aria-hidden>
        <div className="h-full w-full rounded-full bg-violet-500/30" />
      </motion.div>
      <motion.div style={{ y }} className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20" aria-hidden>
        <div className="h-full w-full rounded-full bg-cyan-500/30" />
      </motion.div>

      <div className="absolute inset-0 spotlight" aria-hidden />

      <div className="relative z-10 max-w-4xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <span className="size-2 rounded-full bg-emerald-400" />
          Available for research collabs
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">{ME.name}</h1>
        <p className="mt-3 text-lg text-white/80">{ME.tagline}</p>
        <p className="mt-5 text-white/70">{ME.blurb}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {ME.links.map((l, i) => (
            <a key={i} href={l.href} className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="soft-grid pointer-events-none absolute inset-0" />
    </section>
  )
}
