# NEBULA � Current State

## Last Updated

2026-10-13.

This document describes only what is currently implemented and working.

Do not place future plans or speculative features here.

---

## Project Status

Current phase:

FIRST PLAYABLE IMPLEMENTATION / GAME-002 COMPLETE

The project has a working browser application, development toolchain and placeholder gameplay scene.

Interactive gameplay mechanics have not been implemented yet.

---

## Working Toolchain

Installed and verified:

- Node.js 24
- npm
- TypeScript
- Vite
- Phaser 4.2.1
- Vitest
- Git

Repository:

- Git repository initialized
- main branch
- GitHub remote configured
- project pushed successfully

---

## Quality Commands

Available commands:

### Development

npm run dev

Starts the Vite development server.

### Type Check

npm run typecheck

Runs TypeScript without emitting files.

### Tests

npm test

Runs Vitest.

There are currently no test files because no meaningful testable gameplay logic exists yet.

### Production Build

npm run build

Runs TypeScript compilation and creates the Vite production build.

### Full Check

npm run check

Runs:

1. typecheck
2. tests
3. production build

Current status:

PASS

---

## Current Runtime

The project boots Phaser in the browser and transitions from BootScene into GameplayScene.

Current screen:

- dark-space placeholder arena with static stars and a rectangular boundary
- stationary cyan player ship placeholder at the arena center, drawn with Phaser geometry
- "NEBULA — GAMEPLAY SCENE" label
- "Placeholder space arena" text

Rendering:

- Phaser 4.2.1
- WebGL
- 1280x720 internal resolution
- landscape
- FIT scaling
- centered canvas

---

## Current Repository Structure

Relevant current files:

src/
  main.ts
  style.css
  game/
    config.ts
    scenes/
      BootScene.ts
      GameplayScene.ts

docs/
  GAME_DESIGN.md
  ARCHITECTURE.md
  CURRENT_STATE.md

Other root files include:

- package.json
- package-lock.json
- tsconfig.json
- index.html
- README.md
- .gitignore
- .gitattributes

---

## Implemented Gameplay

A stationary player ship placeholder is rendered in GameplayScene.
No input or movement logic is implemented.

There is currently no:

- movement
- arena gameplay
- enemies
- enemy spawning
- weapons
- targeting
- damage
- health
- death
- XP
- progression
- upgrades
- boss
- save system
- advertisements
- Yandex Games integration

This is intentional.

---

## Assets

No production game assets are currently integrated.

The Vite demonstration assets have been removed.

Gameplay prototypes will initially use placeholders and simple geometry.

---

## Tests

No gameplay unit tests exist yet.

Vitest is installed and configured.

Tests should be introduced when meaningful game logic appears.

Do not create meaningless placeholder tests only to increase test count.

---

## Known Non-Blocking Warnings

### AudioContext

Browser may warn that Web Audio cannot start before user interaction.

This is expected browser behavior.

Audio is not implemented yet.

### Bundle Size

The production bundle currently produces a Vite warning because Phaser makes the JavaScript chunk larger than 500 kB.

This is not currently considered a problem.

Do not optimize bundle splitting before there is a demonstrated need.

---

## Current Architectural Complexity

Intentionally minimal.

Not implemented:

- ECS
- global event bus
- dependency injection
- platform abstraction
- save abstraction
- content pipeline
- asset manifest
- DevTools framework
- code graph integration

These should only be introduced when real project requirements justify them.

---

## Next Step

The placeholder gameplay scene and stationary player ship are implemented and browser-verified.

The next implementation task is:

GAME-003 — Desktop Player Movement

---

## Current Playable State

The application boots successfully.

There is no playable gameplay yet.

The next major goal is the First Playable milestone defined in GAME_DESIGN.md.
