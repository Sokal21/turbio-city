import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

export interface GameLoopSlice {
  tick: number;
  paused: boolean;
}

export interface GameLoopActions {
  incrementTick: () => void;
  pause: () => void;
  resume: () => void;
  resetGameLoop: () => void;
}

export const createGameLoopSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  GameLoopSlice & GameLoopActions
> = (set) => ({
  tick: 0,
  paused: true,

  incrementTick: () => {
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

  resetGameLoop: () => {
    set((state) => {
      state.tick = 0;
      state.paused = true;
    });
  },
});
