import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { Resources } from '../types';

const INITIAL_RESOURCES: Resources = {
  money: 1000,
  bullets: 100,
};

export interface ResourcesSlice {
  resources: Resources;
  heat: number; // Global heat from violent actions
  deficitTicks: number; // Ticks spent in deficit (upkeep > production)
}

export interface ResourcesActions {
  addResources: (money: number, bullets: number) => void;
  spendResources: (money: number, bullets: number) => boolean;
  canAfford: (money: number, bullets: number) => boolean;
  addHeat: (amount: number) => void;
  reduceHeat: (amount: number) => void;
  getGlobalHeat: () => number;
  incrementDeficitTicks: () => number; // Returns new count
  resetDeficitTicks: () => void;
  resetResources: () => void;
}

export const createResourcesSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  ResourcesSlice & ResourcesActions
> = (set, get) => ({
  resources: { ...INITIAL_RESOURCES },
  heat: 0,
  deficitTicks: 0,

  addResources: (money, bullets) => {
    set((state) => {
      state.resources.money += money;
      state.resources.bullets += bullets;
    });
  },

  spendResources: (money, bullets) => {
    const { resources } = get();
    if (resources.money >= money && resources.bullets >= bullets) {
      set((state) => {
        state.resources.money -= money;
        state.resources.bullets -= bullets;
      });
      return true;
    }
    return false;
  },

  canAfford: (money, bullets) => {
    const { resources } = get();
    return resources.money >= money && resources.bullets >= bullets;
  },

  addHeat: (amount) => {
    set((state) => {
      state.heat += amount;
    });
  },

  reduceHeat: (amount) => {
    set((state) => {
      state.heat = Math.max(0, state.heat - amount);
    });
  },

  getGlobalHeat: () => {
    return get().heat;
  },

  incrementDeficitTicks: () => {
    let newCount = 0;
    set((state) => {
      state.deficitTicks += 1;
      newCount = state.deficitTicks;
    });
    return newCount;
  },

  resetDeficitTicks: () => {
    set((state) => {
      state.deficitTicks = 0;
    });
  },

  resetResources: () => {
    set((state) => {
      state.resources = { ...INITIAL_RESOURCES };
      state.heat = 0;
      state.deficitTicks = 0;
    });
  },
});
