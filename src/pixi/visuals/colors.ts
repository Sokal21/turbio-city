/**
 * Visual constants for the game canvas
 *
 * Centralized colors and dimensions for consistent styling across all pixi layers.
 */

// Cell dimensions
export const CELL_SIZE = 60;
export const CELL_GAP = 4;

// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const CANVAS_BG_COLOR = 0x1a1a2e;

// Cell colors
export const COLORS = {
  // Fill colors
  neutral: 0x2d3748,
  owned: 0x4a5568,
  selected: 0x553c9a,
  expandable: 0x3d4a5c,
  validPlacement: 0x276749,
  invalidPlacement: 0x9b2c2c,

  // Border colors
  borderNeutral: 0x4a5568,
  borderOwned: 0x68d391,
  borderSelected: 0x9f7aea,
  borderExpandable: 0x63b3ed,
  borderValid: 0x68d391,
  borderInvalid: 0xfc8181,
} as const;

export type CellColorKey = keyof typeof COLORS;
