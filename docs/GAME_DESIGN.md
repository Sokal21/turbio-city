# Turbio City - Game Design Document

## Concept

You run a local mob in **Turbio City** (inspired by Rosario, Argentina). Start small, expand your territory, manage resources, build your empire. Balance violence with discretion to avoid police attention.

**Genre:** Resource management / Strategy (Travian-like)
**Perspective:** Top-down map view
**Mode:** Single-player, local

---

## Resources

| Resource | Symbol | Purpose | Generation |
|----------|--------|---------|------------|
| **Money** | $ | Growth, expansion, bribes | Time-based (buildings) |
| **Bullets** | 🔫 | Combat, violent expansion | Time-based (buildings) |

### Resource Philosophy
- Money = economic power (buy your way up)
- Bullets = military power (fight your way up)
- Both needed, but ratio depends on playstyle

---

## Units

### Soldiers
- Primary combat unit
- Created from buildings (barracks TBD)
- Sent to cells Travian-style (select X soldiers → send to location)
- Not micromanaged, just quantity and destination
- Used for: attacking, defending, expanding violently

### Combat Resolution (Probabilistic)
- More soldiers = higher win chance
- Defending has advantage (TBD: 1.2x multiplier?)
- Losses on both sides
- Details to be defined

---

## Map

### Structure
- Grid-based cells
- Each cell can be: neutral, player-owned, rival-owned
- Cells have coordinates (x, y)
- Adjacent cells can be acquired

### Territory
- Start with 1 cell (your base)
- Expand by acquiring adjacent cells
- Buildings require owned cells
- Some buildings need multiple cells

### Expansion Methods

| Method | Money Cost | Bullet Cost | Heat Generated |
|--------|------------|-------------|----------------|
| **Peaceful** | High ($200-300) | None | Low (0) |
| **Violent** | Low ($50-80) | Medium (20-30) | High (+10-15) |

Expansion costs are defined per-cell in the map. Named areas (Centro, Puerto Norte, Pichincha) have higher costs.

**Current Values (rosario.json):**
- Standard cells: Peaceful $200, Violent $50 + 20 bullets, +10 heat
- Named areas: Peaceful $250-300, Violent $60-80 + 25-30 bullets, +12-15 heat

---

## Buildings

> To be fully defined. Initial ideas:

| Building | Size | Produces | Cost |
|----------|------|----------|------|
| **Base** | 1 cell | Starting point | Free |
| **Money Printer** | 1 cell | $/tick | $$ |
| **Armory** | 1 cell | Bullets/tick | $$ |
| **Barracks** | 2 cells | Soldiers | $$, bullets |
| **Safehouse** | 1 cell | Defense bonus? | $$ |
| **Warehouse** | 1 cell | Storage cap increase? | $$ |

Buildings can be:
- Upgraded (increase production)
- Destroyed (by rivals, police)
- Rebuilt

---

## Threats

### Rival Gangs
- AI-controlled factions
- Compete for territory
- Attack player cells/buildings
- Triggered by player expansion
- Behavior TBD (aggressive, defensive, opportunistic)

### Police
- Triggered by "heat" level
- Heat increases from:
  - Violent expansion
  - Combat
  - Certain buildings?
- Heat decreases over time
- Can be bribed with money
- Police raids destroy buildings, kill soldiers

---

## Heat System

```
Heat Level: 0 ──────────────────────── 100
            │         │         │
            Safe      Warning   Raid imminent
```

- Heat is a global meter (0-100)
- Actions add heat:
  - Violent expansion: +10-20
  - Combat: +5-10
  - Killing rivals: +5
- Heat decays over time: -1/tick (TBD)
- Bribing police: -20 heat, costs $$
- At high heat: police raids possible

---

## Progression

### Early Game
- 1 base cell
- Limited resources
- Build money/bullet generators
- Expand cautiously

### Mid Game
- Multiple cells
- Barracks, soldiers
- Rival encounters
- Police management

### Late Game
- Large territory
- Multiple production buildings
- Rival gang wars
- High heat management

---

## Future Mechanics (Backlog)

- **Villagers**: Civilians that work for you? Generate passive income?
- **Missions**: One-off jobs for rewards
- **Upgrades**: Research tree for bonuses
- **Multiple rival gangs**: Different personalities
- **Events**: Random occurrences (opportunities, threats)
- **Win condition**: Control X% of map? Defeat all rivals?

---

## Balance Notes

> To be tuned during development

- Starting resources: $1000, 100 bullets (TBD)
- Base income: $10/tick (TBD)
- Expansion costs: Scale with distance from base?
- Combat formula: TBD
- Heat thresholds: TBD
