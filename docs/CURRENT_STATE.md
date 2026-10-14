# NEBULA — Current State

## Last Updated

2026-10-14.

This document describes only what is currently implemented and working.

Do not place future plans or speculative features here.

---

## Project Status

Current phase:

FIRST PLAYABLE IMPLEMENTATION / GAME-009 COMPLETE

The project has a working browser application, development toolchain and placeholder gameplay scene.

The player ship supports responsive desktop keyboard movement.

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

Starts the Vite development server on IPv4 localhost (127.0.0.1).

### Type Check

npm run typecheck

Runs TypeScript without emitting files.

### Tests

npm test

Runs Vitest.

There are currently no test files. Desktop movement is implemented locally in GameplayScene.

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

- 4800x2700 dark-space placeholder arena with deterministic static stars and an outer boundary
- cyan player ship placeholder starting at the arena center, drawn with Phaser geometry
- red diamond enemy placeholders directly chasing the player in world space
- temporary thicker yellow outline on the current nearest-enemy target
- automatic temporary cyan Laser beam flashes from the player toward the current target
- desktop movement using WASD or arrow keys
- "NEBULA — GAMEPLAY SCENE" label
- "Placeholder space arena" text

Rendering:

- Phaser 4.2.1
- WebGL
- 1920x1080 internal viewport (separate from the larger arena)
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

A player ship placeholder is rendered in GameplayScene and controlled with WASD or arrow keys.
Movement is immediate at 300 pixels per second, uses frame delta, and normalizes diagonal direction.
Releasing movement keys stops the ship without inertia.
The ship starts at world position (2400, 1350).
Movement is clamped inside the 4800x2700 arena using half the ship dimensions plus its outline.
The main camera follows the ship immediately and is bounded to the arena.
Browser resizing preserves the internal viewport and responsive 16:9 FIT presentation.
One enemy placeholder starts at (3000, 1350); additional enemies spawn every 2 seconds up to a temporary cap of 10 active enemies.
Spawn positions are chosen just outside a random camera edge, clamped with a 25-pixel arena margin, and kept at least 600 pixels from the player. Too-close candidates use the opposite arena corner.
All enemies directly pursue the player's current world position at 180 pixels per second.
Enemy movement uses frame delta and caps each step at the remaining distance to avoid overshoot at the player.
Chase positions also respect the 25-pixel arena margin to keep the larger enemy polygon fully inside.
Enemies may overlap. They are not removed or recycled; spawning stops at the temporary cap while chase continues.
The nearest active enemy is automatically selected each frame after movement using squared world-space distance.
Equal-distance ties select the first enemy in array order; an empty enemy array clears the target.
The selected enemy has a temporary 4-pixel yellow outline; the former target returns to its normal 2-pixel pale outline when selection changes.
A Phaser timer automatically fires the basic Laser every 600 ms when a current target exists.
Each shot snapshots player and target world positions into a cyan Line placeholder and destroys it after 120 ms with a Phaser delayed callback. No manual fire input is required.
Without a current target no shot is created; the timer stays ready for a future target.
Projectile travel, collision, impact, enemy damage/death, health and contact damage are not implemented.

There is currently no:

- moving projectiles
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

The placeholder arena, bounded desktop movement, camera follow, repeated enemy spawning/chase, nearest-enemy targeting and automatic Laser flashes are implemented and browser-verified.

The next implementation task is:

GAME-010 — Projectile Runtime

---

## Current Playable State

The application boots successfully.

The player can move the ship, outrun multiple chasing enemies and see automatic Laser flashes aimed at the current nearest target. Shots do not travel or damage enemies; combat and contact damage are not implemented.

The next major goal is the First Playable milestone defined in GAME_DESIGN.md.
