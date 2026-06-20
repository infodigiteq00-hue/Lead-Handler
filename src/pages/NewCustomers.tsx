import { useState } from 'react'
import { Inbox } from 'lucide-react'
import type { Lead } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeadTable, type LeadColumn } from '@/components/leads/LeadTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { useAuth } from '@/contexts/AuthContext'
import { useLeads, useMarkLeadViewed } from '@/hooks/useLeads'

const columns: LeadColumn[] = ['lead', 'contact', 'city', 'product', 'source', 'utm', 'created']

export default function NewCustomers() {
  const { employee } = useAuth()
  const { data: leads = [], isLoading } = useLeads({ scope: 'new' })
  const markViewed = useMarkLeadViewed()
  const [activeId, setActiveId] = useState<number | null>(null)

  const onRowClick = (lead: Lead) => {
    setActiveId(lead.id)
    // First open records first_viewed_at/by and moves the lead to Ongoing.
    if (!lead.first_viewed_at) {
      markViewed.mutate({ lead_id: lead.id, employee_id: employee?.id ?? null })
    }
  }

  return (
    <div>
      <PageHeader
        title="New Customers"
        subtitle="Leads that haven't been opened yet — opening one moves it to Ongoing"
      />

      {isLoading ? (
        <LoadingState label="Loading new leads…" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No new leads"
          description="Every incoming lead has been reviewed. New submissions will appear here."
        />
      ) : (
        <LeadTable leads={leads} columns={columns} onRowClick={onRowClick} />
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
    </div>
  )
}
