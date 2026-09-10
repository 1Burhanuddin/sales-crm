-- Caches the Drive folder id attachments get uploaded into, so the
-- upload function doesn't have to search-or-create it on every call.
alter table public.oauth_tokens
    add column drive_folder_id text;
