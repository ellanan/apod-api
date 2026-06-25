# `docs/superpowers/` — specs vs. plans

This directory holds two kinds of artifact from the brainstorming → planning → implementation workflow. They are treated differently on purpose.

## `specs/` — checked in ✅

Design specs capture **what** we're building and **why**: the problem, the
chosen design, trade-offs, and acceptance criteria. They remain useful after
the work ships as a record of intent, so they are committed to git.

## `plans/` — intentionally NOT checked in 🚫

Implementation plans are step-by-step **how-to** detail (exact edits, commands,
test cycles). Once the work is implemented, that detail is already reflected in
the git diff of the affected files — the plan is redundant scaffolding, not a
durable record. Keeping plans out of history avoids stale, misleading documents
that contradict the code they describe.

`docs/superpowers/plans/` is therefore listed in `.gitignore`.

## Rules for agents

- **Do not commit implementation plans.** Write them to
  `docs/superpowers/plans/` and leave them untracked.
- **Do not force-add** an ignored plan (`git add -f`, editing `.gitignore` to
  re-include `plans/`, etc.). If the ignore rule seems to be in your way, that
  is the rule working as intended — stop and ask the user rather than working
  around it.
- **Do commit design specs** to `docs/superpowers/specs/` as usual.
