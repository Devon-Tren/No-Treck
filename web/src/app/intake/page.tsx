// File: src/app/intake/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/protectedRoute'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authProvider'

/* ============================== Types ============================== */
type Role = 'user' | 'assistant'
type Risk = 'low' | 'moderate' | 'severe'

type Citation = { title: string; url: string; source?: string }
type InsightCard = {
  id: string
  title: string
  body: string
  citations?: Citation[]
  confidence?: 'low' | 'medium' | 'high'
  urgency?: 'info' | 'elevated' | 'severe'
  at?: number
  why?: string[]
  next?: string[]
}

type PlaceReview = {
  quote?: string
  source?: string
  url: string
  author?: string
  rating?: number
  date?: string
}

type Place = {
  id: string
  name: string
  address?: string
  distance_km?: number
  phone?: string
  url?: string
  maps?: string
  image?: string
  rating?: number
  reviews?: number
  price?: '$' | '$$' | '$$$' | '$$$$'
  reason?: string
  est_cost_min?: number
  est_cost_max?: number
  in_network?: boolean
  network_confidence?: number
  blurb?: string
  reviewCite?: PlaceReview
  score?: {
    overall?: number
    bedside?: number
    cost?: number
    wait?: number
    distance?: number
  }
  scoreNotes?: string
  scoreSources?: Citation[]
}

type RefImage = { url: string; source?: string; title?: string }

type ChatResponse = {
  text?: string
  citations?: Citation[]
  risk?: Risk
  insights?: InsightCard[]
  places?: Place[]
  refImages?: RefImage[]
  audit?: string
}

type ChatMessage = {
  id: string
  role: Role
  text: string
  citations?: Citation[]
  attachments?: { kind: 'image'; name: string; preview?: string }[]
  refImages?: RefImage[]
}

// NEW: lightweight follow-ups/tasks
type Task = {
  id: string
  title: string
  due?: string // ISO string
  notes?: string
  linkedPlaceId?: string
  linkedInsightId?: string
  done?: boolean
  createdAt?: number
}

/* ============================== Config ============================== */
// Match landing page gradient (from page.tsx)
const BRAND_BLUE = '#0E5BD8' // primary accent

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

// Recognize public review sources to pass the review firewall
const REVIEW_SITES = [
  'google.com',
  'maps.google.com',
  'yelp.com',
  'healthgrades.com',
  'vitals.com',
  'zocdoc.com',
  'ratemds.com',
  'webmd.com',
  'caredash.com',
  'doctible.com',
]

const CARD_STAGGER_MS = 160
const CARD_DURATION_MS = 560

// Diversified question bank with memory to avoid repetition
const QUESTION_BANK: { key: string; text: string }[] = [
  { key: 'onset', text: 'When did this start (exact day/time)? Has it been changing?' },
  { key: 'provocation', text: 'What makes it better or worse (rest, activity, position)?' },
  { key: 'quality', text: 'How would you describe it (aching, sharp, throbbing)? Any spreading or radiation?' },
  { key: 'region', text: 'Where is it located exactly? Any redness, warmth, or swelling?' },
  { key: 'severity', text: 'On a 0–10 scale, how severe is it right now, and what’s the worst it’s been?' },
  { key: 'redflags', text: 'Any red flags: fever, shortness of breath, chest pain, weakness, confusion, or new numbness?' },
  { key: 'function', text: 'What can you not do now that you could do before (walk, grip, turn head, etc.)?' },
  { key: 'context', text: 'What happened just before this started (injury, new meds, illness, travel)?' },
  { key: 'history', text: 'Any relevant history (conditions, surgeries, allergies) or meds you’re taking now?' },
]

// Legacy constant left intact; we now pick from QUESTION_BANK dynamically
const OPQRST_QUESTIONS = QUESTION_BANK.map(q => q.text)

const TRIAGE_SYSTEM_PROMPT = `
You are "No Trek" ("Stella" in the UI). Provide educational triage support (not a diagnosis).
Ask *one or two* high-yield questions at a time. Vary phrasing (OPQRST / SOCRATES / OLD CARTS) and avoid repeating questions already answered (especially severity 0–10). 
Screen red flags quickly and escalate tone appropriately.
Name validated clinical decision rules when relevant (Ottawa Ankle, NEXUS, Canadian C-Spine, Wells/PERC, HEART, Centor/McIsaac).
Every non-question claim must include citations from: ${ALLOWED_DOMAINS.join(', ')}. If you cannot cite, ask for more info.

Return JSON with:
- text
- citations: {title,url,source?}[]
- risk: "low"|"moderate"|"severe"
- insights: {id,title,body,why[],next[],confidence,urgency,citations[]}
- places (optional, only if verified reviews available)
- refImages (optional)
`.trim()

/* ============================== Utils ============================== */
const uid = (p = 'm') => `${p}_${Math.random().toString(36).slice(2, 9)}`
const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ')
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const domainOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}
const isDeclarative = (t?: string) => {
  if (!t) return false
  const s = t.trim()
  return s.length > 0 && (!s.endsWith('?') || /[.!] /.test(s))
}
const isReviewDomain = (url?: string) => {
  if (!url) return false
  const d = domainOf(url)
  return REVIEW_SITES.some((rd) => d.endsWith(rd))
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read failed'))
    fr.onload = () => resolve(String(fr.result))
    fr.readAsDataURL(file)
  })
}

async function saveCallScriptAndConsent(opts: {
  userId: string
  clinicName: string
  clinicPhone?: string
  scriptText: string
  scriptJson?: any
}) {
  const { userId, clinicName, clinicPhone, scriptText, scriptJson } = opts

  // 1) Insert into call_scripts
  const { data: scriptRow, error: scriptError } = await supabase
    .from('call_scripts')
    .insert({
      user_id: userId,
      clinic_name: clinicName,
      clinic_phone: clinicPhone ?? null,
      script_text: scriptText,
      script_json: scriptJson ?? null,
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (scriptError || !scriptRow) {
    console.error('Error inserting call_script:', scriptError)
    throw new Error('Could not save call script')
  }

  const scriptId = scriptRow.id as string

  // 2) Insert consent row
  const consentText =
    'User consented to an outbound call to this clinic using the approved script.'

  const { error: consentError } = await supabase.from('consents').insert({
    user_id: userId,
    call_script_id: scriptId,
    type: 'outbound_call',
    text: consentText,
  })

  if (consentError) {
    console.error('Error inserting consent:', consentError)
    // not fatal for redirect; just log
  }

  return scriptId
}

function filterAllowed(cites?: Citation[]) {
  const seen = new Set<string>()
  return (cites || []).filter((ci) => {
    if (!ci?.url) return false
    const d = domainOf(ci.url)
    const ok = ALLOWED_DOMAINS.some((allow) => d.endsWith(allow))
    if (!ok || seen.has(ci.url)) return false
    seen.add(ci.url)
    return true
  })
}

function outlineByRisk(r: Risk) {
  return r === 'severe'
    ? 'rgba(239,68,68,0.65)'
    : r === 'moderate'
    ? 'rgba(245,158,11,0.58)'
    : 'rgba(255,255,255,0.38)'
}
function glowByRisk(r: Risk) {
  return r === 'severe'
    ? 'rgba(239,68,68,0.38)'
    : r === 'moderate'
    ? 'rgba(245,158,11,0.34)'
    : 'rgba(120,190,255,0.38)'
}

async function backfillCitations(text: string): Promise<Citation[]> {
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

function placeBlurb(p: Place) {
  const bits: string[] = []
  if (typeof p.rating === 'number') bits.push(`${p.rating.toFixed(1)}★${p.reviews ? ` · ${p.reviews}` : ''}`)
  if (typeof p.distance_km === 'number') bits.push(`${p.distance_km.toFixed(1)} km`)
  if (p.price) bits.push(`price ${p.price}`)
  const s1 = `${p.name} offers convenient care${bits.length ? ` (${bits.join(' · ')})` : ''}.`
  const s2 = p.reason || 'Chosen by a composite of reviews, distance, and affordability.'
  const s3 = p.scoreNotes || (p.in_network ? 'May be in-network; confirm coverage.' : 'Confirm insurance and any facility fees.')
  return [s1, s2, s3].join(' ')
}

/* ============================== Splash (match landing) ============================== */
function SplashIntro({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sitTime = reduced ? 0 : 1000
    const fadeDur = reduced ? 0 : 600
    const t1 = setTimeout(() => setFade(true), sitTime)
    const t2 = setTimeout(() => onDone(), sitTime + fadeDur)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 grid place-items-center transition-opacity duration-700 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: BRAND_BLUE }}
    >
      <div className="text-white font-extrabold tracking-tight italic text-6xl sm:text-7xl md:text-8xl select-none">
        NO TREK
      </div>
    </div>
  )
}

/* ============================== Page ============================== */
export default function IntakePage() {
  const search = useSearchParams()

  const [connected, setConnected] = useState<boolean | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      text:
        'Hi — I’m Stella, No Trek’s virtual helper. I’ll ask focused medical questions, cite trusted sources, and surface nearby care and costs. What’s going on today?',
    },
  ])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const [risk, setRisk] = useState<Risk>('low')
  const [riskTrail, setRiskTrail] = useState<Risk[]>(['low'])
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [activePlace, setActivePlace] = useState<Place | null>(null)
  const [placeFullscreen, setPlaceFullscreen] = useState(false)

  const [fullCard, setFullCard] = useState<InsightCard | null>(null)

  const router = useRouter()
  const { user } = useAuth()
  const [savingScript, setSavingScript] = useState(false)

  const [evidenceLock, setEvidenceLock] = useState(true)
  const [hardEvidence, setHardEvidence] = useState(true)
  const [gateMsg, setGateMsg] = useState<string | null>(null)
  const [showSources, setShowSources] = useState(false)

  const [showAllPlaces, setShowAllPlaces] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageConsent, setImageConsent] = useState<boolean>(false)

  const [zip, setZip] = useState<string>('')

  const [showSplash, setShowSplash] = useState(true)

  // NEW: follow-ups state
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTasks, setShowTasks] = useState(false)

  // NEW: relaxed gating toggle
  const [showUnverified, setShowUnverified] = useState(false)

  const endRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  // Memory of asked questions to avoid repetition
  const askedRef = useRef<Set<string>>(new Set())

  // Live-call bubble state (for the concierge wow)
  const [callViz, setCallViz] = useState<{ status: 'idle'|'calling'|'ok'|'failed'; transcript: string[]; placeName?: string }>(
    { status: 'idle', transcript: [] }
  )

  const [showScrollBtn, setShowScrollBtn] = useState(false)
  useEffect(() => {
    const el = chatRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      setShowScrollBtn(!nearBottom)
    }
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])
  function scrollToBottom() {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nt_intake_session_v1')
      if (saved) {
        const j = JSON.parse(saved)
        if (Array.isArray(j.messages)) setMessages(j.messages)
        if (j.risk) setRisk(j.risk)
        if (Array.isArray(j.riskTrail)) setRiskTrail(j.riskTrail)
        if (Array.isArray(j.insights)) setInsights(j.insights)
        if (Array.isArray(j.places)) setPlaces(j.places)
        if (typeof j.zip === 'string') setZip(j.zip)
        if (typeof j.evidenceLock === 'boolean') setEvidenceLock(j.evidenceLock)
      }
      const tSaved = localStorage.getItem('nt_intake_tasks_v1')
      if (tSaved) {
        const tj = JSON.parse(tSaved)
        if (Array.isArray(tj)) setTasks(tj)
      }
    } catch {}
  }, [])
  useEffect(() => {
    const snapshot = { messages, risk, riskTrail, insights, places, zip, evidenceLock }
    localStorage.setItem('nt_intake_session_v1', JSON.stringify(snapshot))
  }, [messages, risk, riskTrail, insights, places, zip, evidenceLock])
  useEffect(() => {
    localStorage.setItem('nt_intake_tasks_v1', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/no-trek/status', { cache: 'no-store' })
        const j = await r.json()
        setConnected('connected' in j ? !!j.connected : true)
      } catch {
        setConnected(false)
      }
    })()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [draft])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const [bootedFromLanding, setBootedFromLanding] = useState(false)
  useEffect(() => {
    const q = search.get('q')
    const z = search.get('zip')
    if (z) setZip(z)
    if (q && !bootedFromLanding) {
      setBootedFromLanding(true)
      handleSend(q)
    }
  }, [search, bootedFromLanding])

  const debug = search.get('debug') === '1'

  const accent = BRAND_BLUE
  const outline = useMemo(() => outlineByRisk(risk), [risk])
  const glow = useMemo(() => glowByRisk(risk), [risk])

  const maybeHandleScriptConsent = async (assistantText: string, metadata: {
    clinicName?: string
    clinicPhone?: string
    scriptJson?: any
  }) => {
    if (!user) return // must be logged in

    const approved = assistantText.includes('CALL_SCRIPT_APPROVED_AND_CONSENTED')
    const draftIdx = assistantText.indexOf('CALL SCRIPT DRAFT:')

    if (!approved || draftIdx === -1) {
      return
    }

    // Extract the script text from after the marker
    const scriptText = assistantText
      .slice(draftIdx + 'CALL SCRIPT DRAFT:'.length)
      .trim()

    if (!scriptText) return

    try {
      setSavingScript(true)

      const scriptId = await saveCallScriptAndConsent({
        userId: user.id,
        clinicName: metadata.clinicName ?? 'Clinic',
        clinicPhone: metadata.clinicPhone,
        scriptText,
        scriptJson: metadata.scriptJson,
      })

      // Redirect to AI call page with scriptId
      router.push(`/agent-caller?scriptId=${scriptId}`)
    } catch (err) {
      console.error(err)
      // optionally surface an error toast or message
    } finally {
      setSavingScript(false)
    }
  }

  const sessionSources = useMemo(() => {
    const out: Citation[] = []
    const push = (c?: Citation[]) => filterAllowed(c).forEach((ci) => out.push(ci))
    insights.forEach((i) => push(i.citations))
    messages.forEach((m) => push(m.citations))
    const seen = new Set<string>()
    return out.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)))
  }, [insights, messages])

  async function onPickImage(file: File | null) {
    setImageFile(file)
    setImageConsent(false)
    if (!file) return setImagePreview(null)
    const preview = await fileToDataURL(file)
    setImagePreview(preview)
  }

  function mergeInsights(prev: InsightCard[], incoming: InsightCard[]): InsightCard[] {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const map = new Map<string, InsightCard>()
    prev.forEach((c) => map.set(norm(c.title), c))
    incoming.forEach((c) => {
      const k = norm(c.title)
      const exists = map.get(k)
      if (!exists) {
        map.set(k, c)
      } else {
        map.set(k, {
          ...exists,
          body: c.body || exists.body,
          confidence: c.confidence || exists.confidence,
          urgency: c.urgency || exists.urgency,
          at: c.at || exists.at,
          why: Array.from(new Set([...(exists.why || []), ...(c.why || [])])),
          next: Array.from(new Set([...(exists.next || []), ...(c.next || [])])),
          citations: filterAllowed([...(exists.citations || []), ...(c.citations || [])]),
        })
      }
    })
    return Array.from(map.values())
  }

  /* ---------- Review Gate + Scoring (deterministic) ---------- */
  const REVIEW_GATE = (p: Place) => {
    const hasDirectRating = (p.rating ?? 0) > 0 && (p.reviews ?? 0) > 0
    const hasQuotedReview = !!p.reviewCite?.url
    const hasScoreReviewSource = (p.scoreSources || []).some((c) => isReviewDomain(c.url))
    return hasDirectRating || hasQuotedReview || hasScoreReviewSource
  }

  function priceLevel(p?: Place['price']) {
    return p === '$' ? 1 : p === '$$' ? 2 : p === '$$$' ? 3 : p === '$$$$' ? 4 : 0
  }

  function computeScores(p: Place) {
    const rating = typeof p.rating === 'number' ? clamp(p.rating, 0, 5) : 0
    const reviews = typeof p.reviews === 'number' ? Math.max(0, p.reviews) : 0
    const dist = typeof p.distance_km === 'number' ? Math.max(0, p.distance_km) : 30
    const priceBand = priceLevel(p.price)

    const ratingScore = rating / 5
    const volumeScore = Math.min(1, Math.log10((reviews || 1) + 1) / 2.3)
    const distanceScore = 1 - Math.min(1, dist / 18)
    const haveCost = typeof p.est_cost_min === 'number' || typeof p.est_cost_max === 'number'
    const costMid = haveCost
      ? ((p.est_cost_min ?? p.est_cost_max ?? 0) + (p.est_cost_max ?? p.est_cost_min ?? 0)) / 2
      : undefined
    const costScore = haveCost
      ? clamp(1 - (costMid! / 450), 0, 1)
      : priceBand === 0
      ? 0.6
      : clamp(1 - (priceBand - 1) / 3, 0, 1)

    const composite = 0.55 * ratingScore + 0.15 * volumeScore + 0.20 * distanceScore + 0.10 * costScore

    const overall = Number((composite * 5).toFixed(2))
    const score = {
      overall,
      bedside: rating ? Number(rating.toFixed(2)) : undefined,
      cost: Number((costScore * 5).toFixed(2)),
      wait: undefined,
      distance: Number((distanceScore * 5).toFixed(2)),
    }

    const why: string[] = []
    if (rating >= 4.2) why.push('strong patient rating')
    if (reviews > 100) why.push('many reviews')
    if (dist < 8) why.push('close by')
    if (haveCost) why.push(`lower estimated cost ~$${Math.round(costMid!)}`)
    else if (priceBand && priceBand <= 2) why.push('lower price band')

    let notes = ''
    if (haveCost) {
      const floor = p.est_cost_min ?? p.est_cost_max
      const ceil = p.est_cost_max ?? p.est_cost_min
      notes = `Estimated cost $${Math.round(floor!)}–$${Math.round(ceil!)} (lower is better).`
    } else if (p.price) {
      notes = `Price band ${p.price} (proxy).`
    }

    return { score, reason: p.reason || (why.length ? `Chosen for ${why.join(', ')}` : undefined), scoreNotes: notes }
  }

  const reviewedPlaces = useMemo(() => (showUnverified ? places : places.filter(REVIEW_GATE)), [places, showUnverified])
  function rankPlaces(input: Place[]): Place[] {
    return [...input].map((p) => ({ ...p, ...computeScores(p) })).sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0))
  }

  function openPlace(p: Place) {
    setActivePlace(p)
    setPlaceFullscreen(false)
    const bits: string[] = []
    if (typeof p.rating === 'number') bits.push(`rating ${p.rating.toFixed(1)}★${p.reviews ? ` (${p.reviews} reviews)` : ''}`)
    if (typeof p.distance_km === 'number') bits.push(`${p.distance_km.toFixed(1)} km away`)
    if (p.price) bits.push(`price band ${p.price}`)
    if (p.est_cost_min || p.est_cost_max) {
      const lo = p.est_cost_min ?? p.est_cost_max
      const hi = p.est_cost_max ?? p.est_cost_min
      bits.push(`est. cost $${Math.round(lo!)}–$${Math.round(hi!)}`)
    }
    if (p.reason) bits.push(p.reason)

    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: 'assistant',
        text: `Why we recommend ${p.name}:\n• ${bits.join('\n• ')}\nWe weigh verified reviews, distance, and affordability. These are suggestions—not medical care.`,
        citations: filterAllowed(p.scoreSources),
      },
    ])
  }

  async function requestAICall(place?: Place) {
    setCallViz({ status: 'calling', transcript: ['Dialing...', 'Navigating phone tree…'], placeName: place?.name })
    try {
      const r = await fetch('/api/no-trek/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      })
      const ok = r.ok
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: ok
            ? `I can call ${place ? `${place.name}` : 'the clinic'} to check availability, wait time, and estimated cost, and report back with notes.`
            : `The call feature isn’t configured yet. You can call directly${place?.phone ? ` at ${place.phone}` : ''}.`,
        },
      ])
      setCallViz(v => ({ ...v, status: ok ? 'ok' : 'failed', transcript: [...v.transcript, ok ? 'Connected.' : 'Call init failed.'] }))
    } catch {
      setCallViz(v => ({ ...v, status: 'failed', transcript: [...v.transcript, 'Could not place the call.'] }))
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'assistant', text: `I couldn't start a call right now. You can call directly${place?.phone ? ` at ${place.phone}` : ''}.` },
      ])
    }
  }

  // === FOLLOW-UPS helpers ===
  function addTask(t: Partial<Task>) {
    const task: Task = {
      id: uid('t'),
      title: t.title || 'Follow-up',
      due: t.due,
      notes: t.notes,
      linkedPlaceId: t.linkedPlaceId,
      linkedInsightId: t.linkedInsightId,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((prev) => [task, ...prev])
    setShowTasks(true)
  }

  function addPlaceFollowUp(p: Place) {
    addTask({
      title: `Call ${p.name} for availability/ETA and cost`,
      notes: [p.phone ? `Phone: ${p.phone}` : '', p.address || '', p.url ? `Website: ${p.url}` : ''].filter(Boolean).join(' \n'),
      linkedPlaceId: p.id,
    })
  }
  function addInsightFollowUps(card: InsightCard) {
    const next = card.next || []
    if (next.length === 0) return addTask({ title: `Follow up on: ${card.title}`, linkedInsightId: card.id })
    // Batch into one to avoid spamming
    addTask({ title: `Next steps — ${card.title}`, notes: next.map((n) => `• ${n}`).join('\n'), linkedInsightId: card.id })
  }
  function toggleTaskDone(id: string) { setTasks((prev) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function deleteTask(id: string) { setTasks((prev) => prev.filter(t => t.id !== id)) }
  function updateTaskDue(id: string, due?: string) { setTasks(prev => prev.map(t => t.id === id ? { ...t, due } : t)) }

  /* === Places derived (review-gated) === */
  const rankedPlaces = useMemo(() => rankPlaces(reviewedPlaces), [reviewedPlaces])
  const top3 = rankedPlaces.slice(0, 3)
  const nearest10 = [...rankedPlaces].slice(0, 10)

  // Helper: pick next 1–2 unasked questions to reduce repetition
  function pickNextQuestions(n = 2): string[] {
    const asked = askedRef.current
    const remaining = QUESTION_BANK.filter(q => !asked.has(q.key))
    const pool = remaining.length ? remaining : QUESTION_BANK
    const out: string[] = []
    for (const q of pool) {
      if (out.length >= n) break
      if (!asked.has(q.key)) {
        asked.add(q.key)
        out.push(q.text)
      }
    }
    if (out.length < n) {
      for (const q of QUESTION_BANK) {
        if (q.key !== 'severity' && !out.includes(q.text)) {
          out.push(q.text)
          if (out.length >= n) break
        }
      }
    }
    return out.slice(0, n)
  }

  async function handleSend(textOverride?: string) {
    const textValue = (textOverride ?? draft).trim()
    if (!textValue && !(imageFile && imageConsent)) return

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text: textValue || (imageFile ? '[Image uploaded]' : ''),
      attachments: imageFile
        ? [{ kind: 'image', name: imageFile.name, preview: imagePreview || undefined }]
        : undefined,
    }
    setMessages((m) => [...m, userMsg])
    if (textOverride === undefined) setDraft('')
    setSending(true)
    setGateMsg(null)

    const aId = uid()
    setMessages((m) => [...m, { id: aId, role: 'assistant', text: '' }])

    let imageBase64: string | undefined
    if (imageFile && imagePreview && imageConsent) {
      imageBase64 = imagePreview
      setImageFile(null)
      setImagePreview(null)
      setImageConsent(false)
    }

    try {
      const payloadMessages = [
        { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
        ...messages.map((x) => ({ role: x.role, content: x.text })),
        { role: 'user', content: userMsg.text },
      ] as any
      if (zip.trim()) payloadMessages.push({ role: 'user', content: `ZIP: ${zip.trim()}` })

      const r = await fetch('/api/no-trek/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          imageBase64,
          allowedDomains: ALLOWED_DOMAINS,
        }),
      })

      if (!r.ok) {
        const body = await r.text()
        await typeFull(aId, `Error: ${r.status} — ${body.slice(0, 200)}`)
        setSending(false)
        return
      }

      const data: ChatResponse = await r.json()

      // 👇 NEW: check if this message contains an approved + consented call script
      // TRIAGE_SYSTEM_PROMPT is already set up to include markers like
      // "CALL SCRIPT DRAFT:" and "CALL_SCRIPT_APPROVED_AND_CONSENTED"
      await maybeHandleScriptConsent(data.text || '', {
        clinicName: 'Clinic',          // you can later swap this for a real clinic name if you track it in state
        clinicPhone: undefined,        // same for phone
        scriptJson: data,              // optional: store the full JSON in script_json
      })

      let finalCites = filterAllowed(data.citations)
      if (finalCites.length === 0) {
        finalCites = await backfillCitations(data.text || '')
      }

      if (hardEvidence && isDeclarative(data.text) && finalCites.length === 0) {
        const qs = pickNextQuestions(2)
        const gatherText = `I want to cite this properly. Quick details:\n• ${qs.join('\n• ')}`
        setMessages((m) =>
          m.map((mm) => (mm.id === aId ? { ...mm, text: gatherText } : mm)),
        )
        setGateMsg(
          'Collecting details — I’ll synthesize with citations after we have enough signal.',
        )
        setSending(false)
        return
      }

      if (finalCites.length > 0) {
        setMessages((m) =>
          m.map((mm) => (mm.id === aId ? { ...mm, citations: finalCites } : mm)),
        )
      } else if (isDeclarative(data.text)) {
        setMessages((m) =>
          m.map((mm) => (mm.id === aId ? { ...mm, citations: [] } : mm)),
        )
      }

      if (Array.isArray(data.refImages) && data.refImages.length > 0) {
        setMessages((m) =>
          m.map((mm) =>
            mm.id === aId ? { ...mm, refImages: data.refImages!.slice(0, 3) } : mm,
          ),
        )
      }

      await typeFull(aId, data.text || '')

      if (data.risk) {
        setRisk((prev) => {
          const next = data.risk!
          setRiskTrail((t) =>
            t.length && t[t.length - 1] === next ? t : [...t, next],
          )
          return next
        })
      }

      if (Array.isArray(data.insights)) {
        const cleaned = data.insights.map((c) => ({
          ...c,
          citations: filterAllowed(c.citations),
          at: c.at || Date.now(),
        }))
        setInsights((prev) => mergeInsights(prev, cleaned))
      }

      if (Array.isArray(data.places)) {
        setPlaces(data.places)
      } else if (debug) {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            text: 'No places[] returned by API. Cards depend on places[].',
          },
        ])
      }
    } catch (e: any) {
      await typeFull(
        aId,
        `I couldn’t reach the medical engine. (${String(e?.message || e)})`,
      )
    } finally {
      setSending(false)
    }
  }


  function typeInto(id: string, chunk: string) {
    setMessages((m) => m.map((mm) => (mm.id === id ? { ...mm, text: (mm.text || '') + chunk } : mm)))
  }
  async function typeFull(id: string, full: string) {
    if (!full) return
    const step = 16
    for (let i = 0; i < full.length; i += step) {
      typeInto(id, full.slice(i, i + step))
      await new Promise((r) => setTimeout(r, 10))
    }
  }

  function exportTxt() {
    const lines: string[] = []
    lines.push('No Trek — Intake Session')
    lines.push(`Risk: ${risk}  |  Trail: ${riskTrail.join(' → ')}`)
    if (zip.trim()) lines.push(`ZIP: ${zip.trim()}`)
    lines.push('')
    messages.forEach((m) => {
      lines.push(`${m.role.toUpperCase()}: ${m.text}`)
      if (m.refImages?.length) {
        m.refImages.forEach((ri) => lines.push(`  [ref] ${ri.title || ri.url} — ${ri.url}`))
      }
    })
    if (insights.length) {
      lines.push('')
      lines.push('INSIGHTS:')
      insights.forEach((i) => lines.push(`- ${i.title}: ${i.body}`))
    }
    if (sessionSources.length) {
      lines.push('')
      lines.push('SOURCES:')
      sessionSources.forEach((s) => lines.push(`- ${s.title || s.url}  ${s.url}`))
    }
    if (tasks.length) {
      lines.push('')
      lines.push('FOLLOW-UPS:')
      tasks.forEach((t) => lines.push(`- [${t.done ? 'x' : ' '}] ${t.title}${t.due ? ` (due ${new Date(t.due).toLocaleString()})` : ''}`))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-trek-session-${new Date().toISOString().slice(0, 19)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function resetSession() {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text:
          'Hi — I’m Stella, No Trek’s virtual helper. I’ll ask focused medical questions, cite trusted sources, and surface nearby care and costs. What’s going on today?',
      },
    ])
    setRisk('low')
    setRiskTrail(['low'])
    setInsights([])
    setPlaces([])
    setImageFile(null)
    setImagePreview(null)
    setImageConsent(false)
    askedRef.current = new Set()
  }
  function deleteData() {
    localStorage.removeItem('nt_intake_session_v1')
    resetSession()
  }

  const engaged = messages.some((m) => m.role === 'user') || insights.length > 0 || places.length > 0
  const readyInsightCount = (evidenceLock ? insights.filter((i) => (i.citations || []).length > 0) : insights).length
  const showRightRail = engaged
  const cardsActive = readyInsightCount > 0 || rankedPlaces.length > 0

  const openTasks = tasks.filter(t => !t.done).length
  const hasAssess = readyInsightCount > 0
  const hasSite = rankedPlaces.length > 0
  const hasPrice = rankedPlaces.some(p => typeof p.distance_km === 'number' || typeof p.est_cost_min === 'number' || typeof p.est_cost_max === 'number')
  const bookingState = callViz.status

  return (
    <ProtectedRoute>
    <main
      className="relative min-h-dvh text-white"
      style={{
        ['--brand-blue' as any]: BRAND_BLUE,
        ['--nt-accent' as any]: accent,
        ['--nt-outline' as any]: outline,
        ['--nt-glow' as any]: glow,
      } as CSSProperties}
    >
      <BreathingBackground risk={risk} />
      {showSplash && <SplashIntro onDone={() => setShowSplash(false)} />}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Top bar */}
        {engaged && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight italic">No Trek — Intake</div>
              <div className="text-xs text-white/70 hidden sm:block">Evidence-linked guidance. Nearby options when helpful.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="pill flex flex-wrap items-center gap-2 px-2 py-1">
                <label className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs text-white/85">
                  <input type="checkbox" checked={evidenceLock} onChange={(e) => setEvidenceLock(e.target.checked)} className="h-3.5 w-3.5 bg-transparent" />
                  Evidence lock
                </label>
                <label className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs text-white/85">
                  <input type="checkbox" checked={hardEvidence} onChange={(e) => setHardEvidence(e.target.checked)} className="h-3.5 w-3.5 bg-transparent" />
                  Require citations to reply
                </label>
                <label className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs text-white/85" title="Show places even if reviews are missing">
                  <input type="checkbox" checked={showUnverified} onChange={(e) => setShowUnverified(e.target.checked)} className="h-3.5 w-3.5 bg-transparent" />
                  Show unverified options
                </label>
                <button onClick={() => setShowSources(true)} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10">Sources ({sessionSources.length})</button>
                <button onClick={exportTxt} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10">Export .txt</button>
                <button onClick={() => setShowTasks(true)} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10">Follow-ups ({openTasks})</button>
                <button onClick={resetSession} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10">Reset</button>
                <button onClick={deleteData} className="rounded-full px-3 py-1 text-xs text-white/85 hover:bg-white/10" title="Delete local session data & images">Delete my data</button>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/5 px-3 py-1 backdrop-blur">
                <span className={cx('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : connected === false ? 'bg-rose-400' : 'bg-zinc-400')} />
                <span className="text-xs text-white/80">{connected === null ? 'Checking' : connected ? 'Connected to AI' : 'Base engine'}</span>
              </div>
              {debug && (
                <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/5 px-3 py-1 text-[11px] text-white/80">
                  debug: places {places.length} → reviewed {reviewedPlaces.length} → ranked {rankedPlaces.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZIP chip */}
        {engaged && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-white/30 bg-white/[0.06] backdrop-blur px-3 py-1.5">
              <span className="text-xs text-white/75">ZIP (for nearby results):</span>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
                placeholder="e.g., 10001"
                className="w-24 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
                inputMode="numeric"
                aria-label="ZIP code for nearby results"
              />
            </div>
          </div>
        )}

        {/* Layout */}
        <div
          className={cx('mt-6 grid gap-6', showRightRail ? '' : 'flex justify-center')}
          style={showRightRail ? ({ gridTemplateColumns: 'minmax(760px,1.45fr) 400px' } as CSSProperties) : ({} as CSSProperties)}
        >
          {/* Chat */}
          <section
            className={cx('rounded-[22px] bg-white/[0.04] backdrop-blur p-4 sm:p-5 w-full relative overflow-hidden border-[2px] border-white/20', showRightRail ? '' : 'max-w-5xl')}
            aria-label="No Trek chat"
          >
            <div className="flex items-center justify-between px-1">
              {engaged && <RiskBadge risk={risk} />}
              <span className="text-[11px] text-white/70">Educational support — not a diagnosis</span>
            </div>

            {/* Living Care Map */}
            {engaged && (
              <div className="mt-3">
                <LivingCareMap
                  risk={risk}
                  hasAssess={hasAssess}
                  hasSite={hasSite}
                  hasPrice={hasPrice}
                  bookingState={bookingState}
                />
              </div>
            )}

            {risk === 'severe' && (
              <div className="mt-3 rounded-xl border-[2px] border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                Severe symptoms may require urgent evaluation. If you have life-threatening symptoms, call your local emergency number now.
              </div>
            )}

            <div ref={chatRef} className={cx(!engaged ? 'h-[72vh] sm:h-[74vh]' : 'h-[62vh]', 'mt-3 overflow-y-auto space-y-3 pr-1')}>
              {messages.map((m) => (
                <div key={m.id} className="group">
                  <ChatBubble msg={m} />
                  {m.refImages?.length ? <RefImageStrip images={m.refImages} /> : null}
                </div>
              ))}
              {sending && <TypingDots />}
              <div ref={endRef} />
              {showScrollBtn && (
                <button onClick={scrollToBottom} className="absolute right-3 bottom-3 rounded-full pill px-3 py-1.5 text-xs text-white/90 hover:bg-white/10" title="Jump to latest">
                  Jump to latest ⤵
                </button>
              )}
            </div>

            <GateBanner msg={gateMsg} onClose={() => setGateMsg(null)} />

            {/* Composer */}
            <div className="mt-3 border-t border-white/20 pt-3">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex items-end gap-2"
                aria-label="Chat composer"
              >
                {/* (+) picker */}
                <label className="relative inline-flex h-12">
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onPickImage(e.target.files?.[0] || null)} aria-label="Upload image" />
                  <span className="inline-flex h-12 items-center gap-2 rounded-xl border-[2px] border-white/30 bg-white/5 px-3 text-sm text-white/85 hover:bg-white/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="opacity-90">
                      <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 5v4h4v2h-4v4h-2v-4H7V11h4V7h2Z"/>
                    </svg>
                    {imageFile ? <span className="max-w-[12rem] truncate">{imageFile.name}</span> : 'Add'}
                  </span>
                </label>

                {imagePreview && (
                  <div className="h-12 w-16 overflow-hidden rounded-lg border-[2px] border-white/30 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="relative flex-1">
                  <textarea
                    ref={textRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Describe what happened or ask a question…"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    className="w-full min-h-[46px] h-12 resize-none rounded-3xl bg-white/10 px-4 py-3 pr-16 text-[15px] leading-6 text-white placeholder:text-white/45 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={sending || (!draft.trim() && !(imageFile && imageConsent))}
                    className={cx('absolute right-2 bottom-1.5 grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-[1.03]', sending ? 'opacity-60' : '')}
                    style={{ background: BRAND_BLUE }}
                  >
                    <span className="text-[12px] tracking-widest text-white">NT</span>
                  </button>
                </div>
              </form>

              {imagePreview && (
                <label className="mt-2 flex items-center gap-2 text-xs text-white/75">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-white/30 bg-transparent" checked={imageConsent} onChange={(e) => setImageConsent(e.target.checked)} />
                  Use this image for this session only.
                </label>
              )}
            </div>

            <SessionFile messages={messages} insights={insights} top3={top3} onCall={() => requestAICall(top3[0])} />

            {callViz.status !== 'idle' && (
              <LiveCallBubble
                status={callViz.status}
                transcript={callViz.transcript}
                placeName={callViz.placeName}
                onClose={() => setCallViz({ status: 'idle', transcript: [] })}
              />
            )}
          </section>

          {/* Right rail */}
          {showRightRail && (
            <aside className="space-y-4 lg:sticky lg:top-8 self-start">
              {cardsActive ? (
                <>
                  {(evidenceLock ? insights.filter((i) => (i.citations || []).length > 0) : insights).map((c, i) => (
                    <InsightTriad
                      key={`${c.id}-${i}`}
                      card={c}
                      delay={i * CARD_STAGGER_MS}
                      durationMs={CARD_DURATION_MS}
                      onAICall={() => requestAICall(top3[0])}
                      onExpand={() => setFullCard(c)}
                      onAddFollowUps={() => addInsightFollowUps(c)}
                    />
                  ))}

                  {top3.length > 0 && (
                    <div className="hover-card rounded-[22px] bg-white/[0.04] backdrop-blur p-5 border-[2px] border-white/20" style={{ animation: `floatInRight ${CARD_DURATION_MS}ms ease-out both`, animationDelay: `${(insights.length + 1) * CARD_STAGGER_MS}ms` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white/90 font-medium">No Trek recommends</h3>
                          <p className="text-[11px] text-white/65 mt-0.5">Verified reviews, distance, affordability.</p>
                        </div>
                        <span className="text-xs text-white/70">Top 3</span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {top3.map((p) => (
                          <PlaceRow key={p.id} p={p} onOpen={() => openPlace(p)} onCall={() => requestAICall(p)} onFollowUp={() => addPlaceFollowUp(p)} showWhy />
                        ))}
                      </div>
                    </div>
                  )}

                  {nearest10.length > 0 && (
                    <div className="hover-card rounded-[22px] bg-white/[0.04] backdrop-blur p-5 border-[2px] border-white/20" style={{ animation: `floatInRight ${CARD_DURATION_MS}ms ease-out both`, animationDelay: `${(insights.length + 2) * CARD_STAGGER_MS}ms` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white/90 font-medium">Care options near you</h3>
                          <p className="text-[11px] text-white/65 mt-0.5">Tap for breakdown and sources.</p>
                        </div>
                        <button onClick={() => setShowAllPlaces(true)} className="text-xs text-white/85 hover:underline">
                          View all ({rankedPlaces.length})
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        {nearest10.map((p) => (
                          <PlaceRow key={p.id} p={p} onOpen={() => openPlace(p)} onCall={() => requestAICall(p)} onFollowUp={() => addPlaceFollowUp(p)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {places.length > 0 && rankedPlaces.length === 0 && (
                    <div className="rounded-[22px] bg-white/[0.04] backdrop-blur p-5 border-[2px] border-white/20">
                      <h3 className="text-white/90 font-medium">No reviewed options yet</h3>
                      <p className="text-sm text-white/75 mt-1">We hide locations without verifiable ratings or public reviews. Toggle “Show unverified options” above if you’d like to see everything the model returned.</p>
                    </div>
                  )}
                </>
              ) : (
                <RightRailPlaceholder />
              )}
            </aside>
          )}
        </div>

        <p className="mt-4 text-[11px] text-white/60">
          No Trek is not a medical provider. This is educational support, not a diagnosis. If you have life-threatening symptoms, call your local emergency number.
        </p>
      </div>

      {activePlace && (
        <PlaceDrawer
          place={activePlace}
          fullscreen={placeFullscreen}
          onToggleFullscreen={() => setPlaceFullscreen((v) => !v)}
          onClose={() => setActivePlace(null)}
          onCall={() => requestAICall(activePlace)}
          onFollowUp={() => addPlaceFollowUp(activePlace)}
        />
      )}
      {showAllPlaces && (
        <AllPlacesPanel
          places={rankedPlaces}
          onClose={() => setShowAllPlaces(false)}
          onOpenPlace={openPlace}
          onCallPlace={(p) => requestAICall(p)}
          onFollowUpPlace={(p) => addPlaceFollowUp(p)}
        />
      )}
      {showSources && <SourcesPanel sources={sessionSources} onClose={() => setShowSources(false)} />}
      {fullCard && <CardFullscreen card={fullCard} onClose={() => setFullCard(null)} onAddFollowUps={() => addInsightFollowUps(fullCard)} />}
      {showTasks && (
        <FollowUpsPanel
          tasks={tasks}
          places={places}
          onClose={() => setShowTasks(false)}
          onToggleDone={toggleTaskDone}
          onDelete={deleteTask}
          onUpdateDue={updateTaskDue}
        />
      )}

      <style jsx global>{`
        :root { --brand-blue: ${BRAND_BLUE}; }
        .pill { border: 2px solid rgba(255,255,255,.30); background: rgba(255,255,255,.06); backdrop-filter: blur(10px); border-radius: 9999px; }

        .hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; will-change: transform; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(20,60,180,.36), 0 1px 0 rgba(255,255,255,.08) inset; border-color: rgba(255,255,255,.32) !important; }

        .bubble-stella::after { content:''; position:absolute; inset:-1px; border-radius:inherit; pointer-events:none; box-shadow: 0 0 0 2px var(--nt-outline), 0 0 24px var(--nt-glow); }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes dots { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
          @keyframes floatInRight { from { opacity: 0; transform: translateX(16px) scale(.985); } to { opacity: 1; transform: translateX(0) scale(1); } }
          @keyframes sectionIn { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes softPulse { 0% { opacity:.20; transform:scale(1); } 50% { opacity:.30; transform:scale(1.02); } 100% { opacity:.20; transform:scale(1); } }
          @keyframes nodePop { from { transform: scale(.92); opacity:.0; } to { transform: scale(1); opacity:1; } }
          @keyframes lineGrow { from { width: 0; } to { width: 100%; } }
        }
      `}</style>
    </main>
    </ProtectedRoute>
  )
}

/* ============================== Background ============================== */
function BreathingBackground({ risk }: { risk: Risk }) {
  const base = risk === 'severe'
    ? 'linear-gradient(180deg, rgba(200,40,40,1) 0%, rgba(110,24,24,0.98) 60%)'
    : risk === 'moderate'
    ? 'linear-gradient(180deg, rgba(245,158,11,1) 0%, rgba(104,60,10,0.98) 60%)'
    : 'linear-gradient(180deg, rgba(14,91,216,1) 0%, rgba(10,83,197,0.98) 60%)'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 transition-[background] duration-500" style={{ background: base }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(800px 620px at 70% 18%, rgba(255,255,255,0.22), transparent 60%)', filter: 'blur(58px)', opacity: 0.24, animation: 'softPulse 10s ease-in-out infinite' }} />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_center,transparent,rgba(0,0,0,0.18))]" />
    </div>
  )
}

/* ============================== Living Care Map (WOW) ============================== */
function LivingCareMap({
  risk, hasAssess, hasSite, hasPrice, bookingState,
}: { risk: Risk; hasAssess: boolean; hasSite: boolean; hasPrice: boolean; bookingState: 'idle'|'calling'|'ok'|'failed' }) {
  const tone =
    risk === 'severe' ? 'border-red-400/60'
    : risk === 'moderate' ? 'border-amber-400/60'
    : 'border-white/25'

  const nodes: { key: string; label: string; status: 'done'|'active'|'idle'|'error'; meta?: string }[] = [
    { key: 'now', label: 'Now', status: 'done' },
    { key: 'assess', label: 'Assess', status: hasAssess ? 'done' : 'active' },
    { key: 'site', label: 'Best Site', status: hasSite ? 'done' : (hasAssess ? 'active' : 'idle') },
    { key: 'price', label: 'Price/ETA', status: hasPrice ? 'done' : (hasSite ? 'active' : 'idle') },
    { key: 'book', label: 'Booked', status: bookingState === 'ok' ? 'done' : bookingState === 'calling' ? 'active' : bookingState === 'failed' ? 'error' : 'idle' },
    { key: 'follow', label: 'Follow-up', status: 'idle' },
  ]

  return (
    <div className={cx('rounded-xl border-[2px] bg-white/[0.04] px-3 py-2', tone)}>
      <div className="flex items-center gap-2">
        {nodes.map((n, i) => (
          <div key={n.key} className="flex items-center gap-2 min-w-0">
            <MapNode label={n.label} status={n.status} />
            {i < nodes.length - 1 && <MapSpacer status={nodes[i].status} next={nodes[i+1].status} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function MapNode({ label, status }: { label: string; status: 'done'|'active'|'idle'|'error' }) {
  const s =
    status === 'done' ? 'bg-emerald-400 text-[#0B1C2E] border-emerald-300'
    : status === 'active' ? 'bg-white/90 text-[#0B1C2E] border-white/80'
    : status === 'error' ? 'bg-rose-400 text-[#0B1C2E] border-rose-300'
    : 'bg-white/18 text-white/85 border-white/30'
  return (
    <div className="flex items-center gap-2">
      <div className={cx('grid place-items-center h-6 w-6 rounded-full border text-[11px] font-semibold shadow-sm', s)} style={{ animation: 'nodePop 160ms ease-out both' }}>
        {status === 'done' ? '✓' : status === 'error' ? '!' : '•'}
      </div>
      <span className="text-xs text-white/85 truncate">{label}</span>
    </div>
  )
}
function MapSpacer({ status, next }: { status: 'done'|'active'|'idle'|'error'; next: 'done'|'active'|'idle'|'error' }) {
  const active = status !== 'idle' || next !== 'idle'
  return (
    <div className="w-12 h-[2px] bg-white/18 overflow-hidden rounded">
      <div className={cx('h-full', active ? 'bg-white/80' : 'bg-white/18')} style={{ animation: active ? 'lineGrow 400ms ease-out both' : undefined }} />
    </div>
  )
}

/* ============================== Live Call Bubble ============================== */
function LiveCallBubble({
  status, transcript, placeName, onClose,
}: { status: 'idle'|'calling'|'ok'|'failed'; transcript: string[]; placeName?: string; onClose: () => void }) {
  const label =
    status === 'calling' ? 'Calling…'
    : status === 'ok' ? 'Connected'
    : status === 'failed' ? 'Call failed'
    : ''
  return (
    <div className="fixed right-6 bottom-6 z-40">
      <div className="hover-card rounded-2xl border-[2px] border-white/25 bg-white/[0.06] backdrop-blur px-4 py-3 w-[260px]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/90 font-medium">{label}</div>
          <button onClick={onClose} className="text-[11px] text-white/75 hover:underline">Hide</button>
        </div>
        {placeName && <div className="text-xs text-white/70 mt-0.5 truncate">→ {placeName}</div>}
        <div className="mt-2 space-y-1 max-h-28 overflow-auto">
          {transcript.map((t, i) => (
            <div key={i} className="text-[11px] text-white/85">{t}</div>
          ))}
        </div>
        {status === 'calling' && (
          <div className="mt-2 h-1.5 rounded-full bg-white/12 overflow-hidden">
            <div className="h-full w-1/2 animate-pulse bg-white/85" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================== Components ============================== */
function GateBanner({ msg, onClose }: { msg: string | null; onClose: () => void }) {
  if (!msg) return null
  return (
    <div className="mt-2 rounded-lg border-[2px] border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 flex items-center justify-between">
      <span>{msg}</span>
      <button onClick={onClose} className="text-amber-100/90 hover:underline">Dismiss</button>
    </div>
  )
}

function RiskBadge({ risk }: { risk: Risk }) {
  const label = risk === 'severe' ? 'Severe risk — act now' : risk === 'moderate' ? 'Moderate risk' : 'Low risk'
  const tone =
    risk === 'severe'
      ? 'border-red-400/60 text-red-200'
      : risk === 'moderate'
      ? 'border-amber-400/60 text-amber-100'
      : 'border-emerald-400/60 text-emerald-100'
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-full border-[2px] bg-transparent px-2.5 py-1 text-xs', tone)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const needsSources = !isUser && isDeclarative(msg.text) && (!msg.citations || msg.citations.length === 0)
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'hover-card relative max-w-[90%] sm:max-w-[82%] rounded-3xl px-4 py-3 shadow-sm will-change-transform overflow-hidden border-[2px]',
          isUser
            ? 'bg-[var(--brand-blue)] text-white border-transparent'
            : 'bg-white/[0.06] text-white backdrop-blur border-white/22 bubble-stella'
        )}
        style={{ animation: 'sectionIn 240ms ease-out both' }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{msg.text}</p>

        {!isUser && (
          <>
            {msg.citations && msg.citations.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.citations.map((c, i) => <CitationChip key={i} c={c} />)}
              </div>
            ) : needsSources ? (
              <div className="mt-2 text-[11px] text-white/65">Collecting details — citations will appear with the next synthesis.</div>
            ) : null}
          </>
        )}

        {msg.attachments?.length ? (
          <div className="mt-2 flex flex-wrap gap-1 text-xs text-white/85">
            {msg.attachments.map((a, i) => (
              <span key={i} className="rounded-md border-[2px] border-white/25 bg-white/10 px-2 py-0.5">{a.name}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function RefImageStrip({ images }: { images: RefImage[] }) {
  return (
    <div className="mt-2 ml-2 flex gap-2">
      {images.slice(0, 3).map((im, i) => (
        <a key={i} href={im.url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 p-2 hover:bg-white/10" title={im.title || im.url}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.url} alt={im.title || 'reference'} className="h-10 w-14 rounded-md object-cover opacity-90 group-hover:opacity-100" />
          <span className="text-[11px] text-white/85 truncate max-w-[10rem]">{im.source || domainOf(im.url)}</span>
        </a>
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center text-white/85 text-sm pl-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/45 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/90"></span>
      </span>
      <span className="inline-flex">
        <span className="mx-0.5 animate-[dots_1.2s_ease-in-out_infinite]">•</span>
        <span className="mx-0.5 animate-[dots_1.2s_ease-in-out_infinite_200ms]">•</span>
        <span className="mx-0.5 animate-[dots_1.2s_ease-in-out_infinite_400ms]">•</span>
      </span>
    </div>
  )
}

function CitationChip({ c }: { c: Citation }) {
  const d = domainOf(c.url)
  return (
    <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border-[2px] border-white/30 bg-white/10 px-2 py-0.5 text-[11px] text-white/90 hover:bg-white/15" title={c.title}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3z" /></svg>
      {c.source || d || c.title}
    </a>
  )
}

/* ============================== Insight Cards ============================== */
function InsightTriad({
  card, delay = 0, durationMs = 500, onAICall, onExpand, onAddFollowUps,
}: { card: InsightCard; delay?: number; durationMs?: number; onAICall: () => void; onExpand: () => void; onAddFollowUps: () => void }) {
  const hasWhy = (card.why?.length || 0) > 0
  const hasNext = (card.next?.length || 0) > 0
  const hasCites = (card.citations?.length || 0) > 0

  const urgencyTone =
    card.urgency === 'severe' ? 'border-red-400/60'
    : card.urgency === 'elevated' ? 'border-amber-400/60'
    : 'border-white/30'

  const [open, setOpen] = useState(true)

  return (
    <div className={cx('hover-card rounded-[22px] p-5 backdrop-blur relative overflow-hidden bg-white/[0.04] border-[2px]', urgencyTone)} style={{ animation: `floatInRight ${durationMs}ms ease-out both`, animationDelay: `${delay}ms` }} data-build>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white/90 font-medium">{card.title}</h3>
          <p className="text-[11px] text-white/65 mt-0.5">Concise summary with next steps.</p>
        </div>
        <div className="flex items-center gap-2">
          {card.confidence && (
            <span className={cx('rounded-full border-[2px] px-2 py-0.5 text-[11px]',
              card.confidence === 'high' ? 'border-emerald-400/70 text-emerald-200'
              : card.confidence === 'medium' ? 'border-amber-400/70 text-amber-200'
              : 'border-white/50 text-white/75')}>
              {card.confidence} confidence
            </span>
          )}
          <button onClick={onExpand} className="text-xs text-white/80 hover:underline">Fullscreen</button>
          <button onClick={() => setOpen((v) => !v)} className="text-xs text-white/80 hover:underline">{open ? 'Collapse' : 'Expand'}</button>
        </div>
      </div>

      {open && (
        <>
          <div className="mt-3 grid gap-3">
            {hasWhy && (
              <section className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3" style={{ animation: `sectionIn ${durationMs - 200}ms ease-out both`, animationDelay: `${delay + 120}ms` }}>
                <header className="text-xs text-white/70">What you’re saying</header>
                <ul className="mt-1.5 list-disc pl-5 text-sm text-white/85">{card.why!.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </section>
            )}
            <section className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3" style={{ animation: `sectionIn ${durationMs - 200}ms ease-out both`, animationDelay: `${delay + 240}ms` }}>
              <header className="text-xs text-white/70">What it sounds like</header>
              <p className="mt-1.5 text-sm leading-6 text-white/85">{card.body}</p>
            </section>
            {hasNext && (
              <section className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3" style={{ animation: `sectionIn ${durationMs - 200}ms ease-out both`, animationDelay: `${delay + 360}ms` }}>
                <header className="text-xs text-white/70">What to do</header>
                <ul className="mt-1.5 list-disc pl-5 text-sm text-white/85">{card.next!.map((n, i) => <li key={i}>{n}</li>)}</ul>
                <div className="mt-2 flex gap-2">
                  <button onClick={onAICall} className="text-xs rounded-md border-[2px] border-white/30 bg-white/5 px-2 py-1 text-white/90 hover:bg-white/10">Have No Trek call for you</button>
                  <button onClick={onAddFollowUps} className="text-xs rounded-md border-[2px] border-white/30 bg-white/5 px-2 py-1 text-white/90 hover:bg-white/10">Add to follow-ups</button>
                </div>
              </section>
            )}
          </div>

          {hasCites ? (
            <div className="mt-3 flex flex-wrap gap-1.5" style={{ animation: `sectionIn ${durationMs - 200}ms ease-out both`, animationDelay: `${delay + 480}ms` }}>
              {card.citations!.map((c, i) => <CitationChip key={i} c={c} />)}
            </div>
          ) : (
            <div className="mt-3 text-[11px] text-white/60">No acceptable sources provided.</div>
          )}
          {card.at && <div className="mt-2 text-[10px] text-white/45">Updated {new Date(card.at).toLocaleTimeString()}</div>}
        </>
      )}
    </div>
  )
}

function CardFullscreen({ card, onClose, onAddFollowUps }: { card: InsightCard; onClose: () => void; onAddFollowUps: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-6 sm:inset-10 rounded-2xl bg-[#0E223B] p-6 overflow-y-auto hover-card border-[2px] border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-xl font-semibold">{card.title}</h3>
          <div className="flex items-center gap-2">
            <button onClick={onAddFollowUps} className="rounded-xl border-[2px] border-white/25 bg-white/5 px-3 py-1 text-white/85 hover:bg-white/10">Add to follow-ups</button>
            <button onClick={onClose} className="rounded-xl border-[2px] border-white/25 bg-white/5 px-3 py-1 text-white/85 hover:bg-white/10">Close</button>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {card.why?.length ? (
            <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-4">
              <div className="text-xs text-white/70">What you’re saying</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-white/85">{card.why.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          ) : null}
          <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-4">
            <div className="text-xs text-white/70">What it sounds like</div>
            <p className="mt-2 text-sm text-white/85 leading-6">{card.body}</p>
          </div>
          {card.next?.length ? (
            <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-4">
              <div className="text-xs text-white/70">What to do</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-white/85">{card.next.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          ) : null}
          {card.citations?.length ? (
            <div className="flex flex-wrap gap-1.5">{card.citations.map((c, i) => <CitationChip key={i} c={c} />)}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function RightRailPlaceholder() {
  return (
    <div className="hover-card rounded-[22px] bg-white/[0.03] p-5 border-[2px] border-white/20">
      <div className="h-4 w-32 rounded bg-white/12" />
      <div className="mt-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border-[2px] border-white/15 bg-white/[0.03] p-3">
            <div className="h-3 w-28 rounded bg-white/12" />
            <div className="mt-2 h-3 w-48 rounded bg-white/12" />
            <div className="mt-2 h-3 w-40 rounded bg-white/12" />
          </div>
        ))}
      </div>
      <div className="mt-3 h-5 w-24 rounded bg-white/12" />
    </div>
  )
}

/* ============================== Session File ============================== */
function SessionFile({ messages, insights, top3, onCall }: { messages: ChatMessage[]; insights: InsightCard[]; top3: Place[]; onCall: () => void }) {
  const recentUser = useMemo(() => messages.filter((m) => m.role === 'user').slice(-4).map((m) => m.text).filter(Boolean), [messages])
  const actionList = useMemo(() => {
    const acc: string[] = []
    insights.forEach((i) => (i.next || []).forEach((n) => acc.push(n)))
    return acc.slice(-6)
  }, [insights])

  const hasAny = recentUser.length > 0 || actionList.length > 0 || top3.length > 0
  return (
    <div className="hover-card mt-5 rounded-2xl bg-white/[0.03] p-4 border-[2px] border-white/20">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white/90">Session File</h4>
          <p className="text-[11px] text-white/65 mt-0.5">Signals, actions, and top picks — auto-built.</p>
        </div>
        <span className="text-[11px] text-white/65">Auto-updating</span>
      </div>
      {!hasAny ? (
        <p className="mt-2 text-sm text-white/70">Your session file will build here as we learn more.</p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {recentUser.length > 0 && (
            <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3">
              <div className="text-xs text-white/70">Signals</div>
              <ul className="mt-1.5 list-disc pl-5 text-sm text-white/85">
                {recentUser.map((u, i) => <li key={i} style={{ animation: 'sectionIn .4s ease-out both', animationDelay: `${i * 60}ms` }}>{u}</li>)}
              </ul>
            </div>
          )}

          {actionList.length > 0 && (
            <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3">
              <div className="text-xs text-white/70">Actions</div>
              <ul className="mt-1.5 list-disc pl-5 text-sm text-white/85">{actionList.map((a, i) => <li key={i} style={{ animation: 'sectionIn .4s ease-out both', animationDelay: `${i * 60}ms` }}>{a}</li>)}</ul>
              <div className="mt-2"><button onClick={onCall} className="text-xs rounded-md border-[2px] border-white/30 bg-white/5 px-2 py-1 text-white/90 hover:bg-white/10">Have No Trek call for you</button></div>
            </div>
          )}

          {top3.length > 0 && (
            <div className="rounded-xl border-[2px] border-white/20 bg-white/[0.03] p-3">
              <div className="text-xs text-white/70">Top care picks</div>
              <div className="mt-1.5 space-y-2">
                {top3.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="h-8 w-10 rounded-md overflow-hidden bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white/90 truncate">{p.name}</div>
                      <div className="text-[11px] text-white/65 truncate">
                        {typeof p.rating === 'number' ? `${p.rating.toFixed(1)}★` : ''} {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================== Places ============================== */
function PlaceRow({ p, onOpen, onCall, onFollowUp, showWhy = false }: { p: Place; onOpen: () => void; onCall: () => void; onFollowUp: () => void; showWhy?: boolean }) {
  return (
    <div className="hover-card w-full rounded-xl border-[2px] border-white/20 bg-white/[0.05] p-3">
      <div className="flex items-center gap-3">
        <div className="h-12 w-16 overflow-hidden rounded-lg bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-white/35 text-xs">Photo</div>}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-white/90 font-medium">{p.name}</p>
            {typeof p.rating === 'number' && <Stars value={p.rating} />}
            {p.price && <span className="text-xs text-white/65">{p.price}</span>}
          </div>
          <p className="text-xs text-white/65 truncate">{p.address || ''} {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}</p>
          <p className="mt-1 text-xs text-white/80 line-clamp-2">{p.blurb || placeBlurb(p)}</p>
          {showWhy && (p.reason || p.scoreNotes) && <p className="mt-1 text-xs text-white/80 line-clamp-2">{p.reason || p.scoreNotes}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onOpen} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">Details</button>
          <button onClick={onCall} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">Call for me</button>
          <button onClick={onFollowUp} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">+ Follow-up</button>
        </div>
      </div>
    </div>
  )
}

function AllPlacesPanel({ places, onClose, onOpenPlace, onCallPlace, onFollowUpPlace }: { places: Place[]; onClose: () => void; onOpenPlace: (p: Place) => void; onCallPlace: (p: Place) => void; onFollowUpPlace: (p: Place) => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-[#0E223B] border-l border-white/15 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
          <div>
            <h3 className="text-white font-semibold">All nearby care</h3>
            <p className="text-[11px] text-white/65 mt-0.5">Only clinics with verifiable public reviews are listed unless you toggle “Show unverified”.</p>
          </div>
          <button onClick={onClose} className="rounded-full pill px-3 py-1.5 text-white/90 hover:bg-white/10">Close</button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
          {places.map((p) => (
            <div key={p.id} className="hover-card rounded-xl border-[2px] border-white/20 bg-white/[0.05] p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-20 overflow-hidden rounded-lg bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-white/35 text-xs">Photo</div>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-white/90 font-medium">{p.name}</p>
                    {typeof p.rating === 'number' && <Stars value={p.rating} />}
                    {p.price && <span className="text-xs text-white/65">{p.price}</span>}
                  </div>
                  <p className="text-xs text-white/65 truncate">{p.address || ''} {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}</p>
                  <p className="mt-1 text-xs text-white/80">{p.blurb || placeBlurb(p)}</p>
                  {p.scoreNotes && <p className="mt-1 text-xs text-white/75">{p.scoreNotes}</p>}

                  {p.reviewCite?.url && (
                    <div className="mt-2 rounded-lg border-[2px] border-white/15 bg-white/[0.03] p-2">
                      {p.reviewCite.quote && <p className="text-xs text-white/90">“{p.reviewCite.quote}”</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                        {typeof p.reviewCite.rating === 'number' && (<span title={`${p.reviewCite.rating.toFixed(1)}★`}>★ {p.reviewCite.rating.toFixed(1)}</span>)}
                        {p.reviewCite.author && <span>— {p.reviewCite.author}</span>}
                        <a className="underline hover:text-white/90" href={p.reviewCite.url} target="_blank" rel="noreferrer">{p.reviewCite.source || domainOf(p.reviewCite.url)}</a>
                        {p.reviewCite.date && <span>({p.reviewCite.date})</span>}
                      </div>
                    </div>
                  )}

                  {p.scoreSources?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">{p.scoreSources.map((c, i) => <CitationChip key={i} c={c} />)}</div>
                  ) : null}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => onOpenPlace(p)} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">Details</button>
                  <button onClick={() => onCallPlace(p)} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">Call for me</button>
                  <button onClick={() => onFollowUpPlace(p)} className="text-xs rounded-md border-[2px] border-white/25 px-2 py-1 text-white/90 hover:bg-white/10">+ Follow-up</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================== Place Drawer ============================== */
function PlaceDrawer({ place, fullscreen, onToggleFullscreen, onClose, onCall, onFollowUp }: { place: Place; fullscreen: boolean; onToggleFullscreen: () => void; onClose: () => void; onCall: () => void; onFollowUp: () => void }) {
  const bullets: string[] = []
  if (typeof place.rating === 'number') bullets.push(`${place.rating.toFixed(1)}★ ${place.reviews ? `(${place.reviews} reviews)` : ''}`)
  if (typeof place.distance_km === 'number') bullets.push(`${place.distance_km.toFixed(1)} km away`)
  if (place.price) bullets.push(`price band ${place.price}`)
  if (place.est_cost_min || place.est_cost_max) {
    const lo = place.est_cost_min ?? place.est_cost_max
    const hi = place.est_cost_max ?? place.est_cost_min
    bullets.push(`est. cost $${Math.round(lo!)}–$${Math.round(hi!)}`)
  }
  if (place.reason) bullets.push(place.reason)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cx('absolute bg-[#0E223B] border-t border-white/15 shadow-2xl', fullscreen ? 'inset-0 rounded-none' : 'bottom-0 left-0 right-0 rounded-t-3xl')}>
        <div className="mx-auto max-w-4xl p-5">
          <div className="flex items-start gap-4">
            <div className="h-28 w-44 overflow-hidden rounded-xl bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {place.image ? <img src={place.image} alt={place.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-white/35 text-xs">Photo</div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">{place.name}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={onToggleFullscreen} className="rounded-xl border-[2px] border-white/25 bg-white/5 px-3 py-1 text-white/85 hover:bg-white/10">{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
                  <button onClick={onClose} className="rounded-xl border-[2px] border-white/25 bg-white/5 px-3 py-1 text-white/85 hover:bg-white/10">Close</button>
                </div>
              </div>
              <p className="text-white/75 text-sm mt-0.5">{place.address || ''} {place.distance_km ? `· ${place.distance_km.toFixed(1)} km` : ''}</p>

              <div className="mt-2 grid gap-3">
                <section className="rounded-lg border-[2px] border-white/20 bg-white/[0.04] p-3">
                  <header className="text-xs text-white/70">About this place</header>
                  <p className="mt-1 text-sm text-white/85">{place.blurb || placeBlurb(place)}</p>
                </section>

                {bullets.length > 0 && (
                  <section className="rounded-lg border-[2px] border-white/20 bg-white/[0.04] p-3">
                    <header className="text-xs text-white/70">Why we picked this</header>
                    <ul className="mt-1 list-disc pl-5 text-sm text-white/85">{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                  </section>
                )}

                {place.reviewCite?.url && (
                  <section className="rounded-lg border-[2px] border-white/20 bg-white/[0.04] p-3">
                    <header className="text-xs text-white/70">Recent review (citation)</header>
                    {place.reviewCite.quote && <p className="mt-1 text-sm text-white/90">“{place.reviewCite.quote}”</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                      {typeof place.reviewCite.rating === 'number' && (<span title={`${place.reviewCite.rating.toFixed(1)}★`}>★ {place.reviewCite.rating.toFixed(1)}</span>)}
                      {place.reviewCite.author && <span>— {place.reviewCite.author}</span>}
                      <a className="underline hover:text-white/90" href={place.reviewCite.url} target="_blank" rel="noreferrer">{place.reviewCite.source || domainOf(place.reviewCite.url)}</a>
                      {place.reviewCite.date && <span>({place.reviewCite.date})</span>}
                    </div>
                  </section>
                )}

                {place.score && (
                  <section className="rounded-lg border-[2px] border-white/20 bg-white/[0.04] p-3">
                    <header className="text-xs text-white/70">Scores</header>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-white/85">
                      <ScoreBar label="Overall" value={place.score.overall} />
                      <ScoreBar label="Bedside" value={place.score.bedside} />
                      <ScoreBar label="Cost" value={place.score.cost} />
                      <ScoreBar label="Wait" value={place.score.wait} />
                      <ScoreBar label="Distance" value={place.score.distance} />
                    </div>
                    {place.scoreNotes && <p className="mt-2 text-xs text-white/70">{place.scoreNotes}</p>}
                    {place.scoreSources?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{place.scoreSources.map((c, i) => <CitationChip key={i} c={c} />)}</div> : null}
                  </section>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {place.phone && (<a className="inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10" href={`tel:${place.phone}`}>Call</a>)}
                <button onClick={onCall} className="inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10">Have us call</button>
                <button onClick={onFollowUp} className="inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10">+ Follow-up</button>
                {place.maps && (<a className="inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10" href={place.maps} target="_blank" rel="noreferrer">Directions</a>)}
                {place.url && (<a className="inline-flex items-center gap-2 rounded-xl border-[2px] border-white/25 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10" href={place.url} target="_blank" rel="noreferrer">Website</a>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================== Small UI Bits ============================== */
function Stars({ value }: { value: number }) {
  const v = clamp(value, 0, 5)
  const pct = `${(v / 5) * 100}%`
  return (
    <span className="relative inline-block align-middle" title={`${v.toFixed(1)}★`}>
      <span className="text-white/30">★★★★★</span>
      <span className="absolute left-0 top-0 overflow-hidden text-white/95" style={{ width: pct }}>★★★★★</span>
      <span className="sr-only">{v.toFixed(1)} stars</span>
    </span>
  )
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (typeof value !== 'number') return null
  const pct = `${clamp(value, 0, 5) * 20}%`
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/75 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(1)}/5</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/12 overflow-hidden">
        <div className="h-full bg-white/85" style={{ width: pct }} />
      </div>
    </div>
  )
}

/* ============================== Sources Panel ============================== */
function SourcesPanel({ sources, onClose }: { sources: Citation[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0E223B]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
          <div>
            <h3 className="text-white font-semibold">Session sources</h3>
            <p className="text-[11px] text-white/65 mt-0.5">Trusted medical domains only.</p>
          </div>
          <button onClick={onClose} className="rounded-full pill px-3 py-1.5 text-white/90 hover:bg-white/10">Close</button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
          {sources.length === 0 ? (
            <p className="text-white/75 text-sm">No sources yet. As insights appear, you’ll see citations here from reputable medical domains.</p>
          ) : (
            sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block rounded-xl border-[2px] border-white/20 bg-white/[0.04] p-3 hover:bg-white/[0.08]">
                <div className="text-white/90 text-sm font-medium">{s.title || s.url}</div>
                <div className="text-white/70 text-xs mt-0.5">{s.url}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================== Follow-ups Panel ============================== */
function FollowUpsPanel({
  tasks, places, onClose, onToggleDone, onDelete, onUpdateDue
}: {
  tasks: Task[]
  places: Place[]
  onClose: () => void
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDue: (id: string, due?: string) => void
}) {
  function placeNameFor(id?: string) { return places.find(p => p.id === id)?.name }
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0E223B]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/15">
          <div>
            <h3 className="text-white font-semibold">Follow-ups</h3>
            <p className="text-[11px] text-white/65 mt-0.5">Save actions, set a due time, and mark done.</p>
          </div>
          <button onClick={onClose} className="rounded-full pill px-3 py-1.5 text-white/90 hover:bg-white/10">Close</button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
          {tasks.length === 0 ? (
            <p className="text-white/75 text-sm">No follow-ups yet. Add from insight cards or place rows.</p>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="rounded-xl border-[2px] border-white/20 bg-white/[0.05] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!t.done} onChange={() => onToggleDone(t.id)} className="h-4 w-4" />
                      <div className="text-white/90 font-medium truncate">{t.title}</div>
                    </div>
                    {t.linkedPlaceId && (
                      <div className="text-[11px] text-white/70 mt-1">Clinic: {placeNameFor(t.linkedPlaceId)}</div>
                    )}
                    {t.notes && <p className="text-sm text-white/85 mt-1 whitespace-pre-wrap">{t.notes}</p>}
                    <div className="mt-2 text-[11px] text-white/70">Created {new Date(t.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="datetime-local"
                      value={t.due ? new Date(t.due).toISOString().slice(0,16) : ''}
                      onChange={(e) => onUpdateDue(t.id, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      className="rounded-md bg-white/10 border border-white/20 px-2 py-1 text-white/90 text-xs"
                    />
                    <button onClick={() => onDelete(t.id)} className="text-[11px] text-white/75 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
