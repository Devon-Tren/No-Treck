// File: src/app/explore/page.tsx
import Link from 'next/link'

// ---------- Tiny inline icons (no packages) ----------
const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 21s-6.7-4.2-9.2-7.6A5.5 5.5 0 0 1 12 5.1a5.5 5.5 0 0 1 9.2 8.3C18.7 16.8 12 21 12 21Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3l7 3v6a10 10 0 0 1-7 9 10 10 0 0 1-7-9V6l7-3Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.7-3.1 19.4 19.4 0 0 1-6-6 19.9 19.9 0 0 1-3.1-8.7A2 2 0 0 1 4 1.9h2a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L7 9a16 16 0 0 0 8 8l.6-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.6 1.9Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconChecks = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h8M3 12h8M3 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="m14.5 6 2 2 4-4m-6 8 2 2 4-4m-6 8 2 2 4-4"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ---------- UI atoms ----------
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/90 ring-1 ring-white/20 backdrop-blur">
      {children}
    </span>
  )
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-10 w-10 shrink-0 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
      <div aria-hidden className="absolute inset-0 rounded-full bg-white/10 blur-md opacity-60" />
      <div className="relative text-white/90">{children}</div>
    </div>
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
      className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-6 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <div className="flex items-start gap-3">
        <IconBadge>{icon}</IconBadge>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-white/90">{desc}</p>
          <span className="mt-4 inline-block text-sm text-white/90 group-hover:translate-x-0.5 transition">{cta}</span>
        </div>
      </div>
    </Link>
  )
}

// ---------- Page ----------
export default function ExplorePage() {
  return (
    <main className="min-h-screen text-white relative">
      {/* Background (match landing) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0E5BD8] via-[#0A53C5] to-[#083F98]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), radial-gradient(800px 400px at 10% 110%, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Emergency banner */}
      <div className="bg-black/20 backdrop-blur-sm text-[13px] text-white/90">
        <div className="mx-auto max-w-6xl px-6 py-2">
          If this is an emergency, call 911 or your local emergency number.
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <nav className="text-sm">
          <Link href="/" className="text-white/90 hover:underline">← Back to Home</Link>
        </nav>

        {/* Hero */}
        <header className="mt-6 md:mt-8">
          <p className="text-xs sm:text-sm text-white/80">Explore features</p>
          <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold tracking-tight italic">See how No Trek helps</h1>
          <p className="mt-4 max-w-2xl text-white/90">
            A medical-first concierge that turns stress into clear next steps—backed by citations, transparent costs,
            and hands-on logistics. Here’s how the core flows work.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>Citations & last-updated shown</Pill>
            <Pill>Insurance & prices checked before booking</Pill>
            <Pill>Escalation for red-flags</Pill>
            <Pill>Privacy & consent</Pill>
          </div>
        </header>

        {/* What you can do (4 core) */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <Feature
            title="Get care now"
            href="/intake"
            icon={<IconHeart />}
            desc="Short triage → clear plan (not a diagnosis) with citations. See self-care vs in-person options, wait estimates, in-network checks, and price ranges before you book."
          />
          <Feature
            title="Costs & coverage"
            href="/coverage"
            icon={<IconShield />}
            desc="Verify in-network status and estimated out-of-pocket. We show where numbers come from and uncertainty ranges when exact prices aren’t available."
          />
          <Feature
            title="Have us call & book"
            href="/agent-caller"
            icon={<IconPhone />}
            desc="We draft the call script, you approve, we call. You get a clean log with who we spoke to, confirmed price/in-network, and next steps."
          />
          <Feature
            title="Tasks & follow-ups"
            href="/tasks"
            icon={<IconChecks />}
            desc="Auto-created checklist from your plan: reminders, forms, after-care, receipts. Mark done, reschedule, or hand off to us to complete."
          />
        </section>

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-4">
            <li className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-wide text-white/70">1 · Assess</p>
              <p className="mt-2 text-white/90 text-sm">
                Quick questions capture severity, onset, and risk factors. Red-flag rules run in the background.
              </p>
            </li>
            <li className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-wide text-white/70">2 · Verify</p>
              <p className="mt-2 text-white/90 text-sm">
                We check sources, in-network status, wait estimates, and price ranges. Every key claim shows a citation.
              </p>
            </li>
            <li className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-wide text-white/70">3 · Act</p>
              <p className="mt-2 text-white/90 text-sm">
                Approve a call script, book care, or follow self-care steps. You confirm before anything is done.
              </p>
            </li>
            <li className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-wide text-white/70">4 · Follow-up</p>
              <p className="mt-2 text-white/90 text-sm">
                Reminders and after-care keep momentum. Everything is time-stamped for your records.
              </p>
            </li>
          </ol>
        </section>

        {/* Trust & Safety */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold">Trust & safety</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="font-semibold">Citations where it matters</h3>
              <p className="mt-2 text-sm text-white/90">
                Results show source citations and last-updated timestamps. When data is uncertain, we show ranges and explain why.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="font-semibold">Safety & escalation</h3>
              <p className="mt-2 text-sm text-white/90">
                Red-flag rules trigger clear guidance to escalate to clinicians. No diagnosis replacement, no prescribing.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="font-semibold">Privacy & consent</h3>
              <p className="mt-2 text-sm text-white/90">
                You control what we use and when we act. No ads, no selling data, and a clear audit trail of actions we take.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="font-semibold">Anti-scam guardrails</h3>
              <p className="mt-2 text-sm text-white/90">
                We flag upsells and unnecessary add-ons, show alternatives, and confirm prices before booking.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/intake"
            className="rounded-2xl px-5 py-3 bg-white text-slate-900 font-medium shadow hover:shadow-lg transition focus:outline-none focus:ring-4 focus:ring-white/40"
          >
            Start triage
          </Link>
          <Link
            href="/privacy"
            className="rounded-2xl px-5 py-3 border border-white/30 text-white hover:border-white transition focus:outline-none focus:ring-4 focus:ring-white/30"
          >
            Privacy & consent
          </Link>
        </section>

        {/* Footer disclaimer */}
        <footer className="mt-12 text-[12px] text-white/80">
          <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
            No Trek provides information and logistics support and does not replace licensed clinicians.
          </div>
        </footer>
      </div>
    </main>
  )
}
