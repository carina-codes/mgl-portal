-- Security hardening found by Supabase's advisor scan after the initial
-- schema + RLS migrations:
--   1. client_stats was a plain view, which runs with the *creator's*
--      privileges by default — meaning it silently bypassed RLS and let any
--      authenticated user see every client's aggregated stats. Postgres 15+
--      views support `security_invoker` to fix this.
--   2. The SECURITY DEFINER helper functions used by RLS policies
--      (current_role, is_admin, etc.) didn't pin `search_path`, which is a
--      classic Postgres privilege-escalation vector (a malicious search_path
--      could shadow `public.` objects). Pinning it to `public` closes that.
-- Applied live via the Supabase MCP on 2026-08-11; captured here so the
-- local migration history matches the live database.

alter view public.client_stats set (security_invoker = on);

create or replace function public.is_admin()
returns boolean
language sql stable set search_path = public as $$
  select public.current_role() in ('owner', 'manager');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable set search_path = public as $$
  select public.current_role() in ('owner', 'manager', 'team');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql set search_path = public as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.client_id is distinct from old.client_id then
      raise exception 'only owner/manager may change role or client_id';
    end if;
  end if;
  return new;
end;
$$;
