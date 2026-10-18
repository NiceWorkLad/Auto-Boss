# Auto-Boss

A run-based auto-battler in an 80s-arcade style, against pixel-art brainrot enemies. The fights play themselves. Every decision between them is yours: the route, the weapon, the targeting, the loot, the events. A run is won or lost by those choices.

## How a run works

1. **Pick a weapon**, one of three at random. You carry two weapons, one armour and two trinkets.
2. **Route through the map.** Brainrot Beach is 11 rows of branching, crossing paths. You see every node's type ahead of time, and elite nodes show which elite waits there.
   - **Fight:** a group of minions.
   - **Elite:** a hard fight with better loot.
   - **Shop:** the premium stop. Rarer stock, a bigger and cheaper heal, rerolls, the forge, and always a weapon of a type you don't carry.
   - **Rest:** heal.
   - **Treasure:** pick one of three items.
   - **Event:** a short story with choices that trade HP, gold or items.
   - **Boss:** Tralalero Tralala.
3. **Before each fight** you see every enemy's traits, weaknesses, resistances and moves. Choose which weapon to hold and how to target (front, lowest HP or biggest threat), then press FIGHT and watch.
4. **After a win** you get gold, then pick one of three items or skip them for bonus gold. HP carries over between fights; a win gives back a little. Die and the run is over. Beat the boss and the zone is cleared.
5. **The merchant** is a button on the map: open it any time between stops. Its small stock (common and uncommon items and a potion) changes every row. It costs more than a shop, and its forge costs more too.

Every run has a seed, shown on the map and the summary. The same seed gives the same map, encounters, offers and fights. Type a seed on the title screen to replay one. The run is saved after every decision, so a refresh resumes it; a refresh mid-fight goes back to the pre-fight screen.

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

### Loot

- **Rarities:** Common, Uncommon, Rare, Epic and Legendary. Higher rarity scales the base and adds affixes that hook into combat: damage against flying, armoured, shielded, evasive or groups, armour pierce, an extra cleave target, starting shields, lifesteal, thorns and more.
- **Legendaries:** each always costs you something. For example, "every attack hits all enemies, but you take 30% more damage".

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

`index.html#debug` opens the fight lab: any enemies against any weapon, with a quick simulated win-rate table.

## Build

`index.html` is generated. Edit the source files, then:

```bash
npm run build        # writes index.html
npm run check        # build + JavaScript syntax check
```

| File | What it is |
|---|---|
| `rules.js` | Seeded rng, damage types, traits, weapons, and the fight engine (`newFight`, `step`, `simulate`) |
| `zones.js` | Zones as data: enemies with traits, moves, phases and intro lines; minion groups by depth; events; stage colours; per-zone tuning |
| `items.js` | Rarity, item bases, affixes, legendaries, and `compileHero`, which turns the inventory into fight stats |
| `run.js` | Map generation, node logic, the economy (`ECON`: gold, shops, merchant, forge) and the run state machine. No DOM |
| `sprites.js` | All pixel art, drawn in code: enemies, hero, weapons, icons |
| `render.js` | The arena: synthwave stage, groups of enemies, shots, HP bars, banners |
| `sfx.js` | Chiptune sound effects from oscillators |
| `ui.js` | Screens, the fight runner, saving, the fight lab |
| `template.html` | Markup and styles |
| `balance.js` | Bots that play whole runs, and the weapon × encounter matrix |

`rules.js`, `zones.js`, `items.js` and `run.js` are shared with `balance.js`, so the report runs the same numbers as the game.

A new zone is mostly data: add its enemies, groups, events, look and `tune` to `zones.js`, and their art to `ENEMY_ART` in `sprites.js`.

## Balance

```bash
node balance.js [runs] [--matrix] [--deaths]
TUNE='{"bossAtk":0.8}' node balance.js     # try zone.tune values without editing zones.js
ECON='{"forge":[0,40,70,110]}' node balance.js   # and run.js ECON values
```

It plays runs with three bots that differ only in how they choose:
- **smart:** picks the weapon whose estimated fit is best, judged from the traits shown before the fight (`weaponFit` in `rules.js`). It takes the best loot, valuing a second weapon type above a rarity tier. At shops and the merchant it heals when low, buys real upgrades and forges with what's left; it visits the merchant when low or carrying 70+ gold, and spends everything before the boss.
- **randomWeapon:** the same, but holds a random one of its two weapons each fight.
- **random:** every choice is random, including what it buys and forges.

All three take random routes. Current numbers (500 runs each):

| | zone clear | avg row reached | gold earned | spent | left at the end |
|---|---|---|---|---|---|
| smart | 52% | 9.3 | 162 | 111 | 51 |
| randomWeapon | 25% | 7.7 | 123 | 76 | 48 |
| random | 4% | 6.4 | 102 | 40 | 62 |

Smart is about 12x random. The smart bot spends about two thirds of what it earns; a run that clears earns about 205 and finishes with about 50, mostly the boss fight's pay. HP on arriving at each row stays at 81–88% all the way down, with no trough after the elites. The best weapon still differs between encounters, but no elite or boss is a wall for any weapon: with the matrix's stand-in kit the worst weapon wins 32–37% against Lirilì Larilà (Uzi, Sword, Guitar) and 35% against Bombardiro (Bazooka), while the right one wins 100% with most of its HP left. Tralalero is the hardest fight in the run (smart bot 77%, against 83–87% for the elites; the worst weapons 67–72%). `--matrix` prints every weapon against every group, elite and the boss; every weapon is best somewhere. `--deaths` adds deaths by row, HP going into each row, and the fights that end runs.
