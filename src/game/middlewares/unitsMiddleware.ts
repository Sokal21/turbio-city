import type { Middleware } from '../types';

/**
 * Units middleware - placeholder for future unit-related tick logic
 *
 * Future uses: morale, healing, combat resolution, etc.
 */
export const unitsMiddleware: Middleware = async (_ctx, next) => {
  await next();
};
