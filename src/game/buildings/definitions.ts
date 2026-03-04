import type { BuildingDefinition } from '../../store/types';

export interface Buildings {
  bunker_droga: BuildingDefinition;
  cocina_de_merca: BuildingDefinition;
  armeria: BuildingDefinition;
  villa_miseria: BuildingDefinition;
}

// Building definitions - static data
export const BUILDING_DEFINITIONS: Buildings = {
  bunker_droga: {
    type: 'bunker_droga',
    name: 'Bunker de Droga',
    description: 'Genera dinero cada segundo',
    size: { width: 1, height: 1 },
    category: 'resources',
    baseCost: { money: 500 },
    buildTime: 10,
    levels: [
      { level: 1, production: { money: 5 }, upgradeCost: null },
      { level: 2, production: { money: 12 }, upgradeCost: { money: 800 } },
      { level: 3, production: { money: 25 }, upgradeCost: { money: 2000 } },
    ],
  },
  cocina_de_merca: {
    type: 'cocina_de_merca',
    name: 'Cocina de Merca',
    description: 'Genera dinero cada segundo',
    size: { width: 2, height: 2 },
    category: 'resources',
    baseCost: { money: 1000 },
    buildTime: 25,
    levels: [
      { level: 1, production: { money: 15 }, upgradeCost: null },
      { level: 2, production: { money: 35 }, upgradeCost: { money: 2000 } },
      { level: 3, production: { money: 60 }, upgradeCost: { money: 5000 } },
    ],
  },
  armeria: {
    type: 'armeria',
    name: 'Armeria',
    description: 'Genera municiones cada segundo',
    size: { width: 1, height: 1 },
    category: 'resources',
    baseCost: { money: 1000 },
    buildTime: 25,
    levels: [
      { level: 1, production: { bullets: 10 }, upgradeCost: null },
      { level: 2, production: { bullets: 25 }, upgradeCost: { money: 1500 } },
      { level: 3, production: { bullets: 50 }, upgradeCost: { money: 4000 } },
    ],
  },
  villa_miseria: {
    type: 'villa_miseria',
    name: 'Villa Miseria',
    description: 'Recluta soldaditos',
    size: { width: 2, height: 2 },
    category: 'units',
    baseCost: { money: 300 },
    buildTime: 15,
    levels: [
      { level: 1, produces: [{ unit: 'soldadito', maxUnitLevel: 1 }], upgradeCost: null },
      { level: 2, produces: [{ unit: 'soldadito', maxUnitLevel: 2 }], upgradeCost: { money: 600 } },
      { level: 3, produces: [{ unit: 'soldadito', maxUnitLevel: 3 }], upgradeCost: { money: 1500 } },
    ],
  },
};

/**
 * Get a building definition by type
 */
export function getBuildingDefinition(type: keyof Buildings): BuildingDefinition {
  return BUILDING_DEFINITIONS[type];
}

/**
 * Get building level data
 */
export function getBuildingLevelData(type: keyof Buildings, level: number) {
  const definition = BUILDING_DEFINITIONS[type];
  if (!definition) return null;
  return definition.levels.find((l) => l.level === level) || null;
}

/**
 * Get max level for a building type
 */
export function getBuildingMaxLevel(type: keyof Buildings): number {
  const definition = BUILDING_DEFINITIONS[type];
  if (!definition || definition.levels.length === 0) return 0;
  return Math.max(...definition.levels.map((l) => l.level));
}

/**
 * Get all building definitions
 */
export function getAllBuildingDefinitions(): BuildingDefinition[] {
  return Object.values(BUILDING_DEFINITIONS);
}

/**
 * Check if a building type exists
 */
export function buildingExists(type: string): type is keyof Buildings {
  return type in BUILDING_DEFINITIONS;
}
