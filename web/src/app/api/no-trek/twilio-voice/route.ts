// src/app/api/twilio-voice/route.ts
import { NextResponse } from 'next/server'
import { twiml as Twiml } from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('scriptId')

  const resp = new Twiml.VoiceResponse()

  if (!scriptId) {
    resp.say('We are unable to complete this call.')
    return new NextResponse(resp.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const { data, error } = await supabase
    .from('call_scripts')
    .select('script_text')
    .eq('id', scriptId)
    .single()

  if (error || !data) {
    resp.say('We are unable to read the call details at this time.')
  } else {
    resp.say(data.script_text)
  }

  return new NextResponse(resp.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}
