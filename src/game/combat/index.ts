/**
 * Combat resolution system
 *
 * Compares attacker power vs defender power.
 * Winner is determined by who has more power.
 * Losses are calculated based on the power delta.
 */

import type { UnitInstance } from '../units/definitions';

export interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerPowerRemaining: number;
  defenderPowerRemaining: number;
  attackerLosses: number;
  defenderLosses: number;
}

/**
 * Resolve combat between attacker and defender
 *
 * @param attackerPower - Total attack power
 * @param defenderPower - Total defense power (0 = undefended)
 * @returns Combat result with winner and losses
 */
export function resolveCombat(attackerPower: number, defenderPower: number): CombatResult {
  // Undefended - attacker wins with no losses
  if (defenderPower <= 0) {
    return {
      winner: 'attacker',
      attackerPowerRemaining: attackerPower,
      defenderPowerRemaining: 0,
      attackerLosses: 0,
      defenderLosses: 0,
    };
  }

  // Both sides have power - compare
  const delta = attackerPower - defenderPower;
  const totalPower = attackerPower + defenderPower;

  if (delta > 0) {
    // Attacker wins
    // Losses proportional to defender's power relative to total
    const attackerLossRatio = defenderPower / totalPower;
    const attackerLosses = Math.floor(attackerPower * attackerLossRatio * 0.5);

    return {
      winner: 'attacker',
      attackerPowerRemaining: Math.max(0, attackerPower - attackerLosses),
      defenderPowerRemaining: 0,
      attackerLosses,
      defenderLosses: defenderPower, // Defender loses all
    };
  } else if (delta < 0) {
    // Defender wins
    // Losses proportional to attacker's power relative to total
    const defenderLossRatio = attackerPower / totalPower;
    const defenderLosses = Math.floor(defenderPower * defenderLossRatio * 0.5);

    return {
      winner: 'defender',
      attackerPowerRemaining: 0,
      defenderPowerRemaining: Math.max(0, defenderPower - defenderLosses),
      attackerLosses: attackerPower, // Attacker loses all
      defenderLosses,
    };
  } else {
    // Tie - defender wins (home advantage) but both take heavy losses
    return {
      winner: 'defender',
      attackerPowerRemaining: 0,
      defenderPowerRemaining: Math.floor(defenderPower * 0.3),
      attackerLosses: attackerPower,
      defenderLosses: Math.floor(defenderPower * 0.7),
    };
  }
}

/**
 * Calculate total defense power of units at a cell
 */
export function calculateDefensePower(units: UnitInstance[]): number {
  return units.reduce((total, unit) => total + unit.defense, 0);
}

/**
 * Calculate how many units are lost based on power lost
 * Removes units starting from weakest until power loss is covered
 */
export function calculateUnitLosses(
  units: UnitInstance[],
  powerLost: number
): string[] {
  if (powerLost <= 0) return [];

  // Sort by defense (weakest first)
  const sorted = [...units].sort((a, b) => a.defense - b.defense);

  const lostUnitIds: string[] = [];
  let remainingLoss = powerLost;

  for (const unit of sorted) {
    if (remainingLoss <= 0) break;
    lostUnitIds.push(unit.id);
    remainingLoss -= unit.defense;
  }

  return lostUnitIds;
}
