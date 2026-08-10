/**
 * Supabase browser client.
 *
 * next.config.ts sets `output: "export"` — this app ships as a static
 * bundle with no Next.js server at request time (no middleware, no route
 * handlers, no server actions in production). That means auth and data
 * access happen entirely from the browser, authorized by Postgres Row
 * Level Security (see supabase/migrations/20260811000001_rls_policies.sql)
 * rather than by a server-side check. The anon key below is safe to ship
 * to the client for exactly that reason — it has no privileges on its own.
 *
 * Session tokens are persisted to localStorage by the SDK and refreshed
 * automatically; magic-link redirects are parsed out of the URL on load
 * (detectSessionInUrl, on by default).
 *
 * IMPORTANT: this module must not throw at import time. `output: "export"`
 * means every page — including "use client" ones — gets a prerender pass
 * during `next build`, so a synchronous throw here (e.g. missing env vars)
 * would fail the entire static export rather than just this feature. We
 * warn instead and let calls fail individually at runtime.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — copy .env.local.example to .env.local and fill in your project's values. Auth and data calls will fail until this is set."
  );
}

export const supabase = createClient(supabaseUrl ?? "https://placeholder.supabase.co", supabaseAnonKey ?? "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
