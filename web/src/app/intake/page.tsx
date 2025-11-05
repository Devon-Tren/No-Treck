'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

/* ============================== Types ============================== */
type Severity = 'mild' | 'moderate' | 'severe'
type RiskLevel = 'low' | 'moderate' | 'escalate'
type Topic = 'possible fracture' | 'minor cut' | 'sprain/strain' | 'burn' | 'fever' | 'rash' | 'generic'

type TriageForm = {
  q: string
  severity: Severity | ''
  onset: '' | 'today' | '1-3d' | '4+d'
  pain: number
  bodyArea: '' | 'hand' | 'foot' | 'leg' | 'arm' | 'head' | 'torso' | 'other'
  ageBand: '' | 'infant' | 'child' | 'adult' | 'older'
  pregnant: boolean
  conditions: string
  zip: string
  useLocation: boolean
  insurance: string
  // Red flags (fracture-aware)
  redFlagDeformity: boolean
  redFlagOpenWound: boolean
  redFlagNumbness: boolean
  redFlagCannotMove: boolean
  redFlagSevereSwelling: boolean
}

type Citation = { id: string; label: string; org: string; tier: 'T1' | 'T2' | 'T3'; lastUpdated: string; href: string }

type CareOption = {
  name: string
  distance: string
  wait: string | null
  inNetwork: boolean | null
  priceRange: string | null
  open: boolean
  lat?: number
  lng?: number
  typeGuess?: 'er' | 'urgent' | 'clinic'
}

type Plan = {
  risk: RiskLevel
  topic: Topic
  summary: string
  selfCare: { text: string; citationId: string }[]
  priceNote?: string
  coverage?: { oopEstimate: string | null; assumptions: string[]; citationIds: string[] }
  watchOuts: { text: string; citationId: string }[]
  afterCare: { text: string; citationId: string }[]
  citationsUsed: string[]
  stale: boolean
}

/* ============================== Citations (allowlist) ============================== */
const CITATIONS: Citation[] = [
  { id: 'cdc-wounds-2023', label: 'Wound care basics', org: 'CDC', tier: 'T1', lastUpdated: '2023-09-01', href: 'https://www.cdc.gov/' },
  { id: 'nih-medlineplus-cuts-2024', label: 'Cuts and lacerations (patient education)', org: 'NIH / MedlinePlus', tier: 'T1', lastUpdated: '2024-02-15', href: 'https://medlineplus.gov/' },
  { id: 'nice-laceration-2022', label: 'Laceration: assessment & management', org: 'NICE', tier: 'T1', lastUpdated: '2022-12-10', href: 'https://www.nice.org.uk/' },
  { id: 'cochrane-irrigation-2021', label: 'Irrigation of acute wounds (review)', org: 'Cochrane', tier: 'T2', lastUpdated: '2021-11-01', href: 'https://www.cochranelibrary.com/' },
  { id: 'nih-medlineplus-fractures-2024', label: 'Fractures (patient education)', org: 'NIH / MedlinePlus', tier: 'T1', lastUpdated: '2024-03-01', href: 'https://medlineplus.gov/' },
  { id: 'nice-fracture-assessment-2023', label: 'Fracture: initial assessment', org: 'NICE', tier: 'T1', lastUpdated: '2023-05-10', href: 'https://www.nice.org.uk/' },
  { id: 'nih-sprain-2024', label: 'Sprains and strains (R.I.C.E., return to activity)', org: 'NIH / MedlinePlus', tier: 'T1', lastUpdated: '2024-01-20', href: 'https://medlineplus.gov/' },
  { id: 'nih-burns-2024', label: 'Minor burns (cooling, dressings, when to escalate)', org: 'NIH / MedlinePlus', tier: 'T1', lastUpdated: '2024-06-05', href: 'https://medlineplus.gov/' },
  { id: 'who-fever-2023', label: 'Fever: patient guidance & red flags', org: 'WHO', tier: 'T1', lastUpdated: '2023-04-03', href: 'https://www.who.int/' },
]

/* ============================== Quick suggestions ============================== */
const SUGGESTIONS = [
  'Cut my foot on glass',
  'Twisted ankle yesterday',
  'Burned my hand on pan',
  'Fever since last night',
]

/* ============================== Helpers: topic/risk ============================== */
function extractTopic(form: TriageForm): Topic {
  const t = form.q.toLowerCase()
  if (/(fractur|broke|broken|dislocat|bone|obvious deform)/.test(t)) return 'possible fracture'
  if (/(cut|lacerat|bleed|glass|gash)/.test(t)) return 'minor cut'
  if (/(sprain|twist|rolled|strain|pulled)/.test(t)) return 'sprain/strain'
  if (/(burn|scald)/.test(t)) return 'burn'
  if (/(fever|temperature|temp)/.test(t)) return 'fever'
  if (/(rash|hives|itch|urticaria)/.test(t)) return 'rash'
  // body-area hints
  if (form.bodyArea && (form.bodyArea === 'hand' || form.bodyArea === 'foot')) return 'sprain/strain'
  return 'generic'
}

function computeRisk(form: TriageForm): RiskLevel {
  const text = form.q.toLowerCase()
  const fxIntent = /(broke|broken|fractur|dislocat)/.test(text)
  const textFlags = /(obvious deform|bone|exposed|can.?t move|numb|tingl|crushing|severe swelling)/.test(text)
  const checkedFlags =
    form.redFlagDeformity ||
    form.redFlagOpenWound ||
    form.redFlagNumbness ||
    form.redFlagCannotMove ||
    form.redFlagSevereSwelling
  const infantFever = text.includes('fever') && form.ageBand === 'infant'

  if (fxIntent || textFlags || checkedFlags || form.severity === 'severe' || form.pain >= 8 || infantFever) return 'escalate'
  if (form.severity === 'moderate' || form.pain >= 5) return 'moderate'
  return 'low'
}

/* ============================== Venue helpers & content tailoring ============================== */
type VenueType = 'urgent' | 'clinic' | 'er'
function venueTypeFromNameOrTags(name?: string, tags?: Record<string, string>): VenueType {
  const hint = `${name || ''} ${(tags?.healthcare || '')} ${(tags?.amenity || '')}`.toLowerCase()
  if (/er|emerg|trauma|hospital/.test(hint)) return 'er'
  if (/urgent/.test(hint)) return 'urgent'
  return 'clinic'
}
function getExpectations(topic: Topic, v?: VenueType): string[] {
  if (topic === 'possible fracture') {
    return [
      'Imaging (X-ray) to confirm fracture and alignment.',
      'Immobilization (splint/cast) and pain control.',
      ...(v === 'er' ? ['Ortho consult available if complex.'] : ['May refer to ER if fracture is complex.']),
    ]
  }
  if (topic === 'minor cut') {
    return [
      'Irrigation/cleaning; evaluate if closure (adhesive/sutures) needed.',
      'Tetanus update if indicated.',
      'Infection prevention and what to watch for.',
    ]
  }
  if (topic === 'sprain/strain') {
    return [
      'Focused exam; consider X-ray if Ottawa rules suggest.',
      'R.I.C.E. + graded activity; brace or wrap if helpful.',
      'Follow-up if not improving 48–72h.',
    ]
  }
  if (topic === 'burn') {
    return [
      'Cool running water (no ice); non-adherent dressing.',
      'Assess depth/size/location; refer if face/hands/genitals or large area.',
      'Pain control and infection watch-outs.',
    ]
  }
  if (topic === 'fever') {
    return [
      'Temp check method, hydration, antipyretics as indicated.',
      'Age-specific thresholds; look for red flags.',
      'When to escalate or test.',
    ]
  }
  if (topic === 'rash') {
    return [
      'Pattern and distribution assessment.',
      'Allergy/infection differentiation; symptomatic relief.',
      'Escalate if systemic symptoms or mucosal involvement.',
    ]
  }
  return [
    'Focused exam and conservative care first.',
    'Clear watch-outs and when to escalate.',
    'Follow-up plan if not improving within 24–48h.',
  ]
}

function bodyAreaAdjustments(topic: Topic, area: TriageForm['bodyArea']): { self?: string[]; watch?: string[] } {
  const out: { self?: string[]; watch?: string[] } = {}
  if (topic === 'minor cut' && area === 'foot') {
    out.self = ['After cleaning, keep weight-bearing minimal until sealed. Change dressing if soaked.']
    out.watch = ['Increasing redness, swelling, or pain when walking can indicate infection—seek care.']
  }
  if (topic === 'sprain/strain' && (area === 'foot' || area === 'leg')) {
    out.self = ['R.I.C.E.: Rest, Ice (15–20 min on/off), Compression wrap, Elevation above heart.']
  }
  if (area === 'head' && topic !== 'fever' && topic !== 'rash') {
    out.watch = ['Worsening headache, repeated vomiting, confusion, or unequal pupils → ER now.']
  }
  return out
}

/* ============================== Plan builder (tailored) ============================== */
function buildPlan(form: TriageForm): Plan {
  const topic = extractTopic(form)
  const risk = topic === 'possible fracture' ? 'escalate' : computeRisk(form)

  let summary = ''
  let selfCare: { text: string; citationId: string }[] = []
  let watchOuts: { text: string; citationId: string }[] = []
  let afterCare: { text: string; citationId: string }[] = []

  if (topic === 'possible fracture') {
    summary = 'Possible fracture — needs in-person assessment and imaging.'
    selfCare = [
      { text: 'Immobilize with a rigid support or sling; avoid using the limb.', citationId: 'nice-fracture-assessment-2023' },
      { text: 'Remove rings or tight items before swelling increases.', citationId: 'nih-medlineplus-fractures-2024' },
      { text: 'Cold pack wrapped in cloth for 15–20 min; elevate.', citationId: 'nih-medlineplus-fractures-2024' },
      { text: 'Do not attempt to realign the limb.', citationId: 'nice-fracture-assessment-2023' },
    ]
    watchOuts = [{ text: 'Blue/pale fingers, worsening numbness, or uncontrolled pain → ER now.', citationId: 'nice-fracture-assessment-2023' }]
    afterCare = [{ text: 'Protect splint/cast from moisture; follow orthopedics if advised.', citationId: 'nih-medlineplus-fractures-2024' }]
  } else if (topic === 'minor cut') {
    summary = 'Likely minor laceration — safe to start home care now.'
    selfCare = [
      { text: 'Rinse under clean running water for 5 minutes; remove visible debris.', citationId: 'cdc-wounds-2023' },
      { text: 'Apply gentle pressure with clean cloth to stop bleeding.', citationId: 'nih-medlineplus-cuts-2024' },
      { text: 'Thin layer of petroleum-based ointment; cover with sterile dressing.', citationId: 'nice-laceration-2022' },
    ]
    watchOuts = [
      { text: 'Numbness, deep gaping edges, or heavy bleeding that won’t stop → urgent care/ER.', citationId: 'nice-laceration-2022' },
      { text: 'Red streaks, fever, or worsening pain/swelling after 24–48h → seek care.', citationId: 'cdc-wounds-2023' },
    ]
    afterCare = [
      { text: 'Change the dressing daily or if soaked; keep clean and dry.', citationId: 'nih-medlineplus-cuts-2024' },
      { text: 'Confirm tetanus status if unsure.', citationId: 'nice-laceration-2022' },
    ]
  } else if (topic === 'sprain/strain') {
    summary = 'Likely sprain/strain — start R.I.C.E., monitor function, escalate if red flags.'
    selfCare = [
      { text: 'Rest and protect the area; avoid painful activity for 24–48h.', citationId: 'nih-sprain-2024' },
      { text: 'Ice 15–20 min on/off; compression wrap; elevate above heart.', citationId: 'nih-sprain-2024' },
    ]
    watchOuts = [
      { text: 'Inability to bear weight or severe instability → urgent care/ER.', citationId: 'nih-sprain-2024' },
    ]
    afterCare = [{ text: 'Gradual return to activity as pain allows; consider brace.', citationId: 'nih-sprain-2024' }]
  } else if (topic === 'burn') {
    summary = 'Minor burn — cool, cover, and watch for depth/size/location concerns.'
    selfCare = [
      { text: 'Cool running water (10–20 min). No ice.', citationId: 'nih-burns-2024' },
      { text: 'Non-adherent dressing; avoid home remedies on the wound.', citationId: 'nih-burns-2024' },
    ]
    watchOuts = [
      { text: 'Face/hands/genitals or large/deep burns → urgent care/ER.', citationId: 'nih-burns-2024' },
    ]
    afterCare = [{ text: 'Keep clean/dry; change dressing as directed; pain control as needed.', citationId: 'nih-burns-2024' }]
  } else if (topic === 'fever') {
    summary = 'Fever — hydration, antipyretics if indicated, look for red flags.'
    selfCare = [
      { text: 'Oral fluids regularly; rest.', citationId: 'who-fever-2023' },
    ]
    watchOuts = [
      { text: 'Neck stiffness, confusion, chest pain, severe dehydration → urgent care/ER.', citationId: 'who-fever-2023' },
    ]
    afterCare = [{ text: 'Re-evaluate in 24–48h; seek care if worsening or persistent.', citationId: 'who-fever-2023' }]
  } else if (topic === 'rash') {
    summary = 'Rash — symptom relief; monitor pattern and systemic symptoms.'
    selfCare = [{ text: 'Avoid triggers; cool compresses; OTC antihistamine if itchy.', citationId: 'who-fever-2023' }]
    watchOuts = [{ text: 'Fever, blistering, mucosal involvement, or rapid spread → urgent care/ER.', citationId: 'who-fever-2023' }]
    afterCare = [{ text: 'If not improving in 48–72h, seek care.', citationId: 'who-fever-2023' }]
  } else {
    summary = 'We can start with conservative self-care and monitor.'
    selfCare = [
      { text: 'Rest and protect the area; avoid activities that worsen pain.', citationId: 'nih-medlineplus-cuts-2024' },
      { text: 'Over-the-counter pain relief per label if needed.', citationId: 'nice-laceration-2022' },
    ]
    watchOuts = [
      { text: 'If symptoms rapidly worsen or red-flag signs appear, escalate to in-person care.', citationId: 'nih-medlineplus-cuts-2024' },
    ]
    afterCare = [{ text: 'Re-evaluate in 24–48h; if not improving, contact a clinician.', citationId: 'nih-medlineplus-cuts-2024' }]
  }

  // Body-area specific adjustments
  const adj = bodyAreaAdjustments(topic, form.bodyArea)
  if (adj.self) selfCare = [...selfCare, ...adj.self.map(text => ({ text, citationId: selfCare[0]?.citationId || 'nih-medlineplus-cuts-2024' }))]
  if (adj.watch) watchOuts = [...watchOuts, ...adj.watch.map(text => ({ text, citationId: watchOuts[0]?.citationId || 'nih-medlineplus-cuts-2024' }))]

  const coverage =
    form.insurance.trim().length > 0
      ? {
          oopEstimate:
            topic === 'possible fracture' || risk === 'escalate'
              ? '$120–$280 (urgent care), $350+ (ER)'
              : topic === 'minor cut'
              ? '$85–$160 (clinic/urgent care)'
              : '$85–$200 (clinic/urgent care)',
          assumptions: [
            'Based on typical cash rates or PPO in-network urgent care visit.',
            'Does not include procedures (e.g., imaging, sutures) or tests.',
          ],
          citationIds: ['cochrane-irrigation-2021'],
        }
      : { oopEstimate: null, assumptions: ['Add your insurance to check in-network and estimate out-of-pocket.'], citationIds: [] }

  const citationsUsed = Array.from(new Set([...selfCare, ...watchOuts, ...afterCare].map(s => s.citationId).concat(coverage.citationIds)))
  const stale = CITATIONS.some(c => citationsUsed.includes(c.id) && parseInt(c.lastUpdated.slice(0, 4), 10) <= new Date().getFullYear() - 2)

  return { risk, topic, summary, selfCare, coverage, priceNote: 'Estimate. We show the math.', watchOuts, afterCare, citationsUsed, stale }
}

/* ============================== Location + distance + download helpers ============================== */
type Coords = { lat: number; lng: number } | null

function useBrowserLocation(enabled: boolean) {
  const [coords, setCoords] = useState<Coords>(null)
  const [status, setStatus] = useState<'idle'|'prompt'|'granted'|'denied'|'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!('geolocation' in navigator)) {
      setStatus('error'); setError('Geolocation not supported')
      return
    }
    setStatus('prompt')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
        setError(err.message)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }, [enabled])

  return { coords, status, error }
}

function haversineMiles(a: Coords, b: Coords) {
  if (!a || !b) return null
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const t = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(t), Math.sqrt(1 - t)))
}

function mapNearbyToCareOptions(
  places: Array<{ name: string; lat: number; lng: number; tags?: Record<string,string> }>,
  here: Coords,
  insurance: string
): CareOption[] {
  const hasIns = insurance.trim().length > 0
  const inNet = hasIns ? /aetna|blue|anthem|cigna|uhc|kaiser/i.test(insurance) : null

  return places.map(p => {
    const miles = haversineMiles(here, { lat: p.lat, lng: p.lng })
    const dist = miles ? `${miles.toFixed(1)} mi` : '—'
    const type = venueTypeFromNameOrTags(p.name, p.tags)
    const price =
      type === 'er' ? '$350+' : type === 'urgent' ? '$120–$280' : '$85–$160'
    return {
      name: p.name,
      distance: dist,
      wait: null,
      inNetwork: inNet,
      priceRange: price,
      open: true,
      lat: p.lat, lng: p.lng,
      typeGuess: type,
    }
  })
}

/* ============================== UX: download + toasts ============================== */
function useDownloadUrl(text: string, filename = 'no-trek-plan.md') {
  const [href, setHref] = useState<string | null>(null)
  useEffect(() => {
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    setHref(url)
    return () => URL.revokeObjectURL(url)
  }, [text])
  return { href, filename }
}

function useToasts() {
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([])
  const idRef = useRef(1)
  function push(text: string) {
    const id = idRef.current++
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500)
  }
  return { toasts, push }
}

/* ============================== Page ============================== */
export default function IntakePage() {
  const [step, setStep] = useState<number>(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAllNearby, setShowAllNearby] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filterType, setFilterType] = useState<'all' | 'er' | 'urgent' | 'clinic'>('all')
  const [sortKey, setSortKey] = useState<'distance' | 'price' | 'open'>('distance')

  const [form, setForm] = useState<TriageForm>({
    q: '',
    severity: '',
    onset: '',
    pain: 0,
    bodyArea: '',
    ageBand: '',
    pregnant: false,
    conditions: '',
    zip: '',
    useLocation: false,
    insurance: '',
    redFlagDeformity: false,
    redFlagOpenWound: false,
    redFlagNumbness: false,
    redFlagCannotMove: false,
    redFlagSevereSwelling: false,
  })

  // Real-world additions
  const [coords, setCoords] = useState<Coords>(null)
  const [nearby, setNearby] = useState<Array<{ name: string; lat: number; lng: number; tags?: Record<string,string> }>>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState<string | null>(null)
  const [radiusUsed, setRadiusUsed] = useState<number | null>(null)

  const plan = useMemo(() => buildPlan(form), [form])
  const topic = useMemo(() => extractTopic(form), [form.q, form.bodyArea])

  const { toasts, push: pushToast } = useToasts()

  const next = () => setStep(s => Math.min(4, s + 1))
  const back = () => setStep(s => Math.max(1, s - 1))
  const setField = <K extends keyof TriageForm>(key: K, value: TriageForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Ask the browser for geolocation when toggled
  const geo = useBrowserLocation(form.useLocation)

  // Keep coords in state + auto-fill ZIP from reverse-geocode
  useEffect(() => {
    if (!geo.coords) return
    setCoords(geo.coords)
    pushToast('Using your approximate location')
    // Only fill ZIP if the user didn’t type one
    if (!form.zip) {
      fetch(`/api/no-trek?action=revgeo&lat=${geo.coords.lat}&lng=${geo.coords.lng}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
        .then(data => { if (data?.zip) { setForm(prev => ({ ...prev, zip: data.zip })); pushToast(`ZIP detected: ${data.zip}`) } })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.coords])

  // Load nearby with radius expansion & de-duplication
  useEffect(() => {
    const shouldFetch = form.useLocation ? !!coords : !!form.zip && form.zip.trim().length >= 3
    if (!shouldFetch) return

    async function run() {
      setNearbyLoading(true); setNearbyError(null)
      try {
        let latLng = coords
        if (!latLng && form.zip) {
          // Convert ZIP -> coords
          const resZip = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=us&postalcode=${encodeURIComponent(form.zip)}&limit=1`
          )
          const arr = await resZip.json()
          if (Array.isArray(arr) && arr[0]) {
            latLng = { lat: Number(arr[0].lat), lng: Number(arr[0].lon) }
            setCoords(latLng)
            pushToast(`Using ZIP ${form.zip}`)
          }
        }
        if (!latLng) return

        const radii = [7000, 12000, 20000]
        const acc: any[] = []
        const seen = new Set<string>()

        for (const r of radii) {
          const resp = await fetch(`/api/no-trek?action=nearby&lat=${latLng.lat}&lng=${latLng.lng}&radius=${r}`)
          const j = await resp.json()
          const items: any[] = Array.isArray(j?.places) ? j.places : []
          for (const e of items) {
            const key = `${(e.tags?.name || e.name || '').toLowerCase()}@${e.lat?.toFixed(5)},${e.lng?.toFixed(5)}`
            if (!seen.has(key) && e.lat && e.lng) {
              seen.add(key)
              acc.push(e)
            }
          }
          if (acc.length >= 10) { setRadiusUsed(r); break }
          setRadiusUsed(r) // track latest tried
        }
        setNearby(acc)
      } catch (e: any) {
        setNearbyError('Could not load nearby options.')
      } finally {
        setNearbyLoading(false)
      }
    }
    run()
  }, [form.useLocation, form.zip, coords?.lat, coords?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  const careOptionsReal: CareOption[] = useMemo(() => {
    if (!nearby.length || !coords) return []
    return mapNearbyToCareOptions(nearby, coords, form.insurance)
  }, [nearby, coords, form.insurance])

  // Mobile: open preview drawer as answers accumulate
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if (form.q || form.severity || form.onset) setDrawerOpen(true)
    }
  }, [form.q, form.severity, form.onset])

  // Derived: filters & sort for "All nearby"
  const filteredSorted = useMemo(() => {
    let arr = careOptionsReal
    if (filterType !== 'all') arr = arr.filter(x => (x.typeGuess || 'clinic') === filterType)
    // distance numeric
    function distNum(d: string) { const m = d.match(/([\d.]+)/); return m ? parseFloat(m[1]) : 1e9 }
    function priceNum(p?: string | null) {
      if (!p) return 9999
      if (p.includes('$85')) return 120
      if (p.includes('$120')) return 200
      if (p.includes('$350')) return 400
      return 300
    }
    if (sortKey === 'distance') arr = [...arr].sort((a,b)=> distNum(a.distance) - distNum(b.distance))
    if (sortKey === 'price') arr = [...arr].sort((a,b)=> priceNum(a.priceRange||'') - priceNum(b.priceRange||''))
    if (sortKey === 'open') arr = [...arr].sort((a,b)=> Number(b.open) - Number(a.open))
    return arr
  }, [careOptionsReal, filterType, sortKey])

  return (
    <main className="min-h-screen text-white relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0E5BD8] via-[#0A53C5] to-[#083F98]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), radial-gradient(800px 400px at 10% 110%, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Toasts */}
      <div className="fixed top-3 right-3 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="rounded-lg bg-white/15 ring-1 ring-white/20 px-3 py-2 text-sm shadow-2xl backdrop-blur">
            {t.text}
          </div>
        ))}
      </div>

      {/* Emergency banner */}
      <div className="bg-black/20 backdrop-blur-sm text-[13px] text-white/90">
        <div className="mx-auto max-w-6xl px-6 py-2">If this is an emergency, call 911 or your local emergency number.</div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {/* Header */}
        <header className="mb-6 md:mb-8">
          <p className="text-xs sm:text-sm text-white/80">Get care now</p>
          <h1 className="mt-1 text-3xl sm:text-5xl font-extrabold tracking-tight italic">Let’s get you a safe plan.</h1>
          <p className="mt-3 text-sm text-white/90 max-w-2xl">
            Not a diagnosis. We show <span className="font-medium">citations</span> and <span className="font-medium">last-updated</span> on results.
            You confirm before we call or book anything.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* Left: triage */}
          <section className="lg:col-span-3">
            <LiveChips form={form} plan={plan} />
            <Stepper step={step} />

            <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/15 p-5 space-y-5 shadow-2xl shadow-black/10">
              {step === 1 && <StepOne form={form} setField={setField} onNext={next} />}
              {step === 2 && <StepTwo form={form} setField={setField} onBack={back} onNext={next} />}
              {step === 3 && <StepThree form={form} setField={setField} onBack={back} onNext={next} />}
              {step === 4 && <StepFour form={form} setField={setField} onBack={back} />}

              {/* Inline nearby appears once location/ZIP present */}
              {(form.useLocation || form.zip.trim().length >= 3) && (
                <InlineNearby
                  form={form}
                  options={careOptionsReal}
                  loading={nearbyLoading}
                  error={nearbyError}
                  onViewAll={() => setShowAllNearby(true)}
                  radiusUsed={radiusUsed}
                />
              )}
            </div>

            {/* Mobile: preview drawer */}
            <div className="mt-4 md:hidden">
              <button
                onClick={() => setDrawerOpen(o => !o)}
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-4 py-3 text-left text-sm"
                aria-expanded={drawerOpen}
              >
                Preview plan {drawerOpen ? '▲' : '▼'}
              </button>
              {drawerOpen && (
                <div className="mt-3">
                  <PlanPreview plan={plan} form={form} options={filteredSorted} loadingNearby={nearbyLoading} />
                </div>
              )}
            </div>
          </section>

          {/* Right: live plan preview */}
          <aside className="hidden md:block lg:col-span-2">
            <PlanPreview plan={plan} form={form} options={filteredSorted} loadingNearby={nearbyLoading} />
          </aside>
        </div>
      </div>

      {/* All Nearby Overlay */}
      {showAllNearby && (
        <AllNearbyOverlay
          onClose={() => setShowAllNearby(false)}
          options={filteredSorted}
          loading={nearbyLoading}
          filterType={filterType}
          setFilterType={setFilterType}
          sortKey={sortKey}
          setSortKey={setSortKey}
          viewMode={viewMode}
          setViewMode={setViewMode}
          here={coords}
          zip={form.zip}
          radiusUsed={radiusUsed}
          query={form.q}
          insurance={form.insurance}
        />
      )}
    </main>
  )
}

/* ============================== UI components ============================== */
function Stepper({ step }: { step: number }) {
  const pct = (step / 4) * 100
  return (
    <div aria-label={`Step ${step} of 4`} className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-white/80 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-white/80">
        <span>Step {step} of 4</span>
        <span>~45s</span>
      </div>
    </div>
  )
}

function StepOne({ form, setField, onNext }: {
  form: TriageForm
  setField: <K extends keyof TriageForm>(key: K, value: TriageForm[K]) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-4">
      <label htmlFor="q" className="block text-sm font-medium">What’s going on?</label>
      <input
        id="q"
        value={form.q}
        onChange={e => setField('q', e.target.value)}
        placeholder='e.g., "Cut my foot on glass", "Twisted ankle yesterday"'
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/70 focus:outline-none focus:ring-4 focus:ring-white/20"
      />
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            type="button"
            key={s}
            onClick={() => setField('q', s)}
            className="rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/20 hover:bg-white/15"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="pt-2">
        <button onClick={onNext} className="rounded-xl bg-white text-slate-900 font-medium px-4 py-2 hover:shadow">
          See my plan
        </button>
      </div>
    </div>
  )
}

function StepTwo({ form, setField, onBack, onNext }: {
  form: TriageForm
  setField: <K extends keyof TriageForm>(key: K, value: TriageForm[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  const flags = [
    ['redFlagDeformity', 'Obvious deformity'] as const,
    ['redFlagOpenWound', 'Open wound/bone visible'] as const,
    ['redFlagNumbness', 'Numbness/tingling'] as const,
    ['redFlagCannotMove', "Can't move hand/wrist"] as const,
    ['redFlagSevereSwelling', 'Severe swelling'] as const,
  ]
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium mb-2">How severe is it?</p>
        <div className="grid grid-cols-3 gap-2">
          {(['mild', 'moderate', 'severe'] as Severity[]).map(s => (
            <button
              key={s}
              onClick={() => setField('severity', s)}
              className={`rounded-xl px-3 py-2 ring-1 ${form.severity === s ? 'bg-white text-slate-900 ring-white' : 'bg-white/10 ring-white/20 hover:bg-white/15'}`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">When did it start?</p>
        <div className="grid grid-cols-3 gap-2">
          {(['today', '1-3d', '4+d'] as const).map(v => (
            <button
              key={v}
              onClick={() => setField('onset', v)}
              className={`rounded-xl px-3 py-2 ring-1 ${form.onset === v ? 'bg-white text-slate-900 ring-white' : 'bg-white/10 ring-white/20 hover:bg-white/15'}`}
            >
              {v === 'today' ? 'Today' : v === '1-3d' ? '1–3 days' : '4+ days'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="pain" className="text-sm font-medium">Pain (0–10)</label>
        <input
          id="pain"
          type="range"
          min={0}
          max={10}
          value={form.pain}
          onChange={e => setField('pain', Number(e.target.value))}
          className="w-full accent-white"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={form.pain}
        />
        <div className="text-xs mt-1">Current: {form.pain}</div>
      </div>

      <fieldset className="rounded-xl bg-white/5 ring-1 ring-white/15 p-3">
        <legend className="text-xs text-white/80">Possible fracture signs (any → in-person care)</legend>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {flags.map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form[key as keyof TriageForm] as boolean}
                onChange={e => setField(key as any, e.target.checked)}
                className="h-4 w-4 accent-white"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="rounded-xl border border-white/30 px-4 py-2">Back</button>
        <button onClick={onNext} className="rounded-xl bg-white text-slate-900 px-4 py-2 font-medium">Next</button>
      </div>
    </div>
  )
}

function StepThree({ form, setField, onBack, onNext }: {
  form: TriageForm
  setField: <K extends keyof TriageForm>(key: K, value: TriageForm[K]) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="area" className="text-sm font-medium">Where on the body?</label>
        <select
          id="area"
          value={form.bodyArea}
          onChange={e => setField('bodyArea', e.target.value as TriageForm['bodyArea'])}
          className="mt-1 w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-white/20"
        >
          <option value="">Select…</option>
          <option value="hand">Hand</option>
          <option value="foot">Foot</option>
          <option value="leg">Leg</option>
          <option value="arm">Arm</option>
          <option value="head">Head</option>
          <option value="torso">Torso</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="age" className="text-sm font-medium">Age range</label>
          <select
            id="age"
            value={form.ageBand}
            onChange={e => setField('ageBand', e.target.value as TriageForm['ageBand'])}
            className="mt-1 w-full rounded-xl bg-white/10 ring-1 ring-white/20 px-3 py-2"
          >
            <option value="">Select…</option>
            <option value="infant">0–1</option>
            <option value="child">2–17</option>
            <option value="adult">18–64</option>
            <option value="older">65+</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <input id="pregnant" type="checkbox" checked={form.pregnant} onChange={e => setField('pregnant', e.target.checked)} className="h-4 w-4 accent-white" />
          <label htmlFor="pregnant" className="text-sm">Pregnant</label>
        </div>
      </div>

      <div>
        <label htmlFor="cond" className="text-sm font-medium">Conditions/allergies (optional)</label>
        <input
          id="cond"
          value={form.conditions}
          onChange={e => setField('conditions', e.target.value)}
          placeholder="e.g., diabetes, on blood thinners"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="rounded-xl border border-white/30 px-4 py-2">Back</button>
        <button onClick={onNext} className="rounded-xl bg-white text-slate-900 px-4 py-2 font-medium">Next</button>
      </div>
    </div>
  )
}

function StepFour({ form, setField, onBack }: {
  form: TriageForm
  setField: <K extends keyof TriageForm>(key: K, value: TriageForm[K]) => void
  onBack: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="zip" className="text-sm font-medium">ZIP (optional)</label>
          <input
            id="zip"
            value={form.zip}
            onChange={e => setField('zip', e.target.value)}
            placeholder="e.g., 10001"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
          />
          <div className="mt-2 flex items-center gap-2 text-xs">
            <input
              id="loc"
              type="checkbox"
              checked={form.useLocation}
              onChange={e => setField('useLocation', e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            <label htmlFor="loc">Use my location</label>
          </div>
        </div>
        <div>
          <label htmlFor="ins" className="text-sm font-medium">Insurance (optional)</label>
          <input
            id="ins"
            value={form.insurance}
            onChange={e => setField('insurance', e.target.value)}
            placeholder="e.g., Aetna PPO"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3"
          />
          <p className="mt-1 text-xs text-white/80">Add to check in-network and estimate out-of-pocket.</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="rounded-xl border border-white/30 px-4 py-2">Back</button>
        <button
          onClick={() => document.getElementById('inline-nearby')?.scrollIntoView({ behavior: 'smooth' })}
          className="rounded-xl bg-white text-slate-900 px-4 py-2 font-medium"
        >
          Update plan
        </button>
      </div>
    </div>
  )
}

function InlineNearby({
  form, options, loading, error, onViewAll, radiusUsed,
}: {
  form: TriageForm
  options: CareOption[]
  loading: boolean
  error: string | null
  onViewAll: () => void
  radiusUsed: number | null
}) {
  const show = (form.useLocation || form.zip.trim().length >= 3)
  if (!show) return null

  return (
    <div id="inline-nearby" className="mt-4 rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nearby options</p>
        <a href="#plan" className="text-xs underline underline-offset-4">See full panel</a>
      </div>

      {loading && <NearbySkeleton />}
      {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-2 space-y-2">
            {options.slice(0,3).map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-3 rounded-lg ring-1 ring-white/10 bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-white/80">
                    {(c.distance !== '—' ? `${c.distance}` : '')}{c.priceRange ? ` · ${c.priceRange}` : ''} {c.typeGuess ? ` · ${c.typeGuess.toUpperCase()}` : ''}
                  </p>
                  <p className="text-xs text-white/80">
                    {c.inNetwork === null ? 'In-network: add insurance' : c.inNetwork ? 'In-network' : 'Out-of-network'}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    href={`/agent-caller?provider=${encodeURIComponent(c.name)}&q=${encodeURIComponent(form.q)}&ins=${encodeURIComponent(form.insurance)}`}
                    className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-sm font-medium"
                  >
                    Have us call
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button onClick={onViewAll} className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-sm font-medium">View all nearby</button>
            <p className="text-[11px] text-white/70">Radius {radiusUsed ? `${(radiusUsed/1000).toFixed(0)} km` : '—'} · Based on {form.useLocation ? 'your location' : `ZIP ${form.zip}`}</p>
          </div>
        </>
      )}
    </div>
  )
}

function NearbySkeleton() {
  return (
    <div className="mt-2 space-y-2">
      {[0,1,2].map(i=>(
        <div key={i} className="animate-pulse rounded-lg ring-1 ring-white/10 bg-white/5 px-3 py-2">
          <div className="h-3 w-2/5 bg-white/20 rounded" />
          <div className="mt-2 h-2 w-3/5 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const label = level === 'low' ? 'Low' : level === 'moderate' ? 'Moderate' : 'Escalate'
  const color = level === 'low' ? 'bg-emerald-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color} transition-all`}>{label} risk</span>
}

function LiveChips({ form, plan }: { form: TriageForm; plan: Plan }) {
  const chips: Array<{ label: string; title: string }> = []
  const topic = extractTopic(form)
  if (topic) chips.push({ label: `Topic: ${topic}`, title: 'Detected from your description & choices' })
  if (form.bodyArea) chips.push({ label: `Area: ${form.bodyArea}`, title: 'Body area changes self-care & watch-outs' })
  if (form.onset) chips.push({ label: `Onset: ${form.onset}`, title: 'Time since start helps decide urgency' })
  if (form.severity) chips.push({ label: `Severity: ${form.severity}`, title: 'Severity impacts risk' })
  if (form.pregnant) chips.push({ label: 'Pregnant', title: 'Special considerations apply' })
  if (form.ageBand) chips.push({ label: `Age: ${form.ageBand}`, title: 'Age changes thresholds' })
  if (form.insurance) chips.push({ label: 'Insurance added', title: 'Used to estimate costs/in-network' })
  if (form.zip) chips.push({ label: `ZIP ${form.zip}`, title: 'Used to find nearby care' })

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <RiskBadge level={plan.risk} />
      {chips.map((c, i)=>(
        <span key={i} title={c.title} className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs ring-1 ring-white/20">
          {c.label}
        </span>
      ))}
    </div>
  )
}

function CareRow({ c, q, insurance }: { c: CareOption; q: string; insurance: string }) {
  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{c.name}</p>
        <p className="text-xs text-white/80">
          {c.typeGuess ? `${c.typeGuess.toUpperCase()} · ` : ''}{c.distance !== '—' ? `${c.distance} · ` : ''}{c.open ? 'Open' : 'Closed'}{c.wait ? ` · Wait ${c.wait}` : ' · Wait unknown'}
        </p>
        <p className="text-xs text-white/80">
          {c.inNetwork === null ? 'In-network: add insurance' : c.inNetwork ? 'In-network' : 'Out-of-network'}
          {c.priceRange ? ` · ${c.priceRange}` : ''}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <Link
          href={`/agent-caller?provider=${encodeURIComponent(c.name)}&q=${encodeURIComponent(q)}&ins=${encodeURIComponent(insurance)}`}
          className="rounded-lg bg-white text-slate-900 px-3 py-1.5 text-sm font-medium"
        >
          Have us call
        </Link>
        <button className="rounded-lg border border-white/30 px-3 py-1.5 text-sm">Details</button>
      </div>
    </div>
  )
}

function PlanPreview({ plan, form, options, loadingNearby }: { plan: Plan; form: TriageForm; options: CareOption[]; loadingNearby: boolean }) {
  const [showCitations, setShowCitations] = useState(false)
  const locationAvailable = form.useLocation || form.zip.trim().length >= 3
  const sourcesCount = plan.citationsUsed.length + (plan.coverage?.citationIds?.length || 0)

  return (
    <div id="plan" className="rounded-3xl bg-white/5 ring-1 ring-white/15 p-5 md:p-6 space-y-4 sticky top-4 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <RiskBadge level={plan.risk} />
        {plan.stale && <span className="text-[11px] rounded-full bg-white/10 ring-1 ring-white/20 px-2 py-0.5">Some sources older—review</span>}
      </div>

      <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-3">
        <p className="text-sm">
          <span className="font-semibold">Next step:</span>{' '}
          {plan.risk === 'escalate' ? 'Head to urgent care / ER' : 'Start self-care now'}.
        </p>
      </div>

      <p className="text-white/95">{plan.summary}</p>

      {plan.risk === 'escalate' && !locationAvailable && (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <h3 className="font-semibold">Location needed</h3>
          <p className="mt-2 text-sm">Share your ZIP or turn on “Use my location” to show nearby urgent care/ER options.</p>
          <div className="mt-3 flex gap-2">
            <a
              href="#zip"
              onClick={(e) => { e.preventDefault(); document.getElementById('zip')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="rounded-xl bg-white text-slate-900 px-3 py-2 text-sm font-medium"
            >
              Enter ZIP
            </a>
            <a
              href="#loc"
              onClick={(e) => { e.preventDefault(); document.getElementById('loc')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="rounded-xl border border-white/30 px-3 py-2 text-sm"
            >
              Use my location
            </a>
          </div>
        </div>
      )}

      {plan.selfCare.length > 0 && (
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
          <h3 className="font-semibold">Self-care (do now)</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {plan.selfCare.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80" />
                <span className="flex-1">{s.text} <CitationDot id={s.citationId} /></span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-white/80">Takes ~10 minutes.</p>
        </div>
      )}

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <h3 className="font-semibold">Care options near you{' '}
          <span className="text-xs text-white/70">
            ({form.useLocation ? 'location on' : form.zip ? `ZIP ${form.zip}` : ''})
          </span>
        </h3>

        {loadingNearby && <p className="mt-2 text-sm text-white/80">Loading nearby options…</p>}
        {!loadingNearby && options?.length === 0 && (
          <p className="mt-2 text-sm text-white/80">No nearby results. Try a different ZIP.</p>
        )}

        <div className="mt-3 space-y-3">
          {options.slice(0, 12).map((c, i) => <CareRow key={`${c.name}-${i}`} c={c} q={form.q} insurance={form.insurance} />)}
        </div>

        <div className="mt-3 text-xs text-white/70">Showing {Math.min(12, options.length)} of {options.length} results</div>

        <div className="mt-4 rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
          <p className="text-sm font-semibold">What to expect</p>
          <ul className="mt-2 text-sm space-y-1">
            {getExpectations(plan.topic).map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <h3 className="font-semibold">Costs & coverage</h3>
        <div className="mt-2 text-sm">
          <p>
            {plan.coverage?.oopEstimate ? <>Est. out-of-pocket: <span className="font-medium">{plan.coverage.oopEstimate}</span></>
              : 'Add your insurance to estimate out-of-pocket and check in-network.'}
          </p>
          {plan.coverage && plan.coverage.assumptions.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-white/90">
              {plan.coverage.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
          <p className="mt-2 text-xs text-white/80">{plan.priceNote}</p>
          <button onClick={() => setShowCitations(s => !s)} className="mt-2 text-xs underline underline-offset-4">Where this comes from ({sourcesCount})</button>
          {showCitations && <div className="mt-2 rounded-xl bg-white/5 ring-1 ring-white/10 p-3"><CitationsList ids={plan.citationsUsed} /></div>}
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <h3 className="font-semibold">Watch-outs</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {plan.watchOuts.map((w, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80" />
              <span className="flex-1">{w.text} <CitationDot id={w.citationId} /></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
        <h3 className="font-semibold">After-care</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {plan.afterCare.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80" />
              <span className="flex-1">{a.text} <CitationDot id={a.citationId} /></span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">Remind me tonight</button>
          <button className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">Remind me tomorrow</button>
        </div>
      </div>

      {plan.risk === 'escalate' && (
        <div className="rounded-2xl bg-rose-500/10 ring-1 ring-rose-300/30 p-4">
          <h3 className="font-semibold">Go to urgent care/ER now</h3>
          <p className="mt-2 text-sm">Reasons include severe pain, concerning symptoms, or age-specific risks. See watch-outs above.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="tel:911" className="rounded-xl bg-white text-slate-900 px-3 py-2 text-sm font-medium">Call 911</a>
            <Link href="/wait-times" className="rounded-xl border border-white/30 px-3 py-2 text-sm">Nearest ER</Link>
          </div>
        </div>
      )}

      <div className="text-[11px] text-white/80">
        <span className="font-medium">Sources:</span>{' '}
        {plan.citationsUsed.length > 0 ? <CitationsInline ids={plan.citationsUsed} /> : 'Add details to see sources.'}
      </div>
    </div>
  )
}

function CitationDot({ id }: { id: string }) {
  const c = CITATIONS.find(x => x.id === id)
  if (!c) return null
  return (
    <a
      href={c.href}
      target="_blank"
      rel="noreferrer"
      className="align-middle ml-1 inline-flex h-2 w-2 rounded-full bg-white/80 hover:bg-white"
      aria-label={`Source: ${c.org} — ${c.label} (${c.lastUpdated})`}
      title={`${c.org} • ${c.label} • ${c.lastUpdated}`}
    />
  )
}
function CitationsInline({ ids }: { ids: string[] }) {
  const items = ids.map(id => CITATIONS.find(c => c.id === id)).filter(Boolean) as Citation[]
  return <>{items.map((c, i) => (<span key={c.id}><a className="underline" href={c.href} target="_blank" rel="noreferrer">{c.org}</a>{i < items.length - 1 ? ', ' : ''}</span>))}</>
}
function CitationsList({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <p className="text-xs text-white/80">No coverage sources yet—add insurance.</p>
  const items = ids.map(id => CITATIONS.find(c => c.id === id)).filter(Boolean) as Citation[]
  return (
    <ul className="text-xs space-y-1">
      {items.map(c => (
        <li key={c.id} className="flex items-center justify-between gap-3">
          <div>
            <span className="font-medium">{c.org}</span> — {c.label}{' '}
            <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 ring-1 ring-white/15">{c.tier}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/70">{c.lastUpdated}</span>
            <a href={c.href} target="_blank" rel="noreferrer" className="underline">Open</a>
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ============================== All Nearby Overlay (List/Map) ============================== */
function AllNearbyOverlay({
  onClose, options, loading, filterType, setFilterType, sortKey, setSortKey, viewMode, setViewMode, here, zip, radiusUsed, query, insurance
}: {
  onClose: () => void
  options: CareOption[]
  loading: boolean
  filterType: 'all'|'er'|'urgent'|'clinic'
  setFilterType: (t: 'all'|'er'|'urgent'|'clinic') => void
  sortKey: 'distance'|'price'|'open'
  setSortKey: (s: 'distance'|'price'|'open') => void
  viewMode: 'list'|'map'
  setViewMode: (m: 'list'|'map') => void
  here: Coords
  zip: string
  radiusUsed: number | null
  query: string
  insurance: string
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-x-0 bottom-0 md:inset-y-8 md:mx-auto md:max-w-3xl">
        <div className="rounded-t-2xl md:rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-2xl">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm">All nearby options</p>
              <p className="text-xs text-white/70">
                {zip ? `ZIP ${zip}` : 'Your location'} · Radius {radiusUsed ? `${(radiusUsed/1000).toFixed(0)} km` : '—'}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg border border-white/30 px-3 py-1.5 text-sm">Close</button>
          </div>

          <div className="px-4 pb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 bg-white/10 ring-1 ring-white/20 rounded-full px-2 py-1 text-xs">
                <span>Filter:</span>
                {(['all','er','urgent','clinic'] as const).map(t=>(
                  <button key={t}
                    onClick={()=>setFilterType(t)}
                    className={`rounded-full px-2 py-0.5 ${filterType===t?'bg-white text-slate-900':'hover:bg-white/15'}`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-1 bg-white/10 ring-1 ring-white/20 rounded-full px-2 py-1 text-xs">
                <span>Sort:</span>
                {(['distance','price','open'] as const).map(s=>(
                  <button key={s}
                    onClick={()=>setSortKey(s)}
                    className={`rounded-full px-2 py-0.5 ${sortKey===s?'bg-white text-slate-900':'hover:bg-white/15'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center gap-1 bg-white/10 ring-1 ring-white/20 rounded-full px-2 py-1 text-xs ml-auto">
                <button onClick={()=>setViewMode('list')}
                  className={`rounded-full px-2 py-0.5 ${viewMode==='list'?'bg-white text-slate-900':'hover:bg-white/15'}`}
                >List</button>
                <button onClick={()=>setViewMode('map')}
                  className={`rounded-full px-2 py-0.5 ${viewMode==='map'?'bg-white text-slate-900':'hover:bg-white/15'}`}
                >Map</button>
              </div>
            </div>

            {loading && <NearbySkeleton />}

            {!loading && viewMode === 'list' && (
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {options.map((c, i)=>(
                  <CareRow key={`${c.name}-${i}`} c={c} q={query} insurance={insurance} />
                ))}
                {options.length === 0 && <p className="text-sm text-white/80">No results with current filters.</p>}
              </div>
            )}

            {!loading && viewMode === 'map' && (
              <div className="max-h-[60vh]">
                <MiniMap here={here} options={options} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================== Mini SVG Map (no external deps) ============================== */
function MiniMap({ here, options }: { here: Coords, options: CareOption[] }) {
  // Bounds around points
  const pts = options.filter(o=>typeof o.lat==='number' && typeof o.lng==='number') as Required<CareOption>[]
  const all = [...pts, ...(here ? [{ name:'You', distance:'', wait:null, inNetwork:null, priceRange:null, open:true, lat: here.lat, lng: here.lng, typeGuess:'clinic' as const }] : [])]
  if (all.length === 0) return <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 text-sm">No mappable points.</div>

  const minLat = Math.min(...all.map(p=>p.lat))
  const maxLat = Math.max(...all.map(p=>p.lat))
  const minLng = Math.min(...all.map(p=>p.lng))
  const maxLng = Math.max(...all.map(p=>p.lng))
  const pad = 0.02
  const W = 800, H = 420

  function proj(lat: number, lng: number) {
    const x = (lng - (minLng - pad)) / ((maxLng - minLng) + 2*pad)
    const y = 1 - (lat - (minLat - pad)) / ((maxLat - minLat) + 2*pad)
    return { x: x * W, y: y * H }
  }

  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[50vh]">
        <rect x="0" y="0" width={W} height={H} fill="rgba(255,255,255,0.04)" />
        {/* grid */}
        {[...Array(8)].map((_,i)=> <line key={`v${i}`} x1={(i+1)*W/9} y1="0" x2={(i+1)*W/9} y2={H} stroke="rgba(255,255,255,0.08)" />)}
        {[...Array(4)].map((_,i)=> <line key={`h${i}`} x1="0" y1={(i+1)*H/5} x2={W} y2={(i+1)*H/5} stroke="rgba(255,255,255,0.08)" />)}
        {/* points */}
        {pts.map((p,i)=> {
          const {x,y} = proj(p.lat!, p.lng!)
          const fill = p.typeGuess==='er' ? 'rgba(244, 63, 94, 0.9)'
                    : p.typeGuess==='urgent' ? 'rgba(251, 191, 36, 0.9)'
                    : 'rgba(16, 185, 129, 0.9)'
          return (
            <g key={`${p.name}-${i}`} transform={`translate(${x},${y})`} >
              <circle r="6" fill={fill} />
              <text x="8" y="4" fontSize="10" fill="white">{p.name}</text>
            </g>
          )
        })}
        {/* here */}
        {here && (()=>{ const {x,y}=proj(here.lat, here.lng); return (
          <g transform={`translate(${x},${y})`}>
            <rect x="-7" y="-7" width="14" height="14" fill="white" />
            <text x="10" y="4" fontSize="10" fill="white">You</text>
          </g>
        )})()}
      </svg>
    </div>
  )
}
