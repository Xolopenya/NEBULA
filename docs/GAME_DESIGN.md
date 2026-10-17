# NEBULA — Target Game Design

## Authority and status

DESIGN-005 target baseline. APPROVED means target design, not implemented functionality.
CANDIDATE is not an implementation requirement; DEFERRED is accepted direction outside
this wave; OBSOLETE / SUPERSEDED has no target authority.

[CURRENT_STATE](CURRENT_STATE.md) and source/tests describe working reality.
[ARCHITECTURE](ARCHITECTURE.md) defines ownership and contracts;
[CONTENT_MANIFEST](CONTENT_MANIFEST.md) fixes current-wave scope;
[BALANCE](BALANCE.md) holds tuning hypotheses;
[TASK_GRAPH](TASK_GRAPH.md) controls implementation order and status.
Approval of this design does not authorize implementing future tasks.

## Game concept

NEBULA is a bright arcade sci-fi 2D Bullet Heaven for Desktop Web, Mobile Web and
Yandex Games, in landscape orientation. Move a spaceship through a large open arena,
avoid danger, collect physical XP and build automatic combat systems toward a final Boss.
The camera follows the ship. There is no room dungeon, initial static obstacle maze,
navmesh or pathfinding requirement.

## Game pillars

- Responsive movement and readable threats.
- Automatic combat with meaningful breadth-versus-depth build decisions.
- Authored tactical encounters and deliberate world opportunities.
- Growth from vulnerable ship to powerful build; strong builds may crush encounters.
- The same combat rules on desktop and mobile.

Use readable silhouettes, dark space and bright effects. Placeholders are sufficient
for the Mechanical Vertical Slice; final art follows gameplay validation.

## Core run loop

Move/avoid → automatic attacks → enemy deaths → physical XP → paused upgrade choice
→ stronger build → increasing encounter pressure → Boss → Victory or Death → NEW RUN.
World objectives provide structural acquisitions separately from ordinary Level-Ups.

## Run structure and timeline

Successful run target: ~15–17 minutes, with ~18–24 ordinary Level-Ups.
Build foundation should be substantially formed by ~10–11 minutes; first weapon
specialization typically arrives at ~4–6 minutes.

| Stage | Approximate gameplay time |
| --- | --- |
| OPENING | 0–3 min |
| FORMATION | 3–6 min |
| ESCALATION | 6–10 min |
| MATURITY | 10–13:30 min |
| ENDGAME | 13:30 until Boss |
| BOSS | Follows Endgame |

These are ranges, not scripted timestamps. See BALANCE for opportunity windows and
Boss time-to-kill hypotheses.

## Player ship and movement

The player manually controls movement only; weapons target and fire automatically.
Movement is responsive with normalized diagonal speed, no heavy inertia and at most
short useful smoothing. Thrust affects normal movement speed unless an authored mechanic
explicitly consumes it. Movement direction and attack targeting are independent.
Dash uses current movement input, otherwise the last meaningful movement direction.

## Build model

| Layer | Capacity and rules |
| --- | --- |
| Combat Systems | 3 slots; start with exactly one player-selected system |
| Active Ability | 1 slot; starts EMPTY |
| Core Items | 6 identical slots; start empty |
| Ship Stat upgrades | No slot consumption |
| Weapon upgrades | Attached to the owning Combat System |
| Active upgrades | Attached to the Active |
| Tags | Derived build identity, not inventory |
| Combat Analyzer | Progression / offer-quality characteristic |

The old target of 4 Weapon slots, 4 Passive Module slots and a generic Passive Module
layer is SUPERSEDED. Current prototype passives remain implementation history.

## Ship Stats

Exactly ten shared characteristics are APPROVED:

| Characteristic | Explicit consumers / limits |
| --- | --- |
| Hull | Max Hull only; a maximum increase does not itself prescribe healing |
| Thrust | Normal movement speed; other consumption must be authored |
| Reactor Power | Base damage multiplier for Laser, Missile and Combat Drone; explicit Active mechanics such as Ram or Explosive Decoy may consume it |
| Fire Control | Laser, Missile and Combat Drone cadence only |
| Projectile Velocity | Player projectile movement speed |
| Projectile Scale | Physical player projectile size only |
| Engineering | Explicit technology consumers: Combat Drone, Medical/Salvage Drone, Guidance, Shield/Decoy mechanics |
| Shield Systems | Permanent shield-system effectiveness/capacity; explicit Shield Active rules |
| Impact | Knockback/control force, separate from damage |
| Combat Analyzer | Compatible reward-offer weighting only |

Fire Control does not affect Dash, Shield, Decoy, Medical Drone, Salvage Drone or support
systems unless designed explicitly later. Projectile Scale does not globally scale
explosions, shields, portals, AoE, spread or pellet count. Missile Explosion Radius is local.

Global Crit Chance, Crit Damage, Armor, XP Gain, XP Pickup Radius, universal Area and
universal Duration are not target shared stats. Local mechanics remain local.

### Modifier rules

Ordinary percentages affecting the same stat add: base 1.0 +20% +15% -10% = 1.25.
Bonuses and penalties share this rule. Mechanical/specialization multipliers may form
separate authored layers. Each stat needs safe authored ranges/minima.
Concrete actions evaluate their conditional mechanics at the appropriate time;
content does not contain arbitrary script callbacks.

## Tags and build identity

Exactly twelve tags: Precision, Rapid Fire, Close Combat, Projectiles, Explosions,
Drones, Technology, Shields, Control, Mobility, Support, Survival.

Tags contribute points/levels, influence eligibility, weights, thresholds and UI, and
never directly multiply combat stats. Items usually contribute ~1–3 tags.
Conceptual maturity bands: 0–1 interest, 2–3 secondary, 4+ primary, 6+ deep; tuning may move.
Dominant/secondary tags are dynamically derived. There are no hard build classes;
pivots remain possible.

Choosing Laser, Missile or Combat Drone gives a small initial tag tilt consistent with
the selected system's identity. This never hard-locks the build; pivots remain valid.

## Combat Systems

### Laser

Base Laser is a simple weak projectile weapon. No global critical-hit system.

| Specialization | Mechanical direction | Tags |
| --- | --- | --- |
| Scatter Array | Multiple pellets, spread, short effective range, strong Impact; close swarm/melee defense | Close Combat / Projectiles / Control |
| Repeater Array | Very high cadence, low per-shot damage, fast target turnover, continuous suppression | Rapid Fire / Projectiles |
| Precision Lance | Low cadence, high individual damage, fast penetrating projectile, priority targeting | Precision / Projectiles |

Each branch has four characteristic specialized upgrades and one Capstone in the slice.
Directions describe mechanics; unnamed upgrades are not invented catalog entries.

### Missile

Target base Missile flies straight, impacts and explodes. Homing is added by Guidance.
Ordinary Missile explosion damage has no default distance falloff; Explosion Radius stays Missile-local.

| Specialization | Mechanical direction | Tags |
| --- | --- | --- |
| Guidance | Homing, improved tracking, reacquisition, priority targeting; explicit Engineering consumer | Precision / Technology / Explosions / Projectiles |
| Heavy Warhead | Large slower missile, high damage, large explosion, strong Impact, lower cadence | Explosions / Control / Projectiles |
| Fragmentation | Primary explosion followed by radial secondary projectile fragments | Explosions / Projectiles |

Fragments may independently hit a target already hit by the primary explosion.
No recursive infinite fragmentation. Each branch has four specialized upgrades and a Capstone.
Current prototype homing migrates into Guidance; prototype Cluster is an implementation
reference, not the target progression.

### Combat Drone

Occupies one Combat System slot. Orbits/forms around the player, fires and targets
from its own world position, and is invulnerable/intangible by default. It does not
body-block enemies or projectiles.

Damage concept: Base × Reactor Power × explicit Engineering scaling × drone-local /
specialization modifiers. Cadence uses Fire Control; shared projectile characteristics
apply where meaningful.

| Specialization | Mechanical direction | Tags |
| --- | --- | --- |
| Drone Scatter | Close spread/control fire | Drones / Close Combat / Control / Technology |
| Drone Repeater | Rapid sustained fire | Drones / Rapid Fire / Technology |
| Drone Precision | Precision fire | Drones / Precision / Technology |

Each branch has four characteristic specialized upgrades and one Capstone.
Prototype Twin is not target progression; its runtime ideas may contribute to Replication.

## Combat System progression

BASE → tuning investments → SPECIALIZATION READY → guaranteed specialization choice
→ specialized development → optional Capstone.

| Combat System | Initial weapon-local tuning directions |
| --- | --- |
| Laser | Damage; Cadence; Projectile Velocity |
| Missile | Warhead Damage; Propulsion; Explosion Radius |
| Combat Drone | Bolt Damage; Firing Cadence; Bolt Velocity |

Initial target: three meaningful weapon-local tuning investments before readiness.
These directions are local investments, not global stat upgrades; final increments/caps
are not fixed. Ship Stats, Core Items, tags and other global choices do not count toward
weapon mastery. Specialization is
guaranteed at the appropriate development opportunity. Tags may show synergy but never
block or auto-select a branch. Tags falling later never revoke acquired specialization,
upgrades or Capstone. Late systems receive modest catch-up tuning, not equivalence with
the oldest system. Breadth versus depth remains a central decision.

## Active Ability system

One slot, initially EMPTY. First acquisition comes from Active System Signal:
Dash, Shield or Decoy. Each has its own cooldown, unaffected by Fire Control.
Progression: Base → ~2 tuning investments → specialization → two specialized upgrades
per branch in the slice. Active Capstones are DEFERRED.

| Active | Base | Branches and authored consumers |
| --- | --- | --- |
| Dash | Directional burst, no base damage or invulnerability | Afterburner: mobility, may consume Thrust; Ram: damage + control, may consume Reactor Power + Impact; Phase: brief authored avoidance window |
| Shield | Temporary shield before Hull; explicit Shield Systems + Engineering rules | Fortress: maximum capacity; Pulse: Shield Systems + Engineering + Impact control; Reflector: intercept/destroy hostile projectiles |
| Decoy | False target with HP/lifetime and partial retargeting, not global taunt | Hardened; Explosive; Disruptor |

Reflector does not create truly reflected hostile projectiles in this slice.
Enemies have authored Decoy susceptibility; Bosses may be partially susceptible.
Activation during Pause, Death, Victory or reward selection is rejected and never queued.

## Core Items

Six untyped identical slots. Mostly unique build-defining amplifiers/tradeoffs,
specialists, concrete technologies or hybrid synergies. Repeatable simple percentage
upgrades belong to ordinary stat progression. No rarity system is required.
All important downsides must be displayed.

Replacement is explicit, paused and atomic: replace one or decline. Remove all old
modifiers, tags and mechanics, then recompute the build. Requirements are checked at
acquisition. Tag loss does not revoke previously acquired development.
CoreItemDefinition conceptually contains identity, statModifiers, tags, requirements,
optional exclusiveGroup and optional concrete mechanicId; no arbitrary callbacks.
The exact twelve slice identities are authoritative in CONTENT_MANIFEST.

## XP and Player Level

Enemies drop physical XP. Pickups attract within a fixed comfortable range, never expire
merely with time, and consolidate under high counts without losing total value.
Threat Cost is not XP Value. Future summoned enemies grant strongly reduced XP.

Retain XP overflow and resolve multiple earned levels sequentially. Each later offer
uses the build after the previous selection. Reward selection fully pauses gameplay.

## Reward sources and Level-Up

Ordinary Level-Up presents three distinct choices. Its pool includes Ship Stats,
weapon tuning, specialized weapon upgrades, Active upgrades, small build modifiers,
Combat Analyzer and utility/survival.

It excludes new Combat Systems, the first Active, major Core Items, Drone Doctrine,
Mini-Boss rewards, Boss rewards and Recalibration. These use dedicated sources:
Armory Signal, Active System Signal, Core Technology, Drone Bay Signal and authored
event rewards. Weapon Module is a dedicated weapon-development event.
Mini-Boss reward category is visible before activation and resolves after victory.

Reward generation order: Event/Reward Category → hard eligibility → tag relevance
→ Combat Analyzer → weighted randomness. Ordinary offers strive for Synergy,
Stability/Neutral and Pivot roles, without requiring visible role labels.
Recent concrete offers receive soft repeat penalties. No initial reroll/banish system.

## Combat Analyzer

Improves compatible/synergy weighting with diminishing returns; never hard-filters pivots,
increases item strength, damage or HP, or changes enemy difficulty.
Soft pity raises relevance probability after multiple offers without meaningful primary-tag
match. It resets after a relevant presented offer according to the final Reward design.

## Drone Doctrine

The starting Drone option is specifically Combat Drone. Drone Bay Signal offers an
irreversible choice:

| Doctrine | Rules |
| --- | --- |
| Replication | Copies current Drone type in one Combat System slot; shared specialization/upgrades; conceptually up to ~4 Combat Drones with diminishing total fleet efficiency; no individual levels/inventory |
| Diversification | Different types only, maximum one of each; each type uses a separate Combat System slot |

Slice Replication upgrades: Formation, Target Distribution, Synchronized Volley.
Slice Diversification: Combat Drone + Medical Drone, including Medical Repair specialization.

Medical Drone deals no normal damage and ignores Fire Control/projectile stats.
It uses Medical Charge: full charge + damaged Hull heals; at full Hull charge is preserved.
Store at most one activation with bounded activation rate.
At least one mixed-fleet synergy is required: Combat Drone kills contribute a small
authored amount of Medical Charge.
Medical Barrier, Medical Emergency, Salvage Drone, advanced fleet synergies and the
all-three mixed-fleet Capstone are DEFERRED.

## Damage, Shield, healing and Impact

Attack ≠ Hit ≠ Damage. Launch snapshots resolve attack values; target-dependent
conditions may evaluate at hit time. No general enemy Armor/Defense/resistance matrix.
Overkill does not transfer. One ordinary projectile hits one enemy once; penetrating
projectiles track already-hit targets. Scatter/shotgun pellets are separate hits and may
each damage the same enemy. Impact from multiple pellets in the same Attack uses
diminishing accumulation / an authored bound to prevent excessive volley knockback.
One explosion hits each target at most once; fragments may hit afterward.
No player/enemy friendly fire by default.

Impact = Attack Impact × Ship Impact × Enemy Knockback Response.
External knockback velocity decays; AI must not instantly cancel it.
Explosion knockback is radial and may fall off with distance; ordinary Missile explosion
damage itself has no default distance falloff. Numerical curves remain authored tuning.
No wall/enemy collision damage or global Stagger.

Incoming damage: terminal/dev guard → God Mode boundary → protection → Shield → Hull
→ Death. Shield absorbs first; overflow reaches Hull. Accepted hits reducing either
Shield or Hull start protection. Contact respects protection and adds small escape separation.
A hostile projectile is consumed on collision with the player even when the current
protection window rejects its damage.
Healing caps at Max Hull; global overheal is discarded. Later explicit mechanics such as
Medical Barrier may be exceptions. Player-to-enemy numbers show calculated attack damage,
not only HP removed. No incoming player damage numbers.

## Enemy roster

The approved long-term roster has thirteen roles:

| Role | Identity | Wave |
| --- | --- | --- |
| Swarm | Tiny, fast, fragile, low knockback resistance | Slice |
| Chaser | Baseline melee pursuit | Slice |
| Charger | Telegraph → fixed-direction committed charge → recovery; no steering after commit | Slice |
| Shooter | Medium-range projectiles | Slice |
| Sniper | Long range, obvious telegraph, fast narrow projectile, priority target | Slice |
| Tank | Slow, high HP, high knockback resistance; no Armor system | Slice |
| Suppressor | Burst/fan pressure and space denial | Slice |
| Bomber | Approach and telegraphed explosion; can be pushed away; no enemy friendly fire initially | Slice |
| Splitter | Death creates small enemies consuming runtime capacity | Slice |
| Artillery | Telegraph anti-camping AoE | Wave 2 |
| Summoner | Personal live cap plus global capacity | Wave 2 |
| Support | Visible buffs | Wave 2 |
| Guardian | Protection without immunity | Wave 2 |

## Elite enemies

Base archetype + compatible modifier; preserve its role. The six-modifier candidate
catalog is Frenzied, Shielded, Commander, Volatile, Heavy, Accelerated.
Frenzied, Shielded, Heavy and Accelerated are APPROVED for the slice;
Commander and Volatile are DEFERRED to Wave 2.
Compatibility is authored: usually one modifier early; occasional two compatible ones
late. No affix soup.

## Mini-Bosses

Siege Walker: slow heavy siege platform with Siege Shot and Suppression Barrage.
Hunter: aggressive pursuit with Target Lock / committed pursuit or charge and Pressure Volley.
Their event exposes reward category before activation; victory grants a major paused reward.

## Bosses

Juggernaut is the production slice Boss, in the same GameplayScene.
Once Boss transition begins, no new major world opportunities are created and unused
ordinary opportunities close. Ambient Director pressure stops/changes; a visible Boss
portal announces arrival. Existing enemies are not magically deleted; transition may
allow a short bounded natural-clear period before Boss arrival. Boss owns authored adds.
Ordinary XP and earned Level-Ups may still trigger during the Boss fight even though
structural world opportunities have stopped.
Three HP-threshold phases, no full heal, no long arbitrary invulnerability.
Very high knockback resistance without blanket immunity. All key attacks are dodgeable
by normal movement: Targeted Charge, Radial Salvo, Heavy Shockwave, Reinforcement Drop.
No counter-picking player builds; strong builds may kill significantly faster.
Boss death immediately requests Victory through Run terminal authority.

Current Warden remains a legacy prototype/test fixture until Juggernaut cutover.

## Encounter Director — player-facing design

Run Stage + Player Level + bounded Build Maturity → Pressure/Threat context
→ eligible Encounter Templates → weighted anti-repeat choice → Encounter Plan
→ placement → Portal telegraph → spawn.

Templates are the main authored combat unit, not enemy-by-enemy random soup.
Difficulty grows through density, composition, portal geometry, Elite frequency,
projectile pressure, multi-wave complexity, shorter nonzero breathing windows and moderate
archetype-specific stat scaling. Time/Stage dominates, Level contributes less, and
structural Build Maturity contributes less with a hard bound.
No live-DPS adaptation, kill-efficiency rubber band, low-HP mercy or counter-build Director.

## Portals

Spawn request → valid location → capacity reservation → portal/rift telegraph → warning
→ materialization at that location → close.
Portals are indestructible, non-target gameplay telegraphs.
Visible telegraph geometry/position cannot silently move. Greater surprise or pressure
requires stronger warning. Boss portal is always visible.

## World events

Major slice categories: Active System Signal, Armory Signal, Weapon Module,
Core Technology, Drone Bay Signal, Mini-Boss Signal, Repair Signal.
Category is known before risk; important off-screen events use compact edge indicators.
Spawn alone does not activate an event: deliberate contact/short interaction is required.
Rewards follow objective completion.

Initial slice target: at most one major world opportunity is available/in progress at a
time; minor objects may coexist. Opening grace lets the player learn movement, automatic
combat, XP and early Level-Ups before major world events (timing hypothesis in BALANCE).
A missed/ignored structural milestone is not permanently lost: while still relevant,
the scheduler may re-offer it after a bounded delay and provide an authored last-chance
opportunity later. Activating a major event does not delete existing ambient enemies.
Event combat receives scheduling/pressure priority; existing enemies remain unless a
concrete authored event explicitly says otherwise.

World Event Scheduler owns milestone/optional opportunities, eligibility, placement,
lifetime and decision spacing. Director owns ambient pressure; Reward Generator chooses
concrete rewards. No generic QuestGraph DSL.

## Minor world objects

Data Cache, Repair Pod and Shield Capacitor. Temporary world Shield is fixed-strength
by default and does not scale with Shield Systems.

## Environment mechanics

Repair Beacon and Projectile Distortion Field are in the slice.
Gravity Anomaly is DEFERRED to Wave 2.

## HUD and combat readability

| Context | Presentation |
| --- | --- |
| Player world-space | Hull and Shield |
| Persistent HUD | Thin XP/Level progress; Active state after acquisition |
| Normal enemies | No health bars |
| Elite | Small world-space health bar |
| Mini-Boss | Compact top health bar |
| Boss | Large top health bar |
| Player-to-enemy damage | Floating numbers, aggregated where needed |
| Incoming damage | Visual feedback, no text damage number |
| Major off-screen events | Compact directional indicators |

No ordinary enemy edge indicators. Tags appear in Level-Up/Build contexts, not persistent
combat HUD. No combo meter or player-facing DPS meter.

## Build Screen and pause

Paused Build Screen shows Combat Systems, Active, Core Items, Ship Stats, main Tags,
Combat Analyzer and Drone Doctrine. UI reads a detached build model and issues commands;
previews never change the real build.

## Run start

NEW RUN → choose Laser / Missile / Combat Drone → START.
Exactly one starting Combat System, empty Active and Core slots.
All slice content is available for development/testing; no meta unlock gates.

## Post-Run

Victory or Death result includes gameplay duration, Level, starting system, final Combat
Systems, Active, Core Items, main tags, Boss/death source and NEW RUN.
No meta currency, persistent unlock rewards or profile progression.

## Desktop / mobile parity

Desktop: WASD / arrow keys, Space for current Active.
Mobile: floating analog joystick on the left, one Active button, Pause control.
No manual aim, right stick, mouse aiming or tap-to-shoot. Both adapters use the same combat
logic. Functional minimum audio/readability settings are required for slice closure.

## Vertical Slice target

CONTENT_MANIFEST fixes the Mechanical Vertical Slice: 3 starting system choices,
9 weapon specializations with 4 specialized upgrades + 1 Capstone each,
3 Active types / 9 branches with 2 specialized upgrades each and no Active Capstones,
12 Core Items, both Drone Doctrines with Medical Repair, 9 normal enemy roles,
4 Elite modifiers, 15 encounter templates, 2 Mini-Bosses, Juggernaut,
7 major events, 3 minor objects and 2 environment mechanics.
Complete XP/rewards/Analyzer, Director/portals/world scheduling, HUD/Build/Post-Run,
RunReport and desktop/mobile controls are required; final art is not.

## Deferred content

See CONTENT_MANIFEST for Wave 2. Persistent Meta Progression/profile/save stays DEFERRED
until the full mechanical slice exists, has been playtested/balanced and proves repeatable
core gameplay. Do not design persistence architecture before that boundary.
Final Service Signal is CANDIDATE, not committed.

## Explicit non-goals

No multiplayer/network architecture, manual aiming, crafting, complex exploration,
procedural open world, large narrative/technology tree, permanent percentage-stat grind,
rarity economy, premature backend/platform integration or realistic spacecraft inertia.
Do not build generic frameworks to anticipate content.

IDEA → IMPLEMENT → PLAY → MEASURE → CHANGE.
