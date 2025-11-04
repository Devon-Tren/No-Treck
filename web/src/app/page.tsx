// File: src/app/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ---------------- Splash: words-only, fades out ----------------
function SplashIntro({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sitTime = reduced ? 0 : 1200 // how long the wordmark sits (ms)
    const fadeDur = reduced ? 0 : 700
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

// ---------------- Right-column prompt panel ----------------
function PromptPanel() {
  return (
    <div className="relative w-full h-full rounded-3xl bg-white text-slate-900 shadow-xl ring-1 ring-black/10 p-6 md:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How can I help?</h2>
        <span className="hidden sm:inline text-xs font-medium text-slate-500">Evidence‑based · Insurance checked · Safety‑first</span>
      </div>

      <label htmlFor="prompt" className="sr-only">Describe what's going on</label>
      <div className="flex gap-3 w-full">
        <input
          id="prompt"
          placeholder="Describe what's going on (e.g., ‘cut my foot’, ‘fever since yesterday’)"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <Link href="/intake" legacyBehavior>
          <a className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
            Get my plan
          </a>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {[
          'Check wait times near me',
          'Who takes my insurance?',
          'How much will this cost?'
        ].map((s) => (
          <button key={s} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 text-left">
            {s}
          </button>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
        <div className="rounded-lg bg-slate-50 px-3 py-2">Scam Shield: flags unnecessary add‑ons</div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">Price & insurance verified before booking</div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">Red‑flag rules with clear escalation</div>
      </div>
    </div>
  )
}

// ---------------- Page ----------------
export default function Home() {
  const [splashDone, setSplashDone] = useState(false)

  const cards = [
    { title: 'How can I help?', href: '/intake', desc: 'Guided triage to narrow causes.' },
    { title: 'Find care & costs', href: '/care', desc: 'Nearby clinics, cash prices, insurance.' },
    { title: 'Wait times', href: '/wait-times', desc: 'Live estimates for ER/urgent care.' },
    { title: 'Insurance & eligibility', href: '/insurance', desc: 'Coverage checks, copays, approvals.' },
    { title: 'Call on your behalf', href: '/agent-caller', desc: 'AI caller books, checks, follows up.' },
    { title: 'Tasks & follow-ups', href: '/tasks', desc: 'Reminders, meds, documents.' },
  ]

  // mouse-follow shimmer for card hover
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      document.querySelectorAll<HTMLAnchorElement>('a.group').forEach((el) => {
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
    <main className="min-h-dvh min-h-screen bg-gradient-to-b from-[#0E5BD8] to-[#0A4CB7] text-white">
      {!splashDone && <SplashIntro onDone={() => setSplashDone(true)} />}

      <div className={`transition-opacity duration-700 ${splashDone ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <header className="mb-12">
            <p className="text-sm text-white/80">Medical-first concierge</p>
            <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold tracking-tight italic">
              No Trek
            </h1>
            <p className="mt-4 max-w-2xl text-white/90">
              Give us the destination — we’ll make the journey. Get quick, validated guidance,
              real costs, and hands-on help when you need it.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/intake" legacyBehavior>
                <a className="rounded-2xl px-5 py-3 bg-white text-slate-900 font-medium shadow hover:shadow-lg transition">
                  Start symptom check
                </a>
              </Link>
              <Link href="/explore" legacyBehavior>
                <a className="rounded-2xl px-5 py-3 border border-white/30 text-white hover:border-white transition">
                  Explore features
                </a>
              </Link>
            </div>
          </header>

          {/* Merged layout: cards + prompt panel */}
          <div className="grid gap-6 lg:grid-cols-5 items-start">
            {/* Cards (left, wider) */}
            <section className="lg:col-span-3 order-2 lg:order-1 grid gap-4 sm:grid-cols-2">
              {cards.map((c) => (
                <Link key={c.title} href={c.href} legacyBehavior>
                  <a
                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                      aria-hidden
                      style={{
                        background:
                          'radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(255,255,255,0.12), transparent 40%)',
                      }}
                    />
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm text-white/80">{c.desc}</p>
                    <span className="mt-4 inline-block text-sm text-white/90 group-hover:translate-x-0.5 transition">
                      Open →
                    </span>
                  </a>
                </Link>
              ))}
            </section>

            {/* Prompt panel (right) */}
            <div className="lg:col-span-2 order-1 lg:order-2 min-h-[24rem]">
              <PromptPanel />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
