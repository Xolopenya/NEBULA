# NEBULA — Balance Targets

## Authority and use

Target ranges and playtest hypotheses for DESIGN-005, not current implementation
constants or final damage/HP/Threat values. [GAME_DESIGN](GAME_DESIGN.md) defines behavior;
[CONTENT_MANIFEST](CONTENT_MANIFEST.md) fixes scope; [CURRENT_STATE](CURRENT_STATE.md)
describes the prototype. Revisit hypotheses through measured playtests.

## Run and progression targets

| Measure | Initial target / hypothesis |
| --- | --- |
| Successful run | ~15–17 min |
| Ordinary Level-Ups | ~18–24 |
| First weapon specialization | ~4–6 min |
| Substantially formed build foundation | ~10–11 min |
| Weapon specialization readiness | 3 weapon-local tuning investments |
| Active specialization readiness | ~2 Active-local tuning investments |

| Stage | Approximate window |
| --- | --- |
| OPENING | 0–3 min |
| FORMATION | 3–6 min |
| ESCALATION | 6–10 min |
| MATURITY | 10–13:30 min |
| ENDGAME | 13:30 → Boss |
| BOSS | After Endgame |

Ranges guide pacing rather than exact scripted timestamps.

## Structural opportunity windows

| Opportunity | Broad target window |
| --- | --- |
| Opening grace | First ~60–90 sec without major world events; learn movement, automatic combat, XP and early Level-Ups |
| Active System Signal | ~2:30–4:30 |
| Second Combat System | ~5–7 min |
| Optional third Combat System | ~8–11 min |
| Drone Doctrine | ~5–9 min |
| Active specialization | ~7–10 min |
| First meaningful Mini-Boss | ~7–10 min |
| Boss transition | ~14–15+ min, with sensible bounded transition |

Do not force all opportunities to fire simultaneously at a shared window boundary.
Decision spacing and breathing windows must preserve readable choices.

## Boss hypotheses

Initial Juggernaut time to kill: strong build ~60–90 sec; typical successful build
~90–150 sec; weak viable build may take longer. Successful-run duration remains a
whole-run target; evaluate transition timing and Boss duration together.
Do not normalize all builds to equal Boss kill times or counter-pick their weaknesses.

## Difficulty influence and role expectations

Time/Stage dominates; Player Level contributes less; structural Build Maturity contributes
less and is hard-bounded. ~75 / 15 / 10 is conceptual tuning guidance, not a mandatory
literal formula. Build Maturity never uses live DPS or kill efficiency. Analyzer changes
offers, not pressure, item strength or enemy HP.

Initial Combat Analyzer hypothesis: limited progression, conceptually around 0–4 levels,
with diminishing returns. The exact cap and offer weights remain balance data; this is
not a hard final formula.

Prefer composition, geometry, Elite frequency, projectile pressure and multi-wave
complexity over huge late HP scaling. Scale enemy damage weakly and preserve roles:
Swarm remains fragile, Tank durable/slow without Armor, Charger committed/readable,
Sniper telegraphed, Suppressor spatial pressure, Bomber pushable, Splitter capacity-aware.
Use moderate archetype-specific stat scaling and shorter but nonzero breathing windows.

Strong builds may temporarily crush encounters. No constant rubber-banding, low-HP mercy
or hidden counter-build Director. Breadth versus depth should remain viable; late systems
get modest catch-up without matching the oldest system for free.

## Build and stat tuning boundaries

Ordinary same-stat percentages add; specialization/mechanical layers are separate where
authored. Each stat needs safe ranges/minima; invalid NaN/Infinity is an error.
Tag bands are conceptual: 0–1 interest, 2–3 secondary, 4+ primary, 6+ deep.
Core percentages and unspecified tradeoffs are not final here.
Replication conceptually reaches ~4 Combat Drones with diminishing fleet efficiency.
Medical stores one activation and has bounded healing rate.
Threat Cost, XP Value, gameplay capacity and technical hard cap are separate quantities.

## Playtest checkpoints

At every checkpoint record: enemy pressure/density; room to move; projectile pressure;
Level count; build identity; system count/depth; Active/Core state; breathing/reward pacing.

| Checkpoint | Additional question to resolve |
| --- | --- |
| 3 min | Is movement/automatic combat clear, is early XP satisfying, and is the first Active opportunity readable? |
| 6 min | Has first specialization normally formed; is second-system breadth competing with depth? |
| 10 min | Is the build foundation forming, with meaningful Active/Doctrine/Mini-Boss decisions and room to move? |
| 13 min | Does mature build identity remain readable under denser mixed pressure and optional third-system choices? |
| Boss | Are transition, normal-movement dodges, three phases, build-dependent kill time and terminal result coherent? |

Record actual outcomes before changing ranges. No final numeric damage, HP or Threat
tables are introduced by this baseline.
