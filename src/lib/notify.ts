import { supabase } from './supabase'
import type { NotificationType } from '@/types'

export interface CreateNotificationInput {
  employee_id?: string | null
  title: string
  message: string
  type?: NotificationType
  scheduled_for?: string | null
  lead_id?: number | null
}

// Persist an in-app notification for an employee.
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.employee_id) return
  const { error } = await supabase.from('notifications').insert({
    employee_id: input.employee_id,
    title: input.title,
    message: input.message,
    type: input.type ?? null,
    scheduled_for: input.scheduled_for ?? null,
    lead_id: input.lead_id ?? null,
  })
  if (error) console.error('createNotification failed:', error.message)
}

// ---- Browser Notifications API helpers ----

export function browserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!browserNotificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showBrowserNotification(title: string, body?: string): void {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.svg' })
  } catch (err) {
    console.error('showBrowserNotification failed:', err)
  }
}
