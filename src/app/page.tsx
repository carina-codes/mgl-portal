import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, LayoutDashboard, Users, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "MGL Client Platform",
  description: "The operating system for a high-end digital agency.",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">M</div>
          <div>
            <div className="text-sm font-semibold">MGL</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Client Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/client"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Client portal
          </Link>
          <Link
            href="/app/owner"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Enter platform <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-12 lg:pt-20">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" /> Internal preview · v0.1
        </div>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight lg:text-6xl">
          The operating system for a high-end digital agency.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
          MGL Client Platform centralizes project execution, client requests, deliverables, time
          tracking and reporting — so the studio stops living in inboxes and starts shipping faster.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app/owner"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <LayoutDashboard className="h-4 w-4" /> Open internal dashboard
          </Link>
          <Link
            href="/app/client"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Users className="h-4 w-4" /> Preview client portal
          </Link>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Feature
            icon={LayoutDashboard}
            title="One place to run the studio"
            body="Dashboards, projects, Kanban, deliverables, time and reporting — built on a shared design language."
          />
          <Feature
            icon={MessageSquare}
            title="Clients stay in the loop"
            body="Magic-link portal with project visibility, request intake, deliverable review and conversation threads."
          />
          <Feature
            icon={Sparkles}
            title="AI that actually does work"
            body="An assistant that summarizes projects, drafts client replies and creates tasks — with every action logged."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof LayoutDashboard; title: string; body: string }) {
  return (
    <div className="panel p-6">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
