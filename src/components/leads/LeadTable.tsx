import type { ReactNode } from 'react'
import { Mail, Phone } from 'lucide-react'
import type { Lead } from '@/types'
import { fmtDate, fmtDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { employeeName, useEmployeeMap, type EmployeeMap } from '@/hooks/useEmployees'

export type LeadColumn =
  | 'lead'
  | 'contact'
  | 'city'
  | 'product'
  | 'source'
  | 'utm'
  | 'status'
  | 'customerStatus'
  | 'assigned'
  | 'created'
  | 'firstViewed'

const headers: Record<LeadColumn, string> = {
  lead: 'Customer',
  contact: 'Contact',
  city: 'City',
  product: 'Product',
  source: 'Source',
  utm: 'Campaign / Ad',
  status: 'Outcome',
  customerStatus: 'Stage',
  assigned: 'Assigned to',
  created: 'Created',
  firstViewed: 'First viewed',
}

function renderCell(col: LeadColumn, lead: Lead, map: EmployeeMap): ReactNode {
  switch (col) {
    case 'lead':
      return (
        <div className="min-w-0">
          <div className="truncate font-medium text-slate-900 dark:text-slate-100">
            {lead.customer_name || 'Unknown'}
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.company_name || '—'}
          </div>
        </div>
      )
    case 'contact':
      return (
        <div className="space-y-0.5 text-xs">
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Phone className="h-3 w-3 shrink-0" />
              {lead.phone}
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {!lead.phone && !lead.email && <span className="text-slate-400">—</span>}
        </div>
      )
    case 'city':
      return <span className="text-slate-600 dark:text-slate-300">{lead.city || '—'}</span>
    case 'product':
      return (
        <span className="text-slate-600 dark:text-slate-300">
          {lead.product_interested || '—'}
        </span>
      )
    case 'source':
      return lead.source ? <Badge tone="gray">{lead.source}</Badge> : <span>—</span>
    case 'utm':
      return (
        <div className="text-xs">
          <div className="text-slate-700 dark:text-slate-200">{lead.utm_content || '—'}</div>
          {(lead.utm_source || lead.utm_campaign) && (
            <div className="text-slate-400">
              {[lead.utm_source, lead.utm_campaign].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )
    case 'status':
      return <StatusBadge value={lead.status} />
    case 'customerStatus':
      return <StatusBadge value={lead.customer_status} />
    case 'assigned':
      return (
        <span className="text-slate-600 dark:text-slate-300">
          {employeeName(map, lead.assigned_to)}
        </span>
      )
    case 'created':
      return <span className="text-slate-500 dark:text-slate-400">{fmtDate(lead.created_at)}</span>
    case 'firstViewed':
      return (
        <span className="text-slate-500 dark:text-slate-400">
          {fmtDateTime(lead.first_viewed_at)}
        </span>
      )
    default:
      return null
  }
}

export function LeadTable({
  leads,
  columns,
  onRowClick,
}: {
  leads: Lead[]
  columns: LeadColumn[]
  onRowClick?: (lead: Lead) => void
}) {
  const map = useEmployeeMap()

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 font-medium">
                {headers[col]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick?.(lead)}
              className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 align-top">
                  {renderCell(col, lead, map)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
