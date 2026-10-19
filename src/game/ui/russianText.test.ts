import { describe, expect, it, vi } from 'vitest';
import html from '../../../index.html?raw';
import { REWARD_NAMES, UI_TEXT, rewardLabel, hudLines, dashLabel, victoryLevel } from './russianText';
import { rewardChoices, choiceIdentity, type RewardCandidateId } from '../rewards/rewardChoices';
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
const missile = { warheadPower: 0, propulsion: 0, blastExpansion: 0 };
const drone = { boltPower: 0, firingSystem: 0, boltPropulsion: 0 };
const modules = { hull: 0, thruster: 0, collector: 0, combat: 0, spatial: 0, replication: 0 };

describe('Russian display boundary', () => {
  it.each(expected)('pins the independently specified name for %s', (id, name) => {
    const label = REWARD_NAMES[id];
    expect(label).toBe(name); expect(label).toMatch(/[А-Яа-яЁё]/);
    expect(label).not.toMatch(/undefined|�|\{.*\}/);
  });
  it('retains all36 canonical IDs and their order without mutable names', () => {
    expect(rewardChoices.map(choiceIdentity)).toEqual(expected.map(([id]) => id));
    expect(Object.keys(REWARD_NAMES)).toEqual(expected.map(([id]) => id));
    expect(Object.isFrozen(REWARD_NAMES)).toBe(true);
    expect(Reflect.set(REWARD_NAMES, 'laser.power', 'bad')).toBe(false);
    expect(REWARD_NAMES['laser.power']).toBe('Мощность лазера');
  });
  it.each(descriptions)('pins the full existing effect and magnitudes for %s', (id, text) => {
    expect(rewardLabel(rewardChoices.find(c => choiceIdentity(c) === id)!, missile, drone, modules)).toBe(text);
  });
  it.each(expected.slice(18))('%s stays name-only', (id, name) => {
    expect(rewardLabel(rewardChoices.find(c => choiceIdentity(c) === id)!, missile, drone, modules)).toBe(name);
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
    expect(html).toContain('<title>NEBULA — Космическое выживание</title>');
    expect(UI_TEXT.heading).toBe('NEBULA — Космическое выживание');
  });
});
