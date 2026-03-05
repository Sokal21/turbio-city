import type { GameStore } from '../../store';
import type { TickContext } from '../types';
import type { AIController, AIAction } from './types';

/**
 * Police AI Configuration
 */
const POLICE_CONFIG = {
  // Base probability per tick (at heat 0)
  baseProbability: 0.001,

  // Additional probability per heat point
  probabilityPerHeat: 0.002,

  // Max probability cap
  maxProbability: 0.15,

  // Probability reduction per active attack (harder to get overwhelmed)
  probabilityReductionPerAttack: 0.03,

  // Attack power (fixed for now)
  attackPower: 10,

  // Ticks until attack lands
  ticksUntilAttack: 30,

  // Minimum heat to trigger any attack
  minimumHeat: 5,
};

/**
 * Police AI Controller
 *
 * Evaluates player's heat and probabilistically plans raids.
 * Higher heat = higher chance of raid.
 */
export const policeAI: AIController = {
  id: 'police',
  name: 'Police',

  evaluateTick(_ctx: TickContext, state: GameStore): AIAction {
    // Get total heat (global + unit heat)
    const globalHeat = state.heat;
    const unitHeat = state.getTotalHeat();
    const totalHeat = globalHeat + unitHeat;

    // No attacks if heat is below minimum
    if (totalHeat < POLICE_CONFIG.minimumHeat) {
      return { type: 'NONE' };
    }

    // Calculate raid probability
    let probability = POLICE_CONFIG.baseProbability + totalHeat * POLICE_CONFIG.probabilityPerHeat;

    // Reduce probability based on active attacks
    const activeAttacks = state.getActiveAttackCount('police');
    probability -= activeAttacks * POLICE_CONFIG.probabilityReductionPerAttack;

    // Clamp probability
    probability = Math.max(0, Math.min(probability, POLICE_CONFIG.maxProbability));

    // Roll for attack
    if (Math.random() > probability) {
      return { type: 'NONE' };
    }

    // Attack triggered - pick a target
    const targetCellId = pickRaidTarget(state);
    if (!targetCellId) {
      return { type: 'NONE' };
    }

    return {
      type: 'PLAN_RAID',
      targetCellId,
      ticksUntil: POLICE_CONFIG.ticksUntilAttack,
      attackPower: POLICE_CONFIG.attackPower,
    };
  },
};

/**
 * Pick a cell to raid
 * For now: random player-owned cell
 * Future: prioritize high-value targets (buildings, high heat areas)
 */
function pickRaidTarget(state: GameStore): string | null {
  const playerCells = state.getOwnedCells('player');

  if (playerCells.length === 0) {
    return null;
  }

  // Random cell for now
  const randomIndex = Math.floor(Math.random() * playerCells.length);
  return playerCells[randomIndex];
}
