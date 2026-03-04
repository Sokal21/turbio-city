import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { PlacedBuilding, PlacementMode, Resources } from '../types';
import { getBuildingDefinition } from '../../game/buildings';

export interface BuildingsSlice {
  buildings: Record<string, PlacedBuilding>;
  placementMode: PlacementMode | null;
}

export interface BuildingsActions {
  // Placement mode
  enterPlacementMode: (buildingType: string) => void;
  exitPlacementMode: () => void;
  updatePlacementHover: (cellIds: string[], isValid: boolean) => void;

  // Building management
  placeBuilding: (buildingType: string, cellIds: string[]) => string | null;
  cancelBuilding: (buildingId: string) => Resources | null;
  updateBuildingProgress: (buildingId: string, progress: number) => void;
  activateBuilding: (buildingId: string) => void;

  // Queries
  getBuildingAt: (cellId: string) => PlacedBuilding | undefined;
  isCellOccupied: (cellId: string) => boolean;
  getActiveBuildings: () => PlacedBuilding[];
  getConstructingBuildings: () => PlacedBuilding[];

  // Reset
  resetBuildings: () => void;
}

let buildingIdCounter = 0;

function generateBuildingId(): string {
  return `building_${++buildingIdCounter}`;
}

export const createBuildingsSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  BuildingsSlice & BuildingsActions
> = (set, get) => ({
  buildings: {},
  placementMode: null,

  // Placement mode actions
  enterPlacementMode: (buildingType) => {
    const definition = getBuildingDefinition(buildingType);
    if (!definition) return;

    set((state) => {
      state.placementMode = {
        active: true,
        buildingType,
        hoveredCells: [],
        isValid: false,
      };
    });
  },

  exitPlacementMode: () => {
    set((state) => {
      state.placementMode = null;
    });
  },

  updatePlacementHover: (cellIds, isValid) => {
    set((state) => {
      if (state.placementMode) {
        state.placementMode.hoveredCells = cellIds;
        state.placementMode.isValid = isValid;
      }
    });
  },

  // Building management
  placeBuilding: (buildingType, cellIds) => {
    const definition = getBuildingDefinition(buildingType);
    if (!definition) return null;

    const state = get();

    // Check if player can afford
    const cost = definition.baseCost;
    if (!state.canAfford(cost.money, cost.bullets)) {
      return null;
    }

    // Check if all cells are owned by player and not occupied
    for (const cellId of cellIds) {
      if (!state.isCellOwned(cellId, 'player')) {
        return null;
      }
      if (state.isCellOccupied(cellId)) {
        return null;
      }
    }

    // Spend resources
    state.spendResources(cost.money, cost.bullets);

    // Create building
    const buildingId = generateBuildingId();
    const building: PlacedBuilding = {
      id: buildingId,
      type: buildingType,
      cellIds,
      status: 'constructing',
      constructionProgress: 0,
      constructionTotal: definition.buildTime,
      originalCost: { ...cost },
    };

    set((s) => {
      s.buildings[buildingId] = building;
      s.placementMode = null; // Exit placement mode
    });

    return buildingId;
  },

  cancelBuilding: (buildingId) => {
    const { buildings } = get();
    const building = buildings[buildingId];

    if (!building) return null;

    // Get refund (full refund)
    const refund = { ...building.originalCost };

    // Refund resources
    get().addResources(refund.money, refund.bullets);

    // Remove building
    set((state) => {
      delete state.buildings[buildingId];
    });

    return refund;
  },

  updateBuildingProgress: (buildingId, progress) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (building && building.status === 'constructing') {
        building.constructionProgress = progress;
      }
    });
  },

  activateBuilding: (buildingId) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (building) {
        building.status = 'active';
      }
    });
  },

  // Queries
  getBuildingAt: (cellId) => {
    const { buildings } = get();
    return Object.values(buildings).find((b) => b.cellIds.includes(cellId));
  },

  isCellOccupied: (cellId) => {
    const { buildings } = get();
    return Object.values(buildings).some((b) => b.cellIds.includes(cellId));
  },

  getActiveBuildings: () => {
    const { buildings } = get();
    return Object.values(buildings).filter((b) => b.status === 'active');
  },

  getConstructingBuildings: () => {
    const { buildings } = get();
    return Object.values(buildings).filter((b) => b.status === 'constructing');
  },

  resetBuildings: () => {
    buildingIdCounter = 0;
    set((state) => {
      state.buildings = {};
      state.placementMode = null;
    });
  },
});
