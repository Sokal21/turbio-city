import { getGameState } from '../../store';
import type { Middleware } from '../types';

/**
 * Units middleware - handles unit upkeep and desertion
 * Deducts upkeep costs each tick
 * Handles desertion when player can't pay upkeep
 */
export const unitsMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();

  // Get total upkeep for all units
  const upkeep = state.getTotalUpkeep();

  // Check if player can afford upkeep
  const canPayUpkeep = state.canAfford(upkeep.money, upkeep.bullets);

  if (canPayUpkeep) {
    // Deduct upkeep
    if (upkeep.money > 0 || upkeep.bullets > 0) {
      state.spendResources(upkeep.money, upkeep.bullets);

      ctx.events.push({
        type: 'UPKEEP_PAID',
        money: upkeep.money,
        bullets: upkeep.bullets,
      });
    }
  } else {
    // Can't pay upkeep - desertion
    const desertedUnit = state.desertUnit();

    if (desertedUnit) {
      ctx.events.push({
        type: 'UNIT_DESERTED',
        unitId: desertedUnit.id,
        unitType: desertedUnit.type,
        unitLevel: desertedUnit.level,
        reason: 'insufficient_resources',
      });
    }
  }

  await next();
};
