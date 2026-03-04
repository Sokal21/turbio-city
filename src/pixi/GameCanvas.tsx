import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useGameStore, getGameActions } from '../store';
import { loadMap, getMap } from './mapLoader';
import type { MapCell } from '../types';

const CELL_SIZE = 60;
const CELL_GAP = 4;

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

  const selectedCellId = useGameStore((state) => state.selectedCellId);

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
        const isStarting = cell.id === map.startingCell;
        bg.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
        bg.fill(isStarting ? 0x4a5568 : 0x2d3748);
        bg.stroke({ width: 2, color: isStarting ? 0x68d391 : 0x4a5568 });

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
        cellContainer.on('pointerdown', () => {
          getGameActions().selectCell(cell.id);
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
      if (appRef.current) {
        // Remove canvas from DOM first
        if (appRef.current.canvas && appRef.current.canvas.parentNode) {
          appRef.current.canvas.parentNode.removeChild(appRef.current.canvas);
        }
        // Stop the ticker
        appRef.current.ticker.stop();
        // Destroy stage children
        appRef.current.stage.removeChildren();
        appRef.current = null;
      }
    };
  }, []);

  // Update selected cell highlight
  useEffect(() => {
    if (cellSpritesRef.current.size === 0) return;

    let map;
    try {
      map = getMap();
    } catch {
      return; // Map not loaded yet
    }

    cellSpritesRef.current.forEach((sprite, cellId) => {
      const isSelected = cellId === selectedCellId;
      const isStarting = cellId === map.startingCell;

      sprite.background.clear();
      sprite.background.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
      sprite.background.fill(isSelected ? 0x553c9a : isStarting ? 0x4a5568 : 0x2d3748);
      sprite.background.stroke({
        width: 2,
        color: isSelected ? 0x9f7aea : isStarting ? 0x68d391 : 0x4a5568,
      });
    });
  }, [selectedCellId]);

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
