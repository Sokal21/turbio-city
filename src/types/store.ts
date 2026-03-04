// Store types

export interface Resources {
  money: number;
  bullets: number;
}

export interface GameActions {
  // Resources
  addResources: (money: number, bullets: number) => void;
  spendResources: (money: number, bullets: number) => boolean;

  // UI
  selectCell: (cellId: string | null) => void;

  // Game loop
  tick: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export interface GameStore {
  // Game loop
  tick: number;
  paused: boolean;

  // Resources
  resources: Resources;

  // UI
  selectedCellId: string | null;

  // Actions
  actions: GameActions;
}
