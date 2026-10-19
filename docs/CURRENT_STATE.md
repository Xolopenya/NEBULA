# NEBULA — Current State

## Last Updated

2026-10-20.

This document describes only what is currently implemented and working.

Do not place future plans or speculative features here.

---

## Project Status

Current phase:

FIRST PLAYABLE CORE LOOP COMPLETE / UI-001 RUSSIAN LOCALIZATION COMPLETE

The project has a working browser application, development toolchain and placeholder gameplay scene.

The player ship supports responsive desktop keyboard movement.

---

## Working Toolchain

Installed and verified:

- Node.js 24
- npm
- TypeScript
- Vite
- Phaser 4.2.1
- Vitest
- Git

Repository:

- Git repository initialized
- main branch
- GitHub remote configured
- project pushed successfully

---

## Quality Commands

Available commands:

### Development

npm run dev

Starts the Vite development server on IPv4 localhost (127.0.0.1).

### Type Check

npm run typecheck

Runs TypeScript without emitting files.

### Tests

Current validation:1663 tracked tests in35 files pass; all1643 pre-CR-002 cases retained with20 focused phase regressions. The1622 pre-HOMEWORK-001 and1490 pre-UI-001 cases remain retained. Historical GAME-056 baseline:1354 cases retained through approved catalog/policy and authoritative Build fixture migrations.

npm test

Runs Vitest.

Focused Vitest tests cover pure collision, XP/level arithmetic, choice selection, Dash timing and Shooter distance-band movement. Desktop movement remains local to GameplayScene.

### Production Build

npm run build

Runs TypeScript compilation and creates the Vite production build.

### Full Check

npm run check

Runs:

1. typecheck
2. tests
3. production build

Current status:

PASS

---

## Russian player-facing UI

UI-001 localizes every current player-facing Text, all36 canonical reward displays and HTML
lang/title. src/game/ui/russianText.ts owns the frozen36-ID Russian names, exact existing18
effect descriptions and focused HUD/rank/level/cooldown formatters; HOMEWORK-001 adds one
approved numerical effect line to each of the new18 Laser choices. GameplayScene retains all controls, transactions and gameplay ownership.
Arial/Segoe UI/system fallback needs no font fetch. Hull fractions and integer XP/levels are
preserved; decimal comma and units are display-only. Three-line guide uses the actual
WASD/arrows/Space/Esc bindings and hides during every overlay; fresh native create restores it.

Installed Chrome155 verifies all36 actual generated offers with real pointer acceptance at
1920x1080,1280x720,960x540:108 catalog measurements,141 total layout observations, choice
height<=94 internal pixels and minimum12 CSS-pixel text. Cyrillic screenshots, complete bounds,
hit areas, large numeric HUD, terminal screens, same-Text rejected-click/retry, duplicate/stale
callbacks, physical32 ->3 selections/9 Reward draws, genuine other-tab BLUR/focus-return freeze,
manual pause, eight actual Victory->New Run cycles, ordinary incoming Death->Retry and dirty
PAUSED native restart pass. Controlled fixtures are separate from unmodified production smoke.
Unmodified built root passes real movement/Dash/pause, natural combat/physical XP/Level-Up/mouse
selection and ordinary incoming death/retry; Russian metadata, no DEV API, no pageerrors or
external font requests. Existing favicon404/bundle-size/worker advice remain nonblocking.
Exactly5 gameplay timers/4 streams/5 DEV commands, canonical IDs/order/policy/seeded goldens,
combat/XP/Build/ownership and rejected-Hit flight cleanup are unchanged. No dependency added.
1622 tests/35 files pass (1490 baseline +94 pure localization +38 Scene cases).
UI-001 DONE; GAME-056 DONE; GAME-057+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A/B PASSED;
GATE C unapproved. HOMEWORK-001 is prepared locally; no Pages publication or future gameplay implementation.

## Homework preparation — local acceptance complete, public acceptance pending

HOMEWORK-001 remains READY. Source, Pages workflow and Russian reviewer documents are
prepared for architect review; no commit/push/merge/remote setting/deployment occurred.
russianText.ts adds exactly18 frozen authored effect lines under unchanged36 names; original18
effects and all combat/Build/reward/XP/lifecycle rules remain exact. No Scene layout change was
needed: all36 actual generated offers/real clicks pass at1920x1080,1280x720,960x540,
108 catalog measurements/141 total observations; choice height<=94 internal pixels, longest
new description control890px wide, minimum12 CSS-pixel text. Same Text/handler/token retry,
physical32/three selections/nine draws, genuine BLUR/manual pause, eight controlled actual
Victory->New Run cycles, Death->Retry and PAUSED native restart preserve exact owners.

Vite base uses PAGES_BASE_PATH or local '/'; '/NEBULA/' check produces project-relative asset
URLs. index.html retains Russian metadata/UTF-8 with data:, favicon. Prepared Pages workflow:
main only, Node24/npm ci/npm run check (one build), strict dist inventory, official SHA-pinned
configure/upload/deploy actions, serialized deployment and minimum per-job permissions.
SHA pins verified against official releases; GitHub CI/deployment has NOT run.

npm ci PASS; root and '/NEBULA/' npm run check both PASS1643 tests/35 files (all1622 baseline,
18 new pure description/profile transitions and3 Scene cases). Dist is exactly index.html,
assets/index-DLorAe0O.js and assets/index-Cqs01O3I.css. Strict ignored static server serves
only /NEBULA/: direct/reload/HTML/JS/CSS200 correct MIME, missing/root asset paths truly404.
Unmodified installed Chrome production at all3 viewports has Russian glyphs/metadata, no
DEV API, missing assets, pageerrors, console errors or external font requests. Real keyboard
movement/Dash/Esc and natural incoming Death/Retry smoke took71483ms wall time (Death observed
after56000ms of loop waits); separate natural physical XP/Level-Up/mouse choice took21976ms.
First observation reached natural Victory; this was not counted as Death acceptance.
Controlled fixtures are separate evidence; none of this is public Pages/session verification.

README/8-line CHANGELOG/short Russian report describe actual mechanics/limitations/AI help
and explicitly pending publication/public60–120s session. Expected future URL:
https://xolopenya.github.io/NEBULA/. Owner must separately authorize Git operations and select
Pages Source=GitHub Actions/main environment before deployment. Public URL/revision/assets/
clean-browser controls/real60–120s session and final factual status updates remain second phase.
GAME-056/UI-001 DONE; GAME-057+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A/B PASSED;
GATE C unapproved. No gameplay balance, dependency, tracked-test removal or publication.

## Current Runtime

The project boots Phaser in the browser and transitions from BootScene into GameplayScene.

Current screen:

- 4800x2700 dark-space placeholder arena with deterministic static stars and an outer boundary
- cyan player ship placeholder starting at the arena center, drawn with Phaser geometry
- red diamond Chasers, amber regular Tanks and gold Elite Tanks pursuing the player; purple square Shooters approaching, holding or retreating to a preferred distance band; a larger magenta/red Warden at successful timed spawn30
- temporary thicker yellow outline on the current nearest-enemy target
- automatically launched cyan Laser projectiles, yellow homing Missiles with area damage, and teal orbiting Drones firing violet straight bolts (one initially; two after Twin evolution)
- screen-fixed top-left HUD showing current/max HP, XP toward the next threshold, level and Dash readiness/cooldown
- screen-fixed Russian phase indicator below the top-right heading; Phase 2 notification after60 active seconds
- desktop movement using WASD or arrow keys
- "NEBULA — Космическое выживание" heading at the top right
- screen-fixed three-line Russian movement/Dash/pause, automatic-fire/XP and Warden guidance; hidden during pause, reward and terminal overlays

Rendering:

- Phaser 4.2.1
- WebGL
- 1920x1080 internal viewport (separate from the larger arena)
- landscape
- FIT scaling
- centered canvas

---

## Current Repository Structure

Relevant current files:

src/
  main.ts
  style.css
  game/
    config.ts
    scenes/
      BootScene.ts
      GameplayScene.ts
    enemies/
      shooterMovement.ts
      shooterMovement.test.ts
    player/
      dash.ts
      dash.test.ts

docs/
  GAME_DESIGN.md
  ARCHITECTURE.md
  CURRENT_STATE.md

Other root files include:

- package.json
- package-lock.json
- tsconfig.json
- index.html
- README.md
- .gitignore
- .gitattributes

---

## Implemented Gameplay

### Two-phase difficulty (CR-002)

Each create starts in Phase1 with zero elapsed gameplay time. The existing RUNNING update
accumulates delta; the first update reaching60000ms enters Phase2 once. Manual, reward and
focus-loss pauses, PREPARING, terminal and disposed states add no phase time. RETRY and
NEW RUN use the existing native restart and restore Phase1/zero time.

Phase1 keeps the2000ms enemy spawn interval and authored movement speeds. Phase2 resets
the same spawn TimerEvent to1200ms, preserving the fractional progress of its current wait
without dispatching a spawn. All current and new enemies use1.25 times their current AI
speed, including both Warden HP phases and Charger approach/charge; frozen definitions and
spawn snapshots remain unchanged. Charger durations, external knockback and collision rules
remain unchanged. Exactly five gameplay TimerEvents and four RNG streams remain; the boss
threshold stays at successful timed spawn30.

The persistent «ФАЗА 1»/«ФАЗА 2» indicator sits below the top-right heading. A separate
«ФАЗА 2» notice appears above the central overlays for the first three active seconds of
Phase2 and hides during pauses/terminal states. It uses the same update, with no UI timer.

20 focused tracked Scene tests cover boundaries59.9/60s, once-only transition, actual installed
Phaser Clock cadence/identity, all pause reasons/composition/nonrunning states, both restart
controls, existing/new enemy speeds and immutable snapshots, Warden/Charger, Shooter band,
pursuit cap, contact separation and projectile collision. npm run check passes1663 tests/35 files.

Installed Chrome155 verifies a natural60s active-time transition (existing DEV God Mode for
survival), actual manual/tab-BLUR pause, reward freeze, ordinary incoming Death/RETRY and
controlled lethal Boss Victory/NEW RUN. Same five events/four streams and Phase2 movement225
versus base180 pass. Russian indicator/overlay bounds pass at1920x1080,1280x720,960x540;
unmodified production input/Dash/pause/resume and Phase1 render pass without DEV API or errors.

A player ship placeholder is rendered in GameplayScene and controlled with WASD or arrow keys.
Movement is immediate at a baseline 300 pixels per second, uses frame delta, and normalizes diagonal direction.
Releasing movement keys stops normal movement without inertia.
Fresh Space with non-zero current movement input activates Dash at 900 px/s for 200 ms, locking the normalized direction. Cooldown lasts 3000 ms from activation; idle, held/repeated, active-Dash, cooldown, paused and dead presses do not activate or queue. Dash replaces normal movement and a frame spanning expiry splits into remaining Dash time then normal movement time, clamping each segment to the arena. Duration/cooldown freeze during level-up pause, death and Victory; choice resume continues a pending burst. Dash adds no immunity and retains existing damage/protection rules. Restart clears remaining Dash/cooldown and direction; native keyboard reset plus fresh-key/repeat checks prevent stale input.
The ship starts at world position (2400, 1350).
Movement is clamped inside the 4800x2700 arena using half the ship dimensions plus its outline.
The main camera follows the ship immediately and is bounded to the arena.
Browser resizing preserves the internal viewport and responsive 16:9 FIT presentation.
One Chaser starts at (3000, 1350). Successful timed spawns every 2 seconds in Phase1 (1.2 seconds in Phase2) repeat Chaser, Chaser, Chaser, Shooter, Chaser, Tank (CCCSCT) up to a shared cap of 10 active enemies. Initial creation does not advance the sequence; cap/pause/death rejection leaves it unchanged, kills free slots without rewinding it, and restart resets it. Every second scheduled Tank is Elite: successful timed spawns6/12/18/24 produce regular/Elite/regular/Elite Tank; the initial Chaser is excluded and cap-blocked callbacks retain the pending number.
Spawn positions are chosen just outside a random camera edge, clamped with a 25-pixel arena margin (40 for Warden), and kept at least 600 pixels from the player. Too-close candidates use the opposite arena corner.
Phase1 Chasers and Tanks share direct pursuit of the player's current world position at 180 and 100 pixels per second respectively (Elite Tank120). Shooters move at 140 pixels per second toward the player above 500 pixels, retreat below 350 and hold within the inclusive 350–500 world-center band. Phase2 multiplies these movement speeds by1.25. Movement stops at the nearest band edge even for large deltas; coincident centers retreat deterministically right. Arena clamping may prevent further retreat at an edge.
Chaser/Tank pursuit uses frame delta and caps each step at the remaining distance to avoid overshoot at the player.
Chaser/Shooter/Tank respect the 25-pixel arena margin; Warden uses a 40-pixel body margin.
Enemies use one Scene-local EnemyRuntime collection with readonly spawnSnapshot and exact creating RunLifecycle, mutable current health, polygon visual/position, lastDamagingSource and external knockbackVelocity; only Charger owns transient phase state and one Graphics telegraph. EnemyDefinitions.ts owns six deeply frozen authored definitions (swarm/chaser/charger/shooter/tank/boss), a fixed ELITE_TANK_PROFILE and required explicit LEGACY_NEUTRAL scaling context. Neutral construction performs no scaling arithmetic and reads no run, Build, Tags, Analyzer, time or RNG. The pure factory validates exact record shapes, role/movement/variant pairing and positive finite safe values (XP a positive safe integer), copies primitive fields, a new nested movement and two-field interaction, validates final values and freezes all three records. Interaction response allows finite0..MAX_SAFE_INTEGER; susceptibility is boolean. Each successful createEnemy constructs exactly one detached snapshot; rejected stale/non-running or blocked pipeline attempts construct none.

Spawn values are Chaser3/180/24/1/1, Shooter2/140/24/1/1 with inclusive350..500 band, Tank6/100/24/1/1, Elite Tank18/120/24/2/5, Warden60/70+100/40/2/10 (maxHP/speed/radius/contact/XP). Current health initializes once from maxHealth, then only the existing typed Hit damage path or DEV Warden HP setter changes it. Identity/contact/XP/radius getters derive from the frozen snapshot; movement reads that enemy's own movement record. Scene-local enemyPresentation/eliteTankData/wardenPhaseTwo retain only original polygon points/fills/outlines. Swarm and Charger plus authored interaction coefficients are implemented as described below; no Armor or difficulty engine exists.

Initial Chaser construction uses the captured PREPARING run at3000/1350 before five timers/start/entropy and is observed once after RUN_STARTED. Timed and DEV creation pass captured run tokens; stale owners are rejected before factory or Encounter draws. applyEnemyHit additionally requires target.run===hit.run; killEnemy requires current RUNNING owner and membership before flags/XP/removal/diagnostics. Old immutable spawn values stay readable after native restart but grant no mutation authority. Native restart restores one fresh Chaser/currentHP3/snapshot, count0/flagsfalse, new run/Build/Defense/RNG/Input/Diagnostics/API, zero Tags and five fresh events. Existing schedule/placement/draw budgets, movement/targeting/contact/hostile fire, six Attack/Hit paths, one XP pickup and atomic terminal cleanup are unchanged; GAME-051 adds the accepted lethal Hit/death record/source boundary described below.

Validation:739 tests/25 files (136 new pure enemy-definition and33 new Scene cases; all570 baseline cases retained). Actual Chrome/Phaser verifies controlled Clock CCCSCT/Elite12+24/Warden30 with cap-delayed12/30 and60 Encounter draws, pursuit/Shooter/Warden HP phases/styles/hostile fire, six offensive paths, immutable values, genuine BLUR/manual/reward freezes, two Victory NEW RUN cycles, Death RETRY and paused nonterminal native restart. Controlled long-schedule collection clearing is internal fixture setup. Unmodified production input/combat/ordinary Death/real pointer RETRY passes without DEV API or pageerrors.

Elite Tank is a concrete Tank variant with health18/speed120/contact2/XP5 and the existing collision radius24, versus regular Tank6/100/1/1. Small eliteTankData reuses Tank hexagon geometry with gold fill and a bright3-pixel outline; target changes restore Elite presentation. shouldSpawnEliteTank promotes only scheduled Tanks at successful timed counts divisible by12, inside the same phase-dependent spawn callback/cap10. It has no ranged attack, special ability, armor, new timer or portal. Actual contacting enemy damage uses the shared500ms protection path with collection-order first-hit semantics. All six player attack paths can kill Elite through existing collision/killEnemy, producing one value5 pickup; normal magnet/XP threshold/carry-over/level-up pause remain authoritative. Real Phaser validation covers24 successful spawns, cap-delayed Elite12, movement/contact/highlight/Shooter exclusion, mixed AoE rewards, every attack and two native retries restoring no Elite, initial Chaser/counter0 and five fresh timers. No generalized enemy/affix/difficulty system is implemented.

Warden is one explicit Boss archetype with60 HP, collision radius40, contact damage2 and XP10. It replaces successful timed spawn30 after regular Tank6/Elite12/regular18/Elite24. bossSpawned becomes true only after creation; cap10/pause/death/missing-player rejection preserves pending30. While Warden is active, only new timed enemy spawns/counter advancement stop; existing enemies, weapons and hostile attacks continue. Current positive HP selects movement/visual/attack phase: above30 HP speed70/magenta/cardinal4; at30 or below speed100/red-orange/eight45-degree shots. The same hostile event owns attacks with no phase reset or transition volley. Target highlighting restores the current phase outline. Common killEnemy sets bossDefeated, retains bossSpawned and drops one XP10 pickup. After the lethal attack completes its normal cleanup, Victory freezes the run at successful spawn30. The pickup stays normal/visible/frozen without collection or direct XP credit; no spawn31 occurs. Native restart clears both flags, restores initial Chaser/counter0 and the Boss30 schedule, destroys old objects and restores five fresh timers. Real Phaser validation covers both phases, retained timer boundaries, Shooter coexistence, body/contact sweeps, center-only AoE, all six attack kill paths, two native Victory NEW RUN cycles and ordinary death RETRY.

The nearest active enemy is automatically selected each frame after movement using squared world-space distance.
Equal-distance ties select the first enemy in array order; an empty enemy array clears the target.
The selected enemy has a temporary 4-pixel yellow outline; the former target returns to its normal outline when selection changes: regular2-pixel pale stroke, Elite3-pixel bright stroke or Warden3-pixel current-phase stroke.
A Phaser timer automatically fires the Laser initially every 600 ms when a current target exists.
Each shot starts at the player's world position and stores a normalized firing-time direction toward the current target. At baseline it travels straight at 1200 pixels per second using frame delta and does not home or depend on the target after launch.
Scene-owned straight projectile records contain their visual, source, damage, radius, fixed velocity components and remaining lifetime. Multiple shots can coexist.
Base/Prism projectiles expire after 2000 ms or are removed early once their whole launch-radius circle leaves the arena; specialized profiles are described below. Cleanup destroys the visual and removes the runtime entry.
No manual fire input is required. Exact or near-zero-distance shots are suppressed safely.
Without a current target no shot is created; the timer stays ready for a future target.
Each Laser projectile initially deals 1 damage to the first enemy intersected along its movement segment and is immediately destroyed and removed. Hit detection sweeps against the enemy runtime collision radius (regular/Elite24, Warden40) expanded by the 6-pixel projectile radius, avoiding projectile tunneling across larger frame steps. Base/Prism shots do not pierce; only acquired Precision Lance uses bounded penetration.
Enemies with remaining HP stay active. At zero HP their visual is destroyed and their runtime entry is removed, so they no longer chase, count toward the cap or participate in targeting. Death clears currentTarget immediately when applicable; normal targeting selects and highlights the next nearest enemy on the following active update.
PlayerDefense starts with Hull5, Shield0 and protection0 on scene creation; PlayerBuild supplies max Hull5. Regular enemy contact deals1 damage; Elite Tank and Warden contact deal2. World-center distance uses player radius20 plus each enemy's stored collision radius: regular/Elite24 (combined44), Warden40 (combined60).
Contact runs after projectile impacts/removals, separates the first inclusive overlap using the minimum circle translation and current player bounds, then routes its damage. God Mode/protection still allow separation. Accepted Shield or Hull loss starts500ms delta-based protection and alpha0.5; active expiry restores1. Multiple overlaps cause at most one contact attempt per update. Continued overlap can damage again when protection expires.
Health clamps at zero and immediately enters a RunLifecycle DEATH outcome (read through the derived isPlayerDead getter) through the damage helper, for lethal contact or hostile hits. The transition runs once, dims the ship to alpha 0.25 and displays centered screen-fixed «КОРАБЛЬ УНИЧТОЖЕН» text.
Creation resets the player to alive. Death freezes movement, enemy chase, targeting, projectile movement/collision and contact processing. Existing enemies and projectiles remain visible and frozen; timer events stay scheduled but guarded callbacks produce no spawns or shots. The lethal hostile projectile is removed before further projectile processing stops.
Only after death, a screen-fixed clickable «ПОВТОРИТЬ» control appears. Clicking it once uses Phaser scene.restart() without reloading the page. Phaser shutdown destroys old scene objects/UI and timer events; create() restores an alive player at 5 HP and normal alpha at (2400, 1350), one initial enemy, no projectiles, a fresh target selection and exactly five spawn/Laser/Missile/Drone/hostile timers. Repeated death/retry cycles resume the same gameplay.
One global 1500 ms hostile timer independently attempts an aimed shot from the nearest active Shooter and a radial burst from an active Warden. Shooter selection filters out other archetypes and keeps collection-order ties; absent/near-zero Shooter aim cannot cancel the Warden burst. Warden fires four world-cardinal directions above30 HP, eight directions every45 degrees at positive HP<=30. All hostile shots use fixed launch direction, speed600 px/s, lifetime3000 ms, radius6 and damage1. The Shooter movement band does not limit firing range. Chasers/Tanks never fire. No per-enemy timer exists; spawning Warden or crossing30 HP neither fires immediately nor resets the existing event.
Player and enemy shots share concrete runtime records with typed immutable Attack, derived source/damage and movement/lifetime/world-exit cleanup. Hostile shots use swept segment-circle collision against the player and disappear even when protection prevents damage before death. Both contact and hostile hits use the same global 500 ms player damage protection; its timer ticks before projectile/contact processing.
Missile is active from run start with one global 1800 ms firing timer and Missile-specific maxActiveMissiles = 1. At the cap, callbacks create no shot and leave the timer/cadence unchanged; cleanup frees the slot for a later callback. Launch selects the nearest enemy to the player with stable collection-order ties; no enemy means no shot. Separate scene-owned MissileRuntime records contain a yellow 8-pixel circle, target reference, launch-snapshotted explosion damage, flight speed and explosion radius, last normalized heading and remaining lifetime. Each active frame directly steers toward the living target at its stored launch speed (baseline 450 px/s). The Missile keeps that living target even when another enemy becomes closer, including after reacquisition. A removed/missing target reacquires nearest to the Missile position; no replacement preserves heading, and later enemies can be acquired. Near-zero aim retains heading safely; starting overlap resolves at segment time zero. Motion is clipped to the remaining 4000 ms lifetime. Swept segment-circle collision against every active enemy (runtime collision radius + Missile radius8) detonates once at the earliest hit point, including non-target interception. Baseline explosion damage 2 applies once to a snapshot of enemies whose centers are within inclusive radius 120; no enemy collision-radius expansion or separate direct-hit damage. Lethal hits use killEnemy and one XP pickup with the killed enemy's value per enemy without skipped array entries. Lifetime expiry/whole-circle world exit only removes the Missile. Fixed Missile cadence/cap/lifetime/collision configuration remains immutable. Scene-owned missileValues supplies current damage, speed and explosion radius. Combat Processor multiplies Missile-specific damage before launch. MissileRuntime derives readonly damage/speed/explosionRadius getters from its frozen MissileAttack: movement and explosion consume these snapshots, so later choices cannot change active Missiles. Pause/death guards freeze firing, homing, position and lifetime; create/restart empties the array and native shutdown destroys old objects/timers. No explosion marker or VFX system is added.

Missile upgrades use explicit run-local ranks 0..2: Warhead Power raises Missile-specific damage 2 → 3 → 4; Propulsion raises speed 450 → 525 → 600 px/s; Blast Expansion raises explosion radius 120 → 150 → 180 px. Each accepted upgrade increments only its track, and capped tracks leave the pool. Mastery is the explicit 2/2/2 state used by the Cluster recipe. create/restart resets ranks and current values to baseline.

Spatial Amplifier has an explicit repeatable run-local level, starting/resetting at 0. Each selection adds 15 world pixels to effective Missile explosion radius without changing Missile-specific Blast Expansion ranks/values, damage or speed. At launch the pure effectiveMissileExplosionRadius helper combines current Missile radius + Spatial level × 15; MissileRuntime stores the final radius and explosions consume that immutable snapshot. Required combinations are 120/135/150 at baseline with Spatial 0/1/2, 165 for Blast1 + Spatial1, and 210 for Blast2 + Spatial2. Old in-flight Missiles keep their radius after Spatial selection. It is the fifth passive in the existing passive/open slots, with distinct stable choices and next-level/effect labels; acceptance retains focus and cursors. No Laser/Prism/Drone Area effect is implemented; Cluster derives satellite coverage from the same stored Missile radius. Real-browser harness validation covers actual old/new explosion coverage, unchanged progression/focus and two native retries with Spatial0 and five fresh timers.

The per-create LevelUpGenerator supplies three distinct weighted choices in canonical order.
Slot1 prefers one eligible specialization while BASE ready, otherwise ordinary weapon development (Scene weaponFocus is affinity only); Slot2 prefers remaining
passives, Slot3 the reserved cyclic evolution or a non-primary pivot, each with ordinary fallback.
Every offer consumes exactly THREE Reward draws, including singleton evolution. Scene no longer
owns focusCursors or evolutionOfferCursor. Accepted weapons/evolutions retain their original
weaponFocus updates; passives leave focus unchanged. Old pure focus/sampling helpers and tests remain.

Cluster Missile is the second concrete evolution: Missile ranks 2/2/2 + Spatial level >=1, not already evolved. Spatial is not consumed and acceptance preserves ranks/values, sets Missile focus and resumes. Both final-prerequisite categories affect only the next presentation. The generator-owned Prism-first evolution cursor advances once per acknowledged presentation: no eligible evolution leaves it unchanged; a sole eligible evolution is guaranteed; any offer sets the cursor to its immediate successor in Prism/Cluster/Twin order, scanning past ineligible identities on the next presentation. Each eligible pair alternates and all three cycle in that stable order. Stable pause UI, acceptance and stale callbacks do not advance it. All three evolutions can coexist; evolved entries leave eligibility.

MissileRuntime derives readonly clusterEnabled from its immutable launch Attack variant. Pre-evolution flights remain normal. On impact the existing primary explosion resolves first; an evolved launch then resolves the union of six satellite circles at 0/60/120/180/240/300 degrees, with offsets equal to stored primary radius R. Satellite radius is R/2 and damage is stored primary damage/2, without rounding or live Combat/Spatial lookups. After primary deaths, affected surviving references are snapshotted so overlapping circles apply one satellite hit per enemy and lethal removals cannot skip entries. Primary plus one satellite hit is allowed; every death still produces one XP pickup with the killed enemy's value. Centers are not clamped to the arena. Expiry/world exit produces no blasts. No child projectiles, VFX, extra timer, or generic evolution engine is added. create/restart resets all three evolution flags and the Prism-first cursor; real-browser validation includes two native retries with five fresh gameplay timers.

Exactly one teal radius-10 world-space Drone starts to the right of the player at orbit angle 0. Scene-owned angle advances clockwise at 2 rad/s using active frame delta, wrapping at 2π. Position is derived after player movement/Dash from current player position plus a 110-pixel cosine/sine offset; only the Drone center is clamped to arena bounds. It has no health, collision or contact damage. One global droneTimer (baseline 1200 ms) selects the nearest active enemy from the actual Drone position with stable collection-order ties; empty or near-zero aim creates no bolt. Violet straight bolts with launch-owned radius (baseline 5) snapshot current Drone-specific damage (baseline 1) multiplied by Combat Processor, current bolt speed (baseline 800 px/s) and lifetime 1800 ms, independently of every Laser upgrade, and do not home. Laser/Drone share a small straight-player-shot creation helper; player and hostile straight shots share required per-projectile radius, swept first-hit damage, non-piercing removal and lifetime/world-exit cleanup. Base/Prism/hostile shots retain local radius6; Lance development can raise its local body to8. All enemy deaths still use killEnemy/one XP pickup with the killed enemy's value. Pause/death freeze orbit and bolts and guard firing; native restart destroys old Drone/bolts/timers and create restores exactly one Drone at angle 0 with empty projectiles and five gameplay timers. Drone attack progression is described below; no weapon acquisition is implemented. Twin Drone behavior is described below.

Drone upgrades have explicit scene-owned ranks 0..2: Bolt Power raises damage 1 → 2 → 3, Firing System reduces interval 1200 → 1050 → 900 ms, and Bolt Propulsion raises speed 800 → 1000 → 1200 px/s. droneAttackValues is separate from immutable orbit/lifetime/radius configuration. Each track leaves eligibility at rank 2; mastery is explicit 2/2/2 and participates in the Twin recipe below. Accepted Firing resets the SAME droneTimer in place with elapsed 0 and no new event. New bolts snapshot Drone-specific damage × globalDamageMultiplier and fixed velocity at launch; old bolts retain both across Drone or Combat selections. Drone upgrades can appear in the open slot and set focus Drone; passive acceptance retains it. Labels show next rank/effect. Native restart resets ranks, attack values and Drone cursor, recreating one angle-0 companion and five fresh timers. Real-browser validation verifies exact Clock boundaries, stale/double/capped callbacks, snapshots and two native retries.

Replication Matrix is the sixth explicit repeatable run-local passive, starting/resetting at level 0 with no cap. It adds 1 world pixel per level to baseline Drone bolt radius 5: levels 0/1/2/5 produce 5/6/7/10. fireDroneFrom passes effectiveDroneBoltRadius into the existing straight-shot launch path; each ProjectileRuntime reads its own frozen Attack radius for swept collision and cleanup. Old radius-5/6 bolts stay unchanged after later selections. Only Drone bolts consume the bonus; damage, speed, interval, Drone ranks/mastery, companion visual/orbit, other weapon/contact geometries and Combat damage rules are unchanged. It participates in passive/open/fallback selection with three distinct stable choices. Acceptance preserves all weapon focus/cursors, evolution cursor and timer phase. Real-runtime validation demonstrates stored-radius collision differences and two native retries with Replication0, a fresh radius-5 bolt and five fresh timers. Replication itself adds no companion or projectile count; no universal size/Amount system is implemented.

Twin Drone Formation requires explicit Drone ranks2/2/2 + Replication level>=1 and unevolved state. The passive is not consumed. Both final-prerequisite categories apply only to the next presentation; accepted Twin sets twinDroneEvolved once, preserves ranks/values, sets Drone focus and immediately adds one opposite teal radius10 companion at current droneAngle+PI. It retains the primary position/shared angle and the SAME Drone TimerEvent delay/elapsed phase, without a volley or existing-bolt duplication. One shared angle positions primary/Twin at radius110 and 2rad/s; each center is independently clamped. The synchronized callback queries nearest enemies independently from each actual origin, with stable ties and independent near-zero/no-target suppression, and launches full-damage normal bolts from each valid origin. Both origins use current Drone damage x Combat, speed, radius5+Replication and lifetime1800 at launch; old bolts retain snapshots. Pause/death freeze both companions/angle/bolts. Native restart destroys Twin/old shots/timers, clears its reference/flag and recreates exactly one angle0 primary and five fresh gameplay timers. Real-runtime validation covers all offer combinations/cursors, immediate acceptance/phase, orbit/targeting/suppression, real Clock boundaries, both-origin snapshots and two actual native retries. No generic companion or Amount architecture is added.

Every killed enemy creates exactly one lime-green world-space XP pickup at its death position: regular value1, Elite Tank value5, Warden value10. killEnemy uses the immutable death record xpValue copied from that enemy's spawn snapshot; duplicate removal attempts create no second pickup. Scene-owned pickup records preserve their creating run, visual, value and magnet speed; create resets the array and restart destroys old visuals. Pickups stay stationary outside the current player-center magnet radius (baseline 180 pixels). Within range they accelerate toward the current player position at 900 px/s² up to 600 px/s, using frame delta; leaving range resets speed. Reaching a 20-pixel player-center collection radius credits pickup.value to player XP before destroying/removing the pickup. Motion is capped by collection to avoid overshoot. Magnet processing stops during level-up pause, death and Victory. One run-scoped PlayerProgression starts at level1/XP0/pending0; Scene has no writable XP mirror. The pure experience module requires 5 × current level XP, subtracts each reached threshold, carries excess forward and allows multiple levels per award. Restart resets this state and clears the separate isLevelUpPaused flag. Collection that increases level credits/removes the triggering pickup, then enters level-up pause immediately; subsequent pickups remain untouched. Screen-fixed LEVEL UP — CHOOSE ONE text and exactly three distinct selectable options appear, built once per earned opportunity from eligible Laser, Missile and Drone upgrades plus Hull Plating, Thruster Module, Collector Field, Combat Processor, Spatial Amplifier and Replication Matrix, using the focused/passive/open slot policy above. The pure selectChoices helper accepts a supplied pool, count and random source, leaves the pool unchanged and permits repeats across later presentations. Choices stay stable during a pause. Each Laser upgrade has an explicit run-local rank starting at 0, increments only on its accepted selection and becomes ineligible at rank 2; all six passives remain repeatable. An eligible evolution occupies Slot 3 as described below. isSimulationPaused derives only from non-RUNNING lifecycle state (PREPARING, PAUSED, TERMINAL or DISPOSED) to freeze movement, chase/targeting, projectiles, damage/protection, XP movement/collection and all spawn/fire callbacks. Level-up pause itself is not death and offers no retry. Clicking one current choice applies it, resolves one pending level and destroys the old title/options. If pending remains, a fresh offer uses the updated Build while the same REWARD stays held; only the last choice releases REWARD. Simulation resumes only if no other reason remains, and duplicate/stale callbacks are rejected. Selected effects apply before resume and accumulate across level-ups. Build-owned Laser configuration starts at BASE/ranks0, deriving damage1/fireInterval600ms/projectileSpeed1200px/s, and resets on each create. Fire Rate resets the existing laserTimer in place to the new interval with elapsed time zero, preserving one Laser event rather than adding another. New straight player shots snapshot weapon-specific damage multiplied by the run-wide damage multiplier, plus current speed; already-fired shots keep their launch values. Missiles likewise snapshot multiplied explosion damage at launch, including Missiles that span a choice pause. Hostile shots are unchanged. Restart clears presentation references and native scene shutdown destroys the texts.

Laser → Prism Laser and the GAME-030 open-slot integration are validated in the real Phaser runtime. Power, Fire Rate and Projectile Speed ranks reset to 0 and cap at 2 independently, preserving +1 damage, -50 ms (minimum 100) and +200 px/s per accepted selection. Full mastery retains damage 3, interval 500 ms and speed 1600 px/s before global damage multiplication. Prism requires all three ranks >=2, Combat Processor level >=1 and unevolved state. Eligibility is checked only on entering a new presentation: sole eligible Prism owns Slot 3 exactly once; if multiple evolutions qualify, the cursor arbitrates; Slots 1 and 2 follow the focused/passive policy above. Completing the final prerequisite affects the next earned presentation; simulation resumes only after pending levels and other pause reasons clear; ignoring sole eligible Prism offers it again next level, while multiple-eligible offers scan cyclically. Selecting it once retains Combat Processor and mastered Laser values, then removes the evolution offer for that run.

Prism changes the existing Laser callback into three straight projectiles aimed center/-12/+12 degrees from current target aim, all from the current player position with full launch-snapshotted Laser damage × globalDamageMultiplier. The pure prismSpread helper normalizes aim and suppresses the whole volley below distance 0.001. It shares the existing radius 6, lifetime 2000 ms, speed, swept first-hit collision and cleanup. No piercing, homing, new weapon runtime or timer is added. Existing in-flight attacks retain their launch values. create/restart resets Laser ranks and prismEvolved along with existing state; Missile has its own upgrade ranks; Drone has its own upgrade ranks and explicit Twin evolution state; Missile has explicit Cluster evolution state.

Exactly six run-local Passive Modules have explicit levels starting at 0, with no caps or slots. Hull Plating adds 1 max HP and heals 1 immediately, clamped to the new maximum, refreshing the HP HUD. Thruster Module adds 30 px/s normal speed without changing Dash. Collector Field adds 40 world pixels to magnet activation radius without changing collection radius 20, acceleration 900 or maximum attraction speed 600. Combat Processor adds 0.25 to the global player-weapon damage multiplier, starting at 1.0; Laser, Drone and Missile multiply their current weapon-specific damage at launch without rounding. Laser Power remains Laser-specific; hostile/contact damage is unchanged. Each repeat selection increments only that module's level and reapplies its effect. Labels identify Passive Modules, their next level and effect. Native create/restart restores module levels 0, current/max HP 5/5, movement 300, magnet 180 and multiplier 1.0, alongside existing Laser/XP/Dash/UI/weapon resets and five timers. No inventory UI, generic stats/modifier system or extra timer is introduced.

A scene-owned screen-fixed text HUD displays current/max HP, XP toward the next level threshold, level and «Рывок: ГОТОВ»/remaining seconds (rounded up to tenths, decimal comma). It reads authoritative Defense/PlayerProgression/Dash state, refreshing immediately on damage and collection, including lethal damage and level-increasing awards. Dash feedback refreshes when its displayed tenth of a second changes during active simulation. It stays visible during death, level-up choice presentation and Victory; create builds a fresh HUD with reset values on retry.

Victory is the accepted RunLifecycle VICTORY outcome, read through the derived isRunVictorious getter; fresh create owns a new authority with null outcome. Only actual common Warden removal during a production player attack can trigger it, after the owning attack finishes: straight first-hit damage/death plus projectile cleanup, or the entire Missile primary and optional Cluster survivor/satellite union plus Missile cleanup. No transition occurs inside killEnemy. The first terminal outcome in existing processing order wins: death prevents later Victory, and Victory suppresses later hostile/contact damage and unrelated attacks/XP in the same frame. Existing enemies, Drone/Twin, unrelated shots/Missiles and pickups remain visible and frozen; movement/Dash, orbit, targeting, protection, lifetimes, collisions, XP and all five callbacks have no gameplay effect. The same five scheduled TimerEvents remain, with no entry-time reset/pause/recreation; Phaser Clock timing can advance internally. Result text reads the current existing level without adding Boss XP; HP/protection/progression are not changed on entry. Only NEW RUN is interactive during Victory; no SHIP DESTROYED/RETRY or upgrade UI is shown. Its once-only control also guards repeated callbacks and old presentation identity. Native restart removes old UI/runtime/timers, clears Victory/Boss flags and all previous run state, restores initial Chaser/count0 and five fresh timers. Real Phaser harness validation covers atomic straight/Missile/Cluster boundaries, both terminal races, dirty-world freeze, stale callbacks, two actual Victory NEW RUN cycles and one ordinary native death RETRY.

There is currently no:

- save system
- advertisements
- Yandex Games integration

This is intentional.

---

## DEV utilities

In Vite development runtime, the current GameplayScene publishes `window.__NEBULA_DEV__`
with exactly snapshot(), forceLevelUp(), spawnWarden(), setWardenHealth(health) and
setGodMode(enabled). Production preview boots without this property.
snapshot() returns detached numeric runSeed, nested build and diagnostics, runState and ordered pauseReasons, plain terminal/God Mode, derived playerHealth/playerShield/protectionRemaining, nested level/XP/threshold,
Boss flags/current Warden HP/derived phase, timed-spawn count, enemy count and actual
owned TimerEvent count. It changes no gameplay state or offers.

forceLevelUp credits exactly the remaining next-level XP through creditExperience, shared
with normal pickup collection, and opens the existing three-choice pause. spawnWarden uses
the real Boss creation path once per run, only with both boss flags false, no active Boss
and room under cap10; deterministic opposite-corner placement respects margin40 and distance600.
It does not advance successfulTimedSpawns. setWardenHealth accepts finite 1..60 (including
fractions) without killing, changing flags or resetting cadence; phases remain HP-derived.
God Mode rejects incoming damage before calling PlayerDefense, while hostile collisions
still consume projectiles and contact performs the same overlap separation. Disabling does
not heal/reset protection; fresh create resets God Mode false.

Every create publishes a fresh API with shutdown/destroy invalidation independent of
Scene object reuse. Old snapshot returns null and mutations false; all current mutations
also reject during Level-Up pause/Death/Victory while read-only snapshots remain available.
There are still exactly five gameplay TimerEvents, including fresh events pending Clock
insertion; DevTools adds none.

Tracked tests call actual Scene production methods with rendering/lifecycle fixtures.
Real Chrome/Phaser validation separately confirms ordinary DEV boot, production absence,
real choice acceptance, Warden phase movement/bursts and attack-triggered Victory, God Mode
projectile/contact behavior, two actual Victory NEW RUN native restarts and one ordinary
Death RETRY. Each restart has baseline flags/XP/God Mode, fresh API, five fresh events and
inert old captured API.

## PlayerBuild and effective ship stats

Every create constructs one fresh Phaser-free PlayerBuild during PREPARING, before current
HP/HUD initialization. Combat slots are exactly [LASER, MISSILE, COMBAT_DRONE]; Active is
null and all six Core slots are null. All three prototype weapons remain active. Innate
Dash remains outside Active; no equip API, Core catalog or Active runtime is added.

Exactly ten base/effective fields exist: hull5 HP, thrust300 px/s, reactorPower1,
fireControl1, projectileVelocity1, projectileScale1, engineering1, shieldSystems1, impact1,
combatAnalyzer0. Nine fractional percentage totals add normally (0.10=+10%); Analyzer adds
integer levels. Effective values are cached derived data, recomputed only on accepted
mutations. Hull/Thrust use base*(1+percent)+their explicit prototype flat bonus; the other
seven scales use base*(1+percent), Analyzer uses base+levels. The two flat bonuses preserve
exact Hull Plating+1 / Thruster+30 arithmetic without percentage accumulation drift.

Hull maximum and normal speed have no separate mutable Scene authority: compatibility
getters read effective Hull/Thrust. PlayerDefense owns current Hull. Hull Plating
still heals exactly1 capped at the new max; ordinary max increases do not heal, reductions
cap current HP. Dash stays900px/s,200ms,3000ms, with unchanged normalization/expiry/bounds.
Collector/Combat/Spatial/Replication, weapon ranks/local tuning, offers and recipes remain
prototype/local. Combat Processor is separate from Reactor and multiplies damage once.

Current Laser/Missile/Drone damage consumes Reactor; Drone additionally consumes Engineering.
Player weapon intervals divide local tuned intervals by Fire Control; player projectile
velocity multiplies Velocity, physical visual/collision radii multiply Scale. Missile stores
its scaled launch body radius as well as its existing launch values. Straight shots also
retain their launch values. Shared Scale never changes explosions, Cluster centers/radii,
Prism spread/count, Drone body/orbit, player/enemy bodies or XP. Replication's local bolt
addition occurs before Scale. Shield Systems has no gameplay consumer; Analyzer affects only Level-Up weights. Impact now resolves immutable outgoing physical force at player launch; it never changes damage or incoming Defense.

Exactly five events remain. A changed shared Fire Control resets the same three player
weapon events in place to composed delays/elapsed0, retaining callbacks and Clock pause;
local Laser/Drone cadence choices reset only their own event. No-op/other stats/reads/pause/
resume never reset cadence. The private bridge permits shared percentage changes only in
RUNNING; exact current REWARD Hull/Thruster choices have their concrete guarded path.
No public DEV mutation controls were added. snapshot.build contains detached slots,
baseStats/runModifiers/effectiveStats plus Tags/identity as described below; repeated reads
draw0 and do not alter diagnostics.

Exact captured shutdown/destroy disposal makes old Build reads/mutations throw; fresh
native restart restores slots/defaults/zero modifiers/full HP. Real Chrome pointer checks
verify full/damaged/fractional Hull, Thruster, legacy composition, shared R/F/V/S/E and
scaled collisions, plus Prism/Cluster/Twin. Genuine BLUR, two Victory NEW RUN cycles,
Death RETRY and paused nonterminal restart retain fresh Build/lifecycle/RNG/input/
diagnostics/API and five fresh events, with inert old callbacks. Unmodified production
preview retains keyboard/Dash/pause/current combat and omits DEV/debug UI.

## PlayerDefense and incoming damage

Every create constructs a fresh Phaser-free PlayerDefense after PlayerBuild during
PREPARING, before player/HUD setup. It owns only currentHull, currentShield and
protectionRemaining, initially5/0/0. Scene health/protection compatibility getters are
read-only; max Hull remains Build authority. snapshot() returns exactly three detached
plain numeric fields. Inputs require finite numbers without coercion; damage>0, heal/
delta>=0, initial/max Hull in [1,MAX_SAFE_INTEGER], Shield in [0,MAX_SAFE_INTEGER].
Fractions remain exact floating arithmetic; invalid calls reject atomically. Healing
uses bounded available-gap arithmetic, including large finite amounts.

Scene validates current run/Defense/player, RUNNING and positive Hull, then rejects God
Mode without calling Defense. Defense rejects protected hits without extending the
remainder; otherwise Shield absorbs first and same-hit overflow reaches Hull, clamped0.
Only an actual stored Shield/Hull loss accepts and starts500ms protection. Shield-only
loss starts protection but records neither diagnostic hit nor hpLost. Positive actual
Hull loss is recorded once before HUD/alpha0.5 and any accepted Death. Lethal Hull0 has
protection500 and final alpha0.25; terminal simulation cannot expire protection or heal.
Hostile shots remain Scene-owned and are consumed once on every collision, including
God/protection rejection and lethal damage. Existing first-terminal/attack cleanup stays.

Shared Hull percent changes reconcile current Hull to the new Build maximum: increases
never heal, decreases cap without damage telemetry. Current guarded REWARD Hull Plating
changes Build, increments its level, reconciles, heals1, updates HUD, records SELECTED,
then releases REWARD. Full5/damaged2/fractional2.5 become6/3/3.5 with max6; Shield and
protection remain unchanged. Healing discards overheal and returns actual positive gain.
There is no production setCurrentShield caller: fresh Shield stays0; Shield Systems is
still an unused stat. Nonzero Shield is exercised only by tests/internal ignored harnesses.
No Shield content, regeneration, capacity, healing source or extra DEV command is added.

Contact uses first collection d<=R, R32 Swarm,42 Charger,44 legacy regular/Elite or60 Warden; correction is
unit(player-enemy)*max(0,R-d), coincident unit(+1,0), clamped x[21,4779]/y[25,2675].
It precedes damage, including God/protected rejection. Tangency routes damage with step0;
edge residual overlap is allowed. Charger additionally supplies its current-update earliest CHARGING AI sweep pose when its final endpoint misses; final overlap takes priority. Impact never scales incoming damage or player separation; external knockback motion adds no swept contact. PAUSED/terminal do neither geometry nor damage; active protection countdown
stays at its existing phase before projectiles/contact. Manual/reward/focus pause freeze
Hull/Shield/protection and the same five event phases; resume continues the remainder.

Exact captured shutdown/destroy cleanup disposes only that create's Defense. All old
reads/mutations, even zero calls, throw; old detached snapshots remain usable. Native
restart restores a new5/5/0/0 owner with fresh Build/zero Tags/lifecycle/RNG/input/
diagnostics/API and five events. Saved old callbacks/cleanup cannot reach fresh Defense.
DEV derives playerHealth/playerShield/protectionRemaining from one snapshot; BuildSnapshot
keeps its six fields. Defense/contact/reads add no timer or RNG/Tag/Analyzer/reward effects.

Real Chrome checks pass for hostile hits/expiry/God, internal Shield absorption/overflow/
fractions/lethal and shared max synchronization, actual pointer Hull choices, all contact
boundaries and genuine foreground-tab BLUR. Dirty Defense freezes over manual1100ms,
reward700ms and BLUR650ms; focus return requires explicit resume. Two Victory NEW RUN,
Death RETRY and paused nonterminal native restart verify exact disposal and inert stale
callbacks; straight/Missile/Cluster terminal regressions also pass. Unmodified production
preview passes keyboard/Dash/pause/combat, ordinary incoming damage to HP0/Death and an
actual RETRY pointer back to HP5/5, with no DEV API/debug UI or new runtime errors.

## Combat resolution and launch snapshots

The Phaser-free combat.ts exports the closed Attack/source/snapshot/HitPhase/Damage
contracts and createAttack, composePlayerDamage, calculateHitDamage, calculateEnemyDamage.
The factory copies exact primitive snapshot fields and freezes both snapshot and Attack.
Damage/speed/radius/lifetime/blast values must be actual finite positive numbers <=MAX_SAFE_INTEGER; fractions are allowed. Required player-only impact is finite0..MAX_SAFE_INTEGER. Hostile FlightSnapshot retains exactly four fields and ContactSnapshot remains damage-only.
Invalid shapes/variants, unsafe products and zero underflow throw RangeError before affected
visual/array/HP mutation; Cluster half-damage is validated at launch. Composition preserves
left-to-right (local*C)*Reactor, with one further Engineering factor only for Drone.

Concrete projectiles and Missiles carry readonly typed Attack and exact creation-run refs.
Positions, velocity/heading, target and remainingLifetime remain Scene runtime state;
compatibility source/damage/radius/speed/blast/evolution getters retain no numerical mirrors.
Old launches keep damage/speed/radius/lifetime/blast/variant across shared/local progression.
Prism shares one LASER/PRISM Attack across three independent full-damage nonpiercing beams;
Twin creates one COMBAT_DRONE/TWIN Attack per valid actual firing origin and nearest target.
Missile cap1, homing/reacquisition and swept interpolated detonation are unchanged. Primary
hits current affected centers once, then Cluster hits the surviving six-circle union once
at half damage; primary survivors can receive both. Geometry, strict ties and cleanup order
remain unchanged, without hit-history restrictions or explosion radius/body expansion.

Scene-local Hit carries exact RunLifecycle, current target and typed Attack. One
applyEnemyHit adapter rejects stale/nonrunning/dead/missing targets, computes EnemyDamage,
writes healthAfter and delegates lethal removal/one XP drop to existing killEnemy. Results
separate calculated damage from actual hpLost, preserve transient negative overkill HP and
representational no-op loss0. GAME-051 projects the actual Hit into frozen kind/variant/phase
attribution and one immutable death record, as described below; no death registry is retained. Incoming typed hostile/
contact Hits retain PlayerDefense authority, God bypass, Shield-first protection and actual
Hull-only diagnostics. Hostile collision always consumes the projectile. Contact preserves
first inclusive bounded separation before incoming damage; Impact affects outgoing survivor control only.

Straight shot cleanup, or full primary + satellite union + Missile cleanup, precedes
Victory. Death-first/Victory-first authority and unrelated postterminal freeze remain.
Old Hit/flight/callback refs cannot reach fresh enemies/Defense after native restart.
There are still five gameplay TimerEvents, five DEV methods and zero added RNG draws;
BuildSnapshot, twelve zero production Tags, Analyzer, diagnostics/rewards and balance stay.

Real Chrome/Phaser checks cover all six offensive paths through actual hits/kill/XP, old/new
shared/local/evolution snapshots, interception/ties/Cluster union and incoming defense.
Active flights/heading/lifetime/Defense/five timer phases/four RNG counters freeze over
manual1100ms, reward700ms and genuine foreground-tab BLUR800ms; return needs explicit resume.
Two Victory NEW RUN cycles, Death RETRY and paused nonterminal native restart verify fresh
owners/five events and inert retained old inputs; Missile/Cluster primary/satellite terminal
checks also pass. Native result controls invoke production pointerdown handlers. Unmodified
production preview uses only real keyboard/mouse and rendered pixels: movement/Dash/pause/
combat, ordinary damage to HP0/5 Death, real RETRY to HP5/5 and fresh world progress, no DEV
API/debug UI/new pageerrors. Favicon404 and the existing large Phaser bundle warning remain.

## Authoritative EnemyDeath and source attribution

EnemyDeath.ts is Phaser-free and exports EnemyDamageSource, EnemyDeathRecord,
createEnemyDamageSource, validateEnemyDeathRecord and createEnemyDeathRecord. Sources contain
exactly kind/variant/phase: LASER BASE/PRISM DIRECT, COMBAT_DRONE BASE/TWIN DIRECT, MISSILE
BASE PRIMARY and CLUSTER PRIMARY/SATELLITE. Sources are copied/frozen values, without Attack,
flight, runtime, run or Build references. Each EnemyRuntime starts with lastDamagingSource=null;
only a valid accepted Hit with actual hpLost>0 replaces it. Representational loss0 preserves
null/prior attribution. DEV Warden HP changes preserve it without inventing a source.

applyEnemyHit remains the only enemy HP arithmetic adapter. It guards exact current RUNNING
Hit.run/target.run/member/alive ownership, computes unchanged damage once, projects the actual
Hit, and preflights lethal identity/XP/position/source before HP or last-source mutation.
Invalid authored data throws RangeError. It writes healthAfter once, preserving negative
overkill, then synchronously calls killEnemy(hit, damage, source) for actual lethal loss.
killEnemy rechecks current owner/member/depletion/current HP and source equality with the Hit
and just-stored last source. Alive, removed, duplicate and stale contexts return null before
record construction/effects. No source-less successful kill, administrative API or death flag exists.

One completed record copies exactly archetype/isElite/xpValue/x/y/lastDamagingSource/killSource,
freezing outer and two fresh nested sources. Elite requires Tank; XP is positive safe integer
from that enemy's spawn snapshot; death coordinates are finite signed/fractional world values
bounded by MAX_SAFE_INTEGER. Current lethal combat replaces last source, so both source fields
match by value. Records remain readable after restart but grant no consequence authority.

Concrete consequences retain order: record, Boss defeated flag (spawned remains true), one
existing lime radius10 XP pickup at record position/value1/5/10/speed0, clear dead target,
destroy visual, splice enemy, then source-aware diagnostics. Death grants no player XP;
physical attraction/collection/Level-Up remains unchanged. Straight projectile cleanup, or
full Missile primary plus Cluster survivor union and Missile cleanup, precedes Victory.
Primary Boss death cannot truncate satellites. First terminal wins; Boss XP10 stays frozen.

RunDiagnostics aggregates.killsBySource contains exactly seven flat kind.variant.phase
counters. recordEnemyKilled requires a valid source and prepares all killed/Elite/archetype,
XP and selected source sums before one aggregate commit; overflow leaves all fields unchanged.
Source totals equal killed.total for completed deaths. Snapshots detach the map; fresh runs
start seven zeros, terminal freezes it and disposed reads/mutations still throw. Six timeline
kinds/newest256 and the five-command nested DEV surface remain unchanged.

Validation:904 tests/26 files retain all739 baseline cases and add125 pure EnemyDeath,
26 Scene (233 total) and14 diagnostics (49 total). Actual Chrome/installed Phaser verifies all
seven sources, A->B attribution, loss0, Cluster primary-survivor/satellite overlap/multiple own
positions, XP1/5/10, real collection/choice pointer, zero added four-stream draws and five events.
MANUAL1100ms, REWARD700ms and genuine visible-tab BLUR800ms freeze HP/source/spawn/death/Attack
values, active flights/heading/lifetime, XP/Defense/diagnostics and same-event elapsed/remaining
phases. Focus return needs Escape; reward+focus composition preserves its remaining reason.
Two Victory NEW RUN cycles, Death RETRY and PAUSED nonterminal native restart verify fresh
Chaser HP3/null source, seven zero counters/new owners/zero Tags/unpaused Clock/five new events;
retained old sources/records stay readable and old Hit/completion/callbacks draw zero fresh RNG.
Additional Missile/Cluster Boss terminal cycles verify every death/observer and owning cleanup
before Victory. Unmodified built production uses real keyboard/mouse/rendered output: movement,
Dash/pause/combat, ordinary deaths/physical XP, incoming damage to HP0/5 and actual RETRY to
HP5/5/XP0/5/one Chaser; DEV absent and no pageerrors. Known favicon404/bundle-size warning remain.

## Enemy interaction, Swarm and Charger

Six identities comprise five normal roles plus legacy Warden; fixed Elite is still tank+isElite.
Required LEGACY_NEUTRAL context and every legacy HP/speed/body/contact/XP value remain unchanged.

| Profile | HP | AI speed / timings | Radius | Contact | XP | Knockback response | Decoy susceptible |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Swarm | 1 | PURSUIT240 | 12 | 1 | 1 | 1.5 | true |
| Chaser | 3 | PURSUIT180 | 24 | 1 | 1 | 1 | true |
| Charger | 4 | APPROACH110/range350; WINDUP650ms; CHARGING650px/s for500ms; RECOVERY800ms | 22 | 1 in every phase | 1 | 0.75 | true |
| Shooter | 2 | band140/inclusive350..500 | 24 | 1 | 1 | 1 | true |
| Tank | 6 | PURSUIT100 | 24 | 1 | 1 | 0.25 | true |
| Fixed Elite Tank | 18 | PURSUIT120 | 24 | 2 | 5 | 0.125 | true |
| Warden | 60 | HP>30:70; positiveHP<=30:100 | 40 | 2 | 10 | 0.05 | false |

Each spawn owns independent frozen movement and interaction:{knockbackResponse,decoySusceptible}.
Elite has its own explicit frozen interaction override. Susceptibility is data only; no actual
Decoy, target switching, equipment, entity or activation exists. Charger is retargetable only
before commitment (APPROACH/WINDUP); current targeting remains the player in every role.

Laser/Prism and Drone/Twin use required PlayerFlightSnapshot impact; Missile/Cluster adds
explosionRadius to that schema. createAttack validates/copies/freezes the player value; hostile
and contact reject it. Concrete launch impact is local200/160/400px/s respectively times Ship
Impact once. Hit strength=(frozen launch impact * phase1, or Cluster satellite0.5) * owned
response. Damage/C/Reactor/Engineering/body/blast/cadence remain independent. Old launches keep
old impact after Build changes. Exact zero means no force; nonzero force-product underflow
and unsafe values fail before publication or HP/source/velocity mutation.

Pure knockbackDirection/withKnockbackImpulse normalize actual flight velocity or radial blast
geometry (zero -> +X), sum vectors with scaled-safe arithmetic and cap the sum at600px/s.
stepKnockback integrates linear decay1200px/s² analytically once after concrete AI movement.
At600 the maximum external travel is150px over500 active ms; Laser/Chaser Impact1 starts200,
stops after1/6sec and contributes16 2/3px without AI/bounds. Scene clamps at max(25,bodyRadius),
clears blocked outward components and retains tangential velocity. Hit changes velocity only;
movement starts next active update, preserving Cluster membership and death positions. Actual
hpLost0 can receive force without changing attribution/XP/kill counters; lethal removal receives
no new force. applyEnemyHit remains the single HP adapter and killEnemy the single death/XP
consequence path; seven source identities and seven-field EnemyDeathRecord remain unchanged.
Satellite survivors retain one Hit with the FIRST covering circle's origin in existing order.

Pure stepCharger owns only phase/time/position/aim calculations and charge-contact geometry.
Exact residual phase time traverses at most the current cycle; after recovery residual time
approaches and rearm waits for the next positive update. No wall clock, extra event or scheduler.
Windup tracks current aim; charging locks it, never homes or redirects on contact/bounds. Scene
integrates external force once, refreshes still-windup aim from final displaced center and
commits validated state. One reused Scene-owned Graphics draws only WINDUP:3px/0xfb7185/0.75,
325px clamped endpoint. Charger is a red44 chevron, Swarm a green24 diamond; yellow target
outline retains priority. Death and captured native shutdown destroy Charger Graphics.

Only CHARGING AI segments supply same-update exact-run swept contact evidence, inclusive at
combined radius42. Final overlap wins, otherwise earliest crossing uses existing minimum player
separation and ENEMY_CONTACT -> PlayerDefense once, in original enemy collection order. Projectiles/
Missiles/death still precede contact. Killed/stale Chargers cannot contact; external force alone
never creates a sweep, collision damage, enemy death or another damage source.

Spawn option B preserves natural CCCSCT (Phase1:2000ms; Phase2:1200ms)/cap10/Elite12+24/Warden30 and exactly two Encounter
draws per accepted timed placement. Swarm/Charger currently enter via guarded internal verification
of the real private factory, never natural scheduling or extra DEV commands. Diagnostics has
six spawned/killed archetype keys and the unchanged seven source keys; both new roles drop XP1.
Fresh killed buckets are all zero; spawned bootstrap observes initial Chaser exactly once.
There are exactly five original TimerEvents and five DEV commands. No additional RNG consumers,
dependencies, general movement framework, actual Decoy or GAME-053+ runtime were added.

Validation:1078 tests/28 files retain all904 baseline cases through only approved schema/physical
consumer migrations. Actual installed Chrome/Phaser checks all seven physical phases, response
matrix, OLD Impact1/NEW Impact2, decay/cancellation/cap, first-circle union, loss0/preflight/lethal,
new-role contact/death/XP/diagnostics and legacy AI/Warden phases/styles/bursts. Visible windup
tracking/committed nonhoming charge/recovery were observed at normal and12FPS; separate controlled
large-delta/swept/bounds checks pass. Actual Clock first30/cap-delayed12+30 yields60 Encounter draws
with explicitly internal collection clearing. Real W/Space/Escape, MANUAL1100ms, REWARD700ms and
genuine visible-tab BLUR800ms freeze Charger/Graphics/force/HP/source/flights/XP/Defense/diagnostics/
five event identities+phases/four RNG counts. Composed REWARD+FOCUS_LOSS800ms and actual pointer
selection preserve focus pause until explicit Escape; an authored Hull choice may heal1 normally.
Two Victory NEW RUN cycles, Death RETRY and PAUSED nonterminal native restart each dirty new
roles/force/telegraph, destroy old visuals/Graphics and restore fresh owners/ChaserHP3/null source/
zero velocity/frozen interaction/zero Tags/six zero kill+seven zero source buckets/count0/flagsfalse/
unpaused Clock/five fresh events; retained old callbacks/values cannot mutate fresh owners or draw
fresh RNG. Straight/Missile/Cluster primary/satellite terminal atomicity and frozen BossXP10 pass.
Unmodified production preview uses actual keyboard/mouse/rendered output: movement/Dash/pause,
automatic combat, surviving Chaser knockback, physical XP, ordinary incoming Death and actual RETRY
to a fresh active run, with DEV absent and no pageerrors. Known favicon404/bundle warning remain.

## Physical XP and PlayerProgression

GameplayScene creates one Phaser-free PlayerProgression in PREPARING and captures its exact
owner for disposal. It owns level, retained XP and pendingLevels; HUD/result/DEV read it.
snapshot returns detached {level,xp,threshold,pendingLevels}; creditXp returns creditedXp and
levelsGained; resolvePendingLevel consumes one earned opportunity; dispose is idempotent.
All other disposed operations, including zero credit/empty resolution, throw. Public DEV
progression remains exactly level/xp/threshold with the same five commands.

Threshold is5*level, inclusive equality and exact remainder preserved. BigInt cumulative
cost plus bounded binary search handles MAX_SAFE_INTEGER promptly without per-level loops.
Awards/state must be normalized safe integers; xp+amount may not exceed MAX_SAFE_INTEGER,
final threshold must be safe and no earned level may be suppressed at the representational
limit. Invalid/overflowing awards reject before any owner, pickup, HUD or observer mutation;
zero owner credit is a no-op. Fresh+5 gives2/0/pending1; +15 gives3/0/pending2; +32 gives4/2/pending3.

The single creditExperience boundary validates exact run/progression, RUNNING/player and
pickup run/member/active visual/value, or the exact DEV next-threshold remainder. Shared pure
arithmetic and affected diagnostics sums/timeline capacity are preflighted before one commit.
One collected pickup credits once; pending resolution never adds XP or levels again.
Each actual three-choice offer counts once; each applied choice counts once. Text/candidate
identity rejects stale callbacks even when later text is identical; eligibility and observer
preflight precede actual upgrade mutation. Next offers use the updated Build, with continuous
REWARD/paused five-event phases and no intermediate resume or additional pause timeline rows.
Other reasons compose; final choice leaves FOCUS_LOSS held until focused/visible Escape.

EnemyDeath remains one physical1/5/10 drop, never direct XP. Radius10/lime style, magnet180,
Collector+40, collection20, acceleration900, cap600, reverse iteration and no expiry remain.
At >256 current pickups, a temporary64px world-cell plan merges deterministic earliest safe
same-cell pairs strictly outside magnet range. Older anchor keeps exact position/style/order,
sums value, resets speed0; newer visual is destroyed. Unsafe pairs are skipped. Sparse or
unsafe populations may remain above256: no hard cap, eviction, distant merge or XP discard.
Minimum trees per cell avoid quadratic unsafe/sparse pair discovery; there is no persistent
spatial registry. Scene revalidates actual ownership/value/positions before every merge and
compacts survivors in place. Merging emits no XP/death/diagnostic event and consumes no RNG.

RUNNING Boss encounters allow ordinary XP Level-Ups. Terminal interrupts UI and freezes
unresolved progression; first-terminal/straight/Missile/Cluster cleanup ordering is unchanged.
BossXP10 stays physical/uncollected after Victory. Native restart creates1/0/pending0, destroys
all remaining captured pickup visuals, and restores fresh owners/zero Tags/five events.
Old owners throw; detached copies stay readable and old callbacks cannot affect fresh state.

1158 tracked tests/30 files preserve all1078 baseline cases. Installed Chrome/Phaser verifies
physical ordinary/Elite XP, controlled32 XP with three real pointer selections and updated
eligibility, continuous reward and genuine tab BLUR wall freeze, consolidation conservation,
Boss-time Level-Up, straight/Missile/Cluster primary/satellite Victory with four actual NEW RUN
cycles, Death RETRY and paused nonterminal native restart. Saved owner/pickup/choice/key/focus/
timer/DEV/cleanup references are inert. Unmodified production keyboard/pixel checks verify
movement/Dash/pause, natural physical XP to Level2 and real pointer choice, ordinary incoming
Death/actual RETRY and DEV absence with no new pageerrors. Known favicon404/bundle/worker advice
only. No new timer/stream/DEV method/dependency or GAME-057+ runtime; GATE A/B PASSED, GATE C unapproved.

## Reward transactions and hard eligibility

Every create constructs one Phaser-free RewardTransaction during PREPARING. It owns one
current three-candidate LEVEL_UP offer, copied/frozen canonical choice data, authentic frozen
token, monotonic safe local ordinal, OFFER_GENERATED/PRESENTED phases and a private synchronous
selection guard. Detached serializable snapshots contain no selection authority. Cloned,
foreign/equal-ordinal, stale and duplicate tokens reject; all operations except idempotent
dispose throw on a disposed owner. Openability/ordinal is checked before Reward sampling.

rewardChoices preserves the original18 prototype identities/labels/values and appends18 Laser identities. rewardEligibility
checks detached Build slots/stats/Laser configuration, derived Laser projections and Scene-owned other-weapon ranks/modules/flags/local values
and numeric feasibility before generation and immediately before application. Missing owning
weapons/caps/recipes/overflow reject; developing an installed system needs no free slot.
Repeatable passives remain prototype modifiers, with no artificial inventory cap or Core slot.
PlayerBuild's two narrow Hull/Thruster previews share the actual candidate preparation/resolver
without source/cache/Tag/Defense mutation; disposed errors propagate. Laser ranks/form/development now have one authoritative BuildSnapshot.laser; other-weapon ranks/module levels stay Scene-owned. Tags/Analyzer do not hard-gate rewards except safe numeric feasibility of authored Tag additions.
The focused helper's optional eligible-track mask retains the same least-rank/cyclic behavior.

One Scene applyRewardChoice callback preflights numeric/Attack/cadence/Build/Defense/pending/
observer/timeline/next-ordinal effects; Twin's unpublished companion is prepared last and
removed on rejected recheck. It applies exactly one real upgrade, resolves one earned pending
level and records one selected observation, then returns true. RewardTransaction invalidates
the accepted token and exits its guard before trySelect returns true to Scene. Only then does
Scene remove old handlers/UI, reset input and generate one updated next offer under the SAME
REWARD, or release only final REWARD. No nested open/generation/pause release in the callback.
Expected preflight failures preserve current gameplay/UI/handler state; unexpected partial
engine failures propagate as invariants, never as an atomic false success.

Each choice has one named persistent pointerdown handler with exact captured run/progression/
Build/Reward/token/presentation/Text identity. A rejected click keeps the SAME live Text,
handler and token for a valid retry without reattachment/regeneration. Success, replacement,
terminal and disposal detach the exact old handlers. Queued duplicates before cleanup and saved
callbacks after same-label offers/native restart remain inert; old cleanup cannot touch fresh
owners. Terminal freezes pending state and invalidates the transaction without resolving it.
Native restart has a fresh idle Reward owner/ordinal0, progression1/0/0, Build/Defense/Tags/RNG/
input/diagnostics/API, initial Chaser and five fresh unpaused gameplay events.

All18 effects and recipes are retained. GAME-055-v1 intentionally changes seeded offers and
legacy2/3/1/2 budgets to exactly3 per offer. Reads, eligibility, previews and selection draw0;
actual next pending offers draw3 from updated Build and presented policy history.
Exactly four RNG streams/five TimerEvents/five DEV commands remain; DEV progression still has
only level/xp/threshold and production exposes no API. GAME-053 XP arithmetic/physical values/
consolidation/continuous pending chain and existing atomic terminal attack cleanup are unchanged.
The LevelUpGenerator policy is described below; no rarity, new Combat System acquisition or GAME-057+ runtime exists.

1294 tracked cases/32 files retain1158 baseline cases. Actual installed Chrome mouse checks
cover all18 effects/future launches and in-flight immutability, same event callbacks/scope/args,
only authored cadence resets, same-handler rejected click then valid retry, duplicate/forged/
stale same-label callbacks0 and exact callback/token/guard/return/orchestration order. Controlled
physical32 yields4/2/pending3 and three sequential mouse choices with updated eligibility and
unbroken REWARD. Genuine tab BLUR with focus emulation disabled, composed pause wall waits and
held-input suppression pass. Four atomic Victory NEW RUN cycles, Death RETRY and PAUSED native
restart isolate old refs. Unmodified built production passes real W/Space/Escape/pause/Dash/
combat, natural physical XP to Level2/real choice, ordinary incoming Death/real RETRY and fresh
active world. DEV absent/no new pageerrors; known favicon404/bundle/worker advice only.
GAME-054/055 DONE; GAME-056 DONE; GAME-057+ BACKLOG; GATE A/B PASSED; GATE C unapproved.

## Weighted Level-Up generator

Each actual create constructs one Phaser-free LevelUpGenerator, captured by the same exact-owner
shutdown/destroy cleanup as RewardTransaction. It owns only bounded policy: misses0..4, last2
presented three-ID offers, primary signature, cyclic Prism-first evolution cursor, last ordinal
and one provisional tuple/update. It retains no Build, progression, Run, Phaser or RNG handle.
Canonical immutable affinity metadata covers36 choices and itself contributes no Tags; accepted Laser branch acquisition has a separate authored atomic Build Tag effect.

Base100 combines context primary2/secondary1.5, Slot1 primary2/secondary1.25 and weaponFocus1.5,
Slot2 Hull/Thrust1.5, primary Analyzer1+2/(1+4/A) (A0 factor1), primary pity1+0.25*baseMisses,
and recent1/0.5/0.25. Analyzer accepts nonnegative safe integers without a cap4. Weights remain
25..3600/total<=129600 for36 entries. Eligibility, identity/stat validation and every possible slot path preflight
before any RNG/pause/UI writes. Insufficient ordinary choices fail loudly; other evolutions never
fill shortages. Sampling uses canonical cumulative strictly-greater boundaries and exactly3 draws.

Changed dominant signature uses base0 for both weighting and prospective misses: no eligible
match freezes new0, an available-but-missed offer yields1, any presented primary match yields0.
Only successful recordPresented commits signature/misses/history/cursor; selection/retry/cancel
commit nothing. Generated internal candidates, nested choices and update are independent frozen
copies; returned candidates are a second deep-frozen copy. Snapshots deeply detach policy data.
Disposed reads/commands throw except idempotent dispose; retained data has no authority.

Scene orders open -> three real named Text controls -> present -> exact owner/ordinal/tuple check
-> recordPresented -> existing offered observation. RewardTransaction retains all token/acceptance
authority. Next generation occurs only after true trySelect return, token invalidation and guard
exit/UI cleanup. Same rejected Text/token/handler survives for retry. Physical32 XP remains
Level4/XP2/pending3 with updated actual Build between three offers,9 Reward draws and continuous
REWARD. Terminal cancels provisional work; native restart creates completely fresh empty policy.

1354 tests/33 files pass, including55 pure policy cases and5 new Scene cases; baseline1294 retained.
Installed Chrome verifies all18 real pointer effects, retry/duplicates/order, real Build Tags and
Analyzer4 with oldm4 -> changed signature ->0/1/0, genuine other-tab BLUR/five event phase freezes,
32-XP/9-draw chain, straight/Missile/Cluster terminal cleanup, four Victory NEW RUN cycles,
Death RETRY and paused native restart with exact stale-owner/callback isolation. Unmodified built
production passes real input/Dash/pause/combat, natural XP/Level-Up/mouse choice and ordinary
incoming Death/RETRY. DEV absent/no new pageerrors; known favicon404/Vite chunk/worker advice only.
GAME-055 DONE; GAME-056 DONE; GAME-057+ BACKLOG; GATE A/B PASSED; GATE C unapproved. No new dependency/timer/stream/
DEV command, selection authority, future content or target distribution.

## Laser progression vertical

PlayerBuild is the sole Laser configuration owner. Detached BuildSnapshot.laser contains ranks0..2,
BASE/PRISM/SCATTER/REPEATER/LANCE form, canonical chosen-branch upgrade IDs and Capstone.
Scene laser/laserRanks/prismEvolved are derived getters; no writable parallel truth remains.
previewLaserChoice/applyLaserChoice share validation, prepare the complete config/Tag/identity/profile
and composed launch values before one commit. Scene percent-stat changes preflight all weapon consumers.
Readiness derives from BASE and tuning sum>=3; global stats/passives/Tags do not count.

Base/Prism retain L=1+power, T=max(100,600-50*fireRate), V=1200+200*speed, local radius6,
lifetime2000 and Impact200. Prism remains the exclusive legacy2/2/2+Combat1 alternative with three
independent full-damage beams. Branches preserve tuning, permit their four independent rank1
upgrades and require all4 for their one-time Capstone; remaining tuning stays available below2.

| Branch | Initial local profile | Four developments; Capstone |
| --- | --- | --- |
| Scatter | damage.5L, interval1.25T, speed.75V, radius6, lifetime500, Impact300,3 pellets0/-15/+15 | damage.65L; step12; lifetime650; Impact400; Capstone5 pellets0/-h/+h/-2h/+2h |
| Repeater | damage.4L, interval.35T, speedV, radius6, lifetime2000, Impact80,1 shot | damage.5L; interval.30T; speed1.2V; Impact120; Capstone interval.25T |
| Lance | damage2L, interval1.75T, speed1.5V, radius6, lifetime2000, Impact240,3 distinct hits | damage2.5L; speed2V;4 hits; radius8; Capstone5 hits |

Shared composition is ((localDamage*Combat)*Reactor), localInterval/FireControl, localSpeed*Velocity,
localRadius*Scale, localImpact*ShipImpact; Engineering never scales Laser. All values and mechanics
are copied/frozen at launch; upgrades affect future attacks only. New Laser mechanics use the existing
BASE/DIRECT death bucket; seven source counters and one HP/death/physical-XP route remain.
Scatter shares one Attack with independent damaging pellets; only force diminishes1/.5/.25... per
volley/enemy via a map bounded by5 entries, cleared with the last flight and native cleanup.
Lance tracks exact visited enemy references per flight (max5), traverses earliest inclusive swept
intersections on the same clipped segment, never re-hits a survivor, and completes owning cleanup
before Boss Victory. All forms retain cached nearest targeting; priority ranking and cross-system
duplicate avoidance remain distinct future GAME-059 work.

The36-entry catalog retains original18 then acquisition Scatter/Repeater/Lance and each branch's
four developments+Capstone. An available specialization uses exactly one weighted Slot1 draw;
other acquisitions cannot enter Slots2/3. Zero acquisitions solely due to numeric feasibility uses
ordinary GAME-055 policy with three distinct eligible rewards, retained readiness, no generation-time
Build/pending/policy write and exactly3 Reward draws. Complete paths preflight before RNG/REWARD/UI;
insufficient entire pools fail explicitly with0 draws. Next actual offers retry readiness.
Scatter adds CLOSE_COMBAT/PROJECTILES/CONTROL1 each; Repeater RAPID_FIRE/PROJECTILES1; Lance
PRECISION/PROJECTILES1, atomically and once. Presentation-only history/pity/cursor commit remains.

1490 tracked tests/34 files pass. Installed Chrome/Phaser validates all18 new choices via actual
mouse, profiles/Prism/snapshots, Scatter force/map, Lance3/4/5 and small/large sweeps, same5 timers,
physical32/3 choices/9 draws, active-map REWARD and genuine other-tab BLUR freezes, eight Victory
NEW RUN cycles, incoming Death RETRY and dirty PAUSED native restart with stale-owner isolation.
Numeric-capacity restoration is explicitly a controlled valid Build replacement fixture; no Tag
reduction API was added. Unmodified production passes W/Space/Escape/Dash/pause/combat, natural
physical XP/Level-Up/mouse choice, ordinary incoming Death/RETRY, no DEV API or pageerrors.
Controlled FireControl100 with fully developed fastest Repeater observes ~57-60 frames/sec over
~1.2s in headless installed Chrome (software WebGL):600 Scatter/730 Repeater/220 Lance live flights;
delays6.25/1.25/8.75ms. This is a desktop responsiveness observation, not mobile performance proof.
GAME-056 DONE; GAME-057+ BACKLOG; GAME-040/041 SUPERSEDED; GATE A/B PASSED; GATE C unapproved.

## Tags and canonical BuildSnapshot

PlayerBuild owns exactly twelve Tag identities in immutable TAG_IDS order: PRECISION,
RAPID_FIRE, CLOSE_COMBAT, PROJECTILES, EXPLOSIONS, DRONES, TECHNOLOGY, SHIELDS, CONTROL,
MOBILITY, SUPPORT, SURVIVAL. TagPoints has exactly those twelve own numeric fields, initially0.
Occupied Combat slots, tuning, all six passives, Prism/Cluster/Twin, developments and Capstones add0 Tags. Each accepted Laser specialization adds1 to its authored branch Tags exactly once in PlayerBuild; all other progression preserves existing totals.

addTagPoints(tag,amount) adds nonnegative safe integers. It checks the existing live-Build
invariant first, validates membership even for zero, and rejects invalid IDs/nonnumbers/
NaN/infinities/negatives/fractions/unsafe amounts or overflowing totals with RangeError
before mutation. Valid zero returns false; positive accepted amounts return true.
Tag totals are authority; cached identity derives only after accepted positive additions.
dominantTags contains every highest-positive-score tie; secondaryTags every next-distinct-
positive-score tie. Arrays follow TAG_IDS order, independent of arrival order. With no
positive points both arrays are empty; with only one positive tier secondary is empty.

PlayerBuild.snapshot() now returns canonical BuildSnapshot with slots, baseStats,
runModifiers, effectiveStats, tags, identity:{dominantTags,secondaryTags} and detached laser configuration.
PlayerBuildReadModel is replaced. Existing narrow stat/slot getters remain. Every snapshot
is deeply detached plain JSON data, including both identity arrays; old detached data
remains usable after disposal. DevSnapshot exposes this only through existing nested build;
the five commands remain unchanged and production has no DEV API or Tag debug UI.

Tag mutation never recomputes EffectiveStats or changes HP/movement/attacks/cadence/current offers,
draws from any of the four streams, records diagnostics or resets/adds a TimerEvent. Future
LevelUpGenerator calls consume the updated identity for weighting. Stat/flat/Analyzer mutations never change Tags or recompute identity. Reads derive nothing
and have no side effects. Analyzer remains a separate numeric stat consumed only by LevelUpGenerator weighting.
No tag-based stats, maturity score or difficulty coupling is implemented.
Exactly five existing events remain. Tags use existing captured Build disposal; all disposed
reads/mutations (including zero-point additions) throw. Native restart creates a fresh
Build with twelve zeros/empty identity, existing slots/defaults/zero modifiers and fresh
lifecycle/RNG/input/diagnostics/API/five events; old callbacks cannot reach new Tags.

Real Chrome checks verify all18 current choices through browser pointer input with nonzero
Tags unchanged, actual Prism/Cluster/Twin attacks and the exact DRONES3/TECHNOLOGY3/MOBILITY2/
SURVIVAL1 identity, then SURVIVAL+3 pivot. Snapshot copies, invalid-add atomicity, unchanged
stats/launches/five timer phases and zero RNG/diagnostic effects pass. Genuine browser BLUR,
manual/reward pause, two Victory NEW RUN cycles, Death RETRY and paused nonterminal native
restart preserve fresh ownership/zero Tags with disposed old reads/additions and inert
saved callbacks. Additional Missile/Cluster native cycles pass. Unmodified production
preview retains W/Space/Escape/current combat, omits DEV/debug UI and has no new pageerrors.

## Run diagnostics

GameplayScene owns one Phaser-free RunDiagnostics per create, constructed from RunRandom.runSeed
after successful lifecycle start. It records RUN_STARTED at 0 and the existing PREPARING-created
Chaser once (spawned.total 1/chaser 1); no enemy recreation or extra RNG draw occurs.
Only valid active updates add their full delta once before movement/combat. Pause/resume
frames returning early, paused frames and terminal frames add nothing. Update observations
use end-of-active-frame time; earlier Clock callbacks use the last accumulated time.

Aggregates count completed spawns/kills by swarm/chaser/charger/shooter/tank/boss (Elite Tank
subset), actual accepted HP loss/hits, dropped XP, credited XP split into pickup/DEV sources,
levels gained, constructed offers, accepted choices and actual pause entries/resumes.
The semantic timeline contains only RUN_STARTED, PAUSE_ENTERED, PAUSE_RESUMED,
LEVEL_UP_OFFERED, LEVEL_UP_SELECTED and TERMINAL. It retains the newest 256 records, counting
each oldest-row eviction without losing aggregate totals. Typed choice identities come from
LevelUpChoice data. Selection precedes final reward resume; composed reasons do not add fake
transitions, and terminal from PAUSED adds no resume. Accepted terminal freezes diagnostics
after the existing completed attack boundary; diagnostics never decides gameplay outcomes.

The five-command DEV snapshot exposes a deeply detached JSON-serializable diagnostics field;
reads neither mutate history nor consume RNG. Exact captured shutdown/destroy cleanup disposes
only that create's owner. Disposed mutation/snapshot calls throw; native restart creates a new
seed-matched bootstrap with no retained history. No new timer, authority, transport, persistence,
performance counter or UI is added.

Tracked pure/Scene tests and real Chrome checks cover active elapsed, a 1500ms manual-pause
freeze, actual spawn/kill/drop/collection/damage, real pointer selection and genuine browser
BLUR with reward/focus composition. HIDDEN/VISIBLE combinations have synthetic tracked
coverage. Two native Victory NEW RUN cycles, Death RETRY and paused nonterminal restart
verify fresh owners/five events and inert stale callbacks. Unmodified production preview
retains keyboard/Dash/pause, omits DEV API and makes only local static asset requests.

## Run lifecycle and fresh-run ownership

Every GameplayScene.create constructs a fresh RunLifecycle before synchronous gameplay
initialization, then starts it at the end. The authority has PREPARING, RUNNING, PAUSED,
TERMINAL and DISPOSED states and read-only state/outcome; start succeeds once, terminal
requests are accepted from RUNNING or PAUSED, and the first DEATH/VICTORY is immutable through disposal.
Idempotent dispose cannot revive the authority or clear its outcome.
No POST_RUN, new clock or later domain migration is implemented. RNG ownership is
separate from RunLifecycle as described below.

isPlayerDead and isRunVictorious are derived getters, without separate mutable flags.
Only an accepted terminal request produces the existing concrete Death/Victory overlay.
Victory stays after the existing straight hit/projectile cleanup or full Missile/Cluster
detonation cleanup, never inside killEnemy. Production processing order still decides
Death-first versus Victory-first. Level-Up presentation stays Scene-owned but REWARD owns
its authoritative PAUSED state; all non-RUNNING states suppress simulation and mutable DEV commands.

Native Phaser restart still resets the physical run. Shutdown/destroy cleanup captures
the exact authority from that create; a new create receives a different authority identity.
The five original TimerEvents, including cadence-reset callbacks, and RETRY/NEW RUN controls
capture their owning run. Old authority, saved callbacks/listeners and captured DEV API
remain ineffective on a reused Scene; fresh run starts with null outcome and God Mode false.
Initial Drone placement is performed directly during PREPARING, preserving its angle0
position before the first simulation frame.

Tracked lifecycle and real Scene tests pass. Real Chrome/Phaser checks confirm both terminal
races, straight/Missile/Cluster primary-kill and satellite-kill atomic boundaries, independent
Level-Up freeze/resume, two Victory NEW RUN cycles, ordinary Death RETRY and nonterminal
native restart. Each restart disposes old authority and creates independent RUNNING/null
authority/API plus five fresh events. Production preview boots without DEV API.

## Authoritative pause and desktop input

RunLifecycle owns exactly REWARD, MANUAL and FOCUS_LOSS reasons. The first reason enters
PAUSED, duplicate requests do nothing, releasing one reason leaves other ownership intact,
and only the final release resumes RUNNING. Terminal/dispose clear reasons without revival.
isSimulationPaused reads lifecycle only; isLevelUpPaused is presentation/transaction identity.
Real Level-Up acquires REWARD and clears gameplay input before constructing the unchanged
Reward-backed offer while PAUSED. Valid current choice applies once and resolves one pending level; only the last pending choice releases REWARD.
Escape is ignored during REWARD; stale/double/terminal choices cannot upgrade or release it.

KeyboardInput owns WASD/arrows, Space and Escape and returns raw movement/activate/pause intents.
Scene retains normalization, movement/clamp and the current innate Dash bridge. No real Active
runtime or mobile adapter is implemented. Adapter tracks held controls independently of Phaser
logical resetKeys, suppressing them until physical release/fresh non-repeat press after reward,
manual/focus pause, terminal, resume and fresh run. Paused presses never queue movement or Dash.

Escape pauses with MANUAL; explicit focused/visible Escape without REWARD releases MANUAL and
FOCUS_LOSS if present. Per-create Phaser Game BLUR/HIDDEN acquire FOCUS_LOSS; FOCUS/VISIBLE
only update separate bookkeeping. Return never auto-resumes; both tracked and actual document
focus/visibility are required to resume. Minimal screen-fixed «ПАУЗА / Esc — продолжить» text stays
hidden behind reward transactions and is removed before terminal UI.

Scene.time.paused freezes the same five events' elapsed/remaining phases throughout PAUSED;
simulation guards freeze movement, enemies, targeting, attacks, XP, protection and Dash/orbit.
There is no timeScale workaround, extra timer, catch-up or resume reset. Accepted Fire Rate/
Firing System retain their intentional existing in-place event resets. Terminal restores the
existing unpaused Clock/guarded-callback behavior; fresh create explicitly clears Clock.paused.
Native restart disposes exact old input/focus bindings as well as lifecycle/RNG. Captured old
callbacks/cleanup cannot change fresh input, pause reasons, Clock or RNG.

Tracked tests and actual Chrome keyboard checks verify held W/Space/Escape, mid-burst/cooldown
freeze, real Level-Up pointer acceptance and 2300ms of unchanged gameplay/all four streams/
five TimerEvent phases. With focus emulation disabled, actual foreground-tab changes trigger
Phaser BLUR (document remains visible); return stays PAUSED until Escape, including reward+
focus composition. HIDDEN/VISIBLE/restoration-order cases are separately tested synthetically.
Two Victory NEW RUN cycles, Death RETRY and paused nonterminal restart restore fresh input/
authority/RNG/API and five events; saved stale callbacks draw zero on all fresh streams.
Unmodified production preview supports keyboard/Space/Escape, with no DEV API or debug controls.

## Seeded run randomness

GameplayScene creates a separate Phaser-free RunRandom only after successful run.start(),
using crypto.getRandomValues(new Uint32Array(1)) for an immutable uint32 runSeed (zero valid).
The owner exposes exactly four independent streams: encounter, reward, world and boss.
Each uses Mulberry32 after a fixed root-XOR-salt avalanche; literal golden tests pin the
algorithm/derivation for seeds 0 and 123456789. Invalid explicit seeds are rejected.

Timed spawn placement consumes exactly two Encounter draws after its existing guards:
side0/1/2/3 = left/right/top/bottom, then that edge's varying coordinate. Camera ranges,
48px origin offset, margins25/40, distance600 and deterministic opposite-corner fallback
are preserved. Blocked spawns and DEV spawnWarden consume none; schedules/counts are unchanged.
Level-Up passes Reward explicitly into LevelUpGenerator.generate. Every valid offer consumes
exactly3 ordered draws, including singleton evolution; canonical weighted GAME-056-v1 offers
intentionally supersede old2/3/1/2 budgets. Stable UI, preflight, presentation acknowledgment,
snapshots and selection/rejected/stale callbacks draw0; each next pending offer draws3.
World and Boss remain dormant: stars, Warden phases/bursts and DEV placement are deterministic.

Same seed, code/content and relevant state/decision history reproduce procedural decisions;
different inputs, timing or physics are not a replay guarantee. There is no player seed control.
DEV snapshot adds only detached runSeed; its five commands remain unchanged and absent in production.
Each native create owns a fresh RNG identity; entropy may numerically repeat. Captured exact-owner
shutdown/destroy cleanup invalidates all old stream handles, which throw on direct stale draws.
Existing owning-lifecycle guards keep stale callbacks from drawing or affecting a fresh run.
No timers were added; the same five gameplay events remain.

Tracked tests and real Chrome/Phaser checks verify fixed-seed spawn/offer sequences across
independent setups, cross-stream independence, actual Clock spawning and real choice resume.
Two Victory NEW RUN cycles, one Death RETRY and additional nonterminal/Missile/Cluster native
restarts verify disposed old streams, fresh owners/APIs/five events and inert old callbacks.
Production canvas boots without DEV API or seed controls; no new runtime errors were observed.

## Assets

No production game assets are currently integrated.

The Vite demonstration assets have been removed.

Gameplay prototypes will initially use placeholders and simple geometry.

---

## Tests

Nine unit tests cover collision.ts, eight cover progression/experience.ts, six cover player/dash.ts timing/expiry partitions, seven cover enemies/shooterMovement.ts band rules, and six cover progression/selectChoices.ts size, distinctness, membership, nonmutation, controlled randomness, repeated offers and input boundaries.

Eight pure Prism eligibility cases, seven pure spread cases and seventeen focused-upgrade cases also pass, for 570 tracked tests across twenty-four files. GAME-049 preserves all483 prior cases through typed Attack fixture migration and adds71 pure combat plus16 Scene cases (174 Scene total). GAME-048 preserves all424 prior cases through real Defense fixture migration and adds35 pure Defense plus24 Scene cases (158 Scene total). GAME-047 preserves all367 prior cases and adds18 pure Tag/BuildSnapshot plus39 Scene cases (52 pure Build / 134 Scene total). GAME-046 preserves all309 prior cases and adds34 pure PlayerBuild plus24 Scene cases (95 Scene cases total). GAME-045 preserves all 264 prior cases and adds 35 pure diagnostics plus 10 actual Scene integration cases. All 223 pre-GAME-044 cases remain, including 21 pure RunRandom and 17 Scene RNG cases; GAME-044 adds 11 lifecycle, 17 keyboard and 13 Scene integration cases. Coverage includes five Replication radius cases, six Spatial radius cases, eight Cluster eligibility cases, six Cluster geometry cases, eight Twin eligibility cases and twenty-four evolution-offer cases. Fourteen Warden schedule/phase/burst cases cover spawn30, HP60/31/30/1/0, normalized world-angle bursts and deterministic independent outputs. Seven Elite schedule cases cover Tank6/12/18/24, non-Tanks and deterministic input stability. Real-browser scene validation covers rank caps, next-pause offers, volley/snapshot behavior and two native RETRY cycles restoring five gameplay timers.

Vitest is installed and configured.

Tests should be introduced when meaningful game logic appears.

Do not create meaningless placeholder tests only to increase test count.

---

## Known Non-Blocking Warnings

### AudioContext

Browser may warn that Web Audio cannot start before user interaction.

This is expected browser behavior.

Audio is not implemented yet.

### Bundle Size

The production bundle currently produces a Vite warning because Phaser makes the JavaScript chunk larger than 500 kB.

This is not currently considered a problem.

Do not optimize bundle splitting before there is a demonstrated need.

---

## Current Architectural Complexity

Intentionally minimal.

Not implemented:

- ECS
- global event bus
- dependency injection
- platform abstraction
- save abstraction
- content pipeline
- asset manifest
- DevTools framework
- code graph integration

These should only be introduced when real project requirements justify them.

---

## Next Step

The placeholder arena, bounded desktop movement, camera follow, repeated enemy spawning/chase, nearest-enemy targeting and Laser projectile impacts with enemy damage/death are implemented and browser-verified.

GAME-001 through GAME-039 and GAME-042/043/044/045/046/047/048/049/050/051/052/053/054/055/056 are complete. GAME-040/041 are SUPERSEDED. GATE A PASSED — Runtime Foundation approved; GAME-056 DONE; GAME-057+ remain BACKLOG pending separate definition. GATE C remains unapproved. GATE B PASSED — Modern Combat on Legacy Spawning architect-approved.

---

## Current Playable State

The application boots successfully.

The player can move the ship, outrun Chasers and slow durable Tanks, approach ranged Shooters and automatically launch moving Laser projectiles toward the current nearest target of any type. Base/Prism/Scatter/Repeater shots disappear on impact; Lance alone penetrates bounded distinct targets. Baseline Chasers require three hits, Shooters two and Tanks six, fewer after damage upgrades. Missile automatically homes toward enemies and can damage/kill a cluster with one explosion; each enemy death still drops one pickup (regular1/Elite5/Warden10). One primary Drone, plus an opposite companion after accepting Twin, follows the ship in orbit and fires straight bolts at Drone-relative targets, independently of Laser upgrades. Spawning continues after ordinary kills; Warden defeat enters terminal Victory. Enemy contact reduces player HP with temporary protection and damage feedback; gameplay freezes at zero HP with «КОРАБЛЬ УНИЧТОЖЕН» displayed. Orange hostile projectiles can be dodged and damage the player. Clicking «ПОВТОРИТЬ» after death begins a clean new run. Warden defeat instead shows «ПОБЕДА / СТРАЖ УНИЧТОЖЕН / ДОСТИГНУТ УРОВЕНЬ / НОВЫЙ ЗАБЕГ»; NEW RUN uses native scene.restart(). The First Playable start/play/die/restart loop is complete. Killed enemies leave XP pickups that move toward the player within magnet range and are consumed on arrival. Collected values advance player XP/level state; reaching a new level freezes gameplay with three distinct choices from eligible Laser/Missile/Drone upgrades, Passive Modules and the eligible evolution offer. Each accepted choice applies its upgrade before the next pending offer; the run resumes after all pending levels and other pause reasons clear. Directional Space Dash supports short repositioning bursts without immunity. A fixed HUD shows HP, XP toward the next threshold, level and Dash cooldown throughout the run, pause and death, and resets on retry.

The First Playable milestone defined in TASK_GRAPH.md is now implemented.
