// Loot: rarity, item bases, affixes, legendaries, and compileHero(), which turns what the run carries
// into the hero a fight uses. Shared with run.js and balance.js.
// Slots: 3 weapons (only the held one's affixes count), 4 armour pieces (head, body, legs, feet), 2 trinkets
// (3 for the Roadie).
// Armour items are { slot: 'armour', part, ... }; each part has its own bases and its own affix leaning.

const RARITIES = [
  { name: 'Common', mult: 1, affixes: 0 },
  { name: 'Uncommon', mult: 1.12, affixes: 1 },
  { name: 'Rare', mult: 1.25, affixes: 2 },
  { name: 'Epic', mult: 1.4, affixes: 3 },
  { name: 'Legendary', mult: 1.5, affixes: 2 },
];
// Rarity weights for each place loot comes from.
const LOOT_TABLES = {
  fight: [60, 28, 10, 2, 0], fightLate: [38, 36, 20, 5, 1], elite: [8, 34, 38, 16, 4],
  treasure: [5, 30, 40, 20, 5], shop: [12, 34, 36, 16, 2], merchant: [65, 35, 0, 0, 0], event: [12, 36, 34, 15, 3],
  merchantCard: [100, 0, 0, 0, 0], shopCard: [0, 35, 40, 20, 5],
  draw: [58, 30, 10, 2, 0], eliteDraw: [15, 40, 32, 11, 2],      // the card draw after a fight or an elite
  // act 2: everything a step rarer (run.js picks these with lootTable())
  fight2: [30, 38, 24, 7, 1], fightLate2: [18, 36, 32, 12, 2], elite2: [2, 20, 42, 28, 8],
  treasure2: [0, 18, 42, 30, 10], shop2: [4, 24, 40, 26, 6], merchant2: [30, 50, 20, 0, 0], event2: [4, 26, 40, 24, 6],
  merchantCard2: [60, 40, 0, 0, 0], shopCard2: [0, 20, 40, 30, 10], draw2: [35, 38, 20, 6, 1], eliteDraw2: [5, 30, 40, 20, 5],
};
// The act a loot table belongs to (its name ends in the act number from act 2 on).
const tableAct = table => +(/(\d)$/.exec(table || '') || [0, 1])[1];

// Four armour parts. A full set is worth about what one piece plus a little was when there was a single
// armour slot, so each piece is small: bases and affixes on armour are scaled by ARMOUR_SCALE.
const ARMOUR_PARTS = {
  head: { name: 'Head', affixes: ['crit', 'dodge', 'maxHp', 'shield', 'postHeal'] },
  body: { name: 'Body', affixes: ['maxHp', 'armour', 'shield', 'postHeal', 'thorns'] },
  legs: { name: 'Legs', affixes: ['aps', 'maxHp', 'dodge', 'armour', 'riposte'] },
  feet: { name: 'Feet', affixes: ['dodge', 'thorns', 'maxHp', 'aps', 'riposte'] },
};
const PARTS = Object.keys(ARMOUR_PARTS);
const ARMOUR_SCALE = 0.45;             // affix values rolled on an armour piece
const ARMOURS = [
  { id: 'snorkel', part: 'head', name: 'Snorkel Helmet', icon: 'snorkel', stats: { maxHp: 4, dodge: 0.03 } },
  { id: 'bucket', part: 'head', name: 'Sun Bucket Hat', icon: 'bucket', stats: { crit: 0.04 } },
  { id: 'shades', part: 'head', name: 'Mirror Shades', icon: 'shades', stats: { crit: 0.025, dodge: 0.02 } },
  { id: 'towel', part: 'body', name: 'Beach Towel Cape', icon: 'towel', stats: { maxHp: 12 } },
  { id: 'vest', part: 'body', name: 'Lifeguard Vest', icon: 'vest', stats: { maxHp: 7, armour: 0.7 } },
  { id: 'plate', part: 'body', name: 'Sandcastle Plate', icon: 'armor', stats: { maxHp: 3, armour: 1.2 } },
  { id: 'shorts', part: 'legs', name: 'Board Shorts', icon: 'shorts', stats: { aps: 0.04 } },
  { id: 'wetsuit', part: 'legs', name: 'Wetsuit Leggings', icon: 'wetsuit', stats: { aps: 0.02, maxHp: 5 } },
  { id: 'kneepads', part: 'legs', name: 'Sandbag Kneepads', icon: 'kneepads', stats: { armour: 0.5, aps: 0.015 } },
  { id: 'flipflops', part: 'feet', name: 'Flip-Flops', icon: 'flipflops', stats: { dodge: 0.03 } },
  { id: 'urchins', part: 'feet', name: 'Urchin Sandals', icon: 'urchins', stats: { thorns: 1.2 } },
  { id: 'fins', part: 'feet', name: 'Swim Fins', icon: 'fins', stats: { dodge: 0.02, thorns: 0.6 } },
  { id: 'visor', part: 'head', name: 'Party Visor', icon: 'visor', stats: { crit: 0.03, gold: 0.08 } },
  { id: 'rashguard', part: 'body', name: 'Rash Guard', icon: 'rashguard', stats: { dodge: 0.03, aps: 0.03 } },
  { id: 'cargo', part: 'legs', name: 'Cargo Shorts', icon: 'cargo', stats: { maxHp: 6, gold: 0.06 } },
  { id: 'skates', part: 'feet', name: 'Roller Skates', icon: 'skates', stats: { aps: 0.05 } },
  // act 2 only: the jungle's own armour (act: 2), so act 2 loot has bases act 1 never shows
  { id: 'tiki', act: 2, part: 'head', name: 'Tiki Mask', icon: 'tiki', stats: { thorns: 1, dodge: 0.04 } },
  { id: 'lasagna', act: 2, part: 'body', name: 'Lasagna Breastplate', icon: 'lasagna', stats: { armour: 1, regen: 0.3 } },
  { id: 'greaves', act: 2, part: 'legs', name: 'Gnocchi Greaves', icon: 'greaves', stats: { armour: 0.7, maxHp: 4 } },
  { id: 'clogs', act: 2, part: 'feet', name: 'Wooden Clogs', icon: 'clogs', stats: { armour: 0.6, thorns: 0.8 } },
];
const TRINKETS = [
  { id: 'shell', name: 'Lucky Seashell', icon: 'shell', stats: { crit: 0.06 } },
  { id: 'sunscreen', name: 'Factor 50', icon: 'sunscreen', stats: { shield: 12 } },
  { id: 'drink', name: 'Coconut Drink', icon: 'drink', stats: { regen: 0.5 } },
  { id: 'duck', name: 'Rubber Duck', icon: 'duck', stats: { thorns: 2 } },
  { id: 'espresso', name: 'Pocket Espresso', icon: 'espresso', stats: { aps: 0.08 } },
  { id: 'feather', name: 'Seagull Feather', icon: 'feather', stats: { dodge: 0.04 } },
  { id: 'map', name: 'Soggy Treasure Map', icon: 'map', stats: { gold: 0.25 } },
  // trinkets with a small trigger of their own (STAT_TEXT says what each does)
  { id: 'kazoo', name: 'Kazoo', icon: 'kazoo', stats: { killZap: 8 } },
  { id: 'dice', name: 'Lucky Dice', icon: 'dice', stats: { crit: 0.04, critGold: 1 } },
  { id: 'stopwatch', name: 'Stopwatch', icon: 'stopwatch', stats: { ambush: 0.5 } },
  { id: 'necklace', name: 'Shell Necklace', icon: 'necklace', stats: { shield: 8, dodge: 0.02 } },
  { id: 'spoon', name: 'Gelato Spoon', icon: 'spoon', weight: 0.6, stats: { lifesteal: 0.04 } },
  { id: 'whistle', name: 'Beach Whistle', icon: 'whistle', weight: 0.4, stats: { summonDmg: 0.2 } },          // weight: a rarer drop
  { id: 'watch', act: 2, name: 'Tide Watch', icon: 'watch', stats: { regen: 0.4, lowRegen: 0.8 } },      // act 2 only
];
// How base stats that aren't affixes read on an item.
const STAT_TEXT = {
  regen: v => 'Regenerate ' + v + ' HP/s', aps: v => '+' + pct(v) + ' attack speed',
  killZap: v => 'On kill: ' + v + ' sonic damage to a random enemy',
  critGold: v => 'Each crit: +' + v + ' gold (up to 10 a fight)',
  ambush: v => 'Your first attack in a fight comes at once and deals +' + pct(v),
  lifesteal: v => pct(v) + ' lifesteal', summonDmg: v => 'Your summons deal +' + pct(v) + ' damage',
  lowRegen: v => 'Regenerate ' + v + ' HP/s more below half HP',
};

// Affixes: which slots roll them, the value range (scaled by rarity), how they read.
const AFFIXES = {
  vsFlying: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs flying', suffix: 'of Skyfall' },
  vsArmour: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs armoured', suffix: 'of Can Opening' },
  vsShield: { slots: ['weapon', 'trinket'], lo: 0.25, hi: 0.5, text: v => '+' + pct(v) + ' damage vs shielded', suffix: 'of Popping' },
  vsEvasive: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs evasive', suffix: 'of Homing' },
  vsGroup: { slots: ['weapon', 'trinket'], lo: 0.15, hi: 0.35, text: v => '+' + pct(v) + ' damage while 2+ enemies stand', suffix: 'of Crowds' },
  pierce: { slots: ['weapon', 'trinket'], lo: 1, hi: 3, int: true, text: v => '+' + v + ' armour pierce', suffix: 'of Piercing' },
  cleave: { slots: ['weapon'], perk: 'focus', lo: 1, hi: 1, int: true, text: () => 'Focus builds twice as fast', suffix: 'of the Duel' },     // id kept for old saves
  dmg: { slots: ['weapon'], lo: 0.1, hi: 0.25, text: v => '+' + pct(v) + ' damage', suffix: 'of Oomph' },
  crit: { slots: ['weapon', 'trinket', 'armour'], lo: 0.05, hi: 0.12, text: v => '+' + pct(v) + ' crit chance', suffix: 'of Luck' },
  critx: { slots: ['weapon'], lo: 0.3, hi: 0.7, text: v => '+' + v.toFixed(1) + '× crit damage', suffix: 'of Ouch' },
  aps: { slots: ['weapon', 'trinket', 'armour'], lo: 0.06, hi: 0.15, text: v => '+' + pct(v) + ' attack speed', suffix: 'of Espresso' },
  lifesteal: { slots: ['weapon'], lo: 0.03, hi: 0.07, text: v => pct(v) + ' lifesteal', suffix: 'of Leeches' },
  maxHp: { slots: ['armour', 'trinket'], lo: 8, hi: 22, int: true, text: v => '+' + v + ' max HP', suffix: 'of Gelato' },
  // (armour pieces pick from their part's list in ARMOUR_PARTS, not from slots)
  armour: { slots: ['armour'], lo: 1, hi: 2, int: true, fine: true, text: v => '+' + armourHp(v) + ' armour', suffix: 'of Sandbags' },
  dodge: { slots: ['armour', 'trinket'], lo: 0.03, hi: 0.07, text: v => '+' + pct(v) + ' dodge', suffix: 'of Wiggling' },
  shield: { slots: ['armour', 'trinket'], lo: 10, hi: 25, int: true, text: v => 'Start fights with a ' + v + ' HP shield', suffix: 'of Sunscreen' },
  postHeal: { slots: ['armour', 'trinket'], lo: 4, hi: 10, int: true, text: v => 'Heal ' + v + ' HP after each win', suffix: 'of Naps' },
  thorns: { slots: ['armour'], lo: 1, hi: 3, int: true, fine: true, text: v => 'Deal ' + dec1(v) + ' back to whoever hits you', suffix: 'of Urchins' },
  gold: { slots: ['trinket'], lo: 0.15, hi: 0.3, text: v => '+' + pct(v) + ' gold', suffix: 'of Tourists' },
  killHeal: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 3, hi: 8, int: true, text: v => 'Heal ' + v + ' HP on each kill', suffix: 'of Snacking' },
  ambush: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 0.3, hi: 0.8, text: v => 'Your first attack in a fight comes at once and deals +' + pct(v), suffix: 'of the Ambush' },
  vsBoss: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 0.1, hi: 0.25, text: v => '+' + pct(v) + ' damage vs bosses', suffix: 'of the Headliner' },
  summonDmg: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 0.2, hi: 0.5, text: v => 'Your summons deal +' + pct(v) + ' damage', suffix: 'of Management' },
  zapDmg: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 0.2, hi: 0.5, text: v => 'Your cards\' zaps deal +' + pct(v) + ' damage', suffix: 'of Static' },
  killGold: { slots: ['weapon', 'trinket'], weight: 0.35, lo: 1, hi: 2, int: true, text: v => '+' + v + ' gold on each kill (up to 10 a fight)', suffix: 'of Pickpockets' },
  riposte: { slots: ['trinket'], weight: 0.35, lo: 3, hi: 8, int: true, text: v => 'When you dodge, hit back for ' + v, suffix: 'of Riposte' },
};

// Legendaries always cost you something. Armour legendaries belong to one part each (parts).
// Each drawback comes from the effect itself, not a flat penalty. bases: legendaries for one or two
// weapon types only. compileHero turns them into mods that rules.js reads.
const LEGENDARIES = {
  chaos: { slots: ['weapon', 'trinket'], name: 'Chorus of Chaos', text: 'Every attack hits every enemy, but each one past the first takes 45%' },
  glass: { slots: ['trinket', 'weapon'], name: 'Glass Cannon', text: '+60% damage, but each hit you take cracks it: -3% damage for the rest of the fight (up to -50%)' },
  slowhands: { slots: ['weapon'], name: 'Slow Hands', text: 'Every hit crits, but a crit deals ×1.6 whatever your crit damage', excludes: ['crit', 'critx'] },
  bloodpact: { slots: ['armour'], parts: ['head'], name: 'Bloodpact Bandana', text: '10% lifesteal, but resting can no longer heal you' },
  fortress: { slots: ['armour'], parts: ['body'], name: 'Sandcastle Fortress', text: `+${armourHp(3)} armour and +15 max HP, but the sand settles: your shield starts each fight half full` },
  feather: { slots: ['armour'], parts: ['legs'], name: 'Featherweight Speedo', text: '+20% dodge, but your other armour pieces give no armour', excludes: ['armour'] },
  hotsand: { slots: ['armour'], parts: ['feet'], name: 'Hot Sand Sprinters', text: '+40% attack speed for the first 10s of a fight; then the sand cools and it\'s +10%' },
  // extra lives
  secondwind: { slots: ['armour'], parts: ['head'], name: 'Second Wind Snorkel', text: 'Extra life: the first time you fall, get back up at 40% HP. Then it cracks back to Epic' },
  phoenix: { slots: ['armour'], parts: ['feet'], name: 'Phoenix Flip-Flops', text: 'Extra life: when you fall, rise at 50% HP in a blast of fire that hits every enemy. Then they burn away' },
  // effects only a legendary has
  jar: { slots: ['trinket'], name: 'Jellyfish in a Jar', text: 'Chain lightning: every hit arcs 55% of its damage to two more enemies. The arcs sting your allies too' },
  eagle: { slots: ['armour'], parts: ['head'], name: 'Eagle-Eye Shades', text: 'Your attacks can\'t miss. You lock on: no switching targets until yours falls' },
  union: { slots: ['trinket'], name: 'Union Card', text: 'Two tough Union Gulls join every fight. The union takes its cut: -10% gold' },
  exosuit: { slots: ['armour'], parts: ['body'], name: 'Concrete Exosuit', text: 'A Concrete Crab bodyguard stands in front of you and draws most hits. You hide behind it: -10% attack speed while it stands' },
  metronome: { slots: ['trinket'], name: 'The Metronome', text: 'Every 4th attack deals triple damage; the off-beats deal 15% less' },
  tidecaller: { slots: ['trinket'], name: 'Tidecaller\'s Shell', text: 'Your shield refills to full every 8s of a fight, like a tide, but starts each fight half full' },
  rollingpin: { slots: ['weapon'], name: 'Grandma\'s Rolling Pin', text: 'A kill knocks the body into the next enemy for half the overkill. Enemies at full HP take 15% less' },
  goldbelt: { slots: ['armour'], parts: ['legs'], name: 'Golden Gnocchi Belt', text: '+3% damage and attack speed for every 20 gold you carry (up to +30%), and -1% dodge for each' },
  // one or two weapon types only
  excalibread: { slots: ['weapon'], bases: ['sword'], name: 'Excalibread', text: 'Focus carries over to the next enemy instead of starting again, and builds to +90%. A miss drops it to nothing' },
  bell: { slots: ['weapon'], bases: ['gloves', 'stars'], name: 'Pugilist\'s Bell', text: 'Stuns last 2s, bosses don\'t shrug them off, and Ninja Stars stun too (10%). A stunned enemy is stun-proof for 5s after' },
  gatling: { slots: ['weapon'], bases: ['uzi', 'flamer'], name: 'Gelato Gatling', text: 'Every 8th shot chills (30% slower for 2s). It overheats: for 1s in every 7 it cools down and doesn\'t fire' },
  grandtoad: { slots: ['weapon'], bases: ['wand'], name: 'Grand Toad Wand', text: 'Spells come twice as often, and every one is a toad that lasts 4s' },
  hawk: { slots: ['weapon'], bases: ['sniper', 'boomerang'], name: 'Hawk\'s Nest', text: 'A shot that kills reloads twice as fast. One that doesn\'t reloads 20% slower' },
};
const legendaryFits = (k, slot, part, base) => {
  const L = LEGENDARIES[k];
  return L.slots.includes(slot) && (!L.parts || L.parts.includes(part)) && (!base || !L.bases || L.bases.includes(base));
};

// Classes: chosen before the weapon. Stats feed compileHero; the rest are hooks the run logic reads.
// Weapons are never class-locked. CLASS_VARIANT lets balance.js try the Hustler's alternative passive.
const CLASSES = {
  bruiser: { name: 'Bruiser', icon: 'clsBruiser', blurb: 'Big, armoured and hard to keep down.',
    lines: [`+10 max HP, +${armourHp(0.3)} armour, but -5% attack speed`, 'Heals 2% of max HP more after each won fight', 'Heals at shops and the merchant cost 30% less'],
    stats: { maxHp: 10, armour: 0.3, aps: -0.05 }, winHeal: 0.02, healDiscount: 0.3 },
  hustler: { name: 'Hustler', icon: 'clsHustler', blurb: 'Always has an angle, rarely has HP.',
    lines: ['-6 max HP', '10% interest on unspent gold every row (up to 10)', 'Merchant prices 25% lower'],
    stats: { maxHp: -6 }, interest: 0.1, interestCap: 10, merchantDiscount: 0.25 },
  roadie: { name: 'Roadie', icon: 'clsRoadie', blurb: 'Carries the gear. All of it.',
    lines: ['Base stats', 'A third trinket slot', 'Shops and the merchant are 10% cheaper'],
    stats: {}, trinketSlots: 3, shopDiscount: 0.1 },
  glass: { name: 'Glass Cannon', icon: 'clsGlass', blurb: 'Hits like a bus, folds like a deckchair.',
    lines: ['-25 max HP', '+10% crit chance, +0.6× crit damage', 'Starts with a 4th card slot'],
    stats: { maxHp: -25, crit: 0.1, critx: 0.6 }, cardSlots: 1 },
};
for (const id in CLASSES) CLASSES[id].id = id;
// hustler: 'sell2' (sells for double) or 'nomarkup' (the merchant charges shop prices, before the discount).
const CLASS_VARIANT = { hustler: 'sell2' };
function applyVariants() {
  const H = CLASSES.hustler, two = CLASS_VARIANT.hustler === 'sell2';
  H.sellMult = two ? 2 : 1; H.noMarkup = !two;
  H.lines = H.lines.slice(0, 3).concat(two ? ['Sells items and cards for double'] : ['The merchant charges no markup']);
}
applyVariants();
const clsOf = run => (run && run.cls && CLASSES[run.cls]) || null;

// An affix's value from its rarity and its own roll (kept on the item, so the forge can lift it).
// On armour the value is scaled down and kept to one decimal.
const affixValue = (a, rarity, roll, armour) => {
  const v = (a.lo + (a.hi - a.lo) * Math.min(1, rarity / 4 + roll * 0.35)) * (armour ? ARMOUR_SCALE : 1);
  if (a.int) return armour && a.fine ? Math.max(0.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v));
  return Math.round(v * 1000) / 1000;
};
const dec1 = v => Math.round(v * 10) / 10;

function rollRarity(rng, table) {
  const w = LOOT_TABLES[table];
  let x = rng.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i;
  return 0;
}

// The affixes an item could roll: by slot (armour by part), never repeating a base stat, needing a
// different attack shape, or fighting the item's legendary.
function affixOptions(it) {
  const shape = it.slot === 'weapon' ? weaponById(it.base).shape : null, perks = it.slot === 'weapon' ? weaponById(it.base).perks || {} : {}, baseStats = it.slot === 'weapon' ? {} : itemBase(it).stats;
  const excluded = (it.legendary && LEGENDARIES[it.legendary].excludes) || [], have = it.affixes.map(a => a.id);
  const pool = it.slot === 'armour' ? ARMOUR_PARTS[it.part].affixes : Object.keys(AFFIXES).filter(k => AFFIXES[k].slots.includes(it.slot));
  return pool.filter(k => (!AFFIXES[k].shape || AFFIXES[k].shape === shape) && (!AFFIXES[k].perk || perks[AFFIXES[k].perk]) && !(k in baseStats) && !excluded.includes(k) && !have.includes(k));
}
function addAffix(rng, it) {
  const options = affixOptions(it);
  if (!options.length) return false;
  // niche affixes (weight below 1) turn up less often, so the core stats stay the backbone of loot
  const w = k => AFFIXES[k].weight || 1;
  let x = rng.next() * options.reduce((t, k) => t + w(k), 0), id = options[options.length - 1];
  for (const k of options) if ((x -= w(k)) < 0) { id = k; break; }
  const r = rng.next();
  it.affixes.push({ id, v: affixValue(AFFIXES[id], it.rarity, r, it.slot === 'armour'), r });
  return true;
}

// A base by weight (a base without one counts 1).
function pickBase(rng, list) {
  let x = rng.next() * list.reduce((t, b) => t + (b.weight || 1), 0);
  for (const b of list) if ((x -= b.weight || 1) < 0) return b;
  return list[list.length - 1];
}
// A new item. slot: 'weapon' | 'armour' | 'trinket'; base: a weapon id or base id (random if omitted).
// part (armour only): 'head' | 'body' | 'legs' | 'feet' (random if omitted, or taken from the base).
// act: which weapons can turn up (the act 2 weapons only from act 2).
function rollItem(rng, slot, rarity, base, part, act) {
  if (slot === 'armour') part = base ? ARMOURS.find(b => b.id === base).part : part || rng.pick(PARTS);
  const pool = slot === 'weapon' ? weaponsFor(act) : slot === 'armour' ? ARMOURS.filter(b => b.part === part && (b.act || 1) <= (act || 1)) : TRINKETS.filter(b => (b.act || 1) <= (act || 1));
  const legendary = rarity === 4 ? rng.pick(Object.keys(LEGENDARIES).filter(k => legendaryFits(k, slot, part, base) && pool.some(b => legendaryFits(k, slot, part, b.id)))) : null;
  base = base || pickBase(rng, pool.filter(b => !legendary || legendaryFits(legendary, slot, part, b.id))).id;
  const it = { slot, base, rarity, affixes: [], forged: 0 };
  if (part) it.part = part;
  if (legendary) it.legendary = legendary;
  for (let k = 0; k < RARITIES[rarity].affixes; k++) addAffix(rng, it);
  return it;
}
// Any slot, weighted so weapons stay common even with four armour parts to fill.
const SLOT_WEIGHTS = { weapon: 0.3, armour: 0.36, trinket: 0.34 };
function rollAny(rng, table) {
  const x = rng.next(), slot = x < SLOT_WEIGHTS.weapon ? 'weapon' : x < SLOT_WEIGHTS.weapon + SLOT_WEIGHTS.armour ? 'armour' : 'trinket';
  return rollItem(rng, slot, rollRarity(rng, table), null, null, tableAct(table));
}

// The forge: one rarity up, keeping the base and the affixes. Every affix moves into the new rarity's
// range and one new affix is added. The last step, Epic to Legendary, adds a fitting legendary instead
// (dropping any affix the legendary rules out).
function upgradeItem(rng, it) {
  if (it.rarity >= 4) return false;
  it.rarity++;
  for (const a of it.affixes) { if (a.r == null) a.r = rng.next(); a.v = affixValue(AFFIXES[a.id], it.rarity, a.r, it.slot === 'armour'); }
  if (it.rarity === 4) {
    const fits = Object.keys(LEGENDARIES).filter(k => legendaryFits(k, it.slot, it.part, it.base));
    const clean = fits.filter(k => !(LEGENDARIES[k].excludes || []).some(x => it.affixes.some(a => a.id === x)));
    it.legendary = rng.pick(clean.length ? clean : fits);
    const ex = LEGENDARIES[it.legendary].excludes || [];
    it.affixes = it.affixes.filter(a => !ex.includes(a.id));
  } else addAffix(rng, it);
  return true;
}

function itemBase(it) { return it.slot === 'weapon' ? weaponById(it.base) : (it.slot === 'armour' ? ARMOURS : TRINKETS).find(b => b.id === it.base); }
const slotLabel = it => it.slot === 'armour' ? ARMOUR_PARTS[it.part].name.toLowerCase() + ' armour' : it.slot;
function itemName(it) {
  if (it.legendary) return LEGENDARIES[it.legendary].name + (it.slot === 'weapon' ? ' (' + weaponById(it.base).name + ')' : '');
  const b = itemBase(it).name;
  return it.affixes.length ? b + ' ' + AFFIXES[it.affixes[0].id].suffix : b;
}
function itemIcon(it) { return it.slot === 'weapon' ? it.base : itemBase(it).icon; }
// Readable lines: base stats, affixes, then the legendary trade-off.
function itemLines(it) {
  const lines = [];
  if (it.slot === 'weapon') {
    const w = weaponById(it.base);
    lines.push(DAMAGE_TYPES[w.type].name + ' · ' + Math.round(w.dmg * RARITIES[it.rarity].mult * 10) / 10 + ' damage × ' + w.aps + '/s' + (w.shape !== 'single' ? ' · ' + w.shape : ''));
  } else {
    const st = scaledBase(it);
    for (const k in st) lines.push(AFFIXES[k] ? AFFIXES[k].text(st[k]) : STAT_TEXT[k] ? STAT_TEXT[k](st[k]) : k);
  }
  for (const a of it.affixes) lines.push(AFFIXES[a.id].text(a.v));
  if (it.tune) { const t = tuneBonus(it); lines.push('Tuned: ' + Object.keys(TUNING).filter(k => it.tune[k]).map(k => TUNING[k].text(t[k])).join(', ')); }
  if (it.legendary) lines.push('★ ' + LEGENDARIES[it.legendary].text);
  return lines;
}
// Armour and trinket base stats grow with rarity.
function scaledBase(it) {
  const st = { ...itemBase(it).stats }, m = RARITIES[it.rarity].mult;
  for (const k in st) st[k] = Number.isInteger(st[k]) && k !== 'thorns' ? Math.round(st[k] * m) : Math.round(st[k] * m * 1000) / 1000;
  return st;
}

// Weapon tuning: gold buys a weapon more damage, speed or crit directly, a level at a time (run.js
// tuneCost). it.tune counts the levels; a level's bonus stacks like any other.
const TUNING = {
  dmg: { name: 'DAMAGE', v: 0.08, text: v => '+' + pct(v) + ' damage' },
  aps: { name: 'SPEED', v: 0.06, text: v => '+' + pct(v) + ' attack speed' },
  crit: { name: 'CRIT', v: 0.04, text: v => '+' + pct(v) + ' crit chance' },
};
function tuneBonus(it) {
  const out = {};
  for (const k in TUNING) { const n = (it.tune && it.tune[k]) || 0, o = {}; stack(o, k, TUNING[k].v, n); out[k] = o[k] || 0; }
  return out;
}

// Everything worn or carried, held weapon aside.
const armourPieces = run => PARTS.map(p => run.inv.armour[p]).filter(Boolean);
const allItems = run => [...run.inv.weapons, ...armourPieces(run), ...run.inv.trinkets].filter(Boolean);

// Every stat bonus the run carries: armour, trinkets, and the held weapon's affixes.
// The Featherweight Speedo turns off the armour stat of every other armour piece.
// Percentage bonuses to attack speed and damage multiply (STACKED): +10% twice is +21%, and the
// total is kept as a bonus (add.aps 0.21) so it reads the same as the flat stats.
function carriedStats(run, weaponSlot) {
  const add = { maxHp: 0, armour: 0, dodge: 0, crit: 0, critx: 0, shield: 0, regen: 0, aps: 0, dmg: 0, lifesteal: 0, thorns: 0, postHeal: 0, gold: 0, pierce: 0, cleave: 0, vs: {} };
  const legend = new Set();
  const held = run.inv.weapons[weaponSlot];
  const worn = [...armourPieces(run), ...run.inv.trinkets, held].filter(Boolean);
  const feather = worn.some(it => it.legendary === 'feather');
  for (const it of worn) {
    const noArmour = feather && it.slot === 'armour' && it.legendary !== 'feather';
    if (it.slot !== 'weapon') for (const [k, v] of Object.entries(scaledBase(it))) if (!(noArmour && k === 'armour')) stack(add, k, v);
    for (const a of it.affixes) {
      if (noArmour && a.id === 'armour') continue;
      if (a.id.startsWith('vs')) { const t = { vsFlying: 'flying', vsArmour: 'armour', vsShield: 'shield', vsEvasive: 'evasive', vsGroup: 'group', vsBoss: 'boss' }[a.id]; add.vs[t] = (add.vs[t] || 0) + a.v; }
      else stack(add, a.id, a.v);
    }
    if (it.tune) { const t = tuneBonus(it); for (const k in t) stack(add, k, t[k]); }
    if (it.legendary) legend.add(it.legendary);
  }
  // tonics bought at shops: permanent bonuses for the rest of the run
  for (const k in run.tonics || {}) stack(add, k, run.tonics[k]);
  if (legend.has('union')) add.gold -= 0.1;
  return { add, legend };
}

const STACKED = ['aps', 'dmg'];
// Add bonus v to stat k of o, times over: multiplied in for STACKED stats, summed for the rest.
function stack(o, k, v, times) {
  times = times == null ? 1 : times;
  o[k] = STACKED.includes(k) ? ((1 + (o[k] || 0)) * Math.pow(1 + v, times)) - 1 : (o[k] || 0) + v * times;
}

// The hero a fight uses. weaponSlot: 0 or 1.
function compileHero(run, weaponSlot, target) {
  const it = run.inv.weapons[weaponSlot] || run.inv.weapons.find(Boolean) || { slot: 'weapon', base: 'sword', rarity: 0, affixes: [] };   // empty-handed before the first pick
  const { add, legend } = carriedStats(run, run.inv.weapons.indexOf(it));
  const w = weaponById(it.base);
  const mods = { ...newMods(), vs: add.vs, pierce: add.pierce, cleave: add.cleave, aps: 1 + add.aps, lifesteal: add.lifesteal, thorns: add.thorns, dmg: 1 + add.dmg };
  const cs = (clsOf(run) || {}).stats || {};
  let hpMax = BASE_HERO.maxHp + run.maxHpBonus + add.maxHp + (cs.maxHp || 0), armour = add.armour + (cs.armour || 0), dodge = BASE_HERO.dodge + add.dodge;
  if (legend.has('chaos')) { mods.allHit = true; mods.chaosShare = 0.45; }
  if (legend.has('glass')) { mods.dmg *= 1.6; mods.crack = 0.03; }
  if (legend.has('slowhands')) { mods.alwaysCrit = true; mods.fixedCrit = 1.6; }
  if (legend.has('bloodpact')) mods.lifesteal += 0.1;
  if (legend.has('fortress')) { armour += 3; hpMax += 15; mods.shieldStart = 0.5; }
  if (legend.has('feather')) dodge += 0.2;
  if (legend.has('hotsand')) mods.hotsand = { early: 1.4, late: 1.1, until: 10 };
  // extra lives, in the order they're spent: the snorkel cracks, the flip-flops burn
  mods.lives = [];
  if (legend.has('secondwind')) mods.lives.push({ id: 'secondwind', share: 0.4 });
  if (legend.has('phoenix')) mods.lives.push({ id: 'phoenix', share: 0.5, blast: 0.3 });
  if (legend.has('jar')) mods.chain = { share: 0.55, n: 2, ally: 0.1 };
  if (legend.has('eagle')) { mods.trueHit = true; mods.lockOn = true; }
  if (legend.has('exosuit')) mods.exoSlow = 0.9;
  if (legend.has('metronome')) mods.beat = { every: 4, big: 3, off: 0.85 };
  if (legend.has('tidecaller')) { mods.shieldStart = (mods.shieldStart || 1) * 0.5; mods.tideRefill = 8; }
  if (legend.has('rollingpin')) { mods.overkill = 0.5; mods.fullHpCut = 0.85; }
  if (legend.has('goldbelt')) { const n = Math.min(10, Math.floor((run.gold || 0) / 20)); mods.dmg *= 1 + 0.03 * n; mods.aps *= 1 + 0.03 * n; dodge -= 0.01 * n; }
  if (legend.has('excalibread')) mods.carryFocus = true;
  if (legend.has('bell')) mods.bell = { chance: 0.1, time: 2, immune: 5 };
  if (legend.has('gatling')) mods.gatling = { every: 8, slow: 0.3, time: 2, cycle: 7, off: 1 };
  if (legend.has('grandtoad')) mods.grandToad = { chance: 2, time: 4 };
  if (legend.has('hawk')) mods.hawk = { kill: 0.5, slower: 1.2 };
  // the trigger trinkets
  mods.killZap = add.killZap || 0; mods.critGold = add.critGold || 0; mods.ambush = add.ambush || 0;
  mods.killHeal = add.killHeal || 0; mods.killGold = add.killGold || 0; mods.riposte = add.riposte || 0; mods.lowRegen = add.lowRegen || 0;
  if (cs.aps) mods.aps = Math.max(0.3, mods.aps * (1 + cs.aps));
  hpMax = Math.round(hpMax);
  const hero = {
    maxHp: hpMax, hp: Math.min(run.hp, hpMax), armour, dodge: Math.min(0.6, dodge), crit: BASE_HERO.crit + add.crit + (cs.crit || 0), critx: BASE_HERO.critx + add.critx + (cs.critx || 0),
    regen: add.regen, shield: add.shield, target: target || 'front', mods,
    weapon: { ...w, dmg: w.dmg * RARITIES[it.rarity].mult },
  };
  weaponHero(hero);                // what the weapon itself gives its holder (Ninja Stars' dodge, the Sniper's crits)
  // the card board (cards.js) goes on top of the gear
  const out = run.cards && typeof applyCards === 'function' ? applyCards(hero, run.cards, { row: run.row, hp: run.hp, gold: run.gold, stars: run.stars, curses: run.curses, primed: run.primed, hires: run.hires, summonDmg: add.summonDmg || 0, zapDmg: add.zapDmg || 0 }) : hero;
  // allies from legendaries: the Union Card's gulls (upgraded), the Exosuit's bodyguard
  const extra = (legend.has('union') ? [{ unit: 'gull', count: 2, star: true }] : []).concat(legend.has('exosuit') ? [{ unit: 'bigcrab', count: 1 }] : []);
  if (extra.length) out.cards = { ...(out.cards || { list: [], triggers: [], units: cardTotals([], run.row).units, echo: 0, trigCd: 1, zapDmg: 1 }), summons: ((out.cards && out.cards.summons) || []).concat(extra) };
  return out;
}
// The numbers the stats panel shows, from a compiled hero. dps: one target, crits included.
function statSheet(h) {
  const dmg = h.weapon.dmg * h.mods.dmg, aps = h.weapon.aps * h.mods.aps, crit = h.mods.alwaysCrit ? 1 : Math.min(1, h.crit);
  return { maxHp: h.maxHp, shield: heroShield(h), dps: dmg * aps * (1 + crit * (h.critx - 1)), dmg, aps, crit, critx: h.critx, dodge: h.dodge, taken: h.mods.taken };
}
// The same numbers with only the weapon: no gear, cards or class. The rest is what the run added.
const baseSheet = h => statSheet(weaponHero({ ...BASE_HERO, weapon: h.weapon, mods: newMods() }));
// The run as it would be with item it in slot k (for weapons and trinkets an index, for armour its part;
// by default the held weapon's slot, a free trinket slot or else the lowest-rarity trinket). Returns
// { run, slot, was }: slot is the weapon slot to compare holding, was the item it replaces.
function runWith(run, it, k) {
  const r = { ...run, inv: { weapons: run.inv.weapons.slice(), armour: { ...run.inv.armour }, trinkets: run.inv.trinkets.slice() }, loadout: { ...run.loadout } };
  let was = null, slot = run.loadout.weapon;
  if (it.slot === 'weapon') { slot = k == null ? run.loadout.weapon : k; was = r.inv.weapons[slot]; r.inv.weapons[slot] = it; }
  else if (it.slot === 'armour') { was = r.inv.armour[it.part]; r.inv.armour[it.part] = it; }
  else {
    const t = r.inv.trinkets;
    if (k == null) k = t.indexOf(null) >= 0 ? t.indexOf(null) : t.reduce((a, x, i) => x.rarity < t[a].rarity ? i : a, 0);
    was = t[k]; t[k] = it;
  }
  return { run: r, slot, was };
}
// Max HP outside a fight (the HP bar between fights uses the first weapon slot's numbers).
function runMaxHp(run) { return compileHero(run, run.loadout.weapon).maxHp; }
function hasLegendary(run, id) { return allItems(run).some(it => it.legendary === id); }
function runStat(run, k) { return carriedStats(run, run.loadout.weapon).add[k] || 0; }

if (typeof module !== 'undefined') module.exports = { tableAct, applyVariants, CLASSES, CLASS_VARIANT, clsOf, RARITIES, LOOT_TABLES, ARMOUR_PARTS, PARTS, ARMOUR_SCALE, ARMOURS, TRINKETS, AFFIXES, LEGENDARIES, SLOT_WEIGHTS, rollRarity, rollItem, rollAny, upgradeItem, affixOptions, itemBase, slotLabel, itemName, itemIcon, itemLines, armourPieces, allItems, STACKED, stack, TUNING, tuneBonus, compileHero, statSheet, baseSheet, runWith, runMaxHp, hasLegendary, runStat };
