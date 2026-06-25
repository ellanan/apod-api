#!/usr/bin/env bash
# Shared, tool-agnostic worktree teardown: remove node_modules so that
# `git worktree remove` doesn't trip over the untracked directory.
#
# Called by both:
#   - tbd       -> .worktree-hooks/archive  (before `git worktree remove`)
#   - Claude    -> .claude/hooks/worktree-remove.mjs
#
# Inputs (environment):
#   WT_PATH  absolute path to the worktree checkout   (required)
set -uo pipefail

: "${WT_PATH:?WT_PATH (worktree path) is required}"

if [ -d "$WT_PATH/node_modules" ]; then
  if rm -rf "$WT_PATH/node_modules"; then
    echo "[teardown] removed node_modules in $WT_PATH"
  else
    echo "[teardown] WARN: failed to remove node_modules" >&2
  fi
fi
