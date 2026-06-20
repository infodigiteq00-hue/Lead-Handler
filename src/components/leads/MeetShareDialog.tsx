import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, Video } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { logActivity } from '@/hooks/useActivityLogs'
import { queryKeys } from '@/hooks/queryKeys'

const NEW_MEET_URL = 'https://meet.google.com/new'

/** A real Meet room link looks like https://meet.google.com/abc-defg-hij */
function isValidMeetLink(link: string) {
  return /meet\.google\.com\/[a-z]{3,}-[a-z]{3,}-[a-z]{3,}/i.test(link.trim())
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

  const [meetLink, setMeetLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const link = meetLink.trim()
  const valid = isValidMeetLink(link)

  // Reset everything each time the dialog is opened.
  useEffect(() => {
    if (!open) return
    setMeetLink('')
    setCopied(false)
    setPhone(leadPhone ?? '')
    setMessage('')
  }, [open, leadPhone])

  // Build a default WhatsApp message once a valid link is pasted.
  useEffect(() => {
    if (!valid) return
    const name = leadName?.trim() || 'there'
    setMessage(
      `Hi ${name}, here's the Google Meet link for our call: ${link}\n\nSee you there!`,
    )
  }, [valid, link, leadName])

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

  const startMeet = () => {
    window.open(NEW_MEET_URL, '_blank', 'noopener,noreferrer')
  }

  const openMeeting = () => {
    if (!valid) return
    window.open(link, '_blank', 'noopener,noreferrer')
    logMeet('Google Meet opened', link)
  }

  const copyLink = async () => {
    if (!valid) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast('Meet link copied', 'success')
    } catch {
      toast('Could not copy — select and copy manually', 'error')
    }
  }

  const shareWhatsApp = () => {
    if (!valid) {
      toast('Paste a valid Google Meet link first', 'error')
      return
    }
    const num = toWhatsAppNumber(phone)
    // With a number → opens that chat. Without → WhatsApp lets the employee
    // pick any contact (or their own number) before sending.
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/'
    const url = `${base}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    logMeet('Meet link shared on WhatsApp', num ? `${link} → ${num}` : link)
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
        {/* Step 1 — start a meeting on the employee's Google account */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              1
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Start a new meeting on your Google account, then copy the link Google
              gives you (top-left, or “Copy joining info”).
            </p>
          </div>
          <Button size="sm" onClick={startMeet} className="w-full">
            <Video className="h-4 w-4" />
            Start Google Meet
          </Button>
        </div>

        {/* Step 2 — paste the real link back */}
        <div className="space-y-3">
          <FormField
            label="2. Paste the Meet link"
            htmlFor="meet-link"
            error={link && !valid ? 'That doesn’t look like a Google Meet link' : undefined}
            hint={!link ? 'e.g. https://meet.google.com/abc-defg-hij' : undefined}
          >
            <Input
              id="meet-link"
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              autoComplete="off"
            />
          </FormField>

          {valid && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openMeeting}>
                <ExternalLink className="h-4 w-4" />
                Open meeting
              </Button>
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          )}
        </div>

        {/* Step 3 — share on WhatsApp (enabled once a link is pasted) */}
        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            3. Share on WhatsApp
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
              placeholder="Paste the Meet link above to build the message…"
            />
          </FormField>
          <Button
            onClick={shareWhatsApp}
            disabled={!valid}
            className="w-full bg-[#25D366] hover:bg-[#1da851]"
          >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  )
}
