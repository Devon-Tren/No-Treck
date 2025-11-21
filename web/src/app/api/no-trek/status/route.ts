// File: src/app/api/no-trek/status/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const hasKey =
    !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_1)

  // You could also test your /chat route here if you want,
  // but this is enough to drive the pill.
  return NextResponse.json({
    connected: hasKey,  // <- what your intake page reads
    hasKey,
    model: 'gpt-4.1-mini',
  })
}
