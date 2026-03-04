# Turbio City - Roadmap

## Current Status: Planning Phase

We are documenting decisions and architecture before coding.

---

## Phase 0: Planning & Setup ⬅️ CURRENT
- [x] Define game concept
- [x] Choose tech stack (React, PixiJS, Zustand, TypeScript, Vite)
- [x] Define graphics architecture (hybrid approach)
- [x] Define resources system (money, bullets)
- [x] Define units model (soldiers, Travian-style)
- [x] Define map system (grid cells)
- [x] Define expansion mechanics (violent vs peaceful)
- [x] Define game loop (middleware pattern, 1 tick/sec, events system)
- [x] Define state management (Zustand + Immer, map as JSON)
- [x] Document decisions
- [ ] Define building types and costs
- [ ] Project scaffolding

---

## Phase 1: Foundation
- [ ] Vite + React + TypeScript setup
- [ ] PixiJS integration (canvas component)
- [ ] Zustand store (basic structure)
- [ ] Game loop (tick system)
- [ ] Basic resource display (HUD)

**Goal:** Running app with ticking resources

---

## Phase 2: Map System
- [ ] Grid rendering (cells)
- [ ] Cell ownership visualization
- [ ] Cell selection (click handling)
- [ ] Camera pan/zoom (if needed)
- [ ] Territory display

**Goal:** Interactive map with selectable cells

---

## Phase 3: Buildings
- [ ] Building definitions (types, costs)
- [ ] Placement system (cell → building)
- [ ] Building rendering
- [ ] Resource production (per-tick)
- [ ] Building UI (selection, info panel)

**Goal:** Place buildings that generate resources

---

## Phase 4: Expansion
- [ ] Acquire adjacent cells
- [ ] Violent vs peaceful mechanics
- [ ] Cost calculation
- [ ] Heat system (basic)
- [ ] Expansion UI

**Goal:** Grow your territory

---

## Phase 5: Units & Combat
- [ ] Soldier creation (from barracks)
- [ ] Unit rendering
- [ ] Send soldiers to cell
- [ ] Combat resolution (probabilistic)
- [ ] Attack/defend mechanics

**Goal:** Soldiers that can fight

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
- Villagers mechanic
- Multiple rival gangs
- Missions/jobs system
- Research/upgrades
- Events system
- Win conditions
- Real Rosario map overlay

---

## Decisions Pending

| Topic | Status | Notes |
|-------|--------|-------|
| Building types | To discuss | Need full list with costs |
| Combat formula | To discuss | Probabilistic, details TBD |
| Starting conditions | To discuss | Initial resources, map size |
| Save format | To discuss | localStorage? file export? |
