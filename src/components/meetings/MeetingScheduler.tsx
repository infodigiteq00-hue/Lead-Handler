import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { useRescheduleMeeting, useScheduleMeeting } from '@/hooks/useMeetings'
import { todayISO } from '@/lib/utils'
import type { Meeting } from '@/types'

export function MeetingScheduler({
  open,
  onClose,
  leadId,
  onScheduled,
  meeting,
}: {
  open: boolean
  onClose: () => void
  leadId: number
  onScheduled?: () => void
  /** When provided, the dialog reschedules this existing meeting instead of creating one. */
  meeting?: Meeting | null
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const { data: employees = [] } = useEmployees()
  const schedule = useScheduleMeeting()
  const reschedule = useRescheduleMeeting()

  const isReschedule = !!meeting

  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('10:00')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [notes, setNotes] = useState('')

  // Pre-fill from the existing meeting (reschedule) or reset (new) each open.
  useEffect(() => {
    if (!open) return
    if (meeting) {
      setDate(meeting.meeting_date)
      setTime(meeting.meeting_time?.slice(0, 5) || '10:00')
      setAssignedTo(meeting.assigned_to ?? '')
      setNotes(meeting.meeting_notes ?? '')
    } else {
      setDate(todayISO())
      setTime('10:00')
      setAssignedTo('')
      setNotes('')
    }
  }, [open, meeting])

  const effectiveAssignee = assignedTo || employee?.id || null
  const pending = schedule.isPending || reschedule.isPending

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (isReschedule && meeting) {
        await reschedule.mutateAsync({
          id: meeting.id,
          lead_id: leadId,
          meeting_date: date,
          meeting_time: time,
          meeting_notes: notes.trim() || null,
          assigned_to: effectiveAssignee,
          performed_by: employee?.id ?? null,
        })
        toast('Meeting rescheduled', 'success')
      } else {
        await schedule.mutateAsync({
          lead_id: leadId,
          meeting_date: date,
          meeting_time: time,
          meeting_notes: notes.trim() || undefined,
          assigned_to: effectiveAssignee,
          performed_by: employee?.id ?? null,
        })
        toast('Meeting scheduled', 'success')
      }
      setNotes('')
      onScheduled?.()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save meeting', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReschedule ? 'Reschedule meeting' : 'Schedule a meeting'}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="meeting-form" loading={pending}>
            {isReschedule ? 'Reschedule' : 'Schedule'}
          </Button>
        </>
      }
    >
      <form id="meeting-form" onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" htmlFor="meeting-date">
            <Input
              id="meeting-date"
              type="date"
              required
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField label="Time" htmlFor="meeting-time">
            <Input
              id="meeting-time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Assign to" htmlFor="meeting-assignee">
          <Select
            id="meeting-assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">{employee ? `Me (${employee.name})` : 'Me'}</option>
            {employees
              .filter((emp) => emp.id !== employee?.id)
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
          </Select>
        </FormField>
        <FormField label="Notes" htmlFor="meeting-notes" hint="Optional agenda or context">
          <Textarea
            id="meeting-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agenda, location, links…"
          />
        </FormField>
      </form>
    </Modal>
  )
}
