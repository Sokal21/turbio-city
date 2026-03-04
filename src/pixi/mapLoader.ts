import type { MapDefinition, MapCell } from '../types';
import rosarioMap from '../assets/maps/rosario.json';

// Current loaded map
let currentMap: MapDefinition | null = null;

/**
 * Load a map by id
 */
export function loadMap(mapId: string): MapDefinition {
  // For now we only have rosario, but this could load from different sources
  if (mapId === 'rosario') {
    currentMap = rosarioMap as MapDefinition;
    return currentMap;
  }

  throw new Error(`Unknown map: ${mapId}`);
}

/**
 * Get the currently loaded map
 */
export function getMap(): MapDefinition {
  if (!currentMap) {
    throw new Error('No map loaded. Call loadMap() first.');
  }
  return currentMap;
}

/**
 * Get a cell by id
 */
export function getCell(cellId: string): MapCell | undefined {
  if (!currentMap) return undefined;
  return currentMap.cells.find((c) => c.id === cellId);
}

/**
 * Get adjacent cell ids
 */
export function getAdjacentCells(cellId: string): string[] {
  if (!currentMap) return [];
  return currentMap.adjacency[cellId] || [];
}

/**
 * Check if two cells are adjacent
 */
export function areAdjacent(cellId1: string, cellId2: string): boolean {
  const adjacent = getAdjacentCells(cellId1);
  return adjacent.includes(cellId2);
}
