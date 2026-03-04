import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { PlacedBuilding } from '../../store';
import { getBuildingDefinition } from '../../game';
import type { BuildingSprite } from './types';
import { BUILDING_VISUALS } from './visuals';
import { CELL_SIZE, CELL_GAP } from '../visuals';

export type { BuildingSprite } from './types';

/**
 * Calculate the pixel dimensions for a building based on its cell size
 */
function getBuildingDimensions(building: PlacedBuilding): { width: number; height: number } {
  const definition = getBuildingDefinition(building.type);
  if (!definition) {
    return { width: CELL_SIZE, height: CELL_SIZE };
  }

  const cellsWide = definition.size.width;
  const cellsHigh = definition.size.height;

  const width = cellsWide * CELL_SIZE + (cellsWide - 1) * CELL_GAP;
  const height = cellsHigh * CELL_SIZE + (cellsHigh - 1) * CELL_GAP;

  return { width, height };
}

/**
 * Draw the building overlay and progress
 */
function drawBuildingOverlay(sprite: BuildingSprite): void {
  const { width, height, displayedProgress, overlay, progressBorder, building } = sprite;
  const visuals = BUILDING_VISUALS[building.type] || BUILDING_VISUALS.default;

  overlay.clear();
  progressBorder.clear();

  if (building.status === 'constructing') {
    // Semi-transparent overlay that fills from bottom
    const fillHeight = height * displayedProgress;
    const yStart = height - fillHeight;

    // Background (unfilled area) - darker, more transparent
    overlay.roundRect(0, 0, width, height, 6);
    overlay.fill({ color: visuals.color, alpha: 0.2 });

    // Filled area - brighter
    if (fillHeight > 0) {
      overlay.roundRect(0, yStart, width, fillHeight, 6);
      overlay.fill({ color: visuals.color, alpha: 0.5 });
    }

    // Progress border - animated
    progressBorder.roundRect(0, 0, width, height, 6);
    progressBorder.stroke({ width: 3, color: visuals.color, alpha: 0.8 });

  } else {
    // Active building - full overlay
    overlay.roundRect(0, 0, width, height, 6);
    overlay.fill({ color: visuals.color, alpha: 0.4 });

    // Glowing border
    progressBorder.roundRect(0, 0, width, height, 6);
    progressBorder.stroke({ width: 3, color: visuals.color, alpha: 1 });
  }
}

export function createBuildingSprite(
  building: PlacedBuilding,
  cellX: number,
  cellY: number
): BuildingSprite {
  const container = new Container();
  container.x = cellX;
  container.y = cellY;
  container.label = `building-${building.id}`;

  const { width, height } = getBuildingDimensions(building);
  const visuals = BUILDING_VISUALS[building.type] || BUILDING_VISUALS.default;

  // Color overlay
  const overlay = new Graphics();
  container.addChild(overlay);

  // Progress/active border
  const progressBorder = new Graphics();
  container.addChild(progressBorder);

  // Emoji in center
  const emojiStyle = new TextStyle({
    fontSize: Math.min(width, height) * 0.5,
  });

  const emojiText = new Text({
    text: visuals.emoji,
    style: emojiStyle,
  });
  emojiText.anchor.set(0.5);
  emojiText.x = width / 2;
  emojiText.y = height / 2;
  container.addChild(emojiText);

  // Progress text (shown during construction)
  const progressStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: Math.min(12, height / 5),
    fontWeight: 'bold',
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  });

  const progressText = new Text({
    text: '',
    style: progressStyle,
  });
  progressText.anchor.set(0.5, 0);
  progressText.x = width / 2;
  progressText.y = height - 16;
  container.addChild(progressText);

  // Calculate fill rate
  const buildTimeSeconds = building.constructionTotal;
  const fillRate = 1 / buildTimeSeconds;

  const initialProgress = building.constructionProgress / building.constructionTotal;

  const sprite: BuildingSprite = {
    container,
    building,
    overlay,
    progressBorder,
    emojiText,
    progressText,
    width,
    height,
    displayedProgress: initialProgress,
    targetProgress: initialProgress,
    fillRate,
    tickerCallback: null,
  };

  // Animation ticker
  const tickerCallback = (ticker: Ticker) => {
    if (sprite.building.status !== 'constructing') return;

    const deltaSeconds = ticker.deltaMS / 1000;
    const step = sprite.fillRate * deltaSeconds;

    if (sprite.displayedProgress < sprite.targetProgress) {
      sprite.displayedProgress = Math.min(
        sprite.displayedProgress + step,
        sprite.targetProgress
      );
      drawBuildingOverlay(sprite);
    }
  };

  sprite.tickerCallback = tickerCallback;
  Ticker.shared.add(tickerCallback);

  // Initial visual
  updateBuildingSprite(sprite, building);

  return sprite;
}

export function updateBuildingSprite(
  sprite: BuildingSprite,
  building: PlacedBuilding
): void {
  sprite.building = building;

  if (building.status === 'constructing') {
    sprite.targetProgress = building.constructionProgress / building.constructionTotal;

    // Show progress text
    sprite.progressText.text = `${building.constructionProgress}/${building.constructionTotal}`;
    sprite.progressText.visible = true;

    // Dim emoji during construction
    sprite.emojiText.alpha = 0.5;

    drawBuildingOverlay(sprite);
  } else {
    // Complete
    sprite.targetProgress = 1;
    sprite.displayedProgress = 1;
    sprite.progressText.visible = false;

    // Full emoji
    sprite.emojiText.alpha = 1;

    drawBuildingOverlay(sprite);
  }
}

export function destroyBuildingSprite(sprite: BuildingSprite): void {
  if (sprite.tickerCallback) {
    Ticker.shared.remove(sprite.tickerCallback);
    sprite.tickerCallback = null;
  }
  sprite.container.destroy({ children: true });
}
