# Architecture

How this codebase is put together, and the conventions to follow when adding to it. See [README.md](../README.md) for setup and [CONTRIBUTING.md](../CONTRIBUTING.md) for the day-to-day workflow.

## Stack

- **Frontend**: React 19 + Vite, [react-admin](https://marmelab.com/react-admin/) (`ra-core`) with [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit) components (`@/components/admin/*`) on top of shadcn/ui + Radix primitives, Tailwind v4.
- **Backend**: Supabase — Postgres, PostgREST (the data API react-admin talks to), Row Level Security for all authorization, Supabase Auth (email/password), Edge Functions (Deno) for anything that needs to run with elevated privileges (inviting users, role changes, merging contacts).
- **Charts**: `@nivo/bar`, `@nivo/line`.
- **Hosting**: Cloudflare Pages, project `quixsyn` (live at quixsyn.pages.dev), production branch `main`. Deploy is manual: `npm run build && npx wrangler pages deploy dist --project-name=quixsyn --branch=main`. The original project (`crm`, domain `sales-crm-5bz.pages.dev`) is kept around during the migration but no longer deployed to.
- **Supabase project**: ref `vhayafnvivsswnhxnfxw`.
- **CLI auth**: `supabase` CLI commands go through `scripts/supabase.mjs` (`npm run supabase -- <args>`), which reads a personal access token from a gitignored `.env.supabase-cli.local` rather than `supabase login`/`--profile` (documented as broken in this environment — see the script's own header comment).

There is no CI. Typecheck/lint/build are run locally before every PR.

## Code structure

```
src/components/atomic-crm/
  <module>/          One directory per business module (see below), each
                      holding its own List/Create/Edit/Show/Inputs
                      components following react-admin's naming convention.
  providers/
    supabase/         dataProvider.ts, authProvider.ts -- the real backend.
    commons/           canAccess.ts (role → permission mapping), i18n
                       message files (English + French).
    fakerest/          In-memory data provider used only by Storybook/tests.
  root/               CRM.tsx (resource + route registration), ConfigurationContext.
  layout/             AppSidebar.tsx, Header.tsx -- nav is driven by the same
                      canAccess() checks as the data layer.

supabase/
  schemas/            01_tables.sql … 07_storage.sql -- the current-state
                      schema, declarative. This is what a fresh database
                      would look like; it's not run directly.
  migrations/         Timestamped, ordered SQL files -- what's actually
                      replayed against a real database. Every schema change
                      needs both: a migration (applied once, in order) and
                      the matching hand-edit to schemas/ (kept in sync as
                      documentation of current state).
  functions/          Deno edge functions (users, merge_contacts,
                      delete_note_attachments, update_password, postmark, mcp).

docs/
  ARCHITECTURE.md      This file.
  *-roadmap.md         Per-feature-area plans (e.g. accounts-roadmap.md).
```

### Modules (`src/components/atomic-crm/*`)

| Module | What it is |
|---|---|
| `contacts`, `companies`, `deals`, `tags`, `tasks`, `notes` | Core CRM — contacts, the companies they work at, the deals pipeline (Kanban), shared notes infrastructure reused by contacts/deals/issues. |
| `leads` | Pre-CRM inbound leads: contact-attempt logging (call/WhatsApp/email), outcomes, assignment. |
| `projects` | The PM/Issues module: projects, issues (Kanban + calendar + Gantt), sprints, milestones, issue comments, a burndown chart. |
| `hr` | Employees, leave requests, attendance, payroll (salary structures + payslips). |
| `accounts` | Personal/business finance tracking: bank statement import + parsing, transactions, recurring expenses, budgets, a lending ledger ("Khatabook"). |
| `personal-notes` | Google-Keep-style private notes, available to every role. |
| `sales` | The user/team-member admin screens (not the "Deals" pipeline — `sales` is react-admin's name for CRM users, inherited from upstream atomic-crm). |
| `dashboard`, `activity`, `preferences`, `settings`, `login`, `layout`, `root`, `misc`, `filters`, `simple-list` | Cross-cutting UI/infrastructure, not a business module of their own. |

## Data layer

`providers/supabase/dataProvider.ts` wraps `ra-supabase-core`'s Supabase data provider with `withLifecycleCallbacks` — a per-resource list of hooks (`beforeGetList`, `beforeSave`, etc.). Reach for a lifecycle callback, not client-side logic scattered across forms, whenever a rule must hold regardless of which UI produced the save (see the `transactions` resource's `beforeSave`, which forces `scope` to match a linked `recurring_expense_id` for every save path).

Full-text search across resources goes through one shared `applyFullTextSearch(columns)` helper, registered per-resource in `beforeGetList`. It special-cases the literal column name `"phone"` to query a `phone_fts` computed column that only exists on `contacts_summary` — don't pass `"phone"` for a resource that doesn't have that column.

Several resources (`companies`, `contacts`, `projects`, `leads`, …) have a `<name>_summary` view backing their `getList`/`getOne` calls, computing denormalized aggregates (counts, "last activity" timestamps) live via a SQL view rather than a trigger-maintained column. **Prefer this pattern** over trigger-maintained denormalization — a view can't drift out of sync with its source rows by construction, where a trigger has to be gotten right for every insert/update/delete path (and any future one).

## Access control

Two layers, and they must agree:

1. **RLS (the real enforcement)** — every table has `enable row level security` plus explicit policies in `supabase/schemas/05_policies.sql`. Role checks go through small SQL helper functions in `02_functions.sql` (`is_admin()`, `is_developer()`, `is_accounts()`, `is_notes_only()`, `can_access_lead()`, `can_access_project()`, …) rather than repeating a raw `exists (...)` subquery in every policy.
2. **`canAccess.ts` (UI-only gating)** — a synchronous, client-side mirror of the same role logic, used to hide nav items/buttons/routes a user can't act on anyway. It cannot see row-level state (e.g. *which* project a developer belongs to), so it only gates by resource + action; RLS is what actually narrows rows.

### Roles

`sales.administrator` / `is_developer` / `is_accounts` / `notes_only` are independent boolean flags on the `sales` table (not an enum), resolved to a single role by `getRole()` with a fixed priority: `admin > developer > accounts > notes-only > user`. Adding a new role means adding both a boolean flag (mirroring the existing ones) and a branch in `canAccess()` — see `docs/*-roadmap.md` or recent PRs for the pattern (e.g. the `is_accounts` role).

| Role | Scope |
|---|---|
| `admin` | Everything. |
| `developer` | The PM module, scoped to projects listed in `projects.member_ids` (admin-managed only — see `protect_project_member_ids()`); own HR self-service records; personal notes. |
| `accounts` | The Accounts module (full read/write, delete stays admin-only); personal notes. |
| `notes-only` | Personal notes and nothing else in the app. |
| `user` (plain sales rep) | Their own CRM data (`sales_id = current_sales_id()`) plus leads assigned to them; own HR self-service records; personal notes. No PM, no Accounts. |

### Ownership convention

Every user-owned table has a `sales_id` column, auto-populated on insert by the shared `set_sales_id_default()` trigger. **`sales_id` is an audit trail, not a scoping key, for any table where the RLS is `is_admin()`-for-all rather than per-owner** (e.g. `transactions`, `budgets`) — every admin (or `accounts`-role user) shares one ledger, not a per-admin one. Never add `sales_id` to a `unique` constraint on such a table; it would let two different admins each set a conflicting "valid" value for what's actually one shared resource. This was a real bug caught in review on the `recurring_expenses` and `budgets` migrations — check for it whenever building a new Accounts-style shared table.

## Schema change workflow

1. Write a new file in `supabase/migrations/`, named `<UTC-timestamp>_<description>.sql`.
2. Hand-edit the matching `supabase/schemas/*.sql` file(s) so they still describe current-state schema (table → `01_tables.sql`, function → `02_functions.sql`, trigger → `04_triggers.sql`, policy → `05_policies.sql`, grant → `06_grants.sql`).
3. `npm run supabase -- db push --dry-run` to confirm only the intended migration is pending, then `npm run supabase -- db push` for real. Migrations are pushed live **before merge**, same as any other reviewed change — a migration file sitting unmerged on a branch is still applied once it's been reviewed, since Postgres has no concept of "draft."
4. New tables need explicit `grant` statements in the migration (`06_grants.sql`'s mirror) for `anon`/`authenticated`/`service_role` — RLS is what actually restricts access, these grants just let PostgREST see the table exists. New SECURITY DEFINER functions generally don't need explicit grants; `alter default privileges` already covers them (check `can_access_lead()` for the precedent before adding one).

## Frontend conventions worth following

- **Inline-editable values** (a budget amount, a config setting) go through `useUpdate`/`useCreate` (ra-core), not a raw `dataProvider.create`/`update` call plus a manual `refresh()` — the hooks scope cache invalidation to the affected resource; a bare `refresh()` invalidates every query on the page.
- **Multi-select "list of related IDs"** (`deals.contact_ids`, `contacts.tags`, `projects.member_ids`) is a plain `bigint[]` column, not a join table, unless per-relationship metadata is actually needed.
- **URL-backed state** (`useSearchParams`), not local `useState`, for "which view am I looking at" (a selected month, a scope filter, a drill-down). Local state breaks the browser Back button and makes a view unbookmarkable. When updating the query string, always start from `new URLSearchParams(searchParams)` — the object form of `setSearchParams` replaces the whole query string rather than merging.
- **`AutocompleteInput`'s `modal` prop** must be passed through explicitly whenever the input lives inside a Radix `Dialog` — Radix dialogs are modal by default and the popover otherwise fights it for focus.
- **Client-side `required()` doesn't reject `0`** — anywhere a DB has `check (amount > 0)`, pair it with `minValue(0.01)` on the matching input, or a `0` submission hits a raw Postgres error instead of inline validation.
- **Keep comments short.** A line explaining a genuine, non-obvious "why" (a real gotcha, a security invariant, a bug that isn't visible from the code) is worth it. A paragraph narrating alternatives considered or how a bug was found is not — put that in the PR description or commit message instead.

## Testing

`npm run typecheck`, `npm run lint`, `npm run build` before every PR — no CI runs them automatically; this is the actual test suite in practice, backed up by the multi-agent code-review skill (see CONTRIBUTING.md) rather than automated assertions.

`npm run test:unit:app` (Vitest) runs the ~23 unit tests that exist, but they only cover what was inherited from upstream atomic-crm (contacts/deals/notes/tasks/settings, plus the `postmark`/`mcp` edge functions). None of this project's own modules — Leads, PM/Projects, HR, Accounts, Personal Notes, RBAC — have test coverage; `e2e/`/`.storybook/` are similarly upstream leftovers, unused for this project's own features.
