import { getGameState } from '../../store';
import type { Middleware } from '../types';
import type { AIController } from '../ai/types';
import { policeAI } from '../ai';

/**
 * Registered AI controllers
 * Add new factions here
 */
const AI_CONTROLLERS: AIController[] = [policeAI];

/**
 * AI Middleware
 *
 * Iterates through all AI factions and executes their logic.
 * Each faction evaluates the game state and may trigger actions.
 */
export const aiMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();

  for (const controller of AI_CONTROLLERS) {
    const action = controller.evaluateTick(ctx, state);

    switch (action.type) {
      case 'PLAN_RAID': {
        // Create pending attack
        const attackId = state.addPendingAttack({
          attackerId: controller.id as 'police',
          targetCellId: action.targetCellId,
          ticksRemaining: action.ticksUntil,
          notified: true, // For now, always notify. Future: intel middleware decides
          attackPower: action.attackPower,
        });

        ctx.events.push({
          type: 'ATTACK_PLANNED',
          attackId,
          attackerId: controller.id,
          targetCellId: action.targetCellId,
          ticksUntil: action.ticksUntil,
        });
        break;
      }

      case 'NONE':
      default:
        // No action this tick
        break;
    }
  }

  await next();
};
