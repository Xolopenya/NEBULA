# NEBULA — Project Graph

## Provenance and authority

- Project: NEBULA.
- Milestone: First Playable / GAME-015 complete.
- Source baseline HEAD: `102879220f6264c3a7477550530f264f0634ea90`.
- This map reflects that source baseline plus the staged GAME-049 combat resolution/immutable launch snapshots; current Scene retains geometry/death/presentation and GAME-039 DEV wiring.
- Active task request defines task-specific requirements.
- AGENTS.md defines repository policy.
- TASK_GRAPH.md defines task scope, dependencies and status.
- CURRENT_STATE.md records implemented runtime state; source code and tests are exact implementation truth.
- GAME_DESIGN.md is target player-facing behavior; ARCHITECTURE.md is target ownership/contracts/invariants.
- CONTENT_MANIFEST.md fixes current-wave content; BALANCE.md holds target ranges and playtest hypotheses.
- Current implementation may intentionally differ from target design; no future runtime modules are mapped here.
- Actual source code is authoritative for implementation details.
- PROJECT_GRAPH.md is only a navigation/ownership aid; it never overrides these sources.

## File and document nodes

IDs are repository-relative paths; symbols use `path#export`.

| ID | Role |
| --- | --- |
| `src/main.ts` | Browser entry; constructs Phaser.Game with gameConfig |
| `src/game/config.ts` | Full HD FIT config and scene registration |
| `src/game/scenes/BootScene.ts` | Starts GameplayScene |
| `src/game/scenes/GameplayScene.ts` | Owns current run simulation, presentation and DEV API per-create binding |
| `src/game/run/RunLifecycle.ts` | Focused lifecycle authority: RunState including PAUSED, PauseReason, terminal/disposal; no Phaser dependency |
| `src/game/run/RunLifecycle.test.ts` | 19 pure lifecycle/reason/composition/terminal/disposal/independence cases |
| `src/game/input/KeyboardInput.ts` | Concrete desktop key bindings, GameplayIntent sample/reset/dispose and held-control suppression |
| `src/game/input/KeyboardInput.test.ts` | 17 adapter mapping/edge/repeat/reset/held/fresh/disposal cases |
| `src/game/run/RunRandom.ts` | Phaser-free uint32 seed, four independent explicit Mulberry32 streams, exact-owner disposal |
| `src/game/run/RunRandom.test.ts` | 21 pure seed/golden/range/independence/disposal cases |
| `src/game/run/RunDiagnostics.ts` | Phaser-free run observation: seed identity, active elapsed, aggregates, bounded semantic timeline and exact-owner disposal |
| `src/game/run/RunDiagnostics.test.ts` | 35 pure seed/lifetime/numeric/identity/atomicity/copy/eviction/terminal cases |
| `src/game/player/PlayerBuild.ts` | Phaser-free run Build: exact3/1/6 slots, ten bases/modifiers/effective cache, twelve Tag totals/derived identity, detached canonical snapshot and captured disposal |
| `src/game/player/PlayerBuild.test.ts` | 52 pure slot/base/percentage/flat/Analyzer/Tag/identity/copy/atomicity/lifetime cases |
| `src/game/player/PlayerDefense.ts` | Phaser-free current Hull/Shield/protection arithmetic, detached snapshot and exact-owner disposal; no maximum or lifecycle ownership |
| `src/game/player/PlayerDefense.test.ts` | 35 pure validation/Shield-first/loss/protection/heal/cap/detachment/lifetime cases |
| `src/game/devTools.ts` | DevSnapshot with numeric runSeed/runState/copied ordered pauseReasons and detached nested diagnostics/build; five-command DevTools types, no runtime registry |
| `src/game/scenes/GameplayScene.devTools.test.ts` | 174 tracked Scene/DevTools/lifecycle/RNG/pause/input/diagnostics/Build/Tag/Defense/combat cases, including installed Phaser Clock phase integration |
| `src/game/combat/combat.ts` | Phaser-free exact Attack/source/snapshot/Damage contracts, validated immutable factory and pure composition/hit/enemy arithmetic |
| `src/game/combat/combat.test.ts` | 71 pure kind/variant/shape/copy/freeze/numeric/composition/phase/actual-loss cases |
| `src/game/combat/collision.ts` | Pure numeric collision math |
| `src/game/combat/collision.test.ts` | Tracked geometry tests |
| `src/game/progression/experience.ts` | Pure XP threshold/award arithmetic and state type |
| `src/game/progression/experience.test.ts` | Tracked progression tests |
| `src/game/progression/selectChoices.ts` | Pure supplied-pool selection without replacement; required explicit random source |
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
| `src/game/enemies/warden.ts` | Pure successful-spawn30 predicate, current-HP phase and four/eight radial directions |
| `src/game/enemies/warden.test.ts` | Fourteen tracked schedule/phase/burst cases |
| `src/game/enemies/eliteTank.ts` | Pure scheduled-Tank / successful-count Elite predicate |
| `src/game/enemies/eliteTank.test.ts` | Seven tracked Elite schedule tests |
| `src/game/enemies/shooterMovement.ts` | Pure inclusive distance-band movement step |
| `src/game/enemies/shooterMovement.test.ts` | Tracked Shooter movement tests |
| `src/game/player/dash.ts` | Pure Dash frame timing split |
| `src/game/player/dash.test.ts` | Tracked Dash timing tests |
| `AGENTS.md` | Repository policy and detailed architect-review protocol |
| `docs/GAME_DESIGN.md` | Target player-facing gameplay behavior; not implementation status |
| `docs/ARCHITECTURE.md` | Target ownership boundaries, contracts, lifecycle rules and invariants |
| `docs/CONTENT_MANIFEST.md` | Exact content scope of the current development wave |
| `docs/BALANCE.md` | Balance target ranges, pacing hypotheses and playtest checkpoints |
| `docs/CURRENT_STATE.md` | Implemented runtime truth |
| `docs/TASK_GRAPH.md` | Implementation order, dependencies and task status |
| `docs/PROJECT_GRAPH.md` | Implemented code/navigation/ownership map, not future module design |
| `.agents/skills/nebula-game-task/SKILL.md` | Codex scoped-task workflow and branch guard |

## Exported symbol nodes

| ID | Responsibility |
| --- | --- |
| `src/game/config.ts#gameConfig` | Registers BootScene/GameplayScene; 1920x1080 FIT |
| `src/game/scenes/BootScene.ts#BootScene` | Scene startup transition |
| `src/game/scenes/GameplayScene.ts#GameplayScene` | Scene/run owner |
| `src/game/run/RunLifecycle.ts#PauseReason` | Exactly REWARD, MANUAL, FOCUS_LOSS; requestPause/releasePause/hasPauseReason and detached ordered reason view |
| `src/game/input/KeyboardInput.ts#GameplayIntent` | Raw moveX/moveY and activatePressed/pausePressed edges |
| `src/game/input/KeyboardInput.ts#KeyboardInput` | Desktop adapter only; no gameplay movement/Dash simulation |
| `src/game/run/RunRandom.ts#RunRandom` | Immutable runSeed; encounter/reward/world/boss next(); dispose invalidates captured handles |
| `src/game/run/RunDiagnostics.ts#RunDiagnostics` | Explicit record/advance/snapshot/dispose API; observation only, no gameplay references |
| `src/game/run/RunDiagnostics.ts#ChoiceIdentity` | Exact 18 current typed Level-Up identities, independent of UI labels |
| `src/game/run/RunDiagnostics.ts#DiagnosticArchetype` | chaser/shooter/tank/boss; Elite valid only for tank |
| `src/game/run/RunDiagnostics.ts#DiagnosticRecord` | Six semantic timeline variants, timestamped with active elapsed |
| `src/game/run/RunDiagnostics.ts#RunDiagnosticsSnapshot` | Detached plain seed/elapsed/aggregates/timeline/evictions/terminal view |
| `src/game/player/PlayerBuild.ts#PlayerBuild` | Owns fixed slots, immutable BaseStats, explicit RunModifiers, derived EffectiveStats, independent Tag totals/identity cache; detached reads and disposed invariants |
| `src/game/player/PlayerBuild.ts#BuildSnapshot` | Canonical detached slots/baseStats/runModifiers/effectiveStats/tags/identity; replaces GAME-046 read model |
| `src/game/player/PlayerBuild.ts#TAG_IDS` | Immutable canonical twelve-Tag tuple, shared by identity ordering and tests |
| `src/game/player/PlayerBuild.ts#TagId` | Literal union derived from TAG_IDS; no arbitrary string identity |
| `src/game/player/PlayerBuild.ts#TagPoints` | Exactly twelve nonnegative safe-integer numeric totals |
| `src/game/player/PlayerBuild.ts#BuildIdentity` | Cached derived dominant/secondary positive score tiers, canonical ties |
| `src/game/player/PlayerBuild.ts#PlayerBuild.addTagPoints` | Validated atomic permanent accumulation; no current production callers, stats/RNG/diagnostics/timer effects |
| `src/game/player/PlayerBuild.ts#BaseStats` | Exact ten shared fields; PercentStatKey excludes Analyzer, CombatSystemId has only three current identities |
| `src/game/player/PlayerDefense.ts#PlayerDefense` | constructor(initialHull), snapshot, advanceProtection, applyIncomingDamage, healHull, reconcileMaxHull, setCurrentShield, dispose; Shield setter has no production caller |
| `src/game/player/PlayerDefense.ts#PlayerDefenseSnapshot` | Detached currentHull/currentShield/protectionRemaining only |
| `src/game/player/PlayerDefense.ts#IncomingDefenseResult` | Local accepted/protectionRejected/shieldLost/hullLost/hullDepleted arithmetic result |
| `src/game/combat/combat.ts#Attack` | Closed LaserAttack/MissileAttack/DroneAttack/HostileAttack/ContactAttack; FlightSnapshot/MissileSnapshot/ContactSnapshot, AttackSnapshot, PlayerAttackSource/AttackSource |
| `src/game/combat/combat.ts#Damage` | EnemyDamage separates calculatedDamage/healthAfter/hpLost/depleted; PlayerDamage wraps existing IncomingDefenseResult; HitPhase is DIRECT/PRIMARY/SATELLITE/CONTACT |
| `src/game/combat/combat.ts#createAttack` | Copies exact positive finite bounded primitives; freezes outer and snapshot; validates Cluster half-damage before mutation |
| `src/game/combat/combat.ts#composePlayerDamage` | Left-to-right local*C*R, Drone-only E; no intermediate cap or other stat factors |
| `src/game/combat/combat.ts#calculateHitDamage` | Closed legal source/phase rules; snapshot-only full or Cluster-half damage |
| `src/game/combat/combat.ts#calculateEnemyDamage` | Pure positive HP/damage validation, negative transient overkill HP and actual stored loss |
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
| `src/game/enemies/warden.ts#shouldSpawnWarden` | Successful spawn30 and not-yet-spawned predicate |
| `src/game/enemies/warden.ts#wardenPhase` | Positive current HP above30 phase1, otherwise phase2; dead has no phase |
| `src/game/enemies/warden.ts#wardenBurstDirections` | Four/eight normalized world-space directions |
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
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/combat.ts` (factory/composition/hit/enemy results and concrete types) |
| `src/game/combat/combat.ts` | TYPE_IMPORTS | `src/game/player/PlayerDefense.ts#IncomingDefenseResult` |
| `src/game/combat/combat.ts` | TESTED_BY | `src/game/combat/combat.test.ts` |
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
| `src/game/scenes/GameplayScene.ts` | CREATES | `src/game/run/RunRandom.ts#RunRandom` after successful RunLifecycle.start, from crypto uint32 entropy |
| `src/game/scenes/GameplayScene.ts` | CREATES | `src/game/input/KeyboardInput.ts#KeyboardInput` bound to exact owning run |
| `src/game/input/KeyboardInput.ts#KeyboardInput` | TESTED_BY | `src/game/input/KeyboardInput.test.ts` |
| `src/game/run/RunRandom.ts#RunRandom` | TESTED_BY | `src/game/run/RunRandom.test.ts` |
| `src/game/scenes/GameplayScene.ts` | CREATES | `src/game/run/RunDiagnostics.ts#RunDiagnostics` after RunRandom; captures exact shutdown/destroy disposal |
| `src/game/scenes/GameplayScene.ts` | RECORDS | RunDiagnostics at accepted create/update/spawn/kill/damage/XP/reward/pause/terminal boundaries |
| `src/game/devTools.ts` | IMPORTS_TYPE | `src/game/run/RunDiagnostics.ts#RunDiagnosticsSnapshot` |
| `src/game/scenes/GameplayScene.ts` | CREATES | `src/game/player/PlayerBuild.ts#PlayerBuild` during PREPARING, before HP/HUD; exact captured disposal |
| `src/game/scenes/GameplayScene.ts` | CREATES | `src/game/player/PlayerDefense.ts#PlayerDefense` from Build Hull during PREPARING, before HUD; disposeDefense captures the exact owner |
| `src/game/player/PlayerDefense.ts#PlayerDefense` | TESTED_BY | `src/game/player/PlayerDefense.test.ts` and actual Scene incoming/contact/reward integration |
| GameplayScene.damagePlayer | USES | Current PlayerDefense after run/player/God guards; only positive Hull loss reaches diagnostics, then HUD/alpha/Death |
| GameplayScene.applyBuildChange / acceptLevelUpChoice | USES | Build maximum then Defense.reconcileMaxHull; current Hull Plating also healHull(1,max) before reward release |
| GameplayScene.updateHud / publishDevTools | READS | Defense current Hull/Shield/protection; Build maximum; DEV compatibility scalars from one snapshot |
| `src/game/devTools.ts` | IMPORTS_TYPE | `src/game/player/PlayerBuild.ts#BuildSnapshot` for detached snapshot.build |
| `src/game/player/PlayerBuild.ts#PlayerBuild` | TESTED_BY | `src/game/player/PlayerBuild.test.ts` and actual Scene integration |
| `src/game/run/RunDiagnostics.ts#RunDiagnostics` | TESTED_BY | `src/game/run/RunDiagnostics.test.ts` and actual Scene integration tests |
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
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/warden.ts#shouldSpawnWarden` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/warden.ts#wardenPhase` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/warden.ts#wardenBurstDirections` |
| `src/game/enemies/warden.ts` | TESTED_BY | `src/game/enemies/warden.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/eliteTank.ts#shouldSpawnEliteTank` |
| `src/game/enemies/eliteTank.ts#shouldSpawnEliteTank` | TESTED_BY | `src/game/enemies/eliteTank.test.ts` |
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
| Player visual/input | player, inputAdapter; create / bindRunInput | Polygon and exact-create KeyboardInput; raw keys remain in adapter |
| Movement/bounds/camera | update; movementDirection; create camera setup | Normalized delta movement, arena clamp/follow |
| Dash | inputAdapter.sample / intent.activatePressed, dashDirection, dashRemaining, dashCooldownRemaining; update → stepDash / movePlayer | Space intent; scene-owned lock, 900 px/s, 200 ms, 3000 ms cooldown; PAUSED freezes burst/cooldown; create resets |
| Player defense | playerDefense; create/disposeDefense; damagePlayer | Defense owns current Hull/Shield/protection; read-only playerHealth getter; playerMaxHealth reads Build Hull |
| PlayerBuild | playerBuild; create/disposeBuild; applyBuildChange | Fixed [LASER,MISSILE,COMBAT_DRONE], Active/Core empty; cached ten effective stats; private exact-run/choice mutation bridge |
| Damage protection | read-only playerDamageProtectionRemaining; updatePlayerProtection → PlayerDefense.advanceProtection | Defense owns fixed500ms/countdown; Scene owns alpha, RUNNING guard and existing update phase |
| Contact separation | updatePlayerContact | First inclusive overlap R44/60, minimum translation/coincident+X, player bounds21/25; before damage even under God/protection, no Impact/RNG/extra pass |
| Level-up pause | isLevelUpPaused; enterLevelUpPause; RunLifecycle REWARD | Flag is transaction identity only; REWARD owns PAUSED; current choice releases only REWARD, other reasons retain pause |
| Choice UI/resume | levelUpPresentation; enterLevelUpPause; acceptLevelUpChoice | Exact run/text/REWARD identity; applies one current upgrade/evolution, destroys UI, releases REWARD only; resumes if no other reason remains |
| Run lifecycle | run; RunLifecycle; create | PREPARING/RUNNING/PAUSED/TERMINAL/DISPOSED; concrete composed reasons; first terminal from RUNNING/PAUSED; captured exact disposal |
| Pause/input projection | bindRunInput; handlePauseRequest; projectPause; canResume; pausePresentation | Exact-owner BLUR/HIDDEN loss, separate FOCUS/VISIBLE bookkeeping, explicit focused Escape resume; Scene Clock.paused freezes five events; minimal non-reward UI |
| Run RNG | runRandom; RunRandom; create | Fresh owner after successful RUNNING; crypto uint32 seed; exact captured shutdown/destroy disposal; old handles throw; World/Boss dormant |
| Run diagnostics | runDiagnostics; RunDiagnostics; create/update/observePause | Fresh owner from numeric seed after RNG construction; bootstrap initial Chaser; active delta once; history only, 256-row timeline; captured disposal; no Clock/input/RNG references |
| Spawn randomness | spawnEnemy → runRandom.encounter.next | Two draws after guards: fixed side mapping then varying coordinate; deterministic fallback adds none |
| Choice randomness | enterLevelUpPause → selectChoices → runRandom.reward.next | Explicit source at three sampling sites; one draw per sampled slot, none for focus/evolution/stable UI/acceptance |
| Death/retry | derived isPlayerDead; enterPlayerDeath | Accepted DEATH precedes existing UI; RETRY bound to owning run; rejects Victory |
| Victory/result | derived isRunVictorious, victoryPresentation; enterRunVictory | Atomic attack completion after new common Boss defeat, first terminal wins; fixed current-level result and identity/duplicate-guarded native NEW RUN; create clears state/UI references |
| Enemy runtime | enemies; EnemyRuntime; createEnemy | One collection of archetype/isElite + visual/health + readonly contactDamage/xpValue/collisionRadius; enemyData and concrete eliteTankData own regular/Elite/Boss values/presentation; Warden phase styles are concrete |
| Spawning | spawnEnemy; timedSpawnSequence, successfulTimedSpawns, spawnInterval, maximumEnemies | Same2000ms timer/successful CCCSCT mix; shouldSpawnEliteTank promotes Tank12/24; Warden replaces30, active Boss suppresses spawns/count only; blocked cap10 callbacks retain pending count; create resets0 |
| Enemy movement | update; chaseDirection; shooterMovement | Shared Chaser/Tank pursuit (regular100/Elite120) / Shooter350–500 inclusive band; Warden70/100 current-HP pursuit; scene clamp max(25, collisionRadius), pure Shooter step |
| Target/highlight | selectNearestEnemy, currentTarget; update | Nearest active enemy; optional origin/archetype filter reused by Missile/Shooter; temporary outline restores current Boss phase3px/Elite3px/regular2px style |
| Enemy death | updateProjectiles / updateMissiles → applyEnemyHit → killEnemy | Create one pickup with runtime xpValue (regular1/Elite5/Warden10), destroy visual, splice enemy, clear dead target |
| XP drops | xpPickups; XpPickup; killEnemy | World-space visual + per-kill value1/5/10 + speed; common magnet/collection, create resets collection |
| XP magnet/collection | updateXpPickups | Stationary outside range; accelerated approach; arrival credits pickup.value then destroys/removes |
| Player XP/levels | playerExperience; create; updateXpPickups → addExperience | Scene owns state/reset/collection; pure module owns thresholds and carry |
| Shared projectiles | projectiles; ProjectileRuntime | readonly typed Laser/Drone/Hostile Attack + exact run; source/damage/radius derived read-only; visual/velocity/remainingLifetime |
| Projectile stepping | updateProjectiles | Lifetime-clipped motion; swept impact; reverse removal; lethal Boss projectile cleanup precedes Victory and stops later shots |
| Projectile cleanup | updateProjectiles | Impact, lifetime and world-exit destruction |
| Player Laser | laser; laserTimer; fireLaser | Mutable Laser-only damage/interval/speed, baseline 600 ms; existing timer reset for cadence upgrades |
| Drone / Twin | drone, twinDrone, twinDroneEvolved, droneAngle, droneConfig; updateDrone, positionDrone, fireDrone, fireDroneFrom | One initial companion; Twin adds exactly one mirrored visual at shared angle+PI; same active-time 110px / 2rad orbit, independent center clamp, one shared firing event and per-origin targets/suppression |
| Replication Matrix | moduleLevels.replication; fireDroneFrom → effectiveDroneBoltRadius | +1 px per level added to baseline Drone bolt radius5 at launch; existing runtime radius owns swept collision/cleanup; acceptance does not change focus/cursors/timers; create resets0 |
| Drone upgrades | droneRanks, droneAttackValues, droneTimer; acceptLevelUpChoice / fireDrone | Explicit ranks0..2, damage1/2/3, interval1200/1050/900, speed800/1000/1200; same event reset/elapsed0; launch snapshots; create resets |
| Straight player-shot creation | aimProjectile → launchPlayerProjectile; fireLaser, fireDrone | Concrete target aim and exact-run guarded direction launch; fireLaser/fireDroneFrom use composePlayerDamage and createAttack before any visual; Prism shares one Attack, Twin has one per origin; Velocity and physical Scale are stored only in frozen snapshots; local radii Laser6/Drone5+Replication |
| Missile | missile, missileValues, missiles; MissileRuntime; fireMissile, aimMissile, updateMissiles | Readonly MissileAttack + exact run, concrete homing target/heading/lifetime; read-only variant/numeric getters derive from immutable snapshot; immutable maxActiveMissiles = 1; cap blocks launch without resetting the one 1800 ms timer |
| Spatial Amplifier | moduleLevels.spatial; fireMissile → effectiveMissileExplosionRadius | Repeatable +15 px per level added to Missile-specific radius at launch; stored MissileRuntime.explosionRadius owns later explosion; no focus/cursor mutation or other consumers |
| Missile explosion | updateMissiles → explodeMissile → applyEnemyHit → killEnemy | Earliest swept hit point, center-radius snapshot damage once, common XP/death; primary and optional satellites plus Missile cleanup finish before Victory; no direct hit |
| Laser upgrades | laserRanks, LaserUpgrade; acceptLevelUpChoice | Explicit independent ranks 0..2; capped upgrades filtered out, numeric effects and same timer reset retained; create resets ranks |
| Prism Laser | prismEvolved; enterLevelUpPause → canEvolvePrismLaser; fireLaser → prismSpread | New-presentation eligibility only; sole-eligible Slot 3 guarantee or three-evolution arbitration after focused/passive slots; same Laser timer/runtime, three full-damage shots; create resets evolved state |
| Cluster Missile | clusterEvolved; fireMissile → MissileRuntime.clusterEnabled; updateMissiles → explodeMissile then explodeClusterSatellites | Explicit mastery/Spatial eligibility; primary-first union of six launch-derived satellite circles, one satellite hit per surviving enemy; no extra timer/child projectile |
| Evolution offer | evolutionOfferCursor; enterLevelUpPause → selectEvolutionOffer | Separate Prism-first cursor advances once per new presentation, sole eligible guaranteed, eligible pairs alternate/all3 cycle by cyclic scan; offered successor cursor; acceptance never advances |
| Missile upgrades | missileRanks, missileValues; acceptLevelUpChoice | Explicit ranks 0..2 and mutable damage/speed/explosion radius; snapshots isolate active Missiles; create resets |
| Weapon focus | weaponFocus, focusCursors; enterLevelUpPause → selectFocusedUpgrade | Laser baseline; three independent track cursors, least-rank cyclic offers; mastered focus scans remaining Laser/Missile/Drone order; offered cursor advances once per presentation, focus changes only on accepted weapon/evolution |
| Passive Modules | PassiveModule, moduleLevels; acceptLevelUpChoice | Explicit Hull/Thruster/Collector/Combat/Spatial/Replication levels and effects; create resets levels and mutable values |
| Shared stat consumers | derived playerMaxHealth/movementSpeed; fireLaser/fireMissile/fireDroneFrom; weaponInterval/resetWeaponTimer | Build Hull/Thrust, Reactor, Drone-only Engineering, Velocity/Scale and local interval/FireControl; retained Missile body radius; no Shield/Impact/Analyzer effects |
| Local compatibility | xpMagnetRadius, globalDamageMultiplier, moduleLevels | Collector activation radius, legacy Combat Processor, Spatial explosion and Replication bolt addition; Hull/Thruster levels are label/history, Build owns flat bonuses |
| Mixed choice pool | OrdinaryChoice, LevelUpChoice, levelUpPool, choiceLabel; enterLevelUpPause → selectChoices | Six repeatable passives plus uncapped Laser/Missile/Drone tracks; focused least-rank slot, passive slot, open/evolution slot; existing text identity rejects stale callbacks |
| Hostile fire | fireHostileProjectile; hostileFireInterval | Same1500 ms global timer independently attempts nearest Shooter aimed shot and active Warden phase4/8 radial burst via launchHostileProjectile; no per-enemy timers or phase resets |
| Collision inputs | updateProjectiles; player/enemy/projectile radii | Scene supplies per-enemy body radius24/40 + projectile/Missile/player radius; explosion coverage stays center-only |
| Collision calculation | collision.ts; segmentCircleHitTime | Pure numeric math, no Phaser/runtime records |
| Player damage sources | updatePlayerContact; updateProjectiles | Contact and hostile impacts share damagePlayer/protection |
| Runtime HUD | hud; updateHud; create, update, damagePlayer, updateXpPickups | Fixed HP Defense current/Build max, XP/threshold, level and Dash readiness; refreshed on mutations/displayed cooldown change, recreated on retry |
| Temporary UI | create; enterPlayerDeath | Fixed labels, SHIP DESTROYED, RETRY |

## Runtime and lifecycle

BootScene.create → scene.start('GameplayScene') → GameplayScene.create
→ fresh PREPARING lifecycle/Build/Defense → player/HUD/enemy/collections
→ spawn/Laser/Missile/Drone/hostile timers/input/UI → run.start → RunRandom → RunDiagnostics → DEV → update.

update: sample intents / handle PauseRequest → lifecycle/player/intent guards → diagnostics.advance(delta) once → player movement/Dash split/bounds → Drone orbit → Chaser/Tank/Warden pursuit / Shooter band movement → target/highlight
→ Defense protection countdown/Scene alpha → straight projectiles/impacts → Missiles/homing/explosions → contact separation/damage → XP magnet/collection (simulation active only).

Lethal player damage → damagePlayer → Defense commits Hull0/protection500 → Hull-loss diagnostics/HUD/alpha0.5 → enterPlayerDeath/alpha0.25 → frozen simulation
→ RETRY pointerdown (once) → scene.restart → fresh create.

Common Warden removal during a player hit → complete that projectile or full Missile/Cluster
detonation and cleanup → enterRunVictory → frozen gameplay / fixed result
→ guarded NEW RUN pointerdown → native scene.restart → fresh create.

- Adapter consumes intent edges and suppresses held controls across pause/resume/terminal; repeats/rejected activation never queue. Choice acceptance resets adapter, not raw keys.
- create resets Dash clocks/direction and Clock.paused, with a fresh exact-owner adapter/focus binding; old callbacks/cleanup remain inert on reused Scene.
- create constructs fresh lifecycle/Build/Defense (Hull5/Shield0/protection0), resets arrays, target and successfulTimedSpawns0 (no Elite/Boss), bossSpawned/bossDefeated false; constructs one initial Chaser outside the timed CCCSCT sequence. Captured exact Defense disposal cannot touch a fresh owner on reused Scene.
- Spawn, Laser, Missile, Drone and hostile callbacks return while dead, level-up paused or victorious; same timer events remain scheduled without Victory reset/pause/recreation.
- Level-increasing collection removes its pickup then pauses; subsequent pickups remain frozen.
- One current choice applies its upgrade/evolution, destroys levelUpPresentation and releases REWARD only; other reasons retain PAUSED and stale choices cannot release a new presentation's reason.
- Final recipe prerequisite resumes normally; only the next presentation can offer an evolution. Offers use the separate three-evolution cursor; accepting Prism sets prismEvolved without consuming Combat or changing numeric Laser values/timer.
- create resets all three evolution flags and evolutionOfferCursor to false/Prism-first. Active Missiles own clusterEnabled at launch; satellite resolution derives only from readonly launch damage/radius after primary deaths.
- create resets missileRanks, missileValues, weaponFocus and focusCursors as well as laserRanks and prismEvolved. Prism uses the same straight-shot collection and five existing gameplay timers.
- Projectile iteration stops after cleaning the lethal hostile impact or lethal Boss player impact; remaining objects freeze. Missile/Cluster finishes its current primary/satellite affected snapshots and Missile removal before terminal entry. First terminal outcome in existing order wins; no unrelated later contact/XP work.
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
| TRACKED TESTS | warden.test.ts → shouldSpawnWarden / wardenPhase / wardenBurstDirections | Fourteen cases: spawn29/30/31/flag, phase thresholds/dead, exact unit angles and independent deterministic results |
| TRACKED TESTS | eliteTank.test.ts → shouldSpawnEliteTank | Seven cases: Tank6/12/18/24, Chaser/Shooter12 exclusion, deterministic input stability |
| TRACKED TESTS | shooterMovement.test.ts → shooterMovement | 7 tests: speed/diagonal, inclusive edges, retreat, large steps, coincident center, zero time, partitions |
| TRACKED TESTS | RunDiagnostics.test.ts / GameplayScene.devTools.test.ts | 35 pure observer cases plus 10 Scene cases; total 309 across 21 files, preserving 264 prior tests |
| TRACKED TESTS | PlayerBuild.test.ts / GameplayScene.devTools.test.ts | 52 pure Build /134 Scene total; GAME-047 adds18 pure +39 Scene, total424 tests/22 files, all367 prior preserved |
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
GameplayScene eliteTankData / EnemyRuntime.isElite/contactDamage/xpValue / spawnEnemy / killEnemy / highlight; enemies/eliteTank.ts IMPLEMENTS_TASK GAME-036 — Elite Enemy Prototype. Same Tank pursuit, common collision/XP, five unchanged gameplay timers; no portal/affix framework.
GameplayScene bossSpawned / public bossDefeated / EnemyRuntime.collisionRadius / spawnEnemy / restoreEnemyOutline / fireHostileProjectile / launchHostileProjectile; enemies/warden.ts IMPLEMENTS_TASK GAME-037 — Warden Boss. Successful30 replacement, current-HP phases, common physical collision/death/XP10, same hostile event. Boss death supplies the flag consumed by GAME-038 after atomic attack completion; terminal Victory now blocks spawn31.
GameplayScene.isRunVictorious / victoryPresentation / enterRunVictory; updateProjectiles / updateMissiles atomic boundaries / isSimulationPaused / acceptLevelUpChoice / enterPlayerDeath IMPLEMENTS_TASK GAME-038 — Run Victory / Result Flow. Common XP10 remains frozen; current-level result and native NEW RUN; no new timer/Scene/manager.
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
Combat Processor is applied once in fireLaser/fireDroneFrom/fireMissile before final launch storage; explodeMissile consumes MissileRuntime.damage and explosionRadius, never current run values; updateMissiles consumes MissileRuntime.speed.
create resets all module levels and run values before constructing the HUD. Existing native shutdown still owns object/timer cleanup.
No generalized weapon stats framework is implemented.
Statuses and dependencies remain in TASK_GRAPH.md, not duplicated here.

GameplayScene.publishDevTools / creditExperience / godMode / gameplayTimers IMPLEMENTS_TASK GAME-039. Vite DEV-only publication owns per-create shutdown/destroy invalidation; old captured API is inert after native restart. Shared creditExperience preserves pickup credit/removal/choice order; God Mode guards damagePlayer; five existing TimerEvent references supply snapshot counts, including pending insertion. DevTools types are exported from src/game/devTools.ts; runtime ownership remains in GameplayScene.

RunLifecycle IMPLEMENTS_TASK GAME-042, extended with PAUSED by GAME-044: immutable first outcome, start/tryEnterTerminal/dispose and concrete pause reason ownership. GameplayScene owns per-create construction/captured disposal and derived terminal getters; concrete UI and attack boundaries stay in Scene. Existing timer/cadence-reset/retry callbacks capture their run; Level-Up presentation remains Scene-owned with REWARD lifecycle authority. Tracked tests and real Phaser native restarts validate the boundary.

RunRandom IMPLEMENTS_TASK GAME-043: fixed Mulberry32 and root-XOR-salt avalanche, independent Encounter/Reward/World/Boss state, immutable uint32 seed and disposed-handle errors. GameplayScene owns creation after RUNNING and captured exact-owner cleanup; spawnEnemy consumes Encounter and Level-Up sampling consumes Reward. World/Boss have no current consumers. DevSnapshot exposes only numeric runSeed; no seed controls, service registry or new timers. Pure golden/independence tests, actual Scene tests and real Phaser fixed-seed/native restart checks cover the boundary.

RunLifecycle pause operations + KeyboardInput + GameplayScene.bindRunInput/handlePauseRequest/projectPause IMPLEMENT_TASK GAME-044. Scene projects authority onto the existing Clock.paused and minimal UI; REWARD acceptance releases only its reason, focused/visible Escape explicitly releases MANUAL/FOCUS_LOSS. Captured adapter/listener cleanup cannot change a fresh reused Clock/run. DEV snapshot adds detached runState/ordered reasons. Actual keyboard, 2300ms phase freeze, genuine browser BLUR, native restart and unmodified production preview checks pass; HIDDEN/VISIBLE combinations are covered separately by tracked synthetic tests.

RunDiagnostics + GameplayScene.runDiagnostics/choiceIdentity/observePause IMPLEMENT_TASK GAME-045.
create bootstraps RUN_STARTED and one initial Chaser after RunRandom. update advances full active
delta before movement. createEnemy observes completed current creation; killEnemy observes
membership-guarded removal/drop before later Victory. damagePlayer records actual clamped HP
loss before Death; creditExperience records credited XP/level difference once, split pickup/dev.
enterLevelUpPause records a constructed typed offer; acceptLevelUpChoice records applied selection
before REWARD release. observePause surrounds concrete manual/focus/reward operations, recording
only actual RUNNING/PAUSED transitions, never projectPause or terminal-as-resume. enterPlayerDeath/
enterRunVictory record only accepted authority outcomes after existing attack boundaries.
publishDevTools adds detached diagnostics only; exact captured cleanup disposes old history.
Tracked invariants and real browser aggregate/elapsed/focus/native restart checks verify no added
RNG draws, Clock/input authority, events, persistence or network transport.

PlayerBuild + GameplayScene.playerBuild/applyBuildChange/weaponInterval/resetWeaponTimer IMPLEMENT_TASK GAME-046.
Build is created in PREPARING before HP/HUD, disposed by exact captured const. Hull/Thrust getters
read its cache; guarded Hull Plating/Thruster apply exact flat compatibility bonuses before Scene
level/HP mutation. R/F/V/S/E compose current firing values, C stays separate; Missile stores body
radius for consistent visual/collision/world exit. Shared FireControl resets only the three same
player events; local cadence resets stay weapon-specific. snapshot.build is detached, reads do not
alter RNG/diagnostics. Real pointer/modifier/collision/evolution/focus/native/production checks
cover the boundary; incoming defense and outgoing Attack/Hit boundaries are mapped below.

PlayerBuild TAG_IDS/TagId/TagPoints/BuildIdentity/BuildSnapshot/addTagPoints IMPLEMENT_TASK GAME-047.
Twelve explicit stored totals start0; existing prototype slots/choices contribute nothing.
Accepted positive additions validate before committing totals and cached top-two distinct
positive score tiers, preserving canonical ties. Tag and EffectiveStats derivation paths
are independent. snapshot() copies all existing fields plus tags/identity; devTools.ts now
imports BuildSnapshot for DevSnapshot.build, and GameplayScene continues forwarding the
same snapshot() call. No new Scene mutation/cleanup/timer code or Tag command was needed.
All tracked addTagPoints callers are PlayerBuild.test.ts and GameplayScene.devTools.test.ts;
internal ignored browser harnesses exercise the same real method without production controls.
Pure tests, all18 actual pointer choices with nonzero Tags, real BLUR and native restart
checks verify gameplay/stat/Analyzer/RNG/diagnostic/five-event isolation. Existing captured
Build disposal invalidates Tag additions/reads; fresh native Build resets twelve0/empty
identity. No maturity/difficulty/offer weighting or later domain behavior is implemented.

PlayerDefense + GameplayScene.playerDefense/disposeDefense/damagePlayer/updatePlayerProtection/
updatePlayerContact IMPLEMENT_TASK GAME-048. Defense owns only three transient scalars;
Build owns max Hull. Accepted Shield-first actual loss starts500; only positive Hull loss
reaches existing diagnostics before terminal. God bypasses Defense; protection rejects
without extension. Scene retains hostile cleanup and exact bounded first-contact separation.
Guarded shared Hull reconciliation never heals an increase; Hull Plating adds1/heals1.
HUD uses derived current/max; DEV adds playerShield and derives compatibility scalars from
one snapshot without changing BuildSnapshot/five commands. All setCurrentShield call sites
are tests/internal ignored harnesses; Shield Systems has no consumer. No new timer/RNG/
Tags/Analyzer/reward behavior. Captured disposal makes old reads/mutations throw; fresh
native create and saved callback isolation are verified by tracked and actual Phaser tests.

combat.ts + GameplayScene Hit/applyEnemyHit/damagePlayer/ProjectileRuntime/MissileRuntime IMPLEMENT_TASK GAME-049.
All launch paths create frozen copied concrete Attack snapshots. Exact-run typed Hits use one
EnemyDamage arithmetic adapter; killEnemy retains removal/Boss flag/XP-drop/diagnostics, with
source available in the synchronous Hit and no retained death/source registry. Incoming
PlayerDamage wraps current Defense results with God/protection/Shield/actual-Hull semantics.
Swept geometry, strict ties, cap/expiry/world exits, Prism independent beams, Twin independent
origins and Cluster primary then survivor union remain concrete Scene behavior. Complete
owning cleanup precedes Victory; first-terminal authority stays RunLifecycle. Stale Hits/
flights guard exact run before fresh enemies/Defense. Five events/five DEV methods and zero
additional RNG draws remain. Impact/GAME-050+ are deferred. 71 pure +16 new Scene cases,
actual Chrome offensive/old-new snapshot/pause/BLUR/native terminal/restart and unmodified
production ordinary Death/real RETRY checks pass. GATE A PASSED; GATE B NOT PASSED.

## Common navigation queries

| Question | Likely path / anchor |
| --- | --- |
| Where is diagnostic history observed? | RunDiagnostics.ts; GameplayScene.ts → create/update/createEnemy/killEnemy/damagePlayer/creditExperience/enterLevelUpPause/acceptLevelUpChoice/observePause/enterPlayerDeath/enterRunVictory/publishDevTools |
| Where does enemy death happen? | GameplayScene.ts → updateProjectiles / updateMissiles → applyEnemyHit → killEnemy |
| Where are XP drops/magnet/collection owned? | GameplayScene.ts → killEnemy, xpPickups, updateXpPickups; create resets |
| Where are XP thresholds and levels calculated? | src/game/progression/experience.ts; scene playerExperience |
| Where are level-up choices/resume owned? | GameplayScene.ts → enterLevelUpPause, levelUpPresentation, acceptLevelUpChoice |
| Where are HUD values rendered/refreshed? | GameplayScene.ts → hud, updateHud; create, damagePlayer, updateXpPickups |
| Where is Dash input/timing/reset owned? | input/KeyboardInput.ts → Space intent; GameplayScene.ts → update, movePlayer, create; player/dash.ts#stepDash |
| Where is player damage controlled? | PlayerDefense.ts numeric Shield/Hull/protection; GameplayScene.ts → damagePlayer ownership/God/diagnostics/HUD/terminal adapter |
| Where are contact separation and Hull healing owned? | GameplayScene.ts → updatePlayerContact geometry; applyBuildChange/acceptLevelUpChoice → PlayerDefense.reconcileMaxHull/healHull, Build maximum |
| Who owns projectile movement/lifetime/cleanup? | GameplayScene.ts → updateProjectiles (straight shots), updateMissiles (homing) |
| Where are Drone orbit/bolts owned? | GameplayScene.ts → droneConfig, droneAttackValues, droneRanks, droneTimer, droneAngle, twinDrone, twinDroneEvolved, updateDrone, positionDrone, fireDrone, fireDroneFrom, aimProjectile / updateProjectiles |
| Where are Missile homing/explosion owned? | GameplayScene.ts → fireMissile, aimMissile, updateMissiles, explodeMissile; collision.ts sweep |
| Where is collision math implemented? | collision.ts#segmentCircleHitTime |
| Where are Attack/Hit/Damage and launch truth owned? | combat/combat.ts types/four pure APIs; GameplayScene.ts → local Hit, applyEnemyHit, damagePlayer and exact-run typed flight runtimes |
| Where is collision math tested? | src/game/combat/collision.test.ts |
| Where are enemy archetypes/movement owned? | GameplayScene.ts → EnemyArchetype, enemyData, update; enemies/shooterMovement.ts; eliteTankData / enemies/eliteTank.ts; wardenPhase / enemies/warden.ts |
| Where are enemy spawn callbacks? | GameplayScene.ts → create timer / spawnEnemy / timedSpawnSequence / successfulTimedSpawns |
| Where are player/hostile fire callbacks? | GameplayScene.ts → create timers / fireLaser / fireMissile / fireDrone / fireHostileProjectile → independent selectNearestEnemy('shooter') / active Warden burst → launchHostileProjectile |
| What guards callbacks while dead or level-up paused? | GameplayScene.ts → isSimulationPaused checks in spawn/fire helpers |
| Who owns Laser firing configuration? | GameplayScene.ts → laser, laserTimer, fireLaser; create/acceptLevelUpChoice |
| Where are Prism prerequisites, ranks and spread owned? | GameplayScene.ts → laserRanks, prismEvolved, enterLevelUpPause, fireLaser; progression/prismLaser.ts; combat/prismSpread.ts |
| Where does restart cleanup occur? | GameplayScene.ts → enterPlayerDeath RETRY or enterRunVictory NEW RUN → Phaser scene.restart lifecycle |
| Where does Victory start? | GameplayScene.ts → updateProjectiles / updateMissiles completed lethal Boss operation → enterRunVictory; killEnemy only records defeat/reward/removal |
| Where are repository/task rules? | AGENTS.md; docs/TASK_GRAPH.md; active user task |

## Update policy

Update for material file/module boundaries, exported architectural symbols, runtime ownership,
important local imports or meaningful architectural test coverage. Reinspect source then refresh
baseline HEAD provenance. Do not update for balance/tuning, wording, each status change or every
private helper rename. This map contains current implementation only, never future subsystem stubs.
