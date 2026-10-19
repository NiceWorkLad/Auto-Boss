// Auto-Boss rules: seeded rng, damage types, weapons and the fight engine (groups of enemies,
// traits, move sets, phases). Shared by the game and balance.js, so both run the same numbers.
// Fights are fully automatic: step(f, dt) advances one and returns events for render.js and sfx.js.

// Seedable rng (mulberry32). The state is one integer, so runs can be saved and resumed exactly.
function makeRng(seed, state) {
  const r = { s: state != null ? state : (seed >>> 0) };
  r.next = () => {
    let t = (r.s = (r.s + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = n => Math.floor(r.next() * n);
  r.pick = a => a[r.int(a.length)];
  r.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = r.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return r;
}

const DAMAGE_TYPES = {
  slash: { name: 'Slash', color: '#e6eaf2' },
  blunt: { name: 'Blunt', color: '#ff8a5a' },
  pierce: { name: 'Pierce', color: '#ffe14d' },
  magic: { name: 'Magic', color: '#c77dff' },
  sonic: { name: 'Sonic', color: '#29e7ff' },
  explosive: { name: 'Explosive', color: '#ff3b5c' },
  fire: { name: 'Fire', color: '#ff7a2a' },
  cold: { name: 'Cold', color: '#9fe8ff' },
};

const TRAITS = {
  armour: { name: 'Armoured', tip: v => 'Blocks ' + v + ' damage from every hit. Fast, weak hits barely scratch it, though bullets and blades wear it down.' },
  evasive: { name: 'Evasive', tip: v => pct(v) + ' chance to dodge. Slow, heavy hits miss the most.' },
  flying: { name: 'Flying', tip: () => 'Slash and blunt deal half damage. Rockets often miss, though the blast still clips for half.' },
  shield: { name: 'Shielded', tip: v => 'Starts with a shield of ' + pct(v) + ' of its HP. Magic and sonic hit shields twice as hard.' },
  regen: { name: 'Regenerates', tip: v => 'Heals ' + pct(v) + ' of its HP per second. Needs burst.' },
  summoner: { name: 'Summoner', tip: () => 'Calls in more enemies. Area damage helps.' },
  backline: { name: 'Back row', tip: () => 'Stays behind the others. Single-target hits can\'t reach it while anything stands in front: the Boomerang, area and splash can.' },
};

// Each weapon is the best answer to something and a bad answer to something else; none is an
// upgrade over another. acc scales the enemy's dodge chance (fast weapons are hard to dodge).
const WEAPONS = [
  { id: 'sword', name: 'Sword', type: 'slash', shape: 'single', dmg: 14, aps: 1.0, acc: 1, perks: { focus: { per: 0.15, max: 4 }, wound: 0.5, sunder: 0.023 },
    blurb: 'Locks onto one enemy until it falls: every hit on it cuts 15% deeper, up to +60%. Cuts halve healing for 4s and crack armour.' },
  { id: 'gloves', name: 'Boxing Gloves', type: 'blunt', shape: 'single', dmg: 6.5, aps: 2.4, acc: 0.6, perks: { interrupt: 3, stun: { chance: 0.1, time: 1.2, immune: 2.5 } },
    blurb: 'Fast jabs, hard to dodge. Each has a 10% chance to stun for 1.2s (less on bosses), and 3 hits during a wind-up cancel it.' },
  { id: 'uzi', name: 'Uzi', type: 'pierce', shape: 'single', dmg: 3, aps: 5.5, acc: 0.35, perks: { chip: 0.45, sunder: 0.055 },
    blurb: 'Bullet spray. Shreds flyers and dodgers; armour eats most of every bullet, but each one wears it down.' },
  { id: 'wand', name: 'Magic Wand', type: 'magic', shape: 'single', dmg: 30, aps: 0.5, acc: 1.1, perks: { ignoreArmour: true, spell: { chance: 0.3 } },
    blurb: 'Slow, heavy bolts that ignore armour, and sometimes a spell: a toad for 3s, a shrink to half damage, or a bolt that chains on. Big enemies and bosses resist spells.' },
  { id: 'guitar', name: 'Electric Guitar', type: 'sonic', shape: 'area', dmg: 5.5, aps: 0.9, acc: 1, perks: { heal: 0.2, resonate: 0.75, wound: 0.71, bigOnly: true },
    blurb: 'Hits every enemy at once. Heals you for 20% of damage dealt. Rattles big enemies through their armour and healing.' },
  { id: 'bazooka', name: 'Bazooka', type: 'explosive', shape: 'blast', dmg: 26, aps: 0.3, acc: 1.4, perks: { flyMiss: 0.3, nearMiss: 0.5 },
    blurb: 'Slow, but every rocket blows up the whole enemy line. Often misses flyers, but the blast still clips them.' },
  { id: 'stars', name: 'Ninja Stars', type: 'slash', shape: 'single', dmg: 4.6, aps: 3.0, acc: 0.5, perks: { chip: 0.5, hero: { dodge: 0.12 } },
    blurb: 'A flurry of throwing stars, hard to dodge, that slip between armour plates. While you hold them you dodge 12% more.' },
  // Act 2 weapons, each with a new verb: burn, chill and freeze, reach, the long shot.
  { id: 'flamer', act: 2, name: 'Flamethrower', type: 'fire', shape: 'single', dmg: 1.6, aps: 5, acc: 0.8, perks: { burn: { dps: 5, time: 3 } },
    blurb: 'A stream of fire. Sets the target burning for 3s: the burn ignores armour and stops all healing while it lasts.' },
  { id: 'freeze', act: 2, name: 'Freeze Ray', type: 'cold', shape: 'single', dmg: 8, aps: 1.2, acc: 1, perks: { chill: { slow: 0.15, stacks: 3, time: 2.5 }, freeze: 0.9 },
    blurb: 'Every hit chills: the target attacks and acts 15% slower per stack, up to 45%. A hit during a wind-up freezes the wind-up in place.' },
  { id: 'boomerang', act: 2, name: 'Boomerang', type: 'slash', shape: 'boomerang', dmg: 10, aps: 0.85, acc: 0.9, perks: { reach: true, hitsFlyers: true },
    blurb: 'Hits the target on the way out and the back row on the way back. Flyers can\'t dodge its arc.' },
  { id: 'sniper', act: 2, name: 'Sniper Rifle', type: 'pierce', shape: 'single', dmg: 62, aps: 0.25, acc: 0.25, perks: { snipe: true, hero: { crit: 0.15, critx: 1 } },
    blurb: 'One huge shot every 4 seconds that can pick off anyone, back row included. While you hold it: +15% crit chance and +1× crit damage.' },
];
// A weapon's bonuses to the hero who holds it (perks.hero: dodge, crit, critx).
function weaponHero(h) {
  const p = (h.weapon.perks || {}).hero;
  if (p) { h.dodge = Math.min(0.6, h.dodge + (p.dodge || 0)); h.crit += p.crit || 0; h.critx += p.critx || 0; }
  return h;
}
// Wand spells: what each does, and how likely each is once a spell goes off.
const SPELLS = { toad: { weight: 0.4, time: 3 }, shrink: { weight: 0.3, time: 5, dmg: 0.5 }, chain: { weight: 0.3, share: 0.6 } };
const weaponById = id => WEAPONS.find(w => w.id === id);
// Weapons that can turn up in an act: the act 2 weapons arrive with zone 2.
const weaponsFor = act => WEAPONS.filter(w => (w.act || 1) <= (act || 1));

const MAX_ENEMIES = 5;
const MAX_ALLIES = 5;        // summons from cards.js
const ARMOUR_FLOOR = 0.3;   // a hit through armour keeps at least this share: wrong weapons hurt, they don't wall
const SUDDEN_DEATH = 60;     // seconds; after this enemies hit harder every second
const TIME_LIMIT = 120;      // a fight still going at this point is lost
const BASE_HERO = { maxHp: 100, armour: 0, dodge: 0.05, crit: 0.05, critx: 2, regen: 0, shield: 0 };
// The hero's armour is a shield bar over the HP bar: each point is armourShield HP of shield that
// soaks damage first and refills at the start of every fight.
const HERO_TUNE = { armourShield: 30 };
const armourHp = v => Math.round(v * HERO_TUNE.armourShield);     // what an armour value is worth, for texts
const heroShield = h => (h.shield || 0) + (h.armour || 0) * HERO_TUNE.armourShield;

function pct(x) { return Math.round(x * 1000) / 10 + '%'; }

const SUFFIX = ['', 'K', 'M', 'B', 'T'];
function fmt(n) {
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : String(Math.round(n));
  const e = Math.min(SUFFIX.length - 1, Math.floor(Math.log10(n) / 3)), v = n / Math.pow(1000, e);
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUFFIX[e];
}

function newMods() {
  return { dmg: 1, vs: {}, pierce: 0, cleave: 0, aps: 1, lifesteal: 0, thorns: 0, taken: 1, allHit: false, alwaysCrit: false };
}
// A hero with no items: what the debug lab and the balance matrix start from.
function baseHero(weaponId, target) {
  return weaponHero({ ...BASE_HERO, hp: BASE_HERO.maxHp, weapon: { ...weaponById(weaponId) }, target: target || 'front', mods: newMods() });
}

function spawnEnemy(def) {
  const hk = def.hooks || {};
  const e = {
    def, id: def.id, hp: def.hp, maxHp: def.hp, alive: true, phase: 0, atkMult: hk.hype || 1, dodgeT: 0,
    traits: { ...def.traits }, weak: { ...def.weak }, resist: { ...def.resist },
    shield: def.traits && def.traits.shield ? def.traits.shield * def.hp : 0,
    atkCd: def.interval * 0.8, moves: (def.moves || []).map(m => ({ ...m, cd: m.first != null ? m.first : m.every })),
    windup: null, windupHits: 0, burst: null, woundT: 0, wound: 0,
    // enchantment state (zones.js ENCHANTMENTS): grown armour, melting armour, magic taken for the encore
    grown: 0, growT: hk.grow ? hk.grow.every : 0, melt: hk.melt ? hk.melt.start : 0, meltT: hk.melt ? hk.melt.every : 0, magicTaken: 0, encored: false, raged: false, hypeOff: false,
  };
  if (hk.melt) e.traits.armour = (e.traits.armour || 0) + hk.melt.start;
  return e;
}

// hero: from baseHero() or compileHero() in items.js. defs: enemy definitions from zones.js.
function newFight(hero, defs, rng) {
  const h = { ...hero, mods: { ...newMods(), ...hero.mods }, hp: Math.min(hero.hp, hero.maxHp) };
  h.shieldHp = h.shieldMax = heroShield(h);
  const f = { t: 0, rng: rng || Math.random, hero: h, enemies: defs.map(spawnEnemy), atkCd: 0.6 + (h.delay || 0), target: -1, done: false, won: false, dealt: 0, cause: '', low: h.hp / h.maxHp,
    allies: [], buffs: [], gold: 0, started: false };
  // card triggers (cards.js compiles them onto hero.cards); timers and cooldowns scale by trigCd
  const C = h.cards, k = C ? C.trigCd : 1;
  f.trig = C ? C.triggers.map(t => ({ ...t, cdLeft: 0, fired: false, next: (t.first != null ? t.first : t.every || 0) * k })) : [];
  return f;
}

// Enemies in the order they stand: small ones in front (index order), big ones behind, the back row last.
const rank = e => (e.traits.backline ? 2 : 0) + (e.def.size === 'big' ? 1 : 0);
function formation(f) {
  return f.enemies.map((e, i) => i).filter(i => f.enemies[i].alive)
    .sort((a, b) => rank(f.enemies[a]) - rank(f.enemies[b]) || a - b);
}
// Who a single-target weapon can pick: the back row only once nothing stands in front of it.
function inReach(f) {
  const order = formation(f), front = order.filter(i => !f.enemies[i].traits.backline);
  return front.length ? front : order;
}

function threat(e) { return e.def.atk * e.atkMult / e.def.interval + (e.windup ? 1000 : 0) + (e.moves.some(m => m.kind === 'summon') ? 5 : 0); }

function pickTarget(f) {
  const perks = f.hero.weapon.perks || {}, order = perks.snipe ? formation(f) : inReach(f), p = f.hero.target, E = f.enemies;
  if (!order.length) return -1;
  if (perks.focus && f.focus && order.includes(f.focus.target)) return f.focus.target;      // the sword stays on its enemy
  if (p === 'lowest') return order.reduce((a, b) => E[b].hp + E[b].shield < E[a].hp + E[a].shield ? b : a);
  if (p === 'threat') return order.reduce((a, b) => threat(E[b]) > threat(E[a]) ? b : a);
  return order[0];
}

// Who a swing at enemy t also hits, with the share of damage each takes.
function attackTargets(f, t) {
  const h = f.hero, w = h.weapon, order = formation(f);
  if (h.mods.allHit || w.shape === 'area' || w.shape === 'blast') return order.map(i => [i, 1]);
  if (w.shape === 'splash') return [[t, 1]].concat(order.filter(i => i !== t).map(i => [i, w.perks.splash]));
  if (w.shape === 'boomerang') { const back = order[order.length - 1]; return back !== t ? [[t, 1], [back, 1]] : [[t, 1], [t, 0.5]]; }
  if (w.shape !== 'cleave') return [[t, 1]];
  const near = order.filter(i => !f.enemies[i].traits.backline || f.enemies[t].traits.backline), k = near.indexOf(t), list = [[t, 1]], n = 1 + h.mods.cleave;
  for (let d = 1; list.length <= n && (k + d < near.length || k - d >= 0); d++) {
    if (k + d < near.length && list.length <= n) list.push([near[k + d], 1]);
    if (k - d >= 0 && list.length <= n) list.push([near[k - d], 1]);
  }
  return list;
}

// Advance a fight by dt seconds and return what happened.
function step(f, dt) {
  const ev = [];
  if (f.done) return ev;
  const h = f.hero, E = f.enemies;
  if (!f.started) {             // summons walk in and start-of-fight cards fire
    f.started = true;
    if (h.cards) for (const s of h.cards.summons) for (let n = 0; n < s.count; n++) addAlly(f, s.unit, ev, s.star);
    fire(f, 'start', {}, ev);
    if (settle(f, ev)) return ev;
  }
  f.t += dt;
  if (h.regen) h.hp = Math.min(h.maxHp, h.hp + h.regen * dt);
  let bAps = 0, bDmg = 0, bCrit = 0;
  for (const b of f.buffs) if ((b.left -= dt) > 0) { bAps = (1 + bAps) * (1 + (b.aps || 0)) - 1; bDmg = (1 + bDmg) * (1 + (b.dmg || 0)) - 1; bCrit += b.crit || 0; }
  f.buffs = f.buffs.filter(b => b.left > 0);
  f.bCrit = bCrit;
  for (const t of f.trig) {
    if (t.cdLeft > 0) t.cdLeft -= dt;
    if (t.on === 'every' && (t.next -= dt) <= 0) { t.next += t.every * h.cards.trigCd; fireOne(f, t, {}, ev); }
  }
  if (settle(f, ev)) return ev;

  f.atkCd -= dt;
  while (f.atkCd <= 0 && !f.done) {
    const w = h.weapon;
    f.atkCd += 1 / (w.aps * h.mods.aps * (1 + bAps));
    const t = pickTarget(f);
    if (t < 0) break;
    f.target = t;
    // the sword's focus: each hit on the same enemy cuts deeper (the Sweeping affix, mods.cleave, builds it faster)
    const fo = w.perks && w.perks.focus;
    if (fo) f.focus = f.focus && f.focus.target === t ? { target: t, n: Math.min(fo.max, f.focus.n + 1 + h.mods.cleave) } : { target: t, n: 0 };
    ev.push({ type: 'attack', target: t, weapon: w.id, focus: fo ? f.focus.n : 0 });
    for (const [i, share] of attackTargets(f, t)) dealTo(f, i, w.dmg * h.mods.dmg * (1 + bDmg) * share * (fo ? 1 + fo.per * f.focus.n : 1), i !== t, ev);
    if (settle(f, ev)) return ev;
  }

  // allies swing at the front enemy (or all of them, for area allies)
  for (const a of f.allies) {
    if (!a.alive || f.done) continue;
    a.atkCd -= dt;
    while (a.atkCd <= 0 && a.alive && !f.done) {
      a.atkCd += 1 / a.u.aps;
      const order = formation(f);
      if (!order.length) break;
      const targets = a.u.area ? order : [inReach(f)[0]];
      ev.push({ type: 'allyAttack', ally: a.k, target: targets[0] });
      for (const t of targets) {
        const d = dealTo(f, t, a.u.dmg, a.u.area, ev, a.src);
        if (d && a.u.healHero && h.hp > 0) { const x = d * a.u.healHero; h.hp = Math.min(h.maxHp, h.hp + x); ev.push({ type: 'heal', target: 'hero', amount: x }); }
      }
      if (settle(f, ev)) return ev;
    }
  }

  const rage = f.t > SUDDEN_DEATH ? 1 + (f.t - SUDDEN_DEATH) / 5 : 1;
  for (let i = 0; i < E.length && !f.done; i++) {
    const e = E[i];
    if (!e.alive) continue;
    if (e.woundT > 0) e.woundT -= dt;
    if (e.burnT > 0) { e.burnT -= dt; burnTick(f, i, e, dt, ev); if (!e.alive || f.done) continue; }
    if (e.chillT > 0 && (e.chillT -= dt) <= 0) e.chillN = 0;
    const edt = dt * (e.chillT > 0 ? 1 - e.chill : 1);           // a chilled enemy does everything slower
    if (e.shrinkT > 0) e.shrinkT -= dt;
    if (e.stunImmune > 0) e.stunImmune -= dt;
    enchantTick(f, i, e, dt, ev);
    if (f.done) break;
    if (e.traits.regen && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.traits.regen * e.maxHp * dt * healShare(e));
    if (e.dodgeT > 0) e.dodgeT -= dt;
    if (e.stunT > 0 || e.toadT > 0) { e.stunT -= dt; e.toadT -= dt; continue; }       // stunned or a toad: does nothing
    if (e.windup) {
      if (e.frozenT > 0) { e.frozenT -= dt; continue; }           // a frozen wind-up waits
      if ((e.windup.left -= edt) <= 0) { const m = e.windup.move; e.windup = null; resolveMove(f, i, m, rage, ev); }
      continue;
    }
    if (e.burst) {
      if ((e.burst.next -= edt) <= 0) {
        e.burst.next = 0.16;
        if (--e.burst.left <= 0) { const p = e.burst.power; e.burst = null; hitHero(f, i, e.def.atk * e.atkMult * p * rage, false, ev); }
        else hitHero(f, i, e.def.atk * e.atkMult * e.burst.power * rage, false, ev);
      }
      continue;
    }
    let acted = false;
    for (const m of e.moves) {
      if ((m.cd -= edt) > 0 || acted) continue;
      if (!moveReady(f, e, m)) { m.cd = 0.5; continue; }
      m.cd = m.every; acted = true;
      if (m.windup) { e.windup = { move: m, left: m.windup, total: m.windup }; e.windupHits = 0; ev.push({ type: 'windup', src: i, move: m.kind, time: m.windup }); }
      else resolveMove(f, i, m, rage, ev);
    }
    if (acted || f.done) continue;
    if (e.def.atk > 0 && (e.atkCd -= edt) <= 0) {
      e.atkCd += e.def.interval;
      hitHero(f, i, e.def.atk * e.atkMult * rage, false, ev, true);
    }
  }
  settle(f, ev);
  if (!f.done && f.t >= TIME_LIMIT) { h.hp = 0; f.done = true; f.cause = 'ran out of time'; ev.push({ type: 'end', won: false }); }
  return ev;
}

// Enchantments that run on a clock: growing armour, melting armour, a second wind, sunburn.
function enchantTick(f, i, e, dt, ev) {
  const hk = e.def.hooks;
  if (!hk) return;
  if (hk.grow && e.grown < hk.grow.max && (e.growT -= dt) <= 0) {
    e.growT += hk.grow.every; const a = Math.min(hk.grow.amount, hk.grow.max - e.grown);
    e.grown += a; e.traits.armour = (e.traits.armour || 0) + a; ev.push({ type: 'ench', target: i, say: '+ARMOUR' });
  }
  if (hk.melt && e.melt > 0 && (e.meltT -= dt) <= 0) { e.meltT += hk.melt.every; meltOne(e); }
  if (hk.lowRage && !e.raged && e.hp < hk.lowRage.at * e.maxHp && !(e.woundT > 0)) { e.raged = true; e.atkMult *= hk.lowRage.atk; ev.push({ type: 'enrage', target: i }); }
  if (e.coolT > 0) e.coolT -= dt;
  if (hk.burn && e.hp > hk.burn.above * e.maxHp && f.hero.hp > 1 && !(e.coolT > 0)) f.hero.hp = Math.max(1, f.hero.hp - hk.burn.dps * dt);   // sunburn never finishes you
  if (e.tideT > 0) e.tideT -= dt;
  else if (hk.tide && !(e.woundT > 0) && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + hk.tide.regen * e.maxHp * dt);
}
function meltOne(e) { if (e.melt > 0) { e.melt--; e.traits.armour = Math.max(0, (e.traits.armour || 0) - 1); } }

// The fight ends when the hero drops or every enemy is down. Returns true once it's over.
function settle(f, ev) {
  if (f.done) return true;
  if (f.enemies.every(e => !e.alive)) { f.done = f.won = true; ev.push({ type: 'end', won: true }); return true; }
  return false;
}

// Allies ------------------------------------------------------------------------------------
// star: the ally comes from an upgraded card, so it gets the card's star boost on HP and damage.
function addAlly(f, key, ev, star) {
  let u = f.hero.cards && f.hero.cards.units[key];
  if (!u || f.allies.filter(a => a.alive).length >= MAX_ALLIES) return;
  if (star) { const S = f.hero.cards.star || 1; u = { ...u, hp: Math.round(u.hp * S), dmg: Math.round(u.dmg * S * 10) / 10 }; }
  const a = { k: f.allies.length, u, hp: u.hp, maxHp: u.hp, alive: true, atkCd: 0.5 + 0.13 * f.allies.length,
    src: { id: 'ally', type: u.type, acc: u.acc || 1, perks: {} } };
  f.allies.push(a);
  ev.push({ type: 'allySpawn', ally: a.k });
}
// Which of the hero's side an enemy's basic attack lands on: null is the hero (weight HERO_AGGRO),
// allies weigh 1 (or their taunt). Slams and volleys always go for the hero.
const HERO_AGGRO = 6;
function pickVictim(f) {
  const alive = f.allies.filter(a => a.alive);
  if (!alive.length) return null;
  let x = f.rng() * (HERO_AGGRO + alive.reduce((s, a) => s + (a.u.taunt || 1), 0)) - HERO_AGGRO;
  if (x < 0) return null;
  for (const a of alive) if ((x -= a.u.taunt || 1) < 0) return a;
  return alive[alive.length - 1];
}
function hurtAlly(f, i, a, raw, ev) {
  let dmg = raw;
  if (a.u.armour) dmg = Math.max(dmg * 0.2, dmg - a.u.armour);
  a.hp -= dmg;
  ev.push({ type: 'allyHurt', ally: a.k, src: i, dmg });
  if (a.hp <= 0) { a.alive = false; ev.push({ type: 'allyDeath', ally: a.k }); fire(f, 'allyDeath', { unit: a.u.key }, ev); }
}

// Card triggers -----------------------------------------------------------------------------
function fire(f, on, ctx, ev) { for (const t of f.trig) if (t.on === on) fireOne(f, t, ctx, ev); }
function fireOne(f, t, ctx, ev) {
  if (f.done || (t.once && t.fired) || t.cdLeft > 0) return;
  if (t.on === 'low' && !(ctx.frac < t.below)) return;
  if (t.on === 'allyDeath' && t.unit && ctx.unit !== t.unit) return;
  if (t.chance && f.rng() >= t.chance) return;
  const C = f.hero.cards;
  t.fired = true; t.cdLeft = (t.cd || 0) * C.trigCd;
  const times = 1 + (t.echo ? C.echo : 0);
  ev.push({ type: 'card', id: t.id, name: t.name, times });
  for (let n = 0; n < times; n++) for (const d of t.do) cardEffect(f, d, ctx, ev);
}
function cardEffect(f, d, ctx, ev) {
  const h = f.hero;
  if (d.kind === 'zap') {
    const order = formation(f);
    let targets = [];
    if (d.to === 'all') targets = order;
    else if (d.to === 'attacker') targets = ctx.src != null && f.enemies[ctx.src].alive ? [ctx.src] : [];
    else if (d.to === 'random') for (let n = 0; n < (d.n || 1) && order.length; n++) targets.push(order[Math.floor(f.rng() * order.length)]);
    else targets = ctx.target != null && f.enemies[ctx.target].alive ? [ctx.target] : order.slice(0, 1);
    // d.share: an echo of your own weapon (its type, that share of its damage); otherwise card damage
    const type = d.share ? h.weapon.type : d.type, dmg = d.share ? h.weapon.dmg * h.mods.dmg * d.share : d.dmg * (f.hero.cards.zapDmg || 1);
    const src = { id: 'card', type, acc: 1, perks: {} };
    for (const i of targets) { ev.push({ type: 'zap', target: i, dtype: type }); dealTo(f, i, dmg, false, ev, src); }
  } else if (d.kind === 'heal') {
    const x = d.amount || (d.share || 0) * h.maxHp;
    if (h.hp > 0) { h.hp = Math.min(h.maxHp, h.hp + x); ev.push({ type: 'heal', target: 'hero', amount: x }); }
  } else if (d.kind === 'shield') { h.shieldHp += d.amount || (d.share || 0) * h.maxHp; ev.push({ type: 'heroShield' }); }
  else if (d.kind === 'summon') for (let n = 0; n < (d.count || 1); n++) addAlly(f, d.unit, ev, d.star);
  else if (d.kind === 'buff') f.buffs.push({ aps: d.aps || 0, dmg: d.dmg || 0, crit: d.crit || 0, left: d.time || 3 });
  else if (d.kind === 'chill') {          // pushes enemies' next basic attack back
    const list = d.to === 'attacker' ? (ctx.src != null ? [ctx.src] : []) : formation(f);
    for (const i of list) if (f.enemies[i].alive) { f.enemies[i].atkCd += d.time; ev.push({ type: 'ench', target: i, say: 'CHILLED' }); }
  } else if (d.kind === 'sunder') {       // knocks armour off the target for the rest of the fight
    const i = ctx.target != null ? ctx.target : formation(f)[0], e = i != null && f.enemies[i];
    if (e && e.alive && e.traits.armour > 0) e.traits.armour = Math.max(0, e.traits.armour - d.amount);
  }
  else if (d.kind === 'gold') { f.gold += d.amount; ev.push({ type: 'gold', amount: d.amount }); }
}

function moveReady(f, e, m) {
  if (m.kind === 'summon') return f.enemies.filter(x => x.alive).length < MAX_ENEMIES;
  if (m.kind === 'heal') return e.hp < e.maxHp * 0.8;
  if (m.kind === 'shield') return e.shield <= 0;
  return true;
}

// Sword cuts leave a wound: for a few seconds the enemy's regeneration and self-heals are cut.
const WOUND_TIME = 4;
const healShare = e => e.burnT > 0 ? 0 : e.woundT > 0 ? 1 - e.wound : 1;     // burning stops healing entirely

// The Flamethrower's burn: damage every tick that ignores armour (fire weakness and resistance still
// count; a shield soaks it first). A kill by burning counts as the hero's.
function burnTick(f, i, e, dt, ev) {
  let d = e.burnDps * dt * (e.weak.fire || 1) * (e.resist.fire || 1);
  if (e.shield > 0) { const a = Math.min(e.shield, d); e.shield -= a; d -= a; }
  d = Math.min(e.hp, d);
  if (d <= 0) return;
  e.hp -= d; f.dealt += d; e.burnShown = (e.burnShown || 0) + d;
  if (e.burnShown >= 1) { ev.push({ type: 'burn', target: i, dmg: e.burnShown }); e.burnShown = 0; }
  if (e.hp <= 0) killEnemy(f, i, ev);
}

// m.spawn is an enemy definition (zones.js resolves the id when it loads).
function resolveMove(f, i, m, rage, ev) {
  const e = f.enemies[i];
  e.frozenTotal = 0;
  if (m.kind === 'slam') hitHero(f, i, e.def.atk * e.atkMult * (m.power || 3) * rage, true, ev);
  else if (m.kind === 'volley') { e.burst = { left: m.hits || 4, power: m.power || 0.6, next: 0 }; ev.push({ type: 'volley', src: i }); }
  else if (m.kind === 'summon') {
    for (let k = 0; k < (m.count || 1) && f.enemies.filter(x => x.alive).length < MAX_ENEMIES; k++) {
      f.enemies.push(spawnEnemy(m.spawn));
      ev.push({ type: 'spawn', target: f.enemies.length - 1, src: i });
    }
  } else if (m.kind === 'shield') { e.shield = (m.amount || 0.2) * e.maxHp; ev.push({ type: 'shield', target: i }); }
  else if (m.kind === 'heal') { const a = (m.amount || 0.2) * e.maxHp * healShare(e); e.hp = Math.min(e.maxHp, e.hp + a); ev.push({ type: 'heal', target: i, amount: a, burnt: a === 0 }); }
  else if (m.kind === 'dodge') { e.dodgeT = m.time || 3; ev.push({ type: 'stance', target: i }); }
  else if (m.kind === 'enrage') { e.atkMult *= m.power || 1.5; ev.push({ type: 'enrage', target: i }); }
}

// One hit (or a splash/cleave share of one) from the hero on enemy i, through every defence in order:
// dodge, weakness/resistance, item bonuses, flying, crit, shield, armour.
// src: what the hit comes from when it isn't the hero's weapon (a card zap or an ally): { id, type, acc }.
// Only the weapon gets item bonuses, crits, lifesteal and on-hit triggers. Returns the damage dealt.
function dealTo(f, i, raw, minor, ev, src) {
  const h = f.hero, w = src || h.weapon, e = f.enemies[i], R = f.rng, perks = w.perks || {}, own = !src;
  if (!e.alive) return 0;
  const evade = ((e.traits.evasive || 0) + (e.dodgeT > 0 ? 0.5 : 0)) * (perks.hitsFlyers && e.traits.flying ? 0.5 : 1);
  if (evade && R() < Math.min(0.9, evade * w.acc)) { ev.push({ type: 'miss', target: i, weapon: w.id, minor }); return 0; }
  if (e.traits.flying && perks.flyMiss && R() < perks.flyMiss) {      // a rocket that misses a flyer can still clip it
    if (!perks.nearMiss) { ev.push({ type: 'miss', target: i, weapon: w.id, minor }); return 0; }
    raw *= perks.nearMiss; minor = true;
  }
  let dmg = raw * (e.weak[w.type] || 1) * (e.resist[w.type] || 1);
  if (own) for (const k in h.mods.vs) if (k === 'group' ? f.enemies.filter(x => x.alive).length > 1 : e.traits[k]) dmg *= 1 + h.mods.vs[k];
  const hk = e.def.hooks || {};
  if (hk.guarded && f.enemies.some(x => x.alive && x.def.guard)) dmg *= 1 - hk.guarded;      // a bodyguard is still standing
  if (e.traits.flying && (w.type === 'slash' || w.type === 'blunt') && !perks.hitsFlyers) dmg *= 0.5;
  const crit = own && (h.mods.alwaysCrit || R() < h.crit + (f.bCrit || 0));
  if (crit) dmg *= h.critx;
  let shieldDmg = 0;
  if (e.shield > 0) {
    const m = w.type === 'magic' || w.type === 'sonic' ? 2 : 1, absorb = Math.min(e.shield, dmg * m);
    e.shield -= absorb; shieldDmg = absorb; dmg -= absorb / m;
  }
  // per-weapon answers to armour: the wand ignores it, the guitar rattles through most of a big body's
  // armour, the Uzi keeps a bigger share of each bullet and wears it down, sword cuts crack it a little
  const armour = perks.ignoreArmour ? 0 : Math.max(0, (e.traits.armour || 0) * (1 - (perks.resonate && e.def.size === 'big' ? perks.resonate : 0)) - h.mods.pierce);
  if (dmg > 0 && armour) dmg = Math.max(dmg * (perks.chip || ARMOUR_FLOOR), dmg - armour);
  if (perks.sunder && e.traits.armour > 0 && !minor) e.traits.armour = Math.max(0, e.traits.armour - perks.sunder);
  dmg = Math.min(e.hp, dmg);
  e.hp -= dmg; f.dealt += dmg;
  if (w.type === 'magic') e.magicTaken += dmg + shieldDmg;
  if (!minor) {      // enchantment counters: blunt cracks grown armour, explosive and magic melt gelato armour
    if (hk.grow && e.grown > 0 && w.type === hk.grow.crack) { const c = Math.min(e.grown, hk.grow.per); e.grown -= c; e.traits.armour = Math.max(0, e.traits.armour - c); }
    if (hk.melt && hk.melt.faster.includes(w.type)) meltOne(e);
    if (hk.tide && w.type === hk.tide.by) e.tideT = hk.tide.pause;
    if (hk.burn && hk.burn.by.includes(w.type)) e.coolT = hk.burn.cool;
  }
  if (hk.reflect && own && h.hp > 1 && (!hk.reflect.type || hk.reflect.type === w.type)) {     // reflections never finish you
    const r = hk.reflect.flat || (dmg + shieldDmg) * hk.reflect.share;
    if (r > 0) { h.hp = Math.max(1, h.hp - r); ev.push({ type: 'reflect', target: i, dmg: r }); }
  }
  if (perks.wound && dmg > 0 && (!perks.bigOnly || e.def.size === 'big')) { e.woundT = WOUND_TIME; e.wound = perks.wound; }
  if (perks.burn) { if (!(e.burnT > 0)) ev.push({ type: 'ignite', target: i }); e.burnT = perks.burn.time; e.burnDps = perks.burn.dps * h.mods.dmg; }
  if (perks.chill && !minor) {
    e.chillN = Math.min(perks.chill.stacks || 1, (e.chillN || 0) + 1); e.chillT = perks.chill.time; e.chill = perks.chill.slow * e.chillN;
    ev.push({ type: 'chill', target: i, stacks: e.chillN });
  }
  if (perks.stun && !minor && e.hp > 0 && !(e.stunImmune > 0) && R() < perks.stun.chance * (e.def.boss ? 0.5 : 1)) {
    e.stunT = perks.stun.time; e.stunImmune = perks.stun.time + perks.stun.immune; ev.push({ type: 'stun', target: i });
  }
  if (perks.spell && own && !minor && e.hp > 0) castSpell(f, i, perks.spell, raw, ev);
  if (perks.freeze && e.windup && !minor && !e.windup.move.unstoppable && (e.frozenTotal || 0) < e.windup.total * 2) {
    e.frozenT = Math.max(e.frozenT || 0, perks.freeze); e.frozenTotal = (e.frozenTotal || 0) + perks.freeze; ev.push({ type: 'freeze', target: i });
  }
  ev.push({ type: 'hit', target: i, dmg, shieldDmg, crit, weapon: w.id, minor, blocked: armour > 0 });
  const heal = (dmg + shieldDmg) * (perks.heal || 0) + (own ? dmg * h.mods.lifesteal : 0);
  if (heal > 0 && h.hp > 0) { h.hp = Math.min(h.maxHp, h.hp + heal); ev.push({ type: 'heal', target: 'hero', amount: heal }); }
  if (e.windup && perks.interrupt && !minor && !e.windup.move.unstoppable && ++e.windupHits >= perks.interrupt) {
    e.windup = null; ev.push({ type: 'interrupt', target: i });
    if (hk.hype && !e.hypeOff) { e.hypeOff = true; e.atkMult /= hk.hype; ev.push({ type: 'ench', target: i, say: 'BEAT DROPPED' }); }
  }
  if (own && !minor) { fire(f, 'hit', { target: i }, ev); if (crit) fire(f, 'crit', { target: i }, ev); }
  if (e.hp <= 0) { if (e.alive) killEnemy(f, i, ev); return dmg; }
  const ph = e.def.phases && e.def.phases[e.phase];     // phases trigger at HP thresholds, once each
  if (ph && e.hp <= ph.at * e.maxHp) {
    e.phase++;
    const a = ph.add || {};
    Object.assign(e.traits, a.traits); Object.assign(e.weak, a.weak); Object.assign(e.resist, a.resist);
    if (a.moves) for (const m of a.moves) e.moves.push({ ...m, cd: m.first != null ? m.first : m.every });
    if (a.atk) e.atkMult *= a.atk;
    if (a.traits && a.traits.shield) e.shield = a.traits.shield * e.maxHp;
    ev.push({ type: 'phase', target: i, say: ph.say });
  }
  return dmg;
}
// The wand's chance of a spell falls with the target's HP and halves again on a boss.
function castSpell(f, i, spell, raw, ev) {
  const e = f.enemies[i], R = f.rng, p = spell.chance * Math.max(0.15, Math.min(1, 100 / e.maxHp)) * (e.def.boss ? 0.5 : 1);
  if (R() >= p) return;
  let x = R() * Object.values(SPELLS).reduce((s, sp) => s + sp.weight, 0), kind = 'chain';
  for (const k in SPELLS) if ((x -= SPELLS[k].weight) < 0) { kind = k; break; }
  if (kind === 'toad') { e.toadT = SPELLS.toad.time; e.windup = null; e.burst = null; }
  else if (kind === 'shrink') e.shrinkT = SPELLS.shrink.time;
  ev.push({ type: 'spell', target: i, kind });
  if (kind === 'chain') { const others = formation(f).filter(j => j !== i); if (others.length) dealTo(f, others[Math.floor(R() * others.length)], raw * SPELLS.chain.share, true, ev); }
}
function killEnemy(f, i, ev) {
  const e = f.enemies[i], en = e.def.hooks && e.def.hooks.encore;
  if (en && !e.encored) {          // Pianissimo's Encore: back up once, unless magic burned it away
    e.encored = true;
    if (e.magicTaken < en.burnAt * e.maxHp) { e.hp = en.at * e.maxHp; e.windup = null; e.burst = null; ev.push({ type: 'phase', target: i, say: 'ENCORE!' }); return; }
    ev.push({ type: 'ench', target: i, say: 'ENCORE BURNED' });
  }
  e.alive = false; e.windup = null; e.burst = null; ev.push({ type: 'kill', target: i });
  fire(f, 'kill', { target: i }, ev);
}

// canAlly: a basic attack, which may land on an ally instead.
function hitHero(f, i, raw, heavy, ev, canAlly) {
  const h = f.hero, e = f.enemies[i];
  if (e.shrinkT > 0) raw *= SPELLS.shrink.dmg;
  if (canAlly && f.allies.length) { const a = pickVictim(f); if (a) { hurtAlly(f, i, a, raw, ev); return; } }
  if (f.rng() < h.dodge) { ev.push({ type: 'dodge', src: i, heavy }); fire(f, 'dodge', { src: i }, ev); return; }
  let dmg = raw * h.mods.taken;
  if (h.shieldHp > 0) { const a = Math.min(h.shieldHp, dmg); h.shieldHp -= a; dmg -= a; }
  h.hp -= dmg;
  f.low = Math.min(f.low, h.hp / h.maxHp);
  ev.push({ type: 'hurt', src: i, dmg, heavy });
  if (h.mods.thorns && e.alive) {
    const t = Math.min(e.hp, h.mods.thorns); e.hp -= t;
    if (e.hp <= 0) killEnemy(f, i, ev);
  }
  if (h.hp > 0 && dmg > 0) { fire(f, 'hurt', { src: i }, ev); fire(f, 'low', { frac: h.hp / h.maxHp }, ev); }
  if (h.hp <= 0) { h.hp = 0; f.done = true; f.cause = (heavy ? 'flattened by ' : 'beaten by ') + e.def.name; ev.push({ type: 'end', won: false }); }
  else settle(f, ev);
}

// A rough score for how well the hero's weapon handles these enemies, worked out only from what the
// pre-fight screen shows (traits, weaknesses, moves). Higher is better. balance.js's bot uses it to
// play the way an attentive player would; the game never shows it.
function weaponFit(hero, defs) {
  const w = hero.weapon, m = hero.mods, perks = w.perks || {}, n = defs.length;
  const times = defs.map(d => {
    const t = d.traits || {};
    let hit = w.dmg * m.dmg * ((d.weak || {})[w.type] || 1) * ((d.resist || {})[w.type] || 1) * (1 + Math.min(1, hero.crit) * (hero.critx - 1));
    for (const k in m.vs) if (k === 'group' ? n > 1 : t[k]) hit *= 1 + m.vs[k];
    if (t.flying && (w.type === 'slash' || w.type === 'blunt')) hit *= 0.5;
    const armour = perks.ignoreArmour ? 0 : Math.max(0, (t.armour || 0) * (perks.resonate && d.size === 'big' ? 1 - perks.resonate : 1) - m.pierce);
    hit = Math.max(hit * (perks.chip || ARMOUR_FLOOR), hit - armour);
    if (perks.focus) hit *= 1 + perks.focus.per * Math.min(perks.focus.max, Math.max(0, (d.hp / Math.max(1, hit) - 1) / 2));   // focus builds over a long fight
    if (t.flying && (w.type === 'slash' || w.type === 'blunt') && perks.hitsFlyers) hit *= 2;
    let land = 1 - Math.min(0.9, (t.evasive || 0) * w.acc * (perks.hitsFlyers && t.flying ? 0.5 : 1));
    if (t.flying && perks.flyMiss) land *= 1 - perks.flyMiss * (1 - (perks.nearMiss || 0));
    const shieldHp = (t.shield || 0) * d.hp * (w.type === 'magic' || w.type === 'sonic' ? 0.5 : 1);
    const burn = perks.burn ? perks.burn.dps * m.dmg * ((d.weak || {}).fire || 1) * ((d.resist || {}).fire || 1) : 0;
    const dps = hit * land * w.aps * m.aps + burn;
    let time = (d.hp + shieldHp) / dps;
    const heals = (t.regen || 0) + ((d.moves || []).some(mv => mv.kind === 'heal') ? 0.012 : 0);
    if (!perks.burn) time += time * heals * d.hp / Math.max(1, dps);      // regeneration and heals eat into slow damage; burning stops them
    if (t.backline && n > 1 && !perks.reach && !perks.snipe && w.shape !== 'area' && w.shape !== 'blast' && w.shape !== 'splash' && !m.allHit) time *= 1.6;   // can't reach it until the front falls
    if (perks.chill && ((d.moves || []).some(mv => mv.windup) || d.atk / d.interval > 4)) time *= 0.8;          // slowed and frozen, it hurts less
    if ((d.moves || []).some(mv => mv.kind === 'summon') && w.shape !== 'area' && w.shape !== 'blast' && w.shape !== 'splash') time *= 1.3;
    if (perks.interrupt && (d.moves || []).some(mv => mv.windup)) time *= 0.85;
    if (perks.stun) time *= 0.93;
    if (perks.spell && !d.boss) time *= 1 - 0.12 * Math.min(1, 100 / d.hp);
    return time;
  });
  const sum = times.reduce((a, b) => a + b, 0);
  let total;
  if (m.allHit || w.shape === 'area' || w.shape === 'blast') total = Math.max(...times);
  else if (w.shape === 'splash') total = sum / (1 + perks.splash * (n - 1));
  else if (w.shape === 'cleave') total = sum / Math.min(n, 2 + m.cleave);
  else if (w.shape === 'boomerang') total = sum / Math.min(n, 2);
  else total = sum;
  if (perks.heal) total *= 0.9;
  return 1 / total;
}

// Run a whole fight without drawing it (balance.js and the debug lab's quick sim).
function simulate(hero, defs, rng) {
  const f = newFight(hero, defs, rng);
  while (!f.done) step(f, 1 / 30);
  return f;
}

if (typeof module !== 'undefined') module.exports = { weaponHero, SPELLS, castSpell, HERO_TUNE, armourHp, heroShield, weaponsFor, makeRng, DAMAGE_TYPES, TRAITS, WEAPONS, weaponById, MAX_ENEMIES, MAX_ALLIES, BASE_HERO, SUDDEN_DEATH, pct, fmt, newMods, baseHero, newFight, formation, attackTargets, step, weaponFit, simulate };
