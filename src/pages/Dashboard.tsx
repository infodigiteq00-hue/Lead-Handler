import { useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CheckCircle2,
  Flame,
  Inbox,
  MonitorPlay,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/Spinner'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useRecentActivity } from '@/hooks/useActivityLogs'
import { useEmployeeMap } from '@/hooks/useEmployees'
import { cn } from '@/lib/utils'

interface MetricDef {
  key: string
  label: string
  icon: LucideIcon
  value: number
  accent: string
  to?: string
}

function MetricCard({ def }: { def: MetricDef }) {
  const navigate = useNavigate()
  const Icon = def.icon
  return (
    <button
      type="button"
      onClick={() => def.to && navigate(def.to)}
      className={cn(
        'flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-[transform,border-color,box-shadow] dark:border-slate-800 dark:bg-slate-900',
        def.to &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md active:translate-y-0 dark:hover:border-brand-700',
      )}
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', def.accent)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
          {def.value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{def.label}</div>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics()
  const { data: rawActivity = [] } = useRecentActivity(20)
  // Hide "Viewed" entries from the global feed — they're noisy at the dashboard level.
  const activity = rawActivity.filter((a) => !a.action.startsWith('Viewed'))
  const employeeMap = useEmployeeMap()

  const defs: MetricDef[] = [
    {
      key: 'newLeads',
      label: 'New Leads',
      icon: Inbox,
      value: metrics?.newLeads ?? 0,
      accent: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
      to: '/new-customers',
    },
    {
      key: 'fresh',
      label: 'Fresh',
      icon: Flame,
      value: metrics?.fresh ?? 0,
      accent: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
      to: '/ongoing',
    },
    {
      key: 'pipeline',
      label: 'In Pipeline',
      icon: TrendingUp,
      value: metrics?.pipeline ?? 0,
      accent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
      to: '/ongoing',
    },
    {
      key: 'meetingsToday',
      label: 'Meetings Today',
      icon: CalendarClock,
      value: metrics?.meetingsToday ?? 0,
      accent: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
      to: '/meetings',
    },
    {
      key: 'activeDemos',
      label: 'Active Demos',
      icon: MonitorPlay,
      value: metrics?.activeDemos ?? 0,
      accent: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
      to: '/demos',
    },
    {
      key: 'conversions',
      label: 'Conversions',
      icon: CheckCircle2,
      value: metrics?.conversions ?? 0,
      accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    },
    {
      key: 'lost',
      label: 'Lost',
      icon: XCircle,
      value: metrics?.lost ?? 0,
      accent: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Pipeline at a glance" />

      {isLoading ? (
        <LoadingState label="Loading metrics…" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {defs.map((def) => (
            <MetricCard key={def.key} def={def} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader title="Recent activity" subtitle="Latest actions across all leads" />
        <div className="px-5 py-4">
          <ActivityTimeline items={activity} employeeMap={employeeMap} />
        </div>
      </Card>
    </div>
  )
}
