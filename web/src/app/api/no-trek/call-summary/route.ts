// src/app/api/call-summary/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('scriptId')
  if (!scriptId) return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 })

  const { data: rows } = await supabase
    .from('call_transcripts')
    .select('text')
    .eq('call_script_id', scriptId)
    .order('created_at', { ascending: true })

  const transcript = (rows || []).map(r => r.text).join('\n')

  if (!transcript) {
    return NextResponse.json({ summaries: [] })
  }

  const prompt = `
You are Stella summarizing a completed clinic call.
Return a short JSON with:
- header: short title (e.g. "Booked urgent visit for knee pain")
- summary: 2–4 bullet points about what was decided.
- followups: 2–5 follow-up tasks the user should do.

Transcript:
${transcript}
`.trim()

  const resp = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  const parsed = JSON.parse(resp.choices[0].message.content || '{}')

  return NextResponse.json({ summaries: [parsed] })
}
