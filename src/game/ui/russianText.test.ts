import { describe, expect, it, vi } from 'vitest';
import html from '../../../index.html?raw';
import { REWARD_NAMES, UI_TEXT, rewardLabel, hudLines, dashLabel, victoryLevel } from './russianText';
import { rewardChoices, choiceIdentity, type RewardCandidateId } from '../rewards/rewardChoices';
import { PlayerBuild } from '../player/PlayerBuild';
import { laserProfile, isLaserChoice, type LaserChoice } from '../player/laserProgression';
import { LevelUpGenerator } from '../rewards/LevelUpGenerator';
import { RunRandom } from '../run/RunRandom';

const expected: [RewardCandidateId, string][] = [
  ["laser.power", "Мощность лазера"],
  ["laser.fireRate", "Темп лазера"],
  ["laser.speed", "Скорость лазера"],
  ["missile.warheadPower", "Мощность боеголовки"],
  ["missile.propulsion", "Ракетный двигатель"],
  ["missile.blastExpansion", "Радиус взрыва"],
  ["drone.boltPower", "Мощность дрона"],
  ["drone.firingSystem", "Темп дрона"],
  ["drone.boltPropulsion", "Скорость снарядов дрона"],
  ["passive.hull", "Бронепокрытие"],
  ["passive.thruster", "Маневровый двигатель"],
  ["passive.collector", "Поле сбора"],
  ["passive.combat", "Боевой процессор"],
  ["passive.spatial", "Усилитель взрыва"],
  ["passive.replication", "Матрица репликации"],
  ["prism", "ЭВОЛЮЦИЯ: Призменный лазер"],
  ["cluster", "ЭВОЛЮЦИЯ: Кассетная ракета"],
  ["twin", "ЭВОЛЮЦИЯ: Парные дроны"],
  ["laser.specialize.scatter", "Дробовой излучатель"],
  ["laser.specialize.repeater", "Скорострельный излучатель"],
  ["laser.specialize.lance", "Пробивное копьё"],
  ["laser.scatter.damage", "Усиленная дробь"],
  ["laser.scatter.focus", "Суженный веер"],
  ["laser.scatter.range", "Продлённый импульс"],
  ["laser.scatter.impact", "Отталкивающая дробь"],
  ["laser.scatter.capstone", "ВЕРШИНА: Насыщенный залп"],
  ["laser.repeater.damage", "Усилитель импульса"],
  ["laser.repeater.cadence", "Ускоренный цикл"],
  ["laser.repeater.velocity", "Быстрые импульсы"],
  ["laser.repeater.impact", "Отталкивающие импульсы"],
  ["laser.repeater.capstone", "ВЕРШИНА: Непрерывная серия"],
  ["laser.lance.damage", "Заряженное копьё"],
  ["laser.lance.velocity", "Ускоренное копьё"],
  ["laser.lance.penetration", "Сквозное пробитие"],
  ["laser.lance.radius", "Широкое копьё"],
  ["laser.lance.capstone", "ВЕРШИНА: Глубокое пробитие"],
  ["missile.specialize.guidance", "Система наведения"],
  ["missile.specialize.heavy", "Тяжёлая боеголовка"],
  ["missile.specialize.fragmentation", "Осколочная боеголовка"],
  ["missile.guidance.payload", "Точная боеголовка"],
  ["missile.guidance.propulsion", "Маневровый двигатель"],
  ["missile.guidance.fuse", "Датчик сближения"],
  ["missile.guidance.endurance", "Запас топлива"],
  ["missile.guidance.capstone", "ВЕРШИНА: Последний сигнал"],
  ["missile.heavy.payload", "Усиленный заряд"],
  ["missile.heavy.propulsion", "Тяжёлый двигатель"],
  ["missile.heavy.blast", "Объёмный взрыв"],
  ["missile.heavy.reload", "Зарядный механизм"],
  ["missile.heavy.capstone", "ВЕРШИНА: Разрушитель"],
  ["missile.fragmentation.payload", "Усиление боеголовки"],
  ["missile.fragmentation.reload", "Подача боеприпасов"],
  ["missile.fragmentation.fragments", "Сегментированный корпус"],
  ["missile.fragmentation.endurance", "Дальние осколки"],
  ["missile.fragmentation.capstone", "ВЕРШИНА: Осколочное кольцо"],
];
const descriptions: [RewardCandidateId, string][] = [
  ["laser.power", "Мощность лазера — +1 к урону"],
  ["laser.fireRate", "Темп лазера — −50 мс (минимум 100 мс)"],
  ["laser.speed", "Скорость лазера — +200 пикс/с"],
  ["missile.warheadPower", "Мощность боеголовки — ранг 1/2\n+1 к урону взрыва"],
  ["missile.propulsion", "Ракетный двигатель — ранг 1/2\n+75 пикс/с к скорости полёта"],
  ["missile.blastExpansion", "Радиус взрыва — ранг 1/2\n+30 пикс к радиусу взрыва"],
  ["drone.boltPower", "Мощность дрона — ранг 1/2\n+1 к урону снаряда"],
  ["drone.firingSystem", "Темп дрона — ранг 1/2\n−150 мс к интервалу выстрелов"],
  ["drone.boltPropulsion", "Скорость снарядов дрона — ранг 1/2\n+200 пикс/с к скорости снарядов"],
  ["passive.hull", "Бронепокрытие — ур. 1\n+1 к макс. здоровью / восстановить 1"],
  ["passive.thruster", "Маневровый двигатель — ур. 1\n+30 пикс/с к обычному движению"],
  ["passive.collector", "Поле сбора — ур. 1\n+40 пикс к радиусу притяжения опыта"],
  ["passive.combat", "Боевой процессор — ур. 1\n+0,25 к множителю урона оружия"],
  ["passive.spatial", "Усилитель взрыва — ур. 1\n+15 пикс к радиусу взрыва ракет"],
  ["passive.replication", "Матрица репликации — ур. 1\n+1 пикс к радиусу снаряда дрона"],
  ["prism", "ЭВОЛЮЦИЯ: Призменный лазер\nТри луча — полный урон лазера у каждого"],
  ["cluster", "ЭВОЛЮЦИЯ: Кассетная ракета\nОсновной взрыв + 6 дополнительных взрывов"],
  ["twin", "ЭВОЛЮЦИЯ: Парные дроны\nВторой дрон напротив, синхронные выстрелы"],
];
const laserEffects: [RewardCandidateId, string][] = [
  ["laser.specialize.scatter", "Ближний веер из 3 снарядов; урон ×0,5; интервал ×1,25."],
  ["laser.specialize.repeater", "Частые выстрелы: урон ×0,4; интервал ×0,35."],
  ["laser.specialize.lance", "Урон ×2; интервал ×1,75; до 3 целей насквозь."],
  ["laser.scatter.damage", "Урон снаряда: ×0,5 → ×0,65."],
  ["laser.scatter.focus", "Шаг веера: 15° → 12°."],
  ["laser.scatter.range", "Время полёта: 500 → 650 мс."],
  ["laser.scatter.impact", "Сила отбрасывания: 300 → 400."],
  ["laser.scatter.capstone", "Снарядов в залпе: 3 → 5."],
  ["laser.repeater.damage", "Урон снаряда: ×0,4 → ×0,5."],
  ["laser.repeater.cadence", "Интервал выстрелов: ×0,35 → ×0,30."],
  ["laser.repeater.velocity", "Скорость снаряда: ×1 → ×1,2."],
  ["laser.repeater.impact", "Сила отбрасывания: 80 → 120."],
  ["laser.repeater.capstone", "Интервал выстрелов: ×0,30 → ×0,25."],
  ["laser.lance.damage", "Урон снаряда: ×2 → ×2,5."],
  ["laser.lance.velocity", "Скорость снаряда: ×1,5 → ×2."],
  ["laser.lance.penetration", "Целей насквозь: 3 → 4."],
  ["laser.lance.radius", "Радиус снаряда: 6 → 8 пикс."],
  ["laser.lance.capstone", "Целей насквозь: 4 → 5."],
  ["missile.specialize.guidance", "Самонаведение и подрыв рядом с целью; урон ×0,9, интервал ×0,85, скорость ×1,2, полёт 5 с, импульс 300"],
  ["missile.specialize.heavy", "Прямой полёт; урон ×3, интервал ×1,5, скорость ×0,75, корпус 12 пикс., радиус взрыва ×1,5, импульс 800"],
  ["missile.specialize.fragmentation", "Прямой полёт; урон ×0,75, интервал ×1,2, радиус взрыва ×0,85, импульс 300; после взрыва 4 летящих осколка"],
  ["missile.guidance.payload", "Множитель урона: 0,9 → 1,1"],
  ["missile.guidance.propulsion", "Множитель скорости: 1,2 → 1,5"],
  ["missile.guidance.fuse", "База дистанции подрыва: 64 → 80 пикс.; масштаб Инженерии и предел 75% радиуса взрыва сохраняются"],
  ["missile.guidance.endurance", "Время полёта: 5 → 6 с"],
  ["missile.guidance.capstone", "При окончании времени полёта ракета взрывается один раз; выход за границу по-прежнему удаляет её"],
  ["missile.heavy.payload", "Множитель урона: 3 → 3,5"],
  ["missile.heavy.propulsion", "Множитель скорости: 0,75 → 0,9"],
  ["missile.heavy.blast", "Множитель местного радиуса взрыва: 1,5 → 1,8; Пространственный усилитель добавляется после него"],
  ["missile.heavy.reload", "Множитель интервала: 1,5 → 1,25"],
  ["missile.heavy.capstone", "Множитель урона 4, корпус 16 пикс., импульс 1200; радиус и интервал сохраняются"],
  ["missile.fragmentation.payload", "Множитель урона основной боеголовки: 0,75 → 1; каждый осколок сохраняет 25% её урона"],
  ["missile.fragmentation.reload", "Множитель интервала: 1,2 → 1"],
  ["missile.fragmentation.fragments", "Число осколков: 4 → 6"],
  ["missile.fragmentation.endurance", "Время полёта осколков: 0,5 → 0,7 с"],
  ["missile.fragmentation.capstone", "Число осколков: 6 → 8; каждый взрывается один раз, без новых осколков"],
];
const missile = { warheadPower: 0, propulsion: 0, blastExpansion: 0 };
const drone = { boltPower: 0, firingSystem: 0, boltPropulsion: 0 };
const modules = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };

describe('Russian display boundary', () => {
  it.each(expected)('pins the independently specified name for %s', (id, name) => {
    const label = REWARD_NAMES[id];
    expect(label).toBe(name); expect(label).toMatch(/[А-Яа-яЁё]/);
    expect(label).not.toMatch(/undefined|�|\{.*\}/);
  });
  it('retains all54 canonical IDs and their order without mutable names', () => {
    expect(rewardChoices.map(choiceIdentity)).toEqual(expected.map(([id]) => id));
    expect(Object.keys(REWARD_NAMES)).toEqual(expected.map(([id]) => id));
    expect(Object.isFrozen(REWARD_NAMES)).toBe(true);
    expect(Reflect.set(REWARD_NAMES, 'laser.power', 'bad')).toBe(false);
    expect(REWARD_NAMES['laser.power']).toBe('Мощность лазера');
  });
  it.each(descriptions)('pins the full existing effect and magnitudes for %s', (id, text) => {
    expect(rewardLabel(rewardChoices.find(c => choiceIdentity(c) === id)!, missile, drone, modules)).toBe(text);
  });
  it.each(expected.slice(18))('%s retains its approved name and gains one authored effect line', (id, name) => {
    expect(rewardLabel(rewardChoices.find(c => choiceIdentity(c) === id)!, missile, drone, modules)).toBe(name + '\n' + laserEffects.find(([key]) => key === id)![1]);
    expect(name).not.toContain('\n');
  });
  it.each(descriptions.slice(3, 9))('preserves next rank1/2 then rank2/2 for %s', (id, first) => {
    const choice = rewardChoices.find(c => choiceIdentity(c) === id)!;
    expect(rewardLabel(choice, missile, drone, modules)).toBe(first);
    expect(rewardLabel(choice, { warheadPower: 1, propulsion: 1, blastExpansion: 1 },
      { boltPower: 1, firingSystem: 1, boltPropulsion: 1 }, modules)).toBe(first.replace('ранг 1/2', 'ранг 2/2'));
  });
  it.each(descriptions.slice(9, 15))('keeps passive level1 and large valid levels for %s', (id, first) => {
    const choice = rewardChoices.find(c => choiceIdentity(c) === id)!;
    const large = Object.fromEntries(Object.keys(modules).map(k => [k, 999999])) as typeof modules;
    expect(rewardLabel(choice, missile, drone, modules)).toBe(first);
    expect(rewardLabel(choice, missile, drone, large)).toBe(first.replace('ур. 1', 'ур. 1000000'));
  });
  it.each([[0, 'Рывок: ГОТОВ'], [1, 'Рывок: 0,1 с'], [100, 'Рывок: 0,1 с'],
    [101, 'Рывок: 0,2 с'], [1000, 'Рывок: 1 с'], [3000, 'Рывок: 3 с']] as const)('cooldown %s', (ms, label) => {
    expect(dashLabel(ms)).toBe(label);
  });
  it('preserves fractional Hull, integer XP/levels and safe large values', () => {
    expect(hudLines(1.125, 5.75, 2, 17, 3, 101)).toEqual([
      'Здоровье: 1,125/5,75', 'Опыт: 2/17', 'Уровень: 3', 'Рывок: 0,2 с']);
    expect(hudLines(0, 9007199254740991, 9007199254740990, 9007199254740991, 1000000, 0)).toEqual([
      'Здоровье: 0/9007199254740991', 'Опыт: 9007199254740990/9007199254740991', 'Уровень: 1000000', 'Рывок: ГОТОВ']);
    expect(victoryLevel(123456)).toBe('ДОСТИГНУТ УРОВЕНЬ: 123456');
  });
  it('reads frozen detached inputs without mutation or random consumption', () => {
    const rng = new RunRandom(42), spies = (['encounter', 'reward', 'world', 'boss'] as const).map(k => vi.spyOn(rng[k], 'next'));
    const before = JSON.stringify([missile, drone, modules, rewardChoices]);
    for (const choice of rewardChoices) rewardLabel(choice, Object.freeze(missile), Object.freeze(drone), Object.freeze(modules));
    expect(JSON.stringify([missile, drone, modules, rewardChoices])).toBe(before);
    for (const spy of spies) { expect(spy).not.toHaveBeenCalled(); spy.mockRestore(); }
    rng.dispose();
  });
  it('declares UTF-8 Russian browser metadata and approved brand', () => {
    expect(html).toContain('lang="ru"'); expect(html).toContain('charset="UTF-8"');
    expect(html).toContain('<link rel="icon" href="data:," />');
    expect(html).toContain('<title>NEBULA — Космическое выживание</title>');
    expect(UI_TEXT.heading).toBe('NEBULA — Космическое выживание');
  });
});


describe('HOMEWORK-001 authored descriptions and read-only presentation', () => {
  const transitions = [
    ['laser.specialize.scatter', 'damage', 3, 1.5],
    ['laser.specialize.repeater', 'damage', 3, 1.2],
    ['laser.specialize.lance', 'maxHits', 1, 3],
    ['laser.scatter.damage', 'damage', 1.5, 1.95],
    ['laser.scatter.focus', 'angularStep', 15, 12],
    ['laser.scatter.range', 'lifetime', 500, 650],
    ['laser.scatter.impact', 'impact', 300, 400],
    ['laser.scatter.capstone', 'pelletCount', 3, 5],
    ['laser.repeater.damage', 'damage', 1.2, 1.5],
    ['laser.repeater.cadence', 'fireInterval', 192.5, 165],
    ['laser.repeater.velocity', 'projectileSpeed', 1200, 1440],
    ['laser.repeater.impact', 'impact', 80, 120],
    ['laser.repeater.capstone', 'fireInterval', 165, 137.5],
    ['laser.lance.damage', 'damage', 6, 7.5],
    ['laser.lance.velocity', 'projectileSpeed', 1800, 2400],
    ['laser.lance.penetration', 'maxHits', 3, 4],
    ['laser.lance.radius', 'radius', 6, 8],
    ['laser.lance.capstone', 'maxHits', 4, 5],
  ] as const;
  it.each(transitions)('%s copy matches the actual local transition without applying it', (id, field, from, to) => {
    const build = new PlayerBuild(), policy = new LevelUpGenerator(), random = new RunRandom(42);
    const draws = (['encounter', 'reward', 'world', 'boss'] as const).map(k => vi.spyOn(random[k], 'next'));
    for (const upgrade of ['power', 'power', 'fireRate'] as const) build.applyLaserChoice({ kind: 'laser', upgrade }, 0);
    const choice = rewardChoices.find(c => choiceIdentity(c) === id)!;
    if (!isLaserChoice(choice) || !('branch' in choice)) throw Error('Expected Laser branch fixture');
    if (choice.kind !== 'laserSpecialization') {
      build.applyLaserChoice({ kind: 'laserSpecialization', branch: choice.branch }, 0);
      if (choice.kind === 'laserCapstone') for (const development of rewardChoices) {
        if (development.kind === 'laserDevelopment' && development.branch === choice.branch) build.applyLaserChoice(development, 0);
      }
    }
    const state = build.snapshot(), history = policy.snapshot(), candidates = JSON.stringify(rewardChoices);
    const before = laserProfile(state.laser), next = build.previewLaserChoice(choice as LaserChoice, 0).profile;
    expect(before[field]).toBeCloseTo(from); expect(next[field]).toBeCloseTo(to);
    if (id === 'laser.specialize.scatter') {
      expect(next.pelletCount).toBe(3); expect(next.fireInterval / before.fireInterval).toBeCloseTo(1.25);
    } else if (id === 'laser.specialize.repeater') expect(next.fireInterval / before.fireInterval).toBeCloseTo(.35);
    else if (id === 'laser.specialize.lance') {
      expect(next.damage / before.damage).toBe(2); expect(next.fireInterval / before.fireInterval).toBe(1.75);
    }
    const ranks = Object.freeze({ ...missile }), droneRanks = Object.freeze({ ...drone }), levels = Object.freeze({ ...modules });
    const text = rewardLabel(choice, ranks, droneRanks, levels);
    expect(text).toBe(expected.find(([key]) => key === id)![1] + '\n' + laserEffects.find(([key]) => key === id)![1]);
    expect(text.split('\n')).toHaveLength(2); expect(text).not.toMatch(/undefined|�|0\.\d/);
    expect(build.snapshot()).toEqual(state); expect(policy.snapshot()).toEqual(history);
    expect(JSON.stringify(rewardChoices)).toBe(candidates);
    expect(ranks).toEqual(missile); expect(droneRanks).toEqual(drone); expect(levels).toEqual(modules);
    for (const spy of draws) { expect(spy).not.toHaveBeenCalled(); spy.mockRestore(); }
    random.dispose(); policy.dispose(); build.dispose();
  });
});
