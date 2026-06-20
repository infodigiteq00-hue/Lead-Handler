import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Lead } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeadTable, type LeadColumn } from '@/components/leads/LeadTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { useLeads } from '@/hooks/useLeads'

const columns: LeadColumn[] = [
  'lead',
  'contact',
  'city',
  'product',
  'status',
  'customerStatus',
  'assigned',
  'created',
]

export default function SearchResults() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  const { data: leads = [], isLoading } = useLeads({ scope: 'all', search: query })
  const [activeId, setActiveId] = useState<number | null>(null)

  const onRowClick = (lead: Lead) => setActiveId(lead.id)

  return (
    <div>
      <PageHeader
        title="Search"
        subtitle={query ? `Results for "${query}"` : 'Search leads by name, company, phone or email'}
      />

      {!query ? (
        <EmptyState
          icon={Search}
          title="Type a search query"
          description="Use the search bar at the top to find leads by name, company, phone or email."
        />
      ) : isLoading ? (
        <LoadingState label="Searching…" />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description={`No leads matched "${query}". Try a different name, phone or email.`}
        />
      ) : (
        <LeadTable leads={leads} columns={columns} onRowClick={onRowClick} />
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
    </div>
  )
}
