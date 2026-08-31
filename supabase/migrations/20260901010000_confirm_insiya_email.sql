-- insiyayeola1@gmail.com was created via auth.admin.createUser() without
-- email_confirm: true, so email_confirmed_at was left null -- login
-- correctly reports "Email not confirmed" regardless of the project's
-- "Confirm email" dashboard setting, which only governs *future* signups,
-- not already-created accounts. Confirm this existing account directly.
update auth.users
set email_confirmed_at = now(),
    updated_at = now()
where email = 'insiyayeola1@gmail.com'
  and email_confirmed_at is null;
