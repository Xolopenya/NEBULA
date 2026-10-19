import { choiceIdentity, type LevelUpChoice, type PassiveModule, type RewardCandidateId } from '../rewards/rewardChoices';
import type { MissileRanks, DroneRanks } from '../progression/focusedUpgrade';

export const RUSSIAN_FONT = 'Arial, "Segoe UI", sans-serif';
export const UI_TEXT = Object.freeze({
  heading: 'NEBULA — Космическое выживание',
  guide: 'Движение: WASD / стрелки. Рывок: пробел. Пауза: Esc.\n'
    + 'Оружие стреляет автоматически. Собирайте опыт и выбирайте улучшения.\n'
    + 'Выживайте и победите Стража.',
  pause: 'ПАУЗА\nEsc — продолжить',
  levelUp: 'НОВЫЙ УРОВЕНЬ — ВЫБЕРИТЕ ОДНО',
  death: 'КОРАБЛЬ УНИЧТОЖЕН',
  retry: 'ПОВТОРИТЬ',
  victory: 'ПОБЕДА',
  wardenDefeated: 'СТРАЖ УНИЧТОЖЕН',
  newRun: 'НОВЫЙ ЗАБЕГ',
});

/** Presentation only. Canonical identity/order and reward authority remain in rewards/. */
export const REWARD_NAMES: Readonly<Record<RewardCandidateId, string>> = Object.freeze({
  'laser.power': 'Мощность лазера',
  'laser.fireRate': 'Темп лазера',
  'laser.speed': 'Скорость лазера',
  'missile.warheadPower': 'Мощность боеголовки',
  'missile.propulsion': 'Ракетный двигатель',
  'missile.blastExpansion': 'Радиус взрыва',
  'drone.boltPower': 'Мощность дрона',
  'drone.firingSystem': 'Темп дрона',
  'drone.boltPropulsion': 'Скорость снарядов дрона',
  'passive.hull': 'Бронепокрытие',
  'passive.thruster': 'Маневровый двигатель',
  'passive.collector': 'Поле сбора',
  'passive.combat': 'Боевой процессор',
  'passive.spatial': 'Усилитель взрыва',
  'passive.replication': 'Матрица репликации',
  prism: 'ЭВОЛЮЦИЯ: Призменный лазер',
  cluster: 'ЭВОЛЮЦИЯ: Кассетная ракета',
  twin: 'ЭВОЛЮЦИЯ: Парные дроны',
  'laser.specialize.scatter': 'Дробовой излучатель',
  'laser.specialize.repeater': 'Скорострельный излучатель',
  'laser.specialize.lance': 'Пробивное копьё',
  'laser.scatter.damage': 'Усиленная дробь',
  'laser.scatter.focus': 'Суженный веер',
  'laser.scatter.range': 'Продлённый импульс',
  'laser.scatter.impact': 'Отталкивающая дробь',
  'laser.scatter.capstone': 'ВЕРШИНА: Насыщенный залп',
  'laser.repeater.damage': 'Усилитель импульса',
  'laser.repeater.cadence': 'Ускоренный цикл',
  'laser.repeater.velocity': 'Быстрые импульсы',
  'laser.repeater.impact': 'Отталкивающие импульсы',
  'laser.repeater.capstone': 'ВЕРШИНА: Непрерывная серия',
  'laser.lance.damage': 'Заряженное копьё',
  'laser.lance.velocity': 'Ускоренное копьё',
  'laser.lance.penetration': 'Сквозное пробитие',
  'laser.lance.radius': 'Широкое копьё',
  'laser.lance.capstone': 'ВЕРШИНА: Глубокое пробитие',
});

// No rounding, grouping or parse-back into gameplay arithmetic.
function decimal(value: number): string { return String(value).replace('.', ','); }

export function dashLabel(remainingMs: number): string {
  return `Рывок: ${remainingMs > 0 ? `${decimal(Math.ceil(remainingMs / 100) / 10)} с` : 'ГОТОВ'}`;
}

export function hudLines(hull: number, maxHull: number, xp: number, threshold: number,
  level: number, cooldownMs: number): string[] {
  return [`Здоровье: ${decimal(hull)}/${decimal(maxHull)}`, `Опыт: ${xp}/${threshold}`,
    `Уровень: ${level}`, dashLabel(cooldownMs)];
}

export function victoryLevel(level: number): string { return `ДОСТИГНУТ УРОВЕНЬ: ${level}`; }

export function rewardLabel(choice: LevelUpChoice, missileRanks: Readonly<MissileRanks>,
  droneRanks: Readonly<DroneRanks>, moduleLevels: Readonly<Record<PassiveModule, number>>): string {
  const name = REWARD_NAMES[choiceIdentity(choice)];
  if ('branch' in choice) return name; // Approved name-only Laser progression controls.
  if (choice.kind === 'prism') return `${name}\nТри луча — полный урон лазера у каждого`;
  if (choice.kind === 'cluster') return `${name}\nОсновной взрыв + 6 дополнительных взрывов`;
  if (choice.kind === 'twin') return `${name}\nВторой дрон напротив, синхронные выстрелы`;
  if (choice.kind === 'laser') {
    switch (choice.upgrade) {
      case 'power': return `${name} — +1 к урону`;
      case 'fireRate': return `${name} — −50 мс (минимум 100 мс)`;
      case 'speed': return `${name} — +200 пикс/с`;
    }
  }
  if (choice.kind === 'missile') {
    const prefix = `${name} — ранг ${missileRanks[choice.upgrade] + 1}/2\n`;
    switch (choice.upgrade) {
      case 'warheadPower': return `${prefix}+1 к урону взрыва`;
      case 'propulsion': return `${prefix}+75 пикс/с к скорости полёта`;
      case 'blastExpansion': return `${prefix}+30 пикс к радиусу взрыва`;
    }
  }
  if (choice.kind === 'drone') {
    const prefix = `${name} — ранг ${droneRanks[choice.upgrade] + 1}/2\n`;
    switch (choice.upgrade) {
      case 'boltPower': return `${prefix}+1 к урону снаряда`;
      case 'firingSystem': return `${prefix}−150 мс к интервалу выстрелов`;
      case 'boltPropulsion': return `${prefix}+200 пикс/с к скорости снарядов`;
    }
  }
  const prefix = `${name} — ур. ${moduleLevels[choice.module] + 1}\n`;
  switch (choice.module) {
    case 'hull': return `${prefix}+1 к макс. здоровью / восстановить 1`;
    case 'thruster': return `${prefix}+30 пикс/с к обычному движению`;
    case 'collector': return `${prefix}+40 пикс к радиусу притяжения опыта`;
    case 'combat': return `${prefix}+0,25 к множителю урона оружия`;
    case 'spatial': return `${prefix}+15 пикс к радиусу взрыва ракет`;
    case 'replication': return `${prefix}+1 пикс к радиусу снаряда дрона`;
  }
}
