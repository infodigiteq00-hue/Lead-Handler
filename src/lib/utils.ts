import { clsx, type ClassValue } from 'clsx'
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  parseISO,
} from 'date-fns'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function fmtDate(value?: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'dd MMM yyyy')
  } catch {
    return value
  }
}

export function fmtDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'dd MMM yyyy, h:mm a')
  } catch {
    return value
  }
}

// meeting_time arrives as 'HH:MM:SS' — parse manually into 12h display.
export function fmtTime(value?: string | null): string {
  if (!value) return '—'
  const [hStr, mStr] = value.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function timeAgo(value?: string | null): string {
  if (!value) return '—'
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true })
  } catch {
    return value
  }
}

// Whole calendar days from today until the given date (negative = past).
export function daysUntil(value?: string | null): number | null {
  if (!value) return null
  try {
    return differenceInCalendarDays(parseISO(value), new Date())
  } catch {
    return null
  }
}

export function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
