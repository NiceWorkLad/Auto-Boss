// Runs: seeded map generation, what each node does, and the run state machine. Pure data and no
// DOM, so balance.js can play whole runs with it. Every node gets its own seed when the map is made,
// so the same run seed gives the same map, encounters, offers and fights.
//
// run.screen says what the player is looking at; the UI renders it and calls the actions below.
// A fight in progress isn't saved: run.screen stays 'prefight' until finishFight(), so a refresh
// mid-fight goes back to the pre-fight screen.

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

function newRun(seed) {
  seed = (seed >>> 0) || 1;
  const rng = makeRng(seed), zone = ZONES[0];
  const run = { v: 1, seed, zone: 0, hp: START_HP, maxHpBonus: 0, gold: 0, row: -1, at: null, visited: [],
    map: genMap(rng, zone), inv: { weapons: [null, null], armour: null, trinkets: [null, null] },
    loadout: { weapon: 0, target: 'front' }, seen: {}, cleared: 0, fights: 0, over: null, screen: null };
  run.screen = { type: 'start', offers: rng.shuffle(WEAPONS.map(w => w.id)).slice(0, 3).map(id => newItem('weapon', id, 0)) };
  return run;
}

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
  const w = [['fight', 46], ['event', 18], ['elite', r >= 3 ? 16 : 0], ['shop', r >= 2 ? 10 : 0], ['treasure', 6], ['rest', r >= 4 ? 8 : 0]];
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
const maxHp = run => START_HP + run.maxHpBonus + itemHpBonus(run);

// Items -------------------------------------------------------------------------------------
// Placeholder until items.js: weapons only, no rarity effects.

function newItem(slot, base, rarity) { return { slot, base, rarity, affixes: [] }; }
function itemHpBonus(run) { return 0; }
// The hero for the coming fight: the chosen weapon slot plus everything carried.
function heroFor(run) {
  const w = run.inv.weapons[run.loadout.weapon] || run.inv.weapons.find(Boolean);
  const h = baseHero(w.base, run.loadout.target);
  h.maxHp = maxHp(run); h.hp = Math.min(run.hp, h.maxHp);
  return h;
}

// Actions ------------------------------------------------------------------------------------

function chooseStart(run, i) {
  if (run.screen.type !== 'start') return;
  run.inv.weapons[0] = run.screen.offers[i];
  run.screen = { type: 'map' };
}

// The enemies a fight node puts up, rebuilt the same way every time from the node's seed.
function encounterFor(run, node) {
  const zone = ZONES[run.zone], rng = makeRng(node.seed);
  let ids;
  if (node.type === 'boss') ids = [zone.boss];
  else if (node.type === 'elite') ids = [zone.elites[rng.int(zone.elites.length)]];
  else { const band = zone.groups.filter(b => b.from <= node.row).pop(); ids = rng.pick(band.list); }
  return { ids, defs: ids.map(id => scaledEnemy(ENEMIES[id], node.row, zone)), fightSeed: rng.int(2147483647) };
}
function encounterIntro(defs) {
  const lead = defs.find(d => d.boss || d.elite) || defs[0];
  return lead.intro;
}

function moveTo(run, id) {
  if (run.screen.type !== 'map' || !reachable(run).includes(id)) return;
  const node = nodeById(run, id);
  run.at = id; run.row = node.row; run.visited.push(id);
  const rng = makeRng(node.seed ^ 0x5bd1e995);
  if (node.type === 'fight' || node.type === 'elite' || node.type === 'boss') run.screen = { type: 'prefight', node: id };
  else if (node.type === 'rest') run.screen = { type: 'rest' };
  else if (node.type === 'treasure') run.screen = { type: 'treasure', gold: 35 + rng.int(20) };
  else if (node.type === 'shop') run.screen = { type: 'shop', healCost: 25, healed: false };
  else if (node.type === 'event') { const ev = rng.pick(ZONES[run.zone].events); run.screen = { type: 'event', id: ev.id, seed: rng.int(2147483647) }; }
}

function setLoadout(run, weapon, target) {
  if (weapon != null && run.inv.weapons[weapon]) run.loadout.weapon = weapon;
  if (target) run.loadout.target = target;
}

// After the fight plays out: f is the finished fight from rules.js.
function finishFight(run, f) {
  const node = nodeById(run, run.at);
  run.fights++;
  for (const e of f.enemies) if (e.phase > 0 || e.def.boss) run.seen[e.def.id] = true;
  run.hp = Math.max(0, Math.round(f.hero.hp));
  if (!f.won) { run.over = { won: false, cause: f.cause || 'knocked out' }; run.screen = { type: 'summary' }; return; }
  run.cleared++;
  if (node.type === 'boss') { run.over = { won: true, cause: 'cleared ' + ZONES[run.zone].name }; run.screen = { type: 'summary' }; return; }
  const rng = makeRng(node.seed ^ 0x27d4eb2f);
  const gold = node.type === 'elite' ? 40 + rng.int(16) : 12 + rng.int(10);
  run.screen = { type: 'reward', gold, elite: node.type === 'elite' };
}

function takeReward(run) {
  if (run.screen.type !== 'reward') return;
  run.gold += run.screen.gold;
  run.screen = { type: 'map' };
}

function takeTreasure(run) {
  if (run.screen.type !== 'treasure') return;
  run.gold += run.screen.gold;
  run.screen = { type: 'map' };
}

function rest(run, choice) {
  if (run.screen.type !== 'rest') return;
  if (choice === 'heal') run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * 0.35));
  run.screen = { type: 'map' };
}

function shopHeal(run) {
  const s = run.screen;
  if (s.type !== 'shop' || s.healed || run.gold < s.healCost) return;
  run.gold -= s.healCost; s.healed = true;
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * 0.3));
}
function leave(run) { if (['shop', 'treasure'].includes(run.screen.type)) run.screen = { type: 'map' }; }

// Events: each choice has effects, some with a coin flip rolled from the event's seed.
function eventChoice(run, i) {
  const s = run.screen;
  if (s.type !== 'event' || s.result) return;
  const ev = ZONES[run.zone].events.find(e => e.id === s.id), c = ev.choices[i];
  if (!c || (c.cost && run.gold < c.cost)) return;
  const rng = makeRng(s.seed + i);
  const out = c.chance != null ? (rng.next() < c.chance ? c.win : c.lose) : c;
  applyEffects(run, out.effects || {});
  if (c.cost) run.gold -= c.cost;
  s.result = out.text || c.text || '';
  if (run.hp <= 0) { run.over = { won: false, cause: out.death || 'an unfortunate event' }; run.screen = { type: 'summary', last: s.result }; }
}
function applyEffects(run, fx) {
  if (fx.maxHp) { run.maxHpBonus += fx.maxHp; if (fx.maxHp > 0) run.hp += fx.maxHp; }
  if (fx.hp) run.hp = Math.max(0, Math.min(maxHp(run), run.hp + fx.hp));
  if (fx.gold) run.gold = Math.max(0, run.gold + fx.gold);
  run.hp = Math.min(run.hp, maxHp(run));
}
function eventDone(run) { if (run.screen.type === 'event' && run.screen.result != null) run.screen = { type: 'map' }; }

if (typeof module !== 'undefined') module.exports = { MAP_ROWS, NODE_TYPES, newRun, nodeById, reachable, maxHp, heroFor, chooseStart, encounterFor, encounterIntro, moveTo, setLoadout, finishFight, takeReward, takeTreasure, rest, shopHeal, leave, eventChoice, eventDone };
