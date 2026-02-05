# Pokespire v2 — Game State & Roadmap  
**Date:** 2026-02-04

---

## 0) Purpose of this document

This document captures:
- **Current state** of Pokespire v2 (what exists and is implemented in design).
- **Target architecture** (how the codebase should be structured).
- **Intended prototype scope** (what the first playable campaign must support).
- **Aspirational roadmap** (multiplayer, meta-progression, content, and systems).

It is meant to be:
- Readable by a human (design intent, systems, and priorities).
- Referencable by Claude Code (clear separation of “built,” “designed but not built,” and “future.”).

---

# I. TARGET ARCHITECTURE (MUST-HAVES)

### A. Delivery format
- Single-page web app.
- Ships as **static files (HTML/CSS/JS)**; no backend required for the prototype.
- Built with **Vite + React**.

### B. Three-layer separation (strict)

#### 1) **Config Layer (data only)**
Holds all tunable content and knobs — **no game rules here**:
- Cards / moves (including costs, effects, targeting, types).
- Playable Pokémon (stats, decks, passives, evolutions).
- Enemy Pokémon.
- Encounters (which enemies appear, in what formations).
- Campaign map (nodes, branches, acts).
- Evolution checkpoints.

#### 2) **Game Engine (Headless)**
Pure logic. No DOM access. Given `(state, action) → newState`.

Responsible for:
- Turn structure & turn order.
- Card resolution & damage calculation.
- Status effects and decay.
- Positioning / targeting.
- Battle win/loss.
- Campaign traversal.
- Randomness that can be seeded for tests.

Must be:
- Fully testable in code (simulate combats, runs, events).

#### 3) **UI Layer (React)**
- Renders current game/combat state.
- Lets players pick cards, targets, and paths.
- Displays HP, mana, statuses, map.
- Talks to engine only via well-defined actions.

---

# II. PROTOTYPE CAMPAIGN (SCOPE)

### A. Campaign structure
One campaign themed around **Team Rocket Lab → escaped Mewtwo**.

Map style:
- Node-based, branching like Slay the Spire.
- Node types:
  - Regular battle
  - Event
  - Boss battle

Two acts:
- **Act 1:** Inside Team Rocket lab → **Giovanni boss**.
- **Act 2:** Path toward **Mewtwo → final boss**.

### B. Couch co-op (prototype mode)
- 1 device, 1–4 players.
- Each player chooses a name and controls **one starter**.

### C. Playable party (up to 4)
Kanto starters with identities:

| Line | Identity |
|---|---|
| **Bulbasaur → Ivysaur → Venusaur** | Poison, healing, leech, support |
| **Squirtle → Wartortle → Blastoise** | Tank, block, team defense |
| **Charmander → Charmeleon → Charizard** | High damage, burn, some AoE |
| **Pikachu → Raichu** | Speed, paralysis, strong single-target |

Each Pokémon tracks:
- Max HP
- Current HP
- Mana / Energy
- Speed
- Deck
- Statuses (Burn, Poison, Paralysis, etc.)

### D. Evolutions (story checkpoints)

**After first regular battle:**
- Bulbasaur → Ivysaur  
- Squirtle → Wartortle  
- Charmander → Charmeleon  
- Pikachu stays Pikachu  

**Before Mewtwo (after “clone battle”):**
- Ivysaur → Venusaur  
- Wartortle → Blastoise  
- Charmeleon → Charizard  
- Pikachu → Raichu  

On evolution:
- Max HP increases.
- Deck can change (upgraded moves, new cards).
- Passives stack (not replaced).

---

# III. CURRENT DESIGNED SYSTEMS (FROM EXISTING GAME DESIGN)

*(Designed; partially or fully implemented in v2 concept)*

## A. Turn structure
Each combatant’s turn:
1. Status ticks (Burn damage; Paralysis decays).
2. Sleep check (if asleep → skip turn).
3. Gain energy (`energyPerTurn`, capped).
4. Draw to 5 cards.
5. Play cards (spend energy).
6. Discard hand.
7. End-of-turn Poison damage (escalates).

## B. Turn order
Sorted by:
1. Effective Speed (base – Paralysis/Slow).
2. Player side before enemy.
3. Slot tiebreaker (player: right → left; enemy: left → right).

## C. Round boundary
After everyone acts:
- Leech ticks (damage + heal, decay by 2).
- Block resets to 0 (except Pressure Hull keeps 50%).
- Slow duration decrements.
- Weak removed.

## D. Damage formula (core)
1. `rawDamage = base + Strength + STAB + passives – Weak`
2. Floor at 1
3. Apply multipliers (e.g., Blaze Strike)
4. Subtract defensive passives (Blooming Cycle, Static Field)
5. Subtract Evasion
6. Apply to Block → then HP

## E. Status effects (designed)
| Status | Behavior |
|---|---|
| Burn | Deals damage at turn start, decays |
| Poison | Deals damage at turn end, escalates |
| Paralysis | Reduces speed, decays |
| Slow | Reduces speed for 2 rounds |
| Weak | Reduces outgoing damage |
| Leech | Damages target + heals source |
| Evasion | Reduces incoming damage |
| Strength | Increases damage |
| Sleep | Skips turn |

## F. Positioning
- 3 columns, 2 rows (front/back).
- AoE types: front row, back row, all, piercing, etc.
- If front row dies, back row becomes front.

## G. Starter identities & passives (stacking)

### Charmander → Charizard (Burn)
- Kindling (apply Burn on Fire damage)
- Spreading Flames (spread Burn)
- Blaze Strike (first Fire attack x2)
- Inferno Momentum (discount highest Fire card)

### Squirtle → Blastoise (Block)
- Baby Shell (gain Block)
- Pressure Hull (retain 50% Block)
- Fortified Cannons (gain Block on Water damage)
- Bastion Barrage (Block → bonus damage)

### Bulbasaur → Venusaur (Leech)
- Baby Vines (apply Leech)
- Spreading Spores (spread Leech)
- Overgrow (doubles Leech application)
- Blooming Cycle (reduce damage from Leeched enemies)

### Pikachu → Raichu (Speed / Paralysis)
- Numbing Strike (apply Paralysis)
- Static Field (reduce damage from slower enemies)
- Counter-Current (deal bonus vs slower enemies)
- **Evolution tradeoff:** Raichu loses 2 Speed but gains +20 HP and powerful cards (Body Slam, Mega Punch, Thunder).

---

# IV. CURRENT CONTENT (DESIGNED)

### Playable starters (initial decks)
- Charmander: Scratch, Defend, Ember, Metal Claw, Smokescreen, Growl  
- Squirtle: Tackle, Defend, Water Gun, Withdraw, Bubble, Tail Whip  
- Bulbasaur: Tackle, Defend, Vine Whip, Leech Seed, Growth, Poison Powder  
- Pikachu: Quick Attack, Defend, Thunder Shock, Thunder Wave, Double Team, Tail Whip  

### Enemies (baseline)
- Rattata, Pidgey, Ekans (basic)
- Snorlax (tank, 4 energy/turn)

### Moves
- 101 moves across 16 types.
- Mix of 0/1/2/3 cost.
- Some “Vanish” cards that disappear when played.

---

# V. NEW DESIGN ADDITIONS (USER ROADMAP — NOT YET BUILT)

## A. Card tuning + “Colorless” cards
1. **Heavy balance pass on existing moves.**
2. Add **generic item-style cards** (non-Pokémon moves), e.g.:
   - Potion (heal)
   - Energy boost
   - Temporary buffs  
These are draftable from special events, similar to **colorless cards in Slay the Spire**.

## B. Held items (Run-defining power)
- Function like **relics** in Slay the Spire.
- Examples: Leftovers, Scope Lens, etc.
- **Do not persist between runs**, but are powerful within a run.
- Shape builds and party strategy.
- **Meta-unlock angle:** As you fill the Pokédex / progress, you can buy certain held items earlier at shops in future runs.

## C. Soft weaknesses (not full Pokémon rules)
- Do **not** want full main-series type dominance.
- Instead, mild modifiers to encourage variety, e.g.:
  - Water might take **25% less damage** from Fire (not 50%).
- Goal: prevent degenerate parties (e.g., 4 Fire stack-burn), without making bad matchups run-ending.

---

# VI. ASPIRATIONAL ROADMAP (BEYOND PROTOTYPE)

## A. Multiplayer
- **Phase 1:** Local couch co-op (already the prototype target).
- **Phase 2:** Online co-op (likely requires backend).

## B. Campaign expansion
- Finish and polish **two-act campaign** (Giovanni → Mewtwo).
- Add:
  - More Pokémon encounters.
  - More enemy types.
  - Future expansions (new environments / generations).

## C. Meta-progression (long-term)
- Each run starts with a basic Pokémon.
- Early nodes allow recruiting additional Pokémon you’ve unlocked.
- **Unlock loop:**
  - Beat a Pokémon on special nodes → unlock it permanently.
- **Pokédex incentive system:**
  - Each Pokémon has 4 skills/passives.
  - Unlocking each skill grants meta-points.
  - Spend points on:
    - Base stat boosts.
    - Starting perks.
    - Early-shop access to held items.
- This discourages “one-trick” runs and pushes variety.

---

# VII. Art / Assets (reference)
Enemy sprites (front-facing):
https://img.pokemondb.net/sprites/black-white/anim/normal/{pokemon}.gif

Ally sprites (back-facing):
https://img.pokemondb.net/sprites/black-white/anim/back-normal/{pokemon}.gif


(Replace `{pokemon}` with lowercase name.)

---

# VIII. What remains to build (high-level)

1. **Engine**
- Clean separation from UI.
- Seedable randomness.
- Full status system.
- Positioning + targeting.

2. **Config**
- Full card database in data.
- Encounters + campaign map.
- Evolution checkpoints.

3. **UI**
- Map navigation.
- Combat UI (hand, statuses, targeting).
- Multiplayer turn UI.

4. **New systems**
- Held items.
- Generic item cards.
- Soft weaknesses.
- Meta-progression loop.

5. **Content**
- Balance pass.
- More enemies.
- Boss mechanics for Giovanni and Mewtwo.
