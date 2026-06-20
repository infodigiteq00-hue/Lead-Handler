import { useEffect, useState, type FormEvent } from 'react'
import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  MonitorPlay,
  Pencil,
  Phone,
  PhoneCall,
  Tag,
  UserCog,
  Video,
  X,
  XCircle,
} from 'lucide-react'
import { CUSTOMER_STATUSES } from '@/types'
import { CenterDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea } from '@/components/ui/Field'
import { LoadingState } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { StatusBadge } from '@/components/StatusBadge'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { CallLogModal } from '@/components/leads/CallLogModal'
import { MeetShareDialog } from '@/components/leads/MeetShareDialog'
import { MeetingScheduler } from '@/components/meetings/MeetingScheduler'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployeeMap, useEmployees } from '@/hooks/useEmployees'
import { useActivityLog } from '@/hooks/useActivityLogs'
import { useLead, useSetLeadOutcome, useUpdateLead } from '@/hooks/useLeads'
import { useStartDemo } from '@/hooks/useDemoTrials'

function Detail({
  icon: Icon,
  children,
}: {
  icon: typeof Phone
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

export function LeadDrawer({
  leadId,
  open,
  onClose,
}: {
  leadId: number | null
  open: boolean
  onClose: () => void
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const employeeMap = useEmployeeMap()
  const { data: employees = [] } = useEmployees()
  const { data: lead, isLoading } = useLead(leadId)
  const { data: activity = [] } = useActivityLog(leadId)

  const updateLead = useUpdateLead()
  const setOutcome = useSetLeadOutcome()
  const startDemo = useStartDemo()

  const [showCall, setShowCall] = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [showMeet, setShowMeet] = useState(false)
  const [othersNote, setOthersNote] = useState('')
  const [showOthersNote, setShowOthersNote] = useState(false)

  // Inline edit of the lead's name + company info.
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    company_details: '',
  })

  // Reset the edit form whenever a different lead loads or the panel reopens.
  useEffect(() => {
    if (lead) {
      setForm({
        customer_name: lead.customer_name ?? '',
        company_name: lead.company_name ?? '',
        company_details: lead.company_details ?? '',
      })
    }
    setEditing(false)
  }, [lead?.id, open])

  const saveDetails = async (e: FormEvent) => {
    e.preventDefault()
    if (!lead) return
    const name = form.customer_name.trim()
    if (!name) {
      toast('Customer name cannot be empty', 'error')
      return
    }
    try {
      await updateLead.mutateAsync({
        lead_id: lead.id,
        patch: {
          customer_name: name,
          company_name: form.company_name.trim() || null,
          company_details: form.company_details.trim() || null,
        },
        activity: {
          action: 'Details updated',
          performed_by: employee?.id ?? null,
        },
      })
      toast('Lead details saved', 'success')
      setEditing(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  const handleStatusChange = async (next: string) => {
    if (!lead) return
    if (next === lead.customer_status) return

    if (next === 'Meeting Scheduled') {
      setShowMeeting(true)
      return
    }
    if (next === 'Demo Started') {
      await handleStartDemo()
      return
    }
    if (next === 'Others') {
      setShowOthersNote(true)
      return
    }
    // Fresh / In Pipeline — direct update.
    try {
      await updateLead.mutateAsync({
        lead_id: lead.id,
        patch: { customer_status: next },
        activity: {
          action: `Status → ${next}`,
          performed_by: employee?.id ?? null,
        },
      })
      toast(`Moved to ${next}`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  const submitOthersNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!lead) return
    try {
      await updateLead.mutateAsync({
        lead_id: lead.id,
        patch: { customer_status: 'Others' },
        activity: {
          action: 'Status → Others',
          performed_by: employee?.id ?? null,
          notes: othersNote.trim() || null,
        },
      })
      toast('Moved to Others', 'success')
      setShowOthersNote(false)
      setOthersNote('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  const handleStartDemo = async () => {
    if (!lead) return
    try {
      await startDemo.mutateAsync({
        lead_id: lead.id,
        assigned_to: lead.assigned_to ?? employee?.id ?? null,
        performed_by: employee?.id ?? null,
      })
      toast('Demo trial started', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not start demo', 'error')
    }
  }

  const handleOutcome = async (outcome: 'converted' | 'lost') => {
    if (!lead) return
    try {
      await setOutcome.mutateAsync({
        lead_id: lead.id,
        outcome,
        performed_by: employee?.id ?? null,
      })
      toast(outcome === 'converted' ? 'Marked as converted' : 'Marked as lost', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  const handleAssign = async (assignee: string) => {
    if (!lead) return
    const value = assignee || null
    try {
      await updateLead.mutateAsync({
        lead_id: lead.id,
        patch: { assigned_to: value },
        activity: {
          action: 'Reassigned',
          performed_by: employee?.id ?? null,
          notes: value ? `To ${employeeMap[value]?.name ?? 'employee'}` : 'Unassigned',
        },
      })
      toast('Assignment updated', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  return (
    <CenterDialog
      open={open}
      onClose={onClose}
      title={
        lead ? (
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {lead.customer_name || 'Unknown lead'}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge value={lead.customer_status} />
              <StatusBadge value={lead.status} />
            </div>
          </div>
        ) : (
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Lead</h2>
        )
      }
    >
      {isLoading || !lead ? (
        <LoadingState label="Loading lead…" />
      ) : (
        <div className="space-y-6">
          {/* Contact + company */}
          {editing ? (
            <form onSubmit={saveDetails} className="space-y-3">
              <FormField label="Customer name" htmlFor="edit-name">
                <Input
                  id="edit-name"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Customer name"
                  autoFocus
                />
              </FormField>
              <FormField label="Company name" htmlFor="edit-company">
                <Input
                  id="edit-company"
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="Company name"
                />
              </FormField>
              <FormField
                label="Company details"
                htmlFor="edit-company-details"
                hint="Size, industry, requirements, key contacts…"
              >
                <Textarea
                  id="edit-company-details"
                  value={form.company_details}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company_details: e.target.value }))
                  }
                  placeholder="Notes about the company…"
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" type="submit" loading={updateLead.isPending}>
                  <CheckCircle2 className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Contact &amp; company
                </span>
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
              {lead.company_name && <Detail icon={Building2}>{lead.company_name}</Detail>}
              {lead.phone && (
                <Detail icon={Phone}>
                  <a href={`tel:${lead.phone}`} className="hover:underline">
                    {lead.phone}
                  </a>
                </Detail>
              )}
              {lead.email && (
                <Detail icon={Mail}>
                  <a href={`mailto:${lead.email}`} className="hover:underline">
                    {lead.email}
                  </a>
                </Detail>
              )}
              {lead.city && <Detail icon={MapPin}>{lead.city}</Detail>}
              {lead.product_interested && (
                <Detail icon={Tag}>{lead.product_interested}</Detail>
              )}
              {lead.company_details && (
                <div className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="min-w-0 whitespace-pre-wrap break-words">
                    {lead.company_details}
                  </p>
                </div>
              )}
              {(lead.utm_source || lead.utm_campaign || lead.utm_content) && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  Campaign:{' '}
                  {[lead.utm_content, lead.utm_campaign, lead.utm_source]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
              )}
            </section>
          )}

          {/* Quick actions */}
          <section className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowCall(true)}>
              <PhoneCall className="h-4 w-4" />
              Log call
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowMeeting(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Schedule meeting
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleStartDemo}
              loading={startDemo.isPending}
            >
              <MonitorPlay className="h-4 w-4" />
              Start demo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowMeet(true)}>
              <Video className="h-4 w-4" />
              Google Meet
            </Button>
          </section>

          {/* Stage automation */}
          <section className="space-y-3">
            <FormField label="Stage" htmlFor="lead-stage">
              <Select
                id="lead-stage"
                value={lead.customer_status ?? 'Fresh'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updateLead.isPending}
              >
                {CUSTOMER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormField>

            {showOthersNote && (
              <form onSubmit={submitOthersNote} className="space-y-2">
                <Textarea
                  value={othersNote}
                  onChange={(e) => setOthersNote(e.target.value)}
                  placeholder="Add a note explaining the status…"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setShowOthersNote(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" loading={updateLead.isPending}>
                    Save
                  </Button>
                </div>
              </form>
            )}

            <FormField label="Assigned to" htmlFor="lead-assignee">
              <Select
                id="lead-assignee"
                value={lead.assigned_to ?? ''}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </section>

          {/* Outcome */}
          <section className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOutcome('converted')}
              loading={setOutcome.isPending}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Mark converted
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOutcome('lost')}
              loading={setOutcome.isPending}
            >
              <XCircle className="h-4 w-4 text-red-500" />
              Mark lost
            </Button>
          </section>

          {/* Activity timeline */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <UserCog className="h-4 w-4 text-slate-400" />
              Activity
            </div>
            <ActivityTimeline items={activity} employeeMap={employeeMap} />
          </section>

          <CallLogModal open={showCall} onClose={() => setShowCall(false)} leadId={lead.id} />
          <MeetingScheduler
            open={showMeeting}
            onClose={() => setShowMeeting(false)}
            leadId={lead.id}
          />
          <MeetShareDialog
            open={showMeet}
            onClose={() => setShowMeet(false)}
            leadId={lead.id}
            leadName={lead.customer_name}
            leadPhone={lead.phone}
          />
        </div>
      )}
    </CenterDialog>
  )
}
