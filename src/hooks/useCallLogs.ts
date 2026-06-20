import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { logActivity } from './useActivityLogs'
import type { CallLog } from '@/types'

export function useCallLogs(leadId: number | null) {
  return useQuery({
    queryKey: leadId ? queryKeys.callLogs(leadId) : ['call_logs', 'none'],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('lead_id', leadId as number)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CallLog[]
    },
  })
}

export interface AddCallLogInput {
  lead_id: number
  call_status: string
  remark?: string
  performed_by: string | null
}

export function useAddCallLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddCallLogInput) => {
      const { error } = await supabase.from('call_logs').insert({
        lead_id: input.lead_id,
        call_status: input.call_status,
        remark: input.remark ?? null,
        performed_by: input.performed_by,
      })
      if (error) throw error
      await logActivity({
        lead_id: input.lead_id,
        action: 'Call logged',
        performed_by: input.performed_by,
        notes: `${input.call_status}${input.remark ? ` — ${input.remark}` : ''}`,
      })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.callLogs(vars.lead_id) })
      qc.invalidateQueries({ queryKey: queryKeys.activity(vars.lead_id) })
      qc.invalidateQueries({ queryKey: queryKeys.recentActivity })
    },
  })
}
