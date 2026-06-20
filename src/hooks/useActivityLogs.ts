import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import type { ActivityLog } from '@/types'

/** Fire-and-forget activity logging used by other mutations. */
export async function logActivity(input: {
  lead_id: number | null
  action: string
  performed_by?: string | null
  notes?: string | null
}) {
  const { error } = await supabase.from('activity_logs').insert({
    lead_id: input.lead_id,
    action: input.action,
    performed_by: input.performed_by ?? null,
    notes: input.notes ?? null,
  })
  if (error) console.error('Failed to log activity:', error.message)
}

export function useActivityLog(leadId: number | null) {
  return useQuery({
    queryKey: leadId ? queryKeys.activity(leadId) : ['activity_logs', 'none'],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('lead_id', leadId as number)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ActivityLog[]
    },
  })
}

export function useRecentActivity(limit = 12) {
  return useQuery({
    queryKey: queryKeys.recentActivity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as ActivityLog[]
    },
  })
}
