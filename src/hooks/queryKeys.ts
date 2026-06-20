// Centralised query keys so invalidation stays consistent across hooks.
export const queryKeys = {
  employees: ['employees'] as const,
  leads: ['leads'] as const,
  lead: (id: number) => ['leads', 'detail', id] as const,
  callLogs: (leadId: number) => ['call_logs', leadId] as const,
  meetings: ['meetings'] as const,
  demoTrials: ['demo_trials'] as const,
  activity: (leadId: number) => ['activity_logs', leadId] as const,
  recentActivity: ['activity_logs', 'recent'] as const,
  notifications: ['notifications'] as const,
  metrics: ['metrics'] as const,
}
