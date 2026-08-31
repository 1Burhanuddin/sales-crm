--
-- Data import: backfills the "Orbit Website" project into the PM module
-- from github.com/1Burhanuddin/iorbit (checked out locally at
-- C:\Users\BAPS\Desktop\iorbit) -- the studio's own marketing site
-- (Orbit & Quixsyn, sister studios). Unlike Hakimbhai/Sales Call Guard/
-- Skilluence, this repo's history is almost entirely gpt-engineer-app[bot]
-- commits (62 of 68) from an AI website builder -- those are tool
-- checkpoints, not real work sessions, so this isn't mined commit-by-
-- commit like the others. Only the 3 real human commits (2 Burhanuddin,
-- 1 Munira) get their own issues; the AI-assisted build overall gets one
-- summary issue. One genuinely-current gap (README.md is still a
-- placeholder, verified by reading the actual file) is logged as an open
-- todo -- not guessed at, checked.
-- One-off DATA import, not a schema change -- not mirrored into
-- supabase/schemas/.
--

with proj as (
  insert into public.projects (name, description, sales_id)
  values (
    'Orbit Website',
    'The studio''s own marketing site (Orbit & Quixsyn, sister studios building software/web/mobile/AI for clients). github.com/1Burhanuddin/iorbit. Built mostly via an AI website builder (gpt-engineer), with direct human refinement on top.',
    1
  )
  returning id
)
insert into public.issues (project_id, title, description, status, priority, assignee_id, sales_id, created_at, updated_at)
select proj.id, v.title, v.description, v.status, v.priority, v.assignee_id, v.sales_id, v.created_at::timestamptz, v.created_at::timestamptz
from proj, (values
  ('Build the Orbit marketing site (AI-assisted)', 'Scaffolded and iterated via an AI website builder (gpt-engineer) -- 62 of the repo''s 68 commits. Home, Services, Article/blog, Contact, Privacy Policy, and Terms of Service pages, with SEO/structured-data (JSON-LD) baked in.', 'done', 'medium', 1, 1, '2025-12-24T10:00:00+05:30'),
  ('Warm theme redesign', 'Real design pass by Munira -- warmer color palette across the site.', 'done', 'medium', 2, 2, '2026-08-19T21:25:00+05:30'),
  ('Add initial content to README.md', NULL, 'done', 'low', 1, 1, '2026-08-19T21:41:00+05:30'),
  ('Fix: restore minimal Ada color palette, keep Fraunces headings', 'Follow-up right after the warm-theme redesign -- pulled the palette back toward the original minimal look while keeping the new Fraunces heading font.', 'done', 'medium', 1, 1, '2026-08-19T21:45:00+05:30'),
  ('Write real README content', 'README.md is still just a placeholder ("a") -- checked the actual file, not assuming from the commit message.', 'todo', 'low', 1, 1, '2026-08-31T10:00:00+05:30')
) as v(title, description, status, priority, assignee_id, sales_id, created_at);
