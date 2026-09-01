#!/usr/bin/env node
// Wrapper so `supabase` CLI commands always run against the right
// Supabase *account* for this repo, without ever needing `supabase
// login`/logout to switch between multiple accounts on the same
// machine. Works the same from Bash or PowerShell since it's plain
// Node, not a shell-specific env-var export.
//
// Uses SUPABASE_ACCESS_TOKEN, not `--profile` -- --profile is a real
// flag on this CLI version but doesn't actually work here (every
// profile name, including ones just created with `login --name`,
// fails with "failed to read profile: Unsupported Config Type """).
// SUPABASE_ACCESS_TOKEN is a plain, verified-working override: it's
// what the CLI already reads for CI/non-interactive auth, so it
// doesn't depend on the login/profile storage mechanism at all.
//
// One-time setup (only needs doing once per machine, not per session):
//   1. Get a Personal Access Token from the account that owns THIS
//      project, at https://supabase.com/dashboard/account/tokens.
//   2. Create .env.supabase-cli.local (gitignored, never commit this)
//      in the repo root with one line:
//        SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
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
//
// An already-set SUPABASE_ACCESS_TOKEN in the environment (e.g. CI
// secrets) is left alone and takes priority over the local file.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = path.join(repoRoot, ".env.supabase-cli.local");

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  try {
    const contents = readFileSync(envFile, "utf8");
    const match = contents.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m);
    if (match) {
      process.env.SUPABASE_ACCESS_TOKEN = match[1].trim();
    }
  } catch {
    // No local token file yet -- fall through and let the CLI use
    // whatever `supabase login` session (if any) is already active.
  }
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error(
    "No SUPABASE_ACCESS_TOKEN found. Create .env.supabase-cli.local " +
      "in the repo root with SUPABASE_ACCESS_TOKEN=<your token> " +
      "(see the comment at the top of this script), or set it in your " +
      "shell for this one command.",
  );
}

const result = spawnSync("npx", ["supabase", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
