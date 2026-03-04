import { getGameState } from '../../store';
import { getBuildingLevelData } from '../buildings';
import type { Middleware } from '../types';

const DEFICIT_TICKS_UNTIL_DESERTION = 60;

/**
 * Resources middleware - handles resource production and upkeep
 *
 * - Calculates gross production from buildings
 * - Calculates upkeep from units in pool
 * - Subtracts upkeep from production (not from stash)
 * - If net >= 0: add net to stash, reset deficit timer
 * - If net < 0: increment deficit timer, trigger desertion at 60 ticks
 */
export const resourcesMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();
  const resourceBuildings = state.getResourceBuildings();

  // Calculate gross production from all active resource buildings
  let grossMoney = 0;
  let grossBullets = 0;

  for (const building of resourceBuildings) {
    const levelData = getBuildingLevelData(building.type, building.level);
    if (levelData?.production) {
      grossMoney += levelData.production.money ?? 0;
      grossBullets += levelData.production.bullets ?? 0;
    }
  }

  // Calculate upkeep from units in pool
  const upkeep = state.getTotalUpkeep();

  // Calculate net production (production minus upkeep)
  const netMoney = grossMoney - upkeep.money;
  const netBullets = grossBullets - upkeep.bullets;

  // Check if production covers upkeep
  const inDeficit = netMoney < 0 || netBullets < 0;

  if (inDeficit) {
    // In deficit - increment timer
    const deficitTicks = state.incrementDeficitTicks();

    if (deficitTicks >= DEFICIT_TICKS_UNTIL_DESERTION) {
      // Time's up - desertion
      const desertedUnit = state.desertUnit();

      if (desertedUnit) {
        ctx.events.push({
          type: 'UNIT_DESERTED',
          unitId: desertedUnit.id,
          unitType: desertedUnit.type,
          unitLevel: desertedUnit.level,
          reason: 'insufficient_production',
        });
      }

      // Reset timer after desertion
      state.resetDeficitTicks();
    }

    // Still add whatever positive net exists
    if (netMoney > 0) {
      ctx.events.push({
        type: 'RESOURCE_PRODUCED',
        resource: 'money',
        amount: netMoney,
      });
    }
    if (netBullets > 0) {
      ctx.events.push({
        type: 'RESOURCE_PRODUCED',
        resource: 'bullets',
        amount: netBullets,
      });
    }
  } else {
    // Not in deficit - reset timer and add net resources
    state.resetDeficitTicks();

    if (netMoney > 0) {
      ctx.events.push({
        type: 'RESOURCE_PRODUCED',
        resource: 'money',
        amount: netMoney,
      });
    }

    if (netBullets > 0) {
      ctx.events.push({
        type: 'RESOURCE_PRODUCED',
        resource: 'bullets',
        amount: netBullets,
      });
    }

    // Track upkeep paid (for UI/debugging)
    if (upkeep.money > 0 || upkeep.bullets > 0) {
      ctx.events.push({
        type: 'UPKEEP_PAID',
        money: upkeep.money,
        bullets: upkeep.bullets,
      });
    }
  }

  await next();
};
