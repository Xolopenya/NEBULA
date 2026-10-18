import { describe, expect, it, vi } from 'vitest';
import sourceText from './EnemyDefinitions.ts?raw';
import { ENEMY_DEFINITIONS as definitions, ELITE_TANK_PROFILE, LEGACY_NEUTRAL_SCALING_PROFILE,
  DEFAULT_ENEMY_SPAWN_CONTEXT as base, createEnemySpawnSnapshot as spawn,
  type EnemyDefinition, type EnemySpawnContext } from './EnemyDefinitions';

const elite: EnemySpawnContext = { scalingProfile: LEGACY_NEUTRAL_SCALING_PROFILE, variant: 'ELITE_TANK' };
const copy = (kind: keyof typeof definitions = 'chaser') => structuredClone(definitions[kind]);
const invalid = (value: unknown, ...context: [unknown?]) => () => spawn(value as EnemyDefinition, (context.length ? context[0] : base) as EnemySpawnContext);

describe('authored enemy spawn values', () => {
  it('contains exactly six definitions with the four legacy values and one fixed Elite override', () => {
    expect(definitions).toEqual({
      swarm: { archetype: 'swarm', maxHealth: 1, collisionRadius: 12, contactDamage: 1, xpValue: 1,
        interaction: { knockbackResponse: 1.5, decoySusceptible: true }, movement: { kind: 'PURSUIT', speed: 240 } },
      charger: { archetype: 'charger', maxHealth: 4, collisionRadius: 22, contactDamage: 1, xpValue: 1,
        interaction: { knockbackResponse: 0.75, decoySusceptible: true },
        movement: { kind: 'CHARGER', speed: 110, triggerRange: 350, windupMs: 650, chargeSpeed: 650, chargeMs: 500, recoveryMs: 800 } },
      chaser: { archetype: 'chaser', maxHealth: 3, collisionRadius: 24, contactDamage: 1, xpValue: 1,
        interaction: { knockbackResponse: 1, decoySusceptible: true },
        movement: { kind: 'PURSUIT', speed: 180 } },
      shooter: { archetype: 'shooter', maxHealth: 2, collisionRadius: 24, contactDamage: 1, xpValue: 1,
        interaction: { knockbackResponse: 1, decoySusceptible: true },
        movement: { kind: 'SHOOTER_BAND', speed: 140, minimumRange: 350, maximumRange: 500 } },
      tank: { archetype: 'tank', maxHealth: 6, collisionRadius: 24, contactDamage: 1, xpValue: 1,
        interaction: { knockbackResponse: 0.25, decoySusceptible: true },
        movement: { kind: 'PURSUIT', speed: 100 } },
      boss: { archetype: 'boss', maxHealth: 60, collisionRadius: 40, contactDamage: 2, xpValue: 10,
        interaction: { knockbackResponse: 0.05, decoySusceptible: false },
        movement: { kind: 'WARDEN_PURSUIT', speed: 70, phaseTwoSpeed: 100 } },
    });
    expect(ELITE_TANK_PROFILE).toEqual({ maxHealth: 18, speed: 120, contactDamage: 2, xpValue: 5,
      interaction: { knockbackResponse: 0.125, decoySusceptible: true } });
    expect(base).toEqual({ scalingProfile: { kind: 'LEGACY_NEUTRAL' }, variant: 'BASE' });
  });
  it.each(Object.keys(definitions) as Array<keyof typeof definitions>)('%s BASE copies neutral values into distinct frozen records', kind => {
    const a = spawn(definitions[kind], base), b = spawn(definitions[kind], base);
    expect(a).toEqual({ ...definitions[kind], isElite: false });
    expect(b).toEqual(a); expect(b).not.toBe(a); expect(b.movement).not.toBe(a.movement);
    expect(a.movement).not.toBe(definitions[kind].movement);
    expect(a.interaction).not.toBe(definitions[kind].interaction); expect(a.interaction).not.toBe(b.interaction);
    expect(Object.keys(a).sort()).toEqual(['archetype', 'maxHealth', 'collisionRadius', 'contactDamage', 'xpValue', 'movement', 'interaction', 'isElite'].sort());
    expect(Object.isFrozen(a) && Object.isFrozen(a.movement) && Object.isFrozen(a.interaction)).toBe(true);
    expect(() => Object.assign(a, { maxHealth: 99 })).toThrow(TypeError);
    expect(() => Object.assign(a.movement, { speed: 99 })).toThrow(TypeError);
  });
  it('applies only fixed Tank overrides, retaining the supplied body radius', () => {
    expect(spawn(definitions.tank, elite)).toEqual({ archetype: 'tank', isElite: true,
      maxHealth: 18, collisionRadius: 24, contactDamage: 2, xpValue: 5, interaction: { knockbackResponse: 0.125, decoySusceptible: true }, movement: { kind: 'PURSUIT', speed: 120 } });
    expect(spawn({ ...definitions.tank, collisionRadius: 12.5 }, elite).collisionRadius).toBe(12.5);
  });
  it.each(['swarm', 'chaser', 'charger', 'shooter', 'boss'] as const)('%s cannot use Elite Tank', kind => {
    expect(invalid(definitions[kind], elite)).toThrow(RangeError);
  });
  it('freezes every authored layer without freezing or retaining callers', () => {
    for (const value of [definitions, ...Object.values(definitions), ...Object.values(definitions).map(d => d.movement),
      ELITE_TANK_PROFILE, LEGACY_NEUTRAL_SCALING_PROFILE, base, base.scalingProfile]) expect(Object.isFrozen(value)).toBe(true);
    const source = { ...definitions.tank, movement: { ...definitions.tank.movement } };
    const context = { scalingProfile: { kind: 'LEGACY_NEUTRAL' as const }, variant: 'BASE' as const };
    const old = spawn(source, context);
    Object.assign(source, { maxHealth: 9 }); Object.assign(source.movement, { speed: 125 });
    expect(old).toEqual({ ...definitions.tank, isElite: false });
    expect(spawn(source, context)).toMatchObject({ maxHealth: 9, movement: { speed: 125 } });
    expect(Object.isFrozen(source) || Object.isFrozen(source.movement) || Object.isFrozen(context)).toBe(false);
    Object.assign(context.scalingProfile, { kind: 'FUTURE' });
    expect(invalid(source, context)).toThrow(RangeError); expect(old.maxHealth).toBe(6);
  });
  it('has no ambient RNG or Phaser/game-owner dependency', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw Error('RNG'); });
    try {
      for (const definition of Object.values(definitions)) spawn(definition, base);
      expect(random).not.toHaveBeenCalled();
      expect(sourceText).not.toMatch(/\b(?:import|require|Math\.random|Phaser|RunRandom|PlayerBuild|RunDiagnostics)\b/);
    } finally { random.mockRestore(); }
  });
});

describe('exact shape and numeric rejection before snapshot publication', () => {
  it.each([null, undefined, [], 0, 'chaser', {}, { ...copy(), extra: 1 }, { ...copy(), isElite: false },
    { ...copy(), archetype: 'WARDEN' }, { ...copy(), archetype: 'sniper' },
    { ...copy(), movement: { kind: 'WARDEN_PURSUIT', speed: 1, phaseTwoSpeed: 2 } },
    { ...copy(), movement: { kind: 'PURSUIT', speed: 1, extra: 2 } },
    { ...copy(), movement: { kind: 'NOPE', speed: 1 } },
    { ...copy('boss'), movement: { kind: 'PURSUIT', speed: 70 } },
    { ...copy('shooter'), movement: { kind: 'PURSUIT', speed: 140 } },
    { ...copy('shooter'), movement: { kind: 'SHOOTER_BAND', speed: 140, minimumRange: 350 } },
  ])('rejects malformed definition %#', value => { expect(invalid(value)).toThrow(RangeError); });
  it.each(['archetype', 'maxHealth', 'collisionRadius', 'contactDamage', 'xpValue', 'movement', 'interaction'])('rejects missing %s', key => {
    const value = { ...copy() } as Record<string, unknown>; delete value[key]; expect(invalid(value)).toThrow(RangeError);
  });
  it.each([undefined, null, [], {}, 'BASE', { variant: 'BASE' }, { scalingProfile: { kind: 'LEGACY_NEUTRAL' } },
    { ...base, variant: 'ELITE' }, { ...base, extra: 1 }, { ...base, scalingProfile: undefined },
    { ...base, scalingProfile: { kind: 'FUTURE' } }, { ...base, scalingProfile: { kind: 'LEGACY_NEUTRAL', multiplier: 1 } },
    { ...base, scalingProfile: [] }, { ...base, scalingProfile: {} },
  ])('requires exact explicit neutral context %#', context => { expect(invalid(copy(), context)).toThrow(RangeError); });
  it('does not silently default an omitted context', () => {
    expect(() => spawn(copy(), undefined as unknown as EnemySpawnContext)).toThrow(RangeError);
  });
  const badNumbers = [NaN, Infinity, -Infinity, undefined, null, '1', true, 0, -1, Number.MAX_SAFE_INTEGER + 1];
  const numericalFields = ['maxHealth', 'collisionRadius', 'contactDamage', 'xpValue',
    'speed', 'phaseTwoSpeed', 'minimumRange', 'maximumRange'] as const;
  it.each(numericalFields.flatMap(field => badNumbers.map(value => ({ field, value }))))('rejects $field=$value', ({ field, value }) => {
    const definition = copy(field === 'phaseTwoSpeed' ? 'boss' : field.includes('Range') ? 'shooter' : 'chaser');
    const target = ['speed', 'phaseTwoSpeed', 'minimumRange', 'maximumRange'].includes(field) ? definition.movement : definition;
    Object.assign(target, { [field]: value }); expect(invalid(definition)).toThrow(RangeError);
  });
  it.each([0.5, 1.1, -0.5])('rejects fractional XP %s', xpValue => {
    expect(invalid({ ...copy(), xpValue })).toThrow(RangeError);
  });
  it.each([[350, 350], [500, 350]])('rejects Shooter band %s..%s', (minimumRange, maximumRange) => {
    expect(invalid({ ...definitions.shooter, movement: { ...definitions.shooter.movement, minimumRange, maximumRange } })).toThrow(RangeError);
  });
  it('preserves valid fractions and safe bounds without rounding or neutral arithmetic', () => {
    const definition = { ...definitions.shooter, maxHealth: 0.25, collisionRadius: 0.5, contactDamage: Number.MIN_VALUE,
      xpValue: Number.MAX_SAFE_INTEGER, movement: { ...definitions.shooter.movement, speed: Number.MAX_SAFE_INTEGER,
        minimumRange: 0.75, maximumRange: Number.MAX_SAFE_INTEGER } };
    expect(spawn(definition, base)).toEqual({ ...definition, isElite: false });
    expect(spawn({ ...definitions.boss, movement: { ...definitions.boss.movement, phaseTwoSpeed: 0.125 } }, base).movement)
      .toMatchObject({ phaseTwoSpeed: 0.125 });
  });
  it('rejects symbol/nonenumerable extras and inherited/missing authored fields', () => {
    expect(invalid({ ...copy(), [Symbol('extra')]: 1 })).toThrow(RangeError);
    expect(invalid(Object.defineProperty(copy(), 'extra', { value: 1 }))).toThrow(RangeError);
    expect(invalid(Object.create(copy()))).toThrow(RangeError);
  });
  it('invalid source and incompatible context leave source and an older snapshot untouched', () => {
    const source = { ...definitions.chaser, movement: { ...definitions.chaser.movement } };
    const old = spawn(source, base); Object.assign(source, { maxHealth: NaN });
    expect(invalid(source)).toThrow(RangeError); expect(Number.isNaN(source.maxHealth)).toBe(true);
    source.maxHealth = 3; expect(invalid(source, elite)).toThrow(RangeError);
    expect(old).toEqual({ ...definitions.chaser, isElite: false }); expect(source).toEqual(definitions.chaser);
  });
});

describe('owned interaction and Charger authored validation', () => {
  it('copies mutable interaction and freezes every authored nested interaction', () => {
    for (const definition of Object.values(definitions)) expect(Object.isFrozen(definition.interaction)).toBe(true);
    expect(Object.isFrozen(ELITE_TANK_PROFILE.interaction)).toBe(true);
    const source = { ...definitions.chaser, interaction: { knockbackResponse: 1, decoySusceptible: true } };
    const old = spawn(source, base); source.interaction.knockbackResponse = 2; source.interaction.decoySusceptible = false;
    expect(old.interaction).toEqual({ knockbackResponse: 1, decoySusceptible: true });
    expect(spawn(source, base).interaction).toEqual(source.interaction);
    expect(() => Object.assign(old.interaction, { knockbackResponse: 9 })).toThrow(TypeError);
    expect(Object.isFrozen(source.interaction)).toBe(false);
  });
  it.each([0, -0, Number.MIN_VALUE, 0.125, Number.MAX_SAFE_INTEGER])('accepts explicit safe response %s', knockbackResponse => {
    expect(spawn({ ...definitions.chaser, interaction: { knockbackResponse, decoySusceptible: false } }, base).interaction)
      .toEqual({ knockbackResponse, decoySusceptible: false });
  });
  it.each([undefined, null, [], {}, { knockbackResponse: 1 }, { decoySusceptible: true },
    { knockbackResponse: 1, decoySusceptible: 1 }, { knockbackResponse: 1, decoySusceptible: true, extra: 1 },
    ...[NaN, Infinity, -Infinity, -1, Number.MAX_SAFE_INTEGER + 1, '1', null].map(knockbackResponse => ({ knockbackResponse, decoySusceptible: true }))])(
    'rejects malformed interaction %# atomically', interaction => {
      expect(invalid({ ...definitions.chaser, interaction })).toThrow(RangeError);
    });
  it('rejects symbol/hidden/inherited-only interaction and missing/extra Charger fields', () => {
    for (const interaction of [{ ...definitions.chaser.interaction, [Symbol('extra')]: 1 },
      Object.defineProperty({ ...definitions.chaser.interaction }, 'extra', { value: 1 }), Object.create(definitions.chaser.interaction)]) {
      expect(invalid({ ...definitions.chaser, interaction })).toThrow(RangeError);
    }
    for (const field of Object.keys(definitions.charger.movement)) {
      const movement = { ...definitions.charger.movement }; Reflect.deleteProperty(movement, field);
      expect(invalid({ ...definitions.charger, movement })).toThrow(RangeError);
    }
    expect(invalid({ ...definitions.charger, movement: { ...definitions.charger.movement, extra: 1 } })).toThrow(RangeError);
    expect(invalid({ ...definitions.charger, movement: definitions.chaser.movement })).toThrow(RangeError);
    expect(invalid({ ...definitions.chaser, movement: definitions.charger.movement })).toThrow(RangeError);
  });
  it.each(['speed', 'triggerRange', 'windupMs', 'chargeSpeed', 'chargeMs', 'recoveryMs'] as const)('requires positive safe Charger %s', key => {
    for (const value of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '1']) {
      expect(invalid({ ...definitions.charger, movement: { ...definitions.charger.movement, [key]: value } })).toThrow(RangeError);
    }
    expect(spawn({ ...definitions.charger, movement: { ...definitions.charger.movement, [key]: 0.125 } }, base).movement)
      .toMatchObject({ [key]: 0.125 });
  });
});
