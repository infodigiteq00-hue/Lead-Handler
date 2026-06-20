import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useAddCallLog } from '@/hooks/useCallLogs'
import { CALL_STATUSES } from '@/types'

export function CallLogModal({
  open,
  onClose,
  leadId,
}: {
  open: boolean
  onClose: () => void
  leadId: number
}) {
  const { employee } = useAuth()
  const { toast } = useToast()
  const addCall = useAddCallLog()
  const [callStatus, setCallStatus] = useState<string>(CALL_STATUSES[0])
  const [remark, setRemark] = useState('')

  const reset = () => {
    setCallStatus(CALL_STATUSES[0])
    setRemark('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await addCall.mutateAsync({
        lead_id: leadId,
        call_status: callStatus,
        remark: remark.trim() || undefined,
        performed_by: employee?.id ?? null,
      })
      toast('Call logged', 'success')
      reset()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to log call', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log a call"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="call-log-form" loading={addCall.isPending}>
            Save call
          </Button>
        </>
      }
    >
      <form id="call-log-form" onSubmit={onSubmit} className="space-y-4">
        <FormField label="Call status" htmlFor="call-status">
          <Select
            id="call-status"
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
          >
            {CALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Remark" htmlFor="call-remark" hint="Optional notes about the conversation">
          <Textarea
            id="call-remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="What was discussed?"
          />
        </FormField>
      </form>
    </Modal>
  )
}
