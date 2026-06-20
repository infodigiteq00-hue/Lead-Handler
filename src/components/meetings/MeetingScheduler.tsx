import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { useScheduleMeeting } from '@/hooks/useMeetings'
import { todayISO } from '@/lib/utils'

export function MeetingScheduler({
  open,
  onClose,
  leadId,
  onScheduled,
}: {
  open: boolean
  onClose: () => void
  leadId: number
  onScheduled?: () => void
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const { data: employees = [] } = useEmployees()
  const schedule = useScheduleMeeting()

  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState('10:00')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [notes, setNotes] = useState('')

  const effectiveAssignee = assignedTo || employee?.id || null

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await schedule.mutateAsync({
        lead_id: leadId,
        meeting_date: date,
        meeting_time: time,
        meeting_notes: notes.trim() || undefined,
        assigned_to: effectiveAssignee,
        performed_by: employee?.id ?? null,
      })
      toast('Meeting scheduled', 'success')
      setNotes('')
      onScheduled?.()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to schedule meeting', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule a meeting"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="meeting-form" loading={schedule.isPending}>
            Schedule
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
