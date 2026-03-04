export { GameCanvas } from './GameCanvas';
export { loadMap, getMap, getCell, getAdjacentCells, areAdjacent } from './mapLoader';
export {
  createBuildingSprite,
  updateBuildingSprite,
  destroyBuildingSprite,
} from './BuildingRenderer';
export type { BuildingSprite } from './BuildingRenderer';

// Modular components
export * from './visuals';
export * from './layers';
export * from './interactions';
