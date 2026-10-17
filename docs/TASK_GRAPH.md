# NEBULA — Development Task Graph

## Authority and execution

Active implementation order, dependencies and status. [GAME_DESIGN](GAME_DESIGN.md) and
[ARCHITECTURE](ARCHITECTURE.md) define target behavior/contracts;
[CONTENT_MANIFEST](CONTENT_MANIFEST.md) fixes the wave and [BALANCE](BALANCE.md) its hypotheses.
[CURRENT_STATE](CURRENT_STATE.md) plus source/tests describe what works; [PROJECT_GRAPH](PROJECT_GRAPH.md)
maps implemented ownership.

Implement only the active task. A roadmap node is not authorization or a detailed
implementation specification. Define/review a scoped task before starting it.
Do not implement GAME-039 or GAME-042+ during DESIGN-005.

Statuses: DONE (completed/verified), ACTIVE (being implemented), READY (may start),
BLOCKED (missing dependency/decision), BACKLOG (planned, not ready),
IN REVIEW (work prepared, awaiting architect approval), SUPERSEDED (replaced; ID retained).
Design APPROVED/CANDIDATE/DEFERRED is independent of implementation status.

## Completed prototype baseline

PREP-001 Repository Bootstrap, PREP-002 Browser Toolchain, PREP-003 Phaser Bootstrap,
PREP-004 Quality Gates and PREP-005 Architecture Baseline remain DONE.
GAME-001..038 below are DONE; Git preserves their full historical specifications.
First Playable (GAME-001..015) is complete; MILESTONE-002 validated Playable Core.
MILESTONE-003 Weapon Architecture Audit found no required weapon refactor at that checkpoint.
Historical DESIGN-001..004 informed prototype work; their obsolete target directions
are SUPERSEDED by DESIGN-005, without undoing implemented completion facts.

| ID | Completed task | Status |
| --- | --- | --- |
| GAME-001 | Gameplay Scene | DONE |
| GAME-002 | Player Placeholder | DONE |
| GAME-003 | Desktop Player Movement | DONE |
| GAME-004 | Arena Bounds and Camera | DONE |
| GAME-005 | Basic Enemy Runtime | DONE |
| GAME-006 | Enemy Chase Movement | DONE |
| GAME-007 | Enemy Spawning | DONE |
| GAME-008 | Automatic Target Selection | DONE |
| GAME-009 | Basic Laser Weapon | DONE |
| GAME-010 | Projectile Runtime | DONE |
| GAME-011 | Enemy Damage and Death | DONE |
| GAME-012 | Player Health and Contact Damage | DONE |
| GAME-013 | Basic Enemy Projectile | DONE |
| GAME-014 | Player Death State | DONE |
| GAME-015 | Restart Flow | DONE |
| GAME-016 | XP Drop | DONE |
| GAME-017 | XP Magnet Collection | DONE |
| GAME-018 | Player XP and Level Rules | DONE |
| GAME-019 | Level-Up Pause State | DONE |
| GAME-020 | Upgrade Choice UI | DONE |
| GAME-021 | Laser Upgrade Levels | DONE |
| GAME-022 | Basic HUD | DONE |
| GAME-023 | Initial Ship Active Ability: Dash | DONE |
| GAME-024 | Second Enemy Archetype: Shooter | DONE |
| GAME-025 | Third Enemy Archetype: Tank | DONE |
| GAME-026 | Missile Weapon | DONE |
| GAME-027 | Drone Weapon | DONE |
| GAME-028 | Passive Module Foundation | DONE |
| GAME-029 | Weapon Evolution Foundation | DONE |
| GAME-030 | Missile Upgrade Foundation | DONE |
| GAME-031 | Spatial Amplifier Passive | DONE |
| GAME-032 | Cluster Missile Evolution | DONE |
| GAME-033 | Drone Upgrade Foundation | DONE |
| GAME-034 | Replication Matrix Passive | DONE |
| GAME-035 | Twin Drone Formation | DONE |
| GAME-036 | Elite Enemy Prototype | DONE |
| GAME-037 | Boss Prototype | DONE |
| GAME-038 | Run Victory / Result Flow | DONE |

First Playable: startup, movement, arena/camera, spawn/chase/automatic Laser, damage,
death and native retry. GAME-016..022 added XP, pause/choices, Laser upgrades and HUD.
GAME-023..035 added prototype Dash, Shooter/Tank, homing Missile, Drone, six repeatable
Passive Modules, weapon tracks and Prism/Cluster/Twin Evolution.
GAME-036 added concrete Elite Tank; GAME-037 added Warden; GAME-038 completed atomic
terminal Victory, current-level result and native NEW RUN. Five gameplay TimerEvents
and first-terminal semantics remain migration invariants until explicitly superseded.
The GAME-038 validated baseline records 146 tracked tests / 16 files, browser/real-Phaser
coverage, two Victory NEW RUN cycles and ordinary death RETRY. This is historical evidence,
not a claim that future architecture already exists.

## DESIGN-005 — Target Architecture & Vertical Slice Baseline

STATUS: DONE

Depends: completed GAME-038 baseline and the supplied target design.
Scope: documentation-only consistency migration across GAME_DESIGN, ARCHITECTURE,
CONTENT_MANIFEST, BALANCE, TASK_GRAPH and PROJECT_GRAPH.
CURRENT_STATE remains implementation truth. No runtime/tests/packages/dependencies or
future runtime stubs change. DESIGN-005 is architect-approved and DONE.
Its repository documentation is the authoritative target baseline for subsequent tasks.

## GAME-039 — First DevTools Utilities

STATUS: DONE

### Goal and dependencies

Depends: DESIGN-005 (DONE), GAME-038 (DONE), existing XP/choice and Warden paths.
Implemented and verified against the acceptance contracts below.
Expose only a small DEV browser API to reproduce expensive current prototype states before
the later architecture migration. GAME-042+ remain BACKLOG.

### Current source anchors and preserved behavior

Inspect these actual owners again at implementation time; source/tests override this map:

| Current file / anchor | Integration constraint |
| --- | --- |
| `src/game/scenes/GameplayScene.ts#create` | Resets run fields, creates initial Chaser and five events; native `scene.restart()` handles old Phaser objects/timers |
| `isSimulationPaused` | `isPlayerDead || isLevelUpPaused || isRunVictorious`; use this current guard for mutations |
| `updateXpPickups`, `playerExperience`, `updateHud`, `enterLevelUpPause` | Collection calls `addExperience`, refreshes HUD, removes pickup, then opens real choice pause on level increase |
| `src/game/progression/experience.ts` | `xpForNextLevel(level) = level * 5`; `addExperience` retains overflow and returns state |
| `enterLevelUpPause`, `acceptLevelUpChoice` | Stable three-choice focused/passive/open-or-evolution presentation and normal selection/resume |
| `createEnemy`, `enemyData.boss`, `enemies` | Real `'boss'` Warden: HP60, radius40, contact2, XP10; creation sets `bossSpawned` |
| `spawnEnemy`, `maximumEnemies`, `minimumSpawnDistance` | Cap10, minimum player distance600, active Warden suppresses timed spawning; `successfulTimedSpawns` advances only after timed creation |
| `src/game/enemies/warden.ts` | `wardenPhase` derives phase from HP; `shouldSpawnWarden` guards successful timed spawn30 |
| `fireHostileProjectile`, `update`, `restoreEnemyOutline` | Real HP-derived Warden movement/style and 4/8-direction hostile bursts |
| `damagePlayer`, `updatePlayerContact`, `updateProjectiles` | Common incoming-damage/protection boundary; hostile collision removes its projectile even when damage is rejected |
| `killEnemy`, `updateProjectiles`, `updateMissiles`, `enterRunVictory` | Common Boss death/XP first; owning straight attack or full Missile/Cluster detonation cleans up before first-terminal Victory |
| `enterPlayerDeath`, `enterRunVictory` | Death RETRY and Victory NEW RUN use native restart; preserve their distinct UI and first-terminal semantics |

GameplayScene owns concrete per-create DEV exposure and shutdown/destroy invalidation.
No new Run architecture is introduced.
The current contact path has no escape-separation mechanic; preserve its existing
contact/position behavior, and do not implement target-design separation or Shield here.

### DEV exposure, results and lifetime

Use Vite's development boundary (`import.meta.env.DEV`), not a player setting.
During a valid DEV GameplayScene/run, `window.__NEBULA_DEV__` exposes exactly:

| Method | Result |
| --- | --- |
| `snapshot()` | Detached plain serializable snapshot; `null` after invalidation |
| `forceLevelUp()` | `true` on successful next-level request, otherwise `false` |
| `spawnWarden()` | `true` on real creation, otherwise `false` |
| `setWardenHealth(health)` | `true` on accepted finite 1..60 assignment, otherwise `false` |
| `setGodMode(enabled)` | `true` on accepted boolean setting, otherwise `false` |

Production build/runtime: the window property is absent/undefined. No production player
path depends on it; unused DevTools preserves current gameplay.

Each `create` owns a fresh API object and an explicitly invalidatable per-run binding.
A native restart may reuse the same Scene instance: checking that instance is currently
active, or redirecting old closures through a mutable global current-scene pointer, is
insufficient. Shutdown/disposal invalidates the old binding before fresh publication.
Remove the window property only if it still points to that binding's API, so old cleanup
cannot remove a newer API. Clean owned listeners; no stale callbacks/timers/references.
Captured `oldApi` never gains authority over the restarted scene.
After shutdown: snapshot returns null and every mutation returns false, without lifecycle
exceptions or effects on a newer run.

While the current scene exists, snapshot remains read-only during Level-Up pause, Death
and Victory. Every mutating command returns false without effects during those states.
No command queues, nested reward UI or bypass of first-terminal-wins.

### snapshot()

Include detached values sufficient to verify:

- Terminal state: `isPlayerDead`, `isRunVictorious`, `isLevelUpPaused` and run-local God Mode.
- Player/progression: `playerHealth`, `playerExperience.level`, XP toward next level,
  `xpForNextLevel` threshold and current protection remaining for damage verification.
- Boss: `bossSpawned`, `bossDefeated`, active Warden presence, current health and
  `wardenPhase(health)` when present; absent Warden health/phase are null.
- Simulation: `successfulTimedSpawns`, current active enemy count and actual scheduled
  gameplay TimerEvent count (including freshly created events pending Clock insertion).

Do not hardcode a count of five instead of observing actual owned events. Exact field
names/TypeScript grouping may follow project style. No Phaser objects, Scene references,
mutable enemy/progression collections, TimerEvents or functions may escape.
Returned nested data is detached; mutating it cannot alter live gameplay.
Snapshot never advances simulation/RNG, changes targets/timers, creates UI or generates offers.

### forceLevelUp()

Only in valid active gameplay. Compute remaining XP as
`xpForNextLevel(playerExperience.level) - playerExperience.xp`, then award exactly that
amount through the production XP-credit/Level-Up path: one next threshold, new-level XP0
from the current valid remainder, normal HUD refresh, real three choices and full pause.
No fake pickup is required.

The shared `creditExperience` operation serves `updateXpPickups` and DevTools. Preserve the
XP-credit/level-entry operation needed by collection and this command, retaining pickup
removal before choice presentation, collection pause ordering and `addExperience`
overflow semantics. The API must not duplicate progression or offer algorithms.
Do not directly increment level, assign pause, synthesize choices, change ranks, force
Evolution or select a reward. Normal choice acceptance resumes normally.
Already paused/dead/victorious/stale requests return false without generating another offer.

### spawnWarden()

Only in valid active gameplay with a player, `bossSpawned === false`,
`bossDefeated === false`, no active Warden and room under cap10.
If `bossSpawned` is already true, return false and create nothing even if no active
Warden is found; preserve one-Warden-per-run semantics without count or flag mutation.
Use `createEnemy(x, y, 'boss')`, not a simplified debug enemy or forced `spawnEnemy`
counter mutation. Creation naturally sets `bossSpawned`; leave `bossDefeated` false.
Never increment/fake `successfulTimedSpawns`, pretend spawn30 occurred, remove ordinary
enemies, overflow the cap or request Victory. Invalid/cap/paused/terminal/stale requests
return false without effects.

Choose a deterministic valid location using the existing opposite-arena-corner fallback:
use margin `max(enemyMargin, 40)`; choose each far corner coordinate opposite the
player's arena half. Validate arena/body margin and distance >=600 before creation;
if infeasible, return false. Do not consume random draws or introduce seeded RNG.
Do not refactor unrelated timed-spawn placement.

The Warden retains production HP60, body radius40, contact2, XP10, targeting, HP-derived
movement/styles, radial attacks and common death handling. While it lives, the existing
active-Boss timed-spawn suppression remains authoritative without count advancement.
Real player attacks must kill it through the existing atomic attack boundary and produce
normal GAME-038 Victory. No fake boss flags or direct Victory.

### setWardenHealth(health)

Require valid active gameplay and an active production Warden. Accept only a finite
number in inclusive range 1..60; fractional finite values in range are valid.
Reject nonnumbers, NaN, both infinities, <=0, >60, absent Warden, pause/terminal/stale calls.
Do not clamp.

Directly set current Warden health only; no kill, XP, Victory, spawn/count/flag changes,
immediate attack, timer reset or extra event. Derive phase through existing `wardenPhase`:
HP>30 is Phase1; 0<HP<=30 is Phase2. Allow 31→30 and 30→31 for testing. Subsequent real
movement/style/hostile fire reads health; no debug phase flag or gameplay regeneration.

### setGodMode(enabled)

One scene/run-local DEV boolean, reset false on every native create/restart.
Only valid active calls with a boolean are accepted; all unavailable/stale calls return false.

Integrate rejection in the CURRENT `damagePlayer` boundary after terminal/valid-player
guards and before health/protection mutation. Both projectile/contact paths still reach
their normal damage boundary. Rejected God Mode hits do not heal, change max HP, reduce
health, start/extend protection or change player damage feedback.
Existing protection may count down naturally; toggling never resets it.
Do not stop contacts/hostile attacks, remove enemies, pause, make the player untargetable,
change Warden behavior or change outgoing damage.
`updateProjectiles` still consumes a colliding hostile projectile despite rejection.
Preserve current contact/position handling; do not add a separation mechanic.
Disabling leaves health/protection unchanged and restores normal future incoming damage.

### Five gameplay TimerEvents and implementation limits

Keep exactly five: spawn, Laser/Prism, Missile/Cluster, Drone/Twin and hostile fire.
Add ZERO gameplay TimerEvents: no polling, deferred-command event, separate update clock
or timeScale timer. Snapshot/commands do not reset event phases. Existing scheduled objects
remain through pause/terminal guards; native shutdown destroys old ownership and each
restart creates exactly five fresh events. Rejected commands change no timers.

Reuse actual production methods; only the smallest shared helper and, if justified, tiny
concrete DEV exposure/lifecycle module are allowed. No unrelated gameplay extraction.
Do not duplicate Warden, XP, choice or damage algorithms in DevTools; no generic command
registry, plugin/debug framework, global mutable singleton or new dependency.

### Out of scope

Debug UI/menu/overlay/panel, hotkeys, query-string/localStorage debug flags, timeScale,
pause stepping, direct level/XP/rank/passive setters, forced Prism/Cluster/Twin/Evolution,
forceVictory/forceDeath, arbitrary enemy spawn/deletion, arena clear, teleport, fixed seed,
RNG controls, encounter forcing, portals/Director, PlayerBuild, Shield, GAME-042 Run
architecture, reward-generator architecture, performance sandbox and save/profile/meta.
Fixed-seed/procedural tracing tools wait for their real later systems.
No GAME-042+ implementation or future runtime stubs.

### Required tracked tests

Preserve all existing assertions (baseline146 tests/16 files; report actual new totals).
Inspect/reuse `experience.test.ts`, `warden.test.ts`, `selectChoices.test.ts` and
`collision.test.ts`; they cover arithmetic/phase/sampling/geometry, not this API integration.

Add focused tracked tests against real production helpers/commands and their actual
state boundaries. Minimal adapters/fixtures may supply dependencies but must not reimplement
alternate progression, Warden, damage or terminal algorithms merely to test them.
Cover at least:

| Contract | Required cases |
| --- | --- |
| DEV / snapshot | Testable DEV exposure; required current values; plain detached nested data; returned mutations cannot affect gameplay; repeated snapshots change no state/RNG/UI/timers |
| forceLevelUp | Real next threshold from nonzero remainder, normal pause and three choices; exactly one level; duplicate paused call creates no second offer |
| spawnWarden | Real identity/HP60/radius40/contact2/XP10, normal bossSpawned, unchanged timed count, deterministic valid placement and distance; second Boss/cap/missing-player/paused/terminal/stale rejection; bossSpawned already true (including no active Warden) returns false with no new Boss or count/flag mutation; bossDefeated already true rejects |
| setWardenHealth | Valid endpoints and finite in-range values; reject 0/negative/>60/NaN/both infinities/nonnumbers/no Boss; 31 Phase1 and 30 Phase2 in both directions; no direct death/XP/Victory/flag/count/timer effects |
| God Mode | Hostile collision consumes projectile without health/protection damage; contact does not damage and normal contact/position behavior remains; no protection start/extension; disable restores future damage; restart resets false |
| Lifetime / availability | Old captured API inert after fresh create/native restart, new window API has fresh identity; stale snapshot null/mutations false; all mutations reject during Level-Up/Death/Victory; current snapshots still read-only |
| Timers | Exactly five scheduled gameplay events including fresh-create pending events; no DEV event; no command-induced resets; native restart has five fresh active events and no old effects |

Tracked tests do not substitute for the real browser/lifecycle checks below.

### Required native/browser validation

Use the real application and GameplayScene/Phaser Clock, not alternate gameplay algorithms:

1. Separate ordinary DEV boot: API exists and snapshot works.
2. Real production build/preview (or equivalent real production-mode boot): API absent/
   undefined; normal player gameplay still works without DEV exposure.
3. forceLevelUp opens the real stable three-choice UI, duplicate call rejects, and accepting
   a real choice resumes normally. Verify XP remainder/one-threshold result and pause freeze.
4. spawnWarden creates the real Boss at valid deterministic distance with unchanged timed
   count, normal flags/cap and active-Boss spawn suppression. Observe normal attacks;
   set HP30 and observe Phase2 movement/burst, then cross back to31 without resetting
   hostile cadence. A real player attack kills it and produces atomic normal Victory/XP10.
5. God Mode: collide a real hostile projectile and verify consumption without HP/protection
   mutation; overlap contact and verify no damage/changed contact positioning; disable and
   observe normal future damage. Existing protection must not be started/extended by rejection.
6. Perform at least TWO actual Victory NEW RUN → native `scene.restart()` cycles after
   dirty DEV use: spawn/change Warden, enable God Mode and exercise XP/choices where practical.
   After EACH: God Mode false, no Warden, boss flags false, successfulTimedSpawns0, level1/XP0,
   normal initial Chaser/current prototype baseline, fresh window API, captured old API inert,
   five fresh gameplay TimerEvents and no old callbacks/listeners/DEV effects.
7. Preserve an ordinary Death → actual RETRY → native restart regression with the same fresh
   baseline/API/timer checks. A manual create call, page reload or fixture reset is not
   native restart evidence. Preserve all existing terminal atomicity/frozen-world semantics.

Report new console errors/warnings separately from known favicon/build-size warnings.
Distinguish tracked tests, normal boots, real scene harness and actual native restart evidence.

### Validation and completion

GAME-039 DONE: npm run check passes (167 tests / 17 files, TypeScript and build).
Real Chrome ordinary DEV boot and production preview absence pass. Real GameplayScene
checks cover normal choices, Warden movement/bursts at HP30/31, God Mode/projectile/contact,
two actual Victory NEW RUN restarts and one ordinary Death RETRY. Each native restart
restores the baseline, fresh API and five fresh gameplay TimerEvents; captured old API is inert.
Known warnings: favicon404 in DEV browser and Vite bundle size >500 kB; no new runtime errors.

Factual CURRENT_STATE and material PROJECT_GRAPH ownership are updated. DESIGN-005 remains
DONE, GAME-040/041 SUPERSEDED and GAME-042+ BACKLOG. Explicit staging and complete ignored
.codex-review/GAME-039-review.txt follow AGENTS.md; user creates the final commit after review.

## Retired roadmap IDs

| ID | Historical title | Status | Superseded by |
| --- | --- | --- | --- |
| GAME-040 | Mobile Movement Prototype | SUPERSEDED | GAME-044 Authoritative Pause & Input Boundary + GAME-098 Mobile Controls Closure |
| GAME-041 | Production-Like HUD Pass | SUPERSEDED | GAME-096 Production HUD Structure |

Never reuse these IDs for unrelated tasks.

## Mechanical Vertical Slice roadmap

GAME-042/043/044 are DONE; GAME-045 is READY; GAME-046+ remain BACKLOG. Each row gives phase membership, exact dependencies and a
short capability; gates are review checkpoints, not automatic authorization.
Dependency ranges are inclusive.

### PHASE A — Runtime Foundation

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-042 | Run Lifecycle & Fresh Run Boundary | DESIGN-005, GAME-039 | Run lifecycle, terminal and fresh-restart authority; preserve GAME-038 first-terminal semantics. | DONE |
| GAME-043 | Seeded RNG Streams | GAME-042 | runSeed and independent Encounter/Reward/World/Boss RNG streams. | DONE |
| GAME-044 | Authoritative Pause & Input Boundary | GAME-042 | Single gameplay pause authority, movement/Active/Pause intents and focus-loss semantics. | DONE |
| GAME-045 | Telemetry & Diagnostics Foundation | GAME-042 | Run timeline, aggregates and diagnostics foundation. | READY |

#### GAME-042 — Run Lifecycle & Fresh Run Boundary

STATUS: DONE

**Dependencies:** DESIGN-005 DONE; GAME-039 DONE, including GAME-038 terminal behavior.
Implemented and verified against the lifecycle and integration contracts below.
Introduce one small run-scoped lifecycle/terminal/disposal authority. GameplayScene remains
the Phaser composition root and presentation orchestrator; do not rewrite other domains
around a Run object. This boundary precedes GAME-043 RNG, GAME-044 Pause/Input,
GAME-045 telemetry and GAME-046 PlayerBuild, without implementing them.

**Current source anchors (reinspect before implementation):**

| File / anchor | Current behavior and migration constraint |
| --- | --- |
| `src/game/scenes/GameplayScene.ts#create` | Creates fresh RunLifecycle with derived terminal getters, resets Level-Up state, God Mode, Boss/progression and collections; creates initial Chaser and five gameplay events |
| `isSimulationPaused` | Combines Scene Level-Up pause with non-RUNNING lifecycle |
| `damagePlayer` → `enterPlayerDeath` | Common incoming damage/protection/God Mode path; lethal HP requests death, then SHIP DESTROYED / RETRY |
| `enterRunVictory` | Requires `bossDefeated`, rejects existing terminal flags; creates current-level result and guarded NEW RUN |
| `updateProjectiles` | Reverse processing order; lethal hostile shot cleanup and straight player hit/death/projectile cleanup precede subsequent work; Victory requested after the completed lethal Boss hit |
| `updateMissiles` → `explodeMissile` / `explodeClusterSatellites` | Primary affected snapshot, optional survivor satellite union, Missile removal, then Victory request |
| `killEnemy` | Exactly-once removal, Boss-defeated flag and normal XP10 pickup; no terminal transition inside it |
| `enterPlayerDeath` / `enterRunVictory` pointer callbacks | RETRY / NEW RUN call native `scene.restart()`; retain concrete UI and once/identity guards |
| `gameplayTimers`, `laserTimer`, `droneTimer`, `create` | Five existing Phaser TimerEvents; native Phaser shutdown owns timer/object destruction |
| `publishDevTools` | Per-create validity closure, shutdown/destroy invalidation, fresh API; terminal snapshot booleans and mutation guards must remain correct |
| `src/game/devTools.ts` | Exact public five-command API and snapshot type, no lifecycle command/reference |
| `src/game/scenes/GameplayScene.devTools.test.ts` | Real Scene method contracts with renderer/lifecycle fixtures, including real authority setup in availability tests, same-Scene stale API, create reset and publication cleanup |

The focused src/game/run/RunLifecycle.ts authority and its unit tests now exist; terminal integration tests extend the real Scene/DevTools suite.
Existing pure collision/Cluster geometry and Warden tests complement Scene coverage;
prior ignored browser harness evidence does not replace tracked acceptance tests.

**Minimal authority and legal transitions**

One entirely fresh authority is constructed at the beginning of every `GameplayScene.create()`.
It starts PREPARING while existing run-scoped state is constructed and transitions once
to RUNNING after the run is initialized for normal gameplay. Do not change startup order,
initial player/Chaser/weapons/progression, spawn/Warden schedule or gameplay timing;
no loading screen, asynchronous preparation or new preparation infrastructure.

Only active lifecycle states required here are PREPARING, RUNNING, TERMINAL, DISPOSED:

- PREPARING → RUNNING through one successful start.
- RUNNING → TERMINAL through one accepted DEATH or VICTORY.
- RUNNING → DISPOSED on native shutdown/restart without a terminal outcome.
- TERMINAL → DISPOSED on shutdown/restart; disposal is safe from PREPARING as cleanup too.
- DISPOSED has no outgoing transition.

The full approved target vocabulary includes PAUSED and POST_RUN. PAUSED is deferred to
GAME-044; POST_RUN to GAME-093. Neither transition is implemented or claimed here.
A minimal type may omit them; if included, label them unused and keep them unreachable.

The authority owns lifecycle state, terminal outcome (`null | DEATH | VICTORY`),
terminal eligibility and disposal/invalidation. It exposes read-only state/outcome and
only concrete synchronous operations equivalent to `start()`, `tryEnterTerminal(outcome)`
and `dispose()`. Exact representation/names may follow repository style.
Define predictable results: start accepts only PREPARING; terminal accepts only RUNNING;
successful transitions return true, duplicate/illegal requests return false without mutation.
Disposal is idempotent and cannot revive an authority. An accepted terminal outcome is
immutable, including after disposal; disposal before terminal leaves outcome null.
No public setters or independent Scene terminal booleans duplicate authority.

A focused class or closure module is allowed. No RunManager/GameStateManager, generic FSM,
new dependency, event bus, DI/container/service locator or lifecycle registry.
Scene may keep `isPlayerDead` / `isRunVictorious` as derived compatibility getters/helpers:
they read the accepted outcome and are never separately assigned/reset as mutable truth.

**Death, Victory and simulation integration**

Preserve GAME-038 production processing order and first-terminal-wins. No hypothetical
timestamps, reordering update loops, outcome priority, deferred resolution or generic
combat transaction. The first legal terminal request wins; conflicting/duplicate requests
produce no outcome change, additional UI or scheduled work. Never both terminal booleans true.

- Lethal current `damagePlayer` path requests DEATH through the authority. Only acceptance
  permits the existing death presentation/RETRY. Retain current HP/protection/God Mode rules.
- `enterRunVictory` preserves the actual `bossDefeated` prerequisite. Only accepted
  VICTORY permits current Victory/result/NEW RUN presentation.
- Straight player attack: finish its own hit, damage, common death/removal and projectile
  cleanup, then request Victory at the existing boundary. Do not advance unrelated later
  attacks/contacts/XP after terminal acceptance.
- Missile/Cluster: finish primary affected snapshot, the full optional survivor/satellite
  union and Missile cleanup before requesting Victory. A Boss primary kill must not skip
  satellites; a satellite kill must not skip the remaining affected set.
- `killEnemy` still records removal/XP/Boss defeat; it must not enter terminal itself.
  Do not auto-collect frozen Boss XP or change current result-level semantics.
- Death-first prevents later Victory and attacks; completed Victory-first prevents later
  incoming Death. Keep native frozen world and distinct terminal UI exactly as before.

Current `isLevelUpPaused` stays in Scene/progression. The authority stays RUNNING during
an ordinary Level-Up pause; real choices freeze/resume gameplay independently.
Minimally adapt `isSimulationPaused()` to existing Level-Up pause plus the authority's
non-simulatable state (PREPARING, TERMINAL, DISPOSED). Keep normal guards on movement,
attacks, damage, XP and timer callbacks. No manual pause, PauseReason, focus-loss behavior,
input adapters, Active input, pause menu or GAME-044 migration.
Current Death/Victory overlays remain TERMINAL presentation, never premature POST_RUN.

**Fresh run, native restart and stale authority**

Native Phaser `scene.restart()` remains the physical reset path for RETRY and NEW RUN.
Do not introduce manual create calls, giant reset services, new Scenes or a scene router.
On shutdown/destroy, dispose that exact run authority once; repeated signals are safe.
Cleanup must be bound to the old authority, not redirect through a mutable global currentRun.
Old references cannot start, accept terminal changes, mutate or terminate the fresh run.
Prevent retained old callbacks/listeners/presentation controls from regaining authority
when the Scene instance is reused; preserve existing presentation identity/once guards
and bind any newly introduced authority-sensitive work to its owning run.

Every fresh create owns a different authority identity, PREPARING→RUNNING, outcome null.
Phaser still destroys old world/UI/timers and constructs the existing full baseline;
do not manually transplant old state or replace engine cleanup.

GAME-039's exact five-command DEV API remains unchanged. No sixth lifecycle command,
new public global run reference or registry. Its existing death/Victory snapshot fields
derive from the new authority, and snapshots remain detached/read-only in terminal state.
Old captured API snapshot remains null and mutations false after shutdown.
Fresh API identity/God Mode false and terminal/pause mutation rejections remain intact.
Do not move DevTools implementation or other gameplay ownership into the lifecycle module.

**Timer/clock and scope boundaries**

Preserve exactly five gameplay Phaser TimerEvents: spawn, Laser/Prism, Missile/Cluster,
Drone/Twin and hostile fire. Add ZERO lifecycle/terminal/disposal/polling events, delayed
terminal callbacks, independent simulation clock or timeScale.
Current Phaser Clock is the execution substrate; do not implement target gameplay clock.
Existing guarded scheduled events remain unchanged on terminal entry; every restart
creates five fresh events and old timer callbacks remain destroyed/inert.

No universal RunContext/service bag, arbitrary dependency map, runSeed/RNG streams,
stage/difficulty, Build/tags/stats, Director/rewards/world scheduling or telemetry framework.
A tiny concrete reference to this lifecycle authority is sufficient.
Keep enemies, combat loops, weapons, XP/progression, Warden, HUD and presentation in their
current domains. No Shield/Hull or EnemyDefinition/Attack/Hit/Damage/EnemyDeathRecord
migration, XP rewrite, reward transactions, portals/events/Cores/Doctrine/Mini-Boss rewrite,
Juggernaut/BossController, RunResult, POST_RUN, save/meta/profile, mobile controls or new
dependencies. Preserve prototype gameplay until its separately authorized cutover.

**Required tracked tests**

Preserve all existing assertions (pre-migration baseline167 tests/17 files). Tests that
previously assigned terminal flags now create terminal state through the real authority;
do not remove availability checks or replace them with fake parallel terminal algorithms.

| Boundary | Required contracts |
| --- | --- |
| Lifecycle unit | Fresh PREPARING; one start→RUNNING; duplicate/illegal start false; first DEATH or VICTORY accepted; each conflicting order preserves the first; duplicate same outcome false; immutable outcome; dispose→DISPOSED, idempotent; disposed start/terminal false; independent fresh authority |
| Scene Death/Victory | Real lethal damage and real Boss player attack yield one accepted outcome and one corresponding presentation; duplicates/conflicts create no extra UI; derived flags correct and never both true |
| Simulation / Level-Up | Terminal/non-simulatable authority freezes existing paths; Level-Up remains independent, RUNNING, nonterminal, and normal choice resumes |
| Atomicity / races | Straight cleanup before Victory; full Missile and Cluster primary/satellite/cleanup before Victory; no unrelated later work; deterministic production-order Death-first and Victory-first races |
| DevTools / lifetime | Existing five-command API/snapshot booleans correct; mutations reject terminal; old authority disposed and incapable of affecting new run; fresh authority/API identity; stale API null/false; God Mode reset; five fresh event ownership |

Use real Scene operations with minimal renderer/lifecycle fixtures where appropriate,
not alternate damage/terminal/restart implementations. Add no meaningless rendering tests.
Tracked tests supplement, not replace, the real engine checks below.

**Required native/browser validation**

Use actual GameplayScene/Phaser Clock/lifecycle:

1. Normal DEV boot: fresh authority reaches RUNNING with null outcome; initial gameplay/
   state intact and five TimerEvents. Verify PREPARING before start in focused tests.
2. Actual lethal production damage: DEATH accepted once, SHIP DESTROYED/RETRY, no Victory.
3. Real Warden killed by production player attack: completed owning attack cleanup before
   accepted VICTORY, ordinary current result/NEW RUN, no Death.
4. Real deterministic Death-first and Victory-first production-order cases preserve the
   immutable first outcome. Exercise straight, Missile and full Cluster atomic boundaries.
5. Real Level-Up choice pause freezes/resumes normally, remains RUNNING/nonterminal and
   adds no GAME-044 behavior.
6. At least TWO actual Victory→NEW RUN native restarts and ONE actual Death→RETRY native
   restart. Capture old authority and API in the ignored test/harness, never a production
   global API. After EACH: old authority DISPOSED and start/terminal attempts ineffective;
   new authority identity with PREPARING→RUNNING complete and null outcome; full player/
   progression/Boss baseline; God Mode false; fresh API, captured old API null/false;
   five fresh events, old timers/callbacks/listeners unable to affect the new run.
7. Validate native shutdown/restart without terminal where available: RUNNING→DISPOSED
   without fabricated Death/Victory; fresh create is independent.
8. Real production-mode boot works and GAME-039 public DevTools remains absent/undefined.

Manual create, fixture recreation or page refresh does not count as native restart evidence.
Inspect console; report new errors separately from known resource404/build-size warnings.
Report tracked tests, normal boots, real engine harness and native restart cycles distinctly.

**Validation and completion**

GAME-042 DONE: npm run check passes (185 tests / 18 files, typecheck and production build).
Real Chrome/Phaser checks pass: normal DEV boot, Level-Up freeze/resume with lifecycle
RUNNING, real Death-first and Victory-first races, straight/Missile and Cluster primary/
satellite-kill atomicity. Two required Victory NEW RUN cycles, ordinary Death RETRY and
nonterminal native restart dispose the captured old authority and create new RUNNING/null
authority, fresh API and five fresh TimerEvents. Additional Missile/Cluster scenarios also
complete native NEW RUN. Retained old authority/callbacks/listeners/controls/API are inert.
Production preview boots with DEV API absent. Known favicon404 and Vite bundle-size warning;
no new pageerrors observed.

CURRENT_STATE and real PROJECT_GRAPH ownership are updated. DESIGN-005/GAME-039 stay DONE,
GAME-040/041 SUPERSEDED; GAME-043 DONE; GAME-044 DONE; GAME-045 READY; GAME-046+ BACKLOG. GATE A remains incomplete. Explicit staging
and ignored .codex-review/GAME-042-review.txt follow AGENTS.md; no commit is created.

#### GAME-043 — Seeded RNG Streams

STATUS: DONE

**Dependencies:** GAME-042 DONE. Implemented and validated as a separate scoped task.
Introduce deterministic run-scoped procedural randomness without a replay system or future
Director/Reward/World/Boss architecture. RunLifecycle stays lifecycle/terminal/disposal only.
GameplayScene composes a separate focused RunRandom (or equivalent) with immutable uint32
runSeed and exactly four explicit independent streams: Encounter, Reward, World, Boss.
That owner holds their mutable PRNG states and invalidation; no global singleton, exposed
string-keyed registry, arbitrary stream creation/forking or universal RunContext/service bag.

**Pre-implementation tracked-source randomness inventory (definition audit)**

Audited all tracked src files at this definition's HEAD, including test files, for
Math.random, Phaser.Math.Between/FloatBetween/RND, random/rng/shuffle/pick and helper
default sources. The complete current findings and relevant non-consumers are:

| Source / actual operation | Classification and migration |
| --- | --- |
| `src/game/scenes/GameplayScene.ts#spawnEnemy`: `Phaser.Math.Between(0, 3)` | Encounter: random side; replace with fixed side mapping from one stream draw |
| Same method: `Phaser.Math.FloatBetween(view.left, view.right)` in x branch and `FloatBetween(view.top, view.bottom)` in y branch | Encounter: exactly one coordinate branch executes per accepted placement, after side draw; preserve ranges |
| `src/game/progression/selectChoices.ts#selectChoices`: optional/default `random = Math.random`, one `random()` per selected entry | Reward for gameplay calls; remove ambient fallback and require explicit supplied source for sampling |
| `GameplayScene.enterLevelUpPause`: first-slot fallback `selectChoices(ordinaryPool, 1)` | Reward draw only when no deterministic focused choice exists |
| Same method: passive second-slot `selectChoices(filteredPassivePool, 1)` | Reward draw for the current distinct passive selection |
| Same method: ordinary third-slot `selectChoices(remainingPool, 1)` | Reward draw only when no eligible evolution was offered |
| `src/game/progression/selectChoices.test.ts` | Test-injected controlled sources / invalid values, plus omitted-source zero-count/invalid-count cases; not production consumers. Adapt signatures without weakening assertions |
| `src/game/scenes/GameplayScene.devTools.test.ts` | Math.random spy throws if deterministic DEV Warden placement draws; test guard, not a random consumer |
| `focusedUpgrade.ts#selectFocusedUpgrade`, `evolutionOffer.ts#selectEvolutionOffer` | Stable explicit weapon/track/evolution cursor decisions, no RNG; leave deterministic |
| `enemies/warden.ts`, scheduled CCCSCT/Elite/Warden predicates, `publishDevTools.spawnWarden` | Deterministic HP phases/radial directions/schedules/opposite-corner placement; no Boss or Encounter draws for these nonrandom decisions |
| `GameplayScene.create` stars | Fixed arithmetic positions/radii; presentation is already deterministic, not an additional random consumer |

No additional tracked production random helpers, Phaser.Math.RND, shuffle/pick,
presentation-only random calls or legitimate current World/Boss consumers were found.
All gameplay sampling found is covered by Encounter/Reward above. If later implementation
audit finds an unexpected unsafe-to-classify consumer, report a blocking architecture
issue instead of adding a fifth stream or silently implementing a later domain.

**Root seed and initialization order**

runSeed is an integer 0..4294967295 inclusive; zero is valid. Reject invalid explicit seeds
(nonnumber, nonfinite, fractional, negative or >uint32 max) rather than silently clamping.
Normal root entropy uses browser crypto.getRandomValues(new Uint32Array(1)) or the smallest
existing equivalent, never Math.random or a new dependency. Entropy is root creation,
not an Encounter/Reward/World/Boss draw.

Generate the new run's root seed only AFTER the existing RunLifecycle.start() successfully
enters RUNNING. Do not consume entropy/procedural RNG during PREPARING to initialize play.
A holder may exist earlier only if it cannot expose usable seed/streams before RUNNING.
Compose/wire snapshots and consumers only once the RNG owner is initialized; keep normal
synchronous startup and GAME-042 lifecycle semantics. No loading/async initialization system.

Every native create receives a fresh owner and normally fresh entropy. Require owner
identity inequality; do not require seed inequality because entropy collisions are possible.
Tests/ignored harnesses may construct an owner from an explicit fixed seed and inject it
before the first tested decision. This is internal testability, not a production control.
No seed query parameter, localStorage/settings field, picker/daily seed, reseed/setSeed
command, sixth DEV command or public global RNG control.

**Algorithm, derivation and four streams**

Use a tiny repository-owned fixed 32-bit PRNG, preferably Mulberry32 (an equivalently
small explicitly fixed integer algorithm is allowed). Document the exact chosen arithmetic
and commit golden-sequence tests, including zero and a second fixed seed.
Outputs must always be finite and in [0, 1), using deterministic JS 32-bit integer operations.
No Math.random implementation, unspecified Phaser global RNG state or RNG dependency.

Derive the four initial states from root seed with four distinct fixed explicit committed
salts/constants and a deterministic derivation/mix. Do not give all four identical raw state.
The chosen algorithm and derivation constants are reproducibility contracts for the current
code/content version, protected by golden tests; do not create a contentVersion system here.
Expose exactly four concrete stream operations/read-only stream handles, with independent
mutable cursors: consuming one never advances another. No arbitrary names or shared
hidden cursor behind facades. RunRandom chooses numbers; existing domains interpret them.

**Encounter placement and consumption**

Keep spawnEnemy scheduling/behavior in GameplayScene. Preserve the existing early guards:
non-RUNNING lifecycle, current Level-Up pause, missing player, cap10 and active Warden
consume ZERO Encounter draws and do not advance successfulTimedSpawns.
Only after those guards pass does a meaningful timed placement consume exactly two draws:
side = floor(next * 4), then one varying coordinate using lower + next * (upper - lower).
Fixed mapping: side0 left, side1 right, side2 top, side3 bottom; preserve 48px beyond-edge
origin, current camera worldView ranges, arena clamp, margin25 (Warden40), minimum600
distance and deterministic opposite-corner fallback. Fallback consumes no extra draw.
Do not change CCCSCT, scheduled Elite12/24, Warden30, cap or successful-spawn counting.

No RNG per frame, AI/movement/targeting/collision/HUD/timer polling or terminal transition.
GAME-039 spawnWarden remains deterministic and consumes zero Encounter draws; it does not
become timed spawning or change flags/cap/placement semantics.
World and Boss streams exist now but remain dormant during current prototype play:
do not randomize Warden phases/bursts/schedule, DEV placement or nonexistent world content.

**Reward sampling and consumption**

Keep selectChoices pure; make sampling require an explicit random source and pass the run's
Reward stream at ALL three current production call sites. No silent Math.random fallback.
Preserve existing finite/[0,1) validation, size/distinctness/input-nonmutation and
sampling-without-replacement behavior. No reward service/weights/Analyzer/pity/rerolls.

Preserve explicit levelUpPool order, eligibility filtering, authored focus/track cursors,
evolution guarantee/cursor, canonical entry identity and three distinct choice structure.
The helper's current Set deduplication preserves the supplied stable array order; do not
introduce candidate ordering from incidental object enumeration or nondeterministic input.
General order remains eligibility/feasibility → stable candidates → weights if already
applicable → roll; this task adds no weighted system.

Generate once on entering a new presentation: each sampled slot uses one Reward draw;
deterministic focused Slot1 uses none, deterministic evolution Slot3 uses none.
Normal focused/no-evolution offer therefore uses two draws; first-slot fallback adds one,
and an evolution replacing ordinary Slot3 removes one. Do not add draws to deterministic
cursor logic. Preserve current helper draw count for actual sampling, including single
remaining candidates; a zero-count request needs none.

An existing presentation stays stable. Rejected duplicate enterLevelUpPause/forceLevelUp,
stale/double choice callback, snapshot, pause/read/render/inspection and ordinary choice
acceptance consume zero further randomness. Current acceptLevelUpChoice mutates build/
timers and resumes, but does not generate another offer or make a separate random decision.

**Read models, lifecycle and five timers**

Approve a detached numeric runSeed field in existing DevSnapshot for DEV bug reports.
Exactly the existing five commands remain; no mutable PRNG state/stream objects, draw
operations, reseeding or control leaks through snapshot. Repeated snapshot/HUD/terminal UI
reads never advance any stream. Future read models/previews/telemetry must obey that rule.

RunRandom follows GAME-042 lifetime without absorbing RunLifecycle responsibilities.
Exact old shutdown/disposal invalidates the captured RNG owner and all retained stream
handles; disposal is idempotent and cannot mutate/reseed the new owner.
Direct draw from a disposed owner/stream throws a clear programmer/invariant Error.
Normal stale callbacks never reach it: existing owning-run guards reject them before
procedural work. Old references never redirect through a global currentRng pointer.
Fresh authority/RNG owner/API identity and God Mode reset remain current native semantics.

Preserve first-terminal-wins, straight/Missile/Cluster atomic boundaries and Scene-owned
Level-Up pause; add no RNG to terminal outcome decisions. No GAME-044 migration.
Keep exactly five gameplay TimerEvents (spawn, Laser/Prism, Missile/Cluster, Drone/Twin,
hostile fire), with five fresh events after native restart and old callbacks inert.
Add ZERO polling/entropy-refresh/reseed/procedural-tick timers, independent clocks or timeScale.
Draw synchronously only at the concrete decision boundaries above.

**Required tracked tests for later implementation**

Preserve all current185 tests/18 files and GAME-039/GAME-042 assertions. Adapt existing
Scene fixtures to a known RNG owner and sampling calls to explicit sources without
creating parallel spawn/reward algorithms merely for tests.

| Boundary | Required evidence |
| --- | --- |
| Seed / algorithm | Zero and uint32 max accepted; invalid explicit seeds rejected; exact golden sequences for zero and another fixed seed; outputs finite and >=0,<1; algorithm changes detected |
| Derivation | Same seed reproduces exact sequences for each of four streams; committed salt/mix golden coverage; four sequences not accidentally identical; separate owners equivalent |
| Independence | Many Reward draws leave Encounter unchanged and vice versa; World/Boss independence in both directions; arbitrary one-stream consumption cannot advance any other |
| Disposal | Idempotent; stale owner AND captured stream draw throw the documented invariant Error; fresh independent owner unaffected |
| Spawn integration | Fixed seed yields exact side/coordinate/placement sequence through real spawnEnemy; equivalent state/history repeat; Reward consumption does not change placement; cap/pause/non-RUNNING/missing-player/active-Warden paths consume zero; clamp/minimum/fallback/count/archetype/Elite/Warden schedule unchanged |
| Reward integration | Exact fixed-seed ordinary offers through real Level-Up path; identical state repeats; next independent presentation continues expected Reward sequence; Encounter consumption leaves offers unchanged; stable UI/snapshot/pause/rejected callbacks/duplicate forceLevelUp and acceptance consume zero |
| DEV / dormant streams | Detached stable runSeed, same exact five commands, read-only snapshots consume zero; no artificial World/Boss draws during current Warden/prototype behavior |
| Source regression | Complete tracked-source audit finds no production ambient Math.random/Phaser global random dependency or selectChoices caller missing explicit source |
| Lifecycle order | Entropy/root owner activates only after successful RUNNING; no PREPARING procedural draws; fresh owner identity, no seed-inequality assertion; current lifecycle/terminal/timer tests preserved |

**Required real browser/native validation for later implementation**

1. Normal DEV boot: lifecycle RUNNING, valid uint32 root seed, four fresh streams,
   five timers, exact five-command API and stable detached snapshot.runSeed.
2. Real timed spawn still occurs with current valid camera-edge/clamp/minimum/fallback
   semantics and schedules, using Encounter. Real Level-Up uses Reward, three stable
   choices, real choice resume and zero additional draws from repeated snapshots/UI reads.
3. Two independent Scene/run setups with the same injected fixed seed, equivalent relevant
   state/history, before the first tested procedural decision: identical spawn sequences
   and ordinary offer sequences. Extra Reward consumption in one setup leaves subsequent
   Encounter result identical; extra Encounter consumption leaves subsequent Reward offer
   identical. Inject only through tracked/ignored harness access, never public seed controls.
4. At least TWO actual Victory→NEW RUN native restarts and ONE actual Death→RETRY native
   restart. After EACH: old RunLifecycle DISPOSED and captured RNG owner/streams reject
   draws; fresh owner identity and valid root seed (equality permitted); RUNNING/null,
   full current player/Boss/progression baseline, God Mode false, fresh API/old API null
   or false, five fresh events and no old callbacks consuming/mutating fresh RNG/gameplay.
5. Real production boot/canvas works, public DEV API absent, no player seed/debug controls.
   Inspect console; distinguish new errors from known favicon/resource404/build-size warning.

Native scene.restart is required evidence; manual create/fixture reset/page refresh does
not substitute. Report tracked, fixed-seed harness, normal boot and native-cycle results
separately. Do not claim these future runtime checks in this definition-only handoff.

**Scope, later structure and reproducibility limits**

A focused src/game/run/RunRandom.ts plus pure tests is authorized for later implementation;
exact filenames may follow conventions. Scene creates/wires it after successful run.start
and passes explicit Encounter/Reward draw sources. Do not move spawning, choices, combat,
Boss behavior or future world/reward architecture into the RNG owner.

Same explicit seed + same code/content version + relevant state/decision history reproduces
procedural decisions. Seed alone does not guarantee identical runs under different inputs,
decision order, FPS, physics or browser scheduling. No pixel-perfect/lockstep/input replay.
Future RunReport may record seed/version; do not build it or a version system now.

Out of scope: GAME-044 Pause/Input, GAME-045 telemetry, GAME-046 Build, Encounter Director/
templates/pressure/portals/weights, full Reward Generator/Analyzer/pity/recent offers,
World Scheduler/events, BossController/Juggernaut, RunResult/RunReport, replay recording,
daily seeds, seed entry/query/settings/reseed DEV command, save/meta/profile, arbitrary
named/forkable RNG framework, service locator or new dependency. GATE A stays incomplete.

**Implementation completion evidence**

RunRandom.ts owns immutable uint32 seed and four independent concrete streams. Fixed
Mulberry32 uses increment 0x6d2b79f5; root XOR salts 0x9e3779b9/0x243f6a88/0xb7e15162/0xdeadbeef
for Encounter/Reward/World/Boss is avalanched with shifts 16/13/16 and Math.imul
constants 0x85ebca6b/0xc2b2ae35. Literal all-stream goldens cover seeds 0 and 123456789.
Crypto entropy is created only after successful RUNNING; captured exact-owner disposal
invalidates retained handles. spawnEnemy uses two Encounter draws after guards and
all three Level-Up sampling sites require Reward; World/Boss stay dormant.
DevSnapshot adds detached runSeed with five unchanged commands and no player seed control.

npm run check passes 223 tests/19 files, preserving all 185 previous tests. Source audit
finds no production ambient Math.random or Phaser global random dependency. Real Chrome/
Phaser checks pass normal DEV boot, actual Clock spawn, stable Level-Up/resume, equivalent
fixed-seed spawn/offer sequences and cross-stream isolation. Two actual Victory NEW RUN
cycles and one Death RETRY (plus nonterminal/Missile/Cluster native restarts) dispose old
streams and retain fresh RNG/lifecycle/API/five events with inert stale callbacks.
Production canvas boots with DEV API absent; only known favicon404 and build chunk-size
warnings remain. GAME-044 DONE; GAME-045 READY; GAME-046+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A incomplete.

**Definition validation and documentation (historical definition-only instructions)**

Now change only TASK_GRAPH, GAME-043 BACKLOG→READY plus accurate roadmap introduction.
Run npm run check and git diff --check, verify scope/statuses, explicitly stage only
docs/TASK_GRAPH.md, inspect complete git diff --cached and run cached check/stat.
Generate ignored .codex-review/GAME-043-review.txt with AGENTS.md sections, source inventory
and complete staged diff. Never stage review artifacts or commit.

After successful later implementation and tracked/native checks, GAME-043 may become DONE;
CURRENT_STATE describes actual seed/streams/consumers/determinism and PROJECT_GRAPH maps
real files/exports/consumers. ARCHITECTURE normally stays unchanged except a factual stale
implementation-status correction if necessary. Keep DESIGN-005/GAME-039/GAME-042 DONE,
GAME-040/041 SUPERSEDED; GAME-044 DONE; GAME-045 READY; GAME-046+ BACKLOG. GATE A remains incomplete pending GAME-045.

#### GAME-044 — Authoritative Pause & Input Boundary

STATUS: DONE

**Dependencies:** GAME-042 DONE. Preserve the implemented GAME-043 RNG contract (DONE).
Implemented and validated in a separate scoped task. Extend the focused
RunLifecycle with authoritative PAUSED state/reasons and compose one concrete desktop
input adapter in GameplayScene. Scene remains the Phaser composition/presentation root;
do not create RunManager, a second PauseManager or a RunContext service bag.

**Pre-implementation source-grounded pause/input ownership inventory**

Audited tracked src at HEAD 214b668a39ba3a9e4418132bc633e7b7d2f40716 after GAME-043,
including tests, for cursors/wasd/keyboard/Keyboard.Key/JustDown/Space/ESC/Escape,
input.keyboard, pointer/touch, blur/focus/visibility, isLevelUpPaused/isSimulationPaused
and direct owning-run state guards. Reinspect these actual anchors before implementation.

| Current source / anchor | Current ownership and required migration |
| --- | --- |
| `src/game/run/RunLifecycle.ts`, `.test.ts` | PREPARING/RUNNING/TERMINAL/DISPOSED only; start once, terminal accepted only from RUNNING, immutable first outcome and exact-owner idempotent disposal. Add PAUSED/reasons here, preserving existing guarantees |
| `GameplayScene.create`, `cursors`, `wasd`, `dashKey` | Scene owns arrow/WASD/Space Phaser Keys; no Escape binding or gameplay-input adapter. Replace raw bindings/reads with the concrete adapter; retain fresh baseline |
| `GameplayScene.update` | JustDown(Space) + isDown + originalEvent.repeat check is consumed before pause guard; WASD/arrows isDown feed normalized movement and scene-owned Dash. Consume sampled intents instead; preserve normalization/clamping and stepDash |
| `isSimulationPaused` | Currently combines independent Scene isLevelUpPaused with run.state !== RUNNING. Make lifecycle state the sole simulation authority |
| `creditExperience`, `updateXpPickups`, `enterLevelUpPause` | Credit/remove triggering pickup before one current offer; Scene flag freezes while lifecycle stays RUNNING. Acquire REWARD, reset input, then generate existing Reward-backed choices |
| `acceptLevelUpChoice`, `levelUpPresentation` | Current RUNNING + flag + text-identity guard, direct JustDown discard, upgrade/cursor/timer effects, text destruction and flag clear. Accept the current REWARD transaction while PAUSED; replace raw input discard with adapter reset and release only REWARD |
| `gameplayTimers`, `laserTimer`, `droneTimer` | Five addEvent callbacks capture run and check RUNNING; Fire Rate/Firing System reset existing events with captured-run callbacks. Helpers additionally guard simulation; Clock currently advances during Level-Up/terminal despite no callback effects |
| `update`, spawn/fire helpers, `updateDrone`, `updateProjectiles`, `updateMissiles`, `updateXpPickups`, damage/contact helpers | Scene owns simulation and non-RUNNING/Level-Up guards; retain all freezes with one lifecycle-derived predicate, including mid-loop stops |
| `enterPlayerDeath`, `enterRunVictory`, `updateProjectiles`, `updateMissiles` | Terminal authority plus concrete UI; straight hit/cleanup and full Missile/Cluster work precede Victory. Keep atomicity/order; reset input and remove pause UI on accepted terminal |
| `choice.once('pointerdown')`, RETRY and NEW RUN handlers | Pointer input exists only for current choice/result UI. Keep native UI interaction; no pointer/touch gameplay movement/aiming or mobile adapter exists |
| `publishDevTools`, `src/game/devTools.ts` | Five commands; mutation availability uses isSimulationPaused; detached snapshot includes runSeed and transaction flag. Keep five commands; add detached lifecycle diagnostics only |
| `RunRandom.ts`, `spawnEnemy`, `enterLevelUpPause`/`selectChoices` | Separate exact-create RNG; two Encounter draws per accepted placement, explicit Reward samples at three sites; World/Boss dormant. No new pause/input draws |
| `create` disposeRun/disposeRandom, DEV invalidate, guarded RETRY/NEW RUN | Exact owner captured for shutdown/destroy; native restart reuses Scene. Bind adapter/focus cleanup to its original authority and listener identities too |
| Remaining tracked src / tests | No current Escape/manual pause, gameplay focus/visibility listeners, touch controls, input intent framework or extra scheduler. focusedUpgrade focusCursors/cursors are reward arbitration, not physical input; spatial and space-label matches are unrelated. Existing tests cover lifecycle, Scene guards, Dash and RNG, including Level-Up staying RUNNING; adapt that specific expectation to PAUSED while preserving behavioral assertions |

Installed Phaser 4.2.1 sources were inspected, not inferred from a future architecture:
`node_modules/phaser/src/core/VisibilityHandler.js` forwards window blur/focus and
document visibilitychange as Game BLUR/FOCUS/HIDDEN/VISIBLE. KeyboardPlugin registers
BLUR -> resetKeys and Scene pause/sleep reset, but these resets do not enforce held-input
suppression or gameplay pause. Key.reset clears isDown/edge flags; onDown can treat a later
OS repeat as newly down after reset. Adapter-owned release/repress gating is therefore
required. `src/game/config.ts` has no custom focus/pause integration.

**One lifecycle authority and concrete pause reasons**

Extend RunState to PREPARING -> RUNNING <-> PAUSED -> TERMINAL -> DISPOSED.
POST_RUN remains deferred to GAME-093; dispose is also legal from PREPARING/RUNNING/PAUSED.
Exactly the concrete PauseReason union REWARD | MANUAL | FOCUS_LOSS is authorized.
No arbitrary string, BUILD/CUTSCENE/EVENT/SHOP/DEBUG reason or publicly mutable Set.
Equivalent requestPause(reason), releasePause(reason), hasPauseReason(reason) operations
and a detached ordered diagnostic view are sufficient; keep RunLifecycle Phaser-free.

| Operation / state | Required result |
| --- | --- |
| Fresh / start | PREPARING, null outcome, zero reasons; successful start once enters RUNNING |
| requestPause from RUNNING or PAUSED | Add that reason once; first reason enters PAUSED; duplicate does not create another owner or reset input/timer phase repeatedly |
| releasePause from PAUSED | Remove only the specified reason; remain PAUSED while any reason remains, enter RUNNING only after the last is removed |
| Absent release / illegal-state pause or release | Return false, no change; absent reason cannot resume another owner. Pause/release rejected from PREPARING/TERMINAL/DISPOSED |
| Mutation return values | True only for a new accepted reason addition/removal; duplicate request returns false. hasPauseReason is read-only |
| tryEnterTerminal from RUNNING or PAUSED | First DEATH/VICTORY wins; clear all reasons and enter TERMINAL, preserving immutable outcome through disposal |
| TERMINAL / DISPOSED | Cannot start/pause/release/accept another terminal or revive. dispose is idempotent, clears reasons and retains prior outcome |

RunLifecycle owns reasons/state, not Phaser Clock, DOM focus, keyboard, UI or RNG.
Scene projects accepted authority changes synchronously into clock/input/UI effects;
do not add a generic event bus or a second mutable pause authority. isSimulationPaused
derives only from run absent or state !== RUNNING. The Level-Up flag may remain solely
transaction/presentation identity state, never an independent simulation-freeze source.

**Level-Up as the REWARD consumer**

On a valid current RUNNING XP/DEV Level-Up, preserve XP credit and triggering-pickup removal
before UI. Acquire REWARD once, clear gameplay input, set the transaction flag and build
exactly the current three choices using existing Reward RNG. This synchronous pause-creating
transaction is the sole permitted paused offer-generation exception; do not temporarily
resume RUNNING to sample. Preserve pools, eligibility, focus/evolution cursors, budgets and
stable presentation. Reject duplicate entry/forceLevelUp before any RNG or reason changes.

Update the current acceptance RUNNING guard explicitly: a choice is legal for the exact
owning current run in PAUSED with REWARD, active transaction and current presentation/text
identity, plus unchanged eligibility/rank checks. FOCUS_LOSS or MANUAL does not by itself
invalidate this owned reward selection. Apply the existing upgrade exactly once, destroy
the presentation, clear the transaction flag, reset input and release REWARD only.
Resume solely if no reason remains. Old/double callbacks cannot upgrade, clear a different
presentation's REWARD or resume any unrelated reason; terminal/disposed callbacks are inert.

**Manual/focus precedence and minimal presentation**

Escape edge produces PauseRequest. Process it before the non-RUNNING gameplay early return
so PAUSED can receive explicit resume; keep Scene/input/rendering active. No request queues.

| Current reasons / state | PauseRequest / focus behavior |
| --- | --- |
| RUNNING | Acquire MANUAL, reset gameplay input and freeze current cadence |
| MANUAL and/or FOCUS_LOSS, no REWARD | If focus/visibility restored, explicitly release MANUAL if present, then FOCUS_LOSS if present; this one documented user-resume action releases those two user-resumable reasons only |
| REWARD, with any other reasons | Ignore PauseRequest completely: no extra MANUAL, release, reward accept/decline or queued resume |
| Focus lost in RUNNING or PAUSED | Add FOCUS_LOSS idempotently without replacing REWARD/MANUAL; reset gameplay input immediately; zero RNG |
| Focus regained | Update focus bookkeeping only; never release FOCUS_LOSS or resume automatically |
| PREPARING/TERMINAL/DISPOSED | Gameplay pause/input requests have no effect; terminal presentation overrides pause |

Subscribe per create to `this.game.events` Phaser.Core.Events.BLUR and HIDDEN for loss,
FOCUS and VISIBLE for restoration bookkeeping. Track focused and visible separately,
initialized from document.hasFocus() and !document.hidden; update on their respective
events. Before explicit user resume require both plus current document.hasFocus() and
!document.hidden (synchronous check, no polling). VISIBLE alone is insufficient to prove
focus; FOCUS alone is insufficient while hidden. Duplicate/out-of-order loss signals are
idempotent; restoration cannot clear authority. Ignore pause effects after terminal/disposal.
Use supported Phaser forwarding; do not replace window.onblur/onfocus, add a polling timer
or pause the entire Scene/Game. Phaser's own hidden-loop suspend/resume may still occur;
gameplay remains PAUSED after it returns until explicit legal resume.

REWARD only stays PAUSED until valid choice. REWARD + FOCUS_LOSS accepts the choice but
stays PAUSED; show ordinary pause UI after choice UI closes and require explicit focused
Escape resume. MANUAL + FOCUS_LOSS uses the explicit two-reason release rule above.
No consumer releases another domain's reason; only this explicit user-resume path may
release both user-resumable reasons, never REWARD.

Authorize only screen-fixed PAUSED / ESC to resume text for non-reward manual/focus pause.
Do not overlay it on an active reward presentation (including combined focus/reward).
Remove on resume/terminal/shutdown; Death/Victory always takes precedence. No separate Pause
Scene, Settings/Build menu, rebinding screen or required animation.

**Concrete intent adapter and held-control reset**

One small typed sampled-frame contract provides moveX/moveY, activatePressed and pausePressed,
equivalent to MoveVector / ActivateCurrentAbility / PauseRequest. A focused desktop adapter
(for example src/game/input/KeyboardInput.ts plus tests) owns Phaser keyboard bindings;
exact filenames follow current style. Mappings: WASD + arrows, Space, Escape. Opposing
directions cancel; aliases OR together. Gameplay retains normalization, current movement
speed/clamp and Dash logic, consuming intents without KeyboardEvent, Key, isDown, JustDown
or pointer reads. Remove direct JustDown from choice acceptance too. No generic action map,
arbitrary string actions, rebinding, command bus, ECS or platform SDK abstraction.

Adapter emits press edges once, rejects OS repeat, consumes rejected Active requests without
queuing and continues release/edge bookkeeping during pause. Paused gameplay intents are
zero movement/no activation; Escape remains observable only to the pause boundary. Pointer
choice/RETRY/NEW RUN UI stays separate from gameplay intent sampling; no touch adapter now.

Reset on first REWARD/MANUAL pause, focus loss, accepted terminal, fresh run and actual resume;
clear sampled movement and pending activation/pause edges. A reset must disarm held physical
controls until release then fresh non-repeat press. Presses made during pause must also be
discarded/disarmed, never replayed on resume. Keep release/suppression bookkeeping even if
Phaser resetKeys already cleared logical key state; merely setting isDown=false or calling
resetKeys is insufficient. Do not require extra release for an already neutral control's
first fresh physical press; consume edges within one sampled frame. Held Escape/repeats
cannot toggle repeatedly or resume the pause it just created. Lost keyup on blur must not
turn autorepeat into fresh intent; conservatively require release/repress for that control.
Fresh adapters reject inherited repeat events as new presses. No artificial delays/timers.

Compatibility bridge only: ActivateCurrentAbility drives current innate Dash; adapter has
no Dash knowledge. Preserve 900px/s, 200ms, 3000ms cooldown, nonzero-movement requirement,
direction lock, expiry partitions, normal speed modifiers, no immunity/new damage. Paused,
terminal, idle, active-Dash and cooldown activation is rejected with no queue. Pause freezes
an already active burst/cooldown; resume continues that existing burst with locked direction,
without treating a held Space as a new activation. Normal held W movement resumes only after
release/repress. Real Active runtime remains GAME-070+, specializations GAME-072.

**Simulation and the five existing TimerEvent phases**

PAUSED must freeze movement, Dash start/duration/cooldown, Drone/Twin orbit, enemies,
targeting, straight/hostile projectiles, Missile/Cluster, lifetimes, damage/protection/contact,
XP attraction/collection, timed spawning and all weapon/hostile firing. Keep current terminal
freeze and mid-operation ordering. Pause UI/input stays responsive; do not Scene.pause().

Pin the installed supported mechanism: set the existing Scene Clock `this.time.paused = true`
on authoritative entry to PAUSED; keep it true while any reason remains, and false on legal
return to RUNNING. No individual-event pause alternative is selected. Phaser4.2.1
`node_modules/phaser/src/time/Clock.js#update` sets now then returns before event.elapsed
advancement when paused; events accumulate delta only when active. Clock.now itself may
advance and must not be treated as frozen gameplay elapsed time. Input/Scene update/render
remain active because only the Clock is paused. Retain guarded callbacks as protection
against already-dispatched/stale calls; discarded callbacks alone do not satisfy phase freeze.

Exactly five events remain: spawn, Laser/Prism, Missile/Cluster, Drone/Twin, hostile fire.
If one has Xms remaining at pause, arbitrary paused wall time leaves Xms; resume continues
its same object/elapsed phase with no catch-up volley, reset, recreation or timeScale=0.
The installed Clock.start/shutdown do not reset its paused flag: fresh create must explicitly
initialize it false for the new run, without stale cleanup writing to a reused fresh Clock.
Terminal clears reasons without resuming gameplay; remove the PAUSED Clock projection on
terminal entry to retain existing terminal guarded-callback/advancing-Clock behavior, with
no elapsed reset. Existing selected Fire Rate/Firing System effects may still reset their
same owned event exactly as now; that deliberate upgrade effect is not a pause/resume reset.
No sixth timer, separate scheduler, compensation clock, timer polling or wall-time mechanism.

**RNG, terminal, DEV and exact fresh-run lifetime**

MANUAL/focus entry, pause UI, snapshots, paused frames, repeated requests and resume consume
zero Encounter/Reward/World/Boss draws. Callbacks cannot reach Encounter while PAUSED.
Only creation of one real Level-Up offer uses its existing Reward budget: focused Slot1=0
or fallback1; passive Slot2=1; evolution Slot3=0 or ordinary1. Afterward no further draws
from reads, duplicate/stale callbacks or acceptance. Keep World/Boss dormant, runSeed and
Mulberry32 unchanged; no reseeding or additional consumers.

Accepted terminal from RUNNING or PAUSED clears reasons, resets adapter, removes pause UI
and invalidates reward acceptance/resumability. Preserve first-terminal-wins and current
Death/Victory UI: lethal straight hit/death/projectile cleanup or full Missile/Cluster
detonation/removal precedes Victory, never change killEnemy into the terminal boundary.
No pause/input/focus/reward callback can revive TERMINAL or reorder completed attacks.

Native scene.restart remains physical reset. Each create has a fresh RunLifecycle, RunRandom
and input adapter/binding, zero reasons and clean intents; start RUNNING with current baseline.
Preserve entropy only after successful start. Focus/input callbacks and shutdown/destroy
cleanup capture their exact run/adapter and listener identities; remove listeners or render
them permanently inert. Old code cannot dereference this.currentInput to drive a fresh
adapter, release fresh reasons, flip the fresh Clock, consume fresh RNG or restart twice.
Old lifecycle remains DISPOSED and old captured RNG streams throw; fresh identity required,
numerically different random seed not required. Fresh God Mode false and five fresh events.

Keep exactly the five DEV commands; mutations reject all PAUSED/terminal states via authority.
Authorize only detached runState and pauseReasons diagnostic fields in existing DevSnapshot,
alongside runSeed/current fields. pauseReasons is a copied plain array in fixed order
REWARD, MANUAL, FOCUS_LOSS, filtered by membership (not insertion order). Old API stays
null/false, snapshot consumes zero RNG, no mutable Set/lifecycle/input object leaks.
No pause/resume/input/focus/reseed DEV command; production still has no DEV API.

**Required tracked tests for later implementation**

Preserve all current223 tests/19 files and GAME-039/042/043 contracts. Change obsolete
Level-Up RUNNING/independent-boolean setup expectations to authoritative PAUSED/REWARD,
retaining freeze, identity, deterministic offers and atomicity assertions; do not weaken them.

| Boundary | Required evidence |
| --- | --- |
| RunLifecycle | RUNNING->PAUSED->RUNNING; duplicate reason; all three concrete reasons; mixed reasons; release one/last/absent; illegal PREPARING/TERMINAL/DISPOSED mutations; terminal from RUNNING and PAUSED; reason clearing, first-terminal immutability, idempotent disposal from PAUSED and old/fresh independence |
| Input adapter | WASD/arrows/alias/opposing/diagonal intents; Space/Escape fresh edges; repeat suppression; held movement/Space/Escape reset; keys pressed during pause; release/repress; blur reset/lost keyup and inherited repeat; fresh neutral control works; no pending edges; fresh adapter clean and disposed adapter/captured callbacks inert |
| Level-Up | Real credit/pickup-before-pause path acquires REWARD/PAUSED; unchanged three choices/budget; repeated entry/DEV/snapshot stable; Escape ignored; valid once-only choice releases REWARD only; old/double/terminal choice cannot apply or release current reason |
| Manual/focus composition | Escape opens MANUAL; focused explicit resume removes only documented MANUAL/FOCUS_LOSS; blur and hidden add loss in RUNNING or PAUSED; focus/visible alone never resume; visibility alone insufficient; REWARD+FOCUS_LOSS choice leaves PAUSED; MANUAL+FOCUS_LOSS, duplicate events, terminal no-ops |
| Simulation/Dash | All listed gameplay paths frozen; intents alone drive unchanged Dash; mid-burst duration/cooldown frozen and resumed at prior phase; held/paused/unavailable Active never queues movement or a new Dash |
| Actual Phaser Clock | Exactly five same TimerEvents; captured elapsed/remaining and callback counts unchanged over paused updates/wall time; final-reason release continues same phase, intermediate release cannot unpause; no catch-up/reset/recreation; fresh Clock paused flag restored; explicit upgrade cadence resets preserved |
| RNG/DEV | Zero draws all streams for manual/focus/pause UI/read/resume; zero Encounter on guarded callbacks; exact existing real-offer Reward budget; World/Boss dormant; stable seed; five commands; detached deterministic ordered reason array, mutation cannot affect owner |
| Terminal/ownership | Current death-first/victory-first and straight/Missile/Cluster atomic boundaries retained; terminal clears reasons/input/UI and never resumes; native fresh authority/adapter/RNG/API/five events; captured old input/focus/shutdown/reward/control callbacks cannot mutate fresh state or draw fresh RNG |

Use actual Scene production methods with focused renderer/input fixtures, plus pure authority/
adapter tests where practical. Do not build alternate fake pause/gameplay algorithms. Installed
Phaser Clock behavior requires real Phaser validation as well as tracked integration checks.

**Required real browser/native validation for later implementation**

1. Normal DEV boot: RUNNING/null, no reasons, clean adapter, valid stable seed, five events,
   exact five-command API, current movement and fresh Space Dash unchanged.
2. Real Escape manual pause: minimal fixed UI, all listed simulation frozen, zero four-stream
   draws; record all five TimerEvent objects/elapsed/remaining, wait real wall time, verify
   unchanged phase; Escape resume continues remaining gameplay delay without a catch-up burst.
3. Hold W across pause/resume: no normal movement until release/repress. Repeat for Space:
   no queued Dash; verify fresh edge works when eligible. Hold Escape: no repeated toggles.
   Pause mid-Dash: remaining duration/cooldown freeze, existing locked burst resumes correctly.
4. Real XP/forceLevelUp: PAUSED/REWARD, three stable production offers, unchanged Reward
   budget, Escape cannot dismiss, real choice resumes only if no other reason remains.
5. Trigger actual browser focus/visibility loss via tab/window focus change where reliable,
   observe Phaser forwarded events, auto PAUSED/reset and no auto-resume on return. Explicit
   focused Escape resumes; also test loss while Level-Up is shown, accept reward, remain
   PAUSED for FOCUS_LOSS, then explicitly resume. Synthetic emitter tests are supplemental,
   not a claimed actual browser focus-loss check; report any automation limitation honestly.
6. Preserve real death-first/victory-first, straight/Missile/Cluster atomic boundaries and
   terminal UI. PauseRequest/focus/stale reward cannot revive terminal.
7. At least TWO actual Victory NEW RUN native restarts and ONE Death RETRY; additionally
   exercise a nonterminal restart while PAUSED to verify reused Clock/input cleanup. Each:
   old lifecycle DISPOSED, all old RNG handles throw, old input/focus/listener/control callbacks
   inert; fresh RUNNING/no reasons, adapter/RNG/API identities, God Mode false, current baseline,
   five fresh events and no held-input leak. Reload/manual create is not native evidence.
8. Production preview: canvas/gameplay/keyboard/Space/Escape pause work, DEV API absent,
   no seed/debug controls. Inspect console; distinguish existing favicon404/bundle-size
   warnings from new errors. Keep tracked, normal boot, synthetic and actual native evidence
   separate; no browser behavior is claimed implemented by this definition task.

**Scope and definition handoff (historical definition-only instructions)**

No mobile/touch controls (GAME-098), production HUD (GAME-096), Settings (GAME-099), Build
Screen (GAME-097), real Active/Shield/Decoy runtime (GAME-070), Dash specializations (GAME-072),
PlayerBuild (GAME-046), telemetry (GAME-045), generalized gameplay clock/RunContext, new
scheduler/timers/dependencies, rebinding/controller/gamepad/mouse aiming, accessibility
settings or input recording/replay. No implementation is authorized in this definition task.

Now change only TASK_GRAPH: GAME-044 BACKLOG->READY, source-grounded definition and necessary
roadmap/status consistency. GAME-042/043 DONE; GAME-040/041 SUPERSEDED; GAME-045 READY; GAME-046+ BACKLOG.
Run npm run check and git diff --check; stage only docs/TASK_GRAPH.md, inspect complete
git diff --cached, run cached check/stat, create ignored .codex-review/GAME-044-review.txt
with branch/base, complete ownership inventory/contracts/validation and full staged diff.
Never stage that packet or commit. CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE and runtime/tests
remain unchanged now. Only successful later implementation with tracked/native validation
may set GAME-044 DONE and update actual runtime docs/map. GATE A remains incomplete until
GAME-044 implementation and GAME-045 are done/reviewed; GAME-045+ are not unlocked here.

**Implementation completion evidence**

RunLifecycle now owns PAUSED and exactly REWARD/MANUAL/FOCUS_LOSS with idempotent acquisition,
owner-only release, detached fixed-order reasons and reason clearing on terminal/dispose.
KeyboardInput supplies raw move/activate/pause intents, held/suppressed physical controls,
non-repeat edges and exact binding disposal. Scene consumes intents, retains current Dash,
migrates Level-Up to PAUSED/REWARD and projects authority onto existing Clock.paused/minimal UI.
Only final-reason release resumes; explicit focused/visible Escape handles manual/focus,
and focus return alone never resumes. Native create explicitly clears reused Clock.paused.
Existing entropy/streams/draw budgets, five timers and atomic terminal boundaries are retained.
DEV adds detached runState/copied ordered pauseReasons with five unchanged commands.

npm run check passes 264 tests/20 files, preserving 223 prior cases with required Level-Up
authority expectations migrated. Actual installed Phaser Clock integration verifies same-event
phase preservation. Real Chrome W/arrows/Space/Escape, held release/repress, mid-Dash/cooldown,
Level-Up pointer acceptance and 2300ms wall-time freeze of gameplay/five phases/all streams pass.
Actual foreground-tab changes with Chromium focus emulation disabled trigger Phaser BLUR;
document stays visible, return stays PAUSED until Escape, including REWARD+FOCUS_LOSS.
HIDDEN/VISIBLE/restoration-order coverage is separate tracked synthetic evidence.
Two actual Victory NEW RUN cycles, Death RETRY, paused nonterminal restart and additional
Missile/Cluster cycles pass: fresh authority/adapter/RNG/API, zero reasons, unpaused Clock,
five fresh events, old streams throw and saved stale callbacks draw zero on all fresh streams.
Unmodified production preview passes keyboard/Space/Escape and 700ms rendered pause freeze
without DEV API/debug controls. Only known favicon404 and Vite chunk-size warnings remain.
GAME-042/043/044 DONE; GAME-040/041 SUPERSEDED; GAME-045 READY; GAME-046+ BACKLOG; GATE A incomplete.

#### GAME-045 — Telemetry & Diagnostics Foundation

STATUS: READY

**Dependencies:** GAME-042 DONE; preserve implemented GAME-043/044 contracts (DONE).
Definition only; runtime implementation requires its own task. Add one focused Phaser-free
run-scoped RunDiagnostics observer (for example src/game/run/RunDiagnostics.ts plus tests).
GameplayScene remains composition root and explicitly records actual accepted boundaries.
Diagnostics never decides damage, rewards, RNG, difficulty, spawning, pause or terminal outcome.
RunLifecycle keeps lifecycle/pause/terminal authority; RunRandom keeps seed/stream ownership.
No global manager, service locator, DI, plugin, event bus or generic track(name,payload) API.

**Current observable-boundary inventory and source audit**

Audited tracked src at HEAD 30684cc5f6e937d74059a9e3901eb2de197c5d03 after GAME-044,
including tests, for telemetry/diagnostics/metrics/counters/report/performance, elapsed/
duration/time, successfulTimedSpawns and enemy/damage/XP/level/reward observations.
No diagnostics collector, historical kill/damage totals, gameplay elapsed accumulator,
analytics transport, profiling infrastructure or report generator exists. DevSnapshot is
current detached state, not history. Encounter stream names are not encounter counters;
weapon/Dash/protection lifetimes and TimerEvent elapsed are gameplay mechanisms, not metrics.

| Current source / anchor | Observable fact and integration constraint |
| --- | --- |
| `RunLifecycle.ts` | PREPARING/RUNNING/PAUSED/TERMINAL/DISPOSED, concrete reason membership, accepted transitions/immutable first outcome; no telemetry state belongs here |
| `RunRandom.ts` | Immutable uint32 seed, four streams, captured-owner disposal; observer receives only numeric seed, never a stream/owner reference |
| `KeyboardInput.ts` | Physical held/suppressed controls and sampled intents; do not log key/frame histories or add input/focus ownership |
| `GameplayScene.create` | Initial Chaser created at player.x+600 during PREPARING, before successful start and crypto RunRandom; five guarded events exist before RUNNING; DEV publishes after seed. Construct diagnostics after seed, before publication; bootstrap initial spawn observation once without moving enemy creation |
| `update` | Sample intents, handle PauseRequest with early return, lifecycle guard, player/intent availability, then active delta-based simulation. Advance diagnostic time at the first active-simulation line after those returns, before movement/combat |
| `createEnemy`, `spawnEnemy` | One EnemyRuntime has chaser/shooter/tank/boss, isElite, health/contactDamage/xpValue/radius. Common creation covers timed CCCSCT/Elite/Warden and deterministic DEV Warden; initial creation precedes diagnostics. Count successful creations only, never blocked spawn attempts |
| `successfulTimedSpawns` | Scene-authoritative timed count incremented after successful placement; initial/DEV creation excluded. Existing snapshot already exposes it; do not duplicate this mutable scheduling counter in observer |
| `killEnemy` | Collection-membership guard rejects duplicate removal; Boss flag, exactly one pickup.value from enemy.xpValue, visual destruction/splice. Observe actual completed removal/XP creation once, not damage attempts or kill prediction |
| `updateProjectiles`, `explodeMissile`, `explodeClusterSatellites` | Common kill path; straight lethal hit/cleanup or full primary/satellite union and Missile cleanup precedes Victory. Observe aggregates inside common removal, terminal only after authority accepts; no projectile/hit timeline |
| `damagePlayer` | Lifecycle/player/zero-HP/GodMode/protection guards precede clamped HP subtraction; HUD/protection update then lethal terminal. Record accepted positive beforeHP-afterHP, not requested damage, before lethal terminal record |
| `updateXpPickups`, `creditExperience` | Real collection calls creditExperience(value,pickup); credit computes level/XP, removes pickup before Level-Up. DEV forceLevelUp calls the same helper without pickup. Observe credited amount and level difference once here, not also in attraction loop |
| `enterLevelUpPause`, `levelUpPool`, `LevelUpChoice` | Guarded REWARD acquisition, input reset, three choices built with current Reward samples/cursors, pointer callbacks. One offered observation only after all three actual options/texts are constructed; derive typed identities from choices, not labels |
| `acceptLevelUpChoice` | Exact run/PAUSED/REWARD/transaction/text/eligibility guards precede existing upgrade effects; destroys presentation and releases REWARD. Record selected option once after successful application and before reason release |
| `handlePauseRequest`, `bindRunInput.loseFocus`, reward entry/acceptance | Actual request/release calls compose reasons; FOCUS/VISIBLE only restore bookkeeping; projectPause projects Clock/UI and is also called for terminal. Observe before/after accepted lifecycle changes, not UI visibility or every projectPause call |
| `enterPlayerDeath`, `enterRunVictory` | tryEnterTerminal acceptance precedes concrete input/UI cleanup; Victory requires bossDefeated after completed owning attack. Record accepted outcome once at this existing boundary; never inside killEnemy |
| `publishDevTools`, `devTools.ts` | Exactly five commands; snapshot has runSeed/runState/copied reasons/current progression/Boss/counts/timer count. Add one detached nested diagnostics field only, no collector or sixth command |
| `create` disposeRun/disposeRandom/disposeInput, DEV invalidate; RETRY/NEW RUN | Captured exact-create lifetime and native Scene reuse; observer disposal must capture that exact owner too. Retain stale timer/input/focus/reward/result/API guards |
| Existing tracked tests | 264 cases/20 files; pure lifecycle/RNG/input plus real Scene methods and installed Clock fixture. Browser/native evidence is separate; preserve all assertions and deterministic behavior |

ARCHITECTURE specifies observation-only diagnostics and GAME-100 reporting, without a
precreated telemetry framework. BALANCE contains future pacing/playtest hypotheses, not
current Director/Build/World identities or authority to implement those domains. Current
elapsed/XP/offer counts support investigation; full performance profiling is deferred below.

**Owner, startup and exact lifetime**

RunDiagnostics retains validated immutable uint32 runSeed only; constructor has no Phaser,
lifecycle, RNG, input, Clock or gameplay references. A fresh pure owner starts elapsed0,
zero aggregates, empty timeline, terminal null. Explicit recordRunStarted() records once.
Scene order: existing initialization/five events -> successful run.start -> crypto/RunRandom
-> fresh diagnostics -> RUN_STARTED -> observe already-created initial enemy once -> DEV API.
No usable diagnostics mutation during PREPARING, no entropy/extra draws and no initial enemy
recreation. Pure fresh-zero baseline differs intentionally from post-create Scene baseline:
one RUN_STARTED row at0ms, spawned.total1/chaser1, all other counters0. Restart repeats this
same fresh bootstrap, not a zero-spawn scene or retained prior history.

Capture const diagnostics from that create for shutdown/destroy disposal; dispose idempotent.
Direct record/advance and snapshot on a disposed owner throw a clear invariant Error.
Old callbacks must fail their existing exact-run/identity guards before recording; never
redirect captured old callbacks via this.currentDiagnostics into a fresh owner. Synchronous
Scene methods may use current owner only after their current-run guards; retained callbacks
must preserve captured run/owner identity. No broad try/catch hiding observer defects.

**Gameplay elapsed observation, not scheduling**

Use only gameplayElapsedMs += delta at the active update point identified above, after the
PauseRequest/authority/player/intent early returns and before simulation work. Sum the actual
finite nonnegative frame delta once, even if that frame later enters reward pause or terminal.
Do not split/reinterpret delta around collision timing. A frame returning for pause/resume
adds nothing, matching current simulation. This fixes timestamp convention: update-produced
records use the accumulated end-of-active-frame time; Phaser Clock callbacks dispatched before
Scene.update use the last accumulated time. Equal timestamps are legal; insertion order wins.

PREPARING/PAUSED/TERMINAL/DISPOSED never advance through integration. Freeze final elapsed
at accepted terminal; no Date.now/performance.now/Clock.now, wall time, setInterval, TimerEvent
or new scheduler/Run clock. This is one observation scalar, never read by gameplay decisions.
Observer advance validates delta but does not own/run a lifecycle or pause policy.

**Exact bounded semantic timeline and concrete API**

Authorize only the following discriminated plain record union. Every row has type and
gameplayElapsedMs; all arrays/identities are copied on input and snapshot. No arbitrary
event strings/payload dictionaries. Explicit record methods may follow repository naming:

| Record / explicit method | Additional typed fields / effect |
| --- | --- |
| RUN_STARTED / recordRunStarted() | No payload; once at0ms, does not increment gameplay counters |
| PAUSE_ENTERED / recordPauseEntered(reasons) | Copied nonempty fixed-order PauseReason[] at accepted RUNNING->PAUSED; increments pauseEntries |
| PAUSE_RESUMED / recordPauseResumed(previousReasons) | Copied prior PauseReason[] for accepted final PAUSED->RUNNING; increments pauseResumes |
| LEVEL_UP_OFFERED / recordLevelUpOffered(choices) | Exactly three distinct current ChoiceIdentity values in slot order; increments offersPresented |
| LEVEL_UP_SELECTED / recordLevelUpSelected(choice) | Actual accepted ChoiceIdentity; increments choicesAccepted, before any PAUSE_RESUMED row |
| TERMINAL / recordTerminal(outcome) | DEATH or VICTORY; freezes terminal {outcome, gameplayElapsedMs}, exactly once |

Bound timeline to256 retained rows using oldest-row eviction, retaining newest rows in
insertion order; increment droppedTimelineRecords on each eviction. Aggregates never derive
from retained rows and remain complete after eviction. RUN_STARTED may be evicted; seed stays
in snapshot identity. Final TERMINAL is newest and retained because no later records are
accepted. No unbounded buffer even with repeated manual pauses; test capacity/overflow.

Additional explicit aggregate operations: recordEnemySpawned(archetype,isElite),
recordEnemyKilled(archetype,isElite,xpValue), recordPlayerDamage(actualHpLost),
recordXpCredited(amount,levelsGained,source), advance(delta), snapshot(), dispose().
These are typed concrete boundaries, not a generic track API or event subscriber system.

ChoiceIdentity is an explicit literal union derived from actual LevelUpChoice data:
laser.power/fireRate/speed; missile.warheadPower/propulsion/blastExpansion;
drone.boltPower/firingSystem/boltPropulsion; passive.hull/thruster/collector/combat/spatial/
replication; prism/cluster/twin. Slash notation here abbreviates each prefix's individual
literal IDs (for example laser.fireRate). No Phaser Text labels, future Core/System/Active
IDs or exported mutable Scene data. Use a small typed conversion at the Scene boundary.
EnemyArchetype is exactly chaser/shooter/tank/boss; isElite true is valid only for tank.

**Authorized aggregates and exact counting rules**

| Snapshot field / category | Concrete accounting |
| --- | --- |
| spawned {total, byArchetype:{chaser,shooter,tank,boss}, eliteTanks} | Common completed createEnemy once; bootstrap initial Chaser as above. Includes timed and DEV Boss. Boss total is byArchetype.boss, Elite is a subset of tank, not another archetype |
| killed {total, byArchetype:{chaser,shooter,tank,boss}, eliteTanks} | Completed killEnemy membership-guarded removal once. Duplicate kill no increment; no kill credit for nonlethal hit |
| acceptedDamagingHits, hpLost | One positive accepted damagePlayer HP difference; actual loss clamped by available HP. GodMode/protection/paused/missing/dead rejections count0; defer rejected-hit counters |
| xpDropped | Sum actual value of each successfully created kill pickup via recordEnemyKilled; no collection or direct Boss XP credit inferred |
| xpCredited, xpCollected, xpDevCredited, levelsGained | Common creditExperience after award/removal: source pickup increments xpCollected and xpCredited; source dev increments xpDevCredited and xpCredited. levelsGained is newLevel-oldLevel, may exceed1. No second count in updateXpPickups; remaining progression XP is not total credited XP |
| offersPresented, choicesAccepted | One actual constructed Level-Up presentation / one guarded accepted choice. offersPresented is also the Level-Up presentation count; do not duplicate it under another name |
| pauseEntries, pauseResumes | Accepted high-level transitions only, independent of number of reasons. Defer per-reason acquisition/rejection counts and pause wall durations |
| terminal | Null until one accepted result, then immutable DEATH/VICTORY and final gameplayElapsedMs |
| droppedTimelineRecords | Eviction count only; cannot affect gameplay or historical aggregate totals |

No second mutable successfulTimedSpawns counter, active-enemy count, current HP/level/XP,
pause reason authority or Boss flag in diagnostics; existing DevSnapshot reads Scene/run
truth for those current values. Counters above are observation history, never gameplay truth.
Real pickup XP is tracked independently of DEV XP so forced progression is not mislabeled
as collection. Fractional positive HP loss is supported; XP/levels/counts are integers.

**Pause, terminal, read models and invariants**

At Scene pause integration sites capture prior state/reasons, perform existing accepted
request/release operations, then observe an actual RUNNING->PAUSED or PAUSED->RUNNING pair.
Manual resume releases its two user-resumable reasons before recording one final resume;
reward acceptance releases REWARD only. Adding FOCUS_LOSS while already PAUSED, duplicate
loss/request, rejected Escape and focus restoration produce no extra entry/resume row.
Do not instrument projectPause as a transition (it also projects UI/terminal). Terminal from
PAUSED records TERMINAL only, never a synthetic resume even though Clock.paused becomes false.

Record terminal immediately after successful tryEnterTerminal at enterPlayerDeath or
enterRunVictory, preserving their existing placement after owned attack completion. Do not
move terminal into killEnemy, before straight cleanup or before full Missile/Cluster removal.
Accepted lethal damage is observed before DEATH; Boss removal/XP drop before later VICTORY.
Rejected terminal conflicts/duplicates return false with no second record; other postterminal
record/advance requests return false without mutation. Before RUN_STARTED, recording/advancing
is an invariant error. Invalid numeric/identity input throws before any partial counter/time/
timeline change: finite nonnegative delta, finite positive HP loss, nonnegative integer XP/
levels, safe integer counters and no overflowing/nonfinite sums, exact supported identities.
Validate seed like RunRandom, including zero; no clamping/coercion, repair or broad catch.

snapshot() returns detached JSON-serializable {runSeed, gameplayElapsedMs, aggregates,
timeline, droppedTimelineRecords, terminal}; nested records, reason arrays, offered identities,
archetype counters and terminal data must be copied. Repeated reads mutate nothing and draw
zero RNG. Existing five-command DEV snapshot adds only diagnostics: RunDiagnosticsSnapshot;
no collector/reference/mutation/reset/export API or sixth command. Production DEV API absent.

Diagnostics receives no Encounter/Reward/World/Boss handles and makes zero draws/reseeds;
candidate ordering and exact GAME-043 budgets remain unchanged. Same seed/code/content,
relevant decision history AND supplied active deltas reproduce deterministic diagnostics;
seed alone does not reproduce elapsed time across FPS/machines. Never promise replay.
Observer does not request/release pause, set time.paused, reset input, attach focus listeners
or schedule anything. Exactly five existing gameplay TimerEvents remain, zero added here.

**Performance decision and excluded volume**

Defer active frame count and maximum delta as well as p95/p99, FPS history, rolling windows,
memory sampling, adaptation, final RunReport/export and performance investigation to GAME-100:
current source has no demonstrated profiling consumer. gameplayElapsedMs is the only frame
observation here. Do not retain per-frame deltas, projectile launch/hit/collision/targeting/
movement/RNG records, or individual enemy spawn/death timeline rows. Enemy data aggregates only.
No network/SDK/backend/upload, persistence/localStorage/save/profile/meta, statistics UI,
download button, crash service, replay/daily-run or nonexistent Director/Build/Core/World/
Event/BossController metrics; no new dependency or generic analytics architecture.

**Required tests for later implementation**

Preserve all264 current tests/20 files and GAME-039/042/043/044 assertions. Add pure owner
tests and actual Scene production-path integration, not parallel fake gameplay algorithms:

| Boundary | Required evidence |
| --- | --- |
| Owner/invariants | Zero seed/max identity; invalid seeds/numbers/identities and overflow rejected atomically; fresh zero/empty/null state; RUN_STARTED once; delta sums; all counters; detached nested input/snapshot copies; equal-time insertion order;256-row eviction and dropped count with intact aggregates; single terminal/frozen time; disposed mutation/snapshot throw, idempotent dispose, fresh independence |
| Boot/spawn/kill | Post-create one initial Chaser, one start row, correct seed, zero RNG; normal timed/Elite/Boss30/DEV Boss increments once, blocked attempts0, no timed-counter duplicate. Real nonlethal/kill/common XP drop and duplicate removal count correctly, no projectile timeline |
| Damage/XP | Actual clamped HP loss/hit count, GodMode/protection/paused rejects0; lethal damage precedes terminal. Real pickup creation/collection once, DEV forceLevelUp source distinct, integer level difference/multilevel award, no double collection/credit |
| Reward | One fully constructed offer tuple and selected typed identity; existing exact offers/budget preserved. Repeated snapshots/stable paused UI/duplicate force/stale or double choice add no record. Selection before final REWARD resume, composed focus retains pause |
| Pause/time | Manual/reward/focus entry; duplicate/composed loss no fake transition; focus return no resume; last release one resume; terminal from PAUSED no resume. Only active update delta advances; real pause/resume early-return frames and non-RUNNING states freeze diagnostics |
| Isolation/terminal | Record/snapshot draws0 all four streams; fixed-seed/state/delta scenarios match telemetry and gameplay; no clock/input/eligibility/damage mutations. Death-first/victory-first, straight/Missile/Cluster atomicity, exact one terminal with frozen elapsed |
| Lifetime/DEV | Fresh collector identity/bootstrap after native reset; old disposed and captured old timer/input/focus/reward/control callbacks cannot write fresh history. Existing RNG/API/input/Clock ownership and five events intact; nested DEV diagnostics detached; five commands only |

**Required real browser/native validation for later implementation**

1. Normal DEV root boot: RUNNING, valid stable seed, defined initial bootstrap baseline,
   five events/five commands; no instrumentation RNG draws.
2. Active elapsed increases; actual manual pause for meaningful real wall time leaves elapsed,
   counters and timeline stable after entry; focused explicit resume advances again. Repeated
   reads and duplicate pause attempts do nothing; verify all four streams unchanged by observation.
3. Actual timed spawn, common enemy kill/XP drop/collection, accepted player damage and real
   Level-Up/pointer choice produce the specified counters/semantic order. Check GodMode and
   protection rejections, stale/double choice and repeated snapshot produce no extra record.
4. Genuine browser BLUR path and reward+focus composition retain GAME-044 behavior; telemetry
   neither changes input/Clock nor resumes. Separate actual focus evidence from synthetic tests.
5. Real death-first/victory-first and straight/Missile/Cluster completed-attack boundaries:
   exactly one terminal, final elapsed frozen, no artificial resume from PAUSED.
6. TWO Victory NEW RUN cycles, ONE Death RETRY and ONE paused nonterminal native restart.
   Each old owner disposed/inert, fresh owner identity/correct seed and fresh bootstrap (not
   previous history), RUNNING/no reasons, fresh input/RNG/API, unpaused Clock and five fresh
   events; saved stale callbacks cannot write new counters/timeline or consume fresh RNG.
   Page reload/manual create is not native restart evidence.
7. Unchanged production gameplay/keyboard/Space/pause works, DEV API absent, no telemetry UI,
   no introduced analytics/network traffic. Inspect console, separate known favicon/bundle
   warnings and report actual evidence apart from tracked fixtures; no new runtime claims now.

**Definition validation and future documentation**

Now change only TASK_GRAPH, GAME-045 BACKLOG->READY and necessary roadmap consistency.
Run npm run check and git diff --check; stage only docs/TASK_GRAPH.md; inspect full cached
diff and run cached check/stat. Create ignored .codex-review/GAME-045-review.txt with
AGENTS.md sections, full source inventory/contracts and complete staged diff; never stage
review packet or commit. CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/BALANCE/runtime/tests stay
unchanged in this definition. Successful later implementation may set GAME-045 DONE and
update factual runtime docs/map. GAME-046+ remain BACKLOG pending separate authorization.
GATE A remains incomplete until implementation, validation AND architect gate review;
GAME-045 DONE by itself must not automatically close the gate or unlock later tasks.

**GATE A — Runtime Foundation** — review the preceding phase capabilities before its cutover/next proof.

### PHASE B — PlayerBuild / Combat / Enemy Runtime

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-046 | PlayerBuild / Slots / Effective Stats | GAME-042 | 3/1/6 build ownership and cached Effective Stats with explicit modifiers. | BACKLOG |
| GAME-047 | Tags & Build Snapshot | GAME-046 | Tag contributions, derived identity and detached BuildSnapshot. | BACKLOG |
| GAME-048 | Player Defense Runtime | GAME-046 | Authoritative Shield/Hull/protection and incoming-damage boundary. | BACKLOG |
| GAME-049 | Combat Resolution & Launch Snapshots | GAME-046, GAME-048 | Attack/Hit/Damage resolution and immutable launch values. | BACKLOG |
| GAME-050 | Enemy Definitions & Spawn Snapshots | GAME-049 | EnemyDefinition, scaling profiles and per-spawn runtime snapshots. | BACKLOG |
| GAME-051 | Authoritative EnemyDeath Pipeline | GAME-049, GAME-050 | Exactly-once death record with last damaging / kill-source attribution for explicit XP/objective/Medical/Boss consumers and telemetry. | BACKLOG |
| GAME-052 | Enemy Interaction + Swarm & Charger | GAME-048..051 | Enemy interaction/knockback/Decoy susceptibility plus Swarm and Charger roles. | BACKLOG |

**GATE B — Modern Combat on Legacy Spawning** — review the preceding phase capabilities before its cutover/next proof.

### PHASE C — XP / Progression / Rewards

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-053 | Physical XP & Level Progression | GAME-051 | Physical XP, value preservation, thresholds, overflow and pending levels. | BACKLOG |
| GAME-054 | Reward Transaction & Eligibility | GAME-046, GAME-047, GAME-053 | One reward transaction, hard eligibility and explicit Build application. | BACKLOG |
| GAME-055 | Level-Up Generator | GAME-043, GAME-047, GAME-054 | Weighted Level-Up roles, Analyzer, pity and recent-offer handling. | BACKLOG |
| GAME-056 | Laser Progression Vertical | GAME-049, GAME-055 | Laser tuning/readiness and Scatter Array / Repeater Array / Precision Lance development. | BACKLOG |
| GAME-057 | Missile Progression | GAME-056 | Straight base Missile and Guidance / Heavy Warhead / Fragmentation progression. | BACKLOG |
| GAME-058 | Combat Drone Progression | GAME-056 | Combat Drone Scatter / Repeater / Precision progression. | BACKLOG |
| GAME-059 | Multi-System Combat Runtime | GAME-057, GAME-058 | Multiple installed Combat Systems with independent concrete runtime ownership. | BACKLOG |

**GATE C — First Real Build Loop** — review the preceding phase capabilities before its cutover/next proof.

### PHASE D — Portal / Encounter Director

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-060 | Spawn Capacity & Reservations | GAME-050 | Authoritative active/reserved/summon occupancy and safety limits. | BACKLOG |
| GAME-061 | Portal Spawn Primitive | GAME-043, GAME-050, GAME-060 | Validated placement, fixed visible telegraph geometry and portal cleanup. | BACKLOG |
| GAME-062 | Run Stages / Pressure / Build Maturity | GAME-042, GAME-046 | Stage/time/Level pressure with hard-bounded structural Build Maturity. | BACKLOG |
| GAME-063 | Encounter Templates — Foundation | GAME-052, GAME-060, GAME-061, GAME-062 | First authored template plans integrating placement, portals and capacity. | BACKLOG |
| GAME-064 | Encounter Director Core | GAME-043, GAME-063 | Seeded weighted anti-repeat planning from eligible templates. | BACKLOG |

**GATE D — First Director Proof** — review the preceding phase capabilities before its cutover/next proof.

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-065 | Production Director Cutover | GAME-064 | Production ambient Director replaces fixed CCCSCT spawning. | BACKLOG |
| GAME-066 | Enemy Batch B | GAME-064 | Add Bomber, Sniper, Suppressor and Splitter. | BACKLOG |
| GAME-067 | Elite Modifiers | GAME-066 | Frenzied, Shielded, Heavy, Accelerated; replace standalone prototype Elite production architecture. | BACKLOG |
| GAME-068 | Encounter Template Manifest | GAME-066, GAME-067 | Expand to the exact fifteen CONTENT_MANIFEST encounter templates. | BACKLOG |

**GATE E — Real Combat Pacing** — review the preceding phase capabilities before its cutover/next proof.

### PHASE E — World / Active / Core

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-069 | World Scheduler & Event Runtime | GAME-043, GAME-062, GAME-064 | Milestone/optional opportunities, placement, spacing and concrete event lifecycle. | BACKLOG |
| GAME-070 | Active Ability Runtime | GAME-044, GAME-048, GAME-049 | Concrete Active cooldown/effect runtime; production starts without innate Dash. | BACKLOG |
| GAME-071 | Active System Signal | GAME-054, GAME-069, GAME-070 | First Active acquisition from its dedicated signal. | BACKLOG |
| GAME-072 | Dash Specializations | GAME-070 | Afterburner, Ram and Phase; two specialized upgrades per branch. | BACKLOG |
| GAME-073 | Shield Specializations | GAME-070 | Fortress, Pulse and Reflector interception; two specialized upgrades per branch. | BACKLOG |
| GAME-074 | Decoy Specializations | GAME-070 | Hardened, Explosive and Disruptor; two specialized upgrades per branch. | BACKLOG |
| GAME-075 | Armory Signal | GAME-059, GAME-069 | Dedicated new Combat System opportunity and acquisition. | BACKLOG |
| GAME-076 | Weapon Module | GAME-056..059, GAME-069 | Dedicated weapon-development event. | BACKLOG |
| GAME-077 | Core Loadout & Replacement | GAME-046, GAME-054 | Six Core slots and paused atomic replace-one-or-decline. | BACKLOG |
| GAME-078 | Core Catalog Pack A | GAME-077 | Core catalog items 1–6 from CONTENT_MANIFEST. | BACKLOG |
| GAME-079 | Core Catalog Pack B | GAME-078 | Core catalog items 7–12 from CONTENT_MANIFEST. | BACKLOG |
| GAME-080 | Core Technology Event | GAME-069, GAME-077..079 | Core Technology objective and dedicated Core reward. | BACKLOG |
| GAME-081 | Minor World Objects | GAME-053, GAME-069 | Data Cache, Repair Pod and Shield Capacitor. | BACKLOG |
| GAME-082 | Repair Signal & Repair Beacon | GAME-069 | Repair Signal event and Repair Beacon environment mechanic. | BACKLOG |
| GAME-083 | Projectile Distortion Field | GAME-049, GAME-069 | Projectile Distortion Field environment mechanic. | BACKLOG |

**GATE F — Structural Run** — review the preceding phase capabilities before its cutover/next proof.

### PHASE F — Drone Doctrine

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-084 | Drone Bay & Doctrine Choice | GAME-058, GAME-069 | Drone Bay Signal and irreversible Replication / Diversification choice. | BACKLOG |
| GAME-085 | Drone Replication | GAME-084 | Shared progression/copies, diminishing fleet efficiency and three authored doctrine upgrades. | BACKLOG |
| GAME-086 | Medical Drone Diversification | GAME-051, GAME-084 | Medical Drone + Repair, bounded Charge healing and Combat-kill fleet synergy. | BACKLOG |

**GATE G — Drone Architecture Proof** — review the preceding phase capabilities before its cutover/next proof.

### PHASE G — Mini-Boss / Boss / Run Completion

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-087 | Mini-Boss Event Framework | GAME-069, GAME-080 | Known-category Mini-Boss opportunity/objective and major paused reward. | BACKLOG |
| GAME-088 | Siege Walker | GAME-087 | Siege Shot and Suppression Barrage on Siege Walker. | BACKLOG |
| GAME-089 | Hunter | GAME-087 | Target Lock / committed pursuit or charge and Pressure Volley on Hunter. | BACKLOG |
| GAME-090 | Boss Transition | GAME-062, GAME-064, GAME-069 | Endgame-to-Boss transition, visible portal, world/ambient changes and authored adds boundary. | BACKLOG |
| GAME-091 | BossController & Juggernaut Phase 1 | GAME-043, GAME-049..051, GAME-090 | Boss pattern lifecycle and first Juggernaut phase. | BACKLOG |
| GAME-092 | Full Juggernaut | GAME-091 | Three-phase Juggernaut with four signature mechanics; replaces production final Warden. | BACKLOG |
| GAME-093 | RunResult & Post-Run | GAME-042, GAME-092 | Authoritative RunResult and Post-Run summary / NEW RUN. | BACKLOG |

### PHASE H — Full-Run UX / Closure

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-094 | Run Start & Starting System Selection | GAME-056..059 | Choose exactly one Laser / Missile / Combat Drone; empty Active/Core slots. | BACKLOG |
| GAME-095 | Opening 90-Second Pacing | GAME-068, GAME-069, GAME-094 | Validate opening movement, automatic combat, pressure and reward pacing. | BACKLOG |
| GAME-096 | Production HUD Structure | GAME-048, GAME-053, GAME-070, GAME-087, GAME-092 | World Hull/Shield, XP/Active state, tiered health bars and event/readability structure. | BACKLOG |
| GAME-097 | Build Screen | GAME-046, GAME-047, GAME-070, GAME-077, GAME-084 | Paused detached BuildSnapshot presentation. | BACKLOG |
| GAME-098 | Mobile Controls Closure | GAME-044, GAME-070, GAME-096 | Floating left joystick, Active/Pause controls and desktop/mobile gameplay parity. | BACKLOG |
| GAME-099 | Settings & Accessibility Minimum | GAME-096, GAME-098 | Functional minimum audio/readability settings. | BACKLOG |
| GAME-100 | RunReport & Performance Instrumentation | GAME-045 and implemented gameplay domains | RunReport and performance instrumentation across implemented domains. | BACKLOG |
| GAME-101 | Full Vertical Slice Integration | all preceding Vertical Slice capabilities | Integrate all preceding Vertical Slice capabilities. | BACKLOG |

**GATE H — Mechanical Vertical Slice Candidate** — review the preceding phase capabilities before its cutover/next proof.

### PHASE I — Balance Validation

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-102 | Progression & Build Balance | GAME-101 | Validate progression, offer quality, specialization timing and breadth versus depth. | BACKLOG |
| GAME-103 | Enemy / Director / World Balance | GAME-101 | Validate role-preserving enemy/Director/world composition and opportunity pacing. | BACKLOG |
| GAME-104 | Boss & Endgame Balance | GAME-101 | Validate Boss transition, phases, normal-movement dodges and endgame timing. | BACKLOG |
| GAME-105 | Vertical Slice Validation & Baseline Sync | GAME-102, GAME-103, GAME-104 | Validate full slice and synchronize factual baseline after balance passes. | BACKLOG |

## Future Content Wave 2 — no task IDs assigned

- Enemies: Summoner, Support, Guardian, Artillery.
- Elite modifiers: Commander, Volatile.
- Drones: Medical Barrier, Medical Emergency, Salvage Drone and branches, advanced fleet
  synergies, all-three mixed-fleet Capstone.
- Active: Active Capstones.
- World: Active Module Event, Elite Signal, Recalibration Station, Gravity Anomaly,
  additional environments.
- Core: grow from twelve toward roughly 20–25 strong authored items.
- Mini-Bosses: Brood Carrier, Orbital Controller.
- Bosses: future Hunter/Broodmaster/Controller-style authored bosses.
- Final Service Signal remains CANDIDATE.

Meta/Profile/Persistence is later still, after a validated balanced slice.
Do not define GAME-106+ yet.

## Graph maintenance

Keep the graph compact and factual. Expand a near-term node only when it becomes the
active task. Preserve IDs and completion facts. Split work that cannot be reviewed as
one coherent change. Run required quality/runtime validation and architect handoff under
AGENTS.md; the user creates the final commit after approval.
