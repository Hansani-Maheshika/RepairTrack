import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Pagination, RepairStatus } from '../types/domain'
import { label } from '../types/domain'

export const inputClass='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100'
export const buttonClass='inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50'
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>}
export function PageHeader({title,description,action}:{title:string;description?:string;action?:ReactNode}){return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold text-slate-950">{title}</h1>{description&&<p className="mt-2 text-slate-600">{description}</p>}</div>{action}</div>}
export function Loading(){return <Card><p className="animate-pulse text-slate-500">Loading…</p></Card>}
export function ErrorBox({message}:{message:string}){return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{message}</div>}
export function Empty({message}:{message:string}){return <Card><p className="py-8 text-center text-slate-500">{message}</p></Card>}
export function StatusBadge({status}:{status:RepairStatus}){const colour=status==='COLLECTED'||status==='COMPLETED'?'bg-emerald-100 text-emerald-800':status==='CANCELLED'||status==='REPAIR_REJECTED'?'bg-red-100 text-red-800':status==='READY_FOR_COLLECTION'?'bg-cyan-100 text-cyan-800':'bg-amber-100 text-amber-800';return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colour}`}>{label(status)}</span>}
export function PaginationBar({pagination,onPage}:{pagination:Pagination;onPage:(page:number)=>void}){if(pagination.pages<=1)return null;return <div className="mt-5 flex items-center justify-between text-sm"><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={pagination.page<=1} onClick={()=>onPage(pagination.page-1)}>Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={pagination.page>=pagination.pages} onClick={()=>onPage(pagination.page+1)}>Next</button></div>}
export function DetailLink({to,children}:{to:string;children:ReactNode}){return <Link className="font-medium text-cyan-700 hover:underline" to={to}>{children}</Link>}
