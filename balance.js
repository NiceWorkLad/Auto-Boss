// Balance report: plays whole runs with bots through run.js, using the same rules as the game.
//   node balance.js [runs] [--matrix]
// 1. Smart vs random: zone clear rate and how far runs get, for three bots that differ only in how
//    they choose. The gap between them is the measure of "choices matter".
// 2. Win rate per encounter for the smart bot, and elite/boss win rate by weapon held.
// 3. Weapon x encounter matrix (with --matrix): every weapon against every group, elite and the boss,
//    with a stand-in kit for that depth. The best weapon has to differ between encounters.
Object.assign(global, require('./rules.js'), require('./zones.js'), require('./items.js'));
Object.assign(global, require('./run.js'));
const args = process.argv.slice(2), RUNS = +args.find(a => /^\d+$/.test(a)) || 300, MATRIX = args.includes('--matrix'), DEATHS = args.includes('--deaths');
const zone = ZONES[0];
if (process.env.TUNE) Object.assign(zone.tune, JSON.parse(process.env.TUNE));   // try values without editing zones.js

// Bots ---------------------------------------------------------------------------------------
// smart:        weapon by weaponFit() from the visible traits, best loot, sensible rests and shops
// randomWeapon: the same, except the weapon for each fight is picked at random
// random:       every choice at random
const BOTS = {
  smart: { weapon: 'fit', loot: 'best', other: 'sensible' },
  randomWeapon: { weapon: 'random', loot: 'best', other: 'sensible' },
  random: { weapon: 'random', loot: 'random', other: 'random' },
};

const value = it => it.rarity * 10 + it.affixes.length + (it.legendary ? 5 : 0);
// Loot worth to the smart bots: rarity first, but a second kind of weapon beats a rarity tier,
// since two weapons are what make the pre-fight choice possible.
const worth = (run, it) => value(it) + (it.slot === 'weapon' && run.inv.weapons.filter(Boolean).length < 2 && !run.inv.weapons.some(w => w && w.base === it.base) ? 15 : 0);
const bestOf = (run, list) => list.reduce((a, it, i) => worth(run, it) > worth(run, list[a]) ? i : a, 0);

function playRun(seed, bot, stats) {
  const run = newRun(seed), rng = makeRng(seed ^ 0x9e3779b9);
  chooseStart(run, rng.int(3));
  for (let guard = 0; guard < 300 && !run.over; guard++) {
    const s = run.screen;
    if (s.type === 'map') moveTo(run, rng.pick(reachable(run)));
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
      const list = s.item.slot === 'armour' ? [run.inv.armour] : s.item.slot === 'weapon' ? run.inv.weapons : run.inv.trinkets;
      if (bot.loot === 'random') replaceItem(run, rng.int(2) ? rng.int(list.length) : null);
      else {
        // drop the weakest; for weapons, a better copy of a type you hold replaces that type
        let k = list.reduce((a, it, i) => value(it) < value(list[a]) ? i : a, 0);
        if (s.item.slot === 'weapon') { const same = list.findIndex(it => it.base === s.item.base); if (same >= 0) k = same; }
        replaceItem(run, value(s.item) > value(list[k]) ? k : null);
      }
    } else if (s.type === 'shop') {
      if (bot.other === 'sensible') {
        if (run.hp < maxHp(run) * 0.5 && !s.healed && run.gold >= s.healCost) shopHeal(run);
        const o = s.stock.map((o, i) => [o, i]).filter(([o]) => !o.sold && run.gold >= o.price).sort((a, b) => worth(run, b[0].item) - worth(run, a[0].item))[0];
        if (o) { shopBuy(run, o[1]); continue; }
      } else if (rng.int(2)) { const i = rng.int(s.stock.length); if (!s.stock[i].sold && run.gold >= s.stock[i].price) { shopBuy(run, i); continue; } }
      leave(run);
    } else if (s.type === 'rest') {
      const up = ['weapon0', 'weapon1', 'armour', 'trinket0', 'trinket1'].filter(k => { const it = inventoryItem(run, k); return it && it.rarity < 3; });
      if (bot.other === 'random') rest(run, rng.int(2) && up.length ? 'upgrade' : 'heal', rng.pick(up));
      else if (run.hp < maxHp(run) * 0.65 || !up.length) rest(run, 'heal');
      else rest(run, 'upgrade', up.sort((a, b) => value(inventoryItem(run, b)) - value(inventoryItem(run, a)))[0]);
    } else if (s.type === 'event') {
      if (s.result != null) { eventDone(run); continue; }
      const ev = zone.events.find(e => e.id === s.id), ok = ev.choices.map((c, i) => i).filter(i => !ev.choices[i].cost || run.gold >= ev.choices[i].cost);
      eventChoice(run, bot.other === 'random' ? rng.pick(ok) : (run.hp < maxHp(run) * 0.4 ? ok[ok.length - 1] : ok[0]));
    }
  }
  return run;
}

console.log(`Auto-Boss balance: ${RUNS} runs per bot, ${zone.name}\n`);
const results = {};
for (const [name, bot] of Object.entries(BOTS)) {
  const stats = { byWeapon: {}, hpIn: {} }, deaths = {}, lostAt = {}, lostTo = {}, causeIn = {};
  let cleared = 0, rows = 0;
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
    rows += run.row + 1;
  }
  results[name] = { clear: cleared / RUNS, rows: rows / RUNS, stats, deaths, lostAt, lostTo, causeIn };
}
console.log('bot'.padEnd(14) + 'zone clear'.padStart(12) + 'avg row reached'.padStart(18));
for (const [name, r] of Object.entries(results)) console.log(name.padEnd(14) + (Math.round(r.clear * 100) + '%').padStart(12) + r.rows.toFixed(1).padStart(18));
const ratio = (a, b) => (results[a].clear / Math.max(0.001, results[b].clear)).toFixed(1) + 'x';
console.log(`\nsmart vs random: ${ratio('smart', 'random')}   smart vs random-weapon: ${ratio('smart', 'randomWeapon')}`);

console.log('\nSmart bot, win rate per encounter:');
const st = results.smart.stats;
for (const k of Object.keys(st).filter(k => !['byWeapon', 'hpIn', 'lost'].includes(k)).sort()) console.log('  ' + k.padEnd(20) + (Math.round(st[k].won / st[k].n * 100) + '%').padStart(5) + '  (' + st[k].n + ' fights)');
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
  console.log('Smart bot HP% going into fights by row:', Object.entries(r.stats.hpIn).map(([k, a]) => 'r' + (+k + 1) + ':' + Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100)).join(' '));
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
