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

## 010 - State Management

**Date:** 2024-01-XX
**Status:** Decided

### Decision

- **Zustand** manages all game state
- **Immer** middleware for clean immutable updates
- **Map definition** stored as separate JSON file (static data)
- **State** only tracks dynamic/changing data

### Core State Structure

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

### Initial Resources

| Resource | Starting Amount |
|----------|-----------------|
| Money | 1000 |
| Bullets | 100 |

### Rationale

- **Zustand + Immer**: Simple API, works in React and PixiJS, clean mutations
- **Map as JSON**: Static data doesn't belong in reactive state
- **Minimal state**: Only track what changes, add more as we define mechanics

---

## Future Decisions Needed

- [ ] Cell ownership state (when we define territory mechanics)
- [ ] Building types and costs
- [ ] Unit state structure
- [ ] Soldier creation and combat formulas
- [ ] Police heat mechanics details
- [ ] Rival gang AI behavior
- [ ] Save/load system
- [ ] "Villagers" mechanic (deferred)
