import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, Video } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { logActivity } from '@/hooks/useActivityLogs'
import { queryKeys } from '@/hooks/queryKeys'

/** Generate a unique, URL-safe Google Meet lookup alias (lowercase alphanumeric). */
function makeMeetAlias() {
  const rand = Math.random().toString(36).slice(2, 10)
  const stamp = Date.now().toString(36).slice(-4)
  return `qgmeet-${rand}${stamp}`
}

/** Strip everything but digits so the number is wa.me-friendly (e.g. 919876543210). */
function toWhatsAppNumber(raw: string) {
  return raw.replace(/[^\d]/g, '')
}

export function MeetShareDialog({
  open,
  onClose,
  leadId,
  leadName,
  leadPhone,
}: {
  open: boolean
  onClose: () => void
  leadId: number
  leadName: string | null
  leadPhone: string | null
}) {
  const { toast } = useToast()
  const { employee } = useAuth()
  const queryClient = useQueryClient()

  const [alias, setAlias] = useState('')
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const meetUrl = useMemo(
    () => (alias ? `https://meet.google.com/lookup/${alias}` : ''),
    [alias],
  )

  // Generate a fresh link + message every time the dialog is opened.
  useEffect(() => {
    if (!open) return
    const a = makeMeetAlias()
    setAlias(a)
    setCopied(false)
    setPhone(leadPhone ?? '')
    const url = `https://meet.google.com/lookup/${a}`
    const name = leadName?.trim() || 'there'
    setMessage(
      `Hi ${name}, here's the Google Meet link for our call: ${url}\n\nSee you there!`,
    )
  }, [open, leadName, leadPhone])

  const refreshTimeline = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activity(leadId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.recentActivity })
  }

  const logMeet = (action: string, notes: string) => {
    logActivity({
      lead_id: leadId,
      action,
      performed_by: employee?.id ?? null,
      notes,
    }).then(refreshTimeline)
  }

  const openMeeting = () => {
    if (!meetUrl) return
    window.open(meetUrl, '_blank', 'noopener,noreferrer')
    logMeet('Google Meet started', meetUrl)
  }

  const copyLink = async () => {
    if (!meetUrl) return
    try {
      await navigator.clipboard.writeText(meetUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast('Meet link copied', 'success')
    } catch {
      toast('Could not copy — select and copy manually', 'error')
    }
  }

  const shareWhatsApp = () => {
    if (!meetUrl) return
    const num = toWhatsAppNumber(phone)
    // With a number → opens that chat. Without → WhatsApp lets the employee
    // pick any contact (or their own number) before sending.
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/'
    const url = `${base}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    logMeet('Meet link shared on WhatsApp', num ? `${meetUrl} → ${num}` : meetUrl)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-2">
          <Video className="h-4 w-4 text-brand-600" />
          Google Meet
        </span>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A fresh meeting link is ready. Open it to start the call, or share it
            with the lead on WhatsApp.
          </p>
        </div>

        {/* The generated link */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
          <Video className="h-4 w-4 shrink-0 text-slate-400" />
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            {meetUrl}
          </a>
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link"
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openMeeting}>
            <ExternalLink className="h-4 w-4" />
            Open meeting
          </Button>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        {/* Share on WhatsApp */}
        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Share on WhatsApp
          </div>
          <FormField
            label="Phone number"
            htmlFor="meet-phone"
            hint="Include country code (e.g. 9198…). Leave blank to pick a contact in WhatsApp."
          >
            <Input
              id="meet-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="91 98765 43210"
            />
          </FormField>
          <FormField label="Message" htmlFor="meet-message">
            <Textarea
              id="meet-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </FormField>
          <Button onClick={shareWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1da851]">
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  )
}
