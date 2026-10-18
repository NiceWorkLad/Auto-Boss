// Loot: rarity, item bases, affixes, legendaries, and compileHero(), which turns what the run carries
// into the hero a fight uses. Shared with run.js and balance.js.
// Slots: 2 weapons (only the held one's affixes count), 1 armour, 2 trinkets.

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
  treasure: [5, 30, 40, 20, 5], shop: [12, 34, 36, 16, 2], merchant: [65, 35, 0, 0, 0], event: [30, 40, 22, 7, 1],
  merchantCard: [100, 0, 0, 0, 0], shopCard: [0, 35, 40, 20, 5],
};

const ARMOURS = [
  { id: 'towel', name: 'Beach Towel Cape', icon: 'towel', stats: { maxHp: 16 } },
  { id: 'vest', name: 'Lifeguard Vest', icon: 'vest', stats: { maxHp: 10, armour: 1 } },
  { id: 'plate', name: 'Sandcastle Plate', icon: 'armor', stats: { maxHp: 4, armour: 2 } },
  { id: 'snorkel', name: 'Snorkel Helmet', icon: 'snorkel', stats: { maxHp: 8, dodge: 0.05 } },
];
const TRINKETS = [
  { id: 'shell', name: 'Lucky Seashell', icon: 'shell', stats: { crit: 0.06 } },
  { id: 'sunscreen', name: 'Factor 50', icon: 'sunscreen', stats: { shield: 12 } },
  { id: 'drink', name: 'Coconut Drink', icon: 'drink', stats: { regen: 0.5 } },
  { id: 'duck', name: 'Rubber Duck', icon: 'duck', stats: { thorns: 2 } },
  { id: 'espresso', name: 'Pocket Espresso', icon: 'espresso', stats: { aps: 0.08 } },
  { id: 'feather', name: 'Seagull Feather', icon: 'feather', stats: { dodge: 0.04 } },
  { id: 'map', name: 'Soggy Treasure Map', icon: 'map', stats: { gold: 0.25 } },
];

// Affixes: which slots roll them, the value range (scaled by rarity), how they read.
const AFFIXES = {
  vsFlying: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs flying', suffix: 'of Skyfall' },
  vsArmour: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs armoured', suffix: 'of Can Opening' },
  vsShield: { slots: ['weapon', 'trinket'], lo: 0.25, hi: 0.5, text: v => '+' + pct(v) + ' damage vs shielded', suffix: 'of Popping' },
  vsEvasive: { slots: ['weapon', 'trinket'], lo: 0.2, hi: 0.45, text: v => '+' + pct(v) + ' damage vs evasive', suffix: 'of Homing' },
  vsGroup: { slots: ['weapon', 'trinket'], lo: 0.15, hi: 0.35, text: v => '+' + pct(v) + ' damage while 2+ enemies stand', suffix: 'of Crowds' },
  pierce: { slots: ['weapon', 'trinket'], lo: 1, hi: 3, int: true, text: v => '+' + v + ' armour pierce', suffix: 'of Piercing' },
  cleave: { slots: ['weapon'], shape: 'cleave', lo: 1, hi: 1, int: true, text: () => 'Cleave also hits a third enemy', suffix: 'of Sweeping' },
  dmg: { slots: ['weapon'], lo: 0.1, hi: 0.25, text: v => '+' + pct(v) + ' damage', suffix: 'of Oomph' },
  crit: { slots: ['weapon', 'trinket'], lo: 0.05, hi: 0.12, text: v => '+' + pct(v) + ' crit chance', suffix: 'of Luck' },
  critx: { slots: ['weapon'], lo: 0.3, hi: 0.7, text: v => '+' + v.toFixed(1) + '× crit damage', suffix: 'of Ouch' },
  aps: { slots: ['weapon', 'trinket'], lo: 0.06, hi: 0.15, text: v => '+' + pct(v) + ' attack speed', suffix: 'of Espresso' },
  lifesteal: { slots: ['weapon'], lo: 0.03, hi: 0.07, text: v => pct(v) + ' lifesteal', suffix: 'of Leeches' },
  maxHp: { slots: ['armour', 'trinket'], lo: 8, hi: 22, int: true, text: v => '+' + v + ' max HP', suffix: 'of Gelato' },
  armour: { slots: ['armour'], lo: 1, hi: 2, int: true, text: v => '+' + v + ' armour', suffix: 'of Sandbags' },
  dodge: { slots: ['armour', 'trinket'], lo: 0.03, hi: 0.07, text: v => '+' + pct(v) + ' dodge', suffix: 'of Wiggling' },
  shield: { slots: ['armour', 'trinket'], lo: 10, hi: 25, int: true, text: v => 'Start fights with a ' + v + ' HP shield', suffix: 'of Sunscreen' },
  postHeal: { slots: ['armour', 'trinket'], lo: 4, hi: 10, int: true, text: v => 'Heal ' + v + ' HP after each win', suffix: 'of Naps' },
  thorns: { slots: ['armour'], lo: 1, hi: 3, int: true, text: v => 'Deal ' + v + ' back to whoever hits you', suffix: 'of Urchins' },
  gold: { slots: ['trinket'], lo: 0.15, hi: 0.3, text: v => '+' + pct(v) + ' gold', suffix: 'of Tourists' },
};

// Legendaries always cost you something.
const LEGENDARIES = {
  chaos: { slots: ['weapon', 'trinket'], name: 'Chorus of Chaos', text: 'Every attack hits all enemies, but you take 30% more damage' },
  glass: { slots: ['trinket', 'weapon'], name: 'Glass Cannon', text: '+60% damage, but -40% max HP' },
  slowhands: { slots: ['weapon'], name: 'Slow Hands', text: 'Every hit crits, but -40% attack speed', excludes: ['crit', 'aps'] },
  bloodpact: { slots: ['armour'], name: 'Bloodpact Bandana', text: '20% lifesteal, but resting can no longer heal you' },
  feather: { slots: ['armour'], name: 'Featherweight Speedo', text: '+25% dodge, but your armour is always 0', excludes: ['armour'], bases: ['towel', 'snorkel'] },
};

// Classes: chosen before the weapon. Stats feed compileHero; the rest are hooks the run logic reads.
// Weapons are never class-locked. CLASS_VARIANT lets balance.js try the Roadie's alternative passive.
const CLASSES = {
  bruiser: { name: 'Bruiser', icon: 'clsBruiser', blurb: 'Big, armoured and hard to keep down.',
    lines: ['+10 max HP, +0.3 armour, but -10% attack speed', 'Heals 2% of max HP more after each won fight', 'Heals at shops and the merchant cost 30% less'],
    stats: { maxHp: 10, armour: 0.3, aps: -0.1 }, winHeal: 0.02, healDiscount: 0.3 },
  hustler: { name: 'Hustler', icon: 'clsHustler', blurb: 'Always has an angle, rarely has HP.',
    lines: ['-10 max HP', '10% interest on unspent gold every row (up to 8)', 'Merchant prices 20% lower', 'Can sell items and cards at the merchant and shops'],
    stats: { maxHp: -10 }, interest: 0.1, interestCap: 8, merchantDiscount: 0.2, canSell: true },
  roadie: { name: 'Roadie', icon: 'clsRoadie', blurb: 'Carries the gear. All of it.',
    lines: ['Base stats', 'A third weapon slot'],
    stats: {}, weaponSlots: 3 },
  glass: { name: 'Glass Cannon', icon: 'clsGlass', blurb: 'Hits like a bus, folds like a deckchair.',
    lines: ['-25 max HP', '+10% crit chance, +0.6× crit damage', 'Starts with a 4th card slot'],
    stats: { maxHp: -25, crit: 0.1, critx: 0.6 }, cardSlots: 1 },
};
for (const id in CLASSES) CLASSES[id].id = id;
const CLASS_VARIANT = { roadie: 'slot' };   // 'slot' (a third weapon) or 'swap' (one automatic mid-fight swap)
const clsOf = run => (run && run.cls && CLASSES[run.cls]) || null;

const affixValue = (a, rarity, roll) => {
  const v = a.lo + (a.hi - a.lo) * Math.min(1, rarity / 4 + roll * 0.35);
  return a.int ? Math.round(v) : Math.round(v * 1000) / 1000;
};

function rollRarity(rng, table) {
  const w = LOOT_TABLES[table];
  let x = rng.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((x -= w[i]) < 0) return i;
  return 0;
}

// A new item. slot: 'weapon' | 'armour' | 'trinket'; base: a weapon id or base id (random if omitted).
function rollItem(rng, slot, rarity, base) {
  const pool = slot === 'weapon' ? WEAPONS : slot === 'armour' ? ARMOURS : TRINKETS;
  const legendary = rarity === 4 ? rng.pick(Object.keys(LEGENDARIES).filter(k => LEGENDARIES[k].slots.includes(slot) && (!base || !LEGENDARIES[k].bases || LEGENDARIES[k].bases.includes(base)))) : null;
  base = base || rng.pick(pool.filter(b => !legendary || !LEGENDARIES[legendary].bases || LEGENDARIES[legendary].bases.includes(b.id))).id;
  const it = { slot, base, rarity, affixes: [] };
  if (legendary) it.legendary = legendary;
  // no affix that repeats the base stat, needs a different attack shape, or fights the legendary
  const shape = slot === 'weapon' ? weaponById(base).shape : null, baseStats = slot === 'weapon' ? {} : itemBase(it).stats;
  const excluded = (it.legendary && LEGENDARIES[it.legendary].excludes) || [];
  const options = Object.keys(AFFIXES).filter(k => AFFIXES[k].slots.includes(slot) && (!AFFIXES[k].shape || AFFIXES[k].shape === shape) && !(k in baseStats) && !excluded.includes(k));
  rng.shuffle(options);
  for (const k of options.slice(0, RARITIES[rarity].affixes)) it.affixes.push({ id: k, v: affixValue(AFFIXES[k], rarity, rng.next()) });
  return it;
}
// Any slot, weighted: weapons a little rarer than the rest since you only hold one.
function rollAny(rng, table) {
  const x = rng.next(), slot = x < 0.34 ? 'weapon' : x < 0.6 ? 'armour' : 'trinket';
  return rollItem(rng, slot, rollRarity(rng, table));
}

// One rarity up (Epic is the ceiling: legendaries are only found), adding an affix and re-rolling values.
function upgradeItem(rng, it) {
  if (it.rarity >= 3) return false;
  const up = rollItem(rng, it.slot, it.rarity + 1, it.base);
  const keep = it.affixes.map(a => a.id);
  up.affixes.sort((a, b) => keep.includes(b.id) - keep.includes(a.id));
  it.rarity = up.rarity; it.affixes = up.affixes;
  return true;
}

function itemBase(it) { return it.slot === 'weapon' ? weaponById(it.base) : (it.slot === 'armour' ? ARMOURS : TRINKETS).find(b => b.id === it.base); }
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
    for (const k in st) lines.push(AFFIXES[k] ? AFFIXES[k].text(st[k]) : k === 'regen' ? 'Regenerate ' + st[k] + ' HP/s' : k === 'aps' ? '+' + pct(st[k]) + ' attack speed' : k);
  }
  for (const a of it.affixes) lines.push(AFFIXES[a.id].text(a.v));
  if (it.legendary) lines.push('★ ' + LEGENDARIES[it.legendary].text);
  return lines;
}
// Armour and trinket base stats grow with rarity.
function scaledBase(it) {
  const st = { ...itemBase(it).stats }, m = RARITIES[it.rarity].mult;
  for (const k in st) st[k] = Number.isInteger(st[k]) ? Math.round(st[k] * m) : Math.round(st[k] * m * 1000) / 1000;
  return st;
}

// Every stat bonus the run carries: armour, trinkets, and the held weapon's affixes.
function carriedStats(run, weaponSlot) {
  const add = { maxHp: 0, armour: 0, dodge: 0, crit: 0, critx: 0, shield: 0, regen: 0, aps: 0, dmg: 0, lifesteal: 0, thorns: 0, postHeal: 0, gold: 0, pierce: 0, cleave: 0, vs: {} };
  const legend = new Set();
  const held = run.inv.weapons[weaponSlot];
  const worn = [run.inv.armour, ...run.inv.trinkets, held].filter(Boolean);
  for (const it of worn) {
    if (it.slot !== 'weapon') for (const [k, v] of Object.entries(scaledBase(it))) add[k] += v;
    for (const a of it.affixes) {
      if (a.id.startsWith('vs')) { const t = { vsFlying: 'flying', vsArmour: 'armour', vsShield: 'shield', vsEvasive: 'evasive', vsGroup: 'group' }[a.id]; add.vs[t] = (add.vs[t] || 0) + a.v; }
      else add[a.id] += a.v;
    }
    if (it.legendary) legend.add(it.legendary);
  }
  return { add, legend };
}

// The hero a fight uses. weaponSlot: 0 or 1.
function compileHero(run, weaponSlot, target) {
  const it = run.inv.weapons[weaponSlot] || run.inv.weapons.find(Boolean) || { slot: 'weapon', base: 'sword', rarity: 0, affixes: [] };   // empty-handed before the first pick
  const { add, legend } = carriedStats(run, run.inv.weapons.indexOf(it));
  const w = weaponById(it.base);
  const mods = { ...newMods(), vs: add.vs, pierce: add.pierce, cleave: add.cleave, aps: 1 + add.aps, lifesteal: add.lifesteal, thorns: add.thorns, dmg: 1 + add.dmg };
  const cs = (clsOf(run) || {}).stats || {};
  let hpMax = BASE_HERO.maxHp + run.maxHpBonus + add.maxHp + (cs.maxHp || 0), armour = add.armour + (cs.armour || 0), dodge = BASE_HERO.dodge + add.dodge;
  if (legend.has('chaos')) { mods.allHit = true; mods.taken *= 1.3; }
  if (legend.has('glass')) { mods.dmg *= 1.6; hpMax *= 0.6; }
  if (legend.has('slowhands')) { mods.alwaysCrit = true; mods.aps *= 0.6; }
  if (legend.has('bloodpact')) mods.lifesteal += 0.2;
  if (legend.has('feather')) { dodge += 0.25; armour = 0; }
  if (cs.aps) mods.aps = Math.max(0.3, mods.aps + cs.aps);
  hpMax = Math.round(hpMax);
  const hero = {
    maxHp: hpMax, hp: Math.min(run.hp, hpMax), armour, dodge: Math.min(0.6, dodge), crit: BASE_HERO.crit + add.crit + (cs.crit || 0), critx: BASE_HERO.critx + add.critx + (cs.critx || 0),
    regen: add.regen, shield: add.shield, target: target || 'front', mods, armourLock: legend.has('feather'),
    weapon: { ...w, dmg: w.dmg * RARITIES[it.rarity].mult },
  };
  // the card board (cards.js) goes on top of the gear
  return run.cards && typeof applyCards === 'function' ? applyCards(hero, run.cards, { row: run.row, hp: run.hp }) : hero;
}
// Max HP outside a fight (the HP bar between fights uses the first weapon slot's numbers).
function runMaxHp(run) { return compileHero(run, run.loadout.weapon).maxHp; }
function hasLegendary(run, id) { return [run.inv.armour, ...run.inv.trinkets, ...run.inv.weapons].some(it => it && it.legendary === id); }
function runStat(run, k) { return carriedStats(run, run.loadout.weapon).add[k] || 0; }

if (typeof module !== 'undefined') module.exports = { CLASSES, CLASS_VARIANT, clsOf, RARITIES, LOOT_TABLES, ARMOURS, TRINKETS, AFFIXES, LEGENDARIES, rollRarity, rollItem, rollAny, upgradeItem, itemBase, itemName, itemIcon, itemLines, compileHero, runMaxHp, hasLegendary, runStat };
