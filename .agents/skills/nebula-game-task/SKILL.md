---
name: nebula-game-task
description: "Implement one scoped NEBULA GAME-* task or similarly scoped implementation/refactor task using task-graph context, validation, explicit staging and architect-review handoff without committing."
---

# NEBULA Task Workflow

Use repository-root paths below. The active user/task request supplies specific requirements and takes precedence over this workflow. AGENTS.md governs repository-wide policy and the detailed review protocol; TASK_GRAPH.md defines authoritative task scope/dependencies, CURRENT_STATE.md records implemented reality, and GAME_DESIGN.md supplies relevant design requirements. Do not use this skill to override more specific task instructions.

## Read and scope

1. Read AGENTS.md and identify the active task from the user request.
2. Read docs/CURRENT_STATE.md, then only the active task section in docs/TASK_GRAPH.md when present.
3. Inspect directly relevant source files. Read docs/GAME_DESIGN.md only for relevant gameplay requirements and docs/ARCHITECTURE.md only when architectural context is needed.
4. Avoid broad repository exploration without a concrete reason. Inspect Git state to identify existing user changes before editing.

## Implement and verify

- Implement only the requested task; later task-graph nodes are not authorization. Preserve existing behavior unless the task explicitly changes it.
- Prefer the smallest correct implementation. Generalize only when a second or later concrete use case makes it necessary; avoid speculative managers, frameworks, ECS, dependency injection, event buses, generic abstractions and premature optimization.
- Add focused tracked tests for pure deterministic logic when valuable, not rendering-only tests for Phaser primitives. Ignored .codex-review/ harnesses may cover runtime cases awkward to test otherwise.
- Run npm run check, git diff --check and task-specific validation. Perform browser/manual smoke verification when visible or runtime behavior changes; report what was actually verified and any limitations.
- Update docs/CURRENT_STATE.md when implemented runtime state changes. Only after acceptance criteria and required checks pass, update statuses explicitly authorized by the active task: active task to DONE and explicitly unlocked immediate dependent task to READY. Leave later statuses unchanged unless explicitly required; refactors need not change GAME statuses.

## Architect handoff

Follow AGENTS.md's Post-Task Architect Review procedure directly rather than inventing a separate protocol:

- Stage only active-task files with explicit paths; preserve and report unrelated user changes. Never stage .codex-review/ artifacts, build output, temporary logs, unrelated files or secrets.
- Inspect the complete staged diff and run git diff --cached --check before claiming completion.
- Generate the ignored .codex-review/<TASK-ID>-review.txt with all sections and the complete staged diff required by AGENTS.md. Report failures honestly; do not claim review readiness with unresolved blocking checks.
- Never commit, push, merge, rebase, reset, amend, delete branches or restore unrelated work unless the user explicitly authorizes that exact operation. This skill grants no such authorization.
- Return the compact architect-review handoff defined in AGENTS.md, including task-specific requested facts. End exactly with:

NO COMMIT CREATED — awaiting architect approval.
