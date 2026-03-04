# Turbio City - Roadmap

## Current Status: Phase 5 - Units & Combat (In Progress)

Building levels and unit production system implemented. Next: unit deployment and combat.

---

## Phase 0: Planning & Setup ✓ DONE
- [x] Define game concept
- [x] Choose tech stack (React, PixiJS, Zustand, TypeScript, Vite)
- [x] Define graphics architecture (hybrid approach)
- [x] Define resources system (money, bullets)
- [x] Define units model (soldiers, Travian-style)
- [x] Define map system (grid cells)
- [x] Define expansion mechanics (violent vs peaceful)
- [x] Define game loop (middleware pattern, 1 tick/sec, events system)
- [x] Define state management (modular slices)
- [x] Document decisions

---

## Phase 1: Foundation ✓ DONE
- [x] Vite + React + TypeScript setup
- [x] PixiJS integration (canvas component)
- [x] Zustand store (modular slices)
- [x] Game loop (tick system with middleware)
- [x] Basic resource display (HUD)
- [x] Game controls (play/pause/reset)

---

## Phase 2: Map System ✓ DONE
- [x] Grid rendering (cells)
- [x] Cell selection (click handling)
- [x] Cell ownership state
- [x] 3x3 starting territory
- [x] Owned cells visual distinction

---

## Phase 3: Buildings ✓ DONE
- [x] Building definitions (Bunker de Droga)
- [x] Buildings slice (state + actions)
- [x] Buildings middleware (construction progress)
- [x] Resources middleware (checks active buildings)
- [x] Placement logic (validation, cost deduction)
- [x] Cancel with refund
- [x] Placement UI (BuildMenu)
- [x] RTS-style placement preview (green/red highlighting)
- [x] Building rendering on map (BuildingRenderer)
- [x] Construction progress display (overlay + "2/10" text)
- [x] Active building visual state

**Goal achieved:** Place buildings that generate resources

---

## Phase 4: Expansion ✓ DONE
- [x] Acquire adjacent cells
- [x] Violent vs peaceful mechanics
- [x] Cost calculation (per-cell in map JSON)
- [x] MapController for expansion logic
- [x] ExpansionModal UI
- [x] Visual highlighting (blue border for expandable cells)
- [ ] Heat system (basic) - infrastructure ready, logic pending

**Goal achieved:** Grow your territory by clicking expandable cells

---

## Phase 5: Units & Combat ⬅️ IN PROGRESS

### 5.1 Building Levels ✓ DONE
- [x] Building level definitions (explicit arrays)
- [x] Level-based production rates
- [x] Building categories (resources vs units)
- [x] Upgrade cost structure (upgradeCost in levels)
- [x] Updated BuildMenu for levels

### 5.2 Unit System ✓ DONE
- [x] Unit definitions (Soldadito with 3 levels)
- [x] Unit instance structure (stats, location, upkeep)
- [x] Units slice (state management)
- [x] Helper function: createUnitInstance()
- [x] Unit ID counter management

### 5.3 Unit Production ✓ DONE
- [x] Villa Miseria building (produces Soldaditos)
- [x] Production queue per building
- [x] buildingsMiddleware handles production progress
- [x] Units produced to pool on completion
- [x] UNIT_PRODUCED event

### 5.4 Unit Upkeep ✓ DONE
- [x] unitsMiddleware for upkeep
- [x] Only deployed units (not in pool) consume bullets
- [x] Desertion on insufficient resources
- [x] Heat contribution tracking

### 5.5 Unit UI ⬅️ NEXT
- [ ] Production UI (click building to queue units)
- [ ] Unit count display in HUD
- [ ] Pool management UI

### 5.6 Unit Deployment
- [ ] Send units from pool to cell
- [ ] Unit rendering on map
- [ ] Movement (instant or travel time TBD)

### 5.7 Combat
- [ ] Combat resolution (probabilistic)
- [ ] Attack/defend mechanics
- [ ] Losses calculation

**Goal:** Soldiers that can be produced, deployed, and fight

---

## Phase 6: Threats
- [ ] Rival gang AI (basic)
- [ ] Gang territory
- [ ] Gang attacks
- [ ] Police heat thresholds
- [ ] Police raids

**Goal:** Dynamic threats that respond to player

---

## Phase 7: Polish
- [ ] Better graphics (SVG/sprites)
- [ ] Animations (GSAP)
- [ ] Sound effects?
- [ ] Save/load game
- [ ] Balance tuning
- [ ] UI polish

**Goal:** Playable, enjoyable game

---

## Backlog (Future)
- Building upgrades UI
- More unit types
- Villagers mechanic
- Multiple rival gangs
- Missions/jobs system
- Research/upgrades (tech tree)
- Events system
- Win conditions
- Real Rosario map overlay

---

## Decisions Pending

| Topic | Status | Notes |
|-------|--------|-------|
| Upgrade requirements | To implement | Tech tree, building prerequisites |
| Combat formula | To discuss | Probabilistic, details TBD |
| Unit movement | To discuss | Instant vs travel time |
| Save format | To discuss | localStorage? file export? |
