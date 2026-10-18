// Balance report. node balance.js [fights per cell]
// Weapon × encounter matrix: win rate, average time to win and HP lost, for a hero with no items.
const R = require('./rules.js'), Z = require('./zones.js');
const N = +process.argv[2] || 100;

const zone = Z.ZONES[0];
const encounters = {};
for (const band of zone.groups) for (const g of band.list) encounters[g.join('+')] = g;
for (const id of zone.elites.concat(zone.boss)) encounters[id] = [id];

function cell(weapon, ids, hp) {
  let wins = 0, t = 0, lost = 0;
  for (let s = 1; s <= N; s++) {
    const h = R.baseHero(weapon); h.maxHp = h.hp = hp;
    const f = R.simulate(h, ids.map(id => Z.ENEMIES[id]), R.makeRng(s).next);
    if (f.won) { wins++; t += f.t; lost += hp - f.hero.hp; }
  }
  return { win: wins / N, t: wins ? t / wins : Infinity, lost: wins ? lost / wins : Infinity };
}

console.log('Weapon x encounter (no items; elites and boss with 200 HP). win% / seconds; * = best\n');
const names = R.WEAPONS.map(w => w.id);
console.log('encounter'.padEnd(34) + names.map(n => n.padStart(11)).join(''));
const best = {};
for (const [name, ids] of Object.entries(encounters)) {
  const big = ids.some(id => Z.ENEMIES[id].size === 'big');
  const cells = names.map(w => cell(w, ids, big ? 200 : 100));
  // best: highest win rate, then most HP left, then fastest
  const score = c => c.win * 1000 - c.lost * 2 - (isFinite(c.t) ? c.t : 999) * 0.1;
  const b = cells.reduce((a, c, i) => score(c) > score(cells[a]) ? i : a, 0);
  best[name] = names[b];
  console.log(name.padEnd(34) + cells.map((c, i) => ((i === b ? '*' : '') + Math.round(c.win * 100) + '/' + (isFinite(c.t) ? c.t.toFixed(0) : '--')).padStart(11)).join(''));
}
const tally = {};
for (const k in best) tally[best[k]] = (tally[best[k]] || 0) + 1;
console.log('\nbest weapon per encounter:', JSON.stringify(tally));
