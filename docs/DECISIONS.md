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

## Future Decisions Needed

- [ ] More building types (Armory, Barracks)
- [ ] Unit state structure
- [ ] Soldier creation and combat formulas
- [ ] Police heat mechanics details
- [ ] Rival gang AI behavior
- [ ] Save/load system
- [ ] "Villagers" mechanic (deferred)
