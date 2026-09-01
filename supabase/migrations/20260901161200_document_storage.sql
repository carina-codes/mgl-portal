-- ============================================================================
-- Real file storage for documents.
--
-- documents.storage_path already existed in the schema but nothing ever
-- wrote to it — uploads only ever inserted a metadata row (name/size/folder)
-- and the app faked a local blob: preview URL for images. This adds an
-- actual private Storage bucket + RLS so uploaded bytes are really stored
-- and only reachable by people who could already see the document row
-- (same access shape as the "documents" table policies).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 104857600) -- 100 MB, matches the upload dialog's copy
on conflict (id) do nothing;

-- Mirrors "documents: member view, client views shared" (see
-- 20260811000001_rls_policies.sql) but resolved from a storage object path
-- rather than a documents.id, since storage policies only see the path.
create or replace function public.can_access_storage_object(p_path text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.documents d
    where d.storage_path = p_path
      and (public.is_project_member(d.project_id) or (d.shared and public.can_view_project(d.project_id)))
  );
$$;

-- Objects are stored at {project_id}/{document_id}/{filename} — the
-- metadata row is inserted first (see uploadDocumentRecord in
-- src/lib/data/documents.ts), so at upload time there's no documents row
-- to join to yet by storage_path. Insert/delete instead check project
-- membership straight off the path's project_id segment, same as
-- "documents: member upload"/"member delete".
create policy "documents bucket: member select"
  on storage.objects for select
  using (bucket_id = 'documents' and public.can_access_storage_object(name));

create policy "documents bucket: member insert"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_project_member(((storage.foldername(name))[1])::uuid));

create policy "documents bucket: member delete"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_project_member(((storage.foldername(name))[1])::uuid));
