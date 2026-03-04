import type { BuildingVisuals } from "./types";

export const BUILDING_VISUALS: BuildingVisuals & { default: { color: number; emoji: string } } = {
    bunker_droga: { color: 0x38a169, emoji: '💊' },
    cocina_de_merca: { color: 0xd69e2e, emoji: '🧪' },
    armeria: { color: 0xe53e3e, emoji: '🔫' },
    default: { color: 0x718096, emoji: '🏗️' },
  };