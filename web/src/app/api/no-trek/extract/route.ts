// File: src/app/api/no-trek/extract/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Msg = { role: 'user' | 'assistant' | 'system'; content: string }
type IntakeFacts = {
  who?: { age?: string; sex?: string; pregnant?: boolean }
  onset?: string; provocation?: string; quality?: string; region?: string; radiation?: string; severity?: string; timing?: string
  associated?: string[]
  redFlags?: { name: string; value: boolean | null }[]
  completeness?: number
  missing?: string[]
  ready?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { history } = await req.json()
    const key = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1
    if (!key) return NextResponse.json({ facts: null, error: 'OPENAI_API_KEY missing' }, { status: 200 })

    const sys = `
Extract OPQRST facts, demographics, associated symptoms, and common red flags from the conversation.
Red flags should be a list with {name, value} where value is true/false/null (null if unknown).
Compute "completeness" in [0,1] based on how many key fields are present (OPQRST + at least 2 red-flag answers).
List the most important "missing" fields (max 5).
Set "ready" = true only if Onset, Region (or body area), Severity OR Quality, and at least 2 red flags have known true/false values.
Return JSON ONLY as { facts: IntakeFacts } with the exact keys.
`.trim()

    const body = {
      model: process.env.OPENAI_MODEL_EXTRACT || 'gpt-4.1-mini',
      temperature: 0.0,
      response_format: { type: 'json_object' as const },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: JSON.stringify({ history }) },
      ],
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    })
    if (!r.ok) return NextResponse.json({ facts: null, error: await r.text() }, { status: 200 })

    const j = await r.json()
    let facts: IntakeFacts | null = null
    try { facts = JSON.parse(j.choices?.[0]?.message?.content || '{}')?.facts ?? null } catch {}
    return NextResponse.json({ facts })
  } catch (e: any) {
    return NextResponse.json({ facts: null, error: String(e?.message || e) }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
