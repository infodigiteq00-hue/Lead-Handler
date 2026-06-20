import { Badge, type BadgeTone } from '@/components/ui/Badge'

const toneMap: Record<string, BadgeTone> = {
  // customer_status
  Fresh: 'blue',
  'In Pipeline': 'purple',
  'Meeting Scheduled': 'amber',
  'Demo Started': 'indigo',
  Others: 'gray',
  // meeting status
  Scheduled: 'blue',
  Completed: 'green',
  Rescheduled: 'amber',
  'Follow-up Required': 'amber',
  // call status
  'Call Done': 'green',
  "Didn't Pickup": 'red',
  Busy: 'amber',
  // demo interest
  'Interested to Buy': 'green',
  'Needs Meeting': 'blue',
  'Needs Demo Extension': 'amber',
  'Decision Pending': 'purple',
  'Not Interested': 'red',
  Converted: 'green',
  // lead status
  new: 'blue',
  open: 'purple',
  converted: 'green',
  lost: 'red',
}

export function statusTone(value?: string | null): BadgeTone {
  if (!value) return 'gray'
  return toneMap[value] ?? 'gray'
}

export function StatusBadge({
  value,
  dot = true,
}: {
  value?: string | null
  dot?: boolean
}) {
  if (!value) return <Badge tone="gray">—</Badge>
  return (
    <Badge tone={statusTone(value)} dot={dot}>
      {value}
    </Badge>
  )
}
