// Cards: a second loot type that sits on the card board beside your gear and shapes the auto-fight.
// Cards are data: a type, a rarity, one or two tags, readable text, an effect and (for pacts and every
// legendary) a drawback. applyCards() compiles a board into the hero a fight uses; the fight engine in
// rules.js runs the triggers and summons. Shared with run.js and balance.js.
//
// effect / drawback keys:
//   stats:   flat stat changes. Hero: maxHp armour dodge crit critx aps dmg regen shield lifesteal thorns
//            pierce, taken (+share of damage taken), delay (seconds before your first attack), maxHpMult.
//            Run: gold (+share), goldFight (flat per won fight), winHealMult, postHealShare.
//   perTag:  { tag, stats }: those stats once for every card on the board with that tag (this one too).
//   perCard: stats once for every card on the board.
//   trigger: { on, do, chance, cd, once, every, first, below, unit }. on: hit, crit, kill, hurt, low
//            (HP drops below `below`), every (N seconds), start, allyDeath. do: one effect or a list:
//            zap { dmg, type, to: target|all|random|attacker, n }, heal { amount | share },
//            shield { amount | share }, summon { unit, count }, buff { aps, dmg, time }, gold { amount }.
//   summon:  { unit, count }: allies from SUMMON_UNITS that join every fight.
//   multi:   echo (trigger cards fire this many extra times), summonHp, summonDmg, trigCd (cooldowns
//            and timers scale by this).
// Damage from cards and summons' HP and damage grow with the row you're on (CARD_RULES.rowScale).

const CARD_RULES = {
  startSlots: 3, maxSlots: 6,          // one more slot after each elite you beat
  rowScale: 0.08, summonRowScale: 0.05,
  sell: [4, 6, 10, 15, 25],            // gold for a card you replace, by rarity
  prices: [35, 60, 95, 150, 240],      // shop prices by rarity (the merchant adds its markup)
  offer: { fight: 0.3, elite: 0.5, treasure: 0.5 },   // chance that one of the three offers is a card
  maxAllies: 5,
};

const CARD_TAGS = {
  Gull: { color: '#e8eef2' }, Tide: { color: '#29a8ff' }, Spark: { color: '#ffe14d' },
  Gold: { color: '#ffb020' }, Brainrot: { color: '#ff2bd6' }, Concrete: { color: '#9aa3ad' },
};
const CARD_TYPES = {
  boost: { name: 'Boost', icon: 'cardBoost' }, pact: { name: 'Pact', icon: 'cardPact' }, trigger: { name: 'Trigger', icon: 'cardTrigger' },
  summon: { name: 'Summon', icon: 'cardSummon' }, multiplier: { name: 'Multiplier', icon: 'cardMulti' },
};
// Three cards that share a tag switch on that tag's set bonus.
const SET_BONUSES = {
  Gull: { text: 'Gull set: one more Union Gull joins every fight', effect: { summon: { unit: 'gull', count: 1 } } },
  Tide: { text: 'Tide set: heal 6% of max HP after every win', effect: { stats: { postHealShare: 0.06 } } },
  Spark: { text: 'Spark set: trigger cooldowns and timers 25% faster', effect: { multi: { trigCd: 0.75 } } },
  Gold: { text: 'Gold set: +25% gold', effect: { stats: { gold: 0.25 } } },
  Brainrot: { text: 'Brainrot set: +6% crit chance and +0.4× crit damage', effect: { stats: { crit: 0.06, critx: 0.4 } } },
  Concrete: { text: 'Concrete set: +1 armour and +10 max HP', effect: { stats: { armour: 1, maxHp: 10 } } },
};

// Allies that fight beside you. Enemies' basic attacks can hit them; taunt makes that likelier.
const SUMMON_UNITS = {
  gull: { name: 'Union Gull', art: 'seagull', hp: 4, dmg: 1, aps: 1.1, type: 'pierce', acc: 0.5 },
  crab: { name: 'Crab Intern', art: 'crab', hp: 8, dmg: 1.3, aps: 0.7, type: 'blunt', armour: 1, taunt: 1.2 },
  coconut: { name: 'Coconut Bro', art: 'coconut', hp: 6, dmg: 1.5, aps: 0.7, type: 'slash', healHero: 0.4 },
  jelly: { name: 'Backing Jelly', art: 'jelly', hp: 4, dmg: 0.5, aps: 0.7, type: 'sonic', area: true },
};

const CARDS = {
  // ---- Boosts: straight stat gains ----
  factor9000: { name: 'Factor 9000', rarity: 0, type: 'boost', tags: ['Tide'],
    text: 'Start every fight with an 8 HP shield.', effect: { stats: { shield: 8 } } },
  crabGym: { name: 'Crab Gym Membership', rarity: 0, type: 'boost', tags: ['Concrete'],
    text: '+9 max HP. The crabs spot you. Badly.', effect: { stats: { maxHp: 9 } } },
  cappuccino: { name: 'Cappuccino Assassino', rarity: 0, type: 'boost', tags: ['Brainrot'],
    text: '+8% attack speed. One espresso, zero hesitation.', effect: { stats: { aps: 0.08 } } },
  luckyLira: { name: 'Lucky Lira', rarity: 0, type: 'boost', tags: ['Gold'],
    text: '+8% crit chance and +15% gold.', effect: { stats: { crit: 0.08, gold: 0.15 } } },
  tungTempo: { name: 'Tung Tung Tempo', rarity: 1, type: 'boost', tags: ['Brainrot'],
    text: '+10% damage. Tung. Tung. Tung.', effect: { stats: { dmg: 0.1 } } },
  pyramid: { name: 'Pyramid Scheme', rarity: 1, type: 'boost', tags: ['Gold'],
    text: '+5 gold per won fight for every Gold card you own, this one included, and +5% crit chance.', effect: { stats: { crit: 0.05 }, perTag: { tag: 'Gold', stats: { goldFight: 5 } } } },
  concreteShoes: { name: 'Concrete Shoes', rarity: 2, type: 'boost', tags: ['Concrete'],
    text: '+8 max HP and +0.3 armour. You are not going anywhere.', effect: { stats: { armour: 0.3, maxHp: 8 } } },
  ballerina: { name: 'Ballerina Footwork', rarity: 2, type: 'boost', tags: ['Tide', 'Brainrot'],
    text: '+5% dodge and +5% attack speed. Cappuccina approves.', effect: { stats: { dodge: 0.05, aps: 0.05 } } },

  // ---- Pacts: a big upside with a drawback you can plan around ----
  gelato: { name: 'Gelato Brain Freeze', rarity: 1, type: 'pact', tags: ['Brainrot'],
    text: '+40% attack speed.', effect: { stats: { aps: 0.4 } },
    drawback: { text: 'You start attacking 2.5 seconds late in every fight.', stats: { delay: 2.5 } } },
  taxHaven: { name: 'Tax Haven', rarity: 1, type: 'pact', tags: ['Gold'],
    text: '+35% gold, +8 gold per won fight and +6% crit chance.', effect: { stats: { gold: 0.35, goldFight: 8, crit: 0.06 } },
    drawback: { text: '-6 max HP.', stats: { maxHp: -6 } } },
  sharkLoan: { name: 'Shark Loan', rarity: 2, type: 'pact', tags: ['Tide'],
    text: '+30% damage.', effect: { stats: { dmg: 0.3 } },
    drawback: { text: 'You take 20% more damage. The shark collects.', stats: { taken: 0.2 } } },
  cementDiet: { name: 'Cement Mixer Diet', rarity: 2, type: 'pact', tags: ['Concrete'],
    text: '+1.5 armour and +8 max HP.', effect: { stats: { armour: 1.5, maxHp: 8 } },
    drawback: { text: '-25% attack speed.', stats: { aps: -0.25 } } },
  sugarRush: { name: 'Banana Sugar Rush', rarity: 3, type: 'pact', tags: ['Brainrot'],
    text: '+10% damage and +6% attack speed.', effect: { stats: { dmg: 0.1, aps: 0.06 } },
    drawback: { text: 'You heal half as much after each win.', stats: { winHealMult: 0.5 } } },
  tralalaContract: { name: 'Tralala Contract', rarity: 4, type: 'pact', tags: ['Brainrot', 'Gold'],
    text: '+35% damage and +10% crit chance. Signed in sneaker.', effect: { stats: { dmg: 0.35, crit: 0.1 } },
    drawback: { text: '-30% max HP.', stats: { maxHpMult: 0.7 } } },

  // ---- Triggers: whenever X, do Y ----
  staticCling: { name: 'Static Cling', rarity: 0, type: 'trigger', tags: ['Spark'],
    text: 'On hit: 35% chance to zap the target for 5 sonic (every 1.5s at most).',
    effect: { trigger: { on: 'hit', chance: 0.35, cd: 1.5, do: { kind: 'zap', dmg: 5, type: 'sonic', to: 'target' } } } },
  critConfetti: { name: 'Crit Confetti', rarity: 0, type: 'trigger', tags: ['Brainrot'],
    text: 'On crit: heal 3 HP.', effect: { trigger: { on: 'crit', cd: 0.3, do: { kind: 'heal', amount: 3 } } } },
  bounty: { name: 'Bounty Hunter', rarity: 0, type: 'trigger', tags: ['Gold'],
    text: 'On kill: gain 2 gold and heal 2 HP.', effect: { trigger: { on: 'kill', do: [{ kind: 'gold', amount: 2 }, { kind: 'heal', amount: 2 }] } } },
  whistle: { name: 'Seagull Whistle', rarity: 0, type: 'trigger', tags: ['Gull'],
    text: 'Every 16s (first at 8s): a Union Gull joins the fight.',
    effect: { trigger: { on: 'every', every: 16, first: 8, do: { kind: 'summon', unit: 'gull', count: 1 } } } },
  coconutInsurance: { name: 'Coconut Insurance', rarity: 1, type: 'trigger', tags: ['Tide'],
    text: 'The first time you drop below 25% HP in a fight, gain a shield of 12% of max HP.',
    effect: { trigger: { on: 'low', below: 0.25, once: true, do: { kind: 'shield', share: 0.12 } } } },
  thunderClap: { name: 'Thunder Clapback', rarity: 1, type: 'trigger', tags: ['Spark'],
    text: 'Every 6s: 5 magic damage to every enemy.', effect: { trigger: { on: 'every', every: 6, do: { kind: 'zap', dmg: 5, type: 'magic', to: 'all' } } } },
  spiteMortar: { name: 'Spite Mortar', rarity: 1, type: 'trigger', tags: ['Concrete'],
    text: 'When hit: 20% chance to lob 10 explosive back at the attacker (every 3s at most).',
    effect: { trigger: { on: 'hurt', chance: 0.2, cd: 3, do: { kind: 'zap', dmg: 10, type: 'explosive', to: 'attacker' } } } },
  openingAct: { name: 'Opening Act', rarity: 2, type: 'trigger', tags: ['Spark'],
    text: 'At the start of each fight: 8 sonic to every enemy.',
    effect: { trigger: { on: 'start', do: { kind: 'zap', dmg: 8, type: 'sonic', to: 'all' } } } },
  lastLap: { name: 'Last Lap', rarity: 2, type: 'trigger', tags: ['Tide'],
    text: 'The first time you drop below 35% HP in a fight: +30% attack speed for the rest of it.',
    effect: { trigger: { on: 'low', below: 0.35, once: true, do: { kind: 'buff', aps: 0.3, time: 999 } } } },
  frenzy: { name: 'Brainrot Frenzy', rarity: 2, type: 'trigger', tags: ['Brainrot'],
    text: 'On kill: +30% damage for 4s.', effect: { trigger: { on: 'kill', do: { kind: 'buff', dmg: 0.3, time: 4 } } } },
  chainLightning: { name: 'Chain Lightning', rarity: 3, type: 'trigger', tags: ['Spark'],
    text: 'On hit: 30% chance to arc 6 magic into 2 random enemies (every 5s at most).',
    effect: { trigger: { on: 'hit', chance: 0.3, cd: 5, do: { kind: 'zap', dmg: 6, type: 'magic', to: 'random', n: 2 } } } },

  // ---- Summons: allies with their own HP, damage and sprite ----
  crabIntern: { name: 'Crab Intern', rarity: 0, type: 'summon', tags: ['Concrete'],
    text: 'A Crab Intern joins every fight: tough, armoured, and it draws fire.', effect: { summon: { unit: 'crab', count: 1 } } },
  unionRep: { name: 'Seagull Union Rep', rarity: 1, type: 'summon', tags: ['Gull', 'Gold'],
    text: 'A Union Gull joins every fight. Whenever a gull dies, gain 3 gold.',
    effect: { summon: { unit: 'gull', count: 1 }, trigger: { on: 'allyDeath', unit: 'gull', do: { kind: 'gold', amount: 3 } } } },
  coconutBro: { name: 'Coconut Bro', rarity: 2, type: 'summon', tags: ['Tide'],
    text: 'A Coconut Bro joins every fight. Its hits heal you for 60% of the damage.', effect: { summon: { unit: 'coconut', count: 1 } } },
  backingBand: { name: 'Jellyfish Backing Band', rarity: 3, type: 'summon', tags: ['Spark'],
    text: 'Two Backing Jellies join every fight, humming sonic damage into every enemy.', effect: { summon: { unit: 'jelly', count: 2 } } },
  uprising: { name: 'Gabbiano Uprising', rarity: 4, type: 'summon', tags: ['Gull'],
    text: 'Four Union Gulls join every fight. The beach belongs to the workers.', effect: { summon: { unit: 'gull', count: 4 } },
    drawback: { text: 'Your own weapon deals 15% less damage. You are management now.', stats: { dmg: -0.15 } } },

  // ---- Multipliers: make other cards better ----
  loadBearing: { name: 'Load-Bearing Wall', rarity: 1, type: 'multiplier', tags: ['Concrete'],
    text: '+3 max HP and +0.25 armour for every Concrete card you own, this one included.', effect: { perTag: { tag: 'Concrete', stats: { armour: 0.25, maxHp: 3 } } } },
  unionDues: { name: 'Union Dues', rarity: 2, type: 'multiplier', tags: ['Gull'],
    text: 'Your summons get +80% HP and +80% damage, and +6 max HP for you.', effect: { multi: { summonHp: 0.8, summonDmg: 0.8 }, stats: { maxHp: 6 } } },
  hypeMan: { name: 'Hype Man', rarity: 2, type: 'multiplier', tags: ['Brainrot'],
    text: '+4% damage for every card on your board, this one included.', effect: { perCard: { dmg: 0.04 } } },
  echoPedal: { name: 'Echo Pedal', rarity: 3, type: 'multiplier', tags: ['Spark'],
    text: 'Your Trigger cards fire twice. +5% damage.', effect: { multi: { echo: 1 }, stats: { dmg: 0.05 } } },
  hourglass: { name: "Lirilì's Hourglass", rarity: 4, type: 'multiplier', tags: ['Spark', 'Tide'],
    text: 'Trigger cooldowns and timers run twice as fast, and +15% attack speed.', effect: { multi: { trigCd: 0.5 }, stats: { aps: 0.15 } },
    drawback: { text: '-10% max HP. Time is heavy.', stats: { maxHpMult: 0.9 } } },
};
for (const id in CARDS) CARDS[id].id = id;

// What a card offer looks like next to items: { slot: 'card', id, rarity }.
const cardOffer = id => ({ slot: 'card', id, rarity: CARDS[id].rarity });

// A random card of a rolled rarity from a loot table (rarities with no cards fall back one tier).
function rollCard(rng, table, filter) {
  let r = rollRarity(rng, table);
  for (; r >= 0; r--) {
    const pool = Object.keys(CARDS).filter(id => CARDS[id].rarity === r && (!filter || filter(CARDS[id])));
    if (pool.length) return cardOffer(rng.pick(pool));
  }
  return cardOffer(rng.pick(Object.keys(CARDS)));
}

const MULT_STATS = ['maxHpMult', 'winHealMult'];
function addStats(into, st, times) {
  for (const k in st) {
    if (MULT_STATS.includes(k)) into[k] = (into[k] == null ? 1 : into[k]) * Math.pow(st[k], times);
    else into[k] = (into[k] || 0) + st[k] * times;
  }
}
function tagCounts(ids) {
  const n = {};
  for (const id of ids) for (const t of CARDS[id].tags) n[t] = (n[t] || 0) + 1;
  return n;
}
const activeSets = ids => Object.entries(tagCounts(ids)).filter(([, n]) => n >= 3).map(([t]) => t);

// Everything a board adds up to. row scales card damage and summons.
function cardTotals(ids, row) {
  ids = (ids || []).filter(id => CARDS[id]);
  const stats = { maxHpMult: 1, winHealMult: 1 }, tags = tagCounts(ids), multi = { echo: 0, summonHp: 0, summonDmg: 0, trigCd: 1 };
  const triggers = [], summons = [], k = 1 + CARD_RULES.rowScale * Math.max(0, row || 0);
  const sources = ids.map(id => [CARDS[id], CARDS[id].effect, CARDS[id].drawback])
    .concat(activeSets(ids).map(t => [{ id: 'set' + t, name: t + ' set', type: 'set' }, SET_BONUSES[t].effect, null]));
  for (const [c, fx, dr] of sources) {
    for (const part of [fx, dr]) {
      if (!part) continue;
      if (part.stats) addStats(stats, part.stats, 1);
      if (part.perTag) addStats(stats, part.perTag.stats, tags[part.perTag.tag] || 0);
      if (part.perCard) addStats(stats, part.perCard, ids.length);
      if (part.multi) for (const m in part.multi) multi[m] = m === 'trigCd' ? multi[m] * part.multi[m] : multi[m] + part.multi[m];
    }
    if (fx.summon) summons.push({ ...fx.summon, from: c.id });
    if (fx.trigger) {
      const t = fx.trigger, list = [].concat(t.do).map(d => d.kind === 'zap' ? { ...d, dmg: Math.round(d.dmg * k * 10) / 10 } : { ...d });
      triggers.push({ ...t, do: list, id: c.id, name: c.name, echo: c.type === 'trigger' });
    }
  }
  const units = {};
  for (const u in SUMMON_UNITS) {
    const d = SUMMON_UNITS[u];
    const ks = 1 + CARD_RULES.summonRowScale * Math.max(0, row || 0);
    units[u] = { ...d, key: u, hp: Math.round(d.hp * ks * (1 + multi.summonHp)), dmg: Math.round(d.dmg * ks * (1 + multi.summonDmg) * 10) / 10 };
  }
  return { stats, tags, sets: activeSets(ids), multi, triggers, summons, units };
}
// One run-level stat from the board (gold, goldFight, winHealMult, postHealShare).
function cardStat(ids, k) { const v = cardTotals(ids, 0).stats[k]; return v == null ? (MULT_STATS.includes(k) ? 1 : 0) : v; }

// Fold a board into a compiled hero (from compileHero or baseHero). ctx: { row, hp }.
function applyCards(hero, ids, ctx) {
  ctx = ctx || {};
  const T = cardTotals(ids, ctx.row), st = T.stats, m = hero.mods;
  hero.maxHp = Math.max(1, Math.round((hero.maxHp + (st.maxHp || 0)) * st.maxHpMult));
  hero.hp = Math.min(ctx.hp != null ? ctx.hp : hero.hp, hero.maxHp);
  if (!hero.armourLock) hero.armour += st.armour || 0;
  hero.dodge = Math.min(0.6, hero.dodge + (st.dodge || 0));
  hero.crit += st.crit || 0; hero.critx += st.critx || 0;
  hero.regen += st.regen || 0; hero.shield += st.shield || 0;
  m.aps = Math.max(0.3, m.aps + (st.aps || 0));
  m.dmg *= Math.max(0.2, 1 + (st.dmg || 0));
  m.lifesteal += st.lifesteal || 0; m.thorns += st.thorns || 0; m.pierce += st.pierce || 0;
  m.taken *= 1 + (st.taken || 0);
  hero.delay = (hero.delay || 0) + (st.delay || 0);
  hero.cards = { list: (ids || []).slice(), triggers: T.triggers, summons: T.summons, units: T.units, echo: T.multi.echo, trigCd: T.multi.trigCd };
  return hero;
}

// Readable lines: type and tags, the text, then the drawback.
function cardLines(id) {
  const c = CARDS[id], lines = [CARD_TYPES[c.type].name + ' · ' + c.tags.join(' / '), c.text];
  if (c.drawback) lines.push('★ ' + c.drawback.text);
  return lines;
}

// What a card will do in this particular fight, for the pre-fight screen. defs: the enemies.
function cardFightNote(id, defs, ids) {
  const c = CARDS[id], fx = c.effect, t = fx.trigger, notes = [];
  const typeNote = type => {
    const mults = defs.map(d => ((d.weak || {})[type] || 1) * ((d.resist || {})[type] || 1));
    const best = Math.max(...mults), worst = Math.min(...mults);
    if (worst < 1) return DAMAGE_TYPES[type].name.toLowerCase() + ' is resisted here (×' + worst + ')';
    if (best > 1) return DAMAGE_TYPES[type].name.toLowerCase() + ' hits a weakness here (×' + best + ')';
    return '';
  };
  if (t) for (const d of [].concat(t.do)) if (d.kind === 'zap') { const n = typeNote(d.type); if (n) notes.push(n); }
  if (t && t.on === 'kill') notes.push(defs.length + ' enem' + (defs.length > 1 ? 'ies' : 'y') + ' to start with' + (defs.some(d => (d.moves || []).some(m => m.kind === 'summon')) ? ', more on the way' : ''));
  if (fx.summon) {
    const u = SUMMON_UNITS[fx.summon.unit], n = typeNote(u.type);
    notes.push(fx.summon.count + '× ' + u.name + (n ? ', ' + n : ''));
  }
  if (t && t.on === 'every') notes.push('fires about ' + Math.max(1, Math.floor(45 / t.every)) + '× in a 45s fight');
  if (fx.multi && fx.multi.echo) notes.push((ids || []).filter(x => CARDS[x].type === 'trigger').length + ' trigger cards to echo');
  return notes.join('; ');
}

if (typeof module !== 'undefined') module.exports = { CARD_RULES, CARD_TAGS, CARD_TYPES, SET_BONUSES, SUMMON_UNITS, CARDS, cardOffer, rollCard, tagCounts, activeSets, cardTotals, cardStat, applyCards, cardLines, cardFightNote };
