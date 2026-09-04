# Accounts v2 Roadmap

> Status: planning doc, not yet built beyond what's noted as "existing" below.
> Written 2026-09-03. If you're picking this up, read this whole doc before
> touching schema — the ordering and the "don't build" notes matter as much
> as the "build" notes.

## Context

The Accounts module (`src/components/atomic-crm/accounts/`) currently
supports: manual transaction entry, PDF bank-statement import with
password-protected-PDF parsing (`statementParser.ts`), a flat admin-editable
category list (`transactionCategories` in Settings), keyword-based
auto-categorization on import (`categoryRules`), and a dashboard
(`AccountsDashboard.tsx`) that already groups income/expense and balance
trend **by month** and ranks top categories.

The user (who runs both a small software business and their personal
finances through the same bank account) wants meaningfully more: real
week/month drill-down, budgets, a Khatabook-style personal lending ledger,
tracking of unavoidable recurring expenses (EMI, class fees, etc.), and
eventual visibility into client payment cycles (receivables). All of this
should live in the **same app and database** as everything else for now —
explicitly not split into a separate app/DB until it gets complicated
enough to warrant it (the user's own words).

## The one architectural principle everything below follows

**Don't build five separate systems.** A budget, a lending ledger, a
recurring-expense tracker, and a receivables view are not separate apps —
they are dimensions on top of the `transactions` table that already exists,
plus a small number of "expected/future" tables that eventually resolve
into real transaction rows. Every feature below is designed to extend the
existing spine, not fork it. In particular:

- **The Khatabook lending ledger is not a parallel money-tracking system.**
  Giving or receiving a personal loan is a real cash event — it must also
  create a normal `transactions` row (category `personal-loan`, linked back
  to the loan), or the bank total and the "who owes me" total will silently
  disagree the first time someone forgets to update one of the two places.
  One event, two views on it.
- **Recurring expenses are not auto-detected from bank statement text.**
  UPI/NEFT reference numbers change every occurrence (confirmed against
  real statement data this session — e.g. the same hosting charge shows a
  different transaction ID every month), so pattern-matching on raw
  description text is unreliable. The user marks a transaction as matching
  a recurring expense once; the app remembers that mapping for future
  imports via the existing `categoryRules`-style keyword mechanism.
- **Receivables are a Deals feature that touches Accounts, not the other
  way around.** Don't build invoicing logic inside `accounts/`. This
  overlaps with a previously-discussed (not yet built) "time tracking →
  billing" idea — treat it as its own scoped project when it's time, not a
  bolt-on here.

## Personal vs. business: one DB, one new column, not a split

Do **not** split into separate apps/databases for this. That's the right
call later, not now — specifically: split when a second person needs to
see *only* the business side, or when tax/audit needs a clean separate
export. Neither applies today.

What's actually needed instead: a `scope` column (`'business' | 'personal'`)
on `transactions` (and on the new `loans`/`recurring_expenses` tables
below). Every report, budget, and dashboard view takes a scope filter, so
"personal only" / "business only" / "everything" is a `where` clause, not a
different database. This is the one change that touches every existing
transaction row, so do it **early** (see build order) — retrofitting it
onto a large table later means a bulk-categorization pass on old data, not
just a schema change.

## Feature-by-feature plan

### 1. Week/month clarity
No new schema. `AccountsDashboard.tsx` already groups by month
(`startOfMonth` + a monthly bar/line chart) — add an equivalent week
grouping (`startOfWeek` from `date-fns`, already a dependency) alongside
it, and a real drill-down page/route to browse a specific month's
transactions rather than only seeing it as one bar on a chart. Lowest risk,
immediate value — do this first.

### 2. Recurring flag + categorization cleanup
Add a `recurring_expense_id` (nullable FK, added once the table below
exists) to `transactions`, and treat "mark as recurring" as a one-time
action a user takes on a transaction that then feeds `recurring_expenses`
matching for future imports. Don't pre-build a subcategory taxonomy
speculatively — only add subcategories once real categorized data shows a
genuine need for one.

### 3. `scope` column
```sql
alter table public.transactions add column scope text not null default 'business';
alter table public.transactions add constraint transactions_scope_check check (scope in ('business', 'personal'));
```
Same column (with its own check constraint) on `loans` and
`recurring_expenses` once those exist, so a personal EMI and a business one
are both trackable without cross-contaminating either scope's totals.
Update `TransactionInputs.tsx`/`StatementUploadDialog.tsx` to let the user
set scope per transaction (manual entry) or per-row during statement import
review (bulk default + per-row override, same UI shape the existing
category-assignment step already uses).

### 4. Budgets
```sql
create table public.budgets (
    id bigint generated by default as identity primary key,
    category text not null,
    scope text not null default 'business',
    month date not null, -- always the 1st of the month
    amount numeric(12,2) not null,
    sales_id bigint, -- audit trail (who set it), NOT a scoping key -- see note below
    created_at timestamp with time zone not null default now(),
    unique (category, scope, month)
);
```
Dashboard adds an actual-vs-budget comparison per category for the
selected month. Admin-only, same RLS shape as `transactions`/
`statement_imports` (see `05_policies.sql`'s existing "Admin only" policy on
`transactions` — Accounts is fully admin-only in this app, not
self-service, per `ACCOUNTS_RESOURCES` in `canAccess.ts`).

**`sales_id` is audit-trail-only here, not a scoping column, and the unique
constraint deliberately excludes it** — caught in review before this was
built: `transactions`' own RLS (`05_policies.sql:192`, `is_admin()` for all
rows) already means every admin shares one ledger, not a per-admin one. If
`sales_id` were in the unique constraint, two different admins could each
set a different budget for the same category+month and both would be
"valid" — which isn't "each admin has their own budget," it's a bug, since
there's only one shared ledger. Keep this in mind for `loans`/
`recurring_expenses` too if either ever needs a uniqueness constraint:
`sales_id` stays an audit column on those as well, never part of a scoping
key.

### 5. Khatabook-style lending ledger
```sql
create table public.people (
    id bigint generated by default as identity primary key,
    name text not null,
    phone text,
    sales_id bigint,
    created_at timestamp with time zone not null default now()
);

create table public.loans (
    id bigint generated by default as identity primary key,
    person_id bigint not null references public.people(id) on delete cascade,
    direction text not null, -- 'given' (I lent) | 'received' (I borrowed)
    amount numeric(12,2) not null,
    scope text not null default 'personal',
    settled boolean not null default false,
    settled_at timestamp with time zone,
    transaction_id bigint references public.transactions(id) on delete set null,
    notes text,
    sales_id bigint,
    created_at timestamp with time zone not null default now(),
    constraint loans_direction_check check (direction in ('given', 'received'))
);
```
Creating a loan should offer to also create the linked `transactions` row
(amount signed per direction, category `personal-loan`) in the same flow —
not as two separate manual steps a user can forget to keep in sync. A
per-person view sums `loans` by direction/settled status ("who owes me,
who I owe, how much"). This is likely the single highest personal-value
piece of this whole roadmap given how it was described — a strong
candidate for build order #2 if the user would rather have it sooner than
the sequence below suggests.

### 6. Recurring / unavoidable expenses
```sql
create table public.recurring_expenses (
    id bigint generated by default as identity primary key,
    name text not null, -- "Car EMI", "Insiya's class fees"
    amount numeric(12,2) not null,
    category text,
    scope text not null default 'personal',
    due_day integer not null, -- 1-28, day of month it's due
    active boolean not null default true,
    sales_id bigint,
    created_at timestamp with time zone not null default now(),
    constraint recurring_expenses_due_day_check check (due_day between 1 and 28)
);
```
Powers two things: an "already spoken for this month" total shown before
budgeting the rest, and a matching step during statement-import review
(tag a real imported transaction against a recurring expense once, remembered
after).

### 7. Client payment cycles / receivables
Deliberately last, and deliberately not scoped in detail here — it's a
Deals-side feature (expected amount + due date + status per Deal/Company),
overlapping with the previously-discussed time-tracking → invoicing idea.
Plan it separately when its turn comes rather than reverse-engineering it
from this doc.

## Recommended build order

1. Week/month drill-down (no schema risk)
2. `scope` column (touches every existing row — do before more data piles up)
3. Recurring flag + `recurring_expenses`
4. Budgets
5. Khatabook lending ledger (`people` + `loans`)
6. Client receivables (own project, later, not detailed here)

Note step 5 could reasonably move earlier (to #2 or #3) if personal-ledger
tracking turns out to be more urgent day-to-day than the ordering above
assumes — it was called out by the user as a named, specific want
("khatabook app style thing"), not inferred. Confirm with the user before
resequencing rather than assuming.

## Process note
Per this repo's standing workflow: one GitHub issue + branch + PR per item
above, not direct pushes to `main`. Schema/RLS changes get pushed live via
`supabase db push` as part of that PR's work, same as every other feature
in this codebase's history — see recent PRs (Personal Notes, PM module,
HRMS, Leads contact-attempt log) for the exact shape: migration file +
mirrored into all four `supabase/schemas/*.sql` files + a real (not
rubber-stamp) code review pass before merge.
