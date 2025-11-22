'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/authProvider'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // when auth finished loading and there's no user, kick to auth page
    if (!loading && !user) {
      router.replace('/') // auth landing page
    }
  }, [loading, user, router])

  // While we don’t know yet, show a minimal loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking your session…</span>
        </div>
      </div>
    )
  }

  // If no user after loading, we already redirected; render nothing
  if (!user) return null

  // Authenticated – show the actual page
  return <>{children}</>
}
