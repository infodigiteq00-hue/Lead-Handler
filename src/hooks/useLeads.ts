import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LEADS_TABLE, supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import { logActivity } from './useActivityLogs'
import type { Lead } from '@/types'

export type LeadScope = 'new' | 'fresh' | 'pipeline' | 'converted' | 'lost' | 'all'

export interface LeadQueryOptions {
  scope?: LeadScope
  search?: string
  assignedTo?: string | 'all'
}

function sanitize(term: string): string {
  return term.replace(/[,()%*]/g, ' ').trim()
}

export function useLeads(options: LeadQueryOptions = {}) {
  const { scope = 'all', search = '', assignedTo = 'all' } = options
  return useQuery({
    queryKey: [...queryKeys.leads, scope, search, assignedTo],
    queryFn: async () => {
      let q = supabase.from(LEADS_TABLE).select('*')

      switch (scope) {
        case 'new':
          q = q.is('first_viewed_at', null)
          break
        case 'fresh':
          q = q
            .not('first_viewed_at', 'is', null)
            .eq('customer_status', 'Fresh')
            .neq('status', 'converted')
            .neq('status', 'lost')
          break
        case 'pipeline':
          q = q
            .eq('customer_status', 'In Pipeline')
            .neq('status', 'converted')
            .neq('status', 'lost')
          break
        case 'converted':
          q = q.eq('status', 'converted')
          break
        case 'lost':
          q = q.eq('status', 'lost')
          break
        case 'all':
        default:
          break
      }

      if (assignedTo !== 'all') q = q.eq('assigned_to', assignedTo)

      const term = sanitize(search)
      if (term) {
        q = q.or(
          `customer_name.ilike.%${term}%,company_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
        )
      }

      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Lead[]
    },
  })
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: id ? queryKeys.lead(id) : ['leads', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LEADS_TABLE)
        .select('*')
        .eq('id', id as number)
        .single()
      if (error) throw error
      return data as Lead
    },
  })
}

function useInvalidateLeads() {
  const qc = useQueryClient()
  return (leadId?: number) => {
    qc.invalidateQueries({ queryKey: queryKeys.leads })
    qc.invalidateQueries({ queryKey: queryKeys.metrics })
    qc.invalidateQueries({ queryKey: queryKeys.recentActivity })
    if (leadId) {
      qc.invalidateQueries({ queryKey: queryKeys.lead(leadId) })
      qc.invalidateQueries({ queryKey: queryKeys.activity(leadId) })
    }
  }
}

/** Records first_viewed_at/by exactly once (guarded by the is-null filter). */
export function useMarkLeadViewed() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: async (input: { lead_id: number; employee_id: string | null }) => {
      const { error } = await supabase
        .from(LEADS_TABLE)
        .update({
          first_viewed_at: new Date().toISOString(),
          first_viewed_by: input.employee_id,
          status: 'open',
        })
        .eq('id', input.lead_id)
        .is('first_viewed_at', null)
      if (error) throw error
      await logActivity({
        lead_id: input.lead_id,
        action: 'Viewed',
        performed_by: input.employee_id,
      })
    },
    onSuccess: (_d, v) => invalidate(v.lead_id),
  })
}

export interface UpdateLeadInput {
  lead_id: number
  patch: Partial<Lead>
  activity?: { action: string; performed_by?: string | null; notes?: string | null }
}

export function useUpdateLead() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: async (input: UpdateLeadInput) => {
      const { error } = await supabase
        .from(LEADS_TABLE)
        .update(input.patch)
        .eq('id', input.lead_id)
      if (error) throw error
      if (input.activity) {
        await logActivity({ lead_id: input.lead_id, ...input.activity })
      }
    },
    onSuccess: (_d, v) => invalidate(v.lead_id),
  })
}

export function useSetLeadOutcome() {
  const invalidate = useInvalidateLeads()
  return useMutation({
    mutationFn: async (input: {
      lead_id: number
      outcome: 'converted' | 'lost'
      performed_by: string | null
    }) => {
      const { error } = await supabase
        .from(LEADS_TABLE)
        .update({ status: input.outcome })
        .eq('id', input.lead_id)
      if (error) throw error
      await logActivity({
        lead_id: input.lead_id,
        action: input.outcome === 'converted' ? 'Marked Converted' : 'Marked Lost',
        performed_by: input.performed_by,
      })
    },
    onSuccess: (_d, v) => invalidate(v.lead_id),
  })
}
