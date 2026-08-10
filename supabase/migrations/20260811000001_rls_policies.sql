-- ============================================================================
-- MGL Portal — Row Level Security
--
-- Replaces the client-side role switch in src/lib/role-context.tsx with
-- real, server-enforced access control. Four roles (matches public.app_role):
--   owner / manager  — full internal access ("staff", "admin")
--   team             — internal access, scoped to projects they're a member of
--   client           — external, scoped to their own client_id, and only to
--                      rows/threads explicitly marked visible to clients
--
-- ASSUMPTIONS CALLED OUT BELOW (revisit if wrong):
--   1. owner and manager are treated identically ("admin") — full read/write
--      on everything. If managers should be scoped like team, split
--      is_admin() into two checks.
--   2. team can browse *all* clients/requests (agency-wide queue), but can
--      only read/write projects, tasks, documents, time entries, comments
--      and messages for projects they're a member of.
--   3. clients only ever see rows tied to their own client_id, and only
--      projects/comments/messages explicitly marked visible to clients
--      (project.visibility = 'client', comment/message.visibility = 'client').
--   4. clients never see time_entries (hourly rate/billing detail) directly —
--      only the aggregated public.client_stats view.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so they can read `profiles` even though
-- `profiles` itself has RLS enabled — avoids infinite recursion in policies)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_client_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select client_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable as $$
  select public.current_role() in ('owner', 'manager');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable as $$
  select public.current_role() in ('owner', 'manager', 'team');
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  );
$$;

create or replace function public.client_owns_project(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.client_id = public.current_client_id()
  );
$$;

-- Can this user see the project at all (staff membership, or client with
-- visibility explicitly opened to them)?
create or replace function public.can_view_project(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_project_member(p_project_id)
    or (
      public.current_role() = 'client'
      and public.client_owns_project(p_project_id)
      and exists (
        select 1 from public.projects p
        where p.id = p_project_id and p.visibility = 'client'
      )
    );
$$;

-- Resolves a polymorphic (thread_type, thread_id) — used by comments/documents.
create or replace function public.can_view_thread(p_type public.thread_type, p_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case p_type
    when 'project' then public.can_view_project(p_id)
    when 'task' then exists (
      select 1 from public.tasks t where t.id = p_id and public.can_view_project(t.project_id)
    )
    when 'request' then exists (
      select 1 from public.requests r
      where r.id = p_id
        and (public.is_staff() or (public.current_role() = 'client' and r.client_id = public.current_client_id()))
    )
    else false
  end;
$$;

-- Blocks self-serve privilege escalation: only an admin may change role or
-- client_id on a profiles row (everyone else can still edit their own bio,
-- phone, avatar, etc. via the "self" update policy below).
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.client_id is distinct from old.client_id then
      raise exception 'only owner/manager may change role or client_id';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.clients enable row level security;
alter table public.client_private enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_share_links enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_followers enable row level security;
alter table public.requests enable row level security;
alter table public.documents enable row level security;
alter table public.document_links enable row level security;
alter table public.comments enable row level security;
alter table public.time_entries enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.channel_reads enable row level security;
alter table public.storage_connections enable row level security;
alter table public.project_storage_mappings enable row level security;
alter table public.ai_action_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles / profile_private
-- ---------------------------------------------------------------------------
create policy "profiles: read staff, self, own-client peers, project teammates"
  on public.profiles for select
  using (
    public.is_staff()
    or id = auth.uid()
    or (public.current_role() = 'client' and client_id = public.current_client_id())
    or exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where pm.user_id = public.profiles.id and p.client_id = public.current_client_id()
    )
  );

create policy "profiles: admin insert" on public.profiles for insert
  with check (public.is_admin());

create policy "profiles: self or admin update" on public.profiles for update
  using (id = auth.uid() or public.is_admin());

create policy "profiles: admin delete" on public.profiles for delete
  using (public.is_admin());

create policy "profile_private: admin only" on public.profile_private for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- clients / client_private
-- ---------------------------------------------------------------------------
create policy "clients: staff read all, client reads self"
  on public.clients for select
  using (public.is_staff() or id = public.current_client_id());

create policy "clients: admin write" on public.clients for insert with check (public.is_admin());
create policy "clients: admin update" on public.clients for update using (public.is_admin());
create policy "clients: admin delete" on public.clients for delete using (public.is_admin());

create policy "client_private: admin only" on public.client_private for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- projects / project_members / project_share_links
-- ---------------------------------------------------------------------------
create policy "projects: view if member or opened to client"
  on public.projects for select
  using (public.can_view_project(id));

create policy "projects: admin insert" on public.projects for insert with check (public.is_admin());
create policy "projects: admin or member update" on public.projects for update
  using (public.is_admin() or public.is_project_member(id));
create policy "projects: admin delete" on public.projects for delete using (public.is_admin());

create policy "project_members: view if involved" on public.project_members for select
  using (public.is_admin() or user_id = auth.uid() or public.is_project_member(project_id));
create policy "project_members: admin manage" on public.project_members for insert with check (public.is_admin());
create policy "project_members: admin remove" on public.project_members for delete using (public.is_admin());

create policy "project_share_links: staff manage, client reads own" on public.project_share_links for select
  using (public.is_staff() or client_id = public.current_client_id());
create policy "project_share_links: admin write" on public.project_share_links for insert with check (public.is_admin());
create policy "project_share_links: admin update" on public.project_share_links for update using (public.is_admin());
create policy "project_share_links: admin delete" on public.project_share_links for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- tasks / task_assignees / task_followers
-- ---------------------------------------------------------------------------
create policy "tasks: view if project visible" on public.tasks for select
  using (public.can_view_project(project_id));
create policy "tasks: member insert" on public.tasks for insert
  with check (public.is_admin() or public.is_project_member(project_id));
create policy "tasks: member update" on public.tasks for update
  using (public.is_admin() or public.is_project_member(project_id));
create policy "tasks: admin delete" on public.tasks for delete using (public.is_admin());

create policy "task_assignees: view if task visible" on public.task_assignees for select
  using (exists (select 1 from public.tasks t where t.id = task_id and public.can_view_project(t.project_id)));
create policy "task_assignees: member manage" on public.task_assignees for insert
  with check (exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id)));
create policy "task_assignees: member remove" on public.task_assignees for delete
  using (exists (select 1 from public.tasks t where t.id = task_id and public.is_project_member(t.project_id)));

create policy "task_followers: view if task visible" on public.task_followers for select
  using (exists (select 1 from public.tasks t where t.id = task_id and public.can_view_project(t.project_id)));
create policy "task_followers: self follow/unfollow" on public.task_followers for insert
  with check (user_id = auth.uid() or public.is_admin());
create policy "task_followers: self unfollow" on public.task_followers for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------------
create policy "requests: staff read all, client reads own"
  on public.requests for select
  using (public.is_staff() or client_id = public.current_client_id());

create policy "requests: client submits own, staff submits any"
  on public.requests for insert
  with check (
    public.is_staff()
    or (public.current_role() = 'client' and client_id = public.current_client_id() and submitted_by = auth.uid())
  );

create policy "requests: staff manages, client edits own while submitted"
  on public.requests for update
  using (
    public.is_staff()
    or (public.current_role() = 'client' and client_id = public.current_client_id() and status = 'submitted')
  );

create policy "requests: admin delete" on public.requests for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- documents / document_links
-- ---------------------------------------------------------------------------
create policy "documents: member view, client views shared"
  on public.documents for select
  using (
    public.is_project_member(project_id)
    or (shared and public.can_view_project(project_id))
  );
create policy "documents: member upload" on public.documents for insert
  with check (public.is_project_member(project_id));
create policy "documents: member update" on public.documents for update
  using (public.is_project_member(project_id));
create policy "documents: member delete" on public.documents for delete
  using (public.is_project_member(project_id));

create policy "document_links: mirrors document visibility" on public.document_links for select
  using (exists (
    select 1 from public.documents d
    where d.id = document_id
      and (public.is_project_member(d.project_id) or (d.shared and public.can_view_project(d.project_id)))
  ));
create policy "document_links: staff manage" on public.document_links for insert with check (public.is_staff());
create policy "document_links: staff remove" on public.document_links for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- comments (polymorphic: project / task / request)
-- ---------------------------------------------------------------------------
create policy "comments: staff see all on visible thread, client sees client-visible"
  on public.comments for select
  using (
    (public.is_staff() and public.can_view_thread(thread_type, thread_id))
    or (public.current_role() = 'client' and visibility = 'client' and public.can_view_thread(thread_type, thread_id))
  );

create policy "comments: staff post any, client posts client-visible"
  on public.comments for insert
  with check (
    author = auth.uid()
    and (
      (public.is_staff() and public.can_view_thread(thread_type, thread_id))
      or (public.current_role() = 'client' and visibility = 'client' and public.can_view_thread(thread_type, thread_id))
    )
  );

create policy "comments: author or admin edit" on public.comments for update
  using (author = auth.uid() or public.is_admin());
create policy "comments: author or admin delete" on public.comments for delete
  using (author = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- time_entries — never exposed to clients directly (see public.client_stats)
-- ---------------------------------------------------------------------------
create policy "time_entries: own entries or admin, staff sees team project entries"
  on public.time_entries for select
  using (user_id = auth.uid() or public.is_admin() or (public.current_role() = 'team' and public.is_project_member(project_id)));
create policy "time_entries: self logs own time" on public.time_entries for insert
  with check (user_id = auth.uid() and public.is_staff());
create policy "time_entries: self or admin edit" on public.time_entries for update
  using (user_id = auth.uid() or public.is_admin());
create policy "time_entries: self or admin delete" on public.time_entries for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- channels / messages / channel_reads
-- ---------------------------------------------------------------------------
create policy "channels: staff all, client own-client channels"
  on public.channels for select
  using (public.is_staff() or client_id = public.current_client_id());
create policy "channels: staff manage" on public.channels for insert with check (public.is_staff());
create policy "channels: staff update" on public.channels for update using (public.is_staff());
create policy "channels: admin delete" on public.channels for delete using (public.is_admin());

create policy "messages: staff read all in scope, client reads client-visible"
  on public.messages for select
  using (
    exists (
      select 1 from public.channels c
      where c.id = channel_id
        and (public.is_staff() or (c.client_id = public.current_client_id() and public.messages.visibility = 'client'))
    )
  );
create policy "messages: post if channel accessible"
  on public.messages for insert
  with check (
    author = auth.uid()
    and exists (
      select 1 from public.channels c
      where c.id = channel_id
        and (
          public.is_staff()
          or (c.client_id = public.current_client_id() and public.messages.visibility = 'client')
        )
    )
  );
create policy "messages: author or admin edit" on public.messages for update
  using (author = auth.uid() or public.is_admin());
create policy "messages: author or admin delete" on public.messages for delete
  using (author = auth.uid() or public.is_admin());

create policy "channel_reads: self only" on public.channel_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- storage_connections / project_storage_mappings / ai_action_logs
-- (internal tooling — no client access)
-- ---------------------------------------------------------------------------
create policy "storage_connections: self or admin" on public.storage_connections for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "project_storage_mappings: staff only" on public.project_storage_mappings for all
  using (public.is_staff()) with check (public.is_staff());

create policy "ai_action_logs: admin read" on public.ai_action_logs for select using (public.is_admin());
create policy "ai_action_logs: staff insert" on public.ai_action_logs for insert with check (public.is_staff());
