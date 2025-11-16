import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const hasKey = !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1)
  const connected = hasKey

  return NextResponse.json({
    connected,
    model: connected ? 'gpt-4.1-mini' : undefined,
    details: connected ? { auth: 'ok' } : { auth: 'missing', hasKey },
  })
}
