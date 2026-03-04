// Map types - static definition loaded from JSON

export interface MapCell {
  id: string;
  x: number;
  y: number;
  name?: string;
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
