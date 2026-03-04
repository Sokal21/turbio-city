import type { MapCell } from '../../types';
import type { Resources } from '../../store/types';
import { getCell, getAdjacentCells } from '../../pixi/mapLoader';
import { getGameState } from '../../store';

export type ExpansionMethod = 'peaceful' | 'violent';

export interface ExpansionResult {
  success: boolean;
  error?: string;
}

export interface CalculatedExpansionCost {
  peaceful: Resources;
  violent: Resources & { heat: number };
}

/**
 * MapController - handles expansion logic and map-related game mechanics
 *
 * This controller acts as a bridge between static map data and dynamic game state.
 * It calculates costs, validates expansions, and executes territory changes.
 */
export class MapController {
  /**
   * Get the expansion cost for a cell, applying any modifiers
   * Future: modifiers from buildings, events, difficulty, etc.
   */
  getExpansionCost(cellId: string): CalculatedExpansionCost | null {
    const cell = getCell(cellId);
    if (!cell) return null;

    const baseCost = cell.expansionCost;

    // Future: apply modifiers here
    // const modifiers = this.getModifiers(cellId);
    // const multiplier = modifiers.costMultiplier ?? 1;

    return {
      peaceful: {
        money: baseCost.peaceful.money,
        bullets: 0,
      },
      violent: {
        money: baseCost.violent.money,
        bullets: baseCost.violent.bullets,
        heat: baseCost.heat,
      },
    };
  }

  /**
   * Check if a cell can be expanded to by the player
   * - Cell must exist
   * - Cell must not already be owned by player
   * - Cell must be adjacent to at least one player-owned cell
   */
  canExpandTo(cellId: string): { canExpand: boolean; reason?: string } {
    const cell = getCell(cellId);
    if (!cell) {
      return { canExpand: false, reason: 'Cell does not exist' };
    }

    const state = getGameState();

    // Check if already owned
    if (state.isCellOwned(cellId, 'player')) {
      return { canExpand: false, reason: 'Cell already owned' };
    }

    // Check adjacency to player territory
    const adjacentCells = getAdjacentCells(cellId);
    const isAdjacentToPlayer = adjacentCells.some(
      (adjId) => state.isCellOwned(adjId, 'player')
    );

    if (!isAdjacentToPlayer) {
      return { canExpand: false, reason: 'Not adjacent to your territory' };
    }

    return { canExpand: true };
  }

  /**
   * Check if player can afford the expansion
   */
  canAffordExpansion(cellId: string, method: ExpansionMethod): boolean {
    const cost = this.getExpansionCost(cellId);
    if (!cost) return false;

    const state = getGameState();

    if (method === 'peaceful') {
      return state.canAfford(cost.peaceful.money, cost.peaceful.bullets);
    } else {
      return state.canAfford(cost.violent.money, cost.violent.bullets);
    }
  }

  /**
   * Execute expansion to a cell
   * Validates all conditions and deducts resources
   */
  expandToCell(cellId: string, method: ExpansionMethod): ExpansionResult {
    // Validate expansion is possible
    const canExpand = this.canExpandTo(cellId);
    if (!canExpand.canExpand) {
      return { success: false, error: canExpand.reason };
    }

    // Get cost
    const cost = this.getExpansionCost(cellId);
    if (!cost) {
      return { success: false, error: 'Failed to calculate cost' };
    }

    const state = getGameState();

    // Check affordability and deduct resources
    if (method === 'peaceful') {
      if (!state.canAfford(cost.peaceful.money, cost.peaceful.bullets)) {
        return { success: false, error: 'Not enough money' };
      }
      state.spendResources(cost.peaceful.money, cost.peaceful.bullets);
    } else {
      if (!state.canAfford(cost.violent.money, cost.violent.bullets)) {
        return { success: false, error: 'Not enough resources' };
      }
      state.spendResources(cost.violent.money, cost.violent.bullets);
      // Future: add heat
      // state.addHeat(cost.violent.heat);
    }

    // Transfer ownership
    state.setCellOwner(cellId, 'player');

    console.log(`[MapController] Expanded to ${cellId} via ${method}`);
    return { success: true };
  }

  /**
   * Get cell info for display
   */
  getCellInfo(cellId: string): MapCell | undefined {
    return getCell(cellId);
  }

  /**
   * Get all cells adjacent to player territory that can be expanded to
   */
  getExpandableCells(): string[] {
    const state = getGameState();
    const playerCells = state.getOwnedCells('player');
    const expandable = new Set<string>();

    for (const cellId of playerCells) {
      const adjacent = getAdjacentCells(cellId);
      for (const adjId of adjacent) {
        // Only include if not already owned by player
        if (!state.isCellOwned(adjId, 'player')) {
          // And cell exists in map
          if (getCell(adjId)) {
            expandable.add(adjId);
          }
        }
      }
    }

    return Array.from(expandable);
  }
}

// Singleton instance
export const mapController = new MapController();
