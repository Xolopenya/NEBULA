# NEBULA — Agent Instructions

## Project

NEBULA is a 2D browser Bullet Heaven / Survivors-like set in a bright arcade sci-fi setting.

Target platforms:

- Desktop Web
- Mobile Web
- Yandex Games

Current development priority:

Build the smallest playable core first.

Do not build the final game architecture in advance.

---

## Stack

- TypeScript
- Phaser 4
- Vite
- Vitest
- npm
- Git

Do not add dependencies without explicit task justification.

---

## Required Commands

Development:

npm run dev

Type check:

npm run typecheck

Tests:

npm test

Production build:

npm run build

Full validation:

npm run check

Normal implementation tasks are not DONE if required validation fails.

---

## Before Editing

For every task:

1. Read the active task.
2. Read this file.
3. Read docs/CURRENT_STATE.md.
4. Inspect only relevant code.
5. Read specific architecture or game-design sections only when the task requires them.
6. Implement the smallest correct change.
7. Run required checks.
8. Review the diff for unrelated changes.
9. Report changed files, tests run and remaining risks.

Do not read the entire repository without a reason.

---

## Source of Truth

Use these sources in this order depending on the question:

Current implementation:
- source code
- tests

Current implemented project state:
- docs/CURRENT_STATE.md

Technical boundaries:
- docs/ARCHITECTURE.md

Game-design decisions:
- docs/GAME_DESIGN.md

Development sequencing:
- docs/TASK_GRAPH.md

Git is the source of truth for project history.

Documentation must not override clearly different current code without reporting the inconsistency.

---

## Task Scope

Implement only the active task.

Do not automatically implement the next node from TASK_GRAPH.md.

Future tasks visible in the graph are not authorization to build them.

Prefer small changes with clear ownership.

If the task requires unrelated changes, stop and report the dependency or architectural issue.

---

## Architecture Rules

Prefer:

real requirement
> minimal implementation
> real repeated use cases
> abstraction if justified

Do not create abstractions solely for possible future use.

Do not introduce without explicit architectural approval:

- ECS framework
- dependency injection container
- global service locator
- global event bus
- generic plugin framework
- universal modifier framework
- network layer
- multiplayer architecture
- generic world-generation framework

Keep execution flow understandable.

---

## Gameplay and Phaser

Phaser should primarily handle:

- rendering
- input integration
- scenes
- camera
- assets
- audio
- visual effects

Important gameplay rules should be kept reasonably testable when practical.

Do not create a separate framework only to avoid Phaser dependencies.

---

## Content

Prefer data/configuration for differences in values.

Prefer code for differences in behavior.

Do not create multiple classes when content differs only by balance values.

---

## Dependencies

Do not install npm packages unless the active task clearly requires one.

Before adding a dependency, explain:

- why existing tools are insufficient
- runtime/build impact
- maintenance implications
- reversibility

---

## Tests

Test meaningful gameplay logic.

High-value examples:

- health
- damage
- progression
- XP
- upgrade rules
- spawn rules
- probabilities
- unlock rules
- save migrations

Do not create meaningless tests only to satisfy a metric.

Never:

- delete a failing test just to pass CI
- weaken an assertion without justification
- disable TypeScript strict checks to hide an error
- replace a meaningful test with a trivial test

---

## Refactoring

Refactor only for a concrete reason such as:

- duplication
- high coupling
- unclear ownership
- difficult testing
- repeated regression
- oversized module
- repeated real use case requiring abstraction

Do not combine broad refactoring with unrelated gameplay work when they can be separated.

If technical debt does not block the active task, report it instead of silently expanding scope.

---

## Documentation

docs/CURRENT_STATE.md describes only what actually works now.

Update it when the implemented project state materially changes.

docs/TASK_GRAPH.md should reflect task status and current sequencing.

Update architecture documents only when architecture actually changes.

Do not turn documentation into a changelog.

Git already stores history.

---

## Git Discipline

Keep each task as one small logical change set where practical.

Do not mix:

- unrelated gameplay features
- broad formatting
- architecture changes
- unrelated refactoring

Review:

git diff
git diff --check

before considering the task complete.

Do not commit unless the workflow or task explicitly asks for it.

---

## Definition of Done

A task is DONE only when:

- acceptance criteria are satisfied
- required typecheck passes
- relevant tests pass
- production build passes when applicable
- runtime smoke check passes when applicable
- no blocking runtime errors remain
- no unnecessary dependencies were added
- no unrelated refactoring was introduced
- relevant current-state documentation is accurate

---

## Core Principle

Optimize for:

IDEA
> IMPLEMENT
> PLAY
> MEASURE
> CHANGE

We are building a game, not a framework for building games.
