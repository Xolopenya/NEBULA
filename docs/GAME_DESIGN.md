# NEBULA — Game Design

## Status

Pre-production baseline.

This document describes the intended game design.
Approved future directions below are not implemented systems or authorization to build them.
TASK_GRAPH.md remains authoritative for scheduled implementation work; CURRENT_STATE.md records what works now.

---

## Game Concept

NEBULA is a 2D browser Bullet Heaven / Survivors-like set in a bright arcade sci-fi universe.

The player controls a spaceship inside a large bounded space sector, avoids enemies and hostile projectiles, while the ship's weapons attack automatically.

During a run, the player collects XP, levels up, chooses upgrades, builds weapon/module combinations, and eventually fights a boss.

Target platforms:

- Desktop Web
- Mobile Web
- Yandex Games

Orientation:

- Landscape

Target audience:

- Casual / core

Target run duration:

- approximately 12–15 minutes

---

## Player Fantasy

The player should feel like the pilot of an increasingly powerful combat spacecraft surrounded by a growing alien swarm.

A run should begin with a vulnerable ship and gradually turn into a visually overwhelming combat build capable of destroying large enemy groups.

---

## Core Loop

Move and avoid danger
> weapons automatically attack enemies
> enemies die
> XP drops
> player collects XP
> player levels up
> player chooses 1 of 3 upgrades
> build becomes stronger
> enemy pressure increases
> repeat

---

## Session Loop

Start run
> survive enemy waves
> collect XP
> build weapons and modules
> encounter stronger enemies and elites
> reach the final boss
> defeat boss or die
> receive run result
> return to menu
> unlock new gameplay content over time
> start another run

---

## Progression Loop

Long-term progression should primarily unlock new gameplay possibilities rather than permanent percentage-based stat increases.

Planned unlock categories:

- Ships
- Weapons
- Passive Modules
- Sectors

Do not build permanent progression around repeated upgrades such as:

- +5% damage
- +3% HP
- +2% movement speed

The main long-term reward should be access to new builds and play styles.

---

## Controls

### Desktop

Primary movement:

- WASD
- Arrow keys may be supported as secondary controls

Active ability:

- one dedicated button

### Mobile

Primary movement:

- virtual joystick

Active ability:

- one large touch button

Weapons fire automatically.

Manual aiming is not part of the current design.

---

## Movement

Movement should be arcade-like and immediately responsive.

Do not simulate realistic spacecraft inertia.

The space setting should affect presentation and theme without making basic movement difficult to understand.

---

## Ship Design

Each ship has:

- base health
- movement characteristics
- its own active ability

Initial ship:

- medium health
- medium speed
- general-purpose play style
- active ability: Dash

Future ships should differ through gameplay behavior rather than only numerical stat changes.

### Future tunable ship characteristics

Ship/run characteristics may become mutable when a real Passive Module or gameplay system
consumes them. Primary characteristics are distinct from run-wide combat modifiers:

| Characteristic | Design meaning |
| --- | --- |
| Maximum Health | Controls maximum HP; any healing granted by an increase must be explicitly defined by its future module task. Current baseline HP remains an implementation detail. |
| Movement Speed | Affects normal movement, not Dash automatically. |
| XP Pickup / Magnet Radius | Distance at which XP pickups begin moving toward the ship; collection radius, acceleration and magnet maximum speed remain separate. |
| Armor (future defense) | Proportional incoming-damage mitigation, not flat -1 damage: common 1-damage attacks would otherwise become binary immunity. Exact math waits for an Armor implementation task. |
| Health Regeneration (future sustain) | Restores HP over time; rate and tick/continuous semantics are not locked. Does not implicitly create a shield. |
| XP Gain (future utility) | Increases XP credited from collected experience, not attraction or collection geometry. |

Add characteristics when an actual mechanic consumes them; do not predefine speculative stats.
This supports ship differentiation, balancing, passive upgrades/modules and additional ships
without spreading balance through scene logic. Concrete needs should emerge through Dash,
passives/modules and additional ships. Current player values remain local to GameplayScene;
no generalized ship-characteristics system is implemented.

### Dedicated mechanics

These are possible future mechanics, not scalar fields automatically owned by every ship:

- Shield is a dedicated defensive mechanic, potentially with capacity/current shield,
  recharge delay/rate and break/recharge behavior. A future Shield Generator may introduce it;
  do not model it now as simply another number beside HP.
- Dodge / Evasion is not committed for the prototype; introducing it requires a deliberate combat rule.
- Revive is a capability/perk separate from base characteristics.
- Status effects/chance belong to actual burn, slow or other implemented combat mechanics;
  do not predefine generic status fields.
- Dash remains active-ability behavior. Its cooldown, charges, duration and distance/speed
  belong to ability progression unless a concrete design explicitly broadens their meaning.

---

## Arena

The run takes place inside a large bounded sector.

The whole arena is not visible at once.

The camera follows the player.

Initial sector theme:

Deep Space / Asteroid Field

Interactive world objects may exist, but they should remain a small secondary mechanic.

Examples:

- anomaly
- wreck
- container

Do not turn the game into an exploration game.

---

## Combat

Weapons attack automatically.

The player can receive damage from:

- enemy contact
- enemy projectiles

Combat should prioritize:

- visual readability
- immediate hit feedback
- large enemy counts
- understandable enemy behavior

### Future global combat modifiers

Separate from ship characteristics, these belong conceptually to the current run/build:
Damage, Attack Cooldown / Attack Speed, Projectile Speed, Area / Effect Size, Duration,
Critical Chance and Critical Damage. Knockback joins this category only if it becomes a real mechanic.
These are candidates, not implemented global modifiers; percentages and stacking formulas are not locked.

The player owns a modifier; concrete weapon behavior decides whether it applies:

- Damage may eventually affect Laser damage, Missile explosion damage and Drone bolt damage.
- Area may affect Missile explosions or future AoE weapons; do not invent an area effect for Laser.
- Projectile Speed applies to meaningful projectile motion; persistent/non-projectile behavior
  need not consume it.
- Duration applies only to weapons/effects with a meaningful duration.

Do not force every weapon to consume every modifier.

### Future spawn telegraph / space rift

Enemy or dangerous-object arrivals should eventually support a temporary portal, spatial rift
or anomaly before materialization. This is gameplay readability as well as presentation:
it shows where danger will appear, gives a short reaction window and communicates event importance.

Conceptual sequence:

spawn request → valid location → portal/rift warning → short delay → entity materializes → warning disappears

Timing is not locked. Normal arrivals may be short/subtle, elites or groups stronger,
and bosses/events prominent custom arrivals when their significance justifies it.
The telegraph is not necessarily an active enemy. Pending spawns and active enemies must
eventually be accounted for together so opening many pending portals cannot bypass spawn caps.

First Playable currently spawns enemies directly outside the camera edge, without a telegraph.
Presentation/location rules may need adjustment so future warnings are actually visible and useful.
Introduce this readability feature before content density makes instant arrivals difficult to read;
the telegraph and pending-spawn runtime are not implemented now.

---

## Run Build

Maximum equipped build:

- 4 Weapons
- 4 Passive Modules

No item rarity system in the initial version.

No reroll system in the initial version.

---

## Level Up

Enemies drop XP pickups.

XP exists physically in the game world.

When the player moves close enough:

XP pickup
> enters magnet radius
> accelerates toward the ship
> is collected

When enough XP is collected:

game pauses
> 3 upgrade choices are shown
> player chooses 1
> run resumes

### Future larger choice pool — DESIGN-004 recommendation

Current Laser/Prism choices and four repeatable passives remain authoritative; this is a
future policy for adding Missile/Drone tracks, not a change to the implemented sampler.
Six extra tracks expand the uncapped ordinary pool from seven to thirteen. A flat
three-of-thirteen draw offers any particular track only 3/13 of the time versus 3/7 now,
making completion of several mastery requirements more luck-dependent. Owned-weapon
eligibility is useful later but insufficient today: all three weapons start active.
A random weapon-category slot alone still spreads progress across three weapons.

Recommend exactly three distinct choices with a small focus/category rule:

- One upgrade for the focused weapon, preferring its least-progressed eligible track
  with stable cycling for ties. Focus follows the last weapon upgrade accepted;
  begin with Laser and retain focus when accepting a passive.
- One eligible Passive Module, keeping build support and recipe prerequisites visible.
- One open choice sampled from remaining eligible options, allowing a pivot to another
  weapon or another passive. Selecting another weapon's upgrade changes focus.

Exclude previously selected options from later slot sampling. If the focused weapon is
mastered, use its slot for another uncapped weapon upgrade; if a category has no eligible
entries, fill from remaining ordinary options. No acquisition/inventory is needed.
An eligible evolution uses the open slot. Multiple future eligible evolutions require an
explicit fair offer-order rule in their concrete task; do not silently displace Prism's
current guarantee or add slots. Existing next-pause/refusal/once-only offer rules remain.

This provides recurring mastery and passive opportunities while preserving an open pivot;
it does not guarantee a particular random passive. Validate focus switching, prerequisite
availability and time-to-mastery when expanding the pool. A later task must implement/review
the policy, labels and fallbacks before the full pool expansion. Keep stable presentations,
no rarity, weighting, rerolls or generalized loot framework; current GAME rules are unchanged.

---

## Weapons

Vertical Slice target weapons:

1. Laser
2. Missile
3. Drone

Weapon behavior should be meaningfully different.

Balance-only variations should normally use content configuration rather than separate weapon implementations.

### Future tunable weapon characteristics

Future weapons should separate explicit tunable balance data from behavior. Where applicable,
shared characteristics may include damage, attack/fire cooldown, projectile speed, lifetime,
size, count, range and other values demonstrated to be genuinely shared.

Prefer shared characteristics plus weapon-specific behavior/configuration. Laser may use damage,
cooldown, projectile speed and lifetime; Missile may also need explosion radius and homing behavior;
Drone may need orbit, range, movement and attack behavior. Numerical tuning does not replace mechanics.
Do not define one giant universal structure with every possible optional weapon property.
Introduce shared fields only after actual weapons demonstrate the common requirement.

The goal is easier balancing, upgrades and weapon additions with clear numerical/behavior separation.
GAME-021 introduced the first concrete mutable/upgradable Laser values;
broader generalization requires genuinely shared consumers, not just similarly named numbers.
No generalized weapon-characteristics system or weapon framework exists now.

### Current concrete weapon ownership

- Laser owns mutable damage, fire interval and projectile speed through its existing upgrades.
- Missile owns concrete speed, lifetime, explosion damage/radius and maxActiveMissiles = 1;
  homing, explosion and concurrency cap remain Missile-specific.
- Drone owns orbit behavior and independent straight-bolt values; orbit is not a generic weapon stat.

These values/behaviors currently belong to GameplayScene. Future global modifiers must integrate
deliberately with these concrete owners rather than replace them with one generic weapon structure.

### Future Missile progression — DESIGN-004 recommendation

Current baseline: one 1800 ms global firing timer, speed 450 px/s, lifetime 4000 ms,
explosion damage 2/radius 120, projectile radius 8 and maxActiveMissiles = 1.
Launch selects nearest to the player, retains a living target and reacquires nearest
from the Missile after target loss. Direct homing, swept impact, AoE and launch-damage
snapshots define its role. No Missile upgrade tracks/evolution are implemented.

Recommend three tracks, with increments and rank caps deferred to implementation:

| Track | Concrete Missile consumer and purpose |
| --- | --- |
| Warhead Power | Increase Missile-specific explosion damage before Combat Processor; improve each detonation's lethality. |
| Propulsion | Increase flight speed, reducing time-to-impact against moving enemies and freeing the single active slot sooner after impact. No player movement/global projectile-speed change. |
| Blast Expansion | Increase Missile-specific explosion radius for cluster coverage, not direct-hit damage or generic projectile size. |

Speed improves delivery without adding turn-rate mechanics: current direct homing already
supplies guidance, while travel at 450 px/s occupies the cap. Lifetime stays separate;
speed tuning must consider the increased distance per lifetime. Cap increases/simultaneous
Missiles are not normal first-set scalar upgrades; reserve changes in instances for evolution.

Missile mastery should require all three real tracks reaching their later concrete caps:
delivery, warhead lethality and clustered coverage together justify mastery of this area
weapon. Track selections explicitly, never infer mastery from mutable numeric values.
This is not Laser's 2/2/2 rule or generic WeaponLevel. Exact increments/rank counts/caps
await the implementation/balance task.

### Future Drone progression — DESIGN-004 recommendation

Current baseline: one persistent companion, orbit radius 110/angular speed 2 rad/s,
one global 1200 ms firing timer, nearest-to-Drone targeting and fixed-aim straight bolts.
Bolt damage is 1, speed 800 px/s, lifetime 1800 ms, radius 5, with global-damage snapshots
at launch. Orbit follows the player; no Drone health/destruction. No Drone tracks/evolution
are implemented.

Recommend three tracks, with increments and rank caps deferred to implementation:

| Track | Concrete Drone consumer and purpose |
| --- | --- |
| Bolt Power | Increase Drone-specific bolt damage before Combat Processor, independently of Laser upgrades. |
| Firing System | Reduce the existing Drone TimerEvent's real firing interval, without extra events. |
| Bolt Propulsion | Increase bolt speed to reduce travel time/misses against moving targets while retaining fixed firing-time aim. |

Choose bolt speed for useful hit delivery, not just implementation ease. A larger orbit
changes launch origins/target selection but is not reliably beneficial: the opposite-side
companion may be farther from danger, and arena clamping distorts the ring. Higher angular
speed changes origin cadence without increasing attacks or guaranteeing hits and can make
target switching noisy. Keep radius/angular speed as formation/behavior tuning for now.
Bolt speed improves the actual non-homing attack, with lifetime-based reach also increasing;
it is Drone-specific, not a global projectile-speed stat or generic companion characteristic.

Drone mastery should require completion of its three real attack tracks at later concrete
caps: lethality, attack frequency and delivery should mature before formation evolution.
Use explicit selection progression, not numeric inference or generic WeaponLevel. This
independently justifies all-track completion, not Laser's exact cap structure. Do not add
Drone health, destruction or arbitrary companion stats.

### Amount / additional instances

More weapon instances/projectiles is an important future build axis, but not one universal Amount stat:
Laser might fire multiple projectiles per attack; Missile might use maxActiveMissiles or missiles
per launch; Drone might support multiple companions. Keep meaning weapon-specific until multiple
real weapons demonstrate one common semantic. Current Missile maxActiveMissiles = 1 stays specific;
do not turn it into a global projectileCount field.

---

## Passive Modules

Vertical Slice target:

- 3 Passive Modules

Passive modules should modify or complement builds.

They should not exist only as trivial permanent percentage bonuses when a more interesting gameplay interaction is possible.

### Future catalog direction

The following are approved design candidates, not implemented modules or a promise that every
candidate will ship in the Vertical Slice. Even safer first candidates need a scoped implementation task.

| Core / safer first candidate | Characteristic or effect |
| --- | --- |
| Hull Plating | Maximum Health |
| Thruster Module | Movement Speed |
| Collector Field | XP Pickup / Magnet Radius |
| Repair Nanites | Health Regeneration |
| Combat Processor | Global Damage |

| Additional future candidate | Characteristic or effect |
| --- | --- |
| Reinforced Armor | Armor |
| Experience Analyzer | XP Gain |
| Cooling System | Attack Cooldown / Attack Speed |
| Accelerator Coil | Projectile Speed |
| Spatial Amplifier | Area / Effect Size |
| Temporal Capacitor | Duration |
| Targeting Matrix | Critical Chance |
| Critical Core | Critical Damage |

Possible later/special modules:

- Shield Generator introduces/strengthens dedicated Shield mechanics.
- Replicator / Replication Matrix may increase weapon-specific amount/instances;
  a universal Amount effect is not defined.
- A knockback-related module waits until knockback exists as a real mechanic.

DESIGN-004 recommends future Spatial Amplifier (Area/explosion-oriented) as the prerequisite
direction for Cluster Missile, and future Replication Matrix / Replicator for Twin Drone
Formation. Neither passive is implemented. Each needs its own concrete Passive task before
the corresponding evolution; final eligibility levels/effects are not locked here.
Spatial Amplifier needs a meaningful Area consumer, such as Missile explosion coverage,
not invented AoE for every weapon. Replication remains weapon-specific companion behavior,
not universal Amount. Do not substitute Combat Processor or an unrelated existing passive
merely to avoid these dependencies.

### Run progression and implementation boundary

Passive Modules belong to the current run and reset between fresh runs/restarts unless later
meta systems explicitly say otherwise. They may be levelable/repeatable where concrete stacking
supports it, change explicit characteristics rather than arbitrary string-keyed properties,
coexist with weapon upgrades in the level-up ecosystem and support build differentiation.

Exact caps, increments, rarity, rerolls, weighting, inventory slots, acquisition count and evolution
recipes remain for concrete implementation/content tasks; existing build targets do not lock these rules.

GAME-028 remains BACKLOG until separate definition/review selects a small implemented subset and
exact numbers. Hull Plating, Thruster Module, Collector Field, Repair Nanites and Combat Processor
are recommended first candidates, not an implementation commitment. TASK_GRAPH remains authoritative.
DESIGN-002 neither defines nor implements GAME-029 Evolution.

---

## Weapon Evolutions

Weapon Evolutions are a required feature of the eventual core game.

### Core principle and offer policy

base weapon progression/mastery + required Passive Module condition + explicit
player-accepted evolution offer → run-local evolved behavior for that weapon.

Evolution is not automatic. The prerequisite Passive Module is not consumed;
evolution state resets on a fresh run/native restart. Level-up choices remain the
acquisition surface unless a later explicit task introduces another source.
This design does not define chest/Elite evolution acquisition.

Evaluate eligibility when a new level-up presentation is created. An eligible
unevolved evolution may be guaranteed in that presentation. Accepting the final
prerequisite finishes the current choice/resume normally; the evolution becomes
offerable on the next level-up, without opening a second pause immediately.
Ignoring it leaves eligibility intact; accepting it applies exactly once for the run.
GAME-029 is authoritative for Prism's exact guarantee/choice rules, not a generic UI framework.

### Weapon-specific mastery and transformation

Mastery follows actual weapon progression, not one universal WeaponLevel abstraction.
Laser has three real upgrade paths with explicit ranks introduced by GAME-029.
Missile and Drone currently have no corresponding tracks. Define their mastery only
when real upgrades/progression exist; do not invent rank fields for symmetry or
force Laser's three tracks onto other weapons.

An evolution should have a recognizable mechanical identity: changed firing pattern,
targeting, area behavior, persistent instances or another weapon-specific behavior.
Numeric changes may support that transformation; evolution should not merely be +50% damage.

### Laser — implemented first evolution

Laser + Combat Processor → Prism Laser.

GAME-029 implements this one evolution only; its ranks, recipe and Prism behavior remain authoritative.
Mastered Laser remains the numerical foundation. Prism changes one firing callback
into a three-direction spread on the same Laser cadence/TimerEvent, retaining existing
launch snapshots. It modifies the same weapon rather than creating a second independent
weapon runtime. The volley does not establish a global Amount stat.

### Missile — future candidate directions

Missile evolution is future work, neither scheduled nor implemented by DESIGN-003.
Preserve homing, explicit target/reacquisition, Missile-specific active cap, impact
detonation and AoE identity. Transform these behaviors rather than default to Laser-like spread.

Approved candidate examples, not implementation commitments:

- fragmentation/cluster warhead after primary detonation;
- multiple independently targeted warheads;
- larger or chained explosions;
- specialized target/impact behavior.

maxActiveMissiles and extra missiles/warheads remain Missile-specific, not universal Amount.
Explosion radius remains specific unless an actually implemented global Area modifier
deliberately consumes it. Mastery must follow real Missile progression. Final recipe,
Passive Module prerequisite and numbers wait for a concrete evolution task.

DESIGN-004 recommends **Cluster Missile** as the first future evolution: preserve the
homing Missile and normal primary impact explosion, then resolve a fixed radial pattern
of smaller satellite explosions around that impact point as part of its detonation.
This adds a readable central hit plus surrounding cluster coverage. Prefer satellite
blasts over independently homing warheads first: detonation changes without multiplying
target ownership, flight runtimes or simultaneous Missiles.

Satellites are Missile-specific secondary blasts, not independent weapons/global Amount.
Retain primary maxActiveMissiles = 1 and one firing event; no recursive fragmentation.
Pattern count/offsets, damage, radii, overlapping-hit policy and secondary damage snapshot
timing must be explicit in the concrete task. No final balance numbers or VFX are locked.
Recommend future Spatial Amplifier as a meaningful Area prerequisite, not Combat Processor
by analogy with Prism; its Passive implementation is a dependency, not an existing system
or a finalized recipe/level.

### Drone — future candidate directions

Drone evolution is future work, neither scheduled nor implemented by DESIGN-003.
Preserve persistent companion identity, player-relative orbit, Drone-relative targeting,
independent firing timer and straight bolt attack.

Approved candidate examples, not implementation commitments:

- multiple coordinated companions;
- mirrored/symmetric orbit formations;
- synchronized volleys;
- alternate firing geometry;
- specialist companion behavior.

Multiple Drones remain a specific mechanic, not universal Amount. Orbit/range/formation
remain Drone behavior; mastery must emerge from real Drone progression/upgrades.
Final recipe, Passive Module prerequisite and numbers wait for a concrete evolution task.

DESIGN-004 recommends **Twin Drone Formation** as the first future evolution: retain the
existing companion and add one opposite/mirrored orbit position around the player.
Both belong to the same Drone weapon and normally fire synchronously on the existing
Drone TimerEvent, each selecting nearest from its own actual position and firing a
fixed-aim bolt. Preserve center clamping and player-relative orbit ownership.

A second launch origin makes surrounding coverage/companion identity clearer than just
volley geometry. A specialist companion needs a new role; alternate firing geometry alone
risks another Laser-like spread. Mirrored companions reuse actual orbit/targeting/bolt
behavior for a distinct transformation. This is one preferred evolution, not adoption of
all DESIGN-003 candidates. Companions remain Drone-specific, not universal Amount;
do not add per-Drone timers. Recommend future Replication Matrix / Replicator after its
separate Passive task, without repurposing an unrelated current passive. Exact formation
balance and final recipe levels remain deferred.

### Shared policy and concrete ownership

Likely shared conceptual facts are whether a specific evolution is active, whether
its concrete prerequisites are satisfied, offer policy and run reset semantics.
They do not require a generic runtime EvolutionRecipe registry now.

Prefer shared rules/policy + explicit per-weapon progression + explicit evolved behavior.
Keep progression and behavior with each weapon; avoid a universal object with optional
homing, orbit, explosion, spread, companion-count and unrelated fields.

Evolution normally transforms the existing weapon runtime. A new name alone does not
justify another independent timer: Prism uses Laser's event; future Missile and Drone
evolutions normally retain their respective firing/runtime ownership. Any new TimerEvent
requires explicit mechanical justification in its concrete task, protecting restart/lifecycle.

Global player-weapon damage remains orthogonal: evolution does not bypass Combat Processor,
and applicable launch-time snapshots continue. Future Area, Duration, Cooldown or Projectile
Speed modifiers apply only when actually implemented and meaningful to that evolved weapon.
Do not invent modifier fields here.

Each concrete evolution may require a Passive Module, without one universal mapping formula.
Prism requires Combat Processor. Future Missile/Drone recipes may use existing or future
modules for a meaningful build relationship, selected only in their concrete tasks.

### Extraction and task boundary

GAME-029 is the first concrete evolution implementation task, limited to Laser → Prism Laser.
DESIGN-003 does not broaden it to Missile/Drone; GAME-036 Elite remains unrelated and BACKLOG.
Implement concrete behavior first, preserve weapon ownership and share demonstrated common rules.
After the second/third real evolution exists, review actual duplication before extracting
small common identity, evolved state or eligibility/offer policy representations.

### DESIGN-004 sequencing and future ownership checkpoint

Recommend, without assigning IDs/changing TASK_GRAPH: Missile upgrades; required Area-oriented
Passive; Cluster Missile; Drone upgrades; required replication-oriented Passive; Twin Drone
Formation; then Elite, Boss and Run Victory work. Review the larger-pool policy as tracks
are added, before a thirteen-option flat pool makes mastery unreliable. This is sequencing
advice only; a separate reviewed roadmap revision must schedule the work.

Laser retains Laser ranks/Prism and its timer; Missile retains its progression, homing,
targets, explosion/cap and timer; Drone retains its progression, orbit/companions/targeting
and timer. Cadence progression must modify the real existing event without duplication.
Evolved names do not justify timers; any extra event needs a concrete mechanical reason.
Combat Processor remains current weapon-specific damage × global player-weapon multiplier:
Warhead Power and Bolt Power change their own damage first. Missile explosion damage
snapshots at launch; Drone bolt damage snapshots at each bolt launch. Secondary Cluster
snapshot timing must be specified by its task, never silently read from live global values.
Do not invent other global modifiers or implement their consumers here.

After Missile and/or Drone evolution actually exists, inspect real duplication in progression
ranks, eligibility, guaranteed offers, evolved state and launch/firing behavior. Only actual
second/third consumers justify small extraction; none is prescribed now. Track/evolution/
passive implementation, exact increments/caps, balancing and pool details remain future
concrete work. No weapon acquisition/inventory, rarity/rerolls, production UI/VFX, save/meta
or dependencies are introduced by this design.

Do not pre-create EvolutionManager, WeaponManager, a universal EvolutionRecipe engine,
generic Weapon base class, effect pipeline, universal upgrade tree, generic Amount stat,
ECS, DI, event bus or plugin system. Second/third real consumers must justify extraction.

---

## Enemies

Vertical Slice target:

- 3 regular enemy archetypes
- 1 Elite
- 1 Boss

Enemy types should primarily differ through behavior and silhouette.

Potential archetypes include:

- Swarm
- Shooter
- Charger
- Tank

The exact final set is not yet fixed.

### Future archetype data and behavior

Future variety should combine explicit enemy definition/data with specific behavior.
Gameplay roles may include chaser/melee, shooter/ranged, tank/durable enemy, summoner
and specialists as needed. Relevant values may include health, movement speed, contact damage,
attack cadence and role-specific balance values; statistics alone cannot express behavior.

This should make creation and balance adjustments easier, allow controlled run difficulty
composition and make increasing threat readable. Do not prescribe a deep inheritance hierarchy
or TypeScript class structure. Multiple archetypes are already in the future content roadmap;
choose concrete architecture when the second and third real enemy types are implemented.
Current gameplay has Chaser, Shooter and Tank identities with small scene-local archetype data
and one shared enemy runtime collection. Chaser/Tank share direct pursuit; Shooter uses distance-band behavior.

---

## Boss

A boss should not simply be a normal enemy with much more HP.

Bosses should use readable telegraphed attacks.

Initial target:

- approximately 2–3 distinct attack patterns
- clear attack warning
- identifiable safe / dangerous space
- final run victory on boss defeat

---

## Win State

The run is won when the final boss is defeated.

Target boss arrival:

approximately 12–15 minutes into the run.

---

## Fail State

The player loses when ship HP reaches zero.

Eventually the player may receive one optional rewarded-ad revive per run.

Prototype and First Playable do not include advertising.

---

## Rewarded Revive

Planned product behavior:

PLAYER DIES
> offer optional rewarded advertisement
> player accepts or ends run

Maximum:

- 1 revive per run

After revive:

- approximately 50% HP
- approximately 2–3 seconds of invulnerability
- nearby immediate danger should be cleared or reduced

This system belongs to a later platform/monetization phase.

---

## Language

Initial development language:

- English

Future:

- Russian

UI/game text should eventually use localization keys rather than being scattered throughout gameplay logic.

Do not introduce a heavy localization framework during the prototype stage.

---

## Art Direction

Target direction:

Stylized vector-like 2D arcade sci-fi.

Characteristics:

- dark space backgrounds
- bright readable ships and enemies
- strong silhouettes
- emissive-looking weapons and effects
- simple geometry
- low-to-medium asset detail
- visual clarity with large enemy counts

Prototype art:

- geometric placeholders
- primitive shapes
- simple colors
- simple effects

Gameplay must be validated before significant art production.

---

## Audio Direction

Music and ambient tracks may be generated with AI tools such as Suno.

Enemy/SFX assets may later come from generated content or asset packs.

Audio production is not a blocker for the Mechanical Prototype.

---

## First 30 Seconds

### 0–5 seconds

The run starts immediately.

The player sees:

- their ship
- open space
- first enemies approaching

The player should understand that movement is the primary input without reading a long tutorial.

### 5–15 seconds

Enemies move toward the player.

The ship automatically attacks.

The player sees:

- weapon fire
- enemy damage
- enemy death

### 15–30 seconds

Enemy pressure begins to increase.

The player understands the basic relationship:

movement
> survival
> automatic combat

XP and upgrade progression will be introduced once the Playable Core reaches that phase.

---

## First Playable

The first playable milestone contains only:

- game boot
- player ship
- arcade movement
- basic arena
- basic enemy
- enemy spawning
- enemy chasing
- automatic targeting
- basic Laser
- damage
- enemy death
- player health
- contact damage
- player death
- restart

The First Playable does not need final assets.

---

## Vertical Slice Target

The Vertical Slice should eventually contain:

### Player

- 1 ship
- 1 active ability

### Weapons

- Laser
- Missile
- Drone

### Modules

- 3 Passive Modules

### Enemies

- 3 regular archetypes
- 1 Elite
- 1 Boss

### Progression

- XP
- magnet pickup
- level-up
- 3 upgrade choices
- 4 weapon slots
- 4 module slots
- 2 weapon evolutions

### World

- 1 sector
- 1 lightweight interactive world object

### Presentation

- production-like HUD
- basic VFX
- basic SFX
- readable visual style
- win/fail flow

---

## Not MVP

Do not build yet:

- multiplayer
- manual aiming
- crafting
- inventory management
- procedural open world
- complex exploration
- large narrative systems
- large technology tree
- permanent percentage-stat progression tree
- item rarities
- complicated economy
- backend services
- network-ready architecture
- realistic spacecraft physics
- large number of ships
- large number of sectors
- complex POI framework

---

## Primary Design Risk

The main risk is not technical complexity.

The main risk is whether movement, automatic combat, enemy pressure and upgrade progression feel satisfying enough to support repeated runs.

Therefore visual production, meta progression and platform integration must not precede validation of the core combat loop.

---

## Design Principle

### Balance as explicit data

Where practical, future balance values should live in explicit game data/configuration.
Enemy HP/speed, weapon damage/cooldown and ship movement speed should be tunable without
rewriting the associated behavior. Do not centralize every number prematurely, create a universal
stat engine or make every entity share a generic property bag. Extract common data structures
only when multiple real consumers justify them. These are approved future directions, not
instructions to build shared combat, ship, enemy or spawn systems during the current prototype.

### Player/run data boundaries

Prefer explicit player/run characteristics plus explicit global combat modifiers with real consumers,
weapon-specific configuration/behavior and dedicated mechanics for Shield, Dash and other capabilities.
Small explicit data ownership may emerge when GAME-028 creates actual mutable consumers;
DESIGN-002 does not prescribe final TypeScript representations.

Avoid a giant PlayerStats object containing every imaginable optional future stat, string-keyed
property bags, generic Modifier pipelines, buff/debuff frameworks and universal combat stat engines.
Do not force every weapon to consume every modifier or reduce Shield, Revive or Dash behavior
to scalar stats. This vocabulary records future design directions, not implemented systems.

NEBULA should optimize for:

IDEA
> IMPLEMENT
> PLAY
> MEASURE
> CHANGE

The project exists to build a good game, not a generic game framework.
