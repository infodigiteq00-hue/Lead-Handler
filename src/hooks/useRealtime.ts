import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LEADS_TABLE, supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'

/**
 * Subscribes to Supabase Realtime and invalidates the relevant React Query
 * caches whenever a row changes — so every open dashboard stays live.
 */
export function useRealtimeSync() {
  const qc = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('crm-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: LEADS_TABLE },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.leads })
          qc.invalidateQueries({ queryKey: queryKeys.metrics })
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, () => {
        qc.invalidateQueries({ queryKey: ['call_logs'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.meetings })
        qc.invalidateQueries({ queryKey: queryKeys.metrics })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demo_trials' }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.demoTrials })
        qc.invalidateQueries({ queryKey: queryKeys.metrics })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        qc.invalidateQueries({ queryKey: ['activity_logs'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.notifications })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
