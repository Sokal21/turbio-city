import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

export interface PendingAttack {
  id: string;
  attackerId: 'police'; // Future: gang_id
  targetCellId: string;
  ticksRemaining: number;
  notified: boolean;
  attackPower: number;
}

export interface AttacksSlice {
  pendingAttacks: PendingAttack[];
}

export interface AttacksActions {
  addPendingAttack: (attack: Omit<PendingAttack, 'id'>) => string;
  removePendingAttack: (attackId: string) => void;
  decrementAttackCountdowns: () => PendingAttack[]; // Returns attacks that reached 0
  notifyAttack: (attackId: string) => void;
  getPendingAttacksOnCell: (cellId: string) => PendingAttack[];
  getActiveAttackCount: (attackerId?: string) => number;
  resetAttacks: () => void;
}

let attackIdCounter = 0;

export const createAttacksSlice: StateCreator<
  GameStore,
  [['zustand/immer', never]],
  [],
  AttacksSlice & AttacksActions
> = (set, get) => ({
  pendingAttacks: [],

  addPendingAttack: (attack) => {
    const id = `attack_${++attackIdCounter}`;
    set((state) => {
      state.pendingAttacks.push({ ...attack, id });
    });
    return id;
  },

  removePendingAttack: (attackId) => {
    set((state) => {
      state.pendingAttacks = state.pendingAttacks.filter((a) => a.id !== attackId);
    });
  },

  decrementAttackCountdowns: () => {
    const readyAttacks: PendingAttack[] = [];

    set((state) => {
      for (const attack of state.pendingAttacks) {
        attack.ticksRemaining -= 1;
        if (attack.ticksRemaining <= 0) {
          readyAttacks.push({ ...attack });
        }
      }
      // Remove attacks that reached 0 (they'll be resolved by middleware)
      state.pendingAttacks = state.pendingAttacks.filter((a) => a.ticksRemaining > 0);
    });

    return readyAttacks;
  },

  notifyAttack: (attackId) => {
    set((state) => {
      const attack = state.pendingAttacks.find((a) => a.id === attackId);
      if (attack) {
        attack.notified = true;
      }
    });
  },

  getPendingAttacksOnCell: (cellId) => {
    return get().pendingAttacks.filter((a) => a.targetCellId === cellId);
  },

  getActiveAttackCount: (attackerId) => {
    const attacks = get().pendingAttacks;
    if (attackerId) {
      return attacks.filter((a) => a.attackerId === attackerId).length;
    }
    return attacks.length;
  },

  resetAttacks: () => {
    attackIdCounter = 0;
    set((state) => {
      state.pendingAttacks = [];
    });
  },
});
