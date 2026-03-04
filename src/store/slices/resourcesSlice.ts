import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { Resources } from '../types';

const INITIAL_RESOURCES: Resources = {
  money: 1000,
  bullets: 100,
};

export interface ResourcesSlice {
  resources: Resources;
}

export interface ResourcesActions {
  addResources: (money: number, bullets: number) => void;
  spendResources: (money: number, bullets: number) => boolean;
  canAfford: (money: number, bullets: number) => boolean;
  resetResources: () => void;
}

export const createResourcesSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  ResourcesSlice & ResourcesActions
> = (set, get) => ({
  resources: { ...INITIAL_RESOURCES },

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

  resetResources: () => {
    set((state) => {
      state.resources = { ...INITIAL_RESOURCES };
    });
  },
});
