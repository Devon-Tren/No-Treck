// File: src/app/api/no-trek/tasks/coach/route.ts
import { NextResponse } from 'next/server'

type TaskStep = { id?: string; text: string; done?: boolean }
type TaskCitation = { id?: string; title: string; url: string; source?: string }

type IncomingTask = {
  id: string
  title: string
  status?: 'todo' | 'doing' | 'done'
  urgency?: 'info' | 'elevated' | 'severe' | string
  rationale?: string
  steps?: TaskStep[]
  citations?: TaskCitation[]
  phone?: string
  placeName?: string
  address?: string
  url?: string
}

type CoachRequestBody = {
  task: IncomingTask
  allowedDomains?: string[]
}

// Helper to get domain from URL
function domainOf(url?: string) {
  try {
    return new URL(String(url)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function filterCitations(
  cites: TaskCitation[] | undefined,
  allowedDomains?: string[],
): TaskCitation[] {
  if (!cites || cites.length === 0) return []
  if (!allowedDomains || allowedDomains.length === 0) {
    // Just normalize / add ids
    return cites.map((c, i) => ({
      id: c.id ?? `c_${i + 1}`,
      title: c.title,
      url: c.url,
      source: c.source ?? domainOf(c.url),
    }))
  }

  const seen = new Set<string>()
  const out: TaskCitation[] = []

  for (const c of cites) {
    if (!c?.url) continue
    const d = domainOf(c.url)
    const ok = allowedDomains.some((ad) => d.endsWith(ad))
    if (!ok || seen.has(c.url)) continue
    seen.add(c.url)
    out.push({
      id: c.id ?? `c_${out.length + 1}`,
      title: c.title,
      url: c.url,
      source: c.source ?? d,
    })
  }
  return out
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not set on the server.' },
      { status: 500 },
    )
  }

  let body: CoachRequestBody
  try {
    body = (await req.json()) as CoachRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { task, allowedDomains } = body || {}
  if (!task || !task.title) {
    return NextResponse.json(
      { error: 'Missing task with at least a title.' },
      { status: 400 },
    )
  }

  const prompt = `
You are "Stella", the care-planning AI inside the No Trek app.

Your job:
- Take a single task and make it more *doable*.
- DO NOT diagnose or prescribe.
- Simple, concrete, patient-facing language.
- Assume this is part of an existing intake plan.

Given:
- Task title: "${task.title}"
- Current rationale (may be empty): ${task.rationale ? JSON.stringify(task.rationale) : '""'}
- Urgency: ${task.urgency ?? 'info'}
- Location info (optional):
  - Place name: ${task.placeName ?? '—'}
  - Phone: ${task.phone ?? '—'}
  - Address: ${task.address ?? '—'}
  - URL: ${task.url ?? '—'}

Return a **single JSON object** with:

{
  "rationale": "Short explanation (1–3 sentences max) of why this task matters and what the goal is, written to the patient.",
  "steps": [
    "Short checklist step 1 (DO NOT include bullets, just text)",
    "Short checklist step 2",
    "..."
  ],
  "citations": [
    {
      "title": "Short readable title",
      "url": "https://example.com/path",
      "source": "Readable source name (e.g. CDC, NIH, Mayo Clinic)"
    }
  ],
  "solutionSteps": [
    "Optional high-level step (e.g. 'Confirm diagnosis', 'Arrange follow-up')"
  ]
}

Rules:
- 3–7 steps is ideal.
- Each step should be actionable (call, schedule, prepare info, watch for red-flag symptoms, etc.).
- Prefer citations from these domains if useful: ${
    (allowedDomains || []).length
      ? allowedDomains!.join(', ')
      : 'nih.gov, medlineplus.gov, cdc.gov, who.int, nice.org.uk, mayoclinic.org'
  }.
- If you are not sure about exact citation URLs, you can omit citations or include only very high-level ones from those domains.
- Keep everything NON-URGENT and NON-EMERGENCY. If anything sounds emergency-like, mention that emergency care or 911 is needed instead of trying to manage it here.
- Do not include any explanations outside the JSON. Respond with **only** valid JSON.
  `.trim()

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a careful, conservative care-planning assistant helping someone organize follow-up tasks. You never diagnose or prescribe.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: 'OpenAI request failed',
          details: text || `status ${response.status}`,
        },
        { status: 502 },
      )
    }

    const data = (await response.json()) as any
    const content: string | undefined =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message?.content?.[0]?.text

    if (!content) {
      return NextResponse.json(
        { error: 'No content returned from OpenAI.' },
        { status: 502 },
      )
    }

    let parsed: {
      rationale?: string
      steps?: string[]
      citations?: TaskCitation[]
      solutionSteps?: string[]
    }

    try {
      parsed = JSON.parse(content)
    } catch {
      // If the model accidentally wrapped JSON in text, try to extract.
      const match = content.match(/\{[\s\S]*\}/)
      if (!match) {
        return NextResponse.json(
          { error: 'Could not parse JSON from model response.' },
          { status: 502 },
        )
      }
      parsed = JSON.parse(match[0])
    }

    const rationale = parsed.rationale?.trim() || task.rationale || ''
    const steps =
      Array.isArray(parsed.steps) && parsed.steps.length
        ? parsed.steps.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : []

    const citations = filterCitations(parsed.citations, allowedDomains)
    const solutionSteps =
      Array.isArray(parsed.solutionSteps) && parsed.solutionSteps.length
        ? parsed.solutionSteps.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : []

    return NextResponse.json(
      {
        rationale,
        steps,
        citations,
        solutionSteps,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('[tasks/coach] error', err)
    return NextResponse.json(
      {
        error: 'OpenAI or routing error',
        details: 'Connection error.',
      },
      { status: 502 },
    )
  }
}
