-- ============================================================================
-- MGL Portal — initial Supabase schema
--
-- Mirrors the shapes in src/lib/mock-data.ts + src/lib/store.ts, normalized
-- into relational tables so Postgres/RLS can enforce access instead of the
-- client-side role switch in src/lib/role-context.tsx.
--
-- Design notes:
--   * `profiles` extends auth.users (1:1, id shared). Fields that are safe
--     for any authenticated user to read (name, title, avatar) live here.
--     Sensitive fields (hourly rate, internal notes, magic-link token) live
--     in `profiles_private`, readable only by owner/manager.
--   * Array/relation fields on the mock types (Project.team, Task.assignees,
--     Task.followers) become join tables so RLS can check membership.
--   * Denormalized counters on Client (projects, openRequests, hoursMonth)
--     are dropped in favor of views computed from the real tables — do not
--     recreate them as stored columns, they will drift.
--   * `additionalContacts`, `socialLinks`, `shortcuts`, `customFields`,
--     `emergencyContact`, `notifications` stay as jsonb — they're display
--     bags with no relational access-control need.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('owner', 'manager', 'team', 'client');
create type public.user_status as enum ('available', 'busy');
create type public.client_status as enum ('active', 'paused', 'archived');
create type public.client_health as enum ('healthy', 'watch', 'at-risk');
create type public.preferred_contact_method as enum ('email', 'phone', 'messages');
-- 'on_hold' isn't in the app's ProjectStatus TS union (mock-data.ts) but the
-- store's archiveProject() sets it anyway (a pre-existing inconsistency) —
-- included here so that call doesn't fail against a real database.
create type public.project_status as enum ('planning', 'in_progress', 'ongoing', 'review', 'completed', 'on_hold');
create type public.project_type as enum ('fixed', 'hourly', 'retainer');
create type public.project_visibility as enum ('private', 'team', 'client');
create type public.task_stage as enum ('todo', 'in_progress', 'in_review', 'completed');
create type public.priority as enum ('low', 'medium', 'high');
create type public.request_type as enum ('revision', 'new_task', 'new_project', 'meeting', 'question');
create type public.request_status as enum ('submitted', 'under_review', 'closed', 'approved', 'convert', 'withdrawn');
create type public.thread_type as enum ('project', 'task', 'request');
create type public.visibility_scope as enum ('internal', 'client');
create type public.storage_provider as enum ('gdrive', 'dropbox', 'onedrive', 'box');
create type public.share_status as enum ('active', 'disabled');
create type public.share_permission as enum ('owner', 'admin', 'edit', 'comment', 'view');

-- ---------------------------------------------------------------------------
-- Helpers (created early; bodies rely on tables defined below but Postgres
-- resolves function bodies lazily, so this ordering is fine)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  sub_industry text,
  logo_color text not null default '#0049FE',
  logo_url text,
  contact text not null,
  contact_email text not null,
  contact_avatar text,
  contact_phone text,
  contact_role text,
  status public.client_status not null default 'active',
  retainer text,
  since date,
  health public.client_health not null default 'healthy',
  website text,
  phone text,
  business_email text,
  timezone text,
  address text,
  zip_code text,
  country text,
  state text,
  city text,
  description text,
  preferred_contact_method public.preferred_contact_method,
  working_hours text,
  preferred_meeting_times text,
  availability_notes text,
  map_directions_link text,
  notes text,
  currency text default 'USD',
  tags text[] not null default '{}',
  additional_contacts jsonb not null default '[]',
  social_links jsonb not null default '{}',
  shortcuts jsonb not null default '[]',
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Staff-only detail. Split out of `clients` so RLS on the wide table doesn't
-- have to special-case a single column.
create table public.client_private (
  client_id uuid primary key references public.clients(id) on delete cascade,
  internal_notes text
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, -- set for role = 'client'
  name text not null,
  email text not null,
  role public.app_role not null default 'client',
  title text,
  status public.user_status,
  avatar text, -- initials
  color text not null default '#0049FE',
  bio text,
  phone text,
  timezone text,
  working_hours text,
  address text,
  city text,
  state text,
  zip_code text,
  linkedin text,
  github text,
  shortcuts jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Staff-only detail: billing/comp info and the magic-link share token.
-- Never select this table from a client-facing query.
create table public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hourly_rate numeric(10, 2),
  financial_type text,
  financial_amount numeric(10, 2),
  emergency_contact jsonb,
  internal_notes text,
  member_share_token text unique -- grants magic-link access to /team for this member
);

-- Auto-create a profile row when a new auth user is provisioned. Role and
-- name are expected in raw_user_meta_data at signup/invite time; defaults
-- to 'client' if omitted so nothing lands in a privileged role by accident.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  status public.project_status not null default 'planning',
  type public.project_type not null default 'fixed',
  visibility public.project_visibility not null default 'team',
  budget numeric(12, 2) not null default 0,
  spent numeric(12, 2) not null default 0,
  hours_estimate numeric(8, 2) not null default 0,
  hours_logged numeric(8, 2) not null default 0,
  start_date date,
  end_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  lead_id uuid references public.profiles(id) on delete set null,
  description text,
  accent text,
  notifications jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Replaces Project.team: string[]
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members (user_id);

-- Replaces Client.shareLinks (ProjectShareLink) — magic-link project sharing
create table public.project_share_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  token text not null unique,
  status public.share_status not null default 'active',
  permission public.share_permission not null default 'view',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  note text,
  stage public.task_stage not null default 'todo',
  priority public.priority not null default 'medium',
  progress smallint not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  estimated_hours numeric(6, 2),
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table public.task_followers (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Requests (client-submitted)
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  type public.request_type not null,
  title text not null,
  description text,
  status public.request_status not null default 'submitted',
  priority public.priority not null default 'medium',
  estimated_hours numeric(6, 2),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  submitted_at timestamptz not null default now()
);

create index requests_client_id_idx on public.requests (client_id);
create index requests_project_id_idx on public.requests (project_id);

-- ---------------------------------------------------------------------------
-- Documents (metadata; blobs live in Supabase Storage)
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  folder text not null default 'General',
  storage_path text, -- path within the `documents` Storage bucket
  size_bytes bigint,
  preview_url text,
  shared boolean not null default false, -- visible to the client portal
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create index documents_project_id_idx on public.documents (project_id);

-- Polymorphic attachment links (Task.attachmentDocIds, ClientRequest.attachmentDocIds)
create table public.document_links (
  document_id uuid not null references public.documents(id) on delete cascade,
  thread_type public.thread_type not null,
  thread_id uuid not null,
  primary key (document_id, thread_type, thread_id)
);

-- ---------------------------------------------------------------------------
-- Comments (polymorphic: attaches to a project, task, or request)
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_type public.thread_type not null,
  thread_id uuid not null,
  author uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  visibility public.visibility_scope not null default 'internal',
  created_at timestamptz not null default now()
);

create index comments_thread_idx on public.comments (thread_type, thread_id);

-- ---------------------------------------------------------------------------
-- Time entries
-- ---------------------------------------------------------------------------
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  date date not null,
  hours numeric(5, 2) not null check (hours > 0),
  note text,
  billable boolean not null default true
);

create index time_entries_project_id_idx on public.time_entries (project_id);
create index time_entries_user_id_idx on public.time_entries (user_id);

-- ---------------------------------------------------------------------------
-- Messages / channels
-- ---------------------------------------------------------------------------
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  last_message text,
  last_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  visibility public.visibility_scope not null default 'internal',
  created_at timestamptz not null default now()
);

create index messages_channel_id_idx on public.messages (channel_id);

-- Replaces Channel.unread (was a stored int; unread is inherently per-user)
create table public.channel_reads (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Storage connections (Google Drive / Dropbox / OneDrive / Box integrations)
-- ---------------------------------------------------------------------------
create table public.storage_connections (
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider public.storage_provider not null,
  connected boolean not null default true,
  connected_at timestamptz not null default now(),
  email text,
  primary key (user_id, provider)
);

create table public.project_storage_mappings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider public.storage_provider not null,
  email text not null,
  folder_name text not null,
  connected_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI action log (internal audit trail — owner/manager visibility only)
-- ---------------------------------------------------------------------------
create table public.ai_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  icon_key text not null,
  title text not null,
  meta text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Computed views — replace the denormalized counters that lived on Client
-- (projects, openRequests, hoursMonth). Read these instead of storing and
-- manually keeping counters in sync.
-- ---------------------------------------------------------------------------
create view public.client_stats as
select
  c.id as client_id,
  count(distinct p.id) filter (where p.status <> 'completed') as active_projects,
  count(distinct r.id) filter (where r.status in ('submitted', 'under_review')) as open_requests,
  coalesce(sum(te.hours) filter (
    where te.date >= date_trunc('month', now())
  ), 0) as hours_this_month
from public.clients c
left join public.projects p on p.client_id = c.id
left join public.requests r on r.client_id = c.id
left join public.time_entries te on te.project_id = p.id
group by c.id;
