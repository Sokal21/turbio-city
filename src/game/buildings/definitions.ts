import type { BuildingDefinition } from '../../store/types';

export interface Buildings {
  bunker_droga: BuildingDefinition;
  cocina_de_merca: BuildingDefinition;
  armeria: BuildingDefinition;
}
// Building definitions - static data
// Using satisfies to preserve literal keys while validating the type
export const BUILDING_DEFINITIONS: Buildings = {
  bunker_droga: {
    type: 'bunker_droga',
    name: 'Bunker de Droga',
    description: 'Genera dinero cada segundo',
    size: { width: 1, height: 1 },
    baseCost: { money: 500, bullets: 0 },
    buildTime: 10,
    production: { money: 5, bullets: 0 },
  },
  cocina_de_merca: {
    type: 'cocina_de_merca',
    name: 'Cocina de Merca',
    description: 'Genera dinero cada segundo',
    size: { width: 2, height: 2 },
    baseCost: { money: 1000, bullets: 0 },
    buildTime: 25,
    production: { money: 15, bullets: 0 },
  },
  armeria: {
    type: 'armeria',
    name: 'Armeria',
    description: 'Genera municiones cada segundo',
    size: { width: 1, height: 1 },
    baseCost: { money: 1000, bullets: 0 },
    buildTime: 25,
    production: { bullets: 10 },
  },
};

/**
 * Get a building definition by type
 */
export function getBuildingDefinition(type: keyof Buildings): BuildingDefinition {
  return BUILDING_DEFINITIONS[type];
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
export function buildingExists(type: string): boolean {
  return type in BUILDING_DEFINITIONS;
}
