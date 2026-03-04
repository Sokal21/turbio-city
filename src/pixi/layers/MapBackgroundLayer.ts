/**
 * MapBackgroundLayer - renders satellite/map tiles as background
 *
 * Uses tile services (ESRI, Mapbox, etc.) to render real-world map data
 * behind the game grid. Configurable coordinates and zoom.
 */

import { Container, Sprite, Texture } from 'pixi.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../visuals';

// Tile size in pixels (standard for most tile services)
const TILE_SIZE = 256;

export interface MapBackgroundConfig {
  // Center coordinates (latitude, longitude)
  lat: number;
  lng: number;
  // Zoom level (typically 1-20, higher = more detail)
  zoom: number;
  // Tile provider
  provider: 'esri-satellite' | 'esri-street' | 'osm';
  // Opacity of the background (0-1)
  opacity?: number;
}

// Tile provider URLs
const TILE_PROVIDERS: Record<string, string> = {
  'esri-satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'esri-street': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  'osm': 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
};

/**
 * Convert lat/lng to tile coordinates at a given zoom level
 * Based on OpenStreetMap slippy map tilenames algorithm
 */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/**
 * Convert tile coordinates to pixel position within a tile
 */
function latLngToPixelOffset(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = (((lng + 180) / 360) * n * TILE_SIZE) % TILE_SIZE;
  const latRad = (lat * Math.PI) / 180;
  const y = (((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE) % TILE_SIZE;
  return { x, y };
}

/**
 * Load an image as a texture with CORS support
 */
function loadImageTexture(url: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const texture = Texture.from(img);
      resolve(texture);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load: ${url}`));
    };

    img.src = url;
  });
}

export class MapBackgroundLayer {
  private container: Container;
  private config: MapBackgroundConfig | null = null;
  private loadedTiles: Map<string, Sprite> = new Map();
  private loading = false;

  constructor() {
    this.container = new Container();
    this.container.label = 'mapBackgroundLayer';
  }

  /**
   * Get the PixiJS container for this layer
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Initialize with configuration and load tiles
   */
  async init(config: MapBackgroundConfig): Promise<void> {
    this.config = config;
    this.container.alpha = config.opacity ?? 0.6;

    await this.loadTiles();
  }

  /**
   * Update configuration (e.g., pan/zoom)
   */
  async updateConfig(config: Partial<MapBackgroundConfig>): Promise<void> {
    if (!this.config) return;

    const needsReload =
      config.lat !== undefined && config.lat !== this.config.lat ||
      config.lng !== undefined && config.lng !== this.config.lng ||
      config.zoom !== undefined && config.zoom !== this.config.zoom ||
      config.provider !== undefined && config.provider !== this.config.provider;

    this.config = { ...this.config, ...config };

    if (config.opacity !== undefined) {
      this.container.alpha = config.opacity;
    }

    if (needsReload) {
      await this.loadTiles();
    }
  }

  /**
   * Load tiles for the current configuration
   */
  private async loadTiles(): Promise<void> {
    if (!this.config || this.loading) return;
    this.loading = true;

    // Clear existing tiles
    this.clearTiles();

    const { lat, lng, zoom, provider } = this.config;
    const providerUrl = TILE_PROVIDERS[provider];

    if (!providerUrl) {
      console.error(`[MapBackgroundLayer] Unknown provider: ${provider}`);
      this.loading = false;
      return;
    }

    console.log(`[MapBackgroundLayer] Loading tiles for ${lat}, ${lng} at zoom ${zoom}`);

    // Calculate center tile
    const centerTile = latLngToTile(lat, lng, zoom);
    const pixelOffset = latLngToPixelOffset(lat, lng, zoom);

    console.log(`[MapBackgroundLayer] Center tile: ${centerTile.x}, ${centerTile.y}`);

    // Calculate how many tiles we need to cover the canvas
    const tilesX = Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 2;
    const tilesY = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2;

    // Calculate offset to center the map
    const startOffsetX = CANVAS_WIDTH / 2 - pixelOffset.x;
    const startOffsetY = CANVAS_HEIGHT / 2 - pixelOffset.y;

    // Load tiles
    const tilePromises: Promise<void>[] = [];

    for (let dx = -Math.floor(tilesX / 2); dx <= Math.floor(tilesX / 2); dx++) {
      for (let dy = -Math.floor(tilesY / 2); dy <= Math.floor(tilesY / 2); dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;

        // Calculate pixel position for this tile
        const pixelX = startOffsetX + dx * TILE_SIZE;
        const pixelY = startOffsetY + dy * TILE_SIZE;

        const url = providerUrl
          .replace('{z}', zoom.toString())
          .replace('{x}', tileX.toString())
          .replace('{y}', tileY.toString());

        const tileKey = `${zoom}/${tileX}/${tileY}`;

        tilePromises.push(
          this.loadTile(url, tileKey, pixelX, pixelY)
        );
      }
    }

    await Promise.allSettled(tilePromises);
    this.loading = false;

    console.log(`[MapBackgroundLayer] Loaded ${this.loadedTiles.size} tiles at zoom ${zoom}`);
  }

  /**
   * Load a single tile
   */
  private async loadTile(url: string, key: string, x: number, y: number): Promise<void> {
    try {
      const texture = await loadImageTexture(url);

      // Create sprite
      const sprite = new Sprite(texture);
      sprite.x = x;
      sprite.y = y;
      sprite.width = TILE_SIZE;
      sprite.height = TILE_SIZE;
      sprite.label = `tile-${key}`;

      this.container.addChild(sprite);
      this.loadedTiles.set(key, sprite);
    } catch (err) {
      console.warn(`[MapBackgroundLayer] Failed to load tile: ${key}`, err);
    }
  }

  /**
   * Clear all loaded tiles
   */
  private clearTiles(): void {
    this.loadedTiles.forEach((sprite) => {
      sprite.destroy();
    });
    this.loadedTiles.clear();
    this.container.removeChildren();
  }

  /**
   * Get current configuration
   */
  getConfig(): MapBackgroundConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearTiles();
  }
}

// Default config for Rosario, Argentina (Centro)
export const ROSARIO_DEFAULT_CONFIG: MapBackgroundConfig = {
  lat: -32.9468,
  lng: -60.6393,
  zoom: 16,
  provider: 'esri-satellite',
  opacity: 0.5,
};
