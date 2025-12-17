'use client'

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

function LogoNT() {
  return (
    <div className="h-10 w-10 rounded-full bg-white/10 border border-blue-400/50 grid place-items-center shadow-md">
      <span className="text-[#0E5BD8] font-extrabold text-sm tracking-tight">NT</span>
    </div>
  );
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes to detect password recovery
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        console.log('Password recovery mode detected');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      });
      setLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...',
      });

      // Redirect to login after success
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !password || !confirmPassword || password.length < 6;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full grid gap-10 md:grid-cols-[1.2fr,1fr] items-center">
        {/* Left: branding / info */}
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
              Set your new <span className="text-[#0E5BD8]">password</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl">
              Choose a strong password that you haven't used before. 
              Your new password must be at least 6 characters long.
            </p>
          </div>

          {/* Feature strip */}
          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Secure storage</p>
              <p className="text-slate-400 mt-1">
                Passwords are encrypted and never stored in plain text.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Strong protection</p>
              <p className="text-slate-400 mt-1">
                Use a unique password for maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Right: password reset card */}
        <Card className="bg-slate-900/70 border-slate-700/80 backdrop-blur-xl shadow-xl rounded-3xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-white font-semibold">
              Create new password
            </CardTitle>
            <p className="text-xs text-slate-400">
              Enter your new password below.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor="password"
                >
                  New Password
                  <span className="ml-1 text-[10px] text-slate-500">
                    (min 6 characters)
                  </span>
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950/40 border-slate-600 focus-visible:ring-[#0E5BD8] text-white text-sm rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor="confirmPassword"
                >
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-950/40 border-slate-600 focus-visible:ring-[#0E5BD8] text-white text-sm rounded-2xl"
                />
              </div>

              {message && (
                <div
                  className={`text-xs rounded-2xl px-3 py-2 ${
                    message.type === 'success'
                      ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-700/60'
                      : 'text-red-400 bg-red-950/40 border border-red-700/60'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={isDisabled}
                className="w-full rounded-2xl bg-[#0E5BD8] hover:bg-[#0b4cbc] text-sm cursor-pointer font-semibold flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </Button>

              <div className="pt-3 border-t border-slate-800 mt-4">
                <p className="text-[11px] text-slate-500">
                  After updating your password, you'll be redirected to sign in with your new credentials.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}