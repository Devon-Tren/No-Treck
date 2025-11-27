'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

function LogoNT() {
  return (
    <div className="h-10 w-10 rounded-full bg-white/10 border border-blue-400/50 grid place-items-center shadow-md">
      <span className="text-[#0E5BD8] font-extrabold text-sm tracking-tight">NT</span>
    </div>
  )
}

/* ============================== Sections ============================== */

export default function AuthLandingPage() {
  const BRAND_BLUE = '#0E5BD8'
  const [showSplash, setShowSplash] = useState(true)

  const { user, loading, signInWithEmailPass, signUpWithEmailPass } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // If already logged in, go to home
  useEffect(() => {
    if (!loading && user) {
      router.push('/home')
    }
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedEmail = email.trim()

    // Basic front-end guards before calling Supabase
    if (!trimmedEmail || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'signin') {
        // SIGN IN: Supabase cross-checks email + password
        const { error: authError } = await signInWithEmailPass(trimmedEmail, password)

        if (authError) {
          const msg = authError.message ?? 'Something went wrong.'
          const lower = msg.toLowerCase()

          if (lower.includes('invalid login credentials')) {
            setError('Email or password is incorrect.')
          } else {
            setError(msg)
          }
          return
        }

        // Success: credentials correct, Supabase returned a session
        setSuccess('Signed in successfully. Redirecting to your care map…')
        router.push('/home')
      } else {
        // SIGN UP: creates a new user, but Supabase will error if email already exists
        const { error: authError } = await signUpWithEmailPass(trimmedEmail, password)

        if (authError) {
          const msg = authError.message ?? 'Something went wrong.'
          const lower = msg.toLowerCase()

          if (
            lower.includes('user already registered') ||
            lower.includes('email already registered') ||
            lower.includes('user already exists') ||
            lower.includes('duplicate key')
          ) {
            setError("There’s already an account associated with this email. Try signing in instead.")
          } else {
            setError(msg)
          }
          return
        }

        // Success: user row created; usually requires email confirmation
        setSuccess(
          'Account created. A confirmation email will be sent to your email shortly. After confirming, you can sign in with your new password.'
        )
        setMode('signin')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isDisabled =
    submitting || !email.trim() || !password || password.length < 6

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4">
      {showSplash && <SplashIntro onDone={() => setShowSplash(false)} />}
      <div className="max-w-5xl w-full grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
        {/* Left: pitch / hero */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <LogoNT />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">
                No Trek
              </p>
              <p className="text-xs text-slate-400">
                Care navigation, without the trek.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Log in to your{' '}
              <span className="text-[#0E5BD8]">living care map</span>.
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl">
              Create a secure No Trek account to track symptoms, next steps,
              and calls we can place on your behalf. Your credentials stay
              encrypted and never shared with clinics or employers.
            </p>
          </div>

          {/* Feature strip */}
          <div className="grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Professional triage</p>
              <p className="text-slate-400 mt-1">
                Medical guidance and recommendations cited from credible sources.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Care options</p>
              <p className="text-slate-400 mt-1">
                Clinics and tasks organized into a living care plan.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">AI calls</p>
              <p className="text-slate-400 mt-1">
                Optional scripted calls to clinics, with your consent.
              </p>
            </div>
          </div>
        </div>

        {/* Right: auth card */}
        <Card className="bg-slate-900/70 border-slate-700/80 backdrop-blur-xl shadow-xl rounded-3xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white font-semibold">
                {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
              </CardTitle>
              <button
                type="button"
                className="text-[11px] text-blue-300 cursor-pointer hover:text-blue-200 underline-offset-2 hover:underline"
                onClick={() => {
                  setError(null)
                  setSuccess(null)
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                }}
              >
                {mode === 'signin'
                  ? "New here? Create account"
                  : 'Already have one? Sign in'}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Use your email and a strong password to access No Trek.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor="email"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950/40 border-slate-600 focus-visible:ring-[#0E5BD8] text-sm text-white rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor="password"
                >
                  Password
                  <span className="ml-1 text-[10px] text-slate-500">
                    (min 6 characters)
                  </span>
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete={
                    mode === 'signin'
                      ? 'current-password'
                      : 'new-password'
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950/40 border-slate-600 focus-visible:ring-[#0E5BD8] text-white text-sm rounded-2xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isDisabled}
                className="w-full rounded-2xl bg-[#0E5BD8] hover:bg-[#0b4cbc] text-sm cursor-pointer font-semibold flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-700/60 rounded-2xl px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl px-3 py-2">
                  {success}
                </p>
              )}

              <div className="pt-3 border-t border-slate-800 mt-4 space-y-2">
                <p className="text-[11px] text-slate-500">
                  By continuing, you agree to No Trek&apos;s privacy and data
                  usage policies. We don&apos;t share your information with
                  employers or insurers.
                </p>
                <p className="text-[11px] text-slate-500">
                  For safety, avoid entering full names or identifiers for other
                  people unless needed for scheduling.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
