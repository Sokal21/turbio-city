import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { UnitInstance, Units } from '../../game/units/definitions';
import { resetUnitIdCounter } from '../../game/units/definitions';

export interface UnitsSlice {
  units: Record<string, UnitInstance>;
}

export interface UnitsActions {
  // Unit management
  addUnit: (unit: UnitInstance) => void;
  removeUnit: (unitId: string) => void;

  // Location management
  moveUnitToPool: (unitId: string) => void;
  moveUnitToCell: (unitId: string, cellId: string) => void;

  // Queries
  getUnitsInPool: () => UnitInstance[];
  getUnitsAtCell: (cellId: string) => UnitInstance[];
  getAllUnits: () => UnitInstance[];
  getUnitById: (unitId: string) => UnitInstance | undefined;
  getUnitsByType: (type: keyof Units) => UnitInstance[];

  // Stats
  getTotalHeat: () => number;
  getTotalUpkeep: () => { money: number; bullets: number };
  getUnitCount: () => number;

  // Desertion (removes a random unit)
  desertUnit: () => UnitInstance | null;

  // Reset
  resetUnits: () => void;
}

export const createUnitsSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  UnitsSlice & UnitsActions
> = (set, get) => ({
  units: {},

  // Unit management
  addUnit: (unit) => {
    set((state) => {
      state.units[unit.id] = unit;
    });
  },

  removeUnit: (unitId) => {
    set((state) => {
      delete state.units[unitId];
    });
  },

  // Location management
  moveUnitToPool: (unitId) => {
    set((state) => {
      const unit = state.units[unitId];
      if (unit) {
        unit.location = 'pool';
      }
    });
  },

  moveUnitToCell: (unitId, cellId) => {
    set((state) => {
      const unit = state.units[unitId];
      if (unit) {
        unit.location = cellId;
      }
    });
  },

  // Queries
  getUnitsInPool: () => {
    const { units } = get();
    return Object.values(units).filter((u) => u.location === 'pool');
  },

  getUnitsAtCell: (cellId) => {
    const { units } = get();
    return Object.values(units).filter((u) => u.location === cellId);
  },

  getAllUnits: () => {
    const { units } = get();
    return Object.values(units);
  },

  getUnitById: (unitId) => {
    const { units } = get();
    return units[unitId];
  },

  getUnitsByType: (type) => {
    const { units } = get();
    return Object.values(units).filter((u) => u.type === type);
  },

  // Stats
  getTotalHeat: () => {
    const { units } = get();
    return Object.values(units).reduce((total, unit) => total + unit.heat, 0);
  },

  getTotalUpkeep: () => {
    const { units } = get();
    // Only units in the pool consume upkeep
    return Object.values(units).filter((u) => u.location === 'pool').reduce(
      (total, unit) => ({
        money: total.money + (unit.upkeep.money || 0),
        bullets: total.bullets + (unit.upkeep.bullets || 0),
      }),
      { money: 0, bullets: 0 }
    );
  },

  getUnitCount: () => {
    const { units } = get();
    return Object.keys(units).length;
  },

  // Desertion - removes a random unit
  // TODO: This logic will be refined later (maybe target low morale units, etc.)
  desertUnit: () => {
    const { units } = get();
    const unitIds = Object.keys(units);

    if (unitIds.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * unitIds.length);
    const randomUnitId = unitIds[randomIndex];
    const desertedUnit = { ...units[randomUnitId] };

    set((state) => {
      delete state.units[randomUnitId];
    });

    return desertedUnit;
  },

  // Reset
  resetUnits: () => {
    resetUnitIdCounter();
    set((state) => {
      state.units = {};
    });
  },
});
