# NEBULA — Current State

## Last Updated

2026-10-15.

This document describes only what is currently implemented and working.

Do not place future plans or speculative features here.

---

## Project Status

Current phase:

FIRST PLAYABLE CORE LOOP COMPLETE / GAME-029 COMPLETE

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

Focused Vitest tests cover pure collision, XP/level arithmetic, choice selection, Dash timing and Shooter distance-band movement. Desktop movement remains local to GameplayScene.

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
- red diamond Chasers and amber hexagonal Tanks pursuing the player; purple square Shooters approaching, holding or retreating to a preferred distance band
- temporary thicker yellow outline on the current nearest-enemy target
- automatically launched cyan Laser projectiles, yellow homing Missiles with area damage, and one teal orbiting Drone firing violet straight bolts
- screen-fixed top-left HUD showing current/max HP, XP toward the next threshold, level and Dash readiness/cooldown
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
    enemies/
      shooterMovement.ts
      shooterMovement.test.ts
    player/
      dash.ts
      dash.test.ts

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
Movement is immediate at a baseline 300 pixels per second, uses frame delta, and normalizes diagonal direction.
Releasing movement keys stops normal movement without inertia.
Fresh Space with non-zero current movement input activates Dash at 900 px/s for 200 ms, locking the normalized direction. Cooldown lasts 3000 ms from activation; idle, held/repeated, active-Dash, cooldown, paused and dead presses do not activate or queue. Dash replaces normal movement and a frame spanning expiry splits into remaining Dash time then normal movement time, clamping each segment to the arena. Duration/cooldown freeze during level-up pause and death; choice resume continues a pending burst. Dash adds no immunity and retains existing damage/protection rules. Restart clears remaining Dash/cooldown and direction; native keyboard reset plus fresh-key/repeat checks prevent stale input.
The ship starts at world position (2400, 1350).
Movement is clamped inside the 4800x2700 arena using half the ship dimensions plus its outline.
The main camera follows the ship immediately and is bounded to the arena.
Browser resizing preserves the internal viewport and responsive 16:9 FIT presentation.
One Chaser starts at (3000, 1350). Successful timed spawns every 2 seconds repeat Chaser, Chaser, Chaser, Shooter, Chaser, Tank (CCCSCT) up to a shared cap of 10 active enemies. Initial creation does not advance the sequence; cap/pause/death rejection leaves it unchanged, kills free slots without rewinding it, and restart resets it.
Spawn positions are chosen just outside a random camera edge, clamped with a 25-pixel arena margin, and kept at least 600 pixels from the player. Too-close candidates use the opposite arena corner.
Chasers and Tanks share direct pursuit of the player's current world position at 180 and 100 pixels per second respectively. Shooters move at 140 pixels per second toward the player above 500 pixels, retreat below 350 and hold within the inclusive 350–500 world-center band. Movement stops at the nearest band edge even for large deltas; coincident centers retreat deterministically right. Arena clamping may prevent further retreat at an edge.
Chaser/Tank pursuit uses frame delta and caps each step at the remaining distance to avoid overshoot at the player.
All three archetypes respect the 25-pixel arena margin to keep their polygons fully inside.
Enemies use one local runtime collection with explicit chaser/shooter/tank identity, polygon visual and health. Small scene-local archetype data supplies health, speed, polygon points, fill and normal outline: Chaser 3 HP/red diamond, Shooter 2 HP/purple square, Tank 6 HP/amber hexagon. Tank has no armor or special defense. Chaser and Tank share pursuit; Shooter keeps its explicit band behavior. All three share collision radius, contact damage, targeting, Laser hits and killEnemy/XP. Enemies may overlap. The cap counts currently active enemies; deaths free slots for the existing spawn timer.
The nearest active enemy is automatically selected each frame after movement using squared world-space distance.
Equal-distance ties select the first enemy in array order; an empty enemy array clears the target.
The selected enemy has a temporary 4-pixel yellow outline; the former target returns to its normal 2-pixel pale outline when selection changes.
A Phaser timer automatically fires the Laser initially every 600 ms when a current target exists.
Each shot starts at the player's world position and stores a normalized firing-time direction toward the current target. At baseline it travels straight at 1200 pixels per second using frame delta and does not home or depend on the target after launch.
Scene-owned straight projectile records contain their visual, source, damage, radius, fixed velocity components and remaining lifetime. Multiple shots can coexist.
Projectiles expire after 2000 ms or are removed early once their whole 6-pixel-radius circle leaves the arena. Cleanup destroys the visual and removes the runtime entry.
No manual fire input is required. Exact or near-zero-distance shots are suppressed safely.
Without a current target no shot is created; the timer stays ready for a future target.
Each Laser projectile initially deals 1 damage to the first enemy intersected along its movement segment and is immediately destroyed and removed. Hit detection sweeps against an approximate 24-pixel enemy radius expanded by the 6-pixel projectile radius, avoiding projectile tunneling across larger frame steps. Shots do not pierce.
Enemies with remaining HP stay active. At zero HP their visual is destroyed and their runtime entry is removed, so they no longer chase, count toward the cap or participate in targeting. Death clears currentTarget immediately when applicable; normal targeting selects and highlights the next nearest enemy on the following update.
Player health resets to 5 HP on scene creation. Enemy contact deals 1 damage using squared world-center distance with player radius 20 and enemy radius 24 (combined radius 44).
Contact runs after projectile impacts/removals and starts 500 ms of global, delta-based protection. Multiple overlaps cause at most one hit per update. Successful damage reduces the ship alpha to 0.5 during protection, then restores it to 1. Continued overlap can damage again when protection expires.
Health clamps at zero and immediately enters a scene-owned isPlayerDead state through the damage helper, for lethal contact or hostile hits. The transition runs once, dims the ship to alpha 0.25 and displays centered screen-fixed SHIP DESTROYED text.
Creation resets the player to alive. Death freezes movement, enemy chase, targeting, projectile movement/collision and contact processing. Existing enemies and projectiles remain visible and frozen; timer events stay scheduled but guarded callbacks produce no spawns or shots. The lethal hostile projectile is removed before further projectile processing stops.
Only after death, a screen-fixed clickable RETRY control appears. Clicking it once uses Phaser scene.restart() without reloading the page. Phaser shutdown destroys old scene objects/UI and timer events; create() restores an alive player at 5 HP and normal alpha at (2400, 1350), one initial enemy, no projectiles, a fresh target selection and exactly five spawn/Laser/Missile/Drone/hostile timers. Repeated death/retry cycles resume the same gameplay.
One global timer fires an orange hostile projectile from the nearest active Shooter every 1500 ms, ignoring Chasers/Tanks and keeping collection-order ties stable. Chasers and Tanks never fire; no active Shooter or near-zero firing distance creates no shot. Shots use fixed firing-time aim, speed 600 px/s, lifetime 3000 ms and damage 1. The preferred movement band does not limit firing range. No per-enemy timers exist.
Player and enemy shots share a local source/damage runtime record and movement/lifetime/world-exit cleanup. Hostile shots use swept segment-circle collision against the player and disappear even when protection prevents damage before death. Both contact and hostile hits use the same global 500 ms player damage protection; its timer ticks before projectile/contact processing.
Missile is active from run start with one global 1800 ms firing timer and Missile-specific maxActiveMissiles = 1. At the cap, callbacks create no shot and leave the timer/cadence unchanged; cleanup frees the slot for a later callback. Launch selects the nearest enemy to the player with stable collection-order ties; no enemy means no shot. Separate scene-owned MissileRuntime records contain a yellow 8-pixel circle, target reference, launch-snapshotted explosion damage, last normalized heading and remaining lifetime. Each active frame directly steers toward the living target at 450 px/s. The Missile keeps that living target even when another enemy becomes closer, including after reacquisition. A removed/missing target reacquires nearest to the Missile position; no replacement preserves heading, and later enemies can be acquired. Near-zero aim retains heading safely; starting overlap resolves at segment time zero. Motion is clipped to the remaining 4000 ms lifetime. Swept segment-circle collision against every active enemy (24 + 8 radius) detonates once at the earliest hit point, including non-target interception. Baseline explosion damage 2 applies once to a snapshot of enemies whose centers are within inclusive radius 120; no radius expansion or separate direct-hit damage. Lethal hits use killEnemy and one normal XP per enemy without skipped array entries. Lifetime expiry/whole-circle world exit only removes the Missile. Missile configuration remains concrete and immutable; Combat Processor multiplies its explosion damage at launch. Pause/death guards freeze firing, homing, position and lifetime; create/restart empties the array and native shutdown destroys old objects/timers. No explosion marker or VFX system is added.

Exactly one teal radius-10 world-space Drone starts to the right of the player at orbit angle 0. Scene-owned angle advances clockwise at 2 rad/s using active frame delta, wrapping at 2π. Position is derived after player movement/Dash from current player position plus a 110-pixel cosine/sine offset; only the Drone center is clamped to arena bounds. It has no health, collision or contact damage. One global 1200 ms timer selects the nearest active enemy from the actual Drone position with stable collection-order ties; empty or near-zero aim creates no bolt. Violet radius-5 straight bolts snapshot base damage 1 multiplied by Combat Processor, speed 800 px/s and lifetime 1800 ms, independently of every Laser upgrade, and do not home. Laser/Drone share a small straight-player-shot creation helper; player and hostile straight shots share required per-projectile radius, swept first-hit damage, non-piercing removal and lifetime/world-exit cleanup. Laser/hostile shots retain radius 6. All enemy deaths still use killEnemy/one normal XP. Pause/death freeze orbit and bolts and guard firing; native restart destroys old Drone/bolts/timers and create restores exactly one Drone at angle 0 with empty projectiles and five gameplay timers. No Drone upgrades or weapon acquisition are implemented.

Every killed enemy creates one lime-green world-space XP pickup worth 1 at its death position. Scene-owned pickup records preserve visual, value and magnet speed; create resets the array and restart destroys old visuals. Pickups stay stationary outside the current player-center magnet radius (baseline 180 pixels). Within range they accelerate toward the current player position at 900 px/s² up to 600 px/s, using frame delta; leaving range resets speed. Reaching a 20-pixel player-center collection radius credits pickup.value to player XP before destroying/removing the pickup. Motion is capped by collection to avoid overshoot. Magnet processing stops on player death. Scene-owned playerExperience starts at level 1 with 0 XP toward the next level. The pure experience module requires 5 × current level XP, subtracts each reached threshold, carries excess forward and allows multiple levels per award. Restart resets this state and clears the separate isLevelUpPaused flag. Collection that increases level credits/removes the triggering pickup, then enters level-up pause immediately; subsequent pickups remain untouched. Screen-fixed LEVEL UP — CHOOSE ONE text and exactly three distinct selectable options appear, built once from an ordinary pool of up to seven choices: Laser Power (+1 damage), Laser Fire Rate (-50 ms interval, minimum 100 ms), Laser Projectile Speed (+200 px/s), Hull Plating, Thruster Module, Collector Field and Combat Processor. The pure selectChoices helper accepts a supplied pool, count and random source, leaves the pool unchanged and permits repeats across later presentations. Choices stay stable during a pause. Each Laser upgrade has an explicit run-local rank starting at 0, increments only on its accepted selection and becomes ineligible at rank 2; all four passives remain repeatable. Eligible Prism replaces one ordinary slot as described below. isSimulationPaused combines death and level-up pause to freeze movement, chase/targeting, projectiles, damage/protection, XP movement/collection and all spawn/fire callbacks. This pause is not death and offers no retry. Clicking one current choice destroys the level-up title/options and resumes simulation; duplicate/stale choice callbacks are rejected. Selected effects apply before resume and accumulate across level-ups. Scene-owned laser data starts at damage 1, fireInterval 600 ms and projectileSpeed 1200 px/s and resets on each create. Fire Rate resets the existing laserTimer in place to the new interval with elapsed time zero, preserving one Laser event rather than adding another. New straight player shots snapshot weapon-specific damage multiplied by the run-wide damage multiplier, plus current speed; already-fired shots keep their launch values. Missiles likewise snapshot multiplied explosion damage at launch, including Missiles that span a choice pause. Hostile shots are unchanged. Restart clears presentation references and native scene shutdown destroys the texts.

Laser → Prism Laser is implemented and validated in the real Phaser runtime. Power, Fire Rate and Projectile Speed ranks reset to 0 and cap at 2 independently, preserving +1 damage, -50 ms (minimum 100) and +200 px/s per accepted selection. Full mastery retains damage 3, interval 500 ms and speed 1600 px/s before global damage multiplication. Prism requires all three ranks >=2, Combat Processor level >=1 and unevolved state. Eligibility is checked only on entering a new presentation: eligible Prism is guaranteed once alongside two sampled distinct ordinary choices; otherwise three ordinary choices are sampled using selectChoices. Completing the final prerequisite resumes normally; ignoring Prism offers it again next level. Selecting it once retains Combat Processor and mastered Laser values, then removes the evolution offer for that run.

Prism changes the existing Laser callback into three straight projectiles aimed center/-12/+12 degrees from current target aim, all from the current player position with full launch-snapshotted Laser damage × globalDamageMultiplier. The pure prismSpread helper normalizes aim and suppresses the whole volley below distance 0.001. It shares the existing radius 6, lifetime 2000 ms, speed, swept first-hit collision and cleanup. No piercing, homing, new weapon runtime or timer is added. Existing in-flight attacks retain their launch values. create/restart resets Laser ranks and prismEvolved along with existing state; Missile and Drone have no new ranks or evolution state.

Exactly four run-local Passive Modules have explicit levels starting at 0, with no caps or slots. Hull Plating adds 1 max HP and heals 1 immediately, clamped to the new maximum, refreshing the HP HUD. Thruster Module adds 30 px/s normal speed without changing Dash. Collector Field adds 40 world pixels to magnet activation radius without changing collection radius 20, acceleration 900 or maximum attraction speed 600. Combat Processor adds 0.25 to the global player-weapon damage multiplier, starting at 1.0; Laser, Drone and Missile multiply their current weapon-specific damage at launch without rounding. Laser Power remains Laser-specific; hostile/contact damage is unchanged. Each repeat selection increments only that module's level and reapplies its effect. Labels identify Passive Modules, their next level and effect. Native create/restart restores module levels 0, current/max HP 5/5, movement 300, magnet 180 and multiplier 1.0, alongside existing Laser/XP/Dash/UI/weapon resets and five timers. No inventory UI, generic stats/modifier system or extra timer is introduced.

A scene-owned screen-fixed text HUD displays current/max HP, XP toward the next level threshold, level and Dash READY/remaining seconds (rounded up to tenths). It reads authoritative health/playerExperience/Dash state, refreshing immediately on damage and collection, including lethal damage and level-increasing awards. Dash feedback refreshes when its displayed tenth of a second changes during active simulation. It stays visible during death and level-up choice presentation; create builds a fresh HUD with reset values on retry.

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

Nine unit tests cover collision.ts, eight cover progression/experience.ts, six cover player/dash.ts timing/expiry partitions, seven cover enemies/shooterMovement.ts band rules, and six cover progression/selectChoices.ts size, distinctness, membership, nonmutation, controlled randomness, repeated offers and input boundaries.

Eight pure Prism eligibility cases and seven pure spread cases also pass, for 51 tracked tests across seven files. Real-browser scene validation covers rank caps, next-pause offers, volley/snapshot behavior and two native RETRY cycles restoring five gameplay timers.

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

GAME-001 through GAME-029 are complete. GAME-030 and later remain BACKLOG concepts.

---

## Current Playable State

The application boots successfully.

The player can move the ship, outrun Chasers and slow durable Tanks, approach ranged Shooters and automatically launch moving Laser projectiles toward the current nearest target of any type. Shots disappear on impact; baseline Chasers require three hits, Shooters two and Tanks six, fewer after damage upgrades. Missile automatically homes toward enemies and can damage/kill a cluster with one explosion; each enemy death still drops one XP. One persistent Drone follows the ship in orbit and fires straight bolts at Drone-relative targets, independently of Laser upgrades. Spawning continues after kills. Enemy contact reduces player HP with temporary protection and damage feedback; gameplay freezes at zero HP with SHIP DESTROYED displayed. Orange hostile projectiles can be dodged and damage the player. Clicking RETRY after death begins a clean new run. The First Playable start/play/die/restart loop is complete. Killed enemies leave XP pickups that move toward the player within magnet range and are consumed on arrival. Collected values advance player XP/level state; reaching a new level freezes gameplay with three distinct choices from eligible Laser upgrades, Passive Modules and the guaranteed Prism offer when eligible. Selecting one applies a Laser upgrade, Passive Module or Prism evolution before resuming the run. Directional Space Dash supports short repositioning bursts without immunity. A fixed HUD shows HP, XP toward the next threshold, level and Dash cooldown throughout the run, pause and death, and resets on retry.

The First Playable milestone defined in TASK_GRAPH.md is now implemented.
