import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Service role client -- bypasses RLS. Use ONLY in server-side code (webhook handlers, admin operations).
// NEVER import this in client components or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
