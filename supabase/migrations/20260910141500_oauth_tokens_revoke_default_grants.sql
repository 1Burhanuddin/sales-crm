-- Fix-forward: the project's standing default-privilege grants
-- auto-granted anon/authenticated on oauth_tokens despite the
-- "service_role only" intent. RLS still blocked row access, but revoke
-- the grant itself too.

revoke all on table public.oauth_tokens from anon;
revoke all on table public.oauth_tokens from authenticated;
revoke all on sequence public.oauth_tokens_id_seq from anon;
revoke all on sequence public.oauth_tokens_id_seq from authenticated;
