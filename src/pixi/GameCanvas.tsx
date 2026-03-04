import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore, getGameState } from '../store';
import { loadMap, getMap } from './mapLoader';
import { getBuildingDefinition } from '../game';
import {
  createBuildingSprite,
  updateBuildingSprite,
  destroyBuildingSprite,
  type BuildingSprite,
} from './BuildingRenderer';
import type { MapCell } from '../types';

const CELL_SIZE = 60;
const CELL_GAP = 4;

// Colors
const COLORS = {
  neutral: 0x2d3748,
  owned: 0x4a5568,
  selected: 0x553c9a,
  validPlacement: 0x276749,
  invalidPlacement: 0x9b2c2c,
  borderNeutral: 0x4a5568,
  borderOwned: 0x68d391,
  borderSelected: 0x9f7aea,
  borderValid: 0x68d391,
  borderInvalid: 0xfc8181,
};

interface CellSprite {
  container: Container;
  background: Graphics;
  label: Text;
  cell: MapCell;
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cellSpritesRef = useRef<Map<string, CellSprite>>(new Map());
  const buildingSpritesRef = useRef<Map<string, BuildingSprite>>(new Map());
  const buildingLayerRef = useRef<Container | null>(null);
  const hoveredCellsRef = useRef<Set<string>>(new Set());
  const mapOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedCellId = useGameStore((state) => state.selectedCellId);
  const placementMode = useGameStore((state) => state.placementMode);
  const buildings = useGameStore((state) => state.buildings);

  // Get cells that would be occupied by a building placed at centerCell
  const getBuildingCells = (centerCellId: string, buildingType: string): string[] => {
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
  };

  // Check if a cell is valid for placement
  const isCellValidForPlacement = (cellId: string): boolean => {
    const state = getGameState();
    return state.isCellOwned(cellId, 'player') && !state.isCellOccupied(cellId);
  };

  // Update cell visuals
  const updateCellVisual = (
    sprite: CellSprite,
    options: {
      isSelected: boolean;
      isOwned: boolean;
      placementState: 'none' | 'valid' | 'invalid';
    }
  ) => {
    const { isSelected, isOwned, placementState } = options;

    let fillColor: number;
    let strokeColor: number;

    if (placementState === 'valid') {
      fillColor = COLORS.validPlacement;
      strokeColor = COLORS.borderValid;
    } else if (placementState === 'invalid') {
      fillColor = COLORS.invalidPlacement;
      strokeColor = COLORS.borderInvalid;
    } else if (isSelected) {
      fillColor = COLORS.selected;
      strokeColor = COLORS.borderSelected;
    } else if (isOwned) {
      fillColor = COLORS.owned;
      strokeColor = COLORS.borderOwned;
    } else {
      fillColor = COLORS.neutral;
      strokeColor = COLORS.borderNeutral;
    }

    sprite.background.clear();
    sprite.background.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
    sprite.background.fill(fillColor);
    sprite.background.stroke({ width: 2, color: strokeColor });
  };

  // Calculate pixel position for a cell
  const getCellPixelPosition = (cellId: string): { x: number; y: number } | null => {
    const [x, y] = cellId.split(',').map(Number);
    return {
      x: mapOffsetRef.current.x + x * (CELL_SIZE + CELL_GAP),
      y: mapOffsetRef.current.y + y * (CELL_SIZE + CELL_GAP),
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    // Load map
    loadMap('rosario');
    const map = getMap();

    // Create PixiJS application
    const app = new Application();

    const initApp = async () => {
      await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x1a1a2e,
        antialias: true,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // Create layers
      const mapLayer = new Container();
      mapLayer.label = 'mapLayer';
      app.stage.addChild(mapLayer);

      const buildingLayer = new Container();
      buildingLayer.label = 'buildingLayer';
      app.stage.addChild(buildingLayer);
      buildingLayerRef.current = buildingLayer;

      // Calculate offset to center the map
      const mapWidth = map.width * (CELL_SIZE + CELL_GAP);
      const mapHeight = map.height * (CELL_SIZE + CELL_GAP);
      const offsetX = (800 - mapWidth) / 2;
      const offsetY = (600 - mapHeight) / 2;
      mapOffsetRef.current = { x: offsetX, y: offsetY };

      // Create cell sprites
      const textStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
      });

      for (const cell of map.cells) {
        const cellContainer = new Container();
        cellContainer.x = offsetX + cell.x * (CELL_SIZE + CELL_GAP);
        cellContainer.y = offsetY + cell.y * (CELL_SIZE + CELL_GAP);
        cellContainer.label = `cell-${cell.id}`;

        const bg = new Graphics();
        const state = getGameState();
        const isOwned = state.isCellOwned(cell.id, 'player');
        bg.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
        bg.fill(isOwned ? COLORS.owned : COLORS.neutral);
        bg.stroke({ width: 2, color: isOwned ? COLORS.borderOwned : COLORS.borderNeutral });

        const label = new Text({
          text: cell.name || cell.id,
          style: textStyle,
        });
        label.anchor.set(0.5);
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 2;

        cellContainer.addChild(bg);
        cellContainer.addChild(label);

        cellContainer.eventMode = 'static';
        cellContainer.cursor = 'pointer';

        cellContainer.on('pointerdown', () => {
          const currentState = getGameState();
          const currentPlacementMode = currentState.placementMode;

          if (currentPlacementMode?.active && currentPlacementMode.buildingType) {
            const buildingCells = getBuildingCells(cell.id, currentPlacementMode.buildingType);
            const allValid = buildingCells.every(isCellValidForPlacement);

            if (allValid) {
              currentState.placeBuilding(currentPlacementMode.buildingType, buildingCells);
            }
          } else {
            currentState.selectCell(cell.id);
          }
        });

        cellContainer.on('pointerenter', () => {
          const currentState = getGameState();
          const currentPlacementMode = currentState.placementMode;

          if (currentPlacementMode?.active && currentPlacementMode.buildingType) {
            const buildingCells = getBuildingCells(cell.id, currentPlacementMode.buildingType);
            hoveredCellsRef.current = new Set(buildingCells);

            buildingCells.forEach((cellId) => {
              const sprite = cellSpritesRef.current.get(cellId);
              if (sprite) {
                const isValid = isCellValidForPlacement(cellId);
                const isOwned = currentState.isCellOwned(cellId, 'player');
                updateCellVisual(sprite, {
                  isSelected: false,
                  isOwned,
                  placementState: isValid ? 'valid' : 'invalid',
                });
              }
            });
          }
        });

        cellContainer.on('pointerleave', () => {
          const currentHoveredCells = hoveredCellsRef.current;
          currentHoveredCells.forEach((cellId) => {
            const sprite = cellSpritesRef.current.get(cellId);
            if (sprite) {
              const currentState = getGameState();
              const isSelected = currentState.selectedCellId === cellId;
              const isOwned = currentState.isCellOwned(cellId, 'player');
              updateCellVisual(sprite, {
                isSelected,
                isOwned,
                placementState: 'none',
              });
            }
          });
          hoveredCellsRef.current = new Set();
        });

        mapLayer.addChild(cellContainer);

        cellSpritesRef.current.set(cell.id, {
          container: cellContainer,
          background: bg,
          label,
          cell,
        });
      }
    };

    initApp();

    return () => {
      destroyed = true;
      // Copy refs before cleanup
      const cellSprites = cellSpritesRef.current;
      const buildingSprites = buildingSpritesRef.current;

      cellSprites.clear();
      buildingSprites.forEach((sprite) => destroyBuildingSprite(sprite));
      buildingSprites.clear();
      hoveredCellsRef.current = new Set();
      buildingLayerRef.current = null;

      if (appRef.current) {
        if (appRef.current.canvas && appRef.current.canvas.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        appRef.current.ticker.stop();
        appRef.current.stage.removeChildren();
        appRef.current = null;
      }
    };
  }, []);

  // Update cell visuals when selection or placement mode changes
  useEffect(() => {
    if (cellSpritesRef.current.size === 0) return;

    const state = getGameState();

    cellSpritesRef.current.forEach((sprite, cellId) => {
      const isSelected = cellId === selectedCellId;
      const isOwned = state.isCellOwned(cellId, 'player');

      if (hoveredCellsRef.current.has(cellId)) return;

      updateCellVisual(sprite, {
        isSelected,
        isOwned,
        placementState: 'none',
      });
    });
  }, [selectedCellId, placementMode]);

  // Update buildings when they change
  useEffect(() => {
    if (!buildingLayerRef.current) return;

    const buildingLayer = buildingLayerRef.current;
    const currentBuildingIds = new Set(Object.keys(buildings));

    // Remove buildings that no longer exist
    buildingSpritesRef.current.forEach((sprite, buildingId) => {
      if (!currentBuildingIds.has(buildingId)) {
        destroyBuildingSprite(sprite);
        buildingSpritesRef.current.delete(buildingId);
      }
    });

    // Add or update buildings
    Object.values(buildings).forEach((building) => {
      const existingSprite = buildingSpritesRef.current.get(building.id);

      if (existingSprite) {
        // Update existing
        updateBuildingSprite(existingSprite, building);
      } else {
        // Create new - use first cell for position
        const firstCellId = building.cellIds[0];
        const pos = getCellPixelPosition(firstCellId);

        if (pos) {
          const sprite = createBuildingSprite(building, pos.x, pos.y);
          buildingLayer.addChild(sprite.container);
          buildingSpritesRef.current.set(building.id, sprite);
        }
      }
    });
  }, [buildings]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '800px',
        height: '600px',
        border: '2px solid #4a5568',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
