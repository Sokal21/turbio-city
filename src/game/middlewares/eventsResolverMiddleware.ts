import { getGameActions } from '../../store';
import type { Middleware } from '../types';

/**
 * Events resolver middleware - final middleware that processes all accumulated events
 * and commits state changes
 */
export const eventsResolverMiddleware: Middleware = async (ctx, next) => {
  const actions = getGameActions();

  for (const event of ctx.events) {
    switch (event.type) {
      case 'RESOURCE_PRODUCED':
        if (event.resource === 'money') {
          actions.addResources(event.amount, 0);
        } else if (event.resource === 'bullets') {
          actions.addResources(0, event.amount);
        }
        break;

      case 'TICK_COMPLETED':
        // Just for logging/debugging
        break;

      default:
        // Unknown event type - will be extended as we add more mechanics
        break;
    }
  }

  // Add tick completed event for any post-processing
  ctx.events.push({
    type: 'TICK_COMPLETED',
    tick: ctx.tick,
  });

  await next();
};
