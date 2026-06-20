import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from './queryKeys'
import type { Employee } from '@/types'

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      if (error) throw error
      return (data ?? []) as Employee[]
    },
  })
}

export type EmployeeMap = Record<string, Employee>

export function useEmployeeMap(): EmployeeMap {
  const { data } = useEmployees()
  return useMemo(() => {
    const map: EmployeeMap = {}
    for (const emp of data ?? []) map[emp.id] = emp
    return map
  }, [data])
}

export function employeeName(map: EmployeeMap, id?: string | null): string {
  if (!id) return '—'
  return map[id]?.name ?? 'Unknown'
}
