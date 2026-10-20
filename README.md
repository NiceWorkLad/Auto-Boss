# Auto-Boss

A run-based auto-battler in an 80s-arcade style, against pixel-art brainrot enemies. The fights play themselves. Every decision between them is yours: the route, the weapon, the targeting, the loot, the events. A run is won or lost by those choices.

## How a run works

1. **Pick a class.** Each class is a starting kit: a set weapon, a piece of armour or a trinket, and a card. There are eleven weapons (seven from the start, four more from act 2). You carry three, four armour pieces (head, body, legs, feet) and two trinkets (three as a Roadie). Any class can use any weapon.
2. **Route through the map.** Each act is a zone of 11 rows of branching, crossing paths: act 1 is Brainrot Beach, act 2 the Giungla Fusilli, act 3 the Deserto Dolce and act 4 the Ghiacciaio Gelato. You see every node's type ahead of time, and elite nodes show which elite waits there. The paths out of where you stand glow, the rest of what you can still reach stays solid, and stops you can no longer reach are dimmed. Hover a stop (on a phone, tap it; tap a glowing stop again to go) to trace every path forward from it.
   - **Fight:** a group of minions.
   - **Elite:** a hard fight with better loot.
   - **Shop:** the premium stop, in four tabs. **BUY**: six items (always a weapon of a type you don't carry), two cards (one of them one-use), two tonics and a hire. **FORGE & TUNE**: the forge, and weapon tuning. **CARDS**: ★ upgrades and paying off curses. **SELL**. Plus a bigger, cheaper heal and rerolls. Each tab shows how many things in it you can afford.
   - **Rest:** heal.
   - **Treasure:** pick one of three items.
   - **Event:** a short story with choices that trade HP, gold or items, and sometimes hand over an event-only card or a cursed card for power.
   - **Gamble:** Pavone Pokerino's parlour (rows 3 to 9). Every game shows its odds; see *Chance* below.
   - **Boss:** each zone has its own (see *The cast*).
3. **Before each fight** you see every enemy's traits, weaknesses, resistances and moves, and what each of your cards will do in this fight. Choose which weapon to hold; the bar right under the arena holds the targeting choice (First, Weakest or Biggest Threat), your HP and the FIGHT! button. Then watch. Max HP depends on the held weapon, so swapping weapons keeps your HP share: 65/65 becomes 100/100 and back. A boss fight has a big bar across the top of the arena with the boss's name and a mark at each phase change.
4. **After a win** you get gold, then pick one of three items or skip them for bonus gold, then draw a card (one of three, or pass). HP carries over between fights; a win gives back a little. Die and the run is over. Beat a zone's boss and the act is cleared.
5. **The merchant** is a button on the map: open it any time between stops. Its small stock (common and uncommon items, a card, a tonic and a potion) changes every row. It costs more than a shop, and its forge, tuning and card upgrades cost more too. It has the same tabs as a shop, and you can sell there as well.

6. **Acts.** Beating a zone's boss doesn't end the run: you carry everything (HP, items, cards, gold) on into the next zone.
   - **Before you set off:** you catch your breath (+30% HP).
   - **Card slots:** the cap rises by 2 per act, and one slot opens on arrival.
   - **Forge:** stops at Epic in act 1 and reaches Legendary from act 2. Its prices, tuning, tonics and hires cost more each act (×1.25 in act 2, up by about 0.2 an act after that).
   - **Loot and gold:** from act 2 loot rolls on rarer tables, and again from act 5. Fights pay 40% more gold in act 2, and about 25% more each act after that. Act 2's shops always stock one of its new weapons you don't carry.
   - **First reward:** the first win of act 2 always offers one.

   Clear every act to win. The act numbers are in `ECON` (`actGold`, `forgeCap`, `actForge`, `actCardSlots`, `actHeal`); each list's last entry holds for later acts.
7. **Overtime (optional).** Beating the last zone's boss wins the run, and then you choose: **take the win** and the run ends, or go into **Overtime** and keep playing with everything you carry. Either way it counts as a clear.
   - **The zones loop.** The beach comes round again, then the jungle, and so on, each with a fresh map from the run's seed.
   - **Every act is harder.** Every zone comes back at least as strong as the last zone (`otFloor()` in `zones.js` works it out from each zone's minions, elites and boss). On top of that, every Overtime act gives enemies +50% HP and +35% damage, makes enchantments 50% more likely and pays 20% more gold (`ECON.overtime`). Every lap round the zones adds a card slot.
   - **There's no end.** The run ends when you fall, and the profile keeps your best Overtime depth (rows past the last boss).

Every run has a seed, shown on the map and the summary. The same seed gives the same map, encounters, offers and fights. Type a seed on the title screen to replay one. The run is saved after every decision, so a refresh resumes it; a refresh mid-fight goes back to the pre-fight screen. **MENU** (top right during a run) goes back to the title screen, and **CONTINUE RUN** picks the run up again. It's off from FIGHT! until the result is in.

### The cast

Everyone you meet is an original character: an animal crossed with an object, with a sing-song, pseudo-Italian name. All of them are drawn in code (`sprites.js`).

- **Minions:**
  - **Granchio Cementino:** a crab that walked through wet concrete.
  - **Gabbiano Granatino:** an armed seagull with a grenade.
  - **Medusa Elettrica:** a 240-volt jellyfish in a bubble.
  - **Cocco Ruzzolone:** a coconut in sunglasses that rolls out of reach and heals.
- **Elites:**
  - **Pellicano Cannolino:** a pelican pilot whose beak is a giant cannoli. It flies, dodges, fires volleys and calls in gulls.
  - **Tartaruga Lasagnona:** a tortoise with a seven-layer lasagna for a shell. It's armoured and slams, and it reheats itself in the sun.
- **Boss: Polpo Pianissimo.** An octopus grown into an upright piano. Its signature moves: *Key Cascade* (a volley of notes), *Lid Slam*, and *Ink Cloud*, which makes half your attacks miss for 3 seconds. At half HP it goes *FORTISSIMO*: a shield, adds and more damage, with its lid propped open, angry brows and red keys.
- **The beach:**
  - **Tricheco Gelatino:** a walrus with cone tusks. He sells gelato and runs the shop.
  - **Fenicottera Fettuccina:** a flamingo on fettuccine legs who holds auditions.
  - **Bananito Bancario:** a banana banker.
  - **Nonna Seppia:** a cuttlefish who reads tarot.
  - **Pavone Pokerino:** a peacock whose tail is a fan of playing cards. He runs the gamble node, deals on the beach and flips coins at the merchant.

Every event has its own fixed pixel-art scene above its text (`EVENT_SCENES` in `sprites.js`).

Old profiles keep their tallies through the rename: `migrateProfile` moves kills, wins, card use and causes of death to the new ids and names.

**Act 2, the Giungla Fusilli**, where everything grows back:
- **Minions:**
  - **Fungo Funghettino:** a regenerating polka-dot mushroom.
  - **Rana Rigatona:** a frog on rigatoni legs that winds up a leap.
  - **Scimmietta Spumoni:** a monkey in three flavours that throws from the back row.
  - **Pappagallo Pennetta:** a flying parrot with a pen-nib beak.
- **Elites:**
  - **Gorilla Gnocchino:** gnocchi, armour and huge wind-up punches.
  - **Bradipo Burrata:** a sloth on a vine with a burrata belly. It heals, shields and regenerates.
  - **Camaleonte Cannellone:** dodges, changes colour and calls in monkeys.
- **Boss: Tucano Tortellone.** A toucan whose beak is a giant tortellino. Its signature moves: *Seed Spray* (a volley), *Beak Bash*, and *Tortellino Dive*, which crashes through you and every ally. Three phases:
  1. It flies and fires volleys.
  2. From 60% HP it retreats to the canopy (the back row) behind summoned frogs and monkeys, with bark armour.
  3. At 25% it comes down, regrows (golden) and hits harder.
- **The jungle's events:** a capybara captain, the Shrine of the Golden Gnocco, the Parrot Notary, the Mystery Crates and the Sloth Spa.

**Act 3, the Deserto Dolce**, sugar dunes and pastry pyramids:
- **Minions:**
  - **Scorpione Spaghettone:** an armoured scorpion with a spaghetti tail that winds up a sting.
  - **Cactus Caciotta:** a cactus in a cheese-wheel hat. It regrows, and pricks you for every hit you land.
  - **Cammello Cannolo:** a sturdy camel with cannoli humps that sips from one to heal.
  - **Avvoltoio Arancino:** a flying, dodging vulture with a fried rice-ball body.
- **Elites:**
  - **Scarabeo Scamorza:** a scarab behind a giant smoked scamorza. It's heavily armoured and shields itself; below 40% the cheese rolls away and it gets angry.
  - **Serpente Sedanino:** a dodging snake of sedanini tubes with volleys and *Venom*, a bite that slows your attacks by 40% for 3 seconds.
- **Boss: Faraone Farfallone.** A pharaoh bandaged in farfalle, in front of a golden sarcophagus. Its signature moves: *Scarab Swarm* (a volley), *Sarcophagus Slam*, and *Bowtie Curse*, which wraps you in bandages and halves your attack speed for 4 seconds. At 60% scorpions rise from the sand; at 30% it hits harder and adds *Sandstorm*, a sand-coloured blind. The tomb has torches, and the sand blows harder each phase.
- **The desert's events:** the Orzata Oasis, the Riddle of the Sfinge, the Spice Caravan (buy a chilli tonic, or raid the SECRET sack) and a Mirage.
- **Enchantments:** *Mirage* (+15% dodge, but sonic ×1.3), *Scorpion Nest* (two scorpions at the start), and the beach's *Sunburn*.

**Act 4, the Ghiacciaio Gelato**, a glacier of gelato under the aurora:
- **Minions:**
  - **Pinguino Pizzicotto:** a penguin in a pizza chef's hat. Weak but very fast; it belly-slides in to pinch.
  - **Foca Focaccia:** a seal under an armour of rosemary focaccia.
  - **Pupazzo Panettone:** a snowman of three panettoni that throws snowballs from the back row and regrows.
  - **Gufo Grissino:** a flying, dodging owl on breadstick legs.
- **Elites:**
  - **Orso Ossobuco:** a polar bear with a marrow-bone helmet. Huge slams, a snowy ground-shaking quake, and it rages below 40%.
  - **Yeti Ricottino:** a ricotta yeti that builds snowman allies, heals and regenerates.
- **Boss: Mammut Mascarpone.** A woolly mammoth in a mascarpone coat with ice-cream-cone tusks. Its signature moves: *Snowball Barrage*, *Tusk Toss*, and *Avalanche*, which hits you and every ally and leaves you slowed. At 50% it gets *BRAIN FREEZE*: an ice shield, penguin adds and *Frost Breath* (a slow). Icicles hang over the arena, and the snow thickens into a blizzard.
- **The glacier's events:** the Hot Chocolate Spring, Ice Fishing with three penguins, an adventurer Frozen in the Ice, and Tea with a teenage Yeti (an espresso tonic).
- **Enchantments:** *Permafrost* (+4 armour, but fire ×1.4) and *Penguin Parade* (three penguins at the start).

Two new kinds of boss move arrived with them (`rules.js`): a **slow** (`kind: 'slow'`: your attack speed drops for a few seconds, drawn as bandages, venom or frost on the hero) and a **quake** (`kind: 'quake'`: hits you and every ally, optionally slowing you). An Ink Cloud can take a `tint` (the Sandstorm is sand-coloured). Events can hand out a tonic (`effects: { tonic: 'chili' }`). Every move, named or not, is described on the pre-fight screen.

### Classes

| Class | Stats | Passive | Economy | Starting kit | Unlock |
|---|---|---|---|---|---|
| Bruiser | +10 max HP, +9 armour, −5% attack speed | heals 2% of max HP more after each win | heals at shops and the merchant cost 30% less | Boxing Gloves, Lifeguard Vest, *Crab Gym Membership* | — |
| Hustler | −6 max HP | 10% interest on unspent gold every row (up to 10) | merchant prices 25% lower; sells items and cards for double | Uzi, Party Visor, *Bounty Hunter* | — |
| Roadie | base | a third trinket slot | shops and the merchant are 10% cheaper (items, tonics, hires, the forge, tuning, ★) | Electric Guitar, Roller Skates, Pocket Espresso, *Jelly Roadie* | — |
| Glass Cannon | −25 max HP | +10% crit chance, +0.6× crit damage | starts with a 4th card slot | Magic Wand, Sun Bucket Hat, *Big Sunglasses* | — |
| Ninja | −5 max HP, +6% dodge, +8% attack speed | — | — | Ninja Stars, Flip-Flops, *Crit Confetti* | defeat 150 enemies |
| Conductor | base | summons get double HP and damage | — | Sword, Beach Whistle, *Crab Intern*, *Seagull Union Rep* | beat Polpo Pianissimo |
| Deprived | −10 max HP | none; only 2 card slots | the bank gets 50% more from the run | a random weapon and nothing else | clear a run |

Kits are Common items with no affixes (`kit` on each class in `CLASSES`). Classes you haven't unlocked show on the class screen with what it takes and how far you are (`classProgress` in `profile.js`, from the lifetime profile). Deprived is for hard runs: the smart bot clears 4% with it, so the balance reports leave it out of the headline numbers (it's still in `--classes`).

Kits make the start stronger, so enemies are ×1.065 on the beach and ×1.03 in the jungle (`zone.tune`), which keeps the smart bot at about 43% and 15%.

Classes are data (`CLASSES` in `items.js`): their stats go through `compileHero`, and the run logic reads the rest. Every class carries three weapons, so the Roadie's old third weapon slot became a third trinket slot and cheaper shops. (Four trinkets measured 29% full clears against 24–26% for the others, so it got one; its old alternative, an automatic mid-fight swap, is gone with the slot.) The Bruiser's drawback is −5% attack speed: at −10% it trailed the other classes by 5 points.

### Why the weapon matters

| Weapon | Damage | Shape | Good against | Bad against |
|---|---|---|---|---|
| Sword | slash | **focuses one enemy**: it stays on its target until it falls, and every hit on it cuts 15% deeper, up to +60% (brackets close in around it). Cuts halve healing for 4s and crack armour a little | big single targets, healers (the tortoise) | groups, flyers |
| Boxing Gloves | blunt | fast single; **each hit has a 10% chance to stun** for 1.2s (half on bosses, then 2.5s immune), and 3 hits cancel a wind-up | crabs, dodgers, wind-ups | flyers, big HP pools |
| Uzi | pierce | very fast single, hard to dodge; every bullet wears armour down | flyers and dodgers (seagulls, Pellicano Cannolino) | armour eats most of each bullet |
| Magic Wand | magic | slow single, ignores armour; **sometimes casts a spell**: a toad for 3s (can't act), a shrink (half damage for 5s) or a chain bolt. The chance falls with the target's HP and halves on bosses (about 14% of hits on minions, 3% on a boss) | armour and shields (Tartaruga Lasagnona) | swarms, dodgers |
| Electric Guitar | sonic | hits everyone, heals you; rattles big enemies through most of their armour and their healing | swarms, shields (jellyfish, Pianissimo's adds) | single high-HP targets |
| Bazooka | explosive | **slow, but every rocket hits the whole enemy line** for full damage; a rocket that misses a flyer still clips it for half | groups, armoured groups above all (crabs) | flyers, single big targets |
| Ninja Stars | slash | **fast throwing stars, and +12% dodge for you** while you hold them; hard to dodge, and they keep half of each hit through armour | groups of soft enemies (coconuts) | heavy armour, bosses |
| Flamethrower (act 2) | fire | a fast stream; the target burns for 3s, and the burn ignores armour and stops all healing | regeneration and heals (mushrooms, the sloth) | fire-resistant frogs and parrots, shields soak the burn |
| Freeze Ray (act 2) | cold | single; **every hit slows the target's attacks and moves 15% more, up to 45%** (frost crystals show the stacks), and a hit during a wind-up freezes the wind-up | wind-ups and leaps (the gorilla, frogs) | regeneration, the sloth resists cold |
| Boomerang (act 2) | slash | hits the target going out and the back row coming back; flyers can't dodge its arc | the back row and flyers (monkeys, the chameleon, the toucan) | armour |
| Sniper Rifle (act 2) | pierce | **one huge shot every 4 seconds** that can pick off anyone, back row included (a laser sight warns of the next shot); **+15% crit chance and +1× crit damage** while you hold it | the back row, single targets | swarms, dodgers between shots |

No weapon is a hard wall: each bad matchup has a small way through (wearing armour down, cutting off healing, near misses), so a wrong weapon makes an elite hard rather than hopeless.

**Enemy traits:**
- **Armoured:** blocks a flat amount per hit.
- **Evasive:** dodges, and slow weapons suffer most.
- **Flying:** halves slash and blunt damage, and rockets often miss (the blast still clips for half).
- **Shielded:** absorbs damage first; magic and sonic hit shields twice as hard.
- **Regenerates:** heals over time.
- **Summoner:** calls in adds.
- **Back row:** stays behind the others. Single-target weapons can't reach it while anything stands in front; the Boomerang, area and splash can.

Elites and the boss also have move sets: telegraphed slams, volleys, summons, shields, self-heals and dodge stances. Polpo Pianissimo has a second phase at 50% HP, with a shield, adds and more damage.

**Bosses feel like bosses.**
- **Set apart:** a boss is drawn 20% bigger than an elite, gets the big bar across the top, and its fight opens with a title card and a music sting. Each has its own arena: spotlights and drifting notes for Polpo (red and strobing once it goes FORTISSIMO), a canopy and falling leaves for Tucano (more in every phase, golden at the end).
- **Signature moves:** each boss move has a name. While it winds up, the name shows over the boss and a ring closes on you (the dive also marks its path along the sand). Interrupts and the Freeze Ray still work on them.
- **Big hits:** a boss slam shakes the arena and throws up an impact ring and debris; volleys fly at you as notes or seeds; Ink Cloud splats the screen.
- **Phase changes are a moment:** the fight stops for 1.2 seconds (`PHASE_PAUSE` in `rules.js`, for both sides), the arena darkens around a spotlight on the boss, it erupts, a banner and a sting play, and it keeps a new look and an aura from then on.

**Enchantments.** Elites and the boss sometimes carry one or two enchantment cards, more often deeper in the run (an elite on row 4 about 1 in 3, the boss about half the time). The map shows a badge on an enchanted node and lists the enchantments of the elites and boss you can reach next; the pre-fight screen shows each one with its counter. For example:

- *Pianissimo's Encore:* gets back up once at 25% HP. Magic damage burns the encore away.
- *Concrete Contract:* gains armour every 8 seconds. Blunt hits crack it.
- *Union Bodyguard:* a crab stands in front, and while it stands the elite takes 40% less damage. Knock the crab out first.
- *Mirror Ball:* reflects a quarter of the magic damage it takes. Switch off the Wand.

There are 22: some generic, some only on the beach (seagull and crab escorts, the encore) and four for the jungle (*Overgrown*, *Canopy Cover*, *Frog Chorus*, *Humid*). They never touch your items or cards, never block shops or healing, never stop you attacking and never kill outright: reflected damage and Sunburn stop at 1 HP.

### Loot

- **Rarities:** Common, Uncommon, Rare, Epic and Legendary. Higher rarity scales the base and adds affixes that hook into combat: damage against flying, armoured, shielded, evasive or groups, armour pierce, a sword whose focus builds twice as fast, starting shields, lifesteal, thorns and more.
- **Legendaries:** each does something no other item can, and its drawback comes from the effect itself rather than a flat penalty. For example, *Chorus of Chaos*: every attack hits every enemy, but each one past the first takes 45%. See *Legendaries* below.
- **Offers never repeat themselves.** No reward, chest, shop, reroll or merchant list holds two items with the same base, a card you already hold, or a copy (same base and rarity) of something you carry.

**Armour** comes in four parts, each with its own bases and its own leaning. A piece is small: values on armour are scaled down (`ARMOUR_SCALE`), so a full four-piece set is worth about what one armour piece plus a little used to be. Every slot fills from the same loot, so a part you haven't covered is an easy pick-up.

**Armour is a shield.** Your armour (and every *Start fights with a shield* bonus) adds up to a shield bar on the end of your HP bar. It soaks damage before your HP and refills at the start of every fight. Item and card texts show armour as the shield HP it gives; inside, an armour point is worth `HERO_TUNE.armourShield` (30) HP of shield (`rules.js`), so the item data keeps its old numbers. With a card drawn after every fight, boards fill early and runs got much stronger (67% act 1 clears), so every enemy has more HP and hits harder than before the collection: ×1.14 on the beach and ×1.21 in the jungle (`zone.tune`), which puts the smart bot back at 42% and 15%. Bigger shops, more gold and three weapon slots for everyone (51% and 26%) took another ×1.05 and ×1.12, and the new weapon identities (44% and 17%) ×1.02 more in the jungle. A shield soaks a big hit whole, where flat armour shaved a little off every hit: wind-up hitters such as Gorilla Gnocchino got easier (69% → 82% for the smart bot), swarms of small hits a little harder.

**Percentage bonuses multiply.** Attack speed and damage bonuses from gear, cards, the class, legendaries and buffs all multiply: +10% twice is +21%, and −20% with +25% is exactly the speed you started with. Crit chance and dodge are chances, so they still add up.

**Stats and comparisons.** The **STATS** panel above the inventory shows max HP, shield, DPS (one target, crits included), damage per hit, attack speed, crit chance, crit damage and dodge: each as the weapon alone, plus what your gear, cards and class add. Every item on offer (rewards, chests, shops, the merchant and the replace screen) lists what taking it would change, in green and red: a weapon against the one you hold, armour against the piece it replaces, a trinket against an empty slot or else your lowest-rarity trinket.

| Part | Bases | Leans towards | Legendary |
|---|---|---|---|
| Head | Snorkel Helmet, Sun Bucket Hat, Mirror Shades, Party Visor; act 2: Tiki Mask | crit, dodge | *Bloodpact Bandana*, *Second Wind Snorkel*, *Eagle-Eye Shades* |
| Body | Beach Towel Cape, Lifeguard Vest, Sandcastle Plate, Rash Guard; act 2: Lasagna Breastplate | max HP, armour | *Sandcastle Fortress*, *Concrete Exosuit* |
| Legs | Board Shorts, Wetsuit Leggings, Sandbag Kneepads, Cargo Shorts; act 2: Gnocchi Greaves | attack speed | *Featherweight Speedo*, *Golden Gnocchi Belt* |
| Feet | Flip-Flops, Urchin Sandals, Swim Fins, Roller Skates; act 2: Wooden Clogs | dodge, thorns | *Hot Sand Sprinters*, *Phoenix Flip-Flops* |

The act 2 bases (`act: 2` in `ARMOURS`) only drop from act 2 on, so act 2 loot shows things act 1 never did. Trinkets: Lucky Seashell, Factor 50, Coconut Drink, Rubber Duck, Pocket Espresso, Seagull Feather, Soggy Treasure Map, three with a small trigger: the *Kazoo* (on kill, sonic damage to a random enemy), *Lucky Dice* (crit, and gold on each crit, up to 10 a fight) and the *Stopwatch* (your first attack in a fight comes at once and hits harder), and the *Shell Necklace* (shield and dodge), *Gelato Spoon* (lifesteal), *Beach Whistle* (your summons hit 20% harder) and, from act 2, the *Tide Watch* (regeneration that doubles below half HP). The Spoon and the Whistle are rarer drops (`weight` on a base).

**Niche affixes.** Seven affixes for particular builds: *of Snacking* (heal on each kill), *of the Ambush* (your first attack comes at once and hits harder), *of the Headliner* (damage against bosses), *of Management* (summon damage), *of Static* (card zap damage), *of Pickpockets* (gold on each kill, up to 10 a fight) and *of Riposte* (hit back when you dodge; on trinkets, legs and feet). They roll at about a third of the rate of the core affixes (`weight: 0.35`), so damage, speed, crit and HP stay the backbone of loot. With them in at full weight the smart bot fell from 42% to 36% act 1 clears: half its rolls became affixes it couldn't use. Even at a third the loot is a little thinner, so enemies are ×0.975 on the beach and ×0.965 in the jungle, which puts the smart bot back at 43% and 15%.

### Legendaries

| Legendary | Where | Effect | Drawback |
|---|---|---|---|
| Second Wind Snorkel | head | extra life: back up at 40% HP the first time you fall | it cracks back to Epic |
| Phoenix Flip-Flops | feet | extra life: rise at 50% HP in a blast of fire that hits every enemy | they burn away |
| Bloodpact Bandana | head | 10% lifesteal | resting can't heal you |
| Eagle-Eye Shades | head | your attacks can't miss | you lock on: no switching targets until yours falls |
| Sandcastle Fortress | body | +90 armour, +15 max HP | your shield starts each fight half full |
| Concrete Exosuit | body | a Concrete Crab bodyguard that draws most hits | −10% attack speed while it stands |
| Featherweight Speedo | legs | +20% dodge | your other armour pieces give no armour |
| Golden Gnocchi Belt | legs | +3% damage and attack speed per 20 gold carried (up to +30%) | −1% dodge for each |
| Hot Sand Sprinters | feet | +40% attack speed for the first 10 s of a fight | then only +10% |
| Jellyfish in a Jar | trinket | chain lightning: every hit arcs 55% to two more enemies | the arcs sting an ally too |
| Union Card | trinket | two upgraded Union Gulls join every fight | −10% gold |
| The Metronome | trinket | every 4th attack deals triple damage | the off-beats deal 15% less |
| Tidecaller's Shell | trinket | your shield refills to full every 8 s | it starts each fight half full |
| Chorus of Chaos | weapon or trinket | every attack hits every enemy | each one past the first takes 45% |
| Glass Cannon | weapon or trinket | +60% damage | each hit you take: −3% damage for the fight (up to −50%) |
| Slow Hands | weapon | every hit crits | a crit deals ×1.6, whatever your crit damage |
| Grandma's Rolling Pin | weapon | a kill knocks the body into the next enemy for half the overkill | enemies at full HP take 15% less |
| Excalibread | Sword | focus carries over to the next enemy and builds to +90% | a miss drops it to nothing |
| Pugilist's Bell | Boxing Gloves, Ninja Stars | 2 s stuns that bosses don't resist; the stars stun too | 5 s stun-proof after |
| Gelato Gatling | Uzi, Flamethrower | every 8th shot chills | it overheats: 1 s in every 7 it doesn't fire |
| Grand Toad Wand | Magic Wand | spells twice as often, 4 s toads | every spell is a toad |
| Hawk's Nest | Sniper Rifle, Boomerang | a shot that kills reloads twice as fast | one that doesn't reloads 20% slower |

A weapon legendary only rolls on its weapons (`bases` in `LEGENDARIES`). `node balance.js 400 --legendaries` starts the smart bot with each one and measures how far it moves the clear rate; after tuning, they sit within about ±10 points of the median legendary.

Loot rolls a weapon 30% of the time, armour 36% (a random part) and a trinket 34% (`SLOT_WEIGHTS` in `items.js`), so weapons stay as common as before.

### Cards

Cards change how the auto-fight plays. **You keep every card you find** (your collection) and **switch some on** before each fight: as many as you have card slots. You start with 3 slots and gain one for every elite you beat, up to 6. A card you get switches on by itself while a slot is free; after that, tap cards in the CARDS panel or on the pre-fight screen to switch them on and off (switching keeps your HP share, like a weapon swap). You can only hold one copy of a card.

**A draw after every won fight.** After the item pick you draw a card: one of three, or pass. Draws roll by rarity (`draw` and `eliteDraw` in `LOOT_TABLES`), and within a rarity the type decides the odds (`CARD_RULES.typeWeight`): boosts are the everyday card, pacts, summons and one-use cards less common, triggers and cursed cards rare.

| Type | What it does | Example |
|---|---|---|
| Boost | a straight stat gain | *Tamburello Tempo*: +10% damage |
| Pact | a big upside with a drawback you can plan around | *Gelato Brain Freeze*: +40% attack speed, but you start attacking 2.5s late |
| Trigger | whenever X, do Y: on hit, crit, kill, taking damage, dropping below an HP line, every N seconds, at the start of the fight, when an ally dies | *Coconut Insurance*: the first time you drop below 25% HP, gain a shield |
| Summon | allies that fight beside you with their own HP, damage type and sprite. Enemies' basic attacks can hit them | *Crab Intern*: a tough crab that draws fire |
| Multiplier | makes other cards better | *Echo Pedal*: your Trigger cards fire twice |
| One-use | spent from the collection between stops or before a fight, never switched on: buffs for the next fight, a heal, draw now, peek at your next draw (and reshuffle it once), throw a card back to draw from one rarity higher, lift a curse | *Tide Swap*: throw a card back to the sea and draw from cards one rarity higher |
| Cursed | a big upside and a curse that bites while the card is switched on. Some curses can be paid off at a shop or the merchant; some grow with every fight you've held the card. Holy Seawater lifts any curse | *Seagull Mafia Contract*: +45% attack speed, but you take 5% more damage, and 2% more for every fight you've held it |

Every card has one or two **tags** (Gull, Tide, Spark, Gold, Brainrot, Concrete). Some cards scale with how many of a tag you own, and three cards sharing a tag switch on that tag's **set bonus** (for example, Gull: one more Union Gull joins every fight). There are 116 cards (four of them from events only) in the same five rarities as items, and every Legendary card has a drawback. Each class has two signature cards that only turn up for it (for example, the Hustler's *Insider Trading*: more damage the more gold you carry). Card damage and summons grow a little with the row you're on.

**Card upgrades.** At a shop or the merchant you can upgrade each card once, for a ★ (25 to 120 gold by rarity; the merchant charges 30% more). A ★ card's numbers go up by half: stats, zaps, heals and shields, buffs, multipliers, and the HP and damage of its summons. Drawbacks stay as they are. The ★ shows on the card board, in fight previews and on the summary.

Cards come from the draw after every won fight, in chests (50%), from the *Tide Tarot* event, at the merchant (one common card) and at map shops (one uncommon-or-better card). In the arena, triggers flash their card's name under your HP bar, zaps draw a bolt in their damage type, and allies stand in front of you with their own HP bars.

### Chance

**The gamble node.** Pavone Pokerino's parlour turns up on rows 3 to 9. Every game shows its odds before you play (`ECON.gamble` in `run.js`):

| Game | Odds | Limit |
|---|---|---|
| Coin flip | bet 10, 25 or 50: 50% it comes back doubled | 3 flips a visit |
| Double or nothing | all your gold (at least 20): 50% doubled, 50% gone | once |
| Wager an item | it goes up a rarity for free, or Pavone keeps it: Common 70%, Uncommon 55%, Rare 40%, Epic 30% (only as far as the forge goes this act; never your only weapon) | once |
| Mystery box (35 gold) | 35% an item, 25% a card, 20% 60 gold, 15% a one-use card, 5% a Legendary item | once |
| Pavone's Ladder | climb for a bigger pot: 75% for 15, 65% for 35, 55% for 60, 45% for 100, 35% for 160. A slip loses the pot; cash out any time (leaving cashes out) | once |

The merchant has a GAMBLE tab too: one coin flip per row, for 10 or 25 gold.

**Events change runs.** Event gold is half as much again as before (the texts say the new amounts), and event items roll rarer. Some choices hand over cards you can't get anywhere else (`event: true` in `cards.js`): the shrine's *Golden Gnocco*, the tarot's *The Tower*, the notary's *Notarised Luck* and Pavone's *Pavone's Ace*. Others trade a curse for power: *Pavone's Deal* on the beach (a cursed card and 60 gold, or cut the deck for his Ace) and *The Mystery Crates* in the jungle (an 80% small crate, a 50% big crate with an Epic-or-better item, or the ticking crate: a cursed card and 30 gold). Choices with a coin flip say their odds.

### Gold

Every won fight pays gold on top of the item pick: 20–32 from a fight and 60–80 from an elite, plus a small bonus if you won without dropping below half HP. Skipping the item pays 60% of the fight's gold again. Treasure chests and some event choices pay a little too. The `gold` stat (the treasure map, the "of Tourists" affix) scales all of it.

| Where | What it sells | Prices |
|---|---|---|
| Merchant (map button, new stock every row) | 3 common or uncommon items, a common card, a tonic, a 25% potion, the forge and tuning | items ×1.25, potion 30, forge and tuning ×1.3 |
| Map shop | 6 items (the first a weapon you don't carry, then armour, a trinket and three more), 2 cards (one one-use), 2 tonics and a hire; rarer than the merchant. A 45% heal, rerolls, the forge and tuning | items 40 / 70 / 110 / 170 / 260 by rarity, heal 20, reroll 15 (+10 each) |
| Tonic (shop or merchant) | a stat for the rest of the run: +8 max HP, +5% attack speed, +5% damage, +3% crit, +3% dodge or a 12 HP shield every fight (`TONICS` in `run.js`) | 35–45, ×1.25 in act 2 |
| Hire (shop) | an ally from the card summons who fights beside you for your next 3 fights (`HIRES`) | 30 (a gull) to 65 (Polpettino), ×1.25 in act 2 |
| Tuning (shop or merchant) | one more level of +8% damage, +6% attack speed or +4% crit for a weapon, up to five each; it stays through the forge | 30 / 45 / 65 / 90 / 120 per level, ×1.25 in act 2 (merchant ×1.3) |
| Forge (shop or merchant) | raise an item one rarity, up to Legendary | 45 to Uncommon, 80 to Rare, 130 to Epic, 220 to Legendary (merchant ×1.3) |
| Card ★ (shop or merchant) | upgrade a card once | 25 / 40 / 60 / 85 / 120 by rarity (merchant ×1.3) |
| Selling (shop or merchant, any class) | any item or card you carry (you keep at least one weapon) | 40% of its buy price, plus 40% of what you paid to forge, tune or ★ it; the Hustler gets double |

**The forge keeps what you have.** It never rerolls an item: the base and every affix stay, each affix grows into the new rarity's range (the item remembers each affix's roll), and one new affix is added. The last step, Epic to Legendary, adds a legendary effect that fits the slot (for armour, its part) together with its drawback, and drops any affix the legendary rules out.

Rest is heal-only: the forge took over upgrades. (With Rest also upgrading, the smart bot cleared about 4 points more often, so it lost the option.) All of these numbers are the `ECON` table in `run.js`.

## Your profile, the bank and cosmetics

The game keeps a **lifetime profile** in its own browser-storage key, apart from the run save, so a change to the run save never touches it. It records:
- runs, clears, abandoned runs and the deepest row you reached;
- Overtime runs and your deepest Overtime row (rows past the last boss);
- kills per enemy, and the elites and bosses you've beaten;
- what ended each run;
- lifetime gold;
- how often you used each weapon, class and card.

**STATS** on the title screen shows all of it.

**The bank.** When a run ends (or you leave it for a new one), the bank receives 50% of everything that run earned, spent or not (`ECON.bankShare` in `run.js`). Lifetime gold only ever goes up.

**Cosmetics.** **COSMETICS SHOP** on the title screen spends bank gold on looks that stay owned across runs: playable characters (Cocco Ruzzolone, Granchio Cementino, Rana Rigatona and Scimmietta Spumoni, holding your weapon), hair (a mohawk, a ponytail, spikes, an afro, long hair), hero outfits, weapon skins (the weapon and its shots), hit effects and shot trails, arena themes (stage colours over the zone's own), page themes (the whole interface's colours), map styles and victory banners. They are only visual and never change a fight. The catalogue is `COSMETICS` in `profile.js`.

**Try before you buy.** Tapping something you don't own tries it on instead of buying it: the stage shows it on a demo fight against a training dummy (so weapon skins, hit effects and trails play), a page theme recolours the shop, a map style shows on a small map and a banner flashes on the stage. BUY confirms; CANCEL puts things back.

**Save code.** The stats screen shows your whole profile as a text code (`AB1.` …) to copy into another browser, and loads one back. A checksum refuses a mistyped or cut-short code. Loading asks first and keeps the replaced profile under a backup key. An unreadable profile is never thrown away either: it's kept aside the same way, and older profiles are migrated forward (`migrateProfile`).

## Play

Open `index.html` in a browser, or serve the folder:

```bash
npm run serve        # http://localhost:8080
```

On a phone the inventory and card board move into sheets that the **BAG** and **CARDS** buttons at the bottom open, and tapping a trait chip shows what it does.

`index.html#debug` opens the fight lab: any enemies against any weapon, any cards and an optional gear set (four armour pieces and two trinkets of one rarity), with a quick simulated win-rate table.

## Build

`index.html` is generated. Edit the source files, then:

```bash
npm run build        # writes index.html (and www/index.html for the Android app)
npm run check        # build + JavaScript syntax check
```

The fonts (Press Start 2P and VT323, SIL Open Font License, in `fonts/`) are inlined into `index.html` by `build.js`, so the page loads nothing from the network.

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
| `android/` | The Android app: a [Capacitor](https://capacitorjs.com) project that packages `www/index.html` |
| `tools/` | `android.sh` builds the app; `app-icon.js` draws its icons and splash screens from `sprites.js` |

`rules.js`, `zones.js`, `items.js`, `cards.js` and `run.js` are shared with `balance.js`, so the report runs the same numbers as the game.

A new zone is mostly data: add its entry to `ZONES` in `zones.js` (enemies, groups, events with `story` and `clear` text, look, `tune`), any zone-only enchantments (`zones: [id]`), and the art to `ENEMY_ART` and `EVENT_SCENES` in `sprites.js`. Runs play the zones in order as acts; weapons with `act: n` only drop from act n.

## Android app

The Android app is the same `index.html` in a full-screen Capacitor WebView (`android/`, app id `com.whittleadams.autoboss`). It works offline and saves on the phone. What's different from the website:
- **Portrait only**, and the screen stays on while the game is open.
- **The back button** closes the BAG/CARDS sheet, steps back from the stats, cosmetics and lab screens to the title, and otherwise puts the app in the background. The run is saved after every choice, so nothing is lost.
- **Sound pauses** while the app is in the background, and so do fights.
- **Notches and gesture bars:** the page keeps clear of them (Capacitor's `--safe-area-inset-*`).

You need Node 20+, JDK 21 and the Android SDK (`platform-tools`, `platforms;android-36`, `build-tools;35.0.0`). `tools/android.sh` looks for them in `JAVA_HOME` and `ANDROID_HOME`, falling back to `~/opt/jdk21` and `~/Android/Sdk`.

```bash
npm install
npm run android          # build the game, sync it into android/ and build a debug APK
                         #   -> android/app/build/outputs/apk/debug/app-debug.apk
npm run android:install  # the same, then install it on the phone adb can see
npm run android:release  # a signed app bundle (.aab) for Google Play
npm run icons            # redraw the launcher icons and splash screens (needs playwright)
```

**Installing on your phone:** copy the APK to the phone and open it (allow installs from that app when Android asks), or turn on *Wireless debugging* in the phone's developer options and use `adb pair` / `adb connect` then `npm run android:install`.

**Releasing on Google Play** needs an upload key. Make one once (and keep it and its passwords safe; Google Play App Signing can reset a lost upload key, but only through support):

```bash
keytool -genkeypair -v -keystore android/upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/keystore.properties` (git ignores it and every `.jks`):

```
storeFile=upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Raise `versionCode` (and `versionName`) in `android/app/build.gradle` for every upload.

## Balance

```bash
node balance.js [runs] [--overtime] [--matrix] [--deaths] [--cards[=id,id]] [--legendaries] [--ench] [--class=<id>] [--classes] [--hustler=sell2|nomarkup] [--hero]
TUNE='{"bossAtk":0.8}' node balance.js     # try zone.tune values without editing zones.js (TUNE2, TUNE3... for later acts)
SCALE3='[1.1,0.9]' node balance.js        # multiply every HP tune (and every damage tune) of act 3's zone, for sweeps
ECON='{"forge":[0,40,70,110]}' node balance.js   # and run.js ECON values
HERO='{"armourShield":25}' node balance.js     # and rules.js HERO_TUNE (shield HP per armour point)
CARDRULES='{"draw":2}' node balance.js        # cards.js CARD_RULES
TABLES='{"draw":[70,25,5,0,0]}' node balance.js # items.js LOOT_TABLES
```

It plays runs with three bots that differ only in how they choose:
- **smart:** picks the weapon whose estimated fit is best, judged from the traits shown before the fight (`weaponFit` in `rules.js`), with a nudge towards a weapon an enchantment's counter names. It takes the best loot, valuing a second weapon type above a rarity tier. At shops and the merchant it heals when low, buys real upgrades, upgrades its best card (★) when that costs no more than the next forge, and otherwise forges: the held weapon first, then the other weapons and trinkets, then armour pieces. It sells its weakest spare to afford a real upgrade. It visits the merchant when low or carrying 70+ gold, and spends everything before the boss.
- **randomWeapon:** the same, but holds a random one of its weapons each fight.
- **random:** every choice is random, including what it buys and forges.

The smart bots value a card by rarity, a little extra for summons and triggers, and synergy: cards that share a tag with the board, most of all one that completes a set, and multipliers only when there's something to multiply. Before each fight the smart bot switches on its best cards (the best one, then the best next to those). It spends one-use cards at once, except heals (below half HP) and next-fight buffs (elites and the boss), and pays off curses at shops.

By default the bots take the win after the last boss; with `--overtime` they go into Overtime and the report adds how far the smart bot gets.

All three take random routes. Without `--class` the runs cycle through the four classes by seed; `--class=bruiser` (or `hustler`, `roadie`, `glass`) plays only that class, and `--classes` adds a per-class table.

### Eight acts, in progress (Phase 11)

The zones are going in two at a time, and each batch is balanced toward the eight-act curve, not toward 15% for the acts that exist so far. Act 1 stays at about 43%, act 2 is a little gentler than it was, and each later act takes a steady few points, so all eight end near 15%. With four acts (1000 runs per bot), the smart bot clears act 1 44%, act 2 29%, act 3 26% and act 4 23%. The random-weapon bot clears all four 3%, the random bot never does, and every class lands at 21–25% (Deprived 6%). Act 3 and 4 fights are 92–100% wins for a build that got that far; their bosses (Faraone 95%, Mammut 92%) and elites (about 92–97%) take the rest. In Overtime the smart bot survives a median of 29 rows past the last boss.

The tables below are from before Phase 11 (two acts).

### Where things stood before Phase 11 (4000 runs per bot)

| bot | act 1 clear | full clear (both acts) | avg row reached (of 22) | gold earned | spent | left at the end |
|---|---|---|---|---|---|---|
| smart | 44% | 15% | 13.0 | 374 | 337 | 37 |
| randomWeapon | 17% | 2% | 8.6 | 215 | 173 | 42 |
| random | 3% | 0% | 6.3 | 135 | 72 | 63 |

Smart is about 8x the random-weapon bot on full clears and 2.9x on act 1 (with three weapon slots and bigger shops, holding the right weapon and spending well matter more); the random bot never clears both acts.

- **Act 1** hasn't moved since acts arrived. Smart bot win rates: pelican 79%, tortoise 78%, Polpo Pianissimo 68%.
- **Act 2 is harder.** Its early fights are a warm-up for a carried build (99% through row 3); its elites and boss decide it: gorilla 69%, sloth 77%, chameleon 96%, and Tucano Tortellone 52%, the hardest fight in the game.
- **Every weapon has a job.** With the matrix's stand-in kit the best weapon against each elite and boss is: pelican Uzi, tortoise Wand, Polpo Guitar, gorilla Freeze Ray, sloth Flamethrower, chameleon and Tucano Boomerang. Across the jungle's minion groups the best weapon is now split between the Sword (4), Flamethrower (4), Freeze Ray, Uzi, Guitar and Boomerang (3 each). Before this pass the Guitar topped 13 of them, so the mushroom now resists sonic (it soaks up sound) and so does the parrot (it repeats it back).
- **Overtime** (`--overtime`): 77 of the smart bot's 500 runs cleared and went in. They survived a median of 11 rows past the last boss (75th percentile 22, best 55), and 19 got round to the second lap's beach. The first Overtime act is about as hard as act 2 was; each act after it is a big step up, so Overtime ends most builds within two or three acts. That keeps a record row worth chasing without making Overtime a separate grind.

By class (`--classes`):

| class | smart full | randomWeapon full | random full | smart act 1 | smart elite / boss win, act 1 | act 2 | gold earned |
|---|---|---|---|---|---|---|---|
| Bruiser | 16% | 3% | 0% | 56% | 79% / 76% | 83% / 51% | 413 |
| Hustler | 16% | 2% | 0% | 42% | 81% / 70% | 88% / 58% | 467 |
| Roadie | 14% | 2% | 0% | 38% | 72% / 74% | 87% / 63% | 305 |
| Glass Cannon | 17% | 3% | 0% | 46% | 85% / 76% | 88% / 64% | 370 |
| Ninja | 15% | 2% | 0% | 44% | 73% / 75% | 86% / 55% | 345 |
| Conductor | 13% | 2% | 0% | 46% | 79% / 72% | 82% / 50% | 383 |
| Deprived | 4% | 0% | 0% | 19% | 62% / 53% | 81% / 43% | 216 |

The Hustler sells for double (`CLASS_VARIANT.hustler = 'sell2'`); paying no merchant markup instead (`--hustler=nomarkup`) made it the strongest class in act 1. The Glass Cannon does best against act 2's elites and boss (its crits punch through the gorilla's armour and outrun the sloth's healing) but has the weakest act 1. Trimming its crit damage (×0.6 to ×0.45) cost it act 1 more than act 2, so it stays as it is: the spread is 13–17% (Deprived aside, which is meant to be hard), and no class runs away with it.

**Cards** (`--cards`, re-measured across both acts). The table shows, per card: how often it's taken when offered, how many runs held it and how they did, and two ablations on the same seeds. *Forced* starts every run with the card on the board and never drops it. That's a free extra card from the first fight, so the median card lifts the clear rate by about 4 points; what matters is how far a card sits above that. *Pool* compares the game with the card against the game with it banned. Hype Man (+4% damage per card on the board) came out well on top across two acts, where boards get big, at +10 over the median card. It now gives +3% per card, which brings its forced lift down from +14 to +10. No card moves the clear rate by more than 3 points through being in the pool.

**Enchantments** (`--ench`, re-measured; the stand-in test now plays each enchantment only in the zones it appears in, with that act's weapons). For the smart bot, elites are 76% unenchanted and 77% enchanted, the boss 60% and 59%. On the paired fights (the same fight, hero and seed with the enchantments taken off) they cost 1 point against elites and 7 against the bosses. Against the stand-in kit, a weapon the counter names loses 2 win points to an enchantment and any other weapon 9. *Overgrown* (regrowing armour) is now elite-only: on Tucano it took the Boomerang, his counter, from a sure win to a near-certain loss.

`--hero` prints the smart bot's average hero (max HP, armour, dodge, damage, armour pieces worn) going into the boss. `--matrix` prints every weapon against every group, elite and boss of both acts (the stand-in kit keeps growing through act 2). `--deaths` adds deaths by row, HP on arriving at each row and going into fights, and the fights that end runs.
