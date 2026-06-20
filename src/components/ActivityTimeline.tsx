import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Eye,
  MonitorPlay,
  Phone,
  PlusCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ActivityLog } from '@/types'
import { cn, timeAgo } from '@/lib/utils'
import { employeeName, type EmployeeMap } from '@/hooks/useEmployees'

function iconFor(action: string): { icon: LucideIcon; color: string } {
  if (action.startsWith('Viewed')) return { icon: Eye, color: 'text-blue-500' }
  if (action.startsWith('Call')) return { icon: Phone, color: 'text-emerald-500' }
  if (action.startsWith('Meeting')) return { icon: CalendarClock, color: 'text-amber-500' }
  if (action.startsWith('Demo')) return { icon: MonitorPlay, color: 'text-brand-500' }
  if (action.includes('Converted')) return { icon: CheckCircle2, color: 'text-emerald-500' }
  if (action.includes('Lost')) return { icon: XCircle, color: 'text-red-500' }
  if (action.startsWith('Status')) return { icon: ArrowRight, color: 'text-purple-500' }
  if (action.startsWith('Created')) return { icon: PlusCircle, color: 'text-slate-400' }
  return { icon: Circle, color: 'text-slate-400' }
}

export function ActivityTimeline({
  items,
  employeeMap,
}: {
  items: ActivityLog[]
  employeeMap: EmployeeMap
}) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>
    )
  }

  return (
    <ol className="relative space-y-4 pl-2">
      {items.map((item, idx) => {
        const { icon: Icon, color } = iconFor(item.action)
        const isLast = idx === items.length - 1
        return (
          <li key={item.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <Icon className={cn('h-3.5 w-3.5', color)} />
              </span>
              {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
            </div>
            <div className="-mt-0.5 flex-1 pb-1">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {item.action}
              </div>
              {item.notes && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.notes}</div>
              )}
              <div className="mt-0.5 text-[11px] text-slate-400">
                {employeeName(employeeMap, item.performed_by)} · {timeAgo(item.created_at)}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
