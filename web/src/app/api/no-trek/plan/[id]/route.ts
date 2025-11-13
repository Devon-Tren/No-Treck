import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* ---------- Inline Plan type (avoid @ alias) ---------- */
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

/* ---------- Store ---------- */
type Store = Map<string, Plan>

declare global {
  // eslint-disable-next-line no-var
  var __planStore: Store | undefined
}

function getStore(): Store {
  if (!globalThis.__planStore) {
    globalThis.__planStore = new Map<string, Plan>()
  }
  return globalThis.__planStore
}

/* ---------- GET /api/plans/[id] ---------- */
export async function GET(_req: Request, ctx: { params: { id?: string } }) {
  const id = ctx?.params?.id
  if (!id) {
    return NextResponse.json({ error: 'Missing id param' }, { status: 400 })
  }

  const store = getStore()
  const plan = store.get(id)
  if (!plan) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Ensure serializable payload (e.g., if any Dates slipped in)
  const json = JSON.parse(JSON.stringify(plan))
  return NextResponse.json(json)
}
