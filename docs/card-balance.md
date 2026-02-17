# Card Balance Framework

This document defines the standardized formulas used to balance all cards in Pokespire. When adding new cards or rebalancing existing ones, follow these rules.

---

## Core Formula

```
damage = rate × cost
```

| Rarity | Rate | 1-cost | 2-cost | 3-cost |
|---|---|---|---|---|
| **Basic** | 5 | 5 | 10 | 15 |
| **Common** | 7 | 7 | 14 | 21 |
| **Uncommon** | 9 | 9 | 18 | 27 |
| **Rare** | 11 | 11 | 22 | 33 |
| **Epic** | 13 | 13 | 26 | 39 |
| **Legendary** | 15 | 15 | 30 | 45 |

These are **any_enemy, single-target, pure damage** baselines (no status effects, no block, no other bonuses).

The rarity bump naturally scales with cost: +2 per rarity at 1-cost, +4 at 2-cost, +6 at 3-cost.

---

## Targeting Modifiers

| Targeting | Modifier |
|---|---|
| **front_enemy / back_enemy** | +10% of base (rounded) |
| **any_enemy** | Baseline (no modifier) |
| **column / front_row** (2 targets) | Each target gets **65%** of base |
| **any_row** (2 targets) | Each target gets **60%** of base |
| **all_enemies** (3-6 targets) | Each target gets **50%** of base |

### Front Enemy Reference Table

| | 1-cost | 2-cost | 3-cost |
|---|---|---|---|
| **Basic** | 6 | 11 | 17 |
| **Common** | 8 | 15 | 23 |
| **Uncommon** | 10 | 20 | 30 |
| **Rare** | 12 | 24 | 36 |
| **Epic** | 14 | 29 | 43 |

---

## Status Effect Costs

When a card applies a status effect alongside damage, subtract the status cost from the damage budget:

```
status_cost = base_per_stack × stacks × energy_cost_of_card
```

| Status | Base Cost Per Stack | Notes |
|---|---|---|
| Burn | 1 | Decays each round |
| Poison | 1.5 | Grows each round (more valuable than burn) |
| Enfeeble | 1 | Reduces target's damage output |
| Paralysis | **3** | Premium — makes cheap cards utility-focused |
| Slow | **3** | Premium — same reasoning as paralysis |

### Examples

- **Ember** (common 1-cost, any, Burn 2): `7 - (1×2×1) = 5 damage`
- **Thunder Shock** (common 1-cost, any, Para 2): `7 - (3×2×1) = 1 damage`
- **Sludge Bomb** (rare 2-cost, any, Poison 2): `22 - (1.5×2×2) = 16 damage`
- **Discharge** (rare 2-cost, all, Para 1): `22×0.50 - (3×1×2) = 5 damage per target`

---

## Self-Buff Costs

Same formula as status costs when a damage card includes a self-buff:

```
buff_cost = base_per_stack × stacks × energy_cost_of_card
```

| Buff | Base Cost Per Stack |
|---|---|
| Strength | 1.5 |
| Haste | 1.5 |
| Evasion | 1.5 |

---

## Other Effect Costs

| Effect | Budget Cost |
|---|---|
| Block (on a damage card) | **0.5** per point of block |
| Heal-on-hit (50% of damage dealt) | **2** × energy cost |
| Draw 1 card | ~2 |

---

## Downside Bonuses (Multiplicative)

Cards with downsides get **multiplicative** damage bonuses:

| Downside | Damage Multiplier |
|---|---|
| 25% recoil | ×1.25 |
| 33% recoil | ×1.33 |
| 50% recoil | ×1.50 |
| Self-KO | ×2.50 |

### Examples

- **Flare Blitz** (rare 3-cost, any, 25% recoil): `33 × 1.25 = 41 damage`
- **Take Down** (rare 2-cost, front, 25% recoil): `24 × 1.25 = 30 damage`
- **Self Destruct** (legendary 2-cost, all, self-KO): `30 × 0.50 × 2.50 = 38 damage per target`

---

## Multi-Hit Cards

Multi-hit cards apply additive bonuses (STAB +2, Strength) **per hit**, so more hits = more total bonus. To prevent this from being overtuned, multi-hit per-hit values are set so that **with STAB, the total ≈ formula damage**. Without STAB, they're intentionally below formula.

```
per_hit = floor(formula_target / hits - 2)
```

This means multi-hit cards are STAB-hungry — they're mediocre on Pokemon without type matching but reach full value with STAB. Higher hit counts are more STAB-dependent.

### Reference Table (common front_enemy)

| Hits | 2-cost (target 15) | 3-cost (target 23) |
|---|---|---|
| 2 | 6×2 = 12 base, 16 STAB | — |
| 3 | 3×3 = 9 base, 15 STAB | — |
| 4 | — | 4×4 = 16 base, 24 STAB |

---

## Block & Heal Cards

Pure block and heal cards use the **same `rate × cost` formula** as damage:

| | 1-cost | 2-cost |
|---|---|---|
| **Basic** | 5 | 10 |
| **Common** | 7 | 14 |
| **Uncommon** | 9 | 18 |
| **Rare** | 11 | 22 |

When a block card includes extras (evasion, cleanse, etc.), subtract the buff cost from the block budget.

---

## Special Cases (Use Judgment)

These card types don't fit the formula strictly:

- **Fixed damage** (Sonic Boom, Night Shade, Dragon Rage): Keep as-is, they bypass modifiers
- **% HP cards** (Super Fang, Fissure, Guillotine): Keep as-is
- **Conditional damage** (Hex, Scorch, Flail): Set base damage at formula value minus status costs, keep bonus conditions as extra upside
- **Pure utility / 0-cost vanish cards** (Growth, Teleport, etc.): Use judgment
- **Pure buff cards** (Swords Dance, Dragon Dance): Not strictly formula-derived, balanced by feel

---

## Design Philosophy

1. **Multiplicative cost scaling** — a 3-cost card deals ~3× a 1-cost card's damage, because you save card slots and additive buffs (Strength, STAB) disproportionately benefit multiple cheaper attacks.

2. **Status effects are expensive** — Paralysis and Slow cost 3 per stack, making cheap status cards into near-pure utility. This is intentional: powerful crowd control should come at a real damage cost.

3. **Poison > Burn** — Poison grows each round while burn decays, so poison costs 1.5 per stack vs burn's 1.

4. **Block is discounted on damage cards** — at 0.5 per point, because damage+block cards aren't universally useful (not every Pokemon wants to tank).

5. **Recoil is multiplicative, not additive** — a 25% recoil card deals 25% MORE damage than a clean card, making recoil a meaningful risk/reward tradeoff that scales correctly.
