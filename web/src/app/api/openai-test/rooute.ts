import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    hasKey,
    keyStartsWith: process.env.OPENAI_API_KEY?.slice(0, 4) ?? null,
  });
}
