'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/authProvider'

export function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await signOut()
      // send them back to the auth / landing page
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border-slate-700 bg-slate-900/60 text-xs text-slate-200 hover:bg-slate-800 hover:text-white shadow-sm"
    >
      <LogOut className="h-3.5 w-3.5 mr-1.5" />
      {loading ? 'Signing out…' : 'Log out'}
    </Button>
  )
}
