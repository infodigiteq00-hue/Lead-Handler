import { useEffect, useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useEmployees } from '@/hooks/useEmployees'
import { useCreateLead } from '@/hooks/useLeads'

const empty = {
  customer_name: '',
  phone: '',
  email: '',
  company_name: '',
  city: '',
  product_interested: '',
  company_details: '',
  assigned_to: '',
}

export function NewLeadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: (leadId: number) => void
}) {
  const { toast } = useToast()
  const { employee } = useAuth()
  const { data: employees = [] } = useEmployees()
  const createLead = useCreateLead()

  const [form, setForm] = useState(empty)

  // Reset the form each time the modal opens; default-assign to the current user.
  useEffect(() => {
    if (open) setForm({ ...empty, assigned_to: employee?.id ?? '' })
  }, [open, employee?.id])

  const set = (key: keyof typeof empty) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const name = form.customer_name.trim()
    if (!name) {
      toast('Customer name is required', 'error')
      return
    }
    try {
      const id = await createLead.mutateAsync({
        performed_by: employee?.id ?? null,
        values: {
          customer_name: name,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          company_name: form.company_name.trim() || null,
          city: form.city.trim() || null,
          product_interested: form.product_interested.trim() || null,
          company_details: form.company_details.trim() || null,
          assigned_to: form.assigned_to || null,
        },
      })
      toast('Lead added', 'success')
      onClose()
      onCreated?.(id)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add lead', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-brand-600" />
          Add new lead
        </span>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-lead-form" loading={createLead.isPending}>
            <UserPlus className="h-4 w-4" />
            Add lead
          </Button>
        </>
      }
    >
      <form id="new-lead-form" onSubmit={submit} className="space-y-4">
        <FormField label="Customer name" htmlFor="nl-name">
          <Input
            id="nl-name"
            value={form.customer_name}
            onChange={set('customer_name')}
            placeholder="Full name"
            autoFocus
            required
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="nl-phone">
            <Input
              id="nl-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="91 98765 43210"
            />
          </FormField>
          <FormField label="Email" htmlFor="nl-email">
            <Input
              id="nl-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="name@company.com"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Company" htmlFor="nl-company">
            <Input
              id="nl-company"
              value={form.company_name}
              onChange={set('company_name')}
              placeholder="Company name"
            />
          </FormField>
          <FormField label="City" htmlFor="nl-city">
            <Input id="nl-city" value={form.city} onChange={set('city')} placeholder="City" />
          </FormField>
        </div>

        <FormField label="Product interested" htmlFor="nl-product">
          <Input
            id="nl-product"
            value={form.product_interested}
            onChange={set('product_interested')}
            placeholder="What are they interested in?"
          />
        </FormField>

        <FormField label="Assign to" htmlFor="nl-assignee">
          <Select id="nl-assignee" value={form.assigned_to} onChange={set('assigned_to')}>
            <option value="">Unassigned</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Company details"
          htmlFor="nl-details"
          hint="Size, industry, requirements, key contacts…"
        >
          <Textarea
            id="nl-details"
            value={form.company_details}
            onChange={set('company_details')}
            placeholder="Notes about the company…"
          />
        </FormField>
      </form>
    </Modal>
  )
}
