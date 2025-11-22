// File: src/app/page.tsx
'use client'

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import Link from 'next/link'

/* ============================== Types & Data ============================== */

type Capability = {
  title: string
  body: string
  tag: string
}

type HowStep = {
  label: string
  title: string
  body: string
}

const CAPABILITIES: Capability[] = [
  {
    title: 'Turn “something feels off” into a plan',
    body: 'Describe what’s going on in your own words. Stella turns vague symptoms into clear next steps and questions to ask a clinician.',
    tag: 'Intake & clarity',
  },
  {
    title: 'Help pick the right level of care',
    body: 'See when self-care is reasonable vs urgent care vs specialist, with cited guidelines and reasons people escalate.',
    tag: 'Triage w/ citations',
  },
  {
    title: 'Bring costs & coverage into the open',
    body: 'Surface in-network options, typical price ranges, and ways people avoid surprise bills—before you book.',
    tag: 'Costs & insurance',
  },
  {
    title: 'Handle phone-tag and bookings',
    body: 'We draft the script, you approve, and we support the call and follow-up so you don’t live on hold.',
    tag: 'Calls & logistics',
  },
  {
    title: 'Keep everything in one place',
    body: 'Notes, questions for your doctor, to-dos, and receipts live in one place instead of scattered across texts and portals.',
    tag: 'Living record',
  },
  {
    title: 'Stay with you between visits',
    body: 'After-visit tasks, refills, and “is this normal?” moments get structured support instead of becoming background stress.',
    tag: 'Follow-through',
  },
]

const HOW_STEPS: HowStep[] = [
  {
    label: '01',
    title: 'Start with Stella',
    body: 'You type what’s going on—no forms, no multiple choice. Stella listens, asks clarifying questions, and reflects it back in plain language.',
  },
  {
    label: '02',
    title: 'See options, not guesses',
    body: 'You get cited possibilities, risk flags, and practical paths that actually fit your coverage, location, and time.',
  },
  {
    label: '03',
    title: 'We help you follow through',
    body: 'From calls and bookings to reminders and paperwork, No Trek helps you turn that plan into something you can actually finish.',
  },
]

/** Deterministic positions so there are NO hydration issues */
const SPLASH_STARS = Array.from({ length: 40 }, (_, i) => ({
  top: (i * 13) % 100,
  left: (i * 29) % 100,
}))

const BG_PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 61) % 100,
  duration: 4 + (i % 5),
  delay: (i % 7) * 0.4,
}))

/* ============================== Page ============================== */

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <AnimatedBackground />

      {!splashDone && <SplashIntro onDone={() => setSplashDone(true)} />}

      <div
        className={`relative z-10 transition-opacity duration-700 ${
          splashDone ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <NavBar />
        <EmergencyBanner />

        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-20 pt-10 lg:px-8 lg:pt-14">
          <HeroSection />

          <StellaOverviewSection />

          <CapabilitiesSection />

          <HowItWorksSection />

          <WhyDifferentSection />

          <FinalCTASection />

          <FooterDisclaimer />
        </div>
      </div>

      {/* Global keyframes for subtle scan shimmer */}
      <style jsx global>{`
        @keyframes nt-scan {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </main>
  )
}

/* ============================== Nav & Top Banner ============================== */

function NavBar() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intake', label: 'Intake' },
    { href: '/tasks', label: 'Tasks' },
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
            {navLinks.map((link) => (
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
          {navLinks.map((link) => (
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

/* ============================== Sections ============================== */

function HeroSection() {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    setTilt({ x, y })
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 })
  }

  const heroTransform: CSSProperties = {
    transform: `translate3d(${tilt.x * 12}px, ${tilt.y * 8}px, 0)`,
    transition: 'transform 0.18s ease-out',
  }

  return (
    <section
      className="relative"
      onMouseMove={handleMove}
      onMouseLeave={resetTilt}
    >
      {/* spotlight behind hero */}
      <div className="pointer-events-none absolute -top-28 left-1/2 z-0 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-sky-500/25 blur-3xl" />

      <div
        style={heroTransform}
        className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="flex items-start gap-4">
          <LogoNT />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/75">
              MEDICAL-FIRST AI CONCIERGE
            </p>
            <h1 className="mt-2 text-5xl font-black italic tracking-tight text-sky-50 drop-shadow-[0_0_35px_rgba(59,130,246,0.9)] sm:text-6xl lg:text-7xl">
              No Trek
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Give us the destination—we&apos;ll help make the journey simple. No Trek turns vague,
              stressful “what do I do?” moments into a guided path with Stella at the center.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-semibold tracking-wide text-slate-200/80">
              <HeroChip label="Citations shown in results" />
              <HeroChip label="Insurance & prices checked before booking" />
              <HeroChip label="Clear escalation for red flags" />
            </div>
          </div>
        </div>

        {/* Right-side CTAs */}
        <div className="flex flex-col items-stretch gap-3 lg:min-w-[260px] lg:items-end">
          {/* Primary CTA */}
          <Link
            href="/intake"
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-7 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.75)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_60px_rgba(56,189,248,0.95)] motion-reduce:transform-none motion-reduce:shadow-none sm:w-64"
          >
            Start with Stella
          </Link>

          {/* Secondary routing buttons – same width, stacked */}
          <div className="flex w-full flex-col gap-2 lg:w-64">
            <Link
              href="/explore"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-900/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100 shadow-[0_0_18px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] motion-reduce:transform-none motion-reduce:shadow-none"
            >
              Explore features
            </Link>
            <Link
              href="/about"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/50 motion-reduce:transform-none"
            >
              Why we built No Trek
            </Link>
            <Link
              href="/tasks"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/50 motion-reduce:transform-none"
            >
              View tasks & follow-ups
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function StellaOverviewSection() {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
      {/* Text side */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          Meet Stella, the on-your-side companion for the moments you don&apos;t know what to do
          next.
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Stella is the first presence you meet here in No Trek. She doesn&apos;t just point you at
          a clinician and disappear. She stays with you through the whole “I should probably deal
          with this” arc — helping you put words to what&apos;s going on, understand your options,
          and choose what fits your real life, not an ideal one.
        </p>

        <ul className="mt-3 space-y-2 text-sm text-slate-300/95">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            <span>
              On your side emotionally — listening without judgment when you&apos;re scared,
              confused, or just tired of dealing with it.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span>
              On your side practically — turning scattered symptoms, paperwork, and “I&apos;ll do it
              later” tasks into a clear, doable plan.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span>
              On your side financially — helping you avoid unnecessary visits and surprise bills by
              making costs and trade-offs visible up front.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-200 shadow-[0_0_10px_rgba(191,219,254,0.9)]" />
            <span>
              On your side over time — keeping track of what you&apos;ve tried, what worked, and
              what&apos;s next, so you don&apos;t have to hold it all in your head.
            </span>
          </li>
        </ul>

        <p className="mt-3 text-xs text-slate-400">
          Stella doesn&apos;t replace doctors or emergency care. She makes it easier to reach them
          when you need to — and easier to take care of yourself, your time, and your money every
          step in between.
        </p>

        <ul className="mt-3 space-y-2 text-sm text-slate-300/95">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            <span>
              Listens in free text, mirrors back your situation, and highlights what&apos;s
              important for care teams to know.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            <span>
              Uses cited medical references and risk frameworks to suggest when to self-monitor vs
              seek urgent evaluation.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span>
              Knows your logistics—coverage, time, location—so recommendations fit real life, not a
              fictional perfect week.
            </span>
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-300">
          <TrustPill label="Not a doctor; supports clinicians" />
          <TrustPill label="No ads or sponsored providers" />
          <TrustPill label="You control your data" />
        </div>
      </div>

      {/* "AI image" preview side */}
      <div className="relative">
        <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-gradient-to-br from-sky-500/40 via-cyan-400/20 to-transparent opacity-80 blur-3xl" />
        <div className="relative overflow-hidden rounded-[32px] border border-sky-400/45 bg-slate-950/95 shadow-[0_0_45px_rgba(15,23,42,0.9)]">
          {/* scanning line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
            <div
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent opacity-70"
              style={{ animation: 'nt-scan 13s linear infinite' }}
            />
          </div>

          <div className="relative grid gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] text-sky-300/90">
                  PREVIEW · STELLA IN ACTION
                </p>
                <p className="text-xs text-slate-400">
                  A stylized preview; real conversations adapt to you.
                </p>
              </div>
              <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-200">
                LIVE · RISK-AWARE
              </span>
            </div>

            <div className="space-y-3 text-[11px] leading-relaxed">
              <ChatBubble role="user">
                “My knee has been aching for a month after a fall. I can walk, but stairs hurt. I’m
                exhausted trying to figure out who to see.”
              </ChatBubble>
              <ChatBubble role="assistant">
                “I&apos;m not a doctor, but I can help you sort options. I&apos;ll summarize what
                you&apos;ve told me, flag any red-flag symptoms to watch for, then show paths people
                in similar situations discuss with their clinicians.”
              </ChatBubble>
              <ChatBubble role="assistant">
                “From your insurance and location, I can surface nearby in-network clinics, typical
                price ranges, and which options usually need referrals. When you&apos;re ready, we
                can draft a call script or secure message together.”
              </ChatBubble>
            </div>

            <div className="mt-1 grid gap-2 text-[10px] text-slate-300 sm:grid-cols-3">
              <MiniStat label="Citations attached" value="Yes" />
              <MiniStat label="Risk flags checked" value="5 frameworks" />
              <MiniStat label="Time to next step" value="Minutes, not weeks" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CapabilitiesSection() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/80">
            WHAT NO TREK CAN HELP WITH
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
            One system for the messy middle of care.
          </h2>
        </div>
        <p className="max-w-md text-xs text-slate-400">
          No Trek sits between search engines, portals, and the clinic. These are examples—not
          promises of diagnosis—but they&apos;re the kinds of problems we&apos;re built to tame.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((cap) => (
          <CardTilt key={cap.title}>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950/95 p-4 text-left shadow-[0_0_26px_rgba(15,23,42,0.9)] transition-shadow duration-300 hover:shadow-[0_0_45px_rgba(56,189,248,0.9)]">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-300/90">
                  {cap.tag}
                </span>
                <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.9)]" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-50">
                {cap.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300/90">
                {cap.body}
              </p>
            </div>
          </CardTilt>
        ))}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/80">
            HOW IT WORKS
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
            From “what even is this?” to “I know my next move”.
          </h2>
        </div>
        <p className="max-w-md text-xs text-slate-400">
          No Trek is designed as one continuous experience. You can drop in once or keep Stella in
          the background as life happens.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {HOW_STEPS.map((step) => (
          <div
            key={step.label}
            className="relative overflow-hidden rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-left shadow-[0_0_22px_rgba(15,23,42,0.9)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-sky-500/15 via-transparent to-transparent" />
            <div className="relative flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900/90 text-[11px] font-semibold tracking-[0.18em] text-sky-300">
                {step.label}
              </span>
              <h3 className="text-sm font-semibold text-slate-50">
                {step.title}
              </h3>
            </div>
            <p className="relative mt-3 text-xs leading-relaxed text-slate-300/90">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function WhyDifferentSection() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/80">
          WHY NO TREK VS EVERYTHING ELSE
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
          Built for the people who usually fall through the cracks.
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(15,23,42,0.9)]">
          <h3 className="text-sm font-semibold text-slate-50">
            Medical-first, not ad-driven.
          </h3>
          <p className="mt-2 text-xs text-slate-300/90">
            No Trek doesn&apos;t sell your attention to clinics or pharma. Recommendations are
            grounded in cited sources and your context, not whoever bids the most.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>• No sponsored providers or &quot;promoted&quot; care paths.</li>
            <li>• Plain-language citations and last-updated timestamps.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(15,23,42,0.9)]">
          <h3 className="text-sm font-semibold text-slate-50">
            Designed around real life.
          </h3>
          <p className="mt-2 text-xs text-slate-300/90">
            Work, kids, pain, money, fear—healthcare happens in the middle of everything else.
            Stella is built to be realistic about that instead of pretending you&apos;re a full-time
            patient.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>• Helps you trade off time, cost, and energy.</li>
            <li>• Keeps the &quot;annoying admin&quot; pieces from falling on the floor.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(15,23,42,0.9)]">
          <h3 className="text-sm font-semibold text-slate-50">
            Privacy as a feature, not a footer.
          </h3>
          <p className="mt-2 text-xs text-slate-300/90">
            We treat your health story like something you own, not something to mine. You see what
            Stella remembers, and you decide what stays.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            <li>• Clear controls over what&apos;s saved or deleted.</li>
            <li>• No third-party ad trackers, ever.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-sky-500/50 bg-slate-950/95 px-6 py-8 text-center shadow-[0_0_45px_rgba(56,189,248,0.7)] sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(45,212,191,0.22),transparent_60%)] opacity-80" />
      <div className="relative space-y-4">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-200">
          START WHENEVER YOU&apos;RE READY
        </p>
        <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
          No Trek is built for the nights you&apos;d usually just tough it out.
        </h2>
        <p className="mx-auto max-w-xl text-sm text-slate-200/90">
          You don&apos;t need perfect words or a diagnosis. Tell Stella what&apos;s going on in your
          life, not just your body, and we&apos;ll help you move from &quot;I&apos;m stuck&quot; to
          &quot;I know my next move.&quot;
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/intake"
            className="rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.8)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_60px_rgba(56,189,248,1)] motion-reduce:transform-none motion-reduce:shadow-none"
          >
            Start with Stella
          </Link>
          <Link
            href="/privacy"
            className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/70 motion-reduce:transform-none"
          >
            How we handle your data
          </Link>
        </div>
      </div>
    </section>
  )
}

function FooterDisclaimer() {
  return (
    <footer>
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/90 px-5 py-4 text-[11px] text-slate-300/85 shadow-[0_0_26px_rgba(15,23,42,0.9)]">
        <span className="mr-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        No Trek provides information and logistics support and does not replace licensed clinicians.
        We show citations and last-updated timestamps in results. No ads; you control your data.
      </div>
    </footer>
  )
}

/* ============================== Splash & Background ============================== */

// Match landing-page splash, but wordmark = "NO TREK"
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
        fade ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* animated orb backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-[#0E5BD8]/40 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 animate-[spin_40s_linear_infinite] bg-gradient-to-tr from-[#0E5BD8]/25 via-sky-500/20 to-transparent blur-3xl" />
      </div>
      <div className="relative select-none text-5xl font-extrabold italic tracking-tight text-white drop-shadow-[0_0_40px_rgba(37,99,235,0.75)] sm:text-7xl md:text-8xl">
        NO TREK
      </div>
    </div>
  )
}

function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950"
    >
      {/* gradient orbs */}
      <div className="absolute -top-40 left-[-10%] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="absolute -bottom-40 right-[-10%] h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl" />

      {/* soft grid overlay */}
      <div className="absolute inset-0 opacity-30 mix-blend-soft-light [background-image:linear-gradient(to_right,rgba(15,23,42,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.8)_1px,transparent_1px)] [background-size:80px_80px]" />

      {/* scattered particles */}
      <div className="absolute inset-0">
        {BG_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 animate-pulse rounded-full bg-sky-100/70"
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ============================== Small helpers ============================== */

function LogoNT() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/95 text-xs font-black tracking-tight text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)]">
      NT
    </div>
  )
}

function HeroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-sky-400/50 bg-slate-900/70 px-3 py-1 text-[10px] font-semibold shadow-[0_0_24px_rgba(56,189,248,0.45)]">
      {label}
    </span>
  )
}

function TrustPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1 text-[10px] text-slate-300 shadow-[0_0_16px_rgba(15,23,42,0.9)]">
      {label}
    </span>
  )
}

function ChatBubble({
  role,
  children,
}: {
  role: 'user' | 'assistant'
  children: ReactNode
}) {
  const isUser = role === 'user'
  return (
    <div
      className={`max-w-full rounded-2xl border px-3 py-2 text-[11px] ${
        isUser
          ? 'ml-auto border-sky-500/60 bg-sky-500/10 text-sky-100'
          : 'mr-auto border-slate-700/80 bg-slate-900/80 text-slate-100'
      }`}
    >
      {children}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-100">
        {value}
      </p>
    </div>
  )
}

/** Strong 3D hover tilt + lift/glow for capability cards */
function CardTilt({ children }: { children: ReactNode }) {
  const [style, setStyle] = useState<CSSProperties>({
    transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)',
  })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateX = (0.5 - y) * 10
    const rotateY = (x - 0.5) * 10
    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px) scale(1.04)`,
      transition: 'transform 0.12s ease-out',
    })
  }

  function handleLeave() {
    setStyle({
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
      transition: 'transform 0.18s ease-out',
    })
  }

  return (
    <div
      className="transition-transform"
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}
