import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore, getGameState } from '../store';
import { loadMap, getMap } from './mapLoader';
import { getBuildingDefinition } from '../game';
import type { MapCell } from '../types';

const CELL_SIZE = 60;
const CELL_GAP = 4;

// Colors
const COLORS = {
  neutral: 0x2d3748,
  owned: 0x4a5568,
  selected: 0x553c9a,
  validPlacement: 0x276749,    // Green
  invalidPlacement: 0x9b2c2c,  // Red
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
  const hoveredCellsRef = useRef<Set<string>>(new Set());

  const selectedCellId = useGameStore((state) => state.selectedCellId);
  const placementMode = useGameStore((state) => state.placementMode);

  // Get cells that would be occupied by a building placed at centerCell
  const getBuildingCells = (centerCellId: string, buildingType: string): string[] => {
    const definition = getBuildingDefinition(buildingType);
    if (!definition) return [centerCellId];

    const { width, height } = definition.size;
    if (width === 1 && height === 1) return [centerCellId];

    const [cx, cy] = centerCellId.split(',').map(Number);
    const cells: string[] = [];

    // Calculate offset to center the building
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
    cellId: string,
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

      // Check if component was unmounted during init
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

      // Calculate offset to center the map
      const mapWidth = map.width * (CELL_SIZE + CELL_GAP);
      const mapHeight = map.height * (CELL_SIZE + CELL_GAP);
      const offsetX = (800 - mapWidth) / 2;
      const offsetY = (600 - mapHeight) / 2;

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

        // Background
        const bg = new Graphics();
        const state = getGameState();
        const isOwned = state.isCellOwned(cell.id, 'player');
        bg.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
        bg.fill(isOwned ? COLORS.owned : COLORS.neutral);
        bg.stroke({ width: 2, color: isOwned ? COLORS.borderOwned : COLORS.borderNeutral });

        // Label
        const label = new Text({
          text: cell.name || cell.id,
          style: textStyle,
        });
        label.anchor.set(0.5);
        label.x = CELL_SIZE / 2;
        label.y = CELL_SIZE / 2;

        cellContainer.addChild(bg);
        cellContainer.addChild(label);

        // Make interactive
        cellContainer.eventMode = 'static';
        cellContainer.cursor = 'pointer';

        // Click handler
        cellContainer.on('pointerdown', () => {
          const currentState = getGameState();
          const currentPlacementMode = currentState.placementMode;

          if (currentPlacementMode?.active && currentPlacementMode.buildingType) {
            // In placement mode - try to place building
            const buildingCells = getBuildingCells(cell.id, currentPlacementMode.buildingType);
            const allValid = buildingCells.every(isCellValidForPlacement);

            if (allValid) {
              currentState.placeBuilding(currentPlacementMode.buildingType, buildingCells);
            }
          } else {
            // Normal mode - select cell
            currentState.selectCell(cell.id);
          }
        });

        // Hover handlers for placement preview
        cellContainer.on('pointerenter', () => {
          const currentState = getGameState();
          const currentPlacementMode = currentState.placementMode;

          if (currentPlacementMode?.active && currentPlacementMode.buildingType) {
            const buildingCells = getBuildingCells(cell.id, currentPlacementMode.buildingType);
            hoveredCellsRef.current = new Set(buildingCells);

            // Update all affected cells
            buildingCells.forEach((cellId) => {
              const sprite = cellSpritesRef.current.get(cellId);
              if (sprite) {
                const isValid = isCellValidForPlacement(cellId);
                const isOwned = currentState.isCellOwned(cellId, 'player');
                updateCellVisual(sprite, cellId, {
                  isSelected: false,
                  isOwned,
                  placementState: isValid ? 'valid' : 'invalid',
                });
              }
            });
          }
        });

        cellContainer.on('pointerleave', () => {
          // Clear hover state for previously hovered cells
          hoveredCellsRef.current.forEach((cellId) => {
            const sprite = cellSpritesRef.current.get(cellId);
            if (sprite) {
              const currentState = getGameState();
              const isSelected = currentState.selectedCellId === cellId;
              const isOwned = currentState.isCellOwned(cellId, 'player');
              updateCellVisual(sprite, cellId, {
                isSelected,
                isOwned,
                placementState: 'none',
              });
            }
          });
          hoveredCellsRef.current.clear();
        });

        mapLayer.addChild(cellContainer);

        // Store reference
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
      cellSpritesRef.current.clear();
      hoveredCellsRef.current.clear();
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

  // Update visuals when selection or placement mode changes
  useEffect(() => {
    if (cellSpritesRef.current.size === 0) return;

    const state = getGameState();

    cellSpritesRef.current.forEach((sprite, cellId) => {
      const isSelected = cellId === selectedCellId;
      const isOwned = state.isCellOwned(cellId, 'player');

      // Don't override hover state
      if (hoveredCellsRef.current.has(cellId)) return;

      updateCellVisual(sprite, cellId, {
        isSelected,
        isOwned,
        placementState: 'none',
      });
    });
  }, [selectedCellId, placementMode]);

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
