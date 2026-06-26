#!/usr/bin/env bash
# Shared, tool-agnostic worktree setup: install dependencies with pnpm.
# node_modules is per-worktree (gitignored, not shared across checkouts).
#
# Called by both:
#   - tbd       -> .worktree-hooks/setup  (parallel, alongside the agent)
#   - Claude    -> .claude/hooks/worktree-create.mjs
#
# Inputs (environment):
#   WT_PATH  absolute path to the worktree checkout   (required)
set -uo pipefail

: "${WT_PATH:?WT_PATH (worktree path) is required}"

cd "$WT_PATH" || { echo "[install-deps] WARN: cannot cd to $WT_PATH" >&2; exit 1; }

echo "[install-deps] pnpm install in $WT_PATH"
pnpm install
