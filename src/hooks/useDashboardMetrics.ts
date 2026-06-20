import { useQuery } from '@tanstack/react-query'
import { LEADS_TABLE, supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/utils'
import { queryKeys } from './queryKeys'

export interface DashboardMetrics {
  newLeads: number
  fresh: number
  pipeline: number
  meetingsToday: number
  activeDemos: number
  conversions: number
  lost: number
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics,
    refetchInterval: 60_000,
    queryFn: async (): Promise<DashboardMetrics> => {
      const today = todayISO()
      const headCount = { count: 'exact' as const, head: true }

      const [newLeads, fresh, pipeline, meetingsToday, activeDemos, conversions, lost] =
        await Promise.all([
          supabase.from(LEADS_TABLE).select('*', headCount).is('first_viewed_at', null),
          supabase
            .from(LEADS_TABLE)
            .select('*', headCount)
            .not('first_viewed_at', 'is', null)
            .eq('customer_status', 'Fresh')
            .neq('status', 'converted')
            .neq('status', 'lost'),
          supabase
            .from(LEADS_TABLE)
            .select('*', headCount)
            .eq('customer_status', 'In Pipeline')
            .neq('status', 'converted')
            .neq('status', 'lost'),
          supabase.from('meetings').select('*', headCount).eq('meeting_date', today),
          supabase.from('demo_trials').select('*', headCount).gte('expiry_date', today),
          supabase.from(LEADS_TABLE).select('*', headCount).eq('status', 'converted'),
          supabase.from(LEADS_TABLE).select('*', headCount).eq('status', 'lost'),
        ])

      const failed = [
        newLeads,
        fresh,
        pipeline,
        meetingsToday,
        activeDemos,
        conversions,
        lost,
      ].find((r) => r.error)
      if (failed?.error) throw failed.error

      return {
        newLeads: newLeads.count ?? 0,
        fresh: fresh.count ?? 0,
        pipeline: pipeline.count ?? 0,
        meetingsToday: meetingsToday.count ?? 0,
        activeDemos: activeDemos.count ?? 0,
        conversions: conversions.count ?? 0,
        lost: lost.count ?? 0,
      }
    },
  })
}
