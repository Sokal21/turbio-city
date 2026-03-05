import type { GameStore } from '../store';
import type { Units } from './units/definitions';

// Event types - extended as we add more mechanics
export type GameEvent =
  | { type: 'RESOURCE_PRODUCED'; resource: 'money' | 'bullets'; amount: number }
  | { type: 'BUILDING_COMPLETED'; buildingId: string; buildingType: string }
  | { type: 'BUILDING_PLACED'; buildingId: string; buildingType: string }
  | { type: 'BUILDING_CANCELLED'; buildingId: string }
  | { type: 'BUILDING_UPGRADED'; buildingId: string; buildingType: string; newLevel: number }
  | { type: 'BUILDING_DESTROYED'; buildingId: string; buildingType: string; attackerId: string }
  | { type: 'UNIT_PRODUCED'; unitId: string; unitType: keyof Units; unitLevel: number; buildingId: string }
  | { type: 'UNIT_DESERTED'; unitId: string; unitType: string; unitLevel: number; reason: string }
  | { type: 'UNIT_KILLED'; unitId: string; attackId: string }
  | { type: 'UPKEEP_PAID'; money: number; bullets: number }
  | { type: 'ATTACK_PLANNED'; attackId: string; attackerId: string; targetCellId: string; ticksUntil: number }
  | { type: 'ATTACK_RESOLVED'; attackId: string; winner: 'attacker' | 'defender'; defended: boolean; heatChange: number }
  | { type: 'ATTACK_FIZZLED'; attackId: string; reason: string }
  | { type: 'CELL_LOST'; cellId: string; attackerId: string }
  | { type: 'UNITS_ARRIVED'; movementId: string; unitIds: string[]; toCellId: string }
  | { type: 'TICK_COMPLETED'; tick: number };

// Tick context passed through middleware chain
export interface TickContext {
  tick: number;
  delta: number;
  state: GameStore;
  events: GameEvent[];
}

// Middleware function signature
export type NextFn = () => Promise<void>;
export type Middleware = (ctx: TickContext, next: NextFn) => Promise<void>;
