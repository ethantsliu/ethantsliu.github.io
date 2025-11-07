import Hero from '@/components/Hero'
import ProjectCard from '@/components/ProjectCard'
import Dock from '@/components/Dock'
import { PROJECTS } from '@/lib/data'

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <Hero />
      <section className="relative bg-slate-950 py-16">
        <div className="container">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-white">Highlighted Projects</h2>
            <a href="#" className="text-sm text-white/70 hover:text-white">View all →</a>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((p) => (
              <ProjectCard key={p.title} project={p} />
            ))}
          </div>
        </div>
      </section>
      <Dock />
    </main>
  )
}
