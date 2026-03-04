/**
 * Cell visual state calculation
 *
 * Determines what colors a cell should display based on game state.
 * This centralizes the visual logic that was previously scattered in GameCanvas.
 */

import { COLORS } from './colors';

export type PlacementState = 'none' | 'valid' | 'invalid';

export interface CellVisualState {
  isSelected: boolean;
  isOwned: boolean;
  isExpandable: boolean;
  placementState: PlacementState;
}

export interface CellColors {
  fill: number;
  stroke: number;
}

/**
 * Calculate the fill and stroke colors for a cell based on its state.
 * Priority order: placement > selected > owned > expandable > neutral
 */
export function getCellColors(state: CellVisualState): CellColors {
  const { isSelected, isOwned, isExpandable, placementState } = state;

  // Placement mode takes highest priority
  if (placementState === 'valid') {
    return {
      fill: COLORS.validPlacement,
      stroke: COLORS.borderValid,
    };
  }

  if (placementState === 'invalid') {
    return {
      fill: COLORS.invalidPlacement,
      stroke: COLORS.borderInvalid,
    };
  }

  // Selected state
  if (isSelected) {
    return {
      fill: COLORS.selected,
      stroke: COLORS.borderSelected,
    };
  }

  // Owned by player
  if (isOwned) {
    return {
      fill: COLORS.owned,
      stroke: COLORS.borderOwned,
    };
  }

  // Expandable (adjacent to player territory)
  if (isExpandable) {
    return {
      fill: COLORS.expandable,
      stroke: COLORS.borderExpandable,
    };
  }

  // Neutral
  return {
    fill: COLORS.neutral,
    stroke: COLORS.borderNeutral,
  };
}
