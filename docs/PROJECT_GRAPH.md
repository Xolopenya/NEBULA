# NEBULA — Project Graph

## Provenance and authority

- Project: NEBULA.
- Milestone: First Playable / GAME-015 complete.
- Source baseline HEAD: `d1521017c284d63cbe323823899f144681db22d3`.
- This map reflects that source baseline plus the GAME-025 Tank/shared-pursuit and spawn-composition changes.
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
| Player Laser | TARGETS | currentTarget from active enemies |
| Player projectile | DAMAGES | First intersected active enemy |
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
| Level-up pause | isLevelUpPaused; enterLevelUpPause; isSimulationPaused | Distinct from death; level increase freezes update/callbacks; fixed title and three Laser upgrades; one selection resumes |
| Choice UI/resume | levelUpPresentation; enterLevelUpPause; acceptLevelUpChoice | Current text identity guard; applies Laser effect, destroys title/options then resumes |
| Death/retry | isPlayerDead; enterPlayerDeath | Idempotent freeze; death-only clickable retry |
| Enemy runtime | enemies; EnemyRuntime; createEnemy | One collection of archetype identity + visual + health; scene-local enemyData holds Chaser/Shooter/Tank HP/speed/presentation |
| Spawning | spawnEnemy; timedSpawnSequence, successfulTimedSpawns, spawnInterval, maximumEnemies | Global timer, successful CCCSCT mix, placement, shared active-count cap; create resets sequence |
| Enemy movement | update; chaseDirection; shooterMovement | Shared Chaser/Tank pursuit / Shooter 350–500 inclusive band; scene arena clamp, pure Shooter step |
| Target/highlight | selectNearestEnemy, currentTarget; update | Nearest active enemy; temporary outline |
| Enemy death | updateProjectiles → killEnemy | Create one XP drop, destroy visual, splice enemy, clear dead target |
| XP drops | xpPickups; XpPickup; killEnemy | World-space visual + value 1 + speed; create resets collection |
| XP magnet/collection | updateXpPickups | Stationary outside range; accelerated approach; arrival credits pickup.value then destroys/removes |
| Player XP/levels | playerExperience; create; updateXpPickups → addExperience | Scene owns state/reset/collection; pure module owns thresholds and carry |
| Shared projectiles | projectiles; ProjectileRuntime | source, damage, visual, velocity, remainingLifetime |
| Projectile stepping | updateProjectiles | Lifetime-clipped motion; swept impact; reverse removal |
| Projectile cleanup | updateProjectiles | Impact, lifetime and world-exit destruction |
| Player Laser | laser; laserTimer; fireLaser | Mutable Laser-only damage/interval/speed, baseline 600 ms; existing timer reset for cadence upgrades |
| Laser upgrades | LaserUpgrade; acceptLevelUpChoice | Cumulative power/rate/speed effects before resume; create restores baseline |
| Hostile fire | fireHostileProjectile; hostileFireInterval | 1500 ms global timer; selectNearestEnemy('shooter') filters nearest active Shooter only; no per-enemy timers |
| Collision inputs | updateProjectiles; player/enemy/projectile radii | Scene supplies positions and combined radii |
| Collision calculation | collision.ts; segmentCircleHitTime | Pure numeric math, no Phaser/runtime records |
| Player damage sources | updatePlayerContact; updateProjectiles | Contact and hostile impacts share damagePlayer/protection |
| Runtime HUD | hud; updateHud; create, update, damagePlayer, updateXpPickups | Fixed HP current/max, XP/threshold, level and Dash readiness; reads existing state, refreshes on mutations/displayed cooldown change, recreated on retry |
| Temporary UI | create; enterPlayerDeath | Fixed labels, SHIP DESTROYED, RETRY |

## Runtime and lifecycle

BootScene.create → scene.start('GameplayScene') → GameplayScene.create
→ fresh player/enemy/collections → spawn/Laser/hostile timers → update.

update: consume fresh Dash press → simulation pause guard → player movement/Dash split/bounds → Chaser/Tank pursuit / Shooter band movement → target/highlight
→ protection countdown → projectiles/impacts → contact damage → XP magnet/collection (simulation active only).

Lethal player damage → damagePlayer → enterPlayerDeath → frozen simulation
→ RETRY pointerdown (once) → scene.restart → fresh create.

- Dash presses are consumed before pause guards and on choice acceptance; native repeat events are rejected, so rejected presses do not queue.
- create resets Dash clocks/direction and reacquires input; keyboard shutdown clears old keys on retry.
- create resets health/protection/death, arrays, target and successfulTimedSpawns; constructs one initial Chaser outside the timed CCCSCT sequence.
- Spawn, Laser and hostile callbacks return while dead or level-up paused; timer events remain scheduled.
- Level-increasing collection removes its pickup then pauses; subsequent pickups remain frozen.
- One current choice applies its Laser upgrade then destroys levelUpPresentation and clears pause; stale choices cannot close a new pause.
- Projectile iteration stops after cleaning the lethal hostile impact; remaining objects freeze.
- Native Phaser restart shuts down old display objects/UI and timer events before create.
- Retry exists only in death presentation; no manual per-object reset service.

## Test coverage

| Classification | Owner | Evidence |
| --- | --- | --- |
| TRACKED TESTS | collision.test.ts → segmentCircleHitTime | 9 tests: hits, misses, overlap, tangent, zero step, bounds, ordering |
| TRACKED TESTS | experience.test.ts → experience.ts | 8 tests: thresholds, credit, exact/excess/multiple levels, zero/nonmutation, split awards |
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
No generalized weapon stats framework is implemented.
Statuses and dependencies remain in TASK_GRAPH.md, not duplicated here.

## Common navigation queries

| Question | Likely path / anchor |
| --- | --- |
| Where does enemy death happen? | GameplayScene.ts → updateProjectiles / killEnemy |
| Where are XP drops/magnet/collection owned? | GameplayScene.ts → killEnemy, xpPickups, updateXpPickups; create resets |
| Where are XP thresholds and levels calculated? | src/game/progression/experience.ts; scene playerExperience |
| Where are level-up choices/resume owned? | GameplayScene.ts → enterLevelUpPause, levelUpPresentation, acceptLevelUpChoice |
| Where are HUD values rendered/refreshed? | GameplayScene.ts → hud, updateHud; create, damagePlayer, updateXpPickups |
| Where is Dash input/timing/reset owned? | GameplayScene.ts → dashKey, update, movePlayer, create; player/dash.ts#stepDash |
| Where is player damage controlled? | GameplayScene.ts → damagePlayer, updatePlayerProtection |
| Who owns projectile movement/lifetime/cleanup? | GameplayScene.ts → updateProjectiles |
| Where is collision math implemented? | collision.ts#segmentCircleHitTime |
| Where is collision math tested? | src/game/combat/collision.test.ts |
| Where are enemy archetypes/movement owned? | GameplayScene.ts → EnemyArchetype, enemyData, update; enemies/shooterMovement.ts |
| Where are enemy spawn callbacks? | GameplayScene.ts → create timer / spawnEnemy / timedSpawnSequence / successfulTimedSpawns |
| Where are player/hostile fire callbacks? | GameplayScene.ts → create timers / fireLaser / fireHostileProjectile → selectNearestEnemy('shooter') |
| What guards callbacks while dead or level-up paused? | GameplayScene.ts → isSimulationPaused checks in spawn/fire helpers |
| Who owns Laser firing configuration? | GameplayScene.ts → laser, laserTimer, fireLaser; create/acceptLevelUpChoice |
| Where does restart cleanup occur? | GameplayScene.ts → enterPlayerDeath → Phaser scene.restart lifecycle |
| Where are repository/task rules? | AGENTS.md; docs/TASK_GRAPH.md; active user task |

## Update policy

Update for material file/module boundaries, exported architectural symbols, runtime ownership,
important local imports or meaningful architectural test coverage. Reinspect source then refresh
baseline HEAD provenance. Do not update for balance/tuning, wording, each status change or every
private helper rename. This map contains current implementation only, never future subsystem stubs.
