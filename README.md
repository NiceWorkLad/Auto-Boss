# Auto-Boss

A run-based auto-battler in an 80s-arcade style, against pixel-art brainrot enemies. The fights play themselves. Every decision between them is yours: the route, the weapon, the targeting, the loot, the events. A run is won or lost by those choices.

## How a run works

1. **Pick a class**, then **a weapon** (one of three at random). You carry two weapons (three as a Roadie), one armour and two trinkets. Any class can use any weapon.
2. **Route through the map.** Brainrot Beach is 11 rows of branching, crossing paths. You see every node's type ahead of time, and elite nodes show which elite waits there.
   - **Fight:** a group of minions.
   - **Elite:** a hard fight with better loot.
   - **Shop:** the premium stop. Rarer stock, a bigger and cheaper heal, rerolls, the forge, and always a weapon of a type you don't carry.
   - **Rest:** heal.
   - **Treasure:** pick one of three items.
   - **Event:** a short story with choices that trade HP, gold or items.
   - **Boss:** Tralalero Tralala.
3. **Before each fight** you see every enemy's traits, weaknesses, resistances and moves, and what each of your cards will do in this fight. Choose which weapon to hold and how to target (front, lowest HP or biggest threat), then press FIGHT and watch.
4. **After a win** you get gold, then pick one of three items (sometimes one is a card) or skip them for bonus gold. HP carries over between fights; a win gives back a little. Die and the run is over. Beat the boss and the zone is cleared.
5. **The merchant** is a button on the map: open it any time between stops. Its small stock (common and uncommon items and a potion) changes every row. It costs more than a shop, and its forge costs more too.

Every run has a seed, shown on the map and the summary. The same seed gives the same map, encounters, offers and fights. Type a seed on the title screen to replay one. The run is saved after every decision, so a refresh resumes it; a refresh mid-fight goes back to the pre-fight screen.

### Classes

| Class | Stats | Passive | Economy |
|---|---|---|---|
| Bruiser | +10 max HP, +0.3 armour, −10% attack speed | heals 2% of max HP more after each win | heals at shops and the merchant cost 30% less |
| Hustler | −10 max HP | 10% interest on unspent gold every row (up to 8) | merchant prices 20% lower; can sell items and cards at the merchant and shops |
| Roadie | base | a third weapon slot | — |
| Glass Cannon | −25 max HP | +10% crit chance, +0.6× crit damage | starts with a 4th card slot |

Classes are data (`CLASSES` in `items.js`): their stats go through `compileHero`, and the run logic reads the rest. The Roadie could instead get one automatic mid-fight swap (to the other weapon, when a phase changes or adds arrive, if it fits better); the code for it stays behind `CLASS_VARIANT.roadie = 'swap'` (`node balance.js --roadie=swap`). The third slot won because it keeps the choice in your hands: with it the smart bot clears 46% against 18% for the random-weapon bot, while the swap gave 43% against 26%. The swap partly plays the game for you.

### Why the weapon matters

| Weapon | Damage | Shape | Good against | Bad against |
|---|---|---|---|---|
| Sword | slash | cleave; cuts halve healing for 4s and crack armour a little | unarmoured groups (coconuts), healers | armour, flyers |
| Boxing Gloves | blunt | fast single; 3 hits cancel a wind-up | crabs, dodgers, wind-ups | flyers, big HP pools |
| Uzi | pierce | very fast single, hard to dodge; every bullet wears armour down | flyers and dodgers (seagulls, Bombardiro) | armour eats most of each bullet |
| Magic Wand | magic | slow single, ignores armour | armour and shields (Lirilì Larilà) | swarms, dodgers |
| Electric Guitar | sonic | hits everyone, heals you; rattles big enemies through most of their armour and their healing | swarms, shields (jellyfish, Tralalero's adds) | single high-HP targets |
| Bazooka | explosive | huge single + splash; a rocket that misses a flyer still clips it for half | armoured groups (crabs) | flyers, dodgers |

No weapon is a hard wall: each bad matchup has a small way through (wearing armour down, cutting off healing, near misses), so a wrong weapon makes an elite hard rather than hopeless.

**Enemy traits:**
- **Armoured:** blocks a flat amount per hit.
- **Evasive:** dodges, and slow weapons suffer most.
- **Flying:** halves slash and blunt damage, and rockets often miss (the blast still clips for half).
- **Shielded:** absorbs damage first; magic and sonic hit shields twice as hard.
- **Regenerates:** heals over time.
- **Summoner:** calls in adds.

Elites and the boss also have move sets: telegraphed slams, volleys, summons, shields, self-heals and dodge stances. Tralalero has a second phase at 50% HP, with a shield, adds and more damage.

**Enchantments.** Elites and the boss sometimes carry one or two enchantment cards, more often deeper in the run (an elite on row 4 about 1 in 3, the boss about half the time). The map shows a badge on an enchanted node and lists the enchantments of the elites and boss you can reach next; the pre-fight screen shows each one with its counter. For example:

- *Tralalero's Encore:* gets back up once at 25% HP. Magic damage burns the encore away.
- *Concrete Contract:* gains armour every 8 seconds. Blunt hits crack it.
- *Union Bodyguard:* a crab stands in front, and while it stands the elite takes 40% less damage. Knock the crab out first.
- *Mirror Ball:* reflects a quarter of the magic damage it takes. Switch off the Wand.

There are 18. They never touch your items or cards, never block shops or healing, never stop you attacking and never kill outright: reflected damage and Sunburn stop at 1 HP.

### Loot

- **Rarities:** Common, Uncommon, Rare, Epic and Legendary. Higher rarity scales the base and adds affixes that hook into combat: damage against flying, armoured, shielded, evasive or groups, armour pierce, an extra cleave target, starting shields, lifesteal, thorns and more.
- **Legendaries:** each always costs you something. For example, "every attack hits all enemies, but you take 30% more damage".

### Cards

Cards sit on a **card board** beside your gear and change how the auto-fight plays. The board starts with 3 slots and gains one for every elite you beat, up to 6. A full board means swapping: the card you replace is sold for a little gold (4 to 25 by rarity). You can only hold one copy of a card.

| Type | What it does | Example |
|---|---|---|
| Boost | a straight stat gain | *Tung Tung Tempo*: +10% damage |
| Pact | a big upside with a drawback you can plan around | *Gelato Brain Freeze*: +40% attack speed, but you start attacking 2.5s late |
| Trigger | whenever X, do Y: on hit, crit, kill, taking damage, dropping below an HP line, every N seconds, at the start of the fight, when an ally dies | *Coconut Insurance*: the first time you drop below 25% HP, gain a shield |
| Summon | allies that fight beside you with their own HP, damage type and sprite. Enemies' basic attacks can hit them | *Crab Intern*: a tough crab that draws fire |
| Multiplier | makes other cards better | *Echo Pedal*: your Trigger cards fire twice |

Every card has one or two **tags** (Gull, Tide, Spark, Gold, Brainrot, Concrete). Some cards scale with how many of a tag you own, and three cards sharing a tag switch on that tag's **set bonus** (for example, Gull: one more Union Gull joins every fight). Cards come in the same five rarities as items, and every Legendary card has a drawback. Card damage and summons grow a little with the row you're on.

Cards turn up as one of the three offers after some fights (30%, elites 50%), in chests (50%), from the *Tung Tung Tarot* event, at the merchant (one common card) and at map shops (one uncommon-or-better card). In the arena, triggers flash their card's name under your HP bar, zaps draw a bolt in their damage type, and allies stand in front of you with their own HP bars.

### Gold

Every won fight pays gold on top of the item pick: 15–25 from a fight and 45–60 from an elite, plus a small bonus if you won without dropping below half HP. Skipping the item pays 60% of the fight's gold again. Treasure chests and some event choices pay a little too. The `gold` stat (the treasure map, the "of Tourists" affix) scales all of it.

| Where | What it sells | Prices |
|---|---|---|
| Merchant (map button, new stock every row) | 3 common or uncommon items, a 25% potion, the forge | items ×1.25, potion 30, forge ×1.3 |
| Map shop | a weapon you don't carry, armour, a trinket, one more; rarer than the merchant. A 45% heal, rerolls, the forge | items 40 / 70 / 110 / 170 / 260 by rarity, heal 20, reroll 15 (+10 each) |
| Forge (shop or merchant) | raise an item one rarity, up to Epic | 45 to Uncommon, 80 to Rare, 130 to Epic |

Rest is heal-only: the forge took over upgrades. (With Rest also upgrading, the smart bot cleared about 4 points more often, so it lost the option.) All of these numbers are the `ECON` table in `run.js`.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
npm run serve        # http://localhost:8080
```

`index.html#debug` opens the fight lab: any enemies against any weapon and any cards, with a quick simulated win-rate table.

## Build

`index.html` is generated. Edit the source files, then:

```bash
npm run build        # writes index.html
npm run check        # build + JavaScript syntax check
```

| File | What it is |
|---|---|
| `rules.js` | Seeded rng, damage types, traits, weapons, and the fight engine (`newFight`, `step`, `simulate`), including card triggers and allies |
| `zones.js` | Zones as data: enemies with traits, moves, phases and intro lines; elite and boss enchantments; minion groups by depth; events; stage colours; per-zone tuning |
| `items.js` | Classes, rarity, item bases, affixes, legendaries, and `compileHero`, which turns the class, the inventory and the card board into fight stats |
| `cards.js` | Cards as data: the card list, tags and set bonuses, summon units, and `applyCards`, which compiles a board onto the hero |
| `run.js` | Map generation, node logic, the economy (`ECON`: gold, shops, merchant, forge) and the run state machine. No DOM |
| `sprites.js` | All pixel art, drawn in code: enemies, hero, weapons, icons |
| `render.js` | The arena: synthwave stage, groups of enemies, shots, HP bars, banners |
| `sfx.js` | Chiptune sound effects from oscillators |
| `ui.js` | Screens, the fight runner, saving, the fight lab |
| `template.html` | Markup and styles |
| `balance.js` | Bots that play whole runs, and the weapon × encounter matrix |

`rules.js`, `zones.js`, `items.js`, `cards.js` and `run.js` are shared with `balance.js`, so the report runs the same numbers as the game.

A new zone is mostly data: add its enemies, groups, events, look and `tune` to `zones.js`, and their art to `ENEMY_ART` in `sprites.js`.

## Balance

```bash
node balance.js [runs] [--matrix] [--deaths] [--cards[=id,id]] [--ench] [--class=<id>] [--classes] [--roadie=slot|swap]
TUNE='{"bossAtk":0.8}' node balance.js     # try zone.tune values without editing zones.js
ECON='{"forge":[0,40,70,110]}' node balance.js   # and run.js ECON values
```

It plays runs with three bots that differ only in how they choose:
- **smart:** picks the weapon whose estimated fit is best, judged from the traits shown before the fight (`weaponFit` in `rules.js`), with a nudge towards a weapon an enchantment's counter names. It takes the best loot, valuing a second weapon type above a rarity tier. At shops and the merchant it heals when low, buys real upgrades and forges with what's left; it visits the merchant when low or carrying 70+ gold, and spends everything before the boss.
- **randomWeapon:** the same, but holds a random one of its two weapons each fight.
- **random:** every choice is random, including what it buys and forges.

The smart bots value a card by rarity, a little extra for summons and triggers, and synergy: cards that share a tag with the board, most of all one that completes a set, and multipliers only when there's something to multiply. When the board is full they swap out the weakest card if the new one is worth more.

All three take random routes. Without `--class` the runs cycle through the four classes by seed; `--class=bruiser` (or `hustler`, `roadie`, `glass`) plays only that class, and `--classes` adds a per-class table. Current numbers (500 runs each):

| | zone clear | avg row reached | gold earned | spent | left at the end |
|---|---|---|---|---|---|
| smart | 46% | 8.9 | 164 | 126 | 38 |
| randomWeapon | 20% | 7.3 | 123 | 86 | 37 |
| random | 4% | 6.3 | 104 | 35 | 69 |

By class (`--classes`, 500 runs each):

| class | smart | randomWeapon | random | smart elite / boss win | gold earned |
|---|---|---|---|---|---|
| Bruiser | 48% | 25% | 4% | 77% / 75% | 164 |
| Hustler | 43% | 20% | 3% | 79% / 76% | 184 |
| Roadie | 46% | 18% | 3% | 79% / 76% | 154 |
| Glass Cannon | 46% | 22% | 3% | 83% / 78% | 156 |

No class is best at everything: the Bruiser clears most often but has the weakest elite record, the Glass Cannon wins the most elite and boss fights but dies most often to minions, the Hustler earns the most gold, and the Roadie rewards weapon choice most.

Smart is about 11x random. The smart bot spends about three quarters of what it earns; a run that clears earns about 210 and finishes with about 35, mostly the boss fight's pay. HP on arriving at each row stays at 81–88% all the way down, with no trough after the elites. The best weapon still differs between encounters, but no elite or boss is a wall for any weapon: with the matrix's stand-in kit the worst weapon wins 32–37% against Lirilì Larilà (Uzi, Sword, Guitar) and 35% against Bombardiro (Bazooka), while the right one wins 100% with most of its HP left. Tralalero is the hardest fight in the run (smart bot 77%, against 83–87% for the elites; the worst weapons 67–72%). `--matrix` prints every weapon against every group, elite and the boss; every weapon is best somewhere. `--deaths` adds deaths by row, HP going into each row, and the fights that end runs.

`--cards` adds a table per card for the smart bot: how often it's taken when offered, how many runs held it and how they did, and two ablations on the same seeds. *Forced* starts every run with the card on the board and never drops it; since that's a free extra card from the first fight, most cards lift the clear rate by about 9 points, so the table also shows each card against the median card. *Pool* compares the game with the card against the game with it banned. No card sits more than 8 points above the median card (the top is Jellyfish Backing Band at +8), and no card moves the clear rate by more than about 1 point through being in the pool.

`--ench` reports enchanted elites and the boss against unenchanted ones, and the same fights with the enchantments taken off (same hero, weapon and fight seed). For the smart bot, elites are 80% unenchanted and 79% enchanted, the boss 73% and 70%; on the paired fights enchantments cost 6 points against elites and 8 against the boss. It then plays every enchantment on every elite and the boss with every weapon at the stand-in kit: a weapon the counter names loses 3 win points to an enchantment, any other weapon 14.
