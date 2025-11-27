// File: src/app/intake/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/protectedRoute'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authProvider'

/* ============================== Types ============================== */
type Role = 'user' | 'assistant'
type Risk = 'low' | 'moderate' | 'severe'
type CareStage = 'intake' | 'triage' | 'plan' | 'actions' | 'wrap'

type Citation = { title: string; url: string; source?: string }
type InsightCard = {
  id: string
  title: string
  body: string
  citations?: Citation[]
  confidence?: 'low' | 'medium' | 'high'
  urgency?: 'info' | 'elevated' | 'severe'
  at?: number
  why?: string[]
  next?: string[]
}

type PlaceReview = {
  quote?: string
  source?: string
  url: string
  author?: string
  rating?: number
  date?: string
}

type Place = {
  id: string
  name: string
  address?: string
  distance_km?: number
  phone?: string
  url?: string
  maps?: string
  image?: string
  rating?: number
  reviews?: number
  price?: '$' | '$$' | '$$$' | '$$$$'
  reason?: string
  est_cost_min?: number
  est_cost_max?: number
  in_network?: boolean
  network_confidence?: number
  blurb?: string
  reviewCite?: PlaceReview
  score?: {
    overall?: number
    bedside?: number
    cost?: number
    wait?: number
    distance?: number
  }
  scoreNotes?: string
  scoreSources?: Citation[]
}

type RefImage = { url: string; source?: string; title?: string }

type ChatResponse = {
  text?: string
  citations?: Citation[]
  risk?: Risk
  insights?: InsightCard[]
  places?: Place[]
  refImages?: RefImage[]
  audit?: string
}

type ChatMessage = {
  id: string
  role: Role
  text: string
  citations?: Citation[]
  attachments?: { kind: 'image'; name: string; preview?: string }[]
  refImages?: RefImage[]
}

// Lightweight follow-ups/tasks
type Task = {
  id: string
  title: string
  due?: string // ISO string
  notes?: string
  linkedPlaceId?: string
  linkedInsightId?: string
  done?: boolean
  createdAt?: number
}

/* ============================== Config ============================== */
// Match brand blue
const BRAND_BLUE = '#0E5BD8'

// Stella’s default greeting (used for first message + reset)
const STELLA_GREETING =
  'Hi — I’m Stella, the guide that lives inside No Trek. Start wherever your brain is actually stuck: a weird symptom, a bill you don’t understand, or something for a family member. Tell me what’s going on in your words, and I’ll help you turn it into a plan.'

const ALLOWED_DOMAINS = [
  'nih.gov',
  'medlineplus.gov',
  'cdc.gov',
  'who.int',
  'nice.org.uk',
  'mayoclinic.org',
  'aafp.org',
  'cochranelibrary.com',
]

// Recognize public review sources to pass the review firewall
const REVIEW_SITES = [
  'google.com',
  'maps.google.com',
  'yelp.com',
  'healthgrades.com',
  'vitals.com',
  'zocdoc.com',
  'ratemds.com',
  'webmd.com',
  'caredash.com',
  'doctible.com',
]

const CARD_STAGGER_MS = 160
const CARD_DURATION_MS = 560

// Diversified question bank with memory to avoid repetition (currently used for quick chips only)
const QUESTION_BANK: { key: string; text: string }[] = [
  { key: 'onset', text: 'When did this start (exact day/time)? Has it been changing?' },
  { key: 'provocation', text: 'What makes it better or worse (rest, activity, position)?' },
  {
    key: 'quality',
    text:
      'How would you describe it (aching, sharp, throbbing)? Any spreading or radiation?',
  },
  {
    key: 'region',
    text: 'Where is it located exactly? Any redness, warmth, or swelling?',
  },
  {
    key: 'severity',
    text:
      'On a 0–10 scale, how severe is it right now, and what’s the worst it’s been?',
  },
  {
    key: 'redflags',
    text:
      'Any red flags: fever, shortness of breath, chest pain, weakness, confusion, or new numbness?',
  },
  {
    key: 'function',
    text:
      'What can you not do now that you could do before (walk, grip, turn head, etc.)?',
  },
  {
    key: 'context',
    text:
      'What happened just before this started (injury, new meds, illness, travel)?',
  },
  {
    key: 'history',
    text:
      'Any relevant history (conditions, surgeries, allergies) or meds you’re taking now?',
  },
]

// legacy helper
const OPQRST_QUESTIONS = QUESTION_BANK.map(q => q.text)

const TRIAGE_SYSTEM_PROMPT = `
You are Stella, the medical-first AI concierge for No Trek. In the UI you appear as “Stella”. You are not a doctor or emergency service. You provide educational triage support, planning, and logistics help, not a formal diagnosis or treatment plan.
You combine genius-level medical reasoning with a warm, human chat style.
Your job is to feel like one calm, thoughtful clinician-concierge walking with the user over time, not a search box or a survey.
Primary job: understand symptoms, assess risk, and suggest safe next steps. Ask brief clarifying questions before making strong recommendations.

High-level personality
- You sound like a human clinician texting: conversational, specific, never scripted.
- You avoid “forms” and checklists; questions are woven into natural sentences.
- You show you’re on their side: saving time, money, and stress whenever you can.
- Be concise, warm, and safety-first. Avoid long monologues unless clearly requested.

Length of reply:
- Do not reply in paragraphs reply in texts and if needed expand more but do not ramble on.
- Do not go over 2-3 sentences per reply unless abosulutely neccessary, aim for 2 sentences.
- Ask a question at the end if needed to give further clarity.
- Be intuitive and look for user engagement.


1. Core mission & boundaries
Mission
Understand what this person needs right now.
Place them in the right part of their journey (onboarding, intake, triage, plan, logistics, maintenance, flare, wrap-up).
Turn messy life + health problems into a living care map: intake → triage → plan → tasks → bookings → check-ins.
When tools are available, do work for them (tasks, bookings, navigation, call scripts and caller actions), not just give advice.

Hard boundaries
You are not a doctor, therapist, or emergency service.
You never provide a diagnosis, prescribe medications, or tell someone to start/stop a specific medication.
You never claim certainty about medical outcomes.
You always remind people that your suggestions are educational, not a substitute for a clinician who can examine them in person.

What you can do
Help them reason about risk level and when in-person care is sensible.
Explain options, tradeoffs, and time-sensitivity in plain language.
Help plan steps, organize tasks, prepare scripts for calls, and (when tools exist) trigger actions like tasks, calls, and app navigation.

2. Safety, crisis, and compliance
Always run an internal safety check on every message.
If you detect any of the following:
- clear medical emergency (e.g., chest pain with shortness of breath, signs of stroke, severe head trauma, major bleeding, bone sticking out, can’t breathe, can’t stay conscious, etc.),
- serious self-harm or suicide risk,
- intent to harm others,
- situations where any delay is dangerous,
then:
- Do NOT use tools or attempt bookings.
- Clearly say that:
  - they may be experiencing a medical or mental health emergency,
  - you are not an emergency service,
  - they should immediately contact their local emergency number (for example, 911 in the U.S.) or go to the nearest emergency department.
- Encourage them (if safe) to:
  - contact a trusted person nearby,
  - contact their clinician or crisis hotline if available.
Keep your message short, calm, and directive. Do not minimize the risk.

If they are not in obvious crisis but at moderate to high risk (for example: chest discomfort without clear red flags yet, severe new pain, infection with systemic symptoms, sudden vision changes, possible allergic reaction, etc.), then:
- Clearly recommend prompt in-person or virtual evaluation on an appropriate timeline (e.g., “today”, “within the next few hours”) and explain why you’re concerned and what you’re trying to rule out.
- Offer to help them prepare questions / scripts, and (if tools exist) suggest using No Trek to help with logistics (finding or contacting care).
- Never discourage someone from seeking urgent or emergency care if they want to.

3. Mental model: journeys & modes
Internally, think of each user as being in one journey mode (you don’t need to say this out loud unless helpful):
- onboarding – brand new, figuring out what No Trek is and what Stella can do.
- intake_cycle – telling you what’s going on, history, context, constraints.
- triage_and_plan – turning intake into risk level + next steps.
- logistics – finding places, thinking about bookings, calls, forms, etc.
- maintenance – ongoing support, small tweaks, monitoring.
- flare_or_relapse – something has worsened or returned.
- wrap_and_reflect – reviewing what happened, learning, and closing a loop.
- check-in – they came back after some time or at a scheduled check-in.

At each turn, quietly decide:
- What is their main intent right now?
  (triage question, planning, logistics, questions about No Trek, app navigation, account/tier, or just emotional support)
- Which journey mode best fits?
Respond in a way that moves them one clear step forward in that journey.

4. Conversation style & structure
You should feel like a thoughtful nurse practitioner / medical social worker / concierge in one.

Tone
- Warm, grounded, non-judgmental.
- Speak to them, not at them.
- Validate emotions without dramatizing: “This sounds heavy to carry; it makes sense you’re looking for support.”
- Be concise, but not clipped. Most answers should be 3–5 short sections.

Questions
- Ask one or two high-yield questions at a time, woven into the conversation, not as a checklist.
- Avoid sounding like a survey: don’t present long numbered or bulleted lists of questions. If you genuinely need more than one question, keep them in a short paragraph of natural sentences.
- Never say “I can’t help without more info” as a dead end.
- First, give a general directional sense, then suggest 1–3 specific details that would sharpen your advice.

Early course-correction
In the first 2–3 exchanges, focus on clarifying what’s going on and what matters most to them (symptoms, time course, constraints, goals).
Still give directional risk language:
- “right now this sounds more in the low-to-moderate risk range…”
- “this raises enough concern that I’d treat it as higher risk…”

Response format (default)
Organize most responses into 3–5 short titled sections with bullets, for example:
- What I’m hearing – 1–3 bullets summarizing key facts and feelings.
- What I’m watching out for – conditions/risks you’re considering, in plain language.
- What I recommend right now – immediate steps + disposition (home care vs clinic vs telehealth vs urgent care/ER) with why.
- Red flags — go in sooner if… – specific concrete triggers for urgent or emergent care.
- How No Trek can help – how Stella + the app can support (tasks, scripts, logistics, navigation, tiers).
Adjust section names to fit context (e.g., “How to talk to your doctor”, “Next steps for your plan”, “What this test result might mean”).
Use this structure more after the first 1–2 back-and-forths; keep initial replies lighter and less templated unless there is a clear emergency.

5. Risk & triage behavior
When someone brings a health concern:
- Summarize and orient: restate what you think is happening (symptom, timeframe, any key history). Acknowledge uncertainty and emotions.
- Screen for red flags quickly: ask 1–2 targeted questions that would change the level of urgency.
- For obviously serious phrases like “bone is sticking out”, “can’t walk on it”, “can’t move the limb”, “chest pain with shortness of breath”, “sudden vision loss”, “difficulty breathing”, “confusion or not making sense”, assume at least moderate to severe risk unless clearly ruled out.

Use validated decision rules only as educational context
You may name decision rules like Ottawa Ankle, NEXUS, Canadian C-Spine, Wells/PERC, HEART, Centor/McIsaac as part of explaining thinking and “what clinicians often use,” but:
- Do not apply them as if you examined the patient.
- Present them as context (“Here’s the kind of checklist a clinician might consider…”) and direct people to clinicians for formal assessment.

Disposition recommendation
Always recommend in terms of options and tradeoffs, not orders. For example:
- “If things stay like X and none of the red flags appear, it’s reasonable to try home care and follow up with your primary care within Y.”
- “If Y or Z happens, I’d treat this more urgently and go to urgent care / ER.”
Explain what you’re trying to rule out and why certain timelines matter.

Document the risk narrative for future steps
Internally keep track of: current working risk level (low / moderate / high), what you’re worried about, and which red flags you already checked.

6. Plans, tasks, and the “living care map”
When appropriate, turn loose advice into a structured plan:
Help them define:
- 1–3 focus tracks (e.g., “Get a clearer diagnosis”, “Manage pain safely”, “Support sleep and stress”).
- Steps for today / this week / later, explicitly staged.
- Constraints: time, money, transport, energy, fears, triggers.

When tools are available (e.g., no_trek.create_plan, no_trek.create_tasks_from_plan, no_trek.list_tasks, no_trek.update_task), prefer to:
- Create or update a plan and concrete tasks.
- Mark tasks doing/done when users say they’ve completed something.
- Set up check-ins or reminders through the appropriate tool.

In pure chat (no tools), still think in tasks:
- Present lists like:
  - “Today or tomorrow: …”
  - “Within the next week: …”
  - “Later / nice to have: …”
- Ask whether they’d like you to keep helping them break things down if they come back.
- If they feel overwhelmed, offer to simplify: fewer tasks, clearer priorities, and reassurance that it’s okay to move slowly.

7. Logistics, bookings, and calls (future-friendly + AI caller integration)
When their intent is about finding care or handling logistics:
- Clarify: geography / distance, insurance or budget constraints, preferences (telehealth vs in-person, language, provider gender, accessibility), any existing relationships (e.g., “I already see Dr. X”).

Core logistics behavior
If tools like no_trek.search_places, no_trek.get_place_details, no_trek.call_or_booking_webhook, and no_trek.save_booking_result are available, you may:
- Propose a short list of 1–3 reasonable options.
- Ask explicit consent before contacting any third party or using PHI with external services.
- Call / book through tools and then summarize what happened (success vs failure, next steps).
- Create follow-up tasks like “Attend appointment at…” or “Bring lab results”.

If such tools are not available:
- Help them script what to say on calls.
- Explain what information they may need (insurance info, symptoms summary, goals).
- Offer alternative paths (telehealth, community clinics, nurse lines, etc. where appropriate).

Calling & scripts behavior (for AI caller + phone support)
- When the user either:
  - mentions calling or scheduling (e.g., “Can you call this clinic?”, “I need to schedule an appointment”), OR
  - clearly seems ready for concrete next steps and asks for help contacting a clinic,
  you should offer: “I can draft a call script for you, and if tools are available I can also help place a call to a nearby clinic.”
- If they agree to create a call script, FIRST:
  - Ask which clinic/office to call:
    - name of the clinic/office,
    - location/city,
    - phone number if they have it.
  - Ask what legal name you should use for the patient in the script (the name the clinic has on file).
  - Ask for their date of birth (DOB) as a standard identifier clinics often use.
  - If the user says they do NOT want their DOB spoken unless staff asks:
    - Do NOT include DOB in the first line of the script.
    - Instead, add a private note in brackets, e.g. "(If staff asks for DOB, answer with: [DOB])." This note is for the caller only and should not be spoken in the script itself.
- Ask a short series (no more than about 6) focused questions to draft the script, such as:
  - who they are calling for (themselves or another person),
  - preferred distance or neighborhood,
  - insurance / payment constraints (if relevant),
  - timing/availability (when they can go or take a call),
  - callback number,
  - what they want from the visit (e.g., “new patient appointment”, “follow-up for X”, “same-day urgent visit”).
- Then include a clear call script in the \`text\` field, prefaced exactly with:
  - \`CALL SCRIPT DRAFT:\`
- The very first line of the script MUST always begin with a transparent introduction like:
  - \`Hi, my name is Stella. I’m an AI assistant with No Trek, calling on behalf of [FULL NAME][, born [DOB] if they explicitly agreed to have DOB spoken].\`
  Where \`[FULL NAME]\` is the legal name they told you to use. Only include DOB in that first line if they explicitly said they are comfortable with that; otherwise, keep DOB for when staff asks.
- Write the rest of the script as if the patient or their delegate is speaking to clinic staff in natural language, making clear that you are assisting them as an AI assistant.

Approval and improvement loop (script only)
- After providing the script, you MUST explicitly ask for approval and feedback, for example:
  - “Does this script sound right to you, and what would you like me to change or add?”
- If they do NOT clearly approve it:
  - Ask briefly what to adjust (tone, details, insurance, timing, symptoms, etc.).
  - Generate a revised script.
  - Repeat this loop (ask → revise) until they say it looks good.
- Only treat the script as “final/approved” once they explicitly confirm that it looks good or that they approve it.

Consent for AI caller and redirect to AI Call page
When (and only when) ALL of the following are true:
- The user has clearly said the call script looks good or that they approve it, or something similar.
- The user has clearly given consent to use this script with the AI caller or a phrase implying consent is given.

Treat any clear natural-language confirmation such as:
- "Yes, you have my permission to use this script."
- "Yes, you can call for me using that."
- "I consent to you using this script with the AI caller."
as explicit consent to use the script with the AI caller.

…then you MUST do ALL of the following, every single time:

- At the very end of your "text" string, on its own line, append exactly:
    \'CALL_SCRIPT_APPROVED_AND_CONSENTED\', again ONLY if the user approved the script and gave consent.
   - No quotes, no extra punctuation, no extra words.
   - It must be uppercase, with underscores, spelled exactly as above.
- Keep the call script itself inside "text" under the "CALL SCRIPT DRAFT:"" section as usual.
- Include an insight object with id "call_script_metadata" whose "body" is a JSON string with at least:
  "{ "clinicName": "<clinic name>", "clinicPhone": "<phone or null>" }".

Never include "CALL_SCRIPT_APPROVED_AND_CONSENTED" unless both approval AND consent have been given.

- After the user approves the script, clearly and separately ask for consent to use it with the AI caller, for example:
  - “Do I have your permission to use this approved script to help place a call through No Trek’s AI caller?”
- If they do NOT consent:
  - Respect that choice.
  - Keep the call script as a DIY resource in \`text\`.
  - Offer tips for how they can read or adapt it when they call themselves.
  - Do NOT trigger any calling tools or navigation for calling.
- If they DO consent AND calling tools are available:
  - Let them know you’ll bring them to the AI Call page and how to start the call, e.g.:
    - “Great. I’ll send you to the AI Call page next. Once you’re there, click the Call button while this script is selected, and I’ll use it to guide the call.”
  - If UI navigation tools exist (e.g., \`client.navigate(page_id)\` and \`client.highlight(element_id)\`):
    - Navigate them to the AI Call page (for example, \`client.navigate("ai_call")\`).
    - Optionally highlight the Call button (for example, \`client.highlight("ai_call_button")\`).
  - If UI navigation tools do NOT exist:
    - Give clear instructions on how to manually open the AI Call page (for example: “From the home screen, tap ‘AI Call’ at the bottom.”).

Using the script with the AI caller
- When the user indicates they are on the AI Call page and/or have clicked the Call button:
  - Retrieve the most recent, explicitly approved call script you created for them.
  - Pair it with:
    - the clinic/office info (name, location, phone),
    - any relevant constraints (timing, insurance, preferences) you collected.
  - When you call \`no_trek.call_or_booking_webhook\` (or equivalent caller tool), include:
    - the full approved script text (starting with the AI-assistant introduction line),
    - the destination clinic/office details,
    - key structured preferences (timing window, visit type, etc.).
- Keep all of this within the same JSON response:
  - The script itself always lives inside \`text\`.
  - Any higher-level notes or rationales, including what you sent to the caller tool, can live in \`insights\`.

8. Knowledge, education, and “explainers”
When the user is asking for information (about conditions, tests, or No Trek itself):
Always:
- Use plain language first; only then add brief technical terms.
- Clarify that this is general education, not a personal diagnosis.
- Tie back to: “Here’s how to discuss this with your clinician” or “Here are a few questions you could ask your doctor.”

For questions about No Trek:
- Explain in 1–2 sentences what No Trek does:
  - Medical-first navigation + logistics help, not just bookings.
- Mention that Stella can:
  - help them think through symptoms and next steps safely,
  - organize tasks and follow-ups,
  - help with logistics and scripts,
  - eventually help with upgrades / business tiers if appropriate.
Keep FAQ-style answers short, structured, and empathetic. Invite them to share their specific situation so you can adapt general info to their reality.

9. App navigation and “driver mode”
When someone seems lost in the app or mentions screens/pages:
- Help them decide what they’re trying to do (example: start intake, review plan, check tasks, upgrade, look at bookings).
When tools like client.navigate(page_id) and client.highlight(element_id) exist, use them to:
- Move them to the right page.
- Highlight the relevant piece of UI.
Then narrate briefly what you just did and what they can do there.

Example style:
“You’re on your Tasks page now. I’ve highlighted what’s due this week. Want help adjusting anything?”

If tools are not available, still give clear, simple directions like:
“From the home screen, tap ‘Intake’ at the bottom, then select ‘Start a new concern’.”

10. Account, tiers, and ethical monetization
You support free and paid tiers (e.g., Plus, Business) but you are never pushy.

Principles:
- The free tier must still feel genuinely helpful and respectful.
- Upsells are framed as:
  - “Do you want us to take more of the burden off you?” — not fear or scarcity.

When appropriate (heavy logistics, complex coordination, many moving pieces), you may gently say:
- “We can absolutely keep doing this in a DIY way for free.”
- “If you’d like more done-for-you help — like making multiple calls, price-shopping, tracking paperwork — those higher-touch pieces live in our paid No Trek Plus plan.”

If tools like no_trek.get_subscription_status and no_trek.create_checkout_session exist, you can:
- Check their current tier to avoid suggesting upgrades they already have.
- Trigger an upgrade flow only after explicit interest.
- Never gate safety-critical guidance behind payment.

11. Memory and continuity
Over time, try to maintain a coherent picture of the person. Internally track (when memory or tools allow):
- brief profile (age band, region, key conditions, constraints),
- current journey mode and risk level,
- latest intake summary,
- active plan themes (e.g., “knee pain,” “sleep,” “caregiver burnout”),
- counts/summary of tasks (due, done, overdue),
- any upcoming appointments,
- preferences (short vs deep-dive replies, tone, energy level today),
- subscription status (free, plus, business),
- relationship phase (brand new, engaged, veteran, dormant).

Each time a meaningful step happens (intake completed, triage done, plan created, big task completed, appointment outcome), update your internal picture and reflect it back in conversation:
- “Last time we set up X and Y; it sounds like X happened but Y didn’t, which is completely okay. Let’s adjust around what really happened.”

If memory is limited, at least summarize the story within the current conversation so they feel held and seen.

12. When you’re uncertain
If information is missing, conflicting, or outside your expertise:
- Be transparent about limits.
- Offer ranges and options, not false precision.
- Suggest how a clinician would usually clarify it (what exam, what questions).
- Ask the one or two most important questions that would change your guidance.
Leave them with:
- a directional sense of risk (low vs might need urgent care),
- 1–3 practical next steps,
- a clear sense of what to watch for and when to seek help.
Never leave someone with just “I don’t know”; always pair uncertainty with concrete next moves.

Pacing & first-reply rules
For the very first reply on a new concern, keep it short and lightweight: at most ~120 words or 3–6 short sentences.
First reply focus:
- Brief empathy / validation.
- 1–3 bullets of “What I’m hearing so far” after learning more.
- 1–2 targeted questions that would change urgency or next steps, but don’t ask all the questions all at once; it’s a conversation-style interaction that leads to helping.
Do not deliver a full “What I’m hearing / What I’m watching for / What I recommend / Red flags / How No Trek can help” block on the first reply unless there is an obvious emergency.
Avoid strong labels like “This sounds like X” or “It’s probably Y” in the first reply. Instead use softer language such as “One thing clinicians sometimes think about here is X, but I’d want to ask a couple quick questions before taking that too seriously.”
Only after you’ve had at least one back-and-forth of clarifying questions should you:
- Give a more complete structured answer.
- Offer specific home-care steps or a clearer working impression.
Exception: if the first message clearly describes a medical emergency, override brevity and give direct, urgent safety guidance right away (911 / ER, etc.), as described in the safety section.

- Name validated clinical decision rules when relevant (Ottawa Ankle, NEXUS, Canadian C-Spine, Wells/PERC, HEART, Centor/McIsaac).

Evidence:
Every non-question claim must include citations from: ${ALLOWED_DOMAINS.join(
  ', ',
)}. If you cannot cite, ask for more info or clearly mark uncertainty instead of guessing.
Treat this as a “citation lock”: you would rather be transparent about uncertainty or keep advice high-level than give precise, uncited medical claims.

Output (VERY IMPORTANT – JSON ONLY):
Always reply as a single top-level JSON object. No markdown, no plain-text outside JSON.
Return strict JSON with:
- text: string – the full natural-language reply the user sees (including any "CALL SCRIPT DRAFT:" content when relevant).
- citations: {title:string, url:string, source?:string}[] – sources supporting your main claims.
- risk: "low" | "moderate" | "severe" – your current working risk level for this concern.
- insights: {
    id: string,
    title: string,
    body: string,
    why: string[],
    next: string[],
    confidence: "low" | "moderate" | "high",
    urgency: "info" | "elevated" | "severe",
    citations: {title:string, url:string, source?:string}[]
  }[]
- places (optional, only if verified reviews available): array of place objects for care options.
- refImages (optional): array of reference images if helpful.

Critical: call-consent marker
- If and only if the user has approved a call script AND given consent to use it with the AI caller, your "text" MUST end with a blank line followed by:
  CALL_SCRIPT_APPROVED_AND_CONSENTED
- This marker is how the app knows to save the script and consent. Do not forget it.
- Never include this marker unless explicit approval + consent is clearly given.

Clients may sometimes only use \`text\`, \`risk\`, and \`insights\`, but you must still follow this full schema so that intake, tasks, logistics, and the AI caller can all work correctly.
`.trim()



/* ============================== Utils ============================== */
const uid = (p = 'm') => `${p}_${Math.random().toString(36).slice(2, 9)}`
const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
const isDeclarative = (t?: string) => {
  if (!t) return false
  const s = t.trim()
  return s.length > 0 && (!s.endsWith('?') || /[.!] /.test(s))
}
const isReviewDomain = (url?: string) => {
  if (!url) return false
  const d = domainOf(url)
  return REVIEW_SITES.some(rd => d.endsWith(rd))
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read failed'))
    fr.onload = () => resolve(String(fr.result))
    fr.readAsDataURL(file)
  })
}

async function saveCallScriptAndConsent(opts: {
  userId: string
  clinicName: string
  clinicPhone?: string
  scriptText: string
  scriptJson?: any
}) {
  const { userId, clinicName, clinicPhone, scriptText, scriptJson } = opts

  // 1) Insert into call_scripts
  const { data: scriptRow, error: scriptError } = await supabase 
    .from('call_scripts')
    .insert({
      user_id: userId,
      clinic_name: clinicName,
      clinic_phone: clinicPhone ?? null,
      script_text: scriptText,
      script_json: scriptJson ?? null,
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (scriptError || !scriptRow) {
    console.error('Error inserting call_script:', scriptError)
    throw new Error('Could not save call script')
  }

  const scriptId = scriptRow.id as string

  // 2) Insert consent row
  const consentText =
    'User consented to an outbound call to this clinic using the approved script.'

  const { error: consentError } = await supabase.from('consents').insert({
    user_id: userId,
    call_script_id: scriptId,
    type: 'outbound_call',
    text: consentText,
  })

  if (consentError) {
    console.error('Error inserting consent:', consentError)
    // not fatal for redirect; just log
  }

  return scriptId
}

function filterAllowed(cites?: Citation[]) {
  const seen = new Set<string>()
  return (cites || []).filter(ci => {
    if (!ci?.url) return false
    const d = domainOf(ci.url)
    const ok = ALLOWED_DOMAINS.some(allow => d.endsWith(allow))
    if (!ok || seen.has(ci.url)) return false
    seen.add(ci.url)
    return true
  })
}

function outlineByRisk(r: Risk) {
  return r === 'severe'
    ? 'rgba(239,68,68,0.65)'
    : r === 'moderate'
    ? 'rgba(245,158,11,0.58)'
    : 'rgba(255,255,255,0.38)'
}
function glowByRisk(r: Risk) {
  return r === 'severe'
    ? 'rgba(239,68,68,0.38)'
    : r === 'moderate'
    ? 'rgba(245,158,11,0.34)'
    : 'rgba(120,190,255,0.38)'
}

function riskRank(r: Risk): number {
  return r === 'severe' ? 2 : r === 'moderate' ? 1 : 0
}
function maxRisk(a: Risk, b: Risk): Risk {
  return riskRank(a) >= riskRank(b) ? a : b
}

function heuristicRiskFromText(text: string): Risk | null {
  const t = text.toLowerCase()

  const severePhrases = [
    'bone sticking out',
    'bone is sticking out',
    'bone is out',
    'bone coming out',
    "can't breathe",
    'cant breathe',
    'shortness of breath',
    'severe chest pain',
    'chest pain and shortness of breath',
    'lost vision',
    'sudden vision loss',
    "can't feel my arm",
    "can't feel my leg",
    'cant feel my arm',
    'cant feel my leg',
    'numb on one side',
    'face drooping',
    'slurred speech',
    'speech slurred',
    'passed out',
    'fainted',
    'seizure',
  ]

  if (severePhrases.some(p => t.includes(p))) return 'severe'

  const moderatePhrases = [
    'broke my',
    'broken',
    'fracture',
    'stress fracture',
    'hairline fracture',
    "can't walk",
    'cant walk',
    "can't put weight",
    'cant put weight',
    "can't bear weight",
    'cant bear weight',
    "can't move",
    'cant move',
    'hit my head',
    'head injury',
    'car accident',
  ]

  if (moderatePhrases.some(p => t.includes(p))) return 'moderate'

  return null
}

async function backfillCitations(text: string): Promise<Citation[]> {
  try {
    const r = await fetch('/api/no-trek/cite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, allowedDomains: ALLOWED_DOMAINS }),
    })
    if (!r.ok) return []
    const j = await r.json()
    return filterAllowed(j.citations || [])
  } catch {
    return []
  }
}

function placeBlurb(p: Place) {
  const bits: string[] = []
  if (typeof p.rating === 'number')
    bits.push(`${p.rating.toFixed(1)}★${p.reviews ? ` · ${p.reviews}` : ''}`)
  if (typeof p.distance_km === 'number')
    bits.push(`${p.distance_km.toFixed(1)} km`)
  if (p.price) bits.push(`price ${p.price}`)
  const s1 = `${p.name} offers convenient care${bits.length ? ` (${bits.join(' · ')})` : ''}.`
  const s2 = p.reason || 'Chosen by a composite of reviews, distance, and affordability.'
  const s3 =
    p.scoreNotes || (p.in_network ? 'May be in-network; confirm coverage.' : 'Confirm insurance and any facility fees.')
  return [s1, s2, s3].join(' ')
}

/* ============================== Splash ============================== */
// Match landing-page splash, but wordmark = "INTAKE"
function SplashIntro({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sitTime = reduced ? 0 : 1100
    const fadeDur = reduced ? 0 : 650
    const t1 = setTimeout(() => setFade(true), sitTime)
    const t2 = setTimeout(() => onDone(), sitTime + fadeDur)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 transition-opacity duration-700 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* animated orb backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0E5BD8]/40 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 bg-gradient-to-tr from-[#0E5BD8]/25 via-sky-500/20 to-transparent blur-3xl animate-[spin_40s_linear_infinite]" />
      </div>
      <div className="relative select-none text-5xl font-extrabold tracking-tight italic text-white drop-shadow-[0_0_40px_rgba(37,99,235,0.75)] sm:text-7xl md:text-8xl">
        INTAKE
      </div>
    </div>
  )
}

/* ============================== Page ============================== */
export default function IntakePage() {
  const search = useSearchParams()

  const [connected, setConnected] = useState<boolean | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      text: STELLA_GREETING,
    },
  ])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const [risk, setRisk] = useState<Risk>('low')
  const [riskTrail, setRiskTrail] = useState<Risk[]>(['low'])
  const [insights, setInsights] = useState<InsightCard[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [activePlace, setActivePlace] = useState<Place | null>(null)
  const [placeFullscreen, setPlaceFullscreen] = useState(false)

  const [fullCard, setFullCard] = useState<InsightCard | null>(null)

  const router = useRouter()
  const { user } = useAuth()
  const [savingScript, setSavingScript] = useState(false)

  const [evidenceLock, setEvidenceLock] = useState(true)
  const [hardEvidence, setHardEvidence] = useState(true)
  const [gateMsg, setGateMsg] = useState<string | null>(null)
  const [showSources, setShowSources] = useState(false)

  const [showAllPlaces, setShowAllPlaces] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageConsent, setImageConsent] = useState<boolean>(false)

  const [zip, setZip] = useState<string>('')

  const [showSplash, setShowSplash] = useState(true)

  // follow-ups state
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTasks, setShowTasks] = useState(false)

  // relaxed gating toggle
  const [showUnverified, setShowUnverified] = useState(false)

  // episode stage
  const [stage, setStage] = useState<CareStage>('intake')

  const endRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  // Memory of asked questions to avoid repetition (currently unused, but kept if you want to bring back auto-OPQRST)
  const askedRef = useRef<Set<string>>(new Set())

  // Track which insights auto-generated self-care tasks
  const autoTaskedRef = useRef<Set<string>>(new Set())

  // Live-call bubble state
  const [callViz, setCallViz] = useState<{
    status: 'idle' | 'calling' | 'ok' | 'failed'
    transcript: string[]
    placeName?: string
  }>({ status: 'idle', transcript: [] })

  const [showScrollBtn, setShowScrollBtn] = useState(false)

  useEffect(() => {
    const el = chatRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      setShowScrollBtn(!nearBottom)
    }
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])
  function scrollToBottom() {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }

  // restore
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nt_intake_session_v1')
      if (saved) {
        const j = JSON.parse(saved)
        if (Array.isArray(j.messages)) setMessages(j.messages)
        if (j.risk) setRisk(j.risk)
        if (Array.isArray(j.riskTrail)) setRiskTrail(j.riskTrail)
        if (Array.isArray(j.insights)) setInsights(j.insights)
        if (Array.isArray(j.places)) setPlaces(j.places)
        if (typeof j.zip === 'string') setZip(j.zip)
        if (typeof j.evidenceLock === 'boolean') setEvidenceLock(j.evidenceLock)
      }
      const tSaved = localStorage.getItem('nt_intake_tasks_v1')
      if (tSaved) {
        const tj = JSON.parse(tSaved)
        if (Array.isArray(tj)) setTasks(tj)
      }
    } catch {}
  }, [])
  // persist
  useEffect(() => {
    const snapshot = { messages, risk, riskTrail, insights, places, zip, evidenceLock }
    localStorage.setItem('nt_intake_session_v1', JSON.stringify(snapshot))
  }, [messages, risk, riskTrail, insights, places, zip, evidenceLock])
  useEffect(() => {
    localStorage.setItem('nt_intake_tasks_v1', JSON.stringify(tasks))
  }, [tasks])

  // engine status
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/no-trek/status', { cache: 'no-store' })
        const j = await r.json()
        setConnected('connected' in j ? !!j.connected : true)
      } catch {
        setConnected(false)
      }
    })()
  }, [])

  // autosize textarea
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [draft])

  // scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // boot from landing
  const [bootedFromLanding, setBootedFromLanding] = useState(false)
  useEffect(() => {
    const q = search.get('q')
    const z = search.get('zip')
    if (z) setZip(z)
    if (q && !bootedFromLanding) {
      setBootedFromLanding(true)
      handleSend(q)
    }
  }, [search, bootedFromLanding])

  const debug = search.get('debug') === '1'

  const accent = BRAND_BLUE
  const outline = useMemo(() => outlineByRisk(risk), [risk])
  const glow = useMemo(() => glowByRisk(risk), [risk])

  const maybeHandleScriptConsent = async (
    assistantText: string,
    metadata: {
      clinicName?: string
      clinicPhone?: string
      scriptJson?: any
    },
  ) => {
    if (!user) return // must be logged in

    const approved = assistantText.includes('CALL_SCRIPT_APPROVED_AND_CONSENTED')

    const draftLabel = 'CALL SCRIPT DRAFT:'
    const marker = 'CALL_SCRIPT_APPROVED_AND_CONSENTED'

    const draftIdx = assistantText.indexOf(draftLabel)
    if (!approved || draftIdx === -1) return

    let scriptSection = assistantText.slice(draftIdx + draftLabel.length)

    const markerIdx = scriptSection.indexOf(marker)
    if (markerIdx !== -1) {
      scriptSection = scriptSection.slice(0, markerIdx)
    }

    const scriptText = scriptSection.trim()
    if (!scriptText) return

    try {
      setSavingScript(true)

      const scriptId = await saveCallScriptAndConsent({
        userId: user.id,
        clinicName: metadata.clinicName ?? 'Clinic',
        clinicPhone: metadata.clinicPhone,
        scriptText,
        scriptJson: metadata.scriptJson,
      })

      // Optional: add a little confirmation message in the chat
      setMessages(m => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text:
            'Got it — I’ve saved this call script and your consent. I’ll move you to the AI caller in a few seconds so we can place the call.',
        },
      ])

      // 5-second delay before redirect
      setTimeout(() => {
        router.push(`/agent-caller?scriptId=${scriptId}`)
      }, 5000)
    } catch (err) {
      console.error(err)
      setMessages(m => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text:
            'I tried to save that call script but something went wrong on my side. You can still copy the script text for now.',
        },
      ])
    } finally {
      setSavingScript(false)
    }
  }

  const sessionSources = useMemo(() => {
    const out: Citation[] = []
    const push = (c?: Citation[]) => filterAllowed(c).forEach(ci => out.push(ci))
    insights.forEach(i => push(i.citations))
    messages.forEach(m => push(m.citations))
    const seen = new Set<string>()
    return out.filter(c => (seen.has(c.url) ? false : (seen.add(c.url), true)))
  }, [insights, messages])

  async function onPickImage(file: File | null) {
    setImageFile(file)
    setImageConsent(false)
    if (!file) return setImagePreview(null)
    const preview = await fileToDataURL(file)
    setImagePreview(preview)
  }

  function mergeInsights(prev: InsightCard[], incoming: InsightCard[]): InsightCard[] {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const map = new Map<string, InsightCard>()
    prev.forEach(c => map.set(norm(c.title), c))
    incoming.forEach(c => {
      const k = norm(c.title)
      const exists = map.get(k)
      if (!exists) {
        map.set(k, c)
      } else {
        map.set(k, {
          ...exists,
          body: c.body || exists.body,
          confidence: c.confidence || exists.confidence,
          urgency: c.urgency || exists.urgency,
          at: c.at || exists.at,
          why: Array.from(new Set([...(exists.why || []), ...(c.why || [])])),
          next: Array.from(new Set([...(exists.next || []), ...(c.next || [])])),
          citations: filterAllowed([...(exists.citations || []), ...(c.citations || [])]),
        })
      }
    })
    return Array.from(map.values())
  }

  /* ---------- Review Gate + Scoring ---------- */
  const REVIEW_GATE = (p: Place) => {
    const hasDirectRating = (p.rating ?? 0) > 0 && (p.reviews ?? 0) > 0
    const hasQuotedReview = !!p.reviewCite?.url
    const hasScoreReviewSource = (p.scoreSources || []).some(c => isReviewDomain(c.url))
    return hasDirectRating || hasQuotedReview || hasScoreReviewSource
  }

  function priceLevel(p?: Place['price']) {
    return p === '$' ? 1 : p === '$$' ? 2 : p === '$$$' ? 3 : p === '$$$$' ? 4 : 0
  }

  function computeScores(p: Place) {
    const rating = typeof p.rating === 'number' ? clamp(p.rating, 0, 5) : 0
    const reviews = typeof p.reviews === 'number' ? Math.max(0, p.reviews) : 0
    const dist = typeof p.distance_km === 'number' ? Math.max(0, p.distance_km) : 30
    const priceBand = priceLevel(p.price)

    const ratingScore = rating / 5
    const volumeScore = Math.min(1, Math.log10((reviews || 1) + 1) / 2.3)
    const distanceScore = 1 - Math.min(1, dist / 18)
    const haveCost = typeof p.est_cost_min === 'number' || typeof p.est_cost_max === 'number'
    const costMid = haveCost
      ? ((p.est_cost_min ?? p.est_cost_max ?? 0) + (p.est_cost_max ?? p.est_cost_min ?? 0)) / 2
      : undefined
    const costScore = haveCost
      ? clamp(1 - (costMid! / 450), 0, 1)
      : priceBand === 0
      ? 0.6
      : clamp(1 - (priceBand - 1) / 3, 0, 1)

    const composite =
      0.55 * ratingScore + 0.15 * volumeScore + 0.2 * distanceScore + 0.1 * costScore

    // Scale NT score into a clearer 3.0–5.0 band for recommended options
    const overall = Number((3 + composite * 2).toFixed(2))

    const score = {
      overall,
      bedside: rating ? Number(rating.toFixed(2)) : undefined,
      cost: Number((costScore * 5).toFixed(2)),
      wait: undefined,
      distance: Number((distanceScore * 5).toFixed(2)),
    }

    const why: string[] = []
    if (rating >= 4.2) why.push('strong patient rating')
    if (reviews > 100) why.push('many reviews')
    if (dist < 8) why.push('close by')
    if (haveCost) why.push(`lower estimated cost ~$${Math.round(costMid!)}`)
    else if (priceBand && priceBand <= 2) why.push('lower price band')

    let notes = ''
    if (haveCost) {
      const floor = p.est_cost_min ?? p.est_cost_max
      const ceil = p.est_cost_max ?? p.est_cost_min
      notes = `Estimated cost $${Math.round(floor!)}–$${Math.round(ceil!)} (lower is better).`
    } else if (p.price) {
      notes = `Price band ${p.price} (proxy).`
    }

    return {
      score,
      reason: p.reason || (why.length ? `Chosen for ${why.join(', ')}` : undefined),
      scoreNotes: notes,
    }
  }

  /* === Places derived === */
  const reviewedPlaces = useMemo(
    () => (showUnverified ? places : places.filter(REVIEW_GATE)),
    [places, showUnverified],
  )
  function rankPlaces(input: Place[]): Place[] {
    return [...input]
      .map(p => ({ ...p, ...computeScores(p) }))
      .sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0))
  }
  const rankedPlaces = useMemo(() => rankPlaces(reviewedPlaces), [reviewedPlaces])
  const top3 = rankedPlaces.slice(0, 3)
  const nearest10 = [...rankedPlaces].slice(0, 10)

  function openPlace(p: Place) {
    setActivePlace(p)
    setPlaceFullscreen(false)
    const bits: string[] = []
    if (typeof p.rating === 'number')
      bits.push(
        `rating ${p.rating.toFixed(1)}★${p.reviews ? ` (${p.reviews} reviews)` : ''}`,
      )
    if (typeof p.distance_km === 'number') bits.push(`${p.distance_km.toFixed(1)} km away`)
    if (p.price) bits.push(`price band ${p.price}`)
    if (p.est_cost_min || p.est_cost_max) {
      const lo = p.est_cost_min ?? p.est_cost_max
      const hi = p.est_cost_max ?? p.est_cost_min
      bits.push(`est. cost $${Math.round(lo!)}–$${Math.round(hi!)}`)
    }
    if (p.reason) bits.push(p.reason)

    setMessages(m => [
      ...m,
      {
        id: uid(),
        role: 'assistant',
        text: `Why we recommend ${p.name}:\n• ${bits.join(
          '\n• ',
        )}\nWe weigh verified reviews, distance, and affordability. These are suggestions—not medical care.`,
        citations: filterAllowed(p.scoreSources),
      },
    ])
  }

  async function requestAICall(place?: Place) {
    setCallViz({
      status: 'calling',
      transcript: ['Dialing...', 'Navigating phone tree…'],
      placeName: place?.name,
    })
    try {
      const r = await fetch('/api/no-trek/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      })
      const ok = r.ok
      setMessages(m => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: ok
            ? `I can call ${place ? `${place.name}` : 'the clinic'} to check availability, wait time, and estimated cost, and report back with notes.`
            : `The call feature isn’t configured yet. You can call directly${
                place?.phone ? ` at ${place.phone}` : ''
              }.`,
        },
      ])
      setCallViz(v => ({
        ...v,
        status: ok ? 'ok' : 'failed',
        transcript: [...v.transcript, ok ? 'Connected.' : 'Call init failed.'],
      }))
    } catch {
      setCallViz(v => ({
        ...v,
        status: 'failed',
        transcript: [...v.transcript, 'Could not place the call.'],
      }))
      setMessages(m => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: `I couldn't start a call right now. You can call directly${
            place?.phone ? ` at ${place.phone}` : ''
          }.`,
        },
      ])
    }
  }

  // follow-ups helpers
  function addTask(t: Partial<Task>) {
    const task: Task = {
      id: uid('t'),
      title: t.title || 'Follow-up',
      due: t.due,
      notes: t.notes,
      linkedPlaceId: t.linkedPlaceId,
      linkedInsightId: t.linkedInsightId,
      done: false,
      createdAt: Date.now(),
    }
    setTasks(prev => [task, ...prev])
    setShowTasks(true)
  }

  function addPlaceFollowUp(p: Place) {
    addTask({
      title: `Call ${p.name} for availability/ETA and cost`,
      notes: [p.phone ? `Phone: ${p.phone}` : '', p.address || '', p.url ? `Website: ${p.url}` : '']
        .filter(Boolean)
        .join(' \n'),
      linkedPlaceId: p.id,
    })
  }
  function addInsightFollowUps(card: InsightCard) {
    const next = card.next || []
    if (next.length === 0)
      return addTask({ title: `Follow up on: ${card.title}`, linkedInsightId: card.id })
    addTask({
      title: `Next steps — ${card.title}`,
      notes: next.map(n => `• ${n}`).join('\n'),
      linkedInsightId: card.id,
    })
  }
  function toggleTaskDone(id: string) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }
  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }
  function updateTaskDue(id: string, due?: string) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, due } : t)))
  }

  // Auto-create self-care follow-ups from insights
  function maybeAutoTaskFromInsight(card: InsightCard) {
    if (!card.id) return
    const seen = autoTaskedRef.current
    if (seen.has(card.id)) return

    const joined = (card.next || []).join(' ').toLowerCase()
    const selfCare =
      joined.includes('tylenol') ||
      joined.includes('acetaminophen') ||
      joined.includes('ibuprofen') ||
      joined.includes('rest') ||
      joined.includes('ice') ||
      joined.includes('elevation') ||
      joined.includes('compression')

    if (!selfCare) return
    seen.add(card.id)

    const title = card.title ? `Self-care: ${card.title}` : 'Self-care plan'
    const notes = (card.next || []).length
      ? (card.next || []).map(n => `• ${n}`).join('\n')
      : undefined

    setTasks(prev => [
      {
        id: uid('t'),
        title,
        due: undefined,
        notes,
        linkedInsightId: card.id,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ])
  }

  // Helper currently unused (kept for possible future auto-question flow)
  function pickNextQuestions(n = 2): string[] {
    const asked = askedRef.current
    const remaining = QUESTION_BANK.filter(q => !asked.has(q.key))
    const pool = remaining.length ? remaining : QUESTION_BANK
    const out: string[] = []
    for (const q of pool) {
      if (out.length >= n) break
      if (!asked.has(q.key)) {
        asked.add(q.key)
        out.push(q.text)
      }
    }
    if (out.length < n) {
      for (const q of QUESTION_BANK) {
        if (q.key !== 'severity' && !out.includes(q.text)) {
          out.push(q.text)
          if (out.length >= n) break
        }
      }
    }
    return out.slice(0, n)
  }

  async function handleSend(textOverride?: string) {
    const textValue = (textOverride ?? draft).trim()
    if (!textValue && !(imageFile && imageConsent)) return

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text: textValue || (imageFile ? '[Image uploaded]' : ''),
      attachments: imageFile
        ? [{ kind: 'image', name: imageFile.name, preview: imagePreview || undefined }]
        : undefined,
    }

    setMessages(m => [...m, userMsg])
    if (textOverride === undefined) setDraft('')
    setSending(true)
    setGateMsg(null)

    const aId = uid()
    setMessages(m => [...m, { id: aId, role: 'assistant', text: '' }])

    let imageBase64: string | undefined
    if (imageFile && imagePreview && imageConsent) {
      imageBase64 = imagePreview
      setImageFile(null)
      setImagePreview(null)
      setImageConsent(false)
    }

    try {
      const payloadMessages: any[] = [
        { role: 'system', content: TRIAGE_SYSTEM_PROMPT },
        ...messages.map(x => ({ role: x.role, content: x.text })),
        { role: 'user', content: userMsg.text },
      ]
      if (zip.trim()) payloadMessages.push({ role: 'user', content: `ZIP: ${zip.trim()}` })

      const r = await fetch('/api/no-trek/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          imageBase64,
          allowedDomains: ALLOWED_DOMAINS,
        }),
      })

      if (!r.ok) {
        const body = await r.text()
        await typeFull(aId, `Error: ${r.status} — ${body.slice(0, 200)}`)
        setSending(false)
        return
      }

      const data: ChatResponse = await r.json()

      // 👇 NEW: check if this message contains an approved + consented call script
      // TRIAGE_SYSTEM_PROMPT is already set up to include markers like
      // "CALL SCRIPT DRAFT:" and "CALL_SCRIPT_APPROVED_AND_CONSENTED"
      await maybeHandleScriptConsent(data.text || '', {
        clinicName: 'Clinic',          // you can later swap this for a real clinic name if you track it in state
        clinicPhone: undefined,        // same for phone
        scriptJson: data,              // optional: store the full JSON in script_json
      })

      // Try to use citations from the model
      let finalCites = filterAllowed(data.citations)

      // If we require hard evidence and the answer is declarative but missing citations,
      // try to backfill WITHOUT blocking the reply.
      if (hardEvidence && isDeclarative(data.text) && finalCites.length === 0) {
        const backfilled = await backfillCitations(data.text || '')
        if (backfilled.length) {
          finalCites = backfilled
        } else {
          // Non-blocking warning instead of prereq questions
          setGateMsg(
            'Some of this answer may not be fully citation-backed yet — treat it as educational, not a diagnosis.',
          )
        }
      }

      if (finalCites.length > 0) {
        setMessages(m =>
          m.map(mm => (mm.id === aId ? { ...mm, citations: finalCites } : mm)),
        )
      } else if (isDeclarative(data.text)) {
        setMessages(m =>
          m.map(mm => (mm.id === aId ? { ...mm, citations: [] } : mm)),
        )
      }

      // Reference images
      if (Array.isArray(data.refImages) && data.refImages.length > 0) {
        setMessages(m =>
          m.map(mm =>
            mm.id === aId ? { ...mm, refImages: data.refImages!.slice(0, 3) } : mm,
          ),
        )
      }

      // Always show Stella's answer
      await typeFull(aId, data.text || '')

      // Risk tracking: combine model risk with heuristic
      const heuristic = heuristicRiskFromText(userMsg.text || '')
      if (data.risk || heuristic) {
        setRisk(prev => {
          let base: Risk = (data.risk as Risk) || prev
          if (heuristic) base = maxRisk(base, heuristic)
          const next = base
          setRiskTrail(t => (t.length && t[t.length - 1] === next ? t : [...t, next]))
          return next
        })
      }

      // Insights
      if (Array.isArray(data.insights)) {
        const cleaned = data.insights.map(c => ({
          ...c,
          citations: filterAllowed(c.citations),
          at: c.at || Date.now(),
        }))
        setInsights(prev => mergeInsights(prev, cleaned))
        cleaned.forEach(card => maybeAutoTaskFromInsight(card))
      }

      // Places
      if (Array.isArray(data.places)) {
        setPlaces(data.places)
      } else if (debug) {
        setMessages(m => [
          ...m,
          {
            id: uid(),
            role: 'assistant',
            text: 'No places[] returned by API. Cards depend on places[].',
          },
        ])
      }
    } catch (e: any) {
      await typeFull(
        aId,
        `I couldn’t reach the medical engine. (${String(e?.message || e)})`,
      )
    } finally {
      setSending(false)
    }
  }


  function typeInto(id: string, chunk: string) {
    setMessages(m =>
      m.map(mm => (mm.id === id ? { ...mm, text: (mm.text || '') + chunk } : mm)),
    )
  }
  async function typeFull(id: string, full: string) {
    if (!full) return
    const step = 16
    for (let i = 0; i < full.length; i += step) {
      typeInto(id, full.slice(i, i + step))
      await new Promise(r => setTimeout(r, 10))
    }
  }

  // Build payload for Tasks page
  function buildTasksPayload() {
    return {
      from: 'intake',
      createdAt: new Date().toISOString(),
      risk,
      riskTrail,
      insights,
      places: rankedPlaces.slice(0, 10),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.done ? 'done' : 'todo',
        dueAt: t.due ?? null,
        notes: t.notes,
        linkedPlaceId: t.linkedPlaceId,
        linkedInsightId: t.linkedInsightId,
      })),
    }
  }

  // Export care map for Tasks
  function exportForTasks() {
    const payload = buildTasksPayload()
    try {
      localStorage.setItem('nt_intake_to_tasks_v1', JSON.stringify(payload))
    } catch {
      // ignore
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-trek-care-plan-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function exportTxt() {
    const lines: string[] = []
    lines.push('No Trek — Intake Session')
    lines.push(`Risk: ${risk}  |  Trail: ${riskTrail.join(' → ')}`)
    if (zip.trim()) lines.push(`ZIP: ${zip.trim()}`)
    lines.push('')
    messages.forEach(m => {
      lines.push(`${m.role.toUpperCase()}: ${m.text}`)
      if (m.refImages?.length) {
        m.refImages.forEach(ri => lines.push(`  [ref] ${ri.title || ri.url} — ${ri.url}`))
      }
    })
    if (insights.length) {
      lines.push('')
      lines.push('INSIGHTS:')
      insights.forEach(i => lines.push(`- ${i.title}: ${i.body}`))
    }
    if (sessionSources.length) {
      lines.push('')
      lines.push('SOURCES:')
      sessionSources.forEach(s => lines.push(`- ${s.title || s.url}  ${s.url}`))
    }
    if (tasks.length) {
      lines.push('')
      lines.push('FOLLOW-UPS:')
      tasks.forEach(t =>
        lines.push(
          `- [${t.done ? 'x' : ' '}] ${t.title}${
            t.due ? ` (due ${new Date(t.due).toLocaleString()})` : ''
          }`,
        ),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-trek-session-${new Date().toISOString().slice(0, 19)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function resetSession() {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: STELLA_GREETING,
      },
    ])
    setRisk('low')
    setRiskTrail(['low'])
    setInsights([])
    setPlaces([])
    setImageFile(null)
    setImagePreview(null)
    setImageConsent(false)
    askedRef.current = new Set()
    autoTaskedRef.current = new Set()
    setTasks([])
    setStage('intake')
  }
  function deleteData() {
    localStorage.removeItem('nt_intake_session_v1')
    localStorage.removeItem('nt_intake_tasks_v1')
    localStorage.removeItem('nt_intake_to_tasks_v1')
    resetSession()
  }

  const engaged =
    messages.some(m => m.role === 'user') ||
    insights.length > 0 ||
    places.length > 0
  const readyInsightCount = (evidenceLock ? insights.filter(i => (i.citations || []).length > 0) : insights).length
  const showRightRail = true // always show Stella’s plan space on the right
  const cardsActive = readyInsightCount > 0 || rankedPlaces.length > 0

  const openTasks = tasks.filter(t => !t.done).length
  const hasAssess = readyInsightCount > 0
  const hasSite = rankedPlaces.length > 0 || risk !== 'low'
  const hasPrice = rankedPlaces.some(
    p =>
      typeof p.distance_km === 'number' ||
      typeof p.est_cost_min === 'number' ||
      typeof p.est_cost_max === 'number',
  )
  const bookingState = callViz.status

  // Episode engine
  useEffect(() => {
    setStage(prev => {
      if (!engaged) return 'intake'
      const hasInsights = readyInsightCount > 0
      const hasPlaces = rankedPlaces.length > 0
      const hasFollowUps = tasks.length > 0
      const allDone = hasFollowUps && tasks.every(t => t.done)

      if (!hasInsights) return 'triage'
      if (hasInsights && !hasFollowUps && !hasPlaces) return 'plan'
      if ((hasFollowUps || hasPlaces) && !allDone) return 'actions'
      if (allDone) return 'wrap'
      return prev
    })
  }, [engaged, readyInsightCount, rankedPlaces.length, tasks])

  // Starter chips: fill the input instead of sending
  const starterChips = [
    {
      label: 'New or ongoing symptom',
      text:
        "I’m worried about a symptom and not sure how urgent it is or where I should go.",
    },
    {
      label: 'Bills & money stress',
      text:
        "I’m overwhelmed by a medical bill and not sure what’s correct or what my options are.",
    },
    {
      label: 'Forms, portals, or paperwork',
      text:
        "I’m stuck on healthcare forms or portals and need help understanding and organizing what to do.",
    },
    {
      label: 'For a family member',
      text:
        "I’m trying to help a family member with their health and feel lost about where to start.",
    },
  ]

  const handleChipClick = (text: string) => {
    setDraft(text)
    // small delay so the textarea exists before focusing
    setTimeout(() => {
      textRef.current?.focus()
    }, 0)
  }

  return (
    <ProtectedRoute>
    <main
      className="relative min-h-dvh overflow-hidden bg-slate-950 text-slate-50"
      style={
        {
          ['--brand-blue' as any]: BRAND_BLUE,
          ['--nt-accent' as any]: accent,
          ['--nt-outline' as any]: outline,
          ['--nt-glow' as any]: glow,
        } as CSSProperties
      }
    >
      <BreathingBackground risk={risk} />
      {showSplash && <SplashIntro onDone={() => setShowSplash(false)} />}

      <div className="relative z-10">
        <NavBar />
        <EmergencyBanner />

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          {/* Stella hero row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
                Start with Stella
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Tell Stella what’s actually on your mind.
              </h1>
              <p className="mt-2 text-sm text-slate-200/85">
                Bring anything: new symptoms, long-term worries, confusing bills, forms and
                portals, or something for a family member. Stella listens first, then turns
                it into a simple plan with you.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-500/60 bg-slate-900/80 px-3 py-1 text-xs text-slate-100 backdrop-blur">
                <span
                  className={cx(
                    'h-2 w-2 rounded-full',
                    connected
                      ? 'bg-emerald-400'
                      : connected === false
                      ? 'bg-rose-400'
                      : 'bg-slate-400',
                  )}
                />
                <span>
                  {connected === null
                    ? 'Checking Stella'
                    : connected
                    ? 'Stella is online'
                    : 'Using backup engine'}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 backdrop-blur">
                <span className="hidden sm:inline">Optional: your ZIP for nearby options</span>
                <span className="inline sm:hidden">ZIP for nearby options</span>
                <input
                  value={zip}
                  onChange={e => setZip(e.target.value.replace(/[^\d-]/g, '').slice(0, 10))}
                  placeholder="e.g., 10001"
                  className="w-24 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                  inputMode="numeric"
                  aria-label="ZIP code for nearby results"
                />
              </div>
            </div>
          </div>

          {/* Layout */}
          <div
            className={cx('mt-6 grid gap-6')}
            style={
              showRightRail
                ? ({ gridTemplateColumns: 'minmax(760px,1.45fr) 400px' } as CSSProperties)
                : ({} as CSSProperties)
            }
          >
            {/* Chat */}
            <section
              className={cx(
                'relative w-full overflow-hidden rounded-[22px] border-[2px] border-slate-700/70 bg-slate-900/80 p-4 shadow-[0_0_26px_rgba(15,23,42,0.9)] backdrop-blur',
              )}
              aria-label="No Trek chat"
            >
              {/* Stella persona header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-500 via-emerald-400 to-sky-600 text-[11px] font-black tracking-tight text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.85)]">
                    ST
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/80">
                      Stella · No Trek guide
                    </p>
                    <p className="mt-1 text-sm text-slate-100">
                      I live here inside No Trek. Start wherever your brain is actually stuck —
                      symptoms, bills, forms, or caring for someone else — and we’ll turn it into
                      a plan together.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {engaged && <RiskBadge risk={risk} />}
                  <span className="text-[11px] text-slate-300/90">
                    Educational support — not a diagnosis
                  </span>
                </div>
              </div>

              {/* Living Care Map */}
              <div className="mt-3">
                <LivingCareMap
                  risk={risk}
                  hasAssess={hasAssess}
                  hasSite={hasSite}
                  hasPrice={hasPrice}
                  bookingState={bookingState}
                  stage={stage}
                  openTasks={openTasks}
                  totalTasks={tasks.length}
                />
              </div>

              {risk === 'severe' && (
                <div className="mt-3 rounded-xl border-[2px] border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  Some symptoms may be in an emergency range. If you have life-threatening
                  symptoms, call your local emergency number now.
                </div>
              )}

              <div
                ref={chatRef}
                className={cx(
                  engaged ? 'h-[62vh]' : 'h-[72vh] sm:h-[74vh]',
                  'mt-3 space-y-3 overflow-y-auto pr-1',
                )}
              >
                {messages.map(m => (
                  <div key={m.id} className="group">
                    <ChatBubble msg={m} />
                    {m.refImages?.length ? <RefImageStrip images={m.refImages} /> : null}
                  </div>
                ))}
                {sending && <TypingDots />}
                <div ref={endRef} />
                {showScrollBtn && (
                  <button
                    onClick={scrollToBottom}
                    className="pill absolute bottom-3 right-3 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow hover:bg-slate-800"
                    title="Jump to latest"
                  >
                    Jump to latest ⤵
                  </button>
                )}
              </div>

              <GateBanner msg={gateMsg} onClose={() => setGateMsg(null)} />

              {/* Composer */}
              <div className="mt-3 border-t border-slate-700/80 pt-3">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-end gap-2"
                  aria-label="Chat composer"
                >
                  {/* (+) picker */}
                  <label className="relative inline-flex h-12">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={e => onPickImage(e.target.files?.[0] || null)}
                      aria-label="Upload image"
                    />
                    <span className="inline-flex h-12 items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/90">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="opacity-90"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 5v4h4v2h-4v4h-2v-4H7V11h4V7h2Z"
                        />
                      </svg>
                      {imageFile ? (
                        <span className="max-w-[12rem] truncate">{imageFile.name}</span>
                      ) : (
                        'Add'
                      )}
                    </span>
                  </label>

                  {imagePreview && (
                    <div className="h-12 w-16 overflow-hidden rounded-lg border-[2px] border-slate-600/80 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="relative flex-1">
                    <textarea
                      ref={textRef}
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder="You can tell me about symptoms, bills, forms, or someone you’re helping…"
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      className="h-12 min-h-[46px] w-full resize-none rounded-3xl border border-slate-600/80 bg-slate-900/80 px-4 py-3 pr-16 text-[15px] leading-6 text-slate-50 placeholder:text-slate-400 outline-none focus:border-slate-300"
                    />
                    {/* Vertically-centered send button */}
                    <button
                      type="submit"
                      aria-label="Send message"
                      disabled={sending || (!draft.trim() && !(imageFile && imageConsent))}
                      className={cx(
                        'absolute right-1.5 top-6 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-transform hover:scale-[1.03]',
                        sending ? 'cursor-default opacity-60' : 'cursor-pointer',
                      )}
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, rgba(56,189,248,1), rgba(59,130,246,1))',
                      }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-950">
                        Send
                      </span>
                    </button>
                  </div>
                </form>

                {imagePreview && (
                  <label className="mt-2 flex items-center gap-2 text-xs text-slate-200/90">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-600/80 bg-transparent"
                      checked={imageConsent}
                      onChange={e => setImageConsent(e.target.checked)}
                    />
                    Use this image for this session only.
                  </label>
                )}

                {/* Guided starter chips — expand scope without overwhelming */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-200/90">
                  <span>If it’s easier, tap one to start:</span>
                  {starterChips.map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleChipClick(chip.text)}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-800/90"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Light session tools tucked away at bottom-right */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300/90">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={evidenceLock}
                        onChange={e => setEvidenceLock(e.target.checked)}
                        className="h-3.5 w-3.5 bg-transparent"
                      />
                      Evidence lock
                    </label>
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={hardEvidence}
                        onChange={e => setHardEvidence(e.target.checked)}
                        className="h-3.5 w-3.5 bg-transparent"
                      />
                      Warn if citations missing
                    </label>
                    <label
                      className="inline-flex items-center gap-1.5"
                      title="Show places even if reviews are missing"
                    >
                      <input
                        type="checkbox"
                        checked={showUnverified}
                        onChange={e => setShowUnverified(e.target.checked)}
                        className="h-3.5 w-3.5 bg-transparent"
                      />
                      Show unverified options
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowSources(true)}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-800/90"
                    >
                      Sources ({sessionSources.length})
                    </button>
                    <button
                      onClick={exportTxt}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-800/90"
                    >
                      Export .txt
                    </button>
                    <button
                      onClick={exportForTasks}
                      disabled={tasks.length === 0}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800/90"
                    >
                      Send to Tasks
                    </button>
                    <button
                      onClick={() => setShowTasks(true)}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
                    >
                      Follow-ups ({openTasks})
                    </button>
                    <button
                      onClick={resetSession}
                      className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
                    >
                      Reset
                    </button>
                    <button
                      onClick={deleteData}
                      className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:bg-slate-900/90"
                      title="Delete local session data & images"
                    >
                      Delete my data
                    </button>
                  </div>
                </div>
              </div>

              <SessionFile
                messages={messages}
                insights={insights}
                top3={top3}
                onCall={() => requestAICall(top3[0])}
                onExportPlan={exportForTasks}
              />

              {callViz.status !== 'idle' && (
                <LiveCallBubble
                  status={callViz.status}
                  transcript={callViz.transcript}
                  placeName={callViz.placeName}
                  onClose={() => setCallViz({ status: 'idle', transcript: [] })}
                />
              )}
            </section>

            {/* Right rail */}
            {showRightRail && (
              <aside className="self-start space-y-4 lg:sticky lg:top-8">
                {/* Stella’s plan space — always visible */}
                <PlanPanel risk={risk} insights={insights} tasks={tasks} />

                {cardsActive && (
                  <>
                    {/* Clinics / care sites */}
                    {top3.length > 0 && (
                      <div
                        className="hover-card rounded-[22px] border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5 backdrop-blur"
                        style={{
                          animation: `floatInRight ${CARD_DURATION_MS}msease-out both`,
                          animationDelay: `0ms`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-slate-50">
                              Stella&apos;s clinic picks
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-300/90">
                              Ranked by No Trek score (reviews, distance, affordability).
                            </p>
                          </div>
                          <span className="text-xs text-slate-300/90">Top 3</span>
                        </div>
                        <div className="mt-3 space-y-3">
                          {top3.map(p => (
                            <PlaceRow
                              key={p.id}
                              p={p}
                              onOpen={() => openPlace(p)}
                              onCall={() => requestAICall(p)}
                              onFollowUp={() => addPlaceFollowUp(p)}
                              showWhy
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {(evidenceLock
                      ? insights.filter(i => (i.citations || []).length > 0)
                      : insights
                    ).map((c, i) => (
                      <InsightTriad
                        key={`${c.id}-${i}`}
                        card={c}
                        delay={(i + 1) * CARD_STAGGER_MS}
                        durationMs={CARD_DURATION_MS}
                        onAICall={() => requestAICall(top3[0])}
                        onExpand={() => setFullCard(c)}
                        onAddFollowUps={() => addInsightFollowUps(c)}
                      />
                    ))}

                    {nearest10.length > 0 && (
                      <div
                        className="hover-card rounded-[22px] border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5 backdrop-blur"
                        style={{
                          animation: `floatInRight ${CARD_DURATION_MS}ms ease-out both`,
                          animationDelay: `${(insights.length + 2) * CARD_STAGGER_MS}ms`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-slate-50">More care options</h3>
                            <p className="mt-0.5 text-[11px] text-slate-300/90">
                              Tap for breakdown, citations, and directions.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowAllPlaces(true)}
                            className="text-xs font-semibold text-slate-200 hover:underline"
                          >
                            View all ({rankedPlaces.length})
                          </button>
                        </div>
                        <div className="mt-3 space-y-3">
                          {nearest10.map(p => (
                            <PlaceRow
                              key={p.id}
                              p={p}
                              onOpen={() => openPlace(p)}
                              onCall={() => requestAICall(p)}
                              onFollowUp={() => addPlaceFollowUp(p)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {places.length > 0 && rankedPlaces.length === 0 && (
                      <div className="rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
                        <h3 className="font-medium text-slate-50">
                          No reviewed options yet
                        </h3>
                        <p className="mt-1 text-sm text-slate-200/90">
                          We hide locations without verifiable ratings or public reviews.
                          Toggle “Show unverified options” below if you’d like to see
                          everything the model returned.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </aside>
            )}
          </div>

          {/* What Stella can / can’t do strip */}
          <CapabilitiesStrip />

          <p className="mt-4 text-[11px] text-slate-400">
            No Trek and Stella do not provide medical care, diagnoses, or prescriptions. This
            is educational support only. If you have life-threatening symptoms, call your
            local emergency number.
          </p>
        </div>
      </div>

      {activePlace && (
        <PlaceDrawer
          place={activePlace}
          fullscreen={placeFullscreen}
          onToggleFullscreen={() => setPlaceFullscreen(v => !v)}
          onClose={() => setActivePlace(null)}
          onCall={() => requestAICall(activePlace)}
          onFollowUp={() => addPlaceFollowUp(activePlace)}
        />
      )}
      {showAllPlaces && (
        <AllPlacesPanel
          places={rankedPlaces}
          onClose={() => setShowAllPlaces(false)}
          onOpenPlace={openPlace}
          onCallPlace={p => requestAICall(p)}
          onFollowUpPlace={p => addPlaceFollowUp(p)}
        />
      )}
      {showSources && (
        <SourcesPanel sources={sessionSources} onClose={() => setShowSources(false)} />
      )}
      {fullCard && (
        <CardFullscreen
          card={fullCard}
          onClose={() => setFullCard(null)}
          onAddFollowUps={() => addInsightFollowUps(fullCard)}
        />
      )}
      {showTasks && (
        <FollowUpsPanel
          tasks={tasks}
          places={places}
          insights={insights}
          onClose={() => setShowTasks(false)}
          onToggleDone={toggleTaskDone}
          onDelete={deleteTask}
          onUpdateDue={updateTaskDue}
          onOpenInsight={id => {
            const card = insights.find(c => c.id === id)
            if (card) {
              setFullCard(card)
              setShowTasks(false)
            }
          }}
        />
      )}

      <style jsx global>{`
        :root {
          --brand-blue: ${BRAND_BLUE};
        }
        .pill {
          border-radius: 9999px;
        }
        .hover-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          will-change: transform;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(20, 60, 180, 0.36),
            0 1px 0 rgba(255, 255, 255, 0.08) inset;
          border-color: rgba(148, 163, 184, 0.6) !important;
        }
        .bubble-stella::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: 0 0 0 2px var(--nt-outline), 0 0 24px var(--nt-glow);
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes dots {
            0% {
              opacity: 0.2;
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0.2;
            }
          }
          @keyframes floatInRight {
            from {
              opacity: 0;
              transform: translateX(16px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          @keyframes sectionIn {
            0% {
              opacity: 0;
              transform: translateY(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes softPulse {
            0% {
              opacity: 0.2;
              transform: scale(1);
            }
            50% {
              opacity: 0.3;
              transform: scale(1.02);
            }
            100% {
              opacity: 0.2;
              transform: scale(1);
            }
          }
          @keyframes nodePop {
            from {
              transform: scale(0.92);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        }
      `}</style>
    </main>
    </ProtectedRoute>
  )
}

/* ============================== Background ============================== */
function BreathingBackground({ risk }: { risk: Risk }) {
  // Single dark-blue base; risk only tints the glow
  const accent =
    risk === 'severe'
      ? 'rgba(248,113,113,0.70)'
      : risk === 'moderate'
      ? 'rgba(252,211,77,0.70)'
      : 'rgba(56,189,248,0.70)'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* main gradient (fixed dark mode blue) */}
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            'radial-gradient(1200px 800px at 80% 0%, rgba(15,118,255,0.28), transparent 60%), linear-gradient(180deg, #020617 0%, #020617 45%, #020617 100%)',
        }}
      />

      {/* subtle grid / circuitry */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />

      {/* risk-tinted breathing glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 640px at 72% 18%, ${accent}, transparent 60%)`,
          filter: 'blur(58px)',
          opacity: 0.25,
          animation: 'softPulse 11s ease-in-out infinite',
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_center,transparent,rgba(0,0,0,0.55))]" />
    </div>
  )
}

/* ============================== Nav & Emergency Banner ============================== */

function NavBar() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intake', label: 'Start with Stella' },
    { href: '/tasks', label: 'Plan & Tasks' },
    { href: '/explore', label: 'Explore' },
    { href: '/info', label: 'How it works' },
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
  ]

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.85)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Brand / wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/95 text-[11px] font-black tracking-tight text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.9)]">
            NT
          </div>
          <span className="text-xs font-semibold tracking-[0.26em] text-slate-100">
            NO TREK
          </span>
        </Link>

        {/* Desktop nav + CTA */}
        <nav className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/85 transition-colors hover:text-sky-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/intake"
            className="rounded-2xl bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
          >
            Start with Stella
          </Link>
        </nav>
      </div>

      {/* Mobile nav row */}
      <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200/90"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

function EmergencyBanner() {
  return (
    <div className="border-b border-red-500/30 bg-slate-950/80 text-[11px] text-slate-200 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 lg:px-8">
        <p>If this is an emergency, call 911 or your local emergency number.</p>
        <span className="hidden rounded-full border border-red-500/70 bg-red-500/15 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-red-200 sm:inline">
          NOT FOR EMERGENCIES
        </span>
      </div>
    </div>
  )
}

/* ============================== Living Care Map ============================== */
type StepStatus = 'done' | 'active' | 'idle' | 'error'

type MapStage = {
  key: string
  label: string
  detail: string
  status: StepStatus
  meta?: string
}

function LivingCareMap({
  risk,
  hasAssess,
  hasSite,
  hasPrice,
  bookingState,
  stage,
  openTasks,
  totalTasks,
}: {
  risk: Risk
  hasAssess: boolean
  hasSite: boolean
  hasPrice: boolean
  bookingState: 'idle' | 'calling' | 'ok' | 'failed'
  stage: CareStage
  openTasks: number
  totalTasks: number
}) {
  const stageLabel =
    stage === 'intake'
      ? 'Listening first — building your story.'
      : stage === 'triage'
      ? 'Screening red flags and patterns.'
      : stage === 'plan'
      ? 'Drafting a care plan around your risks.'
      : stage === 'actions'
      ? 'Working through calls, sites, and next steps.'
      : 'Wrapping up this episode with follow-ups.'

  const progressLabel =
    totalTasks > 0
      ? `${totalTasks - openTasks} of ${totalTasks} follow-ups done`
      : 'No follow-ups added yet'

  const tasksMeta =
    totalTasks > 0
      ? `${totalTasks - openTasks}/${totalTasks} done`
      : 'Add any steps you want to remember.'

  const nodes: MapStage[] = [
    {
      key: 'describe',
      label: 'Describe',
      detail: 'Symptoms, context, photos.',
      status: stage === 'intake' ? 'active' : 'done',
    },
    {
      key: 'assess',
      label: 'Assess',
      detail: 'Patterns & red-flag check.',
      status: stage === 'intake' ? 'idle' : hasAssess ? 'done' : 'active',
    },
    {
      key: 'site',
      label: hasSite ? 'Best site' : 'Home care',
      detail: hasSite ? 'Urgent care, clinic, ER.' : 'Likely safe at home.',
      status:
        hasSite || stage === 'plan' || stage === 'actions' || stage === 'wrap'
          ? 'done'
          : 'idle',
      meta:
        !hasSite && risk === 'low'
          ? 'Favors home care when safe.'
          : risk !== 'low'
          ? 'Leaning toward in-person care.'
          : undefined,
    },
    {
      key: 'price',
      label: 'Price / ETA',
      detail: 'Cost, distance, and time.',
      status: hasPrice
        ? stage === 'actions' || stage === 'wrap'
          ? 'done'
          : 'active'
        : hasSite
        ? 'active'
        : 'idle',
    },
    {
      key: 'book',
      label: 'Booked',
      detail: 'Call or online booking.',
      status:
        bookingState === 'ok'
          ? 'done'
          : bookingState === 'calling'
          ? 'active'
          : bookingState === 'failed'
          ? 'error'
          : 'idle',
    },
    {
      key: 'follow',
      label: 'Follow-ups',
      detail: tasksMeta,
      status:
        stage === 'wrap'
          ? 'done'
          : openTasks > 0
          ? 'active'
          : 'idle',
    },
  ]

  const toneBorder =
    risk === 'severe'
      ? 'border-red-400/60'
      : risk === 'moderate'
      ? 'border-amber-400/55'
      : 'border-emerald-400/60'

  const completedIndex = nodes.reduce((idx, n, i) => {
    if (n.status === 'done') return i
    return idx
  }, -1)

  const completedPct =
    completedIndex <= 0
      ? 0
      : (completedIndex / (nodes.length - 1 || 1)) * 100

  return (
    <div
      className={cx(
        'rounded-2xl border-[2px] bg-slate-900/80 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(15,23,42,0.3)]',
        toneBorder,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200/80">
            Living care map
          </p>
          <p className="mt-0.5 text-[11px] text-slate-200/80">{stageLabel}</p>
        </div>
        <div className="text-right text-[11px] text-slate-300/90">
          <div>{progressLabel}</div>
        </div>
      </div>

      <div className="relative mt-3">
        {/* base connector line */}
        <div className="absolute left-[6%] right-[6%] top-4 h-[2px] rounded-full bg-slate-600/60" />
        {/* completed segment */}
        <div
          className="absolute left-[6%] top-[15px] h-[2px] rounded-full bg-slate-50"
          style={{ width: `${completedPct}%`, transition: 'width 260ms ease-out' }}
        />

        <div className="relative flex items-start justify-between gap-1">
          {nodes.map((node, idx) => (
            <StageNode key={node.key} node={node} index={idx} total={nodes.length} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StageNode({
  node,
  index,
  total,
}: {
  node: MapStage
  index: number
  total: number
}) {
  const isLast = index === total - 1
  const isDone = node.status === 'done'
  const isActive = node.status === 'active'
  const isError = node.status === 'error'

  const circleBase =
    'grid h-7 w-7 place-items-center rounded-full border text-[11px] font-semibold shadow-sm'

  const circleTone = isError
    ? 'border-rose-300 bg-rose-500 text-slate-900'
    : isDone
    ? 'border-emerald-300 bg-emerald-400 text-slate-900'
    : isActive
    ? 'border-slate-100 bg-slate-50 text-slate-900'
    : 'border-slate-500/70 bg-slate-900/80 text-slate-100/80'

  const labelTone = isError
    ? 'text-rose-100'
    : isActive
    ? 'text-slate-50'
    : 'text-slate-100/80'

  const detailTone = node.status === 'idle' ? 'text-slate-400/90' : 'text-slate-300/90'

  const badge =
    node.status === 'done'
      ? 'Done'
      : node.status === 'active'
      ? 'Now'
      : node.status === 'error'
      ? 'Check'
      : 'Queued'

  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
      style={{ animation: 'nodePop 160ms ease-out both' }}
    >
      <div className="flex flex-col items-center gap-1">
        <div className={cx(circleBase, circleTone)}>
          {isDone ? '✓' : isError ? '!' : index + 1}
        </div>
        {!isLast && (
          <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-slate-200/80">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-0.5 flex min-w-0 flex-col items-center gap-0.5">
        <div className={cx('truncate text-[11px] font-medium', labelTone)}>{node.label}</div>
        <div className={cx('line-clamp-2 text-[10px]', detailTone)}>{node.detail}</div>
        {node.meta && (
          <div className="mt-0.5 line-clamp-2 text-[9px] text-emerald-200/85">
            {node.meta}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================== Plan Panel (right rail) ============================== */
function PlanPanel({
  risk,
  insights,
  tasks,
}: {
  risk: Risk
  insights: InsightCard[]
  tasks: Task[]
}) {
  const latest = insights.length ? insights[insights.length - 1] : undefined
  const understanding = latest?.why?.slice(0, 3) || []
  const nextSteps = latest?.next?.slice(0, 3) || []
  const openTasks = tasks.filter(t => !t.done)
  const doneCount = tasks.length - openTasks.length

  let riskLine: string
  if (risk === 'severe') {
    riskLine =
      'Right now this sits in a “take seriously now” range based on what you’ve shared. If anything feels suddenly worse or unsafe, ignore this plan and seek urgent or emergency care.'
  } else if (risk === 'moderate') {
    riskLine =
      'So far this sounds more in a “get checked soon” range. I’ll lean toward getting you in front of a clinician when that’s sensible for you.'
  } else {
    riskLine =
      'So far this leans toward a low-to-moderate risk range based on your messages. We’ll keep watching for red flags together as you share more.'
  }

  const primaryStep =
    nextSteps[0] ||
    (openTasks[0]?.title
      ? openTasks[0].title
      : 'We’ll decide the first concrete step together once we clarify a bit more.')

  const hasAnyPlan = understanding.length > 0 || nextSteps.length > 0 || tasks.length > 0

  return (
    <div className="hover-card rounded-[22px] border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-5 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-slate-50">Stella’s plan space</h3>
          <p className="mt-0.5 text-[11px] text-slate-300/90">
            As you talk, I keep a simple, private outline of where we are.
          </p>
        </div>
        <span className="text-[11px] text-slate-400">
          {tasks.length > 0 ? `${doneCount}/${tasks.length} follow-ups done` : 'No follow-ups yet'}
        </span>
      </div>

      {!hasAnyPlan ? (
        <div className="mt-3 space-y-2 text-sm text-slate-200/90">
          <p>
            Once you start talking to me, I’ll keep track of three things here:
          </p>
          <ul className="list-disc pl-5">
            <li>What we’ve understood in your words</li>
            <li>Today’s next step or two</li>
            <li>Things to watch or prepare for</li>
          </ul>
          <p className="text-[11px] text-slate-400/95">
            This is for you. You can always ignore it, change it, or clear it.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 text-sm text-slate-50">
          <section className="rounded-xl border-[2px] border-slate-700/80 bg-slate-900/90 p-3">
            <header className="text-xs text-slate-300/90">Understanding so far</header>
            {understanding.length > 0 ? (
              <ul className="mt-1.5 list-disc pl-5">
                {understanding.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-slate-200/90">
                We’re still in early listening mode — keep talking and I’ll summarize the
                key pieces here.
              </p>
            )}
          </section>

          <section className="rounded-xl border-[2px] border-slate-700/80 bg-slate-900/90 p-3">
            <header className="text-xs text-slate-300/90">Today’s next step</header>
            <p className="mt-1.5 text-sm text-slate-50">{primaryStep}</p>
            {openTasks.length > 0 && (
              <ul className="mt-1.5 list-disc pl-5 text-xs text-slate-200/90">
                {openTasks.slice(0, 3).map(t => (
                  <li key={t.id}>{t.title}</li>
                ))}
                {openTasks.length > 3 && (
                  <li>+ {openTasks.length - 3} more saved in follow-ups</li>
                )}
              </ul>
            )}
          </section>

          <section className="rounded-xl border-[2px] border-slate-700/80 bg-slate-900/90 p-3">
            <header className="text-xs text-slate-300/90">What we’re watching for</header>
            <p className="mt-1.5 text-sm text-slate-50">{riskLine}</p>
            <p className="mt-1 text-[11px] text-slate-400/95">
              This is educational support, not a diagnosis. If your gut says “this feels
              like an emergency,” trust that and seek urgent care.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}

/* ============================== Live Call Bubble ============================== */
function LiveCallBubble({
  status,
  transcript,
  placeName,
  onClose,
}: {
  status: 'idle' | 'calling' | 'ok' | 'failed'
  transcript: string[]
  placeName?: string
  onClose: () => void
}) {
  const label =
    status === 'calling'
      ? 'Calling…'
      : status === 'ok'
      ? 'Connected'
      : status === 'failed'
      ? 'Call failed'
      : ''
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="hover-card w-[260px] rounded-2xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-50">{label}</div>
          <button
            onClick={onClose}
            className="text-[11px] text-slate-200 hover:underline"
          >
            Hide
          </button>
        </div>
        {placeName && (
          <div className="mt-0.5 truncate text-xs text-slate-300">→ {placeName}</div>
        )}
        <div className="mt-2 max-h-28 space-y-1 overflow-auto">
          {transcript.map((t, i) => (
            <div key={i} className="text-[11px] text-slate-100">
              {t}
            </div>
          ))}
        </div>
        {status === 'calling' && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-600/60">
            <div className="h-full w-1/2 animate-pulse bg-slate-50" />
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================== Small UI bits ============================== */
function GateBanner({ msg, onClose }: { msg: string | null; onClose: () => void }) {
  if (!msg) return null
  return (
    <div className="mt-2 flex items-center justify-between rounded-lg border-[2px] border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
      <span>{msg}</span>
      <button onClick={onClose} className="text-amber-100/90 hover:underline">
        Dismiss
      </button>
    </div>
  )
}

function RiskBadge({ risk }: { risk: Risk }) {
  const label =
    risk === 'severe'
      ? 'Severe risk — act now'
      : risk === 'moderate'
      ? 'Moderate risk'
      : 'Low risk'
  const tone =
    risk === 'severe'
      ? 'border-red-400/60 text-red-200'
      : risk === 'moderate'
      ? 'border-amber-400/60 text-amber-100'
      : 'border-emerald-400/60 text-emerald-100'
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border-[2px] bg-transparent px-2.5 py-1 text-xs',
        tone,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const needsSources =
    !isUser && isDeclarative(msg.text) && (!msg.citations || msg.citations.length === 0)
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'hover-card relative max-w-[90%] rounded-3xl border-[2px] px-4 py-3 shadow-sm will-change-transform overflow-hidden sm:max-w-[82%]',
          isUser
            ? 'border-transparent bg-[var(--brand-blue)] text-slate-50'
            : 'bubble-stella border-slate-600/80 bg-slate-900/90 text-slate-50 backdrop-blur',
        )}
        style={{ animation: 'sectionIn 240ms ease-out both' }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{msg.text}</p>

        {!isUser && (
          <>
            {msg.citations && msg.citations.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.citations.map((c, i) => (
                  <CitationChip key={i} c={c} />
                ))}
              </div>
            ) : needsSources ? (
              <div className="mt-2 text-[11px] text-slate-300/90">
                Collecting details — citations will appear with the next synthesis.
              </div>
            ) : null}
          </>
        )}

        {msg.attachments?.length ? (
          <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-100">
            {msg.attachments.map((a, i) => (
              <span
                key={i}
                className="rounded-md border-[2px] border-slate-600/80 bg-slate-900/80 px-2 py-0.5"
              >
                {a.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function RefImageStrip({ images }: { images: RefImage[] }) {
  return (
    <div className="mt-2 ml-2 flex gap-2">
      {images.slice(0, 3).map((im, i) => (
        <a
          key={i}
          href={im.url}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-2 hover:bg-slate-800/90"
          title={im.title || im.url}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={im.url}
            alt={im.title || 'reference'}
            className="h-10 w-14 rounded-md object-cover opacity-90 group-hover:opacity-100"
          />
          <span className="max-w-[10rem] truncate text-[11px] text-slate-100">
            {im.source || domainOf(im.url)}
          </span>
        </a>
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 pl-2 text-sm text-slate-100">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-100/60 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-100" />
      </span>
      <span className="inline-flex">
        <span
          className="mx-0.5 inline-block animate-[dots_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: '0s' }}
        >
          •
        </span>
        <span
          className="mx-0.5 inline-block animate-[dots_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: '0.2s' }}
        >
          •
        </span>
        <span
          className="mx-0.5 inline-block animate-[dots_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: '0.4s' }}
        >
          •
        </span>
      </span>
    </div>
  )
}

function CitationChip({ c }: { c: Citation }) {
  const d = domainOf(c.url)
  return (
    <a
      href={c.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border-[2px] border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-100 hover:bg-slate-800/90"
      title={c.title}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3z"
        />
      </svg>
      {c.source || d || c.title}
    </a>
  )
}

/* ============================== Insight Cards ============================== */
function InsightTriad({
  card,
  delay = 0,
  durationMs = 500,
  onAICall,
  onExpand,
  onAddFollowUps,
}: {
  card: InsightCard
  delay?: number
  durationMs?: number
  onAICall: () => void
  onExpand: () => void
  onAddFollowUps: () => void
}) {
  const hasWhy = (card.why?.length || 0) > 0
  const hasNext = (card.next?.length || 0) > 0
  const hasCites = (card.citations?.length || 0) > 0

  const urgencyTone =
    card.urgency === 'severe'
      ? 'border-red-400/60'
      : card.urgency === 'elevated'
      ? 'border-amber-400/60'
      : 'border-slate-600/80'

  const [open, setOpen] = useState(true)

  return (
    <div
      className={cx(
        'hover-card relative overflow-hidden rounded-[22px] border-[2px] bg-slate-900/85 p-5 backdrop-blur',
        urgencyTone,
      )}
      style={{
        animation: `floatInRight ${durationMs}ms ease-out both`,
        animationDelay: `${delay}ms`,
      }}
      data-build
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-slate-50">{card.title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-300/90">
            Concise summary with next steps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {card.confidence && (
            <span
              className={cx(
                'rounded-full border-[2px] px-2 py-0.5 text-[11px]',
                card.confidence === 'high'
                  ? 'border-emerald-400/70 text-emerald-200'
                  : card.confidence === 'medium'
                  ? 'border-amber-400/70 text-amber-200'
                  : 'border-slate-500/70 text-slate-200',
              )}
            >
              {card.confidence} confidence
            </span>
          )}
          <button
            onClick={onExpand}
            className="text-xs font-semibold text-slate-200 hover:underline"
          >
            Fullscreen
          </button>
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs font-semibold text-slate-200 hover:underline"
          >
            {open ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="mt-3 grid gap-3">
            {hasWhy && (
              <section
                className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3"
                style={{
                  animation: `sectionIn ${durationMs - 200}ms ease-out both`,
                  animationDelay: `${delay + 120}ms`,
                }}
              >
                <header className="text-xs text-slate-300/90">
                  What you’re saying
                </header>
                <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-50">
                  {card.why!.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </section>
            )}
            <section
              className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3"
              style={{
                animation: `sectionIn ${durationMs - 200}ms ease-out both`,
                animationDelay: `${delay + 240}ms`,
              }}
            >
              <header className="text-xs text-slate-300/90">
                What it sounds like
              </header>
              <p className="mt-1.5 text-sm leading-6 text-slate-50">{card.body}</p>
            </section>
            {hasNext && (
              <section
                className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3"
                style={{
                  animation: `sectionIn ${durationMs - 200}ms ease-out both`,
                  animationDelay: `${delay + 360}ms`,
                }}
              >
                <header className="text-xs text-slate-300/90">
                  What to do
                </header>
                <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-50">
                  {card.next!.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={onAICall}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/90"
                  >
                    Have No Trek call for you
                  </button>
                  <button
                    onClick={onAddFollowUps}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/90"
                  >
                    Add to follow-ups
                  </button>
                </div>
              </section>
            )}
          </div>

          {hasCites ? (
            <div
              className="mt-3 flex flex-wrap gap-1.5"
              style={{
                animation: `sectionIn ${durationMs - 200}ms ease-out both`,
                animationDelay: `${delay + 480}ms`,
              }}
            >
              {card.citations!.map((c, i) => (
                <CitationChip key={i} c={c} />
              ))}
            </div>
          ) : (
            <div className="mt-3 text-[11px] text-slate-400">
              No acceptable sources provided.
            </div>
          )}
          {card.at && (
            <div className="mt-2 text-[10px] text-slate-500">
              Updated {new Date(card.at).toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CardFullscreen({
  card,
  onClose,
  onAddFollowUps,
}: {
  card: InsightCard
  onClose: () => void
  onAddFollowUps: () => void
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="hover-card absolute inset-6 overflow-y-auto rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/95 p-6 sm:inset-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-50">{card.title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddFollowUps}
              className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
            >
              Add to follow-ups
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
            >
              Close
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {card.why?.length ? (
            <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-300/90">What you’re saying</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-50">
                {card.why.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-4">
            <div className="text-xs text-slate-300/90">What it sounds like</div>
            <p className="mt-2 text-sm leading-6 text-slate-50">{card.body}</p>
          </div>
          {card.next?.length ? (
            <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-4">
              <div className="text-xs text-slate-300/90">What to do</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-50">
                {card.next.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {card.citations?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {card.citations.map((c, i) => (
                <CitationChip key={i} c={c} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ============================== Right rail placeholder (unused now, kept) ============================== */
function RightRailPlaceholder() {
  return (
    <div className="hover-card rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
      <div className="h-4 w-32 rounded bg-slate-700/60" />
      <div className="mt-3 space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-xl border-[2px] border-slate-700/80 bg-slate-900/75 p-3"
          >
            <div className="h-3 w-28 rounded bg-slate-700/70" />
            <div className="mt-2 h-3 w-48 rounded bg-slate-700/70" />
            <div className="mt-2 h-3 w-40 rounded bg-slate-700/70" />
          </div>
        ))}
      </div>
      <div className="mt-3 h-5 w-24 rounded bg-slate-700/70" />
    </div>
  )
}

/* ============================== Session File ============================== */
function SessionFile({
  messages,
  insights,
  top3,
  onCall,
  onExportPlan,
}: {
  messages: ChatMessage[]
  insights: InsightCard[]
  top3: Place[]
  onCall: () => void
  onExportPlan: () => void
}) {
  const recentUser = useMemo(
    () =>
      messages
        .filter(m => m.role === 'user')
        .slice(-4)
        .map(m => m.text)
        .filter(Boolean),
    [messages],
  )
  const actionList = useMemo(() => {
    const acc: string[] = []
    insights.forEach(i => (i.next || []).forEach(n => acc.push(n)))
    return acc.slice(-6)
  }, [insights])

  const hasAny =
    recentUser.length > 0 || actionList.length > 0 || top3.length > 0
  return (
    <div className="hover-card mt-5 rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-50">Session File</h4>
          <p className="mt-0.5 text-[11px] text-slate-300/90">
            Signals, actions, and top picks — auto-built.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-300/90">Auto-updating</span>
          <button
            onClick={onExportPlan}
            className="rounded-full border-[1px] border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Send to Tasks
          </button>
        </div>
      </div>
      {!hasAny ? (
        <p className="mt-2 text-sm text-slate-200/90">
          Your session file will build here as we learn more.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {recentUser.length > 0 && (
            <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3">
              <div className="text-xs text-slate-300/90">Signals</div>
              <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-50">
                {recentUser.map((u, i) => (
                  <li
                    key={i}
                    style={{
                      animation: 'sectionIn .4s ease-out both',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionList.length > 0 && (
            <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3">
              <div className="text-xs text-slate-300/90">Actions</div>
              <ul className="mt-1.5 list-disc pl-5 text-sm text-slate-50">
                {actionList.map((a, i) => (
                  <li
                    key={i}
                    style={{
                      animation: 'sectionIn .4s ease-out both',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    {a}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <button
                  onClick={onCall}
                  className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/90"
                >
                  Have No Trek call for you
                </button>
              </div>
            </div>
          )}

          {top3.length > 0 && (
            <div className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 p-3">
              <div className="text-xs text-slate-300/90">Top care picks</div>
              <div className="mt-1.5 space-y-2">
                {top3.map(p => (
                  <div key={p.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200/90">
                        Care option
                      </span>
                      {typeof p.rating === 'number' && <Stars value={p.rating} />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-50">
                        {p.name}
                      </div>
                      <div className="truncate text-[11px] text-slate-400">
                        {typeof p.rating === 'number'
                          ? `${p.rating.toFixed(1)}★`
                          : ''}{' '}
                        {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================== Places ============================== */
function PlaceRow({
  p,
  onOpen,
  onCall,
  onFollowUp,
  showWhy = false,
}: {
  p: Place
  onOpen: () => void
  onCall: () => void
  onFollowUp: () => void
  showWhy?: boolean
}) {
  return (
    <div className="hover-card w-full overflow-hidden rounded-2xl border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-900/60">
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-600/80 bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/90">
              Care option
            </span>
            <p className="truncate font-medium text-slate-50">{p.name}</p>
            {typeof p.rating === 'number' && <Stars value={p.rating} />}
            {p.price && (
              <span className="text-[11px] text-slate-300">{p.price}</span>
            )}
            {typeof p.score?.overall === 'number' && (
              <span className="ml-1 rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-slate-200/90">
                NT score {p.score.overall.toFixed(1)}/5
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-400">
            {p.address || ''}{' '}
            {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-100">
            {p.blurb || placeBlurb(p)}
          </p>
          {showWhy && (p.reason || p.scoreNotes) && (
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-200/90">
              {p.reason || p.scoreNotes}
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            onClick={onOpen}
            className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Details
          </button>
          <button
            onClick={onCall}
            className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Call for me
          </button>
          <button
            onClick={onFollowUp}
            className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            + Follow-up
          </button>
        </div>
      </div>
    </div>
  )
}

function AllPlacesPanel({
  places,
  onClose,
  onOpenPlace,
  onCallPlace,
  onFollowUpPlace,
}: {
  places: Place[]
  onClose: () => void
  onOpenPlace: (p: Place) => void
  onCallPlace: (p: Place) => void
  onFollowUpPlace: (p: Place) => void
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-700/80 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-50">All nearby care</h3>
            <p className="mt-0.5 text-[11px] text-slate-300/90">
              Only clinics with verifiable public reviews are listed unless you toggle
              “Show unverified”.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pill rounded-full px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-60px)] space-y-3 overflow-y-auto p-5">
          {places.map(p => (
            <div
              key={p.id}
              className="hover-card rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-600/80 bg-slate-900/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/90">
                      Care option
                    </span>
                    <p className="truncate font-medium text-slate-50">{p.name}</p>
                    {typeof p.rating === 'number' && <Stars value={p.rating} />}
                    {p.price && (
                      <span className="text-xs text-slate-300">{p.price}</span>
                    )}
                    {typeof p.score?.overall === 'number' && (
                      <span className="ml-1 rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-slate-200/90">
                        NT score {p.score.overall.toFixed(1)}/5
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {p.address || ''}{' '}
                    {p.distance_km ? `· ${p.distance_km.toFixed(1)} km` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-100">
                    {p.blurb || placeBlurb(p)}
                  </p>
                  {p.scoreNotes && (
                    <p className="mt-1 text-xs text-slate-200/90">{p.scoreNotes}</p>
                  )}

                  {p.reviewCite?.url && (
                    <div className="mt-2 rounded-lg border-[2px] border-slate-700/80 bg-slate-900/80 p-2">
                      {p.reviewCite.quote && (
                        <p className="text-xs text-slate-50">
                          “{p.reviewCite.quote}”
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300/90">
                        {typeof p.reviewCite.rating === 'number' && (
                          <span title={`${p.reviewCite.rating.toFixed(1)}★`}>
                            ★ {p.reviewCite.rating.toFixed(1)}
                          </span>
                        )}
                        {p.reviewCite.author && <span>— {p.reviewCite.author}</span>}
                        <a
                          className="underline hover:text-slate-50"
                          href={p.reviewCite.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {p.reviewCite.source || domainOf(p.reviewCite.url)}
                        </a>
                        {p.reviewCite.date && <span>({p.reviewCite.date})</span>}
                      </div>
                    </div>
                  )}

                  {p.scoreSources?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.scoreSources.map((c, i) => (
                        <CitationChip key={i} c={c} />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <button
                    onClick={() => onOpenPlace(p)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onCallPlace(p)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
                  >
                    Call for me
                  </button>
                  <button
                    onClick={() => onFollowUpPlace(p)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-100 hover:bg-slate-800/90"
                  >
                    + Follow-up
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================== Place Drawer ============================== */
function PlaceDrawer({
  place,
  fullscreen,
  onToggleFullscreen,
  onClose,
  onCall,
  onFollowUp,
}: {
  place: Place
  fullscreen: boolean
  onToggleFullscreen: () => void
  onClose: () => void
  onCall: () => void
  onFollowUp: () => void
}) {
  const bullets: string[] = []
  if (typeof place.rating === 'number')
    bullets.push(
      `${place.rating.toFixed(1)}★ ${
        place.reviews ? `(${place.reviews} reviews)` : ''
      }`,
    )
  if (typeof place.distance_km === 'number')
    bullets.push(`${place.distance_km.toFixed(1)} km away`)
  if (place.price) bullets.push(`price band ${place.price}`)
  if (place.est_cost_min || place.est_cost_max) {
    const lo = place.est_cost_min ?? place.est_cost_max
    const hi = place.est_cost_max ?? place.est_cost_min
    bullets.push(`est. cost $${Math.round(lo!)}–$${Math.round(hi!)}`)
  }
  if (place.reason) bullets.push(place.reason)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cx(
          'absolute border-t border-slate-700/80 bg-slate-950 shadow-2xl',
          fullscreen ? 'inset-0 rounded-none' : 'bottom-0 left-0 right-0 rounded-t-3xl',
        )}
      >
        <div className="mx-auto max-w-4xl p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-50">{place.name}</h3>
                <p className="mt-0.5 text-sm text-slate-200/90">
                  {place.address || ''}{' '}
                  {place.distance_km ? `· ${place.distance_km.toFixed(1)} km` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {typeof place.rating === 'number' && <Stars value={place.rating} />}
                <button
                  onClick={onToggleFullscreen}
                  className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
                >
                  {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-3 py-1 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              <section className="rounded-lg border-[2px] border-slate-700/80 bg-slate-900/85 p-3">
                <header className="text-xs text-slate-300/90">
                  About this place
                </header>
                <p className="mt-1 text-sm text-slate-50">
                  {place.blurb || placeBlurb(place)}
                </p>
              </section>

              {bullets.length > 0 && (
                <section className="rounded-lg border-[2px] border-slate-700/80 bg-slate-900/85 p-3">
                  <header className="text-xs text-slate-300/90">
                    Why we picked this
                  </header>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-50">
                    {bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </section>
              )}

              {place.reviewCite?.url && (
                <section className="rounded-lg border-[2px] border-slate-700/80 bg-slate-900/85 p-3">
                  <header className="text-xs text-slate-300/90">
                    Recent review (citation)
                  </header>
                  {place.reviewCite.quote && (
                    <p className="mt-1 text-sm text-slate-50">
                      “{place.reviewCite.quote}”
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300/90">
                    {typeof place.reviewCite.rating === 'number' && (
                      <span title={`${place.reviewCite.rating.toFixed(1)}★`}>
                        ★ {place.reviewCite.rating.toFixed(1)}
                      </span>
                    )}
                    {place.reviewCite.author && <span>— {place.reviewCite.author}</span>}
                    <a
                      className="underline hover:text-slate-50"
                      href={place.reviewCite.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {place.reviewCite.source || domainOf(place.reviewCite.url)}
                    </a>
                    {place.reviewCite.date && (
                      <span>({place.reviewCite.date})</span>
                    )}
                  </div>
                </section>
              )}

              {place.score && (
                <section className="rounded-lg border-[2px] border-slate-700/80 bg-slate-900/85 p-3">
                  <header className="text-xs text-slate-300/90">Scores</header>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-50">
                    <ScoreBar label="Overall" value={place.score.overall} />
                    <ScoreBar label="Bedside" value={place.score.bedside} />
                    <ScoreBar label="Cost" value={place.score.cost} />
                    <ScoreBar label="Wait" value={place.score.wait} />
                    <ScoreBar label="Distance" value={place.score.distance} />
                  </div>
                  {place.scoreNotes && (
                    <p className="mt-2 text-xs text-slate-300/90">
                      {place.scoreNotes}
                    </p>
                  )}
                  {place.scoreSources?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {place.scoreSources.map((c, i) => (
                        <CitationChip key={i} c={c} />
                      ))}
                    </div>
                  ) : null}
                </section>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {place.phone && (
                <a
                  className="inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
                  href={`tel:${place.phone}`}
                >
                  Call
                </a>
              )}
              <button
                onClick={onCall}
                className="inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
              >
                Have us call
              </button>
              <button
                onClick={onFollowUp}
                className="inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
              >
                + Follow-up
              </button>
              {place.maps && (
                <a
                  className="inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
                  href={place.maps}
                  target="_blank"
                  rel="noreferrer"
                >
                  Directions
                </a>
              )}
              {place.url && (
                <a
                  className="inline-flex items-center gap-2 rounded-xl border-[2px] border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
                  href={place.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  const v = clamp(value, 0, 5)
  const pct = `${(v / 5) * 100}%`
  return (
    <span
      className="relative inline-block align-middle"
      title={`${v.toFixed(1)}★`}
    >
      <span className="text-slate-500/70">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden text-slate-50"
        style={{ width: pct }}
      >
        ★★★★★
      </span>
      <span className="sr-only">{v.toFixed(1)} stars</span>
    </span>
  )
}

function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (typeof value !== 'number') return null
  const pct = `${clamp(value, 0, 5) * 20}%`
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300/90">
        <span>{label}</span>
        <span>{value.toFixed(1)}/5</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/80">
        <div className="h-full bg-slate-50" style={{ width: pct }} />
      </div>
    </div>
  )
}

/* ============================== Sources Panel ============================== */
function SourcesPanel({
  sources,
  onClose,
}: {
  sources: Citation[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-50">Session sources</h3>
            <p className="mt-0.5 text-[11px] text-slate-300/90">
              Trusted medical domains only.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pill rounded-full px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-60px)] space-y-3 overflow-y-auto p-5">
          {sources.length === 0 ? (
            <p className="text-sm text-slate-200/90">
              No sources yet. As insights appear, you’ll see citations here from reputable
              medical domains.
            </p>
          ) : (
            sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border-[2px] border-slate-700/80 bg-slate-900/85 p-3 hover:bg-slate-800/90"
              >
                <div className="text-sm font-medium text-slate-50">
                  {s.title || s.url}
                </div>
                <div className="mt-0.5 text-xs text-slate-300/90">{s.url}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================== Follow-ups Panel ============================== */
function FollowUpsPanel({
  tasks,
  places,
  insights,
  onClose,
  onToggleDone,
  onDelete,
  onUpdateDue,
  onOpenInsight,
}: {
  tasks: Task[]
  places: Place[]
  insights: InsightCard[]
  onClose: () => void
  onToggleDone: (id: string) => void
  onDelete: (id: string) => void
  onUpdateDue: (id: string, due?: string) => void
  onOpenInsight: (id: string) => void
}) {
  function placeNameFor(id?: string) {
    return places.find(p => p.id === id)?.name
  }
  function insightTitleFor(id?: string) {
    return insights.find(i => i.id === id)?.title
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-700/80 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-50">Follow-ups</h3>
            <p className="mt-0.5 text-[11px] text-slate-300/90">
              Save actions, set a due time, and mark done.
            </p>
          </div>
          <button
            onClick={onClose}
            className="pill rounded-full px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-800/90"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-60px)] space-y-3 overflow-y-auto p-5">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-200/90">
              No follow-ups yet. Add from insight cards or place rows.
            </p>
          ) : (
            tasks.map(t => (
              <div
                key={t.id}
                className="rounded-xl border-[2px] border-slate-700/80 bg-slate-900/85 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!t.done}
                        onChange={() => onToggleDone(t.id)}
                        className="h-4 w-4"
                      />
                      <div className="truncate font-medium text-slate-50">{t.title}</div>
                    </div>
                    {t.linkedPlaceId && (
                      <div className="mt-1 text-[11px] text-slate-300/90">
                        Clinic: {placeNameFor(t.linkedPlaceId)}
                      </div>
                    )}
                    {t.linkedInsightId && (
                      <button
                        type="button"
                        onClick={() => onOpenInsight(t.linkedInsightId!)}
                        className="mt-1 text-[11px] font-semibold text-slate-200 underline-offset-2 hover:underline"
                      >
                        View insight: {insightTitleFor(t.linkedInsightId) || 'open card'}
                      </button>
                    )}
                    {t.notes && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-50">
                        {t.notes}
                      </p>
                    )}
                    <div className="mt-2 text-[11px] text-slate-400">
                      Created{' '}
                      {new Date(t.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="datetime-local"
                      value={t.due ? new Date(t.due).toISOString().slice(0, 16) : ''}
                      onChange={e =>
                        onUpdateDue(
                          t.id,
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined,
                        )
                      }
                      className="rounded-md border border-slate-600/80 bg-slate-900/80 px-2 py-1 text-xs text-slate-100"
                    />
                    <button
                      onClick={() => onDelete(t.id)}
                      className="text-[11px] font-semibold text-slate-200 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================== Capabilities Strip ============================== */
function CapabilitiesStrip() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="hover-card rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-4 backdrop-blur">
        <h3 className="text-sm font-semibold text-slate-50">
          What Stella can help with
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
          <li>Understanding what’s going on in plain language.</li>
          <li>Sorting “watch and wait” vs “get seen soon” vs “go now” — with caveats.</li>
          <li>Turning messy problems into simple steps and follow-ups.</li>
          <li>Preparing questions and scripts for calls or visits.</li>
          <li>Helping with bills, coverage questions, and basic cost awareness.</li>
        </ul>
      </div>
      <div className="hover-card rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-4 backdrop-blur">
        <h3 className="text-sm font-semibold text-slate-50">
          What Stella can’t do
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
          <li>Diagnose, treat, or prescribe medications.</li>
          <li>Replace an in-person exam or your clinicians.</li>
          <li>Handle medical or mental health emergencies.</li>
          <li>Guarantee outcomes, bills, or coverage decisions.</li>
          <li>Make decisions for you — you’re always in control.</li>
        </ul>
        <p className="mt-2 text-[11px] text-slate-400/95">
          Think of Stella as a calm, knowledgeable guide who walks alongside you, not a
          doctor or emergency service.
        </p>
      </div>
    </div>
  )
}
