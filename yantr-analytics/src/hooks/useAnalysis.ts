import { useState, useCallback, useRef } from 'react'
import { analyzeChannel } from '../api/client'
import type { FullAnalysis } from '../types'
import toast from 'react-hot-toast'

type Phase = 'idle' | 'loading' | 'success' | 'error'

export function useAnalysis() {
  const [data, setData] = useState<FullAnalysis | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const inFlightHandleRef = useRef<string | null>(null)
  const requestSeqRef = useRef(0)

  const run = useCallback(async (handle: string) => {
    if (inFlightHandleRef.current === handle) {
      return
    }

    const requestId = ++requestSeqRef.current
    inFlightHandleRef.current = handle
    setPhase('loading')
    setError(null)
    setData(null)

    try {
      const res = await analyzeChannel(handle)
      if (requestId !== requestSeqRef.current) {
        return
      }
      setData(res.data)
      setPhase('success')
      if (res.data.cached) {
        toast.success('Loaded from cache (instant!)')
      } else {
        toast.success('Analysis complete!')
      }
    } catch (err: unknown) {
      if (requestId !== requestSeqRef.current) {
        return
      }
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ||
        (err as { message?: string })?.message ||
        'Analysis failed'
      setError(msg)
      setPhase('error')
    } finally {
      if (requestId === requestSeqRef.current) {
        inFlightHandleRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setPhase('idle')
    setError(null)
  }, [])

  return { data, phase, error, run, reset, loading: phase === 'loading' }
}
