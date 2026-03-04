export { GameCanvas } from './GameCanvas';
export { loadMap, getMap, getCell, getAdjacentCells, areAdjacent } from './mapLoader';
export {
  createBuildingSprite,
  updateBuildingSprite,
  destroyBuildingSprite,
} from './buildings';
export type { BuildingSprite } from './buildings';

// Modular components
export * from './visuals';
export * from './layers';
export * from './interactions';
