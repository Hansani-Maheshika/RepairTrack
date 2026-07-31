import { ArrowRight, ShieldCheck, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'

export function HomePage() {
  return <main className="min-h-screen bg-slate-950 text-white">
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link className="flex items-center gap-2 text-xl font-bold" to="/"><span className="rounded-xl bg-cyan-400 p-2 text-slate-950"><Wrench size={20} /></span>RepairTrack</Link>
      <div className="flex items-center gap-3"><Link className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white" to="/track">Track repair</Link><Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-100" to="/login">Staff login</Link></div>
    </nav>
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
      <div><p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Device repair management</p><h1 className="text-5xl font-bold leading-tight sm:text-6xl">Repairs organised from intake to collection.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Register customers and devices, assign technicians, update repair progress, and keep customers informed.</p><div className="mt-8 flex flex-wrap gap-4"><Link className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300" to="/track">Track your repair <ArrowRight size={18} /></Link><Link className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:border-slate-500" to="/login">Open staff portal</Link></div></div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/40"><ShieldCheck className="text-cyan-400" size={42} /><h2 className="mt-5 text-2xl font-semibold">A clear repair workflow</h2><p className="mt-3 leading-7 text-slate-400">Staff access is protected by role, while customers can safely check public repair progress.</p></div>
    </section>
  </main>
}
