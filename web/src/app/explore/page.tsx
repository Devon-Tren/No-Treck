// File: src/app/explore/page.tsx
import Link from 'next/link'

// ---------- Tiny inline icons (no packages) ----------
const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 21s-6.7-4.2-9.2-7.6A5.5 5.5 0 0 1 12 5.1a5.5 5.5 0 0 1 9.2 8.3C18.7 16.8 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 3l7 3v6a10 10 0 0 1-7 9 10 10 0 0 1-7-9V6l7-3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m9 12 2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M22 16.9v2a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.7-3.1 19.4 19.4 0 0 1-6-6 19.9 19.9 0 0 1-3.1-8.7A2 2 0 0 1 4 1.9h2a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L7 9a16 16 0 0 0 8 8l.6-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.6 1.9Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const IconChecks = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 6h8M3 12h8M3 18h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="m14.5 6 2 2 4-4m-6 8 2 2 4-4m-6 8 2 2 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// ---------- Background particles (deterministic, no hydration issues) ----------
const BG_PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 61) % 100,
  duration: 4 + (i % 5),
  delay: (i % 7) * 0.4,
}))

// ---------- UI atoms ----------
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200 shadow-[0_0_16px_rgba(15,23,42,0.9)]">
      {children}
    </span>
  )
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/40 bg-slate-950/80 shadow-[0_0_22px_rgba(56,189,248,0.7)]">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-sky-500/25 blur-lg opacity-80"
      />
      <div className="relative text-sky-100">{children}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-300/80">
      {children}
    </p>
  )
}

// ---------- Feature card ----------
function Feature({
  title,
  desc,
  href,
  cta = 'Open →',
  icon,
}: {
  title: string
  desc: string
  href: string
  cta?: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-700/85 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950/95 p-5 text-left shadow-[0_0_26px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_45px_rgba(56,189,248,0.9)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
    >
      <div className="flex items-start gap-3">
        <IconBadge>{icon}</IconBadge>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300/90">
            {desc}
          </p>
        </div>
      </div>
      <span className="mt-4 inline-flex items-center text-[11px] font-semibold tracking-[0.18em] text-sky-300/90">
        {cta}
        <span className="ml-1 transition-transform duration-300 group-hover:translate-x-0.5">
          →
        </span>
      </span>

      {/* subtle hover halo */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.16),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  )
}

// ---------- Page ----------
export default function ExplorePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <AnimatedBackground />
      <EmergencyBanner />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 lg:px-8 lg:pt-14">
        {/* Top nav bar */}
        <nav className="mb-8 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-slate-100">
            <div className="h-7 w-7 rounded-full bg-[#0E5BD8]/80 shadow-[0_0_20px_rgba(37,99,235,0.7)]" />
            <span className="text-sm font-semibold tracking-tight">
              NO <span className="font-extrabold italic">TREK</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-slate-200/70 bg-slate-100/10 px-3 py-1.5 text-slate-50"
            >
              Explore
            </Link>
            <Link
              href="/intake"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Intake
            </Link>
            <Link
              href="/tasks"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Tasks
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-transparent px-3 py-1.5 text-slate-300 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-50"
            >
              Privacy
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <header className="mt-6 space-y-4 md:mt-8">
          <SectionLabel>EXPLORE NO TREK</SectionLabel>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
            What No Trek and Stella can actually do for you.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            No Trek is a medical-first concierge with Stella at the center. This page walks through
            the core flows—what you can expect before you sign up or share anything sensitive.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>Citations &amp; last-updated shown</Pill>
            <Pill>Insurance &amp; prices checked before booking</Pill>
            <Pill>No ads or sponsored providers</Pill>
            <Pill>Designed around your real life</Pill>
          </div>
        </header>

        {/* Core flows */}
        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <SectionLabel>FOUR CORE FLOWS</SectionLabel>
              <h2 className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
                The main ways people use No Trek.
              </h2>
            </div>
            <p className="max-w-md text-xs text-slate-400">
              Each card is a piece of a single system, not a separate app. You can use one flow
              once, or keep Stella in the background as health stuff pops up.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Feature
              title="Get care now"
              href="/intake"
              icon={<IconHeart />}
              desc="Start with your own words—what hurts, what’s worrying you, what you’ve already tried. Stella turns that into a structured picture, flags red-flag symptoms, and shows possible next steps with citations."
              cta="Open triage"
            />
            <Feature
              title="Costs & coverage"
              href="/coverage"
              icon={<IconShield />}
              desc="Before you book, we help you understand in-network options, typical ranges for prices, and what might affect what you pay. When numbers are fuzzy, we explain why."
              cta="Explore coverage"
            />
            <Feature
              title="Have us call & book"
              href="/agent-caller"
              icon={<IconPhone />}
              desc="Phone trees and “please hold” are where a lot of people give up. We help you draft the script, practice if you want, and support calls or messages so you can get answers and appointments faster."
              cta="See call support"
            />
            <Feature
              title="Tasks & follow-ups"
              href="/tasks"
              icon={<IconChecks />}
              desc="After a plan comes the hard part: remembering and actually doing it. We turn care plans into trackable tasks, reminders, questions for your clinician, and a clean log of what happened."
              cta="View tasks"
            />
          </div>
        </section>

        {/* Stella-focused section */}
        <section className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-4">
            <SectionLabel>STELLA, UNDER THE HOOD</SectionLabel>
            <h2 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              Not a doctor, but very good at the messy middle.
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Stella&apos;s job is to make sense of everything between “I&apos;m worried” and “I&apos;m in a
              waiting room.” She listens in free text, organizes the story, and helps you prepare
              for human care—not replace it.
            </p>

            <ul className="mt-3 space-y-2 text-sm text-slate-300/95">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                <span>
                  Mirrors back what you&apos;ve said in plain language, so you can correct or refine it
                  before it ever reaches a clinician.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <span>
                  Uses cited references and risk frameworks to help you think about urgency, without
                  pretending to give a diagnosis.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                <span>
                  Weaves in logistics—time, money, distance—so recommendations feel realistic,
                  not “in a perfect world.”
                </span>
              </li>
            </ul>

            <p className="mt-3 text-xs text-slate-400">
              Stella is opinionated about safety: emergency situations are pushed to real-world
              care, not held in chat.
            </p>
          </div>

          {/* Glass “preview” card (static UI art, no real chat) */}
          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 rounded-[32px] bg-gradient-to-br from-sky-500/40 via-cyan-400/20 to-transparent opacity-80 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-sky-400/40 bg-slate-950/95 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent opacity-80" />
              <div className="relative space-y-3 p-5 text-[11px] leading-relaxed sm:p-6">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-sky-300/90">
                  STELLA PREVIEW
                </p>
                <div className="space-y-2">
                  <PreviewBubble role="user">
                    “I&apos;ve had a weird chest tightness on and off for a week. Not crushing pain, but it
                    scares me. I&apos;m not sure if I&apos;m overreacting.”
                  </PreviewBubble>
                  <PreviewBubble role="assistant">
                    “I&apos;m not a doctor, but I can help you think about what to do next. I&apos;ll ask a few
                    questions to understand your symptoms and risk factors, then show options people
                    often discuss with clinicians in situations like this.”
                  </PreviewBubble>
                  <PreviewBubble role="assistant">
                    “If any severe or rapidly worsening symptoms appear while we talk, I&apos;ll point you
                    toward emergency care instead of staying here.”
                  </PreviewBubble>
                </div>
                <div className="mt-3 grid gap-2 text-[10px] text-slate-300 sm:grid-cols-3">
                  <MiniStat label="Citations shown" value="Yes" />
                  <MiniStat label="Red-flag checks" value="On by default" />
                  <MiniStat label="Who decides" value="You + clinicians" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & safety */}
        <section className="mt-14 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <SectionLabel>TRUST, SAFETY, AND PRIVACY</SectionLabel>
              <h2 className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
                Guardrails aren&apos;t an afterthought.
              </h2>
            </div>
            <p className="max-w-md text-xs text-slate-400">
              We build for people who have already been burned by confusing bills, rushed visits, or
              opaque systems. That means being explicit about what Stella can and can&apos;t do.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TrustCard
              title="Citations & uncertainty, not fake certainty"
              body="When advice touches medical facts or risk, we show underlying references and last-updated dates. When evidence is limited, we say so and explain what that means for you."
            />
            <TrustCard
              title="Safety and escalation over vibes"
              body="Red-flag rules run in the background. If your situation sounds like it could be an emergency or urgent risk, Stella points you to in-person or phone care instead of continuing the conversation."
            />
            <TrustCard
              title="Privacy by default"
              body="We don’t sell your data or run ads. You choose what to save, what to delete, and when we contact outside providers or payers on your behalf."
            />
            <TrustCard
              title="Anti-scam and over-treatment checks"
              body="We help you spot unnecessary add-ons, confusing billing codes, and surprise-fee patterns. When there are reasonable alternatives, we highlight them."
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            For full details, you can read our{' '}
            <Link
              href="/privacy"
              className="text-sky-400 underline-offset-2 hover:underline"
            >
              Privacy Notice
            </Link>
            . This page is a human-readable overview.
          </p>
        </section>

        {/* How it feels to use */}
        <section className="mt-14 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <SectionLabel>WHAT IT FEELS LIKE</SectionLabel>
              <h2 className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
                A single place to put “I should deal with this” and actually deal with it.
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FeelCard
              label="When something new pops up"
              body="You tell Stella what’s going on in your own words. Within a few minutes, you have a structured summary, flagged concerns, and options to consider with real clinicians."
            />
            <FeelCard
              label="When you’re mid-journey"
              body="You use No Trek to track questions, doctors’ answers, upcoming appointments, and the ‘don’t forget’ tasks that normally live in your head or scattered screenshots."
            />
            <FeelCard
              label="When you just want it done"
              body="You hand off what you can—checking coverage, calling, organizing follow-up—to a system designed to help you finish, not just start."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-[28px] border border-sky-500/50 bg-slate-950/95 px-6 py-8 text-center shadow-[0_0_35px_rgba(56,189,248,0.7)] sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(45,212,191,0.22),transparent_60%)] opacity-80" />
          <div className="relative space-y-4">
            <SectionLabel>READY WHEN YOU ARE</SectionLabel>
            <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
              Start with Stella the next time your brain goes, “I should probably deal with this.”
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-200/90">
              You don&apos;t need the right wording or a diagnosis. Start where you are; we&apos;ll
              help you figure out what to do next, and how much effort it will actually take.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/intake"
                className="rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_40px_rgba(56,189,248,0.8)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_60px_rgba(56,189,248,1)]"
              >
                Start with Stella
              </Link>
              <Link
                href="/privacy"
                className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/70"
              >
                How we handle your data
              </Link>
            </div>
          </div>
        </section>

        {/* Footer disclaimer */}
        <footer className="mt-8 text-[11px] text-slate-300">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 shadow-[0_0_22px_rgba(15,23,42,0.9)]">
            <span className="mr-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
            No Trek provides information and logistics support and does not replace licensed
            clinicians or emergency services.
          </div>
        </footer>
      </div>
    </main>
  )
}

// ---------- Small helper components ----------

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

function PreviewBubble({
  role,
  children,
}: {
  role: 'user' | 'assistant'
  children: React.ReactNode
}) {
  const isUser = role === 'user'
  return (
    <div
      className={`max-w-full rounded-2xl border px-3 py-2 ${
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
      <p className="mt-1 text-[11px] font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function TrustCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(15,23,42,0.9)]">
      <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-xs text-slate-300/90">{body}</p>
    </div>
  )
}

function FeelCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/85 bg-slate-950/95 p-4 text-sm text-slate-300 shadow-[0_0_20px_rgba(15,23,42,0.9)]">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-sky-300/90">
        {label.toUpperCase()}
      </p>
      <p className="mt-2 text-xs text-slate-300/90">{body}</p>
    </div>
  )
}
