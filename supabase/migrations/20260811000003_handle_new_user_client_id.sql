-- The original handle_new_user() trigger never set client_id, which meant
-- there was no way to invite a client contact into a working portal — their
-- profile would land with client_id = null and RLS's current_client_id()
-- would return null, so they'd see no projects/requests/anything. Widening
-- the trigger to read client_id out of the same invite-time metadata used
-- for role/name (see src/lib/data/clients.ts inviteClientContactRecord).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, client_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'client'),
    nullif(new.raw_user_meta_data ->> 'client_id', '')::uuid
  );
  return new;
end;
$$;
