-- Comment.attachments (app-side: array of Document ids attached to a reply)
-- has no home in the schema yet — document_links only covers task/request
-- attachments, not individual comments. Simplest fix: a plain uuid[] column,
-- no FK enforcement (attachments are optional and best-effort; a dangling id
-- just means the client silently skips rendering that attachment).
alter table public.comments add column attachments uuid[] not null default '{}';
