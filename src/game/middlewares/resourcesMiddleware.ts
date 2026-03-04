import type { Middleware } from '../types';

/**
 * Resources middleware - handles resource production per tick
 * For now, just adds base income. Will be expanded when buildings are defined.
 */
export const resourcesMiddleware: Middleware = async (ctx, next) => {
  // Base income per tick (placeholder - will come from buildings later)
  const baseMoneyPerTick = 0;
  const baseBulletsPerTick = 0;

  if (baseMoneyPerTick > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'money',
      amount: baseMoneyPerTick,
    });
  }

  if (baseBulletsPerTick > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'bullets',
      amount: baseBulletsPerTick,
    });
  }

  await next();
};
