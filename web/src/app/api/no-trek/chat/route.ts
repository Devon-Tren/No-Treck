import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/* ============================== Config ============================== */

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1
const OPENAI_MODEL = 'gpt-4.1-mini' as const

if (!OPENAI_API_KEY) {
  console.warn(
    '[no-trek/chat] OPENAI_API_KEY is missing. Set it in .env.local or your deployment env.',
  )
}

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null

  console.log(
    '[no-trek/chat] OPENAI key prefix:',
    OPENAI_API_KEY?.slice(0, 6) || 'MISSING',
  );
  
/* ============================== Types ============================== */

type Risk = 'low' | 'moderate' | 'severe'
type Citation = { title: string; url: string; source?: string }
type InsightCard = { id: string; title: string; body: string; citations?: Citation[] }

type PlaceReview = {
  url: string
  source?: string
  quote?: string
  author?: string
  rating?: number
  date?: string
}

type Place = {
  id: string
  name: string
  rating?: number
  reviews?: number
  price?: '$' | '$$' | '$$$' | '$$$$'
  address?: string
  distance_km?: number
  image?: string
  phone?: string
  url?: string
  maps?: string
  reason?: string
  reviewCite?: PlaceReview
  est_cost_min?: number
  est_cost_max?: number
}

type ChatResponse = {
  text?: string
  risk?: Risk
  insights?: InsightCard[]
  places?: Place[]
}

/* ============================== Guardrails / System Prompt ============================== */

const ALLOWED_CITATION_DOMAINS = [
  'nih.gov',
  'medlineplus.gov',
  'cdc.gov',
  'who.int',
  'nice.org.uk',
  'mayoclinic.org',
  'aafp.org',
]

const SYS = [
  'You are Stella, No Trek’s medical-first AI concierge.',
  'You help people reason about symptoms, risk, and next steps, and you speak like a calm, thoughtful clinician-concierge — never like a survey or a chatbot.',
  'You must be concise, warm, and safety-first.',
  'You DO NOT give formal diagnoses or prescriptions. Everything is educational, not a substitute for in-person care.',
  '',
  'You MUST return a single JSON object with keys exactly:',
  'text, risk, insights.',
  '',
  '• text: string — your reply in plain text (no markdown).',
  '• risk: one of "low", "moderate", "severe".',
  '• insights: array of {id, title, body, citations?}.',
  '  - citations (if present) MUST be from approved medical domains only.',
  '',
  `Approved citation domains: ${ALLOWED_CITATION_DOMAINS.join(', ')}.`,
  '',
  'STYLE RULES:',
  '- First line: 1–2 short sentences that acknowledge how they sound and what they’re trying to figure out.',
  '- Then 2–4 short sections separated by line breaks, with clear, natural prose (no bullet characters).',
  '- Ask at most 1–2 targeted follow-up questions at a time, woven into the text, not in a long checklist.',
  '- If there is any chance of an emergency (e.g., severe chest pain, trouble breathing, stroke signs, major trauma, can’t stay conscious), clearly advise emergency services and label risk as "severe".',
  '- Do NOT sound like you are filling out a form. No “Question 1 / Question 2” style.',
  '',
  'INSIGHTS:',
  '- Each insight should feel like a mini-clinician note or summary track.',
  '- id: short stable string identifier.',
  '- title: brief, human-readable label.',
  '- body: 2–6 sentences explaining what you’re thinking about / watching for, in plain language.',
  '- citations: optional; if present, each is {title,url,source?} and url must be from an approved domain.',
  '',
  'If you are not sure what to say, be honest about uncertainty, keep risk conservative, and give 1–3 practical next steps and red flags to watch for.',
  '',
  'NO MARKDOWN. NO EXTRA KEYS. Return ONLY valid JSON.',
].join(' ')

/* ============================== Helpers ============================== */

const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`
const errStr = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e)

function normRisk(x: any): Risk {
  const s = String(x || '').toLowerCase()
  if (['severe', 'high', 'escalate', 'urgent'].includes(s)) return 'severe'
  if (['moderate', 'med', 'watch', 'medium'].includes(s)) return 'moderate'
  return 'low'
}

function domainAllowed(u: string) {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '')
    return ALLOWED_CITATION_DOMAINS.some(d => h.endsWith(d))
  } catch {
    return false
  }
}

function sanitizeInsights(arr: any[]): InsightCard[] {
  const xs = Array.isArray(arr) ? arr : []
  return xs.map((c: any) => ({
    id: String(c?.id || uid('card')),
    title: String(c?.title || 'Note'),
    body: String(c?.body || ''),
    citations: (Array.isArray(c?.citations) ? c.citations : []).filter(
      (ci: any) => ci?.url && domainAllowed(ci.url),
    ),
  }))
}

function extractZip(messages: { role: string; content: string }[], bodyZip?: string) {
  if (bodyZip && /^\d{5}(-\d{4})?$/.test(bodyZip)) return bodyZip.slice(0, 5)
  const joined = messages.map(m => m.content || '').join(' ')
  const m =
    joined.match(/\bZIP:\s*([0-9]{5})(?:-[0-9]{4})?/i) ||
    joined.match(/\b([0-9]{5})(?:-[0-9]{4})?\b/)
  return m ? m[1] : null
}

/* ------- Simple geo / hospital helpers ------- */

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(x))
}

async function zipToLatLng(zip: string) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      zip,
    )}&countrycodes=us&limit=1`,
    {
      headers: { 'User-Agent': 'no-trek/1.0 (care triage)' },
      cache: 'no-store',
    },
  )
  if (!r.ok) return null
  const arr = await r.json()
  const hit = Array.isArray(arr) ? arr[0] : null
  if (!hit) return null
  return { lat: Number(hit.lat), lon: Number(hit.lon) }
}

function toGoogleReviewSearch(name: string, zip?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${zip || ''}`.trim(),
  )}`
}

async function overpassHospitals(lat: number, lon: number, radiusKm = 25) {
  const q = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
      way["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
      relation["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
      node["emergency"="yes"](around:${radiusKm * 1000},${lat},${lon});
    );
    out center tags 40;`

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'no-trek/1.0 (care triage)',
    },
    body: new URLSearchParams({ data: q }).toString(),
    cache: 'no-store',
  })

  if (!res.ok) return []
  const j = await res.json().catch(() => ({ elements: [] as any[] }))
  const elements: any[] = Array.isArray(j?.elements) ? j.elements : []
  return elements
    .map(e => {
      const c = e.center || e
      const tags = e.tags || {}
      const lat2 = typeof c?.lat === 'number' ? c.lat : undefined
      const lon2 = typeof c?.lon === 'number' ? c.lon : undefined
      if (!lat2 || !lon2) return null
      const name = tags.name || tags.operator || 'Hospital'
      const address = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
        .filter(Boolean)
        .join(' ')
      return {
        id: `osm-${e.id}`,
        name,
        lat: lat2,
        lon: lon2,
        address: address || undefined,
        website: tags.website || undefined,
      }
    })
    .filter(Boolean) as Array<{
    id: string
    name: string
    lat: number
    lon: number
    address?: string
    website?: string
  }>
}

async function resolvePlacesFromZip(zip: string): Promise<Place[]> {
  const geo = await zipToLatLng(zip)
  if (!geo) return []
  const raw = await overpassHospitals(geo.lat, geo.lon)
  const places: Place[] = raw.map(p => {
    const distance_km = haversineKm(geo, { lat: p.lat, lon: p.lon })
    const reviewUrl = toGoogleReviewSearch(p.name, zip)
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      url: p.website,
      maps: reviewUrl,
      distance_km,
      price: '$$$',
      reason: 'Emergency-capable facility near you',
      reviewCite: { url: reviewUrl, source: 'google.com' }, // passes REVIEW_GATE on the client
    }
  })
  return places.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
}

function demoFallback(zip: string): Place[] {
  const mk = (name: string, km: number): Place => ({
    id: `demo-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    distance_km: km,
    maps: toGoogleReviewSearch(name, zip),
    reviewCite: { url: toGoogleReviewSearch(name, zip), source: 'google.com' },
    reason: 'Demo fallback — replace with live data',
    price: '$$$',
  })
  return [
    mk('Medical City Dallas Hospital', 5.1),
    mk('Baylor University Medical Center', 7.3),
  ]
}

/* ============================== Route ============================== */

export async function POST(req: NextRequest) {
  if (!openai) {
    return NextResponse.json(
      {
        error: 'Missing OpenAI key',
        reason: 'NO_ENV',
        details: { hasKey: false },
      },
      { status: 500 },
    )
  }

  let body: {
    messages?: { role: string; content: string }[]
    imageBase64?: string
    zip?: string
  } = {}

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const msgs = Array.isArray(body.messages) ? body.messages : []
  const lastUserText =
    msgs.filter(m => m.role === 'user').slice(-1)[0]?.content || ''

  try {
    /* --------- OpenAI call --------- */

    const chat: any[] = [
      { role: 'system', content: SYS },
      ...msgs.map(m => ({ role: m.role, content: m.content })),
    ]

    if (body.imageBase64) {
      chat.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Please consider this image in your assessment.' },
          { type: 'image_url', image_url: { url: body.imageBase64 } },
        ],
      })
    }

    if (!openai) {
        console.error("[no-trek/chat] OpenAI client not initialized");
        return new Response(
          JSON.stringify({ text: "Stella is offline (no API key configured)." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      
      // quick connectivity test
      try {
        const pingRes = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        });
      
        console.log(
          "[no-trek/chat] ping status to /v1/models:",
          pingRes.status,
        );
      } catch (e) {
        console.error("[no-trek/chat] basic fetch to OpenAI FAILED:", e);
      }
      

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: chat as any,
    })

    const raw = completion.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(raw)

    const text = String(parsed?.text || parsed?.reply || '')
    const risk: Risk = normRisk(parsed?.risk || parsed?.planDelta?.risk)
    const insights = sanitizeInsights(parsed?.insights)

    /* --------- Places synthesis (for nearby care) --------- */

    let places: Place[] = []
    const wantsNearby = /near\s*me|nearby|closest|hospital|urgent|er|clinic/i.test(
      lastUserText,
    )
    const zip = extractZip(msgs, body.zip || undefined)

    if (zip && (wantsNearby || risk !== 'low')) {
      try {
        places = await resolvePlacesFromZip(zip)
        if (!places.length) places = demoFallback(zip)
      } catch (err) {
        console.error('[no-trek/chat] place lookup failed, using fallback:', err)
        places = demoFallback(zip)
      }
    }

    const payload: ChatResponse = { text, risk, insights, places }
    return NextResponse.json(payload)
  } catch (e) {
    console.error('[no-trek/chat] OpenAI or routing error:', e)
    return NextResponse.json(
      { error: 'OpenAI request failed', details: errStr(e) },
      { status: 502 },
    )
  }
}
