import { getGameState } from '../../store';
import type { Middleware } from '../types';
import { resolveCombat, calculateDefensePower, calculateUnitLosses } from '../combat';

/**
 * Attacks Middleware
 *
 * Handles pending attack countdowns and resolution.
 * When an attack countdown reaches 0, combat is resolved.
 */
export const attacksMiddleware: Middleware = async (ctx, next) => {
  const state = getGameState();

  // Decrement countdowns and get attacks that reached 0
  const readyAttacks = state.decrementAttackCountdowns();

  // Resolve each ready attack
  for (const attack of readyAttacks) {
    resolveAttack(attack, state, ctx);
  }

  await next();
};

/**
 * Resolve an attack on a cell
 */
function resolveAttack(
  attack: { id: string; attackerId: string; targetCellId: string; attackPower: number },
  state: ReturnType<typeof getGameState>,
  ctx: Parameters<Middleware>[0]
): void {
  const { targetCellId, attackPower, attackerId } = attack;

  // Check if cell is still owned by player
  if (!state.isCellOwned(targetCellId, 'player')) {
    // Cell no longer player-owned, attack fizzles
    ctx.events.push({
      type: 'ATTACK_FIZZLED',
      attackId: attack.id,
      reason: 'target_lost',
    });
    return;
  }

  // Get defending units - if cell is part of a building, gather from all building cells
  const building = state.getBuildingAt(targetCellId);
  let defendingUnits;

  if (building) {
    // Gather defenders from all cells of the building
    defendingUnits = building.cellIds.flatMap((cellId) => state.getUnitsAtCell(cellId));
  } else {
    // Just get units at this specific cell
    defendingUnits = state.getUnitsAtCell(targetCellId);
  }

  const defenderPower = calculateDefensePower(defendingUnits);

  // Resolve combat
  const result = resolveCombat(attackPower, defenderPower);

  // Handle defender losses (remove units)
  if (result.defenderLosses > 0 && defendingUnits.length > 0) {
    const lostUnitIds = calculateUnitLosses(
      defendingUnits,
      result.defenderLosses
    );

    for (const unitId of lostUnitIds) {
      state.removeUnit(unitId);
      ctx.events.push({
        type: 'UNIT_KILLED',
        unitId,
        attackId: attack.id,
      });
    }
  }

  if (result.winner === 'attacker') {
    // Attacker wins
    handleAttackerVictory(targetCellId, attackerId, state, ctx);

    // Heat reduces when not defended (police "cleaned up")
    if (defenderPower === 0) {
      const heatReduction = Math.min(state.heat, 10);
      state.reduceHeat(heatReduction);

      ctx.events.push({
        type: 'ATTACK_RESOLVED',
        attackId: attack.id,
        winner: 'attacker',
        defended: false,
        heatChange: -heatReduction,
      });
    } else {
      // Defended but lost - no heat change
      ctx.events.push({
        type: 'ATTACK_RESOLVED',
        attackId: attack.id,
        winner: 'attacker',
        defended: true,
        heatChange: 0,
      });
    }
  } else {
    // Defender wins
    // Heat increases when fighting back
    const heatIncrease = Math.floor(attackPower * 0.5);
    state.addHeat(heatIncrease);

    ctx.events.push({
      type: 'ATTACK_RESOLVED',
      attackId: attack.id,
      winner: 'defender',
      defended: true,
      heatChange: heatIncrease,
    });
  }
}

/**
 * Handle attacker victory - destroy building OR remove cell ownership
 * If there's a building: destroy it but keep the cell
 * If no building: lose the cell
 */
function handleAttackerVictory(
  cellId: string,
  attackerId: string,
  state: ReturnType<typeof getGameState>,
  ctx: Parameters<Middleware>[0]
): void {
  // Check for building on this cell
  const building = state.getBuildingAt(cellId);

  if (building) {
    // Destroy the building but keep cell ownership
    state.removeBuilding(building.id);

    ctx.events.push({
      type: 'BUILDING_DESTROYED',
      buildingId: building.id,
      buildingType: building.type,
      attackerId,
    });
  } else {
    // No building - lose the cell
    state.setCellOwner(cellId, 'neutral');

    ctx.events.push({
      type: 'CELL_LOST',
      cellId,
      attackerId,
    });
  }
}
