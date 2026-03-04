// Shared store types

import type { Buildings } from "../game/buildings/definitions";
export interface Resources {
  money: number;
  bullets: number;
}

// Building definition (static, from definitions file)
export interface BuildingDefinition {
  type: string;
  name: string;
  description: string;
  size: { width: number; height: number };
  baseCost: Resources;
  buildTime: number; // ticks
  production?: Partial<Resources>; // per tick when active
  prerequisites?: string[];
}

// Placed building (in game state)
export interface PlacedBuilding {
  id: string;
  type: keyof Buildings;
  cellIds: string[]; // cells it occupies
  status: 'constructing' | 'active';
  constructionProgress: number; // 0 to constructionTotal
  constructionTotal: number; // total ticks needed
  originalCost: Resources; // for refund on cancel
}

// Placement mode state
export interface PlacementMode {
  active: boolean;
  buildingType: string | null;
  hoveredCells: string[];
  isValid: boolean;
}

// Cell owner types
export type CellOwner = 'player' | 'rival' | 'neutral';
