#!/usr/bin/env node
// Claude Code WorktreeRemove hook.
//
// Fires when a worktree is removed (session exit or subagent finish).
// This hook CANNOT block removal — it is for side effects only. Exit codes
// and stderr are ignored. stdin receives JSON: { worktree_path, branch, ... }
//
// Delegates to the shared .worktree-hooks/lib/teardown.sh so the cleanup
// logic is identical to what tbd runs via .worktree-hooks/archive.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const log = (msg) => process.stderr.write(`[worktree-remove] ${msg}\n`);

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let data = {};
try {
  data = JSON.parse(raw);
} catch {
  // nothing we can do; removal proceeds regardless
}

const worktree = data.worktree_path;
if (!worktree) process.exit(0);

// Resolve the shared teardown script relative to the worktree's own checkout
// (each worktree has its own copy of the tracked .worktree-hooks/ dir).
const script = join(worktree, '.worktree-hooks', 'lib', 'teardown.sh');
if (existsSync(script)) {
  try {
    execFileSync('bash', [script], {
      env: { ...process.env, WT_PATH: worktree },
      stdio: ['ignore', 'inherit', 'inherit'],
    });
  } catch (e) {
    log(`teardown failed: ${e.message}`);
  }
}
