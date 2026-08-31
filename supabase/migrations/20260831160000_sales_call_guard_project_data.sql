--
-- Data import: backfills the "Sales Call Guard" project into the PM
-- module. Unlike the Hakimbhai project, this one has no git history at
-- all (C:\Users\BAPS\Desktop\sales_call_guard is not a git repo) -- so
-- this is reconstructed from the actual current state of the code and
-- its docs (README.md, docs/DEVIATIONS_FROM_PLAN.md, the original build
-- plan, and the sibling repos it spans: sales_call_guard_admin,
-- sales_call_guard_dashboard, sales_call_guard_supabase, and the now-
-- superseded sales_call_guard_backend), not commit-by-commit like
-- Hakimbhai. Dates are approximate, taken from file modification times
-- where available. One-off DATA import, not a schema change --
-- intentionally NOT mirrored into supabase/schemas/.
--
-- Solo project so far (no second contributor to attribute, unlike
-- Hakimbhai's Munira commits) -- everything is assigned to Burhanuddin.
--

with proj as (
  insert into public.projects (name, description, sales_id)
  values (
    'Sales Call Guard',
    'Company call recording + call history/analytics for the sales team, on company-owned phones. Spans this Flutter app plus three sibling repos: sales_call_guard_admin (Flutter admin app), sales_call_guard_dashboard (Next.js web dashboard), and sales_call_guard_supabase (backend, replacing an earlier custom Node/Prisma backend). Recording originally planned around Shizuku (ported from the OSS ShizuCallRecorder) but pivoted to a simpler runtime-permission MediaRecorder approach, Runo-style -- see docs/DEVIATIONS_FROM_PLAN.md.',
    1
  )
  returning id
),
new_issues as (
  insert into public.issues (project_id, title, description, status, priority, assignee_id, due_date, sales_id, created_at, updated_at)
  select proj.id, v.title, v.description, v.status, v.priority, v.assignee_id, v.due_date::date, v.sales_id, v.created_at::timestamptz, v.created_at::timestamptz
  from proj, (values
  ('Scaffold Flutter project (pubspec, folder structure, plugin stubs)', 'Hand-written scaffold ahead of the Flutter/Android SDK being installed on this machine, so the structure was ready to run as soon as tooling landed.', 'done', 'medium', 1, NULL, 1, '2026-08-11T16:30:00+05:30'),
  ('Build call log + notes module (the "Cally" half)', 'Call history, filters, and per-call notes -- standard Android APIs, no Shizuku involved. Local storage via drift.', 'done', 'medium', 1, NULL, 1, '2026-08-11T19:00:00+05:30'),
  ('Drop the call_log pub.dev package for a custom platform channel', 'call_log v4.0.0 still points its Android build at the retired JCenter repository -- fails to build outright with current AGP, not just deprecated. Replaced with a small custom MethodChannel (CallLogChannel.kt) querying CallLog.Calls directly.', 'done', 'low', 1, NULL, 1, '2026-08-12T11:00:00+05:30'),
  ('Pivot recording engine off Shizuku to a plain runtime-permission approach', 'Dropped Shizuku + bundled scrcpy-server entirely per explicit direction -- too complex to onboard. New engine requests RECORD_AUDIO/READ_PHONE_STATE as ordinary runtime permissions and uses MediaRecorder with AudioSource.VOICE_CALL (Runo-style), no root/privileged shell/provisioning dance. Verified end-to-end on a physical Realme RMX3870.', 'done', 'high', 1, NULL, 1, '2026-08-24T16:50:00+05:30'),
  ('Bump workmanager 0.5.2 -> 0.10.7', 'Old version used removed Flutter embedding v1 shim APIs that no longer exist in the current Flutter engine. No Dart-side API changes needed.', 'done', 'low', 1, NULL, 1, '2026-08-25T12:00:00+05:30'),
  ('Build rep auth module (login, onboarding, offline signup, firm creation)', 'Not in the original build plan -- added once real usage made clear reps need their own accounts and firm/company grouping, backed by Supabase auth.', 'done', 'medium', 1, NULL, 1, '2026-08-26T17:37:00+05:30'),
  ('Build analytics suite (top caller, gap-time, longest calls, average duration)', 'The "call history/analytics" half of the original brief, fleshed out well beyond the build plan''s minimal mention.', 'done', 'medium', 1, NULL, 1, '2026-08-26T18:18:00+05:30'),
  ('Build sync engine: local recordings index + Supabase upload backend', 'Superseded the plan''s "Drive first, company server later" sequencing -- went straight to a Supabase upload backend, with the Google Drive backend kept as an alternate implementation of the same UploadBackend interface.', 'done', 'medium', 1, NULL, 1, '2026-08-26T17:36:00+05:30'),
  ('Stand up Supabase project + initial schema migration', 'Replaces the earlier custom Node/Prisma backend (sales_call_guard_backend) entirely -- that repo is now legacy.', 'done', 'medium', 1, NULL, 1, '2026-08-26T12:00:00+05:30'),
  ('Build admin app (Flutter): dashboard, insights, admin/rep management, auth', 'Separate repo, sales_call_guard_admin. Real screens exist (dashboard, insights, admins list, login/signup) backed by the same Supabase project.', 'in-progress', 'medium', 1, NULL, 1, '2026-08-27T10:00:00+05:30'),
  ('Build web dashboard (Next.js): calls, reps, admins, auth', 'Separate repo, sales_call_guard_dashboard. Real pages exist for calls/reps/admins plus an auth flow and app shell, though only one commit deep so far.', 'in-progress', 'medium', 1, NULL, 1, '2026-08-31T00:00:00+05:30'),
  ('Rewrite the IT provisioning script for the new permission flow', 'provisioning/provision.ps1 is still written for the old Shizuku pairing dance (WRITE_SECURE_SETTINGS, appops grants, "Start on Boot"). Now that recording is just a runtime permission prompt, this can get much simpler -- probably just installs the APK and grants the handful of ordinary permissions silently via adb.', 'todo', 'medium', 1, NULL, 1, '2026-08-31T09:00:00+05:30'),
  ('Test recording reliability across more OEMs (Xiaomi, Oppo, Vivo)', 'Only verified on one Realme (ColorOS) device so far. VOICE_CALL access is entirely OEM-dependent with the current approach -- known to not work at all on stock Android/Pixel. Need real coverage before trusting this for the whole fleet.', 'todo', 'urgent', 1, '2026-09-10', 1, '2026-08-31T09:15:00+05:30'),
  ('Decide company phone procurement policy around OEM audio-source support', 'If the company standardizes on phones from an OEM that blocks VOICE_CALL, recording silently produces empty files there with the current approach -- no universal fallback like Shizuku would''ve given. Needs a real decision once OEM testing above is done.', 'todo', 'high', 1, '2026-09-12', 1, '2026-08-31T09:20:00+05:30'),
  ('Confirm no ShizuCallRecorder (GPL-3.0) code was carried into the new engine', 'The new recording engine (CallStateReceiver/CallRecordingService) still references ShizuCallRecorder''s call-detection broadcast-receiver *pattern*, even though Shizuku itself was dropped. Double-check that''s pattern-following and not copied code before this goes any wider, given the GPL obligations that would attach.', 'todo', 'medium', 1, NULL, 1, '2026-08-31T09:30:00+05:30'),
  ('Retire the old custom backend (sales_call_guard_backend)', 'Fully superseded by Supabase. Node/Prisma backend repo is still sitting on disk unused -- archive or delete once confident nothing still points at it.', 'todo', 'low', 1, NULL, 1, '2026-08-31T09:40:00+05:30'),
  ('Evaluate Headwind MDM for fleet lockdown', 'Only worth doing once the recording approach is proven end-to-end on 2-3 device models -- so the app/permissions can''t be uninstalled or revoked by the rep, and admins get fleet visibility.', 'todo', 'low', 1, NULL, 1, '2026-08-31T09:45:00+05:30')
  ) as v(title, description, status, priority, assignee_id, due_date, sales_id, created_at)
  returning id, title
)
insert into public.issue_notes (issue_id, text, date, sales_id)
select ni.id, c.text, c.note_date::timestamptz, c.sales_id
from new_issues ni
join (values
  ('Drop the call_log pub.dev package for a custom platform channel', 'Not worth chasing upstream for an abandoned package over a build failure -- the custom channel is about a dozen lines total (Kotlin side + Dart wrapper).', '2026-08-12T11:15:00+05:30', 1),
  ('Pivot recording engine off Shizuku to a plain runtime-permission approach', 'Verified end-to-end on a physical Realme RMX3870 -- call history reads correctly once READ_CALL_LOG/Phone permission is granted on-device. This trades Shizuku''s universality for a much simpler onboarding flow.', '2026-08-24T17:30:00+05:30', 1),
  ('Test recording reliability across more OEMs (Xiaomi, Oppo, Vivo)', 'Runo (the reference app for this exact approach) markets recording as "based on device compatibility" for this reason. Need at least one Xiaomi/Oppo/Vivo device tested before trusting this company-wide.', '2026-08-31T09:16:00+05:30', 1),
  ('Rewrite the IT provisioning script for the new permission flow', 'The whole point of the Shizuku provisioning dance was to hide onboarding complexity from reps -- with plain runtime permissions there may not be much left for this script to actually do beyond installing the APK.', '2026-08-31T09:05:00+05:30', 1)
) as c(issue_title, text, note_date, sales_id) on ni.title = c.issue_title;
