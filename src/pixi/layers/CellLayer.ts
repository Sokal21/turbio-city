/**
 * CellLayer - manages all cell sprites on the map
 *
 * Responsibilities:
 * - Create cell sprites from map data
 * - Update cell visuals based on state changes
 * - Provide sprite access for interactions
 * - Handle cell pixel position calculations
 */

import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { MapCell, MapDefinition } from '../../types';
import { CELL_SIZE, CELL_GAP, CANVAS_WIDTH, CANVAS_HEIGHT } from '../visuals/colors';
import { getCellColors, type CellVisualState } from '../visuals/cellState';

export interface CellSprite {
  container: Container;
  background: Graphics;
  label: Text;
  cell: MapCell;
  attackWarning: Text;
  attackOverlay: Graphics;
  // Attack animation state
  attackTargetProgress: number;
  attackDisplayedProgress: number;
  attackFillRate: number;
  // Movement animation state
  movementOverlay: Graphics;
  movementWarning: Text;
  movementTargetProgress: number;
  movementDisplayedProgress: number;
  movementFillRate: number;
  // Menu button (shown on hover)
  menuButton: Graphics;
  menuButtonType: 'none' | 'production' | 'expansion';
}

export interface CellLayerConfig {
  map: MapDefinition;
  onCellClick: (cell: MapCell) => void;
  onCellEnter: (cell: MapCell) => void;
  onCellLeave: (cell: MapCell) => void;
  onMenuButtonClick?: (cell: MapCell, type: 'production' | 'expansion') => void;
}

export class CellLayer {
  private container: Container;
  private sprites: Map<string, CellSprite> = new Map();
  private offset: { x: number; y: number } = { x: 0, y: 0 };
  private tickerCallback: ((ticker: Ticker) => void) | null = null;
  private onMenuButtonClick?: (cell: MapCell, type: 'production' | 'expansion') => void;

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
    const { map, onCellClick, onCellEnter, onCellLeave, onMenuButtonClick } = config;
    this.onMenuButtonClick = onMenuButtonClick;

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

    // Start animation ticker for attack and movement overlays
    this.tickerCallback = (ticker: Ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;

      this.sprites.forEach((sprite) => {
        // Attack animation
        if (sprite.attackTargetProgress > 0) {
          const step = sprite.attackFillRate * deltaSeconds;

          if (sprite.attackDisplayedProgress < sprite.attackTargetProgress) {
            sprite.attackDisplayedProgress = Math.min(
              sprite.attackDisplayedProgress + step,
              sprite.attackTargetProgress
            );
            this.drawAttackOverlay(sprite);
          }
        }

        // Movement animation
        if (sprite.movementTargetProgress > 0) {
          const step = sprite.movementFillRate * deltaSeconds;

          if (sprite.movementDisplayedProgress < sprite.movementTargetProgress) {
            sprite.movementDisplayedProgress = Math.min(
              sprite.movementDisplayedProgress + step,
              sprite.movementTargetProgress
            );
            this.drawMovementOverlay(sprite);
          }
        }
      });
    };
    Ticker.shared.add(this.tickerCallback);
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

    // Attack overlay (red fill from bottom)
    const attackOverlay = new Graphics();

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

    // Movement overlay (purple fill from bottom)
    const movementOverlay = new Graphics();

    // Movement indicator
    const movementWarningStyle = new TextStyle({
      fontSize: 14,
    });
    const movementWarning = new Text({
      text: '→',
      style: movementWarningStyle,
    });
    movementWarning.anchor.set(0.5);
    movementWarning.x = 10;
    movementWarning.y = 10;
    movementWarning.visible = false;

    // Menu button (shown on hover for production buildings or expandable cells)
    const menuButton = new Graphics();
    menuButton.visible = false;
    menuButton.eventMode = 'static';
    menuButton.cursor = 'pointer';

    cellContainer.addChild(background);
    cellContainer.addChild(movementOverlay);
    cellContainer.addChild(attackOverlay);
    cellContainer.addChild(label);
    cellContainer.addChild(movementWarning);
    cellContainer.addChild(attackWarning);
    cellContainer.addChild(menuButton);

    return {
      container: cellContainer,
      background,
      label,
      cell,
      attackWarning,
      attackOverlay,
      attackTargetProgress: 0,
      attackDisplayedProgress: 0,
      attackFillRate: 0,
      movementOverlay,
      movementWarning,
      movementTargetProgress: 0,
      movementDisplayedProgress: 0,
      movementFillRate: 0,
      menuButton,
      menuButtonType: 'none',
    };
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
   * Draw the red attack overlay fill
   */
  private drawAttackOverlay(sprite: CellSprite): void {
    const { attackOverlay, attackDisplayedProgress } = sprite;

    attackOverlay.clear();

    if (attackDisplayedProgress <= 0) return;

    // Fill from bottom to top in red
    const fillHeight = CELL_SIZE * attackDisplayedProgress;
    const yStart = CELL_SIZE - fillHeight;

    attackOverlay.roundRect(0, yStart, CELL_SIZE, fillHeight, 4);
    attackOverlay.fill({ color: 0xe53e3e, alpha: 0.5 });
  }

  /**
   * Set attack progress for a cell (for animation)
   */
  setAttackProgress(
    cellId: string,
    ticksRemaining: number,
    ticksTotal: number,
    gameSpeed: number
  ): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    // Progress increases as attack approaches (inverse of remaining)
    const progress = 1 - ticksRemaining / ticksTotal;

    sprite.attackTargetProgress = progress;
    // Fill rate: complete the fill over the remaining time, adjusted for game speed
    sprite.attackFillRate = (1 / ticksTotal) * gameSpeed;

    // Show warning
    sprite.attackWarning.visible = true;
    sprite.attackWarning.text = `⚠️${ticksRemaining}`;
  }

  /**
   * Clear attack progress for a cell
   */
  clearAttackProgress(cellId: string): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    sprite.attackTargetProgress = 0;
    sprite.attackDisplayedProgress = 0;
    sprite.attackFillRate = 0;
    sprite.attackWarning.visible = false;
    sprite.attackOverlay.clear();
  }

  /**
   * Clear all attack warnings and progress
   */
  clearAllAttackWarnings(): void {
    this.sprites.forEach((sprite) => {
      sprite.attackWarning.visible = false;
      sprite.attackTargetProgress = 0;
      sprite.attackDisplayedProgress = 0;
      sprite.attackFillRate = 0;
      sprite.attackOverlay.clear();
    });
  }

  /**
   * Draw the purple movement overlay fill
   */
  private drawMovementOverlay(sprite: CellSprite): void {
    const { movementOverlay, movementDisplayedProgress } = sprite;

    movementOverlay.clear();

    if (movementDisplayedProgress <= 0) return;

    // Fill from bottom to top in purple
    const fillHeight = CELL_SIZE * movementDisplayedProgress;
    const yStart = CELL_SIZE - fillHeight;

    movementOverlay.roundRect(0, yStart, CELL_SIZE, fillHeight, 4);
    movementOverlay.fill({ color: 0x805ad5, alpha: 0.5 });
  }

  /**
   * Set movement progress for a cell (for animation)
   */
  setMovementProgress(
    cellId: string,
    ticksRemaining: number,
    ticksTotal: number,
    gameSpeed: number
  ): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    // Progress increases as units approach
    const progress = 1 - ticksRemaining / ticksTotal;

    sprite.movementTargetProgress = progress;
    sprite.movementFillRate = (1 / ticksTotal) * gameSpeed;

    // Show indicator
    sprite.movementWarning.visible = true;
    sprite.movementWarning.text = `→${ticksRemaining}`;
  }

  /**
   * Clear movement progress for a cell
   */
  clearMovementProgress(cellId: string): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    sprite.movementTargetProgress = 0;
    sprite.movementDisplayedProgress = 0;
    sprite.movementFillRate = 0;
    sprite.movementWarning.visible = false;
    sprite.movementOverlay.clear();
  }

  /**
   * Clear all movement progress
   */
  clearAllMovementProgress(): void {
    this.sprites.forEach((sprite) => {
      sprite.movementWarning.visible = false;
      sprite.movementTargetProgress = 0;
      sprite.movementDisplayedProgress = 0;
      sprite.movementFillRate = 0;
      sprite.movementOverlay.clear();
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
   * Show menu button on a cell
   */
  showMenuButton(cellId: string, type: 'production' | 'expansion'): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    const { menuButton, cell } = sprite;

    // Clear and redraw with appropriate style
    menuButton.clear();

    const buttonSize = 16;
    const padding = 4;

    if (type === 'production') {
      // Purple circle with gear-like appearance for production
      menuButton.circle(padding + buttonSize / 2, padding + buttonSize / 2, buttonSize / 2);
      menuButton.fill({ color: 0x805ad5 });
      menuButton.stroke({ width: 2, color: 0x9f7aea });
      // Inner dot
      menuButton.circle(padding + buttonSize / 2, padding + buttonSize / 2, 3);
      menuButton.fill({ color: 0xffffff });
    } else {
      // Green circle with plus for expansion
      menuButton.circle(padding + buttonSize / 2, padding + buttonSize / 2, buttonSize / 2);
      menuButton.fill({ color: 0x48bb78 });
      menuButton.stroke({ width: 2, color: 0x68d391 });
      // Plus sign
      menuButton.rect(padding + buttonSize / 2 - 4, padding + buttonSize / 2 - 1, 8, 2);
      menuButton.rect(padding + buttonSize / 2 - 1, padding + buttonSize / 2 - 4, 2, 8);
      menuButton.fill({ color: 0xffffff });
    }

    sprite.menuButtonType = type;
    menuButton.visible = true;

    // Remove old listeners and add new one
    menuButton.removeAllListeners();
    menuButton.on('pointerdown', (e) => {
      e.stopPropagation();
      if (this.onMenuButtonClick) {
        this.onMenuButtonClick(cell, type);
      }
    });
  }

  /**
   * Hide menu button on a cell
   */
  hideMenuButton(cellId: string): void {
    const sprite = this.sprites.get(cellId);
    if (!sprite) return;

    sprite.menuButton.visible = false;
    sprite.menuButtonType = 'none';
  }

  /**
   * Hide all menu buttons
   */
  hideAllMenuButtons(): void {
    this.sprites.forEach((sprite) => {
      sprite.menuButton.visible = false;
      sprite.menuButtonType = 'none';
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.tickerCallback) {
      Ticker.shared.remove(this.tickerCallback);
      this.tickerCallback = null;
    }
    this.sprites.clear();
    this.container.removeChildren();
  }
}
