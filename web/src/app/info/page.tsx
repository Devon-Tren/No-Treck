// File: src/app/info/page.tsx
'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

const BRAND_BLUE = '#0E5BD8'

type Risk = 'low' | 'moderate' | 'severe'

export default function InfoPage() {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-slate-950 text-slate-50"
      style={{ ['--brand-blue' as any]: BRAND_BLUE } as CSSProperties}
    >
      <BreathingBackground risk="low" />

      <div className="relative z-10">
        <NavBar />
        <EmergencyBanner />

        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 lg:px-8">
          {/* Hero */}
          <section className="rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/80 px-5 py-6 shadow-[0_0_26px_rgba(15,23,42,0.9)] backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                  Product overview
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                  What No Trek actually is
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/90">
                  Healthcare is chaos for normal people. No Trek is one calm, intelligent
                  front door into that chaos. You talk to Stella like you would text a
                  smart friend in medicine, and she turns the mess into a clear plan,
                  tasks, and next steps.
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300/90">
                  Under the hood, Stella sits on a huge medical knowledge base — but she
                  meets you at your level. You can start with very simple questions and,
                  as you get more comfortable, she can go deeper without ever turning the
                  app into a confusing portal or survey.
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300/90">
                  It&apos;s not a replacement for your doctor or 911. It&apos;s the thing in
                  your pocket that helps you decide what&apos;s urgent, what can wait, where
                  to go, and how to get it done without losing your mind or your whole
                  paycheck.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/intake"
                    className="rounded-2xl bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
                  >
                    Start with Stella
                  </Link>
                  <Link
                    href="/tasks"
                    className="rounded-2xl border border-slate-600/80 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100 hover:bg-slate-800/90"
                  >
                    View your tasks & plan
                  </Link>
                </div>
              </div>

              <aside className="w-full max-w-xs rounded-2xl border-[2px] border-sky-500/40 bg-slate-950/80 p-4 shadow-[0_0_26px_rgba(15,23,42,0.9)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/90">
                  In one line
                </p>
                <p className="mt-2 text-sm font-medium text-slate-50">
                  A medical-first AI concierge that turns health chaos into a living care
                  map you can actually follow.
                </p>
                <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-slate-200/95">
                  <li>• You say what&apos;s going on, in your own words.</li>
                  <li>• Stella estimates risk and options in plain language.</li>
                  <li>• She breaks it into steps, tasks, and smart nudges.</li>
                  <li>• Later, Plus can take more work off your plate.</li>
                </ul>
                <p className="mt-3 text-[11px] text-slate-300/90">
                  The goal: you feel like you have a super powerful, safe tool in your
                  pocket — not another portal or survey.
                </p>

                <div className="mt-4 border-t border-slate-700/70 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200/90">
                    Meet Stella
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-200/95">
                    Think of her like a calm, slightly nerdy medical guide who lives
                    inside No Trek: she listens first, explains as simply or deeply as you
                    want, and keeps an eye on your whole episode — not just one question.
                  </p>
                </div>
              </aside>
            </div>
          </section>

          {/* What No Trek is / isn't */}
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="hover-card h-full rounded-2xl border-[2px] border-emerald-400/40 bg-slate-900/85 p-4 backdrop-blur">
              <h2 className="text-sm font-semibold text-slate-50">
                What No Trek is
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
                <li>
                  • A medical-first concierge that helps you think through symptoms,
                  logistics, and money at the same time.
                </li>
                <li>
                  • A &quot;living care map&quot; that updates as you move from intake →
                  triage → plan → tasks → bookings → follow-ups.
                </li>
                <li>
                  • A coach view (Tasks) that pushes you to actually do the steps you
                  agreed to, not just read advice.
                </li>
                <li>
                  • The front end of a growing agentic system that will call, coordinate,
                  and chase things for you as Plus matures.
                </li>
                <li>
                  • An interface to an effectively infinite knowledge source that stays in
                  human language, then gets more detailed only when you want it to.
                </li>
              </ul>
            </div>

            <div className="hover-card h-full rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-4 backdrop-blur">
              <h2 className="text-sm font-semibold text-slate-50">
                What No Trek is not
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
                <li>• Not a doctor, therapist, or emergency service.</li>
                <li>
                  • Not a symptom-checker that spits out diagnoses without context.
                </li>
                <li>
                  • Not just a booking widget — decisions come before bookings.
                </li>
                <li>
                  • Not here to scare you into care you don&apos;t need or gate safety
                  behind a paywall.
                </li>
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">
                You still need real clinicians. No Trek&apos;s job is to make everything
                around them less confusing and less expensive in time and stress.
              </p>
            </div>
          </section>

          {/* Stella under the hood */}
          <section className="mt-8 rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/80 p-5 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                  Stella under the hood
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  How Stella actually thinks about you
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200/90">
                  Here&apos;s the honest version: Stella isn&apos;t just answering one-off
                  questions. She keeps a running mental model of your &quot;episode&quot;
                  and tries to move you forward one clear step at a time, at the depth
                  your brain has capacity for today.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-600/80 bg-slate-900/90 px-3 py-2 text-[11px] text-slate-200/90">
                <p className="font-semibold uppercase tracking-[0.2em]">
                  Journey modes she uses
                </p>
                <p className="mt-1">
                  Onboarding · Intake · Triage &amp; plan · Logistics · Maintenance ·
                  Flare · Wrap-up · Check-in
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-4">
                <h3 className="text-sm font-semibold text-slate-50">
                  Stella&apos;s &quot;job description&quot;
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
                  <li>• Listen first, not shove you into a form.</li>
                  <li>
                    • Estimate risk in plain language: low / moderate / severe, with why.
                  </li>
                  <li>
                    • Suggest where care probably lives: home, clinic, telehealth, urgent
                    care, ER.
                  </li>
                  <li>
                    • Turn that into a plan and concrete tasks you can check off.
                  </li>
                  <li>
                    • Adjust how deep she goes — from quick gut checks to detailed
                    explainers — based on what you ask for.
                  </li>
                  <li>
                    • Nudge you when things matter (follow-ups, red flags, outcomes).
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-4">
                <h3 className="text-sm font-semibold text-slate-50">
                  How a single concern flows through No Trek
                </h3>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-200/90">
                  <li>1. You tell Stella what&apos;s going on, in normal words.</li>
                  <li>
                    2. She asks 1–2 sharp follow-ups, not a 40-question survey.
                  </li>
                  <li>
                    3. She explains what clinicians worry about here, and how urgent it
                    might be.
                  </li>
                  <li>
                    4. She sketches a simple plan and creates tasks for today, this week,
                    and &quot;later&quot;.
                  </li>
                  <li>
                    5. Over time, those tasks, your updates, and outcomes become a
                    &quot;living care map&quot; you can carry forward.
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* What Stella can help with today */}
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                  Everyday use cases
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  What Stella can help with today (free)
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-200/90">
                  The free layer is already meant to feel powerful — like a calm
                  clinician-concierge in your pocket. You can use it for any of these
                  without paying a cent, and you can ask about almost anything: symptoms,
                  logistics, money, or just “is this worth worrying about?”.
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Free tier
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <InfoCard
                title="New symptom or flare"
                body="Gut check how urgent it might be, what questions matter, and whether home-care vs clinic vs ER makes sense to consider."
                href="/intake"
                tag="Start in Intake"
              />
              <InfoCard
                title="Ongoing condition or mystery"
                body="Explain your long-term issue in plain language and get a cleaner structure for next questions, follow-ups, and lifestyle pieces."
                href="/intake"
                tag="Talk to Stella"
              />
              <InfoCard
                title="Bills, insurance & cost"
                body="Sanity-check confusing bills, ask about common fee structures, and get scripts to ask clinics about price before you go."
                href="/intake"
                tag="Ask about money"
              />
              <InfoCard
                title="Appointment prep"
                body="Arrive with a clear one-page summary: what happened, what you’ve tried, and 3–5 smart questions to ask your clinician."
                href="/tasks"
                tag="Use Tasks as prep"
              />
              <InfoCard
                title="Caregiver & family support"
                body="If you’re supporting someone else, Stella can help you think through options, boundaries, and what to ask on their behalf."
                href="/intake"
                tag="Start a caregiver intake"
              />
              <InfoCard
                title="Follow-ups & staying on track"
                body="Turn loose advice into actual follow-ups with dates, reminders, and a coach-like view that nudges you to finish the next step."
                href="/tasks"
                tag="Open coach view"
              />
            </div>
          </section>

          {/* Free vs Plus / agentic brain */}
          <section className="mt-9 rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                  Layers of help
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  Free today. Agentic concierge as you upgrade.
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-200/90">
                  The philosophy is simple: the free tier should feel genuinely helpful on
                  its own. Plus exists for the people who want No Trek to take even more
                  of the burden off their shoulders.
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right text-[11px] text-slate-300/90">
                <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 font-semibold uppercase tracking-[0.18em]">
                  Plus is optional
                </span>
                <span>Safety guidance is never paywalled.</span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TierCard
                label="No Trek (Free)"
                highlight="What you get on day one"
                bullets={[
                  'Talk to Stella about almost any health-related mess.',
                  'Educational triage: low / moderate / severe risk language with why.',
                  'Living care map structure: from intake to plan to tasks.',
                  'Coach-style Tasks view to keep you moving, not just thinking.',
                  'Plain-language explanations you can bring into real visits.',
                ]}
                footer="This should already feel like having a powerful, calm clinician-concierge in your pocket."
              />
              <TierCard
                label="No Trek Plus"
                highlight="Where the agentic concierge comes in"
                tag="In development"
                bullets={[
                  'Done-for-you logistics: calling clinics, chasing paperwork, and checking wait times on your behalf when possible.',
                  'Price and location shopping before you commit, based on your constraints.',
                  'Deeper follow-up loops: check-ins after appointments, making sure the plan actually happened.',
                  'Richer collaboration options for families and caregivers around a shared plan.',
                  'More automation: letting Stella run repeating routines instead of you manually pushing every time.',
                ]}
                footer="Think of Plus as moving from “AI guide in your pocket” to “AI concierge actively working the phones, links, and follow-ups for you.”"
              />
            </div>
          </section>

          {/* Safety & trust */}
          <section className="mt-8 rounded-2xl border-[2px] border-red-400/40 bg-red-500/10 p-4">
            <h2 className="text-sm font-semibold text-red-50">
              Safety, boundaries &amp; trust
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-50">
              No Trek and Stella are for educational support, triage context, and
              navigation only. We do not provide diagnoses, prescriptions, or crisis
              counseling, and we&apos;re not a replacement for in-person care.
            </p>
            <p className="mt-1 text-[12px] text-red-100/90">
              If you ever have life-threatening symptoms, chest pain, severe trouble
              breathing, signs of stroke, or you&apos;re simply not sure but feel scared —
              treat it as an emergency and contact your local emergency number or go to
              the nearest emergency department.
            </p>
            <p className="mt-1 text-[12px] text-red-100/80">
              For details on how your data is handled, see our{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-red-100"
              >
                Privacy &amp; Consent
              </Link>{' '}
              page.
            </p>
          </section>

          {/* Where to go next */}
          <section className="mt-8 rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-50">
              Where should I go next?
            </h2>
            <p className="mt-2 text-sm text-slate-200/90">
              If all you take away from this page is one thing, let it be this: you now
              have a calm, powerful tool in your pocket that can help you move through
              health chaos step by step — you don&apos;t have to figure it all out alone.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Link
                href="/intake"
                className="hover-card flex flex-col justify-between rounded-2xl border-[2px] border-sky-500/60 bg-slate-950/80 p-4 text-sm"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                    I have a concern
                  </p>
                  <p className="mt-2 font-medium text-slate-50">
                    Start a conversation with Stella
                  </p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    Describe what&apos;s going on, get a sense of urgency, and see your
                    care map start to form.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-sky-300">
                  Go to Intake →
                </span>
              </Link>

              <Link
                href="/tasks"
                className="hover-card flex flex-col justify-between rounded-2xl border-[2px] border-emerald-500/60 bg-slate-950/80 p-4 text-sm"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    I have steps already
                  </p>
                  <p className="mt-2 font-medium text-slate-50">
                    Use the coach view to execute
                  </p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    Turn ideas and advice into clear follow-ups, and let Stella push you
                    to finish what matters.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-emerald-200">
                  Open Tasks →
                </span>
              </Link>

              <Link
                href="/about"
                className="hover-card flex flex-col justify-between rounded-2xl border-[2px] border-slate-600/80 bg-slate-950/80 p-4 text-sm"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    I&apos;m still feeling it out
                  </p>
                  <p className="mt-2 font-medium text-slate-50">
                    Learn more about No Trek &amp; Stella
                  </p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    If this still feels abstract, the About page gives you more story,
                    context, and why we&apos;re building this the way we are.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-slate-200">
                  Go to About →
                </span>
              </Link>
            </div>
          </section>

          <p className="mt-6 text-[11px] text-slate-400">
            No Trek is not a medical provider. This is educational support, not a diagnosis
            or treatment plan.
          </p>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --brand-blue: ${BRAND_BLUE};
        }
        .pill {
          border-radius: 9999px;
        }
        .hover-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease,
            border-color 0.22s ease;
          will-change: transform;
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(20, 60, 180, 0.36),
            0 1px 0 rgba(255, 255, 255, 0.08) inset;
          border-color: rgba(148, 163, 184, 0.6) !important;
        }
        @media (prefers-reduced-motion: no-preference) {
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
        }
      `}</style>
    </main>
  )
}

/* ========= Shared UI bits (copied from Intake/Tasks style) ========= */

function BreathingBackground({ risk }: { risk: Risk }) {
  const accent: string =
    risk === 'severe'
      ? 'rgba(248,113,113,0.70)'
      : risk === 'moderate'
      ? 'rgba(252,211,77,0.70)'
      : 'rgba(56,189,248,0.70)'

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* main gradient */}
      <div
        className="absolute inset-0 transition-[background] duration-500"
        style={{
          background:
            'radial-gradient(1200px 800px at 80% 0%, rgba(15,118,255,0.28), transparent 60%), linear-gradient(180deg, #020617 0%, #020617 45%, #020617 100%)',
        }}
      />

      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />

      {/* breathing glow */}
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

function NavBar() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intake', label: 'Intake' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
  ]

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 shadow-[0_8px_30px_rgba(15,23,42,0.85)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/95 text-[11px] font-black tracking-tight text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.9)]">
            NT
          </div>
          <span className="text-xs font-semibold tracking-[0.26em] text-slate-100">
            NO TREK
          </span>
        </Link>

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

/* ========= Small reusable cards ========= */

function InfoCard({
  title,
  body,
  href,
  tag,
}: {
  title: string
  body: string
  href: string
  tag: string
}) {
  return (
    <Link
      href={href}
      className="hover-card flex h-full flex-col justify-between rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/80 p-4 text-sm backdrop-blur"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {tag}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-slate-50">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-slate-200/90">{body}</p>
      </div>
      <span className="mt-3 text-[11px] font-semibold text-slate-200">
        Open →
      </span>
    </Link>
  )
}

function TierCard({
  label,
  highlight,
  bullets,
  footer,
  tag,
}: {
  label: string
  highlight: string
  bullets: string[]
  footer: string
  tag?: string
}) {
  return (
    <div className="hover-card h-full rounded-2xl border-[2px] border-slate-700/80 bg-slate-950/85 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200/80">
            {label}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-50">{highlight}</p>
        </div>
        {tag && (
          <span className="rounded-full border border-slate-600/80 bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/90">
            {tag}
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-200/90">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-300/90">{footer}</p>
    </div>
  )
}
