# NEBULA — Architecture

## Status

Pre-production architecture baseline.

This document defines the current architectural boundaries of NEBULA.

It is not a specification for a generic game framework.

Architecture must evolve from real gameplay requirements.

---

# 1. Core Architecture Principle

Use the following development order:

CONCEPT
> MECHANICAL PROTOTYPE
> PLAYABLE CORE
> VERTICAL SLICE
> CONTENT PIPELINE
> META
> PLATFORM
> POLISH
> RELEASE

Do not design the final architecture before the gameplay requires it.

Preferred rule:

real gameplay requirement
> smallest correct implementation
> second/third real use case
> only then consider abstraction

Avoid speculative architecture.

---

# 2. Technology Baseline

Current stack:

- TypeScript
- Vite
- Phaser 4
- Vitest
- npm
- Git

Current target:

- Desktop Web
- Mobile Web
- Yandex Games

Internal landscape game resolution:

- 1920 x 1080
- 16:9
- Phaser Scale FIT

---

# 3. High-Level Runtime Model

The intended direction is:

INPUT
v
GAMEPLAY / SIMULATION
v
GAME STATE
v
PRESENTATION
v
UI

Platform services must remain outside the core gameplay flow where possible.

Conceptually:

                GAME
                  |
        +---------+---------+
        |                   |
   GAMEPLAY             PRESENTATION
        |                   |
     CONTENT              PHASER
        |
     PLATFORM

This diagram describes responsibilities, not mandatory classes.

Do not create abstractions only to match the diagram.

---

# 4. Architectural Domains

As the project grows, code should generally belong to one of these domains:

## app

Application bootstrap and top-level configuration.

Examples:

- game startup
- Phaser configuration
- environment configuration

## game

Runtime gameplay.

Examples:

- player
- enemies
- combat
- weapons
- progression
- run state
- world rules

## content

Data describing gameplay content.

Examples:

- weapon definitions
- enemy definitions
- module definitions
- ships
- balance values
- spawn parameters

## ui

Player-facing interface.

Examples:

- HUD
- menus
- level-up selection
- result screen

## platform

External platform integration.

Examples:

- local storage
- Yandex Games SDK
- advertisements
- analytics
- cloud save

## shared

Small reusable utilities that genuinely belong to multiple domains.

Do not use shared as a dumping ground.

---

# 5. Current Repository State

At the current baseline, the project is intentionally much smaller than the target domain structure.

Current runtime files include approximately:

src/
  main.ts
  style.css
  game/
    config.ts
    scenes/
      BootScene.ts
      GameplayScene.ts

Do not create all future directories before they have real consumers.

Repository structure should grow together with implemented features.

---

# 6. Phaser Responsibility

Phaser is primarily responsible for:

- rendering
- scene lifecycle
- input integration
- camera
- asset loading
- audio playback
- visual animation
- visual effects
- browser game lifecycle

Where practical, important gameplay rules should not require Phaser objects to calculate their result.

Examples of logic that should preferably be testable without rendering:

- damage calculation
- health changes
- XP progression
- upgrade rules
- weapon level rules
- evolution requirements
- spawn timing rules
- unlock conditions
- save migration

However:

Do not build a separate simulation framework simply to avoid importing Phaser.

Separate game logic only when doing so improves clarity, testing, reuse, or ownership.

---

# 7. Scene Responsibility

Phaser Scenes should coordinate runtime presentation and lifecycle.

A Scene should not gradually become the implementation of every game system.

Avoid a future structure where GameScene contains:

- player movement
- weapon calculations
- enemy AI
- spawning
- XP
- upgrades
- saves
- advertisements
- UI
- audio
- analytics

Small prototype logic may initially live close together.

When a responsibility becomes substantial, move it into the domain that owns it.

Refactor because of real complexity, not because a pattern says so.

---

# 8. Gameplay Ownership

Gameplay behavior should be owned by the feature that implements it.

Examples:

player/
- movement
- health
- active ability

enemies/
- enemy runtime behavior
- enemy spawning behavior

combat/
- damage
- projectiles
- targeting

progression/
- XP
- level-up
- upgrade selection

These directories should only appear when those features exist.

Do not create empty architectural placeholders.

---

# 9. Data-Driven Content

Content data should be separated from behavior when useful.

Example conceptual EnemyDefinition:

- id
- hp
- speed
- damage
- reward
- behavior type
- visual reference

Example conceptual WeaponDefinition:

- id
- damage
- cooldown
- range
- levels
- evolution requirements
- visual reference

Use configuration for differences in values.

Use code for differences in behavior.

Do not create separate implementations when content differs only by balance values.

Bad example:

LaserWeapon
FastLaserWeapon
StrongLaserWeapon
BlueLaserWeapon

when all four share the same behavior.

---

# 10. Dependency Direction

Prefer understandable dependency direction.

Typical intended relationship:

app
v
game
v
content

ui > reads game state / invokes explicit gameplay actions

platform > accessed through explicit platform-facing boundaries

presentation > reflects gameplay state

Avoid circular dependencies between domains.

If two features require each other, first inspect ownership before introducing a global mediator.

---

# 11. Platform Isolation

Core gameplay must not directly depend on Yandex Games SDK.

Bad:

combat system
> Yandex SDK

progression system
> advertisement API

player health
> cloud save API

Preferred:

gameplay
> explicit application/platform boundary
> platform implementation

Initial development may use local browser implementations.

Later platform adapters may include:

- standalone web
- Yandex Games

This allows the game to run outside Yandex during development.

---

# 12. Save Architecture

Save functionality is not part of the Mechanical Prototype.

When implemented, save data must include a version.

Conceptual form:

{
  "version": 1
}

Changes to persistent save structure must consider migration.

Gameplay systems should not directly manipulate LocalStorage.

A save boundary/service may be introduced when persistence becomes a real feature.

Do not build it before it is needed.

---

# 13. UI Boundary

UI should display state and send player intent.

Examples:

HUD:
- health
- XP
- level
- timer

Level Up UI:
- display choices
- send selected upgrade

UI should not become the owner of gameplay rules.

Example:

The Level Up screen may display three choices.

The progression system should determine what choices are valid.

---

# 14. Events

Do not create a global event bus for the entire game.

Prefer direct and understandable communication while the codebase is small.

Events are appropriate when one gameplay occurrence genuinely has multiple independent listeners.

Potential future examples:

- enemy killed
- player leveled up
- run ended

Do not route every function call through events.

Execution flow should remain easy for a human and Codex to trace.

---

# 15. Dependency Policy

Do not add npm dependencies without explicit justification.

Before adding a dependency ask:

1. Can current tools solve the problem?
2. Is the package actively maintained?
3. What runtime cost does it add?
4. Is it really required?
5. How difficult will removal be?

Do not install a library for trivial functionality.

Particularly avoid premature introduction of:

- ECS frameworks
- UI frameworks
- state-management frameworks
- dependency injection containers
- generic event frameworks
- large utility libraries

---

# 16. Performance Direction

NEBULA is a browser Bullet Heaven.

Potential future pressure includes:

- many enemies
- many projectiles
- many XP pickups
- particles
- mobile GPUs
- memory
- allocations per frame

Do not prematurely optimize every system.

However, avoid obviously expensive architecture.

Example to avoid:

for every projectile
  check every enemy
every frame

Likely future techniques may include:

- object pooling
- spatial partitioning
- batching
- reducing temporary allocations

These must be introduced when justified by actual load or profiling.

Do not introduce ECS only because the game may eventually contain many entities.

---

# 17. Asset Boundary

Source assets and runtime assets should remain organized.

Expected high-level categories later:

assets/
  sprites/
  effects/
  ui/
  audio/
  fonts/

Do not hardcode the same asset path throughout unrelated gameplay code.

An asset manifest may be introduced when asset volume justifies it.

Do not build one during the placeholder prototype unless necessary.

---

# 18. Testing Strategy

High-value test targets:

- damage rules
- health
- progression
- XP thresholds
- upgrade eligibility
- weapon evolution conditions
- spawn rules
- probabilities
- unlock conditions
- save/load
- save migrations

Lower-value unit test targets:

- simple Phaser rendering calls
- trivial wrappers
- obvious property assignments
- purely visual animation code

Required project quality command:

npm run check

This currently runs:

1. TypeScript typecheck
2. Vitest
3. production build

Implementation tasks are not DONE when required checks fail.

---

# 19. Dev Tools Direction

Gameplay development should eventually provide fast ways to reproduce states.

Potential examples:

- spawn enemies
- give XP
- force level-up
- equip weapon
- spawn boss
- god mode
- time scale
- show performance data

Do not build the complete DevTools system immediately.

Introduce tools when gameplay states become expensive to reproduce manually.

The goal is faster:

IMPLEMENT
> PLAY
> VERIFY

---

# 20. Content Scalability

The architecture should make adding content cheaper than changing the core game.

Desired future property:

adding a normal enemy configuration
should not require rewriting enemy spawning

adding a balance level to Laser
should not require changing combat architecture

adding a new passive module
should not require modifying unrelated UI and platform code

However, unique behavior may legitimately require new code.

---

# 21. No Speculative Architecture

Do not create systems solely because they might be useful later.

Do not create without a current consumer:

- generic plugin framework
- dependency injection container
- universal entity manager
- universal modifier engine
- network abstraction
- multiplayer synchronization
- complex ECS
- global service locator
- generic world generator
- complex procedural generation framework
- universal effect pipeline

A future feature is not sufficient justification.

---

# 22. Refactoring Policy

Refactor when there is a concrete reason.

Valid reasons include:

- duplication
- unclear ownership
- high coupling
- large modules
- difficult testing
- repeated regressions
- second/third real implementation exposing a useful abstraction

Avoid mixing major refactoring with unrelated gameplay work.

If a problem does not block the active task, create technical debt work instead of silently expanding scope.

---

# 23. Codex Change Principle

For a normal task Codex should:

1. read the task
2. read relevant instructions
3. inspect only relevant code
4. implement the smallest correct change
5. run required checks
6. report modified files and remaining risks

Codex must not use a small task as permission to redesign neighboring systems.

---

# 24. Architecture Change Rule

Codex may perform local implementation decisions inside the active task.

Codex must not silently make major architecture decisions.

Examples requiring architectural review:

- new major dependency
- replacing Phaser
- introducing ECS
- global event architecture
- new persistence model
- new core domain boundary
- changing save format strategy
- major folder restructuring
- platform coupling
- broad refactoring across multiple systems

Such changes require review before implementation.

---

# 25. Definition of Healthy Architecture

Architecture is successful when a gameplay feature can be:

- understood
- implemented
- tested
- changed
- removed

without unnecessary changes throughout the entire repository.

The goal is not maximum abstraction.

The goal is fast and safe game iteration.
