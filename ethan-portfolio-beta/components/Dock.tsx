'use client'

import { ME } from '@/lib/data'

export default function Dock() {
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-2">
        {ME.links.map((l, i) => (
          <a key={i} href={l.href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            <span className="hidden sm:inline">{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
