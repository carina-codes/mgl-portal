"use client";

/**
 * Derives a real "Latest activity" feed from live store data instead of a
 * hardcoded mock list. Sources: comments, document uploads, task creation,
 * task completion/edits, new client requests, and project creation/edits —
 * each already carries a real timestamp and actor in the store, so as the
 * user does things in the app, they show up here.
 */
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { parseFuzzyDate } from "@/lib/dates";

export type ActivityType = "comment" | "status" | "file" | "task_add" | "task_update" | "request" | "project" | "project_update";

export interface ActivityItem {
  id: string;
  /** Human-readable, e.g. "Today, 11:22 AM" */
  date: string;
  type: ActivityType;
  user: string;
  project: string;
  projectId: string;
  taskName?: string;
  details: string;
  /** epoch ms, used for sorting only */
  ts: number;
}

function formatDisplayDate(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}, ${time}`;
}

/**
 * Returns real activity items across the whole workspace, newest first.
 * Callers typically filter by project and/or slice to a limit.
 */
export function useActivityFeed(): ActivityItem[] {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const documents = useStore((s) => s.documents);
  const comments = useStore((s) => s.comments);
  const users = useStore((s) => s.users);
  const requests = useStore((s) => s.requests);

  return useMemo(() => {
    const userName = (id?: string) => users.find((u) => u.id === id)?.name ?? "Someone";
    const items: ActivityItem[] = [];

    for (const c of comments) {
      const task = tasks.find((t) => t.id === c.threadId);
      const request = !task ? requests.find((r) => r.id === c.threadId) : undefined;
      const project = task
        ? projects.find((p) => p.id === task.projectId)
        : request
        ? projects.find((p) => p.id === request.projectId)
        : projects.find((p) => p.id === c.threadId);
      if (!project) continue;
      const snippet = c.body.length > 90 ? `${c.body.slice(0, 90)}…` : c.body;
      const ts = parseFuzzyDate(c.createdAt);
      items.push({
        id: `cm-${c.id}`,
        date: ts ? formatDisplayDate(ts) : c.createdAt,
        type: "comment",
        user: userName(c.author),
        project: project.name,
        projectId: project.id,
        taskName: task?.title,
        details: `Posted comment: '${snippet}'`,
        ts,
      });
    }

    for (const d of documents) {
      if (d.name === ".keep") continue; // placeholder doc used to materialize empty folders
      const project = projects.find((p) => p.id === d.projectId);
      if (!project) continue;
      const ts = parseFuzzyDate(d.uploadedAt);
      items.push({
        id: `doc-${d.id}`,
        date: ts ? formatDisplayDate(ts) : d.uploadedAt,
        type: "file",
        user: userName(d.uploadedBy),
        project: project.name,
        projectId: project.id,
        details: `Uploaded file '${d.name}'`,
        ts,
      });
    }

    for (const t of tasks) {
      const project = projects.find((p) => p.id === t.projectId);
      if (!project) continue;
      const actor = userName(t.assignees[0]);

      if (t.createdAt) {
        const ts = parseFuzzyDate(t.createdAt);
        items.push({
          id: `task-add-${t.id}`,
          date: ts ? formatDisplayDate(ts) : t.createdAt,
          type: "task_add",
          user: actor,
          project: project.name,
          projectId: project.id,
          taskName: t.title,
          details: `Added task: '${t.title}'`,
          ts,
        });
      }

      if (t.updatedAt && t.updatedAt !== t.createdAt) {
        const ts = parseFuzzyDate(t.updatedAt);
        // We only track a single "last updated" timestamp, not per-field
        // history, so we can't claim a specific stage transition happened —
        // except when the task is currently completed, which is always a
        // safe, high-signal thing to call out.
        const isCompleted = t.stage === "completed";
        items.push({
          id: `task-status-${t.id}`,
          date: ts ? formatDisplayDate(ts) : t.updatedAt,
          type: isCompleted ? "status" : "task_update",
          user: actor,
          project: project.name,
          projectId: project.id,
          taskName: t.title,
          details: isCompleted ? `Completed task '${t.title}'` : `Updated task '${t.title}'`,
          ts,
        });
      }
    }

    for (const r of requests) {
      const project = projects.find((p) => p.id === r.projectId);
      if (!project) continue; // not-yet-converted "new project" requests aren't scoped to a project
      const ts = parseFuzzyDate(r.submittedAt);
      items.push({
        id: `req-${r.id}`,
        date: ts ? formatDisplayDate(ts) : r.submittedAt,
        type: "request",
        user: userName(r.submittedBy),
        project: project.name,
        projectId: project.id,
        details: `Submitted request: '${r.title}'`,
        ts,
      });
    }

    for (const p of projects) {
      if (p.createdAt) {
        const ts = parseFuzzyDate(p.createdAt);
        items.push({
          id: `project-${p.id}`,
          date: ts ? formatDisplayDate(ts) : p.createdAt,
          type: "project",
          user: userName(p.lead),
          project: p.name,
          projectId: p.id,
          details: `Created project '${p.name}'`,
          ts,
        });
      }

      if (p.updatedAt && p.updatedAt !== p.createdAt) {
        const ts = parseFuzzyDate(p.updatedAt);
        items.push({
          id: `project-update-${p.id}`,
          date: ts ? formatDisplayDate(ts) : p.updatedAt,
          type: "project_update",
          user: userName(p.lead),
          project: p.name,
          projectId: p.id,
          details: `Updated project '${p.name}'`,
          ts,
        });
      }
    }

    return items.sort((a, b) => b.ts - a.ts);
  }, [projects, tasks, documents, comments, users, requests]);
}

/**
 * Picks which activity items to actually display: everything from the last
 * `windowDays` days, but never fewer than `minCount` — so a quiet week
 * still shows a reasonable amount of history instead of a near-empty list,
 * while a busy few days isn't artificially capped.
 */
export function selectRecentActivity(
  items: ActivityItem[],
  { minCount = 8, windowDays = 5 }: { minCount?: number; windowDays?: number } = {},
): ActivityItem[] {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const withinWindow = items.filter((a) => a.ts >= cutoff);
  return withinWindow.length >= minCount ? withinWindow : items.slice(0, minCount);
}
