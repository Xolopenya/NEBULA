# NEBULA — Project Graph

## Provenance and authority

- Project: NEBULA.
- Milestone: First Playable / GAME-015 complete.
- Source baseline HEAD: `2850b982112ff92ce7d55fea359328ec8b7330ad`.
- This map reflects that source baseline plus the GAME-016 XP-drop ownership changes.
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
| Player Laser | TARGETS | currentTarget from active enemies |
| Player projectile | DAMAGES | First intersected active enemy |
| Hostile projectile and contact | DAMAGES | Player through damagePlayer |
| Lethal enemy hit | DESTROYS | Enemy visual and active runtime entry |
| Player death | CREATES | SHIP DESTROYED and RETRY controls |
| GameplayScene | DOCUMENTED_BY | `docs/CURRENT_STATE.md` |

External annotations: main/config/scenes import Phaser; collision tests import Vitest.
Additional local presentation import: main imports `./style.css` (not a graph node).
No external package internals or generated artifacts are indexed.

## GameplayScene ownership

All private names below are navigation anchors, not exported symbol nodes.

| Category | Current owner / anchors | Boundary |
| --- | --- | --- |
| World presentation | create; arena Graphics, stars, boundary | Scene-owned drawing |
| Player visual/input | player, cursors, wasd; create | Polygon and keyboard bindings |
| Movement/bounds/camera | update; movementDirection; create camera setup | Normalized delta movement, arena clamp/follow |
| Player health | playerHealth, playerMaxHealth; damagePlayer | Current/max HP and clamping |
| Damage protection | playerDamageProtectionRemaining; updatePlayerProtection | Global 500 ms protection, temporary alpha |
| Death/retry | isPlayerDead; enterPlayerDeath | Idempotent freeze; death-only clickable retry |
| Enemy runtime | enemies; EnemyRuntime; createEnemy | One collection of visual + health records |
| Spawning | spawnEnemy; spawnInterval, maximumEnemies | Global timer, placement, active-count cap |
| Chase | update; chaseDirection | World-space chase and arena clamp |
| Target/highlight | selectNearestEnemy, currentTarget; update | Nearest active enemy; temporary outline |
| Enemy death | updateProjectiles → killEnemy | Create one XP drop, destroy visual, splice enemy, clear dead target |
| XP drops | xpPickups; XpPickup; killEnemy | Stationary world-space visual + value 1; create resets collection; no collection yet |
| Shared projectiles | projectiles; ProjectileRuntime | source, damage, visual, velocity, remainingLifetime |
| Projectile stepping | updateProjectiles | Lifetime-clipped motion; swept impact; reverse removal |
| Projectile cleanup | updateProjectiles | Impact, lifetime and world-exit destruction |
| Player Laser | fireLaser; laserFireInterval | 600 ms automatic fire at currentTarget; fixed launch aim |
| Hostile fire | fireHostileProjectile; hostileFireInterval | 1500 ms global timer; nearest active firing enemy |
| Collision inputs | updateProjectiles; player/enemy/projectile radii | Scene supplies positions and combined radii |
| Collision calculation | collision.ts; segmentCircleHitTime | Pure numeric math, no Phaser/runtime records |
| Player damage sources | updatePlayerContact; updateProjectiles | Contact and hostile impacts share damagePlayer/protection |
| Temporary UI | create; enterPlayerDeath | Fixed labels, SHIP DESTROYED, RETRY |

## Runtime and lifecycle

BootScene.create → scene.start('GameplayScene') → GameplayScene.create
→ fresh player/enemy/collections → spawn/Laser/hostile timers → update.

update: death guard → player movement/bounds → enemy chase → target/highlight
→ protection countdown → projectiles/impacts → contact damage.

Lethal player damage → damagePlayer → enterPlayerDeath → frozen simulation
→ RETRY pointerdown (once) → scene.restart → fresh create.

- create resets health/protection/death, arrays and target; constructs fresh visuals.
- Spawn, Laser and hostile callbacks return while dead; timer events remain scheduled.
- Projectile iteration stops after cleaning the lethal hostile impact; remaining objects freeze.
- Native Phaser restart shuts down old display objects/UI and timer events before create.
- Retry exists only in death presentation; no manual per-object reset service.

## Test coverage

| Classification | Owner | Evidence |
| --- | --- | --- |
| TRACKED TESTS | collision.test.ts → segmentCircleHitTime | 9 tests: hits, misses, overlap, tangent, zero step, bounds, ordering |
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
No magnet movement, collection or player XP-total/level subsystem is implemented.
Statuses and dependencies remain in TASK_GRAPH.md, not duplicated here.

## Common navigation queries

| Question | Likely path / anchor |
| --- | --- |
| Where does enemy death happen? | GameplayScene.ts → updateProjectiles / killEnemy |
| Where are stationary XP drops owned? | GameplayScene.ts → killEnemy, xpPickups; create resets |
| Where is player damage controlled? | GameplayScene.ts → damagePlayer, updatePlayerProtection |
| Who owns projectile movement/lifetime/cleanup? | GameplayScene.ts → updateProjectiles |
| Where is collision math implemented? | collision.ts#segmentCircleHitTime |
| Where is collision math tested? | src/game/combat/collision.test.ts |
| Where are enemy spawn callbacks? | GameplayScene.ts → create timer / spawnEnemy |
| Where are player/hostile fire callbacks? | GameplayScene.ts → create timers / fireLaser / fireHostileProjectile |
| What guards callbacks after death? | GameplayScene.ts → isPlayerDead checks in spawn/fire helpers |
| Who owns Laser firing configuration? | GameplayScene.ts → laserFireInterval, projectileSpeed/Lifetime, laserDamage |
| Where does restart cleanup occur? | GameplayScene.ts → enterPlayerDeath → Phaser scene.restart lifecycle |
| Where are repository/task rules? | AGENTS.md; docs/TASK_GRAPH.md; active user task |

## Update policy

Update for material file/module boundaries, exported architectural symbols, runtime ownership,
important local imports or meaningful architectural test coverage. Reinspect source then refresh
baseline HEAD provenance. Do not update for balance/tuning, wording, each status change or every
private helper rename. This map contains current implementation only, never future subsystem stubs.
