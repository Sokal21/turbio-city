import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { CellOwner } from '../types';

export interface MapSlice {
  cellOwnership: Record<string, CellOwner>;
  selectedCellId: string | null;
}

export interface MapActions {
  selectCell: (cellId: string | null) => void;
  setCellOwner: (cellId: string, owner: CellOwner) => void;
  initializePlayerCells: (cellIds: string[]) => void;
  getOwnedCells: (owner: CellOwner) => string[];
  isCellOwned: (cellId: string, owner: CellOwner) => boolean;
  resetMap: () => void;
}

export const createMapSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  MapSlice & MapActions
> = (set, get) => ({
  cellOwnership: {},
  selectedCellId: null,

  selectCell: (cellId) => {
    set((state) => {
      state.selectedCellId = cellId;
    });
  },

  setCellOwner: (cellId, owner) => {
    set((state) => {
      state.cellOwnership[cellId] = owner;
    });
  },

  initializePlayerCells: (cellIds) => {
    set((state) => {
      for (const cellId of cellIds) {
        state.cellOwnership[cellId] = 'player';
      }
    });
  },

  getOwnedCells: (owner) => {
    const { cellOwnership } = get();
    return Object.entries(cellOwnership)
      .filter(([, o]) => o === owner)
      .map(([cellId]) => cellId);
  },

  isCellOwned: (cellId, owner) => {
    const { cellOwnership } = get();
    return cellOwnership[cellId] === owner;
  },

  resetMap: () => {
    set((state) => {
      state.cellOwnership = {};
      state.selectedCellId = null;
    });
  },
});
