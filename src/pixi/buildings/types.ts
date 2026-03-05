import type { Container, Graphics, Text } from "pixi.js";
import type { Ticker } from "pixi.js";
import type { PlacedBuilding } from "../../store";
import type { Buildings } from "../../game/buildings/definitions";
// Ensures every building type has a visual definition
export type BuildingVisuals = Record<keyof Buildings, { color: number; emoji: string }>;

export interface BuildingSprite {
    container: Container;
    building: PlacedBuilding;
    overlay: Graphics;
    progressBorder: Graphics;
    emojiText: Text;
    progressText: Text;
    width: number;
    height: number;
    // Construction/production animation state
    displayedProgress: number;
    targetProgress: number;
    fillRate: number;
    tickerCallback: ((ticker: Ticker) => void) | null;
    // Attack animation state
    attackOverlay: Graphics;
    attackWarning: Text;
    attackDisplayedProgress: number;
    attackTargetProgress: number;
    attackFillRate: number;
}
