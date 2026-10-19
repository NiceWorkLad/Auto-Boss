// Runs: seeded map generation, what each node does, and the run state machine. Pure data and no
// DOM, so balance.js can play whole runs with it. Every node gets its own seed when the map is made,
// so the same run seed gives the same map, encounters, offers and fights.
//
// run.screen says what the player is looking at; the UI renders it and calls the actions below.
// A fight in progress isn't saved: run.screen stays 'prefight' until finishFight(), so a refresh
// mid-fight goes back to the pre-fight screen.

const RUN_VERSION = 9;        // bump when the run state's shape changes; older saves are discarded (5: four armour parts, card stars; 6: the new cast's ids; 7: acts; 8: run.act and Overtime; 9: the card collection; ui.js migrates 7 and 8)
const MAP_ROWS = 11;          // rows 0-9 are nodes (row 9 all rest), row 10 is the boss
const LANES = 4;
const START_HP = 100;
const NODE_TYPES = {
  fight: { name: 'Fight', icon: 'sword' },
  elite: { name: 'Elite', icon: 'brutal' },
  shop: { name: 'Shop', icon: 'greed' },
  rest: { name: 'Rest', icon: 'campfire' },
  treasure: { name: 'Treasure', icon: 'chest' },
  event: { name: 'Event', icon: 'question' },
  boss: { name: 'Boss', icon: 'crown' },
};

// The economy as data: what fights pay, what things cost. balance.js can override it with ECON='{...}'.
const ECON = {
  fightGold: [15, 25], eliteGold: [45, 60],      // paid for every win, on top of the item pick
  skipBonus: 0.6,                                 // skipping the item pays this share of the fight's gold again
  cleanBonus: { fight: 5, elite: 15 },            // won without dropping below half HP
  treasureGold: [6, 14],
  prices: [40, 70, 110, 170, 260],               // map shop prices by rarity
  merchantMarkup: 1.25, merchantItems: 3, merchantHeal: { share: 0.25, cost: 30 },
  shopHeal: { share: 0.45, cost: 20 }, reroll: { cost: 15, step: 10 },
  forge: [0, 45, 80, 130, 220],                   // cost to forge an item up to Uncommon, Rare, Epic, Legendary
  merchantForge: 1.3,                              // the merchant's forge costs this much more
  cardStar: [25, 40, 60, 85, 120],                 // cost to upgrade (★) a card, by its rarity; the merchant adds merchantForge
  sellShare: 0.4,                                  // selling pays this share of the buy price, plus of any forging or ★ paid for
  bankShare: 0.5,                                  // the lifetime bank (profile.js) gets this share of everything a run earned
  restHeal: 0.35, restUpgrade: false,              // rest is heal-only; the forge does upgrades
  // Acts: a run chains the zones. Indexed by act (0 = act 1). Gold from fights and chests scales up,
  // the forge can go further and costs more, the card board gets more room, and you get a breather.
  actGold: [1, 1.4], forgeCap: [3, 4], actForge: [1, 1.25], actCardSlots: 2, actHeal: 0.3,
  // Overtime: after the last zone's boss you can take the win or keep going. The zones loop. Every
  // Overtime act, enemies get this much more HP and damage on top of the zone's own Overtime floor
  // (zone.tune.ot, which brings the beach up to the jungle), enchantments are this much more likely and
  // gold this much more; every lap the card board gets one more slot.
  overtime: { hp: 0.5, atk: 0.35, ench: 0.5, gold: 0.2 },
};
const goldRange = (rng, [lo, hi]) => lo + rng.int(hi - lo + 1);

// The card collection: owned is every card the run has (run.cards, the board, is the ones switched on);
// curses is each cursed card's { age, cleansed }; primed the one-use cards spent on the next fight;
// nextDraw a draw rolled early (by a peek), used by the next draw; draws counts early rolls.
const CARD_STATE = () => ({ owned: [], curses: {}, primed: [], nextDraw: null, draws: 0 });
// Everything a card total needs from the run besides the board.
const cardMore = run => ({ curses: run.curses, primed: run.primed });
const runCardStat = (run, k) => cardStat(run.cards, k, run.stars, cardMore(run));

function newRun(seed) {
  seed = (seed >>> 0) || 1;
  const rng = makeRng(seed), zone = ZONES[0];
  const run = { v: RUN_VERSION, seed, zone: 0, hp: START_HP, maxHpBonus: 0, gold: 0, earned: 0, spent: 0, row: -1, at: null, visited: [],
    map: genMap(rng, zone), inv: { weapons: [null, null], armour: { head: null, body: null, legs: null, feet: null }, trinkets: [null, null] },
    act: 0, loadout: { weapon: 0, target: 'front' }, seen: {}, cleared: 0, fights: 0, over: null, screen: null, merchant: null,
    cards: [], stars: [], cardSlots: CARD_RULES.startSlots, cls: null, ...CARD_STATE() };
  run.screen = { type: 'class', offers: rng.shuffle(weaponsFor(1).map(w => w.id)).slice(0, 3).map(id => rollItem(rng, 'weapon', 0, id)) };
  run.merchant = merchantStock(run, seed ^ 0x6d657263);
  return run;
}
// The act-dependent bits: the act's loot table (act 2 has its own, rarer ones), its gold multiplier,
// the card board's cap.
// run.act counts acts played (0 = act 1); run.zone is the zone being played. They part in Overtime,
// when act 3 is the beach again. lap: how many times round the zones (0 before Overtime).
const actIdx = run => run.act != null ? run.act : run.zone;
const lapOf = run => Math.floor(actIdx(run) / ZONES.length);
const actOf = run => actIdx(run) + 1;
const actStep = (run, list) => list[Math.min(actIdx(run), list.length - 1)];
const lootTable = (run, name) => actIdx(run) > 0 && LOOT_TABLES[name + '2'] ? name + '2' : name;
// Overtime acts played so far, counting this one (0 before Overtime).
const otActs = run => Math.max(0, actIdx(run) - ZONES.length + 1);
const actGold = run => actStep(run, ECON.actGold) * (1 + ECON.overtime.gold * otActs(run));
const cardCap = run => CARD_RULES.maxSlots + ECON.actCardSlots * Math.min(actIdx(run), ZONES.length - 1) + lapOf(run);

// All gold in and out goes through these, so the run knows what it earned and spent.
function earn(run, n) { n = Math.max(0, Math.round(n)); run.gold += n; run.earned += n; return n; }
function spend(run, n) { if (run.gold < n) return false; run.gold -= n; run.spent += n; return true; }

// The map: rows of 2-4 nodes in 4 lanes; links go to the same or a neighbouring lane, so paths cross.
function genMap(rng, zone) {
  const rows = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    let lanes;
    if (r === MAP_ROWS - 1) lanes = [1.5];
    else { const n = r === 0 ? 3 : 2 + rng.int(3); lanes = rng.shuffle([0, 1, 2, 3]).slice(0, n).sort(); }
    rows.push(lanes.map((lane, k) => ({ id: r + '-' + k, row: r, lane, type: nodeType(rng, r), next: [], seed: rng.int(2147483647) })));
  }
  for (let r = 0; r < MAP_ROWS - 1; r++) {
    const here = rows[r], there = rows[r + 1];
    for (const n of here) {
      const near = there.filter(m => Math.abs(m.lane - n.lane) <= 1.5);
      const pick = near.length ? rng.shuffle(near.slice()).slice(0, 1 + rng.int(Math.min(2, near.length))) : [there.reduce((a, m) => Math.abs(m.lane - n.lane) < Math.abs(a.lane - n.lane) ? m : a)];
      n.next = pick.map(m => m.id);
    }
    for (const m of there) if (!here.some(n => n.next.includes(m.id))) {
      here.reduce((a, n) => Math.abs(n.lane - m.lane) < Math.abs(a.lane - m.lane) ? n : a).next.push(m.id);
    }
  }
  // every map gets at least one elite, shop and event in the middle rows
  for (const t of ['elite', 'shop', 'event']) if (!rows.some(row => row.some(n => n.type === t))) {
    const row = rows[3 + rng.int(5)]; row[rng.int(row.length)].type = t;
  }
  return { rows };
}

function nodeType(rng, r) {
  if (r === 0) return 'fight';
  if (r === MAP_ROWS - 2) return 'rest';
  if (r === MAP_ROWS - 1) return 'boss';
  if (r === 5) return 'treasure';
  const w = [['fight', 46], ['event', 18], ['elite', r >= 3 ? 16 : 0], ['shop', r >= 2 && r <= 8 ? 14 : 0], ['treasure', 6], ['rest', r >= 4 ? 8 : 0]];
  let x = rng.next() * w.reduce((s, [, n]) => s + n, 0);
  for (const [t, n] of w) if ((x -= n) < 0) return t;
  return 'fight';
}

const nodeById = (run, id) => { for (const row of run.map.rows) for (const n of row) if (n.id === id) return n; return null; };
// The nodes the player can move to next.
function reachable(run) {
  if (run.at == null) return run.map.rows[0].map(n => n.id);
  return nodeById(run, run.at).next;
}
// Every node that can still be reached after the node id (all of them before the run's first step).
function ahead(run, id) {
  const out = new Set(), todo = id == null ? run.map.rows[0].map(n => n.id) : nodeById(run, id).next.slice();
  for (let x; (x = todo.pop()) != null;) if (!out.has(x)) { out.add(x); todo.push(...nodeById(run, x).next); }
  return out;
}
const maxHp = run => runMaxHp(run);
// The hero for the coming fight: the chosen weapon slot plus everything carried (items.js). A Roadie on
// the swap variant also carries the other weapon, compiled, for one mid-fight swap.
function heroFor(run) {
  const h = compileHero(run, run.loadout.weapon, run.loadout.target);
  if (run.cls === 'roadie' && CLASS_VARIANT.roadie === 'swap') {
    const k = run.inv.weapons.findIndex((w, i) => w && i !== run.loadout.weapon);
    if (k >= 0) { const o = compileHero(run, k, run.loadout.target); h.swap = { weapon: o.weapon, mods: o.mods, crit: o.crit, critx: o.critx }; }
  }
  return h;
}

// Gold multiplier from gear and cards; flat gold per fight from cards.
const goldMult = run => 1 + runStat(run, 'gold') + runCardStat(run, 'gold');

// Inventory ---------------------------------------------------------------------------------

// Where an item (or card) would go: a free slot index (the part name for armour), or null when full.
function freeSlot(run, it) {
  if (it.slot === 'armour') return run.inv.armour[it.part] ? null : it.part;
  const list = it.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
  const k = list.indexOf(null);
  return k < 0 ? null : k;
}
// What a new item would compete with when its slots are full: its armour part, or the slot list.
const slotList = (run, it) => it.slot === 'armour' ? [run.inv.armour[it.part]] : it.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
function putItem(run, it, k) {
  const before = maxHp(run);
  if (it.slot === 'armour') run.inv.armour[it.part] = it;
  else (it.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets)[k] = it;
  if (!run.inv.weapons[run.loadout.weapon]) run.loadout.weapon = run.inv.weapons.findIndex(Boolean);
  const gained = maxHp(run) - before;            // more max HP comes with that much HP; less clamps
  run.hp = Math.max(1, Math.min(maxHp(run), run.hp + Math.max(0, gained)));
}
// Take an item into the inventory, or ask what to replace. then: the screen to go to afterwards.
// A card always fits: it joins the collection.
function gain(run, it, then) {
  if (it.slot === 'card') { gainCard(run, it.id); run.screen = then; return; }
  const k = freeSlot(run, it);
  if (k != null) { putItem(run, it, k); run.screen = then; }
  else run.screen = { type: 'replace', item: it, then };
}
// k: the slot to replace (for armour the only choice is its part), or null to keep what you have.
function replaceItem(run, k) {
  const s = run.screen;
  if (s.type !== 'replace') return;
  if (k != null && s.item.slot === 'armour') k = s.item.part;
  if (k != null) putItem(run, s.item, k);
  run.screen = s.then;
}

// Offers -------------------------------------------------------------------------------------
// No offer list holds two items with the same base or the same card, a card you already hold, or a copy
// (same base and rarity) of something you carry. roll() makes one offer; it re-rolls from the same rng,
// so the seed still decides everything, and gives up on the rule after a few tries rather than looping.
function isFresh(run, taken, it) {
  if (it.slot === 'card') return !run.owned.includes(it.id) && !taken.some(x => x.slot === 'card' && x.id === it.id);
  return !taken.some(x => x.slot !== 'card' && x.base === it.base) && !allItems(run).some(x => x.base === it.base && x.rarity === it.rarity);
}
function freshOffer(run, taken, roll) {
  let it = roll();
  for (let k = 0; k < 20 && !isFresh(run, taken, it); k++) it = roll();
  taken.push(it);
  return it;
}

// Actions ------------------------------------------------------------------------------------

// The class comes first; the weapon offers were already rolled with the map, so the seed gives the same run.
function chooseClass(run, id) {
  const c = CLASSES[id];
  if (run.screen.type !== 'class' || !c) return;
  run.cls = id;
  if (c.weaponSlots && CLASS_VARIANT.roadie !== 'swap') while (run.inv.weapons.length < c.weaponSlots) run.inv.weapons.push(null);
  run.cardSlots += c.cardSlots || 0;
  run.hp = maxHp(run);
  run.screen = { type: 'start', offers: run.screen.offers };
}
function chooseStart(run, i) {
  if (run.screen.type !== 'start') return;
  run.inv.weapons[0] = run.screen.offers[i];
  run.screen = { type: 'map' };
}

// The enemies a fight node puts up, rebuilt the same way every time from the node's seed.
// Elites and the boss may carry enchantments (zones.js), rolled from their own seed so they show on the map.
function encounterFor(run, node) {
  const zone = ZONES[run.zone], rng = makeRng(node.seed);
  let ids;
  if (node.type === 'boss') ids = [zone.boss];
  else if (node.type === 'elite') ids = [zone.elites[rng.int(zone.elites.length)]];
  else { const band = zone.groups.filter(b => b.from <= node.row).pop(); ids = rng.pick(band.list); }
  const fightSeed = rng.int(2147483647), lap = lapOf(run), O = ECON.overtime, n = otActs(run), F = zone.tune.ot || { hp: 1, atk: 1 };
  // Overtime: the zone's floor, then tougher enemies and more enchantments every Overtime act
  const ot = d => lap ? { ...d, hp: Math.round(d.hp * F.hp * (1 + O.hp * n)), atk: Math.round(d.atk * F.atk * (1 + O.atk * n) * 10) / 10 } : d;
  const enchZone = lap ? { ...zone, tune: { ...zone.tune, enchant: (zone.tune.enchant == null ? 1 : zone.tune.enchant) * (1 + O.ench * n) } } : zone;
  let defs = ids.map(id => ot(scaledEnemy(ENEMIES[id], node.row, zone))), ench = [];
  if (node.type === 'boss' || node.type === 'elite') {
    ench = run.noEnchant ? [] : rollEnchantments(makeRng(node.seed ^ 0x454e4348), node.type, node.row, enchZone);
    if (ench.length) {
      const adds = [];
      for (const id of ench) for (const [a, n] of ENCHANTMENTS[id].mod.adds || []) for (let k = 0; k < n; k++) adds.push(ot(scaledEnemy(ENEMIES[a], node.row, zone)));
      defs = adds.concat(enchantDef(defs[0], ench));
    }
  }
  return { ids, defs, ench, fightSeed };
}
function encounterIntro(defs) {
  const lead = defs.find(d => d.boss || d.elite) || defs.find(d => !d.guard) || defs[0];
  return lead.intro;
}

function moveTo(run, id) {
  if (run.screen.type !== 'map' || !reachable(run).includes(id)) return;
  const node = nodeById(run, id);
  const C = clsOf(run);
  if (C && C.interest && run.row >= 0) earn(run, Math.min(C.interestCap, Math.floor(run.gold * C.interest)));     // Hustler interest
  run.at = id; run.row = node.row; run.visited.push(id);
  run.merchant = merchantStock(run, node.seed ^ 0x6d657263);     // a new row, a new merchant stock
  const rng = makeRng(node.seed ^ 0x5bd1e995);
  if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') run.screen = { type: 'prefight', node: id };
  else if (node.type === 'rest') run.screen = { type: 'rest', seed: rng.int(2147483647) };
  else if (node.type === 'treasure') {
    const card = rng.next() < CARD_RULES.offer.treasure, offers = [];
    for (let k = 0; k < 3; k++) freshOffer(run, offers, () => card && k === 2 ? rollCard(rng, lootTable(run, 'treasure'), cardOk(run)) : rollAny(rng, lootTable(run, 'treasure')));
    run.screen = { type: 'treasure', offers, gold: earn(run, goldRange(rng, ECON.treasureGold) * goldMult(run) * actGold(run)) };
  } else if (node.type === 'shop') run.screen = { type: 'shop', stock: shopStock(run, rng), healCost: healPrice(run, ECON.shopHeal.cost), healed: false, rerollCost: ECON.reroll.cost, forged: 0, seed: rng.int(2147483647) };
  else if (node.type === 'event') { const ev = rng.pick(ZONES[run.zone].events); run.screen = { type: 'event', id: ev.id, seed: rng.int(2147483647) }; }
}

function setLoadout(run, weapon, target) {
  if (weapon != null && run.inv.weapons[weapon]) holdWeapon(run, weapon);
  if (target) run.loadout.target = target;
}
// Max HP depends on the held weapon, so a swap keeps the HP share: 65/65 becomes 100/100 and back.
// The share comes from the HP before the first of a string of swaps (run.hpAnchor), so swapping back
// and forth never drifts: rounding can't gain or lose HP. Any other HP change starts a new anchor.
// Switching cards on and off (some change max HP) keeps the share the same way.
function holdWeapon(run, k) { keepHpShare(run, () => { run.loadout.weapon = k; }); }
function keepHpShare(run, change) {
  const max = maxHp(run), a = run.hpAnchor, from = a && a.out === run.hp && a.outMax === max ? a : { hp: run.hp, max };
  change();
  const m = maxHp(run);
  if (run.hp > 0) run.hp = Math.max(1, Math.min(m, Math.round(from.hp / from.max * m)));
  run.hpAnchor = { hp: from.hp, max: from.max, out: run.hp, outMax: m };
}

// After the fight plays out: f is the finished fight from rules.js.
function finishFight(run, f) {
  const node = nodeById(run, run.at);
  run.fights++;
  for (const e of f.enemies) if (e.phase > 0 || e.def.boss) run.seen[e.def.id] = true;
  run.hp = Math.max(0, Math.round(f.hero.hp));
  if (f.gold) earn(run, f.gold * goldMult(run));          // gold that card triggers made mid-fight
  keepHpShare(run, () => { run.primed = []; });          // one-use buffs last one fight
  if (f.won) for (const id of run.owned) if (run.curses[id]) run.curses[id].age++;     // curses grow with every fight held
  if (!f.won) { run.over = { won: false, cause: f.cause || 'knocked out' }; run.screen = { type: 'summary' }; return; }
  run.cleared++; run.actWins = (run.actWins || 0) + 1;
  if (node.type === 'boss') {
    run.acts = (run.acts || []).concat(ZONES[run.zone].id);
    const next = (run.zone + 1) % ZONES.length;
    if (!run.victory && next === 0) { run.victory = true; run.screen = { type: 'victory' }; return; }   // the last zone: take the win or keep going
    run.screen = { type: 'act', next }; return;                                                    // on to the next act
  }
  const heal = runStat(run, 'postHeal') + (ZONES[run.zone].tune.winHeal * runCardStat(run, 'winHealMult') + runCardStat(run, 'postHealShare') + ((clsOf(run) || {}).winHeal || 0)) * maxHp(run);
  run.hp = Math.min(maxHp(run), run.hp + Math.round(heal));   // catch your breath
  const rng = makeRng(node.seed ^ 0x27d4eb2f), table = lootTable(run, node.type === 'elite' ? 'elite' : node.row >= 6 ? 'fightLate' : 'fight');
  const elite = node.type === 'elite', gm = goldMult(run);
  if (elite) run.cardSlots = Math.min(cardCap(run), run.cardSlots + 1);     // each elite opens a card slot
  const enchGold = (encounterFor(run, node).ench || []).reduce((g, id) => g + (ENCHANTMENTS[id].mod.gold || 0), 0);
  const base = goldRange(rng, elite ? ECON.eliteGold : ECON.fightGold) + runCardStat(run, 'goldFight') + enchGold, clean = f.low >= 0.5 ? ECON.cleanBonus[elite ? 'elite' : 'fight'] : 0;
  const gold = earn(run, (base + clean) * gm * actGold(run)), skip = Math.round(base * ECON.skipBonus * gm * actGold(run));
  // the first reward always offers a second kind of weapon; then a card draw, apart from the items
  const held = run.inv.weapons.filter(Boolean).map(w => w.base), offers = [];
  // the first win of a new act offers one of that act's new weapons
  const actNew = weaponsFor(actOf(run)).filter(w => (w.act || 1) === actOf(run) && w.act > 1 && !held.includes(w.id));
  for (let k = 0; k < 3; k++) freshOffer(run, offers, () =>
    k === 0 && actIdx(run) > 0 && run.actWins === 1 && actNew.length ? rollItem(rng, 'weapon', rollRarity(rng, table), rng.pick(actNew).id)
      : k === 0 && run.cleared === 1 ? rollItem(rng, 'weapon', rollRarity(rng, table), rng.pick(weaponsFor(actOf(run)).filter(w => !held.includes(w.id))).id)
      : rollAny(rng, table));
  run.screen = { type: 'reward', gold, clean: clean > 0, skip, elite, offers, draw: takeNextDraw(run, rng, elite ? 'eliteDraw' : 'draw') };
}

// Pick one of the offered items (i), or skip them for bonus gold (i = null). The fight's gold is already paid.
function takeReward(run, i) {
  const s = run.screen;
  if (s.type !== 'reward') return;
  const then = s.draw ? { type: 'draw', offers: s.draw, then: { type: 'map' } } : { type: 'map' };
  if (i == null) { earn(run, s.skip); run.screen = then; }
  else if (s.offers[i]) gain(run, s.offers[i], then);
}

// Cards ----------------------------------------------------------------------------------------

// A draw: CARD_RULES.draw cards to choose one from, none you own.
function rollDraw(run, rng, table, rarity) {
  const offers = [];
  for (let k = 0; k < CARD_RULES.draw; k++) freshOffer(run, offers, () => rollCard(rng, lootTable(run, table), cardOk(run), rarity));
  return offers;
}
// The next draw: the one a peek already rolled (less any card you've got since, topped back up), else
// a fresh one.
function takeNextDraw(run, rng, table) {
  const d = (run.nextDraw || []).filter(o => !run.owned.includes(o.id));
  run.nextDraw = null;
  while (d.length < CARD_RULES.draw) freshOffer(run, d, () => rollCard(rng, lootTable(run, table), cardOk(run)));
  return d;
}
// Draws rolled away from a fight (one-use cards) get their own stream from the seed.
const drawRng = run => makeRng((run.seed ^ (0x0d4a3500 + ++run.draws * 7919)) >>> 0);
// Pick card i from a draw, or pass (i = null). A draw may have more to follow (Double Scoop).
function takeDraw(run, i) {
  const s = run.screen;
  if (s.type !== 'draw') return;
  if (i != null && s.offers[i]) gainCard(run, s.offers[i].id);
  run.screen = s.more ? { type: 'draw', offers: rollDraw(run, drawRng(run), 'draw'), more: s.more - 1, then: s.then } : s.then;
}
// A card joins the collection, and switches on if a slot is free (one-use cards never go on the board).
function gainCard(run, id) {
  if (run.owned.includes(id)) return;
  run.owned.push(id);
  if (CARDS[id].curse) run.curses[id] = { age: 0 };
  if (CARDS[id].type !== 'oneuse' && run.cards.length < run.cardSlots) keepHpShare(run, () => run.cards.push(id));
}
// Where the board and one-use cards can be changed: between stops, and before a fight starts.
const cardSite = run => ['map', 'prefight'].includes(run.screen.type);
// Switch a card on (if a slot is free) or off.
function toggleCard(run, id) {
  if (!cardSite(run) || !run.owned.includes(id) || CARDS[id].type === 'oneuse') return;
  if (run.cards.includes(id)) keepHpShare(run, () => { run.cards = run.cards.filter(x => x !== id); });
  else if (run.cards.length < run.cardSlots) keepHpShare(run, () => run.cards.push(id));
}
// Spend a one-use card. Draws, peeks, discards and cleanses open their own screen and come back here.
function useCard(run, id) {
  const c = CARDS[id], u = c && c.use, back = run.screen;
  if (!cardSite(run) || !u || !run.owned.includes(id)) return;
  if (u.kind === 'cleanse' && !cursedCards(run).length) return;            // nothing to cleanse
  if (u.kind === 'discard' && !run.owned.some(x => x !== id)) return;      // nothing to throw back
  run.owned = run.owned.filter(x => x !== id);
  if (u.kind === 'prime') keepHpShare(run, () => run.primed.push(id));
  else if (u.kind === 'heal') run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * u.share));
  else if (u.kind === 'draw') run.screen = { type: 'draw', offers: rollDraw(run, drawRng(run), 'draw'), more: (u.n || 1) - 1, then: back };
  else if (u.kind === 'peek') {
    if (!run.nextDraw) run.nextDraw = rollDraw(run, drawRng(run), 'draw');
    run.screen = { type: 'peek', then: back };
  } else if (u.kind === 'discard') run.screen = { type: 'discard', then: back };
  else if (u.kind === 'cleanse') run.screen = { type: 'cleanse', then: back };
}
// The peek: keep the next draw as it is, or reshuffle it once.
function peekDone(run, reshuffle) {
  const s = run.screen;
  if (s.type !== 'peek') return;
  if (reshuffle && !s.reshuffled) { run.nextDraw = rollDraw(run, drawRng(run), 'draw'); s.reshuffled = true; return; }
  run.screen = s.then;
}
// Give up a card you own (id) and draw from cards one rarity higher; null keeps everything.
function discardCard(run, id) {
  const s = run.screen;
  if (s.type !== 'discard') return;
  if (id == null || !run.owned.includes(id)) { run.screen = s.then; return; }
  loseCard(run, id);
  run.screen = { type: 'draw', offers: rollDraw(run, drawRng(run), 'draw', Math.min(4, CARDS[id].rarity + 1)), then: s.then };
}
function loseCard(run, id) {
  keepHpShare(run, () => { run.cards = run.cards.filter(x => x !== id); });
  run.owned = run.owned.filter(x => x !== id); run.stars = run.stars.filter(x => x !== id); delete run.curses[id];
}
// Cursed cards whose curse still holds; payable: only those a shop can take off.
const cursedCards = (run, payable) => run.owned.filter(id => CARDS[id].curse && !run.curses[id].cleansed && (!payable || CARDS[id].curse.cleanse));
// What a shop (or the merchant, with its markup) charges to lift a curse.
const cleanseCost = (run, id, where) => Math.round(CARD_RULES.cleanse[CARDS[id].rarity] * (where === 'merchant' ? merchantMult(run) : 1) / 5) * 5;
// Lift a curse: free from Holy Seawater (the cleanse screen, any curse), paid at a shop or the merchant.
function cleanseCard(run, id) {
  const s = run.screen, free = s.type === 'cleanse';
  if (free && id == null) { run.screen = s.then; return; }
  if (!run.curses[id] || run.curses[id].cleansed) return;
  if (!free && (!forgeSite(run) || !CARDS[id].curse.cleanse || !spend(run, cleanseCost(run, id, s.type)))) return;
  keepHpShare(run, () => { run.curses[id].cleansed = true; });
  if (free) run.screen = s.then;
}

function takeTreasure(run, i) {
  const s = run.screen;
  if (s.type !== 'treasure' || !s.offers[i]) return;
  gain(run, s.offers[i], { type: 'map' });
}

// Rest: heal. (With ECON.restUpgrade, upgrading one item's rarity instead is also allowed.)
function rest(run, choice, slot) {
  const s = run.screen;
  if (s.type !== 'rest') return;
  if (choice === 'heal' && !hasLegendary(run, 'bloodpact')) run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * ECON.restHeal));
  if (choice === 'upgrade') {
    if (!ECON.restUpgrade) return;
    const it = inventoryItem(run, slot);
    if (!it || !upgradeItem(makeRng(s.seed), it)) return;
    run.hp = Math.min(run.hp, maxHp(run));
  }
  run.screen = { type: 'map' };
}
// slot: 'weapon0'..'weapon2', 'head', 'body', 'legs', 'feet', 'trinket0', 'trinket1'
function inventoryItem(run, slot) {
  if (PARTS.includes(slot)) return run.inv.armour[slot];
  const m = /^(weapon|trinket)(\d)$/.exec(slot || '');
  return m ? run.inv[m[1] + 's'][+m[2]] || null : null;
}
const ITEM_SLOTS = ['weapon0', 'weapon1', 'weapon2', ...PARTS, 'trinket0', 'trinket1'];

const PRICES = ECON.prices;
const priceOf = (it, markup) => Math.round((it.slot === 'card' ? CARD_RULES.prices : ECON.prices)[it.rarity] * (markup || 1) / 5) * 5;
// Map shops: rarer stock than the merchant, and always a weapon of a type you don't carry, so a bad
// matchup can be bought out of.
function shopStock(run, rng) {
  const pool = weaponsFor(actOf(run)), held = run.inv.weapons.filter(Boolean).map(w => w.base), taken = [];
  // in a new act the shop's weapon is one of that act's new weapons when you don't carry one
  const newOnes = pool.filter(w => (w.act || 1) === actOf(run) && !held.includes(w.id)), fresh = newOnes.length ? newOnes : pool.filter(w => !held.includes(w.id));
  const T = name => lootTable(run, name);
  const rolls = [() => rollItem(rng, 'weapon', rollRarity(rng, T('shop')), rng.pick(fresh.length ? fresh : pool).id), () => rollItem(rng, 'armour', rollRarity(rng, T('shop'))),
    () => rollItem(rng, 'trinket', rollRarity(rng, T('shop'))), () => rollAny(rng, T('shop')), () => rollCard(rng, T('shopCard'), cardOk(run))];
  return rolls.map(r => freshOffer(run, taken, r)).map(it => ({ item: it, price: priceOf(it), sold: false }));
}
function shopBuy(run, i) {
  const s = run.screen, o = s.type === 'shop' && s.stock[i];
  if (!o || o.sold || !spend(run, o.price)) return;
  o.sold = true;
  gain(run, o.item, s);
}
function shopReroll(run) {
  const s = run.screen;
  if (s.type !== 'shop' || !spend(run, s.rerollCost)) return;
  s.rerollCost += ECON.reroll.step;
  const rng = makeRng(s.seed); s.stock = shopStock(run, rng); s.seed = rng.int(2147483647);
}
function shopHeal(run) {
  const s = run.screen;
  if (s.type !== 'shop' || s.healed || run.gold < s.healCost) return;
  spend(run, s.healCost); s.healed = true;
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * ECON.shopHeal.share));
}

// The anytime merchant: open from the map between nodes. A small stock of common and uncommon things
// and a potion, restocked (from the node's seed) every time you move to a new row. Pricier than a shop.
function merchantStock(run, seed) {
  const rng = makeRng(seed);
  const stock = [];
  const mk = merchantMult(run), taken = [];
  for (let k = 0; k < ECON.merchantItems; k++) { const it = freshOffer(run, taken, () => rollAny(rng, lootTable(run, 'merchant'))); stock.push({ item: it, price: priceOf(it, mk), sold: false }); }
  const card = freshOffer(run, taken, () => rollCard(rng, lootTable(run, 'merchantCard'), cardOk(run)));
  stock.push({ item: card, price: priceOf(card, mk), sold: false });
  return { stock, healCost: healPrice(run, ECON.merchantHeal.cost), healed: false, forged: 0, seed: rng.int(2147483647) };
}
const healPrice = (run, cost) => Math.round(cost * (1 - ((clsOf(run) || {}).healDiscount || 0)));
// The merchant's price multiplier: its markup, less a class discount (the Hustler's), or none at all.
const merchantMult = run => { const C = clsOf(run) || {}; return (C.noMarkup ? 1 : ECON.merchantMarkup) * (1 - (C.merchantDiscount || 0)); };
// Selling, at a shop or the merchant, for any class: a share of the buy price plus of any forging or ★
// paid for. slot: an inventory slot, or 'card<k>'.
function sellValue(run, slot) {
  const mult = ECON.sellShare * ((clsOf(run) || {}).sellMult || 1), m = /^card(\d+)$/.exec(slot || '');
  if (m) {
    const id = run.owned[+m[1]];
    return id ? Math.round((CARD_RULES.prices[CARDS[id].rarity] + (run.stars.includes(id) ? ECON.cardStar[CARDS[id].rarity] : 0)) * mult) : 0;
  }
  const it = inventoryItem(run, slot);
  return it ? Math.round((ECON.prices[it.rarity] + (it.forged || 0)) * mult) : 0;
}
function sellItem(run, slot) {
  if (!['shop', 'merchant'].includes(run.screen.type)) return;
  const v = sellValue(run, slot), m = /^card(\d+)$/.exec(slot || '');
  if (!v) return;
  if (m) loseCard(run, run.owned[+m[1]]);
  else {
    if (slot.startsWith('weapon') && run.inv.weapons.filter(Boolean).length < 2) return;      // keep a weapon in hand
    if (slot === 'weapon' + run.loadout.weapon) holdWeapon(run, run.inv.weapons.findIndex((w, i) => w && i !== run.loadout.weapon));
    if (PARTS.includes(slot)) run.inv.armour[slot] = null;
    else { const k = /^(weapon|trinket)(\d)$/.exec(slot); run.inv[k[1] + 's'][+k[2]] = null; }
    if (!run.inv.weapons[run.loadout.weapon]) run.loadout.weapon = run.inv.weapons.findIndex(Boolean);
    run.hp = Math.max(1, Math.min(run.hp, maxHp(run)));
  }
  earn(run, v);
}
function openMerchant(run) { if (run.screen.type === 'map' && run.merchant) run.screen = { type: 'merchant' }; }
function merchantBuy(run, i) {
  const m = run.merchant, o = run.screen.type === 'merchant' && m.stock[i];
  if (!o || o.sold || !spend(run, o.price)) return;
  o.sold = true;
  gain(run, o.item, { type: 'merchant' });
}
function merchantHeal(run) {
  const m = run.merchant;
  if (run.screen.type !== 'merchant' || m.healed || !spend(run, m.healCost)) return;
  m.healed = true;
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * ECON.merchantHeal.share));
}

// The forge: pay to raise an item one rarity, all the way to Legendary (items.js upgradeItem keeps the
// base and affixes). Map shops have it; the merchant's costs more.
const FORGE_SLOTS = ITEM_SLOTS;
// The act sets how far the forge goes (Epic in act 1, Legendary from act 2) and scales its price.
const forgeCap = run => actStep(run, ECON.forgeCap);
function forgeCost(run, slot, where) {
  const it = inventoryItem(run, slot);
  if (!it || it.rarity >= forgeCap(run)) return null;
  return Math.round(ECON.forge[it.rarity + 1] * (where === 'merchant' ? ECON.merchantForge : 1) * actStep(run, ECON.actForge) / 5) * 5;
}
const forgeSite = run => run.screen.type === 'shop' ? run.screen : run.screen.type === 'merchant' ? run.merchant : null;
function forge(run, slot) {
  const st = forgeSite(run);
  if (!st) return;
  const cost = forgeCost(run, slot, run.screen.type), it = inventoryItem(run, slot);
  if (cost == null || run.gold < cost) return;
  if (!upgradeItem(makeRng(st.seed + 7919 * ++st.forged), it)) return;
  spend(run, cost); it.forged = (it.forged || 0) + cost;
  run.hp = Math.min(run.hp, maxHp(run));
}

// Card upgrades: each card can be upgraded once (★), at a shop or the merchant (which charges more).
// k: the card's place in the collection. One-use cards can't be upgraded.
function starCost(run, k, where) {
  const id = run.owned[k];
  if (!id || run.stars.includes(id) || CARDS[id].type === 'oneuse') return null;
  return Math.round(ECON.cardStar[CARDS[id].rarity] * (where === 'merchant' ? ECON.merchantForge : 1) / 5) * 5;
}
function starCard(run, k) {
  if (!forgeSite(run)) return;
  const cost = starCost(run, k, run.screen.type);
  if (cost == null || !spend(run, cost)) return;
  keepHpShare(run, () => run.stars.push(run.owned[k]));
}

// After the last zone's boss: end the run with the win, or keep going into Overtime.
function takeWin(run) {
  if (run.screen.type !== 'victory') return;
  run.victory = true;
  run.over = { won: true, cause: 'cleared ' + ZONES.map(z => z.name).join(' and ') }; run.screen = { type: 'summary' };
}
function goOvertime(run) { if (run.screen.type === 'victory') { run.victory = true; run.screen = { type: 'act', next: 0 }; } }

// Between acts: on into the next zone with everything you carry, a fresh map and a breather.
function nextAct(run) {
  const s = run.screen;
  if (s.type !== 'act') return;
  run.act = actIdx(run) + 1; run.zone = s.next;
  const zone = ZONES[run.zone], rng = makeRng((run.seed ^ (0x41435400 + run.act * 7919)) >>> 0);
  run.map = genMap(rng, zone); run.at = null; run.row = -1;
  run.visitedTotal = (run.visitedTotal || 0) + run.visited.length; run.visited = []; run.actWins = 0;
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * ECON.actHeal));
  run.cardSlots = Math.min(cardCap(run), run.cardSlots + 1);
  run.merchant = merchantStock(run, rng.int(2147483647));
  run.screen = { type: 'map' };
}

function leave(run) { if (['shop', 'treasure', 'merchant'].includes(run.screen.type)) run.screen = { type: 'map' }; }

// Events: each choice has effects, some with a coin flip rolled from the event's seed.
function eventChoice(run, i) {
  const s = run.screen;
  if (s.type !== 'event' || s.result) return;
  const ev = ZONES[run.zone].events.find(e => e.id === s.id), c = ev.choices[i];
  if (!c || (c.cost && run.gold < c.cost)) return;
  const rng = makeRng(s.seed + i);
  const out = c.chance != null ? (rng.next() < c.chance ? c.win : c.lose) : c;
  applyEffects(run, out.effects || {});
  if (c.cost) spend(run, c.cost);
  s.result = out.text || c.text || '';
  if (run.hp <= 0) { run.over = { won: false, cause: out.death || 'an unfortunate event' }; run.screen = { type: 'summary', last: s.result }; return; }
  if (out.effects && out.effects.item) s.item = eventItem(run, out.effects, s.seed + 99);
}
function applyEffects(run, fx) {
  if (fx.maxHp) { run.maxHpBonus += fx.maxHp; if (fx.maxHp > 0) run.hp += fx.maxHp; }
  if (fx.hp) run.hp = Math.max(0, Math.min(maxHp(run), run.hp + fx.hp));
  if (fx.gold > 0) earn(run, fx.gold);
  else if (fx.gold < 0) spend(run, Math.min(run.gold, -fx.gold));
  run.hp = Math.min(run.hp, maxHp(run));
}
function eventItem(run, fx, seed) {
  const rng = makeRng(seed);
  const T = lootTable(run, 'event');
  return freshOffer(run, [], () => fx.item === 'card' ? rollCard(rng, T, cardOk(run))
    : fx.item === 'any' ? rollAny(rng, T) : rollItem(rng, fx.item, rollRarity(rng, T), null, null, actOf(run)));
}
function eventDone(run) {
  const s = run.screen;
  if (s.type !== 'event' || s.result == null) return;
  if (s.item) gain(run, s.item, { type: 'map' }); else run.screen = { type: 'map' };
}

if (typeof module !== 'undefined') module.exports = { CARD_STATE, cardMore, runCardStat, rollDraw, takeNextDraw, takeDraw, gainCard, cardSite, toggleCard, useCard, peekDone, discardCard, cursedCards, cleanseCost, cleanseCard, otActs, actIdx, lapOf, takeWin, goOvertime, actOf, lootTable, actGold, cardCap, forgeCap, nextAct, slotList, isFresh, ITEM_SLOTS, merchantMult, starCost, starCard, chooseClass, sellItem, sellValue, healPrice, RUN_VERSION, MAP_ROWS, NODE_TYPES, ECON, PRICES, FORGE_SLOTS, newRun, earn, spend, goldMult, openMerchant, merchantBuy, merchantHeal, forgeCost, forge, nodeById, reachable, ahead, maxHp, heroFor, freeSlot, chooseStart, encounterFor, encounterIntro, moveTo, setLoadout, finishFight, takeReward, takeTreasure, rest, inventoryItem, shopBuy, shopReroll, shopHeal, leave, eventChoice, eventDone, replaceItem };
