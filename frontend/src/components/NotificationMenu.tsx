import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery } from '../hooks/useApiQuery'
import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'
import type { Notification } from '../types/business'

export function NotificationMenu() {
  const [open,setOpen]=useState(false)
  const navigate=useNavigate()
  const q=useApiQuery(async()=>{const{data}=await api.get<ApiResponse<{notifications:Notification[]}>>('/notifications');return data.data.notifications},[])
  const unread=q.data?.filter((notification)=>!notification.readAt).length??0
  async function openNotification(notification:Notification){if(!notification.readAt)await api.patch(`/notifications/${notification.id}/read`);await q.reload();setOpen(false);if(notification.repairJobId)navigate(`/repairs/${notification.repairJobId}`)}
  return <div className="fixed right-5 top-4 z-40">
    <button aria-label="Notifications" className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:text-cyan-700" onClick={()=>setOpen(!open)}><Bell size={20}/>{unread>0&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">{unread}</span>}</button>
    {open&&<div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h3 className="font-bold">Notifications</h3><p className="text-xs text-slate-500">{unread} unread update{unread===1?'':'s'}</p></div><CheckCheck className="text-cyan-600" size={20}/></div><div className="max-h-[28rem] overflow-y-auto">{q.data?.length?q.data.map((notification)=><button key={notification.id} onClick={()=>void openNotification(notification)} className={`group flex w-full gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${notification.readAt?'bg-white':'bg-cyan-50/70'}`}><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt?'bg-slate-200':'bg-cyan-500'}`}/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{notification.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{notification.message}</span><span className="mt-2 block text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span></span>{notification.repairJobId&&<ExternalLink className="mt-1 text-slate-300 group-hover:text-cyan-600" size={16}/>}</button>):<p className="p-8 text-center text-sm text-slate-500">You have no notifications yet.</p>}</div></div>}
  </div>
}
