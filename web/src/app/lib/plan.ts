import { IntakeSnapshot, Plan, Task, Urgency } from './types/tasks'

const uid = () =>
  (globalThis as any).crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function buildPlanFromIntake(s: IntakeSnapshot): Plan {
  const now = new Date().toISOString()
  const tasks: Task[] = (s.recommendations || []).map((r) => ({
    id: uid(),
    title: r.title,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
    urgency: r.urgency ?? s.risk ?? ('info' as Urgency),
    requiresEvidence: !!r.requiresEvidence || !!s.evidenceLock,
    steps: r.steps?.map((text) => ({ id: uid(), text, done: false })) ?? [],
    actions: r.actions ?? [],
    citations: r.citations ?? [],
    rationale: r.rationale,
    relatedVenueId: r.relatedVenueId,
  }))

  return {
    id: uid(),
    title: 'Care Plan',
    createdAt: now,
    risk: s.risk ?? ('info' as Urgency),
    tasks,
    citations: s.citations ?? [],
    solutionSteps: s.summarySteps ?? [],
    evidenceLock: !!s.evidenceLock,
    sourceSessionId: s.sessionId,
  }
}
