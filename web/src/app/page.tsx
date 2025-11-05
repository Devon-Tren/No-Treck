// File: src/app/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

// ---------------- Splash: wordmark, fades out ----------------
function SplashIntro({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sitTime = reduced ? 0 : 1000
    const fadeDur = reduced ? 0 : 600
    const t1 = setTimeout(() => setFade(true), sitTime)
    const t2 = setTimeout(() => onDone(), sitTime + fadeDur)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0E5BD8] transition-opacity duration-700 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="text-white font-extrabold tracking-tight italic text-6xl sm:text-7xl md:text-8xl select-none">
        NO TREK
      </div>
    </div>
  )
}

// ---------------- Trust / status chips ----------------
function TrustChips() {
  const chips = [
    'Citations shown in results',
    'Insurance & prices checked before booking',
    'Clear escalation for red flags',
  ]
  return (
    <ul className="mt-4 flex flex-wrap gap-2 text-xs text-white/90">
      {chips.map((t) => (
        <li key={t} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20 backdrop-blur">
          {t}
        </li>
      ))}
    </ul>
  )
}

// ---------------- Prompt (left column) ----------------
function PromptPanel() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const target = `/intake${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`
    router.push(target)
  }

  return (
    <div className="relative min-h-[24rem] md:min-h-[26rem] rounded-3xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/10 p-6 md:p-8 flex flex-col gap-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How can I help?</h2>
        <span className="hidden sm:inline text-[11px] font-medium text-slate-500">
          Evidence-based · Privacy first
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex gap-3 w-full">
        <label htmlFor="prompt" className="sr-only">Describe what’s going on</label>
        <input
          id="prompt"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe what's going on (e.g., “cut my foot”, “fever since yesterday”)"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          aria-describedby="prompt-help"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          Get my plan
        </button>
      </form>

      <p id="prompt-help" className="text-xs text-slate-500 -mt-3">Press Enter to continue</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {[
          'Check wait times near me',
          'Who takes my insurance?',
          'How much could this cost?',
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQ(s)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
        <div className="rounded-lg bg-slate-50 px-3 py-2">Scam Shield: flags upsell add-ons</div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">Insurance & price verified pre-booking</div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">Escalation to humans when needed</div>
      </div>

      <div className="sr-only" aria-live="polite">{msg}</div>
    </div>
  )
}

// ---------------- Cards ----------------
type Card = { title: string; href: string; desc?: string; analytics?: string }

/** 2×2 grid that stretches to match the left panel’s height; each card shows a hover blurb */
function PrimaryCardGrid({ cards }: { cards: Card[] }) {
  // mouse-follow shimmer
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.querySelectorAll<HTMLAnchorElement>('a.feature-card').forEach((el) => {
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        el.style.setProperty('--x', x + 'px')
        el.style.setProperty('--y', y + 'px')
      })
    }
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div className="h-full">
      <div className="grid h-full grid-rows-2 sm:grid-cols-2 sm:grid-rows-2 gap-3">
        {cards.map((c, i) => (
          <Link
            key={c.title}
            href={c.href}
            data-analytics={c.analytics}
            aria-describedby={c.desc ? `card-desc-${i}` : undefined}
            className="feature-card relative h-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 flex flex-col"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition"
              style={{
                background:
                  'radial-gradient(500px circle at var(--x,50%) var(--y,50%), rgba(255,255,255,0.14), transparent 40%)',
              }}
            />
            <h3 className="text-lg font-semibold">{c.title}</h3>

            {/* hover blurb */}
            {c.desc && (
              <>
                <p id={`card-desc-${i}`} className="sr-only">{c.desc}</p>
                <div className="mt-auto text-[13px] text-white/90 opacity-0 translate-y-1 transition duration-200 ease-out hover:opacity-100 hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0">
                  {c.desc}
                </div>
              </>
            )}

            <span className="mt-3 inline-block text-sm text-white/90">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SimpleTwoUp({ cards }: { cards: Card[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c, i) => (
        <Link
          key={c.title}
          href={c.href}
          aria-describedby={c.desc ? `learn-desc-${i}` : undefined}
          className="feature-card relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:-translate-y-[2px] hover:border-white/30 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <h3 className="text-base font-semibold">{c.title}</h3>
          {c.desc && (
            <>
              <p id={`learn-desc-${i}`} className="sr-only">{c.desc}</p>
              <div className="mt-2 text-[13px] text-white/90 opacity-0 translate-y-1 transition duration-200 ease-out hover:opacity-100 hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0">
                {c.desc}
              </div>
            </>
          )}
          <span className="mt-3 inline-block text-sm text-white/90">Open →</span>
        </Link>
      ))}
    </div>
  )
}

// ---------------- Page ----------------
export default function Home() {
  const [splashDone, setSplashDone] = useState(false)

  // Primary (with blurbs)
  const primaryCards: Card[] = [
    {
      title: 'Get care now',
      href: '/intake',
      analytics: 'card_get_care',
      desc: 'Triage with citations; see self-care vs in-person options, costs, in-network, and waits.',
    },
    {
      title: 'Costs & coverage',
      href: '/coverage',
      analytics: 'card_costs_coverage',
      desc: 'Check in-network status and estimated out-of-pocket. See cheaper alternatives.',
    },
    {
      title: 'Have us call & book',
      href: '/agent-caller',
      analytics: 'card_call_book',
      desc: 'We draft the script, you approve, we handle the call and log the outcome.',
    },
    {
      title: 'Tasks & follow-ups',
      href: '/tasks',
      analytics: 'card_tasks',
      desc: 'Reminders, forms, after-care, receipts—so you can finish and feel done.',
    },
  ]

  // Learn (half + half under the left panel)
  const learnCards: Card[] = [
    {
      title: 'Know the Importance',
      href: '/importance',
      desc: 'Understand common injuries and why early action matters—every claim is cited.',
    },
    {
      title: 'About Us',
      href: '/about',
      desc: 'Why we built No Trek and the outcomes we aim to improve.',
    },
  ]

  return (
    <main className="min-h-screen text-white relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0E5BD8] via-[#0A53C5] to-[#083F98]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(1200px 600px at 80% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), radial-gradient(800px 400px at 10% 110%, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)'
        }}
      />

      {!splashDone && <SplashIntro onDone={() => setSplashDone(true)} />}

      {/* Emergency banner */}
      <div className={`transition-opacity duration-700 ${splashDone ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/20 backdrop-blur-sm text-[13px] text-white/90">
          <div className="mx-auto max-w-6xl px-6 py-2">
            If this is an emergency, call 911 or your local emergency number.
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-14">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm text-white/80">Medical-first AI concierge</p>
                <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold tracking-tight italic">No Trek</h1>
                <p className="mt-4 max-w-2xl text-white/90">
                  Give us the destination—we’ll make the journey simple. Clear guidance with citations, transparent costs,
                  and hands-on help to book care and follow through.
                </p>
              </div>
              <Link
                href="/explore"
                className="hidden sm:inline rounded-2xl px-4 py-2 border border-white/30 text-white hover:border-white transition"
              >
                Explore features
              </Link>
            </div>
            <TrustChips />
            <div className="mt-6 flex flex-wrap gap-3">
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
            </div>
          </header>

          {/* Two-column: prompt left, 2×2 cards right, heights matched */}
          <div className="grid gap-6 lg:grid-cols-5 items-stretch">
            {/* Left */}
            <div className="lg:col-span-3 order-1">
              <PromptPanel />
            </div>
            {/* Right: NO outer box; grid fills full height */}
            <div className="lg:col-span-2 order-2">
              <PrimaryCardGrid cards={primaryCards} />
            </div>
          </div>

          {/* Learn under the left panel only; each half width so together match the left panel width */}
          <div className="grid gap-6 lg:grid-cols-5 items-start mt-6">
            <div className="lg:col-span-3 order-1">
              <SimpleTwoUp cards={learnCards} />
            </div>
          </div>

          {/* Footer disclaimer */}
          <footer className="mt-12 text-[12px] text-white/80">
            <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
              No Trek provides information and logistics support and does not replace licensed clinicians.
              We show citations and last-updated timestamps in results. No ads; you control your data.
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
