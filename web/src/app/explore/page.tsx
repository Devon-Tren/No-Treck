// File: src/app/explore/page.tsx
'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

const BRAND_BLUE = '#0E5BD8'

const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')

export default function ExplorePage() {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-slate-950 text-slate-50"
      style={{ ['--brand-blue' as any]: BRAND_BLUE } as CSSProperties}
    >
      <BreathingBackground />

      <div className="relative z-10">
        <NavBar />

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {/* HERO */}
          <section className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200/90">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Explore No Trek
            </div>

            <div className="mt-4 max-w-3xl space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Not sure where to start? Tap what sounds like you.
              </h1>
              <p className="text-sm text-slate-200/90 sm:text-[15px]">
                This page is the “no homework” tour. Big tiles, plain language. You
                can’t break anything — you just choose a tile, and Stella handles the
                heavy thinking for you.
              </p>
              <p className="text-xs text-slate-400">
                No Trek is for the messy middle of health and life: figuring things out,
                not just booking a visit.
              </p>
            </div>
          </section>

          {/* SECTION 1: WHERE TO START */}
          <section className="mb-12">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Step 1 · Pick your starting point
                </h2>
                <p className="mt-1 text-sm text-slate-300/90">
                  Choose the tile that feels closest. You can always come back here.
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <ExploreTile
                href="/intake"
                eyebrow="Best if you’re worried"
                title="“Something feels off…”"
                body="New symptom, weird feeling, or just not sure if it’s worth a visit? Start here and just talk to Stella in plain language."
                chip="Talk to Stella"
              />
              <ExploreTile
                href="/tasks"
                eyebrow="Best if you’re juggling stuff"
                title="“I already have things to do.”"
                body="You’ve got referrals, meds, bills, or forms piling up. Turn chaos into a simple list and let the coach view nudge you through."
                chip="Open Tasks & Coach"
              />
              <ExploreTile
                href="/info"
                eyebrow="Best if you’re curious"
                title="“What exactly is No Trek?”"
                body="See a clear breakdown of how Stella works, what’s safe, and how free vs Plus will work — without any tech jargon."
                chip="Learn how it works"
              />
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              You can switch between Intake, Tasks, and Info anytime. Stella follows the
              story, not the page.
            </p>
          </section>

          {/* SECTION 2: WHAT STELLA CAN HANDLE FOR YOU */}
          <section className="mb-12">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Step 2 · See what Stella actually does
                </h2>
                <p className="mt-1 text-sm text-slate-300/90">
                  Think of Stella as the coordinator living inside No Trek — part nurse,
                  part guide, part logistics brain.
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <ScenarioCard
                label="New symptoms or worries"
                tag="Start in Intake"
                bullets={[
                  'Tell Stella what’s going on like you’d text a friend.',
                  'She screens for red flags and explains options in plain language.',
                  'You end up with a clear, simple plan — not 20 tabs of search results.',
                ]}
              />
              <ScenarioCard
                label="Existing diagnosis, too many steps"
                tag="Use Tasks + Stella"
                bullets={[
                  'Turn messy advice, portals, and reminders into one clean task list.',
                  'Ask Stella “Why is this step important?” and get a short, human answer.',
                  'Get nudged to take the next sensible step, not all of them at once.',
                ]}
              />
              <ScenarioCard
                label="Bills, insurance, and money stress"
                tag="Use Intake or Info"
                bullets={[
                  'Describe the bill or situation; Stella helps you make sense of it.',
                  'Get options for lowering cost, asking better questions, or pushing back.',
                  'Turn it into calls, questions, and tasks you can actually do.',
                ]}
              />
              <ScenarioCard
                label="Caring for someone else"
                tag="Start in Intake"
                bullets={[
                  'Explain what’s going on with your family member in your own words.',
                  'Stella helps you think through safety, logistics, and boundaries.',
                  'Build a shared plan you can both follow over time.',
                ]}
              />
            </div>
          </section>

          {/* SECTION 3: FREE NOW, AGENTIC PLUS SOON */}
          <section className="mb-12">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Step 3 · Choose your level of “done for you”
                </h2>
                <p className="mt-1 text-sm text-slate-300/90">
                  No Trek will always have a genuinely useful free tier. Plus will exist
                  for people who want Stella to do more of the boring work for them.
                </p>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <TierCard
                label="Free · Self-guided with Stella"
                badge="Available now"
                points={[
                  'Unlimited chat with Stella for educational support and planning.',
                  'Risk language, options, and simple care maps — without paywalls.',
                  'Tasks and coach view to keep your own life organized.',
                ]}
                footer="Good if you’re okay driving, but want a very smart co-pilot."
              />
              <TierCard
                label="No Trek Plus · Agentic (coming soon)"
                badge="Coming soon"
                points={[
                  'Stella not only suggests calls and forms — she helps handle them for you.',
                  'Smarter routing for families, complex cases, and high admin load.',
                  'Deeper logistics help: scripts, multi-step follow-ups, and coordination.',
                ]}
                footer="Good if you’re busy, overwhelmed, or just done doing everything yourself."
              />
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Safety guidance is never paywalled. Plus is about shifting more of the admin
              burden off your plate, not locking essential help behind a subscription.
            </p>
          </section>

          {/* SECTION 4: QUICK “IF THIS, THEN THAT” */}
          <section className="mb-6">
            <header className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">
                One-glance guide · “If this is you, tap this”
              </h2>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickRouteCard
                label="“Is this urgent?”"
                sub="Chest twinge, weird symptom, or worry about risk."
                href="/intake"
                cta="Go to Intake"
              />
              <QuickRouteCard
                label="“I’m drowning in follow-ups.”"
                sub="Labs, referrals, portals, and messages everywhere."
                href="/tasks"
                cta="Open Tasks"
              />
              <QuickRouteCard
                label="“I don’t get what this app is yet.”"
                sub="You want the big picture in normal language."
                href="/info"
                cta="See the breakdown"
              />
              <QuickRouteCard
                label="“I care a lot about privacy.”"
                sub="You want to see how data, consent, and safety work."
                href="/privacy"
                cta="Review privacy & consent"
              />
            </div>
          </section>

          <p className="mt-6 text-[11px] text-slate-400">
            You never have to say things “the right way.” Stella is built to meet you
            where you are, whether that’s “I have my whole history ready” or “I just
            know something feels off.”
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
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          will-change: transform;
        }

        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.8),
            0 0 40px rgba(56, 189, 248, 0.6);
          border-color: rgba(148, 163, 184, 0.8) !important;
        }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes softPulse {
            0% {
              opacity: 0.16;
              transform: scale(1);
            }
            50% {
              opacity: 0.26;
              transform: scale(1.04);
            }
            100% {
              opacity: 0.16;
              transform: scale(1);
            }
          }
        }
      `}</style>
    </main>
  )
}

/* ============================== BACKGROUND ============================== */

function BreathingBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Deep blue base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 80% 0%, rgba(37,99,235,0.32), transparent 60%), linear-gradient(180deg, #020617 0%, #020617 45%, #020617 100%)',
        }}
      />

      {/* Soft grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
        }}
      />

      {/* Breathing glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 640px at 72% 18%, rgba(56,189,248,0.75), transparent 60%)',
          filter: 'blur(60px)',
          opacity: 0.22,
          animation: 'softPulse 11s ease-in-out infinite',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_center,transparent,rgba(0,0,0,0.6))]" />
    </div>
  )
}

/* ============================== NAV ============================== */

function NavBar() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intake', label: 'Intake' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/info', label: 'Info' },
    { href: '/explore', label: 'Explore' },
    { href: '/privacy', label: 'Privacy' },
  ]

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shadow-[0_8px_30px_rgba(15,23,42,0.85)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-500/95 text-[11px] font-black tracking-tight text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.9)]">
            NT
          </div>
          <span className="text-xs font-semibold tracking-[0.26em] text-slate-100">
            NO TREK
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  'text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors',
                  link.href === '/explore'
                    ? 'text-sky-300'
                    : 'text-slate-200/85 hover:text-sky-300',
                )}
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

      {/* Mobile nav */}
      <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                'rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                link.href === '/explore'
                  ? 'text-sky-300 border-sky-500/60'
                  : 'text-slate-200/90',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

/* ============================== SMALL PIECES ============================== */

type ExploreTileProps = {
  href: string
  eyebrow: string
  title: string
  body: string
  chip: string
}

function ExploreTile({ href, eyebrow, title, body, chip }: ExploreTileProps) {
  return (
    <Link
      href={href}
      className="hover-card flex h-full flex-col justify-between rounded-2xl border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 via-slate-900/75 to-slate-950/95 p-4"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300/90">
          {eyebrow}
        </p>
        <h3 className="text-base font-semibold text-slate-50">{title}</h3>
        <p className="text-sm text-slate-200/90">{body}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="pill inline-flex items-center gap-1 rounded-full border border-slate-600/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-100">
          {chip}
        </span>
        <span className="text-xs text-slate-300/90">Tap to go →</span>
      </div>
    </Link>
  )
}

type ScenarioCardProps = {
  label: string
  tag: string
  bullets: string[]
}

function ScenarioCard({ label, tag, bullets }: ScenarioCardProps) {
  return (
    <div className="hover-card flex h-full flex-col rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">{label}</h3>
        <span className="pill rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/90">
          {tag}
        </span>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-sky-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type TierCardProps = {
  label: string
  badge: string
  points: string[]
  footer: string
}

function TierCard({ label, badge, points, footer }: TierCardProps) {
  return (
    <div className="hover-card flex h-full flex-col rounded-2xl border-[2px] border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-50">{label}</h3>
        <span className="pill rounded-full border border-slate-600/80 bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/90">
          {badge}
        </span>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-slate-200/90">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[6px] h-1 w-1 flex-none rounded-full bg-sky-400" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-300/90">{footer}</p>
    </div>
  )
}

type QuickRouteCardProps = {
  label: string
  sub: string
  href: string
  cta: string
}

function QuickRouteCard({ label, sub, href, cta }: QuickRouteCardProps) {
  return (
    <Link
      href={href}
      className="hover-card flex h-full flex-col justify-between rounded-2xl border-[2px] border-slate-700/80 bg-slate-900/85 p-3"
    >
      <div>
        <h3 className="text-[13px] font-semibold text-slate-50">{label}</h3>
        <p className="mt-1 text-[12px] text-slate-300/90">{sub}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-sky-300">{cta}</span>
        <span className="text-xs text-slate-400">→</span>
      </div>
    </Link>
  )
}
