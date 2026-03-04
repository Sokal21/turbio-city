import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { PlacedBuilding } from '../../store';
import { getBuildingDefinition } from '../../game';
import { getGameState } from '../../store';
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

  const isProducing = building.status === 'active' && building.productionQueue.length > 0;

  if (building.status === 'constructing' || isProducing) {
    // Semi-transparent overlay that fills from bottom (construction or production)
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
    // Active building (idle) - full overlay
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

  // Animation ticker - handles both construction and production
  const tickerCallback = (ticker: Ticker) => {
    const isConstructing = sprite.building.status === 'constructing';
    const isProducing = sprite.building.status === 'active' && sprite.building.productionQueue.length > 0;

    if (!isConstructing && !isProducing) return;

    const deltaSeconds = ticker.deltaMS / 1000;
    // Multiply fillRate by game speed so animation keeps up with faster ticks
    const speed = getGameState().speed;
    const step = sprite.fillRate * speed * deltaSeconds;

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
    // Construction mode - use (progress + 1) / total to fill towards next tick
    sprite.targetProgress = (building.constructionProgress + 1) / building.constructionTotal;
    sprite.fillRate = 1 / building.constructionTotal;

    // Show progress text
    sprite.progressText.text = `${building.constructionProgress}/${building.constructionTotal}`;
    sprite.progressText.visible = true;

    // Dim emoji during construction
    sprite.emojiText.alpha = 0.5;

    drawBuildingOverlay(sprite);
  } else if (building.productionQueue.length > 0) {
    // Active and producing units - fill animation like construction
    const currentItem = building.productionQueue[0];
    const queueCount = building.productionQueue.length;

    // Use (progress + 1) / total so we fill towards the next state
    // At progress 0, we're filling towards 1/total (first tick)
    // At progress (total-1), we're filling towards 100%
    sprite.targetProgress = (currentItem.progress + 1) / currentItem.total;
    sprite.fillRate = 1 / currentItem.total;

    // Reset displayed progress when starting new unit (progress is 0)
    if (currentItem.progress === 0) {
      sprite.displayedProgress = 0;
    }

    // Show queue count
    sprite.progressText.text = `x${queueCount}`;
    sprite.progressText.visible = true;

    // Full emoji while producing
    sprite.emojiText.alpha = 1;

    drawBuildingOverlay(sprite);
  } else {
    // Active building (idle)
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
