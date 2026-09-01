#!/usr/bin/env node
// Wrapper so `supabase` CLI commands always run against the right
// Supabase *account* for this repo, without ever needing `supabase
// login`/logout to switch between multiple accounts on the same
// machine. Works the same from Bash or PowerShell since it's plain
// Node, not a shell-specific env-var export.
//
// One-time setup (only needs doing once per machine, not per session):
//   npx supabase login --token <personal-access-token-for-this-account> --name quixsyn
// Get a token from https://supabase.com/dashboard/account/tokens on the
// account that owns this project. --name stores it under that name
// without touching any other account's stored session.
//
// Usage: same as the real CLI, just through this script --
//   node scripts/supabase.mjs db push --password '...'
//   npm run supabase -- db push --password '...'
//
// Only matters for commands that talk to the Management API (functions
// deploy, db query --linked, link, projects list, ...). Commands that
// connect straight to Postgres (db push --password, db query --db-url)
// don't use account login at all -- this wrapper doesn't change
// anything for those, it's harmless either way.

import { spawnSync } from "node:child_process";

const PROFILE = process.env.SUPABASE_PROFILE || "quixsyn";

const result = spawnSync(
  "npx",
  ["supabase", "--profile", PROFILE, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

process.exit(result.status ?? 1);
