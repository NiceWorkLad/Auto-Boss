// The encounter generator. Builds every minion group a zone could field at each depth band, plays each
// one with the sim against every weapon, keeps the ones that sit inside the difficulty of that band's
// hand-written groups, and writes the result to encounters.js for the game to draw from by seed.
//   node tools/encounters.js            write encounters.js and print a report
//   node tools/encounters.js --check    exit 1 if encounters.js is out of date with the enemies and tuning
// Run it again whenever a minion, a weapon or a zone's tune changes (npm run check tells you).
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
for (const f of ['rules.js', 'zones.js', 'items.js', 'cards.js', 'run.js']) Object.assign(global, require(path.join(root, f)));
const CHECK = process.argv.includes('--check'), N = 16;
const SIZES = [[2, 3], [3, 4], [4, 5]];               // group sizes per band, as the hand-written lists have them
const TOP_SHARE = 0.4, MIN_POOL = 12;                  // no weapon is the best answer to more than this share of a band; never trim a band below this many groups
// The share of weapons that must win a group 90%+ of the time, per band. Early on you hold one weapon,
// so most of them have to work; later you carry three, so a group may ask for the right one.
const MIN_WINS = [0.7, 0.4, 0.25];
const CARRIED = [1, 2, 3];                              // weapons a player typically holds by each band
const MARGIN = 0.03;                                   // how far outside the hand-written range a group's ease may sit

// the same stand-in hero the balance matrix uses: a plain kit that grows with depth
const kit = (weapon, depth) => { const h = baseHero(weapon); h.maxHp = h.hp = 100 + 10 * depth; h.armour = 0.3 * depth; h.mods.dmg = 1 + 0.06 * depth; return h; };
const weaponsFor = zi => WEAPONS.filter(w => zi > 0 || !w.act).map(w => w.id);

// How a group plays: per weapon, the share of fights won and the HP left, scored win x (0.5 + HP left)
// as the matrix does. ease is the score a player could expect holding CARRIED[band] random weapons and
// picking the best of them; wins counts weapons that win 90%+.
function measure(ids, zone, zi, band, carried) {
  const depth = band.from + 1, cells = weaponsFor(zi).map(w => {
    let wins = 0, left = 0;
    for (let s = 1; s <= N; s++) {
      const h = kit(w, zi * MAP_ROWS + depth), f = simulate(h, ids.map(id => scaledEnemy(ENEMIES[id], depth, zone)), makeRng(s * 7919 + 13).next);
      if (f.won) { wins++; left += f.hero.hp / h.maxHp; }
    }
    return { w, win: wins / N, left: wins ? left / wins : 0 };
  });
  const score = c => c.win * (0.5 + c.left);
  // the expected best score among `carried` weapons drawn at random: what a player holding that many would get
  const asc = cells.map(score).sort((x, y) => x - y), n = asc.length, C = (a, b) => { let r = 1; for (let i = 0; i < b; i++) r = r * (a - i) / (i + 1); return b > a ? 0 : r; };
  const ease = asc.reduce((sum, sc, i) => sum + sc * C(i, carried - 1), 0) / C(n, carried);
  return { ease, wins: cells.filter(c => c.win >= 0.9).length, best: bestOf(cells.map(c => [c.w, score(c)])) };
}

// the weapon that is clearly the best answer, or 'any' when the top two are within a hair of each other
function bestOf(scores) { const s = scores.sort((a, b) => b[1] - a[1]); return s[0][1] - s[1][1] > 0.02 ? s[0][0] : 'any'; }
// every multiset of the zone's minions of a size, as sorted id lists
function multisets(ids, size, from = 0) {
  if (!size) return [[]];
  const out = [];
  for (let k = from; k < ids.length; k++) for (const rest of multisets(ids, size - 1, k)) out.push([ids[k], ...rest]);
  return out;
}
// Two standing orders for a multiset: sturdiest in front, and softest in front. Each is its own group.
const orders = set => { const a = set.slice().sort((x, y) => ENEMIES[y].hp - ENEMIES[x].hp || (x < y ? -1 : 1)), b = a.slice().reverse(); return a.join() === b.join() ? [a] : [a, b]; };
// a back-row minion needs someone to stand behind
const shaped = set => !set.every(id => (ENEMIES[id].traits || {}).backline);

// what the pool was built from: if any of it changes, the pool is stale
function stamp(zone, zi) {
  const src = JSON.stringify([zone.tune, zone.minions.map(id => ENEMIES[id]), weaponsFor(zi).map(weaponById), zone.groups, SIZES, MARGIN, CARRIED, MIN_WINS, TOP_SHARE, MIN_POOL, N]);
  let h = 2166136261; for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

const file = path.join(root, 'encounters.js');
if (CHECK) {
  const have = fs.existsSync(file) ? require(file).ENCOUNTER_POOL : {};
  const stale = ZONES.filter((z, zi) => !have[z.id] || have[z.id].stamp !== stamp(z, zi)).map(z => z.id);
  if (stale.length) { console.error('encounters.js is out of date for: ' + stale.join(', ') + '. Run: node tools/encounters.js'); process.exit(1); }
  console.log('encounters ok'); process.exit(0);
}

const pool = {};
console.log('zone        band  hand  made  legal   ease: hand range (mean) -> pool mean   best weapon across the pool');
ZONES.forEach((zone, zi) => {
  const bands = zone.groups.map((band, bi) => {
    const hand = band.list.map(g => measure(g, zone, zi, band, CARRIED[bi])), lo = Math.min(...hand.map(m => m.ease)) - MARGIN, hi = Math.max(...hand.map(m => m.ease)) + MARGIN;
    const need = Math.max(2, Math.ceil(weaponsFor(zi).length * MIN_WINS[bi]));
    let legal = [], made = 0;
    for (const size of SIZES[bi]) for (const set of multisets(zone.minions, size)) {
      if (!shaped(set)) continue;
      for (const o of orders(set)) { made++; const m = measure(o, zone, zi, band, CARRIED[bi]); if (m.wins >= need && m.ease >= lo && m.ease <= hi) legal.push({ ids: o, ease: m.ease, best: m.best }); }
    }
    // Two trims keep the pool honest. No weapon may be the best answer to more than TOP_SHARE of a band,
    // so holding the right weapon keeps mattering; and the pool's mean ease must sit on the hand-written
    // mean, so the zone is as hard as it was tuned to be. Each trim drops the group furthest from that mean.
    const target = hand.reduce((s, m) => s + m.ease, 0) / hand.length, avg = () => legal.reduce((s, g) => s + g.ease, 0) / legal.length;
    const drop = pred => { let k = -1; legal.forEach((g, i) => { if (pred(g) && (k < 0 || Math.abs(g.ease - target) > Math.abs(legal[k].ease - target))) k = i; }); if (k >= 0) legal.splice(k, 1); return k >= 0; };
    const tally = () => { const t = {}; for (const g of legal) t[g.best] = (t[g.best] || 0) + 1; return Object.entries(t).sort((x, y) => y[1] - x[1]); };
    const cap = () => { for (let top = tally().find(t => t[0] !== 'any'); top && legal.length > MIN_POOL && top[1] / legal.length > TOP_SHARE; top = tally().find(t => t[0] !== 'any')) if (!drop(g => g.best === top[0])) break; };
    cap();
    while (legal.length > MIN_POOL && Math.abs(avg() - target) > 0.02) { const high = avg() > target; if (!drop(g => high ? g.ease > target : g.ease < target)) break; }
    cap();
    const best = Object.fromEntries(tally());
    const mean = a => a.reduce((s, x) => s + x.ease, 0) / Math.max(1, a.length);
    console.log(zone.id.padEnd(12) + String(band.from).padEnd(6) + String(band.list.length).padEnd(6) + String(made).padEnd(6) + String(legal.length).padEnd(8)
      + (lo + MARGIN).toFixed(2) + '-' + (hi - MARGIN).toFixed(2) + ' (' + mean(hand).toFixed(2) + ') -> ' + mean(legal).toFixed(2) + '   ' + Object.entries(best).sort((a, b) => b[1] - a[1]).map(([w, n]) => w + ' ' + n).join(', '));
    return legal.map(g => g.ids.join(','));
  });
  pool[zone.id] = { stamp: stamp(zone, zi), bands };
});
const body = Object.entries(pool).map(([id, z]) => `  ${id}: { stamp: '${z.stamp}', bands: [\n${z.bands.map(b => '    ' + JSON.stringify(b)).join(',\n')}] }`).join(',\n');
fs.writeFileSync(file, `// GENERATED by tools/encounters.js. Don't edit: change the enemies or the tuning and run it again.
// For each zone, the minion groups the sim passed for each depth band (the same bands as zone.groups).
// Each group is its ids in standing order. stamp says what it was built from; npm run check compares it.
const ENCOUNTER_POOL = {\n${body},\n};\n
if (typeof module !== 'undefined') module.exports = { ENCOUNTER_POOL };\n`);
console.log('wrote encounters.js');
