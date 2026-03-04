import type { BuildingDefinition } from '../../store/types';

// Building definitions - static data
export const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  bunker_droga: {
    type: 'bunker_droga',
    name: 'Bunker de Droga',
    description: 'Genera dinero cada segundo',
    size: { width: 1, height: 1 },
    baseCost: { money: 500, bullets: 0 },
    buildTime: 10, // 10 ticks = 10 seconds
    production: { money: 5, bullets: 0 }, // 1 money per tick when active
  },
};

/**
 * Get a building definition by type
 */
export function getBuildingDefinition(type: string): BuildingDefinition | undefined {
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
