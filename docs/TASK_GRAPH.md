# NEBULA — Development Task Graph

## Status

Pre-Codex baseline.

This document defines the current implementation graph.

It is not a complete roadmap for the final game.

Only tasks that are reasonably close to implementation should be detailed.

Future phases may be expanded when the project reaches them.

---

# 1. Task Status Values

Tasks use:

- DONE
- ACTIVE
- READY
- BLOCKED
- BACKLOG

Meaning:

DONE
Task is completed and verified.

ACTIVE
Task is currently being implemented.

READY
Dependencies are satisfied and the task may be started.

BLOCKED
Task cannot start because a dependency or decision is missing.

BACKLOG
Task is known but not yet ready for implementation.

---

# 2. Preparation State

## PREP-001 — Repository Bootstrap

STATUS: DONE

Includes:

- Git repository
- main branch
- GitHub remote
- .gitignore
- .gitattributes

---

## PREP-002 — Browser Toolchain

STATUS: DONE

Includes:

- TypeScript
- Vite
- Phaser 4
- npm
- production build

---

## PREP-003 — Phaser Bootstrap

STATUS: DONE

Includes:

- Phaser startup
- BootScene
- 1280x720 landscape canvas
- FIT scaling
- browser smoke test

---

## PREP-004 — Quality Gates

STATUS: DONE

Includes:

- npm run typecheck
- npm test
- npm run build
- npm run check

---

## PREP-005 — Architecture Baseline

STATUS: DONE

Includes:

- GAME_DESIGN.md
- ARCHITECTURE.md
- CURRENT_STATE.md
- TASK_GRAPH.md
- root AGENTS.md

DONE WHEN:

All baseline documentation exists,
npm run check passes,
repository is clean,
baseline is committed and tagged.

---

# 3. First Playable Goal

The first playable milestone must allow:

START GAME
> MOVE SHIP
> ENEMIES SPAWN
> ENEMIES CHASE PLAYER
> LASER AUTO-TARGETS
> LASER DAMAGES ENEMIES
> ENEMIES DIE
> PLAYER TAKES DAMAGE
> PLAYER CAN DIE
> RESTART

No XP, upgrades, boss, meta progression or final assets are required for this milestone.

---

# 4. First Playable Task Graph

PREP-005
   v
GAME-001
   v
GAME-002
   v
GAME-003
   v
GAME-004
   v
GAME-005
   v
GAME-006
   v
GAME-007
   v
GAME-008
   v
GAME-009
   v
GAME-010
   v
GAME-011
   v
GAME-012
   v
GAME-013
   v
GAME-014
   v
GAME-015
   v
FIRST PLAYABLE

---

# 5. First Playable Tasks

## GAME-001 — Gameplay Scene

STATUS: DONE

DEPENDENCIES:

- PREP-005

GOAL:

Create the minimal gameplay scene that will host the first playable prototype.

PLAYER VALUE:

Creates the runtime space where actual gameplay can begin.

SCOPE:

- gameplay scene
- scene startup
- placeholder arena background

OUT OF SCOPE:

- player movement
- enemies
- combat
- progression
- production assets

DONE WHEN:

The application boots directly into or can enter a minimal gameplay scene without errors.

---

## GAME-002 — Player Placeholder

STATUS: DONE

DEPENDENCIES:

- GAME-001

GOAL:

Add a visible placeholder player ship to the gameplay scene.

PLAYER VALUE:

The player has a clearly identifiable controlled object.

OUT OF SCOPE:

- movement
- health
- weapons
- Dash
- production art

DONE WHEN:

A placeholder ship appears at the expected starting position.

---

## GAME-003 — Desktop Player Movement

STATUS: DONE

DEPENDENCIES:

- GAME-002

GOAL:

Allow responsive arcade movement using keyboard input.

PLAYER VALUE:

The player can control the ship.

INITIAL INPUT:

- WASD
- Arrow keys if simple to support

OUT OF SCOPE:

- mobile joystick
- Dash
- inertia
- acceleration simulation

DONE WHEN:

The ship moves responsively in all directions and diagonal speed is handled correctly.

---

## GAME-004 — Arena Bounds and Camera

STATUS: DONE

DEPENDENCIES:

- GAME-003

GOAL:

Create a bounded gameplay area and make camera behavior suitable for player movement.

PLAYER VALUE:

Movement takes place inside an understandable game space.

OUT OF SCOPE:

- final sector art
- interactive objects
- procedural world generation

DONE WHEN:

The player cannot leave the intended arena and camera behavior is stable.

---

## GAME-005 — Basic Enemy Runtime

STATUS: DONE

DEPENDENCIES:

- GAME-004

GOAL:

Create the first placeholder enemy entity.

PLAYER VALUE:

Introduces the first threat.

OUT OF SCOPE:

- multiple enemy types
- spawning system
- combat
- elite behavior

DONE WHEN:

A placeholder enemy can exist in the gameplay scene with basic runtime state.

---

## GAME-006 — Enemy Chase Movement

STATUS: DONE

DEPENDENCIES:

- GAME-005

GOAL:

Make the first enemy move toward the player.

PLAYER VALUE:

Creates basic survival pressure.

OUT OF SCOPE:

- pathfinding
- complex AI
- separation steering
- multiple behaviors

DONE WHEN:

The enemy consistently approaches the player.

---

## GAME-007 — Enemy Spawning

STATUS: DONE

DEPENDENCIES:

- GAME-006

GOAL:

Spawn enemies around the gameplay area over time.

PLAYER VALUE:

Creates increasing pressure instead of a single static threat.

OUT OF SCOPE:

- advanced wave director
- multiple enemy types
- elites
- boss spawning
- final balancing

DONE WHEN:

Enemies spawn repeatedly at valid locations without spawning directly on top of the player.

---

## GAME-008 — Automatic Target Selection

STATUS: DONE

DEPENDENCIES:

- GAME-007

GOAL:

Allow the player's weapon logic to identify a valid enemy target automatically.

PLAYER VALUE:

Establishes the auto-combat foundation of the Bullet Heaven loop.

OUT OF SCOPE:

- multiple targeting strategies
- target priorities
- targeting UI

DONE WHEN:

A valid nearby enemy can be selected reliably for weapon fire.

---

## GAME-009 — Basic Laser Weapon

STATUS: DONE

DEPENDENCIES:

- GAME-008

GOAL:

Add the first automatically firing Laser weapon.

PLAYER VALUE:

The ship can fight enemies without manual aiming.

OUT OF SCOPE:

- weapon upgrades
- weapon slots
- evolutions
- final VFX
- multiple weapons

DONE WHEN:

The Laser fires automatically toward the selected target at a stable interval.

---

## GAME-010 — Projectile Runtime

STATUS: DONE

DEPENDENCIES:

- GAME-009

GOAL:

Implement projectile movement and lifetime for the first weapon.

PLAYER VALUE:

Weapon attacks visibly travel through the game world.

OUT OF SCOPE:

- pooling optimization unless immediately necessary
- advanced projectile patterns
- homing missiles

DONE WHEN:

Projectiles move correctly and are removed after impact or lifetime expiration.

---

## GAME-011 — Enemy Damage and Death

STATUS: DONE

DEPENDENCIES:

- GAME-010

GOAL:

Allow projectiles to damage and kill enemies.

PLAYER VALUE:

Combat produces meaningful results.

OUT OF SCOPE:

- XP drops
- loot
- damage numbers
- advanced death VFX

DONE WHEN:

Enemies have health, take Laser damage and are removed when health reaches zero.

---

## GAME-012 — Player Health and Contact Damage

STATUS: DONE

DEPENDENCIES:

- GAME-011

GOAL:

Give the player health and apply damage when enemies make contact.

PLAYER VALUE:

Dodging enemies becomes necessary.

OUT OF SCOPE:

- shields
- armor
- regeneration
- revive ads

DONE WHEN:

Enemy contact can reduce player health in a controlled and readable way.

---

## GAME-013 — Basic Enemy Projectile

STATUS: DONE

DEPENDENCIES:

- GAME-012

GOAL:

Introduce one simple ranged hostile attack.

PLAYER VALUE:

The player must avoid both enemies and hostile projectiles.

OUT OF SCOPE:

- complete Shooter enemy archetype
- bullet-hell patterns
- boss attacks

DONE WHEN:

A simple hostile projectile can be fired and damage the player.

---

## GAME-014 — Player Death State

STATUS: DONE

DEPENDENCIES:

- GAME-013

GOAL:

End the active run when player health reaches zero.

PLAYER VALUE:

The prototype has a clear fail state.

OUT OF SCOPE:

- rewarded revive
- results economy
- meta progression

DONE WHEN:

At zero HP, active gameplay stops and a clear death state is displayed.

---

## GAME-015 — Restart Flow

STATUS: DONE

DEPENDENCIES:

- GAME-014

GOAL:

Allow the player to restart the prototype after death.

PLAYER VALUE:

Creates a complete repeatable gameplay loop.

OUT OF SCOPE:

- main menu
- save system
- run history

DONE WHEN:

Player can die, restart and begin a clean new run without reloading the browser page.

---

# 6. First Playable Milestone

FIRST PLAYABLE is reached when GAME-001 through GAME-015 are DONE.

Required manual flow:

Launch
> move
> enemies spawn
> enemies chase
> Laser fires automatically
> enemies take damage
> enemies die
> player receives contact/projectile damage
> player dies
> restart
> clean new run

Required checks:

- npm run check PASS
- browser runtime has no blocking errors
- no unrelated systems added
- CURRENT_STATE.md updated

---

# 7. Playable Core — Progression Branch

After FIRST PLAYABLE:

FIRST PLAYABLE
      v
GAME-016 XP Drop
      v
GAME-017 XP Magnet Collection
      v
GAME-018 Player XP and Level Rules
      v
GAME-019 Level-Up Pause State
      v
GAME-020 Upgrade Choice UI
      v
GAME-021 Laser Upgrade Levels
      v
GAME-022 Basic HUD
      v
PLAYABLE CORE

---

## GAME-016 — XP Drop

STATUS: DONE

GOAL:

Enemies create XP pickups when killed.

---

## GAME-017 — XP Magnet Collection

STATUS: DONE

DEPENDENCIES:

- GAME-016

GOAL:

XP pickups move toward the player inside collection radius and can be collected.

---

## GAME-018 — Player XP and Level Rules

STATUS: DONE

DEPENDENCIES:

- GAME-017

GOAL:

Track XP and determine when the player gains a level.

---

## GAME-019 — Level-Up Pause State

STATUS: DONE

DEPENDENCIES:

- GAME-018

GOAL:

Pause active gameplay when a level-up decision is required.

---

## GAME-020 — Upgrade Choice UI

STATUS: DONE

DEPENDENCIES:

- GAME-019

GOAL:

Present three upgrade choices and allow the player to select one.

---

## GAME-021 — Laser Upgrade Levels

STATUS: DONE

DEPENDENCIES:

- GAME-020

GOAL:

Allow the Laser to receive meaningful upgrades through level-up choices.

---

## GAME-022 — Basic HUD

STATUS: DONE

DEPENDENCIES:

- GAME-018

GOAL:

Display essential run information such as HP, XP and level.

---

# 8. Vertical Slice Preparation

Playable Core has been validated by MILESTONE-002. GAME-023 is defined below;
remaining nodes are BACKLOG concepts and require separate task definitions.

## GAME-023 — Initial Ship Active Ability: Dash

STATUS: DONE

DEPENDENCIES:

- GAME-022
- MILESTONE-002 Playable Core validation

GOAL:

Give the initial ship one desktop active ability: a short directional Dash that
helps reposition without changing damage rules or the combat/progression loop.

PROTOTYPE RULES:

- Space is the dedicated ability button. Activate on a fresh press, not keyboard
  repeat or continuous hold; rejected presses are not queued for later activation.
- Use the current normalized non-zero WASD/arrow movement direction at activation,
  including diagonals. Do not reuse a stale direction from an earlier moving frame.
- Idle activation does nothing and consumes no cooldown. Reject activation during
  an existing Dash, cooldown, death or level-up pause.
- Lock direction for the entire Dash; subsequent input changes do not steer it.
- Dash replaces normal 300 px/s movement with 900 px/s for 200 ms. Cooldown is
  3000 ms from successful activation, including Dash duration. Keep these three
  prototype values explicit and easy to tune; they are not generalized ship stats.
- Use frame delta for movement, duration and cooldown. If a frame crosses Dash
  expiry, move at Dash speed only for its remaining duration, then use normal
  movement/current input for the remaining active frame time. Do not add normal
  movement on top of Dash movement or extend the burst by a whole frame.
- Retain the existing ship-size-aware arena clamp throughout Dash. Reaching a
  boundary clamps position; duration/cooldown still advance without early refund.
- No Dash invulnerability or damage immunity. Existing contact/projectile damage
  and the existing post-hit protection rules remain unchanged.
- Dash duration and cooldown advance only while simulation is active. Level-up
  pause freezes an ongoing Dash and its cooldown; resuming continues the remaining
  burst in its locked direction. Space pressed during pause must not trigger on resume.
- Death stops movement and activation through the existing freeze guards. Each
  create/restart resets Dash to ready, with no remaining burst or locked direction.
- Extend the existing screen-fixed prototype HUD with minimal Dash ready/cooldown
  text. Read scene-owned ability state; refresh feedback as cooldown changes and
  reset it on retry. No production HUD pass or separate UI state is needed.

IMPLEMENTATION BOUNDARY:

Keep Phaser input, movement integration, guards, presentation and run reset owned
by GameplayScene. A small focused pure Dash calculation is acceptable if it makes
meaningful duration/delta rules independently testable. Dash is behavior, not merely
another ship numeric stat; preserve the GAME_DESIGN boundary and existing gameplay.

OUT OF SCOPE:

Generalized ShipStats, active-ability framework, generic cooldown system, state-machine
framework, mobile controls, invulnerability, new ships, Dash upgrades, VFX/assets,
new dependencies, unrelated refactors and GAME-024 or later functionality.

ACCEPTANCE / VALIDATION:

- Fresh Space plus cardinal/diagonal movement activates in the correct normalized
  direction; direction stays locked even if input changes or is released.
- Idle, held/repeated Space, cooldown, active-Dash, paused and dead activation are
  rejected without consuming/resetting cooldown or causing a delayed activation.
- Equivalent active-time delta partitions produce equivalent burst distance,
  duration and cooldown, including a frame spanning Dash expiry. Normal movement
  returns after expiry; the ship remains fully within arena bounds at every edge.
- Level-up pause freezes Dash position/duration/cooldown and all existing simulation;
  choice/resume continues correctly. Dash grants no protection from damage.
- Death still freezes the run; repeated retry resets Dash, HP, XP/level, pickups,
  choices, Laser values/timers and HUD without stale objects or duplicated timers.
- Existing targeting, firing, collisions, spawning, XP credit, choices and upgrades
  continue to work. Cooldown/readiness feedback stays fixed during camera movement.
- Add focused tracked tests for meaningful pure Dash rules if extracted; otherwise
  use targeted runtime validation. Do not add rendering-only Phaser tests.
- Run npm run check, git diff --check and git diff --cached --check. Browser smoke:
  move/Dash, idle rejection, cooldown/reuse, arena edge, level-up pause/resume and
  death/retry. Report actual evidence and remaining limitations.
- After implementation succeeds, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts; mark only GAME-023 DONE. GAME-024 and later remain BACKLOG until
  separately defined and authorized. Follow AGENTS.md staging/review; do not commit.

---

Remaining future nodes:

GAME-024 — Second Enemy Archetype
GAME-025 — Third Enemy Archetype
GAME-026 — Missile Weapon
GAME-027 — Drone Weapon
GAME-028 — Passive Module Foundation
GAME-029 — Weapon Evolution Foundation
GAME-030 — Elite Enemy Prototype
GAME-031 — Boss Prototype
GAME-032 — Run Victory / Result Flow
GAME-033 — First DevTools Utilities
GAME-034 — Mobile Movement Prototype
GAME-035 — Production-Like HUD Pass

These are BACKLOG concepts, not authorization to implement them.

---

# 9. Critical Path

The shortest path to proving the basic game concept is:

PREP-005
> GAME-001
> GAME-002
> GAME-003
> GAME-005
> GAME-006
> GAME-007
> GAME-008
> GAME-009
> GAME-010
> GAME-011
> GAME-012
> GAME-014
> GAME-015

GAME-004 and GAME-013 remain part of First Playable quality, but core combat can be evaluated before they are fully polished.

---

# 10. Task Execution Rule

Codex must only implement the active task.

Do not automatically continue into the next node.

After a node is implemented:

IMPLEMENT
> TEST
> REVIEW
> UPDATE STATE
> NEXT NODE

A future task being visible in this file does not mean it may be implemented early.

---

# 11. Task Size Rule

If a task becomes too large to understand or verify as one change:

split it.

Prefer:

Enemy model
> Enemy movement
> Enemy spawning
> Enemy damage
> Enemy death

instead of:

"Implement enemy system."

---

# 12. Graph Maintenance

This file describes the current development direction.

Update it when:

- a task becomes DONE
- dependencies change
- a task is split
- a real architectural issue changes sequencing
- a new near-term feature becomes relevant

Do not use this file as a historical changelog.

Git already stores history.
