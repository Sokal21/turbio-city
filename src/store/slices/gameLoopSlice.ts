import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import { gameLoop } from '../../game/GameLoop';

export type GameSpeed = 1 | 2 | 3;

export interface GameLoopSlice {
  tick: number;
  paused: boolean;
  speed: GameSpeed;
}

export interface GameLoopActions {
  incrementTick: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: GameSpeed) => void;
  cycleSpeed: () => void;
  resetGameLoop: () => void;
}

const SPEED_INTERVALS: Record<GameSpeed, number> = {
  1: 1000,  // 1 tick per second
  2: 500,   // 2 ticks per second
  3: 333,   // 3 ticks per second
};

export const createGameLoopSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  GameLoopSlice & GameLoopActions
> = (set, get) => ({
  tick: 0,
  paused: true,
  speed: 1,

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

  setSpeed: (speed) => {
    set((state) => {
      state.speed = speed;
    });
    gameLoop.setTickInterval(SPEED_INTERVALS[speed]);
  },

  cycleSpeed: () => {
    const currentSpeed = get().speed;
    const nextSpeed: GameSpeed = currentSpeed === 3 ? 1 : ((currentSpeed + 1) as GameSpeed);
    get().setSpeed(nextSpeed);
  },

  resetGameLoop: () => {
    set((state) => {
      state.tick = 0;
      state.paused = true;
      state.speed = 1;
    });
    gameLoop.setTickInterval(SPEED_INTERVALS[1]);
  },
});
