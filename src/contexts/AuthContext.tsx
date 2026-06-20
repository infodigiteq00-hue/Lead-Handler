import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  employee: Employee | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadEmployee(user: User): Promise<Employee | null> {
  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (data) return data as Employee

  // Fallback if the auth trigger hasn't created the row yet.
  const name =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Employee'
  const { data: inserted } = await supabase
    .from('employees')
    .insert({ id: user.id, email: user.email ?? '', name })
    .select('*')
    .maybeSingle()
  return (inserted as Employee) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Resolve the employee row in a separate effect to avoid calling supabase
  // inside the onAuthStateChange callback (which can deadlock the client).
  const userId = session?.user?.id
  useEffect(() => {
    const currentUser = session?.user
    if (!currentUser) {
      setEmployee(null)
      return
    }
    let active = true
    loadEmployee(currentUser).then((emp) => {
      if (active) setEmployee(emp)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        employee,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
