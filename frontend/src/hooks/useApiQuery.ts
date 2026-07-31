import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../lib/api'

export function useApiQuery<T>(loader:()=>Promise<T>, dependencies:unknown[]) {
  const [data,setData]=useState<T|null>(null)
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(true)
  const loaderRef=useRef(loader)
  loaderRef.current=loader
  const dependencyKey=JSON.stringify(dependencies)
  const reload=useCallback(()=>{
    // Reading this key intentionally invalidates the request when query inputs change.
    void dependencyKey
    setLoading(true)
    setError('')
    return loaderRef.current().then(setData).catch((e)=>setError(getApiErrorMessage(e))).finally(()=>setLoading(false))
  },[dependencyKey])
  useEffect(()=>{void reload()},[reload])
  return{data,error,loading,reload}
}
