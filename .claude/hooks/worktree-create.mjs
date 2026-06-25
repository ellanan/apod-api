#!/usr/bin/env node
// Claude Code WorktreeCreate hook.
//
// IMPORTANT: this hook REPLACES git's default worktree creation. It must:
//   1. create the worktree itself (git worktree add)
//   2. print the worktree path to stdout (only the path — nothing else)
//   3. exit 0 on success; any non-zero exit aborts worktree creation
//
// stdin receives JSON: { worktree_path, branch, cwd, session_id, ... }
// where `cwd` is the source (main) repo.
//
// The actual setup work (copy env, pnpm install) is delegated to the shared
// scripts in .worktree-hooks/lib/ so it stays identical to what tbd runs via
// .worktree-hooks/preSession and .worktree-hooks/setup.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Logs go to stderr so they never pollute the path we print on stdout.
const log = (msg) => process.stderr.write(`[worktree-create] ${msg}\n`);

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  log(`could not parse hook input: ${e.message}`);
  process.exit(2);
}

const worktree = data.worktree_path;
const branch = data.branch;
const source = data.cwd; // the main repo this worktree is created from

if (!worktree || !branch || !source) {
  log(`missing required fields (worktree_path/branch/cwd): ${raw}`);
  process.exit(2);
}

const git = (args) =>
  execFileSync('git', args, {
    cwd: source,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

// 1. Create the worktree. Handle both "branch already exists" and "new branch".
try {
  let branchExists = true;
  try {
    git(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    git(['worktree', 'add', worktree, branch]);
  } else {
    git(['worktree', 'add', '-b', branch, worktree]);
  }
  log(`created worktree at ${worktree} on ${branch}`);
} catch (e) {
  log(`git worktree add failed: ${e.stderr || e.message}`);
  process.exit(2); // aborts creation; stderr is shown to the user
}

// --- Best-effort setup via the shared .worktree-hooks/lib scripts. ---
// Failures must NOT abort creation, so each runs in its own try/catch.
const lib = join(source, '.worktree-hooks', 'lib');

const runShared = (script, env, stdoutToStderr = false) => {
  const path = join(lib, script);
  if (!existsSync(path)) {
    log(`shared script not found, skipping: ${path}`);
    return;
  }
  try {
    execFileSync('bash', [path], {
      env: { ...process.env, ...env },
      // Never let a shared script write to our stdout (reserved for the path).
      stdio: ['ignore', stdoutToStderr ? 2 : 'inherit', 'inherit'],
    });
  } catch (e) {
    log(`${script} failed (continuing): ${e.message}`);
  }
};

// preSession-equivalent: env files + .vercel link. setup-equivalent: deps.
runShared('copy-local-config.sh', { WT_PATH: worktree, WT_SRC: source }, true);
runShared('install-deps.sh', { WT_PATH: worktree }, true);

// 2. REQUIRED: print the worktree path on stdout so Claude Code knows where it is.
process.stdout.write(`${worktree}\n`);
