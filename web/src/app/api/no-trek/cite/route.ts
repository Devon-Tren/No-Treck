// File: src/app/api/no-trek/cite/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Citation = { title: string; url: string; source?: string }

const DEFAULT_ALLOWED = [
  'nih.gov',
  'medlineplus.gov',
  'cdc.gov',
  'who.int',
  'nice.org.uk',
  'mayoclinic.org',
  'aafp.org',
  'cochranelibrary.com',
]

function domainOf(url: string) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function endsWithAny(host: string, allowed: string[]) {
  return allowed.some((d) => host === d || host.endsWith(`.${d}`))
}

function filterAllowed(list: Citation[], allowed: string[]) {
  const seen = new Set<string>()
  return list.filter((c) => {
    if (!c?.url) return false
    const d = domainOf(c.url)
    if (!d || !endsWithAny(d, allowed)) return false
    if (seen.has(c.url)) return false
    seen.add(c.url)
    return true
  })
}

/** Some reputable sites 405/403 on HEAD — fall back to GET */
async function headOk(url: string) {
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow', cache: 'no-store' })
    if (r.ok) return true
    if (r.status === 405 || r.status === 403) {
      r = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store' })
      return r.ok
    }
    return false
  } catch {
    return false
  }
}

async function usingTavily(query: string, allowed: string[]): Promise<Citation[]> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return []
  const r = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query,
      include_domains: allowed,
      search_depth: 'basic',
      max_results: 8,
    }),
  })
  if (!r.ok) return []
  const j = await r.json()
  const items: Citation[] = (j.results || []).map((it: any) => ({
    title: it.title,
    url: it.url,
    source: domainOf(it.url),
  }))
  return filterAllowed(items, allowed)
}

async function usingBing(query: string, allowed: string[]): Promise<Citation[]> {
  const key = process.env.BING_SEARCH_V7_SUBSCRIPTION_KEY
  if (!key) return []
  const r = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10&responseFilter=Webpages`,
    { headers: { 'Ocp-Apim-Subscription-Key': key } }
  )
  if (!r.ok) return []
  const j = await r.json()
  const items: Citation[] = (j.webPages?.value || []).map((v: any) => ({
    title: v.name,
    url: v.url,
    source: domainOf(v.url),
  }))
  return filterAllowed(items, allowed)
}

async function usingGoogleCSE(query: string, allowed: string[]): Promise<Citation[]> {
  const key = process.env.GOOGLE_API_KEY
  const cx = process.env.GOOGLE_CSE_ID
  if (!key || !cx) return []
  const r = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&num=10&q=${encodeURIComponent(query)}`
  )
  if (!r.ok) return []
  const j = await r.json()
  const items: Citation[] = (j.items || []).map((it: any) => ({
    title: it.title,
    url: it.link,
    source: domainOf(it.link),
  }))
  return filterAllowed(items, allowed)
}

async function usingOpenAI(query: string, allowed: string[]): Promise<Citation[]> {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1
  if (!key) return []
  const sys = `
Return 3–6 citations as JSON ONLY with keys: title, url, source.
Rules:
- URLs must be real pages from these domains ONLY: ${allowed.join(', ')}.
- Prefer patient-facing guidance or evidence summaries.
- No homepages; pick the most specific page.
- If unsure, do not invent links.`
  const body = {
    model: process.env.OPENAI_MODEL_CITE || 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Provide citations for: "${query}"` },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' as const },
  }
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  if (!r.ok) return []
  const j = await r.json()
  let payload: any = {}
  try {
    payload = JSON.parse(j.choices?.[0]?.message?.content || '{}')
  } catch {}
  const raw: Citation[] = (payload.citations || payload.items || payload.results || []).map((c: any) => ({
    title: c.title,
    url: c.url,
    source: c.source || domainOf(c.url),
  }))
  return filterAllowed(raw, allowed)
}

async function validateAndRank(list: Citation[]): Promise<Citation[]> {
  // HEAD-check & prefer more authoritative/patient-friendly domains
  const weight = (d: string) =>
    d.endsWith('medlineplus.gov')
      ? 9
      : d.endsWith('nih.gov')
      ? 8.5
      : d.endsWith('cdc.gov')
      ? 8.2
      : d.endsWith('who.int')
      ? 7.9
      : d.endsWith('nice.org.uk')
      ? 7.7
      : d.endsWith('mayoclinic.org')
      ? 7.4
      : d.endsWith('aafp.org')
      ? 7.2
      : d.endsWith('cochranelibrary.com')
      ? 7.1
      : 5

  const withOk = await Promise.all(
    list.map(async (c) => ({ c, ok: await headOk(c.url) }))
  )
  return withOk
    .filter((x) => x.ok)
    .sort((a, b) => weight(domainOf(b.c.url)) - weight(domainOf(a.c.url)))
    .map((x) => x.c)
    .slice(0, 6)
}

export async function POST(req: NextRequest) {
  try {
    const { text, allowedDomains } = await req.json().catch(() => ({}))
    const query: string = String(text || '').trim()
    if (!query) return NextResponse.json({ citations: [] })

    const allowed: string[] =
      Array.isArray(allowedDomains) && allowedDomains.length > 0 ? allowedDomains : DEFAULT_ALLOWED

    // Try providers in order; stop when we have enough
    let citations: Citation[] = []
    for (const fn of [usingTavily, usingBing, usingGoogleCSE, usingOpenAI]) {
      try {
        const got = await fn(query, allowed)
        citations = citations.concat(got)
      } catch {
        // ignore and continue
      }
      if (citations.length >= 4) break
    }

    citations = filterAllowed(citations, allowed)
    citations = await validateAndRank(citations)

    return NextResponse.json({ citations })
  } catch (e: any) {
    // Always return 200 with an empty list so the UI doesn't hard-error
    return NextResponse.json({ citations: [], error: String(e?.message || e) })
  }
}

/** Preflight/utility methods to avoid 405 in devtools */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: 'cite',
    providers: {
      tavily: !!process.env.TAVILY_API_KEY,
      bing: !!process.env.BING_SEARCH_V7_SUBSCRIPTION_KEY,
      googleCSE: !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_CSE_ID,
      openaiFallback: !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1),
    },
  })
}
