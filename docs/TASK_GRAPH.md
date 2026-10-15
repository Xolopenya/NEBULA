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

Playable Core has been validated by MILESTONE-002. GAME-023 and GAME-024 are defined below;
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

## GAME-024 — Second Enemy Archetype: Shooter

STATUS: DONE

DEPENDENCIES:

- GAME-023

GOAL:

Introduce a distinct ranged Shooter alongside the existing enemy, now identified
as Chaser, without replacing the shared enemy/combat/progression runtime.

PROTOTYPE RULES:

- Chaser retains the current red diamond placeholder, 3 HP, 180 px/s direct pursuit
  and existing contact damage/protection rules. Chaser does not fire hostile shots.
- Shooter uses 2 HP and 140 px/s with a visibly distinct placeholder silhouette and
  color, such as a purple square. Keep both placeholders within the existing enemy
  size/margin and approximate collision-radius convention; no production art.
- Shooter preferred player-center distance band is 350–500 world pixels, inclusive.
  Above 500, approach the player's current position; below 350, retreat directly
  away; inside the band, hold position. Use delta-based motion and cap each step at
  the nearest band edge to avoid overshooting it with a large delta.
- At coincident centers, use one deterministic retreat direction rather than
  dividing by zero. Retain existing arena clamping; an edge may prevent further
  retreat, without pathfinding or an alternate steering system.
- Shooter keeps existing contact damage (1), global player protection and enemy
  collision rules. Both types die through killEnemy and drop exactly one value-1
  XP pickup. Neither gains immunity or a separate damage/death path.
- Reuse the one global 1500 ms hostile-fire timer. fireHostileProjectile selects the
  nearest active Shooter by world-center distance (stable collection-order tie),
  ignoring nearer Chasers. No Shooter means no shot; near-zero aim still suppresses
  a shot safely. The movement band is not an additional firing-range restriction.
- Keep the existing orange hostile projectile: fixed firing-time direction,
  600 px/s, 3000 ms lifetime, damage 1 and existing player collision/cleanup.
  Do not add per-enemy timers or change the player Laser cadence/upgrades.
- Initial enemy is always Chaser. For successful timed spawns, use repeating
  Chaser, Chaser, Chaser, Shooter (every fourth). Initial creation does not count;
  callbacks rejected by cap/pause/death do not advance the sequence. Restart resets
  it so the first three successful timed spawns in each run are Chasers again.
- Preserve current spawn placement and the 10-active-enemy cap across both types.
  Kills free shared cap slots; removal does not rewind the successful-spawn count.
- Existing nearest-target selection/highlighting and Laser impacts must include
  either type. Keep one scene-owned enemy collection with explicit archetype identity.
- Existing simulation pause/death guards freeze approach, retreat, chase, targeting,
  projectiles and spawn/fire production for both types. Native retry clears all old
  enemies/projectiles/UI/timers and restores a fresh initial Chaser and spawn count.

IMPLEMENTATION BOUNDARY:

Two concrete types now justify a small explicit archetype/data representation for
varying health, movement speed and placeholder presentation. Keep behavior explicit
per archetype; data values alone do not encode pursuit versus ranged movement.
Reuse existing shared runtime records, creation, targeting, damage/death and XP paths.
A focused pure movement/band rule is acceptable if it materially clarifies testing.
No broad scene refactor or future-archetype stubs are required.

OUT OF SCOPE:

Third archetype, elites/bosses, SpawnDirector/difficulty scaling, portal/rift telegraph,
per-enemy Phaser timers, deep inheritance, ECS/generic entity framework, generalized
combat stat engine, new projectile types, new dependencies and unrelated mechanics.

ACCEPTANCE / VALIDATION:

- Both types spawn in the stated deterministic mix and are visually distinguishable;
  Chaser still pursues at its baseline speed and never originates hostile shots.
- Shooter approaches, holds (including exact 350/500 boundaries) and retreats at its
  own speed with normalized delta motion; large steps stop at the band, coincident
  centers are safe, and arena edges constrain the whole placeholder.
- The global callback fires from the nearest active Shooter even with a closer
  Chaser; ties are stable and missing/removed Shooters produce no stale shot.
- Target/highlight and Laser damage work for either type (3/2 baseline HP); lethal
  hits use the same removal path and produce one XP pickup only, including duplicate
  removal attempts. Shared cap counts both types and refills after either dies.
- Pause/death freeze both behaviors and guarded callbacks without new timers;
  rejected spawn callbacks leave the sequence unchanged.
- Repeated death/retry restores initial Chaser, spawn mix, existing three gameplay
  timers and fresh HP/XP/level, pickups, choices, Laser values, Dash and HUD. No old
  enemies, timers or UI survive. Dash and GAME-016..023 progression remain functional.
- Add meaningful tracked tests for deterministic archetype/movement rules where
  practical, plus targeted scene/runtime validation; no drawing-only Phaser tests.
- Run npm run check, git diff --check and git diff --cached --check. Browser smoke:
  mixed spawning, approach/hold/retreat, Shooter-origin shots, both enemy deaths/XP,
  Dash, level-up pause/choice/resume and death/retry. Report actual evidence.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts and mark only GAME-024 DONE. GAME-025 and later remain BACKLOG until
  separately defined and authorized. Follow AGENTS.md staging/review; do not commit.

---

## GAME-025 — Third Enemy Archetype: Tank

STATUS: DONE

DEPENDENCIES:

- GAME-024

GOAL:

Add a slow, durable melee Tank alongside Chaser and Shooter, preserving the shared
enemy/combat/progression runtime and the existing direct-pursuit behavior family.

PROTOTYPE RULES:

- Tank starts with 6 HP and moves at 100 px/s. Use normalized, delta-based direct
  pursuit of the player's current world position, capping each step at the remaining
  distance to avoid overshoot. Share Chaser's pursuit logic where behavior is identical;
  keep the existing arena margin/clamp and approximate 24-pixel enemy collision radius.
- Use a clearly distinct amber/orange hexagon or heavy-looking polygon within the
  existing enemy size/margin convention. No production art or collision-radius redesign.
- Tank contact damage remains 1 through the existing global player protection path.
  No armor, damage reduction, knockback resistance, immunity or special defense.
- Tank never fires hostile projectiles. Keep the single global hostile-fire timer
  and nearest-active-Shooter-only source selection, stable ties and no-Shooter suppression.
  Do not add per-enemy timers or change projectile values/types.
- Chaser retains 3 HP, 180 px/s direct pursuit and no hostile fire. Shooter retains
  2 HP, 140 px/s and its inclusive 350–500 px approach/hold/retreat band, including
  large-delta stopping, deterministic coincident retreat and existing arena clamping.
- Replace timed-spawn CCCS with repeating Chaser, Chaser, Chaser, Shooter, Chaser,
  Tank (CCCSCT). Initial enemy remains Chaser and is excluded from the sequence.
  Only successful timed spawns advance it; cap/pause/death rejection must not advance
  it. Kills free slots without rewinding the sequence. Each create/restart resets it.
- Preserve current spawn cadence/placement and the shared cap of 10 active enemies,
  counting all three archetypes. Keep one enemy collection and existing nearest-target
  selection/highlighting, Laser collision/damage and upgrade effects for every type.
- All three use killEnemy for lethal removal and exactly one value-1 XP drop at
  the death position. Duplicate removal attempts must not create another pickup.
- Existing level-up pause/death guards freeze all three movement behaviors,
  targeting, projectiles, contact, XP and spawn/fire production. Native retry clears
  old runtime objects/UI/timers and restores a fresh initial Chaser and spawn sequence.

IMPLEMENTATION BOUNDARY:

Extend existing EnemyArchetype/enemyData for Tank's genuinely varying health, speed
and presentation. Keep behavior explicit: Chaser/Tank share direct pursuit; Shooter
keeps distance-band movement. Reuse enemy collection, targeting, Laser damage,
killEnemy, XP and cap paths. A small enemy-definition extraction is allowed only
if it clearly reduces duplicated concrete data ownership. Do not generalize beyond
three real types or perform a broad GameplayScene refactor.

OUT OF SCOPE:

Fourth archetype/Summoner, armor/damage reduction, variable contact damage,
per-enemy collision-radius redesign, new attacks/projectiles, elites/bosses,
SpawnDirector/difficulty scaling, spawn rifts/telegraphs, per-enemy timers,
inheritance/ECS/entity framework, generic combat-stat engine, new dependencies
and unrelated gameplay/refactors.

ACCEPTANCE / VALIDATION:

- Tank is visually distinct from Chaser and Shooter and requires exactly six
  baseline one-damage Laser hits: active after five, removed by the sixth.
- Tank pursues at 100 px/s with normalized cardinal/diagonal motion and consistent
  delta stepping, stops safely at the player for large deltas/coincident centers,
  and stays within existing arena bounds. Chaser and Shooter behavior stays unchanged.
- Tank/Chaser never originate hostile shots, even when closer than a Shooter.
  The global callback selects the nearest active Shooter; no Shooter means no shot.
- Successful timed spawns repeat CCCSCT across multiple cycles; initial creation,
  cap/pause/death rejection and kills obey the sequence rules. Shared cap counts all
  three, rejects at 10 and refills freed slots without altering sequence order.
- Target/highlight and Laser upgrades work for all three. Each type uses the common
  lethal-removal path and drops exactly one value-1 XP, including duplicate kill attempts.
- Pause/death freeze all movement and guarded callbacks without changing spawn
  progression. Repeated native retry resets initial Chaser/sequence, HP, XP/level,
  pickups, choice UI, Laser values, Dash and HUD; no stale objects or extra timers.
- Dash and GAME-016..024 progression/combat remain functional, including magnet,
  XP credit, level-up choice/pause/resume and Shooter fire. Preserve three gameplay timers.
- Add focused tracked tests for meaningful pure rules where practical and targeted
  runtime validation for shared integration; do not add rendering-only Phaser tests.
- Run npm run check, git diff --check and git diff --cached --check. Browser smoke:
  mixed spawning, Tank pursuit/durability, Shooter-only fire, deaths/XP, Dash,
  level-up choice/resume and death/retry. Report actual evidence and limitations.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts and mark only GAME-025 DONE. GAME-026 and later remain BACKLOG until
  separately defined and authorized. Follow AGENTS.md staging/review; do not commit.

---

## GAME-026 — Missile Weapon

STATUS: DONE

DEPENDENCIES:

- GAME-025

GOAL:

Add Missile as the second concrete player weapon alongside Laser, active from the
beginning of every run. No weapon acquisition/inventory or choice-pool change.

PROTOTYPE RULES — FIRING / HOMING:

- One global Missile timer fires automatically every 1800 ms when simulation is
  active and at least one active enemy exists. Launch from the player's world position
  toward the nearest active enemy by world-center distance, with collection-order ties.
- Keep explicit Missile-specific baseline values: speed 450 px/s, lifetime 4000 ms,
  explosion damage 2 and radius 120 world pixels. Use a distinct small yellow/orange
  placeholder circle with an 8-pixel radius, or equivalent geometry within that radius.
- Missile homes: each active frame updates its normalized heading toward its living
  target's current position. Use delta-based direct steering; no turn-rate simulation.
- If its target is removed, reacquire the nearest active enemy from the Missile's
  current world position, with stable collection-order ties. Reacquire whenever an
  untargeted Missile has active enemies available; otherwise retain its last valid
  heading and continue until impact, lifetime expiry or world exit.
- Near-zero target distance must not divide by zero or create non-finite movement.
  Retain the previous heading if available; a launch overlapping an enemy can use a
  zero movement segment and resolve its existing overlap as an immediate swept hit.
- Clip each movement segment to remaining active lifetime. Expiry and whole-projectile
  world exit destroy/remove the Missile without explosion; no stale target dependency
  may prevent motion or cleanup. Already-launched Missiles outlive their original target.

PROTOTYPE RULES — IMPACT / EXPLOSION:

- Sweep the actual frame segment against every active enemy using existing pure
  segment-circle math and the existing enemy radius plus Missile radius. Detonate on
  the first intersection, even if the intersected enemy is not the homing target.
  Equal hit times use collection order; starting overlap is a hit at segment time zero.
- Place detonation at that first hit point on the segment, not the frame endpoint or
  target center. Remove/destroy the Missile once; it cannot pierce or explode again.
- Apply damage 2 once to each active enemy whose world center is within the inclusive
  120-pixel radius of the detonation point. Do not expand explosion range by enemy
  radius. The impact enemy receives explosion damage only, with no separate direct hit.
- Determine affected enemies without skipping entries as deaths remove them from the
  shared collection. Each enemy is damaged at most once by this explosion; separate
  Missiles may each deal their own damage. No damage falloff or armor rules are added.
- Nonlethal enemies retain remaining HP. Every lethal hit uses existing killEnemy,
  producing exactly one normal value-1 XP pickup at that enemy's death position.
  One explosion may kill several enemies. Chaser, Shooter and Tank use the same path.
- Optional brief simple explosion marker may show the area, but correctness must not
  depend on it. No production assets, VFX system or marker-driven damage callbacks.

PAUSE / LIFECYCLE:

- Add exactly one Missile firing timer: normal gameplay now has four events — spawn,
  Laser, Missile and hostile fire. Existing scheduled events may remain running
  internally, but Missile callbacks must return while dead or level-up paused.
- Existing pause/death guards freeze Missile position, homing/target changes and
  remaining lifetime, alongside the current simulation. Resume continues remaining
  runtime normally; no shots or explosions are produced while simulation is frozen.
- create/restart restores baseline Missile values and an empty scene-owned Missile
  collection. Native Phaser shutdown destroys old Missile visuals and timer events;
  repeated retry must not preserve old targets/Missiles or duplicate firing timers.
- Preserve Laser behavior, all three existing Laser upgrade choices and their stale
  selection protection. Missile has no upgrades and does not enter the choice pool.
- Preserve Dash, CCCSCT successful spawning/cap, Shooter-only hostile fire, contact,
  health/death and GAME-016..025 XP/progression/HUD behavior.

IMPLEMENTATION BOUNDARY:

Keep concrete Missile-specific state/behavior. A separate MissileRuntime collection
is appropriate for homing target/heading/lifetime/explosion differences; do not force
Laser/Missile into one straight-projectile record full of optional fields. Reuse
collision, target-selection and enemy damage/death helpers where they genuinely apply.
Only extract a tiny shared weapon-stat shape if both actual weapons use every shared
field and it materially reduces duplication. Explosion radius and homing remain
Missile-specific. No universal weapon framework or unrelated enemy/progression/Dash refactor.

OUT OF SCOPE:

Missile upgrades, weapon acquisition/inventory/slots, Drone, passive modules,
evolution, rerolls/rarity, generic modifier/stat engine, universal Weapon class/manager,
turn-rate physics, new enemy mechanics, production VFX/assets and new dependencies.

ACCEPTANCE / VALIDATION:

- Automatic launch obeys 1800 ms cadence, active simulation and enemy availability;
  nearest-player launch target and stable ties are correct, with no empty-array shot.
- Homing follows a moving target with normalized delta motion. Removing a target
  deterministically reacquires nearest-to-Missile; no replacement preserves heading,
  and later enemies can be acquired. Coincident/near-zero positions remain safe.
- Swept first impact prevents tunneling through any enemy, including non-targets;
  detonation uses the swept hit point and occurs once, including starting overlap.
  Lifetime-clipped movement and world-exit cleanup work without unintended explosions.
- Explosion includes exact radius boundary, excludes centers outside it and damages
  each affected enemy exactly once. Impact damage is not added separately. Multiple
  deaths do not skip affected entries and each produces exactly one XP pickup.
- Chaser/Shooter/Tank health differences remain correct under nonlethal/lethal hits;
  Laser behavior/upgrades and the existing three-choice pool remain unchanged.
- Level-up pause/death freeze Missile production, position, homing and lifetime;
  choice/resume continues in-flight runtime. Other simulation guards remain effective.
- Repeated native retry returns baseline Missile state, no stale visuals/targets,
  exactly one Missile timer and exactly four total gameplay timers. Existing player,
  XP/levels, choices, Laser upgrades, Dash and HUD reset correctly.
- Dash, CCCSCT spawning/cap, Shooter fire and GAME-016..025 progression work alongside
  Missile, including clustered kills, XP magnet/credit and level-up choice/resume.
- Add focused tracked tests for any extracted pure homing/explosion math where
  meaningful; use targeted runtime validation for integration, not rendering-only tests.
- Run npm run check, git diff --check and git diff --cached --check. Browser smoke:
  firing/homing, target death/reacquisition, clustered explosion kills/XP, pause/resume,
  Dash and repeated death/retry. Report actual evidence and remaining limitations.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts and mark only GAME-026 DONE. GAME-027 and later remain BACKLOG until
  separately defined and authorized. Follow AGENTS.md staging/review; do not commit.

---

## GAME-027 — Drone Weapon

STATUS: DONE

DEPENDENCIES:

- GAME-026
- FIX-001 Missile concurrency correction

GOAL:

Add Drone as the third concrete player weapon alongside Laser and Missile. Exactly
one persistent Drone is active from run start; no acquisition, inventory, slots or
changes to the existing three Laser level-up choices.

PROTOTYPE RULES — ORBIT / PRESENTATION:

- Drone is a distinct placeholder world-space companion with visual radius 10 px,
  orbit radius 110 world pixels and angular speed 2 radians/second.
- Each create/restart starts at angle 0, to the player's right. Advance angle only
  by active simulation delta; derive offset from cosine/sine of the current angle
  (positive angle advances clockwise in the screen's downward-positive Y coordinates).
  Angle wrapping is allowed without changing the orbit.
- Derive position from the player's current world position plus the orbit offset,
  following movement and Dash immediately. No inertia, pathfinding or separate body.
- Clamp the Drone visual center to the arena's existing world bounds when near an
  edge; presentation clamping may shorten its apparent orbit. Do not change player
  movement/bounds or add Drone collision/steering behavior. Full-radius inset is not required.
- Drone has no health, contact damage, enemy blocking, collision or targetability.
  It remains a world-space visual, not screen-fixed HUD or production art.

PROTOTYPE RULES — FIRING / BOLTS:

- Add exactly one global Drone firing TimerEvent at 1200 ms. Normal gameplay now
  has five events: spawn, Laser, Missile, Drone and hostile fire. No per-Drone timers.
- On each active callback, select nearest active enemy to the Drone's actual current
  world position, with stable collection-order ties. No enemy means no bolt; near-zero
  aiming distance suppresses the shot safely without changing timer cadence.
- Launch from that Drone position with normalized fixed firing-time aim. Do not
  launch from the player, predict/advance the orbit in the firing callback, home,
  retarget or make the bolt depend on a target after launch.
- Keep explicit Drone bolt baseline values: damage 1, speed 800 px/s, lifetime
  1800 ms and radius 5 px. Use a distinct simple placeholder bolt visual.
- Reuse existing straight player-projectile stepping, lifetime clipping, world-exit
  cleanup and swept segment-circle collision where they fit. Use each bolt's actual
  radius in collision/cleanup; a concrete per-projectile radius field is acceptable
  if needed, preserving current Laser/hostile radius 6 while Drone bolts use 5.
- The first swept enemy impact applies damage once and removes/destroys the bolt;
  preserve earliest-hit and collection-order tie behavior. No piercing or contact attack.
- Bolt damage/speed/lifetime are Drone-specific launch values, independent of every
  Laser upgrade. All Chaser/Shooter/Tank health and lethal damage use the existing
  killEnemy path with exactly one normal value-1 XP pickup per death.

PAUSE / LIFECYCLE:

- Existing death/level-up simulation guards freeze orbit angle and visual position,
  straight bolt movement/collision/lifetime and Drone firing production.
- Scheduled timer phase may continue internally under the existing guard policy;
  callbacks return while paused/dead without adding shots or resetting timers.
- Choice/resume continues the remaining orbit and bolts normally. Death remains
  distinct from level-up pause; no Drone-driven resume/retry or separate pause state.
- Each create/restart creates one fresh Drone at angle 0; native shutdown destroys
  old Drone/bolt visuals and timer callbacks. Collections reset through the existing
  run lifecycle; retry must leave exactly one fresh Drone timer and five gameplay timers.
- Laser remains straight auto-fire from the ship with its unchanged three choices.
  Missile remains separate homing/explosion runtime with maxActiveMissiles = 1;
  neither Missile nor Drone gains upgrades. Preserve Dash, CCCSCT/cap, Shooter-only
  hostile fire and GAME-016..026 health/XP/progression/HUD behavior.

IMPLEMENTATION BOUNDARY:

Keep Drone orbit/attack concrete and scene-owned. A focused pure orbit calculation
is allowed if it clarifies delta/position rules and meaningful tests. Reuse shared
straight projectile runtime; a small straight-player-shot creation helper/data shape
is allowed only when Laser and Drone both use every field without optional
weapon-specific flags. Missile keeps its distinct target/heading/explosion runtime.
Do not encode orbit/attack as generic optional Laser/Missile fields or refactor
unrelated combat/progression/enemy/Dash systems.

OUT OF SCOPE:

Multiple Drones, Drone upgrades/health/destruction, collision/body-blocking,
weapon acquisition/inventory/slots, Passive Modules, Evolution, rarity/rerolls,
weapon unlock choices, universal Weapon class/framework/manager, generic modifier/stat
engine or giant WeaponStats interface, production assets/VFX and new dependencies.

ACCEPTANCE / VALIDATION:

- Exactly one Drone starts at angle 0 and orbits at radius 110 / 2 rad/s away from
  clamping. Equivalent active-time delta partitions yield equivalent angle/position;
  derive the current offset from current player position, including movement/Dash.
- Pause/death freeze orbit angle/position; resume continues. All arena edges keep
  the Drone center within bounds without influencing player movement or adding collision.
- Actual Drone firing obeys 1200 ms cadence/no-enemy suppression. Selection is nearest
  to Drone rather than player, stable ties and near-zero aim are safe, and launch
  origin/heading use its actual current position. Bolts keep fixed aim after launch.
- Swept first impact prevents tunneling and damages only one enemy per bolt.
  Radius/lifetime/world-exit handling respects Drone values without changing Laser
  or hostile-shot behavior. Bolt damage is exactly 1 under all Laser upgrades.
- Chaser/Shooter/Tank nonlethal/lethal hits use shared health/death/one-XP behavior.
  Missile homing/explosion and FIX-001 cap/stable target ownership remain unchanged.
- All pause/death guards stop Drone and bolt movement/lifetime/production; choice
  resume retains runtime. Laser choices/effects remain independent and unchanged.
- Repeated native retry restores one Drone at angle 0, reset player/XP/Laser/Dash,
  no stale bolts/visuals/callbacks, exactly one Drone timer and five gameplay timers.
- Dash, CCCSCT spawning/cap, Shooter fire, Missile and GAME-016..026 progression
  remain functional with Drone, including XP magnet/credit and choice pause/resume.
- If pure orbit math is extracted, add focused tracked tests for partitions/position
  and edge clamping where owned; use runtime validation for integration. No rendering-only tests.
- Run npm run check, git diff --check and git diff --cached --check. Browser smoke:
  orbit, Drone-relative targeting/firing, enemy deaths/XP, pause/resume, Laser upgrade
  independence, Missile coexistence, Dash and repeated native retry. Report actual evidence.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts and mark only GAME-027 DONE. GAME-028 and later remain BACKLOG until
  separately defined and authorized. Follow AGENTS.md staging/review; do not commit.

---

## GAME-028 — Passive Module Foundation

STATUS: DONE

DEPENDENCIES:

- GAME-027
- DESIGN-002 — Player Stats & Passive Modules
- MILESTONE-003 — Weapon Architecture Audit

GOAL:

Introduce exactly four run-local Passive Modules: Hull Plating, Thruster Module,
Collector Field and Combat Processor. Mix them with existing Laser upgrades in
the level-up choice pool. Other DESIGN-002 candidates remain future work.

PROTOTYPE RULES — MODULE STATE / EFFECTS:

- Track an explicit level for each of the four modules, initially 0 on create/restart.
  Each accepted repeat selection increments that module's level by exactly 1 and
  reapplies its effect. No level cap or module inventory slots.
- Hull Plating: baseline maximum HP 5; each level adds 1 maximum HP and immediately
  heals current HP by 1, clamped to the new maximum. Examples: 5/5 → 6/6,
  3/5 → 4/6, then 6/6 → 7/7 on another selection. Refresh current/max HP HUD
  immediately. No Armor, Shield or regeneration.
- Thruster Module: baseline normal movement 300 px/s; each level adds 30 px/s
  (300 → 330 → 360). Preserve normalized cardinal/diagonal delta-based movement.
  Do not change Dash speed 900 px/s, duration 200 ms, cooldown 3000 ms,
  direction locking or expiry-frame timing.
- Collector Field: baseline XP magnet activation radius 180 world pixels; each
  level adds 40 (180 → 220 → 260). Subsequent pickup updates use it immediately.
  Preserve collection radius 20 px, acceleration 900 px/s², maximum magnet speed
  600 px/s and pickup value.
- Combat Processor: baseline global player weapon damage multiplier 1.0; each
  level adds 0.25 (level 0: 1.00x; level 1: 1.25x; level 2: 1.50x).
  Final damage = weapon-specific current damage × global multiplier; do not round.
  Apply to Laser damage, Missile explosion damage and Drone bolt damage only.
  Do not affect hostile projectiles, contact damage, player HP, Dash or XP.
  Laser Power changes Laser's own damage first; the multiplier applies afterward.

PROTOTYPE RULES — LAUNCH DAMAGE / EXISTING WEAPONS:

- Laser and Drone snapshot final multiplied damage when each straight shot launches.
- Missile snapshots final multiplied explosion damage at launch; concrete damage
  on MissileRuntime is appropriate if needed. A Missile frozen during level-up pause
  retains old damage after Combat Processor is selected, as do all in-flight shots.
  Subsequent launches use the new multiplier. Do not read current global damage at impact.
- Preserve Missile homing, explosion radius and maxActiveMissiles = 1, Drone orbit/
  targeting/bolt behavior, and concrete weapon ownership. No weapon acquisition.
- Preserve Laser Power +1 Laser-specific damage; Fire Rate -50 ms, minimum 100 ms;
  Projectile Speed +200 px/s. Fire Rate resets the SAME existing Laser TimerEvent,
  never adds a timer. Combat Processor composes with the resulting Laser damage.

PROTOTYPE RULES — MIXED CHOICES / PRESENTATION:

- Eligible pool: Laser Power, Laser Fire Rate, Laser Projectile Speed, Hull Plating,
  Thruster Module, Collector Field, Combat Processor. All seven stay eligible at every level.
- Each pause presents exactly THREE DISTINCT options sampled without replacement
  from that pool. Use random selection in normal gameplay, no weighting/rarity/rerolls.
  Any option may appear again in a later pause. Do not mutate the source pool.
- Generate choices once on entering a pause; do not regenerate while it remains active.
  Exactly one current accepted choice applies one effect before resume; preserve
  stale/double callback rejection, including callbacks from a previous presentation.
- Keep simple screen-fixed three-choice UI. Labels distinguish Laser weapon upgrades
  from Passive Modules; passive labels show the effect and next module level
  (for example Hull Plating Lv. 1, +1 Max HP / heal 1). No inventory/status panel
  or production UI styling.
- Implement a REQUIRED small pure choice-selection helper: select exactly N distinct
  entries from a supplied pool without replacement, leave the source pool unchanged,
  and accept an injectable random-number source for deterministic tests. Keep it
  selection-only, with no Phaser rendering/UI or loot/rarity/content framework.

PROTOTYPE RULES — PAUSE / XP / RESTART:

- Credit the level-reaching XP award and remove its pickup, then immediately pause.
  Subsequent pickups in that update must not be collected. Preserve XP/level arithmetic.
- Existing guards freeze active movement, enemy chase/targeting, projectiles/Missiles,
  Drone orbit, damage/contact, Dash and XP pickup movement/collection. Spawn and all
  weapon/hostile production callbacks return while paused/dead; scheduled timer phase
  may continue internally under the existing guard policy. Death remains distinct.
- Native create/restart resets four module levels to 0, max/current HP to 5/5,
  normal movement speed to 300, magnet radius to 180, damage multiplier to 1.0,
  Laser values, XP/level, Dash, choices/presentation and weapon runtime.
  No stale objects/callbacks. Exactly five gameplay TimerEvents remain: spawn,
  Laser, Missile, Drone, hostile fire. Do not manually reset every object or add timers.

ARCHITECTURE BOUNDARY:

- Small explicit scene-owned mutable data is allowed for actual consumers only:
  maxHealth, movementSpeed, xpMagnetRadius, globalDamageMultiplier. No unused fields.
- Use explicit PassiveModule identity, explicit effect application and an explicit/
  discriminated choice identity covering the existing Laser upgrades and four modules.
- MILESTONE-003 found no required weapon refactor. Preserve existing concrete owners;
  do not introduce a universal PlayerStats framework, string-keyed property bag,
  generic Modifier pipeline, effect scripting, buff/debuff framework, WeaponManager,
  passive inventory framework, ECS, DI or event bus.

OUT OF SCOPE:

Repair Nanites/regeneration, Armor, Shield, XP Gain, global cooldown/projectile-speed
modules, Area, Duration, Critical Chance/Damage, Amount/additional instances,
weapon acquisition/inventory, module slots/caps, rarity/weights/rerolls, Evolution,
production UI/assets, save/meta progression, universal stat/modifier frameworks,
new dependencies and GAME-029 or later implementation.

ACCEPTANCE / VALIDATION:

- Exactly three distinct eligible choices from seven; Laser and Passive options can
  coexist. Options remain eligible/repeatable across pauses, one effect applies once,
  choices remain stable during a pause and stale callbacks cannot dismiss a later pause.
- Hull Plating covers full/damaged/repeated HP examples, clamps healing and updates HUD.
- Thruster covers 300 → 330 → 360 cardinal/normalized diagonal movement; Dash remains
  900 px/s / 200 ms / 3000 ms with existing timing/bounds and no immunity changes.
- Collector covers 180 → 220 → 260 attraction boundaries; collection/acceleration/
  maximum speed/value remain 20 / 900 / 600 / unchanged respectively.
- Combat Processor covers 1.00x → 1.25x → 1.50x fractional damage for all three weapons,
  Laser Power composition, unchanged hostile/contact damage, old launch snapshots
  versus new launches, including a Missile spanning pause/selection/resume.
- Preserve Missile homing/explosion/radius/cap, Drone orbit/targeting/bolt behavior,
  Laser cadence ownership, CCCSCT spawning/shared cap, Shooter-only hostile fire,
  XP magnet/credit/pause, Dash and death freeze. Two or more native retries restore
  complete baseline state, no stale objects/callbacks and exactly five gameplay timers.
- The required pure choice-selection helper MUST have tracked deterministic tests:
  selecting 3 from the seven-option pool returns exactly 3; all results are distinct;
  every result belongs to the supplied pool; the source pool remains unchanged;
  controlled random input produces deterministic expected output; separate selections
  may offer options seen earlier. Verify no invalid/generalized loot-system behavior
  is introduced. Test meaningful pure module arithmetic/
  state helpers if extracted; no rendering-only tests.
- Targeted runtime/harness checks additionally prove Fire Rate resets the existing
  TimerEvent without duplication, stale callbacks cannot apply twice/dismiss a later
  pause, and entering pause stops subsequent XP collections in the same update.
  These choice-boundary regressions follow MILESTONE-003 recommendations.
- Run npm run check, git diff --check and git diff --cached --check.
- Browser smoke must cover mixed choices, obtaining/stacking all four modules,
  HP/HUD, changed normal movement with unchanged Dash, changed magnet boundary,
  Combat Processor across Laser/Missile/Drone, launch snapshots before/after selection,
  Missile cap/homing, Drone operation, XP pause/resume, death and at least two native
  retries with exactly five timers. Report actual verification and limitations.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts; mark only GAME-028 DONE. GAME-029 and later remain BACKLOG.
  Follow AGENTS.md explicit staging/architect-review workflow; do not commit.

---

## GAME-029 — Weapon Evolution Foundation

STATUS: DONE

DEPENDENCIES:

- GAME-028
- DESIGN-002 — Player Stats & Passive Modules
- DESIGN-003 — Weapon Evolution Architecture
- MILESTONE-003 — Weapon Architecture Audit

GOAL:

Introduce one concrete run-local evolution: Laser + Combat Processor → Prism Laser,
with only the progression state needed for this recipe. Do not evolve Missile or Drone
or build a universal weapon/evolution framework.

PROTOTYPE RULES — BASE LASER RANKS:

- Track explicit run-local Laser Power, Fire Rate and Projectile Speed ranks;
  each starts at 0 on create/restart and has a maximum rank of 2.
- Each accepted corresponding upgrade increments only its rank by exactly 1 and
  applies its existing effect: Power +1 Laser-specific damage; Fire Rate -50 ms
  with authoritative minimum 100 ms; Projectile Speed +200 px/s.
- At rank 2, that individual upgrade is no longer ordinarily eligible. Fully
  mastered Laser is 2/2/2. Do not infer ranks from numeric Laser values or add
  generic weapon ranks/levels to Missile/Drone.

PROTOTYPE RULES — RECIPE / EVOLUTION OFFER:

- Prism Laser is eligible only if all three Laser ranks are >= 2, Combat Processor
  level is >= 1, and Prism Laser has not already evolved. Higher Combat levels qualify.
  Do not consume/remove Combat Processor. Evolution is run-local, never automatic.
- Evaluate eligibility when creating a NEW level-up presentation. If eligible,
  guarantee exactly one "EVOLVE: Prism Laser" option and sample two distinct ordinary
  choices. Otherwise sample exactly three distinct ordinary choices. Total is always three.
- Ordinary pool: Hull Plating, Thruster Module, Collector Field, Combat Processor
  (repeatable/uncapped), plus each Laser upgrade whose own rank is below 2.
  Use existing pure selectChoices for random sampling; do not mutate its source pool.
  No rarity, weights or rerolls. Four passives ensure sufficient ordinary choices.
- Generate once and keep each presentation stable until one option is accepted.
  Completing the final recipe prerequisite through a current choice finishes that
  choice/resume normally; Prism is offered on the NEXT level-up pause, not an immediate
  replacement pause. Ignoring Prism leaves eligibility intact and guarantees it again
  next level-up. Selecting it marks evolved once; it is never offered again that run.
- No chest/elite-drop acquisition, GAME-036 definition or Elite implementation.

PROTOTYPE RULES — PRISM FIRING / SNAPSHOTS:

- Base Laser keeps one straight projectile per valid-target callback. Prism replaces
  that firing pattern with exactly THREE straight Laser projectiles per callback:
  center aim at current target, side directions rotated -12 and +12 degrees.
- Continue using the SAME existing Laser TimerEvent. No evolution timer or sixth timer.
- Every beam launches from the player's actual current world position, uses current
  Laser projectile speed and existing lifetime/radius, and snapshots current
  Laser-specific damage × globalDamageMultiplier at launch. Each beam deals full
  normal Laser damage; do not divide/reduce damage between beams.
- Directions are fixed at launch, non-homing and non-piercing. Reuse existing swept
  first-hit collision, common enemy death/XP and lifetime/world-exit cleanup.
  Near-zero target distance safely suppresses the ENTIRE volley without changing cadence.
- Evolution changes pattern only, not damage, Fire Rate, speed, lifetime or radius
  directly. Selecting Prism does not reset mastered rank-2 numeric values.
  Capped Laser choices stay unavailable; passives remain eligible. No further Prism upgrades.
- Preserve GAME-028 snapshots: existing Laser/Prism/Drone/Missile attacks retain their
  launch damage after later module/evolution choices. Missile launch-damage snapshot,
  damage/homing/explosion/cap and Drone damage/orbit/targeting remain unchanged.
  Evolution does not modify hostile projectile or contact damage.

PROTOTYPE RULES — PAUSE / RESTART:

- Use existing level-up pause: exactly one current choice applies before resume;
  preserve stale/double callback rejection, including callbacks from prior presentations.
- Pause/death guards stop Laser/Prism production and freeze existing projectiles,
  other weapons, enemies, Dash, XP and damage exactly as before. Existing scheduled
  timer phase may continue internally under the documented guarded-callback policy.
- Native create/restart resets all Laser ranks to 0, evolved state to false,
  Laser numeric values and all GAME-028 module/run state to baseline; weapon runtime,
  XP/level, Dash and presentation reset normally. No stale objects/callbacks.
  Exactly five timers remain: spawn, Laser, Missile, Drone, hostile fire; no Prism timer.

ARCHITECTURE BOUNDARY:

- Keep explicit Laser rank state and Prism evolved boolean/identity concrete.
  Small pure eligibility or vector/spread helpers are allowed if useful and materially testable.
- Follow DESIGN-003: GAME-029 implements only Laser → Prism Laser; ranks/progression
  stay Laser-specific, with no generic ranks/evolution fields on Missile or Drone.
  Prism transforms the existing Laser runtime, not a second weapon; the existing
  Laser TimerEvent owns its firing. No generic Amount/projectile-count stat, universal
  evolution recipe registry/framework, WeaponManager or EvolutionManager. Future shared
  extraction waits for actual second/third evolution consumers and demonstrated duplication.
- MILESTONE-003 found no required weapon refactor; preserve concrete weapon ownership.
  No universal WeaponEvolution framework/class, hypothetical recipe registry, WeaponManager,
  generic Missile/Drone rank system, modifier/effect engine, inventory/acquisition framework,
  evolution event bus, ECS, DI or plugin architecture.
- Three-beam Prism is Laser-specific behavior, not a generic projectile-count/Amount stat.
  Preserve DESIGN-002's weapon-specific Amount boundary.

OUT OF SCOPE:

Missile/Drone or second evolution, evolution chests/drops, Elite/Boss or GAME-030+
definition/implementation, weapon acquisition/inventory, new weapons, additional Prism
upgrades, rarity/weights/rerolls, generic Amount modifiers, global evolution framework/
recipe registry, production VFX/assets, meta/save progression and new dependencies.

ACCEPTANCE / VALIDATION:

- All ranks start 0; each upgrade increments only its rank, caps at 2 and disappears
  individually from ordinary eligibility at cap. Numeric effects remain exact.
- Recipe is false for any incomplete prerequisite, true at 2/2/2 + Combat >=1,
  false once evolved, never consumes Combat; final prerequisite affects the next pause.
- Present exactly three choices: eligible unevolved Prism exactly once plus two distinct
  ordinary choices, otherwise three distinct ordinary choices. Ignored Prism returns
  next level; selecting applies once. Stale callbacks cannot evolve or dismiss a later pause.
- Prism fires exactly three normalized center/-12/+12-degree fixed directions from
  actual player origin, with full launch-snapshotted damage/global multiplier and existing
  speed/radius/lifetime. Same Laser event, no extra timer, swept non-piercing behavior
  and whole-volley near-zero suppression. Mastered values persist after evolution.
- Prefer focused pure tracked coverage for deterministic progression/eligibility rules.
  If an eligibility helper is introduced, test false below EACH required Laser rank,
  false with Combat 0, true at exactly 2/2/2 + Combat 1, true with Combat >1,
  false already evolved and input nonmutation.
- If pure spread math is extracted, test exactly three normalized directions, center
  equal to base aim, symmetric +/-12-degree sides and deterministic equivalent input.
  Near-zero suppression stays in firing logic unless the helper explicitly owns it.
  No rendering-only tests; use runtime/harness checks for scene integration.
- Preserve Missile maxActiveMissiles=1/homing/explosion, Drone orbit/targeting/bolts,
  passive stacking, all launch snapshots, XP pause/resume, Dash, CCCSCT spawning/cap,
  Shooter-only hostile fire and death freeze. Repeated native retries restore ranks,
  evolution/module state and numeric baselines with exactly five timers and no stale runtime.
- Run npm run check, git diff --check and git diff --cached --check.
- Later implementation browser smoke: master Laser ranks and prove each capped choice
  disappears; no evolution at Combat 0; obtain Combat and offer Prism on next level;
  ignore once and see it again next level; evolve once; visual/runtime three-beam volley;
  one Laser/five gameplay timers; Combat damage; Missile/Drone coexistence; pause/resume;
  death and at least two native retries; clean browser console. Report actual evidence.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH
  ownership facts; mark only GAME-029 DONE. GAME-030+ remain BACKLOG.
  Follow AGENTS.md explicit staging/architect-review workflow; do not commit.

---

## Future weapon-progression block

GAME-030 is defined READY below. GAME-031+ remain BACKLOG concepts scheduled from
DESIGN-004, not implementation-ready definitions or authorization to implement them.
GAME-029 remains DONE; later tasks each need a separate concrete definition and architect review.

Preferred scheduling order:

GAME-030 Missile upgrades → GAME-031 Spatial Amplifier → GAME-032 Cluster Missile
→ GAME-033 Drone upgrades → GAME-034 Replication Matrix → GAME-035 Twin Drone
→ GAME-036 Elite → GAME-037 Boss → GAME-038 Victory.

Choice-pool responsibility belongs in the GAME-030 / GAME-033 implementation definitions,
not a separate speculative task. Before expanding the runtime pool, account for DESIGN-004's
exactly three distinct choices: focused-weapon upgrade slot, Passive Module slot, open/pivot
slot. Focus follows the last accepted weapon upgrade; passives retain focus and an open
weapon choice may pivot it. Fallbacks and multi-evolution offer arbitration await concrete
definitions. Current GAME-029 runtime/offer rules remain authoritative until this is implemented.

### GAME-030 — Missile Upgrade Foundation

STATUS: READY

DEPENDENCIES:

- GAME-029
- DESIGN-002 — Player Stats & Passive Modules
- DESIGN-003 — Weapon Evolution Architecture
- DESIGN-004 — Missile & Drone Progression

GOAL:

Add explicit run-local Missile upgrades and DESIGN-004's focused three-choice policy.
Implement only Warhead Power, Propulsion and Blast Expansion; no Spatial Amplifier,
Cluster Missile, Drone progression or extra Missile instances.

PROTOTYPE RULES — MISSILE RANKS / VALUES:

- Three explicit MissileRanks start at 0 on create/restart, each capped at 2. Accepting
  a track increments only its rank by exactly 1 and applies its effect once. Its choice
  becomes ineligible at rank 2. Mastery is explicit 2/2/2 state, not inferred numerics
  or generic WeaponLevel; expose that progression for later GAME-032 consumption only.
  Do not add Cluster fields, evolution offers or behavior.
- Warhead Power: Missile-specific explosion damage 2 → 3 → 4 (+1 per rank).
  Final damage = current Missile damage × globalDamageMultiplier, snapshotted at launch.
  Do not modify Laser, Drone or incoming hostile/contact damage.
- Propulsion: Missile flight speed 450 → 525 → 600 px/s (+75 per rank), without cadence,
  player movement, global projectile speed or turn-rate physics changes. Preserve direct
  homing, living-target retention, nearest-from-Missile reacquisition, last-heading
  continuation, lifetime 4000 ms, collision radius 8 and explosion behavior.
- Blast Expansion: explosion radius 120 → 150 → 180 world pixels (+30 per rank).
  Snapshot radius at launch, not explosion; retain direct collision radius 8, no global Area.
- Each MissileRuntime owns its launch final damage, flight speed and explosion radius.
  Movement and detonation consume those stored values. A Missile frozen across upgrade
  selection retains ALL three old values; subsequent launches use the new values.
  Preserve target/reacquisition semantics, swept earliest impact, AoE center-radius rules,
  common lethal removal/XP and expiry/world-exit cleanup.
- Keep maxActiveMissiles = 1 and the existing 1800 ms Missile TimerEvent unchanged.
  No Missile cadence/count upgrade or new timer. Total remains five: spawn, Laser/Prism,
  Missile, Drone, hostile fire.

PROTOTYPE RULES — FOCUS / CHOICE SLOTS:

- Focus is run-local and initially Laser. Only Laser/Missile are upgradeable focus
  identities; Drone has no tracks and is never a focus target in GAME-030.
- Present exactly THREE DISTINCT choices, generated once per pause and stable until
  selection. Eligible ordinary options: uncapped Laser tracks, uncapped Missile tracks,
  Hull Plating, Thruster Module, Collector Field and Combat Processor (repeatable/uncapped).
  Do not mutate source pools; remove earlier slot choices before later slot sampling.
- Slot 1: deterministically choose a least-progressed eligible track of the focused
  weapon. Break equal-rank ties using a small run-local stable cycle/cursor, not randomness.
  Use stable track order (Laser Power/Fire Rate/Projectile Speed; Missile Warhead Power/
  Propulsion/Blast Expansion). Start each weapon cursor at its first track; scan cyclically
  among tied minimum-rank tracks and advance past the chosen track once per new presentation.
  Do not advance/reselect while the same pause stays active.
- If focus is mastered, use the other currently upgradeable weapon with the same
  least-rank/tie-cycle rule. This offer alone does not change focus. If neither weapon
  has an eligible track, fill Slot 1 with a distinct ordinary option via selectChoices.
- Slot 2: sample one of the four eligible passives using selectChoices, excluding any
  earlier choice. Do not guarantee a particular passive or introduce Spatial Amplifier.
- Slot 3: if Prism is eligible/unevolved at presentation creation, it MUST occupy this
  slot exactly once; never displace it with focus/passive choices. Otherwise selectChoices
  samples one remaining ordinary option (Laser, Missile or another passive).
- Fallbacks preserve exactly three distinct options whenever at least three eligible
  ordinary/evolution entries exist. Four uncapped passives ensure enough entries here.
  No rerolls, rarity, weights, generic category/loot framework or upgrade planner.
- Accepting Laser upgrade sets focus Laser; Missile upgrade sets focus Missile; passives
  retain current focus. Accepting Prism sets/keeps focus Laser. Open-slot weapon selections
  can pivot in either direction. Fresh create/restart resets focus Laser and both cursors.

PROTOTYPE RULES — IDENTITY / PAUSE / PRISM:

- Extend explicit LevelUpChoice with concrete Missile upgrade identity alongside Laser,
  Passive and Prism choices. No string property paths, generic stat keys/universal descriptors.
  Missile labels identify next rank and effect, e.g. "Missile: Warhead Power Lv. 1 / +1
  explosion damage", "Propulsion / +75 px/s Missile speed", "Blast Expansion / +30 radius".
  Keep simple prototype presentation, no inventory/UI framework.
- Exactly one accepted current choice applies rank/value/focus effects BEFORE resume.
  Preserve stale/double callback rejection: an old callback cannot affect or dismiss a
  later presentation. Simulation remains frozen during pause; no regenerated choices.
- Preserve Laser ranks/caps/numeric effects, Prism recipe and guarantee. Final prerequisite
  affects NEXT presentation only, ignore/reoffer continues, acceptance is once per run.
  Prism remains same Laser TimerEvent, full-damage three-beam volley and launch snapshots.
  Do not change GAME-029's implemented weapon behavior or its completed task definition.

PROTOTYPE RULES — RESTART / REGRESSION:

- Native create/restart resets Missile ranks 0/0/0, damage 2, speed 450, explosion radius
  120, focus Laser and deterministic cursor baselines. Reset existing Laser ranks/Prism,
  passives/run values, XP/level, Dash, weapon runtimes and choice UI as before.
  No stale Missiles/objects/callbacks and exactly five gameplay timers after every retry.
- Preserve Missile cap/cadence, homing/target ownership, reacquisition/continuation,
  lifetime/radius, swept first impact, primary explosion and cleanup; no evolution.
- Preserve Drone orbit/targeting/timer/bolts/snapshots with no Drone ranks; all four passive
  effects/stacking; XP credit/pause, Dash, enemy CCCSCT/cap, Shooter fire, death and retry.

ARCHITECTURE / TRACKED TESTS:

- Allow only explicit Missile ranks, mutable Missile-specific damage/speed/radius,
  launch-owned MissileRuntime snapshots, Laser/Missile focus and tiny cycle state.
  Prefer a small pure focused-selection helper if it materially improves tests; it may
  accept focus, ranks/caps and cursor and return an eligible track/next cursor.
  Keep selection separate from Phaser UI; selectChoices remains the random-slot sampler.
- Focused deterministic behavior REQUIRES tracked tests: initial Laser least-rank
  selection; lower rank preferred; deterministic rotating ties; capped exclusion;
  mastered-focus fallback; no helper-owned focus mutation unless explicitly part of its
  contract; input ranks/source nonmutation. These requirements apply whether or not a
  separate helper is extracted; do not add rendering-only tests.
- If a small helper owns slot assembly, also test exactly three distinct choices,
  focused upgrade/passive slots, guaranteed open-slot Prism, no duplicates and unchanged
  source collections. Use runtime/harness checks for actual scene/focus/choice integration.
- No WeaponManager, universal WeaponStats/WeaponLevel, generic Upgrade/category/loot system,
  global Area/Projectile Speed/Amount, EvolutionManager, ECS, DI or event bus.

OUT OF SCOPE:

Spatial Amplifier, Cluster Missile/evolution offers, Drone upgrades/evolution, Missile
cadence/count upgrades, new weapons, acquisition/inventory, rarity/rerolls, Elite/Boss/Victory,
production UI/VFX, save/meta, dependencies and GAME-031+ implementation.

ACCEPTANCE / VALIDATION:

- Verify independent Missile 0→1→2 ranks/caps and explicit 2/2/2 mastery with no evolution;
  Warhead 2→3→4, Propulsion 450→525→600 and Blast 120→150→180, without cross-weapon effects.
- Verify initial Laser focus, least-rank selection/rotating ties, mastered-focus fallback,
  no-weapon-eligible fallback, passive focus retention, open-slot Laser↔Missile pivots and
  Prism focus Laser. Exactly three distinct stable choices, no source mutation.
- Verify old in-flight Missile damage/radius/speed remain unchanged across selection pause;
  later launches consume new values, Combat multiplies current damage before launch snapshot.
- Preserve open-slot Prism guarantee, next-pause prerequisite timing and ignore/reoffer,
  once-only selection/stale callback protection, Laser timer identity and five total timers.
- Run all tracked tests through npm run check, git diff --check and git diff --cached --check.
- Later implementation browser/runtime smoke must cover focus/cycling and both pivots,
  passive retention, individual cap disappearance/full mastery, exact numeric progression,
  old/new Missile snapshots through pause, three distinct choices/open-slot Prism and
  ignore/reoffer, cap/homing/reacquisition, Drone, passive/XP/Dash/enemy/Shooter regressions,
  pause/death and at least TWO native retries resetting focus/ranks/numerics/UI/runtimes
  with exactly five timers and no new console errors. Report actual checks/limitations.
- After successful implementation, update CURRENT_STATE and material PROJECT_GRAPH facts,
  mark only GAME-030 DONE; GAME-031+ remain BACKLOG. Follow AGENTS.md staging/architect
  handoff procedure and generate .codex-review/GAME-030-review.txt. Do not commit.

### GAME-031 — Spatial Amplifier Passive

STATUS: BACKLOG

Conceptual dependencies: GAME-030, DESIGN-002, DESIGN-004.

Future run-local Area/explosion-oriented Passive prerequisite for Cluster Missile;
not currently implemented. A later definition must identify actual consumers, effect,
stacking, numbers and level-up integration. Follow DESIGN-002's explicit-consumer rule:
do not impose universal Area behavior on every weapon.

### GAME-032 — Cluster Missile Evolution

STATUS: BACKLOG

Conceptual dependencies: GAME-030, GAME-031, DESIGN-003, DESIGN-004.

Missile mastery + Spatial Amplifier prerequisite → Cluster Missile. Retain the primary
homing Missile, primary impact explosion and primary maxActiveMissiles = 1; add
Missile-specific radial satellite blasts. No recursive fragmentation or universal Amount.
Satellite count/offsets, damage, radii, overlap-hit policy, recipe levels and secondary
damage snapshot timing await the concrete definition. Preserve existing weapon ownership.

### GAME-033 — Drone Upgrade Foundation

STATUS: BACKLOG

Conceptual dependencies: GAME-032, DESIGN-004.

Future tracks: Bolt Power, Firing System and Bolt Propulsion. Mastery follows completion
of real Drone progression; exact caps/increments remain deferred. Preserve persistent
companion/orbit ownership, Drone-relative targeting, one existing Drone TimerEvent and
launch snapshots. Account for the larger-pool policy before runtime pool expansion.

### GAME-034 — Replication Matrix Passive

STATUS: BACKLOG

Conceptual dependencies: GAME-033, DESIGN-002, DESIGN-004.

Future run-local Passive prerequisite direction for Twin Drone Formation, not implemented.
Its concrete task must define actual effect, consumers, numbers, stacking and level-up
integration. Do not introduce universal Amount or give every weapon extra instances.

### GAME-035 — Twin Drone Evolution

STATUS: BACKLOG

Conceptual dependencies: GAME-033, GAME-034, DESIGN-003, DESIGN-004.

Drone mastery + Replication Matrix prerequisite → Twin Drone Formation. Retain the Drone
and add an opposite/mirrored companion within the same Drone weapon. Normally share the
existing Drone TimerEvent with synchronized firing; each may select nearest from its own
world position and fire fixed-aim straight bolts. No per-Drone TimerEvent or universal Amount.
Exact balance, recipe levels and other concrete implementation rules remain deferred.

Remaining future nodes, also BACKLOG concepts:

GAME-036 — Elite Enemy Prototype
GAME-037 — Boss Prototype
GAME-038 — Run Victory / Result Flow
GAME-039 — First DevTools Utilities
GAME-040 — Mobile Movement Prototype
GAME-041 — Production-Like HUD Pass

Elite follows GAME-035; Boss follows Elite; Victory follows Boss. Their existing concepts
are preserved. The later utility/mobile/HUD concepts retain their order after Victory,
with IDs shifted to avoid collisions with the new block. No generic Weapon/Evolution
framework is authorized. All require separate definitions before implementation.

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
