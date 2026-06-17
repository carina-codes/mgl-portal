"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderKanban,
  Users,
  CheckSquare,
  Settings,
  UserCog,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const projects = useStore((state) => state.projects);
  const clients = useStore((state) => state.clients);
  const tasks = useStore((state) => state.tasks);

  const runCommand = React.useCallback(
    (action: () => void) => {
      onOpenChange(false);
      action();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search term..." />
      <CommandList className="max-h-[450px] overflow-y-auto p-2">
        <CommandEmpty className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
          <Sparkles className="h-6 w-6 text-muted-foreground/40 mb-2 animate-pulse" />
          <span>No results found. Try another query.</span>
        </CommandEmpty>

        {projects.length > 0 && (
          <CommandGroup heading="Projects" className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
            <div className="space-y-1 mt-1">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={`project ${project.name}`}
                  onSelect={() => {
                    runCommand(() => router.push(`/owner/projects/${project.id}`));
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white text-xs font-bold bg-gradient-to-br", `bg-${project.accent}`)}>
                    {project.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{project.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Progress: {project.progress}% · Due {project.endDate}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        )}

        {projects.length > 0 && <CommandSeparator className="my-2" />}

        {clients.length > 0 && (
          <CommandGroup heading="Clients" className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
            <div className="space-y-1 mt-1">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client ${client.name}`}
                  onSelect={() => {
                    runCommand(() => router.push(`/owner/clients/${client.id}`));
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white text-xs font-bold"
                    style={{ backgroundColor: client.logoColor }}
                  >
                    {client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{client.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {client.industry} · Contact: {client.contact}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        )}

        {clients.length > 0 && <CommandSeparator className="my-2" />}

        {tasks.length > 0 && (
          <CommandGroup heading="Tasks" className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
            <div className="space-y-1 mt-1">
              {tasks.slice(0, 8).map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                return (
                  <CommandItem
                    key={task.id}
                    value={`task ${task.title}`}
                    onSelect={() => {
                      if (project) {
                        runCommand(() => router.push(`/owner/projects/${project.id}`));
                      }
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{task.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {project ? `Project: ${project.name}` : ""} · Stage: <span className="capitalize">{task.stage.replace("_", " ")}</span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </div>
          </CommandGroup>
        )}

        <CommandSeparator className="my-2" />

        <CommandGroup heading="Quick Actions" className="text-xs text-muted-foreground px-2 py-1.5 font-medium">
          <div className="space-y-1 mt-1">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/owner"))}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Go to Dashboard Overview</div>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/owner/settings"))}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Settings className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Go to Settings</div>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/owner/team"))}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <UserCog className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Manage Team</div>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/owner/messages"))}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Open Messages</div>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/owner/time"))}
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-sm font-semibold">Track Time</div>
            </CommandItem>
          </div>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
