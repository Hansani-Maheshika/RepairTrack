import {
  ArrowRight,
  Search,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import repairTechnicianHero from "../../assets/repair-technician-hero.png";

export function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6">
          <Link className="flex items-center gap-3 text-xl font-bold" to="/">
            <span className="rounded-xl bg-cyan-400 p-2 text-slate-950">
              <Wrench size={20} />
            </span>
            RepairTrack
          </Link>
          <div className="flex items-center gap-2">
            <Link
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:px-4"
              to="/login"
            >
              Staff login
            </Link>
            <Link
              className="hidden rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 sm:block"
              to="/track"
            >
              Track repair
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-400">
              Repair status portal
            </p>
            <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[1.06] tracking-tight sm:text-6xl">
              Your repair, clearly tracked.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Check progress, review quotations and view your final invoice.
            </p>
            <Link
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300"
              to="/track"
            >
              <Search size={19} />
              Track my repair
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-cyan-950/30">
            <img
              src={repairTechnicianHero}
              alt="Technician repairing a laptop at a professional workbench"
              className="h-auto w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 RepairTrack</span>
          <span>Repair management made simple.</span>
        </div>
      </footer>
    </main>
  );
}
