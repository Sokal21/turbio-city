import { getGameState } from '../../store';
import { createUnitInstance, type Units } from '../units/definitions';
import type { Middleware } from '../types';

/**
 * Buildings middleware - handles construction progress and unit production
 * Updates building construction each tick
 * Updates unit production queues each tick
 */
export const buildingsMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();

  // Handle building construction
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

  // Handle unit production
  const buildingsWithProduction = state.getBuildingsWithProduction();

  for (const building of buildingsWithProduction) {
    if (building.productionQueue.length === 0) continue;

    const currentItem = building.productionQueue[0];
    const newProgress = currentItem.progress + 1;

    if (newProgress >= currentItem.total) {
      // Production complete - create unit
      const completedItem = state.completeProduction(building.id);

      if (completedItem) {
        const unit = createUnitInstance(
          completedItem.unitType,
          completedItem.unitLevel,
          'pool'
        );

        if (unit) {
          state.addUnit(unit);

          ctx.events.push({
            type: 'UNIT_PRODUCED',
            unitId: unit.id,
            unitType: unit.type as keyof Units,
            unitLevel: unit.level,
            buildingId: building.id,
          });
        }
      }
    } else {
      // Update progress
      state.updateProductionProgress(building.id, newProgress);
    }
  }

  await next();
};
