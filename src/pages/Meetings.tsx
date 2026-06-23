import { useMemo, useState } from 'react'
import { CalendarClock, CalendarCog, Clock } from 'lucide-react'
import type { Lead, Meeting } from '@/types'
import { MEETING_STATUSES } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Field'
import { StatusBadge } from '@/components/StatusBadge'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler'
import { useMeetings, useUpdateMeeting } from '@/hooks/useMeetings'
import { useLeads } from '@/hooks/useLeads'
import { useEmployeeMap, employeeName } from '@/hooks/useEmployees'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { fmtDate, fmtTime, todayISO } from '@/lib/utils'

function MeetingRowItem({
  meeting,
  leadMap,
  onOpenLead,
  onReschedule,
}: {
  meeting: Meeting
  leadMap: Record<number, Lead>
  onOpenLead: (id: number) => void
  onReschedule: (meeting: Meeting) => void
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const employeeMap = useEmployeeMap()
  const updateMeeting = useUpdateMeeting()
  const lead = leadMap[meeting.lead_id]

  const onStatus = async (status: string) => {
    // Picking "Rescheduled" should immediately prompt for a new date/time
    // rather than silently flagging it.
    if (status === 'Rescheduled') {
      onReschedule(meeting)
      return
    }
    try {
      await updateMeeting.mutateAsync({
        id: meeting.id,
        lead_id: meeting.lead_id,
        patch: { status },
        performed_by: employee?.id ?? null,
      })
      toast('Meeting updated', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => onOpenLead(meeting.lead_id)}
        className="min-w-0 text-left"
      >
        <div className="truncate font-medium text-slate-900 hover:underline dark:text-slate-100">
          {lead?.customer_name || `Lead #${meeting.lead_id}`}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {fmtDate(meeting.meeting_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtTime(meeting.meeting_time)}
          </span>
          <span>· {employeeName(employeeMap, meeting.assigned_to)}</span>
        </div>
        {meeting.meeting_notes && (
          <div className="mt-1 truncate text-xs text-slate-400">{meeting.meeting_notes}</div>
        )}
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge value={meeting.status} />
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReschedule(meeting)}
          title="Reschedule"
        >
          <CalendarCog className="h-4 w-4" />
          Reschedule
        </Button>
        <Select
          className="h-8 w-auto py-0 text-xs"
          value={meeting.status}
          onChange={(e) => onStatus(e.target.value)}
          disabled={updateMeeting.isPending}
        >
          {MEETING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

export default function Meetings() {
  const { data: meetings = [], isLoading } = useMeetings()
  const { data: leads = [] } = useLeads({ scope: 'all' })
  const [activeId, setActiveId] = useState<number | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Meeting | null>(null)

  const leadMap = useMemo(() => {
    const map: Record<number, Lead> = {}
    for (const l of leads) map[l.id] = l
    return map
  }, [leads])

  const today = todayISO()
  const { upcoming, past } = useMemo(() => {
    const up: Meeting[] = []
    const pa: Meeting[] = []
    for (const m of meetings) {
      if (m.meeting_date >= today && m.status === 'Scheduled') up.push(m)
      else pa.push(m)
    }
    return { upcoming: up, past: pa }
  }, [meetings, today])

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Scheduled meetings with reminders 15 and 5 minutes before"
      />

      {isLoading ? (
        <LoadingState label="Loading meetings…" />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No meetings scheduled"
          description="Schedule a meeting from a lead to see it here."
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming" subtitle={`${upcoming.length} scheduled`} />
            {upcoming.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {upcoming.map((m) => (
                  <MeetingRowItem
                    key={m.id}
                    meeting={m}
                    leadMap={leadMap}
                    onOpenLead={setActiveId}
                    onReschedule={setRescheduleTarget}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                No upcoming meetings.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="History" subtitle={`${past.length} past or closed`} />
            {past.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {past.map((m) => (
                  <MeetingRowItem
                    key={m.id}
                    meeting={m}
                    leadMap={leadMap}
                    onOpenLead={setActiveId}
                    onReschedule={setRescheduleTarget}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No history yet.</p>
            )}
          </Card>
        </div>
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
      {rescheduleTarget && (
        <MeetingScheduler
          open={!!rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          leadId={rescheduleTarget.lead_id}
          meeting={rescheduleTarget}
        />
      )}
    </div>
  )
}
