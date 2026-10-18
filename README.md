# Auto-Boss

A run-based auto-battler in an 80s-arcade style, against pixel-art brainrot enemies. The fights play themselves. Every decision between them is yours: the route, the weapon, the targeting, the loot, the events. A run is won or lost by those choices.

## How a run works

1. **Pick a weapon**, one of three at random. You carry two weapons, one armour and two trinkets.
2. **Route through the map.** Brainrot Beach is 11 rows of branching, crossing paths. You see every node's type ahead of time, and elite nodes show which elite waits there.
   - **Fight:** a group of minions.
   - **Elite:** a hard fight with better loot.
   - **Shop:** items, a heal, rerolls.
   - **Rest:** heal *or* upgrade one item's rarity.
   - **Treasure:** pick one of three items.
   - **Event:** a short story with choices that trade HP, gold or items.
   - **Boss:** Tralalero Tralala.
3. **Before each fight** you see every enemy's traits, weaknesses, resistances and moves. Choose which weapon to hold and how to target (front, lowest HP or biggest threat), then press FIGHT and watch.
4. **After a win**, pick one of three items or take the gold. HP carries over between fights; a win gives back a little. Die and the run is over. Beat the boss and the zone is cleared.

Every run has a seed, shown on the map and the summary. The same seed gives the same map, encounters, offers and fights. Type a seed on the title screen to replay one. The run is saved after every decision, so a refresh resumes it; a refresh mid-fight goes back to the pre-fight screen.

### Why the weapon matters

| Weapon | Damage | Shape | Good against | Bad against |
|---|---|---|---|---|
| Sword | slash | cleave | unarmoured groups (coconuts) | armour, flyers |
| Boxing Gloves | blunt | fast single; 3 hits cancel a wind-up | crabs, dodgers, wind-ups | flyers, big HP pools |
| Uzi | pierce | very fast single, hard to dodge | flyers and dodgers (seagulls, Bombardiro) | armour eats every bullet |
| Magic Wand | magic | slow single, ignores armour | armour and shields (Lirilì Larilà) | swarms, dodgers |
| Electric Guitar | sonic | hits everyone, heals you | swarms, shields (jellyfish, Tralalero's adds) | single high-HP targets |
| Bazooka | explosive | huge single + splash | armoured groups (crabs) | flyers, dodgers |

**Enemy traits:**
- **Armoured:** blocks a flat amount per hit.
- **Evasive:** dodges, and slow weapons suffer most.
- **Flying:** halves slash and blunt damage, and rockets miss.
- **Shielded:** absorbs damage first; magic and sonic hit shields twice as hard.
- **Regenerates:** heals over time.
- **Summoner:** calls in adds.

Elites and the boss also have move sets: telegraphed slams, volleys, summons, shields, self-heals and dodge stances. Tralalero has a second phase at 50% HP, with a shield, adds and more damage.

### Loot

- **Rarities:** Common, Uncommon, Rare, Epic and Legendary. Higher rarity scales the base and adds affixes that hook into combat: damage against flying, armoured, shielded, evasive or groups, armour pierce, an extra cleave target, starting shields, lifesteal, thorns and more.
- **Legendaries:** each always costs you something. For example, "every attack hits all enemies, but you take 30% more damage".

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
| `run.js` | Map generation, node logic and the run state machine. No DOM |
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
```

It plays runs with three bots that differ only in how they choose:
- **smart:** picks the weapon whose estimated fit is best, judged from the traits shown before the fight (`weaponFit` in `rules.js`). It takes the best loot, valuing a second weapon type above a rarity tier, and rests or shops sensibly.
- **randomWeapon:** the same, but holds a random one of its two weapons each fight.
- **random:** every choice is random.

All three take random routes. Current numbers (500 runs each):

| | zone clear | avg row reached |
|---|---|---|
| smart | 48% | 9.1 |
| randomWeapon | 22% | 7.5 |
| random | 5% | 6.7 |

The best weapon differs between encounters. In real runs, the random-weapon bot's win rate against Lirilì Larilà is 100% with the Wand and 81% with the Bazooka, but 4–7% with the Uzi, Sword or Guitar. `--matrix` prints every weapon against every group, elite and the boss; each elite and the boss has a different best weapon, and every weapon is best somewhere.
