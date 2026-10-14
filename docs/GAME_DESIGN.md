# NEBULA — Game Design

## Status

Pre-production baseline.

This document describes the intended game design.
It does not describe implementation details or future speculative systems.

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

---

## Weapons

Vertical Slice target weapons:

1. Laser
2. Missile
3. Drone

Weapon behavior should be meaningfully different.

Balance-only variations should normally use content configuration rather than separate weapon implementations.

---

## Passive Modules

Vertical Slice target:

- 3 Passive Modules

Passive modules should modify or complement builds.

They should not exist only as trivial permanent percentage bonuses when a more interesting gameplay interaction is possible.

---

## Weapon Evolutions

Weapon Evolutions are a required feature of the eventual core game.

General rule:

high-level weapon
+
specific passive module
> evolved weapon

Example concept:

Laser V
+
Quantum Lens
> Solar Lance

The exact evolution content is not yet final.

Do not implement Evolutions until the base weapon and module systems are working.

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

NEBULA should optimize for:

IDEA
> IMPLEMENT
> PLAY
> MEASURE
> CHANGE

The project exists to build a good game, not a generic game framework.
