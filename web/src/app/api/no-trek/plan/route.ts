import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* ---------- Inline types (avoid @ alias) ---------- */
type RiskTone = 'low' | 'moderate' | 'elevated' | 'severe' | string
type PlanTaskStep = { id: string; text: string; done?: boolean }
type PlanTaskCitation = { id?: string; title: string; url: string; source?: string }
type PlanTask = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done' | string
  dueAt?: string | null
  urgency?: 'info' | 'elevated' | 'severe' | string
  updatedAt?: string
  rationale?: string
  steps?: PlanTaskStep[]
  citations?: PlanTaskCitation[]
}
type Plan = {
  id: string
  title?: string
  createdAt?: string
  sourceSessionId?: string
  risk?: RiskTone
  solutionSteps?: string[]
  tasks: PlanTask[]
  [key: string]: unknown
}

/* ---------- In-memory store ---------- */
type Store = Map<string, Plan>
declare global {
  // eslint-disable-next-line no-var
  var __planStore: Store | undefined
}
function getStore(): Store {
  if (!globalThis.__planStore) globalThis.__planStore = new Map<string, Plan>()
  return globalThis.__planStore
}

/* ---------- POST /api/plans ---------- */
export async function POST(req: NextRequest) {
  let incoming: any
  try {
    incoming = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Build a safe Plan object with sane defaults
  const plan: Plan = {
    id: String(incoming?.id || randomUUID()),
    title: typeof incoming?.title === 'string' ? incoming.title : '',
    createdAt: typeof incoming?.createdAt === 'string' ? incoming.createdAt : new Date().toISOString(),
    sourceSessionId: typeof incoming?.sourceSessionId === 'string' ? incoming.sourceSessionId : undefined,
    risk: typeof incoming?.risk === 'string' ? incoming.risk : undefined,
    solutionSteps: Array.isArray(incoming?.solutionSteps) ? incoming.solutionSteps.map(String) : [],
    tasks: Array.isArray(incoming?.tasks) ? incoming.tasks.map((t: any) => ({
      id: String(t?.id || randomUUID()),
      title: String(t?.title || 'Untitled task'),
      status: typeof t?.status === 'string' ? t.status : 'todo',
      dueAt: typeof t?.dueAt === 'string' ? t.dueAt : null,
      urgency: typeof t?.urgency === 'string' ? t.urgency : undefined,
      updatedAt: typeof t?.updatedAt === 'string' ? t.updatedAt : new Date().toISOString(),
      rationale: typeof t?.rationale === 'string' ? t.rationale : undefined,
      steps: Array.isArray(t?.steps)
        ? t.steps.map((s: any) => ({
            id: String(s?.id || randomUUID()),
            text: String(s?.text || ''),
            done: Boolean(s?.done),
          }))
        : [],
      citations: Array.isArray(t?.citations)
        ? t.citations.map((c: any) => ({
            id: c?.id ? String(c.id) : undefined,
            title: String(c?.title || ''),
            url: String(c?.url || ''),
            source: c?.source ? String(c.source) : undefined,
          }))
        : [],
    })) : [],
  }

  const store = getStore()
  store.set(plan.id, plan)
  return NextResponse.json({ ok: true, id: plan.id })
}
