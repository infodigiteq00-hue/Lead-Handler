import { useMemo, useState } from 'react'
import { MonitorPlay } from 'lucide-react'
import type { DemoTrial, Lead } from '@/types'
import { DEMO_INTEREST_STATUSES } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Field'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useDemoTrials, useUpdateDemoTrial } from '@/hooks/useDemoTrials'
import { useLeads } from '@/hooks/useLeads'
import { useEmployeeMap, employeeName } from '@/hooks/useEmployees'
import { daysUntil, fmtDate } from '@/lib/utils'

function countdownBadge(days: number | null) {
  if (days === null) return <Badge tone="gray">—</Badge>
  if (days < 0) return <Badge tone="red">Expired</Badge>
  if (days === 0) return <Badge tone="red" dot>Expires today</Badge>
  if (days <= 3) return <Badge tone="amber" dot>{days} day{days === 1 ? '' : 's'} left</Badge>
  return <Badge tone="green" dot>{days} days left</Badge>
}

function DemoCard({
  demo,
  leadMap,
  onOpenLead,
}: {
  demo: DemoTrial
  leadMap: Record<number, Lead>
  onOpenLead: (id: number) => void
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const employeeMap = useEmployeeMap()
  const updateDemo = useUpdateDemoTrial()
  const lead = leadMap[demo.lead_id]
  const days = daysUntil(demo.expiry_date)

  const onInterest = async (interest_status: string) => {
    try {
      await updateDemo.mutateAsync({
        id: demo.id,
        lead_id: demo.lead_id,
        patch: { interest_status },
        performed_by: employee?.id ?? null,
      })
      toast('Demo updated', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error')
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onOpenLead(demo.lead_id)} className="min-w-0 text-left">
          <div className="truncate font-medium text-slate-900 hover:underline dark:text-slate-100">
            {lead?.customer_name || `Lead #${demo.lead_id}`}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead?.company_name || '—'}
          </div>
        </button>
        {countdownBadge(days)}
      </div>

      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div>Started {fmtDate(demo.start_date)} · expires {fmtDate(demo.expiry_date)}</div>
        <div>Owner: {employeeName(employeeMap, demo.assigned_to)}</div>
      </div>

      <Select
        className="h-9 text-xs"
        value={demo.interest_status ?? 'Decision Pending'}
        onChange={(e) => onInterest(e.target.value)}
        disabled={updateDemo.isPending}
      >
        {DEMO_INTEREST_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </Card>
  )
}

export default function DemoStarted() {
  const { data: demos = [], isLoading } = useDemoTrials()
  const { data: leads = [] } = useLeads({ scope: 'all' })
  const [activeId, setActiveId] = useState<number | null>(null)

  const leadMap = useMemo(() => {
    const map: Record<number, Lead> = {}
    for (const l of leads) map[l.id] = l
    return map
  }, [leads])

  return (
    <div>
      <PageHeader
        title="Demo Started"
        subtitle="Active 10-day trials with follow-up reminders on days 3, 7, 9 and expiry"
      />

      {isLoading ? (
        <LoadingState label="Loading demo trials…" />
      ) : demos.length === 0 ? (
        <EmptyState
          icon={MonitorPlay}
          title="No active demos"
          description="Start a demo from a lead to track its trial countdown here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <DemoCard key={d.id} demo={d} leadMap={leadMap} onOpenLead={setActiveId} />
          ))}
        </div>
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
    </div>
  )
}
