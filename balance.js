// Balance report. node balance.js [fights per cell]
// Weapon × encounter matrix: win rate and HP left for each weapon against every minion group, elite
// and the boss, with a stand-in kit for that depth of the map (more HP, damage and armour deeper in).
const R = require('./rules.js'), Z = require('./zones.js');
const N = +process.argv[2] || 100;
const zone = Z.ZONES[0];

// A hero roughly as strong as a run that has picked up loot by this depth.
function kit(weapon, depth) {
  const h = R.baseHero(weapon);
  h.maxHp = h.hp = 100 + 10 * depth; h.armour = 0.3 * depth; h.mods.dmg = 1 + 0.06 * depth;
  return h;
}

const encounters = [];
for (const band of zone.groups) for (const g of band.list) encounters.push({ name: g.join('+'), ids: g, depth: band.from + 1 });
for (const id of zone.elites) encounters.push({ name: id, ids: [id], depth: 5 });
encounters.push({ name: zone.boss, ids: [zone.boss], depth: 10 });

function cell(weapon, e) {
  let wins = 0, left = 0, t = 0;
  for (let s = 1; s <= N; s++) {
    const h = kit(weapon, e.depth), f = R.simulate(h, e.ids.map(id => Z.scaledEnemy(Z.ENEMIES[id], e.depth, zone)), R.makeRng(s * 7919 + 13).next);
    if (f.won) { wins++; left += f.hero.hp / h.maxHp; t += f.t; }
  }
  return { win: wins / N, left: wins ? left / wins : 0, t: wins ? t / wins : 0 };
}
const score = c => c.win * (0.5 + c.left);   // winning matters most, then how much HP it costs

const names = R.WEAPONS.map(w => w.id), best = {};
console.log('Weapon x encounter, kit for the depth. win% / HP left%; * = best\n');
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
