// Game rules: bosses, upgrades, gear, combat and payouts. Shared by the game and balance.js,
// so the numbers the balance report checks are the numbers the game plays.

const BOSSES = [
  { name: 'Slime King', color: '#6fcf5a', horns: 0, crown: true },
  { name: 'Goblin Warlord', color: '#9bb33f', horns: 2 },
  { name: 'Stone Golem', color: '#8d8a84', horns: 0 },
  { name: 'Swamp Hydra', color: '#3f8f6f', horns: 3 },
  { name: 'Frost Wyrm', color: '#7fc8f0', horns: 2 },
  { name: 'Lich Lord', color: '#a08cd8', horns: 0, crown: true },
  { name: 'Iron Colossus', color: '#b0644f', horns: 2 },
  { name: 'Demon Prince', color: '#d8433a', horns: 2, crown: true },
  { name: 'Void Leviathan', color: '#5a4cc8', horns: 4 },
  { name: 'Sun Eater', color: '#f0a530', horns: 6 },
  { name: 'World Serpent', color: '#2f9a8c', horns: 2 },
  { name: 'The Auditor', color: '#cfc6a8', horns: 0, crown: true },
];

// Upgrades add a flat amount per level and gear tiers multiply. Percentage stats approach a ceiling
// instead of hitting a hard cap: hard caps all filled in mid-game at once and the hero spiked far
// past the bosses (see balance.js).
const UPGRADES = [
  { id: 'sharpen', name: 'Sharpen', base: 15, growth: 1.13, show: l => '+' + 2 * l + ' base damage' },
  { id: 'vital', name: 'Vitality', base: 15, growth: 1.13, show: l => '+' + 30 * l + ' base HP' },
  { id: 'swift', name: 'Swiftness', base: 40, growth: 1.2, show: l => '+' + pct(0.05 * l) + ' attack speed' },
  { id: 'precision', name: 'Precision', base: 60, growth: 1.2, show: l => pct(critChance(l)) + ' crit chance' },
  { id: 'brutal', name: 'Brutality', base: 80, growth: 1.2, show: l => '×' + (2 + 0.15 * l).toFixed(2) + ' crit damage' },
  { id: 'plating', name: 'Plating', base: 50, growth: 1.2, show: l => pct(1 - 1 / (1 + 0.03 * l)) + ' damage taken off' },
  { id: 'footwork', name: 'Footwork', base: 70, growth: 1.2, show: l => pct(dodgeChance(l)) + ' dodge' },
  { id: 'regen', name: 'Second Wind', base: 90, growth: 1.2, show: l => pct(regenRate(l)) + ' HP regen per second' },
  { id: 'greed', name: 'Greed', base: 100, growth: 1.18, show: l => '+' + pct(0.1 * l) + ' gold' },
];
function critChance(l) { return 0.05 + 0.55 * (1 - 1 / (1 + 0.04 * l)); }
function dodgeChance(l) { return 0.4 * (1 - 1 / (1 + 0.03 * l)); }
function regenRate(l) { return 0.03 * (1 - 1 / (1 + 0.05 * l)); }

const GEAR = [
  { id: 'weapon', name: 'Weapon', mult: 3, stat: 'damage',
    tiers: ['Bare Fists', 'Rusty Sword', 'Iron Sword', 'Steel Blade', 'Runed Blade', 'Dragonfang', 'Starforged Edge', 'Godslayer'] },
  { id: 'armor', name: 'Armor', mult: 3, stat: 'max HP',
    tiers: ['Rags', 'Leather', 'Chainmail', 'Plate', 'Mithril', 'Dragonscale', 'Celestial Aegis', 'Unbreakable'] },
  { id: 'charm', name: 'Charm', base: 2000, mult: 1.4, stat: 'gold',
    tiers: ['Nothing', 'Lucky Coin', 'Silver Ring', 'Gold Amulet', 'Jeweled Crown', 'Midas Idol', 'Dragon Hoard', 'The Ledger'] },
];

const SLAM_EVERY = 6, SLAM_WINDUP = 1.2, SLAM_MULT = 3;
const ENRAGE_AT = 40;        // seconds; after this the boss hits harder every second, so every fight ends
const KILL_BONUS = 1.5;      // a kill pays this many times the boss's reward on top of the damage
const FIRST_KILL = 4;        // the first kill of each boss multiplies the kill bonus

// Growth per boss (HP, attack, reward), gear cost growth per tier, and the starting values.
// balance.js can override these. Reward is decoupled from HP on purpose: when gold scaled with
// boss HP, power outgrew every boss.
const TUNE = { hp: 5.4, atk: 5.4, reward: 4.8, gear: 7, charm: 8, gearBase: 100, hp0: 150, atk0: 5 };

function pct(x) { return Math.round(x * 1000) / 10 + '%'; }

const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n));
  const e = Math.floor(Math.log10(n) / 3);
  if (e >= SUFFIX.length) return n.toExponential(2).replace('+', '');
  const v = n / Math.pow(1000, e);
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUFFIX[e];
}

function roman(n) {
  const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = '';
  for (const [v, c] of r) while (n >= v) { s += c; n -= v; }
  return s;
}

function bossInfo(i) {
  const b = BOSSES[i % BOSSES.length], lap = Math.floor(i / BOSSES.length);
  return {
    ...b, i, name: lap ? b.name + ' ' + roman(lap + 1) : b.name,
    hp: TUNE.hp0 * Math.pow(TUNE.hp, i), atk: TUNE.atk0 * Math.pow(TUNE.atk, i), interval: 1.6, reward: 75 * Math.pow(TUNE.reward, i),
  };
}

function newSave() {
  return { gold: 0, lv: {}, gear: { weapon: 0, armor: 0, charm: 0 }, boss: 0, unlocked: 0, best: [], kills: [],
    fights: 0, earned: 0, auto: { fight: false, buy: false, push: true }, speed: 1 };
}

function heroStats(s) {
  const L = id => s.lv[id] || 0, gear = GEAR.reduce((m, g) => (m[g.id] = Math.pow(g.mult, s.gear[g.id] || 0), m), {});
  return {
    dmg: (5 + 2 * L('sharpen')) * gear.weapon,
    aps: 1 + 0.05 * L('swift'),
    crit: critChance(L('precision')),
    critx: 2 + 0.15 * L('brutal'),
    hp: (100 + 30 * L('vital')) * gear.armor,
    armor: 1 - 1 / (1 + 0.03 * L('plating')),
    dodge: dodgeChance(L('footwork')),
    regen: regenRate(L('regen')),
    gold: (1 + 0.1 * L('greed')) * gear.charm,
  };
}

function newFight(s, i, rng) {
  const hero = heroStats(s), boss = bossInfo(i);
  return { t: 0, i, hero: { ...hero, cur: hero.hp }, boss: { ...boss, cur: boss.hp }, heroCd: 0.5, bossCd: 1.2,
    slamCd: SLAM_EVERY, windup: 0, furious: false, dealt: 0, done: false, won: false, rng: rng || Math.random };
}

// Advance a fight by dt seconds and return what happened, for the renderer to animate.
function step(f, dt) {
  const ev = [], h = f.hero, b = f.boss;
  if (f.done) return ev;
  f.t += dt;
  h.cur = Math.min(h.hp, h.cur + h.regen * h.hp * dt);
  f.heroCd -= dt;
  while (f.heroCd <= 0) {
    f.heroCd += 1 / h.aps;
    const crit = f.rng() < h.crit;
    const dmg = Math.min(b.cur, h.dmg * (crit ? h.critx : 1) * (0.9 + 0.2 * f.rng()));
    b.cur -= dmg; f.dealt += dmg;
    ev.push({ type: 'hit', dmg, crit });
    if (b.cur <= 0) { f.done = f.won = true; ev.push({ type: 'end' }); return ev; }
  }
  if (!f.furious && b.cur < b.hp / 2) { f.furious = true; ev.push({ type: 'fury' }); }
  const rage = f.t > ENRAGE_AT ? 1 + (f.t - ENRAGE_AT) / 4 : 1;
  if (f.windup > 0) {
    f.windup -= dt;
    if (f.windup <= 0) { f.slamCd = SLAM_EVERY; hitHero(f, b.atk * SLAM_MULT * rage, true, ev); }
  } else if ((f.slamCd -= dt) <= 0) {
    f.windup = SLAM_WINDUP; ev.push({ type: 'windup' });
  } else if ((f.bossCd -= dt * (f.furious ? 1.25 : 1)) <= 0) {
    f.bossCd += b.interval; hitHero(f, b.atk * rage, false, ev);
  }
  return ev;
}

function hitHero(f, raw, slam, ev) {
  const h = f.hero;
  if (f.rng() < h.dodge) { ev.push({ type: 'dodge', slam }); return; }
  const dmg = raw * (1 - h.armor);
  h.cur -= dmg; ev.push({ type: 'hurt', dmg, slam });
  if (h.cur <= 0) { h.cur = 0; f.done = true; ev.push({ type: 'end' }); }
}

// Gold for the share of the boss's HP taken off so far; the kill bonus only once it is down.
function payout(s, f) {
  const g = f.hero.gold * f.boss.reward, base = f.dealt / f.boss.hp * g;
  const kill = f.won ? g * KILL_BONUS : 0;
  const first = f.won && !s.kills[f.i] ? kill * (FIRST_KILL - 1) : 0;
  return { base, kill, first, total: base + kill + first };
}

function settle(s, f) {
  const p = payout(s, f);
  s.gold += p.total; s.earned += p.total; s.fights++;
  s.best[f.i] = Math.max(s.best[f.i] || 0, f.dealt);
  if (f.won) {
    s.kills[f.i] = (s.kills[f.i] || 0) + 1;
    s.unlocked = Math.max(s.unlocked, f.i + 1);
    if (s.auto.push && s.boss === f.i) s.boss = f.i + 1;
  }
  return p;
}

function tierName(g, t) { return t < g.tiers.length ? g.tiers[t] : g.tiers[g.tiers.length - 1] + ' +' + (t - g.tiers.length + 1); }

// Everything that can be bought right now, affordable or not.
function shopItems(s) {
  const up = UPGRADES.map(u => {
    const l = s.lv[u.id] || 0;
    return { kind: 'upgrade', id: u.id, def: u, level: l, cost: Math.ceil(u.base * Math.pow(u.growth, l)) };
  });
  const gear = GEAR.map(g => {
    const t = s.gear[g.id] || 0;
    return { kind: 'gear', id: g.id, def: g, level: t, cost: Math.ceil((g.base || TUNE.gearBase) * Math.pow(g.id === 'charm' ? TUNE.charm : TUNE.gear, t)) };
  });
  return up.concat(gear);
}

function buy(s, item) {
  if (s.gold < item.cost) return false;
  s.gold -= item.cost;
  if (item.kind === 'upgrade') s.lv[item.id] = item.level + 1; else s.gear[item.id] = item.level + 1;
  return true;
}

// Auto-buy: keep buying the cheapest thing until nothing is affordable.
function autoBuy(s) {
  const bought = [];
  for (;;) {
    const item = shopItems(s).filter(x => x.cost <= s.gold).sort((a, b) => a.cost - b.cost)[0];
    if (!item || !buy(s, item)) return bought;
    bought.push(item);
  }
}

if (typeof module !== 'undefined') module.exports = { TUNE, BOSSES, UPGRADES, GEAR, fmt, bossInfo, newSave, heroStats, newFight, step, payout, settle, shopItems, buy, autoBuy, tierName };
