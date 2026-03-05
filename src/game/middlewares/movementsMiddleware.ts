import { getGameState } from '../../store';
import type { Middleware } from '../types';

/**
 * Movements Middleware
 *
 * Handles pending unit movement countdowns and resolution.
 * When a movement countdown reaches 0, units arrive at destination.
 */
export const movementsMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();

  // Decrement countdowns and get movements that reached 0
  const completedMovements = state.decrementMovementCountdowns();

  // Resolve each completed movement
  for (const movement of completedMovements) {
    // Move units to destination
    for (const unitId of movement.unitIds) {
      state.moveUnitToCell(unitId, movement.toCellId);
    }

    ctx.events.push({
      type: 'UNITS_ARRIVED',
      movementId: movement.id,
      unitIds: movement.unitIds,
      toCellId: movement.toCellId,
    });
  }

  await next();
};
