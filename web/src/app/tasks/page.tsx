// File: src/app/tasks/page.tsx
'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'

/* ============================== Types ============================== */

type RiskTone = 'low' | 'moderate' | 'severe' | string

type TaskStatus = 'todo' | 'doing' | 'done'

type CareTask = {
  id: string
  title: string
  status: TaskStatus
  dueAt?: string | null
  notes?: string
  linkedPlaceId?: string
  linkedInsightId?: string
  createdAt?: string
  fromIntake?: boolean
}

type TaskCitation = { title: string; url: string; source?: string }

type PlaceSummary = {
  id: string
  name: string
  address?: string
  distance_km?: number
  est_cost_min?: number
  est_cost_max?: number
  in_network?: boolean
}

type InsightSummary = {
  id: string
  title: string
  body: string
  urgency?: 'info' | 'elevated' | 'severe' | string
}

type IntakeExportPayload = {
  from?: string
  createdAt?: string
  risk?: RiskTone
  riskTrail?: RiskTone[]
  insights?: InsightSummary[]
  places?: PlaceSummary[]
  tasks?: {
    id: string
    title: string
    status: TaskStatus
    dueAt?: string | null
    notes?: string
    linkedPlaceId?: string
    linkedInsightId?: string
  }[]
}

type CoachRole = 'user' | 'assistant'

type CoachMessage = {
  id: string
  role: CoachRole
  text: string
  citations?: TaskCitation[]
}

/* ============================== Config ============================== */

const BRAND_BLUE = '#0E5BD8'

const ALLOWED_DOMAINS = [
  'nih.gov',
  'medlineplus.gov',
  'cdc.gov',
  'who.int',
  'nice.org.uk',
  'mayoclinic.org',
  'aafp.org',
  'cochranelibrary.com',
]

const TASKS_PERSIST_KEY = 'nt_tasks_page_v2'
const INTAKE_EXPORT_KEY = 'nt_intake_to_tasks_v1'

const TASKS_COACH_SYSTEM_PROMPT = `
You are Stella, the care-task coach for No Trek.

Length of reply:
- Do not reply in paragraphs reply in texts and if needed expand more but do not ramble on.
- Do not go over 2-3 sentences per reply unless abosulutely neccessary, aim for 2 sentences.
- Ask a question at the end if needed to give further clarity.
- Be intuitive and look for user engagement.

Context:
- The user already did some intake or planning.
- This page is about *doing the steps*, not diagnosing.
- Your job is to turn a list of steps into something that feels doable, meaningful, and worth it.

Style:
- Sound like a calm, smart nurse / care navigator texting a friend.
- Push gently, not with guilt. Make the “why” behind a task feel clear and personal.
- Translate chaos into a small set of priorities. Less overwhelm, more “I know what to do next.”

What you do here:
- Explain why specific tasks matter (safety, clarity, peace of mind, money, time).
- Help the user choose *which* tasks to do today vs later.
- Break big steps into smaller ones if they feel stuck.
- Suggest simple scripts for phone calls or messages.
- Encourage pacing: it's okay to do one thing at a time.

Boundaries:
- You are not a doctor or emergency service.
- Do NOT diagnose, prescribe, or recommend starting/stopping specific medications.
- Keep guidance educational and motivational.
- If a task describes a potential emergency (“go to ER”, “call 911”, etc.), reinforce that emergency steps should not be delayed.

Evidence:
- When you make factual medical claims or risk statements, attach citations from trusted domains only.
- Motivational / emotional support does NOT need citations.
`.trim()

/* ============================== Utils ============================== */

const uid = (p = 'm') => `${p}_${Math.random().toString(36).slice(2, 9)}`
const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const isDeclarative = (t?: string) => {
  if (!t) return false
  const s = t.trim()
  return s.length > 0 && (!s.endsWith('?') || /[.!] /.test(s))
}

function filterAllowed(cites?: TaskCitation[]) {
  const seen = new Set<string>()
  return (cites || []).filter(ci => {
    if (!ci?.url) return false
    const d = domainOf(ci.url)
    const ok = ALLOWED_DOMAINS.some(allow => d.endsWith(allow))
    if (!ok || seen.has(ci.url)) return false
    seen.add(ci.url)
    return true
  })
}

async function backfillCitations(text: string): Promise<TaskCitation[]> {
  try {
    const r = await fetch('/api/no-trek/cite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, allowedDomains: ALLOWED_DOMAINS }),
    })
    if (!r.ok) return []
    const j = await r.json()
    return filterAllowed(j.citations || [])
  } catch {
    return []
  }
}

function riskColor(risk: RiskTone): string {
  if (risk === 'severe') return 'border-red-400/70 text-red-100'
  if (risk === 'moderate') return 'border-amber-400/70 text-amber-100'
  return 'border-emerald-400/70 text-emerald-100'
}

/* ============================== Background & Nav ============================== */

function BreathingBackground({ risk }: { risk: RiskTone }) {
  const tint =
    risk === 'severe'
      ? 'rgba(248,113,113,0.75)'
      : risk === 'moderate'
      ? 'rgba(252,211,77,0.75)'
      : 'rgba(56,189,248,0.75)'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            'radial-gradient(1200px 800px at 80% 0%, rgba(15,118,255,0.28), transparent 60%), linear-gradient(180deg, #020617 0%, #020617 45%, #020617 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 640px at 72% 18%, ${tint}, transparent 60%)`,
          filter: 'blur(58px)',
          opacity: 0.28,
          animation: 'softPulse 11s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_center,transparent,rgba(0,0,0,0.55))]" />
    </div>
  )
}

function NavBar() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intake', label: 'Intake' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/explore', label: 'Explore' },
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
  ]

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.85)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/95 text-[11px] font-black tracking-tight text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.9)]">
            NT
          </div>
          <span className="text-xs font-semibold tracking-[0.26em] text-slate-100">
            NO TREK
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  'text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors',
                  link.href === '/tasks'
                    ? 'text-sky-300'
                    : 'text-slate-200/85 hover:text-sky-300',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href="/intake"
            className="rounded-2xl bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
          >
            Start with Stella
          </Link>
        </nav>
      </div>

      <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                'rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                link.href === '/tasks'
                  ? 'text-sky-300 border-sky-400/70'
                  : 'text-slate-200/90',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

function EmergencyBanner() {
  return (
    <div className="border-b border-red-500/30 bg-slate-950/80 text-[11px] text-slate-200 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 lg:px-8">
        <p>If this is an emergency, call 911 or your local emergency number.</p>
        <span className="hidden rounded-full border border-red-500/70 bg-red-500/15 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-red-200 sm:inline">
          NOT FOR EMERGENCIES
        </span>
      </div>
    </div>
  )
}

/* ============================== Page ============================== */

export default function TasksPage() {
  const [risk, setRisk] = useState<RiskTone>('low')
  const [riskTrail, setRiskTrail] = useState<RiskTone[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [places, setPlaces] = useState<PlaceSummary[]>([])
  const [insights, setInsights] = useState<InsightSummary[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([])
  const [coachDraft, setCoachDraft] = useState('')
  const [coachSending, setCoachSending] = useState(false)

  const [coachEvidenceLock, setCoachEvidenceLock] = useState(true)
  const [coachPreferCitations, setCoachPreferCitations] = useState(true)
  const [coachGateMsg, setCoachGateMsg] = useState<string | null>(null)

  const [engineConnected, setEngineConnected] = useState<boolean | null>(null)

  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'done'>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newDue, setNewDue] = useState('')
  const [episodeCreatedAt, setEpisodeCreatedAt] = useState<string | null>(null)
  const [fromLabel, setFromLabel] = useState<string | null>(null)

  /* ---------- Load from localStorage / intake export ---------- */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TASKS_PERSIST_KEY)
      if (stored) {
        const snap = JSON.parse(stored)
        if (Array.isArray(snap.tasks)) setTasks(snap.tasks)
        if (Array.isArray(snap.places)) setPlaces(snap.places)
        if (Array.isArray(snap.insights)) setInsights(snap.insights)
        if (snap.risk) setRisk(snap.risk)
        if (Array.isArray(snap.riskTrail)) setRiskTrail(snap.riskTrail)
        if (typeof snap.episodeCreatedAt === 'string') setEpisodeCreatedAt(snap.episodeCreatedAt)
        if (typeof snap.fromLabel === 'string') setFromLabel(snap.fromLabel)
        return
      }

      const exported = localStorage.getItem(INTAKE_EXPORT_KEY)
      if (exported) {
        const payload: IntakeExportPayload = JSON.parse(exported)
        const importedTasks: CareTask[] = (payload.tasks || []).map(t => ({
          id: t.id || uid('t'),
          title: t.title,
          status: t.status || 'todo',
          dueAt: t.dueAt ?? null,
          notes: t.notes,
          linkedPlaceId: t.linkedPlaceId,
          linkedInsightId: t.linkedInsightId,
          createdAt: payload.createdAt || new Date().toISOString(),
          fromIntake: true,
        }))
        setTasks(importedTasks)
        setPlaces(payload.places || [])
        setInsights(payload.insights || [])
        if (payload.risk) setRisk(payload.risk)
        if (Array.isArray(payload.riskTrail)) setRiskTrail(payload.riskTrail)
        if (payload.createdAt) setEpisodeCreatedAt(payload.createdAt)
        setFromLabel(payload.from || 'Intake')
        localStorage.removeItem(INTAKE_EXPORT_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      const snap = {
        tasks,
        places,
        insights,
        risk,
        riskTrail,
        episodeCreatedAt,
        fromLabel,
      }
      localStorage.setItem(TASKS_PERSIST_KEY, JSON.stringify(snap))
    } catch {
      // ignore
    }
  }, [tasks, places, insights, risk, riskTrail, episodeCreatedAt, fromLabel])

  /* ---------- Engine status ---------- */

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/no-trek/status', { cache: 'no-store' })
        const j = await r.json()
        setEngineConnected('connected' in j ? !!j.connected : true)
      } catch {
        setEngineConnected(false)
      }
    })()
  }, [])

  /* ---------- Task helpers ---------- */

  const today = new Date()

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  function isThisWeek(d: Date, now: Date) {
    const oneDay = 24 * 60 * 60 * 1000
    const diff = (d.getTime() - now.getTime()) / oneDay
    return diff >= 0 && diff <= 7
  }

  const sortedTasks = useMemo(() => {
    const copy = [...tasks]
    copy.sort((a, b) => {
      const order: Record<TaskStatus, number> = { todo: 0, doing: 1, done: 2 }
      const sDiff = order[a.status] - order[b.status]
      if (sDiff !== 0) return sDiff

      if (a.dueAt && b.dueAt) {
        const ad = new Date(a.dueAt).getTime()
        const bd = new Date(b.dueAt).getTime()
        if (!Number.isNaN(ad) && !Number.isNaN(bd)) return ad - bd
      } else if (a.dueAt) {
        return -1
      } else if (b.dueAt) {
        return 1
      }

      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return ac - bc
    })
    return copy
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return sortedTasks
    if (filter === 'done') return sortedTasks.filter(t => t.status === 'done')

    return sortedTasks.filter(t => {
      if (!t.dueAt) return false
      const d = new Date(t.dueAt)
      if (Number.isNaN(d.getTime())) return false
      if (filter === 'today') return isSameDay(d, today)
      if (filter === 'week') return isThisWeek(d, today)
      return true
    })
  }, [sortedTasks, filter])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done').length
    const doing = tasks.filter(t => t.status === 'doing').length
    const todo = tasks.filter(t => t.status === 'todo').length
    return { total, done, doing, todo }
  }, [tasks])

  const selectedTask = useMemo(
    () => tasks.find(t => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  function upsertTask(newTask: CareTask) {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === newTask.id)
      if (idx === -1) return [newTask, ...prev]
      const copy = [...prev]
      copy[idx] = newTask
      return copy
    })
  }

  function toggleTaskStatus(id: string) {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const next: TaskStatus =
          t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo'
        return { ...t, status: next, updatedAt: new Date().toISOString() }
      }),
    )
  }

  function clearDoneTasks() {
    setTasks(prev => prev.filter(t => t.status !== 'done'))
    if (selectedTask && selectedTask.status === 'done') {
      setSelectedTaskId(null)
    }
  }

  function handleAddTask() {
    const title = newTitle.trim()
    if (!title) return
    const task: CareTask = {
      id: uid('t'),
      title,
      status: 'todo',
      notes: newNotes.trim() || undefined,
      dueAt: newDue ? new Date(newDue).toISOString() : null,
      createdAt: new Date().toISOString(),
      fromIntake: false,
    }
    setTasks(prev => [task, ...prev])
    setNewTitle('')
    setNewNotes('')
    setNewDue('')
    if (!selectedTaskId) setSelectedTaskId(task.id)
  }

  /* ---------- Coach: send & ask Stella ---------- */

  async function sendCoach(textOverride?: string) {
    const text = (textOverride ?? coachDraft).trim()
    if (!text) return

    const userMsg: CoachMessage = {
      id: uid(),
      role: 'user',
      text,
    }
    setCoachMessages(prev => [...prev, userMsg])
    if (textOverride === undefined) setCoachDraft('')
    setCoachSending(true)
    setCoachGateMsg(null)

    const aId = uid('coach_a')
    setCoachMessages(prev => [...prev, { id: aId, role: 'assistant', text: '' }])

    try {
      const payloadMessages: any[] = [
        { role: 'system', content: TASKS_COACH_SYSTEM_PROMPT },
        ...coachMessages.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: userMsg.text },
      ]

      const r = await fetch('/api/no-trek/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          allowedDomains: ALLOWED_DOMAINS,
        }),
      })

      if (!r.ok) {
        const body = await r.text()
        await typeCoachFull(aId, `Error: ${r.status} — ${body.slice(0, 200)}`)
        setCoachSending(false)
        return
      }

      const data: { text?: string; citations?: TaskCitation[] } = await r.json()
      let finalCites = filterAllowed(data.citations)

      if (coachPreferCitations && isDeclarative(data.text) && finalCites.length === 0) {
        const back = await backfillCitations(data.text || '')
        if (back.length) {
          finalCites = back
        } else if (coachEvidenceLock) {
          setCoachGateMsg(
            'Some parts of this might not be fully citation-backed — treat this as coaching and education, not a diagnosis.',
          )
        }
      }

      if (finalCites.length > 0) {
        setCoachMessages(prev =>
          prev.map(m => (m.id === aId ? { ...m, citations: finalCites } : m)),
        )
      }

      await typeCoachFull(aId, data.text || '')
    } catch (e: any) {
      await typeCoachFull(
        aId,
        `I couldn't reach the coach engine. (${String(e?.message || e)})`,
      )
    } finally {
      setCoachSending(false)
    }
  }

  function typeCoachInto(id: string, chunk: string) {
    setCoachMessages(prev =>
      prev.map(m => (m.id === id ? { ...m, text: (m.text || '') + chunk } : m)),
    )
  }

  async function typeCoachFull(id: string, full: string) {
    if (!full) return
    const step = 18
    for (let i = 0; i < full.length; i += step) {
      typeCoachInto(id, full.slice(i, i + step))
      await new Promise(r => setTimeout(r, 10))
    }
  }

  async function handleAskStellaWhy(task: CareTask) {
    setSelectedTaskId(task.id)
    const place = task.linkedPlaceId
      ? places.find(p => p.id === task.linkedPlaceId) || null
      : null
    const insight = task.linkedInsightId
      ? insights.find(i => i.id === task.linkedInsightId) || null
      : null

    const contextLines: string[] = []
    contextLines.push(`Task title: "${task.title}"`)
    if (task.notes) contextLines.push(`Notes: ${task.notes}`)
    if (place)
      contextLines.push(
        `Linked place: ${place.name}${
          typeof place.distance_km === 'number' ? `, ${place.distance_km.toFixed(1)} km away` : ''
        }`,
      )
    if (insight) {
      contextLines.push(`Linked insight: ${insight.title}`)
      contextLines.push(`Insight summary: ${insight.body}`)
    }
    if (task.dueAt) {
      const d = new Date(task.dueAt)
      if (!Number.isNaN(d.getTime())) {
        contextLines.push(`Due around: ${d.toLocaleString()}`)
      }
    }

    const prompt = [
      'Can you explain why this specific care step matters, in simple terms, and give me a gentle push to actually do it?',
      '',
      ...contextLines,
    ].join('\n')

    await sendCoach(prompt)
  }

  /* ---------- Derived episode meta ---------- */

  const episodeLabel = useMemo(() => {
    if (!episodeCreatedAt) return fromLabel || 'Current care plan'
    const d = new Date(episodeCreatedAt)
    if (Number.isNaN(d.getTime())) return fromLabel || 'Current care plan'
    const dateStr = d.toLocaleDateString()
    return `${fromLabel || 'Care plan'} · started ${dateStr}`
  }, [episodeCreatedAt, fromLabel])

  const openCount = stats.total - stats.done

  const riskBadgeLabel =
    risk === 'severe'
      ? 'High-risk episode — stay on top of these steps.'
      : risk === 'moderate'
      ? 'Moderate risk — these steps help keep things from escalating.'
      : 'Low risk — focus is on clarity and staying ahead of problems.'

  /* ============================== Render ============================== */

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-slate-950 text-slate-50"
      style={
        {
          ['--brand-blue' as any]: BRAND_BLUE,
        } as CSSProperties
      }
    >
      <BreathingBackground risk={risk} />
      <style jsx global>{`
        :root {
          --brand-blue: ${BRAND_BLUE};
        }
        .pill {
          border-radius: 9999px;
        }
        .hover-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          will-change: transform;
        }
        .hover-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 36px rgba(20, 60, 180, 0.36),
            0 1px 0 rgba(255, 255, 255, 0.08) inset;
          border-color: rgba(148, 163, 184, 0.6) !important;
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes softPulse {
            0% {
              opacity: 0.2;
              transform: scale(1);
            }
            50% {
              opacity: 0.32;
              transform: scale(1.02);
            }
            100% {
              opacity: 0.2;
              transform: scale(1);
            }
          }
          @keyframes sectionIn {
            0% {
              opacity: 0;
              transform: translateY(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>

      <div className="relative z-10">
        <NavBar />
        <EmergencyBanner />

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                No Trek
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Care tasks & coaching
              </h1>
              <p className="text-sm text-slate-200/85">
                This is the place where scattered advice turns into a small set of concrete
                steps. Stella keeps you honest, but on your side.
              </p>
              <p className="text-[11px] text-slate-300/90">{episodeLabel}</p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div
                className={cx(
                  'inline-flex items-center gap-2 rounded-full border-[2px] bg-slate-900/80 px-3 py-1.5 text-[11px]',
                  riskColor(risk),
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>{riskBadgeLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100">
                <span
                  className={cx(
                    'h-2 w-2 rounded-full',
                    engineConnected
                      ? 'bg-emerald-400'
                      : engineConnected === false
                      ? 'bg-rose-400'
                      : 'bg-slate-400',
                  )}
                />
                <span>
                  {engineConnected === null
                    ? 'Checking coach'
                    : engineConnected
                    ? 'Connected to Stella'
                    : 'Base engine'}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics & filters */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-200/90">
              <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5">
                {stats.total} total steps
              </span>
              <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5">
                {openCount} active
              </span>
              <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5">
                {stats.done} done
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-200/90">
              {(['all', 'today', 'week', 'done'] as const).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cx(
                    'rounded-full border px-3 py-1.5 font-semibold uppercase tracking-[0.15em]',
                    filter === key
                      ? 'border-sky-400/80 bg-sky-500/20 text-sky-100'
                      : 'border-slate-600/80 bg-slate-900/80 text-slate-200 hover:bg-slate-800/90',
                  )}
                >
                  {key === 'all'
                    ? 'All'
                    : key === 'today'
                    ? 'Today'
                    : key === 'week'
                    ? 'This week'
                    : 'Done'}
                </button>
              ))}
              {stats.done > 0 && (
                <button
                  type="button"
                  onClick={clearDoneTasks}
                  className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 font-semibold uppercase tracking-[0.15em] text-slate-200 hover:bg-slate-800/90"
                >
                  Clear done
                </button>
              )}
            </div>
          </div>

          {/* Main layout */}
          <div
            className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
            style={{ alignItems: 'flex-start' }}
          >
            {/* Left: Task board */}
            <section
              className="hover-card relative w-full rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/80 p-4 shadow-[0_0_26px_rgba(15,23,42,0.9)] backdrop-blur"
              aria-label="Care tasks"
              style={{ animation: 'sectionIn 260ms ease-out both' }}
            >
              {/* Add task */}
              <div className="rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300/90">
                  Add a step
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300/90">
                  Drop something from your brain onto the board. It doesn&apos;t have to be
                  perfect.
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
                  <div className="space-y-2">
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g., Call urgent care to check same-day availability"
                      className="w-full rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none focus:border-slate-300"
                    />
                    <textarea
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      rows={2}
                      placeholder="Optional notes, scripts, or what you’re worried about."
                      className="w-full resize-none rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none focus:border-slate-300"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] text-slate-300/90">
                      Due (optional)
                      <input
                        type="datetime-local"
                        value={newDue}
                        onChange={e => setNewDue(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-slate-300"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="mt-auto inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.9)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(56,189,248,1)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!newTitle.trim()}
                    >
                      Add to board
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Tasks themselves don&apos;t need citations — this is just your real life
                      laid out. Stella adds evidence only when coaching.
                    </p>
                  </div>
                </div>
              </div>

              {/* Task list */}
              <div className="mt-4 space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-4 text-sm text-slate-200/90">
                    Nothing here yet. Add a step above, or send something from Intake and it
                    will land here automatically.
                  </div>
                ) : (
                  filteredTasks.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      place={t.linkedPlaceId ? places.find(p => p.id === t.linkedPlaceId) || null : null}
                      selected={selectedTaskId === t.id}
                      onSelect={() => setSelectedTaskId(t.id)}
                      onToggleStatus={() => toggleTaskStatus(t.id)}
                      onAskStella={() => handleAskStellaWhy(t)}
                    />
                  ))
                )}
              </div>

              <p className="mt-4 text-[11px] text-slate-400">
                Tip: Smaller steps win. If something feels impossible, you can ask Stella in
                the coach panel to break it down.
              </p>
            </section>

            {/* Right: Coach panel */}
            <section
              className="hover-card relative w-full rounded-[22px] border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4 shadow-[0_0_26px_rgba(15,23,42,0.9)] backdrop-blur"
              aria-label="Stella task coach"
              style={{ animation: 'sectionIn 260ms ease-out both' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/85">
                    Stella coach
                  </p>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Why this step matters
                  </h2>
                  <p className="text-[11px] text-slate-300/90">
                    Ask Stella about your tasks. She&apos;ll connect the dots and nudge you
                    forward — without shaming you.
                  </p>
                  {selectedTask && (
                    <p className="mt-1 text-[11px] text-sky-200/90">
                      Focused on:{' '}
                      <span className="font-semibold">&ldquo;{selectedTask.title}&rdquo;</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Coach controls */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-200/90">
                <label className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 bg-transparent"
                    checked={coachEvidenceLock}
                    onChange={e => setCoachEvidenceLock(e.target.checked)}
                  />
                  Evidence lock
                </label>
                <label className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 bg-transparent"
                    checked={coachPreferCitations}
                    onChange={e => setCoachPreferCitations(e.target.checked)}
                  />
                  Prefer citations (warn if missing)
                </label>
              </div>

              {coachGateMsg && (
                <div className="mt-2 rounded-xl border-[2px] border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                  {coachGateMsg}
                </div>
              )}

              {/* Coach thread */}
              <div className="mt-3 flex h-[48vh] flex-col rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-3">
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {coachMessages.length === 0 ? (
                    <div className="text-[11px] text-slate-300/90">
                      You can start with:
                      <ul className="mt-1 list-disc pl-4">
                        <li>“Why is this step worth doing today?”</li>
                        <li>“I&apos;m overwhelmed — what&apos;s the smallest next move?”</li>
                        <li>“Can you help me script what to say when I call?”</li>
                      </ul>
                    </div>
                  ) : (
                    coachMessages.map(m => (
                      <CoachBubble key={m.id} msg={m} />
                    ))
                  )}
                  {coachSending && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-200">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-100/60 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-100" />
                      </span>
                      <span>Stella is thinking…</span>
                    </div>
                  )}
                </div>

                {/* Composer */}
                <form
                  className="mt-2 flex items-end gap-2"
                  onSubmit={e => {
                    e.preventDefault()
                    sendCoach()
                  }}
                >
                  <textarea
                    value={coachDraft}
                    onChange={e => setCoachDraft(e.target.value)}
                    rows={2}
                    placeholder={
                      selectedTask
                        ? `Ask Stella about this step or how to make it doable…`
                        : 'Ask Stella about your tasks, priorities, or where to start…'
                    }
                    className="h-[60px] min-h-[54px] flex-1 resize-none rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 outline-none focus:border-slate-300"
                  />
                  <button
                    type="submit"
                    disabled={coachSending || !coachDraft.trim()}
                    className="inline-flex h-[60px] items-center justify-center rounded-xl bg-sky-500 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.9)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(56,189,248,1)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Ask Stella
                  </button>
                </form>
                <div className="mt-1 text-[10px] text-slate-400">
                  Stella&apos;s answers here are coaching and education only, not a diagnosis or
                  a replacement for your clinician.
                </div>
              </div>
            </section>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            No Trek is not a medical provider. This is educational support, not a diagnosis. If
            you have life-threatening symptoms, call your local emergency number.
          </p>
        </div>
      </div>
    </main>
  )
}

/* ============================== Task Card ============================== */

function TaskCard({
  task,
  place,
  selected,
  onSelect,
  onToggleStatus,
  onAskStella,
}: {
  task: CareTask
  place: PlaceSummary | null
  selected: boolean
  onSelect: () => void
  onToggleStatus: () => void
  onAskStella: () => void
}) {
  const dueLabel = useMemo(() => {
    if (!task.dueAt) return 'Whenever you can'
    const d = new Date(task.dueAt)
    if (Number.isNaN(d.getTime())) return 'When you can'
    return d.toLocaleString()
  }, [task.dueAt])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cx('group w-full text-left', selected && 'scale-[1.01]')}
    >
      <div
        className={cx(
          'hover-card relative w-full rounded-xl border-[2px] border-slate-700/80 bg-slate-900/90 p-3 text-slate-50 transition-transform',
          selected && 'border-sky-400/80 shadow-[0_0_26px_rgba(56,189,248,0.7)]',
        )}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={e => {
              e.stopPropagation()
              onToggleStatus()
            }}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-500/80 bg-slate-900/80"
          />
          <div className="min-w-0 flex-1">
            <p
              className={cx(
                'truncate text-sm font-semibold',
                task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-50',
              )}
            >
              {task.title}
            </p>
            {task.notes && (
              <p
                className={cx(
                  'mt-0.5 line-clamp-2 text-xs',
                  task.status === 'done' ? 'text-slate-500' : 'text-slate-200/90',
                )}
              >
                {task.notes}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300/90">
              <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5">
                {task.status === 'done'
                  ? 'Done'
                  : task.status === 'doing'
                  ? 'In progress'
                  : 'Not started'}
              </span>
              <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5">
                {dueLabel}
              </span>
              {place && (
                <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5">
                  {place.name}
                  {typeof place.distance_km === 'number'
                    ? ` · ${place.distance_km.toFixed(1)} km`
                    : ''}
                  {typeof place.est_cost_min === 'number' &&
                    typeof place.est_cost_max === 'number' &&
                    ` · est. $${Math.round(place.est_cost_min)}–${Math.round(
                      place.est_cost_max,
                    )}`}
                </span>
              )}
              {place?.in_network !== undefined && (
                <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5">
                  {place.in_network ? 'Likely in-network' : 'Check coverage'}
                </span>
              )}
              {task.fromIntake && (
                <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5">
                  From intake
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onAskStella()
            }}
            className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Ask Stella why this matters
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================== Coach Bubble ============================== */

function CoachBubble({ msg }: { msg: CoachMessage }) {
  const isUser = msg.role === 'user'
  const needsSources =
    !isUser && isDeclarative(msg.text) && (!msg.citations || msg.citations.length === 0)

  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'hover-card relative max-w-[88%] rounded-3xl border-[2px] px-3 py-2 shadow-sm sm:max-w-[82%]',
          isUser
            ? 'border-transparent bg-[var(--brand-blue)] text-slate-50'
            : 'border-slate-600/80 bg-slate-900/90 text-slate-50 backdrop-blur',
        )}
        style={{ animation: 'sectionIn 200ms ease-out both' }}
      >
        <p className="whitespace-pre-wrap break-words text-[13px] leading-6">
          {msg.text}
        </p>
        {!isUser && (
          <>
            {msg.citations && msg.citations.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.citations.map((c, i) => (
                  <CitationChip key={i} c={c} />
                ))}
              </div>
            ) : needsSources ? (
              <div className="mt-1 text-[10px] text-slate-300/90">
                If this gets more detailed or prescriptive, Stella will attach citations.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function CitationChip({ c }: { c: TaskCitation }) {
  const d = domainOf(c.url)
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border-[2px] border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-800/90"
      title={c.title}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3z"
        />
      </svg>
      {c.source || d || c.title}
    </a>
  )
}
