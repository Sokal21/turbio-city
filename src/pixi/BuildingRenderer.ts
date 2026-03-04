import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import type { PlacedBuilding } from '../store';
import { getBuildingDefinition } from '../game';
import { CELL_SIZE, CELL_GAP } from './visuals';

// Building colors by type
const BUILDING_COLORS: Record<string, { base: number; accent: number }> = {
  bunker_droga: { base: 0x1a365d, accent: 0x2b6cb0 },
  cocina_de_merca: { base: 0xa68221, accent: 0x78601d },
  default: { base: 0x2d3748, accent: 0x4a5568 },
};

export interface BuildingSprite {
  container: Container;
  building: PlacedBuilding;
  progressOverlay: Graphics;
  progressText: Text;
  baseGraphics: Graphics;
  width: number;
  height: number;
  // Animation state
  displayedProgress: number;  // 0-1, what's currently shown
  targetProgress: number;     // 0-1, where we're going
  fillRate: number;           // progress per second (calculated from build time)
  tickerCallback: ((ticker: Ticker) => void) | null;
}

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
 * Draw the progress fill based on current animated progress
 */
function drawProgressFill(sprite: BuildingSprite): void {
  const { width, height, displayedProgress, progressOverlay } = sprite;

  progressOverlay.clear();

  if (sprite.building.status === 'constructing') {
    const fillHeight = (height - 8) * displayedProgress;
    const yStart = height - 4 - fillHeight;

    // Main fill
    progressOverlay.rect(4, yStart, width - 8, fillHeight);
    progressOverlay.fill({ color: 0x68d391, alpha: 0.4 });

    // "Water surface" highlight at the top
    if (fillHeight > 2) {
      progressOverlay.rect(4, yStart, width - 8, 2);
      progressOverlay.fill({ color: 0x9ae6b4, alpha: 0.6 });
    }

    // Add subtle wave effect using a slightly darker band
    if (fillHeight > 6) {
      progressOverlay.rect(4, yStart + 3, width - 8, 1);
      progressOverlay.fill({ color: 0x48bb78, alpha: 0.3 });
    }
  } else {
    // Active glow
    progressOverlay.roundRect(4, 4, width - 8, height - 8, 4);
    progressOverlay.stroke({ width: 2, color: 0x68d391, alpha: 0.5 });
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

  const colors = BUILDING_COLORS[building.type] || BUILDING_COLORS.default;
  const definition = getBuildingDefinition(building.type);
  const { width, height } = getBuildingDimensions(building);

  // Base building graphics
  const baseGraphics = new Graphics();

  baseGraphics.roundRect(4, 4, width - 8, height - 8, 4);
  baseGraphics.fill(colors.base);
  baseGraphics.stroke({ width: 2, color: colors.accent });

  // Detail lines
  const lineSpacing = Math.min(12, height / 5);
  const numLines = Math.floor((height - 24) / lineSpacing);
  for (let i = 0; i < numLines; i++) {
    const y = 16 + i * lineSpacing;
    baseGraphics.rect(8, y, width - 16, 3);
    baseGraphics.fill(colors.accent);
  }

  // Entrance door
  const doorWidth = Math.min(24, width / 3);
  const doorHeight = Math.min(16, height / 4);
  baseGraphics.roundRect(
    (width - doorWidth) / 2,
    height - 4 - doorHeight,
    doorWidth,
    doorHeight,
    2
  );
  baseGraphics.fill(0x1a202c);

  container.addChild(baseGraphics);

  // Progress overlay
  const progressOverlay = new Graphics();
  container.addChild(progressOverlay);

  // Progress text
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: Math.min(14, height / 4),
    fontWeight: 'bold',
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  });

  const progressText = new Text({
    text: '',
    style: textStyle,
  });
  progressText.anchor.set(0.5);
  progressText.x = width / 2;
  progressText.y = height / 2;
  container.addChild(progressText);

  // Building name
  if (definition) {
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: Math.min(10, width / 8),
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 },
    });
    const nameText = new Text({
      text: definition.name,
      style: nameStyle,
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = width / 2;
    nameText.y = 6;
    container.addChild(nameText);
  }

  // Calculate fill rate: we want to fill 100% over the total build time
  // buildTime is in ticks, 1 tick = 1 second
  const buildTimeSeconds = building.constructionTotal;
  const fillRate = 1 / buildTimeSeconds; // progress per second

  const initialProgress = building.constructionProgress / building.constructionTotal;

  const sprite: BuildingSprite = {
    container,
    building,
    progressOverlay,
    progressText,
    baseGraphics,
    width,
    height,
    displayedProgress: initialProgress,
    targetProgress: initialProgress,
    fillRate,
    tickerCallback: null,
  };

  // Animation ticker - constant fill rate like water
  const tickerCallback = (ticker: Ticker) => {
    if (sprite.building.status !== 'constructing') return;

    // Move at constant rate toward target (or slightly beyond for smoothness)
    const deltaSeconds = ticker.deltaMS / 1000;
    const step = sprite.fillRate * deltaSeconds;

    if (sprite.displayedProgress < sprite.targetProgress) {
      sprite.displayedProgress = Math.min(
        sprite.displayedProgress + step,
        sprite.targetProgress
      );
      drawProgressFill(sprite);
    }
  };

  sprite.tickerCallback = tickerCallback;
  Ticker.shared.add(tickerCallback);

  // Initial visual update
  updateBuildingSprite(sprite, building);

  return sprite;
}

export function updateBuildingSprite(
  sprite: BuildingSprite,
  building: PlacedBuilding
): void {
  sprite.building = building;

  if (building.status === 'constructing') {
    // Set new target - animation will fill toward it at constant rate
    sprite.targetProgress = building.constructionProgress / building.constructionTotal;

    // Update text
    sprite.progressText.text = `${building.constructionProgress}/${building.constructionTotal}`;
    sprite.progressText.visible = true;
    sprite.baseGraphics.alpha = 0.6;

    drawProgressFill(sprite);
  } else {
    // Complete
    sprite.targetProgress = 1;
    sprite.displayedProgress = 1;
    sprite.progressText.visible = false;
    sprite.baseGraphics.alpha = 1;

    drawProgressFill(sprite);
  }
}

export function destroyBuildingSprite(sprite: BuildingSprite): void {
  if (sprite.tickerCallback) {
    Ticker.shared.remove(sprite.tickerCallback);
    sprite.tickerCallback = null;
  }
  sprite.container.destroy({ children: true });
}
