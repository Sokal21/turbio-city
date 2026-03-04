import { getGameState } from '../../store';
import type { Middleware } from '../types';

/**
 * Buildings middleware - handles construction progress
 * Updates building construction each tick
 */
export const buildingsMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();
  const constructingBuildings = state.getConstructingBuildings();

  for (const building of constructingBuildings) {
    const newProgress = building.constructionProgress + 1;

    if (newProgress >= building.constructionTotal) {
      // Construction complete
      state.activateBuilding(building.id);
      ctx.events.push({
        type: 'BUILDING_COMPLETED',
        buildingId: building.id,
        buildingType: building.type,
      });
    } else {
      // Update progress
      state.updateBuildingProgress(building.id, newProgress);
    }
  }

  await next();
};
