import { useState } from 'react'
import { Flame, TrendingUp } from 'lucide-react'
import type { Lead } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { LeadTable, type LeadColumn } from '@/components/leads/LeadTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { useLeads } from '@/hooks/useLeads'

const columns: LeadColumn[] = [
  'lead',
  'contact',
  'city',
  'product',
  'customerStatus',
  'assigned',
  'created',
]

export default function Ongoing() {
  const fresh = useLeads({ scope: 'fresh' })
  const pipeline = useLeads({ scope: 'pipeline' })
  const [activeId, setActiveId] = useState<number | null>(null)

  const onRowClick = (lead: Lead) => setActiveId(lead.id)
  const isLoading = fresh.isLoading || pipeline.isLoading

  return (
    <div>
      <PageHeader
        title="Ongoing Customers"
        subtitle="Leads in active follow-up — log calls and advance their stage"
      />

      {isLoading ? (
        <LoadingState label="Loading leads…" />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Fresh"
              subtitle="Opened but not yet in the pipeline"
              action={<Badge tone="blue" dot>{fresh.data?.length ?? 0}</Badge>}
            />
            <div className="p-3">
              {fresh.data && fresh.data.length > 0 ? (
                <LeadTable leads={fresh.data} columns={columns} onRowClick={onRowClick} />
              ) : (
                <EmptyState
                  icon={Flame}
                  title="No fresh leads"
                  description="Opened leads waiting for first contact will appear here."
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="In Pipeline"
              subtitle="Actively progressing toward a decision"
              action={<Badge tone="purple" dot>{pipeline.data?.length ?? 0}</Badge>}
            />
            <div className="p-3">
              {pipeline.data && pipeline.data.length > 0 ? (
                <LeadTable leads={pipeline.data} columns={columns} onRowClick={onRowClick} />
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="Pipeline is empty"
                  description="Move a fresh lead into the pipeline to start tracking it here."
                />
              )}
            </div>
          </Card>
        </div>
      )}

      <LeadDrawer leadId={activeId} open={activeId !== null} onClose={() => setActiveId(null)} />
    </div>
  )
}
