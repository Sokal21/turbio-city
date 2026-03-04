import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameStore } from '../types';

const INITIAL_RESOURCES = {
  money: 1000,
  bullets: 100,
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // Game loop
    tick: 0,
    paused: true,

    // Resources
    resources: { ...INITIAL_RESOURCES },

    // UI
    selectedCellId: null,

    // Actions
    actions: {
      addResources: (money: number, bullets: number) => {
        set((state) => {
          state.resources.money += money;
          state.resources.bullets += bullets;
        });
      },

      spendResources: (money: number, bullets: number) => {
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

      selectCell: (cellId: string | null) => {
        set((state) => {
          state.selectedCellId = cellId;
        });
      },

      tick: () => {
        set((state) => {
          state.tick += 1;
        });
      },

      pause: () => {
        set((state) => {
          state.paused = true;
        });
      },

      resume: () => {
        set((state) => {
          state.paused = false;
        });
      },

      reset: () => {
        set((state) => {
          state.tick = 0;
          state.paused = true;
          state.resources = { ...INITIAL_RESOURCES };
          state.selectedCellId = null;
        });
      },
    },
  }))
);

// Non-reactive access for game loop / PixiJS
export const getGameState = () => useGameStore.getState();
export const getGameActions = () => useGameStore.getState().actions;
