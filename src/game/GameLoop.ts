import { getGameState, getGameActions } from '../store';
import type { Middleware, TickContext } from './types';

export class GameLoop {
  private middlewares: Middleware[] = [];
  private tickInterval = 1000; // 1 tick per second
  private intervalId: number | null = null;
  private tickCount = 0;
  private running = false;

  /**
   * Register a middleware to be executed on each tick
   */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Execute all middlewares in order
   */
  async runTick(): Promise<void> {
    const state = getGameState();

    // Don't run if paused
    if (state.paused) {
      return;
    }

    const ctx: TickContext = {
      tick: this.tickCount++,
      delta: this.tickInterval,
      state,
      events: [],
    };

    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(ctx, next);
      }
    };

    await next();

    // Update tick count in store
    getGameActions().tick();
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.intervalId = window.setInterval(() => {
      this.runTick();
    }, this.tickInterval);

    console.log('[GameLoop] Started');
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    console.log('[GameLoop] Stopped');
  }

  /**
   * Reset the game loop
   */
  reset(): void {
    this.tickCount = 0;
    console.log('[GameLoop] Reset');
  }

  /**
   * Check if loop is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Set tick interval (for future speed controls)
   */
  setTickInterval(ms: number): void {
    this.tickInterval = ms;

    // Restart if running
    if (this.running) {
      this.stop();
      this.start();
    }
  }
}

// Singleton instance
export const gameLoop = new GameLoop();
