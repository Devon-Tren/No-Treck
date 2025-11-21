// File: src/app/about/page.tsx
'use client'

import Link from 'next/link'

function LogoNT() {
  return (
    <div className="h-9 w-9 rounded-full bg-white/95 shadow-sm shadow-sky-900/40 ring-1 ring-slate-200 grid place-items-center">
      <span className="text-[#0E5BD8] font-extrabold text-xs tracking-tight">
        NT
      </span>
    </div>
  )
}

type FeatureItemProps = {
  label: string
}

function FeatureItem({ label }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[3px] inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-sky-400/60 bg-sky-500/10 text-[10px] text-sky-200">
        ●
      </span>
      <span className="text-xs leading-relaxed text-slate-200">{label}</span>
    </li>
  )
}

type FounderCardProps = {
  name: string
  title: string
  story: string
}

function FounderCard({ name, title, story }: FounderCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm shadow-black/40 transition transform duration-500 hover:-translate-y-1 hover:border-sky-500/60 hover:bg-slate-900">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">{name}</h3>
          <p className="text-xs font-medium text-slate-400">{title}</p>
        </div>
        <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400 group-hover:border-sky-500/70 group-hover:text-sky-200">
          Lived experience
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-300">{story}</p>
    </article>
  )
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-50 scroll-smooth">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* soft animated orbs */}
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-[#0E5BD8]/25 blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rotate-12 bg-gradient-to-tr from-[#0E5BD8]/15 via-sky-500/10 to-transparent blur-3xl animate-[spin_40s_linear_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl animate-[pulse_16s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0)_0,_#020617_55%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <LogoNT />
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                No Trek
              </span>
              <span className="text-sm font-medium text-slate-100">
                About the team
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              href="/"
              className="rounded-full border border-slate-700/70 px-3 py-1.5 text-slate-200/90 shadow-sm shadow-black/30 transition hover:border-slate-500 hover:bg-slate-900/80"
            >
              Back to home
            </Link>
            <a
              href="#stories"
              className="hidden rounded-full bg-[#0E5BD8]/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-sky-900/60 transition hover:bg-[#1661e0] sm:inline-flex"
            >
              Read our stories
            </a>
          </nav>
        </div>
      </header>

      {/* SECTION 1: About & Mission (full screen, 2 columns) */}
      <section className="flex min-h-screen items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-6 lg:py-20">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-sky-200">
              About us
              <span className="h-[1px] w-6 bg-sky-400/70" />
              Health navigation, not just chat
            </p>

            <div className="space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                Finding care shouldn&apos;t feel like
                <span className="text-[#5ca4ff]"> a maze.</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                No Trek is a health navigation companion that lives in the gap
                between
                <span className="font-medium text-slate-100">
                  {' '}“something&apos;s wrong”{' '}
                </span>
                and
                <span className="font-medium text-slate-100">
                  {' '}“it&apos;s handled.”{' '}
                </span>
                We don&apos;t replace doctors. We help you understand risk, explore
                what might be going on with evidence-backed context, and move
                toward the right level of care with less confusion.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40 transition transform duration-500 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-sky-900/40">
                <h3 className="text-sm font-semibold text-slate-50">
                  Triage with empathy
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  No Trek listens like a human and reasons like a medical
                  researcher—mapping symptoms to risk levels and surfacing red
                  flags without panic or false reassurance.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm shadow-black/40 transition transform duration-500 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-sky-900/40">
                <h3 className="text-sm font-semibold text-slate-50">
                  Evidence & logistics
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Every suggestion is grounded in reputable sources and tied to
                  concrete next steps: where to go, who to call, and what to ask
                  when you get there.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#stories"
                className="inline-flex items-center gap-2 rounded-full bg-[#0E5BD8] px-4 py-2 text-xs font-medium text-white shadow-lg shadow-sky-900/60 transition hover:bg-[#1661e0]"
              >
                Read our stories
                <span className="text-base" aria-hidden>
                  ↘
                </span>
              </a>
              <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
                Built to feel like a calm, informed friend who actually knows
                how the healthcare system works—and keeps receipts.
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1">
            <div className="relative h-full">
              <div className="pointer-events-none absolute -inset-10 rounded-[2rem] border border-sky-500/20 bg-sky-500/5 blur-3xl animate-[pulse_18s_ease-in-out_infinite]" />
              <div className="relative space-y-4 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-6">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  What No Trek does
                </p>
                <ul className="space-y-3 text-sm text-slate-200">
                  <FeatureItem label="Understands your story, not just keywords." />
                  <FeatureItem label="Maps symptoms to low / moderate / severe risk states." />
                  <FeatureItem label="Surfaces cited context instead of guessing." />
                  <FeatureItem label="Helps you choose ER, urgent care, specialist, or self-care." />
                  <FeatureItem label="Turns guidance into tasks, scripts, and follow-ups." />
                </ul>
                <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-100">
                  <p className="font-medium">
                    We&apos;re not here to replace your clinician.
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sky-100/80">
                    We&apos;re here to shorten the gap between “I&apos;m worried” and “I
                    know what to do next”—with clarity, receipts, and a plan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Story & Founders (full screen, 2 columns) */}
      <section
        id="stories"
        className="flex min-h-screen items-center border-top border-slate-800/80 bg-slate-950/95"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 lg:flex-row lg:items-start lg:gap-16 lg:px-6 lg:py-20">
          {/* Left column: combined story */}
          <div className="flex-1 space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300">
              Our stories
              <span className="h-[1px] w-6 bg-slate-500" />
              Built from lived experience
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Two different journeys. The same question:
              <span className="block text-[#5ca4ff]">
                why is it this hard to get answers?
              </span>
            </h2>

            {/* little picker to jump between Devon / Toni */}
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 p-1 text-[11px] text-slate-300">
              <span className="px-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Jump to
              </span>
              <a
                href="#devon"
                className="rounded-full px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
              >
                Devon&apos;s story
              </a>
              <a
                href="#toni"
                className="rounded-full px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-800 hover:text-slate-50"
              >
                Toni&apos;s story
              </a>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <h3
                id="devon"
                className="pt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Devon&apos;s story
              </h3>
              <p>
                For Devon, it started at home. His dad was repeatedly misread by
                the system—a serious case of bilateral pneumonia brushed off as
                bronchitis, treated with codeine that made his breathing worse.
                One hospital turned him away because the wait was “too long.”
                At the next, doctors said that if he had arrived any later, he
                wouldn&apos;t have survived.
              </p>
              <p>
                After that close call, his dad&apos;s health never really went back
                to “normal.” Chronic kidney disease, surgery, and constant
                appointments meant that for big stretches of Devon&apos;s childhood,
                his father was either in a hospital bed or recovering from
                something. It often felt like growing up with an almost-absent
                dad—not because he didn&apos;t care, but because the system kept
                him sick, exhausted, and stuck in limbo.
              </p>
              <p>
                Watching that as a kid made healthcare feel confusing,
                fragmented, and more dangerous than it should be. No Trek is
                Devon&apos;s way of turning that pain into pattern-recognition: a
                product that listens carefully, respects risk, and helps other
                families get to answers faster than his family did.
              </p>

              <h3
                id="toni"
                className="pt-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Toni&apos;s story
              </h3>
              <p>
                For Toni, the story was his girlfriend&apos;s eyes. She lived with
                severe ocular neuropathic pain for four years, cycling through
                specialists and tests without a clear name for what was
                happening. Every new appointment started with retelling the same
                story and ended with more uncertainty. It felt like watching
                someone you love slowly disappear into their symptom list.
              </p>
              <p>
                Out of desperation, her mother turned to ChatGPT one night and
                walked through every detail. The model surfaced a term no one
                had used yet: ocular neuropathic pain. When they brought that
                phrase back to her doctors, it finally clicked and became the
                working diagnosis. It didn&apos;t magically fix everything, but it
                gave the family language, direction, and a sense that they
                weren&apos;t crazy.
              </p>
              <p>
                That moment made the potential of AI impossible to ignore. It
                also made the stakes very real. Toni saw how dangerous it is
                when people have to hunt for answers alone—and how powerful AI
                can be when it&apos;s used with guardrails, humility, and a focus
                on real-world follow-through. No Trek is his way of building the
                tool he wishes they had on day one.
              </p>

              <p className="text-slate-200">
                Together, those two journeys became No Trek: an empathetically
                driven, medically framed guide that helps people move from fear
                and confusion toward clarity, options, and action.
              </p>
            </div>
          </div>

          {/* Right column: founders */}
          <div
            id="founders"
            className="flex-1 space-y-5 rounded-[2rem] border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/60 backdrop-blur-xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Founders
              </p>
              <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium text-slate-300">
                Built with real stories, not hypotheticals
              </span>
            </div>

            <div className="mt-2 space-y-4">
              <FounderCard
                name="Devon Trenoskie"
                title="Founder, No Trek"
                story="Devon grew up watching his dad navigate misdiagnoses, long waits, and a system that always seemed two steps late. A near-fatal pneumonia misread, years of kidney disease, and countless hospital stays meant his father was often bedridden when Devon needed him most. At No Trek, he channels that experience into product — making sure the app listens carefully, takes red flags seriously, and turns guidance into clear next steps instead of vague advice."
              />
              <FounderCard
                name="Toni Amarvi"
                title="Co-founder, No Trek"
                story="For Toni, everything changed when his girlfriend spent four years in severe eye pain without a name for it. Seeing a late-night AI chat surface “ocular neuropathic pain” — and watching doctors finally connect the dots — showed him both the power and the responsibility of this technology. At No Trek, he focuses on using AI with guardrails: cited, humble, and always aimed at helping people reach real-world clarity faster."
              />
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              We&apos;re building No Trek for the people we love first, and for
              everyone else who&apos;s ever walked out of a clinic still thinking:
              “Something&apos;s wrong, and I&apos;m still not sure what to do.”
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
