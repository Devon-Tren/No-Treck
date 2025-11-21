// File: src/app/tasks/page.tsx
'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'

/* ============================== Types ============================== */
type RiskTone = 'low' | 'moderate' | 'elevated' | 'severe' | string

type TaskStep = { id: string; text: string; done?: boolean }
type TaskCitation = { id?: string; title: string; url: string; source?: string }
type Task = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  urgency?: 'info' | 'elevated' | 'severe' | string
  dueAt?: string | null
  updatedAt?: string
  rationale?: string
  steps?: TaskStep[]
  citations?: TaskCitation[]
  // Optional extras if present from Intake/Places
  phone?: string
  placeName?: string
  address?: string
  url?: string
}
type Plan = {
  id: string
  title: string
  createdAt: string
  sourceSessionId?: string
  risk?: RiskTone
  solutionSteps?: string[]
  tasks: Task[]
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

/* ============================== Utils ============================== */
const uid = (p = 'x') => `${p}_${Math.random().toString(36).slice(2, 9)}`
function clsx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(' ')
}
function isToday(iso?: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  const n = new Date()
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  )
}
function domainOf(url?: string) {
  try {
    return new URL(String(url)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
function allowedOnly(cites?: TaskCitation[]) {
  const seen = new Set<string>()
  return (cites || []).filter((c) => {
    if (!c?.url) return false
    const d = domainOf(c.url)
    const ok = ALLOWED_DOMAINS.some((ad) => d.endsWith(ad))
    if (!ok || seen.has(c.url)) return false
    seen.add(c.url)
    return true
  })
}
function fetchJSON<T = any>(url: string): Promise<T | null> {
  return fetch(url, { cache: 'no-store' })
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null)
}
async function fetchPlan(planId: string): Promise<Plan | null> {
  for (const url of [`/api/no-trek/plan/${planId}`, `/api/plans/${planId}`]) {
    const j = await fetchJSON<Plan>(url)
    if (j) return j
  }
  return null
}
function formatDue(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}
function escapeICalText(s: string) {
  return s.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n')
}

/* ---------------- Splash: wordmark, fades out (Tasks) ---------------- */

function SplashIntro({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sitTime = reduced ? 0 : 1100
    const fadeDur = reduced ? 0 : 650
    const t1 = setTimeout(() => setFade(true), sitTime)
    const t2 = setTimeout(() => onDone(), sitTime + fadeDur)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-700 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* animated orb backdrop – same vibe as landing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0E5BD8]/40 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 bg-gradient-to-tr from-[#0E5BD8]/25 via-sky-500/20 to-transparent blur-3xl animate-[spin_40s_linear_infinite]" />
      </div>
      <div className="relative select-none text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight italic text-white drop-shadow-[0_0_40px_rgba(37,99,235,0.75)]">
        Tasks
      </div>
    </div>
  )
}

/* ============================== Page ============================== */
export default function TasksPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [splashDone, setSplashDone] = useState(false)

  // Filters / options
  const [query, setQuery] = useState('')
  const [showEvidenceLock, setShowEvidenceLock] = useState(true)
  const [showDone, setShowDone] = useState(true)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'info' | 'elevated' | 'severe'>(
    'all',
  )

  // New task composer
  const [newTitle, setNewTitle] = useState('')
  const [newRationale, setNewRationale] = useState('')
  const [newUrgency, setNewUrgency] = useState<'info' | 'elevated' | 'severe'>('info')
  const [askAISteps, setAskAISteps] = useState(true)
  const [creatingTask, setCreatingTask] = useState(false)

  // AI helper for steps
  const [designingStepsId, setDesigningStepsId] = useState<string | null>(null)
  const [coachMsg, setCoachMsg] = useState<string | null>(null)

  // Manual step composer (for selected task)
  const [stepDraft, setStepDraft] = useState('')
  useEffect(() => {
    setStepDraft('')
  }, [selectedId])

  // Notifications
  const [notificationSupported, setNotificationSupported] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notified, setNotified] = useState<Record<string, boolean>>({})

  // Import by ?planId=
  useEffect(() => {
    const u = new URL(window.location.href)
    const id = u.searchParams.get('planId') || u.searchParams.get('id')
    if (!id) return
    ;(async () => {
      const p = await fetchPlan(id)
      if (p) {
        setPlan(p)
        const firstActive = p.tasks?.find((t) => t.status !== 'done')?.id
        setSelectedId(firstActive || p.tasks?.[0]?.id || null)
      }
    })()
  }, [])

  // AI connection
  useEffect(() => {
    ;(async () => {
      try {
        const j = await fetchJSON<{ connected: boolean }>('/api/no-trek/status')
        setConnected(j ? !!j.connected : false)
      } catch {
        setConnected(false)
      }
    })()
  }, [])

  // Notification capability
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window) {
      setNotificationSupported(true)
      try {
        setNotificationsEnabled(Notification.permission === 'granted')
      } catch {
        setNotificationsEnabled(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!notificationSupported || !notificationsEnabled) return
    if (typeof window === 'undefined') return

    const handle = window.setInterval(() => {
      const now = Date.now()
      ;(plan?.tasks || []).forEach((t) => {
        if (!t.dueAt || t.status === 'done') return
        const dueTs = new Date(t.dueAt).getTime()
        const delta = dueTs - now
        // Notify within ~5 minutes before or shortly after due time
        if (delta < 5 * 60 * 1000 && delta > -10 * 60 * 1000) {
          setNotified((prev) => {
            if (prev[t.id]) return prev
            try {
              if (Notification.permission === 'granted') {
                new Notification(t.title, {
                  body: t.rationale || t.placeName || 'No Trek task reminder',
                  tag: t.id,
                })
              }
            } catch {
              // ignore
            }
            return { ...prev, [t.id]: true }
          })
        }
      })
    }, 60_000)

    return () => window.clearInterval(handle)
  }, [notificationSupported, notificationsEnabled, plan?.tasks])

  async function enableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    try {
      const perm = await Notification.requestPermission()
      setNotificationsEnabled(perm === 'granted')
    } catch {
      setNotificationsEnabled(false)
    }
  }

  // Derived: filtered tasks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const tasks = (plan?.tasks || []).filter((t) => {
      if (showEvidenceLock && allowedOnly(t.citations).length === 0) return false
      if (urgencyFilter !== 'all' && (t.urgency || 'info') !== urgencyFilter) return false

      if (!q) return true
      const hay = [
        t.title,
        t.rationale,
        ...(t.steps || []).map((s) => s.text),
        ...(t.citations || []).map((c) => `${c.title} ${c.source} ${c.url}`),
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    return tasks
  }, [plan, query, showEvidenceLock, urgencyFilter])

  // Grouping
  const groups = useMemo(() => {
    const today: Task[] = []
    const upcoming: Task[] = []
    const done: Task[] = []
    for (const t of filtered) {
      if (t.status === 'done') {
        done.push(t)
        continue
      }
      if (!t.dueAt || isToday(t.dueAt)) today.push(t)
      else upcoming.push(t)
    }
    return { today, upcoming, done }
  }, [filtered])

  // Progress
  const total = plan?.tasks?.length || 0
  const completed = (plan?.tasks || []).filter((t) => t.status === 'done').length
  const progressPct = total ? Math.round((completed / total) * 100) : 0

  const selected = (plan?.tasks || []).find((t) => t.id === selectedId) || null

  function setPlanTasks(updater: (prev: Task[]) => Task[]) {
    if (!plan) return
    setPlan({ ...plan, tasks: updater(plan.tasks || []) })
  }

  function toggleComplete(id: string) {
    setPlanTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'done' ? 'todo' : 'done',
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
  }
  function toggleStep(taskId: string, stepId: string) {
    setPlanTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          steps: (t.steps || []).map((s) =>
            s.id === stepId ? { ...s, done: !s.done } : s,
          ),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }
  function setDue(taskId: string, iso?: string) {
    setPlanTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, dueAt: iso || null, updatedAt: new Date().toISOString() }
          : t,
      ),
    )
  }

  // Quick dates
  function quickDue(when: 'today' | 'tmrwAM' | 'weekend') {
    if (!selected) return
    const now = new Date()
    let d = new Date()
    if (when === 'today') {
      d.setHours(Math.min(23, now.getHours() + 3), 0, 0, 0)
    } else if (when === 'tmrwAM') {
      d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        9,
        0,
        0,
        0,
      )
    } else {
      const day = now.getDay()
      const add = day === 6 ? 0 : day === 0 ? 0 : 6 - day
      d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + add,
        10,
        0,
        0,
        0,
      )
    }
    setDue(selected.id, d.toISOString())
  }

  // Add manual step to selected task
  function addManualStep() {
    if (!selectedId || !stepDraft.trim()) return
    const text = stepDraft.trim()
    const newStep: TaskStep = { id: uid('s'), text, done: false }
    setPlanTasks((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              steps: [...(t.steps || []), newStep],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
    setStepDraft('')
  }

  // Sources (across visible tasks)
  const sources = useMemo(() => {
    const seen = new Set<string>()
    const out: TaskCitation[] = []
    filtered.forEach((t) =>
      allowedOnly(t.citations).forEach((c) => {
        if (!seen.has(c.url)) {
          seen.add(c.url!)
          out.push(c)
        }
      }),
    )
    return out
  }, [filtered])

  // Exporters
  function exportTxt() {
    const lines: string[] = []
    lines.push(`No Trek — Plan: ${plan?.title || ''}`)
    lines.push(
      `Risk: ${plan?.risk || '—'} | Created: ${
        plan ? new Date(plan.createdAt).toLocaleString() : '—'
      }`,
    )
    lines.push(`Progress: ${completed}/${total} (${progressPct}%)`)
    lines.push('')
    ;(plan?.tasks || []).forEach((t) => {
      lines.push(
        `- [${
          t.status === 'done' ? 'x' : ' '
        }] ${t.title}${t.dueAt ? ` — due ${formatDue(t.dueAt)}` : ''}`,
      )
      if (t.rationale) lines.push(`    Why: ${t.rationale}`)
      ;(t.steps || []).forEach((s) =>
        lines.push(`    • [${s.done ? 'x' : ' '}] ${s.text}`),
      )
      const cites = allowedOnly(t.citations)
      if (cites.length) {
        lines.push('    Sources:')
        cites.forEach((c) => lines.push(`      - ${c.title} — ${c.url}`))
      }
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-trek-plan-${plan?.id || uid('plan')}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function exportICS() {
    // Simple VEVENTs (one per task with dueAt)
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const rows: string[] = []
    rows.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//No Trek//Tasks//EN')
    ;(plan?.tasks || []).forEach((t) => {
      if (!t.dueAt) return
      const dt = new Date(t.dueAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      rows.push('BEGIN:VEVENT')
      rows.push(`UID:${t.id}@no-trek`)
      rows.push(`DTSTAMP:${stamp}`)
      rows.push(`DTSTART:${dt}`)
      rows.push(`SUMMARY:${escapeICalText(t.title)}`)
      rows.push(`DESCRIPTION:${escapeICalText(t.rationale || '')}`)
      rows.push('END:VEVENT')
    })
    rows.push('END:VCALENDAR')
    const blob = new Blob([rows.join('\r\n')], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-trek-plan-${plan?.id || uid('plan')}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Concierge call
  const [callViz, setCallViz] = useState<{
    status: 'idle' | 'calling' | 'ok' | 'failed'
    transcript: string[]
  }>({ status: 'idle', transcript: [] })

  async function requestAICall(task?: Task) {
    setCallViz({
      status: 'calling',
      transcript: ['Dialing…', 'Navigating phone tree…'],
    })
    try {
      const r = await fetch('/api/no-trek/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: {
            id: task?.id,
            title: task?.title,
            phone: task?.phone,
            placeName: task?.placeName,
            address: task?.address,
          },
        }),
      })
      const ok = r.ok
      setCallViz((v) => ({
        status: ok ? 'ok' : 'failed',
        transcript: [...v.transcript, ok ? 'Connected.' : 'Call init failed.'],
      }))
    } catch {
      setCallViz((v) => ({
        status: 'failed',
        transcript: [...v.transcript, 'Could not place the call.'],
      }))
    }
  }

  // AI helper: suggest rationale + steps for a task
  async function autoDesignSteps(taskId: string, snapshot?: Task) {
    const task = snapshot || (plan?.tasks || []).find((t) => t.id === taskId)
    if (!task) return
    setDesigningStepsId(taskId)
    setCoachMsg(null)
    try {
      const res = await fetch('/api/no-trek/tasks/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, allowedDomains: ALLOWED_DOMAINS }),
      })
      if (!res.ok) {
        if (res.status === 404) {
          // Friendlier handling for your missing endpoint instead of dumping HTML
          setCoachMsg(
            'AI steps are not set up yet. You can still add your own checklist for now.',
          )
        } else {
          setCoachMsg(
            `AI helper temporarily unavailable (status ${res.status}). You can keep using manual steps.`,
          )
        }
        return
      }
      const data = (await res.json()) as {
        rationale?: string
        steps?: string[]
        citations?: TaskCitation[]
        solutionSteps?: string[]
      }
      const newSteps = (data.steps || []).map((text) => ({ id: uid('s'), text }))
      const newCites = allowedOnly(data.citations)

      setPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          solutionSteps:
            data.solutionSteps && data.solutionSteps.length
              ? data.solutionSteps
              : prev.solutionSteps,
          tasks: (prev.tasks || []).map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  rationale: data.rationale || t.rationale,
                  steps: newSteps.length ? newSteps : t.steps,
                  citations: newCites.length ? newCites : t.citations,
                  updatedAt: new Date().toISOString(),
                }
              : t,
          ),
        }
      })
      if (newSteps.length) setCoachMsg('AI suggested steps added.')
    } catch {
      setCoachMsg(
        'AI helper is currently unavailable. Please try again later or add steps manually.',
      )
    } finally {
      setDesigningStepsId(null)
    }
  }

  // New task creation (with optional AI)
  async function createTaskFromDraft() {
    const title = newTitle.trim()
    if (!title || creatingTask) return
    setCreatingTask(true)
    setCoachMsg(null)

    const taskId = uid('t')
    const baseTask: Task = {
      id: taskId,
      title,
      status: 'todo',
      urgency: newUrgency,
      dueAt: null,
      rationale: newRationale.trim() || undefined,
      steps: [],
      citations: [],
      updatedAt: new Date().toISOString(),
    }

    setPlan((prev) => {
      const base: Plan =
        prev ?? {
          id: uid('plan'),
          title: 'My follow-ups',
          createdAt: new Date().toISOString(),
          tasks: [],
          risk: 'low',
          solutionSteps: [],
        }
      return { ...base, tasks: [baseTask, ...(base.tasks || [])] }
    })
    setSelectedId(taskId)
    setNewTitle('')
    setNewRationale('')

    if (askAISteps && connected) {
      await autoDesignSteps(taskId, { ...baseTask })
    }
    setCreatingTask(false)
  }

  // Risk badge tone
  function riskBadgeClass(r?: RiskTone) {
    if (r === 'severe') return 'border-red-400/60 text-red-200'
    if (r === 'elevated' || r === 'moderate') return 'border-amber-400/60 text-amber-100'
    return 'border-emerald-400/60 text-emerald-100'
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50"
      style={{ ['--brand-blue' as any]: BRAND_BLUE } as CSSProperties}
    >
      {/* Background: match landing page aesthetic */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0E5BD8]/25 blur-3xl animate-[pulse_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 bg-gradient-to-tr from-[#0E5BD8]/20 via-sky-500/10 to-transparent blur-3xl animate-[spin_50s_linear_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-sky-400/15 blur-3xl animate-[pulse_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_#020617_55%)]" />
      </div>

      {!splashDone && <SplashIntro onDone={() => setSplashDone(true)} />}

      <div
        className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-700 ${
          splashDone ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {/* Breadcrumbs for smooth navigation from Landing / Intake */}
            <nav className="flex items-center gap-2 text-[11px] text-slate-300/80">
              <Link href="/" className="hover:text-slate-100 transition-colors">
                Home
              </Link>
              <span className="opacity-50">/</span>
              <Link href="/intake" className="hover:text-slate-100 transition-colors">
                Intake
              </Link>
              <span className="opacity-50">/</span>
              <span className="text-slate-100">Tasks</span>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight italic">
                Tasks
              </div>
              <div className="text-xs text-slate-200/80 hidden sm:block">
                Your living care map after Intake — organized, scheduled, and backed by
                sources.
              </div>
            </div>

            {plan && (
              <div className="inline-flex flex-wrap items-center gap-2 text-[11px] text-slate-200/80">
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1">
                  Plan:&nbsp;
                  <span className="font-medium text-slate-50">{plan.title}</span>
                </span>
                {plan.sourceSessionId && (
                  <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2.5 py-1">
                    From session&nbsp;{plan.sourceSessionId}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border-[2px] bg-transparent px-2.5 py-1 text-xs',
                riskBadgeClass(plan?.risk),
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Risk:{' '}
              {plan?.risk ?? '—'}
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-700 bg-slate-900/70 px-3 py-1 backdrop-blur">
              <span
                className={clsx(
                  'h-2 w-2 rounded-full',
                  connected
                    ? 'bg-emerald-400'
                    : connected === false
                    ? 'bg-rose-400'
                    : 'bg-zinc-400',
                )}
              />
              <span className="text-xs text-slate-100/90">
                {connected === null ? 'Checking engine' : connected ? 'Stella linked' : 'Base engine'}
              </span>
            </div>
            <button
              onClick={() => setSourcesOpen(true)}
              className="rounded-full px-3 py-1 text-xs text-slate-100/90 hover:bg-slate-900 border-[2px] border-slate-700/80"
            >
              Sources ({sources.length})
            </button>
            <button
              onClick={exportTxt}
              className="rounded-full px-3 py-1 text-xs text-slate-100/90 hover:bg-slate-900 border-[2px] border-slate-700/80"
            >
              Export .txt
            </button>
            <button
              onClick={exportICS}
              className="rounded-full px-3 py-1 text-xs text-slate-100/90 hover:bg-slate-900 border-[2px] border-slate-700/80"
            >
              Export .ics
            </button>
          </div>
        </header>

        {/* Top controls */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 backdrop-blur px-3 py-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, steps, or sources…"
              className="bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-400 min-w-[16ch]"
              aria-label="Search tasks"
            />
          </div>

          <label className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100/90">
            <input
              type="checkbox"
              checked={showEvidenceLock}
              onChange={(e) => setShowEvidenceLock(e.target.checked)}
              className="h-3.5 w-3.5 bg-transparent"
            />
            Evidence lock
          </label>

          <label className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100/90">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
              className="h-3.5 w-3.5 bg-transparent"
            />
            Show completed
          </label>

          {/* Urgency filter to focus the list */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-100/90">
            <span className="text-slate-300/90">Focus</span>
            {(
              [
                ['all', 'All'],
                ['info', 'Routine'],
                ['elevated', 'Elevated'],
                ['severe', 'Severe'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setUrgencyFilter(value)}
                className={clsx(
                  'rounded-full px-2.5 py-0.5 border text-[11px] transition-colors',
                  urgencyFilter === value
                    ? 'border-slate-200 bg-slate-100/10 text-slate-50'
                    : 'border-transparent bg-transparent text-slate-300 hover:bg-slate-800/80',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {notificationSupported && (
              <button
                type="button"
                onClick={() =>
                  notificationsEnabled
                    ? setNotificationsEnabled(false)
                    : enableNotifications()
                }
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs border',
                  notificationsEnabled
                    ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                    : 'border-slate-700 bg-slate-900/80 text-slate-100/90 hover:bg-slate-800',
                )}
              >
                {notificationsEnabled ? 'Reminders on' : 'Enable reminders'}
              </button>
            )}

            {/* Progress */}
            <div className="inline-flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 backdrop-blur">
              <span className="text-xs text-slate-100/90">Progress</span>
              <div className="h-2 w-36 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-slate-100"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs text-slate-300">
                {completed}/{total}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left: Today / Upcoming / Completed */}
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <TaskGroup
              title="Today"
              empty="No tasks for today."
              items={groups.today}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleDone={toggleComplete}
            />
            <TaskGroup
              title="Upcoming"
              empty="Nothing scheduled."
              items={groups.upcoming}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleDone={toggleComplete}
              showDue
            />
            {showDone && (
              <TaskGroup
                title="Completed"
                empty="Nothing completed yet."
                items={groups.done}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onToggleDone={toggleComplete}
                completed
              />
            )}
          </aside>

          {/* Center: Details */}
          <section className="col-span-12 lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover-card min-h-[280px]">
            {selected ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-50">
                      {selected.title}
                    </h2>
                    <p className="text-xs text-slate-300/90">
                      Status: {selected.status} • Urgency: {selected.urgency ?? 'info'}{' '}
                      {selected.dueAt ? `• Due ${formatDue(selected.dueAt)}` : ''}
                    </p>
                    {selected.rationale && (
                      <p className="mt-1 text-sm text-slate-100/90">
                        <span className="text-slate-400">Why: </span>
                        {selected.rationale}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleComplete(selected.id)}
                      className={clsx(
                        'rounded-lg px-3 py-1.5 text-sm border',
                        selected.status === 'done'
                          ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                          : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
                      )}
                    >
                      {selected.status === 'done' ? 'Done' : 'Mark done'}
                    </button>
                    <button
                      onClick={() => requestAICall(selected)}
                      className="rounded-lg px-3 py-1.5 text-sm border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      title="Have No Trek call the clinic or provider"
                    >
                      Have No Trek call
                    </button>
                  </div>
                </div>

                {coachMsg && (
                  <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                    {coachMsg}
                  </div>
                )}

                {/* Evidence gate hint */}
                {showEvidenceLock && allowedOnly(selected.citations).length === 0 && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    This task doesn’t have citations from trusted medical domains yet. Add
                    sources in your session, or toggle off “Evidence lock” to view all tasks.
                  </div>
                )}

                {/* Steps */}
                <section>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200">Steps</h3>
                    <button
                      type="button"
                      onClick={() => autoDesignSteps(selected.id)}
                      disabled={!!designingStepsId || !connected}
                      className={clsx(
                        'rounded-full pill px-3 py-1 text-[11px]',
                        designingStepsId === selected.id || !connected
                          ? 'opacity-60 cursor-default'
                          : 'hover:bg-slate-800',
                      )}
                    >
                      {designingStepsId === selected.id ? 'Designing…' : 'Ask AI for steps'}
                    </button>
                  </div>
                  {selected.steps && selected.steps.length > 0 ? (
                    <ul className="space-y-1">
                      {selected.steps.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5"
                        >
                          <input
                            type="checkbox"
                            checked={!!s.done}
                            onChange={() => toggleStep(selected.id, s.id)}
                            className="h-4 w-4"
                            aria-label={`Mark step: ${s.text}`}
                          />
                          <span
                            className={clsx(
                              'text-sm text-slate-100',
                              s.done && 'line-through text-slate-400',
                            )}
                          >
                            {s.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-300">
                      No steps yet. You can add them yourself or let the AI suggest a
                      checklist.
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={stepDraft}
                      onChange={(e) => setStepDraft(e.target.value)}
                      placeholder="Add a step…"
                      className="flex-1 rounded-md bg-slate-950/60 border border-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={addManualStep}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </section>

                {/* Citations */}
                {allowedOnly(selected.citations).length > 0 && (
                  <section>
                    <h3 className="mb-1 text-xs font-semibold text-slate-200">
                      Citations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allowedOnly(selected.citations).map((c, i) => (
                        <a
                          key={c.id || i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100 hover:bg-slate-800"
                          title={c.title}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              fill="currentColor"
                              d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3z"
                            />
                          </svg>
                          {c.source || domainOf(c.url) || c.title}
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Quick scheduling */}
                <section>
                  <h3 className="mb-1 text-xs font-semibold text-slate-200">Schedule</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={
                        selected.dueAt
                          ? new Date(selected.dueAt).toISOString().slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setDue(
                          selected.id,
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        )
                      }
                      className="rounded-md bg-slate-950/60 border border-slate-800 px-2 py-1 text-slate-100 text-xs"
                      aria-label="Due date"
                    />
                    <button
                      onClick={() => quickDue('today')}
                      className="rounded-full pill px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                    >
                      Later today
                    </button>
                    <button
                      onClick={() => quickDue('tmrwAM')}
                      className="rounded-full pill px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                    >
                      Tomorrow 9am
                    </button>
                    <button
                      onClick={() => quickDue('weekend')}
                      className="rounded-full pill px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800"
                    >
                      This weekend
                    </button>
                  </div>
                </section>

                {/* Place quick links (if present) */}
                {(selected.phone || selected.url || selected.address) && (
                  <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <h3 className="text-xs text-slate-200">Location</h3>
                    <p className="text-sm text-slate-50 mt-1">
                      {selected.placeName || 'Care site'}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-100">
                      {selected.phone && (
                        <a
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 hover:bg-slate-800"
                          href={`tel:${selected.phone}`}
                        >
                          Call
                        </a>
                      )}
                      {selected.url && (
                        <a
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 hover:bg-slate-800"
                          href={selected.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Website
                        </a>
                      )}
                      {selected.address && (
                        <a
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 hover:bg-slate-800"
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            selected.address,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Directions
                        </a>
                      )}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid h-[60vh] place-items-center text-center text-slate-200 text-sm">
                <div className="space-y-2 max-w-xs">
                  <p>Select a task from the left to see details, steps, and citations.</p>
                  <p className="text-xs text-slate-400">
                    Tasks here are the “doing” half of your Intake plan.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Right: New task + Plan context + Stella help */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            {/* New task composer */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover-card">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">New task</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createTaskFromDraft()
                }}
                className="space-y-2"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What do you need to do?"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                  required
                />
                <textarea
                  value={newRationale}
                  onChange={(e) => setNewRationale(e.target.value)}
                  rows={2}
                  placeholder="Optional: why this matters, symptoms, or context…"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-800 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 resize-none"
                />
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-300">Urgency:</span>
                  <select
                    value={newUrgency}
                    onChange={(e) =>
                      setNewUrgency(e.target.value as 'info' | 'elevated' | 'severe')
                    }
                    className="rounded-md bg-slate-950/70 border border-slate-800 px-2 py-1 text-xs text-slate-100"
                  >
                    <option value="info">Info / low</option>
                    <option value="elevated">Elevated</option>
                    <option value="severe">Severe</option>
                  </select>
                  <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={askAISteps}
                      onChange={(e) => setAskAISteps(e.target.checked)}
                      className="h-3.5 w-3.5 bg-transparent"
                    />
                    Ask AI for steps
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || creatingTask}
                  className={clsx(
                    'mt-1 w-full rounded-lg border px-3 py-1.5 text-sm',
                    creatingTask
                      ? 'border-slate-700 bg-slate-900 text-slate-300 opacity-70'
                      : 'border-sky-500/80 bg-[var(--brand-blue)] text-white hover:bg-slate-900',
                  )}
                >
                  {creatingTask ? 'Adding…' : 'Add task'}
                </button>
                <p className="mt-1 text-[10px] text-slate-400">
                  Tasks live only in your browser unless you import a plan. AI steps use the
                  same medical-safe engine as Intake (once configured).
                </p>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover-card">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">
                Solution steps
              </h2>
              {plan?.solutionSteps?.length ? (
                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-100">
                  {plan.solutionSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-300">
                  No high-level steps available yet. Ask AI for steps on a task to start
                  building this.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover-card">
              <h2 className="mb-2 text-sm font-semibold text-slate-100">Plan</h2>
              <p className="text-sm text-slate-100">{plan?.title ?? '—'}</p>
              <p className="text-xs text-slate-300">
                Created: {plan ? new Date(plan.createdAt).toLocaleString() : '—'}
              </p>
              {plan?.sourceSessionId && (
                <p className="text-xs text-slate-300">
                  From session: {plan.sourceSessionId}
                </p>
              )}
              <div className="mt-2 text-xs text-slate-300">
                Tasks: {total} • Completed: {completed} • Evidence-locked:{' '}
                {showEvidenceLock ? 'On' : 'Off'}
              </div>
            </section>

            {/* Stella helper / transition back to Intake */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover-card">
              <h2 className="mb-1 text-sm font-semibold text-slate-100">
                Need to adjust the plan?
              </h2>
              <p className="text-xs text-slate-300 mb-2">
                If your situation changed, you can re-open Intake with Stella and update
                your care map. Tasks will follow.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href="/intake"
                  className="rounded-full border border-sky-500/70 bg-slate-900 px-3 py-1.5 text-slate-100 hover:bg-slate-800"
                >
                  Back to Intake
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100 hover:bg-slate-800"
                >
                  Home
                </Link>
              </div>
            </section>

            {callViz.status !== 'idle' && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-100 font-medium">
                    {callViz.status === 'calling'
                      ? 'Calling…'
                      : callViz.status === 'ok'
                      ? 'Connected'
                      : 'Call failed'}
                  </div>
                  <button
                    onClick={() => setCallViz({ status: 'idle', transcript: [] })}
                    className="text-[11px] text-slate-300 hover:underline"
                  >
                    Hide
                  </button>
                </div>
                <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                  {callViz.transcript.map((t, i) => (
                    <div key={i} className="text-[11px] text-slate-200">
                      {t}
                    </div>
                  ))}
                </div>
                {callViz.status === 'calling' && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-1/2 animate-pulse bg-slate-100" />
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* Sources panel */}
      {sourcesOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSourcesOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0E223B] shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
              <div>
                <h3 className="text-white font-semibold">Plan sources</h3>
                <p className="text-[11px] text-white/65 mt-0.5">
                  Trusted medical domains only.
                </p>
              </div>
              <button
                onClick={() => setSourcesOpen(false)}
                className="rounded-full pill px-3 py-1.5 text-white/90 hover:bg-white/10 text-xs"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
              {sources.length === 0 ? (
                <p className="text-white/75 text-sm">
                  No sources yet. As tasks include citations, they’ll appear here.
                </p>
              ) : (
                sources.map((s, i) => (
                  <a
                    key={s.id || i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border-[2px] border-white/20 bg-white/[0.04] p-3 hover:bg-white/[0.08]"
                  >
                    <div className="text-white/90 text-sm font-medium">
                      {s.title || s.url}
                    </div>
                    <div className="text-white/70 text-xs mt-0.5">{s.url}</div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared styles */}
      <style jsx global>{`
        :root {
          --brand-blue: ${BRAND_BLUE};
        }
        .pill {
          border: 2px solid rgba(148, 163, 184, 0.6);
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 9999px;
        }
        .hover-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease,
            border-color 0.22s ease;
          will-change: transform;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.8),
            0 1px 0 rgba(255, 255, 255, 0.06) inset;
          border-color: rgba(148, 163, 184, 0.9) !important;
        }
      `}</style>
    </main>
  )
}

/* ============================== Bits ============================== */
function TaskGroup({
  title,
  empty,
  items,
  selectedId,
  onSelect,
  onToggleDone,
  showDue = false,
  completed = false,
}: {
  title: string
  empty: string
  items: Task[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleDone: (id: string) => void
  showDue?: boolean
  completed?: boolean
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 hover-card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {items.length > 0 && (
          <span className="text-[11px] text-slate-300">{items.length}</span>
        )}
      </div>
      {items.length === 0 && <p className="text-sm text-slate-300">{empty}</p>}
      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t.id}
            className={clsx(
              'group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 hover:border-slate-500',
              selectedId === t.id && 'ring-1 ring-slate-200/40 bg-slate-950',
            )}
          >
            <button
              onClick={() => onSelect(t.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span
                className={clsx(
                  'h-2.5 w-2.5 rounded-full',
                  completed
                    ? 'bg-emerald-300'
                    : t.urgency === 'severe'
                    ? 'bg-red-400'
                    : t.urgency === 'elevated'
                    ? 'bg-amber-300'
                    : 'bg-emerald-300',
                )}
                aria-hidden
              />
              <div className="flex-1">
                <span
                  className={clsx(
                    'block text-sm text-slate-100 truncate',
                    completed && 'line-through text-slate-400',
                  )}
                >
                  {t.title}
                </span>
                {showDue && t.dueAt && (
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {new Date(t.dueAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2">
              {!completed && (
                <button
                  onClick={() => onToggleDone(t.id)}
                  className={clsx(
                    'rounded-md px-2 py-1 text-xs border',
                    t.status === 'done'
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                      : 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
                  )}
                >
                  {t.status === 'done' ? 'Done' : 'Mark done'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
