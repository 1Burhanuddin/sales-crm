--
-- Data import: backfills the "Hakimbhai Clinic & Pharmacy" project into
-- the PM module from the real git history of
-- C:\Users\BAPS\Desktop\hakimbhai-web-app (a real client project that
-- predates this CRM, so there's no original task-tracking data to import
-- -- this reconstructs an approximate task/comment history from the repo's
-- actual commits: real titles, real authors -> real assignees, real
-- timestamps). One-off DATA import, not a schema change -- intentionally
-- NOT mirrored into supabase/schemas/.
--
-- 82 issues (79 from real commits + 3
-- forward-looking open ones), 10 comments.
--

with proj as (
  insert into public.projects (name, description, sales_id)
  values (
    'Hakimbhai Clinic & Pharmacy',
    'Clinic management (patients, appointments, visits, prescriptions) with an integrated read-only pharmacy catalog, staff admin, and a supplier Purchases module. Built for Hakimbhai''s clinic.',
    1
  )
  returning id
),
new_issues as (
  insert into public.issues (project_id, title, description, status, priority, assignee_id, due_date, sales_id, created_at, updated_at)
  select proj.id, v.title, v.description, v.status, v.priority, v.assignee_id, v.due_date::date, v.sales_id, v.created_at::timestamptz, v.created_at::timestamptz
  from proj, (values
  ('Scaffold Next.js 15 + TypeScript + Tailwind v4 project', 'Initial project scaffold for Hakimbhai''s clinic + pharmacy system.', 'done', 'medium', 1, NULL, 1, '2026-07-25T21:31:00+05:30'),
  ('Add design system primitives, theme, and dark mode', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:32:00+05:30'),
  ('Build app shell: sidebar, top bar, command palette, preferences', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:33:00+05:30'),
  ('Add reusable shared component library', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:33:00+05:30'),
  ('Set up Prisma schema, Postgres adapter, and seed data', 'Core data model: patients, appointments, visits, medicines, staff.', 'done', 'medium', 1, NULL, 1, '2026-07-25T21:34:00+05:30'),
  ('Build Patients module', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:34:00+05:30'),
  ('Build Medicine Catalogue module', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:34:00+05:30'),
  ('Build Appointments module', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:35:00+05:30'),
  ('Build Visits module: guided wizard and connected timeline detail view', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:35:00+05:30'),
  ('Add cross-visit Diagnosis, Prescriptions, and Payments list views', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:35:00+05:30'),
  ('Build Settings module', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:35:00+05:30'),
  ('Wire up the Dashboard with real data', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-25T21:36:00+05:30'),
  ('Remove sidebar active-item carve effect', NULL, 'done', 'low', 1, NULL, 1, '2026-07-27T12:03:00+05:30'),
  ('Remove global Diagnosis and Prescription list pages', NULL, 'done', 'low', 1, NULL, 1, '2026-07-27T12:12:00+05:30'),
  ('Restructure app routes into a (staff) group; rebrand to Hakimbhai', 'Renamed from the placeholder Skilluence branding to Hakimbhai, and split staff-only routes into their own route group ahead of adding the customer-facing shop.', 'done', 'medium', 1, NULL, 1, '2026-07-27T14:43:00+05:30'),
  ('Redesign page header: compact single-row layout with header search', NULL, 'done', 'low', 1, NULL, 1, '2026-07-27T14:43:00+05:30'),
  ('Show patient visit history on Visit Detail; standardize row actions', NULL, 'done', 'low', 1, NULL, 1, '2026-07-27T14:44:00+05:30'),
  ('Add customer portal data model and Postgres migration', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-27T14:44:00+05:30'),
  ('Add customer authentication: signup, login, session, middleware', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-27T14:45:00+05:30'),
  ('Add Products catalogue and Orders (staff admin + customer shop)', 'First pass at letting customers order medicines online, plus the staff-side admin to manage products and orders.', 'done', 'medium', 1, NULL, 1, '2026-07-27T14:46:00+05:30'),
  ('Add appointment slot booking (admin-defined slots, customer self-booking)', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-27T14:46:00+05:30'),
  ('Remove leftover Skilluence branding from seed data and clinic form', NULL, 'done', 'low', 1, NULL, 1, '2026-07-27T16:56:00+05:30'),
  ('Add Docker setup for local development', NULL, 'done', 'medium', 1, NULL, 1, '2026-07-27T17:39:00+05:30'),
  ('Add page-change progress bar; pre-fill demo login credentials', NULL, 'done', 'urgent', 1, NULL, 1, '2026-07-27T18:21:00+05:30'),
  ('Highlight New Visit as the primary action', NULL, 'done', 'low', 1, NULL, 1, '2026-07-28T10:03:00+05:30'),
  ('Redesign the New Visit wizard: step headers, live summary, navigable stepper', NULL, 'done', 'low', 1, NULL, 1, '2026-07-28T10:03:00+05:30'),
  ('Fix Docker build: copy prisma schema before npm ci', 'Fresh clones were failing to build in Docker because npm ci ran before the Prisma schema was copied in, so the postinstall generate step had nothing to read.', 'done', 'high', 2, NULL, 2, '2026-08-08T13:17:00+05:30'),
  ('Fix README project description punctuation', NULL, 'done', 'high', 1, NULL, 1, '2026-08-10T22:35:00+05:30'),
  ('Fix account takeover via customer signup', 'Signup wasn''t checking for an existing account with the same phone number before creating a new session — a bad actor could take over another customer''s account.', 'done', 'urgent', 1, NULL, 1, '2026-08-12T17:48:00+05:30'),
  ('Guard against deleting patients with existing clinic history', NULL, 'done', 'low', 1, NULL, 1, '2026-08-12T17:49:00+05:30'),
  ('Gate hardcoded demo login credentials to non-production builds', 'The demo login shortcut (for local dev/testing) was reachable in production. Now compiled out entirely outside NODE_ENV=development.', 'done', 'urgent', 1, NULL, 1, '2026-08-12T17:50:00+05:30'),
  ('Fix checkout overselling via duplicate line items and atomic stock claims', 'Checkout could oversell stock under concurrent requests. Line items are now deduplicated and stock claims happen atomically in a single transaction.', 'done', 'urgent', 1, NULL, 1, '2026-08-12T17:51:00+05:30'),
  ('Fix New Visit wizard silently discarding edits + double-submit race', NULL, 'done', 'high', 1, NULL, 1, '2026-08-12T17:52:00+05:30'),
  ('Fix dashboard/date formatting using server-local time instead of IST', NULL, 'done', 'high', 1, NULL, 1, '2026-08-12T17:52:00+05:30'),
  ('Reject booking already-past appointment slots server-side', NULL, 'done', 'low', 1, NULL, 1, '2026-08-12T17:53:00+05:30'),
  ('Fix deleteProduct mislabeling every failure as ''has existing orders''', NULL, 'done', 'high', 1, NULL, 1, '2026-08-12T17:54:00+05:30'),
  ('Add per-staff authentication and guard the entire staff admin section', 'Every staff route now requires a real per-staff login instead of the shared demo credentials — needed before handing logins to the actual clinic staff.', 'done', 'medium', 1, NULL, 1, '2026-08-12T17:58:00+05:30'),
  ('Fix staff login card not vertically centering', NULL, 'done', 'high', 1, NULL, 1, '2026-08-13T10:46:00+05:30'),
  ('Migrate staff admin shell to Radix UI, Next 16, and react-table v9', 'Bigger-than-planned migration touching almost every staff page. Regression-tested each module (Patients, Appointments, Visits, Medicines, Orders, Settings) before merging.', 'done', 'medium', 1, NULL, 1, '2026-08-18T15:58:00+05:30'),
  ('Rework visit workflow UX: patient search, prescription/reason dropdowns, required-field indicators, stepper fix', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-18T16:33:00+05:30'),
  ('Remove Medicines shortcut and calendar widget from staff dashboard', NULL, 'done', 'low', 1, NULL, 1, '2026-08-18T16:44:00+05:30'),
  ('Add rows-per-page control to shared DataTable pagination footer', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-18T16:47:00+05:30'),
  ('Close mobile sidebar sheet on any navigation click', NULL, 'done', 'low', 1, NULL, 1, '2026-08-18T16:48:00+05:30'),
  ('Default sidebar to inset layout, reorder Appointments before Visits', NULL, 'done', 'low', 1, NULL, 1, '2026-08-18T16:50:00+05:30'),
  ('Track which staff member created/updated every clinical record, add Recent Activity log', 'Hakimbhai asked for an audit trail — every patient/visit/prescription record now tracks which staff member touched it last, surfaced as a Recent Activity feed on the dashboard.', 'done', 'low', 1, NULL, 1, '2026-08-18T17:11:00+05:30'),
  ('Remove online ordering: shop becomes a read-only catalog, Order module deleted', 'Hakimbhai decided against online payments for now — customers browse and call/visit instead of checking out online. Simplifies the compliance story too.', 'done', 'low', 1, NULL, 1, '2026-08-18T17:16:00+05:30'),
  ('Fix new-visit prescription step, clinic phone validation, slot booking, and dashboard greeting', 'Bundle of fixes from testing the new-visit flow end to end: the prescription step, clinic phone number validation (was rejecting real landline numbers), appointment slot booking, and the dashboard''s time-of-day greeting.', 'done', 'high', 2, NULL, 2, '2026-08-19T22:52:00+05:30'),
  ('Fix formatting in README.md', NULL, 'done', 'high', 1, NULL, 1, '2026-08-19T22:54:00+05:30'),
  ('Allow guests to book an appointment without an account', NULL, 'done', 'low', 1, NULL, 1, '2026-08-20T17:04:00+05:30'),
  ('Add customer tab nav, mobile-first polish, and basic rate limiting', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-20T17:18:00+05:30'),
  ('Polish shop/booking UI and remove customer login/signup entirely', NULL, 'done', 'low', 1, NULL, 1, '2026-08-21T10:24:00+05:30'),
  ('Add 1/2-day duration options, instructions dropdown, and partial payment support', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-21T10:46:00+05:30'),
  ('Add missing DB indexes, cap unbounded list queries, and fix product card aspect ratio', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-21T15:51:00+05:30'),
  ('Add prisma/load-test-seed.ts: bulk synthetic data generator for load testing', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-21T16:05:00+05:30'),
  ('Fix table pagination breaking past the 200-row server cap', NULL, 'done', 'high', 1, NULL, 1, '2026-08-21T16:35:00+05:30'),
  ('Fix rows-per-page reverting to 10 when paging with Next/Previous', NULL, 'done', 'high', 1, NULL, 1, '2026-08-21T16:42:00+05:30'),
  ('Fix column sorting (e.g. gender) not sorting the full table', NULL, 'done', 'high', 1, NULL, 1, '2026-08-21T16:53:00+05:30'),
  ('Fix search silently hiding server-side matches on phone-only queries', NULL, 'done', 'high', 1, NULL, 1, '2026-08-21T17:00:00+05:30'),
  ('Fix Activity Log to use the same server-side pagination as other tables', NULL, 'done', 'high', 1, NULL, 1, '2026-08-21T17:04:00+05:30'),
  ('Cut two DB queries per staff page navigation to save Neon compute hours', NULL, 'done', 'low', 1, NULL, 1, '2026-08-21T17:47:00+05:30'),
  ('Remove the top progress bar shown on every page navigation', NULL, 'done', 'low', 1, NULL, 1, '2026-08-21T18:07:00+05:30'),
  ('Hide raw Server Action error text from error toasts', NULL, 'done', 'low', 1, NULL, 1, '2026-08-21T18:08:00+05:30'),
  ('Add show/hide password toggle and remember-me to staff login', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-21T18:11:00+05:30'),
  ('Add product categories with staff CRUD management', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-22T11:38:00+05:30'),
  ('Add staff Orders admin module (list, edit, delete)', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-22T11:42:00+05:30'),
  ('Add shop cart, checkout, and /shop pagination + category filter', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-22T11:45:00+05:30'),
  ('Fix the ~1s frozen feeling on every staff page navigation', NULL, 'done', 'high', 1, NULL, 1, '2026-08-22T12:41:00+05:30'),
  ('Add trigram indexes so substring search stays fast past 15k+ rows', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-22T13:20:00+05:30'),
  ('Cache staff list-page queries client-side with TanStack Query', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T13:27:00+05:30'),
  ('Make shop product card''s add-to-cart a full-width labeled button', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T14:16:00+05:30'),
  ('Mobile "add" FAB: labeled pill at rest, collapses to icon while scrolling', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T14:23:00+05:30'),
  ('Hide stock counts on shop cards, replace add-to-cart toast with a floating bar', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T14:55:00+05:30'),
  ('Add search to /shop', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-22T15:18:00+05:30'),
  ('Remove shop subtitle, make add-to-cart buttons taller', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T15:52:00+05:30'),
  ('Shrink product cards on desktop shop grid', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T16:02:00+05:30'),
  ('Remove the Shop heading above the search bar on /shop', NULL, 'done', 'low', 1, NULL, 1, '2026-08-22T16:24:00+05:30'),
  ('Add a Purchases module for restocking medicines and products', 'Replaces the WhatsApp-notes-to-himself approach Hakimbhai was using to track supplier restocks with a proper Purchases module.', 'done', 'medium', 1, NULL, 1, '2026-08-24T11:19:00+05:30'),
  ('Turn Purchase supplier into a proper entity', NULL, 'done', 'low', 1, NULL, 1, '2026-08-24T12:25:00+05:30'),
  ('Add an inline "create new supplier" shortcut to the purchase form', NULL, 'done', 'medium', 1, NULL, 1, '2026-08-25T10:28:00+05:30'),
  ('QA pass on the Purchases module before wider rollout', 'Focus on the new inline supplier-creation shortcut in the purchase form — that''s the newest, least-tested bit.', 'todo', 'medium', 2, '2026-09-05', 2, '2026-08-29T11:00:00+05:30'),
  ('Add WhatsApp/SMS appointment reminders', 'Hakimbhai''s biggest ask after the launch — patients keep forgetting appointments. Send a reminder the day before via WhatsApp (or SMS as fallback).', 'todo', 'medium', 1, '2026-09-15', 1, '2026-08-30T09:30:00+05:30'),
  ('Set up production error monitoring (Sentry)', 'No visibility into runtime errors in production right now beyond checking with Hakimbhai directly. Wire up Sentry before the Purchases module goes live for real suppliers.', 'in-progress', 'high', 1, '2026-09-08', 1, '2026-08-30T14:00:00+05:30')
  ) as v(title, description, status, priority, assignee_id, due_date, sales_id, created_at)
  returning id, title
)
insert into public.issue_notes (issue_id, text, date, sales_id)
select ni.id, c.text, c.note_date::timestamptz, c.sales_id
from new_issues ni
join (values
  ('Fix account takeover via customer signup', 'Confirmed fixed in staging — re-tested the exact repro steps, no regression on the normal signup flow.', '2026-08-13T09:00:00+05:30', 1),
  ('Fix checkout overselling via duplicate line items and atomic stock claims', 'This was showing up under concurrent checkouts during load testing — the atomic claim holds up fine now.', '2026-08-13T09:15:00+05:30', 1),
  ('Migrate staff admin shell to Radix UI, Next 16, and react-table v9', 'Bigger than expected, touched almost every staff page. Regression-tested each module before merging.', '2026-08-19T09:00:00+05:30', 1),
  ('Fix new-visit prescription step, clinic phone validation, slot booking, and dashboard greeting', 'Thanks for catching the phone validation bug, that would''ve blocked real clinic landlines.', '2026-08-20T09:00:00+05:30', 1),
  ('Fix new-visit prescription step, clinic phone validation, slot booking, and dashboard greeting', 'Yeah, the clinic''s own landline kept failing signup because of the mobile-only regex.', '2026-08-20T09:20:00+05:30', 2),
  ('Fix Docker build: copy prisma schema before npm ci', 'Good catch, this was breaking every fresh clone.', '2026-08-08T14:00:00+05:30', 1),
  ('Add per-staff authentication and guard the entire staff admin section', 'Rolling this out before handing the clinic staff their logins next week.', '2026-08-13T10:00:00+05:30', 1),
  ('Add a Purchases module for restocking medicines and products', 'Hakimbhai wanted this to replace the WhatsApp-notes-to-himself approach he was using to track restocks.', '2026-08-24T11:30:00+05:30', 1),
  ('QA pass on the Purchases module before wider rollout', 'Focus on the inline supplier-creation shortcut, that''s the newest bit.', '2026-08-30T10:00:00+05:30', 1),
  ('QA pass on the Purchases module before wider rollout', 'On it, will run through the full purchase flow tomorrow.', '2026-08-30T18:00:00+05:30', 2)
) as c(issue_title, text, note_date, sales_id) on ni.title = c.issue_title;
