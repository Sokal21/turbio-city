import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

export interface PendingMovement {
  id: string;
  unitIds: string[];
  fromCellId: string;
  toCellId: string;
  ticksTotal: number;
  ticksRemaining: number;
}

export interface MovementsSlice {
  pendingMovements: PendingMovement[];
  // UI state for movement mode
  movementMode: {
    active: boolean;
    selectedUnitIds: string[];
    fromCellId: string | null;
  };
}

export interface MovementsActions {
  // Movement management
  startMovement: (unitIds: string[], fromCellId: string, toCellId: string, ticks: number) => string;
  decrementMovementCountdowns: () => PendingMovement[]; // Returns movements that reached 0
  removeMovement: (movementId: string) => void;

  // Queries
  getPendingMovementsToCell: (cellId: string) => PendingMovement[];
  getUnitsInTransit: () => string[]; // Unit IDs currently moving

  // UI state
  enterMovementMode: (fromCellId: string, unitIds: string[]) => void;
  exitMovementMode: () => void;
  toggleUnitSelection: (unitId: string) => void;

  // Reset
  resetMovements: () => void;
}

let movementIdCounter = 0;

// Starting cells (pool area) - instant movement
const POOL_CELLS = new Set([
  '4,4', '5,4', '6,4',
  '4,5', '5,5', '6,5',
  '4,6', '5,6', '6,6',
]);

/**
 * Calculate Manhattan distance between two cells
 */
export function getManhattanDistance(fromCellId: string, toCellId: string): number {
  const [x1, y1] = fromCellId.split(',').map(Number);
  const [x2, y2] = toCellId.split(',').map(Number);
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Check if movement is instant (to/from pool area)
 */
export function isInstantMovement(fromCellId: string, toCellId: string): boolean {
  return POOL_CELLS.has(fromCellId) || POOL_CELLS.has(toCellId);
}

export const createMovementsSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  MovementsSlice & MovementsActions
> = (set, get) => ({
  pendingMovements: [],
  movementMode: {
    active: false,
    selectedUnitIds: [],
    fromCellId: null,
  },

  startMovement: (unitIds, fromCellId, toCellId, ticks) => {
    const id = `movement_${++movementIdCounter}`;

    // Mark units as in transit by setting location to special value
    set((state) => {
      for (const unitId of unitIds) {
        const unit = state.units[unitId];
        if (unit) {
          unit.location = `transit:${id}`;
        }
      }

      state.pendingMovements.push({
        id,
        unitIds,
        fromCellId,
        toCellId,
        ticksTotal: ticks,
        ticksRemaining: ticks,
      });
    });

    return id;
  },

  decrementMovementCountdowns: () => {
    const completedMovements: PendingMovement[] = [];

    set((state) => {
      for (const movement of state.pendingMovements) {
        movement.ticksRemaining -= 1;
        if (movement.ticksRemaining <= 0) {
          completedMovements.push({ ...movement });
        }
      }
      // Remove completed movements
      state.pendingMovements = state.pendingMovements.filter((m) => m.ticksRemaining > 0);
    });

    return completedMovements;
  },

  removeMovement: (movementId) => {
    set((state) => {
      state.pendingMovements = state.pendingMovements.filter((m) => m.id !== movementId);
    });
  },

  getPendingMovementsToCell: (cellId) => {
    return get().pendingMovements.filter((m) => m.toCellId === cellId);
  },

  getUnitsInTransit: () => {
    const { units } = get();
    return Object.values(units)
      .filter((u) => u.location.startsWith('transit:'))
      .map((u) => u.id);
  },

  enterMovementMode: (fromCellId, unitIds) => {
    set((state) => {
      state.movementMode = {
        active: true,
        selectedUnitIds: unitIds,
        fromCellId,
      };
    });
  },

  exitMovementMode: () => {
    set((state) => {
      state.movementMode = {
        active: false,
        selectedUnitIds: [],
        fromCellId: null,
      };
    });
  },

  toggleUnitSelection: (unitId) => {
    set((state) => {
      const idx = state.movementMode.selectedUnitIds.indexOf(unitId);
      if (idx >= 0) {
        state.movementMode.selectedUnitIds.splice(idx, 1);
      } else {
        state.movementMode.selectedUnitIds.push(unitId);
      }
    });
  },

  resetMovements: () => {
    movementIdCounter = 0;
    set((state) => {
      state.pendingMovements = [];
      state.movementMode = {
        active: false,
        selectedUnitIds: [],
        fromCellId: null,
      };
    });
  },
});
