import { Link } from 'react-router-dom'

export function MessagePage({ title, message }: { title: string; message: string }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="text-center"><h1 className="text-3xl font-bold text-slate-950">{title}</h1><p className="mt-3 text-slate-600">{message}</p><Link className="mt-6 inline-block font-medium text-cyan-700 hover:underline" to="/">Return home</Link></div></main>
}
