// Map types - static definition loaded from JSON

export interface ExpansionCost {
  peaceful: { money: number };
  violent: { money: number; bullets: number };
  heat: number; // stored for future use
}

export interface MapCell {
  id: string;
  x: number;
  y: number;
  name?: string;
  expansionCost: ExpansionCost;
}

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: MapCell[];
  adjacency: Record<string, string[]>;
  startingCell: string;
}
