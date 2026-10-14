# NEBULA — Agent Instructions

## Project

NEBULA is a 2D browser Bullet Heaven built with TypeScript, Phaser 4, Vite and Vitest.

Current priority:
build the smallest playable core before expanding architecture or content.

Target:
Desktop Web, Mobile Web, Yandex Games.

## Read Before Work

Always read:

1. the active task
2. this file
3. docs/CURRENT_STATE.md

Read only when relevant:

- docs/ARCHITECTURE.md — technical boundaries
- docs/GAME_DESIGN.md — gameplay/product decisions
- docs/TASK_GRAPH.md — dependencies and sequencing

Inspect only code relevant to the active task.

Do not read the entire repository without a reason.

## Commands

Development:

npm run dev

Validation:

npm run typecheck
npm test
npm run build
npm run check

Before finishing:

git diff
git diff --check

## Task Rule

Implement only the active task.

Future nodes in TASK_GRAPH.md are not authorization to implement them.

Make the smallest correct change that satisfies the acceptance criteria.

If the task requires unrelated work or an architecture change, report it instead of silently expanding scope.

## Architecture Rule

Prefer:

real requirement
> minimal implementation
> repeated real use case
> abstraction if justified

Do not introduce without architectural approval:

- ECS frameworks
- dependency injection
- global service locator
- global event bus
- generic plugin systems
- universal modifier systems
- multiplayer/network architecture
- generic world generation
- large new dependencies

Do not create APIs solely because they may be useful later.

## Phaser and Game Logic

Use Phaser primarily for:

- rendering
- scenes
- input
- camera
- assets
- audio
- visual effects

Keep meaningful gameplay rules testable without rendering when practical.

Do not build a separate framework merely to isolate Phaser.

## Content

Use configuration/data for differences in values.

Use code for differences in behavior.

Do not create separate classes for balance-only variants.

## Dependencies

Do not add npm packages unless the active task clearly requires one.

Any proposed dependency must be justified before installation.

## Tests

Test meaningful game logic.

Never:

- remove a failing test just to make checks pass
- weaken assertions without justification
- hide errors with broad ts-ignore usage
- disable TypeScript strictness to avoid fixing an issue

Do not create meaningless placeholder tests.

## Refactoring

Refactor only for a concrete current problem.

Avoid unrelated refactoring during feature work.

If technical debt does not block the task, report it separately.

## Documentation

docs/CURRENT_STATE.md contains only what actually works now.

Update it when implementation state materially changes.

docs/TASK_GRAPH.md tracks task status and sequencing.

Do not use documentation as a changelog; Git stores history.

## Git

Keep changes scoped to the active task.

The user creates the final commit after architect approval.
Never commit, push, merge, delete branches, reset user work, restore unrelated files,
amend, rebase or force push unless a future task explicitly authorizes that exact operation.

Do not combine gameplay work with unrelated formatting, architecture changes or refactoring.

## Post-Task Architect Review

After every implementation task:

1. Run task-required validation and manual/runtime checks. Unless the task explicitly
   requires otherwise, run at least `npm run check` and `git diff --check`.
2. Run `git status --short`, `git diff --stat` and `git diff --check`. Identify modified,
   deleted and untracked files; unstaged diffs do not include untracked files.
3. After successful validation, stage only active-task files, using explicit paths.
   Never stage `.codex-review/`, temporary diffs, logs, build output, secrets or unrelated
   user changes. Leave unrelated changes untouched and report them; do not discard or overwrite them.
4. Run `git status`, `git diff --cached --stat` and `git diff --cached --check`.
   Review `git diff --cached` to confirm only the active task is staged, including new files.
5. Create the ignored `.codex-review/<TASK-ID>-review.txt` with these self-contained sections:
   - TASK: task ID and title.
   - BRANCH: current branch.
   - BASE: HEAD commit hash and subject before the user's final commit.
   - IMPLEMENTATION SUMMARY: concise description of changes.
   - STAGED FILES: exact staged paths and statuses.
   - UNRELATED WORKING TREE FILES: remaining unrelated modified/untracked files, or NONE.
   - DIFF STAT: output of `git diff --cached --stat`.
   - DIFF CHECK: pass/fail.
   - QUALITY CHECKS: executed commands, pass/fail and important warnings only.
   - MANUAL VERIFICATION: checks actually performed.
   - SCOPE CONFIRMATION: whether later tasks and out-of-scope functionality were avoided.
   - RISKS / UNCERTAINTIES: concise, or NONE.
   - FULL STAGED DIFF: complete plain-text output of `git diff --cached --no-color`.
   The review directory itself must never be staged or included in the diff.
6. Return only a compact summary: task completed, files staged, validation result,
   manual verification result, review file path and unrelated working-tree changes (if any).
   Include exactly: "NO COMMIT CREATED â€” awaiting architect approval."
   Do not paste the full diff into chat.

If quality or diff checks fail, staging reveals unexpected files, unrelated changes conflict,
or task scope cannot be isolated safely, do not claim review readiness. Do not commit.
Create a clearly marked failure review file if useful and report the blocking issue.

## Definition of Done

A task is DONE only when:

- acceptance criteria are satisfied
- required checks pass
- runtime smoke check passes when applicable
- no blocking runtime errors remain
- no unnecessary dependency was added
- no unrelated work was introduced
- CURRENT_STATE is accurate if project state changed

## Core Principle

IDEA
> IMPLEMENT
> PLAY
> MEASURE
> CHANGE

Build the game, not a framework for building the game.
