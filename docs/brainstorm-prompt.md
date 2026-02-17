# Pokespire - Pokemon Design Brainstorming Prompt

You are helping design new playable Pokemon for **Pokespire**, a Pokemon roguelike deckbuilder (think Slay the Spire meets Pokemon). Players control a party of up to 4 Pokemon, battle enemies using card-based combat on a grid with front/back rows, and progress through leveling and evolution systems.

Use all of the context below to brainstorm new Pokemon lines that fit seamlessly into the existing game.

---

## DESIGN PHILOSOPHY

### Core Principles
- **Passive stacking:** Each Pokemon has 4 progression levels. Passives **stack** (not replaced) as you level up. A level 4 Pokemon has all 4 passives active simultaneously, creating powerful synergies.
- **Elemental identity:** Each line should have a distinct mechanical identity (e.g., Fire = burn DoT, Water = block accumulation, Grass = leech sustain, Electric = speed manipulation).
- **Meaningful tradeoffs:** Evolution can sacrifice one strength for another (e.g., Pikachu trades speed for tankiness when evolving to Raichu at L4).
- **Data-driven design:** New Pokemon should use existing card effect types and hook into existing passive hooks, not require new engine features.
- **Combinatorial awareness:** Every mechanic interacts with dozens of others. Consider how passives interact with statuses, damage pipeline, other party members' passives, etc.
- **The 50-card test:** If we add 50 more cards and 20 more passives, will this approach still work? Avoid designs that require special-case code.

### What Makes a Good Design
- A **cohesive theme** that ties all 4 passive levels together (each passive should build on the previous ones)
- **Interesting decisions** for the player (when to evolve, which cards to prioritize, positioning choices)
- **Synergy with party composition** (works well alongside certain other Pokemon types)
- **Clear counterplay** for enemies (not just "deal more damage")
- Cards and passives that create a **unique playstyle**, not just stat modifiers

---

## GAME MECHANICS REFERENCE

### Combat Overview
- Turn-based with speed-based turn order (highest speed goes first)
- Each turn: gain 3 energy, draw 5 cards, play cards spending energy, discard remaining
- Grid positioning: 2 rows (front/back) x 3 columns per side
- Players and enemies alternate based on speed, not in team blocks

### Card Effect Types (15 types available)
| Effect Type | Description | Example |
|-------------|-------------|---------|
| `damage` | Deal flat damage | `{ "type": "damage", "value": 12 }` |
| `multi_hit` | Multiple damage instances | `{ "type": "multi_hit", "value": 3, "hits": 4 }` |
| `recoil` | Damage with self-damage | `{ "type": "recoil", "value": 18, "recoilPercent": 0.25 }` |
| `heal_on_hit` | Lifesteal attack | `{ "type": "heal_on_hit", "value": 7, "healPercent": 0.5 }` |
| `self_ko` | Massive damage, user faints | `{ "type": "self_ko", "value": 35 }` |
| `set_damage` | Fixed damage ignoring modifiers | `{ "type": "set_damage", "value": 15 }` |
| `percent_hp` | Damage based on target HP % | `{ "type": "percent_hp", "percent": 0.5, "ofMax": false }` |
| `block` | Gain defensive shield | `{ "type": "block", "value": 8 }` |
| `heal` | Restore HP | `{ "type": "heal", "value": 20 }` |
| `heal_percent` | Heal % of max HP | `{ "type": "heal_percent", "percent": 0.5 }` |
| `apply_status` | Apply status to target | `{ "type": "apply_status", "status": "burn", "stacks": 2 }` |
| `apply_status_self` | Apply status to self | `{ "type": "apply_status_self", "status": "strength", "stacks": 3 }` |
| `draw_cards` | Draw additional cards | `{ "type": "draw_cards", "count": 2 }` |
| `gain_energy` | Gain bonus energy | `{ "type": "gain_energy", "amount": 1 }` |
| `cleanse` | Remove debuffs | `{ "type": "cleanse", "count": 1 }` |

### Targeting Ranges (11 types)
| Range | Description |
|-------|-------------|
| `self` | Self-targeting only |
| `front_enemy` | Single target in front row |
| `back_enemy` | Single target in back row |
| `any_enemy` | Single target, either row |
| `front_row` | AoE all enemies in front row |
| `back_row` | AoE all enemies in back row |
| `any_row` | Player selects front or back row, hits all |
| `column` | Hits all enemies in a column (front + back) |
| `all_enemies` | AoE all enemies |
| `any_ally` | Target any ally (including self) |

### Status Effects (10 types)
| Status | Type | Stacking | Decay | Effect |
|--------|------|----------|-------|--------|
| **Burn** | DoT | Additive | -1/round | Deals stacks damage at round end |
| **Poison** | DoT | Additive | Escalates +1 | Deals stacks damage at round end, grows each round |
| **Leech** | DoT+Heal | Additive | -1/round | Deals stacks damage, heals source |
| **Sleep** | CC | Additive | -1/turn | Skips turn, reduces energy gain by 1 |
| **Paralysis** | Debuff | Additive | -1/turn | Reduces speed by stacks |
| **Slow** | Debuff | Replace | Removed/round | Reduces speed by stacks |
| **Enfeeble** | Debuff | Replace | Removed/round | Reduces outgoing damage by stacks |
| **Strength** | Buff | Additive | Persistent | Increases outgoing damage by stacks |
| **Haste** | Buff | Additive | -1/turn | Increases speed by stacks |
| **Evasion** | Buff | Replace | Persistent | Reduces incoming damage by stacks |

### Passive Hook Points (where passives can trigger)
| Hook | When It Fires | Examples |
|------|---------------|---------|
| `onBattleStart` | Start of battle | Intimidate (Enfeeble all enemies), Scurry (gain Haste) |
| `onTurnStart` | After drawing hand | Baby Shell (gain Block), Charge (gain Strength), Inferno Momentum (reduce card cost) |
| `onDamageDealt` | After dealing unblocked damage | Kindling (apply Burn), Numbing Strike (apply Paralysis), Moxie (gain energy on KO) |
| `onDamageTaken` | When taking unblocked damage | Raging Bull (gain Strength), Static (apply Paralysis to attacker), Flame Body (Burn attacker) |
| `onStatusApplied` | When a status is applied | Spreading Flames (Burn spreads), Compound Eyes (gain Evasion), Powder Spread (debuff spreads) |
| `onTurnEnd` | At end of turn | Leftovers (heal 4 HP), Shed Skin (remove 1 debuff) |
| `onRoundEnd` | At end of round (after all turns) | Block retention (Pressure Hull), status ticks |

### Damage Pipeline (simplified)
```
1. baseDamage + Strength + STAB(+2) + passive bonuses - Enfeeble
2. Floor at 1
3. Apply strike multipliers (Blaze Strike 2x, Swarm Strike 2x)
4. Apply other multipliers (Anger Point 1.5x, Sheer Force 1.3x, Reckless 1.3x, Hustle 1.3x)
5. Apply type effectiveness (1.25x super effective, 0.75x not very effective)
6. Apply defensive reductions (Thick Hide -1, Static Field, Blooming Cycle, Thick Fat 0.75x)
7. Apply Shell Armor cap (max 20)
8. Subtract Evasion
9. Subtract Block
10. Apply to HP
```

### Type System
18 types: normal, fire, water, grass, electric, poison, flying, psychic, dark, fighting, ice, bug, dragon, ghost, rock, ground, steel, fairy

**Effectiveness multipliers are soft:** 1.25x super effective, 0.75x not very effective (no true immunities, worst is 0.5x double-resist).

**STAB:** +2 flat damage if move type matches one of the Pokemon's types. (Adaptability doubles this to +4.)

### Card Balance Guidelines
| Rarity | Cost | Damage | Notes |
|--------|------|--------|-------|
| Basic | 1 | 6 | Flat damage, no utility |
| Common | 1 | 8 OR 6+utility | e.g., 8 dmg or 6 dmg + status |
| Common | 2 | 9-10 | Moderate damage |
| Uncommon | 2 | 12 OR 10+status | Main workhorse cards |
| Rare | 2 | 15-20 (recoil) or 11 (AoE) | High power with drawback or AoE |
| Rare | 3 | 20-25 | Heavy hitters |
| Epic | 3 | 33 | Top-tier single target |
| Epic | 2 | special/utility | Unique effects |
| Legendary | 3 | 45+ | Boss-tier or vanish after use |

**Vanish cards:** Removed from deck permanently when played. Used for powerful one-shots or free utility (0-cost cards that vanish).

### Starter Deck Pattern
Each Pokemon starts with ~10 cards:
- 2-3 copies of a basic attack (6 dmg, type-appropriate)
- 2 Defend (5 Block, Normal type)
- 2-3 typed attacks (matching their element)
- 1-2 utility/status cards
- 1-2 vanish or situational cards

---

## ALL EXISTING POKEMON DESIGNS (34 lines implemented)

### 1. Charmander Line - "Inferno" (Fire)
**Theme:** Burn stacking and explosive first-hit damage

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Charmander | 32 | 5 | **Kindling** - Unblocked Fire attacks apply +1 Burn | - |
| 2 | Charmeleon | 42 | 6 | **Spreading Flames** - When applying Burn, also apply 1 Burn to adjacent enemies | Flamethrower |
| 3 | Charizard | 52 | 6 | **Blaze Strike** - First Fire attack each turn deals 2x damage | Fire Blast |
| 4 | Charizard | 52 | 6 | **Inferno Momentum** - Start of turn: reduce highest-cost card by 3 (min 0) | - |

**Starter Deck:** Scratch x3, Defend x2, Ember x2, Metal Claw, Smokescreen (vanish), Growl (vanish)
**Synergy:** Kindling applies Burn passively. Spreading Flames makes it AoE. Blaze Strike rewards leading with your biggest Fire card. Inferno Momentum lets you play expensive cards cheaply.

---

### 2. Squirtle Line - "Bastion" (Water)
**Theme:** Block accumulation that converts into offense

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Squirtle | 38 | 4 | **Baby Shell** - Start of turn: gain 3 Block | - |
| 2 | Wartortle | 48 | 5 | **Pressure Hull** - Retain 50% of Block at round boundary | Bubble Beam |
| 3 | Blastoise | 58 | 5 | **Torrent Shield** - First Water attack each turn grants Block equal to damage dealt | Hydro Pump |
| 4 | Blastoise | 58 | 5 | **Fortified Cannons** - Water attacks deal bonus damage equal to 25% of current Block | - |

**Starter Deck:** Tackle x3, Defend x2, Water Gun x2, Withdraw, Bubble, Tail Whip (vanish)
**Synergy:** Baby Shell builds Block passively. Pressure Hull keeps it between rounds. Torrent Shield adds more on attack. Fortified Cannons turns your stockpiled Block into bonus damage.

---

### 3. Bulbasaur Line - "Overgrowth" (Grass/Poison)
**Theme:** Leech-based sustain and damage reduction

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Bulbasaur | 36 | 4 | **Baby Vines** - Unblocked Grass attacks apply +1 Leech | - |
| 2 | Ivysaur | 46 | 5 | **Spreading Spores** - When applying Leech, also apply 1 Leech to adjacent enemies | 2x Razor Leaf |
| 3 | Venusaur | 56 | 5 | **Overgrow Heal** - First Grass attack each turn heals you equal to damage dealt | Solar Beam |
| 4 | Venusaur | 56 | 5 | **Blooming Cycle** - Enemies with Leech deal reduced damage (floor(stacks/2)) | - |

**Starter Deck:** Tackle x3, Defend x2, Vine Whip x2, Leech Seed, Growth (vanish), Poison Powder
**Synergy:** Baby Vines applies Leech on every Grass hit. Spreading Spores spreads it. Overgrow Heal gives burst healing on first attack. Blooming Cycle weakens leeched enemies.

---

### 4. Pikachu Line - "Static" (Electric)
**Theme:** Speed advantage for offense and defense

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Pikachu | 28 | 8 | **Numbing Strike** - Unblocked Electric attacks apply +1 Paralysis | - |
| 2 | Pikachu | 28 | 8 | **Swift Guard** - Your speed advantage over attackers reduces their damage to you | - |
| 3 | Pikachu | 28 | 8 | **Counter-Current** - Your speed advantage over a target increases your damage to them | - |
| 4 | Raichu | 48 | 6 | No new passive (speed tradeoff for tankiness) | Body Slam, Mega Punch, Thunder |

**Starter Deck:** Quick Attack x3, Defend x2, Thunder Shock x2, Thunder Wave, Double Team, Tail Whip (vanish)
**Unique:** Pikachu stays unevolved for L1-3, stacking speed passives. Raichu at L4 is a tradeoff: -2 speed but +20 HP and powerful cards.

---

### 5. Pidgey Line - "Tailwind" (Normal/Flying)
**Theme:** Speed manipulation, AoE wind attacks, turn order control

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Pidgey | 22 | 6 | **Gust Force** - Gust applies +1 Slow | - |
| 2 | Pidgeotto | 40 | 7 | **Keen Eye** - Enemies with Slow take +1 damage from your attacks | - |
| 3 | Pidgeot | 55 | 8 | **Whipping Winds** - Row-targeting attacks hit ALL enemies instead | Razor Wind |
| 4 | Pidgeot | 55 | 8 | **Slipstream** - When you use Gust, allies act immediately after you | - |

**Starter Deck:** Peck x2, Wing Attack x2, Gust x2, Sand Attack, Quick Attack, Defend x2
**Synergy:** Gust Force applies Slow. Keen Eye rewards keeping enemies slowed. Whipping Winds turns row attacks into full AoE. Slipstream gives team-wide turn order control via Gust.

---

### 6. Rattata Line - "Scrappy" (Normal)
**Theme:** Multi-hit frenzy, cheap cards, volume over power

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Rattata | 25 | 5 | **Scurry** - Gain 2 Haste at combat start | - |
| 2 | Rattata | 25 | 5 | **Quick Feet** - First attack each turn costs 1 less | Fury Swipes |
| 3 | Raticate | 45 | 6 | **Proletariat** - Basic/Common 1-cost cards deal +2 damage | - |
| 4 | Raticate | 45 | 6 | **Hustle** - Draw extra card at start of turn. Attacks deal +3 damage but cost +1 | - |

**Starter Deck:** Tackle x3, Scratch x2, Bite x2, Tail Whip (vanish), Defend, Focus Energy
**Synergy:** Scurry gives early speed. Quick Feet enables cheap openers. Proletariat buffs your many cheap cards. Hustle increases hand size and damage at the cost of energy efficiency.

---

### 7. Ekans Line - "Venomous" (Poison)
**Theme:** Poison stacking, debuffing, and punishing poisoned enemies

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Ekans | 25 | 4 | **Shed Skin** - End of turn: remove 1 debuff | - |
| 2 | Ekans | 25 | 4 | **Poison Point** - Unblocked Poison attacks apply +1 Poison | Sludge |
| 3 | Arbok | 48 | 5 | **Intimidate** - Start of combat: Enfeeble 2 to all enemies | Toxic |
| 4 | Arbok | 48 | 5 | **Predator's Patience** - Poisoned enemies take +2 damage from your attacks | - |

**Starter Deck:** Bite x2, Poison Sting x2, Wrap, Hiss (vanish), Defend x2, Acid, Smog
**Synergy:** Shed Skin keeps Ekans clean. Poison Point amplifies poison application. Intimidate weakens enemies at fight start. Predator's Patience rewards stacking poison before attacking.

---

### 8. Tauros - "Rage" (Normal, no evolution)
**Theme:** Anger-fueled berserker that gets stronger as it takes damage

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Tauros | 65 | 7 | **Thick Hide** - Take 1 less damage from all attacks | 0 | - |
| 2 | Tauros | 65 | 7 | **Anger Point** - Attacks deal +50% damage when below 50% HP | +5 | - |
| 3 | Tauros | 65 | 7 | **Intimidate** - Start of combat: Enfeeble 2 to all enemies | +5 | Double-Edge |
| 4 | Tauros | 65 | 7 | **Raging Bull** - When you take unblocked damage, gain 4 Strength | +5 | - |

**Starter Deck:** Tackle x2, Stomp x2, Take Down, Thrash, Rage, Horn Attack, Defend x2
**Synergy:** Thick Hide reduces chip damage. Anger Point rewards staying low. Intimidate debuffs enemies. Raging Bull converts damage taken into offensive power.

---

### 9. Snorlax - "Rest/Recovery" (Normal, no evolution)
**Theme:** Massive tank with self-healing and damage resistance

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Snorlax | 100 | 2 | **Immunity** - Cannot be Poisoned | 0 | - |
| 2 | Snorlax | 100 | 2 | **Thick Fat** - Take 25% less damage from Fire/Ice | +10 | - |
| 3 | Snorlax | 100 | 2 | **Leftovers** - End of turn: heal 4 HP | +10 | Body Slam |
| 4 | Snorlax | 100 | 2 | **Power Nap** - Playing Rest also grants 3 Strength | +10 | - |

**Starter Deck:** Tackle x2, Headbutt x2, Body Slam x2, Rest, Defend x2, Sing
**Synergy:** Immunity removes Poison as a threat. Thick Fat reduces elemental damage. Leftovers provides passive healing. Power Nap makes Rest both healing AND offensive.

---

### 10. Kangaskhan - "Parental Bond" (Normal, no evolution)
**Theme:** Double-hit attacks that scale when threatened

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Kangaskhan | 65 | 6 | **Scrappy** - Normal attacks deal +2 damage | 0 | - |
| 2 | Kangaskhan | 65 | 6 | **Parental Bond** - First attack each turn triggers twice (2nd hit = 50% damage) | +5 | - |
| 3 | Kangaskhan | 65 | 6 | **Protective Instinct** - When an ally takes damage, gain 3 Block | +5 | Body Slam |
| 4 | Kangaskhan | 65 | 6 | **Family Fury** - Below 50% HP, ALL attacks trigger Parental Bond | +5 | - |

**Starter Deck:** Comet Punch x2, Mega Punch, Dizzy Punch, Bite x2, Counter, Rage, Defend x2
**Synergy:** Scrappy boosts Normal damage. Parental Bond doubles first attack. Protective Instinct rewards team play. Family Fury turns desperate situations into massive damage.

---

### 11. Nidoran-M Line - "Rampage" (Poison/Ground)
**Theme:** Offensive poison synergy - poison enemies then crush them

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Nidoran-M | 30 | 5 | **Poison Point** - Unblocked Poison attacks apply +1 Poison | - |
| 2 | Nidorino | 40 | 6 | **Anger Point** - Attacks deal +50% damage below 50% HP | Sludge Bomb |
| 3 | Nidoking | 52 | 6 | **Toxic Horn** - Attacking poisoned enemies: gain Strength = floor(damage/4) | Earthquake |
| 4 | Nidoking | 52 | 6 | **Sheer Force** - Attacks deal 1.3x damage, but moves can't apply status effects | Megahorn |

**Starter Deck:** Peck x2, Defend x2, Poison Sting x2, Smog, Horn Attack, Leer, Acid
**Synergy:** Poison Point stacks poison. Anger Point rewards aggression. Toxic Horn converts poison damage into Strength. Sheer Force trades status application for raw power (interesting L4 tension with Poison Point).

---

### 12. Nidoran-F Line - "Matriarch" (Poison/Ground)
**Theme:** Defensive poison synergy - poison enemies to protect allies

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Nidoran-F | 32 | 4 | **Poison Point** - Unblocked Poison attacks apply +1 Poison | - |
| 2 | Nidorina | 42 | 5 | **Thick Hide** - Take 1 less damage from all attacks | Sludge |
| 3 | Nidoqueen | 55 | 5 | **Protective Toxins** - Attacking poisoned enemies: all allies gain Block = floor(damage/2) | Earthquake |
| 4 | Nidoqueen | 55 | 5 | **Sheer Force** - Attacks deal 1.3x damage, but moves can't apply status effects | Body Slam |

**Starter Deck:** Scratch, Counter, Defend x2, Poison Sting x2, Smog, Bite, Tail Whip (vanish), Acid
**Synergy:** Poison Point applies poison. Thick Hide reduces damage. Protective Toxins turns offensive poison into team Block. Sheer Force at L4 shifts to pure damage.

---

### 13. Rhyhorn Line - "Juggernaut" (Ground/Rock)
**Theme:** Slow but unstoppable, recoil mastery

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Rhyhorn | 40 | 2 | **Thick Hide** - Take 1 less damage from all attacks | - |
| 2 | Rhyhorn | 40 | 2 | **Rock Head** - No recoil damage from your attacks | Take Down |
| 3 | Rhydon | 65 | 3 | **Lightning Rod** - Electric attacks targeting allies hit you instead | Earthquake |
| 4 | Rhydon | 65 | 3 | **Reckless** - Recoil moves deal 1.3x damage | Double-Edge |

**Starter Deck:** Horn Attack x2, Stomp x2, Rock Slide, Defend x2, Tackle x2, Sand Attack
**Synergy:** Thick Hide reduces incoming. Rock Head removes recoil downside. Lightning Rod protects allies (synergizes with Thick Hide). Reckless makes recoil moves deal bonus damage with zero actual recoil (thanks to Rock Head).

---

### 14. Drowzee Line - "Dreamcatcher" (Psychic)
**Theme:** Sleep control specialist

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Drowzee | 40 | 4 | **Insomnia** - Immune to Sleep | 0 | - |
| 2 | Hypno | 50 | 5 | **Drowsy Aura** - When applying Sleep, also apply Enfeeble 1 | +5 | Dream Eater |
| 3 | Hypno | 50 | 5 | **Inner Focus** - Immune to Enfeeble | +5 | Psychic |
| 4 | Hypno | 50 | 5 | **Hypnotic Gaze** - Unblocked Psychic attacks apply +1 Sleep. Psychic cards cost +1 | 0 | - |

**Starter Deck:** Confusion x2, Pound x2, Defend x2, Hypnosis, Barrier, Teleport (vanish), Psybeam
**Synergy:** Insomnia protects against Sleep. Drowsy Aura makes Sleep also debuff. Inner Focus makes you immune to the debuff you inflict. Hypnotic Gaze turns every Psychic attack into Sleep application (but costs more energy - tradeoff).

---

### 15. Growlithe Line - "Fire Vanguard" (Fire)
**Theme:** Tanky frontline fire fighter with retaliation

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Growlithe | 45 | 5 | **Flash Fire** - Immune to Burn. Hit by Fire attack: gain 2 Strength | - |
| 2 | Arcanine | 75 | 7 | **Intimidate** - Start of combat: Enfeeble 2 to all enemies | Morning Sun |
| 3 | Arcanine | 75 | 7 | **Flame Body** - When you take damage, apply Burn 1 to attacker | Flare Blitz |
| 4 | Arcanine | 75 | 7 | **Inferno Momentum** - Start of turn: reduce highest-cost card by 3 | - |

**Starter Deck:** Fire Spin x2, Flame Wheel x2, Fire Fang x2, Defend x2, Bite, Roar (vanish)
**Synergy:** Flash Fire absorbs Fire damage. Intimidate weakens enemies. Flame Body punishes attackers with Burn. Inferno Momentum enables expensive card plays.

---

### 16. Voltorb Line - "Glass Cannon" (Electric)
**Theme:** Fastest Pokemon in game, self-destruct sacrifice play

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Voltorb | 22 | 9 | **Static** - When you take damage, apply Paralysis 1 to attacker | - |
| 2 | Electrode | 40 | 10 | **Charge** - Start of turn: gain 1 Strength | Self-Destruct |
| 3 | Electrode | 40 | 10 | **Volatile** - Self-KO attacks deal 1.5x damage | Discharge |
| 4 | Electrode | 40 | 10 | **Final Spark** - When you play a Self-KO card, all allies gain 3 Strength + 2 Haste | - |

**Starter Deck:** Thunder Shock x2, Sonic Boom x2, Spark x2, Charge Beam, Defend x2, Screech
**Synergy:** Static punishes attackers. Charge builds Strength each turn. Volatile makes Self-Destruct devastating. Final Spark turns your death into a massive team buff.

---

### 17. Caterpie Line - "Status Moth" (Bug/Flying)
**Theme:** Status spreading support, debuff specialist

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Caterpie | 18 | 3 | **Shield Dust** - Immune to Poison | - |
| 2 | Butterfree | 38 | 7 | **Compound Eyes** - When applying a debuff, gain 1 Evasion | - |
| 3 | Butterfree | 38 | 7 | **Powder Spread** - When applying a debuff, also apply 1 stack to adjacent enemies | Silver Wind |
| 4 | Butterfree | 38 | 7 | **Tinted Lens** - Not-very-effective attacks have no damage penalty | Sleep Powder |

**Starter Deck:** Tackle x3, String Shot x2, Harden x2, Stun Spore, Poison Powder, Bug Bite
**Synergy:** Shield Dust prevents Poison. Compound Eyes rewards debuffing with Evasion. Powder Spread turns single-target debuffs into AoE. Tinted Lens removes type disadvantage penalties.

---

### 18. Weedle Line - "Venom Striker" (Bug/Poison)
**Theme:** Fast glass cannon with STAB amplification

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Weedle | 18 | 3 | **Poison Barb** - Poison-type attacks deal +2 damage | - |
| 2 | Beedrill | 36 | 8 | **Poison Point** - Unblocked Poison attacks apply +1 Poison | Twineedle |
| 3 | Beedrill | 36 | 8 | **Adaptability** - STAB bonus doubled (+4 instead of +2) | - |
| 4 | Beedrill | 36 | 8 | **Swarm Strike** - First Bug attack each turn deals 2x damage | - |

**Starter Deck:** Poison Sting x2, Bug Bite x2, Tackle x2, Harden x2, String Shot, Fury Attack
**Synergy:** Poison Barb boosts Poison damage. Poison Point adds Poison on hit. Adaptability doubles STAB for both Bug and Poison. Swarm Strike doubles first Bug attack (like Blaze Strike for Fire).

---

### 19. Magikarp Line - "Tyrant" (Water/Flying)
**Theme:** Terrible start, monstrous evolution

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Magikarp | 20 | 6 | **Great Leap** - Playing Splash grants 3 Evasion | 0 | - |
| 2 | Gyarados | 65 | 7 | **Intimidate** - Start of combat: Enfeeble 2 to all enemies | 0 | Dragon Rage |
| 3 | Gyarados | 65 | 7 | **Moxie** - KO an enemy: gain 3 energy | +5 | - |
| 4 | Gyarados | 65 | 7 | **Tyrant's Tantrum** - Playing an attack: gain Strength equal to its cost | 0 | Dragon Dance |

**Starter Deck:** Splash x3, Tackle x3, Defend x2, Flail, Bounce
**Synergy:** Great Leap makes Splash useful (Evasion). Intimidate debuffs on arrival. Moxie snowballs on kills. Tyrant's Tantrum rewards expensive attacks with Strength buildup.

---

### 20. Lapras - "Fortress" (Water/Ice, no evolution)
**Theme:** Support tank that protects allies

| Level | Form | HP | Speed | Passive | hpBoost | Cards Added |
|-------|------|-----|-------|---------|---------|-------------|
| 1 | Lapras | 90 | 4 | **Water Absorb** - Immune to Water attacks, heal for base damage instead | 0 | - |
| 2 | Lapras | 90 | 4 | **Pressure Hull** - Retain 50% Block at round boundary | +5 | Surf |
| 3 | Lapras | 90 | 4 | **Shell Armor** - No single attack can deal more than 20 damage to you | +5 | - |
| 4 | Lapras | 90 | 4 | **Fortifying Aria** - End of round: heal allies for half your current Block | 0 | Blizzard |

**Starter Deck:** Tackle x2, Defend x3, Water Gun x2, Mist x2, Sing
**Synergy:** Water Absorb gives type immunity + healing. Pressure Hull retains Block. Shell Armor caps incoming damage. Fortifying Aria converts your Block into team healing.

---

### 21. Meowth Line - "Fortune" (Normal)
**Theme:** Gold generation, speed, and scaling damage through card quality

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Meowth | 40 | 6 | **Pickup** - Earn 25% more gold from battles | - |
| 2 | Persian | 48 | 8 | **Limber** - You cannot be Paralyzed | - |
| 3 | Persian | 48 | 8 | **Technician** - Your 1-cost cards deal 30% more damage | Pay Day |
| 4 | Persian | 48 | 8 | **Aristocrat** - Your Epic rarity cards deal 30% more damage | - |

**Starter Deck:** Scratch x3, Defend x2, Bite x2, Fake Out, Fury Swipes, Pay Day
**Synergy:** Pickup generates gold for shop upgrades. Limber prevents Paralysis shutdowns. Technician rewards spamming cheap attacks. Aristocrat rewards upgrading to powerful Epic cards in shops.

---

### 22. Magmar Line - "Burn Engine" (Fire)
**Theme:** Burn stacking into searing damage amplification

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Magmar | 42 | 6 | **Vital Spirit** - Immune to Sleep | - |
| 2 | Magmar | 42 | 6 | **Flame Body** - When hit by a front-row attack, apply Burn 1 to attacker | Thunder Punch |
| 3 | Magmar | 42 | 6 | **Searing Fury** - Your attacks deal +1 damage per Burn stack on the target | - |
| 4 | Magmortar | 47 | 6 | **Inferno Momentum** - Start of turn: reduce highest-cost card by 3 (min 0) | Fire Blast |

**Starter Deck:** Defend x3, Karate Chop x2, Ember x3, Fire Punch x2
**Synergy:** Vital Spirit prevents Sleep. Flame Body applies Burn passively when hit. Searing Fury converts all those Burn stacks into bonus damage. Inferno Momentum at L4 enables expensive card plays.

---

### 23. Electabuzz Line - "Volt Brawler" (Electric)
**Theme:** Paralysis stacking into amplified damage

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Electabuzz | 40 | 7 | **Vital Spirit** - Immune to Sleep | - |
| 2 | Electabuzz | 40 | 7 | **Static** - When you take damage, apply Paralysis 1 to attacker | Fire Punch |
| 3 | Electabuzz | 40 | 7 | **Volt Fury** - Your attacks deal +1 damage per Paralysis stack on the target | - |
| 4 | Electivire | 55 | 7 | **Surge Momentum** - Start of turn: reduce highest-cost card by 3 (min 0) | Thunder |

**Starter Deck:** Defend x3, Karate Chop x2, Thunder Shock x3, Thunder Punch x2
**Synergy:** Mirrors Magmar's structure but for Paralysis. Static applies Paralysis when hit. Volt Fury rewards stacking Paralysis. Surge Momentum enables expensive plays at L4.

---

### 24. Dratini Line - "Dragon Ascendant" (Dragon)
**Theme:** Slow start, massive late-game evolution with damage amp + cost reduction

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Dratini | 35 | 4 | **Shed Skin** - At end of turn, remove 1 stack from all debuffs | - |
| 2 | Dratini | 35 | 4 | **Inner Focus** - Immune to Enfeeble | - |
| 3 | Dragonair | 45 | 5 | **Multiscale** - If above 75% HP, take half damage | Dragon Dance |
| 4 | Dragonite | 80 | 5 | **Dragon's Majesty** - Start of turn: reduce highest-cost attack by 3 (min 0). Attacks deal 30% more damage | Hyper Beam |

**Starter Deck:** Tackle x3, Defend x3, Wrap x2, Thunder Wave, Twister
**Synergy:** Shed Skin shrugs off debuffs. Inner Focus blocks Enfeeble. Multiscale rewards staying healthy. Dragon's Majesty at L4 is a massive power spike with both cost reduction and damage amp.

---

### 25. Spearow Line - "Scrappy Raptor" (Normal/Flying)
**Theme:** Cheap card specialist with unblockable finisher

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Spearow | 26 | 6 | **Sharp Beak** - Flying attacks deal +1 damage | - |
| 2 | Fearow | 42 | 7 | **Keen Eye** - Enemies with Slow take +1 damage from your attacks | Rage |
| 3 | Fearow | 42 | 7 | **Proletariat** - Basic/Common 1-cost cards deal +2 damage | Rage |
| 4 | Fearow | 42 | 7 | **Sniper** - First attack each turn ignores evasion and block | - |

**Starter Deck:** Peck x3, Defend x3, Gust x2, Fury Attack x2
**Synergy:** Sharp Beak buffs Flying STAB. Keen Eye rewards keeping enemies slowed. Proletariat makes all your cheap cards hit harder. Sniper lets your first attack bypass all defenses.

---

### 26. Sandshrew Line - "Desert Fortress" (Ground)
**Theme:** Block accumulation into offensive conversion (Ground version of Squirtle)

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Sandshrew | 34 | 4 | **Baby Shell** - Start of turn: gain 3 Block | - |
| 2 | Sandslash | 54 | 5 | **Spiked Hide** - When hit by a front-row attack, deal 2 damage back | Dig |
| 3 | Sandslash | 54 | 5 | **Bristling Rampart** - When you take unblocked damage, gain 2 Block | - |
| 4 | Sandslash | 54 | 5 | **Fortified Spines** - Ground attacks deal bonus damage equal to 25% of current Block | Earthquake |

**Starter Deck:** Scratch x3, Defend x3, Sand Attack x2, Bone Club x2
**Synergy:** Baby Shell builds Block passively. Spiked Hide punishes melee attackers. Bristling Rampart converts damage taken into more Block. Fortified Spines turns stockpiled Block into Ground attack damage.

---

### 27. Gastly Line - "Phantom" (Ghost/Poison)
**Theme:** Evasion-based glass cannon that converts defense into offense

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Gastly | 22 | 6 | **Intangible** - Start of turn: gain Evasion 2 | - |
| 2 | Haunter | 35 | 7 | **Counter Stance** - When attacked, deal damage equal to your Evasion stacks | Minimize |
| 3 | Gengar | 48 | 8 | **Phase Form** - When you play a Ghost card, gain Evasion equal to its energy cost | Shadow Ball |
| 4 | Gengar | 48 | 8 | **Night Assassin** - Damage cards deal bonus damage equal to your Evasion (max +15) | - |

**Starter Deck:** Lick x2, Confuse Ray x2, Double Team x2, Poison Gas x2, Shadow Punch x2
**Synergy:** Intangible gives free Evasion each turn. Counter Stance punishes attackers. Phase Form rewards playing Ghost cards with more Evasion. Night Assassin converts all that Evasion into massive bonus damage.

---

### 28. Clefairy Line - "Guardian Angel" (Fairy)
**Theme:** Defensive support with team protection and status immunity

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Clefairy | 35 | 3 | **Lucky Star** - Start of combat: gain 4 Evasion | - |
| 2 | Clefable | 50 | 5 | **Cute Charm** - When hit by a front-row attack, apply Enfeeble 1 to attacker | Follow Me |
| 3 | Clefable | 50 | 5 | **Friend Guard** - Allies take 2 less damage from all attacks | - |
| 4 | Clefable | 50 | 5 | **Magic Guard** - Immune to status tick damage (Burn, Poison, Leech deal no damage) | Moonblast |

**Starter Deck:** Pound x3, Defend x2, Disarming Voice x2, Fairy Wind, Charm, Moonlight
**Synergy:** Lucky Star gives early Evasion buffer. Cute Charm weakens melee attackers. Friend Guard is a team-wide damage reduction aura. Magic Guard makes status effects harmless.

---

### 29. Machop Line - "Iron Fist" (Fighting)
**Theme:** Strength-building brawler with explosive finisher

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Machop | 50 | 3 | **Guts** - When an enemy applies a debuff to you, gain 1 Strength | - |
| 2 | Machoke | 55 | 3 | **No Guard** - When you deal unblocked damage, strip 1 Evasion and 1 Block from yourself. Gain 1 Strength | Bulk Up |
| 3 | Machamp | 60 | 3 | **Rapid Strike** - 1-cost attack cards in hand at start of turn cost 0 | Cross Chop |
| 4 | Machamp | 60 | 3 | **Finisher** - First attack with effective cost 3+ each turn deals double damage, then clears all Strength | - |

**Starter Deck:** Karate Chop x3, Defend x2, Low Kick x2, Double Kick, Counter, Rolling Kick
**Synergy:** Guts converts debuffs into Strength. No Guard strips your own defenses for more Strength. Rapid Strike makes cheap attacks free. Finisher lets you dump all accumulated Strength into one massive 2x hit.

---

### 30. Vulpix Line - "Hex Witch" (Fire/Psychic)
**Theme:** Dual-debuff stacker that punishes afflicted enemies

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Vulpix | 42 | 5 | **Flame Body** - When hit by a front-row attack, apply Burn 1 to attacker | - |
| 2 | Ninetales | 52 | 6 | **Mysticism** - Unblocked Psychic attacks inflict 1 Enfeeble | Psychic |
| 3 | Ninetales | 52 | 6 | **Malice** - Attacks deal bonus damage equal to target's Burn + Enfeeble stacks | Hex |
| 4 | Ninetales | 52 | 6 | **Hex Mastery** - Hex costs 0 | - |

**Starter Deck:** Fire Spin x2, Confusion x2, Defend x2, Ember x2, Confuse Ray, Hex
**Synergy:** Flame Body applies Burn on hit. Mysticism adds Enfeeble on Psychic attacks. Malice rewards stacking both debuffs with bonus damage. Hex Mastery makes Hex free, turning it into a spammable finisher that scales with debuff stacks.

---

### 31. Oddish Line - "Toxic Garden" (Grass/Poison)
**Theme:** Passive poison aura with team sustain and drain amplification

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Oddish | 38 | 3 | **Effect Spore** - When hit by a front-row attack, inflict 1 Paralysis on attacker | - |
| 2 | Gloom | 45 | 3 | **Stench** - At end of turn, the enemy directly facing you gains 2 Poison | - |
| 3 | Vileplume | 55 | 4 | **Luna** - At end of round, heal all allies for 4 HP | Moonlight |
| 4 | Vileplume | 55 | 4 | **Verdant Drain** - Drain attacks heal for 100% instead of 50% | Giga Drain |

**Starter Deck:** Vine Whip x2, Absorb x2, Defend x2, Poison Powder, Stun Spore, Mega Drain, Acid
**Synergy:** Effect Spore slows attackers. Stench passively poisons the enemy in front. Luna heals the whole team each round. Verdant Drain doubles lifesteal, making Absorb/Mega Drain/Giga Drain into full heals.

---

### 32. Jigglypuff Line - "Lullaby" (Normal/Fairy)
**Theme:** Sleep control with devastating follow-up damage

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Jigglypuff | 34 | 4 | **Cute Charm** - When hit by a front-row attack, apply Enfeeble 1 to attacker | - |
| 2 | Wigglytuff | 70 | 4 | **Friend Guard** - Allies take 2 less damage from all attacks | Body Slam |
| 3 | Wigglytuff | 70 | 4 | **Lullaby** - Sing costs 1 energy | Play Rough |
| 4 | Wigglytuff | 70 | 4 | **Rude Awakening** - Attacks deal double damage to sleeping targets | - |

**Starter Deck:** Pound x2, Defense Curl x2, Sing x2, Disarming Voice x2, Defend x2
**Synergy:** Cute Charm weakens melee attackers. Friend Guard protects allies. Lullaby makes Sing cheap and spammable. Rude Awakening delivers 2x damage to sleeping enemies — put them to sleep, then crush them.

---

### 33. Paras Line - "Fungal Parasite" (Bug/Grass)
**Theme:** Budget positional attacker with sleep mastery

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Paras | 28 | 3 | **Effect Spore** - When hit by a front-row attack, inflict 1 Paralysis on attacker | - |
| 2 | Parasect | 55 | 2 | **Blind Aggression** - Attacks deal +2 damage to enemies in same column | Fury Cutter |
| 3 | Parasect | 55 | 2 | **Dry Skin** - Immune to Water attacks (heal for base damage). Take 25% more Fire damage | Spore |
| 4 | Parasect | 55 | 2 | **Spore Mastery** - Spore costs 0 energy | - |

**Starter Deck:** Scratch x3, Defend x2, Absorb x2, Stun Spore, Leech Life, Bug Bite
**Synergy:** Effect Spore punishes melee attackers. Blind Aggression rewards column positioning. Dry Skin gives Water immunity at the cost of Fire weakness. Spore Mastery makes the game's best Sleep card free.

---

### 34. Zubat Line - "Night Stalker" (Poison/Flying)
**Theme:** Speed-based vampire that converts speed advantage into offense and defense

| Level | Form | HP | Speed | Passive | Cards Added |
|-------|------|-----|-------|---------|-------------|
| 1 | Zubat | 26 | 7 | **Inner Focus** - Immune to Enfeeble | - |
| 2 | Golbat | 43 | 8 | **Vampiricism** - Unblocked front-row attacks apply +1 Leech | Fly |
| 3 | Crobat | 55 | 10 | **Swift Guard** - Your speed advantage over attackers reduces their damage to you | Agility |
| 4 | Crobat | 55 | 10 | **Zephyr King** - Flying attacks grant you 1 Haste | - |

**Starter Deck:** Bite x3, Defend x2, Leech Life, Poison Sting, Gust, Wing Attack x2
**Synergy:** Inner Focus blocks Enfeeble. Vampiricism applies Leech on front-row hits. Swift Guard converts Crobat's blazing 10 speed into damage reduction. Zephyr King stacks Haste on every Flying attack, making it faster and faster.

---

## ALL EXISTING MOVES/CARDS

### Normal Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Pound/Scratch/Tackle/Quick Attack | 1 | front_enemy | 6 dmg | basic |
| Pay Day/Struggle | 1 | front_enemy | 6 dmg | basic |
| Fury Attack/Fury Swipes | 2 | front_enemy | 3 dmg x3 hits | basic/common |
| Double Slap/Comet Punch | 2 | front_enemy | 5 dmg x2 hits | common |
| Spike Cannon/Barrage | 3 | front_enemy | 3 dmg x4 hits | common |
| Vice Grip/Cut | 1 | front_enemy | 8 dmg | common |
| Swift | 1 | any_enemy | 7 dmg | common |
| Rage | 1 | front_enemy | 6 dmg + Strength 1 self | common |
| Bind | 1 | front_enemy | 6 dmg + Slow 2 | common |
| Constrict | 1 | front_enemy | 4 dmg + Slow 2 | basic |
| Wrap | 2 | front_enemy | 8 dmg + Slow 2 | common |
| Stomp | 2 | front_enemy | 10 dmg | common |
| Horn Attack | 2 | front_enemy | 10 dmg | common |
| Headbutt/Slam/Mega Punch/Slash/Strength/Hyper Fang | 2 | front_enemy | 12 dmg | uncommon |
| Body Slam | 2 | front_enemy | 10 dmg + Paralysis 2 | uncommon |
| Dizzy Punch | 2 | front_enemy | 10 dmg + Enfeeble 2 | uncommon |
| Tri Attack | 2 | any_enemy | 11 dmg | uncommon |
| Take Down | 2 | front_enemy | 18 dmg, 25% recoil | rare |
| Double-Edge | 2 | front_enemy | 20 dmg, 33% recoil | rare |
| Razor Wind | 2 | any_row | 11 dmg AoE | rare |
| Thrash | 3 | front_enemy | 25 dmg | rare |
| Egg Bomb | 3 | front_enemy | 20 dmg | rare |
| Mega Kick/Skull Bash | 3 | front_enemy | 33 dmg (Skull Bash +10 Block) | epic |
| Hyper Beam | 3 | any_enemy | 45 dmg | legendary |
| Self-Destruct | 2 | all_enemies | 35 dmg, user faints | legendary |
| Explosion | 3 | all_enemies | 50 dmg, user faints | legendary |
| Super Fang | 2 | any_enemy | 50% current HP | epic |
| Guillotine/Horn Drill | 3 | any_enemy | 75% max HP, vanish | legendary |
| Flail | 1 | front_enemy | 6 dmg (12 if below 50% HP) | common |
| Fake Out | 1 | front_enemy | 6 dmg + Slow 3, vanish | common |
| Metal Claw | 1 | front_enemy | 7 dmg + Enfeeble 1 | common |
| Sonic Boom | 1 | any_enemy | 15 fixed dmg | common |
| **Utility/Status** | | | | |
| Growl | 0 | any_enemy | Enfeeble 2, vanish | basic |
| Tail Whip | 0 | any_enemy | Enfeeble 1, vanish | basic |
| Hiss | 0 | any_enemy | Enfeeble 1, vanish | basic |
| Whirlwind | 0 | any_enemy | Slow 2, vanish | basic |
| Growth | 0 | self | Strength 1, vanish | basic |
| Leer/Flash | 1 | any_enemy | Enfeeble 2 | basic |
| Screech | 1 | any_enemy | Enfeeble 3 | common |
| Roar | 0 | any_enemy | Enfeeble 2 + Slow 2, vanish | common |
| Smokescreen | 1 | any_enemy | Enfeeble 2 + Slow 2, vanish | basic |
| Disable | 1 | any_enemy | Enfeeble 2 + Slow 2 | common |
| Supersonic | 1 | any_enemy | Slow 2 | basic |
| Glare | 1 | any_enemy | Paralysis 3 | common |
| Sing/Lovely Kiss | 2 | any_enemy | Sleep 1 | uncommon |
| Swords Dance | 1 | self | Strength 3 | uncommon |
| Focus Energy/Sharpen/Meditate | 1 | self | Strength 2 | common |
| Double Team | 1 | self | Evasion 3 | common |
| Minimize | 1 | self | Evasion 5 | uncommon |
| Transform | 1 | self | Strength 2 + Evasion 2 | uncommon |
| Harden/Defense Curl/Defend | 1 | self | 5 Block | basic |
| Bide/Counter | 1 | self | 8 Block | common |
| Substitute | 2 | self | 15 Block | uncommon |
| Recover/Soft Boiled | 2 | self | Heal 20 | rare |
| Mimic/Conversion/Mirror Move | 1 | self | Draw 1 card | common |
| Metronome | 1 | self | Draw 2 + Gain 1 energy, vanish | epic |

### Fire Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Fire Spin | 1 | any_enemy | 5 dmg | basic |
| Ember | 1 | any_enemy | 6 dmg + Burn 2 | common |
| Fire Fang | 1 | front_enemy | 8 dmg + Burn 1 | common |
| Flame Wheel | 1 | front_enemy | 6 dmg + 5 Block | common |
| Fire Punch | 1 | front_enemy | 10 dmg | uncommon |
| Flamethrower | 2 | column | 11 dmg AoE | rare |
| Morning Sun | 2 | self | Heal 20 | rare |
| Fire Blast | 3 | any_enemy | 33 dmg | epic |
| Flare Blitz | 3 | any_enemy | 30 dmg, 25% recoil | rare |

### Water Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Water Gun | 1 | any_enemy | 5 dmg | basic |
| Bubble/Clamp | 1 | any_enemy/front | 6 dmg + Slow 2 | common |
| Withdraw | 1 | self | 8 Block | common |
| Bubble Beam | 2 | any_enemy | 9 dmg | common |
| Waterfall | 2 | front_enemy | 12 dmg | uncommon |
| Crabhammer | 2 | front_enemy | 15 dmg | rare |
| Surf | 2 | all_enemies | 10 dmg AoE | rare |
| Hydro Pump | 3 | any_enemy | 33 dmg | epic |

### Grass Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Vine Whip | 1 | front_enemy | 6 dmg | basic |
| Absorb | 1 | any_enemy | 5 dmg, heal 50% | basic |
| Mega Drain | 1 | any_enemy | 7 dmg, heal 50% | common |
| Razor Leaf | 1 | front_enemy | 8 dmg | common |
| Leech Seed | 2 | any_enemy | Leech 2 | uncommon |
| Stun Spore | 1 | any_enemy | Paralysis 3 | common |
| Sleep Powder | 2 | any_enemy | Sleep 1 | uncommon |
| Spore | 1 | any_enemy | Sleep 1 | epic |
| Giga Drain | 3 | any_enemy | 22 dmg, heal 50% | epic |
| Solar Beam | 3 | any_enemy | 33 dmg | epic |
| Petal Dance | 3 | all_enemies | 20 dmg AoE | rare |

### Electric Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Thunder Shock | 1 | any_enemy | 6 dmg + Paralysis 2 | common |
| Thunder Wave | 1 | any_enemy | Paralysis 2 | common |
| Spark | 1 | front_enemy | 8 dmg | common |
| Charge Beam | 1 | any_enemy | 5 dmg + Strength 1 self | common |
| Thunder Punch | 1 | front_enemy | 10 dmg | uncommon |
| Thunderbolt | 2 | any_row | 11 dmg AoE | rare |
| Discharge | 2 | all_enemies | 8 dmg + Paralysis 1 AoE | rare |
| Thunder | 3 | any_enemy | 33 dmg | epic |

### Poison Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Poison Sting | 1 | front_enemy | 5 dmg + Poison 1 | basic |
| Smog | 1 | any_enemy | 4 dmg + Poison 1 | basic |
| Acid | 1 | any_enemy | 6 dmg + Enfeeble 2 | common |
| Poison Powder | 1 | any_enemy | Poison 2 | common |
| Poison Gas | 1 | front_row | Poison 1 AoE | common |
| Sludge | 2 | any_enemy | 10 dmg + Poison 1 | uncommon |
| Sludge Bomb | 2 | any_enemy | 15 dmg + Poison 2 | rare |
| Toxic | 1 | any_enemy | Poison 3 | rare |
| Acid Armor | 1 | self | 10 Block + Evasion 2 | uncommon |

### Fighting Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Karate Chop | 1 | front_enemy | 6 dmg | basic |
| Low Kick | 1 | front_enemy | 8 dmg | common |
| Double Kick | 2 | front_enemy | 4 dmg x2 hits | common |
| Rolling Kick | 1 | column | 6 dmg | common |
| Counter | 1 | self | 8 Block | common |
| Bulk Up | 1 | self | Strength 2 + 4 Block | uncommon |
| Submission | 1 | front_enemy | 15 dmg, 50% recoil | rare |
| Seismic Toss | 1 | column | 20 fixed dmg, vanish | rare |
| Jump Kick | 2 | any_enemy | 15 dmg | rare |
| Cross Chop | 3 | front_enemy | 25 dmg | rare |
| High Jump Kick | 3 | front_enemy | 33 dmg | epic |

### Flying Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Peck | 1 | front_enemy | 6 dmg | basic |
| Gust | 1 | any_enemy | 7 dmg | common |
| Wing Attack | 2 | front_enemy | 10 dmg | common |
| Drill Peck | 2 | front_enemy | 12 dmg | uncommon |
| Fly | 2 | any_enemy | 15 dmg | rare |
| Bounce | 2 | any_enemy | 12 dmg + Paralysis 1 | rare |
| Sky Attack | 3 | front_enemy | 33 dmg | epic |
| Mirror Move | 1 | self | Draw 1 card | common |

### Psychic Type
| Move | Cost | Range | Effects | Rarity |
|------|------|-------|---------|--------|
| Confusion | 1 | any_enemy | 7 dmg | common |
| Psybeam | 2 | any_enemy | 9 dmg | common |
| Psywave | 1 | any_enemy | 15 fixed dmg | uncommon |
| Psychic | 2 | any_enemy | 15 dmg | rare |
| Dream Eater | 2 | any_enemy | 12 dmg, heal 50% | rare |
| Hypnosis | 2 | any_enemy | Sleep 1 | uncommon |
| Rest | 2 | self | Heal 50% max HP + Sleep 2 self, vanish | epic |
| Teleport | 0 | self | Evasion 2, vanish | basic |
| Agility | 0 | self | Haste 3, vanish | rare |
| Barrier/Amnesia | 1 | self | 8 Block | common |
| Light Screen | 2 | self | 12 Block + Evasion 2 | uncommon |
| Reflect | 2 | self | 15 Block | uncommon |
| Kinesis | 1 | any_enemy | Enfeeble 2 | basic |

### Other Types
| Move | Cost | Range | Type | Effects | Rarity |
|------|------|-------|------|---------|--------|
| Bite | 1 | front_enemy | Dark | 8 dmg | common |
| Dragon Rage | 2 | any_enemy | Dragon | 40 fixed dmg, vanish | epic |
| Dragon Dance | 1 | self | Dragon | Strength 2 + Haste 2, vanish | epic |
| Rock Throw | 1 | back_enemy | Rock | 8 dmg | common |
| Rock Slide | 2 | front_row | Rock | 9 dmg AoE | uncommon |
| Sand Attack | 1 | any_enemy | Ground | Enfeeble 2 | basic |
| Bone Club | 1 | front_enemy | Ground | 8 dmg | common |
| Bonemerang | 2 | front_enemy | Ground | 5 dmg x2 | common |
| Dig | 2 | front_enemy | Ground | 12 dmg | uncommon |
| Earthquake | 3 | all_enemies | Ground | 20 dmg AoE | rare |
| Fissure | 2 | any_enemy | Ground | 50% max HP, vanish | legendary |
| Mist | 1 | any_ally | Ice | Cleanse 1 debuff | basic |
| Haze | 0 | self | Ice | Cleanse 2, vanish | common |
| Aurora Beam | 2 | any_enemy | Ice | 9 dmg + Enfeeble 2 | common |
| Ice Punch | 1 | front_enemy | Ice | 10 dmg | uncommon |
| Ice Beam | 2 | any_enemy | Ice | 15 dmg | rare |
| Blizzard | 3 | all_enemies | Ice | 20 dmg AoE | epic |
| Lick | 1 | front_enemy | Ghost | 5 dmg + Paralysis 2 | basic |
| Night Shade | 1 | any_enemy | Ghost | 15 fixed dmg | common |
| Confuse Ray | 1 | any_enemy | Ghost | Enfeeble 2 + Slow 2 | common |
| Twineedle | 2 | front_enemy | Bug | 4 dmg x2 + Poison 1 | common |
| Pin Missile | 3 | front_enemy | Bug | 3 dmg x4 | common |
| String Shot | 1 | any_enemy | Bug | Slow 2 | basic |
| Leech Life | 1 | any_enemy | Bug | 7 dmg, heal 50% | common |
| Bug Bite | 1 | front_enemy | Bug | 8 dmg | common |
| Silver Wind | 2 | all_enemies | Bug | 6 dmg AoE + Strength 1 self | rare |
| Megahorn | 3 | front_enemy | Bug | 30 dmg | epic |

---

## YOUR TASK

Design new playable Pokemon lines for Pokespire. For each line, provide:

### 1. Overview
- **Pokemon Line:** Base form -> Evolutions (or single-stage if no evolution)
- **Types:** Primary and secondary types
- **Theme:** 1-2 sentence description of the mechanical identity (e.g., "Burn stacking and explosive first-hit damage")
- **Playstyle:** How does this Pokemon want to play? Aggressive? Defensive? Support? Tempo?

### 2. Base Stats
| Form | HP | Speed | Notes |
|------|-----|-------|-------|
| Base | ? | ? | Why these numbers? |
| Evolved | ? | ? | How do they change? |

**Stat guidelines:** HP ranges from 18 (Caterpie) to 100 (Snorlax). Speed ranges from 2 (Snorlax/Rhyhorn) to 10 (Electrode). Most Pokemon are 4-7 speed, 30-65 HP.

### 3. Progression Tree (4 Levels)
For each level:
- **Form** (does it evolve here?)
- **Passive Name & Effect** (use existing hook points!)
- **Cards Added** (if any)
- **HP Boost** (if any, for non-evolving Pokemon)

Each passive should:
- Use one of the existing hooks (onBattleStart, onTurnStart, onDamageDealt, onDamageTaken, onStatusApplied, onTurnEnd, onRoundEnd)
- OR be a damage modifier that plugs into the damage pipeline
- OR be a cost modifier
- OR be a status immunity

### 4. Starter Deck (~10 cards)
List the starting cards. Can use existing cards from the move pool above, or propose new ones.

### 5. New Cards (if needed)
For any new cards, provide:
```json
{
  "id": "move-name",
  "name": "Move Name",
  "cost": 2,
  "type": "fire",
  "range": "any_enemy",
  "vanish": false,
  "effects": [{ "type": "damage", "value": 12 }],
  "rarity": "uncommon",
  "pools": ["fire"],
  "description": "Deal 12 damage."
}
```

### 6. Synergy Analysis
- How do the 4 passives work together?
- What party members does this Pokemon pair well with?
- What are the weaknesses/counterplay?
- Any interesting decisions the player faces during progression?

---

## DESIGN CONSTRAINTS

1. **Use existing effect types.** Don't invent new card effects - compose from the 15 existing types.
2. **Use existing hook points.** Don't propose passives that need new engine hooks.
3. **Follow balance guidelines.** A 1-cost card shouldn't deal 15 damage without a significant downside.
4. **Consider interactions.** How does this interact with Sheer Force? With Spreading Flames? With Lightning Rod? With Sleep?
5. **No complexity for complexity's sake.** If a simpler passive achieves the same fantasy, prefer it.
6. **Gen 1 only.** Stick to Generation 1 Pokemon (Kanto, #1-151).
7. **Types not yet covered as primary:**
   - **Fighting** - no dedicated fighting line yet
   - **Ghost** - no dedicated ghost line yet
   - **Dragon** - no dedicated dragon line yet (Dragonite?)
   - **Rock** - only secondary on Rhyhorn
   - **Ground** - only secondary on Nidoking/Nidoqueen/Rhyhorn
   - **Ice** - only secondary on Lapras
   - **Dark** - no dedicated dark line yet
8. **Pokemon not yet implemented** (examples of good candidates):
   - Machop/Machoke/Machamp (Fighting)
   - Gastly/Haunter/Gengar (Ghost/Poison)
   - Dratini/Dragonair/Dragonite (Dragon/Flying)
   - Abra/Kadabra/Alakazam (Psychic)
   - Geodude/Graveler/Golem (Rock/Ground)
   - Oddish/Gloom/Vileplume (Grass/Poison)
   - Cubone/Marowak (Ground)
   - Hitmonlee/Hitmonchan (Fighting)
   - Ponyta/Rapidash (Fire)
   - Jigglypuff/Wigglytuff (Normal/Fairy→Normal)
   - Clefairy/Clefable (Fairy→Normal)
   - Sandshrew/Sandslash (Ground)
   - Slowpoke/Slowbro (Water/Psychic)
   - Onix (Rock/Ground)
   - Scyther (Bug/Flying)
   - Eevee line (multiple types)
   - Mr. Mime (Psychic)
   - Jynx (Ice/Psychic)
   - Electabuzz (Electric)
   - Magmar (Fire)
   - Pinsir (Bug)
   - And many more from Gen 1

When brainstorming, focus on creating distinct mechanical identities that don't overlap with existing lines. Each new Pokemon should feel like it brings something new to team composition.
