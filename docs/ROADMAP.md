# Turbio City - Roadmap

## Current Status: Phase 3 - Buildings (Logic)

Foundation is complete, building system logic implemented.

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

---

## Phase 3: Buildings ⬅️ CURRENT
- [x] Building definitions (Bunker de Droga)
- [x] Buildings slice (state + actions)
- [x] Buildings middleware (construction progress)
- [x] Resources middleware (checks active buildings)
- [x] Placement logic (validation, cost deduction)
- [x] Cancel with refund
- [ ] Placement UI (RTS-style preview)
- [ ] Building rendering on map
- [ ] Building info panel

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
- More building types
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
| More building types | To discuss | Armory, Barracks, etc. |
| Combat formula | To discuss | Probabilistic, details TBD |
| Save format | To discuss | localStorage? file export? |
