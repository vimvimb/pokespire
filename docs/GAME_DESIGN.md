# Pokespire v2 - Game Design Document

## Overview

**Pokespire** is a tactical deck-building roguelike combining Pokemon with Slay the Spire mechanics. Players control a party of Pokemon, battle enemies using card-based combat, and progress through leveling and evolution systems.

**Core Pillars:**
- Turn-based tactical combat with grid positioning (front/back rows)
- Card-based moves played from hand using energy
- Progression system with leveling, evolution, and stacking passive abilities
- Status effects creating diverse strategic interactions
- Passive ability synergies rewarding playstyle choices

---

## Combat System

### Turn Structure

Each combatant's turn follows these steps:

1. **Status Ticks** - Burn deals damage (stacks decay), Paralysis decays
2. **Sleep Check** - If asleep, skip remaining steps
3. **Gain Energy** - Add `energyPerTurn` (capped at `energyCap`)
4. **Draw Cards** - Draw to `handSize` (default 5)
5. **Play Cards** - Spend energy to play moves (repeatable)
6. **Discard Hand** - Remaining cards go to discard pile
7. **End-of-Turn** - Poison deals damage (stacks escalate)

### Turn Order

Combatants act in order determined by:
1. **Effective Speed** (descending) - base speed minus Paralysis/Slow
2. **Side** (tiebreaker) - Player before enemy
3. **Slot** (tiebreaker) - Player: rightmost first; Enemy: leftmost first

When speed-affecting status is applied mid-round, turn order recalculates for remaining combatants.

### Round Boundary

After all combatants act:
- Leech ticks (damage to target, heal to source, decay by 2)
- Block resets to 0 (Pressure Hull retains 50%)
- Slow duration decrements
- Weak removed

---

## Damage Calculation

**Full Formula (in order):**

```
1. rawDamage = baseDamage + Strength + STAB + BastionBonus + CounterCurrent - Weak
2. Floor at 1
3. Apply Blaze Strike multiplier (x2 if triggered)
4. Subtract Blooming Cycle reduction
5. Subtract Static Field reduction
6. Subtract Evasion
7. Apply to Block first, remainder to HP
```

**Modifiers:**
| Modifier | Source | Effect |
|----------|--------|--------|
| Strength | Status | +1 damage per stack |
| Weak | Status | -1 damage per stack |
| STAB | Type match | +2 if move type matches Pokemon type |
| Blaze Strike | Passive | x2 on first Fire attack per turn |
| Bastion Barrage | Passive | +floor(Block x 0.25) on Water attacks |
| Counter-Current | Passive | +floor((yourSpeed - theirSpeed) / 2) vs slower enemies |
| Blooming Cycle | Passive | -floor(leechStacks / 2) from enemies with Leech |
| Static Field | Passive | -floor((yourSpeed - theirSpeed) / 2) from slower enemies |
| Evasion | Status | -1 damage per stack |

---

## Status Effects

| Status | Stacking | Decay | Effect |
|--------|----------|-------|--------|
| **Burn** | Additive | Start of turn (-1) | Deals stacks damage at turn start |
| **Poison** | Additive | Never (escalates +1) | Deals stacks damage at turn end |
| **Paralysis** | Additive | Start of turn (-1) | Reduces speed by stacks |
| **Slow** | Replace | Round end (duration) | Reduces speed by stacks for 2 rounds |
| **Weak** | Replace | Round end (removed) | Reduces outgoing damage by stacks |
| **Leech** | Additive | Round end (-2) | Deals stacks damage, heals source |
| **Evasion** | Replace | Persistent | Reduces incoming damage by stacks |
| **Strength** | Additive | Persistent | Increases outgoing damage by stacks |
| **Sleep** | Additive | Start of turn (-1) | Skips turn |

---

## Positioning System

**Grid Layout:**
- 3 columns (0, 1, 2) per side
- 2 rows (front, back)
- Party size 1-3: front row only
- Party size 4-6: first 3 front, rest back

**Targeting Ranges:**
| Range | Description |
|-------|-------------|
| `front` | Single target in front row |
| `back` | Single target in back row |
| `any` | Single target, either row |
| `front_row` | AoE: all front row enemies |
| `back_row` | AoE: all back row enemies |
| `all` | AoE: all enemies |
| `piercing` | Front target + same column behind |
| `self` | Self-targeting |

**Row Collapse:** When all front row Pokemon die, back row becomes the "effective front."

---

## Progression System

Each Pokemon has 4 progression levels. Passives stack (not replaced) as you level up.

### Charmander Line (Fire - Burn Theme)

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Charmander | 30 | 6 | Kindling | - |
| 2 | Charmeleon | +10 | 7 | Spreading Flames | Flamethrower |
| 3 | Charizard | +10 | 8 | Blaze Strike | Fire Blast |
| 4 | Charizard | - | - | Inferno Momentum | - |

**Passive Synergy:** Kindling applies Burn on Fire damage. Spreading Flames spreads Burn to adjacent enemies. Blaze Strike doubles first Fire attack. Inferno Momentum discounts highest Fire card by 3.

### Squirtle Line (Water - Block Theme)

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Squirtle | 38 | 4 | Baby Shell | - |
| 2 | Wartortle | +10 | 5 | Pressure Hull | Bubble Beam |
| 3 | Blastoise | +10 | 5 | Fortified Cannons | Hydro Pump |
| 4 | Blastoise | - | - | Bastion Barrage | - |

**Passive Synergy:** Baby Shell grants 3 Block at turn start. Pressure Hull retains 50% Block. Fortified Cannons gains Block on Water damage. Bastion Barrage adds Block-based bonus damage.

### Bulbasaur Line (Grass - Leech Theme)

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Bulbasaur | 36 | 5 | Baby Vines | - |
| 2 | Ivysaur | +10 | 5 | Spreading Spores | 2x Razor Leaf |
| 3 | Venusaur | +10 | 5 | Overgrow | Solar Beam |
| 4 | Venusaur | - | - | Blooming Cycle | - |

**Passive Synergy:** Baby Vines applies Leech on Grass damage. Spreading Spores spreads Leech to adjacent enemies. Overgrow doubles Leech application. Blooming Cycle reduces damage from Leeched enemies.

### Pikachu Line (Electric - Speed Theme)

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Pikachu | 28 | 8 | Numbing Strike | - |
| 2 | Pikachu | - | 8 | Static Field | - |
| 3 | Pikachu | - | 8 | Counter-Current | - |
| 4 | Raichu | +20 | 6 | - | Body Slam, Mega Punch, Thunder |

**Passive Synergy:** Numbing Strike applies Paralysis on Electric damage (slowing enemies). Static Field reduces damage from slower enemies. Counter-Current deals bonus damage to slower enemies. Raichu evolution trades 2 Speed for 20 HP and powerful cards.

**Unique Design:** Pikachu doesn't evolve until level 4, gaining all three speed-based passives first. Raichu evolution is a tradeoff: sacrificing speed advantage for tankiness and card power.

---

## Passive Abilities Reference

| Passive | Trigger | Effect |
|---------|---------|--------|
| **Kindling** | On Fire damage | Apply +1 Burn |
| **Spreading Flames** | On Burn applied | Apply 1 Burn to adjacent enemies |
| **Blaze Strike** | On Fire attack | First Fire attack each turn deals x2 |
| **Inferno Momentum** | Turn start | Reduce highest-cost Fire card by 3 |
| **Baby Shell** | Turn start | Gain 3 Block |
| **Pressure Hull** | Round end | Retain 50% Block |
| **Fortified Cannons** | On Water damage | Gain Block = floor(damage / 2) |
| **Bastion Barrage** | On Water attack | +floor(Block x 0.25) damage |
| **Baby Vines** | On Grass damage | Apply +1 Leech (+2 with Overgrow) |
| **Spreading Spores** | On Leech applied | Apply 1 Leech to adjacent enemies |
| **Overgrow** | Modifier | Baby Vines applies +2 instead of +1 |
| **Blooming Cycle** | On enemy attack | Enemies with Leech deal -floor(stacks/2) |
| **Numbing Strike** | On Electric damage | Apply +1 Paralysis |
| **Static Field** | On being attacked | -floor((yourSpeed - theirSpeed) / 2) from slower enemies |
| **Counter-Current** | On attacking | +floor((yourSpeed - theirSpeed) / 2) vs slower enemies |

---

## Content Summary

### Playable Pokemon

| Pokemon | Types | HP | Speed | Starter Deck |
|---------|-------|-----|-------|--------------|
| Charmander | Fire | 30 | 6 | Scratch x3, Defend x2, Ember x2, Metal Claw, Smokescreen, Growl |
| Squirtle | Water | 38 | 4 | Tackle x3, Defend x2, Water Gun x2, Withdraw, Bubble, Tail Whip |
| Bulbasaur | Grass/Poison | 36 | 5 | Tackle x3, Defend x2, Vine Whip x2, Leech Seed, Growth, Poison Powder |
| Pikachu | Electric | 28 | 8 | Quick Attack x3, Defend x2, Thunder Shock x2, Thunder Wave, Double Team, Tail Whip |

### Enemy Pokemon

| Pokemon | Types | HP | Speed | Notes |
|---------|-------|-----|-------|-------|
| Rattata | Normal | 25 | 5 | Basic enemy |
| Pidgey | Normal/Flying | 22 | 6 | Basic enemy |
| Ekans | Poison | 30 | 4 | Basic enemy |
| Snorlax | Normal | 100 | 2 | Tank, 4 energy/turn |

### Move Pool

- **101 total moves** across 16 types
- **Cost distribution:** 0-cost (6), 1-cost (57), 2-cost (25), 3-cost (12)
- **Vanish moves:** Growth, Tail Whip, Growl, Hiss, Smokescreen (removed after play)

---

## Energy System

- **Start:** 0 energy each turn
- **Gain:** `energyPerTurn` (typically 3)
- **Cap:** `energyCap` (typically 10)
- **Carryover:** Unspent energy carries to next turn (capped)

---

## Deck Mechanics

- **Draw pile** - Shuffle discard back in when empty
- **Hand size** - Draw to 5 cards per turn
- **Discard** - Unplayed cards discarded at turn end
- **Vanish** - Some cards removed from game when played (never reshuffled)

---

## Design Philosophy

**Elemental Identity:** Each starter has a distinct mechanical identity tied to their element:
- Fire: Aggressive burn damage over time
- Water: Defensive block accumulation
- Grass: Sustain through life drain
- Electric: Speed manipulation and advantage

**Passive Stacking:** Unlike typical RPGs where abilities replace each other, Pokespire passives stack. A level 4 Pokemon has all 4 passives active simultaneously, creating powerful synergies.

**Meaningful Tradeoffs:** Raichu's evolution exemplifies this - trading Pikachu's exceptional speed (and passive effectiveness) for raw stats and powerful cards.

**Status Interactions:** Statuses interact with passives in interesting ways:
- Paralysis from Numbing Strike reduces enemy speed, amplifying Static Field and Counter-Current
- Leech from Baby Vines triggers Blooming Cycle's damage reduction
- Burn from Kindling spreads via Spreading Flames
