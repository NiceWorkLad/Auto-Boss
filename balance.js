// Plays the game with auto-buy and auto-push on, and reports how many fights each boss takes.
// node balance.js [bosses] [seed] [key=value ...]   (key=value overrides TUNE in rules.js)
const R = require('./rules.js');
const bosses = +process.argv[2] || 14, seed = +process.argv[3] || 1;
for (const kv of process.argv.slice(4)) { const [k, v] = kv.split('='); R.TUNE[k] = +v; }

function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const rng = mulberry32(seed), s = R.newSave();
s.auto = { fight: true, buy: true, push: true };
let fights = 0, secs = 0, last = 0, lastSecs = 0;
console.log('boss                 fights  total  minutes  gold-at-kill  weapon/armor/charm');
while (s.unlocked < bosses && fights < 5000) {
  R.autoBuy(s);
  const f = R.newFight(s, s.boss, rng);
  while (!f.done) R.step(f, 1 / 30);
  R.settle(s, f); fights++; secs += f.t + 3;   // 3s for the payout screen between fights
  if (f.won && s.kills[f.i] === 1) {
    const b = R.bossInfo(f.i);
    console.log(b.name.padEnd(20), String(fights - last).padStart(6), String(fights).padStart(6),
      ((secs - lastSecs) / 60).toFixed(1).padStart(8), R.fmt(s.gold).padStart(13), '  ' + [s.gear.weapon, s.gear.armor, s.gear.charm].join('/'));
    last = fights; lastSecs = secs;
  }
}
if (s.unlocked < bosses) console.log('stuck on', R.bossInfo(s.boss).name, 'after', fights, 'fights');
console.log('total', (secs / 60).toFixed(0), 'minutes at 1x speed');
