import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LEADS_TABLE, supabase } from '@/lib/supabase'
import { createNotification } from '@/lib/notify'
import { queryKeys } from './queryKeys'
import { logActivity } from './useActivityLogs'
import { fmtDate, fmtTime } from '@/lib/utils'
import type { Meeting } from '@/types'

export function useMeetings() {
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('meeting_time', { ascending: true })
      if (error) throw error
      return (data ?? []) as Meeting[]
    },
  })
}

export interface ScheduleMeetingInput {
  lead_id: number
  meeting_date: string
  meeting_time: string
  meeting_notes?: string
  assigned_to: string | null
  performed_by: string | null
}

export function useScheduleMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ScheduleMeetingInput) => {
      const { error } = await supabase.from('meetings').insert({
        lead_id: input.lead_id,
        meeting_date: input.meeting_date,
        meeting_time: input.meeting_time,
        meeting_notes: input.meeting_notes ?? null,
        assigned_to: input.assigned_to,
        status: 'Scheduled',
      })
      if (error) throw error

      await supabase
        .from(LEADS_TABLE)
        .update({ customer_status: 'Meeting Scheduled' })
        .eq('id', input.lead_id)

      await logActivity({
        lead_id: input.lead_id,
        action: 'Meeting scheduled',
        performed_by: input.performed_by,
        notes: `${fmtDate(input.meeting_date)} at ${fmtTime(input.meeting_time)}`,
      })

      await createNotification({
        employee_id: input.assigned_to,
        title: 'Meeting scheduled',
        message: `Meeting on ${fmtDate(input.meeting_date)} at ${fmtTime(input.meeting_time)}`,
        type: 'meeting',
        scheduled_for: `${input.meeting_date}T${input.meeting_time}`,
        lead_id: input.lead_id,
      })
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings })
      qc.invalidateQueries({ queryKey: queryKeys.leads })
      qc.invalidateQueries({ queryKey: queryKeys.metrics })
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.activity(v.lead_id) })
    },
  })
}

export interface RescheduleMeetingInput {
  id: string
  lead_id: number
  meeting_date: string
  meeting_time: string
  meeting_notes?: string | null
  assigned_to: string | null
  performed_by: string | null
}

/** Updates an existing meeting's date/time and resets it to Scheduled. */
export function useRescheduleMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RescheduleMeetingInput) => {
      const { error } = await supabase
        .from('meetings')
        .update({
          meeting_date: input.meeting_date,
          meeting_time: input.meeting_time,
          meeting_notes: input.meeting_notes ?? null,
          assigned_to: input.assigned_to,
          status: 'Scheduled',
        })
        .eq('id', input.id)
      if (error) throw error

      await supabase
        .from(LEADS_TABLE)
        .update({ customer_status: 'Meeting Scheduled' })
        .eq('id', input.lead_id)

      await logActivity({
        lead_id: input.lead_id,
        action: 'Meeting rescheduled',
        performed_by: input.performed_by,
        notes: `${fmtDate(input.meeting_date)} at ${fmtTime(input.meeting_time)}`,
      })

      await createNotification({
        employee_id: input.assigned_to,
        title: 'Meeting rescheduled',
        message: `Meeting moved to ${fmtDate(input.meeting_date)} at ${fmtTime(input.meeting_time)}`,
        type: 'meeting',
        scheduled_for: `${input.meeting_date}T${input.meeting_time}`,
        lead_id: input.lead_id,
      })
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings })
      qc.invalidateQueries({ queryKey: queryKeys.leads })
      qc.invalidateQueries({ queryKey: queryKeys.metrics })
      qc.invalidateQueries({ queryKey: queryKeys.notifications })
      qc.invalidateQueries({ queryKey: queryKeys.activity(v.lead_id) })
    },
  })
}

export interface UpdateMeetingInput {
  id: string
  lead_id: number
  patch: Partial<Meeting>
  performed_by?: string | null
}

export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateMeetingInput) => {
      const { error } = await supabase
        .from('meetings')
        .update(input.patch)
        .eq('id', input.id)
      if (error) throw error
      if (input.patch.status) {
        await logActivity({
          lead_id: input.lead_id,
          action: `Meeting: ${input.patch.status}`,
          performed_by: input.performed_by ?? null,
        })
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetings })
      qc.invalidateQueries({ queryKey: queryKeys.metrics })
      qc.invalidateQueries({ queryKey: queryKeys.activity(v.lead_id) })
    },
  })
}
