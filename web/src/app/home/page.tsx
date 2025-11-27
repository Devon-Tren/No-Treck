'use client'

import {
  useEffect,
  useState,
  type CSSProperties,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/* ============================== Types & Data ============================== */

type IntroSlide = {
  id: string
  label: string
  title: string
  body: string
  footer?: string
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: 'overview',
    label: '01',
    title: 'No Trek in plain language.',
    body: 'No Trek is a medical-first concierge that sits between “something feels off” and “I’m in a waiting room.” It helps you turn messy, stressful health to-dos into a clear, realistic plan you can actually follow.',
  },
  {
    id: 'stella',
    label: '02',
    title: 'Meet Stella, your on-your-side guide.',
    body: 'Stella listens to your story in your own words, reflects it back clearly, and then suggests options: what might be going on, which level of care makes sense, and how to talk about it with clinicians — always with clear caveats and citations.',
  },
  {
    id: 'help',
    label: '03',
    title: 'What No Trek can help with.',
    body:
      '• Figuring out “is this urgent?”\n' +
      '• Comparing options that fit your insurance, time, and energy.\n' +
      '• Lining up calls, bookings, and follow-through tasks so things don’t fall through the cracks.',
    footer: 'Think of it as a guide for the in-between space — after search, before the waiting room.',
  },
  {
    id: 'start',
    label: '04',
    title: 'How to get started.',
    body:
      'You don’t need the perfect words or a diagnosis. Start by telling Stella what’s going on and what you’re worried about. She helps you decide whether to watch and wait, reach out to a clinician, or let No Trek handle more of the logistics for you.',
    footer: 'If you’re just curious, you can also tap “Learn more” instead of starting a health conversation right away.',
  },
]

const BG_PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 61) % 100,
  duration: 4 + (i % 5),
  delay: (i % 7) * 0.4,
}))

/* ============================== Page ============================== */

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)
  const [showPracticeDemo, setShowPracticeDemo] = useState(false)

  // After splash finishes, decide whether to show the practice demo
  useEffect(() => {
    if (!splashDone) return
    if (typeof window === 'undefined') return
    const seen = window.sessionStorage.getItem('nt-practice-demo-seen') === '1'
    if (!seen) {
      setShowPracticeDemo(true)
    }
  }, [splashDone])

  function handlePracticeComplete(dontShowAgain: boolean) {
    setShowPracticeDemo(false)
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('nt-practice-demo-seen', '1')
      } catch {
        // ignore storage errors
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <AnimatedBackground />

      {/* Centered blocking practice demo */}
      {showPracticeDemo && (
        <PracticeDemoOverlay onComplete={handlePracticeComplete} />
      )}

      {!splashDone && <SplashIntro onDone={() => setSplashDone(true)} />}

      <div
        className={`relative z-10 transition-opacity duration-700 ${
          splashDone ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <NavBar />
        <EmergencyBanner />

        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-10 lg:px-8 lg:pt-14">
          <HeroSection />
          <IntroStoryCard />
          <FooterDisclaimer />
        </div>
      </div>

      {/* Global keyframes (still used on /info for scan shimmer) */}
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

/* ============================== Practice Demo Overlay ============================== */

type PracticeDemoOverlayProps = {
  onComplete: (dontShowAgain: boolean) => void
}

function PracticeDemoOverlay({ onComplete }: PracticeDemoOverlayProps) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const total = INTRO_SLIDES.length
  const slide = INTRO_SLIDES[index]
  const isFirst = index === 0
  const isLast = index === total - 1

  function goNext() {
    if (!isLast) {
      setIndex((i) => Math.min(i + 1, total - 1))
    }
  }

  function goPrev() {
    if (!isFirst) {
      setIndex((i) => Math.max(i - 1, 0))
    }
  }

  function finish(goToIntake: boolean) {
    onComplete(dontShowAgain)
    if (goToIntake) {
      router.push('/intake')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 backdrop-blur"
    >
      {/* soft glow backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/35 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-[28px] border border-sky-500/60 bg-slate-950/95 px-6 py-7 shadow-[0_0_50px_rgba(15,23,42,0.95)] sm:px-8 sm:py-8">
          <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-200">
            PRACTICE DEMO
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            A quick walkthrough of how No Trek + Stella fit into your life.
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Four short steps. No account, no forms — just a glimpse of what Stella can do before you step into the app.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-sky-200">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                {slide.label} · {slide.title}
              </span>
              <span className="text-[10px] text-slate-400">
                {index + 1} / {total}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-200/90">
              {slide.body}
            </p>

            {slide.footer && (
              <p className="mt-3 text-[11px] text-slate-400">{slide.footer}</p>
            )}

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={isFirst}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] ${
                    isFirst
                      ? 'cursor-default border-slate-700/70 text-slate-600'
                      : 'border-slate-600/80 text-slate-100 hover:border-sky-400/80 hover:text-sky-100'
                  }`}
                >
                  Back
                </button>
                <div className="flex gap-1.5">
                  {INTRO_SLIDES.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 w-4 rounded-full transition-all ${
                        i === index
                          ? 'bg-sky-400'
                          : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                {isLast ? (
                  <>
                    <label className="flex items-center gap-2 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-900"
                      />
                      Don&apos;t show this demo again in this tab
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => finish(true)}
                        className="rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
                      >
                        Start with Stella
                      </button>
                      <button
                        type="button"
                        onClick={() => finish(false)}
                        className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-sky-400/70"
                      >
                        Enter home page
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={goNext}
                    className="self-end rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200/85 transition-colors hover:text-sky-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link
            href="/intake"
            className="rounded-2xl bg-sky-500 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-950 shadow-[0_0_26px_rgba(56,189,248,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
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
        <span className="hidden rounded-full border border-red-500/70 bg-red-500/15 px-3 py-1 text-[10px] font-extrabold tracking-[0.18em] text-red-200 sm:inline">
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
              <HeroChip label="Built for the messy middle of care" />
              <HeroChip label="Insurance & logistics kept in view" />
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
              href="/info"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-900/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100 shadow-[0_0_18px_rgba(15,23,42,0.9)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/70 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] motion-reduce:transform-none motion-reduce:shadow-none"
            >
              Learn how No Trek works
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

function IntroStoryCard() {
  const router = useRouter()
  const [index, setIndex] = useState(0)

  const total = INTRO_SLIDES.length
  const slide = INTRO_SLIDES[index]
  const isFirst = index === 0
  const isLast = index === total - 1

  function goNext() {
    if (isLast) {
      router.push('/intake')
    } else {
      setIndex((i) => Math.min(i + 1, total - 1))
    }
  }

  function goPrev() {
    if (!isFirst) {
      setIndex((i) => Math.max(i - 1, 0))
    }
  }

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-br from-sky-500/25 via-cyan-400/15 to-transparent opacity-80 blur-3xl" />
      <div className="relative overflow-hidden rounded-[32px] border border-sky-500/40 bg-slate-950/95 px-6 py-7 shadow-[0_0_45px_rgba(15,23,42,0.9)] sm:px-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-sky-200">
              A QUICK GLIMPSE
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
              Click through to see how No Trek + Stella fit into your life.
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Short, four-step overview. No accounts, no forms — just context, then you decide if you want to talk to Stella.
            </p>
          </div>

          <div className="mt-4 w-full max-w-md sm:mt-0">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-sky-200">
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                  {slide.label} · {slide.title}
                </span>
                <span className="text-[10px] text-slate-400">
                  {index + 1} / {total}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-200/90">
                {slide.body}
              </p>

              {slide.footer && (
                <p className="mt-3 text-[11px] text-slate-400">
                  {slide.footer}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={isFirst}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] ${
                      isFirst
                        ? 'cursor-default border-slate-700/70 text-slate-600'
                        : 'border-slate-600/80 text-slate-100 hover:border-sky-400/80 hover:text-sky-100'
                    }`}
                  >
                    Back
                  </button>
                  <div className="flex gap-1.5">
                    {INTRO_SLIDES.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Go to step ${i + 1}`}
                        className={`h-1.5 w-4 rounded-full transition-all ${
                          i === index
                            ? 'bg-sky-400'
                            : 'bg-slate-700 hover:bg-slate-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLast && (
                    <button
                      type="button"
                      onClick={goNext}
                      className="rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
                    >
                      Next
                    </button>
                  )}

                  {isLast && (
                    <>
                      <button
                        type="button"
                        onClick={goNext}
                        className="rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(56,189,248,1)]"
                      >
                        Start with Stella
                      </button>
                      <Link
                        href="/info"
                        className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100 hover:border-sky-400/70"
                      >
                        Learn more first
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
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