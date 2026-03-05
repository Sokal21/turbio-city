/**
 * GameCanvas - Main PixiJS canvas component
 *
 * This component orchestrates the PixiJS application and layers.
 * Actual rendering logic is delegated to specialized modules:
 * - CellLayer: cell sprite management
 * - BuildingRenderer: building sprites
 * - cellInteractions: click/hover handlers
 * - visuals: colors and state calculation
 */

import { useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
import { useGameStore } from '../store';
import { loadMap, getMap } from './mapLoader';
import { CellLayer, MapBackgroundLayer, ROSARIO_DEFAULT_CONFIG } from './layers';
import {
  createBuildingSprite,
  updateBuildingSprite,
  destroyBuildingSprite,
  type BuildingSprite,
} from './buildings';
import {
  handleCellClick,
  handleCellEnter,
  handleCellLeave,
  refreshAllCellVisuals,
  getCellVisualState,
} from './interactions';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_BG_COLOR } from './visuals';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const mapBackgroundRef = useRef<MapBackgroundLayer | null>(null);
  const cellLayerRef = useRef<CellLayer | null>(null);
  const buildingSpritesRef = useRef<Map<string, BuildingSprite>>(new Map());
  const buildingLayerRef = useRef<Container | null>(null);
  const hoveredCellsRef = useRef<Set<string>>(new Set());

  // Subscribe to state changes
  const selectedCellId = useGameStore((state) => state.selectedCellId);
  const placementMode = useGameStore((state) => state.placementMode);
  const buildings = useGameStore((state) => state.buildings);
  const cellOwnership = useGameStore((state) => state.cellOwnership);
  const pendingAttacks = useGameStore((state) => state.pendingAttacks);

  // Initialize PixiJS application
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    // Load map data
    loadMap('rosario');
    const map = getMap();

    // Create PixiJS application
    const app = new Application();

    const initApp = async () => {
      await app.init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: CANVAS_BG_COLOR,
        antialias: true,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      containerRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // Create map background layer (satellite tiles)
      const mapBackground = new MapBackgroundLayer();
      mapBackgroundRef.current = mapBackground;
      await mapBackground.init(ROSARIO_DEFAULT_CONFIG);
      app.stage.addChild(mapBackground.getContainer());

      // Create cell layer
      const cellLayer = new CellLayer();
      cellLayerRef.current = cellLayer;

      // Create interaction context
      const interactionCtx = {
        cellLayer,
        hoveredCells: hoveredCellsRef.current,
      };

      // Initialize cell layer with callbacks
      cellLayer.init({
        map,
        onCellClick: (cell) => handleCellClick(cell),
        onCellEnter: (cell) => handleCellEnter(cell, interactionCtx),
        onCellLeave: () => handleCellLeave(interactionCtx),
      });

      // Add cell layer to stage
      app.stage.addChild(cellLayer.getContainer());

      // Create building layer (above cells)
      const buildingLayer = new Container();
      buildingLayer.label = 'buildingLayer';
      app.stage.addChild(buildingLayer);
      buildingLayerRef.current = buildingLayer;

      // Initial cell visual update
      cellLayer.updateAllCells((cellId) => getCellVisualState(cellId));
    };

    initApp();

    return () => {
      destroyed = true;

      // Cleanup building sprites
      buildingSpritesRef.current.forEach((sprite) => destroyBuildingSprite(sprite));
      buildingSpritesRef.current.clear();

      // Cleanup cell layer
      cellLayerRef.current?.destroy();
      cellLayerRef.current = null;

      // Cleanup map background
      mapBackgroundRef.current?.destroy();
      mapBackgroundRef.current = null;

      // Cleanup hovered state
      hoveredCellsRef.current.clear();
      buildingLayerRef.current = null;

      // Cleanup PixiJS app
      if (appRef.current) {
        if (appRef.current.canvas?.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        appRef.current.ticker.stop();
        appRef.current.stage.removeChildren();
        appRef.current = null;
      }
    };
  }, []);

  // Update cell visuals when state changes
  useEffect(() => {
    const cellLayer = cellLayerRef.current;
    if (!cellLayer) return;

    refreshAllCellVisuals(cellLayer, hoveredCellsRef.current, selectedCellId);
  }, [selectedCellId, placementMode, cellOwnership]);

  // Update attack warnings when pending attacks change
  useEffect(() => {
    const cellLayer = cellLayerRef.current;
    if (!cellLayer) return;

    // Clear all warnings first
    cellLayer.clearAllAttackWarnings();

    // Set warnings for notified attacks
    for (const attack of pendingAttacks) {
      if (attack.notified) {
        cellLayer.setAttackWarning(attack.targetCellId, attack.ticksRemaining);
      }
    }
  }, [pendingAttacks]);

  // Update buildings when they change
  useEffect(() => {
    const buildingLayer = buildingLayerRef.current;
    const cellLayer = cellLayerRef.current;
    if (!buildingLayer || !cellLayer) return;

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
        updateBuildingSprite(existingSprite, building);
      } else {
        const firstCellId = building.cellIds[0];
        const pos = cellLayer.getCellPixelPosition(firstCellId);

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
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        border: '2px solid #4a5568',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
