// Shared store types

import type { Buildings } from '../game/buildings/definitions';
import type { Units } from '../game/units/definitions';

export interface Resources {
  money: number;
  bullets: number;
}

// Production entry for unit-producing buildings
export interface UnitProductionEntry {
  unit: keyof Units;
  maxUnitLevel: number;
}

// Building level definition (static)
export interface BuildingLevel {
  level: number;
  // For resource buildings
  production?: Partial<Resources>;
  // For unit buildings
  produces?: UnitProductionEntry[];
  // Upgrade cost to reach this level (null for level 1)
  upgradeCost: Partial<Resources> | null;
}

// Building definition (static, from definitions file)
export interface BuildingDefinition {
  type: keyof Buildings;
  name: string;
  description: string;
  size: { width: number; height: number };
  category: 'resources' | 'units';
  baseCost: Partial<Resources>;
  buildTime: number; // ticks
  levels: BuildingLevel[];
}

// Production queue item (for unit-producing buildings)
export interface ProductionQueueItem {
  unitType: keyof Units;
  unitLevel: number;
  progress: number;
  total: number; // buildTime from unit definition
}

// Placed building (in game state)
export interface PlacedBuilding {
  id: string;
  type: keyof Buildings;
  level: number; // baked in at placement/upgrade
  cellIds: string[]; // cells it occupies
  status: 'constructing' | 'active';
  constructionProgress: number; // 0 to constructionTotal
  constructionTotal: number; // total ticks needed
  originalCost: Partial<Resources>; // for refund on cancel
  // Unit buildings only
  productionQueue: ProductionQueueItem[];
}

// Placement mode state
export interface PlacementMode {
  active: boolean;
  buildingType: keyof Buildings | null;
  buildingLevel: number;
  hoveredCells: string[];
  isValid: boolean;
}

// Cell owner types
export type CellOwner = 'player' | 'rival' | 'neutral';
