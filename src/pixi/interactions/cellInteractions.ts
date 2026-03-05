/**
 * Cell interaction handlers
 *
 * Handles click and hover interactions on map cells.
 * Separates interaction logic from rendering concerns.
 */

import type { MapCell } from '../../types';
import type { CellLayer } from '../layers/CellLayer';
import type { CellVisualState } from '../visuals/cellState';
import { getGameState } from '../../store';
import { getBuildingDefinition, mapController } from '../../game';
import type { Buildings } from '../../game/buildings/definitions';

/**
 * Get the cells that would be occupied by a building at a given position
 */
export function getBuildingFootprint(centerCellId: string, buildingType: keyof Buildings): string[] {
  const definition = getBuildingDefinition(buildingType);
  if (!definition) return [centerCellId];

  const { width, height } = definition.size;
  if (width === 1 && height === 1) return [centerCellId];

  const [cx, cy] = centerCellId.split(',').map(Number);
  const cells: string[] = [];

  const offsetX = Math.floor(width / 2);
  const offsetY = Math.floor(height / 2);

  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      const x = cx - offsetX + dx;
      const y = cy - offsetY + dy;
      cells.push(`${x},${y}`);
    }
  }

  return cells;
}

/**
 * Check if a cell is valid for building placement
 */
export function isCellValidForPlacement(cellId: string): boolean {
  const state = getGameState();
  return state.isCellOwned(cellId, 'player') && !state.isCellOccupied(cellId);
}

/**
 * Get the current visual state for a cell
 */
export function getCellVisualState(
  cellId: string,
  options: { hoveredCells?: Set<string>; selectedCellId?: string | null } = {}
): CellVisualState {
  const state = getGameState();
  const { hoveredCells, selectedCellId } = options;

  const isOwned = state.isCellOwned(cellId, 'player');
  const isSelected = cellId === selectedCellId;
  const canExpand = mapController.canExpandTo(cellId);

  // Check if in placement preview
  let placementState: 'none' | 'valid' | 'invalid' = 'none';
  if (hoveredCells?.has(cellId)) {
    placementState = isCellValidForPlacement(cellId) ? 'valid' : 'invalid';
  }

  return {
    isSelected,
    isOwned,
    isExpandable: canExpand.canExpand,
    placementState,
  };
}

export interface CellInteractionContext {
  cellLayer: CellLayer;
  hoveredCells: Set<string>;
  hoveredCellId: string | null;
}

/**
 * Handle cell click - placement or selection
 * Note: Modal opening is handled by menu button clicks, not cell clicks
 */
export function handleCellClick(cell: MapCell): void {
  const state = getGameState();
  const placementMode = state.placementMode;

  if (placementMode?.active && placementMode.buildingType) {
    // Building placement mode
    const buildingCells = getBuildingFootprint(cell.id, placementMode.buildingType);
    const allValid = buildingCells.every(isCellValidForPlacement);

    if (allValid) {
      state.placeBuilding(placementMode.buildingType, buildingCells);
    }
  } else {
    // Default: select the cell
    state.selectCell(cell.id);
  }
}

/**
 * Handle cell hover enter - show placement preview if in placement mode
 */
export function handleCellEnter(cell: MapCell, ctx: CellInteractionContext): void {
  const state = getGameState();
  const placementMode = state.placementMode;

  // Hide previous menu button
  if (ctx.hoveredCellId && ctx.hoveredCellId !== cell.id) {
    ctx.cellLayer.hideMenuButton(ctx.hoveredCellId);
  }
  ctx.hoveredCellId = cell.id;

  if (placementMode?.active && placementMode.buildingType) {
    const buildingCells = getBuildingFootprint(cell.id, placementMode.buildingType);

    // Track hovered cells
    ctx.hoveredCells.clear();
    buildingCells.forEach((id) => ctx.hoveredCells.add(id));

    // Update visuals for hovered cells
    buildingCells.forEach((cellId) => {
      const visualState = getCellVisualState(cellId, { hoveredCells: ctx.hoveredCells });
      ctx.cellLayer.updateCellVisual(cellId, visualState);
    });
  } else {
    // Check if this cell should show a menu button
    const building = state.getBuildingAt(cell.id);

    if (building && building.status === 'active') {
      const definition = getBuildingDefinition(building.type);
      if (definition.category === 'units') {
        // Show production menu button on the first cell of the building
        // (show even when hovering over other cells of the building)
        const firstCellId = building.cellIds[0];
        ctx.cellLayer.showMenuButton(firstCellId, 'production');
        // Track this so we can hide it on leave
        ctx.hoveredCellId = firstCellId;
      }
    } else {
      // Check for expansion
      const canExpand = mapController.canExpandTo(cell.id);
      if (canExpand.canExpand) {
        ctx.cellLayer.showMenuButton(cell.id, 'expansion');
      }
    }
  }
}

/**
 * Handle cell hover leave - restore normal visuals
 */
export function handleCellLeave(ctx: CellInteractionContext): void {
  const state = getGameState();

  // Hide menu button
  if (ctx.hoveredCellId) {
    ctx.cellLayer.hideMenuButton(ctx.hoveredCellId);
    ctx.hoveredCellId = null;
  }

  // Restore visuals for previously hovered cells
  ctx.hoveredCells.forEach((cellId) => {
    const visualState = getCellVisualState(cellId, {
      selectedCellId: state.selectedCellId,
    });
    ctx.cellLayer.updateCellVisual(cellId, visualState);
  });

  ctx.hoveredCells.clear();
}

/**
 * Refresh all cell visuals (called when state changes)
 */
export function refreshAllCellVisuals(
  cellLayer: CellLayer,
  hoveredCells: Set<string>,
  selectedCellId: string | null
): void {
  cellLayer.updateAllCells((cellId) => {
    // Skip hovered cells - they're managed by hover handlers
    if (hoveredCells.has(cellId)) {
      return getCellVisualState(cellId, { hoveredCells });
    }
    return getCellVisualState(cellId, { selectedCellId });
  });
}

/**
 * Handle menu button click
 */
export function handleMenuButtonClick(cell: MapCell, type: 'production' | 'expansion'): void {
  const state = getGameState();

  if (type === 'production') {
    const building = state.getBuildingAt(cell.id);
    if (building) {
      state.openProductionModal(building.id);
    }
  } else if (type === 'expansion') {
    state.openExpansionModal(cell.id);
  }
}
