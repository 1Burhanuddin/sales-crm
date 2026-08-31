-- One-off: set a temp password for insiyayeola1@gmail.com, an account
-- created via the app's "add user" flow. That flow has no password field
-- (it relies on inviteUserByEmail, which is unreliable on this project --
-- hits Supabase's send-rate-limit fast, no custom SMTP configured), so the
-- account had no usable password. Same workaround as Munira/Sakina's
-- original temp-password setup.
update auth.users
set encrypted_password = extensions.crypt('Quixsyn@2608685', extensions.gen_salt('bf')),
    updated_at = now()
where email = 'insiyayeola1@gmail.com';
