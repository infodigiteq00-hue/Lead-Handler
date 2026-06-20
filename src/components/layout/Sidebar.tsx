import { NavLink } from 'react-router-dom'
import {
  CalendarClock,
  LayoutDashboard,
  MonitorPlay,
  UserPlus,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/new-customers', label: 'New Customers', icon: UserPlus, badge: true },
  { to: '/ongoing', label: 'Ongoing', icon: Users },
  { to: '/meetings', label: 'Meetings', icon: CalendarClock },
  { to: '/demos', label: 'Demo Started', icon: MonitorPlay },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: metrics } = useDashboardMetrics()
  const newCount = metrics?.newLeads ?? 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          Q
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            QuoteGen
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Lead CRM</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )
            }
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </span>
            {item.badge && newCount > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {newCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-[11px] text-slate-400">
        quotegen.in · Digiteq
      </div>
    </div>
  )
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative z-10 h-full w-64 animate-slide-in border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
