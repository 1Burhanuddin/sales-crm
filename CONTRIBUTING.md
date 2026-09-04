# Contributing

This is a small, privately-used app (not accepting outside contributions), but the workflow below is how every change — human or Claude Code — gets made, so it's written down rather than re-derived each time.

## Workflow

1. **Open an issue** (`gh issue create`) describing the change.
2. **Branch off `main`** (`git checkout -b <descriptive-name>`) — never commit directly to `main`.
3. **Make the change.** If it touches the database, see "Schema changes" below.
4. **Verify before committing:**
   ```sh
   npm run typecheck
   npm run lint
   npm run build
   ```
5. **Commit** with a message that explains *what* changed and, for anything non-obvious, *why* — reviewers (including a future Claude Code session) read the commit log, not just the diff.
6. **Push and open a PR** (`gh pr create`) that closes the issue.
7. **Review before merge.** Use the `code-review` skill (multi-agent: line-by-line scan, removed-behavior audit, cross-file tracer, duplication, simplification, efficiency, architecture, conventions) on every non-trivial PR. It has repeatedly caught real, ship-blocking bugs — broken form controls, cascading-delete data loss, missing validation, RLS gaps, double-counted totals, race conditions — that a self-review missed. Fix what it finds, then re-verify (step 4) before merging.
8. **Merge** (`gh pr merge --squash --delete-branch`).
9. **Deploy** (see below) when the change is user-facing, or immediately for anything security-relevant (RBAC, RLS).

## Schema changes

Database changes are **not** gated behind PR merge the way frontend code is. A migration is pushed live via `supabase db push` once it's been reviewed (same review bar as code — step 7 above), even if the PR hasn't merged yet, since:
- Postgres has no concept of a "draft" migration sitting inertly on a branch.
- Leaving a reviewed schema change unapplied blocks any further work that depends on it.

Always mirror a migration into the matching `supabase/schemas/*.sql` file(s) in the same commit — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#schema-change-workflow) for the full checklist (grants, `db push --dry-run` first, etc.).

If a migration hasn't merged yet and a review finds a real bug in it, editing the migration file in place (rather than adding a follow-up migration) is fine — it's not live-and-immutable until it's actually been applied to the real database. Once `db push` has run, treat it as immutable; fix forward with a new migration instead.

## Deploying

```sh
npm run build
npx wrangler pages deploy dist --project-name=crm --branch=main
```

Edge function changes need a separate deploy:

```sh
npm run supabase -- functions deploy <function-name>
```

Frontend deploys aren't part of the merge step automatically — deploy when the change is user-facing or was explicitly requested. A pure backend/migration change (with no frontend diff) doesn't need a Pages deploy.

## Code style

- Match the surrounding code's naming, comment density, and idioms rather than introducing a new style in one file.
- **Keep comments short.** A line is usually enough for a genuine "why" that isn't visible from the code itself (a real gotcha, a security invariant, a bug that isn't obvious). Don't narrate the change's history, alternatives considered, or how a bug was found — that belongs in the PR description or commit message, not the file.
- Reuse existing patterns before inventing new ones — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#frontend-conventions-worth-following) for the ones that come up repeatedly (lifecycle callbacks over scattered client logic, `useUpdate`/`useCreate` over raw `dataProvider` calls, URL-backed view state, etc.).
- `npm run lint:apply` / `npm run prettier:apply` before committing if either check fails.

## Where things are documented

- [README.md](README.md) — what this app is, local setup.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stack, code structure, access-control model, conventions.
- `docs/*-roadmap.md` — plans for a specific feature area (e.g. `accounts-roadmap.md`). Check for one before starting substantial work in a module; write one before starting a multi-phase feature.
- `gh issue list --state all` — the actual running history of what's shipped. Prefer this over trying to keep a hand-written changelog in sync.
