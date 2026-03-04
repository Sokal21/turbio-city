# Turbio City - Decision Log

This document tracks key technical and design decisions for the project.

---

## 001 - Tech Stack

**Date:** 2024-01-XX
**Status:** Decided

### Decision

| Component | Choice |
|-----------|--------|
| Language | TypeScript |
| UI Framework | React |
| Graphics Engine | PixiJS |
| State Management | Zustand |
| Build Tool | Vite |

### Rationale

- **TypeScript**: Type safety, better tooling, catch errors early
- **React**: Good for UI components (menus, HUD, dialogs)
- **PixiJS**: Handles game rendering, layering, interaction; performant WebGL; scales well
- **Zustand**: Simple API, works both inside React (UI) and outside (PixiJS), tiny footprint (~1kb), great TS support
- **Vite**: Fast dev server, good React/TS support

---

## 002 - Graphics Architecture (Hybrid Approach)

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Use a **hybrid architecture**:
- **React** handles: UI, menus, resource display, dialogs, controls
- **PixiJS** handles: game map, buildings, units, animations, effects

```
┌─────────────────────────────────────────┐
│              React App                  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │      PixiJS Canvas (game)       │    │  ← Map, buildings, units, animations
│  │                                 │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  React UI Components                    │  ← Menus, HUD, resource bar, dialogs
└─────────────────────────────────────────┘
```

### Rationale

- Don't fight React's render cycle for 60fps game updates
- React excels at UI composition
- PixiJS excels at game graphics
- Clean separation of concerns
- Zustand bridges both worlds (state accessible from React and PixiJS)

### Alternatives Considered

- **@pixi/react**: Declarative but mixes paradigms, can get messy for games
- **Phaser**: Full framework, includes physics/sound we don't need
- **Pure React**: Bad for frequent game updates

---

## 003 - PixiJS Layer Structure

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Organize PixiJS rendering in layers (containers):

```
Stage (root)
├── MapLayer (container)
│   └── Cell sprites
├── BuildingLayer (container)
│   └── Building sprites
├── UnitLayer (container)
│   └── Unit sprites
└── EffectLayer (container)
    └── Animations, highlights
```

### Rationale

- Clear z-ordering (map at bottom, effects on top)
- Easy to show/hide entire layers
- Performance (batch similar sprites)
- Each sprite gets click handling via PixiJS events

---

## 004 - Resources System

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Two resources (Starcraft-style):

| Resource | Purpose |
|----------|---------|
| **Money ($)** | Ability to grow - buy buildings, expand peacefully, bribe police |
| **Bullets** | Ability to fight - combat, violent expansion, defense |

### Rationale

- Simple dual-resource economy creates interesting tradeoffs
- Money = economic power
- Bullets = military power
- Both needed for expansion (different ratios based on method)

---

## 005 - Units Model

**Date:** 2024-01-XX
**Status:** Decided

### Decision

- **Soldiers** are **units**, not resources
- Commanded Travian-style: send X soldiers to a location
- Not individually controlled (no micro)
- Used for: attacking, defending territory
- Combat is probabilistic (numbers matter)

### Rationale

- Keeps gameplay simple (no tactical micro)
- Focus on strategic decisions
- More soldiers = better odds (with diminishing returns TBD)

---

## 006 - Map System

**Date:** 2024-01-XX
**Status:** Decided

### Decision

- Grid-based cell system
- Inspired by Rosario, Argentina (can start abstract, improve later)
- Buildings occupy 1+ cells
- Must control cells before building
- Territory expands by acquiring adjacent cells

### Rationale

- Grid is abstract enough to iterate on
- Can overlay on real map later
- Cell-based building placement is intuitive

---

## 007 - Expansion Mechanics

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Two ways to expand territory:

| Method | Cost | Police Heat |
|--------|------|-------------|
| **Violent** | Low money + bullets | High |
| **Peaceful** | High money | Low |

### Rationale

- Creates strategic choice
- Aggressive players draw police attention
- Patient/wealthy players can expand quietly
- Both paths viable, different tradeoffs

---

## 008 - Threats System

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Two threat types:

1. **Rival Gangs**: Compete for territory, attack buildings
2. **Police**: Triggered by "heat", can be bribed with money

### Rationale

- Gangs create territorial pressure
- Police create consequence for violence
- Money can solve police problems (thematic)
- Balances violent vs peaceful expansion

---

## 009 - Game Loop Architecture (Middleware Pattern)

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Use a **middleware chain pattern** for the game loop:
- Each middleware processes in order, controls when to call `next()`
- Events accumulate during tick in `ctx.events`
- Final middleware (Events Resolver) processes all events and commits state

| Aspect | Decision |
|--------|----------|
| Tick rate | 1 tick/second |
| Pause | Yes (stops ticks, keeps rendering) |
| Speed controls | Not now, architecture supports later |
| Offline progress | None (game stops when closed) |

### Middleware Chain

```
Tick Start
    │
    ▼
┌──────────────┐
│  Resources   │ → Detects production, adds events
├──────────────┤
│    Units     │ → Movement, arrival checks
├──────────────┤
│   Combat     │ → Resolves fights, can halt for major events
├──────────────┤
│     AI       │ → Rival gang decisions
├──────────────┤
│    Heat      │ → Decay, threshold checks
├──────────────┤
│Events Resolver│ → Processes all ctx.events, commits state, triggers UI
└──────────────┘
    │
    ▼
State Committed
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

### Flow Control

- Call `next()` → continue to next middleware
- Don't call `next()` → halt chain (for major events, game over, etc.)
- `await` before `next()` → do something before rest of chain
- `await` after `next()` → do something after rest of chain completes

### Events Pattern

- Middlewares detect conditions and push to `ctx.events`
- Events are data (type + payload)
- Final Events Resolver middleware:
  - Processes all accumulated events
  - Applies state changes
  - Triggers UI notifications
  - Can halt for player interaction (raids, game over)

### Rationale

- **Separation**: Middlewares detect, resolver acts
- **Batching**: Multiple events resolved together
- **Async-friendly**: Can await UI interactions mid-tick
- **Extensible**: Add new middleware easily
- **Testable**: Test event generation and resolution separately
- **Reorderable**: Change middleware order as needed

### Alternatives Considered

- **Priority-based handlers**: Less control over flow, awkward async
- **Simple loop**: Hard to halt, no before/after logic
- **Event-only system**: Harder to reason about order

---

## 010 - State Management (Modular Slices)

**Date:** 2024-01-XX
**Status:** Decided

### Decision

- **Zustand** manages all game state
- **Immer** middleware for clean immutable updates
- **Modular slices** - each feature defines its own state + actions
- **Map definition** stored as separate JSON file (static data)

### Slice Architecture

```
src/store/
├── gameStore.ts          # Combines all slices
├── types.ts              # Shared types
├── slices/
│   ├── gameLoopSlice.ts    # tick, paused
│   ├── resourcesSlice.ts   # money, bullets
│   ├── mapSlice.ts         # cell ownership, selection
│   └── buildingsSlice.ts   # buildings, placement mode
└── index.ts
```

Each slice defines:
- Its state shape
- Its actions
- Combined into one store via spread

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

### Map Definition (Separate JSON)

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

### Initial Values

| Value | Amount |
|-------|--------|
| Money | 1000 |
| Bullets | 100 |
| Starting cells | 3x3 grid centered at 5,5 |

### Rationale

- **Modular slices**: Each feature is self-contained, easy to add new features
- **Zustand + Immer**: Simple API, works in React and PixiJS, clean mutations
- **Map as JSON**: Static data doesn't belong in reactive state

---

## 011 - Building System

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Buildings are structures placed on owned cells that produce resources or units.

### Building Rules

| Rule | Decision |
|------|----------|
| Placement | Only on player-owned cells |
| Overlapping | Not allowed |
| Parallel builds | Yes, multiple simultaneously |
| Flow | Select → Place → Wait |
| Cancel | Yes, full refund |
| Build time | Measured in ticks |

### Building Definition (Static)

```typescript
interface BuildingDefinition {
  type: string;
  name: string;
  description: string;
  size: { width: number; height: number };
  baseCost: { money: number; bullets: number };
  buildTime: number;  // ticks
  production?: { money?: number; bullets?: number };  // per tick when active
  prerequisites?: string[];
}
```

### Placed Building (State)

```typescript
interface PlacedBuilding {
  id: string;
  type: string;
  cellIds: string[];           // cells it occupies
  status: 'constructing' | 'active';
  constructionProgress: number; // 0 to constructionTotal
  constructionTotal: number;    // total ticks needed
  originalCost: {              // for refund on cancel
    money: number;
    bullets: number;
  };
}
```

### First Building: Bunker de Droga

```typescript
{
  type: 'bunker_droga',
  name: 'Bunker de Droga',
  description: 'Genera dinero cada segundo',
  size: { width: 1, height: 1 },
  baseCost: { money: 500, bullets: 0 },
  buildTime: 10,  // 10 ticks = 10 seconds
  production: { money: 1, bullets: 0 },  // 1 money per tick
}
```

### Middleware Integration

Buildings are processed via middleware:
1. **buildingsMiddleware** - updates construction progress each tick
2. **resourcesMiddleware** - checks active buildings, generates resources

### Placement Flow (Implemented)

1. Player clicks building in BuildMenu → `enterPlacementMode(type)`
2. Mouse hovers over map → cells highlight green (valid) or red (invalid)
3. Validity check: cell owned by player AND not occupied
4. For multi-cell buildings: each cell shows individual validity
5. Click on valid cell(s) → `placeBuilding()` called
6. Resources deducted, building added to state with `status: 'constructing'`
7. Each tick → `buildingsMiddleware` increments progress
8. When `progress >= total` → `status: 'active'`, building produces resources

### Building Rendering (Implemented)

- **BuildingRenderer.ts** creates PixiJS sprites for buildings
- **Visual**: Dark blue bunker with reinforced horizontal lines and entrance
- **Construction progress**:
  - Green overlay fills from bottom to top
  - Text shows "2/10" progress
- **Active state**: Full opacity with subtle green glow border
- Buildings rendered on separate layer above map cells

### Rationale

- **Original cost stored**: Enables full refund on cancel
- **Status tracking**: Clear construction vs active state
- **Definitions separate from state**: Static data in code, dynamic in store
- **Middleware processing**: Fits existing game loop architecture
- **Separate building layer**: Clean z-ordering, buildings above cells

---

## 012 - Expansion System Implementation

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Territory expansion is implemented with a modal-based UI flow:

### Architecture

| Component | Responsibility |
|-----------|----------------|
| **MapController** | Singleton that handles expansion logic, cost calculation, validation |
| **ExpansionModal** | UI component for choosing expansion method |
| **mapSlice** | Stores expansion modal state (isOpen, targetCellId) |

### Expansion Flow

1. Player clicks on unowned cell adjacent to their territory
2. `MapController.canExpandTo()` checks:
   - Cell exists
   - Not already owned
   - Adjacent to at least one player cell
3. If expandable → `openExpansionModal(cellId)` called
4. Modal shows two options with costs:
   - **Peaceful**: money only (higher cost, no heat)
   - **Violent**: money + bullets (lower money, adds heat)
5. Player clicks option → `MapController.expandToCell(cellId, method)`
6. Validates affordability, deducts resources, transfers ownership
7. Modal closes, map updates visually

### Map Cell Costs (in JSON)

```typescript
interface ExpansionCost {
  peaceful: { money: number };
  violent: { money: number; bullets: number };
  heat: number;  // stored for future police heat system
}
```

Costs are defined per-cell in the map JSON. Named cells (Centro, Puerto Norte, Pichincha) have higher costs.

### Visual Feedback

- **Expandable cells**: Blue border highlight (adjacent to player territory, not owned)
- **Player cells**: Green border
- **Neutral cells**: Gray border

### MapController API

```typescript
class MapController {
  getExpansionCost(cellId: string): CalculatedExpansionCost | null;
  canExpandTo(cellId: string): { canExpand: boolean; reason?: string };
  canAffordExpansion(cellId: string, method: ExpansionMethod): boolean;
  expandToCell(cellId: string, method: ExpansionMethod): ExpansionResult;
  getExpandableCells(): string[];  // all cells player can expand to
}
```

### Rationale

- **Costs in map JSON**: Different neighborhoods have different difficulty
- **MapController singleton**: Centralizes expansion logic, keeps store actions simple
- **Modal UI**: Clear presentation of costs and methods
- **Visual highlighting**: Player knows which cells are expandable at a glance
- **Heat stored but not used yet**: Infrastructure ready for police system

---

## 013 - PixiJS Modular Architecture

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Refactor the PixiJS `GameCanvas` component into a modular architecture with specialized modules:

```
src/pixi/
├── GameCanvas.tsx           # Thin orchestrator (~100 lines)
├── visuals/
│   ├── colors.ts            # Constants (CELL_SIZE, COLORS, canvas dims)
│   └── cellState.ts         # Visual state calculation
├── layers/
│   └── CellLayer.ts         # Cell sprite management (class)
└── interactions/
    └── cellInteractions.ts  # Click/hover handlers
```

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| **GameCanvas** | Mount PixiJS app, create layers, wire state subscriptions |
| **visuals/colors** | Centralized constants for consistent styling |
| **visuals/cellState** | Calculate fill/stroke colors from game state |
| **layers/CellLayer** | Create, update, destroy cell sprites |
| **interactions/cellInteractions** | Handle clicks, hovers, placement preview |

### Key Patterns

**CellLayer as a class:**
```typescript
class CellLayer {
  init(config): void;                    // Create all sprites
  updateCellVisual(cellId, state): void; // Update one cell
  updateAllCells(getState): void;        // Refresh all
  getCellPixelPosition(cellId): Position;
  destroy(): void;
}
```

**State-driven visuals:**
```typescript
// Visual state calculated from game state
interface CellVisualState {
  isSelected: boolean;
  isOwned: boolean;
  isExpandable: boolean;
  placementState: 'none' | 'valid' | 'invalid';
}

// Priority order determines colors
getCellColors(state) → { fill, stroke }
```

### Rationale

- **Maintainability**: GameCanvas was ~400 lines and growing
- **Testability**: Each module can be tested independently
- **Extensibility**: Add new layers (units, effects) without touching existing code
- **Readability**: Smaller files, single responsibility
- **Team-friendly**: Multiple developers can work on different modules

### Adding New Features

To add a new layer (e.g., units):
1. Create `layers/UnitLayer.ts` following CellLayer pattern
2. Add visual constants to `visuals/colors.ts`
3. Add handlers to `interactions/unitInteractions.ts`
4. Wire up in GameCanvas

### Alternatives Considered

- **React-PixiJS (@pixi/react)**: Declarative but fights imperative game logic
- **Single file with regions**: Gets unwieldy, hard to test
- **Hooks-only approach**: Tried, but class-based layers are cleaner for sprite management

---

## 014 - Satellite Map Background

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Add real satellite imagery as the game background using tile services.

### Implementation

New module `MapBackgroundLayer.ts` that:
- Fetches tiles from ESRI World Imagery (or OSM, etc.)
- Renders them behind the cell layer
- Configurable: lat, lng, zoom, provider, opacity

```typescript
interface MapBackgroundConfig {
  lat: number;           // Center latitude
  lng: number;           // Center longitude
  zoom: number;          // 1-20, higher = more detail
  provider: 'esri-satellite' | 'esri-street' | 'osm';
  opacity?: number;      // 0-1
}

// Default for Rosario
const ROSARIO_DEFAULT_CONFIG = {
  lat: -32.9468,
  lng: -60.6393,
  zoom: 16,
  provider: 'esri-satellite',
  opacity: 0.5,
};
```

### Layer Order

1. MapBackgroundLayer (satellite tiles)
2. CellLayer (semi-transparent cells)
3. BuildingLayer (buildings on top)

### Rationale

- **Immersion**: Real Rosario streets/landmarks visible
- **Configurable**: Easy to change location or style
- **Non-blocking**: Tiles load async, game works without them

---

## 015 - Building Rendering Style (Emoji + Overlay)

**Date:** 2024-01-XX
**Status:** Decided

### Decision

Buildings render as a colored semi-transparent overlay + emoji, replacing detailed graphics.

### Visual Style

```typescript
const BUILDING_VISUALS = {
  bunker_droga:    { color: 0x38a169, emoji: '💊' },  // Green
  cocina_de_merca: { color: 0xd69e2e, emoji: '🧪' },  // Yellow
  armeria:         { color: 0xe53e3e, emoji: '🔫' },  // Red
  cuartel:         { color: 0x805ad5, emoji: '🎖️' },  // Purple
  default:         { color: 0x718096, emoji: '🏗️' },  // Gray
};
```

### Construction State

- **Overlay fills from bottom** (animated, smooth water-fill effect)
- **Emoji dimmed** (50% opacity)
- **Progress text** at bottom ("3/10")
- **Colored border** around zone

### Active State

- **Full overlay** at 40% opacity (satellite shows through)
- **Emoji full brightness**
- **Glowing border**

### Rationale

- **Simplicity**: Easy to add new buildings (just color + emoji)
- **Clarity**: Clear at a glance what each building is
- **Visibility**: Semi-transparent overlay shows satellite/map beneath
- **Extensible**: Can upgrade to sprites later if needed

---

## 016 - Units System

**Date:** 2024-XX-XX
**Status:** Decided

### Decision

Units are combat entities produced by specialized buildings. They have stats, levels, cost, upkeep, and contribute to heat.

### Unit Definition (Static)

```typescript
interface UnitLevelStats {
  level: number;
  attack: number;
  defense: number;
  speed: number;
  cost: Partial<Resources>;      // one-time cost to produce
  upkeep: Partial<Resources>;    // per tick (only when NOT in pool)
  heat: number;                  // contribution to global heat
  buildTime: number;             // ticks to produce
}

interface UnitDefinition {
  type: string;
  name: string;
  description: string;
  levels: UnitLevelStats[];
}
```

### Unit Instance (State)

```typescript
interface UnitInstance {
  id: string;
  type: string;
  level: number;
  attack: number;
  defense: number;
  speed: number;
  upkeep: Partial<Resources>;
  heat: number;
  location: 'pool' | string;  // 'pool' or cellId
}
```

### First Unit: Soldadito

```typescript
{
  type: 'soldadito',
  name: 'Soldadito',
  description: 'Unidad basica de combate',
  levels: [
    { level: 1, attack: 5, defense: 3, speed: 1, cost: { money: 50 }, upkeep: { bullets: 1 }, heat: 1, buildTime: 5 },
    { level: 2, attack: 8, defense: 5, speed: 1, cost: { money: 100 }, upkeep: { bullets: 2 }, heat: 2, buildTime: 8 },
    { level: 3, attack: 12, defense: 8, speed: 2, cost: { money: 200 }, upkeep: { bullets: 3 }, heat: 3, buildTime: 12 },
  ],
}
```

### Upkeep Rules

- **Only deployed units consume upkeep** - units in the pool don't consume bullets
- **Per tick deduction** - handled by `unitsMiddleware`
- **Desertion on failure** - if player can't pay upkeep, a unit deserts (random for now, logic TBD)

### Unit Location

- **Pool**: Global reserve, not assigned to any cell, no upkeep cost
- **Cell**: Deployed to a specific cell, consumes upkeep

### Rationale

- **Levels as explicit arrays**: No calculation functions, clear progression
- **Upkeep only when deployed**: Encourages strategic deployment, pool is "free" storage
- **Heat per unit**: Larger armies attract more attention

---

## 017 - Building Levels System

**Date:** 2024-XX-XX
**Status:** Decided

### Decision

Buildings have levels defined as explicit arrays. Each level has different production rates, unit availability, and upgrade costs.

### Building Level Definition

```typescript
interface BuildingLevel {
  level: number;
  // For resource buildings
  production?: Partial<Resources>;
  // For unit buildings
  produces?: Array<{ unit: keyof Units; maxUnitLevel: number }>;
  // Cost to upgrade TO this level (null for level 1)
  upgradeCost: Partial<Resources> | null;
}
```

### Building Categories

| Category | Purpose | Level Benefits |
|----------|---------|----------------|
| `resources` | Generate money/bullets per tick | Higher production rates |
| `units` | Produce combat units | Higher level units available |

### Resource Building Example (Bunker de Droga)

```typescript
{
  type: 'bunker_droga',
  category: 'resources',
  levels: [
    { level: 1, production: { money: 5 }, upgradeCost: null },
    { level: 2, production: { money: 12 }, upgradeCost: { money: 800 } },
    { level: 3, production: { money: 25 }, upgradeCost: { money: 2000 } },
  ],
}
```

### Unit Building Example (Villa Miseria)

```typescript
{
  type: 'villa_miseria',
  category: 'units',
  levels: [
    { level: 1, produces: [{ unit: 'soldadito', maxUnitLevel: 1 }], upgradeCost: null },
    { level: 2, produces: [{ unit: 'soldadito', maxUnitLevel: 2 }], upgradeCost: { money: 600 } },
    { level: 3, produces: [{ unit: 'soldadito', maxUnitLevel: 3 }], upgradeCost: { money: 1500 } },
  ],
}
```

### Placed Building with Level

```typescript
interface PlacedBuilding {
  id: string;
  type: keyof Buildings;
  level: number;              // baked in at placement
  cellIds: string[];
  status: 'constructing' | 'active';
  constructionProgress: number;
  constructionTotal: number;
  originalCost: Partial<Resources>;
  productionQueue: ProductionQueueItem[];  // for unit buildings
}
```

### Upgrade Mechanics

- **Upgrade = Replace**: Building is replaced with a new structure at the new level
- **Construction time**: Same as initial build time
- **Requirements**: Stored separately (not in definition), checked at upgrade time

### Rationale

- **Explicit levels**: No formulas, clear balance, easy to tune
- **Level baked into placement**: Simpler state, upgrade = new building
- **Category separation**: Clear distinction between resource and unit production

---

## 018 - Unit Production System

**Date:** 2024-XX-XX
**Status:** Decided

### Decision

Unit production uses a queue system per building. Units are produced one at a time over multiple ticks.

### Production Queue Item

```typescript
interface ProductionQueueItem {
  unitType: keyof Units;
  unitLevel: number;
  progress: number;   // current ticks
  total: number;      // buildTime from unit definition
}
```

### Production Flow

```
Player clicks "Produce Soldadito Lvl 1" on Villa Miseria
    │
    ├── Validate: building level allows this unit/level?
    ├── Validate: player can afford unit cost?
    ├── Deduct cost immediately
    └── Add to building's productionQueue

Each tick (buildingsMiddleware):
    │
    ├── For each building with production queue:
    │   ├── Increment progress on first queue item
    │   └── If progress >= total:
    │       ├── Remove from queue
    │       ├── Create unit instance via createUnitInstance()
    │       ├── Add unit to unitsSlice (location: 'pool')
    │       └── Emit UNIT_PRODUCED event
    │
    └── Continue to next middleware
```

### Helper Function

```typescript
// Creates a unit instance from definition at specific level
function createUnitInstance(
  type: keyof Units,
  level: number,
  location: 'pool' | string = 'pool'
): UnitInstance | null
```

### Rationale

- **Queue per building**: Multiple buildings can produce simultaneously
- **One at a time**: Simple, clear production order
- **Cost upfront**: No surprise costs mid-production
- **Produced to pool**: Units start in reserve, player deploys them

---

## 019 - Middleware Order

**Date:** 2024-XX-XX
**Status:** Decided

### Decision

Game loop middlewares execute in this order:

```
1. buildingsMiddleware
   ├── Updates construction progress
   └── Updates unit production queues

2. resourcesMiddleware
   └── Generates resources from active resource buildings

3. unitsMiddleware
   ├── Calculates total upkeep (deployed units only)
   ├── Deducts upkeep if affordable
   └── Triggers desertion if not affordable

4. eventsResolverMiddleware
   └── Processes accumulated events
```

### Rationale

- **Buildings first**: Construction and production complete before resource checks
- **Resources second**: New buildings produce immediately after activation
- **Units third**: Upkeep deducted after income received
- **Events last**: All state changes complete before event processing

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/game/units/definitions.ts` | Unit definitions, helper functions |
| `src/game/units/index.ts` | Unit module exports |
| `src/store/slices/unitsSlice.ts` | Unit state management |
| `src/game/middlewares/unitsMiddleware.ts` | Upkeep and desertion |

### Modified Files

| File | Changes |
|------|---------|
| `src/store/types.ts` | Added unit types, building levels, production queue |
| `src/game/buildings/definitions.ts` | Added levels, category, Villa Miseria |
| `src/store/slices/buildingsSlice.ts` | Added level, production queue management |
| `src/game/middlewares/buildingsMiddleware.ts` | Added unit production handling |
| `src/game/middlewares/resourcesMiddleware.ts` | Uses building level for production |
| `src/pixi/buildings/visuals.ts` | Added Villa Miseria visual |
| `src/ui/BuildMenu.tsx` | Updated for new building structure |
| `src/App.tsx` | Added unitsMiddleware to game loop |

---

## Future Decisions Needed

- [x] ~~Unit state structure~~ (Done - 016)
- [x] ~~Building levels~~ (Done - 017)
- [ ] Combat resolution formula
- [ ] Unit deployment UI
- [ ] Upgrade requirements (tech tree)
- [ ] Police heat mechanics details
- [ ] Rival gang AI behavior
- [ ] Save/load system
