/**
 * CellLayer - manages all cell sprites on the map
 *
 * Responsibilities:
 * - Create cell sprites from map data
 * - Update cell visuals based on state changes
 * - Provide sprite access for interactions
 * - Handle cell pixel position calculations
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { MapCell, MapDefinition } from '../../types';
import { CELL_SIZE, CELL_GAP, CANVAS_WIDTH, CANVAS_HEIGHT } from '../visuals/colors';
import { getCellColors, type CellVisualState } from '../visuals/cellState';

export interface CellSprite {
  container: Container;
  background: Graphics;
  label: Text;
  cell: MapCell;
  attackWarning: Text;
}

export interface CellLayerConfig {
  map: MapDefinition;
  onCellClick: (cell: MapCell) => void;
  onCellEnter: (cell: MapCell) => void;
  onCellLeave: (cell: MapCell) => void;
}

export class CellLayer {
  private container: Container;
  private sprites: Map<string, CellSprite> = new Map();
  private offset: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    this.container = new Container();
    this.container.label = 'cellLayer';
  }

  /**
   * Get the PixiJS container for this layer
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Get the map offset (for positioning buildings, etc.)
   */
  getOffset(): { x: number; y: number } {
    return { ...this.offset };
  }

  /**
   * Initialize the layer with map data and callbacks
   */
  init(config: CellLayerConfig): void {
    const { map, onCellClick, onCellEnter, onCellLeave } = config;

    // Calculate offset to center the map
    const mapWidth = map.width * (CELL_SIZE + CELL_GAP);
    const mapHeight = map.height * (CELL_SIZE + CELL_GAP);
    this.offset = {
      x: (CANVAS_WIDTH - mapWidth) / 2,
      y: (CANVAS_HEIGHT - mapHeight) / 2,
    };

    // Text style for cell labels
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
      align: 'center',
    });

    // Create sprite for each cell
    for (const cell of map.cells) {
      const sprite = this.createCellSprite(cell, textStyle);

      // Setup event handlers
      sprite.container.eventMode = 'static';
      sprite.container.cursor = 'pointer';

      sprite.container.on('pointerdown', () => onCellClick(cell));
      sprite.container.on('pointerenter', () => onCellEnter(cell));
      sprite.container.on('pointerleave', () => onCellLeave(cell));

      this.container.addChild(sprite.container);
      this.sprites.set(cell.id, sprite);
    }
  }

  /**
   * Create a single cell sprite
   */
  private createCellSprite(cell: MapCell, textStyle: TextStyle): CellSprite {
    const cellContainer = new Container();
    cellContainer.x = this.offset.x + cell.x * (CELL_SIZE + CELL_GAP);
    cellContainer.y = this.offset.y + cell.y * (CELL_SIZE + CELL_GAP);
    cellContainer.label = `cell-${cell.id}`;

    const background = new Graphics();
    // Initial render as neutral - will be updated immediately after
    background.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
    background.fill(0x2d3748);
    background.stroke({ width: 2, color: 0x4a5568 });

    const label = new Text({
      text: cell.name || cell.id,
      style: textStyle,
    });
    label.anchor.set(0.5);
    label.x = CELL_SIZE / 2;
    label.y = CELL_SIZE / 2;

    // Attack warning indicator
    const warningStyle = new TextStyle({
      fontSize: 16,
    });
    const attackWarning = new Text({
      text: '⚠️',
      style: warningStyle,
    });
    attackWarning.anchor.set(0.5);
    attackWarning.x = CELL_SIZE - 10;
    attackWarning.y = 10;
    attackWarning.visible = false;

    cellContainer.addChild(background);
    cellContainer.addChild(label);
    cellContainer.addChild(attackWarning);

    return { container: cellContainer, background, label, cell, attackWarning };
  }

  /**
   * Get a cell sprite by ID
   */
  getSprite(cellId: string): CellSprite | undefined {
    return this.sprites.get(cellId);
  }

  /**
   * Get all cell sprites
   */
  getAllSprites(): Map<string, CellSprite> {
    return this.sprites;
  }

  /**
   * Update a cell's visual appearance
   */
  updateCellVisual(cellId: string, state: CellVisualState): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    const colors = getCellColors(state);

    sprite.background.clear();
    sprite.background.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 4);
    sprite.background.fill({ color: colors.fill, alpha: colors.fillAlpha });
    sprite.background.stroke({ width: 2, color: colors.stroke });
  }

  /**
   * Update all cells with a state provider function
   */
  updateAllCells(getState: (cellId: string) => CellVisualState): void {
    this.sprites.forEach((_, cellId) => {
      const state = getState(cellId);
      this.updateCellVisual(cellId, state);
    });
  }

  /**
   * Update attack warning visibility for a cell
   */
  setAttackWarning(cellId: string, ticksRemaining: number | null): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    if (ticksRemaining !== null && ticksRemaining > 0) {
      sprite.attackWarning.visible = true;
      sprite.attackWarning.text = `⚠️${ticksRemaining}`;
    } else {
      sprite.attackWarning.visible = false;
    }
  }

  /**
   * Clear all attack warnings
   */
  clearAllAttackWarnings(): void {
    this.sprites.forEach((sprite) => {
      sprite.attackWarning.visible = false;
    });
  }

  /**
   * Get pixel position for a cell ID
   */
  getCellPixelPosition(cellId: string): { x: number; y: number } | null {
    const [x, y] = cellId.split(',').map(Number);
    if (isNaN(x) || isNaN(y)) return null;

    return {
      x: this.offset.x + x * (CELL_SIZE + CELL_GAP),
      y: this.offset.y + y * (CELL_SIZE + CELL_GAP),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.sprites.clear();
    this.container.removeChildren();
  }
}
