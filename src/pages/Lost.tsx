import { useState } from 'react'
import { UserX } from 'lucide-react'
import type { Lead } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeadTable, type LeadColumn } from '@/components/leads/LeadTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { useLeads } from '@/hooks/useLeads'

const columns: LeadColumn[] = ['lead', 'contact', 'city', 'product', 'assigned', 'created']

export default function Lost() {
  const { data: leads = [], isLoading } = useLeads({ scope: 'lost' })
  const [activeId, setActiveId] = useState<number | null>(null)

  const onRowClick = (lead: Lead) => setActiveId(lead.id)

  return (
    <div>
      <PageHeader
        title="Lost"
        subtitle="Leads marked as lost — kept here for reference and follow-up"
      />

      {isLoading ? (
        <LoadingState label="Loading lost leads…" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No lost leads"
          description="Leads you mark as lost will be moved here."
        />
      ) : (
        <LeadTable leads={leads} columns={columns} onRowClick={onRowClick} />
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
    </div>
  )
}
