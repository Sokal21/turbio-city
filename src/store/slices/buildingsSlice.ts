import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { PlacedBuilding, PlacementMode, Resources, ProductionQueueItem } from '../types';
import { getBuildingDefinition, getBuildingLevelData } from '../../game/buildings';
import type { Buildings } from '../../game/buildings/definitions';
import type { Units } from '../../game/units/definitions';
import { getUnitLevelStats } from '../../game/units/definitions';

export interface ProductionModal {
  isOpen: boolean;
  buildingId: string | null;
}

export interface BuildingsSlice {
  buildings: Record<string, PlacedBuilding>;
  placementMode: PlacementMode | null;
  productionModal: ProductionModal;
}

export interface BuildingsActions {
  // Placement mode
  enterPlacementMode: (buildingType: keyof Buildings, level?: number) => void;
  exitPlacementMode: () => void;
  updatePlacementHover: (cellIds: string[], isValid: boolean) => void;

  // Building management
  placeBuilding: (buildingType: keyof Buildings, cellIds: string[], level?: number) => string | null;
  cancelBuilding: (buildingId: string) => Partial<Resources> | null;
  removeBuilding: (buildingId: string) => void;
  updateBuildingProgress: (buildingId: string, progress: number) => void;
  activateBuilding: (buildingId: string) => void;
  upgradeBuilding: (buildingId: string) => boolean;

  // Production queue (for unit buildings)
  queueUnitProduction: (buildingId: string, unitType: keyof Units, unitLevel: number) => boolean;
  updateProductionProgress: (buildingId: string, progress: number) => void;
  completeProduction: (buildingId: string) => ProductionQueueItem | null;
  cancelProduction: (buildingId: string, index: number) => Partial<Resources> | null;

  // Queries
  getBuildingAt: (cellId: string) => PlacedBuilding | undefined;
  getBuildingById: (buildingId: string) => PlacedBuilding | undefined;
  isCellOccupied: (cellId: string) => boolean;
  getActiveBuildings: () => PlacedBuilding[];
  getConstructingBuildings: () => PlacedBuilding[];
  getUnitBuildings: () => PlacedBuilding[];
  getResourceBuildings: () => PlacedBuilding[];
  getBuildingsWithProduction: () => PlacedBuilding[];

  // Production modal
  openProductionModal: (buildingId: string) => void;
  closeProductionModal: () => void;

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
  productionModal: { isOpen: false, buildingId: null },

  // Placement mode actions
  enterPlacementMode: (buildingType, level = 1) => {
    const definition = getBuildingDefinition(buildingType);
    if (!definition) return;

    set((state) => {
      state.placementMode = {
        active: true,
        buildingType,
        buildingLevel: level,
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
  placeBuilding: (buildingType, cellIds, level = 1) => {
    const definition = getBuildingDefinition(buildingType);
    if (!definition) return null;

    const state = get();

    // Check if player can afford
    const cost = definition.baseCost;
    if (!state.canAfford(cost.money || 0, cost.bullets || 0)) {
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
    state.spendResources(cost.money || 0, cost.bullets || 0);

    // Create building
    const buildingId = generateBuildingId();
    const building: PlacedBuilding = {
      id: buildingId,
      type: buildingType,
      level,
      cellIds,
      status: 'constructing',
      constructionProgress: 0,
      constructionTotal: definition.buildTime,
      originalCost: { ...cost },
      productionQueue: [],
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
    get().addResources(refund.money || 0, refund.bullets || 0);

    // Remove building
    set((state) => {
      delete state.buildings[buildingId];
    });

    return refund;
  },

  removeBuilding: (buildingId) => {
    set((state) => {
      delete state.buildings[buildingId];
    });
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

  upgradeBuilding: (buildingId) => {
    const { buildings } = get();
    const building = buildings[buildingId];

    if (!building || building.status !== 'active') return false;

    const definition = getBuildingDefinition(building.type);
    const nextLevel = building.level + 1;
    const nextLevelData = getBuildingLevelData(building.type, nextLevel);

    if (!nextLevelData || !nextLevelData.upgradeCost) return false;

    const state = get();
    const cost = nextLevelData.upgradeCost;

    // Check if player can afford
    if (!state.canAfford(cost.money || 0, cost.bullets || 0)) {
      return false;
    }

    // Spend resources
    state.spendResources(cost.money || 0, cost.bullets || 0);

    // Replace building with upgraded version
    set((s) => {
      s.buildings[buildingId] = {
        ...building,
        level: nextLevel,
        status: 'constructing',
        constructionProgress: 0,
        constructionTotal: definition.buildTime,
        originalCost: { ...cost },
        productionQueue: [], // Clear queue on upgrade
      };
    });

    return true;
  },

  // Production queue management
  queueUnitProduction: (buildingId, unitType, unitLevel) => {
    const { buildings } = get();
    const building = buildings[buildingId];

    if (!building || building.status !== 'active') return false;

    const definition = getBuildingDefinition(building.type);
    if (definition.category !== 'units') return false;

    // Check if building can produce this unit at this level
    const levelData = getBuildingLevelData(building.type, building.level);
    if (!levelData?.produces) return false;

    const canProduce = levelData.produces.some(
      (p: { unit: keyof Units; maxUnitLevel: number }) => p.unit === unitType && unitLevel <= p.maxUnitLevel
    );
    if (!canProduce) return false;

    // Get unit cost
    const unitStats = getUnitLevelStats(unitType, unitLevel);
    if (!unitStats) return false;

    const state = get();
    const cost = unitStats.cost;

    // Check if player can afford
    if (!state.canAfford(cost.money || 0, cost.bullets || 0)) {
      return false;
    }

    // Spend resources
    state.spendResources(cost.money || 0, cost.bullets || 0);

    // Add to queue
    const queueItem: ProductionQueueItem = {
      unitType,
      unitLevel,
      progress: 0,
      total: unitStats.buildTime,
    };

    set((s) => {
      s.buildings[buildingId].productionQueue.push(queueItem);
    });

    return true;
  },

  updateProductionProgress: (buildingId, progress) => {
    set((state) => {
      const building = state.buildings[buildingId];
      if (building && building.productionQueue.length > 0) {
        building.productionQueue[0].progress = progress;
      }
    });
  },

  completeProduction: (buildingId) => {
    const { buildings } = get();
    const building = buildings[buildingId];

    if (!building || building.productionQueue.length === 0) return null;

    const completedItem = { ...building.productionQueue[0] };

    set((state) => {
      state.buildings[buildingId].productionQueue.shift();
    });

    return completedItem;
  },

  cancelProduction: (buildingId, index) => {
    const { buildings } = get();
    const building = buildings[buildingId];

    if (!building || !building.productionQueue[index]) return null;

    const item = building.productionQueue[index];
    const unitStats = getUnitLevelStats(item.unitType, item.unitLevel);
    if (!unitStats) return null;

    const refund = { ...unitStats.cost };

    // Refund resources
    get().addResources(refund.money || 0, refund.bullets || 0);

    // Remove from queue
    set((state) => {
      state.buildings[buildingId].productionQueue.splice(index, 1);
    });

    return refund;
  },

  // Queries
  getBuildingAt: (cellId) => {
    const { buildings } = get();
    return Object.values(buildings).find((b) => b.cellIds.includes(cellId));
  },

  getBuildingById: (buildingId) => {
    const { buildings } = get();
    return buildings[buildingId];
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

  getUnitBuildings: () => {
    const { buildings } = get();
    return Object.values(buildings).filter((b) => {
      const def = getBuildingDefinition(b.type);
      return def.category === 'units' && b.status === 'active';
    });
  },

  getResourceBuildings: () => {
    const { buildings } = get();
    return Object.values(buildings).filter((b) => {
      const def = getBuildingDefinition(b.type);
      return def.category === 'resources' && b.status === 'active';
    });
  },

  getBuildingsWithProduction: () => {
    const { buildings } = get();
    return Object.values(buildings).filter(
      (b) => b.status === 'active' && b.productionQueue.length > 0
    );
  },

  // Production modal
  openProductionModal: (buildingId) => {
    set((state) => {
      state.productionModal = { isOpen: true, buildingId };
    });
  },

  closeProductionModal: () => {
    set((state) => {
      state.productionModal = { isOpen: false, buildingId: null };
    });
  },

  resetBuildings: () => {
    buildingIdCounter = 0;
    set((state) => {
      state.buildings = {};
      state.placementMode = null;
      state.productionModal = { isOpen: false, buildingId: null };
    });
  },
});
