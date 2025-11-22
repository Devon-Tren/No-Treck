import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON

// Runtime guard + type narrowing for TS
if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
