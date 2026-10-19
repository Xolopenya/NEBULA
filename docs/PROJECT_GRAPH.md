# NEBULA — Project Graph

## Provenance and authority

- Project: NEBULA.
- Milestone: First Playable / GAME-015 complete.
- Source baseline HEAD: `5de2f0ecbcecd422e2d1a2dda85d500aa607bf97`.
- This map reflects that source baseline plus staged UI-001 Russian display ownership; Scene retains combat, reward orchestration and GAME-039 DEV wiring.
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
| `src/game/ui/russianText.ts` | Phaser-free frozen36-ID Russian names, static UI copy and focused reward/HUD/terminal formatters |
| `src/game/ui/russianText.test.ts` |94 pure literal name/effect/order/rank/level/decimal/immutability/metadata checks |
| `src/game/rewards/LevelUpGenerator.ts` | Per-create Phaser-free weighted policy, closed36 affinities, bounded presentation history/pity/cursor and immutable provisional state |
| `src/game/rewards/LevelUpGenerator.test.ts` |72 pure policy cases including independent literal goldens, numeric boundaries, signature transitions and deep immutability |
| `src/game/rewards/RewardTransaction.ts` | Pure one-offer/token/ordinal/phase/selection-guard/disposal authority; detached read API |
| `src/game/rewards/RewardTransaction.test.ts` | Canonical immutable membership, authentic identity, safe ordinals, rejection/retry/reentrancy/order and lifetime |
| `src/game/rewards/rewardChoices.ts` | Closed36 LevelUpChoice/candidate IDs, canonical prototype pool, exact validation and frozen copies |
| `src/game/rewards/rewardEligibility.ts` | Pure current detached hard eligibility and composed numeric/Attack/cadence feasibility |
| `src/game/rewards/rewardEligibility.test.ts` | All18 choices, installed slots/caps/recipes/repeatables/Tags neutrality and overflow rejection |
| `src/game/run/RunLifecycle.ts` | Focused lifecycle authority: RunState including PAUSED, PauseReason, terminal/disposal; no Phaser dependency |
| `src/game/run/RunLifecycle.test.ts` | 19 pure lifecycle/reason/composition/terminal/disposal/independence cases |
| `src/game/input/KeyboardInput.ts` | Concrete desktop key bindings, GameplayIntent sample/reset/dispose and held-control suppression |
| `src/game/input/KeyboardInput.test.ts` | 17 adapter mapping/edge/repeat/reset/held/fresh/disposal cases |
| `src/game/run/RunRandom.ts` | Phaser-free uint32 seed, four independent explicit Mulberry32 streams, exact-owner disposal |
| `src/game/run/RunRandom.test.ts` | 21 pure seed/golden/range/independence/disposal cases |
| `src/game/run/RunDiagnostics.ts` | Phaser-free run observation: seed identity, active elapsed, aggregates, bounded semantic timeline and exact-owner disposal |
| `src/game/run/RunDiagnostics.test.ts` | 53 pure seed/lifetime/numeric/identity/source-bucket/atomicity/copy/eviction/terminal cases |
| `src/game/player/PlayerBuild.ts` | Phaser-free run Build: exact3/1/6 slots, ten bases/modifiers/effective cache, twelve Tag totals/derived identity, detached canonical snapshot and captured disposal |
| `src/game/player/PlayerBuild.test.ts` | 52 pure slot/base/percentage/flat/Analyzer/Tag/identity/copy/atomicity/lifetime cases |
| `src/game/player/PlayerDefense.ts` | Phaser-free current Hull/Shield/protection arithmetic, detached snapshot and exact-owner disposal; no maximum or lifecycle ownership |
| `src/game/player/PlayerDefense.test.ts` | 35 pure validation/Shield-first/loss/protection/heal/cap/detachment/lifetime cases |
| `src/game/devTools.ts` | DevSnapshot with numeric runSeed/runState/copied ordered pauseReasons and detached nested diagnostics/build; five-command DevTools types, no runtime registry |
| `src/game/scenes/GameplayScene.devTools.test.ts` | 303 tracked Scene/DevTools/lifecycle/RNG/pause/input/diagnostics/Build/Tag/Defense/combat/enemy-snapshot/death-attribution cases, including installed Phaser Clock phase integration |
| `src/game/enemies/EnemyDeath.ts` | Phaser-free exact source/death values, source/record factories and independent lethal-data preflight; no consequence authority |
| `src/game/enemies/EnemyDeath.test.ts` | 127 pure seven-source/exact-shape/identity/numeric/preflight/freeze/detachment cases |
| `src/game/enemies/knockback.ts` | Pure direction/validated scaled-safe vector impulse cap600 and analytic linear decay1200; no gameplay authority |
| `src/game/enemies/knockback.test.ts` | 39 pure direction/matrix/cancellation/cap/decay/partition/tiny/large/invalid input cases |
| `src/game/enemies/chargerMovement.ts` | Concrete Charger state/range/phase/residual/bounds/earliest charge-contact calculation; imports existing segment-circle helper |
| `src/game/enemies/chargerMovement.test.ts` | 40 pure phase/commit/rearm/large-delta/geometry/numeric/ownership cases |
| `src/game/enemies/EnemyDefinitions.ts` | Phaser-free six authored definitions, fixed Tank Elite/neutral context, exact validation and copied frozen per-spawn snapshots |
| `src/game/enemies/EnemyDefinitions.test.ts` | 169 pure exact-content/shape/numeric/pairing/freeze/detachment/neutral-isolation cases |
| `src/game/combat/combat.ts` | Phaser-free exact Attack/source/snapshot/Damage contracts, validated immutable factory and pure composition/hit/enemy arithmetic |
| `src/game/combat/combat.test.ts` | 83 pure kind/variant/shape/copy/freeze/numeric/composition/phase/actual-loss cases |
| `src/game/combat/collision.ts` | Pure numeric collision math |
| `src/game/combat/collision.test.ts` | Tracked geometry tests |
| `src/game/progression/experience.ts` | Shared validated exact BigInt threshold/award arithmetic, bounded binary search and safe pool/state validation |
| `src/game/progression/PlayerProgression.ts` | Run-scoped pure level/XP/pending owner, detached snapshot, exact-owner disposal |
| `src/game/progression/PlayerProgression.test.ts` | Pure owner, pending, detachment, MAX_SAFE exact oracle, invalid/overflow/lifetime cases |
| `src/game/progression/xpConsolidation.ts` | Ephemeral deterministic64px-cell minimum-tree merge planner with soft256 threshold; no mutation/Phaser/RNG |
| `src/game/progression/xpConsolidation.test.ts` | Grid/priority/unsafe/magnet/conservation/naive-oracle and large sparse/dense performance cases |
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
| `src/game/rewards/LevelUpGenerator.ts#LevelUpGenerator` | assertCanGenerate/generate/recordPresented/cancelGenerated/snapshot/dispose; policy owner only, no selection authority |
| `src/game/rewards/LevelUpGenerator.ts#LevelUpContext` | Detached RewardEligibilityContext plus weaponFocus |
| `src/game/rewards/LevelUpGenerator.ts#LevelUpPolicySnapshot` | Detached misses/history/primarySignature/evolutionCursor/lastPresented/hasGenerated |
| `src/game/rewards/LevelUpGenerator.ts#REWARD_AFFINITIES` | Closed deeply frozen36-ID weighting metadata, no Build Tag contributions |
| `src/game/rewards/LevelUpGenerator.ts#LEVEL_UP_POLICY_VERSION` | GAME-056-v1 literal policy version |
| `src/game/rewards/RewardTransaction.ts#RewardTransaction` | assertCanOpen/open/present/trySelect/invalidate/snapshot/dispose; one authentic current offer and synchronous guard |
| `src/game/rewards/RewardTransaction.ts#RewardToken` | Frozen object-reference authority; safe local offerId alone cannot authorize |
| `src/game/rewards/RewardTransaction.ts#RewardOfferSnapshot` | Detached LEVEL_UP offerId/phase/candidates, no token or owner |
| `src/game/rewards/rewardChoices.ts#RewardCandidate` | Readonly canonical ID/closed choice pair, validated and copied/frozen at open |
| `src/game/rewards/rewardChoices.ts#levelUpPool` | Frozen canonical15 ordinary prototype entries; rewardChoices adds three evolutions |
| `src/game/rewards/rewardEligibility.ts#isRewardEligible` | Pure current slots/ranks/recipes/evolved flags/repeatables and numeric feasibility, no RNG |
| `src/game/rewards/rewardEligibility.ts#assertRewardFeasible` | Loud composed numeric/Attack/cadence preflight before actual Scene mutation |
| `src/game/player/PlayerBuild.ts#PlayerBuild.previewPrototypeHullPlating` | Detached prospective EffectiveStats using the actual Hull candidate/resolver, no cache mutation |
| `src/game/player/PlayerBuild.ts#PlayerBuild.previewPrototypeThruster` | Detached prospective EffectiveStats using the actual Thrust candidate/resolver, no cache mutation |
| `src/game/run/RunLifecycle.ts#PauseReason` | Exactly REWARD, MANUAL, FOCUS_LOSS; requestPause/releasePause/hasPauseReason and detached ordered reason view |
| `src/game/input/KeyboardInput.ts#GameplayIntent` | Raw moveX/moveY and activatePressed/pausePressed edges |
| `src/game/input/KeyboardInput.ts#KeyboardInput` | Desktop adapter only; no gameplay movement/Dash simulation |
| `src/game/run/RunRandom.ts#RunRandom` | Immutable runSeed; encounter/reward/world/boss next(); dispose invalidates captured handles |
| `src/game/run/RunDiagnostics.ts#RunDiagnostics` | Explicit record/advance/snapshot/dispose API; observation only, no gameplay references |
| `src/game/run/RunDiagnostics.ts#ChoiceIdentity` | Exact 18 current typed Level-Up identities, independent of UI labels |
| `src/game/run/RunDiagnostics.ts#DiagnosticArchetype` | swarm/chaser/charger/shooter/tank/boss; Elite valid only for tank |
| `src/game/run/RunDiagnostics.ts#DiagnosticRecord` | Six semantic timeline variants, timestamped with active elapsed |
| `src/game/run/RunDiagnostics.ts#RunDiagnosticsSnapshot` | Detached plain seed/elapsed/aggregates/timeline/evictions/terminal view |
| `src/game/player/PlayerBuild.ts#PlayerBuild` | Owns fixed slots, immutable BaseStats, explicit RunModifiers, derived EffectiveStats, independent Tag totals/identity cache; detached reads and disposed invariants |
| `src/game/player/PlayerBuild.ts#BuildSnapshot` | Canonical detached slots/baseStats/runModifiers/effectiveStats/tags/identity/laser; replaces GAME-046 read model |
| `src/game/player/PlayerBuild.ts#TAG_IDS` | Immutable canonical twelve-Tag tuple, shared by identity ordering and tests |
| `src/game/player/PlayerBuild.ts#TagId` | Literal union derived from TAG_IDS; no arbitrary string identity |
| `src/game/player/PlayerBuild.ts#TagPoints` | Exactly twelve nonnegative safe-integer numeric totals |
| `src/game/player/PlayerBuild.ts#BuildIdentity` | Cached derived dominant/secondary positive score tiers, canonical ties |
| `src/game/player/PlayerBuild.ts#PlayerBuild.addTagPoints` | Validated atomic permanent accumulation; no current production callers, stats/RNG/diagnostics/timer effects |
| `src/game/player/PlayerBuild.ts#BaseStats` | Exact ten shared fields; PercentStatKey excludes Analyzer, CombatSystemId has only three current identities |
| `src/game/player/PlayerDefense.ts#PlayerDefense` | constructor(initialHull), snapshot, advanceProtection, applyIncomingDamage, healHull, reconcileMaxHull, setCurrentShield, dispose; Shield setter has no production caller |
| `src/game/player/PlayerDefense.ts#PlayerDefenseSnapshot` | Detached currentHull/currentShield/protectionRemaining only |
| `src/game/player/PlayerDefense.ts#IncomingDefenseResult` | Local accepted/protectionRejected/shieldLost/hullLost/hullDepleted arithmetic result |
| `src/game/combat/combat.ts#Attack` | Closed LaserAttack/MissileAttack/DroneAttack/HostileAttack/ContactAttack; hostile FlightSnapshot/player PlayerFlightSnapshot/MissileSnapshot/ContactSnapshot, AttackSnapshot, PlayerAttackSource/AttackSource |
| `src/game/combat/combat.ts#Damage` | EnemyDamage separates calculatedDamage/healthAfter/hpLost/depleted; PlayerDamage wraps existing IncomingDefenseResult; HitPhase is DIRECT/PRIMARY/SATELLITE/CONTACT |
| `src/game/combat/combat.ts#createAttack` | Copies exact bounded primitives (required player impact>=0, other values>0); freezes outer/snapshot; validates Cluster half-damage/nonzero half-impact before mutation |
| `src/game/combat/combat.ts#PlayerFlightSnapshot` | Hostile FlightSnapshot plus required frozen launch impact; MissileSnapshot additionally owns explosionRadius |
| `src/game/combat/combat.ts#composePlayerImpact` | Actual finite nonnegative local*Ship product, with safe-bound/nonzero-underflow validation; three real launch consumers |
| `src/game/enemies/knockback.ts#knockbackDirection` | Normalize actual flight/radial vector, exact zero -> +X |
| `src/game/enemies/knockback.ts#withKnockbackImpulse` | Validate retained velocity/unit/unclamped K; scaled-safe vector sum cap600, cancellation retained |
| `src/game/enemies/knockback.ts#stepKnockback` | New copied velocity/displacement from linear1200px/s² decay; zero/underflowed dt returns before arithmetic |
| `src/game/enemies/chargerMovement.ts#ChargerState` | Only phase/remainingMs/directionX/Y, no copied authored speeds/timing or target reference |
| `src/game/enemies/chargerMovement.ts#initialChargerState` | Fresh APPROACH/0/(1,0) |
| `src/game/enemies/chargerMovement.ts#stepCharger` | Explicit position/player/state/movement/bounds/delta -> validated position/state/earliest CHARGING contact or null; bounded current cycle |
| `src/game/combat/combat.ts#composePlayerDamage` | Left-to-right local*C*R, Drone-only E; no intermediate cap or other stat factors |
| `src/game/combat/combat.ts#calculateHitDamage` | Closed legal source/phase rules; snapshot-only full or Cluster-half damage |
| `src/game/combat/combat.ts#calculateEnemyDamage` | Pure positive HP/damage validation, negative transient overkill HP and actual stored loss |
| `src/game/combat/collision.ts#segmentCircleHitTime` | First segment-circle hit in [0,1], else Infinity |
| `src/game/progression/experience.ts#ExperienceState` | Numeric level and XP toward next level |
| `src/game/progression/experience.ts#xpForNextLevel` | Validated5*level threshold |
| `src/game/progression/PlayerProgression.ts#PlayerProgression` | snapshot/creditXp/resolvePendingLevel/dispose, one current run owner |
| `src/game/progression/xpConsolidation.ts#planXpConsolidation` | Original-index pair plan, revalidated by Scene before application |
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
| `src/game/enemies/EnemyDeath.ts#EnemyDamageSource` | Exactly kind/variant/phase; seven closed current offensive combinations; readonly primitives |
| `src/game/enemies/EnemyDeath.ts#EnemyDeathRecord` | Exactly archetype/isElite/xpValue/x/y/lastDamagingSource/killSource; no runtime/run/Hit/Attack references |
| `src/game/enemies/EnemyDeath.ts#createEnemyDamageSource` | Exact own-field/legal-combination validation, copy three primitives/freeze |
| `src/game/enemies/EnemyDeath.ts#validateEnemyDeathRecord` | Independent prospective lethal-data preflight, exact identity/positive safe XP/finite signed coordinates/equal nonnull sources; RangeError without record construction |
| `src/game/enemies/EnemyDeath.ts#createEnemyDeathRecord` | Reuses validation, copies identity/position/XP and two fresh frozen nested sources, freezes outer |
| `src/game/run/RunDiagnostics.ts#EnemyKillSourceKey` | Seven flat LASER.BASE/PRISM.DIRECT, MISSILE.BASE/CLUSTER.PRIMARY, MISSILE.CLUSTER.SATELLITE, COMBAT_DRONE.BASE/TWIN.DIRECT keys |
| `src/game/run/RunDiagnostics.ts#EnemyKillSourceCounts` | Closed seven-key numeric counts in aggregates.killsBySource; detached/zero-reset/terminal-frozen |
| `src/game/enemies/EnemyDefinitions.ts#EnemyArchetype` | Exactly swarm/chaser/charger/shooter/tank/boss |
| `src/game/enemies/EnemyDefinitions.ts#EnemyInteraction` | Exactly readonly knockbackResponse/decoySusceptible, independently copied/frozen per spawn |
| `src/game/enemies/EnemyDefinitions.ts#ChargerMovement` | Charger-only speed/triggerRange/windupMs/chargeSpeed/chargeMs/recoveryMs record |
| `src/game/enemies/EnemyDefinitions.ts#EnemyDefinition` | EnemyNumbers plus closed PursuitMovement / ChargerMovement / ShooterMovement / WardenMovement pairing plus EnemyInteraction |
| `src/game/enemies/EnemyDefinitions.ts#ENEMY_DEFINITIONS` | Deeply frozen six-entry authored table; all current HP/speed/band/body/contact/XP defaults |
| `src/game/enemies/EnemyDefinitions.ts#ELITE_TANK_PROFILE` | Fixed maxHealth18/speed120/contact2/XP5/interaction0.125+true, Tank-only |
| `src/game/enemies/EnemyDefinitions.ts#EnemySpawnContext` | Required scalingProfile LEGACY_NEUTRAL plus BASE/ELITE_TANK; no arithmetic or non-neutral engine |
| `src/game/enemies/EnemyDefinitions.ts#DEFAULT_ENEMY_SPAWN_CONTEXT` | Deeply frozen explicit BASE context with LEGACY_NEUTRAL_SCALING_PROFILE |
| `src/game/enemies/EnemyDefinitions.ts#EnemySpawnSnapshot` | Readonly exact archetype/maxHealth/collisionRadius/contactDamage/xpValue/movement/interaction/isElite values; no runtime/visual/Build/RNG references |
| `src/game/enemies/EnemyDefinitions.ts#createEnemySpawnSnapshot` | Validate definition/context/pairing, fixed override, copy scalars/new movement/new interaction, validate final numbers, freeze both nested records/outer; RangeError on invalid input |
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
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/experience.ts` (addExperience preflight), PlayerProgression.ts (PlayerProgression), xpConsolidation.ts (plan/constants) |
| `src/game/progression/PlayerProgression.ts` | IMPORTS | `src/game/progression/experience.ts` (shared threshold/award) |
| `src/game/scenes/GameplayScene.ts` | OWNS | PlayerProgression lifetime, physical pickups and current reward presentation |
| `src/game/progression/experience.test.ts` | IMPORTS | `src/game/progression/experience.ts` |
| `src/game/progression/experience.ts` | TESTED_BY | `src/game/progression/experience.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/player/dash.ts#stepDash` |
| `src/game/player/dash.test.ts` | IMPORTS | `src/game/player/dash.ts#stepDash` |
| `src/game/player/dash.ts#stepDash` | TESTED_BY | `src/game/player/dash.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/shooterMovement.ts#shooterMovement` |
| `src/game/enemies/shooterMovement.test.ts` | IMPORTS | `src/game/enemies/shooterMovement.ts#shooterMovement` |
| `src/game/enemies/shooterMovement.ts#shooterMovement` | TESTED_BY | `src/game/enemies/shooterMovement.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/rewards/LevelUpGenerator.ts#LevelUpGenerator` |
| `src/game/scenes/GameplayScene.ts` | CREATES | One LevelUpGenerator per actual create, exact disposeReward closure |
| `src/game/rewards/LevelUpGenerator.ts` | IMPORTS | rewardChoices canonical copies, rewardEligibility, PlayerBuild TAG_IDS and evolutionOffer cyclic helper |
| `src/game/rewards/LevelUpGenerator.ts` | TYPE_IMPORTS | WeaponFocus/RewardEligibilityContext; no retained owner handles |
| `src/game/rewards/LevelUpGenerator.ts` | TESTED_BY | LevelUpGenerator.test.ts and actual GameplayScene integration |
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
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/player/laserProgression.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/laserPatterns.ts#laserDirections` |
| `src/game/progression/prismLaser.ts#canEvolvePrismLaser` | TESTED_BY | `src/game/progression/prismLaser.test.ts` |
| `src/game/combat/prismSpread.ts#prismSpread` | TESTED_BY | `src/game/combat/prismSpread.test.ts` |
| `src/game/scenes/GameplayScene.ts` | TYPE_IMPORTS | focusedUpgrade.ts MissileRanks/DroneRanks/WeaponFocus only |
| `src/game/progression/focusedUpgrade.ts#selectFocusedUpgrade` | TESTED_BY | `src/game/progression/focusedUpgrade.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/spatialAmplifier.ts#effectiveMissileExplosionRadius` |
| `src/game/progression/spatialAmplifier.ts#effectiveMissileExplosionRadius` | TESTED_BY | `src/game/progression/spatialAmplifier.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/combat/clusterSatellites.ts#clusterSatelliteOffsets` |
| `src/game/progression/clusterMissile.ts#canEvolveClusterMissile` | TESTED_BY | `src/game/progression/clusterMissile.test.ts` |
| `src/game/progression/evolutionOffer.ts#selectEvolutionOffer` | TESTED_BY | `src/game/progression/evolutionOffer.test.ts` |
| `src/game/combat/clusterSatellites.ts#clusterSatelliteOffsets` | TESTED_BY | `src/game/combat/clusterSatellites.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/progression/replicationMatrix.ts#effectiveDroneBoltRadius` |
| `src/game/progression/replicationMatrix.ts#effectiveDroneBoltRadius` | TESTED_BY | `src/game/progression/replicationMatrix.test.ts` |
| `src/game/progression/twinDrone.ts#canEvolveTwinDrone` | TESTED_BY | `src/game/progression/twinDrone.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/EnemyDeath.ts` (source projection, lethal preflight, one completed record) |
| `src/game/enemies/EnemyDeath.ts` | TYPE_IMPORTS | combat.ts LaserAttack/DroneAttack; EnemyDefinitions.ts EnemyArchetype |
| `src/game/enemies/EnemyDeath.ts` | TESTED_BY | `src/game/enemies/EnemyDeath.test.ts` |
| `src/game/run/RunDiagnostics.ts` | IMPORTS | EnemyDeath.ts createEnemyDamageSource/type; validates killSource before closed bucket mapping |
| GameplayScene.applyEnemyHit | USES | enemyHitSource -> createEnemyDamageSource and enemyDeathInput -> validateEnemyDeathRecord before lethal HP/source commit |
| EnemyRuntime.lastDamagingSource | OWNS | null initially, newly copied frozen actual Hit source only after hpLost>0 |
| GameplayScene.killEnemy(hit,damage,source) | CREATES | One EnemyDeathRecord only after exact current RUNNING run/member/actual depleted HP/source guards |
| EnemyDeathRecord | SUPPLIES | killEnemy concrete Boss flag, one physical XP pickup, target/visual/member cleanup, source-aware recordEnemyKilled; data grants no lifetime authority |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/knockback.ts` (normalize, impulse, decay) |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/chargerMovement.ts` (fresh state, step, types) |
| `src/game/enemies/chargerMovement.ts` | IMPORTS | `src/game/combat/collision.ts#segmentCircleHitTime` and `src/game/enemies/knockback.ts#knockbackDirection` |
| `src/game/enemies/knockback.ts` | TESTED_BY | `src/game/enemies/knockback.test.ts` |
| `src/game/enemies/chargerMovement.ts` | TESTED_BY | `src/game/enemies/chargerMovement.test.ts` |
| `src/game/scenes/GameplayScene.ts` | IMPORTS | `src/game/enemies/EnemyDefinitions.ts` (fixed table/context/factory and archetype/snapshot types) |
| GameplayScene.createEnemy | CONSTRUCTS | One EnemySpawnSnapshot per successful exact-run creation; zero for rejected requests |
| EnemyRuntime.spawnSnapshot | SUPPLIES | update movement, contact Attack value, collision body and killEnemy XP; compatibility getters derive values |
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
| Contact separation | updatePlayerContact | First inclusive overlap R32/42/44/60 or same-update Charger CHARGING sweep, minimum translation/coincident+X, player bounds21/25; before damage even under God/protection, no Impact/RNG/extra pass |
| Level-up pause | isLevelUpPaused; enterLevelUpPause; RunLifecycle REWARD | Flag is transaction identity only; REWARD owns PAUSED; current choice releases only REWARD, other reasons retain pause |
| Choice UI/resume | rewardTransaction, rewardPresentation; enterLevelUpPause / currentReward / acceptLevelUpChoice / applyRewardChoice / clearRewardPresentation | Exact token/run/owners/presentation/Text, persistent retry handler; callback effect/pending/selected then owner invalidation/guard exit, post-return UI/next offer/final release |
| Reward policy | levelUpGenerator; create/disposeReward; enterLevelUpPause; LevelUpGenerator | Sole bounded policy state; exact captured generator in presentation, no Scene cursor mirror |
| Reward owner/eligibility | rewardTransaction / rewardContext; RewardTransaction / rewardChoices / rewardEligibility | Pure transaction authority and current detached hard feasibility; Build/progression keep their own state |
| Run lifecycle | run; RunLifecycle; create | PREPARING/RUNNING/PAUSED/TERMINAL/DISPOSED; concrete composed reasons; first terminal from RUNNING/PAUSED; captured exact disposal |
| Pause/input projection | bindRunInput; handlePauseRequest; projectPause; canResume; pausePresentation | Exact-owner BLUR/HIDDEN loss, separate FOCUS/VISIBLE bookkeeping, explicit focused Escape resume; Scene Clock.paused freezes five events; minimal non-reward UI |
| Run RNG | runRandom; RunRandom; create | Fresh owner after successful RUNNING; crypto uint32 seed; exact captured shutdown/destroy disposal; old handles throw; World/Boss dormant |
| Run diagnostics | runDiagnostics; RunDiagnostics; create/update/observePause | Fresh owner from numeric seed after RNG construction; bootstrap initial Chaser; active delta once; history only, 256-row timeline; captured disposal; no Clock/input/RNG references |
| Spawn randomness | spawnEnemy → runRandom.encounter.next | Two draws after guards: fixed side mapping then varying coordinate; deterministic fallback adds none |
| Choice randomness | enterLevelUpPause -> LevelUpGenerator.generate -> runRandom.reward.next | Exactly3 ordered draws per valid offer, including reserved evolution; all preflight/reads/presentation/selection/retry draw0 |
| Death/retry | derived isPlayerDead; enterPlayerDeath | Accepted DEATH precedes existing UI; RETRY bound to owning run; rejects Victory |
| Victory/result | derived isRunVictorious, victoryPresentation; enterRunVictory | Atomic attack completion after new common Boss defeat, first terminal wins; fixed current-level result and identity/duplicate-guarded native NEW RUN; create clears state/UI references |
| Enemy runtime | enemies; EnemyRuntime; createEnemy | One collection with readonly spawnSnapshot/run, mutable current health/visual/lastDamagingSource (initial null), external knockbackVelocity0/0 and Charger-only state/Graphics, derived identity/contact/XP/radius getters; EnemyDefinitions owns frozen spawn values, enemyPresentation/eliteTankData/wardenPhaseTwo own only presentation |
| Spawning | spawnEnemy; timedSpawnSequence, successfulTimedSpawns, spawnInterval, maximumEnemies | Captured exact run through spawnEnemy/createEnemy, PREPARING initial Chaser only, RUNNING timed/DEV; same2000ms timer/successful CCCSCT mix; shouldSpawnEliteTank promotes Tank12/24; Warden replaces30, active Boss suppresses spawns/count only; blocked cap10 callbacks retain pending count; create resets0 |
| Enemy movement | update; chaseDirection; shooterMovement; stepCharger; stepKnockback | Owned movement supplies Swarm240/Chaser180/Tank100/Elite120 pursuit, Shooter140/350–500 band, Warden70/100 HP pursuit and Charger phases; AI then one external decay/displacement, clamp max(25,radius), blocked outward component removal |
| Target/highlight | selectNearestEnemy, currentTarget; update | Nearest active enemy; optional origin/archetype filter reused by Missile/Shooter; temporary outline restores current Boss phase3px/Elite3px/regular2px style |
| Enemy death | updateProjectiles / updateMissiles → applyEnemyHit → killEnemy | Exact RUNNING Hit.run/target.run/member/actual depleted HP/source guard; one copied frozen record, Boss flag, physical pickup1/5/10, clear target, destroy visual, splice member, observe source; owning cleanup precedes Victory |
| XP drops | xpPickups; XpPickup; killEnemy | Creating run + world-space visual at death record x/y + record value1/5/10 + speed; common magnet/collection, create resets collection |
| XP magnet/collection | updateXpPickups | Stationary outside range; accelerated approach; arrival credits pickup.value then destroys/removes |
| Player XP/levels | playerProgression; create; updateXpPickups → creditExperience | One PlayerProgression owns level/XP/pending; shared experience arithmetic; Scene exact-run/source/diagnostic preflight |
| XP consolidation | consolidateXpPickups → planXpConsolidation | >256 soft threshold,64px cells/outside magnet/earliest safe pair/older anchor; Scene revalidates and destroys newer, no XP/RNG/observer loss |
| Shared projectiles | projectiles; ProjectileRuntime | readonly typed Laser/Drone/Hostile Attack + exact run; source/damage/radius derived read-only; visual/velocity/remainingLifetime |
| Projectile stepping | updateProjectiles | Lifetime-clipped motion; swept impact; reverse removal; lethal Boss projectile cleanup precedes Victory and stops later shots |
| Projectile cleanup | updateProjectiles | Impact, lifetime and world-exit destruction |
| Player Laser | laser; laserTimer; fireLaser | Derived Build-owned Laser profile, baseline600ms; same event resets iff effective cadence changes |
| Drone / Twin | drone, twinDrone, twinDroneEvolved, droneAngle, droneConfig; updateDrone, positionDrone, fireDrone, fireDroneFrom | One initial companion; Twin adds exactly one mirrored visual at shared angle+PI; same active-time 110px / 2rad orbit, independent center clamp, one shared firing event and per-origin targets/suppression |
| Replication Matrix | moduleLevels.replication; fireDroneFrom → effectiveDroneBoltRadius | +1 px per level added to baseline Drone bolt radius5 at launch; existing runtime radius owns swept collision/cleanup; acceptance does not change focus/cursors/timers; create resets0 |
| Drone upgrades | droneRanks, droneAttackValues, droneTimer; acceptLevelUpChoice / fireDrone | Explicit ranks0..2, damage1/2/3, interval1200/1050/900, speed800/1000/1200; same event reset/elapsed0; launch snapshots; create resets |
| Straight player-shot creation | aimProjectile → launchPlayerProjectile; fireLaser, fireDrone | Concrete target aim and exact-run guarded direction launch; fireLaser/fireDroneFrom use composePlayerDamage and createAttack before any visual; Prism shares one Attack, Twin has one per origin; Velocity and physical Scale are stored only in frozen snapshots; local radii Laser6/Drone5+Replication |
| Missile | missile, missileValues, missiles; MissileRuntime; fireMissile, aimMissile, updateMissiles | Readonly MissileAttack + exact run, concrete homing target/heading/lifetime; read-only variant/numeric getters derive from immutable snapshot; immutable maxActiveMissiles = 1; cap blocks launch without resetting the one 1800 ms timer |
| Spatial Amplifier | moduleLevels.spatial; fireMissile → effectiveMissileExplosionRadius | Repeatable +15 px per level added to Missile-specific radius at launch; stored MissileRuntime.explosionRadius owns later explosion; no focus/cursor mutation or other consumers |
| Missile explosion | updateMissiles → explodeMissile → applyEnemyHit → killEnemy | Earliest swept hit point, center-radius snapshot damage once, common XP/death; primary and optional satellites plus Missile cleanup finish before Victory; no direct hit |
| Laser upgrades | Build.snapshot.laser; applyRewardChoice | Build-owned ranks0..2/form/developments/Capstone; Scene getters only, atomic Build apply and same cadence event |
| Prism Laser | Build.snapshot.laser.form; prepareLaserChoice; laserDirections → prismSpread | Build-owned exclusive legacy alternative; unchanged2/2/2+Combat recipe, reserved Slot3, same timer and three independent full beams |
| Cluster Missile | clusterEvolved; fireMissile → MissileRuntime.clusterEnabled; updateMissiles → explodeMissile then explodeClusterSatellites | Explicit mastery/Spatial eligibility; primary-first union of six launch-derived satellite circles, one satellite hit per surviving enemy; no extra timer/child projectile |
| Evolution offer | LevelUpGenerator evolutionCursor; prepare -> selectEvolutionOffer | Separate Prism-first cursor advances once per new presentation, sole eligible guaranteed, eligible pairs alternate/all3 cycle by cyclic scan; offered successor cursor; acceptance never advances |
| Missile upgrades | missileRanks, missileValues; acceptLevelUpChoice | Explicit ranks 0..2 and mutable damage/speed/explosion radius; snapshots isolate active Missiles; create resets |
| Weapon focus | weaponFocus; LevelUpGenerator.prepare | Laser baseline; accepted weapon/evolution updates affinity only, weighted development replaces least-rank Scene cursors; old pure helper/tests retained |
| Passive Modules | PassiveModule, moduleLevels; acceptLevelUpChoice | Explicit Hull/Thruster/Collector/Combat/Spatial/Replication levels and effects; create resets levels and mutable values |
| Shared stat consumers | derived playerMaxHealth/movementSpeed; fireLaser/fireMissile/fireDroneFrom; weaponInterval/resetWeaponTimer | Build Hull/Thrust, Reactor, Drone-only Engineering, Velocity/Scale and local interval/FireControl; retained Missile body radius; outgoing launch Impact once; no Shield/Analyzer effects |
| Local compatibility | xpMagnetRadius, globalDamageMultiplier, moduleLevels | Collector activation radius, legacy Combat Processor, Spatial explosion and Replication bolt addition; Hull/Thruster levels are label/history, Build owns flat bonuses |
| Mixed choice pool | OrdinaryChoice, LevelUpChoice, levelUpPool, choiceLabel; enterLevelUpPause -> LevelUpGenerator.generate |36 canonical choices; weighted development/passive/pivot or reserved evolution, exactly3 Reward draws; authentic transaction still selects |
| Hostile fire | fireHostileProjectile; hostileFireInterval | Same1500 ms global timer independently attempts nearest Shooter aimed shot and active Warden phase4/8 radial burst via launchHostileProjectile; no per-enemy timers or phase resets |
| Collision inputs | updateProjectiles; player/enemy/projectile radii | Scene supplies per-enemy body radius24/40 + projectile/Missile/player radius; explosion coverage stays center-only |
| Collision calculation | collision.ts; segmentCircleHitTime | Pure numeric math, no Phaser/runtime records |
| Player damage sources | updatePlayerContact; updateProjectiles | Contact and hostile impacts share damagePlayer/protection |
| Runtime HUD | hud; updateHud; create, update, damagePlayer, updateXpPickups | Fixed HP Defense current/Build max, XP/threshold, level and Dash readiness; refreshed on mutations/displayed cooldown change, recreated on retry |
| Temporary UI | create; enterPlayerDeath | Fixed labels, SHIP DESTROYED, RETRY |

## Runtime and lifecycle

BootScene.create → scene.start('GameplayScene') → GameplayScene.create
→ fresh PREPARING lifecycle/Build/Defense/progression/RewardTransaction → player/HUD/enemy/collections
→ spawn/Laser/Missile/Drone/hostile timers/input/UI → run.start → RunRandom → RunDiagnostics → DEV → update.

update: sample intents / handle PauseRequest → lifecycle/player/intent guards → diagnostics.advance(delta) once → player movement/Dash split/bounds → Drone orbit → owned pursuit / Shooter band / Charger phase movement → one external decay/displacement + arena clamp → target/highlight
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
- Final recipe prerequisite resumes normally; only the next presentation can offer an evolution. Offers use the separate three-evolution cursor; accepting Prism sets Build Laser form PRISM without consuming Combat or changing numeric Laser values/timer.
- create resets Build Laser to BASE and other two evolution flags to false; fresh LevelUpGenerator owns Prism-first evolution cursor. Active Missiles own clusterEnabled at launch; satellite resolution derives only from readonly launch damage/radius after primary deaths.
- create resets missileRanks, missileValues, weaponFocus as well as laserRanks and prismEvolved. Prism uses the same straight-shot collection and five existing gameplay timers.
- Projectile iteration stops after cleaning the lethal hostile impact or lethal Boss player impact; remaining objects freeze. Missile/Cluster finishes its current primary/satellite affected snapshots and Missile removal before terminal entry. First terminal outcome in existing order wins; no unrelated later contact/XP work.
- create empties missiles; native Phaser restart shuts down old display objects/UI and five timer events before create. Missile position/target/heading/lifetime freeze under existing simulation guard.
- create resets droneRanks/droneAttackValues and constructs fresh generator policy; Firing System resets the existing droneTimer in place only on accepted current choice. create restores one Drone at angle 0; Twin reference/flag clear; both orbit visuals/bolts freeze under simulation guard. Shared straight projectiles use each launch radius for collision/cleanup.
- Retry exists only in death presentation; no manual per-object reset service.

## Test coverage

| Classification | Owner | Evidence |
| --- | --- | --- |
| TRACKED TESTS | collision.test.ts → segmentCircleHitTime | 9 tests: hits, misses, overlap, tangent, zero step, bounds, ordering |
| TRACKED TESTS | experience.test.ts → experience.ts | 23 tests: original8 plus safe threshold/state/representational boundary validation |
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
PlayerProgression / progression/experience.ts / GameplayScene.creditExperience IMPLEMENT_TASK GAME-018 — Player XP and Level Rules.
GameplayScene.isLevelUpPaused / enterLevelUpPause / isSimulationPaused IMPLEMENTS_TASK GAME-019.
GameplayScene.levelUpPresentation / acceptLevelUpChoice IMPLEMENTS_TASK GAME-020.
GameplayScene.laser / laserTimer / acceptLevelUpChoice IMPLEMENTS_TASK GAME-021.
GameplayScene.hud / updateHud IMPLEMENTS_TASK GAME-022 — Basic HUD.
GameplayScene Dash state / player/dash.ts IMPLEMENTS_TASK GAME-023 — Initial Ship Active Ability: Dash.
EnemyDefinitions + GameplayScene enemyPresentation / EnemyRuntime / spawnEnemy / hostile fire + enemies/shooterMovement.ts IMPLEMENTS_TASK GAME-024 — Chaser/Shooter.
EnemyDefinitions + GameplayScene enemyPresentation / shared direct pursuit / timedSpawnSequence IMPLEMENTS_TASK GAME-025 — Tank.
GameplayScene eliteTankData / EnemyRuntime.isElite/contactDamage/xpValue / spawnEnemy / killEnemy / highlight; enemies/eliteTank.ts IMPLEMENTS_TASK GAME-036 — Elite Enemy Prototype. Same Tank pursuit, common collision/XP, five unchanged gameplay timers; no portal/affix framework.
GameplayScene bossSpawned / public bossDefeated / EnemyRuntime.collisionRadius / spawnEnemy / restoreEnemyOutline / fireHostileProjectile / launchHostileProjectile; enemies/warden.ts IMPLEMENTS_TASK GAME-037 — Warden Boss. Successful30 replacement, current-HP phases, common physical collision/death/XP10, same hostile event. Boss death supplies the flag consumed by GAME-038 after atomic attack completion; terminal Victory now blocks spawn31.
GameplayScene.isRunVictorious / victoryPresentation / enterRunVictory; updateProjectiles / updateMissiles atomic boundaries / isSimulationPaused / acceptLevelUpChoice / enterPlayerDeath IMPLEMENTS_TASK GAME-038 — Run Victory / Result Flow. Common XP10 remains frozen; current-level result and native NEW RUN; no new timer/Scene/manager.
GameplayScene MissileRuntime / missile / fireMissile / updateMissiles / explodeMissile IMPLEMENTS_TASK GAME-026 — Missile.
GameplayScene drone / droneAngle / updateDrone / fireDrone / firePlayerProjectile IMPLEMENTS_TASK GAME-027 — Drone.
GameplayScene.moduleLevels / mutable run values / LevelUpChoice / progression/selectChoices.ts IMPLEMENTS_TASK GAME-028 — Passive Module Foundation.
GameplayScene.laserRanks / prismEvolved / progression/prismLaser.ts / combat/prismSpread.ts IMPLEMENTS_TASK GAME-029 — Laser → Prism Laser.
GameplayScene.missileRanks / missileValues / weaponFocus / progression/focusedUpgrade.ts (retained helper) IMPLEMENTS_TASK GAME-030 — Missile Upgrade Foundation.
GameplayScene.moduleLevels.spatial / fireMissile / progression/spatialAmplifier.ts IMPLEMENTS_TASK GAME-031 — Spatial Amplifier Passive.
Spatial affects only final Missile launch explosion radius; Blast Expansion remains separate. create resets Spatial0; existing choice slots/focus and five timers remain authoritative.
GameplayScene.clusterEvolved / explodeClusterSatellites; LevelUpGenerator now owns evolution cursor; progression/clusterMissile.ts / evolutionOffer.ts and combat/clusterSatellites.ts IMPLEMENTS_TASK GAME-032 — Cluster Missile Evolution.
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
identity. No maturity/difficulty behavior is implemented; GAME-055 consumes existing identity/Analyzer for offers only.

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
actual Hit source projected by GAME-051; no retained death/source registry. Incoming
PlayerDamage wraps current Defense results with God/protection/Shield/actual-Hull semantics.
Swept geometry, strict ties, cap/expiry/world exits, Prism independent beams, Twin independent
origins and Cluster primary then survivor union remain concrete Scene behavior. Complete
owning cleanup precedes Victory; first-terminal authority stays RunLifecycle. Stale Hits/
flights guard exact run before fresh enemies/Defense. Five events/five DEV methods and zero
additional RNG draws remain. GAME-052 adds player-only physical Impact below; GAME-057+ remain deferred. 71 pure +16 new Scene cases,
actual Chrome offensive/old-new snapshot/pause/BLUR/native terminal/restart and unmodified
production ordinary Death/real RETRY checks pass. GATE A PASSED; GATE B PASSED.

EnemyDefinitions.ts + GameplayScene createEnemy/spawnEnemy/EnemyRuntime IMPLEMENT_TASK GAME-050.
The pure module owns authored numerical definitions/fixed Elite/explicit neutral context and
validated detached frozen snapshots. Scene captures exact run before construction; initializes
current HP once, consumes owned movement/body/contact/XP and keeps concrete visual/AI/kill
behavior. Initial PREPARING Chaser precedes five events/start/entropy, then one diagnostic
bootstrap. Timed/DEV callbacks pass captured owner; applyEnemyHit requires enemy.run===hit.run,
killEnemy requires current RUNNING owner plus membership. Native restart gives a fresh Chaser
snapshot and owners; stale values stay readable without mutation authority. No extra timers,
RNG, dependency, content or difficulty/Build/Tags coupling. GAME-051 adds the death/attribution boundary below.
136 pure +33 added Scene cases pass (739 total/25 files). Actual Chrome Clock schedule,
movement/hostile/six-path combat/real BLUR and active-flight pauses/native restart checks pass;
unmodified production ordinary Death/real pointer RETRY passes. GAME-050/051/052 DONE; GAME-056 DONE; GAME-057+
BACKLOG; GATE A/B PASSED.

EnemyDeath.ts + GameplayScene EnemyHit/lastDamagingSource/applyEnemyHit/killEnemy and
RunDiagnostics killsBySource IMPLEMENT_TASK GAME-051. Pure values/factories perform no gameplay
or RNG work. Exact captured Hit.run guards precede current owner/member/HP/source access;
applyEnemyHit remains one HP calculation/write, with positive-loss source projection and lethal
primitive preflight first. killEnemy requires actual lethal result/current HP/provenance, then
constructs one detached frozen seven-field record and applies ordered concrete Boss/pickup/
target/visual/removal/observer consequences. No source-less success, dead registry/history or
new authority. Repeating accepted/old completion contexts returns null before another record.
XP1/5/10 is physical; straight or full primary/satellite union and owning flight cleanup finish
before first-terminal Victory. Boss XP stays frozen/uncollected. Observer recordEnemyKilled
requires source, explicitly maps seven keys, prepares killed/XP/source sums atomically and keeps
six timeline kinds/newest256. Native restart resets attribution/counters and exact owners;
old immutable values remain readable, old callbacks cannot mutate/draw in the new run.
125 pure +26 added Scene +14 observer cases (904 total/26 files, 233 Scene/49 observer) and actual
seven-source/A->B/loss0/Cluster/XP/pause/genuine BLUR/native terminal/restart Chrome checks pass.
Unmodified production ordinary enemy death/XP, incoming Death and actual pointer RETRY pass
without DEV or pageerrors. Five events/four RNG budgets/Build/Tags/Analyzer/Defense/rewards and
GAME-049/050 contracts remain. GAME-051/052 DONE; GAME-056 DONE; GAME-057+ BACKLOG; GATE A/B PASSED.

EnemyDefinitions/knockback/chargerMovement + Scene launch/Hit/movement/contact/Graphics IMPLEMENT_TASK GAME-052.
Six identities are five normal roles plus legacy boss; Elite remains Tank-only. Definitions and
spawn snapshots own copied frozen interaction:{knockbackResponse,decoySusceptible}; Scene consumes
response physically and retains susceptibility as data only, with no Decoy target runtime.
Laser/Drone/Missile launch calls composePlayerImpact(200/160/400,ShipImpact) once. Player attacks
freeze required impact; hostile/contact schemas remain unchanged. EnemyHit carries copied actual
flight direction or primary/FIRST satellite origin, never death/source metadata. applyEnemyHit
preflights physical values/candidate vector before unchanged single HP/source/lethal transaction;
only surviving current owned members receive velocity, including hpLost0 without attribution.
killEnemy retains one record/pickup/observer and destroys Charger Graphics alongside visual cleanup.
Seven source combinations and seven-field EnemyDeathRecord remain unchanged.

update captures exact run and a local ChargeContact map. Every live member uses original AI or
stepCharger, then stepKnockback once, arena clamp/outward-component removal and validated commit.
Charger tracks WINDUP from final displaced center; CHARGING never steers. One reusable Graphics
renders only WINDUP325px/3px/pink/0.75, clears outside and is destroyed on death/captured shutdown.
Only its arena-clamped CHARGING AI segment contributes earliest inclusive42-radius contact evidence;
final overlap precedes that pose, existing first-enemy separation/ENEMY_CONTACT/Defense remains
sole damage route. Map never persists across update/pause/restart; force alone creates no sweep.

Scene mutable additions are external vector and Charger-only phase/time/direction/Graphics.
No authored numeric mirror, framework, new HP/death authority, timer, DEV command or RNG consumer.
Natural CCCSCT2000/cap10/Elite12+24/Warden30 and accepted placement2 draws remain; Swarm/Charger
are exercised through guarded common factory calls in ignored actual-runtime fixtures only.
Six diagnostic archetype buckets extend the unchanged seven kill-source counters; XP1 for each
new role. Initial Chaser spawn observation remains1, fresh killed buckets six zeros.

1078 tracked cases/28 files preserve all904 baseline assertions under approved migrations.
Installed Chrome/Phaser verifies new roles/physical seven phases/OLD+NEW Impact, visible normal
and12FPS telegraph/charge/recovery, separate swept/large/bounds cases, genuine BLUR and composed
reward/focus pause with actual pointer, legacy Clock first30/60 Encounter draws (internal collection
clearing), full terminal cleanup and two Victory NEW RUN/Death RETRY/PAUSED native restart with
new-role/force/Graphics dirtied. Old callbacks/state/poses cannot reach fresh owners or draw RNG;
five new events and fresh zero velocity/interaction/Tags/counters restore. Unmodified production
uses real input/rendered output for survivor knockback, ordinary Death and actual mouse RETRY;
DEV absent/no pageerrors. Known favicon404/bundle-size warnings remain. GAME-052 DONE; GAME-056 DONE; GAME-057+
BACKLOG; GATE A/B PASSED, with no other gate closure.

PlayerProgression + experience + xpConsolidation + Scene XP/reward integration IMPLEMENT_TASK GAME-053.
create constructs progression during PREPARING, captures it and the physical array for exact shutdown.
Only owner creditXp writes numeric level/XP/pending, resolvePendingLevel decrements one; BigInt cost/
binary search is shared with Scene preflight. HUD/result/DEV project one snapshot; DEV keeps3 fields.
creditExperience requires captured current RUNNING run/owner/player plus physical member/value or
legitimate DEV remainder. Diagnostics affected sums/evictions preflight before any cross-owner mutation.
killEnemy remains sole normal drop creator; collection remains reverse-order updateXpPickups.
consolidateXpPickups applies the pure original-index plan after current live identity/cell/value checks,
destroys newer and compacts captured array in place. No expiry/hard cap, RNG or observer effects.
enterLevelUpPause presents one pending opportunity; acceptLevelUpChoice checks exact Text/candidate/
run/progression and preflights observers, applies actual upgrade, resolves one, then generates updated
eligibility under the same REWARD. Only the final choice releases REWARD; other reasons survive.
Terminal retains earned numeric/pending state, destroys reward UI and suppresses collection/generation.
Native restart disposes old progression and pickup visuals, resets1/0/0 and five events; old refs inert.
1158 tracked cases/30 files preserve1078 baseline; pure exact oracle/planner/performance and Scene pending/
identity/atomicity/focus/native checks pass. Installed Chrome real pointer32-XP chain, actual BLUR,
physical1/5/10, conservation/sparse3000 and four straight/Missile/Cluster NEW RUN cycles, Death RETRY/
paused restart pass. Unmodified production real keyboard/pixel pickup pursuit reaches Level2 and pointer
choice, plus ordinary damage/Death/RETRY/DEV absence; no new pageerrors. GAME-056 DONE; GAME-057+ BACKLOG; A/B PASSED;
GATE C unapproved. No new dependency, timer, DEV method, RNG stream or later reward framework.

RewardTransaction + rewardChoices + rewardEligibility + Build previews + Scene integration IMPLEMENT_TASK GAME-054.
create constructs exactly one idle RewardTransaction in PREPARING and captures it for exact shutdown/
destroy disposal. Owner open/present/trySelect/invalidate/snapshot/dispose manages frozen canonical3,
authentic object token/safe ordinal, two active phases and private synchronous guard; detached JSON
reads cannot select. Old direct operations throw, old copies remain readable, equal ordinals from a
new owner do not share authority. No lifecycle/Build/XP/RNG/diagnostic/Phaser references in the owner.
rewardContext reads actual detached Build/legacy state and two narrow Build previews; generation and
selection both use pure eligibility. Previews reuse PlayerBuild's prototype candidate preparation/
resolve without cache/Tag/Defense mutation. focusedUpgrade adds only an optional nine-track mask.
enterLevelUpPause preflights before RNG/pause/UI, now delegates policy to GAME-055 LevelUpGenerator/exact3 draws, then open -> actual named Text handlers -> present -> one offered observation.
rewardPresentation captures exact run/progression/Build/Reward/token, Text/handler pairs and mapping;
currentReward checks those identities before disposed reads. Named persistent handlers survive false/
preflight failures for a valid retry without reattachment. clearRewardPresentation removes exact pairs
on success/replacement/terminal/disposal; old cleanup cannot affect a fresh presentation.
acceptLevelUpChoice -> trySelect -> ONE applyRewardChoice preflight/actual upgrade/pending1/selected1.
Callback true -> accepted-token invalidation -> guard exit -> trySelect true return; ONLY afterward
Scene removes UI/input and generates an updated next offer under same REWARD or releases final REWARD.
Twin's provisional Arc is last failing preparation and cleaned on rejected recheck. No new XP or Build
owner, future policy/content, dependency, TimerEvent/Clock/stream/DEV method or changed launch contract.
1294 tracked tests/32 files preserve1158 baseline. Installed Chrome checks all18 actual mouse effects/
future launches/frozen in-flight snapshots/same timers, rejected same-Text retry, duplicate/stale/forged0,
exact callback order, physical32 sequential3, genuine BLUR/manual/held-input freeze, four atomic Victory
NEW RUN cycles, Death RETRY and PAUSED native restart. Unmodified production real keyboard/pixels/natural
physical XP/Level-Up/mouse choice and ordinary incoming Death/RETRY pass, DEV absent/no new pageerrors.
Known favicon404/bundle/worker advice only. GAME-054 DONE; GAME-056 DONE; GAME-057+ BACKLOG; A/B PASSED; C unapproved.

LevelUpGenerator + GameplayScene.levelUpGenerator/enterLevelUpPause/currentReward IMPLEMENT_TASK GAME-055.
create constructs/captures exact policy during PREPARING; disposeReward disposes that owner.
assertCanGenerate validates detached context/identity/eligibility and every slot path before pause,
input/UI/RNG. generate consumes exactly3 Reward draws, reserves cyclic evolution Slot3 and returns
separate deeply frozen candidates while retaining copied frozen provisional tuple/update.
Actual open/Text handlers/present precede exact run/Build/progression/Reward/generator/ordinal/tuple
check and recordPresented; then existing diagnostics. History2/misses0..4/signature/cursor commit
only on presentation. Changed signature uses new0 for weighting and update, with0/1/0 outcomes.
currentReward captures generator identity before disposed reads; selection order/real effects and
retry handlers remain GAME-054. After true trySelect return, Scene cleans UI then generates from
updated Build or releases final REWARD. clearTerminalInput cancels provisional without miss;
shutdown/destroy invalidates old owner, native create resets empty policy. No timer/stream/DEV/
selection authority or future content added. Existing least-rank helper/tests remain but Scene
has no focusCursors/evolutionOfferCursor.55 pure +5 new Scene tests,1354 total/33 files, independent
literal seeded outputs, actual Chrome all18 effects/retry/3-offer9-draw chain/real Tags+Analyzer4/
genuine BLUR/native terminal cycles and unmodified production natural XP/input/Death/RETRY pass.
GAME-055 DONE; GAME-056 DONE; GAME-057+ BACKLOG; GATE A/B PASSED; GATE C unapproved.

## GAME-056 actual Laser ownership and call paths

| File / symbol | Responsibility / relation |
| --- | --- |
| src/game/player/laserProgression.ts | Closed LaserConfiguration/LaserChoice, exact authored profiles/catalog metadata, prepareLaserChoice, safe laserTagCandidate, laserReady, laserAttack composition |
| PlayerBuild.previewLaserChoice/applyLaserChoice | Sole private Laser configuration; same complete candidate preparation, detached preview/config/Tags/identity, one atomic commit; snapshot.laser and captured disposal |
| PlayerBuild.previewStatPercent -> Scene.applyBuildChange -> assertCombatConsumers | Shared-stat candidate validates all three launch/cadence consumers before the Build write |
| rewardChoices.ts -> rewardEligibility.ts | Original18 then exactly18 new correlated IDs; detached Build Laser projection consistency, generation/selection shape/form/rank/recipe/numeric feasibility |
| LevelUpGenerator.prepare/generate/recordPresented |36 affinities; one acquisition-only Slot1 when feasible, other acquisitions excluded; numeric-only zero branch uses ordinary3-slot policy; full preflight,3 draws, presentation-only policy commit |
| GameplayScene.applyRewardChoice | Existing authentic transaction callback -> one Build Laser apply -> same Laser timer reset iff delay differs -> one pending/selected; next offer only after trySelect returns |
| combat/combat.ts#createAttack | Optional copied/frozen BASE Laser mechanics SCATTER1/(3 or5), REPEATER1/1, LANCE(3 or4 or5)/1; PRISM/other kinds reject mechanics |
| combat/laserPatterns.ts#laserDirections -> Scene.fireLaser | One cached nearest-target aim, threshold.001, deterministic spread, zero RNG; GAME-059 ranking/distribution deferred |
| GameplayScene.launchPlayerProjectile/updateProjectiles/removeProjectile/disposeFlights | Concrete shared bounded Scatter map per volley, max5 contacts/entries; exact visited enemy Set per Lance flight/max5; one applyEnemyHit route and owning cleanup before Victory |
| RunDiagnostics choice validation |36 IDs only; same six timeline kinds/seven kill-source buckets |
| laserProgression.test.ts + LevelUpGenerator.test.ts + GameplayScene.devTools.test.ts | Pure profile/Build/atomic/numeric/geometry/closed choice proofs; independent literal goldens; real Scene reward/collision/terminal paths.1490 total tests/34 files |

Base/Prism keep the existing five-field flight snapshot; new mechanics carry no live Build.
New forms retain LASER.BASE.DIRECT; Missile/Drone/EnemyDeath/XP contracts are unchanged.
Exactly5 gameplay events/4 streams/5 DEV methods remain. GAME-057+ BACKLOG; GATE C unapproved.

## UI-001 Russian display ownership

GameplayScene.create/updateHud/projectPause/choiceLabel/enterPlayerDeath/enterRunVictory ->
ui/russianText.ts: one frozen RewardCandidateId-keyed36-name mapping, exact original18 effects,
new18 name-only Laser choices, static text and concrete HUD/dash/victory formatters.
laserProgression.ts retains profiles/mechanics and exports no display labels.
index.html owns UTF-8/ru/browser title. Scene owns screen-fixed guide visibility, local48px
reward heading and unchanged32px choice hit areas/handlers. No locale engine or new authority.
Actual Chrome catalog108 measurements/three viewports, Cyrillic screenshots, same-Text retry,
physical32/9 draws, genuine BLUR, terminal/native restarts and unmodified production pass.
1622 tests/35 files (94 pure UI +38 Scene additions, all1490 baseline retained).
Five timers/four streams/five DEV methods, reward IDs/order/goldens and gameplay remain exact.
UI-001 DONE; GAME-057+ BACKLOG; GATE A/B PASSED; GATE C unapproved.

## Common navigation queries

| Question | Likely path / anchor |
| --- | --- |
| Where is diagnostic history observed? | RunDiagnostics.ts; GameplayScene.ts → create/update/createEnemy/killEnemy/damagePlayer/creditExperience/enterLevelUpPause/acceptLevelUpChoice/observePause/enterPlayerDeath/enterRunVictory/publishDevTools |
| Where does enemy death happen? | GameplayScene.ts → actual EnemyHit → applyEnemyHit (HP/source/preflight) → killEnemy (guard/record/consequences); EnemyDeath.ts pure values/factories |
| Where is kill attribution counted? | RunDiagnostics.ts → required recordEnemyKilled(...,killSource), explicit seven-key mapping and aggregates.killsBySource; DEV nested diagnostics only |
| Where are XP drops/magnet/collection owned? | GameplayScene.ts → killEnemy, xpPickups, updateXpPickups; create resets |
| Where are XP thresholds and levels calculated? | progression/PlayerProgression.ts → experience.ts; Scene playerProgression |
| Where are level-up choices/resume owned? | GameplayScene.ts → enterLevelUpPause, levelUpPresentation, acceptLevelUpChoice |
| Where are HUD values rendered/refreshed? | ui/russianText.ts → hudLines/dashLabel; GameplayScene.ts → hud/updateHud; create, damagePlayer, updateXpPickups |
| Where is Dash input/timing/reset owned? | input/KeyboardInput.ts → Space intent; GameplayScene.ts → update, movePlayer, create; player/dash.ts#stepDash |
| Where is player damage controlled? | PlayerDefense.ts numeric Shield/Hull/protection; GameplayScene.ts → damagePlayer ownership/God/diagnostics/HUD/terminal adapter |
| Where are contact separation and Hull healing owned? | GameplayScene.ts → updatePlayerContact geometry; applyBuildChange/acceptLevelUpChoice → PlayerDefense.reconcileMaxHull/healHull, Build maximum |
| Who owns projectile movement/lifetime/cleanup? | GameplayScene.ts → updateProjectiles (straight shots), updateMissiles (homing) |
| Where are Drone orbit/bolts owned? | GameplayScene.ts → droneConfig, droneAttackValues, droneRanks, droneTimer, droneAngle, twinDrone, twinDroneEvolved, updateDrone, positionDrone, fireDrone, fireDroneFrom, aimProjectile / updateProjectiles |
| Where are Missile homing/explosion owned? | GameplayScene.ts → fireMissile, aimMissile, updateMissiles, explodeMissile; collision.ts sweep |
| Where is collision math implemented? | collision.ts#segmentCircleHitTime |
| Where are Attack/Hit/Damage and launch truth owned? | combat/combat.ts types/four pure APIs; GameplayScene.ts → local Hit, applyEnemyHit, damagePlayer and exact-run typed flight runtimes |
| Where is collision math tested? | src/game/combat/collision.test.ts |
| Where are enemy archetypes/movement owned? | EnemyDefinitions.ts → EnemyArchetype/EnemyDefinition/table/factory; GameplayScene.ts → EnemyRuntime.spawnSnapshot/run, enemyPresentation, update; enemies/shooterMovement.ts; eliteTankData / enemies/eliteTank.ts; wardenPhase / enemies/warden.ts |
| Where are enemy spawn callbacks? | GameplayScene.ts → create timer / spawnEnemy / timedSpawnSequence / successfulTimedSpawns |
| Where are player/hostile fire callbacks? | GameplayScene.ts → create timers / fireLaser / fireMissile / fireDrone / fireHostileProjectile → independent selectNearestEnemy('shooter') / active Warden burst → launchHostileProjectile |
| What guards callbacks while dead or level-up paused? | GameplayScene.ts → isSimulationPaused checks in spawn/fire helpers |
| Who owns Laser firing configuration? | PlayerBuild.ts → private laser/previewLaserChoice/applyLaserChoice; laserProgression.ts → profile; Scene → laserTimer/fireLaser |
| Where are Prism prerequisites, ranks and spread owned? | PlayerBuild snapshot.laser and laserProgression.ts; Scene derived laserRanks/prismEvolved/fireLaser; combat/laserPatterns.ts/prismSpread.ts |
| Where does restart cleanup occur? | GameplayScene.ts → enterPlayerDeath RETRY or enterRunVictory NEW RUN → Phaser scene.restart lifecycle |
| Where does Victory start? | GameplayScene.ts → updateProjectiles / updateMissiles completed lethal Boss operation → enterRunVictory; killEnemy only records defeat/reward/removal |
| Where are repository/task rules? | AGENTS.md; docs/TASK_GRAPH.md; active user task |

## Update policy

Update for material file/module boundaries, exported architectural symbols, runtime ownership,
important local imports or meaningful architectural test coverage. Reinspect source then refresh
baseline HEAD provenance. Do not update for balance/tuning, wording, each status change or every
private helper rename. This map contains current implementation only, never future subsystem stubs.
