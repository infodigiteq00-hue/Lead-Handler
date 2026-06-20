import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LEADS_TABLE, supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notify'
import { todayISO } from '@/lib/utils'
import { queryKeys } from './queryKeys'
import { logActivity } from './useActivityLogs'
import type { DemoTrial } from '@/types'

export function useDemoTrials() {
  return useQuery({
    queryKey: queryKeys.demoTrials,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_trials')
        .select('*')
        .order('expiry_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as DemoTrial[]
    },
  })
}

export interface StartDemoInput {
  lead_id: number
  assigned_to: string | null
  performed_by: string | null
  start_date?: string
  notes?: string
}

export function useStartDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: StartDemoInput) => {
      const start = input.start_date ?? todayISO()
      const { error } = await supabase.from('demo_trials').insert({
        lead_id: input.lead_id,
        start_date: start,
        assigned_to: input.assigned_to,
        notes: input.notes ?? null,
        interest_status: 'Decision Pending',
      })
      if (error) throw error

      await supabase
        .from(LEADS_TABLE)
        .update({ customer_status: 'Demo Started' })
        .eq('id', input.lead_id)

      await logActivity({
        lead_id: input.lead_id,
        action: 'Demo started',
        performed_by: input.performed_by,
        notes: `10-day trial from ${start}`,
      })

      await createNotification({
        employee_id: input.assigned_to,
        title: 'Demo trial started',
        message: `A 10-day demo trial started on ${start}.`,
        type: 'trial',
        lead_id: input.lead_id,
      })
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.demoTrials })
      qc.invalidateQueries({ queryKey: queryKeys.leads })
      qc.invalidateQueries({ queryKey: queryKeys.metrics })
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.activity(v.lead_id) })
    },
  })
}

export interface UpdateDemoInput {
  id: string
  lead_id: number
  patch: Partial<DemoTrial>
  performed_by?: string | null
}

export function useUpdateDemoTrial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateDemoInput) => {
      const { error } = await supabase
        .from('demo_trials')
        .update(input.patch)
        .eq('id', input.id)
      if (error) throw error

      // Propagate terminal interest states to the lead's outcome.
      if (input.patch.interest_status === 'Converted') {
        await supabase.from(LEADS_TABLE).update({ status: 'converted' }).eq('id', input.lead_id)
      } else if (input.patch.interest_status === 'Not Interested') {
        await supabase.from(LEADS_TABLE).update({ status: 'lost' }).eq('id', input.lead_id)
      }

      if (input.patch.interest_status) {
        await logActivity({
          lead_id: input.lead_id,
          action: `Demo: ${input.patch.interest_status}`,
          performed_by: input.performed_by ?? null,
        })
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.demoTrials })
      qc.invalidateQueries({ queryKey: queryKeys.leads })
      qc.invalidateQueries({ queryKey: queryKeys.metrics })
      qc.invalidateQueries({ queryKey: queryKeys.activity(v.lead_id) })
    },
  })
}
