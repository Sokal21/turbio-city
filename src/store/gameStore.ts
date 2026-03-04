import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  createGameLoopSlice,
  createResourcesSlice,
  createMapSlice,
  createBuildingsSlice,
} from './slices';

import type { GameLoopSlice, GameLoopActions } from './slices';
import type { ResourcesSlice, ResourcesActions } from './slices';
import type { MapSlice, MapActions } from './slices';
import type { BuildingsSlice, BuildingsActions } from './slices';

// Combined store type
export type GameStore = GameLoopSlice &
  GameLoopActions &
  ResourcesSlice &
  ResourcesActions &
  MapSlice &
  MapActions &
  BuildingsSlice &
  BuildingsActions;

// Create the combined store
export const useGameStore = create<GameStore>()(
  immer((...args) => ({
    ...createGameLoopSlice(...args),
    ...createResourcesSlice(...args),
    ...createMapSlice(...args),
    ...createBuildingsSlice(...args),
  }))
);

// Non-reactive access for game loop / PixiJS
export const getGameState = () => useGameStore.getState();
export const getGameActions = () => useGameStore.getState();
