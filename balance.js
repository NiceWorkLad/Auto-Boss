// Balance report: plays whole runs with bots through run.js, using the same rules as the game.
//   node balance.js [runs] [--matrix]
// 1. Smart vs random: zone clear rate and how far runs get, for three bots that differ only in how
//    they choose. The gap between them is the measure of "choices matter".
// 2. Win rate per encounter for the smart bot, and elite/boss win rate by weapon held.
// 3. Weapon x encounter matrix (with --matrix): every weapon against every group, elite and the boss,
//    with a stand-in kit for that depth. The best weapon has to differ between encounters.
Object.assign(global, require('./rules.js'), require('./zones.js'), require('./items.js'), require('./cards.js'));
Object.assign(global, require('./run.js'));
const args = process.argv.slice(2), RUNS = +args.find(a => /^\d+$/.test(a)) || 300, MATRIX = args.includes('--matrix'), DEATHS = args.includes('--deaths'), CARDREP = args.some(a => a.startsWith('--cards')), CARDONLY = (args.find(a => a.startsWith('--cards=')) || '').slice(8).split(',').filter(Boolean);
const zone = ZONES[0];
if (process.env.TUNE) Object.assign(zone.tune, JSON.parse(process.env.TUNE));   // try values without editing zones.js
if (process.env.ECON) Object.assign(ECON, JSON.parse(process.env.ECON));         // and economy values (run.js ECON)

// Bots ---------------------------------------------------------------------------------------
// smart:        weapon by weaponFit() from the visible traits, best loot, sensible rests and shops
// randomWeapon: the same, except the weapon for each fight is picked at random
// random:       every choice at random
const BOTS = {
  smart: { weapon: 'fit', loot: 'best', other: 'sensible' },
  randomWeapon: { weapon: 'random', loot: 'best', other: 'sensible' },
  random: { weapon: 'random', loot: 'random', other: 'random' },
};

// Card worth to the smart bot: rarity, a little for toys (summons, triggers), and synergy: each
// card already on the board that shares a tag, more when it would complete a set of three.
function cardValue(id, board) {
  const c = CARDS[id], others = (board || []).filter(x => x !== id), tags = tagCounts(others), m = c.effect.multi || {};
  let v = c.rarity * 10 + 4 + (c.type === 'summon' || c.type === 'trigger' ? 2 : 0);
  for (const t of c.tags) v += (tags[t] || 0) * 3 + ((tags[t] || 0) === 2 ? 6 : 0);
  const triggers = others.filter(x => CARDS[x].type === 'trigger').length, summons = others.filter(x => CARDS[x].effect.summon || (CARDS[x].effect.trigger && [].concat(CARDS[x].effect.trigger.do).some(d => d.kind === 'summon'))).length;
  if (m.echo || m.trigCd) v += triggers * 5 - 10;
  if (m.summonHp) v += summons * 5 - 10;
  return v;
}
const value = (it, run) => it.slot === 'card' ? cardValue(it.id, run && run.cards) : it.rarity * 10 + it.affixes.length + (it.legendary ? 5 : 0);
// Loot worth to the smart bots: rarity first, but a second kind of weapon beats a rarity tier,
// since two weapons are what make the pre-fight choice possible.
const worth = (run, it) => it.slot === 'card' ? (run.cards.includes(it.id) ? -99 : cardValue(it.id, run.cards) + (run.cards.length < run.cardSlots ? 6 : 0))
  : value(it) + (it.slot === 'weapon' && run.inv.weapons.filter(Boolean).length < 2 && !run.inv.weapons.some(w => w && w.base === it.base) ? 15 : 0);
const bestOf = (run, list) => list.reduce((a, it, i) => worth(run, it) > worth(run, list[a]) ? i : a, 0);
// How much an item would improve what the run carries (0 if the smart bot would not keep it).
function gainOf(run, it) {
  if (it.slot === 'card') {
    if (run.cards.includes(it.id)) return 0;
    if (run.cards.length < run.cardSlots) return worth(run, it);
    return Math.max(0, cardValue(it.id, run.cards) - Math.min(...run.cards.map(id => cardValue(id, run.cards))));
  }
  const list = it.slot === 'armour' ? [run.inv.armour] : it.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
  if (list.includes(null)) return worth(run, it);
  if (it.slot === 'weapon') { const same = list.find(w => w.base === it.base); if (same) return Math.max(0, value(it) - value(same)); }
  return Math.max(0, value(it) - Math.min(...list.map(value)));
}
// The forge target: the cheapest upgrade, weapons first.
function forgeTarget(run, where) {
  return FORGE_SLOTS.map(k => [k, forgeCost(run, k, where)]).filter(([, c]) => c != null)
    .sort((a, b) => a[1] - b[1] || b[0].startsWith('weapon') - a[0].startsWith('weapon'))[0];
}
// Spend at the shop or merchant like an attentive player: heal when low, buy real upgrades, forge
// with what's left. reserve is gold to keep back for later (a shop is better value than the merchant).
function shopSmart(run, where, reserve) {
  const st = where === 'shop' ? run.screen : run.merchant, hp = run.hp / maxHp(run);
  if (hp < (where === 'shop' ? 0.7 : reserve ? 0.45 : 0.95) && !st.healed && run.gold >= st.healCost) { (where === 'shop' ? shopHeal : merchantHeal)(run); return true; }
  const o = st.stock.map((o, i) => [o, i]).filter(([o]) => !o.sold && run.gold - o.price >= reserve && gainOf(run, o.item) >= (reserve ? 5 : 1))
    .sort((a, b) => gainOf(run, b[0].item) - gainOf(run, a[0].item))[0];
  if (o) { (where === 'shop' ? shopBuy : merchantBuy)(run, o[1]); return true; }
  const fg = forgeTarget(run, where);
  if (fg && run.gold - fg[1] >= reserve) { forge(run, fg[0]); return true; }
  return false;
}
function shopRandom(run, where, rng) {
  const st = where === 'shop' ? run.screen : run.merchant, r = rng.int(4);
  if (r === 0) { const i = rng.int(st.stock.length); if (!st.stock[i].sold && run.gold >= st.stock[i].price) { (where === 'shop' ? shopBuy : merchantBuy)(run, i); return true; } }
  if (r === 1 && !st.healed && run.gold >= st.healCost) { (where === 'shop' ? shopHeal : merchantHeal)(run); return true; }
  if (r === 2) { const k = rng.pick(FORGE_SLOTS), c = forgeCost(run, k, where); if (c != null && run.gold >= c) { forge(run, k); return true; } }
  return false;
}

// bot.force: a card id the run starts with on its board and never gives up (the --cards ablation).
function playRun(seed, bot, stats) {
  const run = newRun(seed), rng = makeRng(seed ^ 0x9e3779b9);
  chooseStart(run, rng.int(3));
  if (bot.force) run.cards.push(bot.force);
  const offered = new Set(), had = new Set();
  run.cardLog = { offered, had };
  let visitedMerchant = -2;
  for (let guard = 0; guard < 800 && !run.over; guard++) {
    const s = run.screen;
    for (const id of run.cards) had.add(id);
    const stock = s.type === 'reward' || s.type === 'treasure' ? s.offers : s.type === 'shop' ? s.stock.map(o => o.item) : s.type === 'merchant' ? run.merchant.stock.map(o => o.item) : [];
    for (const it of stock) if (it.slot === 'card') offered.add(it.id);
    if (s.type === 'map') {
      // the merchant once per row: smart bots go when low or with gold to spare (all of it before the boss)
      const next = reachable(run), bossNext = next.some(id => nodeById(run, id).type === 'boss');
      if (visitedMerchant !== run.row && (bot.other === 'random' ? rng.int(3) === 0 : run.hp < maxHp(run) * 0.45 || run.gold >= (bossNext ? 1 : 70))) {
        visitedMerchant = run.row; openMerchant(run); continue;
      }
      (stats.hpArrive[run.row + 1] = stats.hpArrive[run.row + 1] || []).push(run.hp / maxHp(run));
      moveTo(run, rng.pick(next));
    } else if (s.type === 'merchant') {
      const bossNext = reachable(run).some(id => nodeById(run, id).type === 'boss');
      if (!(bot.other === 'random' ? shopRandom(run, 'merchant', rng) : shopSmart(run, 'merchant', bossNext ? 0 : 40))) leave(run);
    }
    else if (s.type === 'prefight') {
      const node = nodeById(run, s.node), enc = encounterFor(run, node);
      const slots = run.inv.weapons.map((w, k) => w ? k : -1).filter(k => k >= 0);
      const pick = bot.weapon === 'fit'
        ? slots.reduce((a, k) => weaponFit(compileHero(run, k), enc.defs) > weaponFit(compileHero(run, a), enc.defs) ? k : a)
        : rng.pick(slots);
      setLoadout(run, pick, 'front');
      const f = simulate(heroFor(run), enc.defs, makeRng(enc.fightSeed).next);
      const key = node.type === 'fight' ? 'fights, rows ' + (node.row < 3 ? '1-3' : node.row < 6 ? '4-6' : '7-9') : enc.ids[0];
      const st = stats[key] || (stats[key] = { n: 0, won: 0 });
      st.n++; if (f.won) st.won++;
      if (node.type !== 'fight') {
        const k2 = key + ':' + run.inv.weapons[pick].base, ws = stats.byWeapon[k2] || (stats.byWeapon[k2] = { n: 0, won: 0 });
        ws.n++; if (f.won) ws.won++;
      }
      if (!f.won) stats.lost = { row: node.row, cause: f.cause, what: (node.type === 'fight' ? enc.ids.join('+') : enc.ids[0]) + ' with ' + run.inv.weapons[pick].base + (run.inv.weapons.filter(Boolean).length > 1 ? ' (had ' + run.inv.weapons.filter(Boolean).map(w => w.base).join('/') + ')' : ''), hpIn: Math.round(run.hp / maxHp(run) * 100) };
      (stats.hpIn[node.row] = stats.hpIn[node.row] || []).push(run.hp / maxHp(run));
      finishFight(run, f);
    } else if (s.type === 'reward') takeReward(run, bot.loot === 'random' ? (rng.int(4) === 3 ? null : rng.int(3)) : bestOf(run, s.offers));
    else if (s.type === 'treasure') takeTreasure(run, bot.loot === 'random' ? rng.int(3) : bestOf(run, s.offers));
    else if (s.type === 'replace') {
      const list = s.item.slot === 'card' ? run.cards.map(id => ({ slot: 'card', id })) : s.item.slot === 'armour' ? [run.inv.armour] : s.item.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
      if (bot.loot === 'random') replaceItem(run, rng.int(2) ? rng.int(list.length) : null);
      else if (s.item.slot === 'card') {
        const k = list.reduce((a, it, i) => it.id !== bot.force && (list[a].id === bot.force || cardValue(it.id, run.cards) < cardValue(list[a].id, run.cards)) ? i : a, list.findIndex(it => it.id !== bot.force));
        replaceItem(run, run.cards.includes(s.item.id) ? null : cardValue(s.item.id, run.cards.filter((_, i) => i !== k)) > cardValue(list[k].id, run.cards) ? k : null);
      } else {
        // drop the weakest; for weapons, a better copy of a type you hold replaces that type
        let k = list.reduce((a, it, i) => value(it) < value(list[a]) ? i : a, 0);
        if (s.item.slot === 'weapon') { const same = list.findIndex(it => it.base === s.item.base); if (same >= 0) k = same; }
        replaceItem(run, value(s.item) > value(list[k]) ? k : null);
      }
    } else if (s.type === 'shop') {
      if (!(bot.other === 'sensible' ? shopSmart(run, 'shop', 0) : shopRandom(run, 'shop', rng))) leave(run);
    } else if (s.type === 'rest') {
      const up = FORGE_SLOTS.filter(k => { const it = inventoryItem(run, k); return it && it.rarity < 3; });
      if (!ECON.restUpgrade) rest(run, 'heal');
      else if (bot.other === 'random') rest(run, rng.int(2) && up.length ? 'upgrade' : 'heal', rng.pick(up));
      else if (run.hp < maxHp(run) * 0.65 || !up.length) rest(run, 'heal');
      else rest(run, 'upgrade', up.sort((a, b) => value(inventoryItem(run, b)) - value(inventoryItem(run, a)))[0]);
    } else if (s.type === 'event') {
      if (s.result != null) { eventDone(run); continue; }
      const ev = zone.events.find(e => e.id === s.id), ok = ev.choices.map((c, i) => i).filter(i => !ev.choices[i].cost || run.gold >= ev.choices[i].cost);
      eventChoice(run, bot.other === 'random' ? rng.pick(ok) : (run.hp < maxHp(run) * 0.4 ? ok[ok.length - 1] : ok[0]));
    }
  }
  for (const id of run.cards) had.add(id);
  return run;
}

console.log(`Auto-Boss balance: ${RUNS} runs per bot, ${zone.name}\n`);
const results = {};
for (const [name, bot] of Object.entries(BOTS)) {
  const stats = { byWeapon: {}, hpIn: {}, hpArrive: {} }, deaths = {}, lostAt = {}, lostTo = {}, causeIn = {};
  let cleared = 0, rows = 0, earned = 0, spent = 0, left = 0;
  const goldWon = { n: 0, earned: 0, left: 0 }, goldLost = { n: 0, earned: 0, left: 0 };
  for (let seed = 1; seed <= RUNS; seed++) {
    const run = playRun(seed, bot, stats);
    if (run.over && run.over.won) cleared++;
    else {
      const c = run.over ? run.over.cause : 'stuck'; deaths[c] = (deaths[c] || 0) + 1;
      if (stats.lost) {
        lostAt[stats.lost.row] = (lostAt[stats.lost.row] || 0) + 1; lostTo[stats.lost.what] = (lostTo[stats.lost.what] || 0) + 1;
        const ci = stats.lost.cause + ' in ' + stats.lost.what.split(' with ')[0]; causeIn[ci] = (causeIn[ci] || 0) + 1;
      }
    }
    stats.lost = null;
    rows += run.row + 1; earned += run.earned; spent += run.spent; left += run.gold;
    const g = run.over && run.over.won ? goldWon : goldLost; g.n++; g.earned += run.earned; g.left += run.gold;
  }
  results[name] = { gold: { earned: earned / RUNS, spent: spent / RUNS, left: left / RUNS, goldWon, goldLost }, clear: cleared / RUNS, rows: rows / RUNS, stats, deaths, lostAt, lostTo, causeIn };
}
console.log('bot'.padEnd(14) + 'zone clear'.padStart(12) + 'avg row reached'.padStart(18) + 'gold earned'.padStart(13) + 'spent'.padStart(7) + 'left'.padStart(6));
for (const [name, r] of Object.entries(results)) console.log(name.padEnd(14) + (Math.round(r.clear * 100) + '%').padStart(12) + r.rows.toFixed(1).padStart(18)
  + Math.round(r.gold.earned).toString().padStart(13) + Math.round(r.gold.spent).toString().padStart(7) + Math.round(r.gold.left).toString().padStart(6));
const gl = g => g.n ? Math.round(g.earned / g.n) + ' earned, ' + Math.round(g.left / g.n) + ' left' : '--';
for (const [name, r] of Object.entries(results)) console.log(`  ${name}: at a clear ${gl(r.gold.goldWon)}; at death ${gl(r.gold.goldLost)}`);
const ratio = (a, b) => (results[a].clear / Math.max(0.001, results[b].clear)).toFixed(1) + 'x';
console.log(`\nsmart vs random: ${ratio('smart', 'random')}   smart vs random-weapon: ${ratio('smart', 'randomWeapon')}`);

console.log('\nSmart bot, win rate per encounter:');
const st = results.smart.stats;
for (const k of Object.keys(st).filter(k => !['byWeapon', 'hpIn', 'hpArrive', 'lost'].includes(k)).sort()) console.log('  ' + k.padEnd(20) + (Math.round(st[k].won / st[k].n * 100) + '%').padStart(5) + '  (' + st[k].n + ' fights)');
console.log('\nSmart bot, top causes of death:');
for (const [c, n] of Object.entries(results.smart.deaths).sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log('  ' + String(n).padStart(4) + '  ' + c);
console.log('\nRandom-weapon bot, elite and boss win rate by the weapon it held (fights):');
const bw = results.randomWeapon.stats.byWeapon;
for (const id of zone.elites.concat(zone.boss)) {
  console.log('  ' + id.padEnd(11) + WEAPONS.map(w => { const c = bw[id + ':' + w.id]; return (w.id + ' ' + (c ? Math.round(c.won / c.n * 100) + '% (' + c.n + ')' : '--')).padEnd(17); }).join(''));
}

if (DEATHS) {
  const r = results.smart;
  console.log('\nSmart bot deaths by row:', Object.entries(r.lostAt).map(([k, n]) => 'r' + (+k + 1) + ':' + n).join(' '));
  console.log('Smart bot HP% arriving at each row (any node):', Object.entries(r.stats.hpArrive).map(([k, a]) => 'r' + (+k + 1) + ':' + Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100)).join(' '));
  console.log('Smart bot HP% going into fights by row (fights):', Object.entries(r.stats.hpIn).map(([k, a]) => 'r' + (+k + 1) + ':' + Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) + ' (' + a.length + ')').join(' '));
  console.log('Smart bot losing fights:');
  for (const [w, n] of Object.entries(r.lostTo).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log('  ' + String(n).padStart(4) + '  ' + w);
  console.log('Smart bot deaths by cause, split by encounter:');
  for (const [w, n] of Object.entries(r.causeIn).sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log('  ' + String(n).padStart(4) + '  ' + w);
}

if (MATRIX) {
  // A hero roughly as strong as a run that has picked up loot by this depth.
  const kit = (weapon, depth) => { const h = baseHero(weapon); h.maxHp = h.hp = 100 + 10 * depth; h.armour = 0.3 * depth; h.mods.dmg = 1 + 0.06 * depth; return h; };
  const encounters = [];
  for (const band of zone.groups) for (const g of band.list) encounters.push({ name: g.join('+'), ids: g, depth: band.from + 1 });
  for (const id of zone.elites) encounters.push({ name: id, ids: [id], depth: 5 });
  encounters.push({ name: zone.boss, ids: [zone.boss], depth: 10 });
  const N = 60, names = WEAPONS.map(w => w.id), best = {};
  const cell = (weapon, e) => {
    let wins = 0, left = 0;
    for (let s = 1; s <= N; s++) {
      const h = kit(weapon, e.depth), f = simulate(h, e.ids.map(id => scaledEnemy(ENEMIES[id], e.depth, zone)), makeRng(s * 7919 + 13).next);
      if (f.won) { wins++; left += f.hero.hp / h.maxHp; }
    }
    return { win: wins / N, left: wins ? left / wins : 0 };
  };
  const score = c => c.win * (0.5 + c.left);
  console.log('\nWeapon x encounter, stand-in kit for the depth. win% / HP left%; * = best');
  console.log('encounter'.padEnd(36) + names.map(n => n.padStart(10)).join(''));
  for (const e of encounters) {
    const cells = names.map(w => cell(w, e)), b = cells.reduce((a, c, i) => score(c) > score(cells[a]) ? i : a, 0);
    best[e.name] = names[b];
    console.log((e.name + ' @' + e.depth).padEnd(36) + cells.map((c, i) => ((i === b ? '*' : '') + Math.round(c.win * 100) + '/' + Math.round(c.left * 100)).padStart(10)).join(''));
  }
  const tally = {};
  for (const k in best) tally[best[k]] = (tally[best[k]] || 0) + 1;
  console.log('\nbest weapon per encounter:', JSON.stringify(tally));
  console.log('elites and boss:', zone.elites.concat(zone.boss).map(id => id + '=' + best[id]).join(' '));
}

if (CARDREP) {
  // Pick and win rate per card for the smart bot, then each card forced onto the board from the start
  // (and never dropped) to see how much it alone moves the clear rate.
  const N = RUNS, ids = Object.keys(CARDS), per = {};
  for (const id of ids) per[id] = { offered: 0, took: 0, had: 0, won: 0 };
  let base = 0;
  for (let seed = 1; seed <= N; seed++) {
    const run = playRun(seed, BOTS.smart, { byWeapon: {}, hpIn: {}, hpArrive: {} }), won = run.over && run.over.won;
    if (won) base++;
    for (const id of run.cardLog.offered) { per[id].offered++; if (run.cardLog.had.has(id)) per[id].took++; }
    for (const id of run.cardLog.had) { per[id].had++; if (won) per[id].won++; }
  }
  console.log(`\nCards, smart bot (${N} runs, ${Math.round(base / N * 100)}% clear). pick = taken when offered; held = runs that held it; win = their clear rate;\n forced = clear rate when every run starts with the card on the board and never drops it; lift = forced minus the base;\n vs med = lift minus the median card's lift; pool = clear rate with the card in the game minus with it banned`);
  console.log('card'.padEnd(26) + 'type'.padEnd(11) + 'rar'.padStart(4) + 'pick'.padStart(7) + 'held'.padStart(6) + 'win'.padStart(6) + 'forced'.padStart(8) + 'lift'.padStart(7) + 'vs med'.padStart(8) + 'pool'.padStart(7));
  const rows = [], clear = bot => { let w = 0; for (let seed = 1; seed <= N; seed++) { const run = playRun(seed, bot, { byWeapon: {}, hpIn: {}, hpArrive: {} }); if (run.over && run.over.won) w++; } return w / N; };
  const all = { ...CARDS };
  for (const id of ids) if (!CARDONLY.length || CARDONLY.includes(id)) {
    const forced = clear({ ...BOTS.smart, force: id });
    delete CARDS[id]; const banned = clear(BOTS.smart); CARDS[id] = all[id];      // the same seeds with this card out of the game
    rows.push([id, forced - base / N, forced, base / N - banned]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  const medOf = r => r.map(x => x[1]).sort((a, b) => a - b)[Math.floor(r.length / 2)];
  const sgn = d => ((d >= 0 ? '+' : '') + Math.round(d * 100));
  for (const [id, d, w, pool] of rows) {
    const c = CARDS[id], p = per[id];
    console.log(c.name.slice(0, 25).padEnd(26) + c.type.padEnd(11) + String(c.rarity).padStart(4) + (p.offered ? Math.round(p.took / p.offered * 100) + '%' : '--').padStart(7)
      + String(p.had).padStart(6) + (p.had ? Math.round(p.won / p.had * 100) + '%' : '--').padStart(6) + (Math.round(w * 100) + '%').padStart(8) + sgn(d).padStart(7) + sgn(d - medOf(rows)).padStart(8) + sgn(pool).padStart(7));
  }
  // Any card forced from the first fight is a free extra pick, so most lift somewhat; what matters is
  // how far a card sits above the typical card (vs median).
  const med = rows.map(r => r[1]).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
  console.log(`biggest lift: ${CARDS[rows[0][0]].name} ${sgn(rows[0][1])} points (${sgn(rows[0][1] - med)} over the median card, ${sgn(med)}); ${rows.filter(r => r[1] - med > 0.08).length} cards more than 8 points over the median; biggest pool effect ${sgn(Math.max(...rows.map(r => r[3])))}`);
}
