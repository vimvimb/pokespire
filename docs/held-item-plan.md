# Held Item Implementation Plan

## Beginner Items (Kanto City Set)

These 10 items are the starter set — each player picks one at the start of a run.
Named after Kanto cities, each with a distinct playstyle niche.

| Item | City | Effect | Category |
|------|------|--------|----------|
| Viridian Target | Viridian | Column switch: provoke enemies in that column | Defensive |
| Pewter Stone | Pewter | Start combat with 8 Block, auto-provoke enemies in your column | Defensive |
| Pallet Cannon | Pallet | +5 damage to enemies in your column | Offensive |
| Cerulean Tear | Cerulean | Heal ally in front of you in your column for 5 HP each turn | Support |
| Vermilion Spark | Vermilion | Contact moves provoke the target | Offensive |
| Celadon Leaf | Celadon | Heal the holder for 6 HP at combat end | Support |
| Saffron Spoon | Saffron | Switching into an enemy column applies Enfeeble 3 to all enemies in that column | Specialist |
| Lavender Tombstone | Lavender | If an enemy dies in your column, regain 1 energy | Specialist |
| Cinnabar Ash | Cinnabar | When you play a Vanish card, draw a card | Support |
| Fuchsia Shuriken | Fuchsia | Damage+status cards: halve damage, double status stacks | Specialist |

### Implementation Status

**Not yet implemented** (new mechanics needed):
- Pewter Stone — needs auto-provoke + starting block combo
- Vermilion Spark — needs contact-move provoke trigger
- Celadon Leaf — needs end-of-combat heal hook
- Saffron Spoon — needs column-switch enfeeble trigger
- Lavender Tombstone — needs column-death energy trigger
- Cinnabar Ash — needs vanish-play draw trigger
- Fuchsia Shuriken — needs damage/status split modifier

**Mechanics already exist** (can wire up to existing systems):
- Viridian Target — uses existing column-switch provoke (currently on Smoke Ball)
- Pallet Cannon — uses existing column damage bonus (currently on Sniper Scope)
- Cerulean Tear — uses existing back-row column heal (currently on Sacred Ash)

---

## Legacy Redundant Items

These existing items have effects that are now claimed by beginner items.
They should be redesigned or removed in a future pass.

| Existing Item | Rarity | Effect | Replaced By |
|--------------|--------|--------|-------------|
| Smoke Ball | Uncommon | Column switch: provoke enemies (2 stacks) | Viridian Target |
| Sniper Scope | Uncommon | +5 damage to enemies in your column | Pallet Cannon |
| Sacred Ash | Uncommon | Back row: heal front ally in same column 5 HP at turn start | Cerulean Tear |

---

## Rarity Tiers

| Tier | Source | Count |
|------|--------|-------|
| Beginner | Picked at run start | ~10 |
| Common | Battle/event rewards | ~5-8 |
| Rare | Rare rewards, shops | ~4-6 |
| Boss | Beat act bosses | ~3-5 |

Current `uncommon` tier will be folded into common/rare in a future pass.

---

## Future Items (StS-Inspired Recommendations)

### Tier 1: Must-Have (Iconic, high synergy, unique gameplay)

- **Rocky Helmet** (Uncommon, Defensive) — Contact moves deal 5 damage back to attacker. Classic Pokemon item, anti-melee, synergizes with tanks/taunt.
- **Choice Scarf** (Boss, Specialist) — +1 energy/turn, max 2 cards/turn. Completes the Choice item trio, creates real deckbuilding decisions.
- **Black Sludge** (Boss, Specialist) — +1 energy/turn, 3 self-damage/round (Poison types: heal 3 instead). Lore-perfect, type-specific synergy, interesting risk/reward.
- **King's Rock** (Rare, Specialist) — Debuffs also apply Slow 1. Control build enabler, classic item, interacts with speed system.
- **Big Root** (Uncommon, Support) — +50% healing received. Stacks with Leftovers, Shell Bell, Leech, heal cards.
- **Moxie Charm** (Rare, Offensive) — On KO: +1 energy, draw 1 card. Snowball reward for sweepers, exciting moments.

### Tier 2: Strong Additions

- **Bright Powder** (Uncommon, Defensive) — Front row: Evasion +1 each round. Rewards positioning, evasion build support.
- **Flame Orb** (Boss, Specialist) — +1 energy/turn, self-Burn 2 at start. Synergizes with Fire-type immunity, Guts-like passives.
- **Razor Fang** (Common, Offensive) — First attack each battle: +8 damage. Simple, clean, universally useful.
- **Toxic Plate** (Uncommon, Specialist) — Battle start: Poison 1 to all enemies. Poison build enabler.
- **Power Herb** (Common, Support) — Turn 1: +1 energy. Universally useful, enables expensive openers.
- **Sturdy Charm** (Rare, Defensive) — Attacks dealing 5 or less unblocked damage deal 1 instead. Anti-multi-hit, amazing on tanks.
- **Adrenaline Orb** (Uncommon, Specialist) — Every 5 attacks: +1 energy next turn. Rewards aggressive play.

### Tier 3: Nice to Have

- **Venom Sac** (Uncommon, Specialist) — Poison transfers on enemy KO. Poison build payoff.
- **Sitrus Berry** (Common, Support) — First damage taken: draw 2. Defensive value, tank synergy.
- **Lum Berry** (Uncommon, Defensive) — Immune to one chosen debuff type. Anti-status niche.
- **Protective Pads** (Uncommon, Offensive) — Play 2+ attacks in a turn: gain 5 Block. Offensive defense.
- **Slow Start Gem** (Uncommon, Specialist) — Play 1 or fewer cards: draw 2 extra next turn. Setup/tank synergy.
- **Oran Berry** (Common, Support) — End of battle: heal 15 if below 50%. Between-fight sustain.

### Run-Level Relics (Future System)

These affect the run/map, not individual Pokemon. Separate system TBD.
Ideas from StS: shop discounts, enhanced rest healing, extra draft choices, bonus treasure nodes, reduced encounter rates, etc.

---

## Key Synergy Map

### Rocky Helmet
- Taunt/Provoke (force hits), Iron Barbs passive, front-row tanks

### Choice Scarf
- Expensive cards (3-cost premium), anti-synergy with spam decks, anti-synergy with draw effects

### Black Sludge
- Poison types (free energy + heal), non-Poison types (risky self-damage)

### King's Rock
- AoE debuff application, burn spreaders, paralysis moves, speed-based turn order

### Big Root
- Leftovers (3→4/turn), Shell Bell (2→3/card), Leech Seed, Rest, Sacred Ash

### Moxie Charm
- High-damage finishers, Machamp's Finisher passive, sweeper chains
