import type {
  ActivityLogRow,
  CallLogRow,
  DemoTrialRow,
  EmployeeRow,
  LeadDetailsRow,
  MeetingRow,
  NotificationRow,
} from '@/lib/database.types'

export type Lead = LeadDetailsRow
export type Employee = EmployeeRow
export type CallLog = CallLogRow
export type Meeting = MeetingRow
export type DemoTrial = DemoTrialRow
export type ActivityLog = ActivityLogRow
export type AppNotification = NotificationRow

// Rows joined with the acting employee's name (via Supabase foreign-table select).
export type WithPerformer<T> = T & { performer?: { name: string } | null }
export type WithAssignee<T> = T & { assignee?: { name: string } | null }

export type CallLogWithEmployee = WithPerformer<CallLog>
export type MeetingWithLead = Meeting & {
  lead?: Pick<Lead, 'id' | 'customer_name' | 'company_name' | 'phone'> | null
  assignee?: { name: string } | null
}
export type DemoTrialWithLead = DemoTrial & {
  lead?: Pick<Lead, 'id' | 'customer_name' | 'company_name' | 'phone'> | null
  assignee?: { name: string } | null
}
export type ActivityLogWithEmployee = WithPerformer<ActivityLog>

// ---- Funnel + status vocabularies (mirrors the spec) ----

export const CUSTOMER_STATUSES = [
  'Fresh',
  'In Pipeline',
  'Meeting Scheduled',
  'Demo Started',
  'Others',
] as const
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number]

export const CALL_STATUSES = ['Call Done', "Didn't Pickup", 'Busy'] as const
export type CallStatus = (typeof CALL_STATUSES)[number]

export const MEETING_STATUSES = [
  'Scheduled',
  'Completed',
  'Rescheduled',
  'Demo Started',
  'Follow-up Required',
  'Others',
] as const
export type MeetingStatus = (typeof MEETING_STATUSES)[number]

export const DEMO_INTEREST_STATUSES = [
  'Interested to Buy',
  'Needs Meeting',
  'Needs Demo Extension',
  'Decision Pending',
  'Not Interested',
  'Converted',
] as const
export type DemoInterestStatus = (typeof DEMO_INTEREST_STATUSES)[number]

// Lead-level outcome (drives the Conversions / Lost metrics).
export const LEAD_STATUSES = ['new', 'open', 'converted', 'lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type NotificationType = 'meeting' | 'followup' | 'trial' | 'new_lead'
