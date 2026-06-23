import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import NewCustomers from '@/pages/NewCustomers'
import Ongoing from '@/pages/Ongoing'
import Meetings from '@/pages/Meetings'
import DemoStarted from '@/pages/DemoStarted'
import Lost from '@/pages/Lost'
import SearchResults from '@/pages/SearchResults'

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="new-customers" element={<NewCustomers />} />
        <Route path="ongoing" element={<Ongoing />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="demos" element={<DemoStarted />} />
        <Route path="lost" element={<Lost />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
