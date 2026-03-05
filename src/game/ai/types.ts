import type { GameStore } from '../../store';
import type { TickContext } from '../types';

/**
 * AI Action types - what an AI faction can decide to do
 */
export type AIAction =
  | { type: 'PLAN_RAID'; targetCellId: string; ticksUntil: number; attackPower: number }
  | { type: 'NONE' };

/**
 * AI Controller interface - each faction implements this
 */
export interface AIController {
  id: string;
  name: string;

  /**
   * Evaluate the game state and decide what action to take this tick
   */
  evaluateTick(ctx: TickContext, state: GameStore): AIAction;
}
