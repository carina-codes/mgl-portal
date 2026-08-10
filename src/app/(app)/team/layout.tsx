// The old ?token= localStorage capture here was a stand-in for real auth —
// anyone with the URL got in, no verification. Real identity now comes from
// the Supabase session (see (app)/layout.tsx's guard + role-context.tsx),
// established via the magic-link flow in src/app/page.tsx, so there's
// nothing left for this layout to do.
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
