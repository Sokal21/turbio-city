import { getGameState } from '../../store';
import { getBuildingLevelData } from '../buildings';
import type { Middleware } from '../types';

/**
 * Resources middleware - handles resource production per tick
 * Checks active resource buildings and adds their production based on level
 */
export const resourcesMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();
  const resourceBuildings = state.getResourceBuildings();

  let totalMoney = 0;
  let totalBullets = 0;

  // Calculate production from all active resource buildings
  for (const building of resourceBuildings) {
    const levelData = getBuildingLevelData(building.type, building.level);
    if (levelData?.production) {
      totalMoney += levelData.production.money ?? 0;
      totalBullets += levelData.production.bullets ?? 0;
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
