# NEBULA — Target Architecture

## Authority and principles

DESIGN-005 defines APPROVED target ownership, contracts and invariants. These are
responsibilities, not claims that modules/classes already exist.
[CURRENT_STATE](CURRENT_STATE.md), source and tests describe current implementation;
[PROJECT_GRAPH](PROJECT_GRAPH.md) locates implemented owners.
[GAME_DESIGN](GAME_DESIGN.md) defines gameplay, [CONTENT_MANIFEST](CONTENT_MANIFEST.md)
wave scope, [BALANCE](BALANCE.md) tuning and [TASK_GRAPH](TASK_GRAPH.md) sequencing.

Real requirement → minimal implementation → repeated real use → justified abstraction.
Use configuration for value differences and code for behavior differences.
One mutable gameplay state has one authoritative owner. Other domains read detached
snapshots/read models or send explicit commands; they never mutate unrelated state.
Construct dependencies explicitly. No DI container or global event bus; known
multi-consumer flows use concrete pipelines, callbacks or results.

## Technology and runtime context

Current stack: TypeScript, Phaser 4, Vite, Vitest and npm.
Current presentation is landscape 1920×1080, 16:9, Phaser Scale FIT.
Targets are Desktop Web, Mobile Web and Yandex Games.
Phaser owns rendering, scenes, input integration, camera, assets, audio and visual effects.
Keep meaningful gameplay rules testable without rendering where practical; do not build
a separate simulation framework merely to isolate Phaser.

## Domain boundaries and dependency direction

| Boundary | Target responsibility |
| --- | --- |
| app / composition | Bootstrap, explicit construction and platform-facing wiring |
| Run | Lifecycle, gameplay clock, pause and terminal authority |
| Player Runtime | Transient ship/defense state |
| PlayerBuild | Installed systems, progression choices and resolved build data |
| Combat | Attack/Hit/Damage contracts and concrete resolution |
| Enemies | Definitions, spawn snapshots, AI, movement, HP and death transition |
| Progression | Physical XP, Level, thresholds and pending levels |
| Rewards | Eligibility, offer generation and transaction state |
| Encounter Director | Ambient pressure, templates, plans and pending spawn reservations |
| Capacity accounting | Authoritative accounting of active/reserved/summon occupancy |
| World Scheduler / events | Opportunities and concrete objectives/lifetimes |
| Active / Drone / Boss runtimes | Their concrete transient mechanics |
| Content | Explicit authored definitions and balance data |
| Presentation / UI | Detached read models and gameplay intent adapters |
| platform | Future SDK/storage/advertisement integrations outside gameplay |
| shared | Small demonstrated utilities, not a dumping ground |

These boundaries are not a mandate to create directories or classes in advance.
Application composition supplies dependencies; domain logic consumes explicit data/contracts;
presentation reads state and sends commands. Content does not reach into scenes/UI.
Keep gameplay independent of platform SDKs and browser input objects. Resolve circular
dependencies by correcting ownership before adding a mediator.

GameplayScene targets a composition root and lifecycle orchestrator: create/wire domain
runtimes and presentation. It must not become a GameManager implementing rewards, scaling,
Doctrine, shields and encounter planning. Currently it still owns much of the prototype;
future task-scoped extraction must preserve functioning behavior.

## Run lifecycle and RunContext

Run owns identity, runSeed, gameplay clock, pause authority, lifecycle, terminal state,
RNG stream lifetime and fresh restart/disposal boundary. It does not own pellet counts,
Core loadouts or Drone targeting.

Lifecycle: PREPARING → RUNNING ↔ PAUSED → TERMINAL → POST_RUN → DISPOSED.
Run Phase is separate: OPENING → FORMATION → ESCALATION → MATURITY → ENDGAME → BOSS.

Only Run accepts final Victory/Death; first terminal wins. Preserve GAME-038 atomic attack
completion: finish the lethal projectile's own hit/death/cleanup or full current Missile
detonation before accepting Victory; unrelated later attacks cannot run after terminal entry.
Do not create conflicting terminal flags in other domains.

RunContext is the explicit run-scoped construction/lifetime context for identity, clock
and required domain dependencies. Supply only what each consumer needs; it is not a
global service locator or permission to mutate any domain. Detached read models cannot
expose mutable RunContext internals.

## Gameplay clock and pause

Scheduling uses gameplay/simulation time, not wall-clock. A single pause authority freezes
gameplay, cooldown/effect progression, world scheduling and procedural RNG consumption.
Reward selection and Build Screen pause through that authority. Presentation may continue.
Focus loss resolves through the same pause/input boundary; adapters clear held input.
Do not add an independent feature-level simulation clock or hidden timeScale workaround.

## Input boundary

Keyboard and touch adapters resolve MoveVector, ActivateCurrentAbility and PauseRequest.
Combat/Active logic never inspects KeyboardEvent or TouchPointer directly.
Reset input on reward pause, terminal entry, focus loss and fresh run.
Reject unavailable/paused/terminal Active requests without queuing.
Desktop and mobile use identical combat logic.

## Player Runtime versus PlayerBuild

| Owner | Authoritative state |
| --- | --- |
| Player Runtime | Position, velocity, Current Hull, Current Shield, protection and transient physical state |
| PlayerBuild | 3 Combat System slots/configuration, 1 Active selection/upgrades, 6 Core slots, Ship Stat modifiers, Tags, Combat Analyzer, Doctrine, specializations and Capstones |

Do not put HP or transient cooldowns in Build. Combat System build configuration owns
tuning/investments, specialization, upgrades and Capstone; its runtime owns firing timing,
target and transient attack state. Derive progression readiness from actual build data
where practical rather than duplicating it as another mutable enum.

Core definitions contain identity, statModifiers, tags, requirements, optional exclusiveGroup
and optional concrete mechanicId. Concrete code implements mechanics; content cannot supply
arbitrary callbacks. PlayerBuild applies paused atomic replacement, removes the old Core's
whole contribution and recomputes. Check requirements at acquisition; later tag loss never
revokes acquired specialization/upgrades/Capstone.

## Effective Stats and modifiers

Base Ship Stats + run modifiers + Core modifiers + other authored build modifiers
→ cached/resolved Effective Ship Stats.
Recompute after meaningful build mutations, not all Core/tag logic every frame.
Consumers receive read-only resolved stats/snapshots.

The explicit ten-stat schema is Hull, Thrust, Reactor Power, Fire Control,
Projectile Velocity, Projectile Scale, Engineering, Shield Systems, Impact, Combat Analyzer.
Ordinary same-stat percentages add (1.0 +20% +15% -10% = 1.25), including penalties.
Separate mechanical/specialization multiplier layers require explicit authorship.
Safe stat minima/ranges are authored, not excuses to hide invalid numeric values.
Use explicit fields and consumers, not arbitrary property bags or universal effect scripts.

Fire Control is weapon cadence only; Active/support cooldowns are separate.
Projectile Scale is projectile body size only; Missile radius remains local.
Engineering only affects explicit technology consumers. Analyzer only changes compatible
offer weighting. No global crit, Armor, XP Gain/Pickup Radius, Area or Duration system.

## Tags and BuildSnapshot

PlayerBuild owns tag contributions and derives point/level totals and main/secondary tags.
Exactly twelve tags are defined by GAME_DESIGN; they are identity/eligibility/weight inputs,
not combat multipliers. Detached BuildSnapshot includes installed content, development,
resolved stats, tags, Analyzer and Doctrine for UI and bounded structural consumers.
Previewing a candidate uses detached data, never mutates the live Build or consumes RNG.

## Combat contracts

Attack ≠ Hit ≠ Damage.
Combat System Runtime + current Effective Stats + local rules → immutable AttackSnapshot
→ concrete projectile/explosion/attack runtime.
Resolve attack values at launch, including enemy projectiles. In-flight attacks retain
those values after Build changes. Target-dependent conditions may evaluate on hit.

Ordinary shots hit one enemy once; penetration tracks already-hit targets.
Scatter/shotgun pellets are independent hits and may each damage the same target.
Impact from multiple pellets belonging to one Attack uses diminishing accumulation /
an authored bound; numerical curves are not fixed here.
An explosion hits each target at most once;
Fragmentation projectiles may hit afterward, without recursive fragmentation.
No overkill transfer, friendly fire by default or general damage-type resistance matrix.

Impact resolves Attack Impact × Ship Impact × Enemy Knockback Response.
Concrete enemy movement integrates decaying external knockback rather than immediately
cancelling it. No global Stagger or collision damage from walls/enemies.
Explosion knockback is radial and may fall off with distance. Ordinary Missile explosion
damage itself has no default distance falloff.

## Player defense

Player Runtime owns Current Shield/Hull/protection. The incoming-damage boundary evaluates:
terminal/dev guard → God Mode → protection → Shield → Hull → Death request to Run.
God Mode rejection does not start protection. Shield absorbs first; overflow passes to Hull.
An accepted hit reducing Shield or Hull starts protection. Contact respects protection
and produces small escape separation. A hostile projectile is consumed on player collision
even if the current protection window rejects its damage.
Healing caps at Max Hull; discard global overheal.
Explicit later mechanics may define exceptions. Fixed-strength world Shield does not
implicitly scale with Shield Systems; permanent systems and Shield Active have authored rules.

## Enemy definitions and runtime

Enemies owns EnemyDefinition, EnemyScalingProfile, EnemyRuntime, HP, AI, movement,
attacks, Knockback Response and Decoy Susceptibility.
Definition says what an enemy is; encounter data says when/how to use it.
Director never owns AI, and enemies need not know why they spawned.
Spawn resolves an instance snapshot; later difficulty changes do not mutate it.
Elite combines base archetype with authored compatible modifiers, preserving role;
occasional compatible pairs late do not imply a generic status framework.

## Authoritative EnemyDeath

EnemyRuntime performs exactly one alive → dead transition and creates EnemyDeathRecord.
EnemyDeathRecord carries at least the last damaging / kill source needed by concrete
synergies and telemetry. Minimum conceptual identities include Laser, Missile, Combat Drone,
Active and other explicit authored attack sources. Preserve this attribution through the
concrete damage/death boundary; no arbitrary source framework or generic event bus.
A concrete death pipeline distributes known consequences to XP/Progression, Medical Charge,
event objectives, Boss Victory recognition and telemetry. No generic pub/sub bus.
Preserve exactly-once rewards/removal even when damage paths overlap.
Boss recognition requests terminal state only at the completed owning attack boundary.
Splitter children, later summons and Boss adds must pass capacity accounting.

## Physical XP and progression

Progression owns physical pickup value/collection, Player Level, XP, thresholds and pending
levels. Consolidation preserves total value; time alone cannot expire XP.
Threat Cost is separate from XP Value. Summoned enemies later grant strongly reduced XP.
Retain overflow. Pending levels request sequential reward transactions, each generated after
the previous Build mutation, not a batch of stale offers.

## Rewards and transaction

Rewards owns definitions, eligibility, weights, tag relevance, Analyzer interpretation,
pity, recent-offer history, Reward RNG and immutable RewardOffer.
Rewards chooses; PlayerBuild applies; UI displays.

Order: category → hard eligibility → tag relevance → Analyzer → weighted randomness.
Ordinary Level-Up strives for synergy, neutral stability and pivot choices; Analyzer
uses diminishing returns and never removes pivots or changes strength/difficulty.
Soft pity resets on a relevant presented offer according to the final reward design.
Recent-offer penalties are soft. No reroll/banish in the initial slice.

Transaction: REQUESTED → OFFER_GENERATED → PRESENTED → SELECTED → APPLIED → RESOLVED.
Allowed decline: PRESENTED → DECLINED → RESOLVED.
Only one transaction is active. Bind selection to current offer/run identity;
duplicate/stale input has no second effect. Multiple pending levels resolve sequentially.
UI receives prepared display/preview data. Acquisition categories remain separate:
ordinary Level-Up cannot grant a new system, first Active, major Core, Doctrine,
Mini-Boss/Boss reward or Recalibration.

## Encounter Director

Director owns stage pressure, Threat Budget/context, Complexity Tier, template eligibility,
weights/anti-repeat, Encounter Plans, portal geometry intent and pending reservations,
with NORMAL/EVENT/BOSS modes where appropriate.
Inputs are time/stage, Player Level and bounded structural Build Maturity.
No live DPS, kill speed, low-HP adaptation or secret counter-build logic.

Pipeline: eligible stable templates → weights → Encounter RNG choice → plan → placement
→ reservation → telegraphed spawn. Templates are authored tactical units, not random soup.
Difficulty emphasizes composition/density/geometry/projectiles/Elites rather than huge HP.
BALANCE's ~75/15/10 orientation is guidance, not a mandatory formula.

## Capacity and portal lifecycle

Capacity accounting has one authoritative ledger shared by spawn paths and reservations.
Invariant: active enemies + reserved pending + summon occupancy <= hard safety cap.
Categories must be accounted without double-counting. Gameplay Capacity, Technical Hard Cap
and Threat Budget are distinct. Splitter children, summons and Boss adds consume capacity
under authored rules. Director tracks plan reservations against the authoritative accounting.

Encounter: PLANNED → RESERVED → TELEGRAPHING → SPAWNING → GENERATION_COMPLETE → COMPLETED.
CANCELLED requires correct cleanup before/under global shutdown.
Placement is valid before player-visible telegraph; geometry cannot silently change afterward.

Portal: CREATED → TELEGRAPHING → MATERIALIZING → SPAWNING → CLOSING → CLOSED.
CLOSED means reserved capacity = 0, no future spawn callback and no active spawn timer/callback.
Release reservation ownership correctly on spawn, cancellation and disposal.
Portals are indestructible/non-target; Boss arrival is always visible.

## World Scheduler and event runtime

WorldScheduler owns milestone/optional opportunities, event timing/placement/lifetime/spacing
and category-level eligibility. It neither composes encounters nor selects reward cards.
Director supplies combat plans; Rewards supplies concrete choices.

Initial slice target: at most one major world opportunity is available/in progress at a
time; minor objects may coexist. A missed/ignored structural milestone is not permanently
lost: while relevant, the scheduler may re-offer it after a bounded delay and provide an
authored later last-chance opportunity. Event activation prioritizes event combat scheduling/
pressure without deleting existing ambient enemies, unless that concrete authored event
explicitly requires otherwise. No generic scheduling DSL.

Event: AVAILABLE → DISCOVERED → ACTIVATED → IN_PROGRESS → COMPLETED.
EXPIRED is valid only before activation. FAILED/CANCELLED exists only for concrete events
that support it. Deliberate contact/short interaction activates; spawn alone does not.
Visible category precedes risk; completed objectives precede rewards.
No universal QuestGraph/ObjectiveGraph DSL.

## Active runtime

ActiveBuildState owns selection/specialization/upgrades; ActiveRuntime owns cooldown,
activation and transient effects. Conceptual cycle: READY → ACTIVE → COOLDOWN → READY.
Concrete abilities may own small local substates.
The slot starts EMPTY; first acquisition is Active System Signal.
Dash/Shield/Decoy use concrete authored mechanics and scaling. Fire Control never changes
their cooldown. Reflector intercepts/destroys; true projectile reflection is outside the slice.

## Drone runtime

Doctrine belongs to PlayerBuild; positions/fire belong to Drone runtime.
Replicated instances share one Build progression and Combat System slot.
Diversification has one of each type, each occupying a separate slot.
Default drones are intangible/invulnerable; targeting and launch use actual Drone position.
Combat Drone uses Reactor Power × explicit Engineering scaling and Fire Control cadence.
Medical uses Medical Charge, no normal damage or Fire Control/projectile-stat consumption.
Known death/progression boundaries explicitly contribute Charge; no per-frame scan of dead enemies.
Preserve one stored Medical activation, charge at full Hull and bounded healing cadence.

## Boss runtime

BossController owns phase, pattern sequencing, recovery, transition timing and Boss-owned
add sequencing. It does not own global Victory, Reward Generator or ambient Director state.
Pattern: SELECTED → TELEGRAPHING → COMMITTED → EXECUTING → RECOVERY → DONE.
After COMMIT, critical attack geometry is fixed according to that mechanic.
Authoritative Boss death → completed owning attack → Run.tryFinish(VICTORY).
Run orchestrates Boss transition with Director/World commands; same GameplayScene.
Once transition begins, create no new major opportunities and close unused ordinary ones.
Existing enemies are not magically deleted; allow a short bounded natural-clear period
before Boss arrival if authored. Ordinary XP and earned Level-Ups remain valid during
Boss combat; stopping structural opportunities does not disable progression/rewards.
Juggernaut owns three HP-threshold phases and authored adds, without full-heal or long
arbitrary invulnerability transitions.

## UI and adapters

UI reads detached snapshots/view models and sends commands. It never directly changes HP,
Core loadout, cooldown, specialization or Boss phase.
Build Screen uses detached BuildSnapshot. Reward UI receives prepared previews and stable
offers. Input adapters share intent contracts. Event indicators and damage-number aggregation
belong to presentation, without altering gameplay hits or target eligibility.

## RNG and determinism

Run owns runSeed; derive independent Encounter, Reward, World and Boss RNG streams.
Same seed + content version + relevant state/history reproduces procedural decisions;
pixel-perfect physics replay is not promised.
No Math.random() in gameplay procedural paths; presentation-only randomness may be separate.
Roll at meaningful decisions, not every frame. Pause and read-only snapshots/previews
never advance RNG. Use stable candidate order before weighted selection:
eligibility/feasibility → stable candidates → weights → roll.
Dispose streams with their Run.

## Telemetry and DevTools

Telemetry/diagnostics receive explicit concrete boundary records for run timeline,
aggregates and RunReport/performance investigation. They do not own gameplay decisions.
GAME-045 and GAME-100 define staged delivery; no telemetry framework is pre-created.
DevTools is DEV-only, absent from production, reads detached plain snapshots and invokes
real production paths. Old APIs/references become inert after restart.
GAME-039 remains BACKLOG; its exact limited API is specified in TASK_GRAPH, not implemented here.

## Validation and fallback

| Condition | Required behavior |
| --- | --- |
| Expected runtime limit | Bounded graceful fallback |
| Recoverable runtime failure | Cleanup and diagnostics |
| Invalid content/invariant | Fail loudly in development/tests |
| Optional event placement fails | Skip/retry later |
| Milestone placement fails | Bounded retry/delay; never silently lose structural milestone |
| Portal invalid before telegraph | Replan/cancel |
| Portal invalid after telegraph | Invariant bug |
| Ordinary Level-Up pool empty | Content bug; production may use tiny explicit safe emergency fallback to avoid deadlock |
| Specialization pool empty | Hard content bug |
| NaN/Infinity | Error, not clamp |
| Negative weight | Invalid |
| Eligible choices with zero total weight | Diagnostic; safe uniform production fallback if necessary |

Fallback must never silently change mechanic identity.
Test meaningful deterministic domain rules and actual runtime integration boundaries;
do not write rendering-only placeholder tests. Required project quality: npm run check.

## Performance budgets

Separate enemies, projectiles, XP pickups, drones, portals, gameplay zones, VFX and
damage-number visuals. Gameplay budgets differ from emergency technical hard caps;
ordinary play must not repeatedly reach caps.
Consolidate XP without value loss; aggregate numbers without changing hits.
Reduce/merge/drop decorative VFX where useful; never remove critical gameplay telegraphs.

Desktop/mobile share rules. Low FPS cannot secretly reduce enemies/XP, weaken Bosses,
remove primary attacks/telegraphs or slow enemy logic as hidden difficulty.
Profile confirmed hotspots before pooling/spatial partitioning/batching.
No premature ECS, WebWorker simulation or GPU gameplay architecture.
Add dependencies only for a justified current requirement.

## Cleanup and fresh restart

Run disposal/terminal guards prevent stale timers, callbacks, listeners, reservations,
input ownership and dev mutable references from causing gameplay effects.
Terminal presentation may preserve a frozen world; disposal must end all old ownership.
A fresh Run physically recreates run-scoped state; old references cannot act on the new Run.

Current GAME-038 prototype has exactly FIVE gameplay Phaser TimerEvents:
spawn, Laser/Prism, Missile/Cluster, Drone/Twin and hostile fire.
Until a future task explicitly supersedes this migration rule, do not accidentally add
another gameplay TimerEvent; preserve native restart cleanup and prefer simulation-clock /
runtime-state approaches for new features where appropriate.
Five TimerEvents is a migration invariant, not an eternal target architecture.

## Future profile/save boundary

Persistent Meta Progression, profile and save remain DEFERRED until the complete mechanical
slice is balanced/playtested and proves repeatable core gameplay.
No save/profile schema or service architecture is prescribed by DESIGN-005.
Core gameplay remains outside future platform storage/SDK concerns.

## Migration notes

Current GameplayScene still owns prototype simulation, UI and five TimerEvents.
Current fixed CCCSCT spawning, innate Dash, six repeatable passives, Prism/Cluster/Twin,
homing base Missile and Warden remain factual until their explicit cutovers.
They are not target content promises.

| Legacy responsibility | Planned exit / target |
| --- | --- |
| Scene-owned run/terminal/reset | GAME-042 Run authority, preserving first-terminal atomic semantics |
| Fixed ambient CCCSCT | GAME-065 production Director cutover |
| Standalone prototype Elite | GAME-067 compatible modifier architecture |
| Innate starting Dash | GAME-070 initially empty Active slot |
| Base Missile homing | GAME-057 Guidance specialization |
| Recipe Evolution model (Prism/Cluster/Twin) | GAME-056..059 local tuning/specializations and multi-system runtime |
| Warden final Boss | GAME-092 Juggernaut; Warden may remain dev/test fixture |

TASK_GRAPH is the sequencing authority. No future runtime modules or directories are
created by this documentation migration.

## Anti-goals

No ECS, global event bus, DI container/framework, global service locator, generic Manager
layer, generic plugin system, generic world generation, QuestGraph DSL, universal
Trigger/Condition/Selector/Operation item DSL, universal Ability or Status Effect framework,
global damage-type resistance matrix, global crit system, generic TargetManager,
premature save/profile architecture, mega balance.json or arbitrary property-bag stats.
No multiplayer/network architecture or large dependencies without current approved need.
Generalize only after real multiple consumers justify it.
