import { getGameState } from '../../store';
import { getBuildingDefinition } from '../buildings';
import type { Middleware } from '../types';

/**
 * Resources middleware - handles resource production per tick
 * Checks active buildings and adds their production
 */
export const resourcesMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();
  const activeBuildings = state.getActiveBuildings();

  let totalMoney = 0;
  let totalBullets = 0;

  // Calculate production from all active buildings
  for (const building of activeBuildings) {
    const definition = getBuildingDefinition(building.type);
    if (definition?.production) {
      totalMoney += definition.production.money ?? 0;
      totalBullets += definition.production.bullets ?? 0;
    }
  }

  // Add resource events
  if (totalMoney > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'money',
      amount: totalMoney,
    });
  }

  if (totalBullets > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'bullets',
      amount: totalBullets,
    });
  }

  await next();
};
