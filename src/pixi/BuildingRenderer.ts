import { Container, Graphics, Text, TextStyle } from 'pixi.js';
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

  // Total width = cells * CELL_SIZE + gaps between cells
  const width = cellsWide * CELL_SIZE + (cellsWide - 1) * CELL_GAP;
  const height = cellsHigh * CELL_SIZE + (cellsHigh - 1) * CELL_GAP;

  return { width, height };
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

  // Main building body - scaled to building size
  baseGraphics.roundRect(4, 4, width - 8, height - 8, 4);
  baseGraphics.fill(colors.base);
  baseGraphics.stroke({ width: 2, color: colors.accent });

  // Add detail lines (scaled proportionally)
  const lineSpacing = Math.min(12, height / 5);
  const numLines = Math.floor((height - 24) / lineSpacing);
  for (let i = 0; i < numLines; i++) {
    const y = 16 + i * lineSpacing;
    baseGraphics.rect(8, y, width - 16, 3);
    baseGraphics.fill(colors.accent);
  }

  // Entrance door (centered at bottom)
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

  // Progress overlay (fills from bottom)
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

  // Building name (centered at top)
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

  const sprite: BuildingSprite = {
    container,
    building,
    progressOverlay,
    progressText,
    baseGraphics,
    width,
    height,
  };

  // Initial update
  updateBuildingSprite(sprite, building);

  return sprite;
}

export function updateBuildingSprite(
  sprite: BuildingSprite,
  building: PlacedBuilding
): void {
  sprite.building = building;
  const { width, height } = sprite;

  if (building.status === 'constructing') {
    // Show progress
    const progress = building.constructionProgress / building.constructionTotal;
    const fillHeight = (height - 8) * progress;
    const yStart = height - 4 - fillHeight;

    sprite.progressOverlay.clear();
    sprite.progressOverlay.rect(4, yStart, width - 8, fillHeight);
    sprite.progressOverlay.fill({ color: 0x68d391, alpha: 0.4 });

    // Update text
    sprite.progressText.text = `${building.constructionProgress}/${building.constructionTotal}`;
    sprite.progressText.visible = true;

    // Dim the base
    sprite.baseGraphics.alpha = 0.6;
  } else {
    // Active - clear progress overlay
    sprite.progressOverlay.clear();
    sprite.progressText.visible = false;
    sprite.baseGraphics.alpha = 1;

    // Add a subtle glow or indicator that it's active
    sprite.progressOverlay.roundRect(4, 4, width - 8, height - 8, 4);
    sprite.progressOverlay.stroke({ width: 2, color: 0x68d391, alpha: 0.5 });
  }
}

export function destroyBuildingSprite(sprite: BuildingSprite): void {
  sprite.container.destroy({ children: true });
}
