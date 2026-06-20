// QuoteGen CRM — email notification Edge Function (STUB).
//
// Email delivery is intentionally not wired up yet: the app ships with browser
// notifications + in-app notifications only. This function is a ready-to-fill
// placeholder so email can be enabled later without changing the client.
//
// To enable real email:
//   1. Pick a provider (Resend, SendGrid, Postmark, AWS SES …).
//   2. Add its API key as a secret:  supabase secrets set EMAIL_API_KEY=...
//   3. Replace the `TODO` block below with a fetch() to the provider.
//   4. Deploy:  supabase functions deploy send-email
//
// Invoke from the client:
//   await supabase.functions.invoke('send-email', {
//     body: { to, subject, html },
//   })
//
// deno-lint-ignore-file
// @ts-nocheck — this file targets the Deno (Supabase Edge) runtime, not the Vite app.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

interface EmailPayload {
  to: string
  subject: string
  html?: string
  text?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload: EmailPayload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!payload.to || !payload.subject) {
    return json({ error: 'Missing required fields: to, subject' }, 400)
  }

  const apiKey = Deno.env.get('EMAIL_API_KEY')

  // --- STUB: no provider configured yet -------------------------------------
  if (!apiKey) {
    console.log('[send-email] (stub) would send:', {
      to: payload.to,
      subject: payload.subject,
    })
    return json({
      ok: true,
      stub: true,
      message: 'Email sending is stubbed. Set EMAIL_API_KEY to enable delivery.',
    })
  }

  // --- TODO: real delivery ---------------------------------------------------
  // Example (Resend):
  //   const res = await fetch('https://api.resend.com/emails', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${apiKey}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       from: 'QuoteGen CRM <crm@quotegen.in>',
  //       to: payload.to,
  //       subject: payload.subject,
  //       html: payload.html ?? payload.text ?? '',
  //     }),
  //   })
  //   if (!res.ok) return json({ error: await res.text() }, 502)
  //   return json({ ok: true, id: (await res.json()).id })

  return json({ ok: true, stub: true })
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
