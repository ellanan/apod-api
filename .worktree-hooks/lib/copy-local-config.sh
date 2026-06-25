#!/usr/bin/env bash
# Shared, tool-agnostic worktree setup: seed a new worktree with the
# gitignored local config it can't get from git — env files and the Vercel
# project linkage.
#
# Called by both:
#   - tbd       -> .worktree-hooks/preSession  (blocking, before the agent)
#   - Claude    -> .claude/hooks/worktree-create.mjs
#
# Inputs (environment):
#   WT_PATH  absolute path to the worktree checkout   (required)
#   WT_SRC   absolute path to the source/main repo    (required)
set -uo pipefail

: "${WT_PATH:?WT_PATH (worktree path) is required}"
: "${WT_SRC:?WT_SRC (source repo path) is required}"

# 1. Local env files.
for f in .env .env.local .env.development.local; do
  if [ -f "$WT_SRC/$f" ]; then
    if cp "$WT_SRC/$f" "$WT_PATH/$f"; then
      echo "[copy-local-config] copied $f"
    else
      echo "[copy-local-config] WARN: failed to copy $f" >&2
    fi
  fi
done

# 2. Vercel linkage (.vercel/project.json links the dir to the Vercel project;
#    .env.preview.local holds pulled env). Skip output/ — it's build artifacts,
#    not linkage, and can be large/stale. Guard against clobbering on re-run
#    (tbd re-runs hooks when reviving an archived worktree).
if [ -d "$WT_SRC/.vercel" ] && [ ! -e "$WT_PATH/.vercel/project.json" ]; then
  if cp -R "$WT_SRC/.vercel" "$WT_PATH/.vercel"; then
    rm -rf "$WT_PATH/.vercel/output"
    echo "[copy-local-config] linked .vercel (excluding output/)"
  else
    echo "[copy-local-config] WARN: failed to copy .vercel" >&2
  fi
fi
