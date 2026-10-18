# Auto-Boss

A run-based auto-battler in an 80s-arcade style, against pixel-art brainrot enemies. The fights play themselves. Every decision between them is yours: the route, the weapon, the targeting, the loot, the events. A run is won or lost by those choices.

## How a run works

1. **Pick a class**, then **a weapon** (one of three at random). You carry two weapons (three as a Roadie), four armour pieces (head, body, legs, feet) and two trinkets. Any class can use any weapon.
2. **Route through the map.** Brainrot Beach is 11 rows of branching, crossing paths. You see every node's type ahead of time, and elite nodes show which elite waits there.
   - **Fight:** a group of minions.
   - **Elite:** a hard fight with better loot.
   - **Shop:** the premium stop. Rarer stock, a bigger and cheaper heal, rerolls, the forge, card upgrades, selling, and always a weapon of a type you don't carry.
   - **Rest:** heal.
   - **Treasure:** pick one of three items.
   - **Event:** a short story with choices that trade HP, gold or items.
   - **Boss:** Tralalero Tralala.
3. **Before each fight** you see every enemy's traits, weaknesses, resistances and moves, and what each of your cards will do in this fight. Choose which weapon to hold; the bar right under the arena holds the targeting choice (front, lowest HP or biggest threat), your HP and the FIGHT! button. Then watch.
4. **After a win** you get gold, then pick one of three items (sometimes one is a card) or skip them for bonus gold. HP carries over between fights; a win gives back a little. Die and the run is over. Beat the boss and the zone is cleared.
5. **The merchant** is a button on the map: open it any time between stops. Its small stock (common and uncommon items and a potion) changes every row. It costs more than a shop, and its forge and card upgrades cost more too. You can sell there as well.

Every run has a seed, shown on the map and the summary. The same seed gives the same map, encounters, offers and fights. Type a seed on the title screen to replay one. The run is saved after every decision, so a refresh resumes it; a refresh mid-fight goes back to the pre-fight screen.

### Classes

| Class | Stats | Passive | Economy |
|---|---|---|---|
| Bruiser | +10 max HP, +0.3 armour, −10% attack speed | heals 2% of max HP more after each win | heals at shops and the merchant cost 30% less |
| Hustler | −6 max HP | 10% interest on unspent gold every row (up to 10) | merchant prices 25% lower; sells items and cards for double |
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
- **Offers never repeat themselves.** No reward, chest, shop, reroll or merchant list holds two items with the same base, a card you already hold, or a copy (same base and rarity) of something you carry.

**Armour** comes in four parts, each with its own bases and its own leaning. A piece is small: values on armour are scaled down (`ARMOUR_SCALE`), so a full four-piece set is worth about what one armour piece plus a little used to be. Every slot fills from the same loot, so a part you haven't covered is an easy pick-up.

| Part | Bases | Leans towards | Legendary |
|---|---|---|---|
| Head | Snorkel Helmet, Sun Bucket Hat, Mirror Shades | crit, dodge | *Bloodpact Bandana*: 20% lifesteal, but resting can't heal you |
| Body | Beach Towel Cape, Lifeguard Vest, Sandcastle Plate | max HP, armour | *Sandcastle Fortress*: +3 armour and +15 max HP, but −20% attack speed |
| Legs | Board Shorts, Wetsuit Leggings, Sandbag Kneepads | attack speed | *Featherweight Speedo*: +20% dodge, but your other armour pieces give no armour |
| Feet | Flip-Flops, Urchin Sandals, Swim Fins | dodge, thorns | *Hot Sand Sprinters*: +25% attack speed, but you take 15% more damage |

Loot rolls a weapon 30% of the time, armour 36% (a random part) and a trinket 34% (`SLOT_WEIGHTS` in `items.js`), so weapons stay as common as before.

### Cards

Cards sit on a **card board** beside your gear and change how the auto-fight plays. The board starts with 3 slots and gains one for every elite you beat, up to 6. A full board means swapping: the card you replace is sold for a little gold (4 to 25 by rarity). You can only hold one copy of a card.

| Type | What it does | Example |
|---|---|---|
| Boost | a straight stat gain | *Tung Tung Tempo*: +10% damage |
| Pact | a big upside with a drawback you can plan around | *Gelato Brain Freeze*: +40% attack speed, but you start attacking 2.5s late |
| Trigger | whenever X, do Y: on hit, crit, kill, taking damage, dropping below an HP line, every N seconds, at the start of the fight, when an ally dies | *Coconut Insurance*: the first time you drop below 25% HP, gain a shield |
| Summon | allies that fight beside you with their own HP, damage type and sprite. Enemies' basic attacks can hit them | *Crab Intern*: a tough crab that draws fire |
| Multiplier | makes other cards better | *Echo Pedal*: your Trigger cards fire twice |

Every card has one or two **tags** (Gull, Tide, Spark, Gold, Brainrot, Concrete). Some cards scale with how many of a tag you own, and three cards sharing a tag switch on that tag's **set bonus** (for example, Gull: one more Union Gull joins every fight). There are 97 cards in the same five rarities as items, and every Legendary card has a drawback. Each class has two signature cards that only turn up for it (for example, the Hustler's *Insider Trading*: more damage the more gold you carry). Card damage and summons grow a little with the row you're on.

**Card upgrades.** At a shop or the merchant you can upgrade each card once, for a ★ (25 to 120 gold by rarity; the merchant charges 30% more). A ★ card's numbers go up by half: stats, zaps, heals and shields, buffs, multipliers, and the HP and damage of its summons. Drawbacks stay as they are. The ★ shows on the card board, in fight previews and on the summary.

Cards turn up as one of the three offers after some fights (30%, elites 50%), in chests (50%), from the *Tung Tung Tarot* event, at the merchant (one common card) and at map shops (one uncommon-or-better card). In the arena, triggers flash their card's name under your HP bar, zaps draw a bolt in their damage type, and allies stand in front of you with their own HP bars.

### Gold

Every won fight pays gold on top of the item pick: 15–25 from a fight and 45–60 from an elite, plus a small bonus if you won without dropping below half HP. Skipping the item pays 60% of the fight's gold again. Treasure chests and some event choices pay a little too. The `gold` stat (the treasure map, the "of Tourists" affix) scales all of it.

| Where | What it sells | Prices |
|---|---|---|
| Merchant (map button, new stock every row) | 3 common or uncommon items, a 25% potion, the forge | items ×1.25, potion 30, forge ×1.3 |
| Map shop | a weapon you don't carry, armour, a trinket, one more; rarer than the merchant. A 45% heal, rerolls, the forge | items 40 / 70 / 110 / 170 / 260 by rarity, heal 20, reroll 15 (+10 each) |
| Forge (shop or merchant) | raise an item one rarity, up to Legendary | 45 to Uncommon, 80 to Rare, 130 to Epic, 220 to Legendary (merchant ×1.3) |
| Card ★ (shop or merchant) | upgrade a card once | 25 / 40 / 60 / 85 / 120 by rarity (merchant ×1.3) |
| Selling (shop or merchant, any class) | any item or card you carry (you keep at least one weapon) | 40% of its buy price, plus 40% of what you paid to forge or ★ it; the Hustler gets double |

**The forge keeps what you have.** It never rerolls an item: the base and every affix stay, each affix grows into the new rarity's range (the item remembers each affix's roll), and one new affix is added. The last step, Epic to Legendary, adds a legendary effect that fits the slot (for armour, its part) together with its drawback, and drops any affix the legendary rules out.

Rest is heal-only: the forge took over upgrades. (With Rest also upgrading, the smart bot cleared about 4 points more often, so it lost the option.) All of these numbers are the `ECON` table in `run.js`.

## Your profile, the bank and cosmetics

The game keeps a **lifetime profile** in its own browser-storage key, apart from the run save, so a change to the run save never touches it. It records:
- runs, clears, abandoned runs and the deepest row you reached;
- kills per enemy, and the elites and bosses you've beaten;
- what ended each run;
- lifetime gold;
- how often you used each weapon, class and card.

**STATS** on the title screen shows all of it.

**The bank.** When a run ends (or you leave it for a new one), the bank receives 50% of everything that run earned, spent or not (`ECON.bankShare` in `run.js`). Lifetime gold only ever goes up.

**Cosmetics.** **COSMETICS SHOP** on the title screen spends bank gold on looks that stay owned across runs: hero outfits, weapon skins (the weapon and its shots), hit effects and shot trails, arena themes (stage colours over the zone's own), map styles and victory banners. They are only visual and never change a fight. The catalogue is `COSMETICS` in `profile.js`.

**Save code.** The stats screen shows your whole profile as a text code (`AB1.` …) to copy into another browser, and loads one back. A checksum refuses a mistyped or cut-short code. Loading asks first and keeps the replaced profile under a backup key. An unreadable profile is never thrown away either: it's kept aside the same way, and older profiles are migrated forward (`migrateProfile`).

## Play

Open `index.html` in a browser, or serve the folder:

```bash
npm run serve        # http://localhost:8080
```

`index.html#debug` opens the fight lab: any enemies against any weapon, any cards and an optional gear set (four armour pieces and two trinkets of one rarity), with a quick simulated win-rate table.

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
| `profile.js` | The lifetime profile (stats, bank, cosmetics owned and equipped), the cosmetics catalogue and save codes. No DOM; `ui.js` stores it |
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
node balance.js [runs] [--matrix] [--deaths] [--cards[=id,id]] [--ench] [--class=<id>] [--classes] [--roadie=slot|swap] [--hustler=sell2|nomarkup] [--hero]
TUNE='{"bossAtk":0.8}' node balance.js     # try zone.tune values without editing zones.js
ECON='{"forge":[0,40,70,110]}' node balance.js   # and run.js ECON values
```

It plays runs with three bots that differ only in how they choose:
- **smart:** picks the weapon whose estimated fit is best, judged from the traits shown before the fight (`weaponFit` in `rules.js`), with a nudge towards a weapon an enchantment's counter names. It takes the best loot, valuing a second weapon type above a rarity tier. At shops and the merchant it heals when low, buys real upgrades, upgrades its best card (★) when that costs no more than the next forge, and otherwise forges: the held weapon first, then the other weapons and trinkets, then armour pieces. It sells its weakest spare to afford a real upgrade. It visits the merchant when low or carrying 70+ gold, and spends everything before the boss.
- **randomWeapon:** the same, but holds a random one of its two weapons each fight.
- **random:** every choice is random, including what it buys and forges.

The smart bots value a card by rarity, a little extra for summons and triggers, and synergy: cards that share a tag with the board, most of all one that completes a set, and multipliers only when there's something to multiply. When the board is full they swap out the weakest card if the new one is worth more.

All three take random routes. Without `--class` the runs cycle through the four classes by seed; `--class=bruiser` (or `hustler`, `roadie`, `glass`) plays only that class, and `--classes` adds a per-class table.

### Where things stand (500 runs per bot)

| bot | zone clear | avg row reached | gold earned | spent | left at the end |
|---|---|---|---|---|---|
| smart | 44% | 9.3 | 180 | 146 | 34 |
| randomWeapon | 18% | 7.6 | 135 | 98 | 37 |
| random | 2% | 6.6 | 109 | 42 | 67 |

Smart is 24x random and 2.4x the random-weapon bot.

- **Four armour parts made the hero weaker, and the zone softer to match.** Four small pieces spread every loot pick thinner than one big armour slot did: going into the boss the smart bot wears 1.5 pieces on average, with less shield and damage than before. Enemy damage came down to keep the clear rate where it was (`zone.tune`: minions 0.74 to 0.65, elites 0.65 to 0.62, the boss 0.75 to 0.68).
- **The boss is still the hardest fight** (smart bot 68%, against 78% and 79% for the elites) and the top cause of death.
- **No HP trough.** HP on arriving at each row stays at 80–91% all the way down.
- **Gold matters more.** With selling, ★ upgrades and the forge running to Legendary there's more to spend on: the smart bot earns about 180 and spends about 145.

By class (`--classes`):

| class | smart | randomWeapon | random | smart elite / boss win | gold earned |
|---|---|---|---|---|---|
| Bruiser | 47% | 24% | 3% | 77% / 70% | 167 |
| Hustler | 45% | 21% | 2% | 77% / 74% | 224 |
| Roadie | 44% | 15% | 2% | 83% / 67% | 168 |
| Glass Cannon | 43% | 20% | 3% | 79% / 71% | 158 |

Now that every class can sell, the Hustler needed a new perk. It sells for double (`CLASS_VARIANT.hustler = 'sell2'`). The other candidate, paying no merchant markup (`--hustler=nomarkup`), put it at 48%, level with the Bruiser at the top; selling for double puts it at 45%, in the middle of a 43–47% spread.

The card and enchantment measurements below are from Phase 6 and haven't been re-run.

**Cards** (`--cards`, 97 cards: 23 boosts, 16 pacts, 33 triggers, 12 summons, 13 multipliers; 20 common, 29 uncommon, 30 rare, 12 epic, 6 legendary, 8 of them class signatures). The table shows, per card: how often it's taken when offered, how many runs held it and how they did, and two ablations on the same seeds. *Forced* starts every run with the card on the board and never drops it. That's a free extra card from the first fight, so the median card lifts the clear rate by about 7 points; what matters is how far a card sits above that. *Pool* compares the game with the card against the game with it banned. The top card (Crab Union Local 9, +16 forced) sits about 8 points above the median card, and no card moves the clear rate by more than 2 points through being in the pool. By type, the average forced lift is summons +9, boosts +8, pacts +8, triggers +7, multipliers +6.

**Enchantments** (`--ench`). For the smart bot, elites are 80% unenchanted and 78% enchanted, the boss 74% and 74%. On the paired fights (the same fight, hero and seed with the enchantments taken off) they cost 4 points against elites and 6 against the boss. Playing every enchantment on every elite and the boss with every weapon at the stand-in kit, a weapon the counter names loses 3 win points to an enchantment and any other weapon 14.

`--hero` prints the smart bot's average hero (max HP, armour, dodge, damage, armour pieces worn) going into the boss. `--matrix` prints every weapon against every group, elite and the boss. `--deaths` adds deaths by row, HP on arriving at each row and going into fights, and the fights that end runs.
