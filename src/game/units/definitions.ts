// Unit definitions - static data

import type { Resources } from '../../store/types';

// Unit stats at a specific level
export interface UnitLevelStats {
  level: number;
  attack: number;
  defense: number;
  speed: number;
  cost: Partial<Resources>;
  upkeep: Partial<Resources>; // per tick
  heat: number;
  buildTime: number; // ticks to produce
}

// Unit definition (static, template)
export interface UnitDefinition {
  type: string;
  name: string;
  description: string;
  levels: UnitLevelStats[];
}

// Unit instance (in game state)
export interface UnitInstance {
  id: string;
  type: string;
  level: number;
  // Stats (copied from definition at creation time)
  attack: number;
  defense: number;
  speed: number;
  upkeep: Partial<Resources>;
  heat: number;
  // Location
  location: 'pool' | string; // 'pool' or cellId
}

// All unit definitions
export interface Units {
  soldadito: UnitDefinition;
}

export const UNIT_DEFINITIONS: Units = {
  soldadito: {
    type: 'soldadito',
    name: 'Soldadito',
    description: 'Unidad basica de combate',
    levels: [
      { level: 1, attack: 5, defense: 3, speed: 1, cost: { money: 50 }, upkeep: { bullets: 1 }, heat: 1, buildTime: 5 },
      { level: 2, attack: 8, defense: 5, speed: 1, cost: { money: 100 }, upkeep: { bullets: 2 }, heat: 2, buildTime: 8 },
      { level: 3, attack: 12, defense: 8, speed: 2, cost: { money: 200 }, upkeep: { bullets: 3 }, heat: 3, buildTime: 12 },
    ],
  },
};

// Helper: Get unit definition by type
export function getUnitDefinition(type: keyof Units): UnitDefinition {
  return UNIT_DEFINITIONS[type];
}

// Helper: Get level stats for a unit at specific level
export function getUnitLevelStats(type: keyof Units, level: number): UnitLevelStats | null {
  const definition = UNIT_DEFINITIONS[type];
  if (!definition) return null;

  const levelStats = definition.levels.find((l) => l.level === level);
  return levelStats || null;
}

// Helper: Create a unit instance from definition at specific level
let unitIdCounter = 0;

export function createUnitInstance(type: keyof Units, level: number, location: 'pool' | string = 'pool'): UnitInstance | null {
  const levelStats = getUnitLevelStats(type, level);
  if (!levelStats) return null;

  const definition = UNIT_DEFINITIONS[type];

  return {
    id: `unit_${++unitIdCounter}`,
    type: definition.type,
    level,
    attack: levelStats.attack,
    defense: levelStats.defense,
    speed: levelStats.speed,
    upkeep: { ...levelStats.upkeep },
    heat: levelStats.heat,
    location,
  };
}

// Helper: Reset unit ID counter (for game reset)
export function resetUnitIdCounter(): void {
  unitIdCounter = 0;
}

// Helper: Get all unit definitions
export function getAllUnitDefinitions(): UnitDefinition[] {
  return Object.values(UNIT_DEFINITIONS);
}

// Helper: Check if unit type exists
export function unitExists(type: string): type is keyof Units {
  return type in UNIT_DEFINITIONS;
}

// Helper: Get max level for a unit type
export function getUnitMaxLevel(type: keyof Units): number {
  const definition = UNIT_DEFINITIONS[type];
  if (!definition || definition.levels.length === 0) return 0;
  return Math.max(...definition.levels.map((l) => l.level));
}
