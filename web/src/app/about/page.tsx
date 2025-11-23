'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'

const BRAND_BLUE = '#0E5BD8'

type Risk = 'low' | 'moderate' | 'severe'

export default function AboutPage() {
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
          {/* Hero: from us to you */}
          <section className="rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/80 px-5 py-6 shadow-[0_0_26px_rgba(15,23,42,0.9)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
              About No Trek
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              This is us, talking to you.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/90">
              We&apos;re two people who got tired of watching people we love get lost in the
              healthcare maze. No titles here, no polished founder bios. Just our stories,
              why we&apos;re building No Trek, and what we hope it feels like when you use it.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/intake"
                className="rounded-2xl bg-sky-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
              >
                Start with Stella
              </Link>
              <Link
                href="/info"
                className="rounded-2xl border border-slate-600/80 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100 hover:bg-slate-800/90"
              >
                How No Trek works
              </Link>
            </div>
          </section>

          {/* Our stories */}
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {/* Devon story */}
            <article className="hover-card h-full rounded-[22px] border-[2px] border-sky-500/50 bg-slate-900/85 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/90">
                Devon&apos;s side
              </p>
              <h2 className="mt-2 text-sm font-semibold text-slate-50">
                The night my dad needed help and everything felt like chaos
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                I&apos;m Devon. My breaking point wasn&apos;t a pitch deck. It was watching my
                dad need real help and realizing how hard it was to do something that
                should&apos;ve been simple: get him seen, get straight answers, and not get
                crushed by bills we didn&apos;t understand.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                We were bouncing between portals, phone trees, &quot;log in to see your
                message&quot; walls, and conflicting advice. Everyone kept saying,
                &quot;Call this number&quot; or &quot;Check this link.&quot; Nobody was actually
                walking with us through it.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                I remember thinking: there are tools on the internet that can write code and
                pass exams, and yet my family is still copy-pasting notes into ten
                different apps just to get basic care sorted. That gap is where No Trek
                started for me.
              </p>
            </article>

            {/* Toni story */}
            <article className="hover-card h-full rounded-[22px] border-[2px] border-emerald-400/50 bg-slate-900/85 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
                Toni&apos;s side
              </p>
              <h2 className="mt-2 text-sm font-semibold text-slate-50">
                Watching someone I love get bounced around the system
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                I&apos;m Toni. For me, it was watching my girlfriend try to get help and
                getting bounced between providers, waitlists, and vague answers. Every
                appointment meant new paperwork, new apps, new &quot;we&apos;ll call you
                back&quot; that never went anywhere.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                She was exhausted, scared, and still somehow being asked to be the project
                manager of her own care. I kept thinking: there should be something that
                knows her story, remembers what happened last time, and helps carry the
                weight instead of adding more to it.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                That&apos;s where No Trek became less of an idea and more of a promise:
                we&apos;re not okay with people needing a whiteboard and a spreadsheet just
                to get basic help.
              </p>
            </article>
          </section>

          {/* Shared why */}
          <section className="mt-9 rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
              Why we&apos;re building this
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              Different stories. Same feeling: this shouldn&apos;t be this hard.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/90">
              We come from different moments of frustration, but the feeling was the same:
              regular people are expected to navigate one of the most complex systems on
              earth with nothing but Google, a few portals, and whatever energy they have
              left after being sick or scared.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/90">
              We&apos;re not here to tear down healthcare. We&apos;re here because we believe
              everyone deserves at least one clear, honest, intelligent guide that sits on
              their side of the table — something that can translate, organize, and push
              the next step forward when your brain is fried.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/90">
              Yes, we want No Trek to be a real business. But the order is simple for us:
              people first, money second. If we can&apos;t look back and say
              &quot;This genuinely helped people get care they might not have gotten,&quot;
              then none of this is worth building.
            </p>
          </section>

          {/* Why AI & how we use it */}
          <section className="mt-9 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <article className="rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200/80">
                Why AI at all?
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">
                We don&apos;t want AI to replace clinicians. We want it to carry the paperwork,
                the planning, and the panic.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                We chose AI because, done right, it can sit in the messy middle where most
                people get stuck: the questions before the visit, the decisions about
                where to go, the &quot;what now?&quot; after you leave, the follow-ups you
                forget when life hits again.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200/90">
                Stella — the presence you meet inside No Trek — is our attempt to bundle
                three things into one:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-200/90">
                <li>• A calm, medically-informed brain.</li>
                <li>• A logistics assistant that thinks in steps and tasks.</li>
                <li>• A companion that remembers your story inside this one app.</li>
              </ul>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">
                We&apos;re strict about boundaries: Stella doesn&apos;t diagnose, doesn&apos;t
                prescribe, and doesn&apos;t replace emergency care. Her job is to help you
                understand risk in plain language, lay out options, and turn advice into
                a plan you can actually walk through.
              </p>
            </article>

            <aside className="rounded-[22px] border-[2px] border-sky-500/50 bg-slate-950/80 p-5 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/90">
                Our promise to you
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-100/95">
                <li>• We will never gate basic safety advice behind a paywall.</li>
                <li>
                  • We will always be honest about what No Trek can and can&apos;t do.
                </li>
                <li>
                  • We will design like real humans are on the other side of the screen,
                  not &quot;users&quot; in a funnel.
                </li>
                <li>
                  • If a feature doesn&apos;t actually help people move through care, we&apos;d
                  rather delete it than ship it.
                </li>
              </ul>
              <p className="mt-3 text-[12px] text-slate-300/90">
                Under the hood, there&apos;s advanced AI and agentic logic. On the surface,
                we want it to feel like texting one smart, kind, relentless guide who
                knows you&apos;re human.
              </p>
            </aside>
          </section>

          {/* The future: mission */}
          <section className="mt-9 rounded-[22px] border-[2px] border-emerald-400/50 bg-slate-900/85 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              Where we&apos;re trying to go
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              Our mission: automate finding and receiving care, so more people can actually
              get help — and understand it.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/90">
              The long-term picture for No Trek is bigger than chat and checklists. We
              want to build toward a world where you can say what&apos;s going on, and the
              system quietly routes you: the right level of care, the right place, the
              right timing, the right follow-up — with your constraints (money, time,
              family, energy) baked into the plan.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/90">
              That&apos;s why we&apos;re slowly growing the agentic side of No Trek: tools
              that can call clinics, check wait times, chase paperwork, and help keep your
              care map moving when you don&apos;t have capacity to babysit it.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/90">
              At the core of all of this is a simple belief we both share: everyone
              deserves to know how to help themselves, and they deserve tools that make
              that easier — not harder.
            </p>
          </section>

          {/* Direct note + where to go next */}
          <section className="mt-9 rounded-[22px] border-[2px] border-slate-700/80 bg-slate-900/85 p-5 backdrop-blur">
            <h2 className="text-sm font-semibold text-slate-50">
              A direct note from us
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-200/90">
              If you&apos;re reading this because you&apos;re already in the middle of something
              hard — or you&apos;re just tired of feeling lost in healthcare — we&apos;re glad
              you&apos;re here. We built No Trek for people like our families and yours.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200/90">
              You don&apos;t have to know where to start. That&apos;s Stella&apos;s job. Your job
              is just to show up as you are and tell the truth about what&apos;s going on.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-100">
              — Devon &amp; Toni
              <br />
              Co-founders of No Trek
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Link
                href="/intake"
                className="hover-card flex flex-col justify-between rounded-2xl border-[2px] border-sky-500/60 bg-slate-950/80 p-4 text-sm"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                    I need to talk about something
                  </p>
                  <p className="mt-2 font-medium text-slate-50">Start in Intake</p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    Tell Stella what&apos;s going on, get a sense of urgency, and see your
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
                    I already have steps
                  </p>
                  <p className="mt-2 font-medium text-slate-50">Open the coach view</p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    Turn advice, to-dos, and follow-ups into something you can actually
                    execute.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-emerald-200">
                  Open Tasks →
                </span>
              </Link>

              <Link
                href="/info"
                className="hover-card flex flex-col justify-between rounded-2xl border-[2px] border-slate-600/80 bg-slate-950/80 p-4 text-sm"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    I want more detail
                  </p>
                  <p className="mt-2 font-medium text-slate-50">
                    Read how No Trek works
                  </p>
                  <p className="mt-1 text-xs text-slate-200/90">
                    See the product breakdown, free vs Plus, and how Stella thinks under
                    the hood.
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-slate-200">
                  Go to Info →
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

/* ========= Shared UI bits (same style as other pages) ========= */

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
