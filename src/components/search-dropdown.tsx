"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
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
  Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchDropdown() {
  const router = useRouter();
  const projects = useStore((state) => state.projects);
  const clients = useStore((state) => state.clients);
  const tasks = useStore((state) => state.tasks);

  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Toggle command palette on CMD+K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runCommand = React.useCallback(
    (action: () => void) => {
      setOpen(false);
      setSearchQuery("");
      inputRef.current?.blur();
      action();
    },
    []
  );

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md z-40">
      <Command className="overflow-visible bg-transparent border-none">
        <div className="relative flex items-center border border-border bg-card rounded-full pl-3.5 pr-12 focus-within:border-primary transition-colors duration-200">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
          <CommandPrimitive.Input
            ref={inputRef}
            placeholder="Search projects, clients, tasks..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            onFocus={() => setOpen(true)}
            className="flex h-10 w-full rounded-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground pointer-events-none select-none">
            ⌘K
          </kbd>
        </div>

        {open && (
          <CommandList className="absolute top-[calc(100%+6px)] left-0 z-50 w-full max-h-[380px] overflow-y-auto rounded-2xl border border-border bg-card p-1.5 animate-in fade-in-50 slide-in-from-top-2 duration-200 divide-y divide-border/40">
            <CommandEmpty className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center">
              <Sparkles className="h-5 w-5 text-muted-foreground/30 mb-1.5 animate-pulse" />
              <span>No results found.</span>
            </CommandEmpty>

            {projects.length > 0 && (
              <CommandGroup heading="Projects" className="px-2 py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                <div className="space-y-0.5 mt-1">
                  {projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={`project ${project.name}`}
                      onSelect={() => {
                        runCommand(() => router.push(`/owner/projects/${project.id}`));
                      }}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                    >
                      <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white text-[10px] font-bold bg-gradient-to-br", `bg-${project.accent}`)}>
                        {project.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{project.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          Progress: {project.progress}% · Due {project.endDate}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}

            {clients.length > 0 && (
              <CommandGroup heading="Clients" className="px-2 py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                <div className="space-y-0.5 mt-1">
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`client ${client.name}`}
                      onSelect={() => {
                        runCommand(() => router.push(`/owner/clients/${client.id}`));
                      }}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                    >
                      <div
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white text-[10px] font-bold"
                        style={{ backgroundColor: client.logoColor }}
                      >
                        {client.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{client.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {client.industry}{client.subIndustry ? ` · ${client.subIndustry}` : ""} · Contact: {client.contact}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}

            {tasks.length > 0 && (
              <CommandGroup heading="Tasks" className="px-2 py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
                <div className="space-y-0.5 mt-1">
                  {tasks.slice(0, 6).map((task) => {
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
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                      >
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <CheckSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{task.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {project ? `Project: ${project.name}` : ""} · Stage: <span className="capitalize">{task.stage.replace("_", " ")}</span>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            )}

            <CommandGroup heading="Quick Actions" className="px-2 py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground">
              <div className="space-y-0.5 mt-1">
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/owner"))}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-semibold">Go to Dashboard Overview</div>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/owner/settings"))}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Settings className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-semibold">Go to Settings</div>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/owner/team"))}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <UserCog className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-semibold">Manage Team</div>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/owner/messages"))}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-semibold">Open Messages</div>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/owner/time"))}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors text-foreground hover:bg-muted/70 data-[selected=true]:bg-muted/70 data-[selected=true]:text-foreground outline-none"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-xs font-semibold">Track Time</div>
                </CommandItem>
              </div>
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}
