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

GAME-042/043/044/045 are DONE; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG. Each row gives phase membership, exact dependencies and a
short capability; gates are review checkpoints, not automatic authorization.
Dependency ranges are inclusive.

### PHASE A — Runtime Foundation

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-042 | Run Lifecycle & Fresh Run Boundary | DESIGN-005, GAME-039 | Run lifecycle, terminal and fresh-restart authority; preserve GAME-038 first-terminal semantics. | DONE |
| GAME-043 | Seeded RNG Streams | GAME-042 | runSeed and independent Encounter/Reward/World/Boss RNG streams. | DONE |
| GAME-044 | Authoritative Pause & Input Boundary | GAME-042 | Single gameplay pause authority, movement/Active/Pause intents and focus-loss semantics. | DONE |
| GAME-045 | Telemetry & Diagnostics Foundation | GAME-042 | Run timeline, aggregates and diagnostics foundation. | DONE |

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
GAME-040/041 SUPERSEDED; GAME-043 DONE; GAME-044 DONE; GAME-045 DONE; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG. GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG pending separate definition. Explicit staging
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
named/forkable RNG framework, service locator or new dependency. GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG pending separate definition.

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
warnings remain. GAME-044 DONE; GAME-045 DONE; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG; GAME-040/041 SUPERSEDED; GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG pending separate definition.

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
GAME-040/041 SUPERSEDED; GAME-044 DONE; GAME-045 DONE; GAME-046 DONE; GAME-047+ remain BACKLOG. GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047+ remain BACKLOG pending separate definition.

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
roadmap/status consistency. GAME-042/043 DONE; GAME-040/041 SUPERSEDED; GAME-045 DONE; GAME-046+ BACKLOG.
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
GAME-042/043/044 DONE; GAME-040/041 SUPERSEDED; GAME-045 DONE; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG; GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG pending separate definition.

#### GAME-045 — Telemetry & Diagnostics Foundation

STATUS: DONE

**Dependencies:** GAME-042 DONE; preserve implemented GAME-043/044 contracts (DONE).
Implemented focused Phaser-free run-scoped RunDiagnostics observer in
src/game/run/RunDiagnostics.ts with pure and actual Scene integration tests.
GameplayScene remains composition root and explicitly records actual accepted boundaries.
Diagnostics never decides damage, rewards, RNG, difficulty, spawning, pause or terminal outcome.
RunLifecycle keeps lifecycle/pause/terminal authority; RunRandom keeps seed/stream ownership.
No global manager, service locator, DI, plugin, event bus or generic track(name,payload) API.

**Pre-implementation observable-boundary inventory and source audit**

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

**Implementation test requirements**

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

**Implementation browser/native validation requirements**

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

**Original definition validation and implementation documentation rules**

Now change only TASK_GRAPH, GAME-045 BACKLOG->READY and necessary roadmap consistency.
Run npm run check and git diff --check; stage only docs/TASK_GRAPH.md; inspect full cached
diff and run cached check/stat. Create ignored .codex-review/GAME-045-review.txt with
AGENTS.md sections, full source inventory/contracts and complete staged diff; never stage
review packet or commit. CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/BALANCE/runtime/tests stay
unchanged in this definition. Successful later implementation may set GAME-045 DONE and
update factual runtime docs/map. GAME-046+ remain BACKLOG pending separate authorization.
GATE A remains incomplete until implementation, validation AND architect gate review;
GAME-045 DONE by itself must not automatically close the gate or unlock later tasks.

**GAME-045 implementation completion evidence**

RunDiagnostics owns validated immutable uint32 seed, full active-update elapsed, independent
historical aggregates, exactly six typed semantic records/newest 256 retention with eviction
count, terminal freeze and explicit start/disposal invariants. Numeric/identity/overflow checks
reject atomically; input/snapshot nested data is copied. Scene bootstraps the existing initial
Chaser once after RNG; common spawn/kill/drop/damage/XP paths observe accepted results only.
Typed constructed offers and applied selections retain selection-before-final-resume order.
Actual composed pause transitions add no fake rows; terminal remains at existing completed
attack boundaries, including no resume from PAUSED. Nested DEV diagnostics adds no command.
Captured exact-owner disposal and old callback guards preserve native fresh-run boundaries.
No gameplay authority, extra RNG draws/timer, generic tracking API, performance volume,
network/persistence/UI or dependency was added.

npm run check passes 309 tests/21 files: all 264 prior cases plus 35 pure observer and 10 actual
Scene integration cases. Real Chrome validates active elapsed and 1500ms pause stability,
timed spawn/common kill/drop/collection/damage, real pointer selection, genuine BLUR/reward
composition, terminal races and straight/Missile/Cluster atomicity. Two Victory NEW RUN cycles,
Death RETRY and paused nonterminal native restart validate fresh bootstrap/five events and
inert stale owners/callbacks. Unmodified production preview verifies keyboard/Dash/pause,
DEV absence and local static-only network requests. HIDDEN/VISIBLE combinations remain
separately identified synthetic tracked coverage; known favicon404/bundle-size warnings only.

GAME-045 DONE; GAME-040/041 SUPERSEDED; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG.
GATE A PASSED — Runtime Foundation approved; GAME-046 DONE; GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG pending separate definition. GAME-053+ are not unlocked.

**GATE A — Runtime Foundation — PASSED**

### PHASE B — PlayerBuild / Combat / Enemy Runtime

| ID | Title | Depends on | Capability | Status |
| --- | --- | --- | --- | --- |
| GAME-046 | PlayerBuild / Slots / Effective Stats | GAME-042 | 3/1/6 build ownership and cached Effective Stats with explicit modifiers. | DONE |
| GAME-047 | Tags & Build Snapshot | GAME-046 | Tag contributions, derived identity and detached BuildSnapshot. | DONE |
| GAME-048 | Player Defense Runtime | GAME-046 | Authoritative Shield/Hull/protection and incoming-damage boundary. | DONE |
| GAME-049 | Combat Resolution & Launch Snapshots | GAME-046, GAME-048 | Attack/Hit/Damage resolution and immutable launch values. | DONE |
| GAME-050 | Enemy Definitions & Spawn Snapshots | GAME-049 | EnemyDefinition, scaling profiles and per-spawn runtime snapshots. | DONE |
| GAME-051 | Authoritative EnemyDeath Pipeline | GAME-049, GAME-050 | Exactly-once death record with last damaging / kill-source attribution for explicit XP/objective/Medical/Boss consumers and telemetry. | DONE |
| GAME-052 | Enemy Interaction + Swarm & Charger | GAME-048..051 | Enemy interaction/knockback/Decoy susceptibility plus Swarm and Charger roles. | READY |

#### GAME-046 — PlayerBuild / Slots / Effective Stats

STATUS: DONE

**Goal, dependencies and definition boundary**

Depends on GAME-042 DONE and PASSED GATE A; preserve GAME-039/043/044/045 contracts.
Implemented and verified against the acceptance contracts below.
Establish one focused run-scoped PlayerBuild authority for 3 Combat / 1 Active / 6 Core
slots, immutable Base Stats, unconditional Run Modifiers and cached Effective Stats.
GameplayScene remains the composition root and current combat/progression/presentation owner.
GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG; no later runtime domain is implemented here.

**Pre-implementation tracked-source audit and migration inventory**

Audited HEAD 15bc6002d4d58635bea4e8a2353a6fd5e9246493 after GAME-045, including all tracked
src matches for power/damage/fireRate/speed/hull/thruster/collector/combat/spatial/replication,
moduleLevels/laserRanks/missileRanks/droneRanks/effective/stat/modifier/slot/prism/cluster/twin.
Current numerical truth is in GameplayScene fields/create/acceptLevelUpChoice and concrete
launch/update methods, not a PlayerBuild/stat resolver. No shared stat/modifier/slot owner
exists. Other matches include enemy tuning, lifecycle/input state, diagnostic identities and
pure progression/geometry tests; these are not additional ship stats or build authorities.

Classification: A = migrate to shared Build authority; B = retain weapon-local tuning;
C = temporary prototype compatibility state; D = superseded target mechanics preserved
until their named cutover; E = future domain, absent now. Reinspect source before implementation.

| Actual current owner / value | Source-grounded truth | GAME-046 decision |
| --- | --- | --- |
| Scene playerMaxHealth/playerHealth, create, updateHud/damagePlayer | Max/current5 initially; HP subtraction clamps0; protection500ms; body radius20 | A: max comes only from effective Hull; current HP/protection/body stay physical Scene state (GAME-048 later) |
| movementSpeed, update/movePlayer | Normal300px/s, normalized intent, frame delta, segment bounds | A: ordinary speed reads effective Thrust; no separate mutable movementSpeed truth |
| moduleLevels.hull / Hull Plating choice | Each acceptance max+1 and current=min(newMax,current+1); no ratio/percentage heal | A/C: Build-owned exact flat compatibility bonus+1; Scene retains choice level for label and explicit Heal1 |
| moduleLevels.thruster / Thruster choice | Each acceptance normal speed+30px/s | A/C: Build-owned exact flat compatibility bonus+30; no Dash change |
| laser / laserRanks | Damage1, interval600ms, velocity1200px/s; ranks power/fireRate/speed0..2; each +1 damage, -50ms with local100ms floor, +200px/s | B: retain local values/ranks and floor; compose shared reads below, never convert local ranks into global modifiers |
| Laser projectile constants / fireLaser | Radius6, lifetime2000ms, near-zero aim suppression, currentTarget/nearest ties unchanged | B: shared physical Scale consumes radius6, Velocity consumes tuned speed; lifetime/aim/target stay local |
| missileValues / missileRanks | Damage2, speed450, explosionRadius120; warheadPower/propulsion/blastExpansion0..2 give +1/+75/+30 | B: retain local ranks/tuning; damage/speed compose shared stats, explosion radius remains local |
| missile / fireMissile/updateMissiles | Interval1800ms, physical radius8, lifetime4000ms, maxActive1; live-target homing/reacquisition/last heading | B/D: physical radius consumes Scale; cap/lifetime/homing unchanged until GAME-057 Guidance cutover |
| droneAttackValues / droneRanks | Damage1, interval1200ms, speed800; boltPower/firingSystem/boltPropulsion0..2 give +1/-150ms/+200 | B: retain ranks/values; compose Reactor/Engineering/cadence/projectile stats below |
| droneConfig / positionDrone / fireDroneFrom | Orbit110, angularSpeed2rad/s, body radius10, bolt radius5, lifetime1800ms; actual per-origin targeting | B: only bolt size/speed/damage/cadence consume shared stats; orbit/body/lifetime/targeting stay local |
| moduleLevels.collector / xpMagnetRadius | Magnet180 +40 per selection; collection20, acceleration900, max speed600 | C: unchanged XP-local compatibility, no Pickup Radius stat or slots |
| moduleLevels.combat / globalDamageMultiplier | Starts1; +0.25 each selection; common straight launch and Missile launch multiply once | C: retain legacy multiplier separately, not also Reactor; combat level still gates Prism |
| moduleLevels.spatial / effectiveMissileExplosionRadius | Local Missile radius +15*level, e.g.120/135/150; Blast1+Spatial1=165, Blast2+Spatial2=210 | C: unchanged local explosion addition, not Projectile Scale |
| moduleLevels.replication / effectiveDroneBoltRadius | Drone bolt radius5+level, e.g.5/6/7/10; no copy-count change | C: local bolt addition before shared Scale, not Engineering or a new stat; still gates Twin |
| prismEvolved / canEvolvePrismLaser / prismSpread | Laser2/2/2 + Combat>=1; three full-damage shots at0/-12/+12 degrees | D: unchanged recipe/flag/volley, one LASER slot; no extra slot/pellet scaling |
| clusterEvolved / canEvolveClusterMissile / clusterSatelliteOffsets | Missile2/2/2 + Spatial>=1; primary then six circle-union satellites, half launch damage/radius, centers at primary radius | D: unchanged legacy explosions, no satellite projectiles or shared Scale on blasts; one MISSILE slot |
| twinDroneEvolved / canEvolveTwinDrone | Drone2/2/2 + Replication>=1; one mirrored companion at angle+PI, same event and per-origin full bolts | D: unchanged recipe/copy/orbit, both instances share one COMBAT_DRONE slot; no Doctrine now |
| dashSpeed/dashDuration/dashCooldown / stepDash | Innate900px/s,200ms,3000ms; nonzero intent, lock, expiry split, no immunity | D: compatibility outside EMPTY Active slot until GAME-070; no Thrust/Fire Control/Velocity scaling |
| levelUpPool / focusedUpgrade / evolutionOffer | Nine capped weapon tracks + six repeatable passives; focus/track/evolution cursors; exactly three distinct choices | C: preserve identities/order/labels/eligibility/effects/RNG budgets; no target stat-offer pool |
| Shared stats/Active/Core/Tags/defense/combat contracts | Only target documentation exists; DevSnapshot has no build; Diagnostics records18 current choice identities only | E: add only this Build/stat/empty-slot foundation; later content/Tags/Shield/Attack systems remain absent |

Tests inspected: focusedUpgrade (17), Prism/Cluster/Twin recipes (8 each), Spatial (6),
Replication (5), evolutionOffer (24), prismSpread (7), clusterSatellites (6), Dash (6),
Scene/DevTools (71, including actual offers/ranks/terminal/RNG/pause/diagnostics), plus the
RunDiagnostics schema/observer tests. These cover concrete helpers and production paths,
not a preexisting stat resolver; new max-Hull/Thrust/composition tests are required below.

**One concrete owner, slots and public surface**

Authorize a small Phaser-free src/game/player/PlayerBuild.ts and focused pure tests
(or equally focused repository-consistent filenames). It receives no Scene, lifecycle,
Clock, input, RNG or diagnostics references. Do not put Build fields in those owners.
Keep transient current HP, protection, movement, cooldowns/targets/projectiles and prototype
weapon ranks/values/recipe flags in Scene for this first migration. Do not extract full
CombatSystemBuild/progression/runtimes or precreate directories/classes for later tasks.

Use explicit CombatSystemId = LASER | MISSILE | COMBAT_DRONE only. Detached/read-only slots:
combat is a fixed three-position tuple [LASER, MISSILE, COMBAT_DRONE] in that order;
active is one nullable position, null; cores is a fixed six-position tuple, all null.
All three current weapons remain operational from boot; firing paths consult their concrete
installed identity (small explicit membership read, no registry). Twin shares the Drone slot.
This temporary three-system prototype baseline does not implement target one-system start
selection (GAME-094), Armory (GAME-075), support types or acquisition pacing. Active remains
EMPTY despite innate Dash. No Core catalog/contribution/mechanics/replacement (GAME-077+).
No public equip/unequip/swap/recalibration or slot mutation operation is needed or authorized;
fixed tuple types and detached copies enforce capacity, without future Active/Core ID stubs.

Small typed surface equivalent to getSlots(), getBaseStats(), getRunModifiers(),
getEffectiveStats(), snapshot(), applyStatPercent(stat,delta), addCombatAnalyzerLevels(delta),
applyPrototypeHullPlating(), applyPrototypeThruster(), dispose(). snapshot returns only
{slots,baseStats,runModifiers,effectiveStats}; call it PlayerBuildReadModel, not the later
GAME-047 tag/development BuildSnapshot. No mutable arrays/objects escape. Repeated reads
return deeply detached plain JSON data, change no state/caches/timers/RNG/diagnostics.
No caller can assign bases or effective values. No source-object registry, arbitrary
property keys, callback modifiers, removable/temporary buffs, condition DSL or item framework.

**Exact ten stats, defaults and consumers**

BaseStats and EffectiveStats have exactly the following explicit numeric fields. All are
run-local; Scene uses the exact default object. Constructor may accept a copied typed
BaseStats for pure validation/testing; normal boot never substitutes balance hypotheses.

| Stat / typed key | Base | Effective meaning / GAME-046 consumer |
| --- | --- | --- |
| Hull / hull | 5 HP | Max HP only, HUD and fresh current HP; physical current HP remains in Scene |
| Thrust / thrust | 300px/s | Normal movement segment only, same normalization/clamping |
| Reactor Power / reactorPower | 1 | Shared launch damage multiplier for Laser/Prism, Missile/Cluster and Drone/Twin |
| Fire Control / fireControl | 1 | Only those three player weapon event intervals; local tuned interval divided by effective value |
| Projectile Velocity / projectileVelocity | 1 | Laser/Prism velocity, Missile travel speed, Drone/Twin bolt velocity |
| Projectile Scale / projectileScale | 1 | Physical player projectile collision AND visual radius: Laser/Prism6, Missile8, Drone/Twin(5+Replication level) |
| Engineering / engineering | 1 | Extra Combat Drone/Twin damage multiplier only; no current Laser/Missile/Guidance exception |
| Shield Systems / shieldSystems | 1 | Owned/resolved but unused: no Shield runtime until GAME-048/070 |
| Impact / impact | 1 | Owned/resolved but unused: no knockback/control implementation or damage multiplier |
| Combat Analyzer / combatAnalyzer | 0 levels | Owned/resolved but unused: no offer weighting/stat choice until GAME-055 |

No Armor/Crit/Luck/Pickup Radius/Explosion Radius/Drone Count/Dash Cooldown/Salvage,
generic attack speed, universal Area/Duration or future stat is added. BALANCE's Analyzer
~0..4 is a hypothesis, not a cap to invent here; no fake consumers for the three unused stats.

**Run modifier representation, formulas, caching and validation**

RunModifiers is an explicit structure: percent has the nine keys above excluding
combatAnalyzer, all initially0; combatAnalyzerLevels is a signed additive integer total,
initially0; prototypeHullFlat and prototypeThrustFlat are nonnegative safe-integer
compatibility totals initially0 (units HP and px/s). The latter two are NOT shared stats
or a generic flat-modifier layer. They exist only for the two inspected legacy flat choices.
PercentStatKey is the explicit nine-key union; StatKey is the ten-key union. Analyzer is
excluded from applyStatPercent; addCombatAnalyzerLevels accepts integer deltas only.

applyStatPercent uses fractional units:0.10=+10%, -0.15=-15%. Same-stat ordinary deltas
ADD into the accumulated percent; never multiply separate ordinary bonuses. For example
Reactor +0.10,+0.20,-0.15 gives base1*(1+0.15)=1.15 (normal floating-point tolerance).
No cross-stat coupling or changes to immutable base values.

Exact derivation, evaluated only at construction/successful meaningful mutation:
- Hull = base.hull * (1 + percent.hull) + prototypeHullFlat.
- Thrust = base.thrust * (1 + percent.thrust) + prototypeThrustFlat.
- Each of reactorPower/fireControl/projectileVelocity/projectileScale/engineering/
  shieldSystems/impact = that base * (1 + its percent).
- Combat Analyzer = base.combatAnalyzer + combatAnalyzerLevels (integer levels, not percent).

This explicit flat compatibility exception avoids approximating +1HP as repeatedly added
0.20 or +30px/s as0.10; such accumulation/multiplication can introduce fractional drift.
Only applyPrototypeHullPlating adds1 to prototypeHullFlat; only applyPrototypeThruster
adds30 to prototypeThrustFlat. With zero ordinary percents, repeated choices yield exactly
5+n Hull and 300+30*n Thrust within safe integer range, including long repeated sequences.
Shared percentages apply to physical BASE, then the legacy flat bonus is added. Thus a
Hull Plating choice still changes max by exactly1 even with a shared percent present.
Do not also derive/add these bonuses from Scene moduleLevels or mutate base values.

Validate exact keys/finite numeric bases and deltas (no coercion/NaN/Infinity), accumulated
modifier totals, compatibility integer additions and ALL candidate effective values before
committing any change or replacing the cache. Bounds: Hull>=1HP; Thrust>=1px/s; each of the
seven scale stats>=0.01; Fire Control additionally<=100 so the retained local100ms
Laser floor cannot produce an interval below1ms. Analyzer is a nonnegative safe integer.
Numeric magnitudes and results
must not exceed Number.MAX_SAFE_INTEGER; resulting base percentage factor must be positive.
Apply the same bounds to bases; signed percent/Analyzer modifier totals may be negative
only while the resulting values stay valid. Reject invalid keys (including percentage
Analyzer), unsupported structure, nonfinite/overflow/underflow or out-of-range results
atomically with a clear invariant Error; no clamping, partial mutation, broad catch or
arbitrary repair. These are explicit numerical safety minima, not a rebalancing pass.

Cache is derived data, never a second writable authority. A zero delta is a false/no-op;
accepted changed mutations return true and recompute once. Reads, frames, fire, snapshots,
pause and resume never recompute/build all modifier logic. Consumer-composed damage/speed/
radius/interval arithmetic must also be finite, positive and <=MAX_SAFE_INTEGER (weapon
intervals additionally>=1ms) before
creating/resetting a timer or projectile; fail loudly before that consumer mutates state.
Ordinary fractional stats/HP are not rounded; tests use tolerance for percentage arithmetic,
exact equality for the integer legacy baseline. No arbitrary max Analyzer level.

**Hull/Thrust and current reward compatibility**

Replace separately mutable Scene playerMaxHealth/movementSpeed with read-through values
from the current Build (compatibility getter names are fine); no duplicated max/speed cache.
During PREPARING, construct fresh Build before current HP initialization and first updateHud.
Fresh current HP = effective Hull. Current physical HP/protection/God Mode remain Scene-owned;
all existing damage guards, clamped loss, diagnostics and terminal rules remain unchanged.

At a valid current Hull Plating selection, apply Build's flat+1 first, then increment the
existing module level and set current HP=min(new effective max,current HP+1), refresh HUD.
No full heal/ratio heal/percent-scaled healing, and no diagnostic damage/XP/build record for
this heal. Thruster selection applies flat+30 first, then existing level increment, no Dash
change. Validate Build mutation before changing level/HP or recording selection. Scene levels
remain label/legacy eligibility history only, not numerical max-Hull/Thrust authority.

Pure Build has no lifecycle/pause policy. Scene supplies a tiny synchronous current-run/build
mutation bridge: RUNNING for internal authorized stat operations; PAUSED only for exact
current REWARD choice application. MANUAL/focus-only pause, terminal/disposed/stale callers
cannot mutate Build through Scene. Keep exact current run/presentation guards, including
REWARD+FOCUS_LOSS selection and stale/double rejection. No new public gameplay stat setters.
When an internal shared Hull modifier reduces max, Scene caps current HP at the new max;
an increase alone gives no HP. Only the inspected Hull Plating path explicitly heals1.

All current weapon-local choices retain ranks0..2, numeric increments/caps and focus/cursors.
Collector, Combat Processor, Spatial and Replication stay local/prototype, not new global
stats; preserve their module levels, labels, recipes and effects. No changes to levelUpPool,
selectChoices, XP thresholds/overflow or evolution prerequisites/arbitration. No Analyzer
choice, target stat offers, Core/Active grants, Doctrine or specialization progression.

**Concrete firing consumers and the GAME-049 boundary**

Let R/F/V/S/E be current effective Reactor/FireControl/Velocity/Scale/Engineering and
C be the retained globalDamageMultiplier (initial1,+0.25 per Combat Processor). Compose
local tuning FIRST, then legacy C exactly once, then shared multipliers exactly once:

| Current firing path | Damage | Interval ms | Travel px/s | Physical radius px |
| --- | --- | --- | --- | --- |
| fireLaser, normal or each Prism beam | laser.damage * C * R | laser.fireInterval / F | laser.projectileSpeed * V | 6 * S |
| fireMissile, primary blast | missileValues.damage * C * R | 1800 / F | missileValues.speed * V | 8 * S |
| fireDroneFrom, primary or Twin | droneAttackValues.damage * C * R * E | droneAttackValues.fireInterval / F | droneAttackValues.projectileSpeed * V | (5 + moduleLevels.replication) * S |

No Engineering on Laser/Missile, no double C/Reactor in a shared launch helper. Preserve
baseline local update arithmetic; zero shared modifiers/default scales reproduce existing
values and choices exactly. Drone/Twin each uses its actual origin and independent nearest
target; no Drone body scaling, fleet count, orbit change or targeting extraction.

Missile explosion radius remains missileValues.explosionRadius+15*Spatial level. Shared
Scale changes its physical circle/swept collision/world-exit margin only. Capture that
physical radius on the existing Missile runtime at creation and use it consistently later,
rather than rereading a mutable shared factor or the old fixed8. Straight runtimes already
store radius/velocity/damage. Preserve existing stored launch values/flags for in-flight
projectiles/Missiles when Build/local tuning later changes; do not regress them into live
per-frame stat reads. This minimal extra Missile scalar only completes the current size
consumer. No formal Attack/Hit/Damage/AttackSnapshot pipeline, resolver, source taxonomy or
new snapshot framework: GAME-046 defines where shared values come from; GAME-049 owns
formal launch snapshots/combat resolution. Existing homing/reacquisition, impact ordering,
lifetimes, cap1 and native cleanup remain as-is.

Prism keeps three full-damage beams and fixed spread. Cluster still performs the full primary
then six satellite-circle union; satellites inherit stored primary damage*0.5 and explosion
radius*0.5 with centers at the FULL stored primary explosion radius, NOT projectile
Scale/Velocity. No fragment projectiles.
Twin keeps two full Drone bolts on one event/slot. Scale affects neither explosion/Cluster
coverage nor spread/pellet counts, Drone orbit/body, player/enemy bodies or XP pickup radius.
Velocity affects neither enemy shots/movement, Dash nor XP attraction.

Keep exactly five TimerEvents. Retain a concrete handle to the existing Missile event if
needed alongside laserTimer/droneTimer; do not add an event. Construct the three player
weapon events with composed delays. Local Laser Fire Rate still updates its local interval
with max(100,old-50) then resets only its same Laser event using local/F; local Drone Firing
System subtracts150 then resets only its same Drone event using local/F. No global100ms
floor on the shared-divided interval. Missile local upgrades do not reset its event.

For a changed shared Fire Control through the internal mutation bridge, synchronously
reset exactly those three existing weapon events in place to composed intervals, elapsed0,
retaining loop and captured-owning-run callbacks. This explicit new-stat mutation policy
is not invoked by a zero-delta/no-op, other stat/legacy choice, read, pause or resume. It
adds no immediate shot/catch-up call. Preserve current Clock.paused even for a legal reward
mutation; its reset cadence progresses only on later active Clock updates. Spawn2000ms,
hostile1500ms, Warden behavior and Dash cooldown are never changed by shared Fire Control.
No per-frame cadence polling, event recreation, independent clock, timeScale or new scheduler.

**Lifetime, DEV and diagnostics contracts**

Every create: new RunLifecycle PREPARING -> captured exact Build construction/disposal
binding before HP/HUD initialization -> existing local compatibility resets/player/Drone/
initial Chaser/five events/input/presentation -> successful start -> crypto RunRandom ->
RunDiagnostics start/initial spawn -> DEV publication. Build construction makes zero draws;
no start-order change to entropy or diagnostics and no extra initial enemy/spawn record.

Capture const build from that create for shutdown/destroy; dispose idempotent and remove
its listeners. Never dispose via this.playerBuild in an old callback. All old direct Build
mutation/read/snapshot calls after disposal throw a clear invariant Error; detached earlier
snapshots remain plain data. Native scene.restart creates a new owner with zero modifiers,
exact defaults/slots and full current-HP baseline; no old state transplanted. Old saved
reward/timer/input/focus/result/API/cleanup callbacks must reject before fresh Build access,
HP change or cadence synchronization. No coupling of Build disposal into RunLifecycle.

Keep the exact five DEV commands; authorize only nested snapshot.build with
{slots,baseStats,runModifiers,effectiveStats}, deeply detached with no owner/functions,
Phaser objects, Tags, Doctrine, preview logic or mutable references. No setStat/addModifier/
equipSystem/sixth command/debug UI; internal test/harness access is not a public control.
Repeated current snapshots consume zero RNG, mutate no gameplay/timers/diagnostic history.
Old API null/false; production API absent. RunDiagnostics types/aggregates/recording stay
unchanged: no build-change rows, stat-read logs, per-frame records or build authority there.
For same seed/state/decisions/active deltas, baseline observations and RNG budgets remain
unchanged; adding snapshot.build is the only required new DEV read-model field.

**Required tracked tests for later implementation**

Preserve all309 current tests/21 files and GAME-039/042/043/044/045 assertions. Add focused
pure Build tests and actual Scene method integration, not alternate gameplay algorithms.

| Boundary | Required evidence |
| --- | --- |
| Slots/base | Exact3/1/6 lengths, stable LASER/MISSILE/COMBAT_DRONE, null Active/six null Core, exactly ten source-grounded defaults; copied constructor input and nested tuples/base data; no slot mutators/future IDs |
| Modifiers/cache | All nine percent formulas, +10%+20%=+30%, mixed bonuses/penalties, independent keys; integer Analyzer additions/subtractions, no percent Analyzer; immutable bases, no read recomputation; exact flat Hull/Thruster exception with/without percent |
| Invariants | Invalid/missing/unknown keys, nonnumbers/NaN/infinities, unsafe sums, overflow/underflow and effective minima/boundaries; entire candidate rejected with unchanged modifiers/cache; zero delta no-op, no timer reset; no effective setter |
| Lifetime/read model | All nested copies detached/serializable; snapshots stable with zero effects/draws; disposed mutations AND reads throw, idempotent disposal, fresh owner independence |
| Actual boot | Build initialized during PREPARING before HP/HUD; all3 weapons present, correct empty slots/base/zero modifiers/effective values, HP5/speed300, zero added RNG, five events, unchanged diagnostic initial Chaser/start baseline |
| Hull/Thrust choices | Actual guarded Hull choices heal exactly1/cap correctly from damaged/fractional/full HP, repeat exact5+n; Thruster exact300+30*n including long sequences; percentage combinations/base unchanged; max reduction caps only, increase alone no heal; HUD updated; normal/diagonal/bounds and Dash900/200/3000/expiry partitions unchanged |
| Laser/Prism | Existing baseline and all local ranks/cadence resets; Reactor damage, FireControl interval, Velocity and physical visual/collision radius; Prism three full shots/spread unchanged, already-launched shots retain values |
| Missile/Cluster | Baseline/local ranks/cap/homing/target loss preserved; R/F/V/S consumers, launch physical radius used consistently for collision/world exit; old/new launch values across mutation; Spatial/Blast local coverage and full Cluster primary/satellite atomicity unaffected by shared Scale |
| Drone/Twin | R*E composition with legacy C once, local upgrades/F cadence/V velocity/(5+Replication)*S body; per-origin target/full bolts, orbit/body/copy count unchanged; no extra slot/timer |
| Non-consumers | Engineering leaves Laser/Missile unchanged; FireControl leaves Dash/hostile/spawn/support unchanged; Scale does not alter blasts/spread/count/orbit/XP; Shield Systems/Impact/Analyzer have no invented runtime effects |
| Reward/pause/RNG/diagnostics | Exact current offers/labels/identities, eligibility/focus/evolution cursors/draw budgets; local compatibility remains; SELECTED before final RESUMED, composed focus retains PAUSED; stale/double/terminal cannot mutate Build; reads/additions add no diagnostics/RNG; zero-modifier diagnostic sequence regression |
| Cadence/ownership | Same five TimerEvent identities, correct composed delays at boot/local upgrade/shared FC; only FC mutation resets all3 player events, no immediate shots; zero/other modifiers do not reset; pause/resume retains phase, no stale callbacks resetting fresh events |
| Terminal/restart | First-terminal/straight/Missile/Cluster boundaries, frozen world and build, five fresh events; exact old disposal versus fresh Build/slots/modifiers/base and lifecycle/RNG/input/diagnostics/API; capture and invoke old callbacks/cleanup against fresh owner |

**Required real browser/native validation for later implementation**

1. Normal DEV root boot: RUNNING, seed/diagnostic bootstrap unchanged, correct detached build,
   all3 prototype weapons active, HP5/movement300, five existing events/five commands.
2. Real movement/input/Dash at baseline; actual current Thruster/Hull pointer selections:
   +30 normal speed, fixed Dash, +1 max/Heal1/HUD, fractional/full/damaged HP semantics.
   Current three-choice presentation/order, weapon tuning and exact Reward budget retained.
3. Actual Laser/Missile/Drone paths before/after controlled INTERNAL shared modifiers:
   Reactor, FireControl intervals/reset policy, Velocity/Scale visual AND collision behavior,
   Engineering Drone-only. No public mutation API. Verify legacy C once, Spatial/Replication
   composition, unchanged enemy fire/cap/homing and non-consumers. Same seed/decision/delta
   zero-modifier scenario reproduces current gameplay/diagnostics, reads draw0/mutate0.
4. Real Prism/Cluster/Twin evolution selections and attacks remain functional, with correct
   recipes/cursors, full volleys/atomic explosions/companion targeting and no new slot/timer.
5. Real manual/reward/focus pause composition and terminal Death/Victory freeze with no
   unrequested Build mutation; capture five TimerEvent phases, meaningful paused wall time,
   resume without reset/catch-up. Actual browser BLUR is distinct from synthetic HIDDEN tests.
6. At least TWO Victory -> actual NEW RUN, ONE Death -> actual RETRY and ONE nonterminal
   native restart (include PAUSED to retain Clock regression). EACH old Build disposed, old
   reads/mutations throw, fresh owner/defaults/zero modifiers/3 full Combat/empty Active/Core,
   full HP/current compatibility baseline, fresh lifecycle/RNG/input/diagnostics/API,
   unpaused Clock and five fresh events. Saved old callbacks cannot mutate fresh Build,
   synchronize fresh timers, alter HP or draw fresh RNG. Reload/manual create is not proof.
7. Unmodified production preview boots, movement/Space/pause/current combat still work,
   DEV absent and no Build debug UI. Inspect console; separate known favicon404 and bundle
   >500kB warnings from new errors. Report tracked/synthetic/actual native evidence honestly;
   these checks are future requirements, not runtime claims in this definition handoff.

**Scope exclusions and historical definition/implementation handoff rules**

No Tags/contributions/full BuildSnapshot (GAME-047), Shield/defense (048), formal Attack/
Hit/Damage/Launch Snapshot (049), EnemyDefinition/death pipeline (050/051), new XP/reward
transaction/generator/Analyzer weighting (053..055), target weapon tuning/specialization
cutovers (056..059), Active (070), Core catalog/replacement/events (077+), Doctrine,
Director/World, Build Screen (097), starting-system selection (094) or acquisition pacing.
No callbacks/conditions/per-target/close-range/shield-break/specialization multipliers,
status framework, temporary durations, Core sources, generic inventory, ECS, RunContext,
DI/service locator/event bus/plugin framework, networking/save/profile or dependencies.

Now modify only TASK_GRAPH: GAME-046 BACKLOG->READY and current roadmap consistency.
Run npm run check and git diff --check; verify only docs/TASK_GRAPH.md modified; stage it
explicitly, inspect complete cached diff, run cached check/stat and create ignored
.codex-review/GAME-046-review.txt with branch/base, inventory/contracts and complete staged
diff under AGENTS.md. Never stage the packet or commit. No runtime/tests or other docs
(CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/GAME_DESIGN/CONTENT_MANIFEST/BALANCE) change now.
After successful separately authorized implementation/validation, GAME-046 may become DONE;
update only factual CURRENT_STATE/PROJECT_GRAPH ownership then, without architectural rewrite.
GAME-047+ remain BACKLOG pending separate definition/review. GAME-042/043/044/045 stay DONE,
GAME-040/041 SUPERSEDED. GATE A remains PASSED; do not create/close a new Gate or pass GATE B.

**GAME-046 implementation completion evidence**

PlayerBuild owns exact Combat3/Active1/Core6 bootstrap, ten immutable bases, nine additive
fractional percentages, integer Analyzer and only two legacy flat bonuses. Effective cache
recomputes after accepted changes; invalid numeric/key/minimum/overflow mutations reject
atomically, snapshots detach deeply and disposed reads/mutations throw. Scene constructs
Build in PREPARING before HP/HUD with exact-owner cleanup. Max Hull/normal speed are derived
getters; Hull Plating/Thruster preserve exact+1 capped Heal1/+30, keeping physical HP local.
R/F/V/S/E consume current weapon values with legacy Combat Processor once; Missile stores
physical radius. Same three player events reset in place on actual shared FireControl change,
local cadence choices reset only their own event, reads/pause/no-op reset none. No extra timer,
Tags/Shield/Impact/Analyzer behavior, generic inventory/modifiers or Attack architecture.

npm run check passes367 tests/22 files: all309 prior cases plus34 pure Build and24 Scene.
Real Chrome verifies pointer Hull/Thruster/legacy choices, shared modifier composition and
scaled physical collisions, Prism/Cluster/Twin, Clock phases, genuine browser BLUR and
unchanged diagnostics/RNG. Two Victory NEW RUN cycles, Death RETRY and paused nonterminal
native restart confirm fresh exact Build/slots/defaults/zero modifiers and five fresh events;
old reads/mutations/callbacks remain inert. Extra Missile/Cluster terminal cycles pass.
Unmodified production preview passes keyboard/Dash/pause/current combat and DEV absence.
Known favicon404 and Vite bundle-size warnings only. CURRENT_STATE and PROJECT_GRAPH reflect
actual implemented ownership; no dependencies changed. GATE A remains PASSED; GAME-046 DONE;
GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG. GATE B PASSED — Modern Combat on Legacy Spawning architect-approved.

#### GAME-047 — Tags & Build Snapshot

STATUS: DONE

**Goal, dependencies and definition boundary**

Depends on GAME-046 DONE; preserve GAME-039/042/043/044/045/046 contracts and PASSED GATE A.
Extend the existing Phaser-free PlayerBuild with twelve numeric Tag totals, derived build
identity and one canonical detached BuildSnapshot. Tags describe the build in parallel to
stats; they never supply combat multipliers. Implemented and verified against the contracts
below. GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG; GATE B PASSED.

**Authoritative design and current source audit**

Audited HEAD fdf3aef88b6fd49dbf34fa0b5a9daf5004a5dc39 after GAME-046. Read TASK_GRAPH,
CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH, CONTENT_MANIFEST and BALANCE in full;
searched docs/src for tag/tags, contribution, identity, dominant, secondary, maturity,
synergy, Analyzer, eligibility, weighting, BuildSnapshot and PlayerBuildReadModel.

| Source / anchor | Finding and GAME-047 constraint |
| --- | --- |
| GAME_DESIGN: Tags and build identity; Combat Systems; Combat System progression | Exactly twelve names, additive points/levels, dynamic identity and conceptual bands; future selected starting system has a small tilt, without exact tag IDs/amounts per starting system. Named specialization tag associations describe future content, not current prototype contributions. Tags never directly multiply stats, block/auto-select weapon branches or revoke acquired development after loss |
| CONTENT_MANIFEST: Build and progression; Exact twelve Core Items; OBSOLETE / SUPERSEDED | Future Core identities have approved tag associations (e.g. Overclocked Reactor Technology/Rapid Fire, Bulkheads Survival), without exact point amounts. Target one-system start and Core catalog are absent now; Prism/Cluster/Twin are prototype references only |
| BALANCE: Build and stat tuning boundaries; Difficulty influence | No fractional point requirement or concrete prototype mapping. Bands 0–1 interest / 2–3 secondary / 4+ primary / 6+ deep are tuning hypotheses, not identity tiers or a maturity formula. Structural difficulty influence is later and hard-bounded |
| ARCHITECTURE: Tags and BuildSnapshot; Player Runtime versus PlayerBuild; Rewards; Director | PlayerBuild owns contributions/derived tags; detached snapshots serve readers. Rewards owns future relevance/Analyzer weights; Director owns future pressure. No exact current-content point matrix or maturity formula is supplied |
| src/game/player/PlayerBuild.ts | Sole Build owner: fixed slots, immutable ten bases, explicit RunModifiers, cached EffectiveStats; snapshot currently returns four-field PlayerBuildReadModel. No Tag authority, contributions, identity or full BuildSnapshot exists |
| PlayerBuild.test.ts | 34 pure cases protect slots/defaults, percentages/flat bonuses/Analyzer, validation/atomicity, deep copies and disposed invariants. Preserve them |
| GameplayScene.create / disposeBuild | Fresh const build during PREPARING before HP/HUD; exact captured shutdown/destroy disposal already handles its lifetime. All three prototype Combat slots occupied, Active null, six Core null |
| GameplayScene.applyBuildChange / acceptLevelUpChoice | Only production Build mutations are applyPrototypeHullPlating and applyPrototypeThruster through exact run/build/current REWARD guards. Private percent bridge calls applyStatPercent for internal use/tests; addCombatAnalyzerLevels has pure/Scene test callers only. Other current choices retain Scene-local ranks/values/flags |
| GameplayScene.LevelUpChoice / levelUpPool / enterLevelUpPause | Nine weapon tracks, six passives and Prism/Cluster/Twin; focused/passive/open arbitration with explicit Reward RNG. No authored Tag points or tag-based eligibility/weights |
| src/game/devTools.ts / GameplayScene.publishDevTools | PlayerBuildReadModel is consumed as DevSnapshot.build; Scene forwards playerBuild.snapshot(). Five commands only. No narrower current consumer justifies retaining that old snapshot type |
| PROJECT_GRAPH / CURRENT_STATE / tracked src | Build ownership and 367 tests/22 files are implemented facts. Other identity matches are run/choice/enemy identity, not Tags; no content-tag source registry or maturity implementation exists |

**Current prototype contribution decision: explicitly none**

No authoritative exact tag-point mapping exists for LASER, MISSILE, COMBAT_DRONE, any of
their nine current tuning upgrades, Hull Plating, Thruster Module, Collector Field, Combat
Processor, Spatial Amplifier, Replication Matrix, Prism Laser, Cluster Missile or Twin Drone.
Do not infer points from names, future specialization/Core associations, occupied slots,
weapon focus, numeric stats or the target starting-system tilt. All twelve totals start at0;
current boot, offer generation and accepted current Level-Up/evolution choices add ZERO.
They also preserve any points supplied through internal tests without changing them.
Later scoped target-content tasks must author exact sources/amounts before wiring them.
There is no production Scene contribution call site to add in GAME-047; create and
acceptLevelUpChoice remain neutrality/regression anchors, not mapping insertion points.

**Exact identities, canonical order and numeric domain**

Define one explicit TagId literal union, preferably derived from one immutable TAG_IDS
tuple, in exactly this order:

```text
PRECISION, RAPID_FIRE, CLOSE_COMBAT, PROJECTILES, EXPLOSIONS, DRONES,
TECHNOLOGY, SHIELDS, CONTROL, MOBILITY, SUPPORT, SURVIVAL
```

Reuse that canonical order for all twelve-field point copies, identity ties, snapshots and
tests; no runtime alphabetical sort, installation order, incidental object enumeration or
random tie breaking. No additional DAMAGE/OFFENSE/DEFENSE/LASER/MISSILE/BOSS/CRIT/AREA/ECONOMY
or arbitrary string tag. UI display names may differ later; runtime IDs remain stable.
TagPoints = Record<TagId, number>, with exactly these twelve own fields, initially all0.
This is numeric accumulation, never Set<TagId>, booleans or a hasTag-only contract.
Every amount and total is a nonnegative safe integer; zero is allowed. No fractional
requirement exists in the authoritative design, so fractional/negative points are invalid.
Two DRONES contributions +1 and +2 produce3; different fields remain independent.

**Existing owner, concrete mutation and independent derivation**

Extend src/game/player/PlayerBuild.ts only as the Build authority; no TagManager,
BuildIdentityManager, global registry, event bus, separate run owner or new dependency.
Retain existing stat/slot APIs, defaults, formulas, validation, caching and disposal policy.
Add one concrete typed mutation: addTagPoints(tag: TagId, amount: number): boolean.
No source IDs/handles, grouped transactions, removal/reversal, temporary buffs/durations,
metadata bags, arbitrary callbacks, tag query language or universal effect framework.
Current contributions are permanent; no removal consumer exists. Later Core replacement
must define its own scoped removal/application contract before implementing that behavior.

On every call assert the existing live-Build invariant first. Validate exact supported
TagId membership (including for zero) and typeof amount === number, nonnegative safe
integer amount, and safe integer candidate total before any state change. Invalid IDs,
nonnumbers, NaN, both infinities, negatives, fractions or overflow throw a clear RangeError,
consistent with existing numeric invariants. No coercion, rounding, clamping or broad catch.
Valid zero returns false with no mutation; valid positive accepted addition returns true.
An invalid candidate leaves the entire points/identity/stat snapshot unchanged.

Store Tag totals as authority. Cache identity as derived data, initialized empty and
recomputed only on accepted positive Tag mutation. Prepare the candidate totals/identity
before committing either; rejected/no-op contributions leave both unchanged. No independent
identity setter, dirty-flag framework or second writable identity truth. Tag mutation never
calls the EffectiveStats resolver/commit; stat/Analyzer mutations never derive identity.
Reads return copies of already-derived data without sorting/deriving every frame/read.

BuildIdentity = { dominantTags: TagId[]; secondaryTags: TagId[] } with exact semantics:

- Consider only totals >0; dominantTags contains EVERY tag tied at the highest positive score.
- secondaryTags contains EVERY tag tied at the next DISTINCT positive score, if any.
- No positive totals means both arrays empty; one positive score tier means secondary empty.
- Each array follows TAG_IDS order, irrespective of contribution arrival order. No tag can
  occupy both arrays. Lower positive tiers remain visible in totals but not these arrays.
- Adding points may change either tier; derive from current totals without permanent classes.
  Analyzer, stats and conceptual balance bands do not determine or break ties.

For example DRONES3/TECHNOLOGY3/MOBILITY2/SURVIVAL1 gives dominant [DRONES, TECHNOLOGY],
secondary [MOBILITY]. Raising SURVIVAL to4 gives dominant [SURVIVAL], secondary
[DRONES, TECHNOLOGY]. All twelve at0 gives []/[]. No threshold/maturity level is added.

**One canonical BuildSnapshot and DEV migration**

Replace the GAME-046 PlayerBuildReadModel export with BuildSnapshot; audit and migrate all
its actual type consumers. No current narrower consumer warrants keeping an alias/type.
PlayerBuild.snapshot(): BuildSnapshot is the only public whole-build snapshot operation;
retain existing narrow stat/slot getters, but add no overlapping buildSnapshot() or
identitySnapshot() truth. Exact shape for the currently owned Build data:

```typescript
type BuildSnapshot = {
  slots: BuildSlots;
  baseStats: BaseStats;
  runModifiers: RunModifiers;
  effectiveStats: EffectiveStats;
  tags: TagPoints;
  identity: { dominantTags: TagId[]; secondaryTags: TagId[] };
};
```

Preserve all four GAME-046 fields and their exact nested schemas, including Analyzer in
base/effective stats and combatAnalyzerLevels in runModifiers. slots retains exactly
[LASER,MISSILE,COMBAT_DRONE], null Active and six null Core positions. tags copies all
twelve numeric fields in canonical order; identity copies both arrays. No Maps/Sets/classes,
functions, owner/Scene/Phaser references, lifecycle/RNG/diagnostics, current HP, XP/level,
enemies, timers or pause reasons belong in BuildSnapshot. Do not migrate Scene-local
weapon ranks/development or precreate Doctrine/Active/Core mechanics merely to fill future
target fields; future scoped owners can extend the canonical snapshot when implemented.

Every read produces plain JSON-serializable deeply detached data. Mutating any returned
tag field, identity array, slot tuple, base/effective stat or nested modifier cannot affect
PlayerBuild, cached identity, earlier/later independent snapshots or live gameplay.
Repeated reads mutate no state/cache and consume zero RNG/diagnostics/timer work.
DevSnapshot.build becomes BuildSnapshot, forwarded by existing playerBuild.snapshot().
Add Tag/identity data ONLY there; no top-level snapshot.tags/buildIdentity or second owner.
Keep exactly snapshot/forceLevelUp/spawnWarden/setWardenHealth/setGodMode. No addTag/setTag/
setIdentity/setDominant command, debug UI/global owner or production API. Old API remains
null/false after invalidation; production window.__NEBULA_DEV__ stays absent.

**Separation, gameplay neutrality and future consumer boundaries**

Tags describe identity and future eligibility/offer weights/thresholds/synergy/UI; they are
not numeric combat stats. No PROJECTILES->damage, SURVIVAL->Hull or MOBILITY->Thrust mapping.
Never reverse-infer tags from high Velocity/FireControl/Hull/Engineering or other stats.
Changing Tags leaves baseStats/runModifiers/effectiveStats byte-for-byte unchanged;
stat/flat/Analyzer changes leave Tags/identity unchanged. Analyzer remains GAME-046's
numeric shared stat, visible in the same snapshot fields; it adds no points, breaks no
identity tie, filters no Tag visibility and changes no offers in GAME-047.

No Build Maturity formula is defined by these sources for GAME-047. Difficulty must not
use raw sum(tagPoints); no powerScore/buildPower/gearScore/combatRating/threatScore.
Director pressure/structural maturity remains GAME-062+, Reward Generator/Analyzer
weighting/pity/recent offers remains GAME-054/055, authored weapon specialization remains
GAME-056..059, Active mechanics GAME-070+, Core sources/mechanics GAME-077+, Doctrine
GAME-084+ and Build Screen GAME-097. No behavior from those consumers is implemented here.

At fresh zero points AND internally supplied nonzero points, preserve HP/Hull/Thrust,
movement/Dash, Laser/Missile/Drone launch values and shared stat composition, Fire Control,
Prism/Cluster/Twin, current rewards/choices/order/eligibility/focus/cursors, XP, enemy
spawning/cap/Warden/difficulty, pause/input and terminal atomicity. No launch consumes Tags.
Keep RunLifecycle, RunRandom, KeyboardInput and RunDiagnostics implementations unchanged.
Tag add/identity/read/snapshot use ZERO Encounter/Reward/World/Boss draws. Preserve exact
GAME-043 offer/spawn draw budgets. Diagnostics stays six semantic record types with no
TAG_CHANGED/IDENTITY_CHANGED/BUILD_SNAPSHOT rows, counters or snapshot side effects.
Keep exactly five existing TimerEvents and their identities/delays/elapsed phases; Tag
mutation/read never resets one, fires immediately, adds polling/clock/timeScale or schedules.
Existing selected local cadence/shared Fire Control effects remain their own unchanged rules.

**Lifetime and fresh native restart**

Tags live inside the existing fresh PlayerBuild constructed in PREPARING before HP/HUD.
No new owner, shutdown listener, boot entropy, startup reorder or cleanup system is needed.
The current exact captured const build disposal handles all Tag state idempotently.
After disposal addTagPoints (even zero) and snapshot/any Build read throw the same
disposed-PlayerBuild invariant; earlier detached snapshots remain usable plain data.
Each native create gets a different Build identity with all twelve totals0 and empty
dominant/secondary arrays; no old points/cache survive. Exact old cleanup must not dispose
fresh Build. Saved old timer/input/focus/reward/result/API callbacks cannot mutate fresh
Tags or redirect through a global current Build. Pure Build has no lifecycle policy;
current Scene ownership/transaction guards remain intact with no production Tag callers.

**Required tracked tests for separately authorized implementation**

Preserve all367 pre-GAME-047 tests/22 files, including34 pure Build and95 Scene cases;
add meaningful pure PlayerBuild tests and real Scene method integration without parallel
fake progression/gameplay algorithms. Type migration must preserve existing assertions.

| Boundary | Required evidence |
| --- | --- |
| Exact set/baseline | Exactly12 TagIds and canonical order, twelve own zero fields, no arbitrary unknown tag; fresh defaults/slots/modifiers/effective values retained |
| Contributions | One amount, repeated same-tag +1/+2=3, independent tags; valid zero false; invalid ID including prototype-like keys; nonnumbers/NaN/infinities/negative/fraction/unsafe amount; max-safe accepted then overflow throws; entire snapshot unchanged after every rejection/no-op |
| Identity | No positives, one positive tag, one tier with several ties, two tiers, >=3 tiers, tied dominant and tied secondary, canonical order despite reversed arrival; additions change identity; no separate setter and returned arrays cannot mutate authority |
| Independent caches/stats | All base/modifier/effective fields unchanged by Tag additions (including nonzero); stats/legacy flats/Analyzer never change Tags/identity; Tag work never invokes stat recomputation, stat work never recomputes identity; repeated reads do neither |
| Snapshot | Canonical BuildSnapshot includes all existing fields plus exactly12 totals/two identity arrays; all nested arrays/objects detached from owner and independent reads; JSON roundtrip; repeated snapshots stable/no state/cache side effects |
| Pure lifetime | All disposed Tag mutation/read/snapshot attempts throw the existing invariant, even zero; idempotent disposal; independent fresh Build resets all points/identity |
| Scene boot/DEV | PREPARING Build and same slots/stats/modifiers/HP, all Tags0/identity[]; five actual timers and five exact commands, unchanged seed/initial diagnostics; DevSnapshot.build canonical/detached, no top-level duplicates or new commands |
| Actual gameplay/timers | Baseline movement/Hull/Dash/weapon composition and current launch values unchanged at0 and internally nonzero Tags; same five events/delays/elapsed, zero reset calls from Tag mutation/read; no Tags consulted by projectiles |
| Current progression | All nine weapon upgrade identities, all six passives and Prism/Cluster/Twin accepted through existing production choice paths leave Tags/identity at baseline (and preserve internally injected nonzero values). Offers/snapshots/stale/double/rejected choices contribute zero; order/cursors/Reward budgets unchanged |
| Isolation/pause | Spy all four streams: Tag add/identity/read/snapshot draw0; diagnostics snapshot unchanged, no extra records/counters; manual/reward/focus pause state and same-event phases unchanged apart from existing accepted gameplay effects |
| Scene lifetime/terminal | Existing first-terminal and attack cleanup boundaries retained; restart fresh Build/all-zero tags/empty identity, fresh lifecycle/RNG/input/diagnostics/API and five events; disposed old Build throws, captured old callbacks/cleanup cannot modify fresh Tags or draw fresh RNG |

**Required real browser/native validation for separately authorized implementation**

1. Ordinary DEV boot: current gameplay, slots/stats/modifiers, zero Tags/empty identity in
   canonical snapshot.build, five observed TimerEvents and exact five-command API.
2. Repeated actual DEV snapshots stable; mutate returned nested tag fields/identity arrays
   (also exercise nonempty identity via ignored internal harness), prove later snapshots
   unchanged. Reads produce no gameplay, four-stream, diagnostics or timer effects.
3. Real W/Space/Escape, Hull/Thruster and current Level-Up pointer choices, Laser/Missile/
   Drone and actual Prism/Cluster/Twin remain GAME-046-compatible. Choices never add Tags;
   no authorized current production mapping exists. Use ignored INTERNAL harness only to
   exercise nonzero addTagPoints/identity/neutrality/invalid atomicity, never new controls.
4. Real manual/reward/focus pause composition, meaningful wall-time five-phase freeze,
   explicit resume and genuine browser BLUR retain GAME-044 behavior and Tag state. Separate
   synthetic HIDDEN/VISIBLE coverage from actual browser focus evidence. No Tag-triggered
   timer reset, diagnostic entry or RNG draw; ordinary gameplay observations remain valid.
5. At least TWO actual Victory -> NEW RUN, ONE Death -> RETRY and ONE PAUSED nonterminal
   native scene.restart. Dirty old Tags through internal harness before restart. After EACH:
   old Build disposed and direct reads/mutations throw; fresh owner/all twelve0/identity[];
   fresh slots/stats/zero modifiers, lifecycle/RNG/input/diagnostics/API/five events and
   unpaused fresh Clock. Saved old callbacks/cleanup cannot mutate fresh Tags or other
   owners. Page reload, manual create or fixture recreation is not native restart evidence.
6. Unmodified production preview: normal gameplay/keyboard/Dash/pause/current combat,
   DEV API absent and no Tag debug UI. Inspect console, distinguish known favicon404 and
   Vite >500kB bundle warning from new errors. Report tracked/internal/ordinary boot/actual
   native evidence separately; this definition makes no new runtime verification claim.

**Scope exclusions and historical definition/implementation handoff rules**

No GAME-048 defense, GAME-049 Attack/Hit/Damage snapshots, EnemyDefinition/death migration,
reward generation/Analyzer/pity, Director/maturity/difficulty, Core/Active catalogs or
mechanics, specialization/Doctrine, Build Screen, source registry, effect callbacks,
conditional tag effects/stat formulas/damage, generic content framework or new dependency.

For this definition change only TASK_GRAPH: GAME-047 BACKLOG->READY and necessary current
roadmap/status wording. GAME-046 stays DONE; GAME-040/041 SUPERSEDED; GAME-048+ BACKLOG;
GATE A PASSED, GATE B unchanged/not passed. Preserve historical definition instructions.
Run npm run check and git diff --check; verify only docs/TASK_GRAPH.md changed; stage that
explicit path only. Inspect complete git diff --cached, run cached check/stat, and create
ignored .codex-review/GAME-047-review.txt with AGENTS.md sections, source audit and contracts,
required future tests/native checks, gate/status facts and FULL staged diff. Never stage
the packet or commit. CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/GAME_DESIGN/CONTENT_MANIFEST/
BALANCE/runtime/tests/config/dependencies remain unchanged now.
Only successful separately authorized implementation and required tracked/native validation
may move GAME-047 READY->DONE and update factual CURRENT_STATE/PROJECT_GRAPH exports/
ownership/consumers. ARCHITECTURE normally stays unchanged. GAME-048+ remain BACKLOG and
GATE B requires its actual phase prerequisites and review; GAME-047 alone cannot pass it.

**GAME-047 implementation completion evidence**

PlayerBuild now exports immutable canonical TAG_IDS and derived TagId, TagPoints,
BuildIdentity and BuildSnapshot. Twelve integer totals start0, with no current prototype
contribution source. addTagPoints asserts live first, validates ID even at0, rejects
invalid amounts/overflow atomically, returns false for valid0 and true for accepted
positive additions. Candidate totals and top-two distinct positive score tiers commit
together; ties follow canonical order. Separate cached identity/stat derivation paths
prevent cross-domain recomputation. snapshot() deeply copies all four existing fields
plus tags/identity; DevSnapshot.build uses that canonical type, with no old alias or new
command. GameplayScene runtime, lifecycle/input/RNG/diagnostics and five events are unchanged.
No stat/Analyzer/reward/maturity/difficulty behavior or dependencies were added.

npm run check passes424 tests/22 files, preserving all367 prior cases with18 pure and39
Scene additions (52 pure Build /134 Scene total). Tracked coverage includes all18 current
choice identities at both zero and nonzero Tags, exact RNG budgets, atomic validation,
cache separation, copies, five real Clock events and captured old callback/disposal guards.
Real Chrome confirms ordinary DEV zero baseline, exact internal nonzero identity/pivot,
deep detachment, zero added draws/diagnostics/timer resets and unchanged launch values.
All9 weapon upgrades, all6 passives and Prism/Cluster/Twin were accepted through actual
browser pointer input without changing injected Tags; evolved attacks remain functional.
Actual browser BLUR/manual/reward composition and two Victory NEW RUN cycles, Death RETRY
and paused nonterminal native restart retain fresh Build/twelve0/empty identity, existing
owners/API/five events and unpaused Clock; old direct additions (including0)/reads throw
and saved callbacks remain inert. Additional Missile/Cluster native cycles pass.
Unmodified production preview retains W/Space/Escape/current combat, no DEV API/debug UI
and no new pageerrors. Known favicon404 and Vite bundle-size warning only. Factual
CURRENT_STATE/PROJECT_GRAPH updated. GAME-047 DONE; GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ BACKLOG; GAME-040/041
SUPERSEDED; GATE A PASSED; GATE B PASSED. No commit created.

#### GAME-048 — Player Defense Runtime

STATUS: DONE

**Goal, dependencies and definition boundary**

Depends on GAME-046 DONE; preserve GAME-047 DONE and GAME-039/042/043/044/045 contracts.
GATE A remains PASSED. Introduce one focused run-scoped PlayerDefense owning current Hull,
current Shield and damage protection, with Shield-first numeric incoming damage, Hull
healing/capping and the explicit contact separation below. Scene remains composition root,
collision/presentation/lifecycle adapter; PlayerBuild remains maximum-Hull authority.
GAME-048 implementation is complete; the approved contracts and pre-implementation audit follow.
GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ remain BACKLOG; GATE B PASSED.

**Pre-implementation defense source inventory and authoritative design audit**

Audit baseline: HEAD 0cc50ab5d83c1c58a88f4a69dbbcfaffa6405d5a after GAME-047.
Reviewed the complete TASK_GRAPH, CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH,
CONTENT_MANIFEST and BALANCE context, including GAME-047's implemented changes. Searched
tracked docs/src for playerHealth/playerMaxHealth/playerDamageProtection, protection,
damagePlayer/contactDamage/God Mode, Shield/Shield Systems, healing/overheal/death,
hostile projectiles and alpha/protection feedback. Reinspect these anchors before coding.

| Actual current owner / anchor | Factual behavior and migration constraint |
| --- | --- |
| GameplayScene.playerHealth / create | Independent mutable current HP; initialized from playerMaxHealth (5 at fresh Build). Move all writes to Defense, not a second Scene cache |
| playerMaxHealth / PlayerBuild.getEffectiveStats().hull | Derived maximum; base5, explicit flat Hull Plating+1 after base percentages. Build validates Hull>=1 and magnitude<=MAX_SAFE_INTEGER; no independent mutable maximum in Defense |
| playerDamageProtectionDuration / playerDamageProtectionRemaining | Scene constant500ms and mutable remainder0. Move the remainder and fixed duration arithmetic to Defense; do not keep a writable Scene mirror |
| update / updatePlayerProtection | Active update guards first, diagnostics.advance(delta), movement/Dash, Drone/enemies/targeting, then protection countdown, straight shots, Missiles, contact, XP. Countdown max(0,remaining-delta); positive retains feedback, zero restores alpha1. Preserve this phase, not an earlier/later new clock |
| damagePlayer | Reject non-RUNNING, missing player/HP0, DEV God Mode, then protection. Subtract/clamp HP, observe positive actual HP loss, refresh HUD, set protection500 and alpha0.5, then enterPlayerDeath if HP0. Lethal terminal therefore retains protection500 and ends with alpha0.25 |
| updatePlayerContact / EnemyRuntime | First inclusive circle contact in enemies collection order, at most one attempt/frame; regular contact1, Elite Tank/Warden2. Existing protection early return prevents contact scanning; there is no separation. Explicitly replace that early return for geometry as specified below, preserving damage rejection |
| playerRadius / enemyRadius / createEnemy | Player20, regular Chaser/Shooter/Tank including Elite24, Warden40; combined contact radii44/60. Enemy margin max(25,enemy radius). No Ship Impact or global contact knockback exists |
| movePlayer / create player / arena | Player movement clamps x by width/2+lineWidth/2, y by height/2+lineWidth/2 in arena4800x2700; current visual40x48 with outline2 gives margins21/25. Contact runs after player and enemy movement, after attacks; do not reorder simulation |
| updateProjectiles / launchHostileProjectile | Reverse iteration, swept segment-circle against player20+shot radius6; current hostile damage1. Calls damagePlayer then destroys/splices the colliding shot even on God/protection rejection and after lethal damage; no Defense ownership of projectile lifetime |
| applyBuildChange | Exact current run/build guard; shared percent changes require RUNNING, legacy Hull/Thruster require exact current PAUSED/REWARD/text. Shared Hull change caps current HP to new max, never heals an increase; invalid Build mutation changes no HP |
| acceptLevelUpChoice / Hull Plating | Guard -> successful Build flat+1 -> module level+1 -> current=min(newMax,current+1) -> HUD -> selected diagnostics -> destroy UI/release REWARD. Exact full/damaged/fractional arithmetic and stale/double rejection must survive |
| updateHud / publishDevTools / devTools.ts | HUD HP current/max reads Scene HP/Build max. DEV snapshot exposes playerHealth and protectionRemaining, plus canonical build.effectiveStats.hull; five commands only, God Mode outside Build, production API absent |
| RunDiagnostics.recordPlayerDamage | Positive actual clamped Hull loss increments hpLost and acceptedDamagingHits once; no damage timeline row. Shield fields do not exist. God/protection/pause reject0, healing/capping record0, lethal loss precedes TERMINAL |
| enterPlayerDeath / enterRunVictory / native controls | RunLifecycle accepts first terminal; Death records terminal, clears input, alpha0.25 and SHIP DESTROYED/RETRY. Native scene.restart recreates all owners/events; straight cleanup/full Missile-Cluster detonation still precede Victory |
| create / captured disposal | PREPARING lifecycle -> fresh Build before HP/HUD -> player/initial Chaser/five events/input/UI -> successful start -> crypto RunRandom -> RunDiagnostics bootstrap -> DEV. Each owner cleanup captures its exact const and removes its own listeners |
| PlayerBuild Shield Systems / BuildSnapshot / Tags | shieldSystems base/effective1, owned/resolved but no current consumer. Build owns stats/modifiers/twelve Tags/identity, never transient Hull/Shield/protection. No Shield source, capacity, recharge or regeneration exists |
| GameplayScene.devTools.test.ts / PlayerBuild.test.ts / RunDiagnostics.test.ts | 424 tests/22 files, including52 pure Build/134 Scene. Current fixtures assign HP/protection directly; migrate setup to real Defense state/operations, retaining assertions. The old God-contact x-unchanged assertion is superseded only by the explicit separation contract |

ARCHITECTURE Player defense and GAME_DESIGN Damage/Shield/healing require God Mode before
protection, Shield before Hull, overflow, protection on Shield OR Hull loss, capped healing
and contact escape separation. Neither assigns a pixel push magnitude. CONTENT_MANIFEST
places Shield Active/Core/Shield Capacitor/Medical content in later scoped work; BALANCE
does not supply a current Shield capacity/regeneration/scaling formula. Those are not
authorization to invent a production source. The geometry below is an explicit minimal
overlap-resolution decision for architect review, derived from current radii and bounds.

**One owner, exact API and numeric contracts**

Authorize focused Phaser-free src/game/player/PlayerDefense.ts and pure tests for later
implementation. Mutable gameplay state is exactly currentHull, currentShield and
protectionRemaining. No Scene/Build/RunLifecycle/Clock/RNG/diagnostics/input references,
maxHull cache, God Mode flag, public property setters or generic health/effect framework.
Replace independent Scene playerHealth/playerDamageProtectionRemaining fields with reads
from this owner; read-only compatibility getters are acceptable, never writable aliases.
playerMaxHealth stays derived from PlayerBuild. Keep position/collision/separation in Scene.

Pin this concrete surface (no overlapping snapshots or generic mutate/effect API):

```typescript
type PlayerDefenseSnapshot = {
  currentHull: number; currentShield: number; protectionRemaining: number;
};
type IncomingDefenseResult = {
  accepted: boolean; protectionRejected: boolean;
  shieldLost: number; hullLost: number; hullDepleted: boolean;
};
// PlayerDefense operations:
declare class PlayerDefense {
  constructor(initialHull: number);
  snapshot(): PlayerDefenseSnapshot;
  advanceProtection(delta: number): void;
  applyIncomingDamage(amount: number): IncomingDefenseResult;
  healHull(amount: number, maxHull: number): number; // Actual positive Hull gained, else0.
  reconcileMaxHull(maxHull: number): void;
  setCurrentShield(value: number): void;
  dispose(): void;
}
```

initialHull is a copied numeric current value, >=1 and <=Number.MAX_SAFE_INTEGER, finite;
normal Scene passes Build effective Hull5, with Shield0/protection0. It is not a stored
maximum. Current Hull/Shield remain finite 0..MAX_SAFE_INTEGER with fractions allowed.
setCurrentShield accepts that same Shield range as raw replacement, changes no Hull or
protection, and adds no capacity/stacking/regen/recharge semantics. It has NO production
caller in GAME-048: pure tests/ignored internal Scene harnesses alone set nonzero Shield.
No sixth DEV command, starting Shield, pickup, Shield Active or Core mechanic is authorized.
Shield Systems remains owned by Build and unused; no automatic multiplier, derived start
Shield or fake consumer. Fixed-strength world Shield may later have authored independent
rules; later Active/Core/permanent sources must separately define capacity/scaling.

Every read/mutation asserts live FIRST; dispose is idempotent. Validate all input and
candidate values before committing any part. Require typeof number and finite numbers,
damage>0; healing>=0; delta>=0; supplied maxHull in [1,MAX_SAFE_INTEGER], including valid
fractions under GAME-046 bounds. Damage/heal/delta are finite amounts, not integer-only;
large finite amounts saturate only through valid gameplay arithmetic. Reject malformed,
NaN/infinities/negative/invalid zero damage or invalid maxima with clear RangeError and
unchanged snapshot. No coercion, invalid-input clamping, rounding or broad catch.
All stored results/returned losses must stay finite and nonnegative. Compute saturation
without overflowing intermediate sums, e.g. heal only the available max-current gap.

snapshot returns a fresh detached plain JSON object with exactly the three fields above;
no references/functions/classes/Maps/Sets. Reads do not mutate state, advance protection,
derive Build data, consume RNG or record diagnostics. Earlier snapshots survive disposal.

**Protection and Shield-first incoming arithmetic**

advanceProtection(delta) sets remaining=max(0,remaining-delta), in milliseconds. Zero is a
no-op; exact expiry and overshoot produce0. Fixed accepted-hit duration is exactly500ms,
owned once by Defense (an immutable constant is fine), not copied writable Scene state.
Pure Defense knows no lifecycle; Scene invokes advance only during active RUNNING update
at the existing protection phase after movement/targeting and before projectile/contact
processing. No advancement on pause/resume-command early-return frames, missing-player/
intent frames, PAUSED, TERMINAL or DISPOSED. Resume continues the same remaining phase.

applyIncomingDamage validates first. With currentHull0 return accepted:false, losses0,
protectionRejected:false and hullDepleted:true, no mutation. Otherwise, positive protection
returns accepted:false/protectionRejected:true, losses0 and hullDepleted:false; retain
the exact remainder without extending it. With neither rejection:

- absorbed=min(oldShield,amount); nextShield=oldShield-absorbed.
- remaining=amount-absorbed; nextHull=max(0,oldHull-remaining).
- shieldLost=oldShield-nextShield; hullLost=oldHull-nextHull (actual stored differences).
- accepted means at least one actual loss>0; if floating-point rounding produces no stored
  loss, return accepted:false/protectionRejected:false, losses0/hullDepleted:false, with
  no state/protection change.
- For accepted damage, commit both candidate values and protectionRemaining=500 before
  returning; protectionRejected:false, hullDepleted=(nextHull===0). No negative defense,
  overkill carry, extra rounding, resistances or damage-type/source interpretation.

Shield-only loss starts500 protection just like Hull loss. Shield3/Hull5 receiving2 yields
Shield1/Hull5; after expiry, receiving3 yields Shield0/Hull3. A second hit DURING protection
is rejected rather than applying the second example. Exact Shield depletion leaves Hull
untouched if no overflow; fractional Shield/damage/HP are supported. All result objects
contain only the five numeric/boolean fields, not formal GAME-049 combat records.

**Scene routing, diagnostics, terminal and visuals**

Pin production incoming order:

1. Exact owning/current run and current Defense/player identity available; reject absent,
   stale, non-RUNNING/terminal or already-zero Hull before numerical work. Captured old
   callbacks must fail their existing owner guards before using current Scene Defense.
2. DEV God Mode check in Scene: reject without calling Defense, losing Hull/Shield,
   healing, requesting terminal or starting/extending protection. Toggle remains current
   run-local boolean; existing protection may continue its normal active countdown.
3. Defense protection check -> Shield absorption -> overflow to Hull through the one
   numeric operation above. No alternate damage algorithm for contacts/hostile shots.
4. For accepted hullLost>0 call existing recordPlayerDamage(hullLost) exactly once. hpLost
   means actual Hull lost; acceptedDamagingHits retains that Hull-loss observation scope.
   Shield-only accepted hits increment NEITHER counter; never pass Shield loss or0.
5. For an accepted hit refresh current HUD, set existing alpha0.5, then request Death
   through the existing enterPlayerDeath path only if accepted && hullDepleted.
6. RunLifecycle first-terminal acceptance records TERMINAL, clears input, sets alpha0.25
   and presents existing SHIP DESTROYED/RETRY. No direct Run mutation inside Defense.

The pure accepted operation commits protection500 before Scene's terminal request. Thus
lethal snapshots retain500 and alpha0.25 wins over damage alpha0.5, matching current final
state; positive Hull-loss observation precedes TERMINAL. Protection rejection, God Mode,
Shield-only/nonlethal hits, heal and max reconciliation never request Death. Build max>=1
prevents max reconciliation of a living ship to0. No diagnostics schema/event/counter
extension, Shield-loss telemetry or fake damage for heals/caps/setCurrentShield/reads.
Keep the existing six semantic record types and GAME-045 observation-only ownership.

Keep updatePlayerProtection as presentation/guard adapter if useful: after active Defense
advance, positive remainder retains alpha0.5; zero restores1 as currently. Terminal never
runs this restoration and remains0.25 after Death. No Phaser references in Defense, new
flash/VFX system, player damage numbers or GAME-096 production HUD/bar work. HUD remains
HP currentHull / Build effective Hull, existing XP/Level/Dash text unchanged.

Hostile collision ownership stays in updateProjectiles. Every colliding hostile shot is
destroyed/spliced exactly once even on God Mode/protection rejection or Shield-only hit;
lethal shot cleanup still completes before the next terminal-guarded loop return. Do not
tie lifetime/removal to accepted or hullLost, and do not move visuals into Defense.
Preserve reverse production ordering, Death-first/Victory-first, straight player hit/
cleanup and full Missile/Cluster primary/satellite/removal boundaries before Victory.
killEnemy, XP/Boss recognition and all outgoing attacks remain unchanged.

**Build maximum synchronization and Hull Plating healing**

PlayerBuild remains the only maximum-Hull truth. On a successful shared Hull percentage
mutation, Build changes first, then Defense.reconcileMaxHull(new effective Hull), then HUD.
Resolve/assert the current live Defense before attempting the Build mutation; unavailable
or stale ownership cannot partly apply a Build change to an unrelated Defense.
Reconciliation validates max and caps currentHull=min(currentHull,max), never heals an
increase, never changes Shield/protection/Build and emits no damage/terminal record.
Preserve exact current run/build bridge identity/RUNNING guards. No new effective-stat
consumer, modifier formula or duplicated max in Defense. Other stats do not touch Defense.

Hull Plating path: exact current PAUSED/REWARD/run/presentation/eligibility guard -> Build
applyPrototypeHullPlating() succeeds -> legacy module level increments -> reconcile to
new max -> healHull(1,new max) -> HUD -> existing SELECTED observation/UI destruction/
input reset/REWARD release. If Build throws/rejects, Defense/level/selection are unchanged.
Only this concrete current reward path may heal while PAUSED; MANUAL/focus-only pause,
terminal/disposed/stale callbacks have no mutation authority. REWARD+FOCUS_LOSS acceptance
still applies the current choice once and releases only REWARD.

healHull(amount,max) computes currentHull=min(max,currentHull+amount), discarding overheal;
use bounded gap arithmetic to avoid intermediate overflow. Return max(0,new-old), the
actual Hull gained (0 at full Hull or after a cap). A supplied smaller max may cap stale
current Hull; ordinary Scene changes explicitly reconcile first. Zero amount changes no
Hull when already reconciled. Fractions are preserved. Healing never changes Shield,
protection/alpha, maximum, RNG or diagnostics. Pure Defense is numeric, not lifecycle-
aware: Scene/current consumer forbids terminal healing/revival; no heal may resume Run.
No Medical Drone, shield healing, full heal, ratio heal or Scene HP assignment is added.
All existing full5->6, damaged2->3 and fractional2.5->3.5 Hull Plating cases retain exact
max+1/Heal1, including repeated flat arithmetic with shared percentages.

**Exact contact separation geometry (explicit GAME-048 cutover)**

Current docs require small escape separation but provide no authored pixel strength.
Choose the minimum circle-overlap translation, not a new tuned force/impulse:

- At the existing contact phase require current RUNNING run/Defense/player and Hull>0.
  Remove the protection-only early return from geometric scanning. Scan enemies in current
  collection order, select the FIRST with d<=R, R=playerRadius20+enemy.collisionRadius.
  Use current world centers; no nearest-target reordering, enemy movement or extra scan.
- Let away=(player.x-enemy.x,player.y-enemy.y). For d>0 normalize by that exact distance;
  for coincident centers d=0 use unit(+1,0), deterministically. Compute step=max(0,R-d).
- Candidate player position = old position + unitAway*step; clamp x/y using the SAME
  movePlayer margins width/2+lineWidth/2 and height/2+lineWidth/2, arena4800x2700. Current
  bounds are x[21,4779], y[25,2675]. No epsilon, fixed extra kick, velocity or new timer.
- Apply this separation BEFORE routing that contact's unchanged contactDamage once, then
  stop scanning, including if damage was rejected. Touching d=R gives step0 but remains
  an inclusive damage contact. Unclamped distance becomes R; maximum correction is R
  (44 regular/Elite,60 Warden) at coincident centers. Clamping may leave residual overlap
  at an edge/corner; accept it, do not teleport/search an alternate exit or iterate pushes.

For example regular enemy(2400,1350), player(2430,1350) yields player(2444,1350);
coincident centers there yield player(2444,1350); Warden coincidence yields x2460.
An edge-blocked away vector may yield no movement; still route the first contact only.
Geometric separation occurs for actual contact even under God Mode/protection, while
damage remains rejected and no protection restarts. This intentionally supersedes the
old God Mode no-position-change assertion and protection scan skip, not their no-damage
guarantees. PAUSED/terminal/missing/stale/zero-Hull contact does neither geometry nor damage.
No separation for projectile hits or noncontacts. No Ship Impact, RNG, enemy/global
knockback/Stagger, wall/enemy damage, repeated per-enemy damage, Dash change or integration
framework. This is one radius-bounded position correction per active contact pass.
Preserve existing update order: targeting/Drone placement already ran; their normal next
active updates observe the position, and the following XP step uses current position.
No extra targeting/orbit/attack simulation pass or new collision system is authorized.

**DEV snapshot, isolation, pause and exact lifetime**

Preserve existing detached DevSnapshot.playerHealth and protectionRemaining as DERIVED
compatibility scalars from one Defense.snapshot() read. Add only playerShield:number,
derived from currentShield. Max Hull is already build.effectiveStats.hull, not another
stored max or duplicate defense object. This exposes all four verification values while
preserving current DEV consumers. No transient Defense data goes into BuildSnapshot;
GAME-047's six-field canonical shape/Tags/identity and current zero-source policy stay exact.
Keep snapshot/forceLevelUp/spawnWarden/setWardenHealth/setGodMode, old API null/false and
production API absent. No heal/damage/setHull/setShield/clearProtection commands or UI.
Read-only snapshots remain available during pause/terminal, mutate nothing and draw0.

Defense operations consume zero Encounter/Reward/World/Boss draws and mutate no Tags,
identity/Analyzer/offers/weapon values/timers. Keep RunLifecycle, RunRandom, KeyboardInput
and RunDiagnostics ownership/schema unchanged. GAME-044 PAUSED freezes damage/contact/
separation/Hull/Shield/protection; only exact current Hull reward application may perform
its existing healing exception. Pause itself never heals/clears protection; resume keeps
the remaining countdown. All five existing Phaser TimerEvents/phases and Clock.paused
rules remain; zero new timer, independent clock, wall time, polling or timeScale ownership.

Every native create: fresh RunLifecycle PREPARING -> fresh PlayerBuild -> fresh const
PlayerDefense(build effective Hull), Shield0/protection0 -> existing player/HUD/local
setup/initial Chaser/five events/input/UI -> successful run.start -> crypto RunRandom ->
RunDiagnostics bootstrap -> DEV. Construct Defense before the first HUD read; remove old
HP/protection resets. No PREPARING entropy/draw/diagnostic or extra bootstrap spawn.
Bind shutdown/destroy disposal to that exact captured const Defense, remove those exact
listeners, idempotent. Never dispose via mutable this.playerDefense in an old closure.
After disposal all direct reads/mutations (including zero heal/delta/Shield setting) throw
clear disposed-PlayerDefense invariant Error; dispose itself stays safe. Old detached
snapshots remain plain data. Retained timer/input/focus/reward/result/DEV/cleanup callbacks
must reject their old owning run/owner identity before fresh Defense access, damage/heal,
max reconcile, RNG or presentation work. No global currentDefense pointer/registry.
Native restart is the physical reset, not manual create/reset service or state transplant:
fresh owner, Hull5/max5, Shield0/protection0, fresh Build/zero Tags/identity and existing
lifecycle/RNG/input/diagnostics/API, unpaused fresh Clock and five fresh gameplay events.

**Required tracked tests for separately authorized implementation**

Preserve all424 pre-GAME-048 tests/22 files. Add focused pure PlayerDefense and actual
Scene production-path cases. Existing tests that directly assign Scene HP/protection must
construct/use real Defense operations/internal fixtures instead of adding compatibility
setters or alternate damage logic. Adapt only the old contact position expectation to
this explicit cutover; preserve God/protection/terminal/RNG/diagnostic assertions.

| Boundary | Required evidence |
| --- | --- |
| Pure baseline/read/validation | Hull5/Shield0/protection0, exact detached three-field JSON snapshot, immutable old reads; valid fractions/boundaries; invalid constructor/Shield/max/amount/delta/NaN/infinities/nonnumbers/negative/zero damage reject before partial mutation; large finite damage/heal/delta saturate safely |
| Pure numeric incoming | Hull-only, fractional, exact lethal/overkill to0, exact five-field actual-loss result, already-zero no mutation; full/partial Shield absorption, exact depletion, fractional Shield and same-hit overflow; accepted Shield-only starts500; no stored loss due rounding does not start protection |
| Pure protection | Accepted hit starts500 before return including lethal; repeated protected hit rejects both losses/no extension; active delta, zero/exact500/overshoot expiry, invalid delta leaves all state unchanged; separate hits only after expiry |
| Pure heal/reconcile | Damaged/full/capped/fractional/zero heals with actual positive return; discarded overheal/overflow-safe saturation, no Shield/protection effects; lower max caps, higher max no heal; validation atomic; no stored maximum |
| Pure lifetime | Idempotent dispose; every read/mutation even zero throws afterward; earlier snapshot usable; fresh independent owner baseline |
| Scene boot/authority/HUD/DEV | Defense constructed in PREPARING before HUD, exact5/5/0/0, five events/commands, unchanged Build/Tags/seed/diagnostic bootstrap; no writable duplicate HP/protection, max still Build; derived legacy snapshot fields plus playerShield correct/detached, production API absent |
| Scene God/protection/Shield | Real hostile collision consumed on God/protection reject, accepted Shield-only/full overflow/lethal; God loses0 and starts/extends nothing, disable restores future damage. Actual active update advances only at existing phase; PAUSED/terminal freeze. Internal Shield setup only; Shield Systems changes do nothing |
| Scene Hull/reward | Real Hull Plating full/damaged/fractional +1 max/Heal1, repeated flats and shared percentages; shared max increase no heal/reduction cap; failed Build leaves Defense/level/selection unchanged; exact reward+focus/stale/double/terminal guards, SELECTED before final RESUMED |
| Scene contact geometry | First collection contact only; inclusive tangent, d>R no effect, regular/Elite44 and Warden60, explicit axis/diagonal/minimum translation, coincident+X, exact player arena edge/corner clamp/residual overlap; God/protected still separate without damage/protection restart; paused/terminal/missing0; no RNG/Impact/enemy/velocity effects |
| Diagnostics/terminal | hpLost/acceptedDamagingHits reflect positive Hull loss only; Shield-only/rejections/heals/caps0; lethal Hull observation precedes accepted TERMINAL, protection500 and final alpha0.25. Alpha0.5 accepted Shield/Hull and1 at expiry; first-terminal Death/Victory and straight/Missile/Cluster cleanup unchanged, terminal cannot heal/resume |
| Isolation/lifetime | Defense/read/heal/reconcile/separation draw0 all streams, Build/Tags/identity/Analyzer/offers unchanged, no timer reset/new event; same five Clock phases. Dirty old Defense disposed and old captured timer/input/focus/reward/result/API/cleanup cannot touch fresh defense/owners; existing RNG/Build/API disposal guarantees preserved |

**Required real browser/native validation for separately authorized implementation**

1. Ordinary DEV boot: RUNNING, Hull5/max5/Shield0/protection0, unchanged Build/Tags/RNG/
   diagnostics, exact five commands/five observed events, derived detached snapshot/HUD.
2. Actual hostile hit consumed, Hull loss/protection500/alpha feedback; another collision
   during protection consumed with no loss/extension; next hit after expiry damages again.
   God Mode against actual projectile/contact: no Defense mutation/protection start, contact
   geometry still follows the pinned rule; disabling restores later accepted damage.
3. Ignored INTERNAL harness sets real owner's Shield, routes actual Scene incoming path:
   full absorb, exact depletion, overflow/fractions, Shield-only protection, lethal Hull
   after depletion. Verify actual losses/unchanged Shield Systems/no Shield telemetry.
   Do not create public controls, source content or a second damage algorithm.
4. Actual rendered pointer Hull Plating at full/damaged/fractional HP preserves max+1/
   Heal1/HUD/protection/Shield; internal shared Hull increase never heals, reduction caps.
5. Real W/Space/Escape and manual/reward pause, genuine browser BLUR/reward+focus: meaningful
   paused wall time leaves protection/Hull/Shield and same five phases stable, explicit
   resume continues. Distinguish synthetic HIDDEN/VISIBLE from real focus evidence.
6. Actual contact overlap: exact regular/Warden/coincident/diagonal/edge positions; God/
   protected/no-contact cases, first-enemy ordering, bounds and zero RNG/Impact influence.
7. Preserve Death-first/Victory-first and straight/full Missile/Cluster primary/satellite
   terminal boundaries, lethal protection500/final alpha0.25, frozen terminal defense and
   no heal/revive. Colliding lethal hostile shot still cleaned up.
8. At least TWO actual Victory -> NEW RUN, ONE Death -> RETRY and ONE PAUSED nonterminal
   native scene.restart. Dirty old defense where practical; EACH old owner disposed/direct
   reads/mutations throw, fresh5/5/0/0, fresh Build/Tags/lifecycle/RNG/input/diagnostics/API,
   five fresh events/unpaused Clock. Invoke saved old callbacks/cleanup; they cannot damage,
   heal or reconcile fresh defense/draw fresh RNG. Reload/manual create is not native proof.
9. Unmodified production preview: movement/Dash/pause/automatic combat/ordinary damage/
   Death/retry, no DEV API/defense debug UI or added Shield HUD. Inspect console; distinguish
   known favicon404/Vite >500kB warning from new errors. Report tracked/internal/actual
   native evidence separately; no new runtime verification is claimed by this definition.

**Scope, definition validation and later documentation**

No GAME-049 Attack/Hit/Damage/AttackSnapshot/DamageRecord/DamageSource/Type taxonomy,
crit/Armor/resistance/penetration/friendly-fire migration; no enemy definitions/death
pipeline, enemy/global knockback/Impact/Stagger system, Shield Active/specialization/Core
or Capacitor, Medical Drone/Barrier, Shield regeneration/recharge/capacity, production HUD
bars/incoming numbers, reward weighting, maturity/Director, framework/manager/ECS/event
bus/service locator, extra timer/RNG/dependency. This numeric incoming result is not a
formal combat record. Outgoing weapon/launch/progression/gameplay contracts remain intact
except this task's explicit defense authority/Shield math/contact-separation cutover.

Now change only docs/TASK_GRAPH.md: GAME-048 BACKLOG->READY, this definition and necessary
current status wording; GAME-046/047 DONE, GAME-040/041 SUPERSEDED, GAME-049+ BACKLOG,
GATE A PASSED and GATE B unchanged/not passed. Preserve historical definition instructions.
Run npm run check and git diff --check; verify single-file scope, explicitly stage only
TASK_GRAPH, inspect COMPLETE git diff --cached and run cached check/stat. Generate ignored
.codex-review/GAME-048-review.txt with AGENTS.md sections, branch/base, source inventory,
exact API/arithmetic/geometry/consumer/lifetime/validation decisions and full staged diff.
Never stage review artifacts or commit; all other docs/runtime/tests/config stay unchanged.
After successful separately authorized implementation and required tracked/native checks,
GAME-048 may become DONE; update factual CURRENT_STATE defense behavior and PROJECT_GRAPH
actual exports/consumers/lifetime. ARCHITECTURE normally unchanged. GAME-049+ remain
BACKLOG; GATE A stays PASSED; GATE B needs its actual phase prerequisites and gate review.

**GAME-048 implementation completion evidence**

PlayerDefense.ts owns only currentHull/currentShield/protectionRemaining with the exact
approved eight-operation surface and two data types above. Finite numeric validation,
atomic rejection, fractions, bounded overflow-safe healing, actual-loss Shield-first
arithmetic and accepted-hit500ms protection are implemented. Scene has only read-only
HP/protection compatibility getters; Build remains maximum authority. PREPARING creates
Defense before HUD and exact captured shutdown/destroy cleanup disposes only that owner.
God bypasses Defense; positive actual Hull loss alone reaches existing diagnostics before
HUD/alpha and Death. Lethal Hull0/protection500 ends alpha0.25. Shared Hull caps/no-heal
and exact Hull Plating reconcile/Heal1/reward order preserve their guards. Contact uses
the pinned first inclusive overlap R44/60, minimum translation/coincident+X and existing
bounds, including God/protection separation; hostile cleanup remains Scene-owned.
DEV adds only derived playerShield and derives compatibility scalars from one snapshot.
No production setCurrentShield callers, Shield content/Shield Systems consumer, extra
timer/command, RNG/Tag/Analyzer/reward coupling or GAME-049 architecture was introduced.

npm run check PASS: all424 prior cases retained via real Defense fixture migration,
35 new pure Defense +24 Scene cases =483 tests/23 files (158 Scene total); typecheck and
build pass. Real Chrome verifies normal5/5/0/0 boot, hostile consumption/expiry/God,
internal actual Shield absorption/depletion/overflow/fractions/lethal, shared Hull max,
actual pointer full/damaged/fractional Hull choices/HUD and all contact boundaries.
Dirty Defense and five phases freeze over manual1100ms/reward700ms/genuine browser
BLUR650ms; focus return never auto-resumes. Keyboard/held controls/2300ms phase freeze
and all18 pointer choices retain prior contracts. Two Victory NEW RUN cycles, Death
RETRY and paused nonterminal native scene.restart each verify fresh Defense5/5/0/0,
disposed old operations, fresh Build/zero Tags/lifecycle/RNG/input/diagnostics/API/five
events, and inert retained callbacks/cleanup. Straight/Missile/Cluster primary/satellite
terminal regressions pass. Native result controls use actual production pointerdown
handlers; Hull/reward checks use browser pointer input. Unmodified production preview
passes W/Space/Escape/pause/combat, ordinary damage to HP0/Death and actual pointer RETRY
back to HP5/5, no DEV API/debug UI or new pageerrors. Only known favicon404 and Vite
large-chunk warnings remain. CURRENT_STATE/PROJECT_GRAPH describe implemented ownership.
GAME-048 DONE; GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A PASSED; GATE B PASSED. Architect implementation approval is pending; no commit created.

#### GAME-049 — Combat Resolution & Launch Snapshots

STATUS: DONE

**Goal, dependencies and definition boundary (approved historical definition)**

Implementation is complete and verified; the approved definition and pre-implementation audit follow.

Depends on GAME-046 DONE and GAME-048 DONE; preserve GAME-047 DONE and GAME-039/042..045.
Define Attack (offensive action plus immutable launch values), Hit (one concrete target
collision/impact) and Damage (calculated amount versus actual health/defense result).
Only this TASK_GRAPH definition changes now, GAME-049 BACKLOG->READY. No runtime or tests
are added/changed. GAME-050+ stay BACKLOG; GAME-040/041 SUPERSEDED; GATE A PASSED and
GATE B NOT PASSED. Implementation needs separate authorization after definition review.

**Current HEAD audit and concrete combat inventory**

Audit baseline: 42f7c823f13466c419ec1a1f01b4f79bfc9231f4, GAME-048 player defense runtime.
Read TASK_GRAPH, CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH, CONTENT_MANIFEST
and BALANCE completely; inspect current source rather than treating target prose as code.
Anchors/line numbers below refer to that HEAD; reinspect before implementation.
Searched src for damage/health writes, globalDamageMultiplier/combatValue, all fire/launch/
impact/explosion/kill/contact paths, segmentCircleHitTime, timers and diagnostics. There
are exactly three outgoing HP subtraction sites and one PlayerDefense incoming operation;
DEV setWardenHealth is a separate existing guarded assignment, not a combat/death path.

All Scene anchors below are in src/game/scenes/GameplayScene.ts:

| Path / actual anchors | Launch values and composition | Hit-time reads, geometry, health/XP/terminal consequences |
| --- | --- | --- |
| Laser: fireLaser914, firePlayerProjectile968, launchPlayerProjectile981 | Local damage1/interval600/speed1200; Power+1, FireRate-50 floor100, Speed+200, ranks0..2. Damage=local*C*R, speed=local*V, radius6*S, lifetime2000. Origin/player and normalized currentTarget aim sampled; distance<0.001 suppresses launch | updateProjectiles1028 reads stored damage/radius/velocity, current enemy centers/body radii and collection order. Earliest swept hit; ties retain first; subtract damage, killEnemy if<=0, destroy/splice shot, then new Boss defeat may request Victory. No live stats/target after launch |
| Prism: fireLaser914, combat/prismSpread.ts | Same Laser values/full damage on each of three beams; center,-12,+12 degrees, shared same firing event; entire near-zero volley suppressed. Current evolved flag read only for this launch | Three independent nonpiercing runtimes may each hit the same enemy if still present. No shared one-hit-per-volley restriction. Same damage/kill/XP/cleanup/terminal path as Laser |
| Missile: fireMissile1105, aimMissile1129, updateMissiles1139 | Local damage2/speed450/body8/explosion120/lifetime4000; ranks add1/75/30. Damage=local*C*R, speed=local*V, body8*S, explosion=local+15*Spatial. Store damage/speed/body/explosion/clusterEnabled; cap1, same1800ms event | Current retained target position guides heading; membership loss reacquires nearest to Missile, last heading if absent; distance<0.001 retains heading (initial0). Sweep all enemies for earliest interception, including non-target. Impact interpolates Missile center, no separate direct damage. Primary affected center snapshot receives stored damage once; destroy/splice Missile, then Victory |
| Cluster: updateMissiles1139, explodeMissile1183, explodeClusterSatellites1196, combat/clusterSatellites.ts | clusterEnabled is launch-time, not live evolution. Primary stored D/R; satellites derive D*0.5 and R*0.5, six centers at full stored R in world-axis0/60/120/180/240/300 order | Primary snapshot resolves first. AFTER primary deaths, snapshot survivors in union of six inclusive center circles; one satellite hit per survivor even if circles overlap. Primary survivor may take primary PLUS one half hit. No children/fragments, radius/body expansion, center clamp or falloff. Full union and Missile cleanup precede Victory even for primary Boss kill |
| Combat Drone: fireDrone951, fireDroneFrom958, firePlayerProjectile968 | Local damage1/interval1200/speed800/bolt5/lifetime1800; ranks add1/-150/+200. Damage=local*C*R*E, speed=local*V, radius=(5+Replication)*S. Nearest aim from actual Drone origin, near-zero suppressed | Same stored straight-shot collision/damage/kill/XP/removal as Laser. Current Drone orbit110/angular2/body10 remain separate; no post-launch Drone/Build lookup |
| Twin: fireDrone951, positionDrone943, fireDroneFrom958 | One mirrored companion at angle+PI; same Drone event/slot/progression, separate actual origin/nearest target/near-zero check. Each bolt full Drone composition and lifetime | Two independent nonpiercing bolts, same current-enemy eligibility and common death path. No shared hit history, half-damage copy, extra event or orbit/body scaling |
| Hostile projectile: fireHostileProjectile997, launchHostileProjectile1016, updateProjectiles1028 | Stored damage1/speed600/radius6/lifetime3000. Nearest Shooter aims at current player; independent Warden current-HP phase supplies4/8 fixed radial directions. No C/R/E/V/S | Player swept circle uses20+stored radius; calls damagePlayer837 -> current Defense, then destroys/splices once even on God/protection reject, Shield-only or lethal. No enemy friendly fire/XP. Lethal loss records before Death; shot cleanup completes before next guarded iteration |
| Enemy contact: updatePlayerContact814, damagePlayer837 | No flight. Read first contacting EnemyRuntime.contactDamage at the attempt: normal1, Elite/Warden2. No player multipliers | First inclusive d<=20+enemy radius24/40 in existing collection order. GAME-048 minimum translation/coincident+X/clamp occurs BEFORE damage, including God/protected. Same Defense/Hull-only diagnostics/Death; no enemy damage/kill/XP. Pause/terminal performs neither geometry nor damage |

C=globalDamageMultiplier (initial1, +0.25 per accepted Combat Processor at758);
R/E/V/S=Build effective Reactor/Engineering/Velocity/Scale. Current ProjectileRuntime105
stores only side 'player'/'enemy', not Laser/Drone/variant attribution; damage/radius are
writable TypeScript fields today. MissileRuntime115 has readonly numerical fields and
clusterEnabled, but no runtime-frozen common snapshot. These are migration points, not
evidence of existing typed Attack/Hit/Damage or retained kill attribution.

EnemyRuntime89 retains archetype/isElite/visual/current health/contactDamage/xpValue/radius.
createEnemy1227 gives Chaser3/Shooter2/Tank6/Elite18/Warden60 HP, radii24/40, XP1/5/10.
killEnemy1211 membership-guards removal, flags Boss, creates one value-bearing pickup,
clears current target, destroys/splices, then records killed/drop aggregates. It neither
attributes a source nor accepts Victory. creditExperience1241 owns later collected/DEV
XP; attacks never credit dropped XP directly. Boss XP10 stays visible/frozen on Victory.

Other audited anchors: PlayerBuild.ts#getEffectiveStats/resolve (copied cached ten stats,
zero Tag production contributions); PlayerDefense.ts#applyIncomingDamage (only current
Shield/Hull/protection arithmetic); RunLifecycle.ts#tryEnterTerminal (first outcome);
RunDiagnostics.ts#recordEnemyKilled/recordPlayerDamage/recordTerminal (observers);
Scene create221/five addEvent325..349, update403, applyBuildChange485, weaponInterval475,
resetWeaponTimer479, enterPlayerDeath849 and enterRunVictory878. Relevant tests include
collision9, prismSpread7, clusterSatellites6, Spatial6, Replication5, Warden14, pure Build52,
Defense35 and actual Scene158, especially terminal246..343, composition920..1013 and
Defense1150..1258. Current baseline is483 tests/23 files, not a new runtime claim here.

**Representation decision: immutable values, concrete Scene hits, no stateful engine**

Prefer one focused Phaser-free src/game/combat/combat.ts and combat.test.ts for the
following types/factories/numeric helpers. No CombatManager/System, DamagePipeline class,
owner/disposal service, RunContext, registry, event bus, universal payload or condition DSL.
Attack is a small immutable action record, not a mutable entity with scheduling methods.
Use the following exact fields/discriminants (aliases may be organized equivalently):

```typescript
type FlightSnapshot = Readonly<{
  damage: number; speed: number; radius: number; lifetime: number;
}>;
type MissileSnapshot = Readonly<FlightSnapshot & { explosionRadius: number }>;
type ContactSnapshot = Readonly<{ damage: number }>;
type LaserAttack = Readonly<{
  kind: 'LASER'; variant: 'BASE' | 'PRISM'; snapshot: FlightSnapshot;
}>;
type MissileAttack = Readonly<{
  kind: 'MISSILE'; variant: 'BASE' | 'CLUSTER'; snapshot: MissileSnapshot;
}>;
type DroneAttack = Readonly<{
  kind: 'COMBAT_DRONE'; variant: 'BASE' | 'TWIN'; snapshot: FlightSnapshot;
}>;
type HostileAttack = Readonly<{ kind: 'HOSTILE_PROJECTILE'; snapshot: FlightSnapshot }>;
type ContactAttack = Readonly<{ kind: 'ENEMY_CONTACT'; snapshot: ContactSnapshot }>;
type Attack = LaserAttack | MissileAttack | DroneAttack | HostileAttack | ContactAttack;
type AttackSnapshot = Attack['snapshot'];
type PlayerAttackSource = Pick<LaserAttack, 'kind' | 'variant'>
  | Pick<MissileAttack, 'kind' | 'variant'> | Pick<DroneAttack, 'kind' | 'variant'>;
type AttackSource = PlayerAttackSource | Pick<HostileAttack, 'kind'> | Pick<ContactAttack, 'kind'>;
type HitPhase = 'DIRECT' | 'PRIMARY' | 'SATELLITE' | 'CONTACT';
type EnemyDamage = Readonly<{
  target: 'ENEMY'; calculatedDamage: number; healthAfter: number;
  hpLost: number; healthDepleted: boolean;
}>;
type PlayerDamage = Readonly<{
  target: 'PLAYER'; calculatedDamage: number; defense: IncomingDefenseResult;
}>;
type Damage = EnemyDamage | PlayerDamage;
```

IncomingDefenseResult is the existing GAME-048 type (type-only import), not a second
Shield/Hull algorithm. Damage has no lifecycle transition, kill rewards or terminal flag.
No attackId, sourceId counter, timestamp, attacker metadata, crit/armor/damageType,
penetration, impact force, arbitrary attributes or future weapon/Active identities.
AttackSource is the stable closed source VALUE projected from Attack.kind/variant; avoid
a second separately writable source on the runtime. Variants remain attributes of their
base system for current behavior and later explicit death consumers. Both Twin origins
are COMBAT_DRONE/TWIN; no instance ID is needed. Shooter/Warden shots share the current
HOSTILE_PROJECTILE distinction; do not invent future hostile-source classification.

Hit is a Scene-local internal discriminated record because exact target/run references
are current Scene authorities, not plain public snapshot data. Define it alongside
EnemyRuntime, without importing Phaser/Scene/Run into the pure combat module:

```typescript
type Hit = Readonly<{ run: RunLifecycle } & (
  { kind: 'ENEMY_DIRECT'; target: EnemyRuntime; attack: LaserAttack | DroneAttack }
  | { kind: 'ENEMY_BLAST'; target: EnemyRuntime; attack: MissileAttack;
      phase: 'PRIMARY' | 'SATELLITE' }
  | { kind: 'PLAYER_PROJECTILE'; target: PlayerDefense; attack: HostileAttack }
  | { kind: 'PLAYER_CONTACT'; target: PlayerDefense; attack: ContactAttack }
)>;
```

Geometry computes the one current target/phase and, for Missile, impact center before
Hit construction. No cached target HP, damage modifier, timestamp or geometry truth in
Hit. Exact run/target refs never escape through DEV/Build snapshots or pure numeric data.
Damage is a short-lived result for the immediate adapter; no retained hit/event queue.

**Pure operations, validation and calculated-versus-actual damage**

Pin small functions, not a resolver object:

- composePlayerDamage(system: PlayerAttackSource['kind'], localDamage:number,
  combatMultiplier:number, reactorPower:number, engineering:number):number.
- createAttack(input:Attack):Attack: validate supported discriminant/variant and its
  exact snapshot fields, copy primitives and freeze both snapshot and outer record.
  Caller mutation of input objects cannot mutate the returned action. No Build reference.
- calculateHitDamage(attack:Attack, phase:HitPhase):number: DIRECT only Laser/Drone/hostile,
  PRIMARY only Missile, SATELLITE only MISSILE/CLUSTER, CONTACT only ENEMY_CONTACT.
  Return snapshot.damage except SATELLITE returns snapshot.damage*0.5. Reject invalid
  combinations, never infer another behavior or use live modifiers.
- calculateEnemyDamage(currentHealth:number, calculatedDamage:number):EnemyDamage:
  pure numeric result only; Scene remains health/removal authority during this migration.

Require typeof number, finite, positive, <=Number.MAX_SAFE_INTEGER for operands/final
combat values, flight lifetime/speed/radius and explosionRadius; valid fractions remain.
Reject zero/negative/nonnumbers/NaN/infinities/overflow or positive-product underflow0
with clear RangeError before affected visual/runtime/HP mutation. No coercion/rounding/
invalid-input clamp. Keep existing combatValue final-composition bounds; check final
product without adding an intermediate MAX_SAFE cap that rejects otherwise valid existing
left-to-right composition. Validate a Cluster half-damage result before creating that
launch so no malformed derived hit can partly resolve a later detonation. No arbitrary
new balance cap or minimum replacing the current strictly positive numeric boundary.
Near-zero/no-target/cap rejection remains a normal no-launch, not malformed content.

For a valid current positive enemy HP H and calculated D:
healthAfter=H-D (the CURRENT subtraction, potentially negative on overkill);
hpLost=H-max(0,healthAfter); healthDepleted=(healthAfter<=0).
Preserve current negative transient HP on an immediately removed overkilled object;
do not silently clamp that inspected reference or equate calculatedDamage with hpLost.
E.g. H3/D10 yields healthAfter-7, hpLost3, depleted true, calculatedDamage10; excess never
transfers. Tiny D that causes no stored change gives hpLost0/depleted false. Reject invalid
currentHealth in the pure helper; Scene rejects absent/dead/stale targets before calling.
No new damage numbers UI; keeping calculated D supports the approved later presentation.

**Composition and immutable launch authority**

Evaluate ordinary current formulas in their existing left-associative order:
Laser/Prism and Missile/Cluster: (localDamage*C)*R.
Combat Drone/Twin: ((localDamage*C)*R)*E. Engineering never multiplies Laser/Missile.
Validate all supplied numeric operands; only the Drone branch consumes E in the product.
Do not apply C inside a second launch/hit helper. No Scale/Velocity/Impact/FireControl/
Analyzer/Tags factor in damage, no crit/hit-chance/variance draw or AoE damage falloff.

Firing methods read current local tuning and one copied EffectiveStats at their current
launch site, compose once, then construct the frozen Attack. Sample speed=local*V,
radius=local*S (Drone local5+Replication BEFORE S), lifetime=current local constant.
Missile snapshot also owns local explosionRadius+15*Spatial. BASE/PRISM/CLUSTER/TWIN is
fixed on that action; evolving never mutates old flights. Retain colors/positions/aim/
velocity components/remaining lifetime, homing target/heading in concrete Scene runtimes.
No stored full EffectiveStats/Build, current/max HP, cadence or source-object reference
inside AttackSnapshot. Already launched values cannot change with R/E/C/V/S, local ranks,
Spatial/Replication or later evolution. Hostile factory samples its own1/600/6/3000,
not player stats. Contact constructs a no-flight action from that enemy's current
contactDamage only at the guarded actual attempt, not a fake projectile or lasting timer.

One successful Laser callback produces one action shared by its normal shot or three
Prism beam runtimes. Each Prism beam still consumes itself independently; sharing immutable
values does not impose shared target history. Each Drone/Twin origin produces its own
action/bolt after its independent targeting check. One Missile action owns its entire
primary/optional satellite detonation. Each hostile shot has its own action; no global ID
or volley service. A contact attempt has its own immediate action. No universal hit history.

ProjectileRuntime migrates its writable damage/radius/side fields to one readonly typed
attack ref plus exact owning run ref; side/visual-radius reads derive from the closed
Attack kind/snapshot. Optional read-only compatibility getters for existing internal
tests are allowed, never writable mirrors. Fixed straight velocity is initialized from
snapshot speed and current normalized aim; physics components remain Scene-owned.
MissileRuntime similarly uses readonly MissileAttack and run refs; remove independent
damage/speed/radius/explosionRadius/clusterEnabled storage, deriving variant from Attack.
remainingLifetime starts from snapshot.lifetime and remains mutable physical state.
Both render radius and swept/world-exit margin use the SAME stored snapshot.radius.
Do not introduce another cache that can disagree with the snapshot or reread live Build.

**Concrete hit adapters and unchanged health/death authority**

Route the three current enemy subtraction sites through one small private Scene
applyEnemyHit(hit) boundary. Require exact owning this.run===hit.run, RUNNING, current
collection membership and positive target HP. Determine phase damage from the immutable
action, calculate EnemyDamage, assign existing enemy.health=healthAfter and call the same
membership-guarded killEnemy(enemy) when depleted. Return that result or null on an
unavailable/stale target. No fake successful hit/HP loss on rejected ownership. This
adapter does not request Victory, collect XP, update Build or record a hit timeline.
Keep the Hit/action source available through this synchronous damage/kill call chain.

GAME-051 will need that exact current enemy ref, Hit.attack's stable base/variant source,
and calculated/actual/depleted result at its real alive-to-dead boundary. GAME-049 does
not retain lastDamagingSource on EnemyRuntime, add an EnemyDeathRecord, distribute kill
source rewards, create another alive/dead flag or introduce an unused source registry.
Current killEnemy remains the sole removal/XP/Boss/kill-aggregate path; no competing death
authority and no GAME-050 definition/scaling/spawn cutover. Enemy fields/AI/HP/XP stay as
audited. A later explicit GAME-051 migration can consume the source there without
reconstructing it from a mutable weapon/build or projectile color.

Incoming Hit routing stays in the current damagePlayer adapter (typed signature may
replace its numeric internal parameter; migrate test setup, not behavior). Exact current
run/Defense/player/RUNNING/positive Hull checks precede new contact-record/numeric work;
God returns null without Defense invocation. For actual contact, separation still occurs
before this rejection. A hostile immutable action already exists from its earlier launch.
Then calculate its unchanged incoming amount -> PlayerDefense.applyIncomingDamage ->
PlayerDamage wrapping the existing IncomingDefenseResult. Protection rejection is that
real result, not a fake Hull-only record. Record only positive hullLost once, accepted
HUD/alpha0.5, then depleted Death; final Hull0/protection500/alpha0.25. Shield-only starts
protection but records0 hits/hpLost. No copied Shield math or altered duration/healing/max.
Hostile destroy/splice is unconditional on collision, outside accepted-result branches.
No new production Shield setter/source, no player-to-player/enemy-to-enemy friendly fire.

**Geometry, per-target rules and explicit abstraction conflicts**

Keep combat/collision.ts#segmentCircleHitTime unchanged unless an actual necessary fix
is separately identified: inclusive t[0,1], initial overlap0, tangency at computed t, stationary
outside/miss Infinity. Step uses min(delta,remainingLifetime)/1000; miss subtracts full
delta from lifetime and destroys on<=0 or whole body outside inclusive arena margins.
Current collision processing precedes expiry/world-exit cleanup; do not cull first.
Do not add epsilon, endpoint extension, new hitbox, spatial index or generic collision engine.

Nearest target uses strict squared-distance < in selectNearestEnemy1085, preserving
collection-order ties, current archetype filter only for Shooter and actual Drone/Missile
origin. Straight collision picks strict smallest swept hit t, collection order on ties;
shot aims at launch target but may hit another enemy first. Zero aim suppression remains
<0.001; Missile may start stationary/overlapping and retains its existing heading behavior.
Missile sweeps ALL current enemies with enemy radius+snapshot body radius; impact center
is start+step*t. Explosion uses enemy CENTER only, inclusive squared distance<=R^2.
No combined enemy radius for blast coverage or Missile direct-hit damage on top of blast.

Cluster resolves primary affected snapshot once, then snapshots surviving union targets
once, then applies half damage to each once; preserve order and every removal/pickup.
No satellite center clamp, no body Scale on full R/half R/offsets, no child projectile.
Conflict: a universal already-hit Set per Attack would suppress the existing primary+
satellite second hit. Reject that abstraction. Primary and satellite phases have separate
authored eligibility; filtering the current survivor collection already deduplicates.
Likewise shared Prism/Twin volley history would change valid independent hits; reject it.
Do not batch unrelated attacks or add piercing, pellet stacks/fragments or priority rules.

Contact remains GAME-048 Scene geometry: first d<=R44/60, unit away/coincident+X,
step=max(0,R-d), x[21,4779]/y[25,2675], correction before damage, stop after first even
when God/protected. Tangency step0 still attempts; residual edge overlap is allowed.
No separation from hostile projectiles. PAUSED/terminal/stale/zero Hull does neither.

**Boss/terminal atomicity and exact owning lifetime**

Preserve reverse projectile/Missile processing and update403 phase order: protection,
straight/hostile, Missile, contact, XP. Do not sort hits, invent same-frame outcome priority
or move Run.tryEnterTerminal into pure damage/applyEnemyHit/killEnemy.
Straight: remember bossWasDefeated -> current Hit/HP/kill/drop -> destroy/splice THIS shot
-> newly defeated Boss requests Victory -> stop unrelated later work. Hostile lethal:
Defense/diagnostics/Death -> destroy/splice THIS hostile -> next guard stops processing.
Missile: primary FULL affected snapshot -> Cluster FULL survivor union if launch variant
-> Missile destroy/splice -> newly defeated Boss requests Victory -> stop later Missiles/
contact/XP. Primary Boss kill cannot skip satellites; satellite Boss kill cannot truncate
the rest of the union. Nonlethal/ordinary deaths never request Victory.
First legal DEATH/VICTORY remains immutable; duplicate/conflicting requests create no UI/
diagnostics/rewards. No auto-collection of Boss XP, unrelated post-terminal hit or XP step.
No deferred terminal queue, broad transaction framework or post-terminal detonation resume.

Immutable Attack/Snapshot has no stateful owner to dispose and remains harmless data after
restart. Each concrete flight/Hit captures its EXACT existing RunLifecycle ref outside
the pure values. Newly added mutating adapters require that captured run, never default
stale callbacks to mutable this.run. Reject old run before reading fresh collections or
Defense; additionally require enemy membership / exact current Defense identity. Creation/
timer/cadence/reward/result/input/focus closures keep current captured-owner guards.
Retained old runtime/Hit cannot be transplanted to a new run, even if a Scene is reused.
Do not rebuild an old Attack with the new run token or redirect through a global pointer.
Native scene.restart remains physical reset, with fresh Build/Defense/zero Tags/lifecycle/
RNG/input/diagnostics/API, unpaused Clock and five fresh events. Existing exact-owner
disposal stays unchanged. No new global authority, run ID service, combat owner or reset API.

**Impact deferral and isolation invariants**

Impact remains an UNUSED shared stat in GAME-049, with no field in AttackSnapshot/Damage
and no damage factor. Target docs give Attack Impact*Ship Impact*Enemy Knockback Response
but no current authored Attack strength, enemy response coefficients, decay/integration
or multi-hit bound. EnemyRuntime has none of those fields. Defer physical knockback to
separately defined enemy-definition/interaction work GAME-050/052; do not infer coefficients
from Tank HP, projectile radius, archetype or enemy speed, add force0 placeholders, or
alter GAME-048 escape separation. No Armor/resistance/crit/status/control framework.

Exactly five TimerEvents remain: spawn2000, Laser local/F, Missile1800/F, Drone local/F,
hostile1500. Snapshot has no scheduling/FireControl field. Keep same three event objects'
shared FC resets, only Laser/Drone own local cadence resets, no immediate shot/reset on
other Build changes/reads/snapshot/pause/resume. PAUSED freezes active attacks, defense,
geometry and all five phases; terminal callbacks remain guarded. ZERO new TimerEvents.
Attack construction/geometry/damage/reads consume ZERO Encounter/Reward/World/Boss draws;
fixed-seed spawn/offer behavior/budgets remain. RunDiagnostics remains observer: same spawn/
kill/drop/credit/Hull-only metrics, six semantic timeline kinds and terminal ordering;
no Attack/Hit/frame timeline or hypothetical combat counters/schema change.
PlayerBuild remains sole stats/slots/Tags authority. No damage inferred from twelve zero
current production Tags, no Analyzer effect, maturity, Core/Active content or new rewards.
DevSnapshot fields remain unchanged; exactly snapshot/forceLevelUp/spawnWarden/
setWardenHealth/setGodMode, old API null/false, production API absent. No combat debug UI,
spawnAttack/setDamage/forceHit/setCrit/setImpact/setHealth command or dependency.

**Required tracked tests for separately authorized implementation**

Preserve all483 pre-GAME-049 cases/23 files, including52 Build/35 Defense/158 Scene.
Adapt old internal direct-number/runtime-field setup to real typed factories/owners;
read-only compatibility getters are allowed, setters/parallel fake combat are not.
Do not remove, weaken or disable earlier assertions; report actual added totals.

| Boundary | Required evidence |
| --- | --- |
| Pure contracts/factory | Closed five source identities, legal variants/snapshot shapes, detached runtime-frozen inputs/nested values; invalid source/variant/fields/nonnumbers/NaN/infinities/nonpositive/overflow/underflow reject before mutation; fractions and boundaries; no owner/Build/Phaser/timer data |
| Pure composition/phases | Exact local*C*R and Drone-only *E, C once, independent non-default factors, BASE/evolved same damage rules; DIRECT/PRIMARY/SATELLITE/CONTACT validation, half damage only Cluster satellite, no live stats; same left-to-right arithmetic |
| Pure enemy Damage | Nonlethal/fractional/exact lethal/overkill, calculated10 vs actual3/healthAfter-7, no transfer/rounding, tiny stored no-op, invalid current HP/amount atomic; result contains no death authority |
| Scene launch authority | All six player paths plus hostile/contact use typed Attack/Hit/Damage; Laser/Prism shared action but independent beams, Drone/Twin per-origin actions; old launches retain D/speed/body/lifetime/blast/variant after each R/E/C/V/S/local/Spatial/Replication/evolution change; new ones consume current values |
| Real geometry/targets | Swept first/earliest hit, overlap/tangent/stationary/lifetime endpoints/world margins, collection ties, nearest versus first interception, Missile target loss/retention, scaled visual/body consistency; no Scale on blast/spread/count/orbit/XP/hostile/contact |
| Hit/health/death/XP | Actual health subtraction via shared enemy adapter, nonpiercing and independent Prism/Twin hits, primary once, overlapping-satellite union once, primary+satellite survivor allowed, membership/dead/stale reject, one kill/pickup/aggregate per enemy and correct source available through hit/removal chain |
| Player boundary | GAME-048 God bypass/no Defense call, Shield-only/full depletion/overflow/fractions/lethal/protected expiry; hostile consumed even on reject; Hull-only counters and lethal-before-TERMINAL, final500/alpha.25; exact regular/Elite/Warden contact separation even protected/God |
| Terminal | Existing Death-first/Victory-first reverse races; straight cleanup before Victory; full Missile/Cluster primary and satellite Boss kills finish affected sets/removal first; unrelated attacks/contact/XP freeze, no duplicate result, heal/revival or prematurely accepted terminal |
| Isolation/ownership | Same five events/FC-local reset policy, paused phases/attacks freeze, zero all-four RNG draws, exact diagnostic aggregates/timeline unchanged except real old observations, Tags/Analyzer/offers stable; old captured run/runtime/Hit/reward/input/focus/result/API/cleanup cannot damage fresh enemies/Defense or draw fresh RNG |

Reuse existing collision/prismSpread/clusterSatellites/Spatial/Replication/recipe tests,
actual Scene production methods and real installed Phaser Clock coverage. Pure helper
tests do not replace Scene lifetime/terminal integration or actual native browser evidence.

**Required actual browser/native validation for separately authorized implementation**

1. Ordinary DEV root boot: RUNNING, Hull5/max5/Shield0/protection0, correct Build/zero Tags,
   diagnostics/seed bootstrap, functional current combat, five observed events/five commands.
2. Exercise actual Laser/Prism/Missile/Cluster/Combat Drone/Twin firing/hits/HP/kill/XP.
   For EACH relevant launch value: launch old attack, accept current progression or use
   ignored INTERNAL shared-stat setup, verify old values/hit behavior unchanged and new
   launch updated. Include evolution during a Missile flight, Cluster radius/half damage,
   Prism beams and Twin origins, non-default C/R/E proving no duplicate multiplier.
3. Actual swept/nearest/first-hit tie/interception, center-only inclusive explosion,
   primary+full satellite union/multiple overlapping circles and duplicate-removal cases.
   Verify calculated damage versus real enemy loss and exactly one normal XP consequence.
4. Actual hostile collision and GAME-048 internal Shield setup: absorb/overflow/protection/
   God, shot consumption despite rejection, subsequent expiry hit, unchanged contact.
   No new public API or fake combat algorithm to drive these scenarios.
5. Real W/Space/Escape, MANUAL/REWARD pause and GENUINE browser foreground-tab BLUR.
   Capture active projectile/Missile values/position/heading/lifetime, Defense and all five
   event identities/phases; meaningful paused wall time changes none. Focus return never
   auto-resumes; real reward pointer/explicit Escape follow existing reason ownership.
   Report synthetic HIDDEN/VISIBLE tests separately from actual browser focus evidence.
6. Actual Death-first/Victory-first; straight, Missile, Cluster-primary Boss kill and
   Cluster-satellite Boss kill. Observe completed owning attack sets/cleanup BEFORE
   terminal; one result/terminal record, no unrelated post-terminal processing.
7. At least TWO Victory -> NEW RUN, ONE Death -> RETRY and ONE PAUSED nonterminal native
   scene.restart. Dirty/capture old active flights/Hits/callbacks. EACH fresh owner set/
   Build/Defense/zero Tags/RNG/input/diagnostics/API/five events/Clock baseline correct;
   invoke old timer/combat/input/focus/reward/result/DEV/cleanup closures and old hit adapter
   inputs: no fresh damage/HP/XP/terminal/phase changes or RNG draws. Old disposed owner
   operations retain their invariant errors. Page reload/manual create is not this proof.
8. Unmodified production preview: movement/Dash/pause/automatic combat, ordinary incoming
   damage/Death/actual RETRY, no DEV API or combat debug controls/UI, no new runtime errors.
   Inspect console and distinguish known favicon404/Vite >500kB warning. Report normal
   boots, tracked fixtures, internal real Scene harness and native cycles separately.

These are FUTURE implementation acceptance requirements; no new browser/runtime validation
is claimed by this definition-only change.

**Definition validation, exclusions and later documentation**

Now change only docs/TASK_GRAPH.md, GAME-049 BACKLOG->READY and current status wording.
Preserve historical task instructions, GAME-046/047/048 DONE, GAME-040/041 SUPERSEDED,
GAME-050+ BACKLOG, GATE A PASSED and GATE B NOT PASSED. No runtime/test/config/dependency
or CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/GAME_DESIGN/CONTENT_MANIFEST/BALANCE edits.
No EnemyDefinition/scaling/spawn migration, EnemyDeathRecord/last-source state/distribution,
Impact/Armor/resistance/crit/random damage/penetration/status framework, new enemies,
weapon catalog/specializations/fragments, Director/difficulty/Core/Active/Medical content,
XP/reward redesign, generic collision/combat engine, global service/event bus or package.

Run npm run check and git diff --check; verify single-file scope, stage only explicit
docs/TASK_GRAPH.md, run cached check/stat, inspect COMPLETE git diff --cached. Generate
ignored .codex-review/GAME-049-review.txt with AGENTS.md sections, branch/base, complete
combat inventory/types/ownership/arithmetic/geometry/source/death/Impact decisions,
future tracked/native acceptance and full staged diff. Never stage review artifacts or
commit/push/merge/reset/rebase/change branches. Only successful separately authorized
implementation with required tracked AND actual native/browser validation may set
GAME-049 DONE and update factual CURRENT_STATE/PROJECT_GRAPH. GAME-050+ need their own
definition/review; GATE A stays PASSED, GATE B needs its actual prerequisites/gate review.

**Implementation completion evidence**

Implemented the approved concrete combat.ts contracts/four pure APIs, copied/frozen launch
snapshots, Scene-local exact-run Hit and common EnemyDamage/PlayerDefense adapters. All
three HP subtraction paths now use one healthAfter assignment; kill/XP/terminal ownership,
strict geometry/ties, full Cluster union, Prism/Twin independence and existing cadence stay.
No writable launch mirrors, manager/registry, later-task runtime, Impact response, new
TimerEvent/RNG/DEV method/dependency or Build/Tag/diagnostics/reward/balance change is added.

All483 baseline tests remain; 71 pure combat +16 Scene cases yield570 tests/24 files
(174 Scene), with typecheck/build passing. Actual Chrome validates all six offensive paths
through hits/HP/kill/one XP, old/new C/R/E/V/S/local/Spatial/Replication/evolution snapshots,
swept first/ties/interception and inclusive primary/satellite survivor union. Real hostile
Shield/God/protection/overflow/lethal consumption and contact boundaries remain. Active
Attack positions/Missile heading/lifetime/Defense/five event phases/four RNG counters freeze
over manual1100ms/reward700ms/genuine foreground-tab BLUR800ms; focus return needs Escape.
Death-first/Victory-first, straight/Missile/Cluster primary/satellite full cleanup before
Victory and one terminal record pass. Two Victory NEW RUN cycles, Death RETRY and PAUSED
nonterminal native scene.restart verify fresh owners/defaults/zero Tags/five events and
inert old Hits/flights/callbacks without fresh RNG. Native result controls use production
pointerdown handlers; real keyboard/mouse checks are reported separately. Unmodified
production preview passes W/Space/Escape/pause/combat, ordinary damage to HP0/5 Death and
actual mouse RETRY to HP5/5/fresh progress, absent DEV API/debug UI/new pageerrors. Production
Death was observed after73000ms; only known favicon404/Vite large-chunk warnings remain.
CURRENT_STATE and PROJECT_GRAPH map the implemented boundary. GAME-049 DONE; GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+
BACKLOG; GAME-040/041 SUPERSEDED; GATE A PASSED; GATE B PASSED. GAME-049 implementation and
GATE B are architect-approved; no commit created.

#### GAME-050 — Enemy Definitions & Spawn Snapshots

STATUS: DONE

**Goal, dependencies and definition-only scope**

Depends on GAME-049 DONE; preserve GAME-039/042..049 DONE and architect-PASSED GATE A/B.
EnemyDefinition + explicit neutral scaling/spawn context -> detached immutable
EnemySpawnSnapshot -> concrete Scene EnemyRuntime. This is a data-authority migration,
not a content/difficulty/AI/scheduler rewrite. Only TASK_GRAPH changes now: GAME-050
BACKLOG->READY; GAME-051+ BACKLOG; GAME-040/041 SUPERSEDED. Separate implementation
authorization follows definition review. No source/tests/other docs/dependency changes
or new runtime/browser verification are claimed by this definition.

**Current-HEAD audit and exact inventory**

Baseline: e2af05148540399011723907bf85a07b100488e4, GAME-049 combat resolution.
Read complete TASK_GRAPH, CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH,
CONTENT_MANIFEST and BALANCE. Source is implementation truth. PROJECT_GRAPH's older
GATE B/provenance sentence is not status authority and remains unchanged here; GATE A/B
are architect PASSED. Reinspect the following anchors before implementation.

Scene anchors are src/game/scenes/GameplayScene.ts at this HEAD:

| Source / anchor | Existing authority and migration constraint |
| --- | --- |
| EnemyArchetype74; enemyData76..81; eliteTankData83..86; wardenPhaseTwo88 | Lowercase chaser/shooter/tank/boss, base health/speed plus visuals, explicit Tank overrides and concrete Warden phase2 speed/style. No definition/scaling/snapshot module exists |
| EnemyRuntime92..100; contactDamage174; enemyRadius211 | Current health/visual/identity and readonly Elite/contact/XP/radius. Speed rereads global data each frame; no captured enemy run or frozen spawn snapshot |
| create235..405, resets265..300, Chaser333 | PREPARING lifecycle -> Build -> Defense -> reset/player/HUD/Drone -> initial Chaser -> five events/input/UI -> start384 -> crypto RunRandom385 -> diagnostics394..397 -> DEV405 |
| update417..483, movement443..467; restoreEnemyOutline608..612 | Concrete pursuit/Shooter step; current HP selects Warden speed/style; clamp max(25,radius), then target, protection, straight/Missile/contact/XP |
| createEnemy1262..1274 | isElite=tank && eliteTank; polygon/stroke then runtime full HP; Boss flag after creation; RUNNING-only spawn observation |
| spawnEnemy1356..1390; sequence90 | Active player/cap/live-Boss guards, two Encounter draws, CCCSCT/Elite or Warden replacement, placement, common creation, successful count+1 |
| enemies/eliteTank.ts; enemies/warden.ts; enemies/shooterMovement.ts | Tank-only divisible-by12 promotion, Warden30, absolute current-HP30 phases and4/8 bursts; pure supplied speed/delta/band step; no RNG |
| contact828..849; damagePlayer862..875 | First inclusive R44/60, minimum bounded separation, ENEMY_CONTACT from runtime contactDamage, current Defense/God/protection/Hull-only metrics |
| hostile fire1020..1053; nearest1111..1129 | Nearest Shooter plus independent first live Warden on one event; frozen HOSTILE_PROJECTILE1/600/6/3000. Strict nearest ties/optional origin/archetype filters |
| applyEnemyHit852..860; combat/combat.ts; killEnemy1246..1260 | Exact Hit run/membership/positive HP -> phase damage -> single healthAfter write -> common Boss/removal/one XP/kill diagnostics; no retained source/death record |
| straight1055..1109; Missile1172..1243; Death877/Victory906 | Swept bodies, full primary/satellite union and owning cleanup before first terminal; native result controls |
| DEV1288..1354; RunDiagnostics.ts spawn/kill methods | Five commands, detached views; deterministic one-Warden-per-run path and HP-only setter1..60. Counts lowercase archetypes/Elite subset/dropped integer XP; initial spawn bootstrapped once after RUN_STARTED |
| RunLifecycle.ts; RunRandom.ts; input/pause/cleanup | First terminal and exact captured owner disposal, four independent streams, existing Clock projection and native scene.restart |

Current baseline570 tests/24 files includes174 Scene,71 pure combat,52 Build,35 Defense,
35 diagnostics,7 Shooter movement,7 Elite and14 Warden cases. Relevant Scene anchors:
fixed-seed placement483..541, spawn/kill diagnostics754..812, terminal257..353,
contact1229..1259 and typed combat1277..1393. Preserve assertions; ignored harnesses
do not replace tracked production-path or actual native acceptance.

maxHealth is authored maximum and initial current health; health then becomes mutable.
Exact source values, not target-design examples:

| Archetype / variant | Max / initial HP | Movement px/s / rule | Radius | Contact | XP |
| --- | --- | --- | --- | --- | --- |
| chaser BASE | 3 /3 | 180 pursuit | 24 | 1 | 1 |
| shooter BASE | 2 /2 | 140; approach above500, retreat below350, hold inclusive350..500 | 24 | 1 | 1 |
| tank BASE | 6 /6 | 100 pursuit | 24 | 1 | 1 |
| tank ELITE_TANK | 18 /18 | 120, same pursuit | 24 | 2 | 5 |
| boss BASE (legacy Warden) | 60 /60 | 70 at HP>30,100 at0<HP<=30, pursuit | 40 | 2 | 10 |

Keep exact presentation in Scene, outside numerical spawn snapshots. Dimensions are
local point bounding boxes, not collision circles or placement offsets:

| Identity | Local points / dimensions | Fill / normal outline / width |
| --- | --- | --- |
| Chaser | [24,0,48,24,24,48,0,24],48x48 | 0xf43f5e /0xffcdd2 /2 |
| Shooter | [8,8,40,8,40,40,8,40],32x32 | 0xa855f7 /0xe9d5ff /2 |
| Tank / Elite | [12,4,36,4,48,24,36,44,12,44,0,24],48x40 | Tank0xf59e0b /0xfef3c7 /2; Elite0xfacc15 /0xfffbeb /3 |
| Warden | [40,0,68,12,80,40,68,68,40,80,12,68,0,40,12,12],80x80 | phase1 0xd946ef /0xfae8ff /3; phase2 0xdc2626 /0xfb923c /3 |

Target stroke0xfde047/4 restores regular2/Elite3/current Boss-phase3. Preserve polygon
origin/placement; never derive collision radius from half-width. No new bars/art/VFX.
All enemies move relative to the player and remain eligible for existing weapon targets.
Chaser/Tank/Elite never fire. Only nearest Shooter fires per callback, at any range when
aim>=0.001; its absence/near-zero aim cannot cancel the independent Warden burst. One
existing1500ms event launches orange0xfb923c shots D1/speed600/radius6/lifetime3000.
Warden angles are0/90/180/270 above30, eight0/45/.../315 at positive HP<=30; no new timer,
immediate phase volley, reset or friendly fire. Ordinary deaths drop1 XP, Elite5, Boss10;
common Boss removal sets defeat, then completed owning attack requests Victory.

**Focused pure representation and neutral scaling seam**

For separately authorized implementation, prefer src/game/enemies/EnemyDefinitions.ts
and EnemyDefinitions.test.ts. No Phaser/Scene/Run/Build/RNG/diagnostics reference/import
in the pure module. One fixed deeply immutable authored table; no EnemyManager, generic
registry, components, behavior-tree DSL, property bag, dynamic scripts or loader.
Pin these semantic fields/discriminants (equivalent closed-union organization is allowed):

```typescript
type EnemyArchetype = 'chaser' | 'shooter' | 'tank' | 'boss';
type PursuitMovement = Readonly<{ kind: 'PURSUIT'; speed: number }>;
type ShooterMovement = Readonly<{
  kind: 'SHOOTER_BAND'; speed: number; minimumRange: number; maximumRange: number;
}>;
type WardenMovement = Readonly<{
  kind: 'WARDEN_PURSUIT'; speed: number; phaseTwoSpeed: number;
}>;
type EnemyNumbers = Readonly<{
  maxHealth: number; collisionRadius: number; contactDamage: number; xpValue: number;
}>;
type EnemyDefinition = Readonly<EnemyNumbers & (
  { archetype: 'chaser' | 'tank'; movement: PursuitMovement }
  | { archetype: 'shooter'; movement: ShooterMovement }
  | { archetype: 'boss'; movement: WardenMovement }
)>;
type EnemyScalingProfile = Readonly<{ kind: 'LEGACY_NEUTRAL' }>;
type EnemySpawnContext = Readonly<{
  scalingProfile: EnemyScalingProfile; variant: 'BASE' | 'ELITE_TANK';
}>;
type EnemySpawnSnapshot = Readonly<EnemyDefinition & { isElite: boolean }>;
declare function createEnemySpawnSnapshot(
  definition: EnemyDefinition, context: EnemySpawnContext,
): EnemySpawnSnapshot;
```

ENEMY_DEFINITIONS has exactly four lowercase keys and the audited values. Each nested
movement record is frozen: Shooter140/350/500, Warden speed70/phaseTwoSpeed100. Fixed
ELITE_TANK_PROFILE has only maxHealth18/speed120/contactDamage2/xpValue5. Frozen
LEGACY_NEUTRAL_SCALING_PROFILE={kind:'LEGACY_NEUTRAL'} and deeply frozen
DEFAULT_ENEMY_SPAWN_CONTEXT={scalingProfile:...,variant:'BASE'} define normal production.
Require the explicit context argument; undefined/malformed inputs are not default requests.

The neutral profile performs NO stat scaling. This is the minimal authored calculation
seam, not completed Director/Stage difficulty. No speculative multipliers, stage/time,
pressure, raw level/tag total, maturity or Analyzer inputs. Unsupported profile kinds and
extra context fields reject. Non-neutral scaling waits for separately authored formulas
and review; BALANCE's75/15/10 is not a formula. Do not add a fake formula to test overflow.

Factory: validate definition/context -> explicit Tank-only fixed variant overrides ->
copy primitive values and a NEW nested movement -> validate final values -> freeze both.
BASE isElite=false; ELITE_TANK true ONLY for tank, retaining its radius and PURSUIT role.
Override18/120/2/5 is authored content, not guessed3x/1.2x/2x multipliers. Snapshot has
exactly archetype/maxHealth/collisionRadius/contactDamage/xpValue/movement/isElite and
the appropriate exact movement fields. Validate pairing despite isElite:boolean alone
not expressing Tank-only membership. Every call returns distinct frozen nested values;
retain no table/input/context/profile objects. No current HP/position/visual/points/color,
target/run/owner/timestamp/RNG/Build/difficulty object or unused profile/source ID in it.

Scene presentation data keeps only points/fills/outlines; migrated gameplay numbers have
no writable Scene duplicates. Existing hostile launch/cadence values remain GAME-049
configuration, not extra fields on every spawn. Layout enemyMargin25 is not body radius.

**Concrete Elite/Warden behavior and interaction deferral**

Elite promotion remains Tank-only on next successful counts divisible by12: regular6,
Elite12, regular18, Elite24. No new spawn/counter increment or future modifier catalog.
Preserve Scene's existing normalization of eliteTank=true on a non-Tank to false; the pure
factory explicitly rejects non-Tank ELITE_TANK context. Elite remains tank/isElite=true
for targeting/diagnostics, no new archetype or affix/modifier framework.

Warden absolute HP30 threshold and4/8 directions stay solely in wardenPhase and
wardenBurstDirections; no percentage of maxHealth, spawn-cached phase, duplicate unused
threshold/burst fields or generic phase engine. update selects this spawn's70/100 using
CURRENT HP;60/31 phase1,30/1 phase2,<=0 no phase. DEV31->30->31 changes phase without
cadence reset. Phase style remains presentation. Shooter speed/band come from snapshot
and feed the existing shooterMovement algorithm unchanged (already parameterized).

Target architecture names Knockback Response/Decoy Susceptibility, but no current authored
per-enemy coefficients exist. Do not infer0/1 from HP/speed or add placeholders. GAME-052
must author those values/mechanics. No Impact force, Armor/status/resistance, Swarm/Charger,
other future role, Elite catalog, Juggernaut or BossController is authorized here.

**Mutable runtime and exact-run spawn boundary**

EnemyRuntime stays Scene-local with readonly spawnSnapshot:EnemySpawnSnapshot and
readonly run:RunLifecycle, mutable health and Phaser visual/current position. Existing
Scene scratch movement/targets stay concrete; no per-enemy phase/FSM/velocity state is
invented. Initialize health=spawnSnapshot.maxHealth ONCE; damage/DEV never reset it from
maximum. No second HP/max/speed owner. Existing readonly identity/contact/XP/radius
compatibility getters may derive from spawnSnapshot; never stored numerical mirrors.
Movement reads this enemy's frozen speed/band/phaseTwoSpeed, not current global content.

Keep one common createEnemy, minimally adapted to receive explicit captured run rather
than defaulting an old invocation to this.run. Guard exact owner first; permit existing
initial Chaser in PREPARING, normal timed/DEV requests only in RUNNING under original
availability checks. Reject stale/PAUSED/TERMINAL/DISPOSED before factory/visual/array/
flags/accounting. Select immutable definition/neutral context (Elite variant if required),
construct exactly ONE snapshot, then polygon/stroke/runtime push/full initial HP/Boss flag/
normal spawn observation. Returning created runtime or null is acceptable so caller
counter/API success reflects completed creation. No new run owner/disposal listener.

Equivalent private signature: createEnemy(x,y,archetype,run,eliteTank=false):EnemyRuntime|null.
Initial creation passes create's captured const run. The existing timer closure passes its
captured run through the timed-spawn bridge; DEV publication captures its own run before
creating its closures. Preserve their original guards and reject an old run before draws
or construction; do not obtain a fresh token from this.run inside a retained old closure.

| Path | Preserved creation order and result |
| --- | --- |
| Initial Chaser | Player2400/1350 -> chaser3000/1350 during PREPARING, BASE3HP/180/radius24/contact1/XP1; count0/flagsfalse, no RNG/diagnostics yet. Five timers/start/entropy follow, then RUN_STARTED/initial spawn once |
| Normal timed | Captured callback/active player/cap10/live-Boss guards -> schedule/placement -> common neutral BASE creation -> completed spawn observation -> successfulTimedSpawns+1 |
| Elite | Same event/path/count12 or24, tank+ELITE_TANK -> one18/120/24/2/5 snapshot, no separate count |
| Timed Warden | Next successful30 && !bossSpawned replaces scheduled Tank with boss BASE60/70+100/40/2/10; creation sets bossSpawned; counter30; live Boss suppresses later timed creation/count/draws |
| DEV Warden | Existing valid active API/player, both flagsfalse/no live Boss/cap room/deterministic valid corner and distance>=600 -> common boss BASE creation; no RNG/timed increment; second request returns false |

Blocked pipeline attempts (cap/missing player/non-RUNNING/live Boss/DEV prior flags or
infeasible placement) create ZERO snapshots/visuals and consume ZERO procedural draws.
Reading the fixed definition for placement margin is not snapshot construction. Do not
construct one candidate at each guard and another in createEnemy. Invalid authored data/
context fails before affected visual/array/HP/flags/success-count/observer mutation; no
swallowed error, partial enemy, invalid-data clamp or generalized RNG rollback transaction.

**Preserved schedule, placement, movement and target rules**

Exactly the existing2000ms event, cap10, count0 on restart and CCCSCT indexed by successful
count%6. Initial/DEV creation excluded; blocked attempts preserve pending Elite12/Warden30,
kills free slots without rewinding. Warden live health>0 suppresses timed spawns. Boss
creation sets bossSpawned; common death retains it and sets bossDefeated; Victory prevents
spawn31. Preserve shouldSpawnWarden(nextCount,bossSpawned) and shouldSpawnEliteTank; no
wave/pressure/Director/capacity reservation/portal rewrite or extra scheduling conditions.

Accepted timed placement consumes precisely TWO Encounter draws: floor(next()*4) maps
0left/1right/2top/3bottom, then only the selected edge's varying worldView coordinate.
Keep48px beyond-edge offset for ALL types (not actual polygon width), arena4800x2700,
clamp margin25 normal/Elite or40 Boss, and distance<600 deterministic opposite-half corner
fallback without a third draw. A fixed chosen-definition radius read may replace repeated
Boss40 literals: max(25,radius) must still yield25/40. DEV uses deterministic opposite
corner with valid body margins/inclusive>=600. Placement/RNG never moves into the factory.

Pursuit=min(selected speed*delta/1000,current player-center distance), normalized, no
overshoot/zero-distance fault. Shooter keeps inclusive350..500, nearest-edge step cap,
coincident +X retreat; Warden selects stored70/100 via current HP. Clamp centers by
max(25,spawn radius). Enemy overlap remains valid. No pathfinding/steering/crowd/force/FSM.
Retain update order: player/Dash -> Drone -> enemies -> target -> protection -> straight
shots -> Missile -> contact -> XP. Strict squared-distance< / array ties, optional
origin/archetype filter, Drone actual origins and Missile target retention/reacquisition
remain unchanged; no new priority/eligibility or second simulation/targeting pass.

**Combat, death, terminal and diagnostics boundaries**

Spawn values do not replace GAME-049 immutable Attack launch truth. Contact uses current
enemy's spawn contactDamage to create the same ENEMY_CONTACT; first inclusive R44/60
separation uses GAME-048 minimum translation/coincident+X/player bounds, even God/protected,
then typed current Defense/God/protection/Shield/Hull routing. Stop after first attempt;
PAUSED/terminal do no geometry/damage. Hostile shots retain their own1/600/6/3000 factory,
Shooter/Warden patterns/cadence/consumption, never current PlayerBuild damage calculation.

All six Laser/Prism/Missile/Cluster/Drone/Twin paths stay applyEnemyHit -> mutable health
-> existing killEnemy. Require enemy.run===hit.run as well as exact current run/RUNNING/
membership/positive HP. Preserve one healthAfter write, negative transient overkill HP,
calculated-vs-actual loss and immutable Attack source. killEnemy retains membership/once
guard, Boss flag, pickup at death position with snapshot XP1/5/10, target clearing,
destroy/splice and kill/drop accounting. Any retained removal callback requires that
enemy's exact run before fresh arrays/XP/flags/diagnostics; no source reconstruction,
EnemyDeathRecord/lastDamagingSource/distributor/Medical/objective pipeline or event service.
Those are GAME-051, still BACKLOG; no new alive/dead authority is introduced.

First legal RunLifecycle terminal wins. Straight Boss hit completes HP/kill/drop/own
projectile destruction+splice before Victory. Missile completes FULL primary, FULL
optional surviving satellite union and Missile cleanup before Victory, even primary Boss
kill. No terminal inside pure definitions/snapshots/factory/movement/kill/intermediate
explosion. Hostile lethal commits Defense/Hull telemetry/Death then consumes its shot;
unrelated later work freezes. One terminal/result, Boss XP10 visible/frozen/uncollected;
no direct XP credit, extra outcome priority, deferred transaction or terminal queue.

RunDiagnostics schema/six semantic timeline kinds unchanged. Each successful normal/
Elite/timed Boss/DEV creation counted once; initial PREPARING Chaser bootstrapped once
after RUN_STARTED, without moving creation or recreating enemy. No count for blocked/
invalid attempts, duplicate kill/XP or enemy snapshot timeline row. Elite is tank subset;
normal Hull-loss/XP collection/dev-credit/terminal observations and ordering stay exact.

**Numeric validation, detachment and neutral limits**

Require exact definition/snapshot/nested movement/context/profile fields and closed
discriminants/archetype-movement/Elite compatibility; reject missing/extra/malformed data
with RangeError before affected Scene mutation. All numeric values are actual finite
numbers <=Number.MAX_SAFE_INTEGER. maxHealth/body radius/contactDamage/all current speeds
strictly positive; valid fractions allowed. Shooter ranges positive with minimum<maximum,
fractions legitimate; retain inclusive runtime boundaries. XP is POSITIVE safe integer
(current1/5/10), no negative/fractional/zero-XP invented role. Mutable health after damage
may be fractional/transiently negative and is not forced back to a positive spawn maximum.

Validate table and final snapshot, including Elite overrides. Reject nonnumbers, null/
undefined, NaN/infinities, invalid zero/negative/unsafe values or incompatible pairing;
no coercion, rounding, epsilon, repair, arbitrary balance cap or silent content clamping.
Neutral construction does no multiplication: overflow coverage rejects unsafe inputs/
final values, not an invented non-neutral formula solely to make a product overflow.
Future authored arithmetic must validate results, but is not authorized here.

Deep-freeze authored table/definitions/nested movement/profile/Elite data and each copied
snapshot/movement. No input/context reference survives; repeat construction equal values,
distinct objects, no source mutation. Internal tests may copy an EXISTING definition,
construct, then alter caller's valid numeric data: old spawn unchanged, later construction
reflects current valid supplied copy. Unsupported context mutation rejects a later call
without mutating old spawn; do not invent non-neutral scaling to demonstrate this.
Production frozen definitions are never mutated/reloaded through a new API. No generic
freeze utility/library, mutable visual/EnemyRuntime/run/Build/RNG reference in pure data.

**Run lifetime, pause, DEV and isolation**

Static immutable definitions may be shared/read after restart; every successful runtime
has its own fresh snapshot and exact captured RunLifecycle OUTSIDE the pure data. Data
alone grants no authority. Creation/mutating combat/removal/retained callbacks reject old
run before fresh collection/Defense/XP/Boss/terminal/RNG/observer work, retaining membership
checks. Do not transplant/rebind old runtimes to fresh this.run or create an immutable-data
disposal owner. Old snapshots remain harmless readable values; old callbacks stay inert.

Native scene.restart restores fresh physical collection/visual/target/count0/flagsfalse,
ONE initial Chaser3HP/180/radius24/contact1/XP1/BASE snapshot/currentHP3, fresh lifecycle/
Build/Defense5/max5/Shield0/protection0/twelve zero Tags/empty identity/RNG/input/
diagnostics/API, unpaused Clock/five new events. Shared definitions retain their frozen
baseline; no per-run mutable registry/definition-identity inequality requirement. Existing
old owner reads/mutations and old timer/input/focus/reward/result/API/cleanup disposal
contracts remain; stale enemy/Hit cannot produce fresh XP/terminal or fresh RNG draws.

Exactly five events: spawn2000, Laser local/FireControl, Missile1800/FireControl, Drone
local/FireControl, hostile1500. Preserve same three player cadence resets/local effects.
Reads/construction never reset/schedule a timer or add delayedCall/polling/timeScale/Clock.
MANUAL/REWARD/genuine focus pause freezes movement/health/snapshot/attacks/Defense and
five elapsed/remaining phases; resume explicit, no per-frame content/difficulty resolution.
Factory/read/validation draw0 on Encounter/Reward/World/Boss; timed placement retains2,
blocked/DEV0, World/Boss dormant. No strength read of PlayerBuild, Tags, Analyzer, raw level,
elapsed or reward state. No changes to offers/weights/XP/weapon tuning/Shield sources.

Exactly snapshot/forceLevelUp/spawnWarden/setWardenHealth/setGodMode. DEV HP setter keeps
finite1..60 current HP only (including31->30->31), no snapshot/max/count/flags/XP/cadence
change. Detached DevSnapshot unchanged; old API null/false; production API absent.
Internal ignored harness may inspect spawnSnapshot; no exposed enemy/Attack/Hit refs,
spawnEnemyType/setEnemyScaling/setDifficulty/setDefinition/HP-profile command or debug UI.

**Required tracked tests for separately authorized implementation**

Preserve all570 existing tests/24 files and174 Scene cases. Adapt fixture signatures to
explicit run/typed snapshots without setters or weakened assertions. Use actual helpers/
Scene methods, not alternate fake spawn/movement/damage algorithms.

| Boundary | Required evidence |
| --- | --- |
| Pure content/profile | Exactly four lowercase definitions/numeric defaults; Tank-only fixed Elite18/120/24/2/5; Warden70/100 plus unchanged absolute30 helper; Shooter140/350/500; neutral BASE identical, explicit context/default, deterministic equal values/distinct instances, zero RNG/Phaser dependence |
| Pure validation | Exact shapes/IDs/movement pairing, missing/extra/context/profile/Elite incompatibility, NaN/infinities/nonnumbers/nonpositive/unsafe final values; fractional non-XP valid, safe bounds, XP integral/positive, reversed/equal Shooter band; source/old snapshots unchanged on rejection |
| Pure ownership | Deeply frozen table/definition/profile/Elite/snapshot/movement, copied caller input, source not mutated; old record survives valid copied-configuration change, new construction sees current values; unsupported context fails, no non-neutral engine/content invented |
| Scene boot/factory | Initial Chaser PREPARING3000/1350 exact snapshot/HP3, before entropy/start; count0/flagsfalse, RUN_STARTED then initial spawn once, unchanged owners/Tags/seed/five events/commands. Exactly one snapshot per successful initial/normal/Elite/timed or DEV Boss; zero for blocked paths; invalid input before visual/array/HP/flags/count/observer effects |
| Schedule/placement | Actual CCCSCT/fixed-seed golden placements, regular6/Elite12/regular18/Elite24, cap-delayed12/30, Warden30/flags/live suppression/no spawn31 after Victory; two Encounter draws/fallback0/DEV0, offset48/margins25/40/distance600 |
| Movement/target/style | Snapshot movement reads; pursuit/no overshoot; Shooter inclusive edges/coincidence/large steps; Warden60/31/30/1/dead and31->30->31 speeds/styles/bursts; body dimensions/circles/highlight restore, strict ties/interception/reacquisition; no live global-stat reread |
| Combat/contact/terminal | All six offensive paths, immutable old/new Attack/source, real HP reduction/exactly-once XP; regular/Elite/Warden contact R44/60 and D1/2 separation/God/protection/Shield/Hull; hostile patterns/consumption; Death-first/Victory-first/straight/Missile/Cluster primary/satellite full owning cleanup before single terminal |
| Isolation/diagnostics | Five actual timers/same phases/reset policy, zero extra four-stream draws and exact existing placement budget, no Build/Tag/Analyzer/level/difficulty effects, unchanged offers/schema/initial spawn/spawn-kill-Elite-XP accounting, no enemy timeline, detached five-command DEV |
| Lifetime | Readable old snapshot; stale enemy/Hit/creation/removal/callback cannot mutate fresh enemies/Defense/XP/Boss/terminal or draw fresh RNG; old owners disposed; fresh initial snapshot/owners/Clock/five events on reused Scene |

Reuse shooterMovement/eliteTank/warden, combat/collision and installed Phaser Clock tests.
Pure data tests are not substitutes for real Scene schedule/combat/lifetime acceptance.

**Required actual browser/native acceptance for separately authorized implementation**

1. Normal DEV root: correct initial Chaser snapshot/currentHP3, RUNNING, fresh Build/
   Defense5/5/0/0/zero Tags/seed/diagnostic bootstrap, five observed events/five commands.
2. Actual scheduled spawning: CCCSCT, Elite12/24, Warden30, cap-delayed12/30/live Boss
   suppression, placement/clamp/fallback and exact Encounter budget; deterministic DEV
   Boss count0/draw0. Observe real Clock dispatch plus controlled internal long-schedule
   advancement; clearing enemies internally is fixture setup, not natural-play evidence.
3. Actual Chaser/Tank/Elite pursuit, Shooter approach/hold/retreat, Warden current-HP70/100
   movement/style/bursts/31->30->31, nearest/ties/body geometry. Nearest Shooter only plus
   independent Boss hostile attempt, same cadence and no phase-entry volley.
4. Actual Laser/Prism/Missile/Cluster/Drone/Twin hits/HP/kill/XP, old/new immutable launch
   snapshots, hostile/contact, God/protection and internal nonzero Shield/overflow/lethal.
5. Inspect frozen actual enemy snapshot/movement. INTERNAL copied-existing-definition
   fixtures prove old spawned values unchanged after caller/config/context mutation;
   later construction sees authorized neutral/variant values/current valid definition
   copy. Non-neutral context rejects; no live public scaling/config mutation feature.
6. Real W/Space/Escape, MANUAL/REWARD and genuine foreground-tab BLUR: record enemy
   health/position/snapshot, active flights, Defense, all five event identities/phases and
   four RNG counters; meaningful paused wall time changes none, explicit resume only.
   Synthetic HIDDEN/VISIBLE evidence reported separately from genuine focus loss.
7. Actual Death-first/Victory-first; straight/Missile/Cluster-primary/Cluster-satellite
   Boss kills; full owning attack work/removal before one terminal/record/UI, frozen
   uncollected XP10 and no unrelated postterminal work.
8. TWO Victory->NEW RUN, ONE Death->RETRY and ONE PAUSED nonterminal native scene.restart.
   Dirty/capture old enemy/snapshot/Hit/flight/callback refs. EACH fresh one Chaser3/180/
   24/1/1/snapshot/currentHP3/count0/flagsfalse, owners/zero Tags/RNG/input/diagnostics/
   API/unpaused Clock/five fresh events. Old enemy/Hit/callback cannot affect fresh
   enemies/Defense/XP/Boss/terminal or draw fresh RNG; disposed-owner operations retain
   invariant errors. Reload/manual create/fixture reset is not native restart proof.
9. Unmodified production preview with ordinary input/rendered output: movement/Dash/
   Escape pause/resume/combat, ordinary damage/Death/actual RETRY click, absent DEV API,
   no new debug UI/pageerrors. Inspect console; separate known favicon404/Vite >500kB
   warning. Distinguish tracked/internal/ordinary boot/actual native evidence honestly.

These are FUTURE implementation requirements, not new runtime verification now. A later
implementation cannot mark GAME-050 DONE with missing actual browser/native acceptance;
report the limitation rather than substituting fixture evidence.

**Exclusions, definition validation and later documentation**

No GAME-051 death record/last source/distribution; GAME-052 interaction/Impact/Decoy/new
roles; other enemy/Elite content; Juggernaut/BossController; Director/time/level/maturity
scaling, waves/reservations/portals; XP/reward/Analyzer redesign, Active/Core/Medical/world
mechanics, Armor/resistance/status/crit/new Attack taxonomy, health bars, generic entity/
registry/manager/framework/ECS/DI/event bus/service locator, scheduler/timer/dependency,
save/profile/network. Future task nodes/target ownership names are not authorization.

Now change ONLY docs/TASK_GRAPH.md: this definition, GAME-050 BACKLOG->READY and necessary
current TASK_GRAPH status wording. Earlier DONE facts and GAME-040/041 SUPERSEDED remain;
GAME-051+ BACKLOG, GATE A/B PASSED. Preserve historical definitions/pre-review requirements.
No CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/GAME_DESIGN/CONTENT_MANIFEST/BALANCE/source/
test/config/package changes. Run npm run check and git diff --check; verify single-file
scope, stage explicit TASK_GRAPH, run cached check/stat and inspect COMPLETE cached diff.
Generate ignored .codex-review/GAME-050-review.txt with AGENTS.md sections, branch/base,
exact inventory/numbers/types/neutral context/immutable-vs-mutable/create-spawn anchors/
isolation/death boundary/future tests/native requirements and COMPLETE staged diff.
Never stage artifacts or commit/push/merge/reset/rebase/create/switch branches. Only
separately authorized implementation passing required tracked AND actual native/browser
checks may set GAME-050 READY->DONE and update factual CURRENT_STATE/PROJECT_GRAPH.
GAME-051+ require their own definition/review; GATE A/B remain PASSED, no other gate closes.


**Implementation completion evidence**

EnemyDefinitions.ts now owns the four exact legacy authored definitions, fixed Tank-only
Elite overrides and explicit neutral context; its factory validates exact shapes/numbers,
copies and freezes distinct spawn/movement records without scaling or RNG. Scene runtimes
capture snapshot/run with derived identity/contact/radius/XP getters and separate current
health; movement reads owned values, presentation stays local. Initial PREPARING creation,
captured timed/DEV owner propagation, target.run Hit validation and current-run/membership
removal guards preserve bootstrap, CCCSCT/Elite12+24/Warden30, placement/draw accounting,
five events, diagnostics, contact/Defense, six attacks and complete cleanup before terminal.
No GAME-051 death/source pipeline or later difficulty/content/runtime domain was added.

npm run check passes739 tests/25 files: all570 baseline cases retained, plus136 pure
EnemyDefinitions and33 Scene cases (207 Scene total). Actual Chrome/Phaser verifies real
Clock dispatch and controlled long schedule (internal collection clearing), cap-delayed
12/30,60 Encounter draws, movement/styles/hostile bursts, frozen/caller-detached values,
six combat paths and old/new Attack compatibility. Real W/Space/Escape, reward and genuine
foreground-tab BLUR freeze enemy HP/position/snapshot, active attacks, Defense, five same
Clock events/phases and four RNG counters; focus return requires explicit resume. TWO
Victory NEW RUN cycles, Death RETRY and PAUSED nonterminal native scene.restart each
restore exact initial snapshot/owners/counts/flags/five events and reject stale enemy,
Hit, creation/removal/timer/input/focus/reward/result/DEV/cleanup callbacks with zero fresh
RNG. Unmodified production input/movement/Dash/pause/combat/ordinary damage/Death and real
pointer RETRY pass, with no DEV API/debug UI/pageerrors. Existing favicon404 and large
bundle/Vitest worker advice only. CURRENT_STATE/PROJECT_GRAPH reflect implemented truth.
GAME-050 DONE; GAME-051 DONE; GAME-052 READY; GAME-053+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A/B PASSED. GAME-050
implementation is architect-approved; no commit is created in this definition task.

#### GAME-051 — Authoritative EnemyDeath Pipeline

STATUS: DONE

**Goal, dependencies and definition-only scope**

Depends on GAME-049 DONE and architect-approved GAME-050 DONE. Preserve GAME-039/042..050,
GAME-040/041 SUPERSEDED and architect-PASSED GATE A/B. Define one synchronous accepted
lethal Hit -> actual HP transition -> immutable EnemyDeathRecord -> exactly-once concrete
XP/Boss/diagnostic consequences -> owning Attack cleanup -> optional existing Victory.
This task changes ONLY TASK_GRAPH: GAME-051 BACKLOG->READY; GAME-052+ remain BACKLOG.
No runtime/tests/other docs/dependency change or new browser verification is claimed.
Implementation requires separate architect approval and explicit implementation authorization.

**Current HEAD audit: complete death chain and ownership**

Audit baseline: b4a62ae8b5f76fa6a147400b25ca89477678ce79,
GAME-050 implement enemy definitions and spawn snapshots. Read complete TASK_GRAPH,
CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH, CONTENT_MANIFEST and BALANCE.
The map's baseline describes earlier staged work; actual HEAD/source/tests are authoritative.
Current actual baseline739 tests/25 files includes207 Scene,136 EnemyDefinitions,71 combat,
35 diagnostics,52 Build and35 Defense cases. Older historical test-count prose is not the
new baseline. Reinspect these HEAD anchors before implementation; line numbers may move.

| Current source / anchors | Actual behavior and constraint |
| --- | --- |
| GameplayScene.ts EnemyRuntime92..102 / Hit110..115 | readonly spawnSnapshot/run and derived identity/contact/XP/radius; mutable health/visual. Scene-local Hit has exact run/target/Attack and blast phase. No last source/death record exists |
| EnemyDefinitions.ts | Four frozen chaser/shooter/tank/boss definitions, fixed Elite Tank and explicit neutral context, detached frozen spawn/movement. Definition owns authored numbers; snapshot owns spawn values; neither owns current HP or death authority |
| combat.ts Attack/PlayerAttackSource/HitPhase and calculateHitDamage/calculateEnemyDamage | LASER BASE/PRISM, MISSILE BASE/CLUSTER, COMBAT_DRONE BASE/TWIN; direct full damage, Missile primary full, Cluster satellite half. H-D may be negative; hpLost=H-max(0,healthAfter), depleted=healthAfter<=0. No damage/HP arithmetic is to be duplicated |
| applyEnemyHit851..859 | Reject wrong current run/non-RUNNING, target.run mismatch, missing member or HP<=0; calculate phase damage/result, assign healthAfter once, call killEnemy only if depleted; return EnemyDamage/null. Nonlethal Hit retains enemy. No attribution retained |
| updateProjectiles1054..1108 / fireLaser / fireDroneFrom | Reverse flight order; earliest swept target with stable collection ties. Laser/Prism and Drone/Twin share direct Hit path, each nonpiercing flight independent. Hit/kill/drop occur before owning visual.destroy/splice, then newly defeated Boss may request Victory. Prism shares immutable Attack across beams; Twin has actual per-origin actions |
| updateMissiles1171..1214 / explodeMissile1216..1228 | Sweep may intercept a non-target; primary uses a snapshot of inclusive center-radius affected enemies, each full PRIMARY Hit once. No separate Missile direct-hit damage. Complete blast(s), destroy/splice Missile, then new Boss defeat may request Victory |
| explodeClusterSatellites1230..1243 | After primary removals, snapshot survivors in six-circle union; one half-damage SATELLITE Hit per survivor despite overlap. A primary survivor may receive that second hit; independent enemies may each die. Primary Boss kill does not terminate satellite work |
| killEnemy1245..1260 | Reject noncurrent/non-RUNNING enemy.run or absent member, but currently DOES NOT require depleted HP/Hit. Boss flag first, one pickup at enemy.visual position with snapshot-derived XP, clear currentTarget, destroy visual, splice collection, recordEnemyKilled. No HP subtraction or terminal inside it |
| createEnemy1262..1292 | Exact captured run guard, only initial Chaser PREPARING or normal/DEV RUNNING, one frozen spawn snapshot/full initial HP; current XP regular1/Elite5/Warden10. Boss creation sets bossSpawned; initial spawn excluded from timed count |
| updateXpPickups790..817 / creditExperience1294..1304 | Physical pickup value preserved, magnet180 (+Collector), collection20, acceleration900/max600; collected value -> addExperience -> HUD -> remove pickup -> credit diagnostics -> reward pause. Threshold5*level/overflow unchanged; kill never directly credits player XP |
| RunDiagnostics.ts recordEnemyKilled107..114 / snapshot / disposal | Current signature(archetype,isElite,xpValue); count killed.total/byArchetype/Elite and xpDropped atomically with safe sums, no death timeline. Six timeline kinds, newest256, active delta/terminal freeze; structuredClone snapshot. Observer has no gameplay/RNG references |
| enterPlayerDeath876..903 / enterRunVictory905..937 / RunLifecycle.ts | First legal terminal from RUNNING or PAUSED wins; accepted Death/VICTORY records once then input/UI. Victory requires bossDefeated and follows owning attack cleanup. RETRY/NEW RUN capture run and once/identity guards and call native scene.restart |
| create233..403 / publishDevTools1306..1370 | Captured exact run/Build/Defense/input/RNG/diagnostics cleanup on shutdown/destroy; fresh arrays/HP/flags/owners/API/five timers. DEV setWardenHealth finite1..60 current HP only, never a kill. Exactly five existing commands, production API absent |

Current production has ONE killEnemy invocation: applyEnemyHit857. No environment death,
status effect, Active damage, hostile-to-enemy friendly fire or second production remover.
Enemy health writes are initialization1279, healthAfter856 and DEV Boss health1353 only.
One XP pickup construction site1250 and one Scene kill-observer call1259. Boss defeat is
initialized/reset false209/293 and set true1249; production Victory requests are straight1092
and Missile1211. Keep these concrete authorities and existing processing order.

**All direct tracked killEnemy invocations and the compatibility decision**

All four are in GameplayScene.devTools.test.ts at this HEAD; do not assume lethal provenance:

| Line / test | Current direct invocation | Required later migration |
| --- | --- | --- |
| 196 / GAME-050 old enemy/Hit/removal lifetime | killEnemy(old) on old HP3 runtime deliberately inserted into fresh collection; old run already disposed | Preserve this rejection probe and HP3/zero fresh mutation/draw assertions. Adapt to the typed boundary with captured old Hit/context; it remains INVALID stale work, not a successful/fabricated lethal Hit |
| 763 / RNG snapshot seed/World/Boss neutrality | Removes live DEV Warden after HP30, hostile fire and a real reward choice, then explicitly calls enterRunVictory | Replace successful setup removal with an explicit valid typed lethal Hit through applyEnemyHit, using that Warden's exact run and real createAttack. Keep all stream-count, dormant World/Boss/API/terminal assertions; no invented source on a removal without a Hit |
| 962 / actual nonlethal/hit/removal diagnostics | Real projectile already killed/removed Chaser; killEnemy(enemy) is a duplicate probe | Capture the actual lethal Hit/result/source at the production boundary, then retry that same context; preserve exactly-one kill/drop/diagnostic assertions and add zero second death-record construction |
| 982 / common pickup/DEV XP split | Removes live freshly created18HP Elite Tank at player position, then collects5XP | Replace successful setup removal with explicit valid lethal typed Hit (e.g. createAttack LASER/BASE with fixture damage18) through applyEnemyHit. Preserve pickup5, collection, Level-Up/pause and DEV-credit distinctions; the explicit test Hit now supplies real provenance |

Decision: migrate the TWO successful live fixture removals to real accepted lethal Hits.
No supported source-less direct-removal path, optional source default, UNKNOWN identity,
administrative kill, HP0 setter or fallback LASER attribution is introduced. Stale/duplicate
boundary probes remain direct rejection tests with captured/invalid context, never success
shortcuts. Existing private signature may change; preserve all739 behavioral assertions.
RunDiagnostics.test.ts8/40/41/49/50/102/103 invokes the OBSERVER directly, not killEnemy:
adapt its observation fixtures to the required source argument below without weakening
start/identity/XP/overflow/terminal/disposal assertions. Reinspect all call sites again.

**Minimal copied attribution and runtime last-source rule**

Prefer one focused Phaser-free src/game/enemies/EnemyDeath.ts plus EnemyDeath.test.ts.
It may import existing combat/EnemyArchetype TYPES; no Scene/Run/Phaser/Build/RNG/diagnostics
runtime references. Reuse GAME-049 kind/variant identities; equivalent type aliases are allowed:

```typescript
type EnemyDamageSource = Readonly<
  | (Pick<LaserAttack, 'kind' | 'variant'> & { phase: 'DIRECT' })
  | (Pick<DroneAttack, 'kind' | 'variant'> & { phase: 'DIRECT' })
  | { kind: 'MISSILE'; variant: 'BASE'; phase: 'PRIMARY' }
  | { kind: 'MISSILE'; variant: 'CLUSTER'; phase: 'PRIMARY' | 'SATELLITE' }
>;
type EnemyDeathRecord = Readonly<{
  archetype: EnemyArchetype;
  isElite: boolean;
  xpValue: number;
  x: number;
  y: number;
  lastDamagingSource: EnemyDamageSource;
  killSource: EnemyDamageSource;
}>;
declare function createEnemyDamageSource(input: EnemyDamageSource): EnemyDamageSource;
declare function validateEnemyDeathRecord(input: EnemyDeathRecord): void;
declare function createEnemyDeathRecord(input: EnemyDeathRecord): EnemyDeathRecord;
```

Exactly THREE primitive source fields kind/variant/phase. DIRECT is legal only LASER
BASE/PRISM or COMBAT_DRONE BASE/TWIN; MISSILE BASE only PRIMARY; CLUSTER PRIMARY/SATELLITE.
No arbitrary system string, hostile/contact source, Active/status/environment kind, Attack
ID, Drone instance ID or source priority. Both Twin origins have COMBAT_DRONE/TWIN/DIRECT.
Scene converts only the actual synchronous Enemy Hit: ENEMY_DIRECT -> DIRECT, ENEMY_BLAST
-> that Hit.phase, and copies Hit.attack.kind/variant. Never inspect current slots/Tags,
selected target/latest fire/other projectiles or reconstruct attribution from presentation.

Add only EnemyRuntime.lastDamagingSource: EnemyDamageSource | null, initialized null by
every successful createEnemy including initial PREPARING Chaser, normal/Elite/Warden/DEV.
After all existing exact-run/member/alive guards and unchanged damage arithmetic, update
this field ONLY if result.hpLost>0. Store one newly copied frozen source value, no Attack
or flight reference/history/map. Rejects, malformed source, dead/removed/stale/paused Hit
and positive calculated damage with NO representable HP loss leave it unchanged. Preserve
the old calculated amount/result; H=MAX_SAFE_INTEGER,D=MIN_VALUE returns loss0/no depletion,
not a false damaging-source update. No epsilon, rounding or new minimum damage.

DEV setWardenHealth1..60 changes only current HP, neither resets nor invents attribution;
God Mode/PlayerDefense/Shield/hostile/contact do not participate in enemy source state.
Kill source is freshly taken from the SPECIFIC valid lethal Hit, never fallback to an
earlier last source. Lethal actual loss also updates lastDamagingSource, so both record
fields currently match by kind/variant/phase value; they remain separately named concepts.
Runtime last source may be null before damage, but completed GAME-051 combat death fields
are NONNULL because successful source-less kills are removed from the supported boundary.

**Record shape, validation, detachment and lifetime of values**

Seven outer fields exactly as above. archetype stays lowercase boss for Warden, isElite
true only tank; Boss identity derives from archetype, no redundant isBoss/Boss ID. xpValue
comes from THAT enemy.spawnSnapshot, x/y from THAT enemy's current world position, never
projectile origin, impact center, player or target-selector position. Values support XP,
Boss flags, source telemetry and the explicitly approved later objective/Medical consumers.
No current/max HP, calculated damage, timestamp, run ID, EnemyRuntime/visual/Scene/Run,
Build, Hit/Attack/flight/RNG/target reference, metadata bag or unbounded retention.
An immutable record is data only, never permission to apply consequences to another run.

Source constructor validates exact own fields and legal combinations, copies three
primitives and freezes the result. Death validation requires exact outer/source fields,
supported archetype, boolean Elite compatible with Tank, positive safe-integer XP, actual
finite coordinates with abs(value)<=MAX_SAFE_INTEGER (zero/negative/fraction coordinates
legal). It validates BOTH sources and requires equal source values for the current
combat-only lethal contract; mismatched/absent sources cannot silently credit an earlier
weapon. Production XP remains1/5/10; do not recalculate it from archetype or hardcode a new
XP formula. Validation does not clamp position to arena or move any object.

Missing/extra fields including symbols, invalid pairings, null/undefined/nonnumbers,
nonfinite/unsafe values, nonpositive/fractional XP throw RangeError. No coercion, repair,
rounding or broad catch. The narrow validator is for lethal-data preflight before mutable
HP/source commit; constructor reuses that validation, then copies all primitives and
fresh nested source records and freezes them plus outer record. It creates one completed
record only after the accepted actual HP transition; preflight creates NO completed record.
No generic validation/freezing library or transaction framework. Every source/record is
detached from caller objects; later caller/runtime/source-holder/position/Build/flight
changes cannot alter it. Records remain readable after restart without a disposal owner.
Do not retain every completed record on Scene, enemy or a global history/registry; ignored
tests/harnesses may capture the actual private boundary return with a spy.

**One synchronous lethal boundary and exact consequence ordering**

Keep applyEnemyHit as the one GAME-049 HP adapter, and extend the existing private killEnemy
as the sole completed-death/consequence boundary; do not add a competing completeDeath
service. A concrete signature equivalent to the following is sufficient:

```typescript
type EnemyHit = Extract<Hit, { kind: 'ENEMY_DIRECT' | 'ENEMY_BLAST' }>;
// Scene-private; these are synchronous accepted-hit context, never persistent metadata.
killEnemy(hit: EnemyHit, damage: EnemyDamage,
          source: EnemyDamageSource): EnemyDeathRecord | null;
```

The source is the validated projection of this Hit, not caller-selected arbitrary metadata.
No default run=this.run or optional successful source-less overload. Keep applyEnemyHit's
EnemyDamage|null return contract. The one production caller passes its actual Hit/result/
source; do not manufacture a second damage result or recalculate/subtract HP in killEnemy.

1. applyEnemyHit checks hit.run===this.run, RUNNING, target.run===hit.run, current collection
   membership and health>0 BEFORE current-owner access/mutation. Existing phase/numeric
   helpers compute the same result once. If actual loss>0, create/validate copied source.
   For lethal result, preflight the exact primitive death input before HP/source mutation;
   use prospective lastDamagingSource=source and killSource=source, not the prior stored A.
2. Assign enemy.health=result.healthAfter exactly once; if hpLost>0 replace last source
   with that frozen value. Preserve negative overkill and calculatedDamage versus actual
   hpLost. Loss0 changes no attribution and cannot complete a death. Nonlethal returns
   with the enemy still eligible; no death record, XP, kill counter or Boss effect.
3. For lethal result call killEnemy synchronously with the same Hit/result/source. Recheck
   exact captured current RUNNING run, target.run and membership BEFORE touching fresh
   collections/flags/XP/diagnostics. Require damage.healthDepleted, hpLost>0 and current
   health===damage.healthAfter AND health<=0, plus source equal to the actual Hit projection and the
   just-updated last source. Alive/ineligible/stale/removed/duplicate completion returns
   null with NO record construction/consequence. Invalid typed data fails loudly.
4. Construct exactly ONE detached frozen EnemyDeathRecord from the accepted transition's
   snapshot identity/XP, death position, last source and lethal source. Construction and
   validation perform no gameplay/terminal/RNG work. Do not accept an old record as a
   command to this method; ownership remains in its synchronous Hit context.
5. Preserve current concrete order: if record.archetype==='boss', set bossDefeated=true
   while retaining bossSpawned; create/push ONE existing lime radius10 pickup at record.x/y,
   pale outline2, value=record.xpValue, speed0; clear currentTarget if it is this enemy;
   destroy enemy visual; splice the same membership once; observe completed kill/XP/source
   through current diagnostics exactly once; return record. No XP credit on kill.
6. Caller completes its owning flight/detonation cleanup, then only its existing new-Boss
   defeat check may request Victory. No terminal call inside pure helpers, applyEnemyHit,
   killEnemy, intermediate primary/satellite hit or diagnostics.

Eligibility is existing positive HP plus exact run/membership, not an added alive/dead
enum. During synchronous lethal completion HP<=0 already blocks further Hits; completed
removal blocks all repeated completion calls. No await, callbacks to arbitrary consumers,
queued replay or reentrant gameplay dispatch is introduced between commit and removal.
After removal, retrying saved Hit/context returns null before a second record/XP/metric.
Membership and current HP suffice; no deathProcessed flag, dead-enemy Set, event ID registry,
death queue, EnemyDeathManager or generic once-only transaction/rollback mechanism.

**Physical XP, Boss and terminal consequences**

One ordinary/Elite/Warden death drops one pickup of1/5/10 at the exact death location;
the record preserves snapshot XP without multiplier/rounding. Duplicate death creates0.
Keep current pickup visual/value/magnet-speed runtime, attraction/collection,5*level
thresholds/overflow/HUD and real choice pause. Only actual later collection calls existing
creditExperience; DEV forceLevelUp stays separately labeled credit, not a death/pickup.
No new spawn counter, XP consolidation/expiry/value rule or reward formula (GAME-053+).

Boss death retains bossSpawned=true, sets bossDefeated once, removes Warden and drops10.
No second Boss spawn; no immediate Victory from record creation/flag recognition.
Straight: valid lethal Hit -> HP/source/death record/XP/removal/diagnostics -> owning
projectile.destroy/splice -> existing Victory request. Missile/Cluster: FULL primary
affected snapshot -> FULL optional surviving satellite union -> Missile.destroy/splice
-> existing Victory request. Primary Boss death must NOT truncate remaining satellite
work; every killed enemy completes its own record exactly once. A satellite Boss death
must not truncate the rest of that union. First legal terminal still wins in the existing
reverse-flight/update order; do not sort hits, invent timestamp/source priorities or
defer/queue Victory. Death-first freezes later enemy hits; Victory-first freezes unrelated
incoming/contact/XP. Colliding lethal hostile shot keeps its existing cleanup after Death.
Boss pickup10 remains visible/frozen/uncollected after Victory, result reads current Level,
one terminal/diagnostic/UI only. No second subtraction, overkill transfer, Armor/resistance,
new player-death attribution or PlayerDefense change.

| Accepted Hit sequence | Required source result |
| --- | --- |
| Laser or Prism lethal independent beam | LASER/BASE/DIRECT or LASER/PRISM/DIRECT from that beam's frozen Attack |
| Drone or either Twin bolt lethal | COMBAT_DRONE/BASE/DIRECT or COMBAT_DRONE/TWIN/DIRECT from actual bolt; no origin ID |
| Base Missile primary lethal | MISSILE/BASE/PRIMARY, no fake direct phase |
| Cluster primary lethal | MISSILE/CLUSTER/PRIMARY; removed enemy excluded from satellites |
| Cluster primary nonlethal, satellite lethal | Last source updates PRIMARY then SATELLITE; record kill/last=CLUSTER/SATELLITE |
| A damages, different system B kills | Nonlethal stores A, lethal positive B replaces last; record kill/last=B, old A action unchanged |
| Primary survivor receives nonlethal satellite | One update per actual positive loss; latest SATELLITE, no death record |
| Several enemies killed by one explosion | Each own record/XP/counter at own position, same actual phase source; no skipped splice or duplicate overlap hits |
| Repeated Hit/completion after removal | No HP/source/record/drop/counter/flag/terminal effect; no random tie-break/attack IDs |

**Minimal useful source telemetry decision**

Extend only the existing nested diagnostics aggregate with killsBySource. It has exactly
these SEVEN closed keys, initialized0 in each fresh observer:

```typescript
type EnemyKillSourceKey =
  | 'LASER.BASE.DIRECT' | 'LASER.PRISM.DIRECT'
  | 'MISSILE.BASE.PRIMARY' | 'MISSILE.CLUSTER.PRIMARY'
  | 'MISSILE.CLUSTER.SATELLITE'
  | 'COMBAT_DRONE.BASE.DIRECT' | 'COMBAT_DRONE.TWIN.DIRECT';
// RunDiagnosticsSnapshot.aggregates.killsBySource:
type EnemyKillSourceCounts = Record<EnemyKillSourceKey, number>;
```

These keys serialize the SAME validated kind/variant/phase, not a new gameplay source
taxonomy or registry. Change the existing observer operation to require a fourth argument:
recordEnemyKilled(archetype,isElite,xpValue,killSource:EnemyDamageSource):boolean.
Only the accepted completed Scene death passes its record.killSource AFTER removal;
observer receives no Hit/enemy/run/Attack/record capability. No new generic tracking API.
Reuse the narrow source validation and explicitly map the seven legal combinations.
Absent/null/malformed source rejects RangeError (there is no current supported unattributed
successful death); no optional default, UNKNOWN/unattributed bucket or inferred LASER.
Existing observer XP nonnegative-safe-integer validation stays; Scene death record XP is
positive by GAME-050. Preserve all original killed.total/byArchetype/Elite and xpDropped
values. Prepare the new killed counts, XP sum AND selected source bucket before committing
any; validate safe nonnegative integer additions/overflow, with all fields unchanged on
rejection. A valid completed death increments exactly one source bucket, so sum of buckets
equals killed.total. No observer deduplication/authority: Scene alone establishes one death.

This is bounded current source attribution for investigation/RunReport, not per-hit history.
Do not retain source objects/full records, add ENEMY_DIED/HIT/PROJECTILE timeline rows or
alter the six existing semantic kinds,256 retention, elapsed/pause/terminal conventions.
Nonlethal/no-loss/rejected/duplicate work records0; kill count precedes later terminal.
snapshot structuredClone must detach the seven-key map; DEV exposes it ONLY inside the
existing diagnostics field, no top-level duplicate or sixth command. Fresh restart resets
all buckets0, terminal freezes them, disposed reads/mutations retain invariant errors.
No analytics transport, logging every frame/hit, persistence or statistics UI.

**Lifetime, pause, isolation and future concrete consumers**

All newly mutation-sensitive work carries the original Hit.run/target.run. Recheck exact
current run/RUNNING/member before HP/source/death/removal/drop/flags/observer access;
never replace an old token with current this.run or use a detached record as authorization.
Retained old Hit/enemy/completion callback cannot mutate a reused Scene's fresh enemies,
target, XP, Boss/terminal/Defense/diagnostics or draw fresh RNG, even if an old runtime is
accidentally present in its array. Native scene.restart remains physical cleanup; no
transplant, new owner/listener/reset service or mutable death/source global is required.
Old immutable spawn/source/death values remain readable; old Build/Defense/RNG/input/
diagnostic disposal contracts and API invalidation remain exact.

Fresh run: one PREPARING-created Chaser at3000/1350/currentHP3 with baseline frozen spawn
snapshot and lastDamagingSource=null; count0/flagsfalse, fresh lifecycle/Build/Defense
Hull5/max5/Shield0/protection0, twelve zero Tags/empty identity, RNG/Input/Diagnostics/API,
all kill counters0, RUNNING/unpaused Clock and five fresh events. Preserve initial Chaser/
five events -> successful run.start -> crypto/RunRandom -> RUN_STARTED/one initial spawn
observation -> DEV publication. No PREPARING damage/source, entropy or procedural draw.

MANUAL/REWARD/FOCUS_LOSS freeze enemy HP/source/death progression, active flights, XP,
Defense and all five same-event phases. Focus return never auto-resumes. No death during
pause/terminal, no deferred consequences delivered on resume. Exactly five TimerEvents
remain spawn/Laser/Missile/Drone/hostile; no delayedCall/interval/death scheduler/timeScale.
Source/record creation/validation/consequences/reads consume ZERO additional Encounter,
Reward, World or Boss draws. Existing spawn2/blocked0/DEV0/offer budgets stay; World/Boss
dormant. Build stats/Tags/Analyzer, neutral enemy scaling, attack launch values, cadence,
enemy content/AI/geometry, rewards/eligibility and current progression are unchanged.
Keep exactly snapshot/forceLevelUp/spawnWarden/setWardenHealth/setGodMode; no forceKill,
setKillSource/death-history command, debug UI or EnemyRuntime/DeathRecord public references.

Current consumers are explicit XP creation, Boss flag recognition and diagnostics only.
Later objectives may consume identity/Elite/death position/source; GAME-086 may use
killSource.kind===COMBAT_DRONE (BASE and TWIN) for separately authored Medical Charge;
Boss progression may inspect boss archetype; GAME-100 may read bounded source totals.
None is implemented now. No empty handlers/subscribers/consumer registry, objective IDs,
Medical formulas, permanent kill history, reward mechanics or callback payload placeholders.
No Active/status/environment damage sources, Swarm/Charger/Splitter/new Elite/Juggernaut,
BossController/Director/capacity/summon/portal architecture, Armor/crit/resistance, global
event bus/ECS/DI/framework/service locator/dependency/network/save/profile work.

**Required tracked tests for separately authorized implementation**

Preserve all739 current cases/25 files including207 Scene,136 EnemyDefinitions and35
diagnostics. Adapt only fixture signatures/data necessary for the explicit contracts above;
no removed/weakened assertions, duplicate numeric HP logic or fabricated source defaults.

| Boundary | Required evidence |
| --- | --- |
| Pure source | Exactly seven legal kind/variant/phase combinations and exact three-field shape; invalid system/variant/phase/missing/extra/null/nonobject rejected; no hostile/contact/Active source; fresh frozen copied values, caller mutation isolation, deterministic/no Phaser/RNG dependence |
| Pure death record | Exact seven-field shape, four lowercase archetypes/Elite Tank pairing, snapshot XP1/5/10 examples and positive safe XP boundaries, finite signed/fractional/zero world coords; invalid/unsafe/nonnumeric/missing/extra/source mismatch rejected without source mutation; nonnull attribution decision; freeze/detach both nested sources/outer, prior values readable after caller/source/position-holder mutation |
| Preflight/factory count | Invalid lethal primitive/source data fails before HP/last-source/flags/XP/observer mutation; zero record constructors for nonlethal/no-loss/blocked/stale/duplicate work, one per actual successful death; no separate alive/dead flag or second health write |
| Actual Hit/source | Nonlethal A stores source, lethal B correctly replaces/records B; tiny positive calculated amount with hpLost0 preserves null or prior source, no kill; invalid phase/numerics and paused/dead/missing/wrong-run reject unchanged; exact fractional/nonlethal/overkill calculated-vs-actual results retained |
| Every offensive path | Actual Laser/Prism/Drone/Twin flight kills; base Missile primary, Cluster primary/satellite; capture actual private boundary record, verify phase and immutable launch values, independent Prism/Twin hits, strict collection-order ties, no IDs/history |
| Multi-hit/AoE | Primary survivor then satellite death/source overwrite, several deaths/own positions in one blast, overlapping union once, no skipped enemy after splices, no double record/XP/diag from repeated Hit/completion |
| Consequences | XP1/5/10 from each spawn snapshot at exact death world position; no direct progression credit; unchanged magnet/collection/overflow/choice pause; target clearing/destroy/splice/Boss flag/observer order; membership/living/stale/duplicate boundary rejection, two live legacy fixture migrations preserve original assertions |
| Diagnostics | Existing totals/archetype/Elite/XP semantics, one correct seven-key bucket per completed death, zero other buckets, sum==killed.total; malformed/missing source and any source/total/XP overflow atomic; copies/serialization/fresh0/terminal freeze/disposed invariants; same six timeline kinds/no hit rows/elapsed-pause change |
| Terminal | Existing Death-first/Victory-first, straight cleanup and full Missile/Cluster primary/satellite sets/removal BEFORE Victory, one result/terminal, frozen uncollected Boss10; no intermediate death-helper terminal and no unrelated postterminal damage/XP |
| Lifetime | Capture old enemy/source/spawn/death/Hit/flight and completion callbacks; native reused Scene fresh Chaser/null last source/counters0/owners/five events, old values readable; old run and accidental old membership reject BEFORE fresh arrays/flags/XP/diag, zero fresh RNG; existing old disposal errors preserved |
| Isolation/DEV/pause | Same five events/identities/phases/cadence resets, all four draw budgets and exact existing offers unchanged; Build/Tags/Analyzer/definitions/launches/Defense unchanged; nonlethal/reads/attribution add no clock/diagnostic side effects; nested counters detached, five commands only, pause freezes source/HP/deaths |

After future implementation audit EVERY EnemyRuntime HP/last-source write, death-record
construction, killEnemy caller, XP pickup construction, kill-observer call, Boss flag
write, Victory request, source/variant/phase conversion, TimerEvent construction, ambient
gameplay RNG and new callback/owner guard. Expect one HP damage assignment, initial/DEV
HP writes retained, one positive-loss last-source update, one record-construction site,
one completed-death/drop/observer path and five events; no GAME-052+ runtime.

**Required actual Chrome/Phaser/native acceptance for later implementation**

1. Ordinary DEV boot: RUNNING, fresh Chaser/current spawn snapshot/null last source,
   Hull5/max5/Shield0/protection0/zero Tags, current seed/diagnostic bootstrap and zero kill
   buckets, five observed TimerEvents and exactly five commands. Production API absent.
2. Exercise ACTUAL Scene Laser, Prism, Drone, Twin, Missile primary, Cluster primary and
   satellite Hits/deaths; capture actual last-source and completed record through ignored
   internal harness only. Verify HP loss, immutable Attack values, correct exact source/
   phase, one removal/pickup at enemy death coordinates/diagnostic bucket, no direct XP.
   Reinvoke the actual stale/duplicate contexts and verify zero second record/consequence.
3. Actual systems A(nonlethal) then B(lethal), source update/kill=B, old launch values
   unchanged; tiny representational no-loss internal fixture leaves previous/null source.
   Cluster primary survivor killed by satellite, primary-only kill, multiple independent
   deaths and overlapping survivor union have exact phases/counts/XP/positions.
4. Normal physical XP attraction/collection/Level-Up and real pointer choice remain;
   snapshot XP1/5/10 and no kill-time level credit, target cleanup/current Boss flags and
   detached source counters. Internal Shield/God/protection/contact regressions use actual
   current Defense paths; no public controls or fabricated alternative damage algorithm.
5. Real W/Space/Escape, MANUAL and REWARD pause plus GENUINE foreground-tab BLUR. Capture
   enemy HP/source/snapshot, active Attack flight/heading/lifetime, XP pickups, Defense,
   diagnostics, same five TimerEvent identities/elapsed/remaining and four RNG counters;
   meaningful wall time changes none AFTER accepted pause/offer. Return stays PAUSED until
   explicit Escape; reward+focus retains remaining reason. Report synthetic HIDDEN/VISIBLE
   separately, not as real focus proof. No deferred/replayed deaths on resume.
6. Actual Death-first and Victory-first; straight Boss kill, Missile Boss kill, Cluster
   primary Boss kill and satellite Boss kill. Full owning affected sets/cleanup precede
   single accepted terminal/result; no unrelated postterminal work; Boss XP10 remains
   visible/frozen/uncollected with no duplicated source count/result/XP.
7. TWO Victory->NEW RUN, ONE Death->RETRY and ONE PAUSED nonterminal native scene.restart.
   Capture old enemy/source/spawn/death/Hit/flight, timers/input/focus/reward/result/DEV/
   cleanup/completion callbacks. EACH: fresh exact initial Chaser/null last source, default
   frozen definitions/snapshot, count0/flagsfalse, fresh owners/zero Tags/kill buckets0,
   unpaused Clock/five fresh events. Old detached records readable; saved old work cannot
   attribute/kill/drop/observe/terminate or draw fresh RNG, old disposed owner operations
   retain invariant errors. Reload/manual create/fixture recreation is NOT native proof.
8. Unmodified built production preview with real keyboard/mouse/rendered output: movement/
   Dash/Escape pause/resume/automatic combat/ordinary enemy death and physical XP, ordinary
   incoming damage/Death/actual pointer RETRY/fresh run. No DEV API/death debug UI/new
   pageerrors. Inspect console; separate known favicon404 and Vite >500kB chunk warning.
   Clearly distinguish tracked, internal controlled, normal boot, genuine focus and native
   evidence. Missing required actual browser/native evidence prevents GAME-051 DONE.

**Definition validation, implementation cutover and handoff**

Now change ONLY docs/TASK_GRAPH.md: this definition, GAME-051 BACKLOG->READY and necessary
current-status sentences (GAME-050 DONE/approved, GAME-051 READY, GAME-052+ BACKLOG).
Preserve historical definition/pre-review instructions and earlier completion facts;
GATE A/B stay PASSED, no other gate closes. No CURRENT_STATE/PROJECT_GRAPH/ARCHITECTURE/
GAME_DESIGN/CONTENT_MANIFEST/BALANCE/runtime/tests/packages edits or runtime implementation.
Run npm run check and git diff --check, verify single tracked-file scope, explicitly stage
TASK_GRAPH, run cached check/stat and inspect COMPLETE staged diff. Generate ignored
.codex-review/GAME-051-review.txt with AGENTS.md sections, branch/base, complete current
death/direct-call audit, exact types/telemetry/transition/fixture decisions, future tests/
native checks and FULL staged diff. Never stage artifacts, commit/push/merge/reset/rebase
or create/switch branches. Direct-call migration and seven source counters above are
explicit decisions submitted for architect review, not currently implemented behavior.

Only separately approved/authorized implementation passing all tracked AND required actual
Chrome/native checks may set GAME-051 READY->DONE and update factual CURRENT_STATE death/
source/XP/Boss/diagnostic/terminal/restart behavior and PROJECT_GRAPH actual files/exports/
Hit->death/consequence consumers/exact-run lifetime. GAME-052+ need their own definition/
review; GATE A/B remain PASSED and no additional gate is automatically created/closed.


**Implemented and validated completion**

The definition and pre-review requirements above remain the accepted implementation contract.
EnemyDeath.ts implements exact three-field/seven-combination copied frozen sources and
seven-field copied/frozen EnemyDeathRecord, independent preflight validation and RangeError
rejection. Runtime starts null attribution; only actual positive-loss Hit changes it. Existing
applyEnemyHit guards exact run/member/alive, computes/writes HP once and preflights lethal data
before mutation. killEnemy(hit,damage,source) rechecks actual transition/provenance and constructs
one record before concrete Boss/pickup/target/destroy/splice/source-observer consequences.
Duplicate/stale contexts return null with no record/effects; no flags/registry/manager were added.
Two live legacy removal fixtures now supply valid typed lethal Hits; stale and duplicate probes
use captured invalid/already-completed contexts. No successful source-less removal remains.

Physical XP1/5/10, collection/Level-Up, negative overkill, no-op damage, full primary/satellite
union and owning cleanup before first-terminal Victory are preserved. Diagnostics requires
killSource, owns seven flat closed buckets and validates all count/XP/source sums before commit;
sum equals total, fresh0/copy/terminal/disposal and six-kind/256 timeline semantics are retained.
Five gameplay events/five DEV methods, four existing RNG budgets, GAME-049/050 combat/spawn
contracts and Build/Tags/Analyzer/Defense/reward/content/dependency boundaries are unchanged.

npm run check passes904 tests/26 files: all739 baseline cases retained, plus125 pure EnemyDeath,
26 Scene (233 total) and14 observer (49 total). Actual installed Chrome/Phaser verifies seven
sources/phases, A->B, representational loss0, multi-death/overlapping Cluster/primary survivor,
physical drops/collection/real pointer choice, manual/reward/genuine BLUR freeze and explicit
resume. Two Victory NEW RUN cycles, Death RETRY and PAUSED nonterminal native restart each
restore null-source Chaser/zero seven buckets/new owners/zero Tags/unpaused Clock/five fresh
events; old Hit/completion/callbacks are inert with zero fresh draws and old values readable.
Straight/Missile/Cluster primary/satellite Boss death completes records/diagnostics/whole owning
cleanup before Victory with frozen BossXP10. Unmodified production real keyboard/mouse shows
movement/Dash/pause/combat, ordinary enemy death/physical XP, incoming Death and actual RETRY
to fresh HP5/XP0/one Chaser, DEV absent/no pageerrors. Known favicon404/large bundle warning only.
Ignored review packet contains complete source audit, browser evidence and full staged diff.

GAME-051 DONE; GAME-052 READY; GAME-053+ BACKLOG pending separate definition/review; GAME-040/041 SUPERSEDED;
GATE A/B PASSED. GAME-052 is a definition proposal awaiting separate architect review; no commit created.


#### GAME-052 — Enemy Interaction + Swarm & Charger

STATUS: READY

**Definition scope, provenance and approval boundary**

Depends on GAME-046..051 DONE; preserve GAME-039/042..051, GAME-040/041 SUPERSEDED and
architect-PASSED GATE A/B. This is a complete DEFINITION PROPOSAL for architect review,
not implementation or approval of new balance values. Change ONLY TASK_GRAPH: GAME-052
BACKLOG->READY; GAME-053+ remain BACKLOG pending their own definition/review. No runtime,
tests, dependencies, other docs or browser implementation verification changes here.
Separate architect acceptance of the proposed decisions AND implementation authorization
are required before code changes. READY means the proposal has no unresolved implementation
choices; it does not promote proposed tuning to current working behavior.

Audit HEAD: 2322f3be350a4a281e059bb7754abb2283605ea4,
GAME-051 implement authoritative enemy death pipeline. Source/tests override navigation-map
provenance and historical specifications. Current baseline904 tests/26 files includes233
Scene,136 EnemyDefinitions,125 EnemyDeath,71 combat,49 diagnostics,52 Build and35 Defense.
Read AGENTS/skill, TASK_GRAPH, CURRENT_STATE, ARCHITECTURE, GAME_DESIGN, PROJECT_GRAPH,
CONTENT_MANIFEST and BALANCE; inspect actual relevant owners/tests before implementation.

Taxonomy correction to the request's phrase "six normal archetype identities": HEAD has
three normal identities plus boss. After adding swarm/charger there are SIX total runtime
identities, FIVE normal roles (swarm/chaser/charger/shooter/tank) plus legacy boss/Warden.
Elite Tank remains tank+isElite, never a seventh identity; do not invent a sixth normal role.

**Current source inventory — facts, not the proposed GAME-052 behavior**

| HEAD source / anchors | Exact current contract |
| --- | --- |
| EnemyDefinitions.ts1..38,40..121 / EnemyDefinitions.test.ts | Four lowercase archetypes; EnemyNumbers maxHealth/collisionRadius/contactDamage/xpValue; closed PURSUIT, SHOOTER_BAND, WARDEN_PURSUIT. Required context LEGACY_NEUTRAL + BASE/ELITE_TANK. Exact own fields, positive finite <=MAX_SAFE_INTEGER, XP positive safe integer; neutral performs no scaling. Factory copies/freezes outer and new movement; no interaction fields |
| GameplayScene.ts94..132 / createEnemy1291..1321 | Runtime readonly spawnSnapshot/run and derived identity/contact/XP/radius; mutable health/visual/lastDamagingSource. Exact captured-run creation, only initial PREPARING Chaser at3000/1350, otherwise RUNNING. One spawn snapshot and initial HP write per success; null source; no movement/knockback/charge state |
| update432..504; shooterMovement.ts; warden.ts | Player/Dash then Drone, enemy AI+clamp, target, protection, straight shots, Missiles, contact, XP. Pursuit capped at distance; Shooter inclusive350..500, cap to nearest band edge/coincident+X. Warden currentHP>30 speed70, otherwise positiveHP speed100, dead no phase; independent4/8 hostile burst |
| combat.ts3..20,30..87 | Flight damage/speed/radius/lifetime; Missile adds explosionRadius; contact damage only. Frozen exact launch snapshots; no Impact field. Damage=(local*C)*R, Drone then*E. Direct/primary full, Cluster satellite half; healthAfter=H-D, hpLost=H-max(0,after), no overkill transfer or Armor. Positive damage can produce representational loss0 |
| fireLaser961 / fireDroneFrom1000 / fireMissile1150 | Laser/Prism1 damage/600ms/1200 speed/body6/life2000; Prism3 independent full beams at0/-12/+12 degrees share Attack. Drone/Twin1/1200ms/800/body5/life1800, independent origins/Attacks. Missile/Cluster2/1800ms/450/body8/life4000/blast120, cap1. Local/shared upgrades compose existing launch values; nothing currently consumes Impact |
| updateProjectiles1074..1130 / updateMissiles1191..1233 / collision.ts2 | Lifetime-clipped swept combined circles, earliest strict hit retains collection-order ties, collision before expiry/world exit. Missile may intercept non-target; interpolated impact center, no extra direct damage; homing/reacquisition unchanged |
| explodeMissile1236 / explodeClusterSatellites1250 / clusterSatelliteOffsets | Primary snapshot: inclusive center distance<=R, no enemy radius addition or damage falloff. Cluster after primary: snapshot surviving six-circle union, circle centers at radiusR/angles0,60,..300 degrees, each radiusR/2; one half-damage Hit per survivor despite overlap |
| updatePlayerContact844 / damagePlayer881 / PlayerDefense.ts | First inclusive collection contact only. Player radius20 + enemy radius; player minimum translation away, coincident+X, clamp ship half-size+outline (baseline21/25); enemy not moved. Shield first, Hull overflow, accepted loss protection500, God rejection, projectile consumed even protected; no Impact/damage bonus |
| applyEnemyHit868 / killEnemy1265 / EnemyDeath.ts4..60 | One exact current RUNNING Hit.run/target.run/member/alive HP adapter. Positive actual loss stores copied frozen actual source; lethal preflight before HP/source mutation, one healthAfter write, guarded one death record/consequence path, no record replay or death registry |
| EnemyDeath.ts source / record / RunDiagnostics.ts1..24,70..85,129..138 | Seven source combinations below; record exactly identity/Elite/XP/x/y/last/kill, frozen detached outer/two sources. One pickup1/5/10 then target/visual/member cleanup and source-aware observer. Four archetype buckets, tank-only Elite subset; atomic killed/XP/seven-source counts; six timeline kinds/newest256/clone/terminal/disposal |
| spawnEnemy1402..1434 / timedSpawnSequence92 / eliteTank.ts / warden.ts | Initial Chaser excluded;2000ms CCCSCT, cap10, success counter advances only created enemy. Tank6/18 regular,12/24 Elite; Warden replaces30 once, live Boss blocks spawning. Encounter2 draws accepted timed placement (side+coordinate), blocked0, deterministic fallback, DEV Warden0 |
| PlayerBuild.ts30..48,148..166 | Impact base1, percentage cache base*(1+sum), resolved minimum0.01 and finite safe bound, currently unused. Hull5/Thrust300; other multipliers1, Analyzer0; Tags don't multiply damage/Impact |
| create250..419 / publishDevTools1334..1400 / RunLifecycle / RunRandom | Exactly five events: spawn2000, Laser600/F, Missile1800/F, Drone1200/F, hostile1500; four owned streams Encounter/Reward/World/Boss, World/Boss dormant. PREPARING initial/five events -> RUNNING -> crypto seed/diagnostic bootstrap -> five-command DEV; captured cleanup/native restart and old-owner rejection |

| Existing profile | maxHP | AI speed px/s | body radius | contact | XP |
| --- | --- | --- | --- | --- | --- |
| Chaser | 3 | 180 pursuit | 24 | 1 | 1 |
| Shooter | 2 | 140;350..500 band | 24 | 1 | 1 |
| Tank | 6 | 100 pursuit | 24 | 1 | 1 |
| Fixed Elite Tank | 18 | 120 pursuit | 24 | 2 | 5 |
| Legacy Warden/boss | 60 | 70 aboveHP30;100 atHP30 or below | 40 | 2 | 10 |

Arena4800x2700; enemy clamp margin=max(25,bodyRadius). Spawn camera edge offset48,
minimum player-center distance600, opposite-corner fallback; Boss margin40. Hostile current
damage1/speed600/body6/life3000, same1500ms event. XP lime radius10/value1/5/10/speed0,
magnet180/collection20/acceleration900/maxSpeed600, level threshold5*level. Preserve all.

**Design-backed behavior and explicitly proposed tuning**

GAME_DESIGN97,284..300 and ARCHITECTURE143..160 approve physical control separate from damage,
Attack Impact * Ship Impact * Enemy Knockback Response, decaying external velocity, radial
blast force, no wall/enemy collision damage/global Stagger/friendly fire. GAME_DESIGN316..321
approves fragile fast low-resistance Swarm, committed telegraphed Charger and resistant Tank.
CONTENT_MANIFEST80..99 approves these slice roles and retains legacy Warden until Juggernaut.
BALANCE62..75,99..100 supplies role expectations, NOT numeric HP/force/duration defaults.
None supplies exact response/force/decay/Decoy matrix/Charger timing. Every number/policy marked
P below is a CONCRETE PROPOSAL REQUIRING ARCHITECT APPROVAL, not an existing approved constant.
All choices are specified; there are no TBD formulas, unresolved alternatives or hidden defaults.

**Scope and authority**

Implement receiving the current player weapon damage unchanged, survivor knockback and
external-velocity recovery, Swarm pursuit and concrete Charger movement/telegraph/contact.
Author Decoy susceptibility data only. EnemyDefinition owns authored parameters; each spawn
owns a new frozen snapshot; EnemyRuntime owns current HP/position/external velocity and only
Charger-specific transient state. Attack owns immutable launch physical force; Scene owns
actual movement/Hit/collision/application; EnemyDeath retains source/once-only death values
and the existing Scene kill boundary retains ordered consequences. No second HP authority
or writable mirror of authored speed/force/resistance/timing values.
No enemy-to-enemy pushing/avoidance/crowd physics, obstacles/navmesh, flocking or friendly fire.

**Authored interaction and new role profiles — P**

Add exactly interaction:Readonly<{knockbackResponse:number;decoySusceptible:boolean}> to
EnemyDefinition and the frozen EnemySpawnSnapshot. These are a real force consumer and the
explicitly requested future Decoy boundary, not a generic capability/status map. Factory
requires exact shape, copies both primitives into a new frozen nested record; freezes the
outer and movement as today. No live definition reference. Neutral context/scaling unchanged.
Extend the closed EnemyArchetype with 'swarm'|'charger'; swarm reuses PURSUIT; charger alone
uses CHARGER movement. Existing four profiles retain every old numeric value/movement field;
snapshot SHAPE deliberately gains interaction (not byte-identical legacy snapshots).

| Profile | knockbackResponse P | decoySusceptible P | Other change |
| --- | --- | --- | --- |
| Swarm | 1.5 | true | New normal role below |
| Chaser | 1 | true | AI/HP/body/contact/XP unchanged |
| Charger | 0.75 | true before commitment | New normal role below |
| Shooter | 1 | true | Band/hostile shots unchanged |
| Tank | 0.25 | true | AI/HP/body/contact/XP unchanged |
| Fixed Elite Tank | 0.125 | true | Frozen explicit Elite interaction override; not inferred from HP/speed |
| Legacy Warden/boss | 0.05 | false | High resistance, no blanket knockback immunity; HP threshold/bursts unchanged |

These values are physical response ONLY, never damage resistance/Armor. Do not create a
redundant knockback-enabled boolean or interruption-policy enum: external force adds to AI
for every role, including Charger; it neither resets nor pauses its phase clock. Its fixed
direction remains fixed even while displaced. ELITE_TANK_PROFILE may add the frozen explicit
interaction override; BASE/ELITE_TANK context and all four old numerical overrides remain.

Swarm P: archetype='swarm', maxHealth1, movement={kind:'PURSUIT',speed:240}, bodyRadius12,
contactDamage1, XP1. Tiny green diamond24x24, points0/12,12/0,24/12,12/24, fill0x84cc16,
outline0xd9f99d/2px. Reuse normalized pursuit capped at target distance, margin25 and stable
nearest-target ordering; no group/boid state, ranged attack or new event. Current target is
player, not other enemies/Decoy. New role creation follows the exact-run common pipeline.

Charger P: archetype='charger', maxHealth4, bodyRadius22, contactDamage1 in ALL phases, XP1.
Movement exact record {kind:'CHARGER',speed:110,triggerRange:350,windupMs:650,
chargeSpeed:650,chargeMs:500,recoveryMs:800}. All are authored snapshot values, not timers.
Red chevron44x44, points0/0,44/22,0/44,10/22, fill0xef4444, outline0xfecaca/2px, faces
its aim/committed direction. Existing yellow target outline4 takes precedence; no changes
to old enemies' presentation. One Charger-owned reusable Graphics telegraph, no gameplay
TimerEvent: WINDUP only, line3px/0xfb7185/alpha0.75 from current center in current aim for
325px (=650*500/1000). Clear outside WINDUP; destroy with death/native shutdown; never a
collision body/attack/target. Clamp displayed endpoint to arena; it cannot damage anything.

**Charger-specific movement, commitment and large delta — P**

Runtime ChargerState contains only phase:'APPROACH'|'WINDUP'|'CHARGING'|'RECOVERY',
remainingMs and directionX/Y (unit vector; fresh APPROACH/0/(1,0)). Only charger has this
state/telegraph; do not convert other roles into an FSM or duplicate movement parameters.
Use active simulation delta, player's post-movement world point and owned spawn movement.

1. APPROACH: pursue at110, capped at triggerRange350. If already within inclusive350 and
   delta>0, enter WINDUP; if crossing350, spend exact time to the boundary and pass leftover
   active time into WINDUP. Zero delta makes no state/position change.
2. WINDUP: AI translation0 for650 active ms; external knockback still integrates. Aim and
   visible line may track the current player point. At expiry sample direction from current
   enemy center to that point ONCE (coincident fallback+X), enter CHARGING with500ms. This is
   commitment; no target position, heading reacquisition or steering while CHARGING.
3. CHARGING: fixed unit direction*650 px/s for remaining active time (nominal travel325).
   No homing/damage bonus/stun. At duration end enter RECOVERY800ms; world boundary clamps
   position without bouncing, damaging or redirecting, while the phase clock continues.
4. RECOVERY: AI translation0; external velocity continues decaying. On expiry return
   APPROACH, remaining0; next eligible charge uses a fresh aim, no stored player/Decoy ref.

Process phase boundaries with exact consumed/remainder time, not whole-delta-for-each-phase.
Concrete rearm rule P: at most ONE new WINDUP entry per active Scene.update. After finishing
RECOVERY, consume any residual delta as APPROACH movement capped to350, but rearm WINDUP
only on the next positive-delta update. Thus no catch-up volley of charges, no unbounded
loop/phase queue and no timer debt; all residual time has the explicitly authored approach
behavior. If an update starts CHARGING/RECOVERY, completing that cycle likewise rearms only
next update. Long deltas can traverse the CURRENT cycle; timers never use wall time or reset
on pause. Tests must encode this rearm rule rather than assume partition invariance across it.
Validate all segment/remaining arithmetic before replacing runtime state. Graphics reflect
the currently sampled state; do not add delayed callbacks to replay skipped visual frames.
Normal/low-FPS browser checks must actually observe the full visible WINDUP, not infer it
from a final phase. Large-delta internal checks are distinct timing/collision evidence.

Charger-only swept contact P prevents a long committed step tunneling through the player:
reuse segmentCircleHitTime on its actual arena-clamped CHARGING AI segment against the
post-player-movement center with combined radius20+22=42, inclusive tangency/starting overlap.
Retain only the earliest intersecting Charger center point for that current update, no path
history. This is same-update geometric evidence, NOT a Hit queue or a second damage path.
Scene passes an ephemeral exact-run mapping of Charger->contact point to existing
updatePlayerContact, consumed in that update only. First eligible enemy in collection order
still wins; use actual final overlap first, otherwise its actual swept charge contact point.
Use the existing minimum-translation/coincident+X/player-clamp formula at that contact pose,
then the SAME ENEMY_CONTACT Attack and damagePlayer/PlayerDefense path exactly once. Charging
does not stop/redirect on contact; it may pass through. Multiple crossings never cause more
contacts per update; protection500 remains authoritative across updates. No charge bonus.
Projectile/Missile/death processing still precedes contact: killed/removed/stale Chargers
cannot deliver retained contact. Only CHARGING AI segments add this new sweep; knockback-only
motion and ordinary AI retain endpoint contact and generate no extra contact/sweep damage.

**Attack launch schema and concrete physical force — P**

Keep FlightSnapshot's existing four fields for hostile shots. Add
PlayerFlightSnapshot=Readonly<FlightSnapshot & {impact:number}> for Laser/Drone; change
MissileSnapshot to PlayerFlightSnapshot & {explosionRadius:number}. Required impact is the
FINAL launch-resolved Attack Impact*Ship Impact, in px/s, not a live stat/base+resolved pair.
createAttack requires/copies/freezes it for those player kinds; CLUSTER also validates that
nonzero impact*0.5 stays positive/finite at launch (explicit impact0 remains legal). Hostile FlightSnapshot and
ContactSnapshot stay exact old shapes and cannot accept an impact placeholder. EnemyDamage,
PlayerDamage, seven source identities and all existing damage math stay unchanged.

| Actual launch / Hit | Authored local Attack Impact P | Phase physical factor P |
| --- | --- | --- |
| fireLaser LASER/BASE and LASER/PRISM (one shared Prism Attack) | 200 px/s | DIRECT1 per accepted independent beam |
| fireDroneFrom COMBAT_DRONE/BASE and TWIN (per actual origin) | 160 px/s | DIRECT1 per accepted independent bolt |
| fireMissile MISSILE/BASE and CLUSTER | 400 px/s | PRIMARY1; CLUSTER SATELLITE0.5 |

At each launch snapshot.impact=localImpact*resolvedStats.impact. Ship Impact base1 and its
current percentage resolution/minimum0.01 are EXISTING facts. The force constants and
satellite factor are proposed physical tuning, not derived from damage/size/speed/Engineering.
Hit magnitude K=(snapshot.impact*phasePhysicalFactor)*enemy.spawnSnapshot.interaction.knockbackResponse.
No Reactor/C/Engineering/Scale/Velocity factor or target HP factor; Ship Impact is applied
exactly ONCE at launch, enemy response exactly ONCE at hit. No direct blast damage falloff
or physical falloff in this slice. New impulses sum as vectors with a gameplay speed bound
below. Changing current Impact/local tuning later never changes old Attack values; no
independent writable impact on flights/Missiles, runtime Build ref or new source identity.

Scene-private EnemyHit gains concrete geometry only: ENEMY_DIRECT has direction:{x,y} from
the actual striking flight velocity; ENEMY_BLAST has origin:{x,y} from actual primary center
or actual satellite circle. Normalize direct direction; blast direction is targetCenter-origin.
Exact zero-length vector deterministically uses+X, no RNG/epsilon impulse or player/selector
fallback. Origins/directions are detached primitives for this synchronous Hit, never source
fields/death-record metadata or mutable Attack geometry. For satellites choose FIRST covering
circle in existing0,60,..300-degree offset order; snapshot {enemy,origin} once for the survivor
union, preserving enemy order and membership. Overlap still yields ONE satellite Hit/impulse.
Primary survivor may receive primary+satellite impulses; distinct Prism/Twin hits each count.

**External velocity, bound, decay and application — P**

EnemyRuntime adds only knockbackVelocity:{x,y}, initially exactly0/0. No copied base speed,
response or force. Accepted impulse is unitDirection*K; sum with retained external velocity
then cap vector length at600 px/s, preserving direction. The600 limit is an explicitly
proposed GAMEPLAY accumulation bound, not a numeric-validation repair: even one Prism Attack
cannot exceed it, and independent Attacks obey the same bound without an Attack-ID registry,
pellet history or extra clock. Opposite impulses can cancel; zero K makes no impulse.
First validate unclamped K finite/safe and nonnegative; cap the SUM only, never each incoming
impulse first (that would change cancellation). A safe exact-order implementation uses
q=max(1,K,abs(v.x),abs(v.y)), w=v/q+unitDirection*(K/q), n=hypot(w): if n>600/q,
return w/n*600; otherwise return w*q. This avoids unsafe unscaled sums and preserves opposing
impulses; it never repairs an invalid K. n=0 returns exact0/0.

Linear external-speed decay a=1200 px/s², P. For speed s=|v| and dt=delta/1000:
t=min(dt,s/a); displacement=unit(v)*(s*t-0.5*a*t*t);
nextSpeed=dt>=s/a ? 0 : s-a*dt; nextVelocity=unit(v)*nextSpeed.
If delta=0 (or delta/1000 is representationally0), return zero displacement and the
unchanged velocity BEFORE decay arithmetic. If s=0, return exact zero displacement/velocity. No epsilon tail, exponential wall-time
expiry or new duration stat. At cap600 force lasts at most500 active ms/travels150px;
example Chaser/Laser I1 ->200px/s, stop after1/6 sec, distance16 2/3 px without AI/clamp.

In the enemy movement phase, compute original AI movement first (Charger consumes its
specific phase segments), then add this frame's analytically integrated external displacement
and decay once. Clamp using existing max(25,radius) arena margins. For a blocked outward
velocity component at a clamped axis set that component0; retain tangential component/no
bounce/wall damage. Use resulting vector next frame. With zero velocity all four old AIs
give their exact old steps/thresholds/bands. AI may pursue again but cannot overwrite the
retained external vector. While still WINDUP after the external step, refresh aim/telegraph
from its final center; never refresh a committed CHARGING direction. Charger contact evidence above covers AI path before this external
step; pure knockback never manufactures collision damage or an environmental kill.

Hit processing only changes the external VELOCITY, never target position immediately.
New impulses move the enemy on the NEXT active enemy-movement update. Therefore primary
Hits cannot displace survivors out of the same detonation's satellite union; all existing
center-only damage sets, earliest projectile ties and GAME-051 death positions remain intact.
This is synchronous accepted-Hit state application, not deferred/replayed Hit processing.

**Accepted Hit order and death/zero-loss compatibility**

1. Check exact captured current RUNNING Hit.run, target.run, membership and positive current
   HP BEFORE accessing current owners or any physical/source/movement state.
2. Validate required launch physical value, Hit geometry, owned response and prospective
   bounded vector/finite arithmetic BEFORE any HP/source/velocity mutation. Malformed data
   throws RangeError, no broad catch/repair. Compute unchanged phase damage/EnemyDamage once.
3. If hpLost>0 create actual copied source; if lethal preflight the SAME seven-field death
   input before commit. Loss0 must not invent/update last source or any kill metric.
4. Write healthAfter once; only positive loss replaces lastDamagingSource, preserving
   negative overkill and existing representational no-op result/EnemyDamage|null API.
5. If lethal, synchronously complete existing killEnemy(Hit,result,source) and return;
   NO impulse/state/telegraph/position update after removal. Destroy any owned Charger
   telegraph alongside the existing enemy visual cleanup, without a new consequence path. Record uses actual
   death position; Boss flag, pickup1/5/10, target/destroy/splice/source observer order stays.
6. Otherwise recheck exact owner/member/health>0 and apply the preflighted external velocity.
   P: physical control may apply even when calculatedDamage>0 but actual hpLost===0. It is
   separate from damage: source, XP, killed and seven source counters remain unchanged.
   Explicit snapshot impact0 or response0 means no physical effect, still ordinary damage.
   No new zero-damage Attack/knockback-only public API or source is authorized. Future pure
   control could not create damaging attribution, but is not implemented here.
7. Caller finishes its existing flight or full primary/satellite union and cleanup BEFORE
   optional Victory. No terminal inside force/movement/EnemyDeath/diagnostics helpers.

All seven existing source combinations remain LASER.BASE/PRISM.DIRECT,
COMBAT_DRONE.BASE/TWIN.DIRECT, MISSILE.BASE.PRIMARY, MISSILE.CLUSTER.PRIMARY/SATELLITE.
Extend EnemyDeath's closed archetype validation to swarm/charger ONLY; source shape/record
fields/nonnull equal last/kill, Elite tank-only pairing, actual lethal provenance and once-only
guards unchanged. Knockback/Charger/contact never kill an enemy or transfer overkill.

**Decoy compatibility data only — P**

The matrix above is proposed explicit authorship, not current active retargeting. Boolean
means eligible for a later real valid Decoy choice in this role's retargetable phases; it
does NOT mean global forced taunt or probability. Normal roles/Elite true, legacy Warden
false. Charger may select/retarget during APPROACH/WINDUP only; committed CHARGING and
RECOVERY do not redirect. Later Decoy can read frozen susceptibility and that concrete phase
before choosing a valid target point; actual selection/priority/HP/lifetime/range rules belong
to its separate task. No Decoy ref/target field, Targetable interface, entity/Active slot/
activation/cooldown/explosion/UI/DEV command or target switch is implemented in GAME-052.
Current all-enemy player targeting stays unchanged. Warden false is a legacy exception, not
a blanket statement about later Juggernaut partial susceptibility.

**Spawn integration B and exact RNG budget — P decision, old numbers preserved**

Select option B: functional Swarm/Charger creation/movement/Hit/contact/death through existing
private createEnemy(x,y,'swarm'|'charger',capturedRun,false) in RUNNING. Ignored internal
Chrome fixtures invoke that ACTUAL production path, then actual Scene updates/firing/pickups;
no public spawner or debug UI. They explicitly check current RUNNING owner/player and cap10
before creation and do not increment successfulTimedSpawns or consume RNG, as with controlled
existing creation fixtures. createEnemy itself remains the low-level authorized constructor,
not a new public cap bypass/normal scheduling API. Initial PREPARING exception remains Chaser
only; no new production caller bypassing cap or counting. Real future encounter scheduling
is deferred to Director tasks; content availability here is explicit, not claimed natural play.

Keep EXACT ordinary timed sequence [chaser,chaser,chaser,shooter,chaser,tank],2000ms,cap10,
initial exclusion, Tank6/18,Elite12/24,Warden30 substitution once, live-Boss suppression and
success-only increment/reset0. No replacement sequence, Director/pressure/templates/portals/
capacity reservations. Narrow timedSpawnSequence's type to its actual old three normal
members so extending EnemyArchetype does not implicitly schedule new roles; extend any
closed type signatures only where needed, not shouldSpawnEliteTank's actual semantics.

| Operation | Encounter | Reward / World / Boss |
| --- | --- | --- |
| Timed accepted spawn, including deterministic corner fallback | Exactly2: side then edge coordinate; selection0 | 0/0/0 |
| Stale/non-RUNNING/missing player/cap/live Boss rejected timed spawn | 0 | 0/0/0 |
| Initial Chaser, DEV Warden, controlled common Swarm/Charger construction | 0 | 0/0/0 |
| Definition/snapshot/Attack/physical validation, knockback/Charger aim/zero fallback/steps/contact/death | 0 | 0/0/0 |
| PAUSED/terminal/stale work or snapshot reads | 0 | 0/0/0 |
| Existing Level-Up offers/acceptance | 0 | Existing one Reward draw per sampled slot; deterministic focus/evolution/acceptance0; World/Boss0 |

No additional Encounter draw required. No Math.random/Phaser ambient gameplay RNG or entropy
for movement; four original seeded owners/disposal and crypto bootstrap are unchanged.

**Diagnostics, DEV and defense compatibility**

RunDiagnostics DiagnosticArchetype validation and spawned/killed.byArchetype gain exactly
swarm:0/charger:0 on fresh snapshots (six total keys including boss). recordEnemySpawned and
source-aware recordEnemyKilled account for actual common creation/death; new roles XP1;
Elite subset still Tank-only. Preserve atomic count/XP/source overflow, sum(source)==total,
exact seven killsBySource keys, six timeline kinds/cap256/clone/terminal/disposal. No movement/
AI/knockback timeline, per-hit log, external metrics or eighth source. DeathRecord still7 fields.
Only this factual nested diagnostics shape reaches existing DEV snapshot; no extra top-level
state/telegraph/force controls. Keep EXACT snapshot/forceLevelUp/spawnWarden/setWardenHealth/
setGodMode; production DEV absent. No spawnSwarm/spawnCharger/setImpact/forceCharge/debugAI.

PlayerDefense/hostile contact routing unchanged. New inclusive radii: player+Swarm=32,
player+Charger=42; old regular/Elite44 and Warden60. Charger fixed contact1 regardless phase,
no ram bonus, repeated phase-specific damage or stun. Existing first collection contact,
minimum player escape separation, Shield-first/Hull-overflow/protection500/God and hostile
consumption remain; Charger-only swept eligibility is the explicit proposed addition above.
Impact modifies no incoming damage, player separation magnitude, Shield or protection.

**Numeric validation and atomic publication**

Exact own shapes incl missing/extra/symbol/hidden/inherited-only rejection. Keep old enemy
positive finite values<=MAX_SAFE_INTEGER/positive safe-integer XP and valid movement pairing;
allow their existing fractions/safe endpoints, no arbitrary HP/body/speed tuning maximum.
Interaction response and player snapshot impact allow actual finite0..MAX_SAFE_INTEGER,
fractions and signed zero; boolean susceptibility required. Table defaults are all positive.
Charger speed/range/chargeSpeed/durations are positive finite <=MAX_SAFE_INTEGER (0/negative
duration rejected, no instantaneous phase loop); remaining0 only APPROACH, timed states
0<remaining<=that spawn's authored duration. Directions are actual finite normalized vectors, zero raw
direction accepted only at normalization with deterministic+X; no materially non-unit stored
heading. Generated unit/capped vectors may differ at machine precision: comparisons allow
8*Number.EPSILON*max(1,bound) rounding error only. This is validation tolerance, never a
gameplay minimum impulse, decay cutoff, authored tuning coefficient or repair of invalid data.
Coordinates signed finite abs<=MAX_SAFE_INTEGER; active delta finite0..MAX_SAFE_INTEGER ms.

Validate derived launch product/K/phase force and proposed state/displacements before commit:
finite/nonnegative safe bound; nonzero force-composition operands may not underflow to
accidental0 (explicit0 is legal no-force). Tiny dynamic time/displacement may be a normal
representational no-op; do not insert an epsilon step or reject the old valid delta domain. Use hypot/normalization and bounded-vector addition to avoid squared
overflow; no epsilon minimum. Linear decay uses t<=s/a and the exhausted branch to avoid
huge delta multiplication. Stored external velocity must be finite with length<=600; reject malformed runtime input,
not clamp it as a repair. Charger computes only bounded current-cycle segments then residual
approach, never a loop proportional to an enormous delta; cap approach travel at actual gap
before multiplying. Reject nonfinite/unsafe derived arithmetic instead of clamping invalid data.
World-context arena intervals must fit the current body before Scene movement; do not add
an arena-size restriction to the pure definition schema. World collision/boundary clamps and
the authored600 gameplay velocity cap are separate from numeric validation/repair.
Malformed authored definition/context fails before snapshot publication/visual/array/observer
mutation; invalid physical Hit fails before HP/source/velocity; caller/old values stay intact.

**Smallest implementation changes and concrete helper consumers**

| File / owner | Separately authorized implementation change |
| --- | --- |
| EnemyDefinitions.ts + tests | Two roles, frozen two-field interaction data/Elite override, Charger-only movement schema; exact validation/copy/freeze; neutral numbers unchanged |
| combat.ts + tests | PlayerFlightSnapshot/required player impact; explicit launch product helper used by Laser/Drone/Missile if extracted; hostile/contact and damage arithmetic unchanged |
| enemies/knockback.ts + tests (small pure helper) | Actual Scene survivor-Hit vector bound/decay calculations, e.g. withKnockbackImpulse(current,unit,magnitude) and stepKnockback(velocity,delta) returning copied next velocity/displacement. No HP/source/Phaser/run/Build/RNG/registry |
| enemies/chargerMovement.ts + tests (small pure helper) | Only Charger state/time/position/aim/arena-clamped segment and earliest charge-contact result; consumes explicit frozen movement/current state/player point/bounds/delta and existing pure collision helper. No other enemy AI, mutable owner/Phaser/timer/RNG |
| GameplayScene.ts + devTools tests | Fresh external vector/Charger-only state/Graphics; exact-run movement guards; launch impact/Hit geometry/preflight/survivor impulse; original AI then external movement; bounded same-update Charger-contact evidence into existing contact boundary; ordinary spawn sequence unchanged |
| EnemyDeath.ts + tests | Extend closed archetype validation only; keep seven sources/record schema/preflight/death authority |
| RunDiagnostics.ts + tests | Extend exact archetype count maps/validation only; preserve source/atomic/timeline contracts |

Every module has a concrete present consumer. No Enemy/Interaction/PhysicsManager, generic
movement/FSM/behavior tree/status service, ECS/global event bus/DI/plugin/target registry or
physics framework. No dummy support consumers for later Decoy/objectives/Medical content.

**Exact run, pause and fresh lifetime**

Before AI/force/state/contact-result application require captured current RUNNING run,
enemy.run===that run, membership and health>0. Add these checks to the current enemy update
boundary as needed; never reinterpret an old state/result with default run=this.run.
Pure returned state/data never grants authority; Scene applies only to the exact originating
enemy/run. Capture the owning run in any cleanup/telegraph work; no new asynchronous gameplay.
MANUAL/REWARD/FOCUS_LOSS freeze pursuit, windup/aim/charge/recovery, velocity/decay, telegraph
gameplay pose, HP/source, flights/lifetimes, player/Dash, collision/XP/Defense, diagnostics,
same five TimerEvent phases and all RNG. Resume continues remaining active state; no wall-time
expiry, charge rearm/reset or queued contact/impulse. Contact evidence is local to one active
update, never retained/replayed across pause/update/restart. Focus return never auto-resumes.
Native restart destroys Charger graphics/enemies/old state, restores one Chaser HP3/null source/
velocity0, frozen spawn+interaction, count0/flagsfalse, new run/Build/Defense/RNG/Input/Diagnostics/
API, twelve zero Tags/empty identity, six zero kill-archetype/seven zero source buckets,
unpaused Clock/five fresh events. Old enemy/Hit/force/charge/contact/callback refs cannot affect
fresh owners or draw fresh RNG; old immutable source/spawn/death/Attack remain readable.

**Architect decision table — explicit review proposals, no runtime approval inferred**

| Decision | Already approved / source-backed | Complete concrete proposal for GAME-052 | Unresolved/conflicting |
| --- | --- | --- | --- |
| 1 Swarm defaults | Slice role tiny/fast/fragile/low resistance; no numeric table | HP1/speed240/body12/contact1/XP1; green24 diamond; response1.5 | NONE; all new values P |
| 2 Charger defaults | Slice role committed/readable; no numeric table | HP4/approach110/body22/contact1 all phases/XP1; red44 chevron; response0.75 | NONE; P |
| 3 Charger state/timing/telegraph | Telegraph -> committed fixed direction -> recovery | Range350; windup650; charge650px/s*500ms; recovery800; tracking windup/locked charge/+X fallback; one cycle/rearm rule and concrete same-update swept contact above | NONE; P, including this new Charger-only collision eligibility |
| 4 Force/decay/bound | External force must decay, not be canceled by AI; radial blast; authored multi-hit bound | Laser200/Drone160/Missile400; satellite0.5; no radial falloff; vector sum cap600; linear decay1200; next-update displacement | NONE; P |
| 5 Ship Impact | Base1/existing cached percentages; target formula Attack*Ship*Response | Resolve local*Ship once at launch; multiply phase/response at hit; no damage/other-stat scaling | NONE; formula design-backed, constants/schema P |
| 6 Enemy physical matrix | Tank resistant/Swarm low resistance; coefficients absent | Swarm1.5/Chaser1/Charger0.75/Shooter1/Tank0.25/Elite0.125/Warden0.05; no phase immunity/stagger | NONE; P |
| 7 Decoy matrix | Authored partial retargeting, not global taunt; Active deferred | Five normal roles incl Elite true; legacy Warden false; Charger only APPROACH/WINDUP retargetable; data only | NONE; P, not later Juggernaut policy |
| 8 Spawn integration | CCCSCT/Elite12+24/Warden30 until explicit cutover; Director later | B: preserve schedule, new roles via guarded common private construction in ignored real-runtime harness; no new public command | NONE; intentional absence from natural production spawning stated |
| 9 Encounter draws | Accepted placement2, blocked0/DEV0, four owned streams | No additions anywhere; deterministic behavior/fallback | NONE; preserve budget |
| 10 AttackSnapshot schema | Immutable launch values, no current Impact field | Required impact on PLAYER flight/Missile snapshots only; hostile/contact unchanged; exact Hit geometry added, sources unchanged | NONE; P, explicit GAME-049 schema migration |

Do not replace these concrete proposals with inferred coefficients during implementation.
Architect may request different values; update definition first rather than silently tune code.
The normal-count wording mismatch is resolved as six total/five normal plus Warden above,
not a request for unscoped content or a blocking open design choice.

**Required tracked tests for later implementation**

Preserve ALL904 baseline cases/behavioral assertions. Explicit migrations allowed only for
required player-impact/Hit geometry, new interaction/role schemas and the new physical consumer.
Do not fake defaults/relax unrelated assertions or make hostile shots carry unused impact0.

| Boundary | Required pure / Scene evidence |
| --- | --- |
| Definitions / data | Six TOTAL identities/five normal+boss, Elite tank-only; all old numeric defaults and movement shapes preserved; new exact proposed profiles; exact interaction/Charger fields; missing/extra/symbol/hidden/nonboolean/nonnumeric/unsafe rejection; positive durations; valid explicit zero force/response and fractions; deep copy/freeze/neutral isolation/no Phaser/RNG |
| Player Attack | Required exact impact only on player kinds, frozen copied old/new launches under Impact/local changes; baseline force200/160/400, satellite physical half distinct from damage half; Impact1/2 produces force ratio2 without damage/cadence/body/blast change; zero/underflow/overflow and unrelated-stat/hostile/contact invariance |
| Knockback pure | Cardinal/diagonal/reversed/coincident+X directions, radial constant strength; response matrix; vector cancellation and600 cap incl repeated same Prism Attack/Twin/primary+satellite; decay analytical example/exhaustion/delta0/large delta/partition equivalence without AI/clamp; bounds/tangential retain/no wall damage; no live inputs mutated/source/RNG/Phaser dependency |
| Charger pure | Exact APPROACH range crossing/650 WINDUP tracking/commit/fixed650*500/800 RECOVERY/rearm; moving target before/after commitment, coincidence+X, delta0, exact boundaries/fractions/large delta residual/no catch-up loop; clamped segments; starting overlap/tangent/crossed-player sweep and miss; no bonus damage or RNG |
| Actual movement | Fresh zero vector/Charger state; Swarm capped240 pursuit, Charger real Graphics creation/line tracking/clear/death/restart; same update AI+external ordering, current owned snapshot values; four legacy AIs/bands/HP30/bursts/visuals unchanged at force0; source/HP/velocity independence; stale/accidental old membership ignored |
| Hit / death | Actual Laser/Prism/Drone/Twin/Missile primary/Cluster primary/satellite survivor impulses; exact actual flight direction/first covering satellite origin; zero-loss physical effect with no last-source/kill counters; invalid physical data before all mutation; lethal no physical movement/second record; all GAME-051 once-only/source/record/XP1/5/10/target/Boss rules |
| AoE / terminal | Primary survivors NOT moved until next update so original inclusive primary/satellite union/ties unchanged; overlap once/independent own death positions/records; full primary+satellite+own cleanup before Victory incl Boss killed in either phase; Death-first/Victory-first/frozen uncollected BossXP10 |
| Contact / defense | First current collection contact, old44/60 and new32/42 inclusive, same player separation/shield/protection500/God; Charger swept crossing catches long committed step through same contact path once, endpoint preferred, killed-before-contact0, multiple contacts first only, no impact scaling/charge bonus/extra HP owner |
| Spawn / RNG | Exact CCCSCT first30/Elite12+24/Warden30/cap-delayed12+30/live Boss guards; new roles absent naturally, guarded internal creation cap/run checks/count0/draw0; accepted timed2/selection0/fallback0extra, reject0, no four-stream draws from behavior/force/reads/terminal/stale |
| Diagnostics / DEV | Six exact archetype buckets, new spawned/killed/XP1 observations, Elite tank-only, sum seven source buckets==kills; total/archetype/XP/source overflow atomic; clone/fresh/terminal/disposed; six timeline kinds/cap256; five commands/nested factual shape only/production absence |
| Pause / lifetime | Real Scene manual/reward/focus composition freezes all new state/force/telegraph/contact eligibility and original flights/Defense/XP/diagnostics/five phases; continue exact remaining state on resume; old force/charge/contact/Hit/results/callbacks cannot mutate fresh run/owners or draw RNG |

Test fixtures must deliberately supply impact0 only for isolated no-control/damage regressions;
they must separately test real positive production defaults. Migrate HEAD combat.test's shared
player/hostile flight fixture into separate exact schemas; its old invalid0 loop remains for
damage/speed/radius/lifetime and gains a separate valid0 impact assertion. Extend the old
'exactly four definitions' assertions to six while retaining every original authored value;
replace only the obsolete blanket 'Impact has no consumer' assertion, preserving its incoming/
damage/Tag/Analyzer/Defense/cadence non-consumer checks. No test deletion or weakened coverage.

**Required actual Chrome/Phaser/native acceptance for implementation**

1. Normal DEV root boot/current initial Chaser HP3/null source/zero external velocity,
   frozen spawn/interaction/new owners/Hull5/Shield0/zero Tags, six archetype/seven source
   counters, five TimerEvents/five commands. No ordinary scheduled Swarm/Charger claimed.
2. Ignored internal harness checks cap/run, creates actual Swarm and Charger through current
   private common constructor, observes real movement/target/contact/HP/death/XP1/diagnostics.
   No public command, alternative simulation or fixture source logic substitutes for runtime.
3. Observe visible Charger approach/650ms tracking telegraph/fixed committed heading500ms/
   recovery800ms/rearm. Move player during/after windup; charge must not home. Exercise actual
   contact/protection and internal large-delta swept crossing/clamp/coincidence/rearm cases;
   distinguish visible normal/low-FPS telegraph evidence from synthetic long-delta state checks.
4. Actual supported seven weapon phases: positive survivor impulses, radial/first satellite
   origin/overlap bound/decay/margin and old-vs-new Impact launch values. Separately loss0
   and lethal/no-motion, malformed preflight, physical XP1/5/10/collection/real pointer offer,
   seven source/identity totals, duplicate/stale0. No damage falloff/source expansion.
5. Existing pursuit/Shooter inclusive band/Tank/Elite/Warden HP30/styles/4+8 bursts, contact/
   Shield/God/protection, targeting ties/launch geometry and full Boss terminal regressions.
   Controlled actual Clock first30 CCCSCT/cap/Elite/Warden retains60 Encounter draws, blocked0;
   report internal collection clearing, not natural survival or new-role scheduling.
6. Real W/Space/Escape; MANUAL and REWARD plus GENUINE foreground-tab BLUR. Capture current
   enemy HP/source/spawn/force/Charger phase+remaining+direction/telegraph pose, active flights,
   XP/Defense/diagnostics, five same event identities/elapsed/remaining and four RNG counters;
   meaningful wall time changes none after accepted pause. Focus return stays PAUSED until
   Escape; real pointer reward+focus composition preserves other reasons. Synthetic HIDDEN/
   VISIBLE evidence is separate, never passed off as genuine focus proof.
7. Actual Death-first/Victory-first, straight/Missile/Cluster primary/satellite Boss kills:
   complete every lethal record/physical pickup/diagnostic plus owning cleanup before one
   terminal/result; no extra death from force/movement, frozen uncollected BossXP10.
8. TWO Victory->NEW RUN, ONE Death->RETRY, ONE PAUSED nonterminal NATIVE scene.restart,
   with dirty Swarm/Charger/knockback/telegraph state. EACH restores fresh Chaser/zero force/
   null source/new frozen snapshot+interaction/owners/zero Tags/counters0/count0/flagsfalse/
   unpaused Clock/five new events. Capture old enemy/source/spawn/death/Hit/Attack/force/
   charge/contact result/timer/input/focus/reward/result/DEV/cleanup callbacks; they cannot
   mutate/kill/drop/observe/terminate or draw fresh RNG, disposed owners still throw. Old
   immutable values readable. Reload/manual create does NOT satisfy native verification.
9. Unmodified built production with real keyboard/mouse/rendered output: movement/Dash/
   pause/resume/automatic combat/knockback where a survivor exists/physical XP/ordinary incoming
   Death and actual pointer RETRY/fresh run; DEV absent/no debug UI/pageerrors. Option B means
   new roles are checked via real-runtime internal creation, NOT claimed production spawns.
   Separate known favicon404/Vite bundle-size warnings. Missing required real checks prevents
   GAME-052 DONE; definition-only validation here is not implementation browser evidence.

**Strict exclusions, validation and implementation cutover**

No actual Decoy/Active equipment/HP/lifetime/cooldowns/explosion/target UI; no Dash/Shield/Decoy
specializations, flocking/crowd/obstacle physics, new Elite catalog/Warden phases/Juggernaut,
Director/World Scheduler/templates/reservations/portals, Armor/damage resistance/crit/Stagger/
status framework/environmental death, universal movement/FSM/knockback bus, extra weapon/XP/
reward/meta/save/profile/dependency work. New physical response is never damage resistance.

Definition now changes ONLY docs/TASK_GRAPH.md: complete proposal/status BACKLOG->READY and
necessary current-status summaries. Preserve historical definition/pre-review instructions and
earlier completion evidence, GAME-051 DONE, GAME-053+ BACKLOG, GAME-040/041 SUPERSEDED, GATE A/B
PASSED. Run npm run check and git diff --check, inspect exact single-file scope, explicitly
stage TASK_GRAPH only; run cached check/stat and inspect COMPLETE staged diff. Generate ignored
.codex-review/GAME-052-review.txt with AGENTS sections, branch/base, source inventory/provenance,
new role/force/Decoy/spawn/RNG/ownership/validation/test/native contracts, decision table and
FULL staged diff. Never stage review/harnesses or create/switch branches/commit/push/merge/reset.

Only separately reviewed/authorized implementation passing ALL tracked and actual Chrome/
native/production acceptance may change GAME-052 READY->DONE and update factual CURRENT_STATE/
PROJECT_GRAPH. GAME-053+ need their own definition/review; no automatic gate creation/closure.


**GATE B — Modern Combat on Legacy Spawning — PASSED** — review the preceding phase capabilities before its cutover/next proof.

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
