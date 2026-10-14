# NEBULA — Current State

## Last Updated

2026-10-14.

This document describes only what is currently implemented and working.

Do not place future plans or speculative features here.

---

## Project Status

Current phase:

FIRST PLAYABLE CORE LOOP COMPLETE / GAME-022 COMPLETE

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

Focused Vitest tests cover pure collision and XP/level arithmetic. Desktop movement remains local to GameplayScene.

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
- automatically launched cyan circle Laser projectiles moving through world space
- screen-fixed top-left HUD showing current/max HP, XP toward the next threshold and level
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
Enemies use local runtime records containing their polygon visual and health, starting at 3 HP. Enemies may overlap. The cap counts currently active enemies; deaths free slots for the existing spawn timer.
The nearest active enemy is automatically selected each frame after movement using squared world-space distance.
Equal-distance ties select the first enemy in array order; an empty enemy array clears the target.
The selected enemy has a temporary 4-pixel yellow outline; the former target returns to its normal 2-pixel pale outline when selection changes.
A Phaser timer automatically fires the Laser initially every 600 ms when a current target exists.
Each shot starts at the player's world position and stores a normalized firing-time direction toward the current target. At baseline it travels straight at 1200 pixels per second using frame delta and does not home or depend on the target after launch.
Scene-owned projectile records contain the cyan circle visual, fixed velocity components and remaining lifetime. Multiple shots can coexist.
Projectiles expire after 2000 ms or are removed early once their whole 6-pixel-radius circle leaves the arena. Cleanup destroys the visual and removes the runtime entry.
No manual fire input is required. Exact or near-zero-distance shots are suppressed safely.
Without a current target no shot is created; the timer stays ready for a future target.
Each Laser projectile initially deals 1 damage to the first enemy intersected along its movement segment and is immediately destroyed and removed. Hit detection sweeps against an approximate 24-pixel enemy radius expanded by the 6-pixel projectile radius, avoiding projectile tunneling across larger frame steps. Shots do not pierce.
Enemies with remaining HP stay active. At zero HP their visual is destroyed and their runtime entry is removed, so they no longer chase, count toward the cap or participate in targeting. Death clears currentTarget immediately when applicable; normal targeting selects and highlights the next nearest enemy on the following update.
Player health resets to 5 HP on scene creation. Enemy contact deals 1 damage using squared world-center distance with player radius 20 and enemy radius 24 (combined radius 44).
Contact runs after projectile impacts/removals and starts 500 ms of global, delta-based protection. Multiple overlaps cause at most one hit per update. Successful damage reduces the ship alpha to 0.5 during protection, then restores it to 1. Continued overlap can damage again when protection expires.
Health clamps at zero and immediately enters a scene-owned isPlayerDead state through the damage helper, for lethal contact or hostile hits. The transition runs once, dims the ship to alpha 0.25 and displays centered screen-fixed SHIP DESTROYED text.
Creation resets the player to alive. Death freezes movement, enemy chase, targeting, projectile movement/collision and contact processing. Existing enemies and projectiles remain visible and frozen; timer events stay scheduled but guarded callbacks produce no spawns or shots. The lethal hostile projectile is removed before further projectile processing stops.
Only after death, a screen-fixed clickable RETRY control appears. Clicking it once uses Phaser scene.restart() without reloading the page. Phaser shutdown destroys old scene objects/UI and timer events; create() restores an alive player at 5 HP and normal alpha at (2400, 1350), one initial enemy, no projectiles, a fresh target selection and exactly three spawn/Laser/hostile timers. Repeated death/retry cycles resume the same gameplay.
One global timer fires an orange hostile projectile from the nearest active enemy every 1500 ms. Shots use fixed firing-time aim, speed 600 px/s, lifetime 3000 ms and damage 1. Missing enemies and near-zero firing distance create no shot.
Player and enemy shots share a local source/damage runtime record and movement/lifetime/world-exit cleanup. Hostile shots use swept segment-circle collision against the player and disappear even when protection prevents damage before death. Both contact and hostile hits use the same global 500 ms player damage protection; its timer ticks before projectile/contact processing.
Every killed enemy creates one lime-green world-space XP pickup worth 1 at its death position. Scene-owned pickup records preserve visual, value and magnet speed; create resets the array and restart destroys old visuals. Pickups stay stationary outside a 180-pixel player-center magnet radius. Within range they accelerate toward the current player position at 900 px/s² up to 600 px/s, using frame delta; leaving range resets speed. Reaching a 20-pixel player-center collection radius credits pickup.value to player XP before destroying/removing the pickup. Motion is capped by collection to avoid overshoot. Magnet processing stops on player death. Scene-owned playerExperience starts at level 1 with 0 XP toward the next level. The pure experience module requires 5 × current level XP, subtracts each reached threshold, carries excess forward and allows multiple levels per award. Restart resets this state and clears the separate isLevelUpPaused flag. Collection that increases level credits/removes the triggering pickup, then enters level-up pause immediately; subsequent pickups remain untouched. Screen-fixed LEVEL UP — CHOOSE ONE text and exactly three selectable Laser upgrades appear: Power (+1 damage), Fire Rate (-50 ms interval, minimum 100 ms) and Projectile Speed (+200 px/s). isSimulationPaused combines death and level-up pause to freeze movement, chase/targeting, projectiles, damage/protection, XP movement/collection and all spawn/fire callbacks. This pause is not death and offers no retry. Clicking one current choice destroys the level-up title/options and resumes simulation; duplicate/stale choice callbacks are rejected. Selected effects apply before resume and accumulate across level-ups. Scene-owned laser data starts at damage 1, fireInterval 600 ms and projectileSpeed 1200 px/s and resets on each create. Fire Rate resets the existing laserTimer in place to the new interval with elapsed time zero, preserving one Laser event rather than adding another. New shots snapshot current damage/speed; already-fired shots keep their launch values. Hostile shots are unchanged. Restart clears presentation references and native scene shutdown destroys the texts.

A scene-owned screen-fixed text HUD displays current/max HP, XP toward the next level threshold and level. It reads authoritative health/playerExperience state, refreshing immediately on damage and collection, including lethal damage and level-increasing awards. It stays visible during death and level-up choice presentation; create builds a fresh HUD with reset values on retry.

There is currently no:

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

Nine unit tests cover collision.ts and eight cover progression/experience.ts (17 total).

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

The placeholder arena, bounded desktop movement, camera follow, repeated enemy spawning/chase, nearest-enemy targeting and Laser projectile impacts with enemy damage/death are implemented and browser-verified.

GAME-001 through GAME-022 are complete. Further implementation awaits the next task definition; Vertical Slice Preparation nodes remain BACKLOG concepts.

---

## Current Playable State

The application boots successfully.

The player can move the ship, outrun multiple chasing enemies and automatically launch moving Laser projectiles toward the current nearest target. Shots disappear on impact; baseline enemies require three hits, fewer after damage upgrades. Spawning continues after kills. Enemy contact reduces player HP with temporary protection and damage feedback; gameplay freezes at zero HP with SHIP DESTROYED displayed. Orange hostile projectiles can be dodged and damage the player. Clicking RETRY after death begins a clean new run. The First Playable start/play/die/restart loop is complete. Killed enemies leave XP pickups that move toward the player within magnet range and are consumed on arrival. Collected values advance player XP/level state; reaching a new level freezes gameplay with three Laser upgrade choices. Selecting one applies a cumulative Laser upgrade before resuming the run. A fixed HUD shows HP, XP toward the next threshold and level throughout the run, pause and death, and resets on retry.

The First Playable milestone defined in TASK_GRAPH.md is now implemented.
