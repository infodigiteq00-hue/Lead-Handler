import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useRealtimeSync } from '@/hooks/useRealtime'
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Live cross-client updates + time-based reminder scheduling.
  useRealtimeSync()
  useNotificationScheduler()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
