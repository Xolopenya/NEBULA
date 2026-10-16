# NEBULA — Project Graph

## Provenance and authority

- Project: NEBULA.
- Milestone: First Playable / GAME-015 complete.
- Source baseline HEAD: `0cf2cae930ca45119a4ee4358bf19988a53576a9`.
- This map reflects that source baseline plus GAME-035 Twin companion/shared orbit-timer ownership and three-evolution policy.
- Active task request defines task-specific requirements.
- AGENTS.md defines repository policy.
- TASK_GRAPH.md defines task scope, dependencies and status.
- CURRENT_STATE.md records implemented runtime state.
- Actual source code is authoritative for implementation details.
- PROJECT_GRAPH.md is only a navigation/ownership aid; it never overrides these sources.

## File and document nodes

IDs are repository-relative paths; symbols use `path#export`.

| ID | Role |
| --- | --- |
| `src/main.ts` | Browser entry; constructs Phaser.Game with gameConfig |
| `src/game/config.ts` | Full HD FIT config and scene registration |
| `src/game/scenes/BootScene.ts` | Starts GameplayScene |
| `src/game/scenes/GameplayScene.ts` | Owns current run simulation and presentation |
| `src/game/combat/collision.ts` | Pure numeric collision math |
| `src/game/combat/collision.test.ts` | Tracked geometry tests |
| `src/game/progression/experience.ts` | Pure XP threshold/award arithmetic and state type |
| `src/game/progression/experience.test.ts` | Tracked progression tests |
| `src/game/progression/selectChoices.ts` | Pure supplied-pool selection without replacement; injectable RNG |
| `src/game/progression/selectChoices.test.ts` | Tracked deterministic selection tests |
| `src/game/progression/spatialAmplifier.ts` | Pure Missile-specific effective explosion radius from Missile radius and Spatial level |
| `src/game/progression/spatialAmplifier.test.ts` | Six tracked numeric radius tests |
| `src/game/progression/clusterMissile.ts` | Pure explicit Missile mastery/Spatial Cluster eligibility |
| `src/game/progression/clusterMissile.test.ts` | Eight tracked Cluster recipe tests |
| `src/game/progression/evolutionOffer.ts` | Concrete Prism/Cluster/Twin identity and pure offer/cursor policy |
| `src/game/progression/evolutionOffer.test.ts` | Twenty-four tracked three-evolution offer tests |
| `src/game/combat/clusterSatellites.ts` | Pure six-angle satellite relative offsets |
| `src/game/combat/clusterSatellites.test.ts` | Six tracked Cluster geometry tests |
| `src/game/progression/twinDrone.ts` | Pure explicit Drone mastery/Replication Twin eligibility |
| `src/game/progression/twinDrone.test.ts` | Eight tracked Twin eligibility tests |
| `src/game/progression/replicationMatrix.ts` | Pure Drone-specific launch radius from baseline and Replication level |
| `src/game/progression/replicationMatrix.test.ts` | Five tracked numeric radius tests |
| `src/game/progression/focusedUpgrade.ts` | Concrete MissileRanks/DroneRanks, three-weapon WeaponFocus/FocusCursors and pure least-rank/cyclic fallback selection |
| `src/game/progression/focusedUpgrade.test.ts` | Seventeen tracked focused deterministic tests |
| `src/game/progression/prismLaser.ts` | Explicit LaserRanks and pure Prism recipe eligibility |
| `src/game/progression/prismLaser.test.ts` | Tracked pure eligibility tests |
| `src/game/combat/prismSpread.ts` | Pure center/-12/+12 direction calculation and whole-volley near-zero suppression |
| `src/game/combat/prismSpread.test.ts` | Tracked pure spread tests |
| `src/game/enemies/shooterMovement.ts` | Pure inclusive distance-band movement step |
| `src/game/enemies/shooterMovement.test.ts` | Tracked Shooter movement tests |
| `src/game/player/dash.ts` | Pure Dash frame timing split |
| `src/game/player/dash.test.ts` | Tracked Dash timing tests |
| `AGENTS.md` | Repository policy and detailed architect-review protocol |
| `docs/GAME_DESIGN.md` | Gameplay/design intent; includes unimplemented directions |
| `docs/ARCHITECTURE.md` | Architecture principles and boundaries |
| `docs/CURRENT_STATE.md` | Implemented runtime truth |
| `docs/TASK_GRAPH.md` | Work scope, dependencies and status |
| `docs/PROJECT_GRAPH.md` | Repository navigation and ownership |
| `.agents/skills/nebula-game-task/SKILL.md` | Codex scoped-task workflow and branch guard |

## Exported symbol nodes

| ID | Responsibility |
| --- | --- |
| `src/game/config.ts#gameConfig` | Registers BootScene/GameplayScene; 1920x1080 FIT |
| `src/game/scenes/BootScene.ts#BootScene` | Scene startup transition |
| `src/game/scenes/GameplayScene.ts#GameplayScene` | Scene/run owner |
| `src/game/combat/collision.ts#segmentCircleHitTime` | First segment-circle hit in [0,1], else Infinity |
| `src/game/progression/experience.ts#ExperienceState` | Numeric level and XP toward next level |
| `src/game/progression/experience.ts#xpForNextLevel` | Prototype threshold calculation |
| `src/game/progression/experience.ts#addExperience` | Pure award/level/carry calculation |
| `src/game/progression/selectChoices.ts#selectChoices` | Select N distinct entries without mutating the supplied pool |
| `src/game/progression/focusedUpgrade.ts#selectFocusedUpgrade` | Offer Laser/Missile track and next offered-weapon cursor without mutation |
| `src/game/progression/focusedUpgrade.ts#MissileRanks` | Explicit Warhead Power, Propulsion and Blast Expansion ranks |
| `src/game/progression/focusedUpgrade.ts#WeaponFocus` | Concrete Laser/Missile focus identity |
| `src/game/progression/focusedUpgrade.ts#FocusCursors` | Independent cyclic cursor per upgradeable weapon |
| `src/game/progression/prismLaser.ts#LaserRanks` | Power, Fire Rate and Projectile Speed rank state |
| `src/game/progression/prismLaser.ts#canEvolvePrismLaser` | Concrete 2/2/2 + Combat >=1 + unevolved recipe |
| `src/game/combat/prismSpread.ts#prismSpread` | Normalized fixed three-beam directions; empty for near-zero aim |
| `src/game/player/dash.ts#stepDash` | Active-time burst/normal split and duration/cooldown stepping |
| `src/game/enemies/shooterMovement.ts#shooterMovement` | Approach/hold/retreat step capped at band; deterministic coincident retreat |

## Relations

Fixed vocabulary: IMPORTS, OWNS, USES, CREATES, TARGETS, DAMAGES, DESTROYS,
TESTED_BY, DOCUMENTED_BY, IMPLEMENTS_TASK.
Runtime labels below describe scene-owned concepts, not separate modules/classes.

| From | Relation | To |
| --- | --- | --- |
| `src/main.ts` | IMPORTS | `src/game/config.ts#gameConfig` |
| `src/game/config.ts` | IMPORTS | `src/game/scenes/BootScene.ts#BootScene` |
| `src/game/config.ts` | IMPORTS | `src/game/scenes/GameplayScene.ts#GameplayScene` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/collision.ts#segmentCircleHitTime` |
| `src/game/combat/collision.test.ts` | IMPORTS | `src/game/combat/collision.ts#segmentCircleHitTime` |
| `src/game/combat/collision.ts#segmentCircleHitTime` | TESTED_BY | `src/game/combat/collision.test.ts` |
| `src/game/scenes/BootScene.ts#BootScene` | USES | GameplayScene startup via scene.start |
| `src/game/scenes/GameplayScene.ts#GameplayScene` | OWNS | Player, enemies, projectiles, timers, temporary UI |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/experience.ts` (addExperience, xpForNextLevel, ExperienceState) |
| `src/game/progression/experience.test.ts` | IMPORTS | `src/game/progression/experience.ts` |
| `src/game/progression/experience.ts` | TESTED_BY | `src/game/progression/experience.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/player/dash.ts#stepDash` |
| `src/game/player/dash.test.ts` | IMPORTS | `src/game/player/dash.ts#stepDash` |
| `src/game/player/dash.ts#stepDash` | TESTED_BY | `src/game/player/dash.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/shooterMovement.ts#shooterMovement` |
| `src/game/enemies/shooterMovement.test.ts` | IMPORTS | `src/game/enemies/shooterMovement.ts#shooterMovement` |
| `src/game/enemies/shooterMovement.ts#shooterMovement` | TESTED_BY | `src/game/enemies/shooterMovement.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/selectChoices.ts#selectChoices` |
| `src/game/progression/selectChoices.ts#selectChoices` | TESTED_BY | `src/game/progression/selectChoices.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/prismLaser.ts` (LaserRanks, canEvolvePrismLaser) |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/prismSpread.ts#prismSpread` |
| `src/game/progression/prismLaser.ts#canEvolvePrismLaser` | TESTED_BY | `src/game/progression/prismLaser.test.ts` |
| `src/game/combat/prismSpread.ts#prismSpread` | TESTED_BY | `src/game/combat/prismSpread.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/focusedUpgrade.ts` |
| `src/game/progression/focusedUpgrade.ts#selectFocusedUpgrade` | TESTED_BY | `src/game/progression/focusedUpgrade.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/spatialAmplifier.ts#effectiveMissileExplosionRadius` |
| `src/game/progression/spatialAmplifier.ts#effectiveMissileExplosionRadius` | TESTED_BY | `src/game/progression/spatialAmplifier.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/clusterMissile.ts#canEvolveClusterMissile` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/evolutionOffer.ts#selectEvolutionOffer` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/clusterSatellites.ts#clusterSatelliteOffsets` |
| `src/game/progression/clusterMissile.ts#canEvolveClusterMissile` | TESTED_BY | `src/game/progression/clusterMissile.test.ts` |
| `src/game/progression/evolutionOffer.ts#selectEvolutionOffer` | TESTED_BY | `src/game/progression/evolutionOffer.test.ts` |
| `src/game/combat/clusterSatellites.ts#clusterSatelliteOffsets` | TESTED_BY | `src/game/combat/clusterSatellites.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/replicationMatrix.ts#effectiveDroneBoltRadius` |
| `src/game/progression/replicationMatrix.ts#effectiveDroneBoltRadius` | TESTED_BY | `src/game/progression/replicationMatrix.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/twinDrone.ts#canEvolveTwinDrone` |
| `src/game/progression/twinDrone.ts#canEvolveTwinDrone` | TESTED_BY | `src/game/progression/twinDrone.test.ts` |
| Player Laser | TARGETS | currentTarget from active enemies |
| Drone bolt | TARGETS | Nearest active enemy independently from each actual primary/Twin position; fixed launch aim |
| Player projectile | DAMAGES | First intersected active enemy |
| Missile | TARGETS | Nearest-player launch; retain living target; nearest-to-Missile reacquisition only after loss; last heading without target |
| Missile explosion | DAMAGES | Snapshot of enemy centers within the immutable launch explosion radius (baseline 120); killEnemy on lethal damage |
| Hostile projectile and contact | DAMAGES | Player through damagePlayer |
| Lethal enemy hit | DESTROYS | Enemy visual and active runtime entry |
| Player death | CREATES | SHIP DESTROYED and RETRY controls |
| GameplayScene | DOCUMENTED_BY | `docs/CURRENT_STATE.md` |

External annotations: main/config/scenes import Phaser; collision/progression/Dash/Shooter tests import Vitest.
Additional local presentation import: main imports `./style.css` (not a graph node).
No external package internals or generated artifacts are indexed.

## GameplayScene ownership

All private names below are navigation anchors, not exported symbol nodes.

| Category | Current owner / anchors | Boundary |
| --- | --- | --- |
| World presentation | create; arena Graphics, stars, boundary | Scene-owned drawing |
| Player visual/input | player, cursors, wasd; create | Polygon and keyboard bindings |
| Movement/bounds/camera | update; movementDirection; create camera setup | Normalized delta movement, arena clamp/follow |
| Dash | dashKey, dashDirection, dashRemaining, dashCooldownRemaining; update → stepDash / movePlayer | Fresh Space; scene-owned lock, 900 px/s, 200 ms, 3000 ms cooldown; active-time-only and segment clamping; create resets |
| Player health | playerHealth, playerMaxHealth; damagePlayer | Current/max HP and clamping |
| Damage protection | playerDamageProtectionRemaining; updatePlayerProtection | Global 500 ms protection, temporary alpha |
| Level-up pause | isLevelUpPaused; enterLevelUpPause; isSimulationPaused | Distinct from death; level increase freezes update/callbacks; fixed title and three distinct focused/passive/open choices; one selection resumes |
| Choice UI/resume | levelUpPresentation; enterLevelUpPause; acceptLevelUpChoice | Current text identity guard; applies one Laser/Missile/passive effect or Prism, destroys title/options then resumes |
| Death/retry | isPlayerDead; enterPlayerDeath | Idempotent freeze; death-only clickable retry |
| Enemy runtime | enemies; EnemyRuntime; createEnemy | One collection of archetype identity + visual + health; scene-local enemyData holds Chaser/Shooter/Tank HP/speed/presentation |
| Spawning | spawnEnemy; timedSpawnSequence, successfulTimedSpawns, spawnInterval, maximumEnemies | Global timer, successful CCCSCT mix, placement, shared active-count cap; create resets sequence |
| Enemy movement | update; chaseDirection; shooterMovement | Shared Chaser/Tank pursuit / Shooter 350–500 inclusive band; scene arena clamp, pure Shooter step |
| Target/highlight | selectNearestEnemy, currentTarget; update | Nearest active enemy; optional origin/archetype filter reused by Missile/Shooter; temporary outline |
| Enemy death | updateProjectiles / updateMissiles → killEnemy | Create one XP drop, destroy visual, splice enemy, clear dead target |
| XP drops | xpPickups; XpPickup; killEnemy | World-space visual + value 1 + speed; create resets collection |
| XP magnet/collection | updateXpPickups | Stationary outside range; accelerated approach; arrival credits pickup.value then destroys/removes |
| Player XP/levels | playerExperience; create; updateXpPickups → addExperience | Scene owns state/reset/collection; pure module owns thresholds and carry |
| Shared projectiles | projectiles; ProjectileRuntime | source, damage, required radius, visual, velocity, remainingLifetime |
| Projectile stepping | updateProjectiles | Lifetime-clipped motion; swept impact; reverse removal |
| Projectile cleanup | updateProjectiles | Impact, lifetime and world-exit destruction |
| Player Laser | laser; laserTimer; fireLaser | Mutable Laser-only damage/interval/speed, baseline 600 ms; existing timer reset for cadence upgrades |
| Drone / Twin | drone, twinDrone, twinDroneEvolved, droneAngle, droneConfig; updateDrone, positionDrone, fireDrone, fireDroneFrom | One initial companion; Twin adds exactly one mirrored visual at shared angle+PI; same active-time 110px / 2rad orbit, independent center clamp, one shared firing event and per-origin targets/suppression |
| Replication Matrix | moduleLevels.replication; fireDroneFrom → effectiveDroneBoltRadius | +1 px per level added to baseline Drone bolt radius5 at launch; existing runtime radius owns swept collision/cleanup; acceptance does not change focus/cursors/timers; create resets0 |
| Drone upgrades | droneRanks, droneAttackValues, droneTimer; acceptLevelUpChoice / fireDrone | Explicit ranks0..2, damage1/2/3, interval1200/1050/900, speed800/1000/1200; same event reset/elapsed0; launch snapshots; create resets |
| Straight player-shot creation | firePlayerProjectile → launchPlayerProjectile; fireLaser, fireDrone | Existing target aim wrapper and shared direction-based launch snapshot; Prism directions enter launch directly; weapon damage multiplied by globalDamageMultiplier at launch; Laser radius 6, Drone baseline 5 + Replication level |
| Missile | missile, missileValues, missiles; MissileRuntime; fireMissile, aimMissile, updateMissiles | Separate concrete homing target/heading/lifetime and readonly launch clusterEnabled/damage/speed/explosionRadius; immutable maxActiveMissiles = 1; cap blocks launch without resetting the one 1800 ms timer |
| Spatial Amplifier | moduleLevels.spatial; fireMissile → effectiveMissileExplosionRadius | Repeatable +15 px per level added to Missile-specific radius at launch; stored MissileRuntime radius owns later explosion; no focus/cursor mutation or other consumers |
| Missile explosion | updateMissiles → explodeMissile → killEnemy | Earliest swept hit point, center-radius snapshot damage once, common XP/death; no direct hit |
| Laser upgrades | laserRanks, LaserUpgrade; acceptLevelUpChoice | Explicit independent ranks 0..2; capped upgrades filtered out, numeric effects and same timer reset retained; create resets ranks |
| Prism Laser | prismEvolved; enterLevelUpPause → canEvolvePrismLaser; fireLaser → prismSpread | New-presentation eligibility only; sole-eligible Slot 3 guarantee or three-evolution arbitration after focused/passive slots; same Laser timer/runtime, three full-damage shots; create resets evolved state |
| Cluster Missile | clusterEvolved; fireMissile → MissileRuntime.clusterEnabled; updateMissiles → explodeMissile then explodeClusterSatellites | Explicit mastery/Spatial eligibility; primary-first union of six launch-derived satellite circles, one satellite hit per surviving enemy; no extra timer/child projectile |
| Evolution offer | evolutionOfferCursor; enterLevelUpPause → selectEvolutionOffer | Separate Prism-first cursor advances once per new presentation, sole eligible guaranteed, eligible pairs alternate/all3 cycle by cyclic scan; offered successor cursor; acceptance never advances |
| Missile upgrades | missileRanks, missileValues; acceptLevelUpChoice | Explicit ranks 0..2 and mutable damage/speed/explosion radius; snapshots isolate active Missiles; create resets |
| Weapon focus | weaponFocus, focusCursors; enterLevelUpPause → selectFocusedUpgrade | Laser baseline; three independent track cursors, least-rank cyclic offers; mastered focus scans remaining Laser/Missile/Drone order; offered cursor advances once per presentation, focus changes only on accepted weapon/evolution |
| Passive Modules | PassiveModule, moduleLevels; acceptLevelUpChoice | Explicit Hull/Thruster/Collector/Combat/Spatial/Replication levels and effects; create resets levels and mutable values |
| Mutable run values | playerMaxHealth, movementSpeed, xpMagnetRadius, globalDamageMultiplier | Consumed by HP/HUD, normal movement, pickup activation and player weapon launch damage respectively |
| Mixed choice pool | OrdinaryChoice, LevelUpChoice, levelUpPool, choiceLabel; enterLevelUpPause → selectChoices | Six repeatable passives plus uncapped Laser/Missile/Drone tracks; focused least-rank slot, passive slot, open/evolution slot; existing text identity rejects stale callbacks |
| Hostile fire | fireHostileProjectile; hostileFireInterval | 1500 ms global timer; selectNearestEnemy('shooter') filters nearest active Shooter only; no per-enemy timers |
| Collision inputs | updateProjectiles; player/enemy/projectile radii | Scene supplies positions and combined radii |
| Collision calculation | collision.ts; segmentCircleHitTime | Pure numeric math, no Phaser/runtime records |
| Player damage sources | updatePlayerContact; updateProjectiles | Contact and hostile impacts share damagePlayer/protection |
| Runtime HUD | hud; updateHud; create, update, damagePlayer, updateXpPickups | Fixed HP current/max, XP/threshold, level and Dash readiness; reads existing state, refreshes on mutations/displayed cooldown change, recreated on retry |
| Temporary UI | create; enterPlayerDeath | Fixed labels, SHIP DESTROYED, RETRY |

## Runtime and lifecycle

BootScene.create → scene.start('GameplayScene') → GameplayScene.create
→ fresh player/enemy/collections → spawn/Laser/Missile/Drone/hostile timers → update.

update: consume fresh Dash press → simulation pause guard → player movement/Dash split/bounds → Drone orbit → Chaser/Tank pursuit / Shooter band movement → target/highlight
→ protection countdown → straight projectiles/impacts → Missiles/homing/explosions → contact damage → XP magnet/collection (simulation active only).

Lethal player damage → damagePlayer → enterPlayerDeath → frozen simulation
→ RETRY pointerdown (once) → scene.restart → fresh create.

- Dash presses are consumed before pause guards and on choice acceptance; native repeat events are rejected, so rejected presses do not queue.
- create resets Dash clocks/direction and reacquires input; keyboard shutdown clears old keys on retry.
- create resets health/protection/death, arrays, target and successfulTimedSpawns; constructs one initial Chaser outside the timed CCCSCT sequence.
- Spawn, Laser, Missile, Drone and hostile callbacks return while dead or level-up paused; timer events remain scheduled.
- Level-increasing collection removes its pickup then pauses; subsequent pickups remain frozen.
- One current choice applies its Laser/Missile/Drone upgrade, Passive Module or Prism/Cluster/Twin evolution then destroys levelUpPresentation and clears pause; stale choices cannot close a new pause.
- Final recipe prerequisite resumes normally; only the next presentation can offer an evolution. Offers use the separate three-evolution cursor; accepting Prism sets prismEvolved without consuming Combat or changing numeric Laser values/timer.
- create resets all three evolution flags and evolutionOfferCursor to false/Prism-first. Active Missiles own clusterEnabled at launch; satellite resolution derives only from readonly launch damage/radius after primary deaths.
- create resets missileRanks, missileValues, weaponFocus and focusCursors as well as laserRanks and prismEvolved. Prism uses the same straight-shot collection and five existing gameplay timers.
- Projectile iteration stops after cleaning the lethal hostile impact; remaining objects freeze.
- create empties missiles; native Phaser restart shuts down old display objects/UI and five timer events before create. Missile position/target/heading/lifetime freeze under existing simulation guard.
- create resets droneRanks/droneAttackValues and all three focus cursors; Firing System resets the existing droneTimer in place only on accepted current choice. create restores one Drone at angle 0; Twin reference/flag clear; both orbit visuals/bolts freeze under simulation guard. Shared straight projectiles use each launch radius for collision/cleanup.
- Retry exists only in death presentation; no manual per-object reset service.

## Test coverage

| Classification | Owner | Evidence |
| --- | --- | --- |
| TRACKED TESTS | collision.test.ts → segmentCircleHitTime | 9 tests: hits, misses, overlap, tangent, zero step, bounds, ordering |
| TRACKED TESTS | experience.test.ts → experience.ts | 8 tests: thresholds, credit, exact/excess/multiple levels, zero/nonmutation, split awards |
| TRACKED TESTS | selectChoices.test.ts → selectChoices | 6 tests: size/distinctness/membership/nonmutation, deterministic RNG, later repeats, empty/full selection and invalid input |
| TRACKED TESTS | spatialAmplifier.test.ts → effectiveMissileExplosionRadius | Six tests: baseline/stacking, Blast combinations, deterministic numeric inputs and uncapped repeats |
| TRACKED TESTS | clusterMissile.test.ts → canEvolveClusterMissile | Eight cases: each missing rank, Spatial0/exact/higher, evolved exclusion, nonmutation |
| TRACKED TESTS | evolutionOffer.test.ts → selectEvolutionOffer | Twenty-four cases: none/sole from every cursor, all pairs/all3/reset/nonbaseline cycles, removing each evolution, successors and nonmutation |
| TRACKED TESTS | clusterSatellites.test.ts → clusterSatelliteOffsets | Six cases: angles/count/radii120/195/195.5, explicit centers, deterministic inputs and independent results |
| TRACKED TESTS | twinDrone.test.ts → canEvolveTwinDrone | Eight cases: each missing rank, Replication0/exact/higher, evolved exclusion, nonmutation |
| TRACKED TESTS | replicationMatrix.test.ts → effectiveDroneBoltRadius | Five cases: levels0/1/2/5, supplied baseline/repeatability/input stability |
| TRACKED TESTS | focusedUpgrade.test.ts → selectFocusedUpgrade | Seventeen cases: original Laser/Missile rules plus Drone minimum/ties/caps/cursor independence, ordered three-weapon fallbacks, all-mastered and nonmutation |
| TRACKED TESTS | prismLaser.test.ts → canEvolvePrismLaser | 8 cases: each missing rank, Combat 0/exact/higher, already evolved, nonmutation |
| TRACKED TESTS | prismSpread.test.ts → prismSpread | 7 cases: three unit directions, center aim, symmetric sides, deterministic equivalent aim, near-zero suppression |
| TRACKED TESTS | dash.test.ts → stepDash | 6 tests: active burst, expiry split/boundary, delta partitions, zero time, large frame |
| TRACKED TESTS | shooterMovement.test.ts → shooterMovement | 7 tests: speed/diagonal, inclusive edges, retreat, large steps, coincident center, zero time, partitions |
| RUNTIME / MANUAL EVIDENCE | GameplayScene combat/death/restart | Browser smoke and ignored validation harnesses; not tracked Vitest coverage |

Ignored harnesses are not graph nodes and do not run in npm run check.

## Task ownership links

| Implemented owner | Relation | Task range |
| --- | --- | --- |
| BootScene/GameplayScene: startup, player, arena, camera | IMPLEMENTS_TASK | GAME-001..004 |
| GameplayScene: enemy runtime/spawn/chase/target | IMPLEMENTS_TASK | GAME-005..008 |
| GameplayScene: Laser/projectiles/enemy damage/death | IMPLEMENTS_TASK | GAME-009..011 |
| GameplayScene: player health/hostile fire/death/retry | IMPLEMENTS_TASK | GAME-012..015 |

GameplayScene.killEnemy / xpPickups IMPLEMENTS_TASK GAME-016 — XP Drop.
GameplayScene.updateXpPickups IMPLEMENTS_TASK GAME-017 — XP Magnet Collection.
GameplayScene.playerExperience / progression/experience.ts IMPLEMENTS_TASK GAME-018 — Player XP and Level Rules.
GameplayScene.isLevelUpPaused / enterLevelUpPause / isSimulationPaused IMPLEMENTS_TASK GAME-019.
GameplayScene.levelUpPresentation / acceptLevelUpChoice IMPLEMENTS_TASK GAME-020.
GameplayScene.laser / laserTimer / acceptLevelUpChoice IMPLEMENTS_TASK GAME-021.
GameplayScene.hud / updateHud IMPLEMENTS_TASK GAME-022 — Basic HUD.
GameplayScene Dash state / player/dash.ts IMPLEMENTS_TASK GAME-023 — Initial Ship Active Ability: Dash.
GameplayScene enemyData / EnemyRuntime / spawnEnemy / hostile fire + enemies/shooterMovement.ts IMPLEMENTS_TASK GAME-024 — Chaser/Shooter.
GameplayScene enemyData / shared direct pursuit / timedSpawnSequence IMPLEMENTS_TASK GAME-025 — Tank.
GameplayScene MissileRuntime / missile / fireMissile / updateMissiles / explodeMissile IMPLEMENTS_TASK GAME-026 — Missile.
GameplayScene drone / droneAngle / updateDrone / fireDrone / firePlayerProjectile IMPLEMENTS_TASK GAME-027 — Drone.
GameplayScene.moduleLevels / mutable run values / LevelUpChoice / progression/selectChoices.ts IMPLEMENTS_TASK GAME-028 — Passive Module Foundation.
GameplayScene.laserRanks / prismEvolved / progression/prismLaser.ts / combat/prismSpread.ts IMPLEMENTS_TASK GAME-029 — Laser → Prism Laser.
GameplayScene.missileRanks / missileValues / weaponFocus / focusCursors / progression/focusedUpgrade.ts IMPLEMENTS_TASK GAME-030 — Missile Upgrade Foundation.
GameplayScene.moduleLevels.spatial / fireMissile / progression/spatialAmplifier.ts IMPLEMENTS_TASK GAME-031 — Spatial Amplifier Passive.
Spatial affects only final Missile launch explosion radius; Blast Expansion remains separate. create resets Spatial0; existing choice slots/focus and five timers remain authoritative.
GameplayScene.clusterEvolved / evolutionOfferCursor / explodeClusterSatellites; progression/clusterMissile.ts / evolutionOffer.ts and combat/clusterSatellites.ts IMPLEMENTS_TASK GAME-032 — Cluster Missile Evolution.
GameplayScene.droneRanks / droneAttackValues / droneTimer; progression/focusedUpgrade.ts three-weapon policy IMPLEMENTS_TASK GAME-033 — Drone Upgrade Foundation.
GameplayScene.moduleLevels.replication / fireDrone / progression/replicationMatrix.ts IMPLEMENTS_TASK GAME-034 — Replication Matrix Passive.
GameplayScene.twinDroneEvolved / twinDrone / positionDrone / fireDroneFrom; progression/twinDrone.ts and evolutionOffer.ts three-identity policy IMPLEMENTS_TASK GAME-035 — Twin Drone Formation.
Only fireDroneFrom consumes Replication at each origin launch; updateProjectiles uses per-shot stored radius with no live module lookup. Twin preserves full current damage/speed/radius/lifetime snapshots.
Combat Processor is applied in launchPlayerProjectile and fireMissile; explodeMissile consumes MissileRuntime.damage and explosionRadius, never current run values; updateMissiles consumes MissileRuntime.speed.
create resets all module levels and run values before constructing the HUD. Existing native shutdown still owns object/timer cleanup.
No generalized weapon stats framework is implemented.
Statuses and dependencies remain in TASK_GRAPH.md, not duplicated here.

## Common navigation queries

| Question | Likely path / anchor |
| --- | --- |
| Where does enemy death happen? | GameplayScene.ts → updateProjectiles / updateMissiles → explodeMissile / killEnemy |
| Where are XP drops/magnet/collection owned? | GameplayScene.ts → killEnemy, xpPickups, updateXpPickups; create resets |
| Where are XP thresholds and levels calculated? | src/game/progression/experience.ts; scene playerExperience |
| Where are level-up choices/resume owned? | GameplayScene.ts → enterLevelUpPause, levelUpPresentation, acceptLevelUpChoice |
| Where are HUD values rendered/refreshed? | GameplayScene.ts → hud, updateHud; create, damagePlayer, updateXpPickups |
| Where is Dash input/timing/reset owned? | GameplayScene.ts → dashKey, update, movePlayer, create; player/dash.ts#stepDash |
| Where is player damage controlled? | GameplayScene.ts → damagePlayer, updatePlayerProtection |
| Who owns projectile movement/lifetime/cleanup? | GameplayScene.ts → updateProjectiles (straight shots), updateMissiles (homing) |
| Where are Drone orbit/bolts owned? | GameplayScene.ts → droneConfig, droneAttackValues, droneRanks, droneTimer, droneAngle, twinDrone, twinDroneEvolved, updateDrone, positionDrone, fireDrone, fireDroneFrom, firePlayerProjectile / updateProjectiles |
| Where are Missile homing/explosion owned? | GameplayScene.ts → fireMissile, aimMissile, updateMissiles, explodeMissile; collision.ts sweep |
| Where is collision math implemented? | collision.ts#segmentCircleHitTime |
| Where is collision math tested? | src/game/combat/collision.test.ts |
| Where are enemy archetypes/movement owned? | GameplayScene.ts → EnemyArchetype, enemyData, update; enemies/shooterMovement.ts |
| Where are enemy spawn callbacks? | GameplayScene.ts → create timer / spawnEnemy / timedSpawnSequence / successfulTimedSpawns |
| Where are player/hostile fire callbacks? | GameplayScene.ts → create timers / fireLaser / fireMissile / fireDrone / fireHostileProjectile → selectNearestEnemy('shooter') |
| What guards callbacks while dead or level-up paused? | GameplayScene.ts → isSimulationPaused checks in spawn/fire helpers |
| Who owns Laser firing configuration? | GameplayScene.ts → laser, laserTimer, fireLaser; create/acceptLevelUpChoice |
| Where are Prism prerequisites, ranks and spread owned? | GameplayScene.ts → laserRanks, prismEvolved, enterLevelUpPause, fireLaser; progression/prismLaser.ts; combat/prismSpread.ts |
| Where does restart cleanup occur? | GameplayScene.ts → enterPlayerDeath → Phaser scene.restart lifecycle |
| Where are repository/task rules? | AGENTS.md; docs/TASK_GRAPH.md; active user task |

## Update policy

Update for material file/module boundaries, exported architectural symbols, runtime ownership,
important local imports or meaningful architectural test coverage. Reinspect source then refresh
baseline HEAD provenance. Do not update for balance/tuning, wording, each status change or every
private helper rename. This map contains current implementation only, never future subsystem stubs.
