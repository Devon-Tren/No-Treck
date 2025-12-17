'use client'

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function LogoNT() {
  return (
    <div className="h-10 w-10 rounded-full bg-white/10 border border-blue-400/50 grid place-items-center shadow-md">
      <span className="text-[#0E5BD8] font-extrabold text-sm tracking-tight">NT</span>
    </div>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/resetPassword`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Check your email for the password reset link!',
      });
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

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
              Reset your <span className="text-[#0E5BD8]">password</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl">
              Enter your email address and we'll send you a secure link to reset your password. 
              The link will expire in 1 hour for security.
            </p>
          </div>

          {/* Feature strip */}
          <div className="grid gap-3 md:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-blue-500/40 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Secure reset</p>
              <p className="text-slate-400 mt-1">
                Password reset links are single-use and expire quickly.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3 shadow-[0_0_25px_rgba(37,99,235,0.35)]">
              <p className="font-medium text-slate-50">Privacy first</p>
              <p className="text-slate-400 mt-1">
                Your credentials stay encrypted and never shared.
              </p>
            </div>
          </div>
        </div>

        {/* Right: reset form card */}
        <Card className="bg-slate-900/70 border-slate-700/80 backdrop-blur-xl shadow-xl rounded-3xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-white font-semibold">
              Reset your password
            </CardTitle>
            <p className="text-xs text-slate-400">
              We'll send a reset link to your email address.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor="email"
                >
                  Email Address
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
                disabled={loading || !email.trim()}
                className="w-full rounded-2xl bg-[#0E5BD8] hover:bg-[#0b4cbc] text-sm cursor-pointer font-semibold flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <button
                type="button"
                className="text-[11px] text-blue-300 cursor-pointer hover:text-blue-200 underline-offset-2 hover:underline w-full text-center"
                onClick={() => router.push('/')}
              >
                Back to Sign In
              </button>

              <div className="pt-3 border-t border-slate-800 mt-4">
                <p className="text-[11px] text-slate-500">
                  If you don't receive an email within a few minutes, check your spam folder 
                  or try again.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}