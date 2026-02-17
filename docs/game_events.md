# Pokemon Roguelite Deckbuilder — Event Design Document

This document contains 30 events across 3 acts for the game, designed around the core outcome types: epic cards, permanent stat buffs, gold, max HP, card removal, revival, item cards, combat encounters, ally recruitment, XP, and damage.

---

## ACT I: VIRIDIAN GAME CORNER — "Routine Raid"

### Event 1: **Rocket Storage Room**
*Crates of stolen Pokeballs line the walls. Some are marked "CONFISCATED."*

**Choice A:** Break them open  
→ **Recruit a random ally for free** (imprisoned Pokemon joins you)

**Choice B:** Leave them sealed  
→ **Gain 30 gold** (sell intel to League later)

---

### Event 2: **Overworked Grunt**
*A Rocket Grunt sits slumped at a desk, exhausted.*

"Look, I don't get paid enough for this. Take what you want, just... don't report me, okay?"

**Choice A:** Intimidate him  
→ **Gain 50 gold** (he empties his pockets)

**Choice B:** Make a deal  
→ **Remove 2 cards from one Pokemon's deck** (he shows you which cards are "defective")

---

### Event 3: **Suspicious Machine**
*A humming device covered in dials and wires. A faded label reads: "PROTOTYPE - DO NOT TOUCH."*

**Choice A:** Activate it  
→ **50/50:** Gain epic card OR take 8 damage to random Pokemon

**Choice B:** Destroy it  
→ **Gain item card, show 3 random options from the store and let the player pick one** (salvage components)

---

### Event 4: **Stolen Protein Shakes**
*A refrigerator full of nutrition supplements labeled "FOR EXPERIMENTAL USE ONLY."*

**Choice A:** Drink one  
→ **+5 Max HP to one Pokemon**

**Choice B:** Take them all  
→ **+2 Max HP to all Pokemon**

**Choice C:** Leave them  
→ Nothing

---

### Event 5: **Trapped Hallway**
*You hear a click. Pressure plate. Dart trap activates!*

**Choice A:** Tank it  
→ **Take 6 damage to all Pokemon**

**Choice B:** Dodge! (requires average speed of party pokemon of 6+)  
→ **Gain 40 gold** (find hidden stash behind trap)  
→ If you fail: Take 10 damage to all Pokemon

---

### Event 6: **Wild Rattata Nest**
*A swarm of Rattata have made a home in the ventilation system.*

**Choice A:** Fight them  
→ **Fight 3 Rattata** (victory: gain 25 gold)

**Choice B:** Leave them be  
→ They gnaw you for 5 damage on all party pokemon as you narrowly escape

---

### Event 7: **Rocket Scientist's Notes**
*A discarded journal. Pages detail training techniques.*

**Choice A:** Study it  
→ **Give one Pokemon 1 XP**

**Choice B:** Ignore it  
→ Nothing

---

### Event 8: **First Aid Station**
*A Rocket medic station, abandoned but still stocked.*

**Choice A:** Heal up  
→ **Heal one pokemon for 50% HP**

**Choice B:** Raid supplies  
→ **+3 Max HP to one Pokemon**

---

### Event 9: **Gambling Corner**
*The actual Game Corner. Slot machines still running.*

**Choice A:** Play the slots (costs 60 gold)  
→ **33% chance:** Gain epic card  
→ **33% chance:** Gain 60 gold  (net even)
→ **33% chance:** Lose your 60 gold (nothing)

**Choice B:** Smash a machine  
→ **Gain 20 gold**

---

### Event 10: **Locked Vault**
*A reinforced safe. You could break it open... but it'll be loud.*

**Choice A:** Force it open  
→ **Gain epic card + item card**, BUT **next encounter, the pokemon are all one skill level up. note this in the hover tooltip bar**

**Choice B:** Leave it  
→ Nothing

---

## ACT II: RESEARCH WING — "Something Went Wrong"

### Event 11: **Broken Containment Pod**
*A shattered tube leaks strange fluid. Something was kept here. Pick a pokemon and have them analyze the residue? 50:50 chance*

**Outcome A:** It contains some of mewtwo's power, your pokemon absorbs it!
→ **+1 Energy/turn permanently to one Pokemon** (gain Mewtwo's power)

**Outcome B:** Step away  
→ **Take 15 damage to that Pokemon** (psychic backlash)

---

### Event 12: **Scientist in Hiding**
*A terrified researcher cowers behind overturned equipment.*

"Please! I'll help you! Just don't leave me here!"

**Choice A:** Let him follow you  
→ **He heals all Pokemon to full after next combat** (then flees)

**Choice B:** Send him away  
→ **Gain 40 gold** (he pays you to escort him to the elevator)

---

### Event 13: **Experimental Card Printer**
*A machine that synthesizes attack data into usable formats. Risk using it? 50:50 chance*

**Outcome A:** it works!  
→ **Pick a card from your deck and clone it** (permanent copy added)

**Outcome B:** It's overloaded!  
→ **You lose the card**

---

### Event 14: **Psychic Residue**
*The walls shimmer. You feel Mewtwo's presence in your mind.*

**Choice A:** Embrace it  
→ **+1 Card draw per turn permanently to one Pokemon**, BUT **add 2 Dazed cards to their deck ** Dazed cards are 0 cost do nothing vanish.

**Choice B:** Resist it  
→ **Take 8 damage to one Pokemon**

---

### Event 15: **Dead Electrode Pile**
*Self-destructed in a failed attempt to stop Mewtwo.*

**Choice A:** Scavenge parts  
→ **Gain item card** (user picks from random draw of 3 from the entire pool)

**Choice B:** Pay respects  
→ **Remove 1 card from each Pokemon's deck** (clarity of purpose)

---

### Event 16: **Unstable Evolution Chamber**
*A machine designed to force evolution. Warning lights blink.*

**Choice A:** Use it on one Pokemon  
→ **Give that Pokemon 3 XP** (enough to evolve if close)

**Choice B:** Sabotage it  
→ **Gain epic card** (salvaged tech)

---

### Event 17: **Emergency Rations**
*Food pellets designed for captive Pokemon. They don't look appetizing.*

**Choice A:** Feed your team  
→ **+4 Max HP to all Pokemon**

**Choice B:** Don't risk it  
→ Nothing

---

### Event 18: **Security Terminal**
*Flashing red. "CONTAINMENT BREACH. LOCKDOWN ACTIVE."*

**Choice A:** Override lockdown  
→ **Reveal entire map**

**Choice B:** Access personnel files  
→ **Gain 60 gold** (blackmail material)

---

### Event 19: **Mewtwo's Trail**
*Scorch marks and bent metal lead deeper into the facility.*

**Choice A:** Follow carefully  
→ **Choose: +5 Max HP to one Pokemon OR gain item card**

**Choice B:** Take a detour  
→ **Avoid next combat node** (skip ahead and still gain exp)

---

### Event 20: **Abandoned Battlefield**
*Dead Rocket Pokemon litter the floor. Mewtwo did this.*

**Choice A:** Search the bodies  
→ **Gain 2 epic cards**, BUT **take 6 damage to all Pokemon** (guilt/psychic echo)

**Choice B:** Move on  
→ Nothing

---

## ACT III: THE LAIR — "Face the Storm"

### Event 21: **Neural Suppressor Wreckage**
*Broken psychic dampening equipment. Still has residual charge.*

**Choice A:** Repurpose it  
→ **+1 Energy/turn permanently to one Pokemon**

**Choice B:** Drain the power  
→ **Gain item card** (Psychic Shield)

---

### Event 22: **Birth Chamber**
*The tank where Mewtwo was created. Empty. Ominous.*

**Choice A:** Examine the controls  
→ **Gain epic card** (Genetic Memory - powerful Psychic card)

**Choice B:** Destroy it  
→ **Remove up to 3 cards from one Pokemon's deck** (purge weakness)

---

### Event 23: **Psychic Vortex**
*Energy swirls in the air. You could channel it... or it could destroy you.*

**Choice A:** Channel the energy  
→ **+1 Card draw per turn permanently to one Pokemon**, BUT **take 12 damage to that Pokemon**

**Choice B:** Avoid it  
→ **Take 5 damage to all Pokemon** (residual effect)

---

### Event 24: **Mewtwo's Voice**
*A whisper in your mind: "Turn back. Or prove yourself."*

**Choice A:** Accept the challenge  
→ **Fight a powerful wild Pokemon** (Fully leveld L4 random pokemon. victory: gain 2 epic cards)

**Choice B:** Ignore it  
→ **Take 8 damage to random Pokemon** (psychic punishment)

---

### Event 25: **Experiment Records**
*Data logs detail Mewtwo's creation. Horrifying. Useful.*

**Choice A:** Study them  
→ **Give one Pokemon 1 XP**

**Choice B:** Burn them  
→ **Remove up to 2 cards from all Pokemon's decks** (moral clarity)

---

### Event 26: **Energy Overflow**
*A cracked power core pulses with unstable energy.*

**Choice A:** Absorb it (risky)  
→ **75% chance:** +1 Energy permanently to one Pokemon  
→ **25% chance:** Take 15 damage to all Pokemon

**Choice B:** Stabilize it  
→ **Gain item card**

---

### Event 27: **Giovanni's Emergency Cache**
*A hidden stash. He planned for this.*

**Choice A:** Take the gold  
→ **Gain 100 gold + item card**

**Choice B:** Look through the supplies
→ **Gain 1 random item card**

---

### Event 28: **The Altar of Power**
*A pedestal holding a glowing orb. Mewtwo's excess energy crystallized.*

**Choice A:** Claim it for one Pokemon  
→ **+1 Energy permanently + +1 Card draw permanently to that Pokemon**, BUT **add 2 Dazed cards to their deck**

**Choice B:** Destroy it  
→ **Gain 2 epic cards**

---

### Event 29: **Mirror of Truth**
*A psychic construct. Shows your Pokemon's potential... or their limits.*

**Choice A:** Look for one Pokemon  
→ **Choose:** Remove 3 cards OR gain epic card OR +8 Max HP

**Choice B:** Shatter it  
→ **Take 10 damage to all Pokemon**, BUT **remove 1 card from each Pokemon's deck**



---

## DESIGN NOTES

### Act Progression
- **Act I:** Low stakes, resource gathering, mostly positive outcomes. Teaches event mechanics.
- **Act II:** Higher risks, stronger rewards. More "cursed bargain" style choices. Psychic theme emerges.
- **Act III:** Maximum risk/reward. Almost every choice has a significant downside. You're in Mewtwo's domain.

### Outcome Distribution
- **Gold:** Present in all acts (economic pressure)
- **Cards:** Escalates (rare → epic as acts progress)
- **HP/damage:** Scales up (Act I = 5-8 damage, Act III = 10-15 damage)
- **Permanent buffs:** Rare in Act I, common in Act III (high power at high cost)

### Balance Philosophy
Events should create meaningful choices where both options are defensible depending on:
- Current party HP
- Gold reserves
- Deck quality (does removing cards help more than adding?)
- Risk tolerance (gambling vs. safe plays)
- Upcoming encounters (resource conservation)

Note, when an event says "gain an epic card" that should be a draft. So the game randomly draws from the pool of epic cards - 3 cards. The player can then draft one of them, or skip. If it says "gain 2 epic cards" then, it happens twice. Follows normal rules around type pooling.
