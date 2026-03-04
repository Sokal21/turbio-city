import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { PlacedBuilding } from '../store';
import { getBuildingDefinition } from '../game';

const CELL_SIZE = 60;

// Building colors by type
const BUILDING_COLORS: Record<string, { base: number; accent: number }> = {
  bunker_droga: { base: 0x1a365d, accent: 0x2b6cb0 },
  default: { base: 0x2d3748, accent: 0x4a5568 },
};

export interface BuildingSprite {
  container: Container;
  building: PlacedBuilding;
  progressOverlay: Graphics;
  progressText: Text;
  baseGraphics: Graphics;
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

  // Base building graphics
  const baseGraphics = new Graphics();

  // Main building body
  baseGraphics.roundRect(4, 4, CELL_SIZE - 8, CELL_SIZE - 8, 4);
  baseGraphics.fill(colors.base);
  baseGraphics.stroke({ width: 2, color: colors.accent });

  // Add some detail to make it look like a bunker
  // Horizontal lines (ventilation/reinforcement look)
  baseGraphics.rect(8, 16, CELL_SIZE - 16, 3);
  baseGraphics.fill(colors.accent);
  baseGraphics.rect(8, 28, CELL_SIZE - 16, 3);
  baseGraphics.fill(colors.accent);
  baseGraphics.rect(8, 40, CELL_SIZE - 16, 3);
  baseGraphics.fill(colors.accent);

  // Small "door" or entrance
  baseGraphics.roundRect(22, 44, 16, 12, 2);
  baseGraphics.fill(0x1a202c);

  container.addChild(baseGraphics);

  // Progress overlay (fills from bottom)
  const progressOverlay = new Graphics();
  container.addChild(progressOverlay);

  // Progress text
  const textStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 14,
    fontWeight: 'bold',
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
  });

  const progressText = new Text({
    text: '',
    style: textStyle,
  });
  progressText.anchor.set(0.5);
  progressText.x = CELL_SIZE / 2;
  progressText.y = CELL_SIZE / 2;
  container.addChild(progressText);

  // Building name (small, at top)
  if (definition) {
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 8,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 2 },
    });
    const nameText = new Text({
      text: definition.name,
      style: nameStyle,
    });
    nameText.anchor.set(0.5, 0);
    nameText.x = CELL_SIZE / 2;
    nameText.y = 6;
    container.addChild(nameText);
  }

  const sprite: BuildingSprite = {
    container,
    building,
    progressOverlay,
    progressText,
    baseGraphics,
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

  if (building.status === 'constructing') {
    // Show progress
    const progress = building.constructionProgress / building.constructionTotal;
    const fillHeight = (CELL_SIZE - 8) * progress;
    const yStart = CELL_SIZE - 4 - fillHeight;

    sprite.progressOverlay.clear();
    sprite.progressOverlay.rect(4, yStart, CELL_SIZE - 8, fillHeight);
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
    sprite.progressOverlay.roundRect(4, 4, CELL_SIZE - 8, CELL_SIZE - 8, 4);
    sprite.progressOverlay.stroke({ width: 2, color: 0x68d391, alpha: 0.5 });
  }
}

export function destroyBuildingSprite(sprite: BuildingSprite): void {
  sprite.container.destroy({ children: true });
}
