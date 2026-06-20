import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarClock, CheckCheck, MonitorPlay, UserPlus } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useNotifications'
import type { AppNotification } from '@/types'

const typeRoute: Record<string, string> = {
  meeting: '/meetings',
  trial: '/demos',
  followup: '/demos',
  new_lead: '/new-customers',
}

const typeIcon: Record<string, typeof Bell> = {
  meeting: CalendarClock,
  trial: MonitorPlay,
  followup: MonitorPlay,
  new_lead: UserPlus,
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const navigate = useNavigate()

  const unread = useMemo(
    () => notifications.filter((n) => !n.is_read),
    [notifications],
  )

  const onItemClick = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id)
    setOpen(false)
    const route = n.type ? typeRoute[n.type] : undefined
    if (route) navigate(route)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              {unread.length > 0 && (
                <button
                  onClick={() => markAll.mutate(unread.map((n) => n.id))}
                  className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="scrollbar-thin max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => {
                  const Icon = (n.type && typeIcon[n.type]) || Bell
                  return (
                    <button
                      key={n.id}
                      onClick={() => onItemClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/50',
                        !n.is_read && 'bg-brand-50/50 dark:bg-brand-500/5',
                      )}
                    >
                      <span className="mt-0.5 rounded-md bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {n.message}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
