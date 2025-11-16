// File: src/app/tasks/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

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
function clsx(...s: Array<string | false | null | undefined>) { return s.filter(Boolean).join(' ') }
function isToday(iso?: string | null) {
  if (!iso) return false
  const d = new Date(iso); const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}
function domainOf(url?: string) { try { return new URL(String(url)).hostname.replace(/^www\./,'') } catch { return '' } }
function allowedOnly(cites?: TaskCitation[]) {
  const seen = new Set<string>()
  return (cites || []).filter(c => {
    if (!c?.url) return false
    const d = domainOf(c.url)
    const ok = ALLOWED_DOMAINS.some(ad => d.endsWith(ad))
    if (!ok || seen.has(c.url)) return false
    seen.add(c.url)
    return true
  })
}
function fetchJSON<T=any>(url: string): Promise<T | null> {
  return fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() as Promise<T> : null).catch(() => null)
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
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
function riskBg(r?: RiskTone) {
  if (r === 'severe') return 'linear-gradient(180deg, rgba(200,40,40,1) 0%, rgba(110,24,24,0.98) 60%)'
  if (r === 'elevated' || r === 'moderate') return 'linear-gradient(180deg, rgba(245,158,11,1) 0%, rgba(104,60,10,0.98) 60%)'
  return 'linear-gradient(180deg, rgba(14,91,216,1) 0%, rgba(10,83,197,0.98) 60%)'
}

/* ============================== Page ============================== */
export default function TasksPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)

  // Filters / options
  const [query, setQuery] = useState('')
  const [showEvidenceLock, setShowEvidenceLock] = useState(true)         // hide tasks without allowed citations
  const [showDone, setShowDone] = useState(true)                         // show/hide completed list
  const [sourcesOpen, setSourcesOpen] = useState(false)

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
      } catch { setConnected(false) }
    })()
  }, [])

  // Derived: filtered tasks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const tasks = (plan?.tasks || []).filter(t => {
      if (showEvidenceLock && allowedOnly(t.citations).length === 0) return false
      if (!q) return true
      const hay = [
        t.title, t.rationale,
        ...(t.steps || []).map(s => s.text),
        ...(t.citations || []).map(c => `${c.title} ${c.source} ${c.url}`)
      ].join(' ').toLowerCase()
      return hay.includes(q)
    })
    return tasks
  }, [plan, query, showEvidenceLock])

  // Grouping
  const groups = useMemo(() => {
    const today: Task[] = []
    const upcoming: Task[] = []
    const done: Task[] = []
    for (const t of filtered) {
      if (t.status === 'done') { done.push(t); continue }
      if (!t.dueAt || isToday(t.dueAt)) today.push(t)
      else upcoming.push(t)
    }
    return { today, upcoming, done }
  }, [filtered])

  // Progress
  const total = (plan?.tasks?.length || 0)
  const completed = (plan?.tasks || []).filter(t => t.status === 'done').length
  const progressPct = total ? Math.round((completed / total) * 100) : 0

  const selected = (plan?.tasks || []).find(t => t.id === selectedId) || null

  function setPlanTasks(updater: (prev: Task[]) => Task[]) {
    if (!plan) return
    setPlan({ ...plan, tasks: updater(plan.tasks || []) })
  }

  function toggleComplete(id: string) {
    setPlanTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done', updatedAt: new Date().toISOString() } : t
    ))
  }
  function toggleStep(taskId: string, stepId: string) {
    setPlanTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      return { ...t, steps: (t.steps || []).map(s => s.id === stepId ? { ...s, done: !s.done } : s), updatedAt: new Date().toISOString() }
    }))
  }
  function setDue(taskId: string, iso?: string) {
    setPlanTasks(prev => prev.map(t => t.id === taskId ? ({ ...t, dueAt: iso || null, updatedAt: new Date().toISOString() }) : t))
  }

  // Quick dates
  function quickDue(when: 'today' | 'tmrwAM' | 'weekend') {
    if (!selected) return
    const now = new Date()
    let d = new Date()
    if (when === 'today') {
      d.setHours(Math.min(23, now.getHours() + 3), 0, 0, 0)
    } else if (when === 'tmrwAM') {
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0)
    } else {
      const day = now.getDay()
      const add = day === 6 ? 0 : day === 0 ? 0 : 6 - day
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, 10, 0, 0, 0)
    }
    setDue(selected.id, d.toISOString())
  }

  // Sources (across visible tasks)
  const sources = useMemo(() => {
    const seen = new Set<string>()
    const out: TaskCitation[] = []
    filtered.forEach(t => allowedOnly(t.citations).forEach(c => {
      if (!seen.has(c.url)) { seen.add(c.url!); out.push(c) }
    }))
    return out
  }, [filtered])

  // Exporters
  function exportTxt() {
    const lines: string[] = []
    lines.push(`No Trek — Plan: ${plan?.title || ''}`)
    lines.push(`Risk: ${plan?.risk || '—'} | Created: ${plan ? new Date(plan.createdAt).toLocaleString() : '—'}`)
    lines.push(`Progress: ${completed}/${total} (${progressPct}%)`)
    lines.push('')
    ;(plan?.tasks || []).forEach(t => {
      lines.push(`- [${t.status === 'done' ? 'x' : ' '}] ${t.title}${t.dueAt ? ` — due ${formatDue(t.dueAt)}` : ''}`)
      if (t.rationale) lines.push(`    Why: ${t.rationale}`)
      ;(t.steps || []).forEach(s => lines.push(`    • [${s.done ? 'x' : ' '}] ${s.text}`))
      const cites = allowedOnly(t.citations)
      if (cites.length) {
        lines.push('    Sources:')
        cites.forEach(c => lines.push(`      - ${c.title} — ${c.url}`))
      }
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `no-trek-plan-${plan?.id || uid('plan')}.txt`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }
  function exportICS() {
    // Simple VEVENTs (one per task with dueAt)
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const rows: string[] = []
    rows.push('BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//No Trek//Tasks//EN')
    ;(plan?.tasks || []).forEach(t => {
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
    const a = document.createElement('a'); a.href = url; a.download = `no-trek-plan-${plan?.id || uid('plan')}.ics`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }
  function escapeICalText(s: string) { return s.replace(/([\\,;])/g, '\\$1').replace(/\n/g, '\\n') }

  // Concierge call
  const [callViz, setCallViz] = useState<{ status: 'idle'|'calling'|'ok'|'failed'; transcript: string[] }>({ status: 'idle', transcript: [] })
  async function requestAICall(task?: Task) {
    setCallViz({ status: 'calling', transcript: ['Dialing…','Navigating phone tree…'] })
    try {
      const r = await fetch('/api/no-trek/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: { id: task?.id, title: task?.title, phone: task?.phone, placeName: task?.placeName, address: task?.address } }),
      })
      const ok = r.ok
      setCallViz(v => ({ status: ok ? 'ok' : 'failed', transcript: [...v.transcript, ok ? 'Connected.' : 'Call init failed.'] }))
    } catch {
      setCallViz(v => ({ status: 'failed', transcript: [...v.transcript, 'Could not place the call.'] }))
    }
  }

  // Risk badge tone
  function riskBadgeClass(r?: RiskTone) {
    if (r === 'severe') return 'border-red-400/60 text-red-200'
    if (r === 'elevated' || r === 'moderate') return 'border-amber-400/60 text-amber-100'
    return 'border-emerald-400/60 text-emerald-100'
  }

  return (
    <main className="relative min-h-dvh text-white" style={{ ['--brand-blue' as any]: BRAND_BLUE } as React.CSSProperties}>
      {/* Breathing background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 transition-[background] duration-500" style={{ background: riskBg(plan?.risk) }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(800px 620px at 70% 18%, rgba(255,255,255,0.22), transparent 60%)', filter: 'blur(58px)', opacity: .24, animation: 'softPulse 10s ease-in-out infinite' }} />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_center,transparent,rgba(0,0,0,0.18))]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight italic">No Trek — Tasks</div>
            <div className="text-xs text-white/70 hidden sm:block">Follow-ups from your session, with sources.</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx('inline-flex items-center gap-2 rounded-full border-[2px] bg-transparent px-2.5 py-1 text-xs', riskBadgeClass(plan?.risk))}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Risk: {plan?.risk ?? '—'}
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/5 px-3 py-1 backdrop-blur">
              <span className={clsx('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : connected === false ? 'bg-rose-400' : 'bg-zinc-400')} />
              <span className="text-xs text-white/80">{connected === null ? 'Checking' : connected ? 'Connected to AI' : 'Base engine'}</span>
            </div>
            <button onClick={() => setSourcesOpen(true)} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10 border-[2px] border-white/30">Sources ({sources.length})</button>
            <button onClick={exportTxt} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10 border-[2px] border-white/30">Export .txt</button>
            <button onClick={exportICS} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10 border-[2px] border-white/30">Export .ics</button>
          </div>
        </header>

        {/* Top controls */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/[0.06] backdrop-blur px-3 py-1.5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, steps, or sources…"
              className="bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40 min-w-[16ch]"
              aria-label="Search tasks"
            />
          </div>
          <label className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/[0.06] px-3 py-1.5 text-xs text-white/85">
            <input type="checkbox" checked={showEvidenceLock} onChange={(e) => setShowEvidenceLock(e.target.checked)} className="h-3.5 w-3.5 bg-transparent" />
            Evidence lock
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/[0.06] px-3 py-1.5 text-xs text-white/85">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-3.5 w-3.5 bg-transparent" />
            Show completed
          </label>

          {/* Progress */}
          <div className="ml-auto inline-flex items-center gap-3 rounded-xl border-[2px] border-white/25 bg-white/5 px-3 py-1.5">
            <span className="text-xs text-white/80">Progress</span>
            <div className="h-2 w-36 rounded-full bg-white/12 overflow-hidden">
              <div className="h-full bg-white/85" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs text-white/75">{completed}/{total}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Left: Today / Upcoming / Completed */}
          <aside className="col-span-4 space-y-4">
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
          <section className="col-span-5 rounded-2xl border-[2px] border-white/20 bg-white/[0.05] p-4 hover-card">
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white/90">{selected.title}</h2>
                    <p className="text-xs text-white/60">Status: {selected.status} • Urgency: {selected.urgency ?? 'info'} {selected.dueAt ? `• Due ${formatDue(selected.dueAt)}` : ''}</p>
                    {selected.rationale && (
                      <p className="mt-2 text-sm text-white/80">
                        <span className="text-white/60">Why: </span>{selected.rationale}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleComplete(selected.id)}
                      className={clsx('rounded-lg px-3 py-1.5 text-sm border-[2px]',
                        selected.status === 'done' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100' : 'border-white/30 bg-white/5 text-white/90 hover:bg-white/10')}
                    >
                      {selected.status === 'done' ? 'Done' : 'Mark done'}
                    </button>
                    <button
                      onClick={() => requestAICall(selected)}
                      className="rounded-lg px-3 py-1.5 text-sm border-[2px] border-white/30 bg-white/5 text-white/90 hover:bg-white/10"
                      title="Have No Trek call the clinic or provider"
                    >
                      Have No Trek call
                    </button>
                  </div>
                </div>

                {/* Evidence gate hint */}
                {showEvidenceLock && allowedOnly(selected.citations).length === 0 && (
                  <div className="rounded-lg border-[2px] border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    This task doesn’t have citations from trusted medical domains yet. Add sources in your session, or toggle off “Evidence lock” to view all tasks.
                  </div>
                )}

                {/* Steps */}
                {selected.steps && selected.steps.length > 0 && (
                  <section>
                    <h3 className="mb-1 text-xs font-semibold text-white/70">Steps</h3>
                    <ul className="space-y-1">
                      {selected.steps.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 rounded-lg border-[2px] border-white/15 bg-black/20 px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={!!s.done}
                            onChange={() => toggleStep(selected.id, s.id)}
                            className="h-4 w-4"
                            aria-label={`Mark step: ${s.text}`}
                          />
                          <span className={clsx('text-sm', s.done && 'line-through text-white/60')}>{s.text}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Citations */}
                {allowedOnly(selected.citations).length > 0 && (
                  <section>
                    <h3 className="mb-1 text-xs font-semibold text-white/70">Citations</h3>
                    <div className="flex flex-wrap gap-2">
                      {allowedOnly(selected.citations).map((c, i) => (
                        <a
                          key={c.id || i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border-[2px] border-white/30 bg-white/10 px-2 py-0.5 text-[11px] text-white/90 hover:bg-white/15"
                          title={c.title}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3z"/></svg>
                          {c.source || domainOf(c.url) || c.title}
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Quick scheduling */}
                <section>
                  <h3 className="mb-1 text-xs font-semibold text-white/70">Schedule</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      value={selected.dueAt ? new Date(selected.dueAt).toISOString().slice(0,16) : ''}
                      onChange={(e) => setDue(selected.id, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      className="rounded-md bg-white/10 border border-white/20 px-2 py-1 text-white/90 text-xs"
                      aria-label="Due date"
                    />
                    <button onClick={() => quickDue('today')} className="rounded-full pill px-3 py-1.5 text-xs text-white/85 hover:bg-white/10">Later today</button>
                    <button onClick={() => quickDue('tmrwAM')} className="rounded-full pill px-3 py-1.5 text-xs text-white/85 hover:bg-white/10">Tomorrow 9am</button>
                    <button onClick={() => quickDue('weekend')} className="rounded-full pill px-3 py-1.5 text-xs text-white/85 hover:bg-white/10">This weekend</button>
                  </div>
                </section>

                {/* Place quick links (if present) */}
                {(selected.phone || selected.url || selected.address) && (
                  <section className="rounded-xl border-[2px] border-white/20 bg-white/[0.04] p-3">
                    <h3 className="text-xs text-white/70">Location</h3>
                    <p className="text-sm text-white/85 mt-1">{selected.placeName || 'Care site'}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/80">
                      {selected.phone && <a className="rounded-md border-[2px] border-white/25 bg-white/5 px-2 py-1 hover:bg-white/10" href={`tel:${selected.phone}`}>Call</a>}
                      {selected.url && <a className="rounded-md border-[2px] border-white/25 bg-white/5 px-2 py-1 hover:bg-white/10" href={selected.url} target="_blank" rel="noreferrer">Website</a>}
                      {selected.address && <a className="rounded-md border-[2px] border-white/25 bg-white/5 px-2 py-1 hover:bg-white/10" href={`https://maps.google.com/?q=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer">Directions</a>}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="grid h-[60vh] place-items-center text-white/70">Select a task to view details.</div>
            )}
          </section>

          {/* Right: Plan context */}
          <aside className="col-span-3 space-y-4">
            <section className="rounded-2xl border-[2px] border-white/20 bg-white/[0.05] p-4 hover-card">
              <h2 className="mb-2 text-sm font-semibold text-white/80">Solution steps</h2>
              {plan?.solutionSteps?.length ? (
                <ol className="list-decimal space-y-1 pl-5 text-sm text-white/85">
                  {plan.solutionSteps.map((s, i) => (<li key={i}>{s}</li>))}
                </ol>
              ) : (
                <p className="text-sm text-white/60">No high-level steps available.</p>
              )}
            </section>

            <section className="rounded-2xl border-[2px] border-white/20 bg-white/[0.05] p-4 hover-card">
              <h2 className="mb-2 text-sm font-semibold text-white/80">Plan</h2>
              <p className="text-sm text-white/85">{plan?.title ?? '—'}</p>
              <p className="text-xs text-white/60">Created: {plan ? new Date(plan.createdAt).toLocaleString() : '—'}</p>
              {plan?.sourceSessionId && <p className="text-xs text-white/60">From session: {plan.sourceSessionId}</p>}
              <div className="mt-2 text-xs text-white/65">Tasks: {total} • Completed: {completed} • Evidence-locked: {showEvidenceLock ? 'On' : 'Off'}</div>
            </section>

            {callViz.status !== 'idle' && (
              <section className="rounded-2xl border-[2px] border-white/20 bg-white/[0.05] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/90 font-medium">
                    {callViz.status === 'calling' ? 'Calling…' : callViz.status === 'ok' ? 'Connected' : 'Call failed'}
                  </div>
                  <button onClick={() => setCallViz({ status: 'idle', transcript: [] })} className="text-[11px] text-white/75 hover:underline">Hide</button>
                </div>
                <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                  {callViz.transcript.map((t,i) => <div key={i} className="text-[11px] text-white/85">{t}</div>)}
                </div>
                {callViz.status === 'calling' && (
                  <div className="mt-2 h-1.5 rounded-full bg-white/12 overflow-hidden">
                    <div className="h-full w-1/2 animate-pulse bg-white/85" />
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
          <div className="absolute inset-0 bg-black/70" onClick={() => setSourcesOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0E223B]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
              <div>
                <h3 className="text-white font-semibold">Plan sources</h3>
                <p className="text-[11px] text-white/65 mt-0.5">Trusted medical domains only.</p>
              </div>
              <button onClick={() => setSourcesOpen(false)} className="rounded-full pill px-3 py-1.5 text-white/90 hover:bg-white/10">Close</button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
              {sources.length === 0 ? (
                <p className="text-white/75 text-sm">No sources yet. As tasks include citations, they’ll appear here.</p>
              ) : (
                sources.map((s, i) => (
                  <a key={s.id || i} href={s.url} target="_blank" rel="noreferrer" className="block rounded-xl border-[2px] border-white/20 bg-white/[0.04] p-3 hover:bg-white/[0.08]">
                    <div className="text-white/90 text-sm font-medium">{s.title || s.url}</div>
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
        :root { --brand-blue: ${BRAND_BLUE}; }
        .pill { border: 2px solid rgba(255,255,255,.30); background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border-radius: 9999px; }
        .hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; will-change: transform; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(20,60,180,.36), 0 1px 0 rgba(255,255,255,.08) inset; border-color: rgba(255,255,255,.32) !important; }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes softPulse { 0% { opacity:.20; transform:scale(1); } 50% { opacity:.30; transform:scale(1.02); } 100% { opacity:.20; transform:scale(1); } }
        }
      `}</style>
    </main>
  )
}

/* ============================== Bits ============================== */
function TaskGroup({
  title, empty, items, selectedId, onSelect, onToggleDone, showDue = false, completed = false
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
    <section className="rounded-2xl border-[2px] border-white/20 bg-white/[0.05] p-4 hover-card">
      <h2 className="mb-2 text-sm font-semibold text-white/80">{title}</h2>
      {items.length === 0 && <p className="text-sm text-white/60">{empty}</p>}
      <ul className="space-y-2">
        {items.map((t) => (
          <li
            key={t.id}
            className={clsx(
              'group flex items-center justify-between rounded-xl border-[2px] border-white/15 bg-black/20 px-3 py-2 hover:border-white/25',
              selectedId === t.id && 'ring-1 ring-white/30'
            )}
          >
            <button onClick={() => onSelect(t.id)} className="flex flex-1 items-center gap-3 text-left">
              <span
                className={clsx(
                  'h-2.5 w-2.5 rounded-full',
                  completed ? 'bg-emerald-300' : t.urgency === 'severe' ? 'bg-red-400' : t.urgency === 'elevated' ? 'bg-amber-300' : 'bg-emerald-300'
                )}
                aria-hidden
              />
              <span className={clsx('text-sm text-white/90 truncate', completed && 'line-through text-white/60')}>{t.title}</span>
            </button>
            <div className="flex items-center gap-2">
              {showDue && <span className="text-[11px] text-white/60">{t.dueAt ? new Date(t.dueAt).toLocaleDateString() : ''}</span>}
              {!completed && (
                <button
                  onClick={() => onToggleDone(t.id)}
                  className={clsx('rounded-md px-2 py-1 text-xs border-[2px]',
                    t.status === 'done' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100' : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/20')}
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
