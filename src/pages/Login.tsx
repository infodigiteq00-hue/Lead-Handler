import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/ui/Field'

const highlights = [
  'Track every lead from first touch to closed deal',
  'Calls, meetings and demo trials in one timeline',
  'Live pipeline metrics shared across the team',
]

export default function Login() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) navigate('/', { replace: true })
  }, [session, navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await signIn(email.trim(), password)
    setLoading(false)
    if (err) {
      setError(err)
      toast(err, 'error')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(60rem 40rem at 80% -10%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(50rem 40rem at 0% 110%, rgba(13,21,64,0.55), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white ring-1 ring-inset ring-white/25">
            Q
          </div>
          <div className="text-sm font-semibold tracking-tight text-white">
            QuoteGen <span className="font-normal text-brand-200">CRM</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Close more deals with a pipeline your whole team can see.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-sm text-brand-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-brand-200">quotegen.in · by Digiteq</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
              Q
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Sign in to manage your leads.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@digiteq.in"
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={error}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>

            <Button type="submit" loading={loading} className="w-full">
              {!loading && <LogIn className="h-4 w-4" />}
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Accounts are provisioned in Supabase Auth by your admin.
          </p>
        </div>
      </div>
    </div>
  )
}
