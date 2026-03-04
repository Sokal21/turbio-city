# Turbio City - Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    UI Layer                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │ HUD     │ │ Menus   │ │ Dialogs │ │ Controls    │  │  │
│  │  │(resources)│         │ │         │ │             │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               PixiJS Game Canvas                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Stage                                           │  │  │
│  │  │  ├── MapLayer      (terrain, cells)             │  │  │
│  │  │  ├── BuildingLayer (structures)                 │  │  │
│  │  │  ├── UnitLayer     (soldiers)                   │  │  │
│  │  │  └── EffectLayer   (animations, highlights)     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Store                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ Resources   │ │ Game Loop   │ │ UI State            │    │
│  │ - money     │ │ - tick      │ │ - selectedCellId    │    │
│  │ - bullets   │ │ - paused    │ │                     │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Map Definition (JSON)                     │
│  Static data: cells, adjacency, startingCell                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Game Engine                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ Tick Loop   │ │ Economy     │ │ Combat System       │    │
│  │ (per second)│ │ (production)│ │ (resolution)        │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| UI | React |
| Graphics | PixiJS |
| State | Zustand |
| Build | Vite |

## Data Flow

```
User Input (click cell)
    │
    ▼
PixiJS Event Handler
    │
    ▼
Zustand Action (e.g., selectCell)
    │
    ├──► React re-renders (UI updates)
    │
    └──► PixiJS reads state (visual updates on next frame)
```

## Module Structure (Planned)

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component
├── store/
│   ├── gameStore.ts         # Zustand store
│   └── types.ts             # State types
├── game/
│   ├── engine.ts            # Game loop, tick management
│   ├── economy.ts           # Resource production
│   ├── combat.ts            # Combat resolution
│   └── ai.ts                # Rival gang AI
├── pixi/
│   ├── Game.tsx             # PixiJS canvas React component
│   ├── layers/
│   │   ├── MapLayer.ts
│   │   ├── BuildingLayer.ts
│   │   ├── UnitLayer.ts
│   │   └── EffectLayer.ts
│   └── sprites/
│       ├── CellSprite.ts
│       ├── BuildingSprite.ts
│       └── UnitSprite.ts
├── ui/
│   ├── HUD.tsx              # Resource display
│   ├── BuildMenu.tsx        # Building selection
│   ├── CellInfo.tsx         # Selected cell details
│   └── GameControls.tsx     # Pause, speed, etc.
└── types/
    ├── game.ts              # Game entity types
    ├── map.ts               # Map/cell types
    └── buildings.ts         # Building definitions
```

## State Management

### Zustand Store (Dynamic State)

```typescript
interface GameStore {
  // Game loop
  tick: number;
  paused: boolean;

  // Resources
  resources: {
    money: number;
    bullets: number;
  };

  // UI
  selectedCellId: string | null;

  // Actions
  actions: GameActions;
}

// Initial values
const INITIAL_RESOURCES = {
  money: 1000,
  bullets: 100,
};
```

### Map Definition (Static JSON)

```typescript
interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: Array<{
    id: string;
    x: number;
    y: number;
    name?: string;
  }>;
  adjacency: Record<string, string[]>;
  startingCell: string;
}
```

Map is loaded from JSON file, not stored in Zustand.
State will be extended as we define more mechanics (buildings, units, etc.).

## PixiJS Integration

PixiJS canvas mounted via React ref:

```typescript
// Simplified example
function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>();

  useEffect(() => {
    const app = new PIXI.Application({ /* config */ });
    containerRef.current?.appendChild(app.view);
    appRef.current = app;

    // Setup layers
    const mapLayer = new PIXI.Container();
    const buildingLayer = new PIXI.Container();
    // ...

    app.stage.addChild(mapLayer, buildingLayer, /* ... */);

    // Game loop
    app.ticker.add((delta) => {
      const state = useGameStore.getState();
      // Update visuals based on state
    });

    return () => app.destroy(true);
  }, []);

  return <div ref={containerRef} />;
}
```

## State Access Pattern

```typescript
// In React components (reactive)
const money = useGameStore((state) => state.resources.money);

// In PixiJS/game logic (non-reactive, direct access)
const state = useGameStore.getState();
const actions = useGameStore.getState().actions;
```

## Game Loop Architecture

### Overview

The game loop uses a **middleware chain pattern**. Each middleware:
- Receives context (`ctx`) with current state and accumulated events
- Does its work (detection, calculations)
- Decides whether to call `next()` to continue the chain
- Can halt the chain for major events

```
┌─────────────────────────────────────────────────────────────┐
│                      TICK EXECUTION                         │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │Resources │ → │  Units   │ → │  Combat  │ → │    AI    │ │
│  │          │   │          │   │          │   │          │ │
│  │ +events  │   │ +events  │   │ +events  │   │ +events  │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                             │
│                         ctx.events accumulates              │
│                                ↓                            │
│                      ┌─────────────────┐                    │
│                      │ Events Resolver │  ← Final middleware│
│                      │                 │                    │
│                      │ - Process all   │                    │
│                      │ - Update state  │                    │
│                      │ - Trigger UI    │                    │
│                      └─────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Core Types

```typescript
type TickContext = {
  tick: number;
  delta: number;
  state: GameState;
  events: GameEvent[];  // Accumulated during tick
};

type NextFn = () => Promise<void>;
type Middleware = (ctx: TickContext, next: NextFn) => Promise<void>;
```

### Event Types

```typescript
type GameEvent =
  | { type: 'RESOURCE_PRODUCED'; resource: 'money' | 'bullets'; amount: number }
  | { type: 'UNIT_ARRIVED'; unitId: string; cellId: string }
  | { type: 'COMBAT_STARTED'; cellId: string; attackers: string[]; defenders: string[] }
  | { type: 'COMBAT_RESOLVED'; cellId: string; winner: 'attacker' | 'defender'; losses: number }
  | { type: 'BUILDING_DESTROYED'; buildingId: string }
  | { type: 'CELL_CAPTURED'; cellId: string; by: 'player' | 'rival' }
  | { type: 'HEAT_INCREASED'; amount: number; reason: string }
  | { type: 'POLICE_RAID'; cellId: string }
  | { type: 'GAME_OVER'; reason: string };
```

### GameLoop Class

```typescript
class GameLoop {
  private middlewares: Middleware[] = [];
  private tickInterval = 1000;  // 1 tick/second
  private paused = false;
  private tickCount = 0;
  private speedMultiplier = 1;  // Ready for future

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async runTick(): Promise<void> {
    const ctx: TickContext = {
      tick: this.tickCount++,
      delta: this.tickInterval,
      state: getGameState(),
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
  }

  start(): void { /* ... */ }
  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }
  setSpeed(multiplier: number): void { /* future */ }
}
```

### Middleware Examples

```typescript
// Resources middleware - detects production
const resourcesMiddleware: Middleware = async (ctx, next) => {
  const production = calculateProduction(ctx.state);

  if (production.money > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'money',
      amount: production.money
    });
  }

  if (production.bullets > 0) {
    ctx.events.push({
      type: 'RESOURCE_PRODUCED',
      resource: 'bullets',
      amount: production.bullets
    });
  }

  await next();
};

// Events resolver - final middleware
const eventsResolverMiddleware: Middleware = async (ctx, next) => {
  for (const event of ctx.events) {
    switch (event.type) {
      case 'RESOURCE_PRODUCED':
        applyResourceGain(ctx.state, event);
        break;

      case 'COMBAT_RESOLVED':
        applyCombatResult(ctx.state, event);
        notifyUI('combat', event);
        break;

      case 'POLICE_RAID':
        await showRaidUI(event);  // Can await UI
        applyRaidDamage(ctx.state, event);
        break;

      case 'GAME_OVER':
        await showGameOverUI(event);
        return;  // Don't call next - halt
    }
  }

  commitState(ctx.state);
  await next();
};
```

### Setup

```typescript
const gameLoop = new GameLoop()
  .use(resourcesMiddleware)
  .use(unitsMiddleware)
  .use(combatMiddleware)
  .use(aiMiddleware)
  .use(heatMiddleware)
  .use(eventsResolverMiddleware);

gameLoop.start();
```

### Render Loop vs Game Loop

```
┌─────────────────────────────────────────────────────────┐
│                    Two Loops                            │
│                                                         │
│  Game Loop (1 tick/sec)     Render Loop (60fps)        │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │ Middleware chain    │    │ PixiJS ticker       │    │
│  │ State updates       │    │ Read state          │    │
│  │ Event processing    │    │ Update visuals      │    │
│  └─────────────────────┘    │ Interpolate         │    │
│           │                 └─────────────────────┘    │
│           │                          ↑                 │
│           └──────────────────────────┘                 │
│                    State (Zustand)                     │
└─────────────────────────────────────────────────────────┘
```

- **Game Loop**: Updates state at fixed interval (1/sec)
- **Render Loop**: Reads state, renders at 60fps
- Decoupled: smooth visuals, consistent game logic
