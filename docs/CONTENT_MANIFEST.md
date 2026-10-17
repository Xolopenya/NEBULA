# NEBULA — Content Manifest

## Authority

APPROVED target scope of the current Mechanical Vertical Slice wave; this is not an
implementation checklist or completion percentage. [GAME_DESIGN](GAME_DESIGN.md) defines
behavior, [ARCHITECTURE](ARCHITECTURE.md) contracts, [BALANCE](BALANCE.md) hypotheses,
[TASK_GRAPH](TASK_GRAPH.md) sequencing and [CURRENT_STATE](CURRENT_STATE.md) working reality.
Names below delimit scope; unnamed upgrades receive mechanic directions, not filler names.

## IN VERTICAL SLICE

### Build and progression

3 Combat System slots, 1 Active slot, 6 identical Core slots.
Start with exactly one selected Laser, Missile or Combat Drone; Active/Core slots empty.
All ten Ship Stats and twelve tags from GAME_DESIGN are included.
Ordinary Level-Up targets ~18–24 per ~15–17 minute successful run.

| Combat System | Specializations | Specialized development per branch |
| --- | --- | --- |
| Laser | Scatter Array; Repeater Array; Precision Lance | 4 characteristic upgrades + 1 Capstone |
| Missile | Guidance; Heavy Warhead; Fragmentation | 4 characteristic upgrades + 1 Capstone |
| Combat Drone | Scatter; Repeater; Precision | 4 characteristic upgrades + 1 Capstone |

Exactly 9 weapon specializations, 36 characteristic specialized upgrades and 9 weapon
Capstones. Directions: spread/close control; cadence/turnover/suppression; precision/
penetration/priority; tracking/reacquisition; heavy damage/radius/Impact; radial fragments;
corresponding Drone fire identities. Exact extra names and numbers are not fixed here.

| Combat System | Initial weapon-local tuning directions |
| --- | --- |
| Laser | Damage; Cadence; Projectile Velocity |
| Missile | Warhead Damage; Propulsion; Explosion Radius |
| Combat Drone | Bolt Damage; Firing Cadence; Bolt Velocity |

Specialization readiness initially takes three meaningful weapon-local investments.
Global Ship Stats, Core Items, tags and other global choices do not count.
Final numeric increments/caps are not fixed.

| Active | Specializations | Slice development |
| --- | --- | --- |
| Dash | Afterburner; Ram; Phase | ~2 tuning investments before specialization; 2 specialized upgrades per branch |
| Shield | Fortress; Pulse; Reflector | Same |
| Decoy | Hardened; Explosive; Disruptor | Same |

Exactly 9 Active specializations and 18 specialized Active upgrades.
No Active Capstones. Reflector intercepts/destroys hostile projectiles; no true reflection.

### Exact twelve Core Items

| # | Item | Approved identity | Approved tags |
| --- | --- | --- | --- |
| 1 | Overclocked Reactor | Strong Reactor Power increase with Hull penalty | Technology / Rapid Fire |
| 2 | Reinforced Bulkheads | Strong Hull increase with Thrust penalty | Survival |
| 3 | Mass Driver Coupler | Projectile Scale and Impact up; Projectile Velocity down | Projectiles / Control |
| 4 | Needlepoint Accelerator | Projectile Velocity up, Projectile Scale down; explicit authored bonus for direct projectile hits against priority/high-threat targets | Precision / Projectiles |
| 5 | Breach Coupler | Better close-range attack effectiveness, worse distant engagement | Close Combat / Control |
| 6 | Volatile Payload Rack | Missile/explosion specialist tradeoff | Explosions / Projectiles |
| 7 | Flux Shield Matrix | Shield Systems strongly up, Hull down | Shields / Technology |
| 8 | Reactive Barrier Emitter | Shield Break creates authored radial control pulse | Shields / Control |
| 9 | Vector Thruster Overdrive | Strong Thrust increase with defensive cost | Mobility |
| 10 | Drone Command Relay | Amplifies Drone-specific Engineering contribution | Drones / Technology |
| 11 | Triage Compiler | Requires Medical Drone; improves Medical Charge/healing efficiency | Support / Survival / Drones |
| 12 | Coordinated Fire Link | Wide-build bonus for multiple Combat Systems sustaining pressure on the same priority target | Support / Precision |

Exact percentages and unspecified tradeoff details remain for scoped authoring/balance.
No hidden downsides or additional Core catalog entries are implied.

### Drone Doctrine

- Replication: copies current type in one slot, conceptually up to ~4 Combat Drones,
  diminishing fleet efficiency, shared progression. Upgrades: Formation,
  Target Distribution, Synchronized Volley.
- Diversification: Combat Drone + Medical Drone, one of each type, separate slots.
- Medical: Base Medical Drone + Repair specialization; bounded Medical Charge healing,
  one stored activation, preserved charge at full Hull.
- Required mixed-fleet synergy: Combat Drone kills grant small authored Medical Charge.

### Exact nine normal enemies

Swarm, Chaser, Charger, Shooter, Sniper, Tank, Suppressor, Bomber, Splitter.

### Exact four Elite modifiers

Frenzied, Shielded, Heavy, Accelerated.
Authored compatibility preserves base roles; occasional two compatible modifiers late.

### Mini-Bosses and Boss

| Tier | Content | Required signature mechanics |
| --- | --- | --- |
| Mini-Boss | Siege Walker | Siege Shot; Suppression Barrage |
| Mini-Boss | Hunter | Target Lock / committed pursuit or charge; Pressure Volley |
| Boss | Juggernaut | Targeted Charge; Radial Salvo; Heavy Shockwave; Reinforcement Drop; 3 HP-threshold phases |

Warden is a current legacy/test fixture until production Juggernaut cutover, not slice
final Boss content.

### Exact fifteen Encounter Templates

| # | Tactical identity |
| --- | --- |
| 1 | Swarm Rush |
| 2 | Pursuit Pack |
| 3 | Ranged Screen |
| 4 | Heavy Screen |
| 5 | Charge Line |
| 6 | Pincer Assault |
| 7 | Crossfire |
| 8 | Bombing Run |
| 9 | Sniper Escort |
| 10 | Suppression Wall |
| 11 | Splitter Surge |
| 12 | Heavy Pincer |
| 13 | Mixed Pressure |
| 14 | Siege Net |
| 15 | Elite Vanguard |

A name identifies tactics, not one immutable enemy count.

### Exact world scope

| Category | Count | Content |
| --- | --- | --- |
| Major Events | 7 | Active System Signal; Armory Signal; Weapon Module; Core Technology; Drone Bay Signal; Mini-Boss Signal; Repair Signal |
| Minor Objects | 3 | Data Cache; Repair Pod; Shield Capacitor |
| Environment Mechanics | 2 | Repair Beacon; Projectile Distortion Field |

### System and UX completeness

Physical XP with value-preserving consolidation; Reward Generator; Combat Analyzer;
Encounter Director; Portals; World Scheduler; HUD; paused Build Screen; Post-Run;
RunReport; desktop controls; mobile controls; functional minimum audio/readability settings.
Final art is not required. All slice content is available for development/testing.

## CONTENT WAVE 2 — DEFERRED

| Area | Scope outside the slice |
| --- | --- |
| Normal enemies | Summoner; Support; Guardian; Artillery |
| Elite modifiers | Commander; Volatile |
| Drones | Medical Barrier; Medical Emergency; Salvage Drone and its branches; advanced fleet synergies; all-three mixed-fleet Capstone |
| Active | Active Capstones |
| World | Active Module Event; Elite Signal; Recalibration Station; Gravity Anomaly; additional environments |
| Core | Expand from 12 toward roughly 20–25 strong authored items |
| Mini-Bosses | Brood Carrier; Orbital Controller |
| Bosses | Additional Hunter/Broodmaster/Controller-style authored bosses |

## CANDIDATE

Final Service Signal. Discussion does not make it an implementation requirement.

## META / LATER — DEFERRED

Profile, persistent Meta Progression and save follow a complete, balanced, playtested
mechanical slice with proven repeatable gameplay. No profile/save architecture is specified.

## OBSOLETE / SUPERSEDED target content

4 Weapon / 4 Passive Module slots, generic passive inventory and recipe Evolution target
progression are replaced by the 3/1/6 build and specialization model.
Prism, Cluster and Twin remain current prototype references only. Prototype base homing
migrates to Guidance; innate starting Dash gives way to an initially empty Active slot.
