import { useEffect, useRef } from 'react'
import { differenceInCalendarDays, differenceInMinutes, parseISO } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import {
  createNotification,
  ensureNotificationPermission,
  showBrowserNotification,
} from '@/lib/notify'
import type { NotificationType } from '@/types'
import { fmtTime } from '@/lib/utils'
import { useDemoTrials } from './useDemoTrials'
import { useMeetings } from './useMeetings'

const STORAGE_KEY = 'crm-fired-reminders'

function loadFired(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function saveFired(set: Set<string>) {
  try {
    // keep the list bounded so it can't grow forever
    const arr = [...set].slice(-300)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    /* ignore */
  }
}

/**
 * Client-side reminder engine:
 *  - meetings assigned to me: browser + in-app reminder 15 min and 5 min before
 *  - demo trials assigned to me: follow-up on day 3, 7, 9 and the expiry day
 * Each reminder fires once (tracked in localStorage).
 */
export function useNotificationScheduler() {
  const { employee } = useAuth()
  const { data: meetings = [] } = useMeetings()
  const { data: demos = [] } = useDemoTrials()
  const firedRef = useRef<Set<string>>(loadFired())

  useEffect(() => {
    void ensureNotificationPermission()
  }, [])

  useEffect(() => {
    if (!employee) return

    const fire = (
      key: string,
      title: string,
      message: string,
      type: NotificationType,
      leadId: number | null,
    ) => {
      const fired = firedRef.current
      if (fired.has(key)) return
      fired.add(key)
      saveFired(fired)
      showBrowserNotification(title, message)
      void createNotification({
        employee_id: employee.id,
        title,
        message,
        type,
        lead_id: leadId,
      })
    }

    const tick = () => {
      const now = new Date()

      for (const m of meetings) {
        if (m.assigned_to !== employee.id || m.status !== 'Scheduled') continue
        const when = parseISO(`${m.meeting_date}T${m.meeting_time}`)
        const mins = differenceInMinutes(when, now)
        if (mins <= 15 && mins >= 1) {
          fire(`m15-${m.id}`, 'Meeting in 15 minutes', `Scheduled at ${fmtTime(m.meeting_time)}`, 'meeting', m.lead_id)
        }
        if (mins <= 5 && mins >= 0) {
          fire(`m5-${m.id}`, 'Meeting in 5 minutes', `Scheduled at ${fmtTime(m.meeting_time)}`, 'meeting', m.lead_id)
        }
      }

      for (const d of demos) {
        if (d.assigned_to !== employee.id) continue
        const remaining = differenceInCalendarDays(parseISO(d.expiry_date), now)
        // day 3 -> 7 left, day 7 -> 3 left, day 9 -> 1 left, expiry -> 0 left
        if ([7, 3, 1, 0].includes(remaining)) {
          const label =
            remaining === 0 ? 'expires today' : `${remaining} day${remaining === 1 ? '' : 's'} left`
          fire(`trial-${d.id}-${remaining}`, 'Demo trial follow-up', `Trial ${label}.`, 'trial', d.lead_id)
        }
      }
    }

    tick()
    const interval = setInterval(tick, 45_000)
    return () => clearInterval(interval)
  }, [employee, meetings, demos])
}
