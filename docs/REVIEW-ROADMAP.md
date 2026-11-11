# Auto-Boss: review-driven roadmap

A build spec. Each phase is written so it can be handed to Claude (or anyone) and built without more context than this file and the README.

## Goal

Make the game one that a stranger would review well. Three complaints sink auto-battlers and roguelikes in reviews, and each has a phase here:

| The review we don't want | Cause in Auto-Boss today | Phase |
|---|---|---|
| "I died and I don't know why." | Traits, weaknesses and resistances are only on the pre-fight screen. The arena shows HP bars and numbers, and a loss just ends the run. | 1 |
| "Every run is the same fights." | Minion fights are hand-written lists in `zones.js` (`groups`): five or six per band, three bands per zone. Bosses always play the same way. 28 written events across six zones. | 2 |
| "Once you've won there's nothing to do." | Six zones in a fixed order, one difficulty, unlocks only for classes. | 3 |

## Rules for every phase

1. **Fights stay automatic.** Every improvement is to what the player sees, or to the choices between fights.
2. **Procedural means generated here, by seed.** No outside services, no AI at run time. The same seed gives the same run, as now.
3. **The sim is the referee.** Anything generated (encounters, champions, boss variants) must be checked by `balance.js` and rejected if it falls outside its band. Headline numbers to hold, smart bot: act 1 clear 55–60%, each later act about 80% of the runs that reach it (act 2 about 70%), full clear 14–18%.
4. **Drawing must not change a fight.** `render.js` never touches the fight's RNG. New fields on fight events are fine; new random rolls inside `simulate` are not, unless the phase says so.
5. **Data first.** New content is a new entry in a table (`ENEMIES`, `CARDS`, `ENCHANTS`, a zone's `tune`), not a new special case in the rules.
6. **Old saves keep working.** A run saved before an update must load, or be migrated the way `migrateProfile` does.
7. **Each phase ships alone:** its own branch and pull request, `npm run check` passing, `index.html` rebuilt, the README section for what changed, and a before/after from the sim where numbers could move.
8. **Phone first.** Anything drawn has to read on a phone held upright. Colour is never the only signal: pair it with a shape, a size or a word.

## Phase 1: fights that explain themselves

**Status: built** (branch `review-roadmap`), except the flying marks noted below.

Small, and it makes every later phase easier to judge. No balance change.

### 1a. Enemy state you can see

| State | Drawn as |
|---|---|
| Armour | A steel outline round the sprite. Whole while the armour is intact; broken into dashes once it's worn below about two thirds; gone at zero. A small steel number beside the HP bar gives the value. |
| Shield | Already a cyan ring. Keep. |
| Regeneration | A green `+` that drifts up from the enemy on a slow beat. |
| Flying | Not built yet: flyers already sit off the ground. Add wing-beat marks if testers still miss the trait. |
| Evasive | A faint after-image offset behind the sprite. |
| Back row | Nothing new; position already shows it. |

### 1b. Numbers that teach

- The `hit` event carries `eff`: the weakness × resistance multiplier, including the halving of slash and blunt against flyers.
- `eff > 1`: the number is larger and lime, and the first such hit on each enemy also says `WEAK!`.
- `eff < 1`: the number is smaller and grey, and the first such hit on each enemy says `RESIST`.
- Crits keep their yellow `CRIT`. A hit that armour reduced to the floor keeps its grey.

### 1c. The death recap

When a fight is lost, the summary shows:

1. **What killed you:** damage taken by source (each enemy and each named move), biggest first, as bars.
2. **What you did:** damage dealt, and how much of it armour, resistance, shields and healing took back.
3. **One hint**, only from what the pre-fight screen already showed. If another carried weapon had a clearly better `weaponFit`, name it: "Your Magic Wand ignores armour: it fits the Tartaruga better." If the enemy's enchantment named a counter you carried, say that. Otherwise no hint. Never a hint about luck.

Needs: `simulate` keeps `f.taken` (by source) and `f.soaked` (by cause). Both are plain tallies; no RNG.

### Done when

- A new player can tell an armoured enemy from an unarmoured one without the pre-fight screen.
- A fight with the wrong weapon visibly says so within the first three seconds.
- Every loss ends with a recap. `node balance.js 300` prints the same numbers before and after this phase.

## Phase 2: procedural encounters, in house

The biggest win against repetition. The sim makes it safe.

### 2a. Encounter generator

- Each minion gets a `cost` and a `role` (`front`, `back`, `flyer`, `healer`, `swarm`) in `ENEMIES`.
- A zone's `groups` lists become a recipe: a budget per row band, role rules (at most one healer before row 7, a back-row enemy needs a front, and so on), and a size limit.
- `genEncounter(zone, row, rng)` builds a group from the run's seed.
- **Offline check:** a `balance.js --gen` report generates a few thousand groups per band, plays each with the stand-in kit across all weapons, and prints the win band. A group is legal only if at least two starting weapons beat it and no weapon gets a free win at full HP on rows 7 to 9. The budget and rules are tuned until 95% of generated groups are legal; the rest are rejected at generation and re-rolled.
- The hand-written lists stay as the fallback and as the sim's fixed test set.

### 2b. Champions

One minion in some groups (chance rising with the row) carries a small enchantment from a new minion-sized list in `ENCHANTS` (`for: ['minion']`): Armoured, Quick, Splitting, Mending, Explosive. Drawn with the existing enchantment sparks and named on the pre-fight screen. Costs budget, so a champion group has fewer bodies.

### 2c. Boss moods

Each boss gets two or three `moods`: a move set and phase thresholds, with a name shown on the map node and the pre-fight screen ("Polpo Pianissimo, *Allegro*"). The seed picks one. Each mood must have a different best weapon in the matrix, and all moods of a boss must land within 5 points of each other for the smart bot.

### 2d. Events from parts

An event is assembled from a cast member (voice and scene), an offer (heal, max HP, gold, item, card, tonic, a gamble) and a price (gold, HP, a curse, an item). The written events stay as the rare, special ones. Each zone gets a pool of parts, so the same walrus can turn up with a different deal.

### Done when

- Twenty runs on twenty seeds show no repeated minion group within a run more than twice.
- Headline numbers hold (rule 3). The smart-over-random-weapon gap does not shrink.
- The same seed still gives the same run.

## Phase 3: more than one journey

### 3a. Zone choice

After each boss the map offers two next zones (the last is fixed). Each zone carries its strength by act position, not by identity: `tune` splits into the zone's own shape and an act multiplier, which `otFloor()` already half does for Overtime. Each zone shows what it's known for (armour, healing, flyers) so the choice is about your build.

### 3b. Heat

After a first clear, the player can add handicaps before a run, each worth a bank bonus: enemies +HP, fewer shops, champions everywhere, no rest heals, bosses always enchanted. Stored on the profile, shown on the summary. Mostly data over values that exist.

### 3c. Daily run

One seed, class and heat set per calendar day, the same for everyone, worked out from the date with no server. The summary gives a short share code (seed, class, result, row reached).

### 3d. Rule-bending cards

Ten cards, at least one per class, that change a rule and not a number. Examples: "Your held weapon is chosen at random each fight; all weapons deal +40%." "Gold can't be spent on healing; every 100 gold held is +5% damage." "Summons take your hits for you." Each must move the smart bot's forced-card clear rate by less than 6 points (`--cards`), so they change how a run is played more than whether it's won.

### 3e. The checklist

Small goals on the profile that each add something to the pool: a card, a trinket, a cosmetic, a boss mood. "Beat the tortoise with the Bazooka." "Clear act 2 holding one weapon." About forty to start. The profile screen shows the list with progress.

### Done when

- Two clears can go through different zones in a different order.
- A player who has cleared once has a harder mode, a daily reason to open the game, and a visible list of things left to find.

## Not in this roadmap

Multiplayer, accounts or a server, manual control in fights, new art style, paid content. Acts 7 and 8 are their own work (README, Phase 11); when they land, re-run the curve in rule 3.

## Order and size

| Phase | Size | Depends on |
|---|---|---|
| 1 Readability and recap | small | nothing |
| 2a Encounter generator | large | 1 (to judge generated fights by eye) |
| 2b Champions | medium | 2a |
| 2c Boss moods | medium each boss | nothing |
| 2d Events from parts | medium | nothing |
| 3a Zone choice | large | 2a (zones must work at any act position) |
| 3b Heat, 3c Daily | small each | nothing |
| 3d Rule-bending cards | medium | nothing |
| 3e Checklist | medium | 2c, 3d (things to unlock) |
