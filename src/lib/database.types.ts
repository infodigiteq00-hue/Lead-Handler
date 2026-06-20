// Hand-written Supabase schema types for the QuoteGen CRM.
// Mirrors supabase/migrations/0001_crm_schema.sql.
//
// NOTE: Row types are declared with `type` (not `interface`) on purpose.
// `interface` types are not assignable to `Record<string, unknown>`, which
// makes them fail postgrest-js's `GenericTable` constraint and collapses the
// inferred schema to `never` (breaking all insert/update typings).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type LeadDetailsRow = {
  id: number
  phone: string | null
  email: string | null
  source: string | null
  created_at: string
  customer_name: string | null
  company_name: string | null
  company_details: string | null
  city: string | null
  product_interested: string | null
  status: string | null
  customer_status: string | null
  utm_source: string | null
  utm_campaign: string | null
  utm_content: string | null
  first_viewed_at: string | null
  first_viewed_by: string | null
  assigned_to: string | null
  updated_at: string
}

export type EmployeeRow = {
  id: string
  name: string
  email: string
  created_at: string
}

export type CallLogRow = {
  id: string
  lead_id: number
  call_status: string | null
  remark: string | null
  performed_by: string | null
  created_at: string
}

export type MeetingRow = {
  id: string
  lead_id: number
  meeting_date: string
  meeting_time: string
  meeting_notes: string | null
  assigned_to: string | null
  status: string
  created_at: string
}

export type DemoTrialRow = {
  id: string
  lead_id: number
  start_date: string
  expiry_date: string
  assigned_to: string | null
  interest_status: string | null
  notes: string | null
  last_followup: string | null
  created_at: string
}

export type ActivityLogRow = {
  id: string
  lead_id: number | null
  action: string
  performed_by: string | null
  notes: string | null
  created_at: string
}

export type NotificationRow = {
  id: string
  employee_id: string | null
  title: string
  message: string
  type: string | null
  is_read: boolean
  scheduled_for: string | null
  lead_id: number | null
  created_at: string
}

type TableShape<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      'Lead Details': TableShape<LeadDetailsRow>
      employees: TableShape<EmployeeRow>
      call_logs: TableShape<CallLogRow>
      meetings: TableShape<MeetingRow>
      demo_trials: TableShape<DemoTrialRow>
      activity_logs: TableShape<ActivityLogRow>
      notifications: TableShape<NotificationRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
