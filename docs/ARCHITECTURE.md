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
│                   Zustand Store (Modular Slices)            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ Resources   │ │ Game Loop   │ │ Map                 │    │
│  │ - money     │ │ - tick      │ │ - cellOwnership     │    │
│  │ - bullets   │ │ - paused    │ │ - selectedCellId    │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Buildings                                           │    │
│  │ - buildings (placed)                                │    │
│  │ - placementMode                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Static Data                               │
│  Map Definition (JSON)  │  Building Definitions (TS)       │
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

## Module Structure (Current)

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component, initializes game
├── store/
│   ├── gameStore.ts         # Combines all slices
│   ├── types.ts             # Shared state types
│   ├── index.ts
│   └── slices/
│       ├── gameLoopSlice.ts   # tick, paused
│       ├── resourcesSlice.ts  # money, bullets
│       ├── mapSlice.ts        # cellOwnership, selection
│       ├── buildingsSlice.ts  # buildings, placementMode
│       └── index.ts
├── game/
│   ├── GameLoop.ts          # Middleware-based game loop
│   ├── types.ts             # Middleware, event types
│   ├── index.ts
│   ├── buildings/
│   │   ├── definitions.ts   # Building definitions (static)
│   │   └── index.ts
│   ├── middlewares/
│   │   ├── buildingsMiddleware.ts   # Construction progress
│   │   ├── resourcesMiddleware.ts   # Resource production
│   │   ├── eventsResolverMiddleware.ts
│   │   └── index.ts
│   └── map/
│       ├── MapController.ts         # Expansion logic, cost calculation
│       └── index.ts
├── pixi/
│   ├── GameCanvas.tsx       # PixiJS canvas orchestrator (thin)
│   ├── BuildingRenderer.ts  # Building sprites (emoji + colored overlay)
│   ├── mapLoader.ts         # Map JSON loading
│   ├── index.ts
│   ├── visuals/             # Visual constants and state
│   │   ├── colors.ts        # CELL_SIZE, COLORS, canvas dimensions
│   │   ├── cellState.ts     # Cell visual state calculation
│   │   └── index.ts
│   ├── layers/              # PixiJS layer managers
│   │   ├── CellLayer.ts           # Cell sprites (create, update, position)
│   │   ├── MapBackgroundLayer.ts  # Satellite tile background
│   │   └── index.ts
│   └── interactions/        # User interaction handlers
│       ├── cellInteractions.ts  # Click, hover, placement logic
│       └── index.ts
├── ui/
│   ├── HUD.tsx              # Resource display
│   ├── CellInfo.tsx         # Selected cell details
│   ├── GameControls.tsx     # Play/Pause/Reset
│   ├── BuildMenu.tsx        # Building selection and placement
│   ├── ExpansionModal.tsx   # Expansion method selection (peaceful/violent)
│   └── index.ts
├── assets/
│   └── maps/
│       └── rosario.json     # Map definition
└── types/
    ├── map.ts               # Map types
    └── index.ts
```

## State Management (Modular Slices)

### Slice Pattern

Each feature defines its own slice with state and actions:

```typescript
// Example: resourcesSlice.ts
export const createResourcesSlice: StateCreator<...> = (set, get) => ({
  resources: { money: 1000, bullets: 100 },

  addResources: (money, bullets) => {
    set((state) => {
      state.resources.money += money;
      state.resources.bullets += bullets;
    });
  },
  // ... more actions
});
```

Slices are combined in gameStore.ts:

```typescript
export const useGameStore = create<GameStore>()(
  immer((...args) => ({
    ...createGameLoopSlice(...args),
    ...createResourcesSlice(...args),
    ...createMapSlice(...args),
    ...createBuildingsSlice(...args),
  }))
);
```

### Current Slices

| Slice | State | Key Actions |
|-------|-------|-------------|
| **gameLoopSlice** | tick, paused | incrementTick, pause, resume |
| **resourcesSlice** | resources | addResources, spendResources, canAfford |
| **mapSlice** | cellOwnership, selectedCellId, expansionModal | selectCell, setCellOwner, openExpansionModal, closeExpansionModal |
| **buildingsSlice** | buildings, placementMode | placeBuilding, cancelBuilding, activateBuilding |

### Static Data

**Map Definition** (JSON):
```typescript
interface ExpansionCost {
  peaceful: { money: number };
  violent: { money: number; bullets: number };
  heat: number;  // stored for future use
}

interface MapCell {
  id: string;
  x: number;
  y: number;
  name?: string;
  expansionCost: ExpansionCost;
}

interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cells: MapCell[];
  adjacency: Record<string, string[]>;
  startingCell: string;
}
```

**Building Definitions** (TypeScript):
```typescript
interface BuildingDefinition {
  type: string;
  name: string;
  description: string;
  size: { width: number; height: number };
  baseCost: { money: number; bullets: number };
  buildTime: number;
  production?: { money?: number; bullets?: number };
  prerequisites?: string[];
}
```

## PixiJS Integration (Modular Architecture)

The PixiJS canvas uses a **modular architecture** to keep code maintainable as the game grows.

### Design Principles

1. **Separation of Concerns**: Each module handles one thing well
2. **Thin Orchestrator**: GameCanvas just wires things together
3. **Layer Independence**: Layers can be developed/tested separately
4. **State-Driven Visuals**: Visual state calculated from game state

### Module Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│                     GameCanvas.tsx                          │
│                   (Thin Orchestrator)                       │
│  - Mounts PixiJS app                                        │
│  - Creates layers                                           │
│  - Wires up state subscriptions                             │
│  - Delegates to modules                                     │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    visuals/     │  │     layers/     │  │  interactions/  │
│                 │  │                 │  │                 │
│ colors.ts       │  │ CellLayer.ts    │  │ cellInteractions│
│ - COLORS        │  │ - Create cells  │  │ - Click handler │
│ - CELL_SIZE     │  │ - Update visual │  │ - Hover handler │
│ - Canvas dims   │  │ - Get position  │  │ - Placement     │
│                 │  │                 │  │   preview       │
│ cellState.ts    │  │ (Future:        │  │                 │
│ - getCellColors │  │  UnitLayer.ts   │  │                 │
│                 │  │  EffectLayer.ts)│  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### CellLayer

Manages all cell sprites on the map:

```typescript
class CellLayer {
  init(config: CellLayerConfig): void;     // Create all cells
  updateCellVisual(cellId, state): void;   // Update one cell
  updateAllCells(getState): void;          // Refresh all cells
  getCellPixelPosition(cellId): Position;  // For building placement
  getSprite(cellId): CellSprite;           // Access sprite
  destroy(): void;                         // Cleanup
}
```

### Cell Visual State

Visual state is calculated from game state:

```typescript
interface CellVisualState {
  isSelected: boolean;
  isOwned: boolean;
  isExpandable: boolean;
  placementState: 'none' | 'valid' | 'invalid';
}

// Priority: placement > selected > owned > expandable > neutral
function getCellColors(state: CellVisualState): { fill, stroke }
```

### Interaction Handlers

Separate handlers for different interactions:

```typescript
// Cell click - placement, expansion, or selection
handleCellClick(cell: MapCell): void;

// Hover enter - show placement preview
handleCellEnter(cell: MapCell, ctx: InteractionContext): void;

// Hover leave - restore visuals
handleCellLeave(ctx: InteractionContext): void;
```

### Adding New Features

To add a new layer (e.g., units):

1. Create `layers/UnitLayer.ts` following CellLayer pattern
2. Add visual constants to `visuals/colors.ts`
3. Add interaction handlers to `interactions/unitInteractions.ts`
4. Wire up in GameCanvas (create layer, subscribe to state)

### Data Flow

```
State Change (Zustand)
    │
    ▼
GameCanvas useEffect
    │
    ▼
refreshAllCellVisuals()
    │
    ├──► getCellVisualState(cellId)  ← Calculate from game state
    │
    └──► cellLayer.updateCellVisual()  ← Apply to sprite
```

### Legacy Code (Simple Example)

```typescript
// Old approach - everything in GameCanvas
function GameCanvas() {
  // 400 lines of mixed concerns...

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
│  │Buildings │ → │Resources │ → │  Units   │ → │  Combat  │ │
│  │          │   │          │   │ (future) │   │ (future) │ │
│  │ progress │   │ +events  │   │          │   │          │ │
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

### Current Middleware Order

1. **buildingsMiddleware** - Updates construction progress, activates completed buildings
2. **resourcesMiddleware** - Checks active buildings, generates resource events
3. **eventsResolverMiddleware** - Processes all events, commits state changes

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
