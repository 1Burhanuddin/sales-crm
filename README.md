# Quixsyn CRM

A CRM + PM + HR + Accounts platform for a small software team, built on [react-admin](https://marmelab.com/react-admin/) / [shadcn-admin-kit](https://github.com/marmelab/shadcn-admin-kit) and Supabase. Started as an import of [marmelab/atomic-crm](https://github.com/marmelab/atomic-crm) (MIT) and has grown well past the base CRM since — see [docs/STATUS.md](docs/STATUS.md) for what's actually built.

Live at <https://quixsyn.pages.dev>.

## What's in here

- **CRM**: contacts, companies, deals pipeline, leads, tasks, notes.
- **Projects**: a native issue tracker — Kanban, calendar, Gantt, sprints, milestones, burndown chart.
- **HR**: employees, leave requests, attendance, payroll.
- **Accounts**: bank statement import, transactions, budgets, recurring expenses, a personal lending ledger.
- **Personal Notes**: private notes for every role.
- Role-based access (admin / developer / accounts / notes-only / plain sales rep), enforced via Postgres RLS.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the stack, code structure, and conventions in detail.

## Local development

```sh
npm install
npm run dev
```

This points at whatever Supabase project `.env.development.local` (gitignored) configures. The tracked `.env.development` defaults to a local Docker-based Supabase instance instead — if you want that route, `make install && make start` sets one up (Docker required); see the Supabase dashboard at `http://localhost:54323` once running.

Useful scripts (see `package.json` for the full list):

```sh
npm run typecheck      # tsc --noEmit
npm run lint            # eslint
npm run build           # tsc + vite build -> dist/
npm run supabase -- <args>   # supabase CLI, authenticated via .env.supabase-cli.local
```

## Deploying

```sh
npm run build
npx wrangler pages deploy dist --project-name=quixsyn --branch=main
```

Database migrations are pushed separately (`npm run supabase -- db push`) and are not tied to a frontend deploy — see [CONTRIBUTING.md](CONTRIBUTING.md#schema-changes).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — issue → branch → PR → review → merge → deploy, for every change.

## License

MIT, courtesy of [Marmelab](https://marmelab.com) (original atomic-crm base) — see [LICENSE.md](./LICENSE.md).
