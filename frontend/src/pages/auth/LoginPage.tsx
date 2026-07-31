import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, Wrench } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../context/authContextValue'
import { getApiErrorMessage } from '../../lib/api'
import { roleHome } from '../../utils/roleHome'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
})
type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  useEffect(() => { if (user) navigate(roleHome(user.role), { replace: true }) }, [user, navigate])

  async function submit(values: LoginValues) {
    try {
      const loggedInUser = await login(values.email, values.password)
      toast.success(`Welcome, ${loggedInUser.fullName}`)
      const requested = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(requested ?? roleHome(loggedInUser.role), { replace: true })
    } catch (error) { toast.error(getApiErrorMessage(error)) }
  }

  return <main className="grid min-h-screen bg-slate-100 lg:grid-cols-2">
    <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"><Link className="flex items-center gap-3 text-xl font-bold" to="/"><span className="rounded-xl bg-cyan-400 p-2 text-slate-950"><Wrench /></span>RepairTrack</Link><div><LockKeyhole className="text-cyan-400" size={48} /><h1 className="mt-6 max-w-lg text-5xl font-bold leading-tight">Secure access for every repair team role.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-slate-400">Administrators, receptionists, and technicians receive the tools allowed for their work.</p></div><p className="text-sm text-slate-500">RepairTrack staff portal</p></section>
    <section className="flex items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200"><Link className="mb-8 flex items-center gap-2 text-lg font-bold lg:hidden" to="/"><Wrench className="text-cyan-600" />RepairTrack</Link><h2 className="text-3xl font-bold text-slate-950">Staff login</h2><p className="mt-2 text-slate-600">Enter your RepairTrack account details.</p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Email address</span><input className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" type="email" autoComplete="email" {...register('email')} />{errors.email && <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>}</label>
        <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Password</span><input className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" type="password" autoComplete="current-password" {...register('password')} />{errors.password && <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>}</label>
        <button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form><Link className="mt-6 block text-center text-sm text-cyan-700 hover:underline" to="/">Return to home page</Link></div></section>
  </main>
}
