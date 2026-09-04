# Status & Roadmap

A snapshot of what's built and what's planned. This file is a summary, not the source of truth — for the actual history, `gh issue list --state all` (every shipped change went through an issue + PR). For an in-progress feature area's detailed plan, check `docs/<area>-roadmap.md`.

## Built

| Module | State |
|---|---|
| **CRM core** (contacts, companies, deals, tags, tasks, notes) | Inherited from upstream atomic-crm, largely intact. This is the original product. |
| **Leads** | Pre-CRM inbound lead tracking: assignment, call/WhatsApp/email contact-attempt logging with outcomes, a last-contact-attempt view on the lead list. |
| **Projects / PM** | Kanban board, calendar view, Gantt/timeline, sprints, milestones, sub-tasks, issue comments + attachments, a sprint burndown chart. Access now scoped per-project (`member_ids`), not blanket admin-or-any-developer — see the RBAC entry below. |
| **HR** | Employees, leave requests (submit/approve/reject), attendance, payroll (salary structures + monthly payslips with server-computed totals). |
| **Accounts** | Bank statement PDF import + parsing, transactions, personal/business `scope` tagging, recurring/unavoidable expense tracking, monthly budgets (set inline from the category breakdown), a Khatabook-style personal lending ledger. See `docs/accounts-roadmap.md` — 5 of its 6 phases are done. |
| **Personal Notes** | Google-Keep-style notes (markdown, tags, pin/archive/trash, sharing), available to every role regardless of what else they can access. |
| **RBAC** | Four roles (`admin`, `developer`, `accounts`, `notes-only`) plus the plain sales-rep default, enforced at both the RLS and UI layers. Developers are scoped to projects they're a member of; there's now a dedicated Accounts role instead of Accounts being admin-only. See `docs/ARCHITECTURE.md#access-control`. |

## Planned, not started

- **Client receivables / payment cycles** — Accounts roadmap phase 6, deliberately left undetailed in `docs/accounts-roadmap.md` ("own project, later, not detailed here"). Don't start without confirming scope first — it wasn't planned to the same depth as the other phases.

Nothing else has a committed plan right now. When a new feature area is significant enough to need one, write it as `docs/<area>-roadmap.md` before starting (see `docs/accounts-roadmap.md` for the shape: context, options considered, feature-by-feature plan, recommended build order).

## Known gaps / accepted tradeoffs

Worth knowing about before assuming a gap is a bug to fix:

- **No automated test coverage for this project's own modules.** The ~23 existing unit tests only cover what was inherited from upstream (contacts/deals/notes/tasks/settings). Leads, PM, HR, Accounts, Personal Notes, and RBAC all ship on `typecheck` + `lint` + `build` + code review, not tests.
- **No CI.** All verification is run locally before merge.
- **Small user base (4 accounts as of this writing).** Some RLS policies (e.g. project membership, the accounts role) are verified by manual reasoning + live smoke tests against real data rather than a multi-user integration test, since spinning up test accounts isn't representative of how the app is actually used.
