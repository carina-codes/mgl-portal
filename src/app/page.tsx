"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, Lock, Mail, CheckCircle2 } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    // /login reads the freshly-loaded profile role and routes to the right portal.
    router.push("/login");
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    });
    setSubmitting(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setMagicLinkSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">M</div>
          <div>
            <div className="text-sm font-semibold">MGL Agency</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Workspace Portal</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "password" ? "Sign in to your workspace" : "Get a sign-in link"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "password"
                ? "Owner and manager access for the MGL Agency operating system."
                : "Enter the email your invite was sent to and we'll email you a one-time link."}
            </p>
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="panel p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mglagency.com"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all cursor-pointer"
              >
                {submitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="panel p-6 space-y-4">
              {magicLinkSent ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">Check your inbox</p>
                  <p className="text-xs text-muted-foreground">
                    We sent a one-time sign-in link to {email}. It expires after first use.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Email address</label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {submitting ? "Sending…" : "Email me a link"} <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === "password" ? (
              <>
                Client or team member?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("magic-link");
                    setError(null);
                  }}
                  className="font-medium text-foreground underline underline-offset-2 cursor-pointer"
                >
                  Get a sign-in link
                </button>{" "}
                instead.
              </>
            ) : (
              <>
                Owner or manager?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("password");
                    setError(null);
                    setMagicLinkSent(false);
                  }}
                  className="font-medium text-foreground underline underline-offset-2 cursor-pointer"
                >
                  Sign in with a password
                </button>{" "}
                instead.
              </>
            )}
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground select-none">
        © 2026 MGL Agency
      </footer>
    </div>
  );
}
