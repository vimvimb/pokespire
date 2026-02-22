# Johto Campaign — Design Document

> **Status:** Draft — for review before implementation.

---

## Prompt

Now help me plan the the second campaign. This new campaign will consist entirely of gen 2 (Johto) Pokemon. For now, just write a Markdown file that details the story of the new campaign and all important details that will be needed to implement the campaign in code, like the act structure, the story elements, the map nodes, the Pokemon and moves in each battle, the bosses, the event choices and outcomes, etc. I will tell you the overarching story and you fill in the details based on what is accurate to the world of Pokemon and the region of Johto and its lore. Then I can work with you to make edits to the campaign in the Markdown file before we implement it in code. The overarching story for this campaign is a time travel adventure. The game starts with act 1 in the present day in Ilex Forest, the home of Celebi. Celebi is the boss battle for act 1 and when the player enters act 2 they will be in Johto of the past. The second act has two different paths that can be taken, each with their own boss trainer from the Johto region. The top path ends in an act 2 boss fight with the trainer Gold and the bottom path ends in an act 2 boss fight with the trainer Silver. If the player defeats Gold, they will go to act 3 in the Tin Tower, ending in a final boss fight with Ho-oh. If the player defeats Silver, they will go to act 3 in the Brass Tower, ending in a final boss fight with Lugia.

## Overview

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Campaign ID    | `campaign_2`                                                           |
| Working Title  | "Threads of Time"                                                      |
| Acts           | 3 (Act 2 splits into Gold Path or Silver Path; Act 3 has two variants) |
| Final Bosses   | Ho-Oh (Tin Tower) or Lugia (Brass Tower)                               |
| Player Pokemon | Gen 2 (Johto) only                                                     |
| Starters       | Chikorita, Cyndaquil, Totodile                                         |
| Draft Pool     | 7 fixed Johto Pokemon (see below)                                      |

---

## Story Summary

Something has gone wrong in Ilex Forest. The shrine that belongs to Celebi — the guardian of time — is radiating unstable energy. You enter the forest to investigate.

**Act 1 — Ilex Forest (Present Day):** Wild Pokemon have been agitated by the temporal disturbance. You fight through the forest and confront Celebi at its shrine. When Celebi is defeated, it releases a burst of temporal energy that tears open a rift — and the party falls backward through time.

**Act 2 — Past Johto (Ecruteak City Outskirts):** You arrive in Johto some years before Gold and Silver's era — just after the Brass Tower burned. Two young trainers are here, each chasing something. **Gold** — bright-eyed and optimistic — is tracking Ho-Oh's legend toward the Tin Tower. **Silver** — cold and calculating, son of Giovanni — is drawn to the raw power emanating from the smoldering Brass Tower.

The map splits after an initial common section into two paths:

- **Upper Path (Gold's Path):** Open hillsides toward the Tin Tower. Ends in a battle with Gold.
- **Lower Path (Silver's Path):** Dark ravines and charred ruins near the Brass Tower. Ends in a battle with Silver.

Each boss carries the Johto starter that counters the player's choice — Gold has the one the player is **strong against**, Silver has the one the player is **weak to**.

**Act 3A — Tin Tower (Gold's Path):** You ascend the Tin Tower through ancient guardians and sacred fire. Near the summit, the three legendary beasts roam the upper floors — born just recently from Ho-Oh's grace. One of them will challenge you before you face the guardian itself.

**Act 3B — Brass Tower (Silver's Path):** You enter the Brass Tower as it still partially stands. Lugia lingers here before its long retreat to the sea, saturating every floor with psychic presence. The legendary beasts wander these halls too — drawn to the same deep energy that holds Lugia in place.

---

## New Pokemon Required

Add these to `pokemon.json`, give each a progression tree in `progression.ts`, and run `npm run download-sprites`. Listed in implementation order.

### Batch 1 — Act 1 (Ilex Forest)

| Pokemon    | Type          | Notes                                         |
| ---------- | ------------- | --------------------------------------------- |
| Hoppip     | Grass/Flying  | Evolves → Skiploom → Jumpluff                 |
| Skiploom   | Grass/Flying  |                                               |
| Jumpluff   | Grass/Flying  |                                               |
| Sunkern    | Grass         | Evolves → Sunflora; very low HP, solar-themed |
| Sunflora   | Grass         |                                               |
| Aipom      | Normal        | No Gen 2 evolution (stop here)                |
| Yanma      | Bug/Flying    | No Gen 2 evolution (stop here)                |
| Misdreavus | Ghost         | No Gen 2 evolution (stop here)                |
| Sudowoodo  | Rock          | No evolution; high HP, blocking-enemy feel    |
| Wooper     | Water/Ground  | Evolves → Quagsire; in draft pool             |
| Quagsire   | Water/Ground  |                                               |
| **Celebi** | Grass/Psychic | **Act 1 boss — NPC only**                     |

### Batch 2 — Act 2 (Past Johto, both paths)

| Pokemon        | Type           | Notes                                                                                   |
| -------------- | -------------- | --------------------------------------------------------------------------------------- |
| Stantler       | Normal         | No evolution                                                                            |
| Marill         | Water          | Evolves → Azumarill                                                                     |
| Azumarill      | Water          |                                                                                         |
| Flaaffy        | Electric       | Evolves → Ampharos                                                                      |
| Ampharos       | Electric       | Also on Gold's boss team                                                                |
| Togetic        | Normal/Flying  | No Gen 2 further evolution (stop here)                                                  |
| Espeon         | Psychic        | Eevee is Gen 1; Espeon exists as standalone NPC. On Gold's boss team.                   |
| **Umbreon**    | Dark           | Eevee is Gen 1; Umbreon exists as standalone. Appears in lower path. Recruitable.       |
| Heracross      | Bug/Fighting   | No evolution                                                                            |
| Houndour       | Dark/Fire      | Evolves → Houndoom                                                                      |
| Houndoom       | Dark/Fire      | Also on Silver's boss team                                                              |
| Sneasel        | Dark/Ice       | No Gen 2 evolution (stop here); also Silver's team                                      |
| Teddiursa      | Normal         | Evolves → Ursaring                                                                      |
| Ursaring       | Normal         |                                                                                         |
| Larvitar       | Rock/Ground    | Evolves → Pupitar → Tyranitar                                                           |
| Pupitar        | Rock/Ground    |                                                                                         |
| Tyranitar      | Rock/Dark      | Highest non-legendary base stats in Johto                                               |
| **Miltank**    | Normal         | No evolution; powerful defensive Normal-type; Whitney's signature in the games          |
| **Wobbuffet**  | Psychic        | No evolution (Wynaut is Gen 3, stop at Wobbuffet); counterattack-themed                 |
| **Blissey**    | Normal         | No evolution in this context (Chansey is Gen 1, already NPC); Blissey as standalone NPC |
| **Pineco**     | Bug            | Evolves → Forretress                                                                    |
| **Forretress** | Bug/Steel      | Upper path. Scyther is Gen 1; Forretress can also exist as standalone enemy             |
| **Steelix**    | Steel/Ground   | Lower path. Onix is Gen 1; Steelix exists as standalone NPC                             |
| **Scizor**     | Bug/Steel      | Act 3A tower guardian. Scyther is Gen 1; Scizor as standalone NPC                       |
| Dunsparce      | Normal         | No evolution; recruitable                                                               |
| Girafarig      | Normal/Psychic | No evolution; recruitable                                                               |

### Batch 3 — Act 3A (Tin Tower — Fiery and Ancient)

| Pokemon   | Type         | Notes                                          |
| --------- | ------------ | ---------------------------------------------- |
| Slugma    | Fire/Rock    | Evolves → Magcargo; magma creature, fire tower |
| Magcargo  | Fire/Rock    |                                                |
| Phanpy    | Ground       | Evolves → Donphan; ancient, earth-connected    |
| Donphan   | Ground       |                                                |
| Skarmory  | Steel/Flying | No evolution; ancient tower sentinel           |
| **Ho-Oh** | Fire/Flying  | **Act 3A final boss — NPC only**               |

### Batch 4 — Act 3B (Brass Tower — Watery and Mysterious)

| Pokemon      | Type           | Notes                                                                              |
| ------------ | -------------- | ---------------------------------------------------------------------------------- |
| **Slowking** | Water/Psychic  | Standalone NPC (Slowpoke is Gen 1); wise and mysterious, perfect for Lugia's tower |
| Corsola      | Water/Rock     | No evolution; ancient coral                                                        |
| Mantine      | Water/Flying   | No evolution                                                                       |
| Chinchou     | Water/Electric | Evolves → Lanturn; bioluminescent, deep-sea                                        |
| Lanturn      | Water/Electric |                                                                                    |
| Politoed     | Water          | Standalone NPC (Poliwhirl is Gen 1)                                                |
| Qwilfish     | Water/Poison   | No evolution                                                                       |
| **Kingdra**  | Water/Dragon   | Standalone NPC (Seadra is Gen 1); powerful and mysterious, pre-boss encounter      |
| **Lugia**    | Psychic/Flying | **Act 3B final boss — NPC only**                                                   |

### Batch 5 — Legendary Beasts (Both Act 3 Variants)

These appear at **Stage 5** of both Act 3A and Act 3B as a three-way recruit encounter. All three appear in both towers — the beasts roam freely across Johto, drawn to the powerful energy of whatever guardian awaits at the top.

| Pokemon     | Type     | HP (suggested) | Deck                                                                                                                       |
| ----------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Raikou**  | Electric | 72             | `thunderbolt`, `thunderbolt`, `thunder`, `shadow-ball`, `quick-attack`, `swift`, `recover`, `bite`, `body-slam`, `thunder` |
| **Entei**   | Fire     | 76             | `flamethrower`, `flamethrower`, `fire-blast`, `stomp`, `body-slam`, `body-slam`, `slam`, `slash`, `recover`, `ember`       |
| **Suicune** | Water    | 74             | `surf`, `surf`, `water-gun`, `water-gun`, `gust`, `psychic`, `recover`, `recover`, `swift`, `bite`                         |

> `thunderbolt` and `thunder` may need to be added to `moves.json` if not present — check against `pikachu`/`raichu` decks. All other moves in the above decks are confirmed to exist.

Progression trees for the legendary beasts have no evolution — just 4 levels with card additions:

- Level 1: base form, `passiveId: 'none'`
- Level 2: add a signature move
- Level 3: add another move
- Level 4: Mastered, `hpBoost: +10`

---

## New Moves Required

| Move ID         | Name         | Type           | Description                                                      |
| --------------- | ------------ | -------------- | ---------------------------------------------------------------- |
| `ancient-power` | AncientPower | Rock           | Moderate damage; small chance to boost all of attacker's stats   |
| `magical-leaf`  | Magical Leaf | Grass          | Never misses; fixed moderate Grass damage                        |
| `sacred-fire`   | Sacred Fire  | Fire           | High damage; chance to Burn; Ho-Oh signature                     |
| `aeroblast`     | Aeroblast    | Flying/Psychic | High damage; hits entire front row; Lugia signature              |
| `future-sight`  | Future Sight | Psychic        | Deals damage at the start of the next turn (delayed)             |
| `present`       | Present      | Normal         | Random: damages target OR heals them; Delibird signature         |
| `thunderbolt`   | Thunderbolt  | Electric       | Strong single-target Electric; confirm if already present        |
| `thunder`       | Thunder      | Electric       | High damage Electric, lower accuracy; confirm if already present |

Confirmed existing moves: `solar-beam`, `earthquake`, `recover`, `psychic`, `bite`, `night-shade`, `shadow-ball`, `leech-life`, `poison-sting`, `wing-attack`, `gust`, `swift`, `body-slam`, `slash`, `slam`, `fury-swipes`, `hypnosis`, `leech-seed`, `razor-leaf`, `vine-whip`, `ember`, `flamethrower`, `water-gun`, `surf`, `stomp`, `quick-attack`.

---

## Campaign Draft Pool

**Fixed pool of 7 Pokemon** — always available regardless of player unlocks.

`sentret`, `hoothoot`, `ledyba`, `spinarak`, `wooper`, `aipom`, `hoppip`

> Update `campaigns.ts` → `campaign_2.draftPool` (and `.recruitPool`) once all these are in `pokemon.json`. Currently only the first four exist.

---

## Act 1 — Ilex Forest

### Story

You arrive at the edge of Ilex Forest following reports of strange Pokemon behavior near the ancient shrine. The forest is dense and misty. The further in you go, the more unsettled it feels — plants at odd angles, Pokemon acting erratically, and the occasional shimmer of green light between the trees.

At the shrine, Celebi waits. It does not speak, but its eyes hold centuries. It cannot close the rift alone — and it cannot let you pass without proving you are strong enough to follow it through time.

**Act 1 → 2 transition text:**
_"Celebi falls. The forest holds its breath. Then — a tear splits the air, a rush of light, and you're falling backward through time. When you land, the world is different. Older. Untouched. In the distance, the Brass Tower still stands."_

### Map Overview

```
Stage 0       Stage 1               Stage 2               Stage 3               Stage 4            Stage 5           Stage 6       Stage 7
Spawn ──────  Battle A (Spinarak×2)  Rest                  Battle E (Ariados     Event C             Rest              Boss           Transition
              Battle A' (Ledyba×2)   Battle B (Hoothoot×2) + Misdreavus)         (Shrine Keeper)     Battle F                         (→ Act 2)
                                     Event A (GS Ball)      Battle E' (Yanma×2)                       (Sudowoodo 1.2×)  (Celebi 1.8×)
                                     Recruit A              Event B (Forest
                                     (Spinarak/Hoothoot)    Sprite)
```

### Node Details

| Node ID                     | Type           | Stage | Content                        | Connects To                                          |
| --------------------------- | -------------- | ----- | ------------------------------ | ---------------------------------------------------- |
| `c2-a1-s0-spawn`            | spawn          | 0     | —                              | `c2-a1-s1-battle-spinarak`, `c2-a1-s1-battle-ledyba` |
| `c2-a1-s1-battle-spinarak`  | battle         | 1     | Spinarak × 2                   | `c2-a1-s2-rest`, `c2-a1-s2-battle-hoothoot`          |
| `c2-a1-s1-battle-ledyba`    | battle         | 1     | Ledyba × 2                     | `c2-a1-s2-rest`, `c2-a1-s2-battle-hoothoot`          |
| `c2-a1-s2-rest`             | rest           | 2     | Heal 30% or +10 max HP         | `c2-a1-s2-event-gs-ball`                             |
| `c2-a1-s2-battle-hoothoot`  | battle         | 2     | Hoothoot × 2                   | `c2-a1-s2-event-gs-ball`                             |
| `c2-a1-s2-event-gs-ball`    | event          | 2     | _The GS Ball_                  | `c2-a1-s2-recruit`                                   |
| `c2-a1-s2-recruit`          | recruit        | 2     | Assigned: Spinarak or Hoothoot | `c2-a1-s3-battle-ariados`, `c2-a1-s3-battle-yanma`   |
| `c2-a1-s3-battle-ariados`   | battle         | 3     | Ariados + Misdreavus           | `c2-a1-s3-event-sprite`, `c2-a1-s4-event-shrine`     |
| `c2-a1-s3-battle-yanma`     | battle         | 3     | Yanma × 2                      | `c2-a1-s3-event-sprite`, `c2-a1-s4-event-shrine`     |
| `c2-a1-s3-event-sprite`     | event          | 3     | _Forest Sprite Sighting_       | `c2-a1-s4-event-shrine`                              |
| `c2-a1-s4-event-shrine`     | event          | 4     | _The Shrine Keeper_            | `c2-a1-s5-rest`, `c2-a1-s5-battle-sudowoodo`         |
| `c2-a1-s5-rest`             | rest           | 5     | Heal 30% or +10 max HP         | `c2-a1-s6-boss-celebi`                               |
| `c2-a1-s5-battle-sudowoodo` | battle         | 5     | Sudowoodo (1.2× HP)            | `c2-a1-s6-boss-celebi`                               |
| `c2-a1-s6-boss-celebi`      | battle         | 6     | **Celebi** (1.8× HP)           | `c2-a1-s7-transition`                                |
| `c2-a1-s7-transition`       | act_transition | 7     | → Act 2                        | —                                                    |

### Boss: Celebi

- **Pokemon:** Celebi (Grass/Psychic)
- **HP Multiplier:** 1.8×
- **Position:** front, column 1
- **Deck:** `leech-seed`, `leech-seed`, `ancient-power`, `ancient-power`, `recover`, `recover`, `vine-whip`, `vine-whip`, `magical-leaf`, `magical-leaf`
- **Flavor:** _"Celebi does not fight out of malice. It fights because the rift is forming, and it must know you are strong enough to follow it through."_

### Act 1 Events

---

#### Event: The GS Ball

**ID:** `c2_gs_ball`
**Narrative:** Half-buried in the roots of an ancient tree, a golden Poké Ball catches the light. It hums with energy you can't name. Carvings on its surface depict Celebi, wings spread. You've heard of this artifact. Bringing it here was supposed to summon Celebi. Instead, it seems to have destabilized everything.

| Choice | Label                    | Outcome                                                                                                                                                                                                                    |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Pick it up carefully"   | **Random:** 60% → `maxHpBoost` +8 to one party member _("the energy pulses steadily through your hands")_. 40% → `damage` 6 to one + `gold` +50 _("the energy discharges; a coin purse falls from your bag in the jolt")._ |
| B      | "Leave it where it lies" | **Fixed:** `gold` +150, `healPercent` 15% to all. _The forest exhales. Nothing disturbed — the energy settles._                                                                                                            |

---

#### Event: Forest Sprite Sighting

**ID:** `c2_forest_sprite`
**Narrative:** A flash of green darts between the trunks — gone before you can focus. Your Pokemon are restless with excitement.

| Choice | Label                 | Outcome                                                                                                                                                                                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Give chase"          | **Random:** 55% → `recruit` wild Hoppip or Sunkern _("a small Pokemon, startled but curious")_. 45% → `damage` 8 to one random + `nothing` _("you tripped in the roots. The sprite escaped. Your Pokemon is embarrassed on your behalf.")._ |
| B      | "Stay still and wait" | **Fixed:** `epicDraft` 1 card pick. _The forest settles. Something was watching — and left a gift._                                                                                                                                         |

---

#### Event: The Shrine Keeper

**ID:** `c2_shrine_keeper`
**Narrative:** An elderly man crouches by the Celebi shrine, replacing offerings. He doesn't look surprised to see you. _"The guardian has been restless. Something disturbs its timeline. Maybe you can help. Maybe you'll make things worse."_

| Choice | Label                | Outcome                                                                                                                                                               |
| ------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Make an offering"   | **Fixed (costs 100g):** `gold` −100, `maxHpBoost` +10 to all, `healPercent` 20% to all. _The shrine's energy responds. Worth the price._                              |
| B      | "Ask about the rift" | **Random:** 70% → `xp` +2 to all _("his knowledge prepares you")_. 30% → `xp` +1 to all + `addDazed` 1 to one _("the information was overwhelming for one Pokemon")._ |

---

## Act 2 — Past Johto (Ecruteak City Outskirts)

### Story

You emerge in open countryside outside Ecruteak City. The Brass Tower smolders on the horizon — the fire clearly recent, the air still carrying ash. Gold is heading northeast toward the Tin Tower. Silver is circling the ruins, reading something in the destruction that others miss.

The three legendary beasts — Raikou, Entei, Suicune, newly made — are somewhere out there. You can feel them. You'll meet one of them later, higher up.

### Map Structure

```
Stage 0      Stage 1               Stage 2                  ← SPLIT →
Spawn ─────  Battle (Stantler×2)   Battle (Flaaffy×2+Wobb.) ──── UPPER PATH (Gold) ──── Stages 3–5 ──── Gold Boss ──── Tin Tower Transition
                                   Battle (Marill×3)
                                   Battle (Miltank)         ──── LOWER PATH (Silver) ── Stages 3–5 ── Silver Boss ── Brass Tower Transition
                                   Event (Bell)
                                   Event (Wild Blissey)
```

### Common Nodes (Stages 0–2)

| Node ID                    | Type   | Stage | Content                 | Connects To                                                                                                                     |
| -------------------------- | ------ | ----- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `c2-a2-s0-spawn`           | spawn  | 0     | —                       | `c2-a2-s1-battle-stantler`                                                                                                      |
| `c2-a2-s1-battle-stantler` | battle | 1     | Stantler × 2            | `c2-a2-s2-battle-flaaffy`, `c2-a2-s2-battle-marill`, `c2-a2-s2-battle-miltank`, `c2-a2-s2-event-bell`, `c2-a2-s2-event-blissey` |
| `c2-a2-s2-battle-flaaffy`  | battle | 2     | Flaaffy × 2 + Wobbuffet | `c2-a2-split-upper`, `c2-a2-split-lower`                                                                                        |
| `c2-a2-s2-battle-marill`   | battle | 2     | Marill × 3              | `c2-a2-split-upper`, `c2-a2-split-lower`                                                                                        |
| `c2-a2-s2-battle-miltank`  | battle | 2     | Miltank (1.1× HP)       | `c2-a2-split-upper`, `c2-a2-split-lower`                                                                                        |
| `c2-a2-s2-event-bell`      | event  | 2     | _Ecruteak's Bell_       | `c2-a2-split-upper`, `c2-a2-split-lower`                                                                                        |
| `c2-a2-s2-event-blissey`   | event  | 2     | _Wild Blissey_          | `c2-a2-split-upper`, `c2-a2-split-lower`                                                                                        |

### Upper Path (Gold) — Nodes

| Node ID                            | Type           | Stage | Content                                 | Connects To                                              |
| ---------------------------------- | -------------- | ----- | --------------------------------------- | -------------------------------------------------------- |
| `c2-a2-split-upper`                | battle         | 3     | Togetic + Ampharos                      | `c2-a2-upper-s3-battle-forretress`, `c2-a2-upper-rest`   |
| `c2-a2-upper-s3-battle-forretress` | battle         | 3     | Forretress + Scizor                     | `c2-a2-upper-rest`, `c2-a2-upper-battle-heracross`       |
| `c2-a2-upper-rest`                 | rest           | 4     | Heal 30% or +10 max HP                  | `c2-a2-upper-event-suicune`, `c2-a2-upper-battle-espeon` |
| `c2-a2-upper-battle-heracross`     | battle         | 4     | Heracross × 2                           | `c2-a2-upper-event-suicune`, `c2-a2-upper-battle-espeon` |
| `c2-a2-upper-event-suicune`        | event          | 4     | _Suicune Sighting_                      | `c2-a2-upper-s5-prep`                                    |
| `c2-a2-upper-battle-espeon`        | battle         | 4     | Espeon + Togetic                        | `c2-a2-upper-s5-prep`                                    |
| `c2-a2-upper-s5-prep`              | battle         | 5     | Ampharos + Heracross (1.1× HP)          | `c2-a2-upper-recruit`                                    |
| `c2-a2-upper-recruit`              | recruit        | 5     | Assigned: Togetic, Stantler, or Flaaffy | `c2-a2-boss-gold`                                        |
| `c2-a2-boss-gold`                  | battle         | 6     | **Gold** — see below                    | `c2-a2-transition-tin-tower`                             |
| `c2-a2-transition-tin-tower`       | act_transition | 7     | → Act 3A (Tin Tower)                    | —                                                        |

### Lower Path (Silver) — Nodes

| Node ID                         | Type           | Stage | Content                                            | Connects To                                             |
| ------------------------------- | -------------- | ----- | -------------------------------------------------- | ------------------------------------------------------- |
| `c2-a2-split-lower`             | battle         | 3     | Houndour × 2 + Murkrow                             | `c2-a2-lower-s3-battle-umbreon`, `c2-a2-lower-rest`     |
| `c2-a2-lower-s3-battle-umbreon` | battle         | 3     | Umbreon × 2                                        | `c2-a2-lower-rest`, `c2-a2-lower-battle-sneasel`        |
| `c2-a2-lower-rest`              | rest           | 4     | Heal 30% or +10 max HP                             | `c2-a2-lower-event-fire`, `c2-a2-lower-battle-ursaring` |
| `c2-a2-lower-battle-sneasel`    | battle         | 4     | Sneasel × 2                                        | `c2-a2-lower-event-fire`, `c2-a2-lower-battle-ursaring` |
| `c2-a2-lower-event-fire`        | event          | 4     | _Tower Fire Aftermath_                             | `c2-a2-lower-s4-battle-steelix`                         |
| `c2-a2-lower-battle-ursaring`   | battle         | 4     | Ursaring + Steelix                                 | `c2-a2-lower-s4-battle-steelix`                         |
| `c2-a2-lower-s4-battle-steelix` | battle         | 4     | Steelix (1.2× HP)                                  | `c2-a2-lower-s5-tyranitar`                              |
| `c2-a2-lower-s5-tyranitar`      | battle         | 5     | **Tyranitar** (1.3× HP)                            | `c2-a2-lower-recruit`                                   |
| `c2-a2-lower-recruit`           | recruit        | 5     | Assigned: Sneasel, Umbreon, Houndour, or Teddiursa | `c2-a2-boss-silver`                                     |
| `c2-a2-boss-silver`             | battle         | 6     | **Silver** — see below                             | `c2-a2-transition-brass-tower`                          |
| `c2-a2-transition-brass-tower`  | act_transition | 7     | → Act 3B (Brass Tower)                             | —                                                       |

### Boss: Gold — Dynamic Team

Gold carries the Johto starter **weak to** the player's type.

| Player Starter    | Gold's Team                                             |
| ----------------- | ------------------------------------------------------- |
| Chikorita (Grass) | Feraligatr, Ampharos, Espeon _(Water is weak to Grass)_ |
| Cyndaquil (Fire)  | Meganium, Ampharos, Espeon _(Grass is weak to Fire)_    |
| Totodile (Water)  | Typhlosion, Ampharos, Espeon _(Fire is weak to Water)_  |

- **HP Multiplier:** 1.3× on all
- **Positions:** starter front col 0, Ampharos front col 2, Espeon back col 1
- **Flavor:**
  - _Before:_ "You're strong — I can feel it. But I've been working toward this my whole life. Ho-Oh is up in that tower and I am going to see it. Are you ready?"
  - _After:_ "...You fought like you knew things I don't know yet. Like you've seen how this ends. Who are you?"

### Boss: Silver — Dynamic Team

Silver carries the Johto starter **strong against** the player's type.

| Player Starter    | Silver's Team                                      |
| ----------------- | -------------------------------------------------- |
| Chikorita (Grass) | Typhlosion, Sneasel, Houndoom _(Fire beats Grass)_ |
| Cyndaquil (Fire)  | Feraligatr, Sneasel, Houndoom _(Water beats Fire)_ |
| Totodile (Water)  | Meganium, Sneasel, Houndoom _(Grass beats Water)_  |

- **HP Multiplier:** 1.3× on all
- **Positions:** starter front col 1, Sneasel front col 0, Houndoom back col 1
- **Flavor:**
  - _Before:_ "You're in my way." _(battle begins — no more words)_
  - _After:_ "Tch. You're not ordinary. I won't forget this."

### Implementation Note — Dynamic Boss Teams

When `transitionToNextAct` transitions into Act 2, post-process the node array to resolve Gold's and Silver's dynamic starters from `run.party[0].baseFormId`:

```
chikorita → Gold gets feraligatr, Silver gets typhlosion
cyndaquil → Gold gets meganium,   Silver gets feraligatr
totodile  → Gold gets typhlosion, Silver gets meganium
```

Add a helper `assignGoldSilverEnemies(nodes, starterBaseFormId)` called inside `transitionToNextAct` for this campaign. The boss nodes in `CAMPAIGN2_ACT2_NODES` use placeholder enemy arrays that this function replaces.

### Act 2 Events

---

#### Event: Ecruteak's Bell

**ID:** `c2_ecruteak_bell`
**Narrative:** A clear tone rolls across the hillside from the Tin Tower. The monks say the bell rings when something extraordinary draws near — a worthy trainer, or a disaster about to strike. Today, no one agrees on which.

| Choice | Label                          | Outcome                                                                                                                                                                                           |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Meditate to the bell's tone"  | **Random:** 60% → `maxHpBoost` +6 to all _("the resonance strengthens your team")_. 40% → `maxHpBoost` +6 to one + `damage` 8 to one _("the frequency overwhelms a less resilient team member")._ |
| B      | "Cover your ears and press on" | **Fixed:** `gold` +100, `healPercent` 15% to all. _Staying detached costs you nothing today._                                                                                                     |

---

#### Event: Wild Blissey

**ID:** `c2_wild_blissey`
**Narrative:** A round, pink shape waddles into your path from behind a hedge, carrying a soft-boiled egg in both hands. A Blissey. It regards your party with shining eyes, then slowly extends the egg toward whichever of your Pokemon looks worst off. It came out of nowhere. It doesn't seem afraid of you at all.

| Choice | Label                        | Outcome                                                                                                                                                                                                                                                       |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Accept the gift graciously" | **Fixed:** `healPercent` 40% to all, `gold` +30. _The Blissey watches your party recover, then turns and wobbles back into the grass._                                                                                                                        |
| B      | "Challenge it — gently"      | **Random:** 55% → `recruit` Blissey _("it holds its ground, then seems to decide it likes you")_. 45% → `healPercent` 20% to all + `nothing` _("it dodges every attack with disarming grace, then simply wanders off. It healed your team on the way out.")._ |

---

#### Event: Suicune Sighting _(Upper Path)_

**ID:** `c2_suicune_sighting`
**Narrative:** Over a hill, a sleek blue shape races across the open plain — mane like a cresting wave, eyes like cold glass. A legendary beast, newly made. It pauses, locks eyes with you for exactly one second. Then it's gone.

| Choice | Label              | Outcome                                                                                                                                                 |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Give chase"       | **Random:** 65% → `xp` +3 to all _("it led you somewhere")_. 35% → `damage` 10 to one random + `nothing` _("it outran you completely. You stumbled.")._ |
| B      | "Stand very still" | **Fixed:** `maxHpBoost` +10 to one random party member. _Something about its gaze left a mark._                                                         |

---

#### Event: Tower Fire Aftermath _(Lower Path)_

**ID:** `c2_tower_fire_aftermath`
**Narrative:** The ground is still warm here. Charred timber and glowing embers dot the ruins. Among the debris, something moves — sluggish, molten, confused. It survived the fire by becoming part of it.

| Choice | Label                   | Outcome                                                                                                                                                                                             |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Rescue the Pokemon"    | **Random:** 60% → `recruit` wild Slugma _("it follows you, heat steady")_. 40% → `damage` 12 to one random + `gold` +50 _("it panics and lashes out before fleeing — but drops something useful")._ |
| B      | "Leave it to the ruins" | **Fixed:** `gold` +150, `cardClone` 1. _You find a cache of supplies from the tower workers._                                                                                                       |

---

## Act 3A — Tin Tower

### Story

The Tin Tower rises above Ecruteak like a pillar of light. Seven floors of sacred architecture, tended by monks who have devoted their lives to the belief that Ho-Oh will descend to a worthy trainer. The air smells of ancient fire — not burning, but waiting. Sacred. Eternal.

Near the summit, you encounter the legendary beasts. They've been climbing the tower ahead of you, drawn by Ho-Oh's energy the way moths are drawn to a flame. One of them turns and faces you. A challenge. An invitation. You choose which to accept.

And then, at the very top, Ho-Oh. It doesn't know you. It doesn't care that you came from another time. You are here, in its sacred space, uninvited. That's enough.

**Ending:** When Ho-Oh falls, the rift opens. Celebi appears and carries you home.

### Map Overview

```
Stage 0    Stage 1                     Stage 2               Stage 3                   Stage 4             Stage 5                     Stage 6  Stage 7
Spawn ──── Battle (Slugma×2 + Murkrow)  Battle (Skarmory×2)   Event (Sacred Ash)         Card Removal        THREE-WAY BEAST CHOICE      Rest  ── Boss
            Battle (Houndour + Magcargo) Event (Legends Stir)  Battle (Scizor + Houndoom)  Event (Rainbow       Recruit (Raikou)                    (Ho-Oh)
                                                                                            Feather)             Recruit (Entei)
                                                                                                                 Recruit (Suicune)
```

### Node Details

| Node ID                     | Type         | Stage | Content                              | Connects To                                                                        |
| --------------------------- | ------------ | ----- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `c2-a3a-s0-spawn`           | spawn        | 0     | —                                    | `c2-a3a-s1-battle-slugma`, `c2-a3a-s1-battle-houndour`                             |
| `c2-a3a-s1-battle-slugma`   | battle       | 1     | Slugma × 2 + Murkrow                 | `c2-a3a-s2-battle-skarmory`, `c2-a3a-s2-event-legends`                             |
| `c2-a3a-s1-battle-houndour` | battle       | 1     | Houndour + Magcargo                  | `c2-a3a-s2-battle-skarmory`, `c2-a3a-s2-event-legends`                             |
| `c2-a3a-s2-battle-skarmory` | battle       | 2     | Skarmory × 2 (1.1× HP)               | `c2-a3a-s3-event-ash`, `c2-a3a-s3-battle-scizor`                                   |
| `c2-a3a-s2-event-legends`   | event        | 2     | _Legends Stir_                       | `c2-a3a-s3-event-ash`, `c2-a3a-s3-battle-scizor`                                   |
| `c2-a3a-s3-event-ash`       | event        | 3     | _Sacred Ash_                         | `c2-a3a-s4-card-removal`, `c2-a3a-s4-event-feather`                                |
| `c2-a3a-s3-battle-scizor`   | battle       | 3     | Scizor + Houndoom                    | `c2-a3a-s4-card-removal`, `c2-a3a-s4-event-feather`                                |
| `c2-a3a-s4-card-removal`    | card_removal | 4     | Remove up to 2 cards                 | `c2-a3a-s5-recruit-raikou`, `c2-a3a-s5-recruit-entei`, `c2-a3a-s5-recruit-suicune` |
| `c2-a3a-s4-event-feather`   | event        | 4     | _Rainbow Feather_                    | `c2-a3a-s5-recruit-raikou`, `c2-a3a-s5-recruit-entei`, `c2-a3a-s5-recruit-suicune` |
| `c2-a3a-s5-recruit-raikou`  | recruit      | 5     | Raikou _(pre-assigned, not random)_  | `c2-a3a-s6-rest`                                                                   |
| `c2-a3a-s5-recruit-entei`   | recruit      | 5     | Entei _(pre-assigned, not random)_   | `c2-a3a-s6-rest`                                                                   |
| `c2-a3a-s5-recruit-suicune` | recruit      | 5     | Suicune _(pre-assigned, not random)_ | `c2-a3a-s6-rest`                                                                   |
| `c2-a3a-s6-rest`            | rest         | 6     | Heal 30% or +10 max HP               | `c2-a3a-s7-boss-ho-oh`                                                             |
| `c2-a3a-s7-boss-ho-oh`      | battle       | 7     | **Ho-Oh** (2.0× HP)                  | — _(run complete)_                                                                 |

> **Stage 5 recruit nodes:** Unlike normal recruit nodes, these have `pokemonId` pre-assigned in the node definition (not by `assignRecruitPokemon`). `assignRecruitPokemon` skips nodes whose `pokemonId` is already set. The legendary beasts' high base HP makes the 1v1 fight inherently challenging without a special multiplier.

### Boss: Ho-Oh

- **Pokemon:** Ho-Oh (Fire/Flying)
- **HP Multiplier:** 2.0×
- **Position:** front, column 1
- **Deck:** `sacred-fire`, `sacred-fire`, `sacred-fire`, `solar-beam`, `solar-beam`, `earthquake`, `earthquake`, `recover`, `recover`, `wing-attack`
- **Flavor:** _"Ho-Oh regards you from the summit, feathers billowing in a wind that isn't there. Then it attacks — and the top floor of the Tin Tower becomes a furnace."_

### Act 3A Events

---

#### Event: Legends Stir

**ID:** `c2_legends_stir_a`
**Narrative:** Through a high window, you see three shapes moving across the hillside far below — one crackling with electricity, one wreathed in flame, one leaving frost on every surface it crosses. They're climbing the tower on the outside, scaling the walls like they belong here. They've been here before. Or they will be. With time, it's hard to say.

| Choice | Label                        | Outcome                                                                                                                                                                                                              |
| ------ | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Watch until they disappear" | **Fixed:** `xp` +2 to all, `maxHpBoost` +5 to all. _The sight of them hardens something in your team._                                                                                                               |
| B      | "Call out to them"           | **Random:** 70% → `healPercent` 25% to all _("one of them turns briefly, almost acknowledging you")_. 30% → `damage` 8 to one + `healPercent` 15% to all _("Raikou answers with a thunderbolt, then keeps moving")._ |

---

#### Event: Sacred Ash

**ID:** `c2_sacred_ash`
**Narrative:** In a stone bowl surrounded by offerings, a faint ember still smolders. Sacred Ash — embers from Ho-Oh's last descent, decades ago. The monks say it can restore life. You are not a monk. Touch it anyway.

| Choice | Label                    | Outcome                                                                                                                                                                                                        |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Touch the ash"          | **Random:** 65% → `healPercent` 50% to all _("Ho-Oh's warmth spreads through your team")_. 35% → `healPercent` 20% to all + `damage` 10 to one _("the flame flares; one Pokemon recoils from the intensity")._ |
| B      | "Leave it for the monks" | **Fixed:** `maxHpBoost` +10 to all, `gold` +100. _A monk watches you go and presses coins into your hand._                                                                                                     |

---

#### Event: Rainbow Feather

**ID:** `c2_rainbow_feather`
**Narrative:** A single feather drifts down — iridescent, shifting through every color as light catches it. It did not fall by accident.

| Choice | Label                               | Outcome                                                                                                                                                                                |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Give it to your strongest Pokemon" | **Random:** 70% → `maxHpBoost` +15 to highest-HP party member _("it bonds completely")_. 30% → `maxHpBoost` +8 to highest-HP member _("the feather only partially takes")._            |
| B      | "Study it carefully"                | **Random:** 60% → `epicDraft` 2 card picks _("the patterns reveal techniques")_. 40% → `epicDraft` 1 card pick _("the colors are cryptic — you extract only part of what they hold")._ |

---

## Act 3B — Brass Tower

### Story

The Brass Tower stands wounded but still standing — floors charred, staircases collapsed in places, the air smelling of seawater and ash. Before the weight of history falls fully on it, it is still what it was meant to be: a refuge for the sea's guardian.

Every floor hums with psychic resonance. Lugia has been here since the fire, unwilling to leave the place it failed to protect. It knows you are coming before you reach the first landing. The Pokemon here — ghost-touched, water-deep, ancient — are all drawn to the same presence.

The three legendary beasts pass through as well. They don't linger, but one of them stops for you.

At the summit, Lugia waits. Not angry. Something more complicated — resigned, and perhaps relieved to be tested.

**Ending:** When Lugia falls, it exhales the deepest breath you've ever heard. The rift opens. Celebi is waiting.

### Map Overview

```
Stage 0    Stage 1                        Stage 2                      Stage 3                Stage 4             Stage 5                     Stage 6  Stage 7
Spawn ──── Battle (Misdreavus×2)           Battle (Slowking + Corsola)   Event (The Three       Card Removal        THREE-WAY BEAST CHOICE      Rest  ── Boss
            Battle (Qwilfish + Lanturn)     Event (Lugia's Presence)      Pokemon)               Event (Silver        Recruit (Raikou)                    (Lugia)
                                                                           Battle (Kingdra +       Feather)             Recruit (Entei)
                                                                            Politoed 1.1×)                              Recruit (Suicune)
```

### Node Details

| Node ID                     | Type         | Stage | Content                              | Connects To                                                                        |
| --------------------------- | ------------ | ----- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `c2-a3b-s0-spawn`           | spawn        | 0     | —                                    | `c2-a3b-s1-battle-ghost`, `c2-a3b-s1-battle-water`                                 |
| `c2-a3b-s1-battle-ghost`    | battle       | 1     | Misdreavus × 2                       | `c2-a3b-s2-battle-slowking`, `c2-a3b-s2-event-lugia`                               |
| `c2-a3b-s1-battle-water`    | battle       | 1     | Qwilfish + Lanturn                   | `c2-a3b-s2-battle-slowking`, `c2-a3b-s2-event-lugia`                               |
| `c2-a3b-s2-battle-slowking` | battle       | 2     | Slowking + Corsola                   | `c2-a3b-s3-event-three`, `c2-a3b-s3-battle-kingdra`                                |
| `c2-a3b-s2-event-lugia`     | event        | 2     | _Lugia's Presence_                   | `c2-a3b-s3-event-three`, `c2-a3b-s3-battle-kingdra`                                |
| `c2-a3b-s3-event-three`     | event        | 3     | _The Three Pokemon_                  | `c2-a3b-s4-card-removal`, `c2-a3b-s4-event-feather`                                |
| `c2-a3b-s3-battle-kingdra`  | battle       | 3     | Kingdra + Politoed (1.1× HP)         | `c2-a3b-s4-card-removal`, `c2-a3b-s4-event-feather`                                |
| `c2-a3b-s4-card-removal`    | card_removal | 4     | Remove up to 2 cards                 | `c2-a3b-s5-recruit-raikou`, `c2-a3b-s5-recruit-entei`, `c2-a3b-s5-recruit-suicune` |
| `c2-a3b-s4-event-feather`   | event        | 4     | _Silver Feather_                     | `c2-a3b-s5-recruit-raikou`, `c2-a3b-s5-recruit-entei`, `c2-a3b-s5-recruit-suicune` |
| `c2-a3b-s5-recruit-raikou`  | recruit      | 5     | Raikou _(pre-assigned, not random)_  | `c2-a3b-s6-rest`                                                                   |
| `c2-a3b-s5-recruit-entei`   | recruit      | 5     | Entei _(pre-assigned, not random)_   | `c2-a3b-s6-rest`                                                                   |
| `c2-a3b-s5-recruit-suicune` | recruit      | 5     | Suicune _(pre-assigned, not random)_ | `c2-a3b-s6-rest`                                                                   |
| `c2-a3b-s6-rest`            | rest         | 6     | Heal 30% or +10 max HP               | `c2-a3b-s7-boss-lugia`                                                             |
| `c2-a3b-s7-boss-lugia`      | battle       | 7     | **Lugia** (2.0× HP)                  | — _(run complete)_                                                                 |

> **Stage 5 recruit nodes:** Same note as Act 3A — `pokemonId` is pre-assigned, not drawn from the recruit pool. The player picks ONE of the three beasts. Each is a 1v1 fight from the player's party; legendary base HP makes it meaningful without a special multiplier.

### Boss: Lugia

- **Pokemon:** Lugia (Psychic/Flying)
- **HP Multiplier:** 2.0×
- **Position:** front, column 1
- **Deck:** `aeroblast`, `aeroblast`, `aeroblast`, `hydro-pump`, `hydro-pump`, `psychic`, `psychic`, `future-sight`, `recover`, `recover`
- **Flavor:** _"Lugia does not rage. It is still, the way deep water is still — and the moment it moves, the entire tower shakes. Its attacks don't feel like attacks. They feel like weather."_

### Act 3B Events

---

#### Event: Lugia's Presence

**ID:** `c2_lugia_presence`
**Narrative:** On the second floor, the air thickens. Your Pokemon stop moving. Every mind in your party registers the same thing simultaneously — weight, depth, cold focus. Something is reading you. Then it withdraws. You are found acceptable. Probably.

| Choice | Label                  | Outcome                                                                                                                                                                                                        |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Open your mind to it" | **Random:** 60% → `maxHpBoost` +12 to all _("the psychic current strengthens you")_. 40% → `damage` 10 to one + `maxHpBoost` +6 to all _("the contact is too intense for one team member to handle cleanly")._ |
| B      | "Shield your thoughts" | **Fixed:** `gold` +150, `healPercent` 20% to all. _Staying closed-off costs you nothing here. Small mercy._                                                                                                    |

---

#### Event: The Three Pokemon

**ID:** `c2_the_three_pokemon`
**Narrative:** On the third floor, three scorch marks ring a central column. The wood did not burn like wood — it burned _clean_, as if something intensely alive passed through it and left only the shape of its absence. Three shapes. A memorial.

| Choice | Label                          | Outcome                                                                                                                                                                                                                    |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Pay your respects"            | **Fixed:** `epicDraft` 1 card pick per active party member. _The silence here is unexpectedly generous._                                                                                                                   |
| B      | "Investigate the scorch marks" | **Random:** 65% → `gold` +200 + `maxHpBoost` +8 to one _("something preserved by the heat")_. 35% → `damage` 10 to one + `gold` +100 _("disturbing sacred ground has consequences — but there was still something here")._ |

---

#### Event: Silver Feather

**ID:** `c2_silver_feather`
**Narrative:** A feather — purely silver — lands on the back of your hand with no wind to carry it. Weightless. When you hold it to the light, it doesn't reflect — it absorbs. Then it dissolves, leaving only cold.

| Choice | Label                             | Outcome                                                                                                                                                                                                         |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | "Give it to your weakest Pokemon" | **Random:** 70% → `maxHpBoost` +18 to lowest-HP party member _("something in them changes — quieter, deeper")_. 30% → `maxHpBoost` +10 to lowest HP + `addDazed` 1 to that Pokemon _("the cold was too much")._ |
| B      | "Hold onto it for now"            | **Fixed:** `healPercent` 30% to all, `gold` +75. _It dissolves in your pack eventually. But slowly._                                                                                                            |

---

#### Event: Legends Stir _(Act 3B version)_

**ID:** `c2_legends_stir_b`
**Narrative:** A high window in the tower looks out over the bay. Far below, three shapes move through the mist — one airborne, one cresting a wave, one barely visible between bolts of distant lightning. They're circling the tower. Waiting for something. One of them will be waiting for _you_, higher up.

| Choice | Label                          | Outcome                                                                                                |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| A      | "Watch them for a moment"      | **Fixed:** `xp` +2 to all, `maxHpBoost` +5 to all. _The sight of them hardens something in your team._ |
| B      | "Turn away — don't tempt fate" | **Fixed:** `healPercent` 20% to all, `gold` +100. _Wisdom is sometimes knowing when not to look._      |

---

## Campaign Recruit Pools

| Act                          | Available Pokemon (once all are added)                            |
| ---------------------------- | ----------------------------------------------------------------- |
| Act 1 (Ilex Forest)          | Spinarak, Hoothoot, Hoppip, Sunkern, Aipom, Ledyba                |
| Act 2 common (event recruit) | Blissey _(via Wild Blissey event — not in pool, only from event)_ |
| Act 2 common + both paths    | Stantler, Marill, Misdreavus, Flaaffy, Dunsparce, Girafarig       |
| Act 2 Upper Path recruits    | Togetic, Stantler                                                 |
| Act 2 Lower Path recruits    | Sneasel, Umbreon, Houndour, Teddiursa                             |
| Act 3A beast choice          | Raikou, Entei, or Suicune (player picks one)                      |
| Act 3B beast choice          | Raikou, Entei, or Suicune (player picks one)                      |

---

## Campaign-Specific Narrative Texts

Three screens currently show hardcoded Campaign 1 text that must become campaign-configurable.

### What's Hardcoded and Where

| Screen               | File                                               | Hardcoded Text                                                                  |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Campaign Draft intro | `CampaignDraftScreen.tsx` line 225                 | _"There have been some strange disturbances in the old Team Rocket hideout..."_ |
| Act transition       | `ActTransitionScreen.tsx` `getTransitionContent()` | Heading, story, button label, accent color per act                              |
| Victory subtitle     | `RunVictoryScreen.tsx` line 93                     | _"Mewtwo has been subdued. Team Rocket's ambitions lie in ruins..."_            |

### Proposed `narrativeTexts` Field on `CampaignDefinition`

```typescript
narrativeTexts: {
  draftIntro: string;
  actTransitions: Record<number, {
    heading: string;
    story: string;
    buttonLabel: string;
    accentColor: string;
  }>;
  victorySubtitle: string;
  /** Optional per-variant subtitle for campaigns with branching Act 3s. */
  victorySubtitleVariants?: Record<string, string>;
}
```

`victorySubtitleVariants` is keyed by act variant name (`'tin_tower'` or `'brass_tower'`). If a variant key matches the current act's variant, it overrides `victorySubtitle`.

### Johto Campaign Text Values

**draftIntro:**

> "Strange reports have been filtering out of Ilex Forest. The ancient Celebi shrine is radiating unstable temporal energy, and the wild Pokemon in the area have grown erratic. You've been sent to investigate — but you won't be going alone."

**actTransitions:**

```
Act 1 → 2:
  heading:     "Act 1 Complete!"
  story:       "Celebi falls. The forest holds its breath. Then — a tear splits the
                air, a rush of light, and you're falling backward through time. When
                you land, the world is different. Older. Untouched. The Brass Tower
                still stands."
  buttonLabel: "Enter the Past"
  accentColor: "#34d399"   (emerald green)
```

**victorySubtitle (default):**

> "The guardian falls. The rift opens. Celebi watches from between the trees as you step back through the thread you came from."

**victorySubtitleVariants:**

```
"tin_tower":
  "Ho-Oh descends from the summit, wreathed in flame. Its wings slow. It lands
   before you — and for one long moment, it regards you. Then the rift opens.
   Celebi is waiting. It's time to go home."

"brass_tower":
  "Lugia folds its wings and becomes still. The Brass Tower goes silent — the
   deepest silence you've heard. It exhales slowly, and the rift opens. Celebi
   is waiting. It's time to go home."
```

### Implementation Steps

1. Add `narrativeTexts` to `CampaignDefinition` in `campaigns.ts`.
2. Update `CampaignDraftScreen` to read `campaign.narrativeTexts.draftIntro` instead of the inline string.
3. Update `ActTransitionScreen` to call `getCampaign(run.campaignId).narrativeTexts.actTransitions[run.currentAct]` for heading/story/button/color, falling back to the current hardcoded content when `narrativeTexts` is missing (Campaign 1 backward compat).
4. Update `RunVictoryScreen` to call `getCampaign(run.campaignId).narrativeTexts.victorySubtitle`. Check `victorySubtitleVariants[run.actVariants?.[run.currentAct]]` first and use it if present.

---

## Map Visual Config (Per Act)

| Act                  | Background Image                                              | Tint                     | Ambient Color | Title                 |
| -------------------- | ------------------------------------------------------------- | ------------------------ | ------------- | --------------------- |
| Act 1 — Ilex Forest  | Dense ancient forest, shrine visible through mist             | `rgba(5, 20, 5, 0.45)`   | `#4ade80`     | `Act 1 — Ilex Forest` |
| Act 2 — Past Johto   | Open hillside, both towers in distance, ash in air            | `rgba(30, 20, 10, 0.35)` | `#fbbf24`     | `Act 2 — Past Johto`  |
| Act 3A — Tin Tower   | Tower interior, golden light through high windows             | `rgba(40, 25, 0, 0.3)`   | `#f97316`     | `Act 3 — Tin Tower`   |
| Act 3B — Brass Tower | Ruined interior, cold silver glow, char marks, standing water | `rgba(5, 10, 25, 0.4)`   | `#a5f3fc`     | `Act 3 — Brass Tower` |

- Past Johto (Ecruteak City): End of the day around sunset, orange trees, gray cobblestone streets, Japanese-style homes from the Kansai region, lanterns in the streets.
- Tin Tower (Home of Ho-oh): The interior floor of an ancient and regal Japanese tower shrine, with deep red walls and ornate golden accents with golden light filtering through the windows.
- Brass Tower (Home of Lugia): The ruined interior of an abandoned and mysterious Japanese tower shrine, with deep indigo walls, char marks, standing water, and the cold silver glow of moonlight trickling through the windows.

New background images needed. Place in `assets/backgrounds/` and update `campaigns.ts` map configs.

- Act 1 Map Background: `assets/backgrounds/campaign_2_act_1_map_background.png`
- Act 1 Combat Background: `assets/backgrounds/campaign_2_act_1_combat_background.png`
- Act 2 Map Background: `assets/backgrounds/campaign_2_act_2_map_background.png`
- Act 2 Combat Background: `assets/backgrounds/campaign_2_act_2_combat_background.png`
- Act 3A Map Background: `assets/backgrounds/campaign_2_act_3a_map_background.png`
- Act 3A Combat Background: `assets/backgrounds/campaign_2_act_3a_combat_background.png`
- Act 3B Map Background: `assets/backgrounds/campaign_2_act_3b_map_background.png`
- Act 3B Combat Background: `assets/backgrounds/campaign_2_act_3b_combat_background.png`

---

## Implementation Notes

### 1. Branching Act 3

Extend `CampaignActDef` in `campaigns.ts` with optional variants:

```typescript
export interface CampaignActDef {
  actNumber: number;
  nodes: MapNode[];
  spawnNodeId: string;
  bossNodeId: string;
  mapConfig: ActMapConfig;
  variants?: Record<
    string,
    {
      nodes: MapNode[];
      spawnNodeId: string;
      bossNodeId: string;
      mapConfig: ActMapConfig;
    }
  >;
}
```

Extend `ActTransitionNode` in `run/types.ts`:

```typescript
export interface ActTransitionNode extends BaseNode {
  type: "act_transition";
  nextAct: number;
  actVariant?: string; // e.g. 'tin_tower' | 'brass_tower'
}
```

Store the active variant in `RunState`:

```typescript
actVariants: Record<number, string>; // e.g. { 3: 'tin_tower' }
```

In `transitionToNextAct`: read `actVariant` from the transition node, store in `RunState.actVariants`, and select the correct node/config from `campaign.acts[nextActNumber].variants[actVariant]` if present.

In `migrateRunState`: default `actVariants: {}` for old saves.

### 2. Two Possible Act 2 Boss Nodes

Add to `CampaignActDef`:

```typescript
alternateBossNodeIds?: string[];
```

In `isCurrentActComplete`:

```typescript
const bossIds = [actDef.bossNodeId, ...(actDef.alternateBossNodeIds ?? [])];
return run.nodes.some((n) => bossIds.includes(n.id) && n.completed);
```

### 3. Dynamic Gold/Silver Boss Teams

See the implementation note in the Act 2 section. Add `assignGoldSilverEnemies(nodes, starterBaseFormId)` and call it inside `transitionToNextAct` when transitioning to Act 2.

### 4. Pre-assigned Legendary Beast Recruit Nodes

Nodes `c2-a3x-s5-recruit-raikou` etc. have `pokemonId` already set in the node definition. `assignRecruitPokemon` skips recruit nodes where `pokemonId !== ''`, so these don't get overwritten by random assignment. No engine changes needed — this works with the existing system.

Update `isRunComplete` / bossNodeId references in `campaigns.ts` to use the new node IDs (`c2-a3a-s7-boss-ho-oh` and `c2-a3b-s7-boss-lugia`) once implemented.

### 5. Event System — Campaign Scoping

Events are filtered by `act: 1 | 2 | 3` in `events.ts`. Both campaigns share act numbers, so they'd mix.

**Fix:** Add `campaignId?: string` to `EventDefinition`. `getEventsForAct` accepts a `campaignId` and filters accordingly. Events without `campaignId` remain shared (backward-compat).

### 6. New Pokemon — Implementation Batches

Each Pokemon needs: `pokemon.json` entry, `progression.ts` tree, sprite download.

1. **Act 1 batch:** Hoppip line, Sunkern line, Aipom, Yanma, Misdreavus, Sudowoodo, Wooper line, Celebi
2. **Act 2 batch:** Stantler, Marill line, Flaaffy line, Togetic, Espeon, Umbreon, Heracross, Houndour line, Sneasel, Teddiursa line, Larvitar line, Miltank, Wobbuffet, Blissey, Pineco/Forretress, Steelix (standalone), Scizor (standalone), Dunsparce, Girafarig
3. **Act 3A batch:** Slugma line, Phanpy line, Skarmory, Ho-Oh
4. **Act 3B batch:** Slowking (standalone), Corsola, Mantine, Chinchou line, Qwilfish, Politoed (standalone), Kingdra (standalone), Lugia
5. **Legendary beasts:** Raikou, Entei, Suicune

### 7. New Moves

Add before implementing the relevant acts: `ancient-power`, `magical-leaf`, `sacred-fire`, `aeroblast`, `future-sight`, `present`. Also verify whether `thunderbolt` and `thunder` exist — check Pikachu/Raichu decks in `pokemon.json`.

### 8. Music

The background music should also be configurable by campaign. Use the following tracks on loop for these parts of the Johto campaign:

- Act 1
  - Ilex Forest Dungeon: `assets/music/celebi_dungeon_lush_forest_remix.mp3`
  - Regular Battle: `assets/music/regular_battle_johto_gym_leader_remix.mp3`
  - Boss Battle with Celebi: `assets/music/celebi_boss_time_gear_remix.mp3`
- Act 2
  - Past Johto Dungeon: `assets/music/past_dungeon_ecruteak_city_remix.wav`
  - Regular Battle: `assets/music/regular_battle_johto_gym_leader_remix.mp3`
  - Boss Battle with Gold: `assets/music/gold_silver_boss_johto_rival_battle_remix.mp3`
  - Boss Battle with Silver: `assets/music/gold_silver_boss_johto_rival_battle_remix.mp3`
- Act 3A
  - Tin Tower Dungeon: `assets/music/hooh_dungeon_tin_tower_remix.mp3`
  - Regular Battle: `assets/music/regular_battle_johto_gym_leader_remix.mp3`
  - Raikou/Entei/Suicune Battle: `assets/music/recruitable_boss_legendary_beast_remix.mp3`
  - Boss Battle with Ho-oh: `assets/music/hooh_lugia_boss_johto_boss_remix.mp3`
- Act 3B
  - Brass Tower Dungeon: `assets/music/lugia_dungeon_burned_tower_remix.mp3`
  - Regular Battle: `assets/music/regular_battle_johto_gym_leader_remix.mp3`
  - Raikou/Entei/Suicune Battle: `assets/music/recruitable_boss_legendary_beast_remix.mp3`
  - Boss Battle with Ho-oh: `assets/music/hooh_lugia_boss_johto_boss_remix.mp3`
