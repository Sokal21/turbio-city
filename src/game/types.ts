import type { GameStore } from '../types';

// Event types - will be extended as we add more mechanics
export type GameEvent =
  | { type: 'RESOURCE_PRODUCED'; resource: 'money' | 'bullets'; amount: number }
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
