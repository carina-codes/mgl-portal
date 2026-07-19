"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { setRole } = useRole();
  const [email, setEmail] = useState("carina@mglagency.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRole("owner");
    router.push("/owner");
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
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Owner access for the MGL Agency operating system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
              </div>
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

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all cursor-pointer"
            >
              {submitting ? "Signing in…" : "Sign in"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Client or team member? Use the portal link shared with you to access your workspace.
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground select-none">
        © 2026 MGL Agency
      </footer>
    </div>
  );
}
