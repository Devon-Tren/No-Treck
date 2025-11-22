// src/app/api/start-call/route.ts
import { NextResponse } from 'next/server'
import Twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const callerId = process.env.TWILIO_CALLER_ID!
const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL!

const twilioClient = Twilio(accountSid, authToken)

// simple server-side Supabase client (anon key is ok here)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { scriptId } = await req.json()

    if (!scriptId) {
      return NextResponse.json(
        { error: 'Missing scriptId' },
        { status: 400 }
      )
    }

    // Load script from DB
    const { data, error } = await supabase
      .from('call_scripts')
      .select('id, clinic_phone, script_text')
      .eq('id', scriptId)
      .single()

    if (error || !data) {
      console.error('start-call: script not found', error)
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      )
    }

    if (!data.clinic_phone) {
      return NextResponse.json(
        { error: 'No clinic phone on file' },
        { status: 400 }
      )
    }

    // Create Twilio call
    const call = await twilioClient.calls.create({
      to: data.clinic_phone,
      from: callerId,
      url: `${baseUrl}/api/twilio-voice?scriptId=${encodeURIComponent(
        scriptId
      )}`,
    })

    return NextResponse.json({ callSid: call.sid })
  } catch (err) {
    console.error('start-call error', err)
    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    )
  }
}
