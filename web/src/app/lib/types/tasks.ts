export type Urgency = 'info' | 'elevated' | 'severe'

export type Citation = {
  id: string
  title: string
  url: string
  source?: string
  publishedAt?: string
}

export type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  dueAt?: string
  createdAt: string
  updatedAt: string
  urgency: Urgency
  requiresEvidence?: boolean
  steps?: { id: string; text: string; done: boolean; requiresPhoto?: boolean }[]
  actions?: ('call_ai' | 'book' | 'directions' | 'message' | 'upload')[]
  citations?: Citation[]
  rationale?: string
  relatedVenueId?: string
}

export type Plan = {
  id: string
  title: string
  createdAt: string
  risk: Urgency
  tasks: Task[]
  citations: Citation[]
  solutionSteps: string[]        // “solution steps” summary from Intake
  evidenceLock?: boolean
  sourceSessionId?: string
}

export type IntakeSnapshot = {
  sessionId: string
  risk: Urgency
  recommendations: Array<{
    title: string
    rationale?: string
    citations?: Citation[]
    actions?: ('call_ai' | 'book' | 'directions' | 'message' | 'upload')[]
    steps?: string[]
    urgency?: Urgency
    requiresEvidence?: boolean
    relatedVenueId?: string
  }>
  summarySteps: string[]         // “solution steps given there”
  citations: Citation[]
  evidenceLock?: boolean
}
