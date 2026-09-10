-- Caches the short-lived Drive access token alongside the refresh
-- token, so getDriveContext() doesn't hit Google's OAuth endpoint on
-- every single call.
alter table public.oauth_tokens
    add column access_token text,
    add column access_token_expires_at timestamp with time zone;
